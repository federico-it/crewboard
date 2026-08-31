# Spike WebMCP minimo

31 agosto 2026. Obiettivo: verificare Next.js → registrazione WebMCP → invocazione → risultato visibile, prima di auth e schema DB. Unico tool: `get_attendance_summary`.

**Esito:** implementazione e invocazione reale riuscite nel browser integrato di Codex (sviluppo e build di produzione locale). **Gate challenge ancora parziale:** il Chrome 152 disponibile non espone l'API nella configurazione trovata; non sono stati cambiati flag né riavviato il browser. Non è stata effettuata una prova nel browser dell'app ChatGPT o su un deploy pubblico.

## Versioni e API

| Dipendenza | Versione installata |
| --- | --- |
| Next.js | 16.3.3 |
| React / React DOM | 19.2.8 |
| TypeScript | 7.0.2 |
| webmcp-types | 0.1.5 |
| tsx (test) | 4.23.13 |
| Ambiente di prova | Node 26.7.0, npm 11.19.0, macOS |

Versioni dirette esatte in [package.json](../package.json), transitive in [package-lock.json](../package-lock.json). Il campo engines di Next.js richiede Node >=20.9; non è una dichiarazione di compatibilità WebMCP di ogni browser supportato da Next.js.

La [guida imperativa Chrome](https://developer.chrome.com/docs/ai/webmcp/imperative-api) conferma `document.modelContext.registerTool`, cleanup tramite `AbortSignal` e il pacchetto `webmcp-types`. I suoi tipi sono dichiarazioni globali, inclusi tramite [src/webmcp.d.ts](../src/webmcp.d.ts): non sono un modulo runtime né un polyfill. L'app non emula WebMCP quando manca.

I file AGENTS.md e CLAUDE.md sono stati generati da `next dev`; indicano di consultare la documentazione della versione installata. Verificate le guide locali installation, layouts-and-pages e use-client sotto `node_modules/next/dist/docs`.

## Perimetro effettivo

- [attendance.ts](../src/lib/attendance.ts): array sintetico e calcolo condiviso da UI/tool.
- [attendance-spike.tsx](../src/components/attendance-spike.tsx): componente client, rilevamento API, registrazione, input schema, output JSON serializzato, diagnostica e cleanup all'unmount.
- `/about`: pagina senza tool per provare la navigazione Next.js.
- Nessun auth, database, endpoint remoto, chiave API, dato personale, upload o persistenza. Tutti i dati sono pubblici nel bundle client; non sostituirli con presenze reali.
- Nessuna dipendenza di design system o chat aggiunta. L'agente è quello del browser.

Il parametro obbligatorio è `month`, formato `YYYY-MM`; campi extra vengono rifiutati anche dalla funzione. Lo spike non accetta un identificativo dipendente e non dimostra autorizzazioni. Giorni mancanti nel fixture non diventano assenze; non calcola ferie, calendario lavorativo completo o turni notturni.

Risultato atteso per `{"month":"2026-08"}`:

```json
{
  "month": "2026-08",
  "source": "hardcoded-demo",
  "coverage": "Partial fixture only; absent dates are not inferred as missing attendance.",
  "recordedDays": 4,
  "completedDays": 3,
  "workedMinutes": 1410,
  "workedHours": 23.5,
  "incompleteDates": ["2026-08-26"]
}
```

## Riproduzione

Seguire i comandi di installazione, sviluppo e produzione nel [README](../README.md). Aprire la pagina con un browser WebMCP abilitato. Per Chrome seguire la [configurazione ufficiale](https://developer.chrome.com/docs/ai/webmcp): abilitare `chrome://flags/#enable-webmcp-testing`, riavviare e ricaricare. Questa modifica non è stata eseguita durante lo spike.

1. Verificare lo stato `WebMCP tool registered` e la presenza di **un solo** tool nel client agente/inspector.
2. Chiedere “Get my attendance summary for August 2026”, oppure invocare il tool dall'inspector con l'input sopra. Il pannello WebMCP deve mostrare una chiamata e il risultato atteso.
3. Premere “Calculate manually”: stesso JSON, nessun incremento del contatore WebMCP. Il pulsante non testa il protocollo.
4. Invocare con `2026-09`: zero record e nessuna assenza dedotta. Con `2026-13`: errore, nessun successo dichiarato.
5. Seguire “Check navigation cleanup”: il tool deve scomparire. Tornare: un solo tool, nuovamente invocabile. Ripetere dopo reload.

## Evidenze raccolte

| Verifica | Risultato osservato |
| --- | --- |
| `npm test` | 3 test passati: pause/incomplete, mese vuoto, input malformati/campi extra |
| `npm run typecheck` | Passato |
| `npm run build` | Passata; `/` e `/about` prerenderizzate, nessun errore SSR |
| Codex In-app Browser, UA Chrome/151.0.0.0, sviluppo `127.0.0.1:3100` | Notifica di scoperta di un solo tool; invocazione tramite capacità WebMCP del browser, non chiamata diretta alla funzione |
| Input agosto + confronto manuale | 1410 minuti, 23.5 ore, 3 complete, 26 agosto incompleto; pannello agente aggiornato |
| Input settembre | Zero record/ore, lista incomplete vuota |
| Input mese 13 | Errore di validazione ricevuto dal client WebMCP |
| Navigazione `/` → `/about` → `/` | Notifica tool rimosso, poi un solo tool registrato; nuova invocazione riuscita |
| Build di produzione, `127.0.0.1:3101`, browser Codex | Scoperta e invocazione agosto riuscite, pannello aggiornato; registrazione presente dopo reload |
| Log browser Codex consultati | Nessun warning/errore console nelle prove riportate |
| Chrome esterno, UA Chrome/152.0.0.0, produzione locale | API assente; messaggio unsupported corretto; calcolo manuale riuscito |

Le chiamate positive sono state effettuate dall'agente tramite il tool scoperto dal browser. Non è stata provata una conversazione separata nell'app ChatGPT. Gli UA indicano la versione dichiarata dal browser, non identificano da soli la sua implementazione WebMCP.

## Cosa resta prima di chiudere il gate

- Abilitare il flag nel Chrome previsto, riavviare e ripetere scoperta/invocazione/lifecycle; in alternativa effettuare la prova nel browser dell'app ChatGPT.
- Dopo il primo deploy, ripetere sull'URL HTTPS reale: localhost non verifica hosting, header e accesso dei giudici.
- Solo nel passo successivo introdurre sessione e dati server. La lettura hardcoded non valida sicurezza, persistenza né flussi HR.
