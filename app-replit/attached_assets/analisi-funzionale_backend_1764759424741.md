# Documento di Analisi Funzionale (DAF)

**Titolo progetto:** Slack-Clone Backend  
**Versione:** 1.0  
**Data:** 19/11/2025  
**Autore:** Team di sviluppo  
**Revisori:** Da definire  
**Stato:** Bozza

---

## 1. Introduzione

### Scopo del documento

Questo documento descrive l’analisi funzionale per la realizzazione del backend di un’app di messaggistica in tempo reale, simile a Slack. L’obiettivo è definire i requisiti funzionali e non funzionali, gli attori, i casi d’uso, i vincoli e i rischi, oltre a delineare un’architettura iniziale.

### Ambito del progetto

Il progetto include la realizzazione del backend per supportare:

- Workspace
- Canali
- Messaggi in tempo reale
- Messaggi diretti
- Storicizzazione dei messaggi
- Gestione della presenza
- Riconnessione dei client

**Non incluso (prima fase):**

- Interfacce client (mobile/web)
- Bot esterni complessi
- Crittografia end-to-end
- Upload di file
- Notifiche push su mobile

### Glossario

- **Workspace:** spazio di lavoro isolato, con i propri canali e utenti.
- **Canale:** chat di gruppo all’interno di un workspace, pubblico o privato.
- **WebSocket:** connessione bidirezionale persistente tra client e server.
- **Pub/Sub:** sistema publish-subscribe per distribuire messaggi tra istanze di backend.
- **Channel Server (CS):** mantiene lo stato in memoria per i canali e gestisce il broadcast real-time.
- **Gateway Server (GS):** mantiene connessioni WebSocket, sottoscrizioni, e funge da ingresso real-time.
- **Presence Server (PS):** traccia lo stato online/offline degli utenti.

---

## 2. Contesto e Problematiche

### Contesto attuale

Non esiste un backend strutturato per un’app clone di Slack. Senza una base solida, le chat risultano fragili, con scarsa persistenza storica, scarsa scalabilità e alta latenza.

### Problemi / criticità

- **Real-time inefficiente:** i messaggi possono non arrivare istantaneamente agli altri utenti.
- **Persistenza debole:** rischio di perdita dei messaggi storici.
- **Scalabilità limitata:** un singolo server non basta per molti workspace/utenti.
- **Presenza e riconnessione:** necessità di gestire stato online/offline e recupero dei messaggi.
- **Sicurezza e autorizzazioni:** solo utenti autorizzati devono accedere a workspace e canali.

### Obiettivi funzionali principali

- Messaggistica in tempo reale via WebSocket e broadcast efficiente.
- Persistenza storica dei messaggi su database.
- Gestione dello stato di presenza utenti (online/offline).
- Supporto a workspace multipli e canali con permessi.
- API REST per gestione utenti, autenticazione, cronologia e canali.

---

## 3. Requisiti Funzionali

| ID    | Funzionalità                 | Descrizione dettagliata                                                             | Priorità    |
| ----- | ---------------------------- | ----------------------------------------------------------------------------------- | ----------- |
| RF-01 | Autenticazione utente        | Registrazione, login, logout, generazione JWT per autenticazione sicura             | Alta        |
| RF-02 | Workspace e Canali           | Creazione e gestione workspace e canali (pubblici/privati), modifica, cancellazione | Alta        |
| RF-03 | Invio messaggi               | Invio messaggi nei canali o chat private                                            | Alta        |
| RF-04 | Real-time evento             | Notifica in tempo reale dei messaggi ai client via WebSocket                        | Alta        |
| RF-05 | Persistenza messaggi         | Salvataggio messaggi su database per storicizzazione e recupero                     | Alta        |
| RF-06 | Presenza utenti              | Tracciamento stato online/offline, aggiornamenti di presenza                        | Media       |
| RF-07 | Typing indicator             | Notifica quando un utente sta scrivendo (“user is typing”)                          | Bassa/Media |
| RF-08 | Recupero cronologia messaggi | Richiesta dello storico dei messaggi di un canale o chat privata                    | Alta        |

