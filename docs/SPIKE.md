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

La tabella riporta l'ambiente della prima prova. Dopo il merge del setup in ingresso, il package manager è pnpm `10.33.3` con [pnpm-lock.yaml](../pnpm-lock.yaml); TypeScript è fissato a `5.9.3`, compatibile con il parser ESLint in ingresso (peer `<6.1.0`). Le versioni correnti sono in [package.json](../package.json). Il campo engines di Next.js richiede Node >=20.9; non è una dichiarazione di compatibilità WebMCP di ogni browser supportato da Next.js.

La [guida imperativa Chrome](https://developer.chrome.com/docs/ai/webmcp/imperative-api) conferma `document.modelContext.registerTool`, cleanup tramite `AbortSignal` e il pacchetto `webmcp-types`. I suoi tipi sono dichiarazioni globali, inclusi tramite [src/webmcp.d.ts](../src/webmcp.d.ts): non sono un modulo runtime né un polyfill. L'app non emula WebMCP quando manca.

I file AGENTS.md e CLAUDE.md sono stati generati da `next dev`; indicano di consultare la documentazione della versione installata. Verificate le guide locali installation, layouts-and-pages e use-client sotto `node_modules/next/dist/docs`.

## Perimetro effettivo

- [attendance.ts](../src/lib/attendance.ts): array sintetico e calcolo condiviso da UI/tool.
- [attendance-spike.tsx](../src/components/attendance-spike.tsx): componente client, rilevamento API, registrazione, input schema, output JSON serializzato, diagnostica e cleanup all'unmount.
- `/about`: pagina senza tool per provare la navigazione Next.js.
- Nessun auth, database, endpoint remoto, chiave API, dato personale, upload o persistenza. Tutti i dati sono pubblici nel bundle client; non sostituirli con presenze reali.
- La prima prova non richiedeva un design system o una chat. Il merge successivo conserva Tailwind e l'Overview statica in `/overview`, isolata dagli stili dello spike. L'agente rimane quello del browser.

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

La preparazione Coolify, i comandi Docker e la checklist HTTPS sono in [DEPLOY.md](DEPLOY.md). Nessun dominio pubblico è stato configurato da questa preparazione.

## Verifica dopo il merge del setup iniziale

31 agosto 2026: `pnpm lint`, `pnpm typecheck`, `pnpm test` (3/3) e `pnpm build` passati. Installazione con `--frozen-lockfile --offline --ignore-scripts` coerente con il lockfile. Sulla build locale `127.0.0.1:3102`, browser Codex: tool scoperto e invocato con risultato 23.5 ore; navigazione verso `/overview` rimuove il tool, ritorno a `/` lo registra una sola volta. Overview e spike controllati visivamente con stili separati. Questa verifica non chiude la prova Chrome con flag né il deploy HTTPS.

## Preparazione Docker / Coolify

31 agosto 2026: output Next.js standalone, Dockerfile multi-stage, contesto di build limitato agli input necessari e route `/healthz`. Node base bloccato per digest; nessuna dipendenza applicativa aggiunta.

- Host macOS / Node 26.7.0: `pnpm lint`, `pnpm test` (3/3), `pnpm build` e `pnpm typecheck` passati.
- Immagine `crewboard:spike`: build Linux ARM64 riuscita, Node 24.20.0, utente `node`, circa 286 MB non compressi. L'architettura del futuro server Hetzner non è stata verificata.
- Container locale `127.0.0.1:3103`: stato Docker `healthy`; `/healthz` restituisce 200, `{"status":"ok"}` e `Cache-Control: no-store`. `/about`, `/overview` e asset pubblico `/next.svg`: HTTP 200.
- Browser integrato Codex sul container: scoperta e invocazione WebMCP reali; agosto restituisce 1410 minuti / 23.5 ore, tre giornate complete, 26 agosto incompleto; pannello JSON coerente e contatore a 1. Settembre restituisce zero record; mese 13 rifiutato; navigazione a `/about` rimuove il tool, ritorno a `/` registra un solo tool nuovamente invocabile.
- Immagine locale verificata: `sha256:894a3a4e2e0e0b882fd9cba7d83aa018fa6c45f213f6bf8ed307e7816c392b96`. Non pubblicata su un registry.

Queste prove non attestano DNS/TLS, reverse proxy Coolify, compatibilità del server remoto né esecuzione nel browser ChatGPT/Chrome richiesto. Il gate challenge resta aperto.
