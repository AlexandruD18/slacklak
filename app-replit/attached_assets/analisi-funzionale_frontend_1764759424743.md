# Documento di Analisi Funzionale

**Titolo progetto:** Slack Backend Clone  
**Versione:** v1.0  
**Data:** 19/11/2025  
**Autore:** Backend Developer

## 1. Scopo del documento

Il documento definisce il comportamento funzionale del backend per un clone di Slack. Serve a descrivere API, regole di gestione dati e logica operativa necessarie al funzionamento del front end definito nel PRD.

## 2. Contesto e panoramica del sistema

Il sistema gestisce autenticazione, workspace, canali, messaggi, ricerca e profili utente. Il backend espone API REST e WebSocket per fornire aggiornamenti in tempo reale.  
Componenti principali: backend, database, servizio WebSocket, API REST.

## 3. Architettura generale

- Backend con logica di business.
- Database per utenti, workspace, canali e messaggi.
- API REST per operazioni CRUD.
- WebSocket per aggiornamenti in tempo reale.
- Moduli interni: autenticazione, workspace, canali, messaggi, profilo, ricerca.

## 4. Funzionalità principali

### F-001

**Nome:** Registrazione utente  
**Descrizione:** Registra un nuovo utente con email e password.  
**Attori:** Utente  
**Input:** email, password  
**Output:** token autenticazione  
**Flusso:** l’utente invia i dati, il sistema valida e salva nel database, genera un token.  
**Requisiti collegati:** R1

### F-002

**Nome:** Login  
**Descrizione:** Permette all’utente di accedere.  
**Attori:** Utente  
**Input:** email, password  
**Output:** token validato  
**Flusso:** il sistema verifica credenziali e restituisce un token.  
**Requisiti collegati:** R1

### F-003

**Nome:** Creazione workspace  
**Descrizione:** Permette all’utente di creare un workspace.  
**Attori:** Utente  
**Input:** nome workspace  
**Output:** workspace creato  
**Flusso:** il sistema registra un nuovo workspace e collega l’utente come proprietario.  
**Requisiti collegati:** R2

### F-004

**Nome:** Gestione canali  
**Descrizione:** Permette la creazione e la visualizzazione dei canali.  
**Attori:** Utente  
**Input:** dati canale  
**Output:** canale creato o elenco canali  
**Flusso:** il sistema salva il canale o recupera la lista dei canali del workspace.  
**Requisiti collegati:** R3 R4 R5

### F-005

**Nome:** Accesso al canale  
**Descrizione:** L’utente entra in un canale.  
**Attori:** Utente  
**Input:** id canale  
**Output:** dati canale  
**Flusso:** il backend verifica se l’utente appartiene al workspace e restituisce i dati.  
**Requisiti collegati:** R6

### F-006

**Nome:** Invio messaggi  
**Descrizione:** L’utente invia un messaggio in un canale.  
**Attori:** Utente  
**Input:** testo messaggio  
**Output:** messaggio salvato  
**Flusso:** il sistema salva e invia tramite WebSocket agli utenti nel canale.  
**Requisiti collegati:** R7 R11 R14

### F-007

**Nome:** Lettura messaggi  
**Descrizione:** L’utente visualizza messaggi del canale.  
**Attori:** Utente  
**Input:** id canale  
**Output:** elenco messaggi  
**Flusso:** il backend recupera i messaggi dal database.  
**Requisiti collegati:** R8

### F-008

**Nome:** Gestione profilo  
**Descrizione:** Permette all’utente di modificare le informazioni del profilo.  
**Attori:** Utente  
**Input:** nome, avatar, stato  
**Output:** profilo aggiornato  
**Flusso:** il backend salva le modifiche.  
**Requisiti collegati:** R9

### F-009

**Nome:** Ricerca  
**Descrizione:** Ricerca messaggi e canali.  
**Attori:** Utente  
**Input:** query ricerca  
**Output:** risultati  
**Flusso:** il sistema cerca nel database con query indicizzate.  
**Requisiti collegati:** R10

### F-010

**Nome:** Messaggi diretti  
**Descrizione:** Invia messaggi privati tra due utenti.  
**Attori:** Utente  
**Input:** destinatario, testo  
**Output:** messaggio diretto salvato  
**Flusso:** il backend salva e invia via WebSocket.  
**Requisiti collegati:** R12

### F-011

**Nome:** Stato online  
**Descrizione:** Mostra quali utenti sono online.  
**Attori:** Utente  
**Input:** connessione WebSocket  
**Output:** stati utente  
**Flusso:** il backend aggiorna lo stato utente con presenza in tempo reale.  
**Requisiti collegati:** R13 R14

## 5. Casi d’uso

### UC-001

**Nome:** Login utente  
**Attore:** Utente  
**Descrizione:** L’utente accede al sistema.  
**Pre-condizioni:** utente registrato  
**Scenario:** l’utente invia credenziali, il backend verifica e genera token  
**Post-condizioni:** utente autenticato  
**Eccezioni:** credenziali non valide

### UC-002

**Nome:** Invio messaggio  
**Attore:** Utente  
**Descrizione:** L’utente invia un messaggio.  
**Pre-condizioni:** utente autenticato  
**Scenario:** l’utente scrive, il backend salva e notifica gli altri  
**Post-condizioni:** messaggio registrato  
**Eccezioni:** errore rete

### UC-003

**Nome:** Creazione canale  
**Attore:** Utente  
**Descrizione:** L’utente crea un nuovo canale.  
**Pre-condizioni:** appartenenza workspace  
**Scenario:** l’utente compila i dati e il backend crea il canale  
**Post-condizioni:** canale presente in elenco  
**Eccezioni:** nome duplicato

## 6. Interfaccia utente

Il backend non ha interfaccia grafica. Espone endpoint REST e WebSocket.  
Per ogni endpoint verrà definito formato JSON.

## 7. Flusso dei dati

- Input dell’utente tramite API.
- Validazione e logica nel backend.
- Accesso al database.
- Output in JSON.
- Aggiornamenti via WebSocket.

Tipologie dati: JSON, record database.

## 8. Requisiti non funzionali collegati

- Tempo risposta API sotto due secondi.
- Autenticazione tramite token.
- Compatibilità con browser moderni tramite API standard.
- Scalabilità orizzontale con gestione WebSocket distribuita.

## 9. Vincoli e dipendenze

- Uso di Node.js per il backend.
- Necessità di database relazionale o NoSQL.
- Integrazione con servizio WebSocket.
- Dipendenza dal front end React.

## 10. Tracciabilità dei requisiti

| ID Requisito (PRD) | ID Funzionalità | Stato       | Note |
| ------------------ | --------------- | ----------- | ---- |
| R1                 | F-001 F-002     | In sviluppo |      |
| R2                 | F-003           | In sviluppo |      |
| R3                 | F-004           | In sviluppo |      |
| R4                 | F-004           | In sviluppo |      |
| R5                 | F-004           | In sviluppo |      |
| R6                 | F-005           | In sviluppo |      |
| R7                 | F-006           | In sviluppo |      |
| R8                 | F-007           | In sviluppo |      |
| R9                 | F-008           | In sviluppo |      |
| R10                | F-009           | In sviluppo |      |
| R11                | F-006           | In sviluppo |      |
| R12                | F-010           | In sviluppo |      |
| R13                | F-011           | In sviluppo |      |
| R14                | F-006 F-011     | In sviluppo |      |

## 11. Appendici

Glossario  
Documenti esterni o riferimenti tecnici  
Strutture dati e modelli da definire nel design tecnico
