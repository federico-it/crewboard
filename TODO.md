# Crewboard — cose da fare

Obiettivo: sviluppare Crewboard, dashboard per presenze, ferie e documenti dei dipendenti, per la challenge WebMCP di OpenAI.
Direzione e stack proposti sono descritti in [docs/PROJECT.md](docs/PROJECT.md); versioni, dettagli tecnici e requisiti ufficiali restano da verificare.

## Come usare questa lista

- `[ ]` = da fare; `[x]` = completato.
- Aggiungere `🚧` alle attività in corso e `⛔` a quelle bloccate, indicando il motivo.
- Tenere le attività piccole e verificabili; suddividere quelle troppo grandi.
- Aggiornare la lista mentre si lavora e segnare come completato solo ciò che è stato verificato.

## 1. Direzione e challenge

- [ ] Inserire il link ufficiale della challenge e verificare requisiti, scadenza e modalità di consegna.
- [x] Documentare l'idea e la struttura indicativa di Crewboard, conservando il brief originale.
- [x] Proporre un flusso demo: controllare presenze incomplete, richieste ferie e buste paga disponibili.
- [x] Documentare il perimetro proposto dell'MVP e le esclusioni.
- [x] Identificare gli otto tool WebMCP iniziali e i relativi casi d'uso.
- [ ] Confermare il perimetro finale della demo, inclusi eventuali stati draft e documenti nuovi.

## 2. Setup del progetto

- [x] Documentare lo stack proposto: Next.js, TypeScript, Tailwind, shadcn/ui, PostgreSQL, Drizzle e Better Auth.
- [x] Aggiungere un `.gitignore` per dipendenze, output generati, segreti e dati locali.
- [ ] Verificare versioni e compatibilità delle dipendenze e scegliere il package manager.
- [ ] Creare la struttura iniziale Next.js con confine server e funzioni di dominio condivise.
- [ ] Documentare nel README installazione e avvio locale.
- [ ] Configurare controllo dei tipi, lint e gestione delle variabili d'ambiente, dove necessari.
- [ ] Definire schema Drizzle e migrazioni, incluse relazioni organizzazione/team e fonte autorevole dei ruoli.
- [ ] Configurare Better Auth con ruoli EMPLOYEE, MANAGER e ADMIN e controlli server.
- [ ] Verificare un tool WebMCP minimo nel browser previsto dalla challenge.

## 3. MVP e WebMCP

- [ ] Disegnare le schermate e gli stati del flusso principale.
- [ ] Implementare layout, overview e gestione dipendenti secondo il ruolo.
- [ ] Implementare calendario presenze e riepiloghi con regole esplicite per date, pause e ore.
- [ ] Implementare richieste ferie/permessi e approvazione manager/admin.
- [ ] Implementare upload e consultazione di buste paga e documenti con bucket privato e URL firmati.
- [ ] Definire input, output, errori e autorizzazioni delle azioni WebMCP.
- [ ] Implementare le azioni WebMCP previste per l'MVP.
- [ ] Preparare dati dimostrativi riproducibili con 8–10 dipendenti e PDF fittizi.

## 4. Verifica e consegna

- [ ] Verificare il flusso completo dall'interfaccia e tramite WebMCP nell'ambiente richiesto dalla challenge.
- [ ] Verificare sessioni, isolamento tra organizzazioni/team e accessi negati a presenze e documenti altrui.
- [ ] Gestire caricamenti, stati vuoti, errori e conferme per le azioni sensibili.
- [ ] Controllare accessibilità da tastiera e layout mobile/desktop.
- [ ] Preparare la demo e i materiali richiesti dal regolamento.
- [ ] Pubblicare il progetto, se richiesto, e verificare la versione pubblicata.
- [ ] Ricontrollare i requisiti ufficiali e inviare la candidatura.

## Backlog — dopo l'MVP

Aggiungere qui le idee non necessarie alla prima demo.

## Decisioni

- 2026-08-31: conservata la proposta iniziale in `docs/PROJECT.md` e il testo originale in `docs/brief-originale.txt`. Direzione: app Next.js full-stack con logica di dominio condivisa tra UI e WebMCP; dettagli da validare prima dell'implementazione.
