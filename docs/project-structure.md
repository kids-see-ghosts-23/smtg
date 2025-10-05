# Project Structure

This document provides a comprehensive overview of the project's file and folder structure.

## Root Directory

```
smtg/
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules
├── components.json          # shadcn/ui component configuration
├── drizzle.config.ts        # Drizzle ORM configuration
├── eslint.config.mjs        # ESLint configuration
├── next-env.d.ts           # Next.js TypeScript declarations
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies and scripts
├── package-lock.json       # Locked dependency versions
├── postcss.config.mjs      # PostCSS configuration
├── README.md               # Project documentation
├── tsconfig.json           # TypeScript configuration
├── docs/                   # Documentation files
├── public/                 # Static assets
├── screenshots/            # Application screenshots
└── src/                    # Source code
```

## Documentation (`/docs`)

```
docs/
├── SUMMARY.md              # Documentation summary
├── agents.md               # Agent system documentation
├── api.md                  # API documentation
├── auth.md                 # Authentication documentation
├── call.md                 # Video call documentation
├── database.md             # Database schema documentation
├── meetings.md             # Meetings feature documentation
├── project-structure.md    # This file
└── trpc.md                 # tRPC documentation
```

## Public Assets (`/public`)

```
public/
├── Logo.png                # Application logo (PNG)
├── cancelled.svg           # Cancelled meeting icon
├── empty.svg               # Empty state icon
├── file.svg                # File icon
├── globe.svg               # Globe icon
├── logo.svg                # Logo (SVG)
├── logo1.png               # Alternative logo (PNG)
├── logo1.svg               # Alternative logo (SVG)
├── next.svg                # Next.js logo
├── processing.svg          # Processing state icon
├── upcoming.svg            # Upcoming meeting icon
├── vercel.svg              # Vercel logo
└── window.svg              # Window icon
```

## Screenshots (`/screenshots`)

```
screenshots/
├── Agent Form extended.png  # Extended agent form screenshot
├── Agent form.png          # Agent form screenshot
├── Login.png               # Login page screenshot
├── Meeting.png             # Meeting interface screenshot
├── Summary.png             # Summary view screenshot
└── meeting form.png        # Meeting form screenshot
```

## Source Code (`/src`)

```
src/
├── README.md               # Source code documentation
├── constants.ts            # Application constants
├── app/                    # Next.js app directory
├── components/             # Reusable React components
├── db/                     # Database configuration and schema
├── hooks/                  # Custom React hooks
├── inngest/                # Inngest background jobs
├── lib/                    # Utility libraries and helpers
├── modules/                # Feature modules
├── trpc/                   # tRPC configuration and routers
└── types/                  # TypeScript type definitions
```

### App Directory (`/src/app`)

```
app/
├── favicon.ico             # Site favicon
├── globals.css             # Global styles
├── layout.tsx              # Root layout component
├── (auth)/                 # Authentication routes (route group)
│   ├── layout.tsx          # Auth layout
│   ├── resend-verification/ # Resend email verification
│   │   └── page.tsx
│   ├── sign-in/            # Sign in page
│   │   └── page.tsx
│   ├── sign-up/            # Sign up page
│   │   └── page.tsx
│   └── verify-email/       # Email verification page
│       └── page.tsx
├── (dashboard)/            # Dashboard routes (route group)
│   ├── README.md           # Dashboard documentation
│   ├── layout.tsx          # Dashboard layout
│   ├── page.tsx            # Dashboard home page
│   ├── agents/             # Agents management
│   │   ├── page.tsx        # Agents list page
│   │   └── [agentId]/      # Individual agent page
│   │       └── page.tsx
│   └── meetings/           # Meetings management
│       ├── page.tsx        # Meetings list page
│       └── [meetingId]/    # Individual meeting page
│           └── page.tsx
├── api/                    # API routes
│   ├── README.md           # API documentation
│   ├── auth/               # Authentication API
│   │   └── [...all]/       # Catch-all auth route
│   │       └── route.ts
│   ├── github-analyze/     # GitHub repository analysis
│   │   └── route.ts
│   ├── guest-auth/         # Guest authentication
│   │   └── route.ts
│   ├── inngest/            # Inngest webhook endpoint
│   │   └── route.ts
│   ├── meetings/           # Meeting-related APIs
│   │   ├── send-invitation/ # Send meeting invitation
│   │   │   └── route.ts
│   │   └── [meetingId]/    # Meeting-specific operations
│   │       └── route.ts
│   ├── notion/             # Notion integration
│   │   └── callback/       # Notion OAuth callback
│   │       └── route.ts
│   ├── rag-pdf/            # PDF RAG processing
│   │   └── route.ts
│   ├── send-summary-email/ # Email summary sender
│   │   └── route.ts
│   ├── send-summary-notion/ # Notion summary sender
│   │   └── route.ts
│   ├── summarize-mindmap/  # Mindmap summarization
│   │   └── route.ts
│   ├── trpc/               # tRPC API handler
│   │   └── [trpc]/
│   │       └── route.ts
│   ├── web-scraper/        # Web scraping API
│   │   └── route.ts
│   ├── webhook/            # Generic webhook handler
│   │   └── route.ts
│   └── youtube-transcript/ # YouTube transcript fetcher
│       └── route.ts
├── call/                   # Video call interface
│   ├── README.md           # Call documentation
│   ├── layout.tsx          # Call layout
│   └── [meetingId]/        # Meeting-specific call page
│       └── page.tsx
├── join/                   # Meeting join flow
│   └── [meetingId]/        # Join specific meeting
│       ├── actions.ts      # Server actions
│       ├── db-actions.ts   # Database operations
│       └── page.tsx        # Join page
└── test/                   # Test pages
    └── page.tsx            # Test page
```

