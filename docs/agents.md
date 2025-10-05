# Agents Module

The Agents module manages AI agents within the SMTG application. Agents are AI personas that participate in meetings with users, following specific instructions and behaviors. They can be enhanced with knowledge from various sources including PDFs, GitHub repositories, YouTube videos, and websites.

## Overview

Agents are user-created AI participants that can join meetings and interact based on customized instructions. Each agent can have specialized knowledge through various content sources and participates in meetings using the Stream Video API.

![Agent Form](../screenshots/Agent%20form.png)
![Agent Form Extended](../screenshots/Agent%20Form%20extended.png)

## Table of Contents

-   [Agents Module Structure](#agents-module-structure)
-   [Database Schema for agents](#database-schema-for-agents)
-   [tRPC API for agents](#trpc-api)
-   [Validation Schemas](#validation-schemas)
-   [Type Definitions](#type-definitions)
-   [RAG Service](#rag-service)
-   [React Hooks](#react-hooks)
-   [UI Components](#ui-components)
-   [Usage Examples](#usage-examples)

---

## Agents Module Structure

```
src/modules/agents/
├── hooks/
│   └── use-agents-filters.ts      # Filter state management hook
├── server/
│   └── procedures.ts               # tRPC procedures (CRUD operations)
├── services/
│   └── rag-service.ts              # RAG (Retrieval Augmented Generation) service
├── ui/
│   ├── components/                 # Reusable agent UI components
│   │   ├── agent-form.tsx          # Form for creating/editing agents
│   │   ├── agent-id-view-header.tsx # Header for individual agent view
│   │   ├── agent-sources.tsx       # Knowledge source management
│   │   ├── agents-list-header.tsx  # Header for agents list view
│   │   ├── agents-search-filter.tsx # Search and filter controls
│   │   ├── columns.tsx             # Table column definitions
│   │   ├── data-pagination.tsx     # Pagination controls
│   │   ├── new-agent-dialog.tsx    # Dialog for creating new agents
│   │   └── update-agent-dialog.tsx # Dialog for updating agents
│   └── views/                      # Page-level views
│       ├── agent-id-view.tsx       # Individual agent detail view
│       └── agents-view.tsx         # Agents list view
├── params.ts                       # URL search params configuration
├── schemas.ts                      # Zod validation schemas
└── types.ts                        # TypeScript type definitions
```

---

## Database Schema For Agents

### `agents` Table

| Column         | Type        | Description                     | Constraints                                        |
| -------------- | ----------- | ------------------------------- | -------------------------------------------------- |
| `id`           | `text`      | Unique agent identifier         | Primary key, auto-generated (nanoid)               |
| `name`         | `text`      | Agent's display name            | Required                                           |
| `userId`       | `text`      | Owner's user ID                 | Required, foreign key → `user.id` (cascade delete) |
| `instructions` | `text`      | Agent's behavioral instructions | Required                                           |
| `githubRepo`   | `text`      | Optional GitHub repository URL  | Nullable                                           |
| `createdAt`    | `timestamp` | Creation timestamp              | Required, default: now()                           |
| `updatedAt`    | `timestamp` | Last update timestamp           | Required, default: now()                           |

### Related Tables

#### `agentDocuments` Table

Stores metadata for documents uploaded to agents (e.g., PDFs).

| Column      | Type        | Description                  |
| ----------- | ----------- | ---------------------------- |
| `id`        | `text`      | Document identifier (nanoid) |
| `agentId`   | `text`      | Reference to agent           |
| `name`      | `text`      | Original filename            |
| `url`       | `text`      | Storage URL (optional)       |
| `createdAt` | `timestamp` | Upload timestamp             |
| `updatedAt` | `timestamp` | Last update timestamp        |

#### `documentChunks` Table

Stores text chunks with embeddings for RAG functionality.

| Column        | Type        | Description                          |
| ------------- | ----------- | ------------------------------------ |
| `id`          | `text`      | Chunk identifier (nanoid)            |
| `documentId`  | `text`      | Reference to document                |
| `pageNumber`  | `text`      | Page number in document              |
| `chunkNumber` | `text`      | Chunk sequence number                |
| `content`     | `text`      | Text content                         |
| `embedding`   | `vector`    | Text embedding for similarity search |
| `createdAt`   | `timestamp` | Creation timestamp                   |
| `updatedAt`   | `timestamp` | Last update timestamp                |

---

## tRPC API

All procedures are protected and require authentication. They enforce user ownership of agents.

### Queries

#### `agents.getOne`

Fetches a single agent by ID with meeting statistics.

**Input:**

```typescript
{
    id: string; // Agent ID
}
```

**Output:**

```typescript
{
    id: string;
    name: string;
    userId: string;
    instructions: string;
    githubRepo: string | null;
    createdAt: Date;
    updatedAt: Date;
    meetingCount: number; // Count of associated meetings
}
```

**Errors:**

-   `NOT_FOUND` - Agent doesn't exist or doesn't belong to the user

**Example:**

```typescript
const agent = await trpc.agents.getOne.query({ id: "agent-123" });
console.log(`${agent.name} has ${agent.meetingCount} meetings`);
```

---

#### `agents.getMany`

Fetches a paginated list of agents with optional search filtering.

**Input:**

```typescript
{
  page?: number        // Default: 1
  pageSize?: number    // Default: 10, min: 1, max: 100
  search?: string      // Optional: search by name (case-insensitive)
}
```

**Output:**

```typescript
{
    items: Array<{
        id: string;
        name: string;
        userId: string;
        instructions: string;
        githubRepo: string | null;
        createdAt: Date;
        updatedAt: Date;
        meetingCount: number;
    }>;
    total: number; // Total count of agents
    totalPages: number; // Total number of pages
}
```

**Example:**

```typescript
const { items, total, totalPages } = await trpc.agents.getMany.query({
    page: 1,
    pageSize: 10,
    search: "python",
});
```

---

### Mutations

#### `agents.create`

Creates a new agent.

**Input:**

```typescript
{
  name: string              // Agent name (required, min 1 char)
  instructions: string      // Agent instructions (required, min 1 char)
  githubRepo?: string | null // Optional GitHub repository URL
}
```

**Output:**

```typescript
{
    id: string; // Generated agent ID
    name: string;
    userId: string; // Automatically set to current user
    instructions: string;
    githubRepo: string | null;
    createdAt: Date;
    updatedAt: Date;
}
```

**Example:**

```typescript
const agent = await trpc.agents.create.mutate({
    name: "Python Tutor",
    instructions: "A Python programming expert specializing in data structures",
    githubRepo: null,
});
```

---

#### `agents.update`

Updates an existing agent.

**Input:**

```typescript
{
  id: string                // Agent ID (required)
  name: string              // Updated name (required)
  instructions: string      // Updated instructions (required)
  githubRepo?: string | null // Updated GitHub repo URL
}
```

**Output:**

```typescript
{
    id: string;
    name: string;
    userId: string;
    instructions: string;
    githubRepo: string | null;
    createdAt: Date;
    updatedAt: Date;
}
```

**Errors:**

-   `NOT_FOUND` - Agent doesn't exist or doesn't belong to the user

**Example:**

```typescript
const updated = await trpc.agents.update.mutate({
    id: "agent-123",
    name: "Advanced Python Tutor",
    instructions: "Expert in Python with focus on algorithms and ML",
});
```

---

#### `agents.remove`

Deletes an agent and all associated data (cascade delete).

**Input:**

```typescript
{
    id: string; // Agent ID to delete
}
```

**Output:**

```typescript
{
    id: string;
    name: string;
    userId: string;
    instructions: string;
    githubRepo: string | null;
    createdAt: Date;
    updatedAt: Date;
}
```

**Errors:**

-   `NOT_FOUND` - Agent doesn't exist or doesn't belong to the user

**Example:**

```typescript
const deleted = await trpc.agents.remove.mutate({ id: "agent-123" });
```

---

## Validation Schemas

### `agentsInsertSchema`

Zod schema for creating agents.

```typescript
z.object({
    name: z.string().min(1, { message: "Name is required" }),
    instructions: z.string().min(1, { message: "Instructions are required" }),
    githubRepo: z.string().optional().nullable(),
});
```

### `agentsUpdateSchema`

Zod schema for updating agents (extends insert schema with ID).

```typescript
agentsInsertSchema.extend({
    id: z.string().min(1, { message: "Id is required" }),
});
```

---

## Type Definitions

### `AgentGetOne`

Type-safe representation of a single agent query result.

```typescript
type AgentGetOne = inferRouterOutputs<AppRouter>["agents"]["getOne"];
```

### `AgentsGetMany`

Type-safe representation of paginated agents list items.

```typescript
type AgentsGetMany =
    inferRouterOutputs<AppRouter>["agents"]["getMany"]["items"];
```

---

## RAG Service

The `RAGService` class provides Retrieval Augmented Generation capabilities for agents, allowing them to leverage uploaded documents as knowledge sources.

### Methods

#### `RAGService.processPDF`

Processes a PDF file, extracts text, generates embeddings, and stores chunks in the database.

**Parameters:**

```typescript
{
    fileBuffer: ArrayBuffer; // PDF file buffer
    agentId: string; // Agent to associate with
    fileName: string; // Original filename
}
```

**Returns:**

```typescript
Promise<{
    documentId: string; // Generated document ID
    chunkCount: number; // Number of chunks created
}>;
```

**Process:**

1. Verifies agent exists
2. Extracts text from PDF
3. Splits text into chunks (1000 chars, 200 overlap)
4. Generates embeddings using OpenAI's `text-embedding-3-small`
5. Stores document metadata and chunks with embeddings

**Example:**

```typescript
const result = await RAGService.processPDF(
    pdfBuffer,
    "agent-123",
    "documentation.pdf"
);
console.log(`Created ${result.chunkCount} chunks`);
```

---

#### `RAGService.query`

Queries the RAG system using vector similarity search to find relevant document chunks.

**Parameters:**

```typescript
{
  agentId: string   // Agent ID
  query: string     // Search query
  limit?: number    // Max results (default: 5)
}
```

**Returns:**

```typescript
Promise<
    Array<{
        content: string; // Chunk text content
        pageNumber: number; // Page number
        chunkNumber: number; // Chunk number
        similarity: number; // Cosine similarity score (0-1)
    }>
>;
```

**Process:**

1. Generates embedding for query
2. Retrieves all chunks for agent's documents
3. Calculates cosine similarity for each chunk
4. Returns top N most similar chunks

**Example:**

```typescript
const results = await RAGService.query(
    "agent-123",
    "How do I use async/await?",
    5
);

results.forEach((result) => {
    console.log(`Similarity: ${result.similarity.toFixed(3)}`);
    console.log(`Page ${result.pageNumber}: ${result.content}`);
});
```

---

#### `RAGService.getAllKnowledgeContext`

Retrieves formatted knowledge context from all agent documents (first 20 chunks per document).

**Parameters:**

```typescript
{
    agentId: string; // Agent ID
}
```

**Returns:**

```typescript
Promise<string>; // Formatted knowledge context
```

**Output Format:**

```
=== KNOWLEDGE BASE ===
You have access to the following documents...

Document: filename.pdf
[Page 1, Section 0]
Content here...

=== END KNOWLEDGE BASE ===
```

---

#### `RAGService.enhanceInstructions`

Enhances agent instructions by appending all available knowledge context.

**Parameters:**

```typescript
{
    agentId: string; // Agent ID
    baseInstructions: string; // Original instructions
}
```

**Returns:**

```typescript
Promise<string>; // Enhanced instructions with knowledge context
```

**Example:**

```typescript
const enhanced = await RAGService.enhanceInstructions(
    "agent-123",
    "You are a Python expert"
);
// Returns: base instructions + knowledge base + behavioral guidelines
```

---

## React Hooks

### `useAgentsFilters`

Hook for managing URL search parameters for agents list filtering.

**Returns:**

```typescript
[
  filters: {
    search: string    // Search query (default: "")
    page: number      // Current page (default: 1)
  },
  setFilters: (filters: Partial<typeof filters>) => void
]
```

**Features:**

-   Syncs with URL query parameters
-   Clears default values from URL
-   Automatically updates URL on changes

**Example:**

```typescript
const [filters, setFilters] = useAgentsFilters();

// Update search
setFilters({ search: "python" });

// Update page
setFilters({ page: 2 });

// Reset filters
setFilters({ search: "", page: 1 });
```

---

## UI Components

### Core Components

#### `AgentForm`

Form component for creating and editing agents with knowledge source management.

**Props:**

```typescript
{
  onSuccess?: () => void       // Callback on successful save
  onCancel?: () => void        // Callback on cancel
  initialValues?: AgentGetOne  // Initial values for editing
}
```

**Features:**

-   Name and specialization fields
-   AI-powered instruction enhancement
-   Multiple knowledge source options:
    -   GitHub repositories
    -   YouTube videos
    -   Website URLs
    -   PDF documents
-   Form validation with Zod
-   Automatic PDF upload after agent creation

---

#### `AgentSources`

Component for managing agent knowledge sources (PDFs, YouTube, websites).

**Props:**

```typescript
{
  onSourcesProcessed: () => void            // Callback after processing
  sourceType: "pdf" | "youtube" | "website" // Source type
  agentId?: string                          // Agent ID (for updates)
  pendingPdfFiles?: File[]                  // PDF files to upload
  onPendingPdfFilesChange?: (files: File[]) => void
}
```

---

#### `NewAgentDialog`

Dialog component wrapping `AgentForm` for creating new agents.

---

#### `UpdateAgentDialog`

Dialog component wrapping `AgentForm` for updating existing agents.

---

### View Components

#### `AgentsView`

Main list view displaying all agents with search, pagination, and table.

**Features:**

-   Server-side pagination
-   Search by name
-   Table with sortable columns
-   Click to navigate to agent details
-   Empty state for no agents

---

#### `AgentIdView`

Detailed view for a single agent showing:

-   Agent information
-   Meeting statistics
-   Knowledge sources
-   Edit and delete actions

---

### List Components

#### `AgentsListHeader`

Header component with title, search input, and "Create Agent" button.

---

#### `AgentsSearchFilter`

Search input component with debounced filtering.

---

#### `columns`

Table column definitions for agent data table:

-   Avatar (generated from name)
-   Name
-   Instructions (truncated)
-   Meeting count
-   Created date
-   Actions (edit, delete)

---

## Usage Examples

### Creating an Agent

```typescript
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const createAgent = useMutation(
    trpc.agents.create.mutationOptions({
        onSuccess: async (data) => {
            await queryClient.invalidateQueries(
                trpc.agents.getMany.queryOptions({})
            );
            console.log("Created agent:", data.name);
        },
    })
);

createAgent.mutate({
    name: "Math Tutor",
    instructions: "Expert in calculus and algebra",
});
```

---

### Listing Agents with Search

```typescript
import { useSuspenseQuery } from "@tanstack/react-query";
import { useAgentsFilters } from "@/modules/agents/hooks/use-agents-filters";

const [filters, setFilters] = useAgentsFilters();

const { data } = useSuspenseQuery(trpc.agents.getMany.queryOptions(filters));

// data.items: agent array
// data.total: total count
// data.totalPages: page count
```

---

### Processing a PDF Document

```
// In an API route or server action
import { RAGService } from "@/modules/agents/services/rag-service";

export async function uploadPDF(formData: FormData) {
    const file = formData.get("file") as File;
    const agentId = formData.get("agentId") as string;

    const buffer = await file.arrayBuffer();

    const result = await RAGService.processPDF(buffer, agentId, file.name);

    return {
        success: true,
        documentId: result.documentId,
        chunks: result.chunkCount,
    };
}
```

---

### Querying Agent Knowledge

```
import { RAGService } from "@/modules/agents/services/rag-service";

// Find relevant context for a user's question
const relevantChunks = await RAGService.query(
    agentId,
    "What is the main feature?",
    3
);

// Build context for AI
const context = relevantChunks
    .map((chunk) => `[Page ${chunk.pageNumber}]: ${chunk.content}`)
    .join("\n\n");
```

---

## Best Practices

### Agent Instructions

1. **Be Specific**: Clearly define the agent's role and expertise
2. **Set Boundaries**: Specify what the agent should and shouldn't do
3. **Use Examples**: Provide examples of desired behavior
4. **Enhance with AI**: Use the built-in enhancement feature for better instructions

### Knowledge Sources

1. **PDF Documents**: Best for technical documentation, manuals, guides
2. **GitHub Repos**: Ideal for code examples and repository context
3. **YouTube**: Good for video transcripts and educational content
4. **Websites**: Useful for current information and articles

### Performance

1. **Chunk Size**: Default 1000 characters with 200 overlap works well
2. **Query Limit**: Start with 5 chunks, adjust based on needs
3. **Document Count**: Limit to 20 chunks per document for context limits
4. **Embeddings**: Uses OpenAI's `text-embedding-3-small` (1536 dimensions)

---

## Related Modules

-   [Meetings Module](./meetings.md) - Agents participate in meetings
-   [Auth Module](./auth.md) - Agent ownership and permissions
-   [Database Module](./database.md) - Schema and migrations
-   [tRPC Module](./trpc.md) - API layer and type safety
