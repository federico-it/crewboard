# Presenze persistenti — primo flusso completo

Aggiornato il 1 settembre 2026. Ambito: login demo, presenze personali, correzione dalla UI e rilettura tramite WebMCP. Ferie, ruoli manager/admin e file R2 rimangono fuori da questa implementazione.

## Percorso e regole

`/` → `/attendance` → `/login` se manca la sessione. Better Auth gestisce password scrypt e sessioni DB di otto ore, senza cache della sessione nel cookie. Solo sign-in, get-session e sign-out sono esposti; signup, cambio password e modifica account non sono pubblici per gli account demo condivisi.

`/api/attendance` controlla sessione, dipendente attivo e contesto della pagina. Un header lega le richieste alla sessione che ha aperto la pagina: una vecchia scheda non può operare con il cookie di un altro login. Questo identificativo non sostituisce il cookie né l'autorizzazione sul server. Il tool non accetta ID utente/dipendente/organizzazione. Non esistono letture di team in questa fase.

Le query sono limitate al dipendente ricavato dalla sessione. Ogni dipendente appartiene a un'organizzazione; gli account di colleghi e altre organizzazioni ricevono soltanto i propri record. Questo non è ancora un modello di permessi manager/admin.

UI e agente leggono lo stesso endpoint e la stessa funzione di dominio server. Il tool è registrato solo nella pagina presenze; cleanup su navigazione/logout. Una sessione scaduta o cambiata blocca anche la chiamata server e disconnette la UI alla risposta. Nessun fallback a dati hardcoded in caso di errore DB.

- Data organizzativa e orari locali separati; seed Europe/Rome.
- Un solo turno giornaliero. `end = null` significa incompleto e non contribuisce al totale ore.
- Fine successiva all'inizio; pausa intera non negativa e più breve del turno completo.
- Date senza record non sono assenze. Turni notturni e differenze di tempo dovute all'ora legale non sono modellati.
- Scritture solo dalla UI, con JSON validato e controllo Origin. Campi extra rifiutati.
- Versione 0 per un nuovo record; versione esistente per una correzione. Aggiornamenti atomici con confronto versione; un conflitto o retry obsoleto restituisce 409, senza sovrascrittura.
- Le risposte personali sono `private, no-store`. Errori DB restituiti in modo generico, senza SQL o credenziali.

## Dati demo e ripristino

Il seed CLI richiede `DEMO_SEED_ENABLED=true` e `DEMO_PASSWORD`; usa organizzazioni esplicitamente marcate demo. Alex ha le quattro giornate della fixture originale; Sam e Robin hanno un solo record di due ore, rispettivamente nella stessa organizzazione e in un'altra.

Il seed è idempotente: non sovrascrive password, sessioni o correzioni esistenti. Non esiste un endpoint pubblico di reset. Per ripetere il copione, svuotare manualmente l'ora di fine del 26 agosto di Alex. Per ripartire da zero usare un nuovo database demo, senza cancellare un database condiviso.

## Criterio di accettazione

1. Login Alex, agosto: 1410 minuti, 3 giorni completi, incompleto `2026-08-26`.
2. Chiamata reale `get_attendance_summary({"month":"2026-08"})`: `source: database`, risultato coerente e contatore incrementato.
3. Modifica 26 agosto dalla UI: inizio 09:00, fine 18:00, pausa 60.
4. UI, reload e nuova chiamata: 1890 minuti (31.5 ore), 4 giorni completi, elenco incomplete vuoto.
5. Sam e Robin vedono ancora soltanto due ore. Logout rende inutilizzabile il vecchio cookie; una sessione scaduta o un dipendente disattivato non legge/scrive.
6. Annullare l'editor non modifica i record; due scritture con la stessa versione non vengono entrambe applicate.

## Verifiche di questa implementazione

- Migrazioni applicate al PostgreSQL locale, incluso l'issuer richiesto dagli account Better Auth 1.7.
- Seed eseguito due volte: nessuna sovrascrittura o duplicazione.
- Build Next.js/Turbopack corrente completata nel target Docker Node 24; lint, TypeScript e 5 test unitari passati, inclusi calcolo della correzione e input invalidi. Anche il target operations con migrazioni e seed è stato costruito.
- Test d'integrazione in-process contro PostgreSQL passato: login, persistenza e ripristino del 26 agosto, isolamento fra dipendenti/organizzazioni, CSRF, payload con ID arbitrari, conflitti, logout, sessione scaduta e dipendente disattivato.
- Prova HTTP e prova UI/WebMCP nel browser: **ancora da eseguire**. L'avvio del server di prova locale è stato rifiutato durante questa sessione; non presentare il percorso browser come verificato finché queste prove non passano.
- Deploy del nuovo flusso e verifica HTTPS: non eseguiti.

Il test `pnpm test:integration` usa direttamente i route handler e richiede solo il DB locale; `pnpm test:http` richiede anche un server locale a `TEST_BASE_URL`. Entrambi modificano e ripristinano il solo 26 agosto di Alex, disattivano/riattivano Robin e creano/rimuovono le proprie sessioni test. Richiedono la fixture iniziale nelle altre date: non usarli su un database condiviso con prove manuali in corso. Non contengono reset generali o credenziali hardcoded.

## Limiti operativi

La protezione anti-abuso di Better Auth è in memoria per istanza: il deploy demo previsto è a singola istanza; prima di scalare servono limiti condivisi. Il reverse proxy deve inoltre fornire un header IP fidato e Better Auth va configurato con gli header o proxy realmente controllati dall'infrastruttura; non accettare alla cieca `X-Forwarded-For` da Internet. `/healthz` resta un controllo del solo processo. R2, gestione dipendenti, audit delle modifiche, ferie, MFA e recupero password non sono implementati.
