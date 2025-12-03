# Documento di Analisi Tecnica (DAT)

## Titolo progetto: Slack-Clone Backend

**Versione:** 1.0  
**Data:** 19/11/2025  
**Autore:** Team di sviluppo  
**Revisori:** Da definire  
**Stato:** Bozza

---

## 1. Introduzione

### Scopo del documento

Questo documento definisce le specifiche tecniche necessarie per progettare, implementare e distribuire il backend di un’app di messaggistica in tempo reale simile a Slack. Include linee guida architetturali, modelli dati, protocolli, requisiti tecnici, integrazioni e strategie di scalabilità.

### Ambito del documento

Il documento copre:

- Architettura backend (Gateway Server, Channel Server, API Server, Presence Server).
- Scelta delle tecnologie.
- Requisiti tecnici funzionali e non.
- Schema DB e storage.
- API REST e protocolli WebSocket.
- Deployment, sicurezza, scalabilità e monitoring.

Non copre:

- UI/UX dei client web/mobile.
- Bot esterni complessi.
- End-to-end encryption (solo potenziale estensione futura).
- Notifiche push su mobile.

### Glossario tecnico

| Termine              | Definizione                                                                |
| -------------------- | -------------------------------------------------------------------------- |
| WS / WebSocket       | Connessione bidirezionale persistente per eventi real-time.                |
| GS – Gateway Server  | Server frontalieri che mantengono connessioni WebSocket con i client.      |
| CS – Channel Server  | Server stateful che gestiscono canali e broadcast real-time.               |
| PS – Presence Server | Server dedicato allo stato online/offline degli utenti.                    |
| Pub/Sub              | Layer di messaggistica per la propagazione eventi tra istanze (es. Redis). |
| JWT                  | Token di autenticazione firmato.                                           |
| Sharding             | Distribuzione dei canali/workspace su diversi server CS.                   |

## 2. Architettura di Sistema

### Descrizione generale

L’architettura segue un modello multi-servizio scalabile, ispirato a Slack:

- Client → connessione WebSocket + API REST.
- Gateway Server (GS) → riceve e invia eventi real-time.
- Channel Server (CS) → gestisce canali, buffer short-term, broadcast.
- API Server → espone endpoint REST.
- Presence Server (PS) → gestisce lo stato degli utenti.
- Database relazionale → persistente.
- Redis Pub/Sub → distribuzione eventi tra GS/CS e sincronizzazione.
- Load Balancer / Envoy → bilanciamento WebSocket e API.
- Service Discovery → registry dei nodi GS/CS per hashing coerente.

### Diagrammi (testuali)

#### Diagramma architettura logica (descrizione)

Client Web/Mobile → Load Balancer → [ Gateway Server (WS) ]
↓ Pub/Sub
[ Channel Server ] ←→ [ API Server ] ←→ Database
↓
Presence Server

### Componenti principali

| Componente      | Descrizione                                         | Tecnologie / Tool                               | Responsabile     |
| --------------- | --------------------------------------------------- | ----------------------------------------------- | ---------------- |
| Gateway Server  | Gestisce WebSocket, sottoscrizioni, invio eventi    | Node.js / Go, ws / uWebSockets, Redis Client    | Team Backend     |
| Channel Server  | Stateful, mappa canali → istanze, broadcast, buffer | Go / Node.js, Redis Pub/Sub, Consistent Hashing | Team Backend     |
| API Server      | Autenticazione, CRUD canali/workspace, messaggi     | Node.js (NestJS) / Go, PostgreSQL               | Team Backend     |
| Presence Server | Traccia online/offline utenti e notifica GS         | Go / Node.js, Redis Streams / PubSub            | Team Backend     |
| Database        | Persistenza messaggi e strutture                    | PostgreSQL                                      | DevOps + Backend |
| Pub/Sub         | Broadcast real-time                                 | Redis                                           | DevOps           |
| Load Balancer   | Bilanciamento WS e HTTP, TLS termination            | Envoy / Nginx                                   | DevOps           |

## 3. Requisiti Tecnici

### Requisiti funzionali tecnici

| ID    | Requisito               | Descrizione tecnica                                               | Priorità |
| ----- | ----------------------- | ----------------------------------------------------------------- | -------- |
| RT-01 | WebSocket server        | GS mantiene connessioni persistent, heartbeat, reconnection token | Alta     |
| RT-02 | Broadcast real-time     | CS pubblica su Redis topic → GS iscritti → client                 | Alta     |
| RT-03 | Persistenza messaggi    | Inserimento atomico messaggi con timestamp monotonic              | Alta     |
| RT-04 | Sharding canali         | Hashing coerente per assegnare i canali a CS                      | Alta     |
| RT-05 | Presence system         | Aggiornamenti presence push ogni cambio stato                     | Media    |
| RT-06 | Typing indicator        | Eventi WS temporanei → no persistenza                             | Media    |
| RT-07 | Recovery post-reconnect | Recupero messaggi recenti da DB o buffer in-memory dei CS         | Alta     |

### Requisiti non funzionali tecnici