**Note:**

- I messaggi devono essere pubblicati su un sistema Pub/Sub (es. Redis) per distribuire il contenuto tra tutte le istanze WebSocket attive.
- Supporto alla riconnessione dei client: recupero cronologia recente e stato del canale.

---

## 4. Requisiti Non Funzionali

| ID     | Categoria      | Descrizione                                                                       |
| ------ | -------------- | --------------------------------------------------------------------------------- |
| RNF-01 | Scalabilità    | Architettura sharding per workspace, più istanze server real-time, load balancing |
| RNF-02 | Affidabilità   | Gestione retry, code se DB occupato, fallback in caso di failure                  |
| RNF-03 | Performance    | Latenza WebSocket < 200 ms, API REST veloci                                       |
| RNF-04 | Sicurezza      | Autenticazione JWT, autorizzazioni, TLS, protezione WebSocket                     |
| RNF-05 | Usabilità      | API documentate, error handling strutturato, protocollo WebSocket chiaro          |
| RNF-06 | Disponibilità  | Uptime ≥ 99,9% su 30 giorni                                                       |
| RNF-07 | Manutenibilità | Architettura modulare, logging, monitoring                                        |

---

## 5. Attori e Use Case

### Attori principali

- **Utente Team:** partecipa a workspace e canali.
- **Amministratore Workspace:** crea canali, invita utenti, gestisce permessi.
- **Sviluppatore Bot / Integrazione:** utilizza API per messaggi automatici o integrazione con servizi esterni.

### Casi d’uso principali

**UC-01: Login / Registrazione**

- Attore: Utente Team / Amministratore
- Descrizione: Registrazione o login, ricezione token di autenticazione, sessione attiva
- Requisiti correlati: RF-01

**UC-02: Creazione Workspace e Canali**

- Attore: Amministratore Workspace
- Descrizione: Creazione workspace, aggiunta utenti, creazione canali (pubblici/privati)
- Requisiti correlati: RF-02

**UC-03: Invio e Ricezione Messaggi in Tempo Reale**

- Attore: Utente Team
- Descrizione: Invio messaggio in canale o chat privata, persistenza e broadcast via WebSocket
- Requisiti correlati: RF-03, RF-04, RF-05

**UC-04: Visualizzazione Cronologia Messaggi**

- Attore: Utente Team
- Descrizione: Recupero storico messaggi di canale o chat privata
- Requisiti correlati: RF-08, RF-05

**UC-05: Presenza Utenti**

- Attore: Utente Team
- Descrizione: Visualizzazione stato online/offline, aggiornamenti via WebSocket
- Requisiti correlati: RF-06

**UC-06: Typing Indicator**

- Attore: Utente Team
- Descrizione: Notifica “typing” agli altri utenti del canale
- Requisiti correlati: RF-07

---

## 6. Vincoli e Dipendenze

| Vincolo / Dipendenza          | Descrizione                                     | Note                                             |
| ----------------------------- | ----------------------------------------------- | ------------------------------------------------ |
| Redis Pub/Sub                 | Broadcast messaggi real-time tra server         | Alta disponibilità e bassa latenza               |
| Database relazionale          | Persistenza messaggi, utenti, workspace, canali | Postgres o MySQL                                 |
| WebSocket library / Framework | Gestione connessioni real-time                  | Socket.IO o WebSocket nativo                     |
| Load Balancer / Envoy         | Distribuzione traffico WebSocket e REST         | Include TLS termination                          |
| Service Discovery             | Registrazione istanze GS, CS, PS                | Consul o simili per ring hashing / bilanciamento |

---

## 7. Rischi e Assunzioni

