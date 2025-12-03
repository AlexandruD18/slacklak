# Slack-Clone Backend - PRD

**Versione:** 1.0  
**Data:** 19/11/2025  
**Autore:** Team di sviluppo  
**Revisori:** Da definire  
**Stato:** Bozza

---

## 1. Overview

**Descrizione sintetica:**  
Creare il backend di un’app di messaggistica in tempo reale simile a Slack, con supporto per:

- Canali pubblici e privati
- Messaggi diretti
- Presenza utenti
- Persistenza della cronologia chat
- Scalabilità per supportare molti utenti e workspace

**Obiettivo principale:**  
Fornire un backend solido e scalabile per:

- Gestione comunicazioni real-time via WebSocket
- Memorizzazione dei messaggi
- Gestione presenza utenti
- Creazione e gestione di workspace e canali

**Benefici attesi:**

- App di chat veloce e reattiva come Slack
- Storico delle conversazioni persistente
- Scalabilità per molti utenti/workspace
- Architettura modulare per future estensioni (bot, integrazioni, notifiche)

---

## 2. Problem Statement

**Contesto attuale:**  
Attualmente non esiste un backend strutturato per chat in real-time con supporto a cronologia persistente, presenza utenti e scalabilità multi-workspace.

**Problemi specifici:**

- **Real-time inefficiente:** i messaggi potrebbero non arrivare istantaneamente
- **Persistenza debole o assente:** le conversazioni si perdono senza database affidabile
- **Scalabilità limitata:** backend non progettati per gestire molti canali/utenti contemporaneamente

**Soluzione proposta:**

- WebSocket per comunicazione real-time
- Persistenza su database relazionale o NoSQL
- Pub/Sub (es. Redis) per distribuire messaggi tra istanze
- Architettura distribuita: sharding per workspace, server dedicati per real-time, gateway server

---

## 3. Goals & Success Metrics

| Obiettivo            | KPI / Metrica di successo                    | Target                                       |
| -------------------- | -------------------------------------------- | -------------------------------------------- |
| Real-time messaging  | Latenza media messaggio → client             | < 200 ms per messaggio in canale attivo      |
| Persistenza messaggi | Percentuale di messaggi salvati con successo | ≥ 99,9 %                                     |
| Scalabilità utenti   | Numero di connessioni WebSocket simultanee   | ≥ 100.000 utenti connessi contemporaneamente |
| Uptime               | Disponibilità del servizio backend           | ≥ 99,9% su 30 giorni                         |

---

## 4. User Personas

| Persona                         | Esigenza principale            | Scenario d’uso                                                          |
| ------------------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| Utente Team                     | Comunicare con colleghi        | Si connette, scrive messaggi nei canali, riceve risposte in tempo reale |
| Amministratore Workspace        | Gestire canali e utenti        | Crea nuovi canali, invita/rimuove utenti, assegna ruoli                 |
| Sviluppatore bot / integrazione | Automatizzare task e notifiche | Usa API o WebSocket per inviare messaggi bot o integrazioni esterne     |

---

## 5. Functional Requirements

| ID    | Titolo                | Descrizione                                              | Priorità |
| ----- | --------------------- | -------------------------------------------------------- | -------- |
| RF-01 | Autenticazione utente | Login/logout, registrazione, token JWT                   | Alta     |
| RF-02 | Workspace & Canali    | Creazione e gestione workspace e canali pubblici/privati | Alta     |
| RF-03 | Invio messaggi        | Inviare messaggi nei canali o chat private               | Alta     |
| RF-04 | Real-time evento      | Notificare in real-time i messaggi via WebSocket         | Alta     |
| RF-05 | Persistenza messaggi  | Salvare i messaggi su database per storicizzazione       | Alta     |
| RF-06 | Presenza utenti       | Tracciare utenti online/offline, inviare aggiornamenti   | Media    |
| RF-07 | Typing indicator      | Notificare quando un utente sta scrivendo                | Media    |
| RF-08 | Recupero cronologia   | Permettere al client di richiedere cronologia messaggi   | Alta     |

**Note aggiuntive:**

- Messaggi pubblicati su sistema di broadcast (es. Redis Pub/Sub) per inviarli a tutte le istanze.
- Supporto reconnect: recupero cronologia recente per client disconnessi.

