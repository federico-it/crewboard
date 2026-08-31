# Crewboard

**Your workplace, agent-ready.**

Crewboard è un progetto pensato per la challenge WebMCP di OpenAI: una dashboard per gestire presenze, ferie e documenti dei dipendenti, con flussi accessibili sia dall'interfaccia sia da un agente nel browser.

L'obiettivo è offrire alle persone e all'agente gli stessi dati, le stesse regole e gli stessi permessi, all'interno della sessione autenticata dell'utente.

## Stato del progetto

**Spike WebMCP eseguibile.** Next.js espone un solo tool, `get_attendance_summary`, che legge quattro presenze hardcoded. Registrazione, scoperta e invocazione reale sono state provate nel browser integrato di Codex, anche sulla build di produzione locale. In Chrome 152, nella configurazione trovata, l'API non è disponibile: fallback manuale verificato, prova con flag ancora aperta.

Next.js `16.3.3`, React `19.2.8`, TypeScript `7.0.2` e `webmcp-types` `0.1.5` sono bloccati con npm e lockfile. Dettagli e limiti delle prove: [resoconto spike](docs/SPIKE.md). Requisiti ufficiali: [piano challenge](docs/CHALLENGE.md).

Lo spike non include auth, database, ferie, PDF o dati reali. Le funzionalità e l'architettura completa descritte sotto restano proposte per l'MVP. Nessun deploy pubblico effettuato. Consegne e prove mancanti sono tracciate nel [TODO](TODO.md).

## Funzionalità previste

- **Overview:** riepilogo delle ore lavorate, presenze, ferie e buste paga disponibili.
- **Attendance:** calendario personale, compilazione e controllo delle presenze.
- **Leave:** richiesta di ferie e permessi, consultazione dello stato e approvazione.
- **Payslips e Documents:** caricamento e consultazione di PDF con accesso riservato.
- **Team ed Employees:** visibilità sui colleghi e gestione dei dipendenti secondo il ruolo.

Sono previsti tre ruoli: `EMPLOYEE`, `MANAGER` e `ADMIN`. L'MVP esclude calcolo degli stipendi, gestione avanzata dei contratti, timbrature GPS e notifiche.

## Perché WebMCP

La demo proposta parte da una domanda:

> “Do I need to do anything before I finish work today?”

L'agente dovrà poter controllare le presenze incomplete, lo stato delle richieste ferie e le buste paga disponibili, aiutando l'utente a capire cosa resta da fare.

Gli strumenti iniziali proposti sono:

| Tool | Scopo |
| --- | --- |
| `get_my_attendance` | Consultare le proprie presenze |
| `get_attendance_summary` | Riepilogare ore, presenze mancanti e ferie |
| `get_working_colleagues` | Sapere chi lavora in una certa data |
| `get_my_payslips` | Elencare le proprie buste paga |
| `get_payslip` | Recuperare una propria busta paga |
| `request_leave` | Richiedere ferie o permessi |
| `get_leave_requests` | Consultare lo stato delle proprie richieste |
| `approve_leave` | Approvare una richiesta, se autorizzati |

Le operazioni personali ricaveranno l'identità dalla sessione, senza consentire all'agente di scegliere un utente arbitrario. Le autorizzazioni saranno verificate sul server; le operazioni sensibili dovranno prevedere conferme esplicite.

## Stack e architettura proposti

| Area | Tecnologia |
| --- | --- |
| Applicazione full-stack | Next.js + TypeScript |
| Interfaccia | Tailwind CSS + shadcn/ui |
| Database e ORM | PostgreSQL + Drizzle ORM |
| Autenticazione | Better Auth |
| File privati | Hetzner Object Storage compatibile S3 |
| Grafici e date | Recharts + date-fns |
| Hosting | Coolify + Hetzner |
| Strumenti per l'agente | WebMCP nel browser |

Un'unica applicazione Next.js, senza backend separato: dashboard e tool WebMCP raggiungeranno le stesse funzioni di dominio attraverso ingressi server autenticati. La logica applicativa accederà a PostgreSQL tramite Drizzle e ai documenti tramite storage S3 privato.

I PDF resteranno nello storage; il database conserverà i metadati. Gli URL firmati saranno generati solo dopo la verifica dei permessi. Per la demo verranno utilizzati dipendenti e documenti fittizi.

## Come iniziare

Prerequisito Next.js: Node.js >=20.9. Lo spike è stato provato con Node `26.7.0` e npm `11.19.0`. Non servono `.env`, credenziali o servizi esterni.

```sh
npm ci
npm run dev -- --port 3100
```

Aprire [lo spike locale](http://127.0.0.1:3100). La pagina separa calcolo manuale e chiamate WebMCP; il secondo pannello cambia solo quando il tool viene invocato. Input di prova: `{"month":"2026-08"}`. Risultato atteso: 23,5 ore, 3 giornate complete, 26 agosto incompleto.

```sh
npm run typecheck
npm test
npm run build
npm run start -- --port 3101
```

Il server di produzione usa [127.0.0.1:3101](http://127.0.0.1:3101). Build e sviluppo sono locali, non un deploy. Procedura browser e criteri di esito sono in [SPIKE.md](docs/SPIKE.md).

Per lavorare sulla definizione del progetto:

1. Leggere [progetto e architettura](docs/PROJECT.md) per perimetro, ruoli, modello dati e decisioni aperte.
2. Consultare il [TODO](TODO.md) per scegliere la prossima attività e aggiornarne lo stato.
3. Usare il [brief originale](docs/brief-originale.txt) come riferimento della proposta iniziale.
4. Seguire il [piano challenge](docs/CHALLENGE.md) e completare il [modello inglese di candidatura](docs/SUBMISSION.md) solo con funzionalità verificate.

Non versionare credenziali, file `.env` reali, documenti personali o dump del database. Il `.gitignore` include esclusioni per questi file e per gli output generati; gli esempi `.env` privi di segreti, i lockfile e le migrazioni restano versionabili.
