# Slacklak

Uno Slack‑clone open‑source: backend e frontend per una applicazione di messaggistica in tempo reale.

**Versione:** 1.0  
**Data:** 19/11/2025

---

## Descrizione

Slacklak è un progetto didattico/prototipale che implementa le funzionalità di base di una piattaforma di messaggistica in tempo reale (canali, messaggi, presenza, autenticazione), con una separazione chiara tra `front-end` e `back-end`.

Il repository contiene:

- `app/` — codice e documentazione del server (API REST, WebSocket, modelli dati) e interfaccia client (web).
- `docs/` — documentazione di progetto e analisi tecnica/funzionale.

## Caratteristiche principali

- Autenticazione utente (JWT/OAuth configurabile)
- API REST per gestione utenti, canali e messaggi
- WebSocket per aggiornamenti in tempo reale (messaggi, presenza)
- Modello dati ottimizzato per canali e thread
- Strategie e suggerimenti per scalabilità e deploy

## Architettura (breve)

Il backend è pensato con componenti logici separati:

- Gateway / API Server: gestisce richieste HTTP e autenticazione
- Channel Server: orchestrazione messaggi e persistenza
- Presence Server: gestione stato online/offline via WebSocket

Per dettagli architetturali consultare `docs/backend/analisi-tecnica.md`.

## Tecnologie suggerite

- Linguaggi: Node.js / TypeScript o Python (FastAPI)
- Database: PostgreSQL (persistenza primaria) + Redis (pub/sub, presence, caching)
- WebSocket: socket.io, ws o soluzioni native
- Container e orchestrazione: Docker, optional Kubernetes

## Requisiti

- Node.js >= 18 (se la implementazione è in Node)
- PostgreSQL 13+
- Redis 6+

## Setup rapido (esempio per sviluppo locale)

Apri un terminale PowerShell e segui questi passi generici:

```powershell
# Clona il repository (se non già fatto)
git clone https://github.com/AlexandruD18/slacklak.git
cd slacklak

# Esempio: avviare i servizi con Docker Compose (se fornito)
# docker-compose up --build

# Oppure: entrare nella cartella back-end e installare dipendenze
cd back-end
npm install
npm run dev

# In un altro terminale, avvia il front-end
cd ..\front-end
npm install
npm run dev
```

Adatta i comandi sopra alla tecnologia effettiva usata nel progetto (vedi `back-end/` e `front-end/`).

## Variabili d'ambiente comuni

- `DATABASE_URL` — stringa di connessione PostgreSQL
- `REDIS_URL` — URL Redis
- `JWT_SECRET` — segreto per firmare i token JWT
- `PORT` — porta di ascolto dell'API

Esempio `.env`:

```env
DATABASE_URL=postgres://user:password@localhost:5432/slacklak
REDIS_URL=redis://localhost:6379
JWT_SECRET=changeme
PORT=4000
```

## Esecuzione locale

- Backend: `cd back-end && npm run dev`
- Frontend: `cd front-end && npm run dev`
- Documentazione tecnica: aprire `docs/` o `docs/backend/analisi-tecnica.md`

## API (breve panoramica)

Le API principali previste includono endpoint per:

- Autenticazione: `POST /auth/login`, `POST /auth/register`
- Utenti: `GET /users`, `GET /users/:id`
- Canali: `GET /channels`, `POST /channels`
- Messaggi: `GET /channels/:id/messages`, `POST /channels/:id/messages`

Per specifiche dettagliate e contratti degli endpoint consultare la documentazione nel codice o aggiungere Swagger/OpenAPI.

## WebSocket / Real‑time

La comunicazione in tempo reale può essere gestita con uno dei pattern seguenti:

- Pub/Sub via Redis per scalare più istanze
- Canali WebSocket per ogni stanza/canale
- Eventi: `message:new`, `message:update`, `presence:change`

## Deploy

Approccio consigliato:

1. Containerizzare (Docker) backend e frontend
2. Usare una soluzione gestita per PostgreSQL e Redis (es. RDS, Managed Redis)
3. Deploy su provider cloud (AWS/GCP/Azure) o PaaS (Heroku, Render)
4. Configurare un bilanciatore e strategie di scaling (horizontal pods, autoscaling)

## Contribuire

Grazie per l'interesse! Segui questi passi per contribuire:

1. Fork del repository
2. Crea una branch feature/bugfix
3. Apri una Pull Request descrivendo il cambiamento
4. Aggiungi test dove opportuno

Vedi anche `CONTRIBUTING.md` se presente.

## Licenza

Progetto rilasciato sotto la licenza presente nel file `LICENSE`.

## Contatti

Per domande o proposte: apri un'issue o contatta il maintainer principale nel repository GitHub.