### Components (`/src/components`)

```
components/
├── command-select.tsx      # Command palette select component
├── connect-notion.tsx      # Notion connection component
├── data-pagination.tsx     # Pagination component
├── data-table.tsx          # Data table component
├── empty-state.tsx         # Empty state component
├── error-state.tsx         # Error state component
├── generated-avatar.tsx    # Generated avatar component
├── loading-state.tsx       # Loading state component
├── responsive-dialog.tsx   # Responsive dialog component
├── send-invitation-dialog.tsx # Invitation dialog component
└── ui/                     # shadcn/ui components
    ├── accordion.tsx
    ├── alert-dialog.tsx
    ├── alert.tsx
    ├── aspect-ratio.tsx
    ├── avatar.tsx
    ├── badge.tsx
    ├── breadcrumb.tsx
    ├── button.tsx
    ├── calendar.tsx
    ├── card.tsx
    ├── carousel.tsx
    ├── checkbox.tsx
    ├── collapsible.tsx
    ├── command.tsx
    ├── context-menu.tsx
    ├── dialog.tsx
    ├── drawer.tsx
    ├── dropdown-menu.tsx
    ├── form.tsx
    ├── hover-card.tsx
    ├── input-otp.tsx
    ├── input.tsx
    ├── label.tsx
    ├── menubar.tsx
    ├── navigation-menu.tsx
    ├── pagination.tsx
    ├── popover.tsx
    ├── progress.tsx
    ├── radio-group.tsx
    ├── resizable.tsx
    ├── scroll-area.tsx
    ├── select.tsx
    ├── separator.tsx
    ├── sheet.tsx
    ├── sidebar.tsx
    ├── skeleton.tsx
    ├── slider.tsx
    ├── sonner.tsx
    ├── switch.tsx
    ├── table.tsx
    ├── tabs.tsx
    ├── textarea.tsx
    ├── toggle-group.tsx
    ├── toggle.tsx
    └── tooltip.tsx
```

### Database (`/src/db`)

```
db/
├── README.md               # Database documentation
├── index.ts                # Database client setup
└── schema.ts               # Drizzle schema definitions
```

### Hooks (`/src/hooks`)

```
hooks/
├── use-confirm.tsx         # Confirmation dialog hook
└── use-mobile.ts           # Mobile detection hook
```

### Inngest (`/src/inngest`)

```
inngest/
├── client.ts               # Inngest client configuration
└── functions.ts            # Background job functions
```

### Libraries (`/src/lib`)

```
lib/
├── agent-instructions.ts   # Agent instruction templates
├── auth-client.ts          # Client-side auth utilities
├── auth.ts                 # Server-side auth utilities
├── avatar.tsx              # Avatar utility component
├── email.ts                # Email utilities
├── github-repo.ts          # GitHub repository utilities
├── stream-chat.ts          # Stream Chat configuration
├── stream-video.ts         # Stream Video configuration
├── utils.ts                # General utilities
└── rag/                    # RAG (Retrieval-Augmented Generation)
    ├── db-utils.ts         # Database utilities for RAG
    ├── pdf-processor.ts    # PDF processing utilities
    ├── pdfjs-worker.d.ts   # PDF.js worker types
    └── query-utils.ts      # Query utilities for RAG
```

### Modules (`/src/modules`)

Feature-based module organization following domain-driven design principles.

