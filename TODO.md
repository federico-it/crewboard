# Crewboard — cose da fare

Obiettivo: sviluppare Crewboard, dashboard per presenze, ferie e documenti dei dipendenti, per la challenge WebMCP di OpenAI.
Direzione e stack proposti sono descritti in [docs/PROJECT.md](docs/PROJECT.md). Requisiti ufficiali verificati, priorità P0/P1 e scadenze sono in [docs/CHALLENGE.md](docs/CHALLENGE.md); versioni e prove tecniche restano aperte.

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
- [ ] Verificare versioni e compatibilità delle dipendenze e scegliere il package manager.
- [ ] Creare la struttura iniziale Next.js con confine server e funzioni di dominio condivise.
- [ ] Documentare nel README installazione e avvio locale.
- [ ] Configurare controllo dei tipi, lint e gestione delle variabili d'ambiente, dove necessari.
- [ ] Definire schema Drizzle e migrazioni, incluse relazioni organizzazione/team e fonte autorevole dei ruoli.
- [ ] Configurare Better Auth con ruoli EMPLOYEE, MANAGER e ADMIN e controlli server.
- [ ] Verificare un tool WebMCP minimo nel browser previsto dalla challenge.
- [ ] Preparare il primo deploy e annotare browser/versione usati; seguire i riferimenti API in CHALLENGE.md, senza assumere compatibilità dai soli tipi.
- [ ] Predisporre il pacchetto S2: scegliere la licenza con il titolare, aggiungere LICENSE, env di esempio senza segreti e istruzioni per migrazioni/seed.

## 3. MVP e WebMCP

- [ ] Disegnare le schermate e gli stati del flusso principale.
- [ ] Implementare layout, overview e gestione dipendenti secondo il ruolo.
- [ ] Implementare calendario presenze e riepiloghi con regole esplicite per date, pause e ore.
- [ ] Implementare richieste ferie/permessi e approvazione manager/admin.
- [ ] Implementare upload e consultazione di buste paga e documenti con bucket privato e URL firmati.
- [ ] Definire input, output, errori e autorizzazioni delle azioni WebMCP.
- [ ] Implementare le azioni WebMCP previste per l'MVP.
- [ ] Preparare dati dimostrativi riproducibili con 8–10 dipendenti e PDF fittizi.
- [ ] Rendere completa la correzione delle presenze da UI e verificarne la rilettura tramite agente.
- [ ] Fornire nella UI manager la lista autorizzata e l'ID da usare in approve_leave; lasciare personale get_leave_requests.
- [ ] Implementare conferma umana legata al payload, annullamento senza scritture e protezione dai duplicati nelle mutazioni.
- [ ] Gestire scoperta/cleanup dei tool, logout, navigazione e interfaccia utilizzabile senza WebMCP.
- [ ] Preparare account demo dipendente/manager, casi di accesso negato e ripristino sicuro dei soli dati sintetici.

## 4. Verifica e consegna

- [ ] Verificare il flusso completo dall'interfaccia e tramite WebMCP nell'ambiente richiesto dalla challenge.
- [ ] Verificare sessioni, isolamento tra organizzazioni/team e accessi negati a presenze e documenti altrui.
- [ ] Gestire caricamenti, stati vuoti, errori e conferme per le azioni sensibili.
- [ ] Controllare accessibilità da tastiera e layout mobile/desktop.
- [ ] Verificare retry, conflitti, note ostili, link PDF scaduti e contesti di sessione non più validi.
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

- 2026-08-31: conservata la proposta iniziale in `docs/PROJECT.md` e il testo originale in `docs/brief-originale.txt`. Direzione: app Next.js full-stack con logica di dominio condivisa tra UI e WebMCP; dettagli da validare prima dell'implementazione.
- 2026-08-31: raccolte fonti ufficiali e lacune in `docs/CHALLENGE.md`; sostituita la sequenza di una settimana con priorità datate. Nessuna implementazione, licenza, pubblicazione o candidatura effettuata.
