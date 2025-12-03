# TeamSlack - Real-time Team Communication Platform

## Overview

TeamSlack is a real-time team communication application inspired by Slack, built with a modern full-stack architecture. The application enables teams to communicate through organized workspaces, channels, and direct messages with instant message delivery via WebSocket connections.

**Core Purpose**: Provide teams with a fast, reliable messaging platform featuring workspace organization, public/private channels, direct messaging, user presence tracking, and message persistence.

**Key Features**:
- Workspace and channel management
- Real-time messaging with WebSocket communication
- Direct messaging between users
- User authentication with JWT tokens
- Message history and persistence
- Typing indicators and user presence
- Responsive UI with Slack-inspired design patterns

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**UI Component System**: 
- Built on shadcn/ui component library (Radix UI primitives)
- Tailwind CSS for styling with custom design tokens
- Design system follows Slack's visual hierarchy with influences from Linear and Discord
- Three-column layout: sidebar (260px), main chat area (flexible), optional right panel (320px)

**State Management**:
- TanStack Query (React Query) for server state and API caching
- React Context for auth, WebSocket connections, and workspace selection
- Local state with React hooks for UI interactions

**Routing**: Wouter for lightweight client-side routing with two main routes:
- `/auth` - Authentication (login/registration)
- `/` - Main application (workspace and chat interface)

**Real-time Communication**: WebSocket client that maintains persistent connection to server, handles message subscriptions, and manages reconnection logic.

**Form Handling**: React Hook Form with Zod schema validation for type-safe form submissions.

### Backend Architecture

**Runtime**: Node.js with Express framework, written in TypeScript.

**API Design**: RESTful API pattern for CRUD operations with the following main endpoints:
- `/api/auth/*` - User authentication (login, register)
- `/api/workspaces/*` - Workspace management
- `/api/channels/*` - Channel operations and messages
- `/api/dm/*` - Direct messaging
- `/ws` - WebSocket endpoint for real-time events

**Authentication Strategy**: 
- JWT-based token authentication
- Tokens stored in localStorage on client
- Authorization header (`Bearer ${token}`) for API requests
- WebSocket authentication via query parameter on connection

**Real-time Event System**:
- WebSocket Server (ws library) for bidirectional communication
- Event-based architecture with typed message payloads
- Connection tracking per user with support for multiple simultaneous connections
- Broadcast patterns for channel messages and direct messages

**Data Access Layer**: 
- Drizzle ORM for type-safe database operations
- Storage abstraction layer (`server/storage.ts`) providing clean interface for data operations
- Query patterns using Drizzle's select/where/join builders

**Session Management**: In-memory WebSocket connection tracking with Maps for user connections and workspace subscriptions.

### Database Schema

**Database**: PostgreSQL accessed via Neon serverless driver.

**Core Tables**:

1. **users** - User accounts with authentication credentials
   - id (UUID primary key)
   - email, password (hashed), name
   - avatar, status, statusMessage
   - createdAt timestamp

2. **workspaces** - Isolated team environments
   - id (UUID), name, ownerId
   - Foreign key to users

3. **workspace_members** - Many-to-many user-workspace relationship
   - id (UUID), workspaceId, userId, role
   - Cascading deletes on workspace/user removal

4. **channels** - Communication channels within workspaces
   - id (UUID), workspaceId, name, description
   - isPrivate boolean, createdById
   - Cascading delete on workspace removal

5. **channel_members** - Many-to-many user-channel membership
   - id (UUID), channelId, userId, joinedAt
   - Cascading deletes

6. **messages** - Channel messages
   - id (UUID), channelId, senderId, content
   - createdAt, updatedAt timestamps
   - Cascading delete on channel/user removal

7. **direct_messages** - One-on-one conversations
   - id (UUID), senderId, receiverId, content
   - createdAt timestamp
   - Cascading deletes on user removal

8. **user_presence** - Online/offline status tracking
   - userId (primary key), status, lastSeenAt

**Relationships**:
- Users own workspaces (one-to-many)
- Users belong to workspaces through workspace_members (many-to-many)
- Channels belong to workspaces (many-to-one)
- Users belong to channels through channel_members (many-to-many)
- Messages belong to channels and users (many-to-one)
- Direct messages connect two users (many-to-one for sender/receiver)

**Schema Management**: Drizzle Kit for migrations with PostgreSQL dialect, schema defined in `shared/schema.ts`.

### Build and Deployment Architecture

**Development Mode**:
- Vite dev server for frontend with HMR
- tsx for running TypeScript server directly
- Concurrent execution of client and server

**Production Build**:
- Vite builds frontend to `dist/public`
- esbuild bundles server code to `dist/index.cjs`
- Selected dependencies bundled to reduce syscall overhead for faster cold starts
- Static file serving from Express for production

**Module System**: ESM modules throughout with TypeScript path aliases for clean imports (@/, @shared/, @assets/).

## External Dependencies

### Frontend Libraries
- **React 18** - UI framework
- **TanStack Query** - Server state management and caching
- **Wouter** - Lightweight routing
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **shadcn/ui** - UI component primitives based on Radix UI
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **date-fns** - Date formatting utilities

### Backend Libraries
- **Express** - Web framework
- **ws** - WebSocket server
- **jsonwebtoken** - JWT authentication
- **bcrypt** - Password hashing
- **Drizzle ORM** - Database toolkit
- **@neondatabase/serverless** - PostgreSQL driver for Neon

### Database Service
- **Neon PostgreSQL** - Serverless PostgreSQL database (configured via DATABASE_URL environment variable)

### Development Tools
- **TypeScript** - Type safety across stack
- **Vite** - Frontend build tool with HMR
- **tsx** - TypeScript execution for development
- **esbuild** - Production server bundling
- **Drizzle Kit** - Database migration tool

### Design System
- **Google Fonts** - Inter font family for typography
- **Tailwind CSS Custom Theme** - Extended with custom HSL color variables for theming
- Design guidelines documented in `design_guidelines.md` following Slack's visual patterns