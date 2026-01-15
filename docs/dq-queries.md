# Database Queries Documentation

This document provides a comprehensive list of all database queries used in the project, categorized by their operation type.

---

## Table Population Queries

### Insert Agent Record

**Location:** [src/modules/agents/server/procedures.ts](../src/modules/agents/server/procedures.ts)

```typescript
await db
    .insert(agents)
    .values({
        ...input,
        userId: ctx.auth.user.id,
    })
    .returning();
```

**Description:** Creates a new AI agent associated with the authenticated user.

---

### Insert Meeting Record

**Location:** [src/modules/meetings/server/procedures.ts](../src/modules/meetings/server/procedures.ts)

```typescript
await db
    .insert(meetings)
    .values({
        ...input,
        userId: ctx.auth.user.id,
    })
    .returning();
```

**Description:** Creates a new meeting record with the authenticated user as the owner and associates it with a selected agent.

---

### Insert Guest User Record

**Location:** [src/app/join/[meetingId]/db-actions.ts](../src/app/join/[meetingId]/db-actions.ts)

```typescript
await db
    .insert(guestUsers)
    .values({
        id: guestId,
        name: name.trim(),
        meetingId: meetingId,
        userId: userId,
        image: avatarUrl,
    })
    .returning();
```

**Description:** Creates a guest user entry when someone joins a meeting without being authenticated, linking them to the meeting and account holder.

---

### Insert Agent Document Metadata

**Location:** [src/lib/rag/db-utils.ts](../src/lib/rag/db-utils.ts)

```typescript
await db
    .insert(agentDocuments)
    .values({
        agentId,
        name,
        url,
    })
    .returning({ id: agentDocuments.id });
```

**Description:** Saves metadata for a PDF document uploaded to an agent's knowledge base.

---

### Insert Document Chunks with Embeddings

**Location:** [src/lib/rag/db-utils.ts](../src/lib/rag/db-utils.ts)

```typescript
await db.insert(documentChunks).values(chunkValues);
```

**Description:** Inserts text chunks from processed PDF documents along with their vector embeddings for semantic search (RAG system).

---

## Data Retrieval Queries

### Retrieve Single Agent with Meeting Count

**Location:** [src/modules/agents/server/procedures.ts](../src/modules/agents/server/procedures.ts)

```typescript
await db
    .select({
        ...getTableColumns(agents),
        meetingCount: db.$count(meetings, eq(agents.id, meetings.agentId)),
    })
    .from(agents)
    .where(and(eq(agents.id, input.id), eq(agents.userId, ctx.auth.user.id)));
```

**Description:** Fetches a specific agent owned by the user along with the count of meetings using that agent.

---

### Retrieve Paginated Agents with Search

**Location:** [src/modules/agents/server/procedures.ts](../src/modules/agents/server/procedures.ts)

```typescript
await db
    .select({
        ...getTableColumns(agents),
        meetingCount: db.$count(meetings, eq(agents.id, meetings.agentId)),
    })
    .from(agents)
    .where(
        and(
            eq(agents.userId, ctx.auth.user.id),
            search ? ilike(agents.name, `%${search}%`) : undefined
        )
    )
    .orderBy(desc(agents.createdAt), desc(agents.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
```

**Description:** Retrieves a paginated list of agents for the current user with optional search filtering by agent name.

---

### Count Total Agents for User

**Location:** [src/modules/agents/server/procedures.ts](../src/modules/agents/server/procedures.ts)

```typescript
await db
    .select({ count: count() })
    .from(agents)
    .where(
        and(
            eq(agents.userId, ctx.auth.user.id),
            search ? ilike(agents.name, `%${search}%`) : undefined
        )
    );
```

**Description:** Counts the total number of agents for pagination, optionally filtered by search term.

---

### Retrieve Verified Agent Exists

**Location:** [src/modules/agents/services/rag-service.ts](../src/modules/agents/services/rag-service.ts)

```typescript
await db.select().from(agents).where(eq(agents.id, agentId));
```

**Description:** Verifies that an agent exists before processing PDF documents for RAG system.

---

### Retrieve Single Meeting with Agent Details

**Location:** [src/modules/meetings/server/procedures.ts](../src/modules/meetings/server/procedures.ts)

```typescript
await db
    .select({
        ...getTableColumns(meetings),
        agent: agents,
        duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as(
            "duration"
        ),
    })
    .from(meetings)
    .innerJoin(agents, eq(meetings.agentId, agents.id))
    .where(eq(meetings.id, input.id));
```

