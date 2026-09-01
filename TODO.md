# Crewboard — cose da fare

Obiettivo: sviluppare Crewboard, dashboard per presenze, ferie e documenti dei dipendenti, per la challenge WebMCP di OpenAI.
Direzione e stack sono descritti in [docs/PROJECT.md](docs/PROJECT.md). Requisiti ufficiali verificati, priorità P0/P1 e scadenze sono in [docs/CHALLENGE.md](docs/CHALLENGE.md); il blocco presenze è implementato e verificato lato API e il primo deploy HTTPS è attivo; restano aperti prova WebMCP nel browser della challenge e gli altri flussi MVP.

## Come usare questa lista

- `[ ]` = da fare; `[x]` = completato.
- Aggiungere `🚧` alle attività in corso e `⛔` a quelle bloccate, indicando il motivo.
- Tenere le attività piccole e verificabili; suddividere quelle troppo grandi.
- Aggiornare la lista mentre si lavora e segnare come completato solo ciò che è stato verificato.

## 1. Direzione e challenge

- [x] Inserire il link ufficiale della challenge e verificare requisiti, scadenza e modalità di consegna (31 agosto; CHALLENGE.md).
- [ ] Verificare R5 con i partecipanti e completare l'iscrizione Devpost; non dedurre l'ammissibilità dalla presenza del repository.
- [x] Documentare l'idea e la struttura indicativa di Crewboard, conservando il brief originale.
- [x] Proporre un flusso demo: controllare presenze incomplete, richieste ferie e buste paga disponibili.
- [x] Documentare il perimetro proposto dell'MVP e le esclusioni.
- [x] Identificare gli otto tool WebMCP iniziali e i relativi casi d'uso.
- [ ] Confermare il perimetro finale della demo, inclusi eventuali stati draft e documenti nuovi.
- [x] Proporre un percorso P0 con criteri di accettazione e un piano datato compatibile con il tempo residuo.
- [ ] Conservare evidenze R4: commit, contributi e provenienza di eventuale materiale preesistente.

## 2. Setup del progetto

- [x] Documentare lo stack proposto: Next.js, TypeScript, Tailwind, shadcn/ui, PostgreSQL, Drizzle e Better Auth.
- [x] Aggiungere un `.gitignore` per dipendenze, output generati, segreti e dati locali.
- [x] Creare il README con presentazione, funzionalità previste, stack e link alla documentazione.
- [x] Verificare e bloccare le dipendenze dello spike iniziale (risultati storici in docs/SPIKE.md). Il merge adotta pnpm 10.33.3 e TypeScript 5.9.3 per compatibilità con ESLint, preservando Next.js 16.3.3, React 19.2.8 e webmcp-types 0.1.5.
- [x] Installare e verificare le dipendenze del blocco presenze (Better Auth, Drizzle, PostgreSQL e Zod); storage e librerie dei flussi successivi restano da scegliere quando servono.
- [x] Creare la struttura Next.js del blocco presenze con confine server e funzioni di dominio condivise.
- [x] Documentare nel README installazione e avvio locale dello spike.
- [x] Aggiungere controllo TypeScript e tre test mirati a calcolo/validazione dello spike; tutti passati.
- [x] Configurare controllo dei tipi, lint e gestione delle variabili d'ambiente per il blocco corrente.
- [x] Definire schema Drizzle e migrazioni per autenticazione, organizzazione, dipendente e presenze, incluso upgrade issuer Better Auth 1.7.
- [ ] Estendere schema e autorizzazioni con team e fonte autorevole dei ruoli EMPLOYEE, MANAGER e ADMIN. Better Auth e i controlli server sulle presenze personali sono già attivi.
- [x] Implementare un solo tool get_attendance_summary su array hardcoded, senza auth/DB.
- [x] Verificare scoperta e invocazione reali nel browser integrato di Codex, UI coerente, input errato, mese vuoto, navigazione e reload (docs/SPIKE.md).
- [x] Chiudere la prova nel browser previsto dalla challenge: Chrome 152 con flag WebMCP; scoperta/invocazione verificate su `/spike` (fixture) e `/attendance` autenticato (PostgreSQL, 1.9.2026).
- [x] Preparare il primo deploy e annotare browser/versione usati; seguire i riferimenti API in CHALLENGE.md, senza assumere compatibilità dai soli tipi.
  - [x] Predisporre Dockerfile standalone, health check e guida Coolify (docs/DEPLOY.md).
  - [x] Pubblicare sul dominio scelto (`https://crewboard.srvly.it`).
  - [x] Completare la prova WebMCP HTTPS sul deploy pubblico (`/spike` e `/attendance` autenticato, Chrome 152 + flag; DB → 31.5 h, contatore 1).
- [ ] Predisporre il pacchetto S2: scegliere la licenza con il titolare, aggiungere LICENSE, env di esempio senza segreti e istruzioni per migrazioni/seed.

## 3. MVP e WebMCP

