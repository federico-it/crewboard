# Crewboard — progetto e architettura

Documento di riferimento iniziale, aggiornato il 31 agosto 2026.
La struttura è indicativa: descrive la direzione proposta, non funzionalità già implementate.
Il [testo originale](./brief-originale.txt) è conservato senza modifiche; le attività sono in [TODO.md](../TODO.md).

## Obiettivo

Realizzare Crewboard per la challenge WebMCP di OpenAI: una dashboard per presenze, ferie e documenti dei dipendenti, utilizzabile sia dalle persone sia da un agente.

Posizionamento: **Your workplace, agent-ready.**

Interfaccia e strumenti dell'agente devono utilizzare gli stessi dati, le stesse regole di dominio e gli stessi controlli di accesso. Priorità a pochi flussi completi e curati, con una demo desktop e un'interfaccia responsive.

## Stack proposto

| Area | Scelta proposta | Scopo |
| --- | --- | --- |
| Applicazione | Next.js + TypeScript | Un unico progetto full-stack, senza backend separato |
| UI | Tailwind CSS + shadcn/ui | Layout e componenti della dashboard |
| Database | PostgreSQL | Dati relazionali |
| ORM | Drizzle ORM | Schema, query e migrazioni |
| Autenticazione | Better Auth | Sessioni, organizzazioni e ruoli |
| Storage | Hetzner Object Storage compatibile S3 | PDF e documenti in bucket privato |
| Grafici | Recharts | Riepiloghi di ore, presenze e ferie |
| Date | date-fns | Calendario e gestione delle date |
| Hosting | Coolify + Hetzner | Deploy dell'applicazione |
| Integrazione agente | WebMCP nativo nel browser | Esposizione di azioni nel contesto della pagina autenticata |

Il brief suggerisce Next.js `16.3.3`, `document.modelContext.registerTool(...)` e il pacchetto `@mcp-b/webmcp-types`. Sono riferimenti da verificare nella documentazione ufficiale prima del setup: non costituiscono versioni o contratti API già confermati.

## Architettura

```text
Dashboard UI                 Agente nel browser
     |                              |
     |                         Tool WebMCP
     |                              |
     +----------+-------------------+
                |
      Confine server autenticato
      (Server Actions / Route Handlers)
                |
        Funzioni di dominio
                |
       +--------+---------+
       |                  |
   Drizzle ORM       Storage S3 privato
       |                  |
   PostgreSQL        PDF e documenti
```

Le funzioni di dominio vivono sul server; UI e tool WebMCP le raggiungono attraverso ingressi autenticati. Il codice nel browser non accede direttamente a database, credenziali o storage privato.

Esempi di responsabilità condivise: lettura e modifica delle presenze, richiesta ferie, elenco buste paga e colleghi al lavoro. Validazione, autorizzazione e regole di business devono restare comuni ai due percorsi.

### Organizzazione indicativa del codice

```text
src/
  app/                 Route, layout e ingressi server Next.js
  components/          Componenti UI condivisi
  features/            UI specifica di presenze, ferie, documenti e team
  server/
    auth/              Sessione e autorizzazioni
    db/                Connessione e schema Drizzle
    domain/            Logica applicativa condivisa
    storage/           Accesso a S3 e generazione URL firmati
  webmcp/              Registrazione tool e adattatori browser
drizzle/               Migrazioni versionate
docs/                  Documentazione del progetto
```

Queste directory verranno create con il setup dell'applicazione.

## Ruoli e navigazione

| Ruolo | Aree previste |
| --- | --- |
| EMPLOYEE | Overview, Attendance, Leave, Payslips, Profile |
| MANAGER | Aree dipendente, Team, Leave requests, Team attendance |
| ADMIN | Aree precedenti, Employees, Documents, Settings |

Mantenere i permessi semplici, ma verificarli sul server per ogni operazione. Definire prima dell'implementazione quali dipendenti appartengono al team visibile a un manager e come viene delimitata l'organizzazione.

Per le operazioni personali, l'identità deriva dalla sessione: un tool `get_my_*` non deve accettare un `userId` arbitrario. Nascondere una voce di menu o un tool non sostituisce l'autorizzazione server.

## Modello dati iniziale

Schema concettuale, da completare con identificativi, relazioni, vincoli, indici e campi necessari all'autenticazione.

| Entità | Campi o responsabilità previsti |
| --- | --- |
| users | Identità dell'utente |
| organizations | Organizzazioni |
| organization_members | Appartenenza all'organizzazione |
| employees | user_id, role, job_title, department, hire_date |
| attendance | employee_id, date, start_time, end_time, break_minutes, status |
| leave_requests | employee_id, type, start_date, end_date, status, note, approved_by |
| payslips | employee_id, month, year, file_key, created_at |
| documents | employee_id, type, title, file_key, created_at |