**Description:** Fetches meeting details including associated agent information and calculated meeting duration.

---

### Retrieve Meeting for Guest Access

**Location:** [src/modules/meetings/server/procedures.ts](../src/modules/meetings/server/procedures.ts)

```typescript
await db
    .select({
        ...getTableColumns(meetings),
        agent: agents,
        duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as(
            "duration"
        ),
    })
    .from(meetings)
    .innerJoin(agents, eq(meetings.agentId, agents.id))
    .where(eq(meetings.id, input.id));
```

**Description:** Retrieves meeting information for guest users joining via invitation link without ownership validation.

---

### Retrieve Paginated Meetings with Filters

**Location:** [src/modules/meetings/server/procedures.ts](../src/modules/meetings/server/procedures.ts)

```typescript
await db
    .select({
        ...getTableColumns(meetings),
        agent: agents,
        duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as(
            "duration"
        ),
    })
    .from(meetings)
    .innerJoin(agents, eq(meetings.agentId, agents.id))
    .where(
        and(
            eq(meetings.userId, ctx.auth.user.id),
            search ? ilike(meetings.name, `%${search}%`) : undefined,
            status ? eq(meetings.status, status) : undefined,
            agentId ? eq(meetings.agentId, agentId) : undefined
        )
    )
    .orderBy(desc(meetings.createdAt), desc(meetings.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
```

**Description:** Retrieves paginated meetings with optional filters for search term, status, and agent ID.

---

### Count Total Meetings for User

**Location:** [src/modules/meetings/server/procedures.ts](../src/modules/meetings/server/procedures.ts)

```typescript
await db
    .select({ count: count() })
    .from(meetings)
    .innerJoin(agents, eq(meetings.agentId, agents.id))
    .where(
        and(
            eq(meetings.userId, ctx.auth.user.id),
            search ? ilike(meetings.name, `%${search}%`) : undefined,
            status ? eq(meetings.status, status) : undefined,
            agentId ? eq(meetings.agentId, agentId) : undefined
        )
    );
```

**Description:** Counts total meetings for pagination calculation with applied filters.

---

### Retrieve Meeting for Invitation

**Location:** [src/modules/meetings/server/procedures.ts](../src/modules/meetings/server/procedures.ts)

```typescript
await db
    .select({
        id: meetings.id,
        name: meetings.name,
        userId: meetings.userId,
        agentId: meetings.agentId,
        agentName: agents.name,
    })
    .from(meetings)
    .innerJoin(agents, eq(meetings.agentId, agents.id))
    .where(
        and(eq(meetings.id, meetingId), eq(meetings.userId, ctx.auth.user.id))
    );
```

**Description:** Fetches meeting and agent details for sending email invitations to participants.

---

### Retrieve Meeting Transcript

**Location:** [src/modules/meetings/server/procedures.ts](../src/modules/meetings/server/procedures.ts)

```typescript
await db
    .select()
    .from(meetings)
    .where(
        and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id))
    );
```

**Description:** Retrieves meeting details to fetch the transcript URL for displaying conversation history.

---

### Retrieve User Speakers from Transcript

**Location:** [src/modules/meetings/server/procedures.ts](../src/modules/meetings/server/procedures.ts)

```typescript
await db.select().from(user).where(inArray(user.id, speakerIds));
```

**Description:** Fetches user details for speakers identified in the meeting transcript.

---

### Retrieve Agent Speakers from Transcript

**Location:** [src/modules/meetings/server/procedures.ts](../src/modules/meetings/server/procedures.ts)

```typescript
await db.select().from(agents).where(inArray(agents.id, speakerIds));
```

**Description:** Fetches agent details for AI speakers identified in the meeting transcript.

---

### Retrieve Guest User Details

**Location:** [src/modules/meetings/server/procedures.ts](../src/modules/meetings/server/procedures.ts)

```typescript
await db.select().from(guestUsers).where(eq(guestUsers.id, id));
```

**Description:** Fetches guest user information for displaying their details in the transcript.

---

### Retrieve Guest User by ID

**Location:** [src/app/join/[meetingId]/db-actions.ts](../src/app/join/[meetingId]/db-actions.ts)

```typescript
await db.select().from(guestUsers).where(eq(guestUsers.id, guestId));
```

**Description:** Retrieves guest user information for authentication and meeting access.

---

### Retrieve Meeting by ID for Webhook

**Location:** [src/app/api/webhook/route.ts](../src/app/api/webhook/route.ts)