| ID     | Categoria    | Descrizione                          | Target               |
| ------ | ------------ | ------------------------------------ | -------------------- |
| RNT-01 | Performance  | Latenza WS dal GS al client < 200 ms |                      |
| RNT-02 | Scalabilità  | WS simultanei ≥ 100k                 |                      |
| RNT-03 | Sicurezza    | JWT, TLS, RBAC canali                | AES-256 at rest      |
| RNT-04 | Affidabilità | Failover istanze GS e CS             | ≥ 99,9% uptime       |
| RNT-05 | Logging      | Audit + tracing (OpenTelemetry)      | Log strutturati JSON |

## 4. Database e Storage

### Modelli dati (principali)

- User(id, email, password_hash, name, created_at)
- Workspace(id, name, created_at)
- WorkspaceMember(user_id, workspace_id, role)
- Channel(id, workspace_id, name, type, created_at)
- ChannelMember(channel_id, user_id)
- Message(id, channel_id OR direct_message_id, sender_id, body, created_at)
- Presence(user_id, status, last_seen) → opzionale su Redis

### Policy di storage

| Tipo dati                 | Persistenza         | Retention                |
| ------------------------- | ------------------- | ------------------------ |
| Messaggi                  | PostgreSQL          | infinito o configurabile |
| Presenza                  | In-memory + Redis   | 24–48h                   |
| Cronologia recente canali | CS in-memory buffer | 100–500 messaggi         |

## 5. API e Integrazioni

### Servizi interni

| API Endpoint      | Protocollo         | Autenticazione |
| ----------------- | ------------------ | -------------- | --- |
| Auth Service      | POST /auth/login   | REST           | –   |
| Workspace Service | POST /workspace    | REST           | JWT |
| Channel Service   | POST /channel      | REST           | JWT |
| Message Service   | POST /message      | REST + WS      | JWT |
| Presence Service  | WS presence:update | WebSocket      | JWT |

### Protocolli WebSocket (eventi)

- message:new
- presence:update
- typing:start
- typing:stop
- channel:joined
- error

### Servizi esterni (opzionali)

- CDN/File storage (S3/MinIO) — futuro
- Kafka (per durabilità avanzata) — futuro

## 6. Sicurezza e Compliance

- Autenticazione JWT con refresh token opzionale.
- Autorizzazione: RBAC per workspace e canali privati.
- TLS obbligatorio su WS e REST.
- Password hashing: Argon2.
- Input validation su ogni endpoint.
- Logging audit su accessi sensibili.

### GDPR:

- Dati utenti minimizzati.
- Possibile cancellazione messaggi su richiesta.

## 7. Performance e Scalabilità

### Obiettivi

- 100k+ WebSocket attivi.
- Latenza < 200 ms su broadcast.
- Throughput: 10k messaggi/sec.

### Strategie

- Sharding canali tramite anelli di hashing coerente (CHARM-like).
- Redis Pub/Sub altamente ottimizzato.
- Buffer in-memory nei CS.
- Caching frequente per presenze e canali.
- Load balancing su GS con sticky-sessions.

### Monitoraggio

- Prometheus + Grafana dashboards.
- Metriche: WS attivi, Pub/Sub lag, eventi per secondo.
- Alert: latenza > 150 ms, CPU > 70%, memoria buffer >80%.

## 8. Deployment e Ambiente

### Ambienti

- Dev: Docker Compose, DB locale.
- Staging: Kubernetes cluster, feature flags attivi.
- Produzione: Kubernetes multi-zona.

### Strumenti di deployment

- CI/CD: GitHub Actions / GitLab CI.
- Container: Docker + distroless.
- Orchestrazione: Kubernetes (AKS/EKS/GKE).

### Configurazioni

- Variabili segrete: gestite via Vault / Kubernetes Secrets.
- Redis in modalità cluster.
- PostgreSQL in HA + replica.

## 9. Dipendenze e Vincoli

| Dipendenza    | Descrizione                | Versione |
| ------------- | -------------------------- | -------- |
| Node.js / Go  | Runtime per GS, CS, API    | LTS      |
| Redis         | Pub/Sub, caching, presence | ≥ 7      |
| PostgreSQL    | Persistenza messaggi       | ≥ 14     |
| Envoy/Nginx   | Load balancing WS          | –        |
| OpenTelemetry | Tracing distribuito        | –        |

## 10. Rischi Tecnici e Mitigazioni

| Rischio                | Impatto | Probabilità | Mitigazione                       |
| ---------------------- | ------- | ----------- | --------------------------------- |
| Sovraccarico GS        | Alto    | Alto        | Autoscaling, sharding WS          |
| Perdita messaggi       | Alto    | Medio       | Persistenza immediata DB + retry  |
| Failure CS             | Medio   | Medio       | Rehashing canali + reinvio buffer |
| Latenza regioni remote | Medio   | Medio       | Multi-region deployment           |
| Redis saturato         | Alto    | Basso       | Cluster mode + monitoring         |

## 11. Allegati

- Sequence diagram: invio messaggio, reconnect, presence.
- Schema ER dettagliato DB.
- Contratti API JSON.
- Esempi eventi WebSocket.
