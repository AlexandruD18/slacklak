# Documento di Analisi Tecnica

**Titolo progetto:** Slack Clone  
**Versione:** 1.0  
**Data:** 19/11/2025  
**Autore:** Team Backend e Frontend

---

## 1. Scopo del documento

Il documento descrive l’architettura tecnica, lo stack tecnologico, il modello dati, le API e i flussi fondamentali del progetto Slack Clone. Fornisce una visione dettagliata delle scelte tecniche per garantire coerenza tra frontend, backend e database.

---

## 2. Riferimenti

- PRD: Slack Front End Clone – v1.0 – 19/11/2025
- Analisi Funzionale Backend – v1.0 – 19/11/2025
- Documentazione framework: React, Node.js, Express, PostgreSQL

---

## 3. Architettura del sistema

### 3.1 Panoramica

Il sistema segue una struttura client-server.  
Componenti principali:

- Frontend React che gestisce interfaccia, routing e comunicazione API.
- Backend Node.js con API REST e WebSocket.
- Database PostgreSQL per utenti, canali, messaggi e workspace.
- Servizio WebSocket per aggiornamenti in tempo reale.

Il frontend comunica con il backend tramite HTTP e WebSocket. Il backend gestisce logiche di business, salvataggi e recupero dati.

### 3.2 Diagramma architetturale

```
[Client React]
|
REST / WS
|
[Backend Node.js]
|
[Database PostgreSQL]
```

### 3.3 Componenti principali

#### 1. Frontend (React + TypeScript)

- Funzione: rendering UI, gestione canali, messaggi e profili.
- Dipendenze: React Router, TailwindCSS, Axios.
- Comunicazione: REST per dati statici e WebSocket per messaggi.

#### 2. Backend API (Node.js + Express)

- Funzione: logica applicativa, autenticazione, routing API.
- Dipendenze: Express, JWT, bcrypt, Socket.io.
- Comunicazione: JSON via HTTP, WebSocket per eventi realtime.

#### 3. Database (PostgreSQL)

- Struttura relazionale.
- Tabelle: users, workspaces, channels, messages, direct_messages, memberships.

#### 4. WebSocket Service

- Implementazione tramite Socket.io.
- Gestisce eventi: nuovo messaggio, stato online, join canale.

---

## 4. Specifiche tecniche

### 4.1 Stack tecnologico

**Frontend:**

- React
- TypeScript
- TailwindCSS
- Vite o Next.js

**Backend:**

- Node.js
- Express
- Socket.io
- JWT

**Database:**

- PostgreSQL
- Prisma ORM o Sequelize

**Strumenti:**

- GitHub
- GitHub Actions
- Docker per ambienti di sviluppo

### 4.2 Requisiti di sistema

- Node.js versione 18+
- PostgreSQL 15+
- Browser supportati: Chrome, Edge, Firefox, Safari
- CPU: dual core
- RAM: minimo 4 GB per ambiente locale

### 4.3 Modello dati

#### Entità principali

**users**
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | UUID | Identificatore |
| email | string | Unico |
| password | string | Hash |
| name | string | Nome utente |
| avatar | string | URL immagine |
| status | string | Stato utente |

**workspaces**
| Campo | Tipo |
|-------|------|
| id | UUID |
| name | string |
| owner_id | UUID |

**channels**
| Campo | Tipo |
|-------|------|
| id | UUID |
| name | string |
| workspace_id | UUID |

**messages**
| Campo | Tipo |
|-------|------|
| id | UUID |
| channel_id | UUID |
| sender_id | UUID |
| content | text |
| timestamp | datetime |

**direct_messages**
| Campo | Tipo |
|-------|------|
| id | UUID |
| sender_id | UUID |
| receiver_id | UUID |
| content | text |
| timestamp | datetime |

### 4.4 API e integrazioni

Formato API: JSON  
Autenticazione: Bearer Token (JWT)

#### Autenticazione

**POST /auth/register**  
Input: email, password  
Output: token

**POST /auth/login**  
Input: email, password  
Output: token

#### Workspace

**POST /workspaces**  
Crea workspace

**GET /workspaces/:id**  
Dati workspace

#### Canali

**POST /channels**  
Crea canale

**GET /channels/:workspaceId**  
Lista canali

#### Messaggi

**POST /messages/:channelId**  
Invia messaggio

**GET /messages/:channelId**  
Lista messaggi

#### Messaggi diretti

**POST /dm/:userId**  
Invia DM

**GET /dm/:userId**  
Lista DM

#### Ricerca

**GET /search?q=**  
Restituisce risultati filtrati

---

## 5. Flussi di processo

### Flusso invio messaggio

1. Utente invia messaggio via POST o WebSocket.
2. Backend valida contenuti.
3. Backend salva nel database.
4. Backend emette evento WebSocket.
5. Client aggiornano la UI.

### Flusso login

1. Utente invia credenziali.
2. Backend verifica dati.
3. Genera token JWT.
4. Restituisce dati utente.

### Flusso creazione canale

1. Utente invia nome canale.
2. Backend verifica permessi.
3. Salva canale.
4. Notifica WebSocket ad altri utenti del workspace.

---

## 6. Sicurezza

- Token JWT per autenticazione.
- Hash password con bcrypt.
- Ruoli base: owner workspace, utente.
- Rate limiting su login.
- Crittografia dati in transito tramite HTTPS.
- Validazione input lato server.
- Protezione WebSocket tramite token handshake.

---

## 7. Test e validazione

- Test unitari: Jest
- Test integrazione: Supertest
- Test API: Postman Collection
- Test carico: K6
- Obiettivi:
  - API risposta sotto due secondi
  - WebSocket latenza massima 300 ms

---

## 8. Deployment

- Ambienti: sviluppo, staging, produzione
- Pipeline:
  - Lint
  - Build
  - Test
  - Deploy automatico
- Docker per ambienti uniformi
- Hosting consigliato:
  - Backend: Render o Railway
  - DB: Supabase o Neon
  - Frontend: Vercel

---

## 9. Manutenzione e aggiornamenti

- Versioning semantico (MAJOR.MINOR.PATCH)
- Log tramite Winston
- Monitoraggio WebSocket
- Backup giornaliero database
- Patch di sicurezza mensili

---

## 10. Appendici

- Diagrammi dati e sequenza
- Endpoint avanzati da aggiungere
- Schema WebSocket dettagliato