```typescript
await db
    .select()
    .from(meetings)
    .where(
        and(
            eq(meetings.id, meetingId),
            not(eq(meetings.status, "completed")),
            not(eq(meetings.status, "active")),
            not(eq(meetings.status, "cancelled")),
            not(eq(meetings.status, "processing"))
        )
    );
```

**Description:** Fetches meeting that is eligible to be started (not already in a terminal state).

---

### Retrieve Agent for Meeting

**Location:** [src/app/api/webhook/route.ts](../src/app/api/webhook/route.ts)

```typescript
await db.select().from(agents).where(eq(agents.id, existingMeeting.agentId));
```

**Description:** Retrieves the AI agent associated with a meeting to configure its behavior and instructions.

---

### Retrieve Completed Meeting for Chat

**Location:** [src/app/api/webhook/route.ts](../src/app/api/webhook/route.ts)

```typescript
await db
    .select()
    .from(meetings)
    .where(and(eq(meetings.id, channelId), eq(meetings.status, "completed")));
```

**Description:** Fetches completed meeting details to provide context for post-meeting chat interactions.

---

### Retrieve Agent Document IDs

**Location:** [src/modules/agents/services/rag-service.ts](../src/modules/agents/services/rag-service.ts)

```typescript
await db
    .select({ id: agentDocuments.id })
    .from(agentDocuments)
    .where(eq(agentDocuments.agentId, agentId));
```

**Description:** Fetches all document IDs associated with an agent for RAG query processing.

---

### Retrieve Document Chunks for RAG Query

**Location:** [src/modules/agents/services/rag-service.ts](../src/modules/agents/services/rag-service.ts)

```typescript
await db
    .select({
        content: documentChunks.content,
        pageNumber: documentChunks.pageNumber,
        chunkNumber: documentChunks.chunkNumber,
        embedding: documentChunks.embedding,
    })
    .from(documentChunks)
    .where(eq(documentChunks.documentId, doc.id));
```

**Description:** Retrieves text chunks with their embeddings from a document for semantic similarity search.

---

### Retrieve Agent Documents with Names

**Location:** [src/modules/agents/services/rag-service.ts](../src/modules/agents/services/rag-service.ts)

```typescript
await db
    .select({
        id: agentDocuments.id,
        name: agentDocuments.name,
    })
    .from(agentDocuments)
    .where(eq(agentDocuments.agentId, agentId));
```

**Description:** Fetches all documents for an agent to build complete knowledge context.

---

### Retrieve Document Chunks Ordered by Chunk Number

**Location:** [src/modules/agents/services/rag-service.ts](../src/modules/agents/services/rag-service.ts)

```typescript
await db
    .select({
        content: documentChunks.content,
        pageNumber: documentChunks.pageNumber,
        chunkNumber: documentChunks.chunkNumber,
    })
    .from(documentChunks)
    .where(eq(documentChunks.documentId, doc.id))
    .orderBy(asc(documentChunks.chunkNumber))
    .limit(20);
```

**Description:** Retrieves the first 20 chunks from each document in order to provide knowledge base context for AI agents.

---

### Retrieve Document IDs for Similar Chunks Search

**Location:** [src/lib/rag/db-utils.ts](../src/lib/rag/db-utils.ts)

```typescript
await db
    .select({ id: agentDocuments.id })
    .from(agentDocuments)
    .where(eq(agentDocuments.agentId, agentId));
```

**Description:** Fetches agent's document IDs for finding similar chunks based on query embedding.

---

### Retrieve Similar Document Chunks

**Location:** [src/lib/rag/db-utils.ts](../src/lib/rag/db-utils.ts)

```typescript
await db
    .select({
        content: documentChunks.content,
        pageNumber: documentChunks.pageNumber,
        chunkNumber: documentChunks.chunkNumber,
    })
    .from(documentChunks)
    .where(eq(documentChunks.documentId, documentIds[0]))
    .limit(limit);
```

**Description:** Retrieves limited chunks from a document for vector similarity comparison.

---

### Retrieve User Speakers for Transcript Processing

**Location:** [src/inngest/functions.ts](../src/inngest/functions.ts)

```typescript
await db.select().from(user).where(inArray(user.id, speakerIds));
```

**Description:** Fetches user information for meeting transcript processing to identify human speakers.

---

### Retrieve Agent Speakers for Transcript Processing

**Location:** [src/inngest/functions.ts](../src/inngest/functions.ts)

```typescript
await db.select().from(agents).where(inArray(agents.id, speakerIds));
```

**Description:** Fetches agent information for meeting transcript processing to identify AI speakers.