---

## 6. Non-Functional Requirements

| ID     | Categoria    | Descrizione                                                                |
| ------ | ------------ | -------------------------------------------------------------------------- |
| RNF-01 | Scalabilità  | Sharding per workspace, più istanze real-time, load balancing              |
| RNF-02 | Affidabilità | Retry, fallback, queueing per messaggi non persistiti                      |
| RNF-03 | Performance  | Latenza WebSocket <200 ms, API REST rapide                                 |
| RNF-04 | Sicurezza    | Autenticazione token, autorizzazione, cifratura dati sensibili, TLS        |
| RNF-05 | Usabilità    | API semplici, documentazione chiara, gestione errori, protocollo WebSocket |

---

## 7. Architecture Overview

**High-Level Components:**

- **Client:** connessione WebSocket per eventi real-time
- **Gateway Server (GS):** mantiene connessioni WebSocket, gestisce sottoscrizioni ai canali
- **Message Server / Channel Server (CS):** mantiene stato dei canali in memoria, broadcast su GS
- **API Server:** REST API per autenticazione, invio messaggi, gestione workspace/canali
- **Database:** MySQL/Postgres per utenti, workspace, messaggi, canali
- **Pub/Sub Layer:** Redis per propagazione eventi real-time
- **Presence Server:** traccia stato online/offline utenti
- **Load Balancer / Envoy:** bilancia traffico WebSocket e API, TLS termination

**Diagramma concettuale (mock-up):**

---

## 8. Dependencies

| Servizio / Tecnologia | Descrizione                              | Note                                       |
| --------------------- | ---------------------------------------- | ------------------------------------------ |
| Redis                 | Pub/Sub per broadcast messaggi real-time | Configurare alte prestazioni e persistenza |
| WebSocket library     | Gestione connessioni real-time           | Socket.IO o WebSocket nativo               |
| Database relazionale  | Persistenza messaggi, utenti, canali     | MySQL/PostgreSQL                           |
| Load Balancer / Envoy | Gestione traffico WebSocket e API        | TLS termination, failover, bilanciamento   |
| Service discovery     | Scoprire nodi GS/CS                      | Consul o equivalente                       |

---

## 9. Risks & Mitigations

| Rischio                             | Impatto    | Mitigazione                                            |
| ----------------------------------- | ---------- | ------------------------------------------------------ |
| Connessioni WebSocket elevate       | Alto       | Scalare GS, load balancing, oversharding, monitoraggio |
| Perdita messaggi per failure        | Alto       | Persistenza immediata, retry, queueing                 |
| Consistenza dati multi-istanza      | Medio      | Sincronizzazione, Pub/Sub, sharding workspace          |
| Sicurezza / accessi non autorizzati | Medio/Alto | Token auth, autorizzazioni, TLS                        |
| Latenza geografica                  | Medio      | GS in più regioni, deploy multi-region                 |

---

## 10. Milestones

| Fase | Descrizione                                              | Scadenza     |
| ---- | -------------------------------------------------------- | ------------ |
| 1    | Configurazione ambiente + prototipo WebSocket + API base | 4 settimane  |
| 2    | Persistenza messaggi + Pub/Sub integrato                 | 8 settimane  |
| 3    | Gestione workspace / canali / utenti                     | 12 settimane |
| 4    | Presenza utente & typing indicator                       | 16 settimane |
| 5    | Test di carico, ottimizzazione, CI/CD                    | 20 settimane |
| 6    | Rilascio beta, monitoraggio real-world                   | 24 settimane |

---

## 11. Future Enhancements

- Bot & integrazioni (API per app esterne)
- File upload e condivisione
- Thread / conversazioni annidate
- Notifiche push su mobile
- Crittografia end-to-end
- Ricerca messaggi (per canale, utente, testo)

---

## 12. Appendici

- Diagrammi dettagliati: sequence diagram, deployment diagram
- Mock-up API contract (request/response JSON)
- Schema DB: tabelle utenti, canali, messaggi, presenza
- Documentazione WebSocket: eventi (`new_message`, `user_joined`, `presence_update`, `typing_start/stop`, …)
