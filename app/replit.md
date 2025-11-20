# Slacklak - Team Collaboration Platform

## Overview

Slacklak is a Slack-inspired team collaboration platform built with React, Express, and PostgreSQL. The application provides real-time messaging capabilities through workspaces, channels, and direct messages, enabling teams to communicate effectively in a familiar interface.

The platform features a modern tech stack with TypeScript, Vite for frontend tooling, Drizzle ORM for database management, and shadcn/ui components for a polished user experience. The architecture follows a monorepo structure with shared schemas between client and server, ensuring type safety across the full stack.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Application Structure

**Monorepo Layout**: The codebase uses a monorepo structure with three main directories:
- `client/` - React-based frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript schemas and types used by both client and server

**Rationale**: This structure promotes code reuse and type safety. Shared schemas ensure that data structures remain consistent between frontend and backend, reducing bugs and improving developer experience.

### Frontend Architecture

**Framework**: React 18+ with TypeScript, built using Vite for fast development and optimized production builds.

**UI Component System**: shadcn/ui (New York style variant) with Radix UI primitives and Tailwind CSS for styling. Components are located in `client/src/components/ui/`.

**State Management**: 
- TanStack Query (React Query) for server state management and caching
- React Context for authentication state (`AuthProvider`)
- Local React state for UI interactions

**Routing**: Wouter for lightweight client-side routing with routes defined in `App.tsx`.

**Design System**: Custom Tailwind configuration with CSS variables for theming, supporting light/dark modes. Design guidelines follow Slack/Linear/Discord patterns for professional messaging UX.

**Key Design Decisions**:
- Component-based architecture with reusable UI primitives
- Form validation using react-hook-form with Zod schemas
- Real-time updates via polling (2-second intervals) with potential WebSocket infrastructure
- Responsive three-column layout: Workspace sidebar (64px) | Channel sidebar (240px) | Main content area

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js.

**API Design**: RESTful API with JWT-based authentication. Routes defined in `server/routes.ts`.

**Authentication**: 
- JWT tokens stored in localStorage
- Bearer token authentication middleware
- bcrypt for password hashing (10 salt rounds)
- JWT secret configurable via environment variable

**WebSocket Support**: WebSocket server infrastructure present for real-time messaging (using the `ws` library), though current implementation uses polling.

**Data Access Layer**: Storage abstraction through `IStorage` interface with in-memory implementation (`MemStorage` in `server/storage.ts`). This allows for future database implementations without changing business logic.

**Key Endpoints**:
- `/api/auth/login` - User authentication
- `/api/auth/register` - User registration
- `/api/workspaces` - Workspace CRUD operations
- `/api/channels` - Channel management
- `/api/messages` - Channel messaging
- `/api/dm` - Direct messaging
- `/ws` - WebSocket connection endpoint

### Data Storage

**ORM**: Drizzle ORM configured for PostgreSQL with schema defined in `shared/schema.ts`.

**Database Provider**: Neon Serverless PostgreSQL (via `@neondatabase/serverless`).

**Schema Design**:
- `users` - User accounts with email, name, password, avatar color, custom status
- `workspaces` - Team workspaces with owner relationship
- `workspace_members` - Join table for workspace membership
- `channels` - Communication channels within workspaces (supports private channels)
- `messages` - Channel messages with user and timestamp
- `direct_messages` - One-to-one messaging between users

**Migration Strategy**: Drizzle Kit for schema migrations, outputting to `./migrations` directory.

**Current Implementation**: The application uses `DatabaseStorage` which implements full PostgreSQL persistence via Drizzle ORM. The database schema has been pushed to Replit's managed PostgreSQL database. All user data, workspaces, channels, messages, and direct messages are persisted in the database.

**Migration History**: 
- November 20, 2024: Migrated from MemStorage (in-memory) to DatabaseStorage (PostgreSQL) using Replit's managed database
- Database schema successfully pushed using `npm run db:push`

### External Dependencies

**Core Runtime Dependencies**:
- **@neondatabase/serverless** - PostgreSQL database driver for Neon
- **drizzle-orm** - Type-safe ORM for database operations
- **express** - Web application framework
- **bcrypt** - Password hashing library
- **jsonwebtoken** - JWT token generation and validation
- **ws** - WebSocket server implementation

**Frontend Libraries**:
- **@tanstack/react-query** - Server state management and caching
- **wouter** - Lightweight routing library
- **react-hook-form** - Form state management
- **zod** - Schema validation
- **date-fns** - Date formatting and manipulation

**UI Component Libraries**:
- **@radix-ui/* (multiple packages)** - Accessible UI primitives for dialogs, dropdowns, popovers, etc.
- **tailwindcss** - Utility-first CSS framework
- **class-variance-authority** - Component variant management
- **lucide-react** - Icon library

**Development Tools**:
- **vite** - Build tool and dev server
- **typescript** - Type system
- **drizzle-kit** - Database migration toolkit
- **tsx** - TypeScript execution for Node.js
- **esbuild** - JavaScript bundler for server production builds

**Replit-Specific Integrations**:
- `@replit/vite-plugin-runtime-error-modal` - Development error overlay
- `@replit/vite-plugin-cartographer` - Development tooling
- `@replit/vite-plugin-dev-banner` - Development environment indicator

**Environment Variables Required**:
- `DATABASE_URL` - PostgreSQL connection string (Neon serverless)
- `JWT_SECRET` - Secret key for JWT signing (defaults to development key)
- `NODE_ENV` - Environment mode (development/production)

**Third-Party Services**:
- Neon PostgreSQL - Serverless PostgreSQL database hosting
- Google Fonts - Inter font family for typography