---

## Data Update Queries

### Update Agent Details

**Location:** [src/modules/agents/server/procedures.ts](../src/modules/agents/server/procedures.ts)

```typescript
await db
    .update(agents)
    .set(input)
    .where(and(eq(agents.id, input.id), eq(agents.userId, ctx.auth.user.id)))
    .returning();
```

**Description:** Updates an existing agent's properties (name, instructions, GitHub repo) ensuring user ownership.

---

### Update Meeting Details

**Location:** [src/modules/meetings/server/procedures.ts](../src/modules/meetings/server/procedures.ts)

```typescript
await db
    .update(meetings)
    .set(input)
    .where(
        and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id))
    )
    .returning();
```

**Description:** Updates meeting properties (name, agent, status) with ownership validation.

---

### Update Meeting Status to Active

**Location:** [src/app/api/webhook/route.ts](../src/app/api/webhook/route.ts)

```typescript
await db
    .update(meetings)
    .set({ status: "active", startedAt: new Date() })
    .where(eq(meetings.id, existingMeeting.id));
```

**Description:** Marks a meeting as active when the call session starts, recording the start time.

---

### Update Meeting Status to Processing

**Location:** [src/app/api/webhook/route.ts](../src/app/api/webhook/route.ts)

```typescript
await db
    .update(meetings)
    .set({
        status: "processing",
        endedAt: new Date(),
    })
    .where(and(eq(meetings.id, meetingId), eq(meetings.status, "active")));
```

**Description:** Changes meeting status to processing when the call ends, recording the end time for transcript generation.

---

### Update Meeting with Transcript URL

**Location:** [src/app/api/webhook/route.ts](../src/app/api/webhook/route.ts)

```typescript
await db
    .update(meetings)
    .set({
        transcriptUrl: event.call_transcription.url,
    })
    .where(eq(meetings.id, meetingId))
    .returning();
```

**Description:** Stores the URL of the generated transcript when Stream webhook confirms transcription is ready.

---

### Update Meeting with Recording URL

**Location:** [src/app/api/webhook/route.ts](../src/app/api/webhook/route.ts)

```typescript
await db
    .update(meetings)
    .set({
        recordingUrl: event.call_recording.url,
    })
    .where(eq(meetings.id, meetingId));
```

**Description:** Stores the URL of the meeting recording when Stream webhook confirms recording is ready.

---

### Update Meeting with Summary and Complete Status

**Location:** [src/inngest/functions.ts](../src/inngest/functions.ts)

```typescript
await db
    .update(meetings)
    .set({
        summary: (output[0] as TextMessage).content as string,
        status: "completed",
    })
    .where(eq(meetings.id, event.data.meetingId));
```

**Description:** Saves the AI-generated meeting summary and marks the meeting as completed after transcript processing.

---

## Data Deletion Queries

### Delete Agent

**Location:** [src/modules/agents/server/procedures.ts](../src/modules/agents/server/procedures.ts)

```typescript
await db
    .delete(agents)
    .where(and(eq(agents.id, input.id), eq(agents.userId, ctx.auth.user.id)))
    .returning();
```

**Description:** Permanently deletes an agent and all associated data (cascade deletes meetings, documents, chunks) with ownership validation.

---

### Delete Meeting

**Location:** [src/modules/meetings/server/procedures.ts](../src/modules/meetings/server/procedures.ts)

```typescript
await db
    .delete(meetings)
    .where(
        and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id))
    )
    .returning();
```

**Description:** Permanently deletes a meeting and all associated data (cascade deletes guest users) with ownership validation.

---

## Database Schema Reference

### Tables

-   **user**: User accounts and authentication
-   **session**: Active user sessions
-   **account**: OAuth account connections
-   **verification**: Email verification tokens
-   **agents**: AI agents with custom instructions
-   **meetings**: Video meetings with AI agents
-   **guestUsers**: Guest participants in meetings
-   **agentDocuments**: PDF documents uploaded to agents
-   **documentChunks**: Text chunks with vector embeddings for RAG

### Key Relationships

-   `agents.userId` → `user.id` (cascade delete)
-   `meetings.userId` → `user.id` (cascade delete)
-   `meetings.agentId` → `agents.id` (cascade delete)
-   `guestUsers.meetingId` → `meetings.id` (cascade delete)
-   `guestUsers.userId` → `user.id` (cascade delete)
-   `agentDocuments.agentId` → `agents.id` (cascade delete)
-   `documentChunks.documentId` → `agentDocuments.id` (cascade delete)

---
