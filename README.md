# Crewboard

**Your workplace, agent-ready.**

Crewboard è un progetto pensato per la challenge WebMCP di OpenAI: una dashboard per gestire presenze, ferie e documenti dei dipendenti, con flussi accessibili sia dall'interfaccia sia da un agente nel browser.

L'obiettivo è offrire alle persone e all'agente gli stessi dati, le stesse regole e gli stessi permessi, all'interno della sessione autenticata dell'utente.

## Stato del progetto

**Setup iniziale dell'applicazione.** Oltre alla documentazione, la repository contiene ora la struttura iniziale dell'app: un progetto Next.js (App Router) con TypeScript e Tailwind CSS e una prima schermata di Overview con dati dimostrativi. Database, autenticazione, storage e i tool WebMCP descritti qui restano da implementare e rappresentano la direzione proposta.

Versioni delle dipendenze, API WebMCP e requisiti ufficiali della challenge devono essere verificati prima di proseguire l'implementazione.

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

### Prerequisiti

- Node.js 22+
- pnpm 10 (il progetto fissa `pnpm@10.33.3` tramite il campo `packageManager`)

### Sviluppo locale

```bash
pnpm install                # installa le dipendenze
pnpm dev                    # avvia il dev server su http://localhost:3000
```

Altri comandi utili:

```bash
pnpm build                  # build di produzione
pnpm start                  # avvia la build di produzione
pnpm lint                   # ESLint
```

L'ambiente per i Cursor Cloud Agent è descritto in `.cursor/environment.json`: esegue `pnpm install --frozen-lockfile` e avvia `pnpm dev` in un terminale dedicato sulla porta 3000.

### Lavorare sulla definizione del progetto

Per lavorare sulla definizione del progetto:

1. Leggere [progetto e architettura](docs/PROJECT.md) per perimetro, ruoli, modello dati e decisioni aperte.
2. Consultare il [TODO](TODO.md) per scegliere la prossima attività e aggiornarne lo stato.
3. Usare il [brief originale](docs/brief-originale.txt) come riferimento della proposta iniziale.

Non versionare credenziali, file `.env` reali, documenti personali o dump del database. Il `.gitignore` include esclusioni per questi file e per gli output generati; gli esempi `.env` privi di segreti, i lockfile e le migrazioni restano versionabili.
