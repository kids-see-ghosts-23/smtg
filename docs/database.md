# Database Schema Documentation

> **Last Updated:** October 2025  
> **Database:** PostgreSQL  
> **ORM:** Drizzle ORM

## Table of Contents

-   [Overview](#overview)
-   [Schema Diagram](#schema-diagram)
-   [Authentication Tables](#authentication-tables)
-   [Core Application Tables](#core-application-tables)
-   [RAG & Document Tables](#rag--document-tables)
-   [Enums](#enums)
-   [Relationships](#relationships)

---

## Overview

The SMTG database schema is organized into three main domains:

1. **🔐 Authentication** - User management, sessions, and OAuth accounts
2. **🤖 Core Application** - Agents, meetings, and guest users
3. **📄 RAG System** - Document storage and vector embeddings for AI context

### Technology Stack

-   **Database:** PostgreSQL with pgvector extension
-   **ORM:** Drizzle ORM
-   **ID Generation:** nanoid for user-friendly IDs
-   **Vector Embeddings:** 1536 dimensions (OpenAI ada-002)

---

## Schema Diagram

```
┌─────────┐
│  user   │────┐
└─────────┘    │
      │        │
      ├────────┼──────┐
      │        │      │
      ▼        ▼      ▼
┌─────────┐ ┌────────┐ ┌────────────┐
│ session │ │account │ │   agents   │
└─────────┘ └────────┘ └────────────┘
                              │
                              ├─────────────┬──────────────┐
                              ▼             ▼              ▼
                       ┌──────────┐  ┌───────────┐  ┌──────────────────┐
                       │ meetings │  │guest_users│  │agent_documents   │
                       └──────────┘  └───────────┘  └──────────────────┘
                                                            │
                                                            ▼
                                                     ┌──────────────────┐
                                                     │document_chunks   │
                                                     └──────────────────┘
```

---

## Authentication Tables

### `user`

**Purpose:** Core user information and authentication data.

| Column          | Type        | Constraints             | Description                |
| --------------- | ----------- | ----------------------- | -------------------------- |
| `id`            | `text`      | PRIMARY KEY             | Unique user identifier     |
| `name`          | `text`      | NOT NULL                | User's display name        |
| `email`         | `text`      | NOT NULL, UNIQUE        | User's email address       |
| `emailVerified` | `boolean`   | NOT NULL, DEFAULT false | Email verification status  |
| `image`         | `text`      | NULLABLE                | Profile picture URL        |
| `createdAt`     | `timestamp` | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| `updatedAt`     | `timestamp` | NOT NULL, DEFAULT NOW() | Last update timestamp      |

**Example Query:**

```typescript
const user = await db.query.user.findFirst({
    where: eq(user.email, "user@example.com"),
});
```

---

### `session`

**Purpose:** Manages active user sessions and authentication tokens.

| Column      | Type        | Constraints                              | Description                  |
| ----------- | ----------- | ---------------------------------------- | ---------------------------- |
| `id`        | `text`      | PRIMARY KEY                              | Session identifier           |
| `expiresAt` | `timestamp` | NOT NULL                                 | Session expiration time      |
| `token`     | `text`      | NOT NULL, UNIQUE                         | Session authentication token |
| `createdAt` | `timestamp` | NOT NULL                                 | Session creation time        |
| `updatedAt` | `timestamp` | NOT NULL                                 | Last activity time           |
| `ipAddress` | `text`      | NULLABLE                                 | Client IP address            |
| `userAgent` | `text`      | NULLABLE                                 | Client browser/device info   |
| `userId`    | `text`      | NOT NULL, FK → `user.id`, CASCADE DELETE | Associated user              |

**Notes:**

-   Sessions automatically deleted when user is removed (CASCADE)
-   Token should be treated as sensitive data

---

### `account`

**Purpose:** OAuth provider connections and password storage.

| Column                  | Type        | Constraints                              | Description                          |
| ----------------------- | ----------- | ---------------------------------------- | ------------------------------------ |
| `id`                    | `text`      | PRIMARY KEY                              | Account record identifier            |
| `accountId`             | `text`      | NOT NULL                                 | Provider's account ID                |
| `providerId`            | `text`      | NOT NULL                                 | OAuth provider name (e.g., "google") |
| `userId`                | `text`      | NOT NULL, FK → `user.id`, CASCADE DELETE | Associated user                      |
| `accessToken`           | `text`      | NULLABLE                                 | OAuth access token                   |
| `refreshToken`          | `text`      | NULLABLE                                 | OAuth refresh token                  |
| `idToken`               | `text`      | NULLABLE                                 | OAuth ID token                       |
| `accessTokenExpiresAt`  | `timestamp` | NULLABLE                                 | Access token expiration              |
| `refreshTokenExpiresAt` | `timestamp` | NULLABLE                                 | Refresh token expiration             |
| `scope`                 | `text`      | NULLABLE                                 | OAuth permission scopes              |
| `password`              | `text`      | NULLABLE                                 | Hashed password (for email/password) |
| `createdAt`             | `timestamp` | NOT NULL                                 | Account link creation time           |
| `updatedAt`             | `timestamp` | NOT NULL                                 | Last update time                     |

**Security Notes:**

-   `password` field stores bcrypt hashed passwords only
-   OAuth tokens should be encrypted at rest
-   Users can have multiple accounts (different providers)

---

### `verification`

**Purpose:** Email verification and password reset tokens.

| Column       | Type        | Constraints   | Description              |
| ------------ | ----------- | ------------- | ------------------------ |
| `id`         | `text`      | PRIMARY KEY   | Verification record ID   |
| `identifier` | `text`      | NOT NULL      | Email or phone to verify |
| `value`      | `text`      | NOT NULL      | Verification token/code  |
| `expiresAt`  | `timestamp` | NOT NULL      | Token expiration time    |
| `createdAt`  | `timestamp` | DEFAULT NOW() | Token creation time      |
| `updatedAt`  | `timestamp` | DEFAULT NOW() | Last update time         |

**Usage:**

-   Email verification during signup
-   Password reset flows
-   Two-factor authentication (future)

---

## Core Application Tables

### `agents`

**Purpose:** AI agents with custom instructions and knowledge bases.

| Column         | Type        | Constraints                              | Description                         |
| -------------- | ----------- | ---------------------------------------- | ----------------------------------- |
| `id`           | `text`      | PRIMARY KEY, DEFAULT nanoid()            | Agent identifier                    |
| `name`         | `text`      | NOT NULL                                 | Agent display name                  |
| `userId`       | `text`      | NOT NULL, FK → `user.id`, CASCADE DELETE | Agent owner                         |
| `instructions` | `text`      | NOT NULL                                 | System prompt/behavior instructions |
| `githubRepo`   | `text`      | NULLABLE                                 | Linked GitHub repository (optional) |
| `createdAt`    | `timestamp` | NOT NULL, DEFAULT NOW()                  | Creation timestamp                  |
| `updatedAt`    | `timestamp` | NOT NULL, DEFAULT NOW()                  | Last modification timestamp         |

**Example:**

```typescript
const agent = await db.insert(agents).values({
    name: "Code Review Assistant",
    userId: "user_123",
    instructions: "You are an expert code reviewer...",
    githubRepo: "https://github.com/user/repo",
});
```

---

### `meetings`

**Purpose:** Video meetings with AI agents.

| Column          | Type             | Constraints                                | Description                  |
| --------------- | ---------------- | ------------------------------------------ | ---------------------------- |
| `id`            | `text`           | PRIMARY KEY, DEFAULT nanoid()              | Meeting identifier           |
| `name`          | `text`           | NOT NULL                                   | Meeting title                |
| `userId`        | `text`           | NOT NULL, FK → `user.id`, CASCADE DELETE   | Meeting creator              |
| `agentId`       | `text`           | NOT NULL, FK → `agents.id`, CASCADE DELETE | Participating agent          |
| `status`        | `meeting_status` | NOT NULL, DEFAULT 'upcoming'               | Current meeting state        |
| `startedAt`     | `timestamp`      | NULLABLE                                   | Actual start time            |
| `endedAt`       | `timestamp`      | NULLABLE                                   | Actual end time              |
| `transcriptUrl` | `text`           | NULLABLE                                   | Stored transcript location   |
| `recordingUrl`  | `text`           | NULLABLE                                   | Stored recording location    |
| `summary`       | `text`           | NULLABLE                                   | AI-generated meeting summary |
| `createdAt`     | `timestamp`      | NOT NULL, DEFAULT NOW()                    | Meeting creation time        |
| `updatedAt`     | `timestamp`      | NOT NULL, DEFAULT NOW()                    | Last update time             |

**Status Flow:**

```
upcoming → active → processing → completed
            ↓
         cancelled
```

---

### `guest_users`

**Purpose:** Track guest participants in meetings.

| Column      | Type        | Constraints                                  | Description              |
| ----------- | ----------- | -------------------------------------------- | ------------------------ |
| `id`        | `text`      | PRIMARY KEY                                  | Guest session identifier |
| `name`      | `text`      | NOT NULL                                     | Guest display name       |
| `meetingId` | `text`      | NOT NULL, FK → `meetings.id`, CASCADE DELETE | Associated meeting       |
| `userId`    | `text`      | NOT NULL, FK → `user.id`, CASCADE DELETE     | Inviting user            |
| `image`     | `text`      | NULLABLE                                     | Guest avatar URL         |
| `createdAt` | `timestamp` | NOT NULL, DEFAULT NOW()                      | Join time                |

**Use Case:**

-   External participants joining meetings
-   Temporary access tracking
-   Meeting attendance records

---

## RAG & Document Tables

### `agent_documents`

**Purpose:** Store uploaded documents for agent knowledge bases.

| Column      | Type        | Constraints                                | Description            |
| ----------- | ----------- | ------------------------------------------ | ---------------------- |
| `id`        | `text`      | PRIMARY KEY, DEFAULT nanoid()              | Document identifier    |
| `agentId`   | `text`      | NOT NULL, FK → `agents.id`, CASCADE DELETE | Owner agent            |
| `name`      | `text`      | NOT NULL                                   | Original filename      |
| `url`       | `text`      | NULLABLE                                   | Storage URL (S3, etc.) |
| `createdAt` | `timestamp` | NOT NULL, DEFAULT NOW()                    | Upload time            |
| `updatedAt` | `timestamp` | NOT NULL, DEFAULT NOW()                    | Last modification time |

**Supported Formats:**

-   PDF documents
-   Text files
-   Markdown files

---

### `document_chunks`

**Purpose:** Store vectorized chunks of documents for semantic search.

| Column        | Type           | Constraints                                         | Description                |
| ------------- | -------------- | --------------------------------------------------- | -------------------------- |
| `id`          | `text`         | PRIMARY KEY, DEFAULT nanoid()                       | Chunk identifier           |
| `documentId`  | `text`         | NOT NULL, FK → `agent_documents.id`, CASCADE DELETE | Parent document            |
| `pageNumber`  | `text`         | NULLABLE                                            | Source page number         |
| `chunkNumber` | `text`         | NULLABLE                                            | Chunk sequence within page |
| `content`     | `text`         | NOT NULL                                            | Text content of chunk      |
| `embedding`   | `vector(1536)` | NULLABLE                                            | OpenAI ada-002 vector      |
| `createdAt`   | `timestamp`    | NOT NULL, DEFAULT NOW()                             | Chunk creation time        |

**Vector Search Example:**

```typescript
// Find similar chunks using cosine similarity
const similarChunks = await db.execute(sql`
  SELECT content, pageNumber
  FROM document_chunks
  WHERE documentId IN (
    SELECT id FROM agent_documents WHERE agentId = ${agentId}
  )
  ORDER BY embedding <-> ${queryEmbedding}
  LIMIT 5
`);
```

**Notes:**

-   Requires pgvector extension
-   Embeddings generated via OpenAI API
-   Chunks typically 500-1000 tokens

---

## Enums

### `meeting_status`

Valid meeting states:

| Value        | Description                      |
| ------------ | -------------------------------- |
| `upcoming`   | 📅 Scheduled, not yet started    |
| `active`     | 🟢 Currently in progress         |
| `completed`  | ✅ Successfully finished         |
| `processing` | ⚙️ Generating transcript/summary |
| `cancelled`  | ❌ Cancelled by user             |

---

## Relationships

### Cascade Deletion Rules

| Parent Table      | Child Table(s)    | Behavior       | Impact                          |
| ----------------- | ----------------- | -------------- | ------------------------------- |
| `user`            | `session`         | CASCADE DELETE | Logout all sessions             |
| `user`            | `account`         | CASCADE DELETE | Remove OAuth connections        |
| `user`            | `agents`          | CASCADE DELETE | Delete all user's agents        |
| `user`            | `meetings`        | CASCADE DELETE | Delete all user's meetings      |
| `user`            | `guest_users`     | CASCADE DELETE | Remove guest invitations        |
| `agents`          | `meetings`        | CASCADE DELETE | Delete meetings with this agent |
| `agents`          | `agent_documents` | CASCADE DELETE | Delete agent's knowledge base   |
| `meetings`        | `guest_users`     | CASCADE DELETE | Remove meeting participants     |
| `agent_documents` | `document_chunks` | CASCADE DELETE | Delete all document chunks      |

### Foreign Key Map

```typescript
// Quick reference for joins
session.userId → user.id
account.userId → user.id
agents.userId → user.id
meetings.userId → user.id
meetings.agentId → agents.id
guest_users.meetingId → meetings.id
guest_users.userId → user.id
agent_documents.agentId → agents.id
document_chunks.documentId → agent_documents.id
```

---

## Quick Start Queries

### Create a new agent with document

```typescript
const agent = await db
    .insert(agents)
    .values({
        name: "Support Bot",
        userId: currentUser.id,
        instructions: "Help with customer support",
    })
    .returning();

const doc = await db.insert(agentDocuments).values({
    agentId: agent.id,
    name: "FAQ.pdf",
    url: "s3://bucket/faq.pdf",
});
```

### Schedule a meeting

```typescript
const meeting = await db.insert(meetings).values({
    name: "Q1 Review",
    userId: currentUser.id,
    agentId: "agent_abc123",
    status: "upcoming",
});
```

### Query agent with documents

```typescript
const agentWithDocs = await db.query.agents.findFirst({
    where: eq(agents.id, agentId),
    with: {
        documents: {
            with: {
                chunks: true,
            },
        },
    },
});
```

---

## Migrations

Migrations are managed with Drizzle Kit. To generate a new migration:

```bash
npm run db:generate  # Generate migration
npm run db:migrate   # Apply migration
npm run db:studio    # View database in UI
```

**Schema Location:** `/src/db/schema.ts`  



