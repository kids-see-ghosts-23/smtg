# SMTG (Smart Meetings Transformed by GenAI) - Complete Documentation

> **Project GitHub Repository:** [https://github.com/vishruthmd/5idiots_RVCE_1_VishruthMD](https://github.com/vishruthmd/5idiots_RVCE_1_VishruthMD)
>
> **For detailed module-specific documentation, visit:** [https://github.com/vishruthmd/5idiots_RVCE_1_VishruthMD/tree/main/docs](https://github.com/vishruthmd/5idiots_RVCE_1_VishruthMD/tree/main/docs)
>
> **View the project presentation:** [https://www.canva.com/design/DAG0Wo6i_So/ZZuUd1st2NiBMyat7ABFEA/edit](https://www.canva.com/design/DAG0Wo6i_So/ZZuUd1st2NiBMyat7ABFEA/edit?utm_content=DAG0Wo6i_So&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)
>
> **Watch the video presentation:** [https://youtu.be/wan7k3aClZU](https://youtu.be/wan7k3aClZU)

---

## Table of Contents

1. [Overview](#overview)
2. [Project Architecture](#project-architecture)
3. [Authentication System](#authentication-system)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [Core Modules](#core-modules)
    - [Agents Module](#agents-module)
    - [Meetings Module](#meetings-module)
    - [Call Module](#call-module)
7. [tRPC Implementation](#trpc-implementation)

---

## Overview

SMTG is a full-stack AI-powered meeting platform that enables users to conduct video meetings with specialized AI agents. The application provides automatic transcription, recording, AI-powered summarization, and intelligent follow-up capabilities.

### Key Features

-   🤖 **AI Agents**: Create custom AI assistants with specialized knowledge
-   📹 **Video Meetings**: Real-time video conferencing with Stream Video SDK
-   📝 **Auto-Transcription**: Automatic speech-to-text conversion
-   🎯 **AI Summaries**: GPT-4o powered meeting summaries
-   📚 **RAG System**: Document-based knowledge enhancement for agents
-   👥 **Guest Access**: Support for external participants without accounts
-   🔗 **Integrations**: Notion, GitHub, YouTube, Email

### External Services

-   **Stream Video & Chat**: Real-time communication (v1.18.12+)
-   **OpenAI**: AI processing (GPT-4o) and embeddings
-   **Inngest**: Serverless event-driven processing
-   **Neon Database**: PostgreSQL with Drizzle ORM
-   **Better Auth**: Authentication with OAuth support

---

## Project Architecture

### Technology Stack

| Layer                | Technology                   |
| -------------------- | ---------------------------- |
| **Framework**        | Next.js 14+ (App Router)     |
| **Language**         | TypeScript                   |
| **Styling**          | Tailwind CSS                 |
| **UI Components**    | shadcn/ui                    |
| **Database**         | PostgreSQL + Drizzle ORM     |
| **Authentication**   | Better-Auth                  |
| **API**              | tRPC                         |
| **Video/Chat**       | Stream SDK                   |
| **Background Jobs**  | Inngest                      |
| **State Management** | React Query (TanStack Query) |

### Directory Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   └── verify-email/
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── agents/
│   │   └── meetings/
│   ├── api/               # API routes
│   │   ├── auth/
│   │   ├── github-analyze/
│   │   ├── guest-auth/
│   │   ├── inngest/
│   │   ├── meetings/
│   │   ├── notion/
│   │   ├── rag-pdf/
│   │   ├── send-summary-email/
│   │   ├── send-summary-notion/
│   │   ├── trpc/
│   │   ├── web-scraper/
│   │   ├── webhook/
│   │   └── youtube-transcript/
│   ├── call/              # Video call interface
│   └── join/              # Meeting join flow
├── components/            # Shared React components
│   └── ui/               # shadcn/ui components
├── db/                   # Database configuration
│   ├── index.ts
│   └── schema.ts
├── inngest/              # Background jobs
│   ├── client.ts
│   └── functions.ts
├── lib/                  # Utility libraries
│   ├── agent-instructions.ts
│   ├── auth-client.ts
│   ├── auth.ts
│   ├── email.ts
│   ├── github-repo.ts
│   ├── stream-chat.ts
│   ├── stream-video.ts
│   └── rag/
├── modules/              # Feature modules
│   ├── agents/
│   ├── auth/
│   ├── call/
│   ├── dashboard/
│   ├── home/
│   └── meetings/
└── trpc/                 # tRPC configuration
    ├── client.tsx
    ├── init.ts
    ├── server.tsx
    └── routers/
```

### Design Patterns

1. **Feature-Based Organization**: Code organized by domain/feature
2. **Separation of Concerns**: Clear separation between UI, business logic, and data access
3. **Type Safety**: End-to-end TypeScript with tRPC
4. **Colocation**: Related code kept together within feature modules

---

## Authentication System

SMTG uses [Better Auth](https://www.better-auth.com/) for authentication with support for email/password and OAuth providers.

### Authentication Methods

1. **Email & Password**: With email verification
2. **OAuth**: Google and GitHub
3. **Guest Access**: Temporary tokens for meeting participants

### Database Schema

**user**

```typescript
{
  id: string (PK)
  name: string
  email: string (unique)
  emailVerified: boolean (default: false)
  image: string (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**session**

```typescript
{
  id: string (PK)
  expiresAt: timestamp
  token: string (unique)
  ipAddress: string
  userAgent: string
  userId: string (FK → user.id)
}
```

**account**

```typescript
{
  id: string (PK)
  accountId: string
  providerId: string
  userId: string (FK → user.id)
  accessToken: string
  refreshToken: string
  password: string (hashed)
}
```

**verification**

```typescript
{
    id: string(PK);
    identifier: string(email);
    value: string(token);
    expiresAt: timestamp;
}
```

### Authentication Flow

**Sign Up Flow**

```
User → Sign Up Form → Better Auth → Create User (unverified)
                                  → Send Verification Email
                                  → Redirect to Sign In
```

**Sign In Flow**

```
User → Sign In Form → Better Auth → Check Email Verified
                                  → Create Session (if verified)
                                  → Redirect to Dashboard
```

### Security Features

-   **Password Hashing**: bcrypt via Better Auth
-   **HTTP-Only Cookies**: XSS protection
-   **Secure Flag**: HTTPS-only in production
-   **SameSite**: CSRF protection
-   **Email Verification**: Required before sign-in
-   **Token Expiration**: Time-limited tokens
-   **Session Tracking**: IP address and user agent stored

### Environment Variables

```bash
# Better Auth
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email Service
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

---

## Database Schema

### Core Tables

#### agents

```typescript
{
  id: text (PK, nanoid)
  name: text
  userId: text (FK → user.id, CASCADE DELETE)
  instructions: text
  githubRepo: text (nullable)
  createdAt: timestamp (default: now())
  updatedAt: timestamp (default: now())
}
```

#### meetings

```typescript
{
  id: text (PK, nanoid)
  name: text
  userId: text (FK → user.id, CASCADE DELETE)
  agentId: text (FK → agents.id, CASCADE DELETE)
  status: meetingStatus (default: 'upcoming')
  startedAt: timestamp (nullable)
  endedAt: timestamp (nullable)
  transcriptUrl: text (nullable)
  recordingUrl: text (nullable)
  summary: text (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### guest_users

```typescript
{
  id: text (PK)
  name: text
  meetingId: text (FK → meetings.id, CASCADE DELETE)
  userId: text (FK → user.id, CASCADE DELETE)
  image: text (nullable)
  createdAt: timestamp
}
```

### RAG System Tables

#### agent_documents

```typescript
{
  id: text (PK, nanoid)
  agentId: text (FK → agents.id, CASCADE DELETE)
  name: text
  url: text (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### document_chunks

```typescript
{
  id: text (PK, nanoid)
  documentId: text (FK → agent_documents.id, CASCADE DELETE)
  pageNumber: text (nullable)
  chunkNumber: text (nullable)
  content: text
  embedding: vector(1536) (nullable)  // OpenAI embeddings
  createdAt: timestamp
}
```

### Enums

**meeting_status**: `upcoming`, `active`, `completed`, `processing`, `cancelled`

### Relationships & Cascade Rules

| Parent          | Child           | Behavior       | Impact                        |
| --------------- | --------------- | -------------- | ----------------------------- |
| user            | session         | CASCADE DELETE | Logout all sessions           |
| user            | account         | CASCADE DELETE | Remove OAuth connections      |
| user            | agents          | CASCADE DELETE | Delete all user's agents      |
| user            | meetings        | CASCADE DELETE | Delete all user's meetings    |
| agents          | meetings        | CASCADE DELETE | Delete meetings with agent    |
| agents          | agent_documents | CASCADE DELETE | Delete agent's knowledge base |
| agent_documents | document_chunks | CASCADE DELETE | Delete all chunks             |
| meetings        | guest_users     | CASCADE DELETE | Remove meeting participants   |

---

## API Documentation

### REST API Endpoints

#### Authentication

-   `POST /api/auth/[...all]` - Authentication requests
-   `GET /api/auth/[...all]` - OAuth callbacks

#### Meetings

-   `GET /api/meetings/[meetingId]` - Fetch meeting details
-   `POST /api/meetings/send-invitation` - Send meeting invitations

#### Webhooks

-   `POST /api/webhook` - Stream.io webhook handler
    -   Events: `call.session_started`, `call.session_ended`, `call.transcription_ready`, `call.recording_ready`, `message.new`

#### Content Processing

-   `POST /api/github-analyze` - Analyze GitHub repositories
-   `POST /api/youtube-transcript` - Extract YouTube transcripts
-   `POST /api/web-scraper` - Scrape web content
-   `POST /api/rag-pdf` - Process PDF files for RAG
-   `POST /api/summarize-mindmap` - Generate node summaries

#### Integrations

-   `POST /api/send-summary-email` - Send email summaries
-   `POST /api/send-summary-notion` - Create Notion pages
-   `GET /api/notion/callback` - Notion OAuth callback

#### Background Jobs

-   `POST /api/inngest` - Inngest event processing

### tRPC API

Base URL: `/api/trpc/[trpc]`

#### Agents Router

**Queries**

-   `agents.getOne({ id })` - Fetch single agent with meeting count
-   `agents.getMany({ page?, pageSize?, search? })` - Paginated agent list

**Mutations**

-   `agents.create({ name, instructions, githubRepo? })` - Create agent
-   `agents.update({ id, name, instructions, githubRepo? })` - Update agent
-   `agents.remove({ id })` - Delete agent

#### Meetings Router

**Queries**

-   `meetings.getOne({ id })` - Fetch single meeting with agent and duration
-   `meetings.getMany({ page?, pageSize?, search?, agentId?, status? })` - Paginated meeting list
-   `meetings.getTranscript({ id })` - Fetch meeting transcript with speakers
-   `meetings.generateToken()` - Generate Stream Video token
-   `meetings.generateChatToken()` - Generate Stream Chat token

**Mutations**

-   `meetings.create({ name, agentId })` - Create meeting + Stream call
-   `meetings.update({ id, name?, status?, summary? })` - Update meeting
-   `meetings.remove({ id })` - Delete meeting
-   `meetings.sendInvitation({ meetingId, recipientEmails, scheduledDate, scheduledTime, message? })` - Send invitations

### Error Handling

#### tRPC Error Codes

-   `BAD_REQUEST` (400) - Invalid input
-   `UNAUTHORIZED` (401) - Missing authentication
-   `NOT_FOUND` (404) - Resource not found
-   `INTERNAL_SERVER_ERROR` (500) - Unexpected errors

---

## Core Modules

## Agents Module

AI agents are customizable assistants that participate in meetings with specialized knowledge and instructions.

![Agent Form](screenshots/Agent%20form.png)
![Agent Form Extended](screenshots/Agent%20Form%20extended.png)

### Features

-   Custom instructions for agent behavior
-   Knowledge enhancement via multiple sources:
    -   PDF documents (RAG system)
    -   GitHub repositories
    -   YouTube videos
    -   Web scraping
-   Meeting participation with Stream Video
-   Context-aware responses

### RAG Service

The RAG (Retrieval Augmented Generation) system provides agents with document-based knowledge.

**Key Methods:**

1. **`processPDF(fileBuffer, agentId, fileName)`**

    - Extracts text from PDF
    - Splits into chunks (1000 chars, 200 overlap)
    - Generates embeddings using OpenAI `text-embedding-3-small`
    - Stores in database with vector embeddings

2. **`query(agentId, query, limit)`**

    - Generates embedding for query
    - Performs cosine similarity search
    - Returns top N relevant chunks

3. **`enhanceInstructions(agentId, baseInstructions)`**
    - Retrieves all agent knowledge context
    - Appends to base instructions
    - Returns enhanced prompt for AI

### Component Structure

```
modules/agents/
├── hooks/
│   └── use-agents-filters.ts
├── services/
│   └── rag-service.ts
├── server/
│   └── procedures.ts
├── ui/
│   ├── components/
│   │   ├── agent-form.tsx
│   │   ├── agent-sources.tsx
│   │   ├── new-agent-dialog.tsx
│   │   └── update-agent-dialog.tsx
│   └── views/
│       ├── agent-id-view.tsx
│       └── agents-view.tsx
├── schemas.ts
└── types.ts
```

### Usage Example

```typescript
// Create agent with PDF knowledge
const agent = await trpc.agents.create.mutate({
    name: "Python Tutor",
    instructions: "Expert in Python programming",
});

// Upload PDF
const result = await RAGService.processPDF(
    pdfBuffer,
    agent.id,
    "python-guide.pdf"
);

// Query knowledge
const context = await RAGService.query(agent.id, "How to use async/await?", 5);
```

---

## Meetings Module

Manages the complete meeting lifecycle from creation to post-meeting analysis.

![Meeting Form](screenshots/meeting%20form.png)
![Meeting Lobby](screenshots/Meeting%20Lobby.png)
![Meeting Interface](screenshots/Meeting.png)
![Meeting Ended](screenshots/Call%20Ended.png)
![Meeting Summary](screenshots/Summary.png)

### Meeting Lifecycle

```
1. Creation → upcoming status
2. Pre-Meeting → invitation emails, join link sharing
3. Active → real-time video/audio, transcription, recording
4. Completion → status: completed
5. Post-Processing → AI summarization via Inngest
6. Archive → transcript, recording, summary available
```

### Stream Integration

**Video Configuration:**

```typescript
{
  type: "default",
  id: meetingId,
  settings_override: {
    transcription: {
      language: "en",
      mode: "auto-on",
      closed_caption_mode: "auto-on"
    },
    recording: {
      mode: "auto-on",
      quality: "1080p"
    }
  }
}
```

### Inngest Processing

**Event:** `meetings/processing`

**Steps:**

1. Fetch transcript from Stream URL (JSONL format)
2. Parse and add speaker information
3. AI summarization with GPT-4o
4. Generate structured markdown output
5. Store summary in database
6. Update status to `completed`

**AI Summarizer Output:**

```markdown
### Overview

[Detailed narrative summary]

### Notes

[Thematic sections with timestamps and bullet points]
```

### Component Structure

```
modules/meetings/
├── hooks/
│   └── use-meetings-filters.ts
├── server/
│   └── procedures.ts
├── ui/
│   ├── components/
│   │   ├── meeting-form.tsx
│   │   ├── meeting-join-link.tsx
│   │   ├── transcript.tsx
│   │   ├── mindmap.tsx
│   │   ├── chat-ui.tsx
│   │   └── status-filter.tsx
│   └── views/
│       ├── meeting-id-view.tsx
│       └── meetings-view.tsx
├── schemas.ts
└── types.ts
```

### Usage Example

```typescript
// Create meeting
const meeting = await trpc.meetings.create.mutate({
    name: "Sprint Planning",
    agentId: "agent-123",
});

// Send invitations
await trpc.meetings.sendInvitation.mutate({
    meetingId: meeting.id,
    recipientEmails: ["user1@company.com", "user2@company.com"],
    scheduledDate: "2025-10-15",
    scheduledTime: "14:00",
    message: "Looking forward to discussing Q4 roadmap",
});

// Fetch transcript after meeting
const transcript = await trpc.meetings.getTranscript.query({
    id: meeting.id,
});
```

---

## Call Module

Real-time video conferencing interface powered by Stream Video SDK.

![Call Lobby](screenshots/Call%20Lobby.png)
![Call Interface](screenshots/Meeting.png)
![Call Ended](screenshots/Call%20Ended.png)
![Share Screen](screenshots/Share%20Screen.png)

### Call Flow Architecture

```
CallView → CallProvider → CallConnect → CallUI
           (Auth)         (Stream Init) (State Machine)
                                        ↓
                          Lobby → Active → Ended
```

### Component Breakdown

#### 1. CallView (`call-view.tsx`)

-   Entry point for call interface
-   Meeting validation and data fetching
-   Supports authenticated users and guests
-   Handles error states

#### 2. CallProvider (`call-provider.tsx`)

-   Authentication wrapper
-   Detects user type (authenticated/guest)
-   Retrieves credentials from session or sessionStorage
-   Generates avatars for users without images

#### 3. CallConnect (`call-connect.tsx`)

-   Initializes Stream Video client
-   Creates call instance
-   Manages token generation
-   Handles client cleanup

#### 4. CallUI (`call-ui.tsx`)

-   State machine: lobby → active → ended
-   Orchestrates transitions
-   Provides callbacks for join/leave

#### 5. CallLobby (`call-lobby.tsx`)

-   Pre-call device setup
-   Video preview with avatar fallback
-   Audio/video toggle controls
-   Permission handling
-   Join button

#### 6. CallActive (`call-active.tsx`)

-   Active meeting interface
-   Participant grid (SpeakerLayout)
-   Call controls (mic, camera, screen share, end call)
-   Meeting name header

#### 7. CallEnded (`call-ended.tsx`)

-   Post-call confirmation
-   Summary notification message
-   Navigation back to meetings

### Authentication Flows

**Authenticated Users:**

```
1. Server checks session
2. Fetch user data
3. Generate Stream token via tRPC
4. Initialize Stream client
```

**Guest Users:**

```
1. Retrieve guest data from sessionStorage
2. Use pre-generated token
3. Initialize Stream client with guest credentials
```

**SessionStorage Schema:**

```typescript
Key: `guestUser_${meetingId}`;
Value: {
    id: string;
    name: string;
    image: string | null;
    token: string;
}
```

### Stream SDK Integration

**Environment Variables:**

```bash
NEXT_PUBLIC_STREAM_VIDEO_API_KEY=your-key
STREAM_VIDEO_SECRET_KEY=your-secret
```

**Features Enabled:**

-   Real-time video/audio streaming
-   Automatic transcription (English)
-   Automatic recording (1080p)
-   Closed captions
-   Screen sharing
-   Participant management

### Usage Example

```typescript
// Initialize client
const client = new StreamVideoClient({
    apiKey: STREAM_API_KEY,
    user: { id, name, image },
    token: await trpc.meetings.generateToken.mutate(),
});

// Join call
const call = client.call("default", meetingId);
call.camera.disable(); // Start with camera off
call.microphone.disable(); // Start with mic off
await call.join();
```

---

## tRPC Implementation

tRPC provides end-to-end type safety for API communication.

### Why tRPC?

**Problems Solved:**

-   Type mismatches between frontend and backend
-   Manual API documentation
-   Boilerplate code
-   Runtime errors from type issues

**Benefits:**

-   Full TypeScript type safety
-   Automatic type inference
-   Compile-time error checking
-   IntelliSense and autocomplete
-   No code generation required

### Core Setup

#### Context Creation (`src/trpc/init.ts`)

```typescript
export const createTRPCContext = cache(async () => {
    return { userId: "user_123" };
});
```

#### Procedure Types

```typescript
// Base procedure (public)
export const baseProcedure = t.procedure;

// Protected procedure (requires auth)
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    return next({
        ctx: { ...ctx, auth: session },
    });
});
```

#### Router Configuration

```typescript
export const appRouter = createTRPCRouter({
    agents: agentsRouter,
    meetings: meetingsRouter,
});

export type AppRouter = typeof appRouter;
```

### Client Setup (`src/trpc/client.tsx`)

```typescript
export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

export function TRPCReactProvider({ children }) {
    const queryClient = getQueryClient();
    const [trpcClient] = useState(() =>
        createTRPCClient<AppRouter>({
            links: [httpBatchLink({ url: getUrl() })],
        })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
                {children}
            </TRPCProvider>
        </QueryClientProvider>
    );
}
```

### Usage Examples

#### Queries (Data Fetching)

```typescript
import { useTRPC } from "@/trpc/client";

function AgentDetails({ agentId }) {
    const trpc = useTRPC();
    const { data, isLoading, error } = trpc.agents.getOne.useQuery({
        id: agentId,
    });

    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage error={error.message} />;

    return <div>{data.name}</div>;
}
```

#### Mutations (Data Modification)

```typescript
function CreateAgentForm() {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const createAgent = trpc.agents.create.useMutation({
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: [["agents", "getMany"]],
            });
            toast.success(`Agent ${data.name} created!`);
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const handleSubmit = (formData) => {
        createAgent.mutate({
            name: formData.name,
            instructions: formData.instructions,
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Form fields */}
            <button type="submit" disabled={createAgent.isPending}>
                {createAgent.isPending ? "Creating..." : "Create Agent"}
            </button>
        </form>
    );
}
```

#### Server-Side Usage

```typescript
import { appRouter } from "@/trpc/routers/_app";
import { createTRPCContext } from "@/trpc/init";

// Create a caller instance
const caller = appRouter.createCaller(await createTRPCContext());

// Use in Server Component
export default async function AgentPage({ params }) {
    const agent = await caller.agents.getOne({ id: params.id });
    return <AgentDetails agent={agent} />;
}
```

### Procedure Anatomy

```typescript
export const agentsRouter = createTRPCRouter({
    getOne: protectedProcedure
        // 1. Input validation with Zod
        .input(z.object({ id: z.string() }))
        // 2. Query handler
        .query(async ({ input, ctx }) => {
            // 3. Database operation
            const [agent] = await db
                .select()
                .from(agents)
                .where(
                    and(
                        eq(agents.id, input.id),
                        eq(agents.userId, ctx.auth.user.id)
                    )
                );

            // 4. Error handling
            if (!agent) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Agent not found",
                });
            }

            // 5. Return typed response
            return agent;
        }),
});
```

### Best Practices

1. **Input Validation**: Always use Zod schemas

    ```typescript
    .input(z.object({
      email: z.string().email(),
      age: z.number().min(18).max(120)
    }))
    ```

2. **Error Handling**: Use appropriate error codes

    ```typescript
    throw new TRPCError({
        code: "NOT_FOUND",
        message: "Resource not found",
    });
    ```

3. **Query Invalidation**: Refresh data after mutations

    ```typescript
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["agents", "getMany"]] });
    };
    ```

4. **Authorization**: Always verify ownership

    ```typescript
    .where(
      and(
        eq(agents.id, input.id),
        eq(agents.userId, ctx.auth.user.id)
      )
    )
    ```

5. **Type Safety**: Export and reuse types
    ```typescript
    import type { RouterOutputs } from "@/trpc/routers/_app";
    type Agent = RouterOutputs["agents"]["getOne"];
    ```

### Performance Optimization

1. **Request Batching**: Multiple queries batched into single request
2. **Query Prefetching**: Load data server-side
3. **Stale Time**: Configure cache duration
    ```typescript
    const { data } = trpc.agents.getMany.useQuery(
        { page: 1 },
        { staleTime: 1000 * 60 * 5 } // 5 minutes
    );
    ```

---

## Environment Variables

Complete list of required environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Stream Video
NEXT_PUBLIC_STREAM_VIDEO_API_KEY=your-stream-api-key
STREAM_VIDEO_SECRET_KEY=your-stream-secret-key

# Stream Chat
NEXT_PUBLIC_STREAM_CHAT_API_KEY=your-chat-api-key
STREAM_CHAT_SECRET_KEY=your-chat-secret-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Email Service
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Notion (Optional)
NOTION_CLIENT_ID=your-notion-client-id
NOTION_CLIENT_SECRET=your-notion-client-secret
NOTION_REDIRECT_URI=http://localhost:3000/api/notion/callback

# Inngest
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run db:generate    # Generate migrations
npm run db:migrate     # Apply migrations
npm run db:studio      # Open Drizzle Studio

# Linting and formatting
npm run lint           # Run ESLint
npm run format         # Format code
```

---

## Resources

-   **Better Auth**: [better-auth.com](https://better-auth.com)
-   **tRPC**: [trpc.io](https://trpc.io)
-   **Stream Video**: [getstream.io/video](https://getstream.io/video)
-   **Drizzle ORM**: [orm.drizzle.team](https://orm.drizzle.team)
-   **Next.js**: [nextjs.org](https://nextjs.org)
-   **Inngest**: [inngest.com](https://inngest.com)
-   **OpenAI**: [platform.openai.com](https://platform.openai.com)

---

## Conclusion

SMTG provides a complete platform for AI-enhanced video meetings with automatic transcription, intelligent summarization, and powerful agent capabilities. The architecture emphasizes type safety, developer experience, and scalability through modern technologies like Next.js, tRPC, Stream SDK, and PostgreSQL.

For detailed implementation guides, refer to specific module documentation in the `/docs` folder.
