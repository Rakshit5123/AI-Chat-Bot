# AI-Powered Chatbot Application

## Overview

This is a full-stack AI chatbot application built with React, Express, and TypeScript. The application provides an intelligent conversational interface with real-time streaming responses, session management, and support for multiple AI providers (OpenAI and Dialogflow). Users can create multiple chat sessions, customize AI behavior through system prompts, and manage conversation history with an intuitive interface inspired by modern chat applications like ChatGPT and Claude.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- React Query (@tanstack/react-query) for server state management, caching, and data synchronization
- React Router is notably absent - the application uses a single-page architecture with conditional rendering

**UI Component System**
- Shadcn/ui component library with Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling with a custom design system defined in `tailwind.config.ts`
- Custom CSS variables for theming (light/dark mode support) with semantic color tokens
- Design follows a system-based approach with emphasis on readability and efficient conversation flow
- Two-column layout: fixed sidebar (280px) for session history and flexible main chat area (max-width 800px)

**State Management Pattern**
- Server state managed through React Query with pessimistic updates
- Local UI state (theme, streaming status, input) managed with React hooks
- No global state management library - component-level state with prop drilling for shared data

**Key UI Features**
- Real-time message streaming with incremental rendering
- Typing indicators and loading states
- Message grouping by sender with timestamps
- Toast notifications for user feedback
- Responsive design with collapsible sidebar on mobile
- Accessibility-first components from Radix UI

### Backend Architecture

**Server Framework**
- Express.js running on Node.js with TypeScript
- ESM module system (type: "module" in package.json)
- Custom Vite middleware integration for development with HMR support
- Production build uses esbuild for server bundling

**API Design Pattern**
- RESTful API endpoints under `/api` namespace
- Standard CRUD operations for sessions and messages
- Rate limiting on chat endpoints (20 requests per minute) to prevent abuse
- Request/response logging middleware for observability
- JSON request body parsing with raw body preservation for webhook support

**Provider Abstraction Layer**
- Plugin-based architecture for AI providers (OpenAI, Dialogflow)
- Common interface (`ChatProvider`) enforcing consistent contract across providers
- Provider selection via session configuration (stored per-session)
- Streaming support through callback-based chunk handlers
- AbortSignal support for canceling in-flight requests

**Storage Layer**
- In-memory storage implementation (`MemStorage`) using Map data structures
- Interface-based design (`IStorage`) allowing easy swap to database implementation
- Current implementation suitable for development; production requires persistent storage
- Session-scoped message history with cascade delete support

**Streaming Architecture**
- Server-Sent Events (SSE) for real-time message streaming from AI providers
- Chunked response handling with incremental token delivery
- Client-side abort controller for stream cancellation
- Backpressure handling through async iteration

### Data Storage Solutions

**Current State: In-Memory Storage**
- Ephemeral data storage using JavaScript Map objects
- Data lost on server restart - suitable only for development/demo
- Fast read/write operations with O(1) lookup complexity

**Schema Definition**
- Drizzle ORM schema defined in `shared/schema.ts` for PostgreSQL
- Three primary tables: users, sessions, messages
- UUID primary keys with automatic generation
- Timestamps for session tracking (createdAt, lastMessageAt)
- Foreign key relationships with cascade delete (messages → sessions)
- Zod schema validation for runtime type safety on insertions

**Production Database Plan**
- Configured for PostgreSQL via Neon serverless driver (`@neondatabase/serverless`)
- Connection pooling through serverless-compatible driver
- Migration system ready via Drizzle Kit (migrations stored in `/migrations`)
- Database credentials managed through environment variable (`DATABASE_URL`)

**Data Model**
- Users: Basic authentication schema (username, password)
- Sessions: Conversation containers with metadata (title, provider, model, systemPrompt)
- Messages: Individual chat messages with role (user/assistant/system), content, and optional token count

### Authentication & Authorization

**Current State: No Authentication**
- No user authentication implemented in current codebase
- Session IDs are unprotected and publicly accessible
- Suitable only for single-user or demo scenarios

**Prepared Infrastructure**
- User schema exists in database design with username/password fields
- Storage interface includes user lookup methods
- Missing: JWT token generation, password hashing, session middleware, protected routes

**Security Considerations**
- Rate limiting implemented on chat endpoints
- CORS configuration needed for production
- Environment-based secret management (OPENAI_API_KEY)
- CSRF protection not implemented

### External Dependencies

**AI Provider APIs**
- **OpenAI API**: Primary AI provider using GPT models (currently configured for "gpt-5")
  - API key required via `OPENAI_API_KEY` environment variable
  - Streaming completion support through official SDK
  - Configurable parameters: model, max_completion_tokens (default 8192)
  
- **Dialogflow**: Secondary provider (currently mock implementation)
  - Placeholder implementation with simulated responses
  - Ready for integration with Google Cloud Dialogflow credentials
  - Would require service account JSON and project ID configuration

**Database Service**
- **Neon PostgreSQL**: Serverless PostgreSQL hosting
  - Connection via `@neondatabase/serverless` driver
  - WebSocket-based connection for serverless compatibility
  - Configured through `DATABASE_URL` environment variable
  - Currently not active (using in-memory storage)

**Development Tools**
- **Replit Integration**: Development environment plugins
  - Runtime error modal overlay for debugging
  - Cartographer plugin for code navigation
  - Dev banner for environment awareness
  - Conditional loading (only in Replit environment)

**UI Component Library**
- **Shadcn/ui**: Component collection built on Radix UI
  - 40+ pre-built accessible components
  - Customizable through Tailwind CSS
  - No runtime dependency (components copied to project)

**Build & Development**
- **Vite**: Frontend build tool and dev server
- **esbuild**: Server-side bundling for production
- **Drizzle Kit**: Database migration tool
- **TypeScript**: Type checking across full stack

**Styling & Fonts**
- **Google Fonts**: Inter (primary), JetBrains Mono (code blocks)
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing with autoprefixer

**Client-Side Libraries**
- **date-fns**: Date formatting and manipulation (lightweight alternative to moment.js)
- **React Query**: Server state management and caching
- **React Hook Form**: Form validation with Zod resolvers
- **Lucide React**: Icon library (tree-shakeable)