Prima delle migrazioni definire la fonte autorevole dei ruoli, il collegamento dipendente/organizzazione/team, gli stati di presenze e richieste e le regole per fuso orario, pause e calcolo delle ore. Le tabelle effettive di Better Auth dipenderanno dalla configurazione verificata.

## Tool WebMCP iniziali

| Tool proposto | Funzione | Accesso previsto |
| --- | --- | --- |
| get_my_attendance(month) | Presenze personali del mese | Utente autenticato, dati propri |
| get_attendance_summary(month) | Ore, presenze mancanti e ferie personali | Utente autenticato, dati propri |
| get_working_colleagues(date) | Colleghi al lavoro nella data | Utente autenticato, perimetro autorizzato |
| get_my_payslips() | Elenco delle proprie buste paga | Utente autenticato, dati propri |
| get_payslip(month) | Recupero di una propria busta paga | Utente autenticato, dati propri |
| request_leave(from, to, type, note) | Invio di una richiesta personale di ferie o permesso | Utente autenticato, dati propri |
| get_leave_requests() | Stato delle proprie richieste | Utente autenticato, dati propri |
| approve_leave(requestId) | Approvazione di una richiesta | MANAGER / ADMIN, entro il perimetro autorizzato |

Le firme sono indicative: definire formati non ambigui per date e mesi, schemi input/output, errori, descrizioni e conferme delle mutazioni. Gli accessi personali richiedono una sessione autenticata; anche i manager devono rispettare il perimetro di team e organizzazione.

Preferire questi casi d'uso a un catalogo generico di CRUD. UI e agente devono mostrare risultati coerenti dopo le modifiche. Verificare presto un tool minimo nel browser della challenge, poi completare l'integrazione sulle funzioni di dominio funzionanti.

## PDF e documenti

- Conservare i file in un bucket S3 privato; nel database salvare metadati e `file_key`.
- Generare URL firmati a breve durata solo dopo il controllo dei permessi sul server.
- Non salvare PDF nel database né rendere pubblico il bucket.
- Usare solo documenti e dipendenti fittizi nella demo; non versionare buste paga reali, credenziali o dump.

## Direzione UI

Dashboard sobria ispirata alla pulizia di Linear, Raycast e Vercel, con sidebar e circa cinque schermate principali curate. Overview con riepilogo ore, presenze, ferie, disponibilità buste paga, calendario mensile e team di oggi.

Le voci aggiuntive dipendono dal ruolo. Il wireframe del brief è illustrativo: il campanello non introduce notifiche nell'MVP e il riquadro busta paga non implica un calcolo dello stipendio.

## Perimetro escluso dall'MVP

- Motore payroll e calcolo degli stipendi.
- Gestione avanzata dei contratti o ACL sofisticate.
- Timbrature GPS.
- Notifiche.
- Microservizi o backend separato.

## Sequenza indicativa: una settimana

1. Setup Next.js, design system, schema DB, auth e seed di 8–10 dipendenti; verifica minima della compatibilità WebMCP.
2. Layout, dashboard e gestione dipendenti.
3. Calendario presenze e ferie/permessi.
4. Upload e consultazione buste paga e documenti.
5. Integrazione dei tool WebMCP sui flussi già funzionanti.
6. Descrizioni tool, permessi, errori, conferme e casi limite.
7. Rifinitura UI, dati demo, deploy, copione e video.

Questa è una sequenza di lavoro, non una deadline ufficiale.

## Demo proposta

Domanda guida: **“Do I need to do anything before I finish work today?”**

L'agente controlla le presenze incomplete, lo stato delle richieste ferie e le buste paga disponibili, poi propone le azioni possibili usando la stessa sessione della dashboard.

Il racconto originale include una richiesta in bozza e una busta paga nuova: questi dettagli richiedono rispettivamente uno stato draft e una definizione di “nuova”. Vanno implementati esplicitamente oppure esclusi dal copione. Gli otto tool proposti non includono la correzione delle presenze: nella prima demo tale correzione resta nell'interfaccia, salvo estensione concordata del perimetro.

## Verifiche ancora aperte

- Link ufficiale, requisiti, criteri di valutazione, scadenza e materiali della challenge.
- Versione supportata e aggiornata di Next.js; compatibilità delle dipendenze.
- API WebMCP corrente, eventuali tipi TypeScript e browser/ambiente richiesto per la demo.
- Disponibilità effettiva dell'integrazione agente e delle superfici desktop/mobile.
- Configurazione Better Auth, modello ruoli e isolamento di organizzazioni e team.
- Ambienti Coolify/Hetzner, database, bucket privato e segreti di deploy.

Le affermazioni del brief su release, patch di sicurezza, date degli standard e criteri ufficiali restano proposte da verificare, non fatti convalidati da questa documentazione.
