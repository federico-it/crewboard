# Deploy Crewboard su Coolify

Aggiornato il 1 settembre 2026. Questa versione introduce presenze persistenti e login. **Non distribuire il nuovo runner con la vecchia configurazione dello spike senza env/database.** `/spike` rimane una demo hardcoded pubblica separata.

## Runtime richiesto

| Variabile | Uso |
| --- | --- |
| `DATABASE_URL` | Connessione PostgreSQL privata, con password forte e TLS verificato se richiesto dal provider |
| `BETTER_AUTH_URL` | Origine HTTPS canonica, ad esempio `https://crewboard.srvly.it`, senza path |
| `BETTER_AUTH_SECRET` | Segreto casuale stabile, almeno 32 caratteri; generare con `openssl rand -hex 32` |

Usare variabili **runtime**, mai build args o `NEXT_PUBLIC_`. `.env.example` è il riferimento; `.env` non entra nel contesto Docker. La build non richiede connessioni DB o segreti. Non disabilitare la verifica dei certificati del database.

Solo il comando di seed richiede `DEMO_SEED_ENABLED=true` e `DEMO_PASSWORD` (almeno 12 caratteri). Non servono al processo web; non esporli al browser. R2 rimane la scelta per i file futuri, ma non è ancora usato e non richiede variabili per questo deploy.

## Immagini e target

Il Dockerfile usa Node 24/Debian slim bloccato per digest, pnpm 10.33.3 e lockfile congelato. I target sono:

- `base`: runtime condiviso.
- `dependencies`: dipendenze con cache BuildKit dedicata a build fidate di Crewboard.
- `operations`: strumenti CLI, schema e migrazioni per operazioni esplicite sul DB.
- `builder`: lint, test unitari e build Next.js con controllo TypeScript.
- `runner` (finale/default): solo output standalone e asset, utente `node:node`, porta 3000, health check Node.

`operations` non viene copiato nel runner. Non vengono eseguite migrazioni, seed o installazioni ad ogni avvio del web server. La build scarica dipendenze e font Google: richiede rete. Conservare digest delle immagini e commit distribuito; aggiornare deliberatamente il digest Node per le patch.

```sh
docker build --pull -t crewboard:web .
docker build --target operations -t crewboard:operations .
```

## Ordine del primo deploy

1. Predisporre un PostgreSQL dedicato su rete privata accessibile dall'app. Nessuna porta DB pubblica. Non usare le credenziali o la porta host di `compose.yaml`: quel file serve solo allo sviluppo locale.
2. Costruire entrambi i target dal medesimo commit, configurando nella risorsa Coolify web il build pack **Dockerfile**, target finale `runner`, root `/`, Dockerfile `/Dockerfile`, porta interna `3000`, senza mapping pubblico diretto della 3000.
3. Impostare le tre variabili runtime. Abilitare HTTPS sul dominio canonico tramite proxy Coolify e DNS corretto. Il server deve ascoltare su `0.0.0.0:3000` (già nel Dockerfile).
4. Eseguire **una volta** le migrazioni con l'immagine `operations`, collegata alla stessa rete privata e al medesimo DB. Non eseguire migratori concorrenti.
5. Solo sul database sintetico, eseguire il seed con password demo scelta dall'operatore. Il seed non sovrascrive account, password o presenze esistenti.
6. Avviare/aggiornare il runner e verificare login, persistenza e tool prima di considerare concluso il deploy.

Esempio CLI sul server, sostituendo rete e file env protetti predisposti fuori dal repository:

```sh
docker run --rm --network RETE_PRIVATA --env-file /percorso/protetto/database.env crewboard:operations
docker run --rm --network RETE_PRIVATA --env-file /percorso/protetto/demo-seed.env crewboard:operations node --import tsx scripts/db.ts seed
```

`database.env` contiene `DATABASE_URL`; `demo-seed.env` aggiunge `DEMO_SEED_ENABLED=true` e `DEMO_PASSWORD`. Il nome della rete dipende dalla configurazione del server: non assumere che `crewboard_default`, usato localmente da Compose, esista su Coolify. Rimuovere i file temporanei con segreti secondo le procedure dell'operatore.

I tre account seed sono `alex@crewboard.example` (employee), `sam@crewboard.example` (manager) e `robin@crewboard.example` (employee, altra organizzazione); la password è quella configurata dall'operatore al primo seed. Sam può approvare le richieste del team su `/team/leave`; Robin serve ai controlli di isolamento. Non mettere credenziali nei log o nel repository.

## Health check e controllo pubblico

Usare il `HEALTHCHECK` già nel Dockerfile: esegue Node, non curl/wget. `/healthz` risponde `{"status":"ok"}` e verifica solo il processo web. Il verde non attesta DB, login, migrazioni o WebMCP.

Controllare da una sessione pulita:

- HTTPS valido, `/login` e asset disponibili; `/attendance` senza sessione deve mandare al login.
- Login Alex, lettura delle presenze persistenti (`source: database`).
- Correzione 26 agosto e nuova lettura dopo reload: 31.5 ore e quattro giorni completi.
- Logout e rifiuto del vecchio cookie; Sam/Robin non vedono i record di Alex.
- Tool scoperto e invocato davvero da un client WebMCP compatibile; contatore UI e JSON aggiornati. Le sole indicazioni “registered” o “healthy” non bastano.

Il browser integrato di Codex è stato verificato in precedenza sullo spike pubblico. La prova non si estende automaticamente a questo nuovo flusso. Il collegamento Chrome disponibile nella sessione permetteva la lettura DOM ma non l'invocazione WebMCP; in Chrome usare un inspector/client compatibile. Riferimenti: [Chrome WebMCP](https://developer.chrome.com/docs/ai/webmcp), [regolamento challenge](https://webmcp.devpost.com/rules).

Nessun iframe di anteprima o header `Permissions-Policy: tools=()` deve bloccare il tool. Non aggiungere CORS permissivi per aggirare problemi di integrazione. Condividere solo credenziali demo attraverso il canale previsto per i giudici.

## Operatività

Il deploy demo è a istanza singola: i limiti anti-abuso auth in memoria non sono condivisi tra repliche. Configurare `advanced.ipAddress` di Better Auth solo dopo aver identificato l'header IP e i proxy realmente fidati della rete Coolify; non fidarsi in modo globale di un `X-Forwarded-For` fornito dal client. Nessun volume applicativo è necessario; PostgreSQL deve avere volume persistente e backup. I file futuri risiederanno su Cloudflare R2 privato.

Tenere separati staging e versione consegnata. Prima di aggiornare il DB, revisionare le migrazioni e fare backup; un rollback dell'immagine non annulla automaticamente le migrazioni. Non cancellare i volumi per ripristinare la demo: il 26 agosto si può riportare incompleto dalla UI.

Riferimenti: [Coolify Dockerfile](https://coolify.io/docs/applications/build-packs/dockerfile), [health checks](https://coolify.io/docs/knowledge-base/health-checks), [Next.js standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