```
modules/
├── agents/                 # Agent management module
│   ├── hooks/
│   │   └── use-agents-filters.ts
│   ├── params.ts           # URL parameters
│   ├── schemas.ts          # Zod validation schemas
│   ├── services/
│   │   └── rag-service.ts  # RAG service for agents
│   ├── server/
│   │   └── procedures.ts   # tRPC procedures
│   ├── types.ts            # TypeScript types
│   └── ui/
│       ├── components/
│       │   ├── agent-form.tsx
│       │   ├── agent-id-view-header.tsx
│       │   ├── agent-sources.tsx
│       │   ├── agents-list-header.tsx
│       │   ├── agents-search-filter.tsx
│       │   ├── columns.tsx
│       │   ├── data-pagination.tsx
│       │   ├── new-agent-dialog.tsx
│       │   └── update-agent-dialog.tsx
│       └── views/
│           ├── agent-id-view.tsx
│           └── agents-view.tsx
├── auth/                   # Authentication module
│   └── ui/
│       └── views/
│           ├── sign-in-view.tsx
│           └── sign-up-view.tsx
├── call/                   # Video call module
│   └── ui/
│       ├── components/
│       │   ├── call-active.tsx
│       │   ├── call-connect.tsx
│       │   ├── call-ended.tsx
│       │   ├── call-lobby.tsx
│       │   ├── call-provider.tsx
│       │   └── call-ui.tsx
│       └── views/
│           └── call-view.tsx
├── dashboard/              # Dashboard module
│   └── ui/
│       └── components/
│           ├── dashboard-command.tsx
│           ├── dashboard-navbar.tsx
│           ├── dashboard-sidebar.tsx
│           └── dashboard-user-button.tsx
├── home/                   # Home page module
│   └── ui/
│       └── views/
│           └── home-view.tsx
└── meetings/               # Meetings management module
    ├── README.md           # Meetings documentation
    ├── hooks/
    │   └── use-meetings-filters.ts
    ├── params.ts           # URL parameters
    ├── schemas.ts          # Zod validation schemas
    ├── server/
    │   └── procedures.ts   # tRPC procedures
    ├── types.ts            # TypeScript types
    └── ui/
        ├── components/
        │   ├── active-state.tsx
        │   ├── agent-id-filter.tsx
        │   ├── cancelled-state.tsx
        │   ├── chat-provider.tsx
        │   ├── chat-ui.tsx
        │   ├── columns.tsx
        │   ├── completed-state.tsx
        │   ├── meeting-form.tsx
        │   ├── meeting-id-view-header.tsx
        │   ├── meeting-join-link.tsx
        │   ├── meetings-list-header.tsx
        │   ├── meetings-search-filter.tsx
        │   ├── mindmap.tsx
        │   ├── new-meeting-dialog.tsx
        │   ├── processing-state.tsx
        │   ├── status-filter.tsx
        │   ├── transcript.tsx
        │   ├── upcoming-state.tsx
        │   └── update-meeting-dialog.tsx
        └── views/
            ├── meeting-id-view.tsx
            └── meetings-view.tsx
```

### tRPC (`/src/trpc`)

```
trpc/
├── README.md               # tRPC documentation
├── client.tsx              # Client-side tRPC setup
├── init.ts                 # tRPC initialization
├── query-client.ts         # React Query client setup
├── server.tsx              # Server-side tRPC setup
└── routers/
    └── _app.ts             # Main tRPC router
```

### Types (`/src/types`)

```
types/
└── pdf-parse.d.ts          # PDF parsing type definitions
```

## Architecture Overview

### Feature Module Structure

Each feature module follows a consistent structure:

```
module-name/
├── hooks/                  # React hooks specific to the module
├── params.ts               # URL/query parameters
├── schemas.ts              # Zod validation schemas
├── server/                 # Server-side logic
│   └── procedures.ts       # tRPC procedures
├── services/               # Business logic services
├── types.ts                # TypeScript type definitions
└── ui/                     # UI components
    ├── components/         # Reusable components
    └── views/              # Page-level components
```

### Key Technologies

-   **Framework**: Next.js 14+ (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **UI Components**: shadcn/ui
-   **Database**: PostgreSQL with Drizzle ORM
-   **Authentication**: Better-Auth
-   **API**: tRPC
-   **Video**: Stream Video SDK
-   **Chat**: Stream Chat SDK
-   **Background Jobs**: Inngest
-   **State Management**: React Query (TanStack Query)

### Design Patterns

1. **Feature-Based Organization**: Code is organized by feature/domain rather than by technical layer
2. **Separation of Concerns**: Clear separation between UI, business logic, and data access
3. **Type Safety**: End-to-end type safety with TypeScript and tRPC
4. **Colocation**: Related code is kept close together within feature modules
5. **Composition**: Heavy use of component composition for flexibility and reusability

## Key Directories Explained

### `/src/app`

Next.js App Router directory containing pages, layouts, and API routes. Uses route groups `(auth)` and `(dashboard)` for organization.

### `/src/modules`

Feature modules containing domain-specific logic, organized by business capability (agents, meetings, call, etc.).

### `/src/components`

Shared, reusable React components used across multiple features. Includes the `ui/` subdirectory with shadcn/ui components.

### `/src/lib`

Utility functions, helper modules, and third-party service configurations.

### `/src/db`

Database configuration and schema definitions using Drizzle ORM.

### `/src/trpc`

tRPC setup including client/server configuration and API routers.

### `/src/inngest`

Background job definitions and Inngest configuration for async tasks.

## Notes

-   Route groups in Next.js use parentheses `()` and don't affect the URL structure
-   Dynamic routes use square brackets `[param]`
-   The project uses TypeScript strictly with proper type definitions
-   Components are organized following atomic design principles where applicable
-   Server and client components are clearly separated in the Next.js app directory