| Rischio / Assunzione                       | Impatto    | Mitigazione / Nota                                                |
| ------------------------------------------ | ---------- | ----------------------------------------------------------------- |
| Sovraccarico di connessioni WebSocket      | Alto       | Scalare GS orizzontalmente, load balancing, oversharding          |
| Perdita messaggi                           | Alto       | Persistenza immediata, retry, code/queueing (Kafka-like)          |
| Consistenza dati tra istanze               | Medio      | Pub/Sub per sincronizzazione, sharding per workspace/canali       |
| Sicurezza / accessi non autorizzati        | Medio/Alto | JWT, autorizzazioni, TLS, validazione input                       |
| Latenza elevata in regioni geografiche     | Medio      | Deploy multi-regione, GS distribuiti, cluster globali             |
| Assunzione: Client stabile e riconnessione | –          | Client deve gestire riconnessione WebSocket e recupero cronologia |

---

## 8. Architettura Concettuale (High-Level)

**Client**

- Web/Mobile: connessione WebSocket per eventi real-time, API REST per operazioni non real-time.

**Gateway Server (GS)**

- Mantiene connessioni WebSocket, gestisce sottoscrizioni, pubblica messaggi su Pub/Sub.

**Channel Server (CS)**

- Stateful, mantiene storia recente in memoria.
- Hashing coerente per mappare canali a istanze CS.
- Inoltra messaggi ai client connessi.

**API Server**

- Espone REST API per autenticazione, gestione workspace/canali, invio messaggi, recupero cronologia.
- Interagisce con DB per persistenza.

**Database**

- Relazionale (Postgres/MySQL) per utenti, workspace, canali, messaggi storici.

**Pub/Sub Layer**

- Redis o sistema simile per distribuire messaggi tra GS/CS.

**Presence Server (PS)**

- Traccia stato online/offline e invia eventi ai GS per notifica ai client.

**Load Balancer / Envoy**

- Bilancia traffico WebSocket e REST, gestisce TLS.

**Service Discovery**

- Permette GS, CS, PS di scoprire le istanze, utilizza hashing coerente (CHARMs).

---

## 9. Rischi Tecnici & Strategie di Mitigazione

- Sovraccarico GS: monitoraggio connessioni, autoscaling, alert.
- Durabilità messaggi: code persistenti, retry automatici (Kafka-like).
- Fallimento CS: hashing coerente, riconfigurazione canali su CS attivi.
- Sicurezza: TLS, JWT, autorizzazioni, validazione input.
- Latenza geografica: GS multi-regione, caching locale, minimizzare round-trip.

---

## 10. Milestones / Roadmap

| Fase | Descrizione                                                | Durata stimata           |
| ---- | ---------------------------------------------------------- | ------------------------ |
| 1    | Setup ambiente + prototipo WebSocket + API di base (login) | ~4 settimane             |
| 2    | Persistenza messaggi + integrazione Pub/Sub + broadcast    | +4 settimane (totale 8)  |
| 3    | Gestione workspace/canali/utenti (API e DB)                | +4 settimane (totale 12) |
| 4    | Implementazione presenza utenti + typing indicator         | +4 settimane (totale 16) |
| 5    | Test di carico, resilienza, ottimizzazione, CI/CD          | +4 settimane (totale 20) |
| 6    | Beta release, monitoraggio real-world, bugfix              | +4 settimane (totale 24) |

---

## 11. Future Enhancements (Evoluzioni)

- Bot e integrazioni esterne
- File upload e condivisione (S3/MinIO)
- Thread / conversazioni annidate
- Notifiche push mobile
- Crittografia end-to-end
- Ricerca messaggi avanzata
- Caching geo-distribuito dello stato workspace

---

## 12. Allegati / Appendici

- Diagrammi dei processi (sequence diagram invio messaggio, riconnessione, cronologia, presenza)
- Mockup / wireframe protocollo WebSocket (message:new, presence:update, typing:start/stop)
- Workflow autenticazione e handshake WebSocket
- Schema DB (utenti, workspace, canali, messaggi, presenze)
- Documentazione API / WebSocket (esempi JSON request/response)

---

### Considerazioni basate su Slack reale

- Slack usa CS in-memory per storia recente e broadcast real-time.
- GS multi-regione per minimizzare latenza.
- Sistema Pub/Sub per broadcast messaggi (topic per canale).
- Code persistenti / retry per durabilità messaggi (Kafka-like).
- Presence Server dedicato per stato online/offline
