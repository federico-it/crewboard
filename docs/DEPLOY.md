# Deploy dello spike su Coolify

Configurazione preparata il 31 agosto 2026. Questa guida non attesta un deploy pubblico o una prova nel browser della challenge. Lo spike contiene solo dati fittizi hardcoded: nessun database, login, storage o segreto applicativo.

## Env e servizi: cosa serve oggi

Per distribuire lo spike non collegare alcun database: non ci sono client DB, schema o migrazioni. Non serve un file `.env`; [.env.example](../.env.example) contiene chiarimenti ed esempi futuri tutti commentati, non configurazione già consumata dall'app.

L'MVP previsto è full-stack Next.js, con PostgreSQL/Drizzle e sessioni sul server. I file andranno su **Cloudflare R2**, non Hetzner Object Storage; Coolify/Hetzner resta l'hosting dell'app. Si possono predisporre PostgreSQL su rete privata e un bucket R2 privato, ma il collegamento effettivo arriverà con l'implementazione e la validazione delle variabili. Non usare `localhost` come host del DB dentro il container se PostgreSQL è un servizio separato.

Le future credenziali vanno inserite nelle variabili runtime di Coolify, mai nel Git, nei build args o con prefisso `NEXT_PUBLIC_`. I nomi in `.env.example` sono una proposta per l'integrazione futura; non dichiarano auth, DB o storage funzionanti.

## Container

Il Dockerfile usa Node 24 su Debian slim, pnpm 10.33.3 e il lockfile congelato. Next.js genera l'output `standalone`; l'immagine finale contiene il server, le dipendenze necessarie e gli asset, ed esegue `node server.js` come utente `node`, non root. Il contesto Docker include solo gli input di build elencati in `.dockerignore`.

La build richiede rete per registry npm, immagini Docker e i font Google usati da `next/font`. L'immagine base `node:24-bookworm-slim` è bloccata al digest nel Dockerfile, oltre alle dipendenze applicative nel lockfile. Aggiornare deliberatamente il digest per ricevere patch di sistema/Node e ripetere le prove. Conservare anche il digest dell'immagine distribuita per poter ripristinare la stessa versione.

Prova locale, con Docker avviato:

```sh
docker build --pull -t crewboard:spike .
docker run --rm -d --name crewboard-spike-check -p 127.0.0.1:3103:3000 crewboard:spike
curl --fail http://127.0.0.1:3103/healthz
docker inspect --format '{{.State.Health.Status}}' crewboard-spike-check
```

Attendere il primo controllo: stato atteso `healthy`, risposta HTTP 200 con `{"status":"ok"}`. Aprire lo spike su `http://127.0.0.1:3103/`, controllare anche `/overview` e `/about`. A fine prova:

```sh
docker stop crewboard-spike-check
```

`/healthz` controlla soltanto che il server risponda. Non verifica WebMCP, il browser o futuri servizi esterni.

## Configurazione Coolify

Prima della pubblicazione occorrono istanza Coolify, server di destinazione, repository/branch contenenti questi file e sottodominio scelto. Non inserire token o chiavi nella guida o nel repository.

1. Creare una risorsa Application dal repository. Usare GitHub App o deploy key se privato, senza renderlo pubblico per comodità.
2. Selezionare il build pack **Dockerfile** e il branch che contiene la configurazione verificata.
3. Impostare i valori seguenti; build e avvio sono già definiti nel Dockerfile.

| Campo | Valore |
| --- | --- |
| Base Directory / contesto | `/` (radice del repository) |
| Dockerfile Location | `/Dockerfile` |
| Docker target | Finale `runner` (oppure lasciare il default finale) |
| Ports Exposes / porta interna | `3000` |
| Port mapping verso host | Nessuno: usare il reverse proxy di Coolify |
| Dominio | URL `https://` del sottodominio scelto |
| Variabili applicative | Nessuna per lo spike |
| Volumi persistenti | Nessuno per lo spike |
| Pre/post deploy commands | Nessuno |

4. Usare il `HEALTHCHECK` del Dockerfile, che esegue Node e non richiede curl/wget nel container. Non sostituirlo con un controllo UI basato su comandi assenti nell'immagine. Verificare lo stato `healthy` nei dettagli del deployment.
5. Configurare il DNS del sottodominio verso il server e l'accesso alle porte 80/443 del reverse proxy. Usare un record AAAA solo se IPv6 è configurato. Verificare che Coolify emetta un certificato valido per il dominio HTTPS.
6. Non esporre pubblicamente la porta 3000 e non aggiungere database o credenziali prima che siano necessari. Tenere i deploy automatici disattivati durante la raccolta delle evidenze per evitare cambi di versione a metà prova.

Il container deve ascoltare su `0.0.0.0:3000`, non `127.0.0.1`. I valori `HOSTNAME` e `PORT` sono già nel Dockerfile: eventuali override in Coolify devono restare coerenti.

Riferimenti ufficiali: [Dockerfile build pack](https://coolify.io/docs/applications/build-packs/dockerfile), [health checks](https://coolify.io/docs/knowledge-base/health-checks), [Next.js standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

## Verifica sull'URL pubblico

Da una sessione pulita controllare certificato HTTPS, `/healthz`, `/`, caricamento JS/CSS, `/about` e `/overview`. Nessun login del provider deve impedire ai giudici l'accesso allo spike. Un HTTP 200 non dimostra che il tool funzioni.

Aprire lo spike nel documento principale, non in un iframe di anteprima. Non aggiungere header del proxy che disabilitino WebMCP (per esempio `Permissions-Policy: tools=()`) o CORS permissivi per tentare di abilitarlo.

Usare il browser integrato di ChatGPT oppure Chrome 149+ con `chrome://flags/#enable-webmcp-testing` abilitato e browser riavviato, come indicato dal [regolamento](https://webmcp.devpost.com/rules). In Chrome occorre anche un client agente/inspector capace di scoprire e invocare i tool: il flag da solo non crea una chat. Il pulsante manuale della pagina non è una prova WebMCP.

| Prova tramite agente/inspector | Esito atteso |
| --- | --- |
| Scoperta su `/` | Un solo `get_attendance_summary` |
| `{"month":"2026-08"}` | 4 record, 3 completi, 1410 minuti, 23.5 ore, incompleto il 26 agosto |
| Risultato nella pagina | Contatore WebMCP incrementato e stesso JSON |
| `{"month":"2026-09"}` | Zero record, nessuna assenza dedotta |
| `{"month":"2026-13"}` | Errore; nessun successo dichiarato |
| Navigazione a `/about` o `/overview` | Tool non più disponibile |
| Ritorno a `/` e reload | Un solo tool, nuovamente invocabile |
| Calculate manually | Stesso risultato, contatore WebMCP invariato |

## Evidenze da completare

- Commit distribuito: da registrare dopo commit/push.
- URL HTTPS: da assegnare e verificare.
- Digest immagine / identificativo deployment Coolify: da registrare.
- Browser, versione e configurazione WebMCP: da registrare sul deploy.
- Data, prompt, input, risultati e contatore UI: da registrare.
- Esito dei casi negativi e lifecycle: da registrare.

Aggiornare [SPIKE.md](SPIKE.md) e [TODO.md](../TODO.md) solo dopo le prove reali. Il primo deploy non è la candidatura finale; licenza, video, account demo e requisiti restanti rimangono separati. Per rollback riutilizzare un deployment/immagine precedente verificato e ripetere health check e chiamata WebMCP.
