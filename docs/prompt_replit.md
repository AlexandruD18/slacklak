# Slack Clone - Prompt per Sviluppo

## Ruolo

Agisci come un Senior Full Stack Engineer esperto in architetture scalabili, React, Node.js e PostgreSQL.

## Obiettivo

Creare un'applicazione "Slack Clone" completa, basata rigorosamente sui documenti allegati (PRD, Analisi Funzionale, Analisi Tecnica Back-end e Front-end).

## Stack Tecnologico

**Frontend:** React (Vite), Tailwind CSS, Lucide React (per icone)  
**Backend:** Node.js con Express  
**Database:** PostgreSQL (usa pg o sequelize/typeorm come ORM)  
**Real-time:** Socket.io (per la messaggistica)

## Configurazione Ambiente e Porte

- **Frontend App:** porta 8080
- **Backend API:** porta 5000
- **Database:** connessione a PostgreSQL configurata correttamente

## Requisiti di Avvio e Deploy

- Generare file di configurazione per l'ambiente di produzione.
- Creare script di deploy o file di configurazione (es. `ecosystem.config.js` per PM2 o `deploy.sh`).

**Dati target:**

- Host: `teamslack.***.****.**********.net`
- SSH User: `*********`
- SSH Password: `*************` (usa variabili d'ambiente, crea `.env.example` o script di setup)

## Istruzioni Passo-Passo

1. **Analisi:** leggere i file allegati per comprendere entità e flussi (Utenti, Canali, Messaggi, Workspace).
2. **Setup Database:** creare `schema.sql` basato sull'analisi tecnica.
3. **Backend:** inizializzare server Express sulla porta 5000, implementare API REST e Socket.io, configurare CORS per la porta 8080.
4. **Frontend:** inizializzare app React (Vite) sulla porta 8080, configurare proxy o client API verso `localhost:5000`.
5. **Configurazione Replit:** creare `.replit` per avviare backend e frontend insieme (es. con `concurrently`).
   - Esempio run command: `npm run dev`
6. **Deploy Script:** creare `setup_deploy.sh` per connettersi via SSH al server e aggiornare l'applicazione.

## Output Atteso

Applicazione funzionante, avviabile con "Run" su Replit, chat in tempo reale attiva e persistenza dei dati su PostgreSQL.
