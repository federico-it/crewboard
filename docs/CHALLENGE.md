# WebMCP Challenge — requisiti e piano Crewboard

Verificato il **31 agosto 2026**. Questa è una checklist operativa, non il regolamento completo né una conferma di ammissibilità personale. Aggiornamento tecnico: esiste uno [spike locale con un tool hardcoded](SPIKE.md); MVP, deploy e materiali finali restano incompleti.

## Vincoli ufficiali

Sintesi delle sezioni 1, 3, 4, 6 e 7 del [regolamento](https://webmcp.devpost.com/rules):

| ID | Vincolo |
| --- | --- |
| R1 | Iscrizione e invio: 25 agosto–3 settembre 2026, chiusura 13:00 PDT = **22:00 Europe/Rome**. |
| R2 | Accesso gratuito ai giudici fino al 21 settembre, 17:00 PDT = **22 settembre, 02:00 italiane**. |
| R3 | Materiali in inglese, oppure accompagnati da traduzione inglese. |
| R4 | Progetto nuovo nel periodo oppure estensione WebMCP significativa, distinguendo il lavoro precedente con prove datate. |
| R5 | Verificare maggiore età, territorio, esclusioni, conflitti d'interesse, titolarità e licenze di terzi; nominare il rappresentante se necessario. |
| R6 | Dopo la scadenza non modificare la candidatura, salvo autorizzazioni previste. |

Valutazione: prima ammissibilità tecnica/tematica; poi quattro criteri equiponderati: uso WebMCP, esecuzione, impatto, creatività/ambizione. Non è prescritto un numero di tool né un gestionale HR completo. Il plugin Devpost è facoltativo. Verificare direttamente le clausole integrali prima dell'invio. Fonte: [Rules, sezioni 4–7](https://webmcp.devpost.com/rules).

## Pacchetto da consegnare

La [pagina ufficiale, Requirements](https://webmcp.devpost.com/#requirements) richiede:

| ID | Consegna | Mancanza locale |
| --- | --- | --- |
| S1 | App WebMCP funzionante a un URL live, con credenziali se protetta | Solo spike locale, nessun deploy |
| S2 | Repository pubblico con sorgenti, asset, istruzioni e licenza open source riconoscibile | Codice e setup dello spike presenti; LICENSE assente, visibilità remota non verificata |
| S3 | Video YouTube pubblico, durata inferiore a 3 minuti, demo funzionante e spiegazione audio | Da registrare |
| S4 | Testo: adeguatezza a WebMCP, beneficio UX, collaborazione persona/agente e implementazione | Solo proposta progettuale in italiano |

La registrazione con `document.modelContext.registerTool` compare tra i requisiti tecnici. L'esempio commerciale non implica una funzione di ricerca prodotti in Crewboard. Fonte: [Overview](https://webmcp.devpost.com/).

## FAQ e discrepanze da non perdere

Le [Resources / FAQ](https://webmcp.devpost.com/resources) contengono una frase che dice che non c'è video, ma nella stessa pagina la FAQ dedicata lo richiede: seguire S3, coerente con il regolamento. Le FAQ chiedono inoltre di lasciare immutati repository e sito consegnati fino all'annuncio dei vincitori; adottare questo vincolo operativo più prudente, oltre a R6. Proseguire lo sviluppo in una copia separata. Nessuna pubblicazione o iscrizione è stata eseguita con questo aggiornamento.

Ambiente indicato nelle FAQ: browser integrato di ChatGPT, oppure Chrome 149+ con `chrome://flags/#enable-webmcp-testing` attivo e browser riavviato. Annotare la versione realmente provata, senza equiparare un controllo TypeScript a una prova agente. Fonte: [FAQ ufficiali](https://webmcp.devpost.com/resources).

## Funzionalità da completare: proposta Crewboard

Questi sono criteri di accettazione del prodotto proposti per Crewboard, **non obblighi HR imposti dal concorso**. Mantengono gli otto tool del [progetto](PROJECT.md) e privilegiano un percorso verificabile. Tutte le righe sono da implementare.

| Priorità | Flusso | Criterio di accettazione |
| --- | --- | --- |
| P0 | Accesso demo e sessione | Un dipendente fittizio entra e vede soltanto i propri dati; un manager vede solo il team assegnato. Logout e sessione scaduta impediscono anche le chiamate dirette. |
| P0 | Controllo fine giornata | Alla domanda guida, riepilogo presenze, richieste e PDF provengono dai dati persistiti. Ogni anomalia indica data e motivo; niente conteggi inventati. |
| P0 | Correzione presenza dalla UI | L'utente corregge una presenza incompleta; ore e riepilogo cambiano anche nella lettura successiva dell'agente e dopo reload. Nessun nuovo tool necessario. |
| P0 | Richiesta ferie via agente | L'agente propone date e tipo; la pagina mostra il riepilogo. Solo la conferma della persona invia la richiesta; annullare non scrive nulla. Il risultato contiene ID e stato realmente salvati. |
| P0 | Approvazione manager | Una richiesta del team passa da pending ad approved; l'utente la rilegge aggiornata. Un dipendente non può approvare e un manager non può approvare fuori team. L'ID deve essere ottenibile da una lista autorizzata. |
| P0 | Busta paga privata | Elenco e apertura di un PDF fittizio; accesso negato con ID altrui, link scaduto gestito. Non trasmettere automaticamente il contenuto salariale all'agente. |
| P0 | Scoperta tool e continuità UI | Tool disponibili nella sessione corretta, senza duplicati dopo navigazione. Modifiche visibili nella dashboard; browser senza supporto mantiene utilizzabile l'interfaccia manuale. |
| P0 | Demo ripetibile | Seed deterministico: dipendente, manager, collega non autorizzato, presenza incompleta, richiesta pending, PDF sintetico. Ripristino limitato all'ambiente demo, senza endpoint pubblico per cancellare dati. |
| P1 | Cura delle schermate | Tastiera, responsive, caricamento, nessun risultato, errore server, annullamento e sessione scaduta gestiti nelle schermate dimostrate. |
| P1 | Amministrazione completa | CRUD dipendenti, impostazioni e upload documenti generici dopo il percorso P0. Il seed può preparare i PDF della demo; dichiarare l'upload non disponibile finché non implementato. |

Decisioni di perimetro consigliate: non promettere richieste draft o badge “nuova busta paga” senza modello dati; parlare di richieste pending e documenti disponibili. Niente calcolo stipendi, GPS, notifiche o chat proprietaria per questa consegna. I tool personali restano personali: l'elenco manager per trovare la richiesta da approvare va nella UI Team, oppure richiede una futura estensione esplicita del contratto.

## Chiusure tecniche WebMCP

La [documentazione imperativa Chrome](https://developer.chrome.com/docs/ai/webmcp/imperative-api) e l'[explainer](https://github.com/webmachinelearning/webmcp/blob/main/README.md) confermano `document.modelContext.registerTool` e indicano il pacchetto `webmcp-types`. Il vecchio nome `@mcp-b/webmcp-types` nel brief resta storico: verificare versione e compatibilità prima di installare. La guida descrive cleanup con `AbortSignal`; alcune semantiche cambiano da Chrome 153, quindi vanno provate sul browser scelto.

Per Crewboard:

- Rilevare la disponibilità dell'API solo nel client; mai durante SSR. Mostrare uno stato comprensibile se assente.
- Specificare date `YYYY-MM-DD`, mesi `YYYY-MM`, timezone organizzativa, enum dei tipi di permesso e campi obbligatori. Validare nuovamente sul server.
- Separare output riuscito, validazione fallita, accesso negato, sessione scaduta, annullamento e conflitto. Non dichiarare successo prima del commit della mutazione.
- Per conferme, collegare l'approvazione umana allo specifico payload: un parametro `confirmed: true` deciso dall'agente non basta. Ripetizioni e retry non devono duplicare richieste.
- Riaggiornare la UI dopo la risposta server; gestire navigazione/logout durante un tool senza riutilizzare contesti di sessioni precedenti.

La [guida di sicurezza Chrome](https://developer.chrome.com/docs/ai/webmcp/secure-tools) distingue contenuti non fidati, annotazioni di sola lettura ed esposizione fra origini. Applicazione a Crewboard: trattare note e titoli PDF come dati, non istruzioni; limitare gli output ai campi necessari; nessuna esposizione cross-origin aggiuntiva. Gli hint non sostituiscono l'autorizzazione server. Provare una nota ostile che tenta di far approvare richieste o leggere documenti altrui.

La [guida generale Chrome](https://developer.chrome.com/docs/ai/webmcp) descrive i vincoli di isolamento dell'origine e della Permissions Policy `tools`. Verificare sul deploy reale che header o iframe non disabilitino la registrazione; mantenere la demo nel documento principale. Non configurare un origin trial se il browser di prova abilitato è sufficiente.

## Piano fino alla consegna

Proposta di organizzazione interna al 31 agosto; non è una garanzia di completamento. La precedente sequenza di una settimana supera il tempo residuo.

| Data, Europe/Rome | Risultato da raggiungere |
| --- | --- |
| 31 agosto | Setup, auth, seed, un tool di lettura reale e primo deploy. Se il tool non è invocabile nel browser, risolvere prima di ampliare la UI. |
| 1 settembre | Presenze e ferie completi, mutazione confermata, controllo manager e persistenza. |
| 2 settembre | PDF privati, prove accessi negati, ripetibilità della demo, materiale inglese e prova di registrazione. |
| 3 settembre, entro le 18:00 | Obiettivo interno: versione candidata verificata, video pronto e URL definitivi. Riservare il resto a problemi e invio. |

Se manca tempo, ridurre P1; non eliminare autenticazione, controlli server, conferme o verifica del percorso filmato. Qualsiasi flusso P0 tagliato deve essere rimosso anche da descrizione e copione.

## Prove da conservare prima di segnare completato

| Evidenza | Contenuto atteso | Stato |
| --- | --- | --- |
| Ambiente riproducibile | Comandi installazione/migrazione/seed/avvio, env di esempio, versioni bloccate | Mancante |
| Prova browser | Browser e versione, URL, ruolo, prompt, tool invocati, risultato UI e persistenza | Mancante |
| Prova permessi | Altro team/organizzazione, ID altrui, sessione scaduta, conferma annullata, retry | Mancante |
| Provenienza | Primo commit locale `9ece48e` del 31 agosto; dichiarare eventuale codice/asset antecedente importato, senza dedurre l'originalità dalle sole date Git | Parziale |
| Versione consegnata | SHA/tag, URL live/repo/video, licenza scelta dal titolare, verifica link anonima, ricevuta invio | Mancante |

Il [TODO](../TODO.md) è la lista esecutiva. Il [modello di candidatura](SUBMISSION.md) serve a preparare testo e prova guidata senza presentare funzionalità progettate come già disponibili.