- [x] Disegnare e implementare gli stati del primo flusso presenze: login, caricamento, calendario, editor, errore, conflitto e sessione terminata.
- [ ] Implementare layout, overview e gestione dipendenti secondo il ruolo.
- [x] Implementare calendario presenze e riepiloghi persistenti con regole esplicite per date, pause e ore.
- [ ] Implementare richieste ferie/permessi e approvazione manager/admin.
- [ ] Implementare upload e consultazione di buste paga e documenti con bucket privato e URL firmati.
- [ ] Collegare Cloudflare R2 tramite API S3, validare le variabili server e provare accessi privati/URL firmati; sostituisce lo storage Hetzner previsto inizialmente.
- [x] Definire input, output, errori e autorizzazione del tool di lettura presenze; ripetere per ogni tool futuro.
- [ ] Implementare le azioni WebMCP previste per l'MVP.
- [ ] Preparare dati dimostrativi riproducibili con 8–10 dipendenti e PDF fittizi.
- [ ] Verificare nel browser correzione UI → reload → rilettura agente. Persistenza e stesso dato server sono già coperti dal test d'integrazione.
- [ ] Fornire nella UI manager la lista autorizzata e l'ID da usare in approve_leave; lasciare personale get_leave_requests.
- [x] Implementare salvataggio esplicito, annullamento senza scritture e protezione da conflitti/duplicati nella correzione presenze.
- [x] Gestire nel codice registrazione/cleanup del tool, logout, cambio sessione e interfaccia utilizzabile senza WebMCP; resta la prova browser del nuovo flusso.
- [ ] Preparare account demo manager e relativo perimetro. Sono già disponibili tre dipendenti sintetici, isolamento verificato e ripristino mirato del 26 agosto.

## 4. Verifica e consegna

- [ ] Verificare il flusso completo dall'interfaccia e tramite WebMCP nell'ambiente richiesto dalla challenge.
- [ ] Completare isolamento di team e documenti. Sessioni, dati personali, due organizzazioni, logout, scadenza e dipendente inattivo sono verificati lato API.
- [ ] Gestire caricamenti, stati vuoti, errori e conferme per le azioni sensibili.
- [ ] Controllare accessibilità da tastiera e layout mobile/desktop.
- [ ] Completare note ostili e link PDF scaduti. Conflitti, payload con ID arbitrari e contesti di sessione non più validi sono verificati lato API.
- [ ] Raccogliere prove del percorso P0 con prompt, tool invocati, risultati UI e persistenza, come indicato in CHALLENGE.md.
- [x] Preparare un modello inglese di candidatura e una scaletta demo, marcati come bozze (docs/SUBMISSION.md).
- [ ] Completare S4 e R3: testo, README per i giudici e istruzioni di prova; eliminare promesse non dimostrate.
- [ ] Produrre e verificare S3 usando il copione solo come traccia, senza dati o asset non autorizzati.
- [ ] Pubblicare e verificare S1/S2: app, repository, licenza riconosciuta e accesso da sessione pulita. Condividere solo credenziali demo, tramite il modulo previsto.
- [ ] Registrare SHA/tag e URL definitivi, predisporre disponibilità R2 e congelamento secondo le FAQ; disabilitare deploy automatici sulla versione consegnata.
- [ ] Ricontrollare Rules/FAQ/Updates, inviare entro R1 e conservare la ricevuta Devpost; una bozza salvata non vale come invio verificato.

## Backlog — dopo l'MVP

Aggiungere qui le idee non necessarie alla prima demo.

## Decisioni

- 2026-09-01: completato il primo blocco presenze personali con PostgreSQL/Drizzle, Better Auth, sessione demo, calendario persistente e tool sullo stesso endpoint. Test API in-process passato; deploy HTTPS su Coolify attivo; prova WebMCP browser sul deploy pubblico e altri flussi MVP restano aperti.
- 2026-08-31: su indicazione del team, storage file su Cloudflare R2 privato; hosting app invariato Coolify/Hetzner. R2 non è ancora collegato.

- 2026-08-31: conservata la proposta iniziale in `docs/PROJECT.md` e il testo originale in `docs/brief-originale.txt`. Direzione: app Next.js full-stack con logica di dominio condivisa tra UI e WebMCP; dettagli da validare prima dell'implementazione.
- 2026-08-31: raccolte fonti ufficiali e lacune in `docs/CHALLENGE.md`; sostituita la sequenza di una settimana con priorità datate. Nessuna implementazione, licenza, pubblicazione o candidatura effettuata.
- 2026-08-31: implementato lo spike richiesto, limitato a Next.js e una lettura su fixture. Risultati e limite Chrome documentati in `docs/SPIKE.md`; nessun auth, DB, deploy o ampliamento del perimetro demo.
- 2026-08-31: risoluzione del merge con il setup iniziale: spike su `/`, Overview statica conservata su `/overview`, stili isolati; mantenuti Tailwind, ESLint e ambiente Cursor con un solo lockfile pnpm. L'Overview non implementa i flussi HR mostrati come mockup.
