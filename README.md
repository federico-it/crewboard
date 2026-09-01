# Crewboard

**Your workplace, agent-ready.**

Dashboard Next.js per presenze, ferie e documenti, utilizzabile da persone e agenti WebMCP.

## Stato attuale

Il primo flusso full-stack **presenze personali** è implementato: login con Better Auth, PostgreSQL/Drizzle, calendario, aggiunta/correzione dei record e `get_attendance_summary` sugli stessi dati server della UI. I route handler sono verificati in-process contro PostgreSQL; la prova UI/WebMCP nel browser resta aperta ed è tracciata in [ATTENDANCE.md](docs/ATTENDANCE.md).

| Route | Stato |
| --- | --- |
| `/` | Rimanda a `/attendance` |
| `/login` | Login email/password; solo account predisposti dall'operatore |
| `/attendance` | Presenze dell'utente autenticato, calendario e tool WebMCP persistente |
| `/spike` | Spike originale pubblico: fixture hardcoded, senza DB/auth |
| `/overview` | Mockup statico separato; non rappresenta funzionalità HR implementate |
| `/about` | Pagina senza tool per verificare il cleanup |
| `/healthz` | Liveness del server; non verifica database o WebMCP |

Ferie, approvazioni manager, PDF e Cloudflare R2 **non sono ancora implementati**. Il sito pubblico precedentemente verificato conteneva lo spike: nessun deploy del nuovo flusso è implicito in queste modifiche.

## Stack

- Next.js 16.3.3, React 19.2.8, TypeScript 5.9.3, Tailwind.
- Node >=24; pnpm 10.33.3 e un solo lockfile `pnpm-lock.yaml`.
- PostgreSQL, Drizzle ORM, Better Auth, Zod.
- WebMCP nativo con `document.modelContext.registerTool` e `webmcp-types`.
- Hosting previsto: Coolify/Hetzner. File futuri: **Cloudflare R2 privato**, tramite API S3.

Il browser non riceve credenziali DB o segreti di autenticazione. UI e tool raggiungono `/api/attendance`; il server verifica sessione e dipendente attivo a ogni richiesta. Il client non sceglie employee/user/organization ID. In questa fase ogni account accede solo alle proprie presenze, anche se appartiene alla stessa organizzazione di altri account demo.

## Avvio locale

Richiede Node >=24, pnpm e Docker avviato.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
openssl rand -hex 32
```

Inserire il valore generato in `BETTER_AUTH_SECRET`, scegliere `DEMO_PASSWORD` (almeno 12 caratteri) e abilitare `DEMO_SEED_ENABLED=true` **solo per il database sintetico**. Non sovrascrivere una `.env` esistente. `BETTER_AUTH_URL` deve corrispondere esattamente all'origine usata dal browser, ad esempio `http://127.0.0.1:3100`.

```sh
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev --hostname 127.0.0.1 --port 3100
```

Aprire [Crewboard locale](http://127.0.0.1:3100). Accedere con `alex@crewboard.example` e la password impostata nel seed. Il seed predispone anche `sam@crewboard.example` nella stessa organizzazione e `robin@crewboard.example` in un'altra, per verificare l'isolamento. Non stampa le password e non sovrascrive account o presenze esistenti.

PostgreSQL locale usa un volume dedicato e la sola porta loopback `54329`; i valori di Compose non vanno riutilizzati in produzione. Fermare il servizio con `docker compose stop db` conserva i dati. Non usare `down -v` se si desidera conservarli.

## Prova funzionale

1. Accedere come Alex: la fixture iniziale di agosto mostra **23h 30m**, 3 giorni completi e il 26 agosto incompleto.
2. Chiedere all'agente compatibile “Get my attendance summary for August 2026”: il risultato deve indicare `source: database` e il contatore deve aumentare.
3. Selezionare il 26 agosto, impostare fine `18:00` e salvare (inizio `09:00`, pausa 60 minuti).
4. UI, reload e nuova chiamata WebMCP devono mostrare **31h 30m**, 4 giorni completi, nessuna data incompleta.
5. Per ripetere, svuotare la fine del 26 agosto dalla UI e salvare. Il seed non azzera le modifiche.

Ore conteggiate come differenza dell'orario locale meno la pausa, solo per record completi. Un turno per data; niente turni notturni, conteggio dell'ora legale o assenze dedotte dalle date vuote. Il tool legge soltanto; le correzioni avvengono nella UI.

## Controlli

```sh
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```

`pnpm test:integration` invoca i route handler in-process contro il database demo locale migrato e seedato; non avvia un server HTTP. Verifica login, persistenza, conflitti, isolamento, CSRF e revoca delle sessioni. `pnpm test:http` esegue lo stesso scenario contro un server locale già avviato a `TEST_BASE_URL` e rifiuta destinazioni remote. Dettagli e limiti in [ATTENDANCE.md](docs/ATTENDANCE.md).

Per modifiche allo schema: `pnpm db:generate`, revisionare la migrazione generata e poi `pnpm db:migrate`. Non usare schema push automatici sul database di produzione.

## Deploy e ambienti

Il [Dockerfile](Dockerfile) mantiene Node 24 bloccato per digest e runtime standalone non root. Un target separato `operations` serve per migrazioni/seed; non viene incluso nel runner. Il deploy richiede ora `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`: la vecchia configurazione senza env rimane sufficiente solo per `/spike` e le route pubbliche.

La [guida Coolify](docs/DEPLOY.md) descrive ordine delle operazioni, connessione privata al DB e controlli dopo il deploy. R2 non è ancora necessario. Non copiare `.env` nell'immagine o inserire segreti nei build args.

L'ambiente Codex in `.codex/environments/environment.toml` installa le dipendenze e avvia `pnpm dev` su 3100. Database, migrazioni e seed vanno preparati con i comandi sopra. L'ambiente Cursor usa la porta 3000: allineare `BETTER_AUTH_URL` quando si cambia origine.

## Documentazione

- [Progetto e perimetro](docs/PROJECT.md), [TODO](TODO.md).
- [Flusso presenze e verifiche](docs/ATTENDANCE.md).
- [Prove storiche dello spike](docs/SPIKE.md).
- [Requisiti challenge](docs/CHALLENGE.md), [bozza candidatura](docs/SUBMISSION.md).
- [Brief originale](docs/brief-originale.txt), conservato senza modifiche.
