# API Documentation

SMTG (Smart Meetings Transformed by GenAI) provides a comprehensive API for managing AI-powered meeting agents, conducting meetings, and processing meeting data. The API consists of REST endpoints for specific operations and tRPC procedures for type-safe client-server communication.

## Table of Contents

-   [Authentication](#authentication)
-   [REST API Endpoints](#rest-api-endpoints)
    -   [Authentication](#authentication-api)
    -   [Meetings](#meetings-api)
    -   [Webhooks](#webhook-api)
    -   [Email](#email-api)
    -   [Notion Integration](#notion-integration-api)
    -   [Content Processing](#content-processing-apis)
    -   [Background Jobs](#background-jobs-api)
-   [tRPC API](#trpc-api)
    -   [Agents Router](#agents-router)
    -   [Meetings Router](#meetings-router)
-   [Error Handling](#error-handling)

---

## Authentication

SMTG uses **Better Auth** for authentication and session management:

-   **Session-based authentication**: Most tRPC procedures and REST endpoints require an active user session
-   **Token-based authentication**: Stream Video and Chat tokens for real-time communication
-   **Guest access**: Temporary guest tokens for meeting participants without accounts
-   **Webhook authentication**: API keys and signature verification for webhook events

---

## REST API Endpoints

### Authentication API

#### `POST /api/auth/[...all]`

Handles authentication requests including sign-in, sign-up, and OAuth flows.

**Implementation:** Uses `better-auth/next-js` adapter

**Supported operations:**

-   Email/password authentication
-   OAuth provider authentication
-   Session management

#### `GET /api/auth/[...all]`

Handles OAuth callback requests and authentication verification.

**Implementation:** Uses `better-auth/next-js` to process OAuth callbacks

---

### Meetings API

#### `GET /api/meetings/[meetingId]`

Fetches meeting details by ID for joining purposes.

**Path Parameters:**

-   `meetingId` (string) - The unique identifier of the meeting

**Response:**

-   `200 OK` - Returns meeting information if the meeting is active or upcoming
-   `400 Bad Request` - Meeting is not available for joining (completed/cancelled)
-   `404 Not Found` - Meeting not found
-   `500 Internal Server Error` - Server error

**Response Body (200):**

```json
{
    "id": "meeting-uuid",
    "name": "Team Standup",
    "status": "upcoming",
    "agentId": "agent-uuid",
    "createdAt": "2025-01-15T10:00:00Z"
}
```

#### `POST /api/meetings/send-invitation`

Sends meeting invitation emails to multiple recipients.

**Authentication:** Required (session-based)

**Request Body:**

```json
{
    "meetingId": "meeting-uuid",
    "recipientEmails": ["user1@example.com", "user2@example.com"],
    "scheduledDate": "2025-01-20",
    "scheduledTime": "14:30",
    "message": "Optional custom message"
}
```

**Response:**

-   `200 OK` - Invitations sent successfully
    ```json
    {
        "success": true,
        "message": "Invitation sent to 2 recipient(s)"
    }
    ```
-   `400 Bad Request` - Missing required fields or invalid data
-   `401 Unauthorized` - User not authenticated
-   `404 Not Found` - Meeting not found or unauthorized
-   `500 Internal Server Error` - Failed to send invitations

**Features:**

-   Validates meeting ownership
-   Generates meeting join URLs
-   Creates calendar event attachments (.ics files)
-   Sends formatted HTML emails with meeting details

---

---

### Webhook API

#### `POST /api/webhook`

Processes Stream.io webhooks for real-time meeting events.

**Authentication:** Webhook signature verification

**Headers:**

-   `x-signature` (required) - Webhook signature for verification
-   `x-api-key` (required) - Stream API key

**Request Body:**

```json
{
  "type": "call.session_started",
  "call_cid": "default:meeting-id",
  "user": {...},
  "created_at": "2025-01-15T10:00:00Z"
}
```

**Supported Event Types:**

1. **`call.session_started`**

    - Triggered when a meeting starts
    - Updates meeting status to "active"
    - Initializes OpenAI real-time API for transcription

2. **`call.session_participant_left`**

    - Triggered when a participant leaves
    - Checks if meeting should be ended

3. **`call.session_ended`**

    - Triggered when call ends
    - Updates status to "processing"
    - Prepares for transcript processing

4. **`call.transcription_ready`**

    - Triggered when transcription is available
    - Stores transcript URL
    - Initiates AI processing pipeline

5. **`call.recording_ready`**

    - Triggered when recording is ready
    - Stores recording URL in database

6. **`message.new`**
    - Triggered on new chat messages
    - AI agent responds to completed meeting questions

**Response:**

-   `200 OK` - Event processed successfully
-   `400 Bad Request` - Missing signature or API key
-   `401 Unauthorized` - Invalid signature
-   `404 Not Found` - Meeting or agent not found
-   `500 Internal Server Error` - Processing error

---

### Email API

#### `POST /api/send-summary-email`

Sends meeting summaries via email.

**Authentication:** Not required (internal use)

**Request Body:**

```json
{
    "to": "recipient@example.com",
    "meetingName": "Team Standup",
    "summary": "## Meeting Summary\n\n- Key point 1\n- Key point 2",
    "agentName": "Alex Assistant",
    "date": "2025-01-15",
    "duration": "30 minutes"
}
```

**Required Fields:**

-   `to` - Recipient email address
-   `meetingName` - Name of the meeting
-   `summary` - Meeting summary content (supports Markdown)

**Optional Fields:**

-   `agentName` - AI agent name
-   `date` - Meeting date
-   `duration` - Meeting duration

**Response:**

-   `200 OK` - Email sent successfully
    ```json
    {
        "success": true,
        "messageId": "email-id"
    }
    ```
-   `400 Bad Request` - Missing required fields
-   `500 Internal Server Error` - Failed to send email

**Features:**

-   Markdown to HTML conversion
-   Professional email templates
-   Configurable SMTP settings via environment variables

---

### Notion Integration API

#### `POST /api/send-summary-notion`

Creates a Notion page with meeting summary.

**Authentication:** Not required (uses provided Notion token)

**Request Body:**

```json
{
    "notionToken": "secret_xyz...",
    "notionPageId": "parent-page-uuid",
    "meetingName": "Team Standup",
    "summary": "## Meeting Summary\n\n- Discussion points\n- Action items",
    "agentName": "Alex Assistant",
    "date": "2025-01-15",
    "duration": "30 minutes"
}
```

**Required Fields:**

-   `notionToken` - Notion integration token
-   `notionPageId` - Parent page ID where the summary will be created
-   `meetingName` - Name of the meeting
-   `summary` - Meeting summary (Markdown supported)

**Optional Fields:**

-   `agentName` - AI agent name
-   `date` - Meeting date
-   `duration` - Meeting duration

**Response:**

-   `200 OK` - Page created successfully
    ```json
    {
        "success": true,
        "pageId": "created-page-uuid"
    }
    ```
-   `400 Bad Request` - Missing required fields
-   `401 Unauthorized` - Invalid Notion token
-   `404 Not Found` - Parent page not found or no access
-   `500 Internal Server Error` - Failed to create page

**Markdown Support:**

-   Headings (H1, H2, H3)
-   Bold and italic text
-   Inline code
-   Bulleted and numbered lists
-   Paragraphs

#### `GET /api/notion/callback`

Handles Notion OAuth callback for workspace integration.

**Query Parameters:**

-   `code` (required) - OAuth authorization code from Notion

**Response:**

-   `200 OK` - Returns HTML page with postMessage containing:
    ```json
    {
        "access_token": "token",
        "page": {
            "id": "page-id",
            "title": "Page Title"
        }
    }
    ```
-   `400 Bad Request` - Missing authorization code
-   `500 Internal Server Error` - OAuth exchange failed

**Implementation:** Exchanges code for access token and fetches user's first page

---

### Content Processing APIs

#### `POST /api/github-analyze`

Analyzes GitHub repositories for agent training data.

**Authentication:** Not required

**Request Body:**

```json
{
    "repoUrl": "https://github.com/owner/repo"
}
```

**Response:**

-   `200 OK` - Analysis successful
    ```json
    {
      "success": true,
      "content": "Repository analysis content...",
      "metadata": {...}
    }
    ```
-   `400 Bad Request` - Missing or invalid repository URL
-   `500 Internal Server Error` - Analysis failed or repository not found

**Features:**

-   Extracts repository structure
-   Analyzes code patterns
-   Formats content for AI agent training

#### `POST /api/youtube-transcript`

Extracts transcripts from YouTube videos for agent training.

**Authentication:** Not required

**Request Body:**

```json
{
    "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**

-   `200 OK` - Transcript extracted
    ```json
    {
        "content": "YouTube Video Transcript Content:\n[transcript]..."
    }
    ```
-   `400 Bad Request` - Missing or invalid URL
-   `404 Not Found` - No transcript available
-   `500 Internal Server Error` - Extraction failed

**Supported URL Formats:**

-   `https://www.youtube.com/watch?v=VIDEO_ID`
-   `https://youtu.be/VIDEO_ID`
-   `https://www.youtube.com/embed/VIDEO_ID`
-   `https://www.youtube.com/v/VIDEO_ID`

**Limitations:**

-   Maximum transcript length: 5000 characters
-   Server-side processing to avoid CORS issues

#### `POST /api/web-scraper`

Scrapes content from websites for agent knowledge base.

**Authentication:** Not required

**Request Body:**

```json
{
    "url": "https://example.com/article"
}
```

**Response:**

-   `200 OK` - Content scraped successfully
    ```json
    {
        "content": "Web Page Content from https://example.com/article:\n...",
        "title": "Page Title",
        "metaDescription": "Page description",
        "headings": ["Heading 1", "Heading 2"],
        "links": [{ "text": "Link text", "url": "https://example.com/link" }]
    }
    ```
-   `400 Bad Request` - Missing or invalid URL
-   `500 Internal Server Error` - Scraping failed

**Features:**

-   Extracts main content from pages
-   Removes navigation, scripts, and styling
-   Collects metadata (title, description, headings)
-   Extracts links with context
-   Limits output to prevent oversized responses

#### `POST /api/rag-pdf`

Processes PDF files for RAG (Retrieval-Augmented Generation) system.

**Authentication:** Required (session-based)

**Content-Type:** `multipart/form-data`

**Form Data:**

-   `file` (File) - PDF file to process
-   `agentId` (string) - Agent ID to associate with the document

**Response:**

-   `200 OK` - PDF processed successfully
    ```json
    {
        "success": true,
        "message": "Document \"filename.pdf\" processed successfully with 42 chunks.",
        "documentId": "doc-uuid",
        "chunkCount": 42
    }
    ```
-   `400 Bad Request` - Missing file, invalid file type, or missing agent ID
-   `401 Unauthorized` - User not authenticated
-   `500 Internal Server Error` - Processing failed

**File Requirements:**

-   File type: `application/pdf`
-   Maximum size: Determined by server configuration

**Features:**

-   Extracts text from PDF
-   Chunks content for vector embeddings
-   Stores in RAG database for agent knowledge

#### `POST /api/summarize-mindmap`

Generates concise summaries for mindmap nodes.

**Authentication:** Not required

**Request Body:**

```json
{
    "text": "Long text content to summarize..."
}
```

**Response:**

-   `200 OK` - Summary generated
    ```json
    {
        "summary": "Concise Summary"
    }
    ```
-   `400 Bad Request` - Missing text
-   `500 Internal Server Error` - Summarization failed

**Features:**

-   Uses GPT-4 for intelligent summarization
-   Generates 2-3 word phrases
-   Optimized for mindmap node labels
-   Returns original text if already short (≤50 characters)

---

### Guest Authentication API

#### `POST /api/guest-auth`

Authenticates guest users for meeting access.

**Authentication:** Not required

**Request Body:**

```json
{
    "guestId": "guest-uuid"
}
```

**Response:**

-   `200 OK` - Guest authenticated
    ```json
    {
        "success": true,
        "token": "stream-video-token",
        "guestUser": {
            "id": "guest-uuid",
            "name": "Guest User",
            "image": "avatar-url",
            "meetingId": "meeting-uuid"
        }
    }
    ```
-   `400 Bad Request` - Missing guest ID
-   `404 Not Found` - Guest user not found
-   `500 Internal Server Error` - Authentication failed

**Token Details:**

-   Valid for 1 hour
-   Grants access to specific meeting only
-   Compatible with Stream Video SDK

---

### Background Jobs API

#### `POST /api/inngest`

Handles Inngest event processing for background jobs.

**Authentication:** Inngest signature verification

**Features:**

-   Asynchronous job processing
-   Event-driven workflows
-   Retry mechanisms

#### `GET /api/inngest`

Provides Inngest introspection and health checks.

#### `PUT /api/inngest`

Alternative endpoint for Inngest event processing.

**Implementation:** Uses `inngest/next` adapter

---

---

## tRPC API

SMTG uses tRPC for type-safe API communication between the client and server. All tRPC endpoints are accessed through `/api/trpc/[trpc]`.

### Base Configuration

**Endpoints:**

-   `POST /api/trpc/[trpc]` - Mutations
-   `GET /api/trpc/[trpc]` - Queries

**Implementation:** Uses `@trpc/server/adapters/fetch` with Next.js App Router

**Available Routers:**

-   `agents` - Agent management
-   `meetings` - Meeting management

---

### Agents Router

Manages AI meeting agents with their instructions and configurations.

#### Queries

##### `agents.getOne`

Fetches a single agent by ID with associated meeting count.

**Input:**

```typescript
{
    id: string; // Agent UUID
}
```

**Output:**

```typescript
{
    id: string;
    name: string;
    instructions: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    meetingCount: number; // Number of meetings using this agent
}
```

**Errors:**

-   `UNAUTHORIZED` - User not authenticated
-   `NOT_FOUND` - Agent not found or not owned by user

**Example:**

```typescript
const agent = await trpc.agents.getOne.query({ id: "agent-uuid" });
```

##### `agents.getMany`

Fetches paginated list of agents with optional search filtering.

**Input:**

```typescript
{
  page?: number;        // Default: 1, Min: 1
  pageSize?: number;    // Default: 10, Min: 1, Max: 100
  search?: string;      // Optional: Search by agent name
}
```

**Output:**

```typescript
{
    items: Array<{
        id: string;
        name: string;
        instructions: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        meetingCount: number;
    }>;
    total: number; // Total number of agents
    totalPages: number; // Total number of pages
}
```

**Errors:**

-   `UNAUTHORIZED` - User not authenticated
-   `BAD_REQUEST` - Invalid pagination parameters

**Example:**

```typescript
const agents = await trpc.agents.getMany.query({
    page: 1,
    pageSize: 10,
    search: "sales",
});
```

#### Mutations

##### `agents.create`

Creates a new AI agent with custom instructions.

**Input:**

```typescript
{
    name: string; // Min: 1 char, Max: 255 chars
    instructions: string; // Min: 1 char
}
```

**Output:**

```typescript
{
    id: string;
    name: string;
    instructions: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
```

**Errors:**

-   `UNAUTHORIZED` - User not authenticated
-   `BAD_REQUEST` - Invalid input (empty name/instructions)

**Example:**

```typescript
const agent = await trpc.agents.create.mutate({
    name: "Sales Assistant",
    instructions: "Help with sales meetings and follow-ups...",
});
```

##### `agents.update`

Updates an existing agent's name and/or instructions.

**Input:**

```typescript
{
  id: string;
  name?: string;         // Min: 1 char, Max: 255 chars
  instructions?: string; // Min: 1 char
}
```

**Output:**

```typescript
{
    id: string;
    name: string;
    instructions: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
```

**Errors:**

-   `UNAUTHORIZED` - User not authenticated
-   `NOT_FOUND` - Agent not found or not owned by user
-   `BAD_REQUEST` - Invalid input

**Example:**

```typescript
const updated = await trpc.agents.update.mutate({
    id: "agent-uuid",
    name: "Updated Sales Assistant",
});
```

##### `agents.remove`

Deletes an agent permanently.

**Input:**

```typescript
{
    id: string;
}
```

**Output:**

```typescript
{
    id: string;
    name: string;
    instructions: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
```

**Errors:**

-   `UNAUTHORIZED` - User not authenticated
-   `NOT_FOUND` - Agent not found or not owned by user

**Example:**

```typescript
const deleted = await trpc.agents.remove.mutate({ id: "agent-uuid" });
```

---

### Meetings Router

Manages meeting lifecycle, tokens, transcripts, and meeting data.

#### Queries

##### `meetings.getOne`

Fetches a single meeting by ID with agent details and calculated duration.

**Input:**

```typescript
{
    id: string; // Meeting UUID
}
```

**Output:**

```typescript
{
    id: string;
    name: string;
    agentId: string;
    userId: string;
    status: "upcoming" | "active" | "processing" | "completed" | "cancelled";
    startedAt: Date | null;
    endedAt: Date | null;
    transcriptUrl: string | null;
    recordingUrl: string | null;
    summary: string | null;
    createdAt: Date;
    updatedAt: Date;
    agent: {
        id: string;
        name: string;
        instructions: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    }
    duration: number | null; // Duration in seconds
}
```

**Errors:**

-   `UNAUTHORIZED` - User not authenticated
-   `NOT_FOUND` - Meeting not found or not owned by user

**Example:**

```typescript
const meeting = await trpc.meetings.getOne.query({ id: "meeting-uuid" });
```

##### `meetings.getMany`

Fetches paginated list of meetings with filtering options.

**Input:**

```typescript
{
  page?: number;                      // Default: 1
  pageSize?: number;                  // Default: 10, Min: 1, Max: 100
  search?: string;                    // Search by meeting name
  agentId?: string;                   // Filter by agent ID
  status?: "upcoming" | "active" | "processing" | "completed" | "cancelled";
}
```

**Output:**

```typescript
{
    items: Array<{
        id: string;
        name: string;
        agentId: string;
        userId: string;
        status: MeetingStatus;
        startedAt: Date | null;
        endedAt: Date | null;
        transcriptUrl: string | null;
        recordingUrl: string | null;
        summary: string | null;
        createdAt: Date;
        updatedAt: Date;
        agent: Agent;
        duration: number | null;
    }>;
    total: number;
    totalPages: number;
}
```

**Errors:**

-   `UNAUTHORIZED` - User not authenticated
-   `BAD_REQUEST` - Invalid pagination or filter parameters

**Example:**

```typescript
const meetings = await trpc.meetings.getMany.query({
    page: 1,
    pageSize: 10,
    status: "completed",
    agentId: "agent-uuid",
});
```

##### `meetings.getTranscript`

Fetches formatted transcript data for a completed meeting.

**Input:**

```typescript
{
    id: string; // Meeting UUID
}
```

**Output:**

```typescript
Array<{
    speaker_id: string;
    text: string;
    start_time: number; // Seconds from start
    end_time: number; // Seconds from start
    user: {
        name: string;
        image: string; // Avatar URL
    };
}>;
```

**Errors:**

-   `UNAUTHORIZED` - User not authenticated
-   `NOT_FOUND` - Meeting or transcript not found
-   `BAD_REQUEST` - Transcript not yet available

**Example:**

```typescript
const transcript = await trpc.meetings.getTranscript.query({
    id: "meeting-uuid",
});
```

#### Mutations

##### `meetings.create`

Creates a new meeting and associated Stream.io call.

**Input:**

```typescript
{
    name: string; // Min: 1 char, Max: 255 chars
    agentId: string; // Must be a valid agent ID owned by user
}
```

**Output:**

```typescript
{
    id: string;
    name: string;
    agentId: string;
    userId: string;
    status: "upcoming";
    startedAt: null;
    endedAt: null;
    transcriptUrl: null;
    recordingUrl: null;
    summary: null;
    createdAt: Date;
    updatedAt: Date;
}
```

**Errors:**

-   `UNAUTHORIZED` - User not authenticated
-   `BAD_REQUEST` - Invalid input or agent not found
-   `INTERNAL_SERVER_ERROR` - Failed to create Stream.io call

**Side Effects:**

-   Creates a Stream Video call
-   Enables transcription on the call
-   Enables recording on the call

**Example:**

```typescript
const meeting = await trpc.meetings.create.mutate({
    name: "Q1 Planning Meeting",
    agentId: "agent-uuid",
});
```

##### `meetings.update`

Updates an existing meeting's details.

**Input:**

```typescript
{
  id: string;
  name?: string;        // Min: 1 char, Max: 255 chars
  status?: "upcoming" | "active" | "processing" | "completed" | "cancelled";
  summary?: string;     // Meeting summary text
}
```

**Output:**

```typescript
{
    id: string;
    name: string;
    agentId: string;
    userId: string;
    status: MeetingStatus;
    startedAt: Date | null;
    endedAt: Date | null;
    transcriptUrl: string | null;
    recordingUrl: string | null;
    summary: string | null;
    createdAt: Date;
    updatedAt: Date;
}
```

**Errors:**

-   `UNAUTHORIZED` - User not authenticated
-   `NOT_FOUND` - Meeting not found or not owned by user
-   `BAD_REQUEST` - Invalid input

**Example:**

```typescript
const updated = await trpc.meetings.update.mutate({
    id: "meeting-uuid",
    status: "cancelled",
});
```

##### `meetings.remove`

Deletes a meeting permanently.

**Input:**

```typescript
{
    id: string;
}
```

**Output:**

```typescript
{
    id: string;
    name: string;
    agentId: string;
    userId: string;
    status: MeetingStatus;
    startedAt: Date | null;
    endedAt: Date | null;
    transcriptUrl: string | null;
    recordingUrl: string | null;
    summary: string | null;
    createdAt: Date;
    updatedAt: Date;
}
```

**Errors:**

-   `UNAUTHORIZED` - User not authenticated
-   `NOT_FOUND` - Meeting not found or not owned by user

**Example:**

```typescript
const deleted = await trpc.meetings.remove.mutate({ id: "meeting-uuid" });
```

##### `meetings.generateToken`

Generates a Stream Video JWT token for the authenticated user.

**Input:** None

**Output:**

```typescript
string; // JWT token for Stream Video SDK
```

**Token Details:**

-   Valid for 24 hours
-   Includes user ID and name
-   Required for Stream Video client initialization

**Errors:**

-   `UNAUTHORIZED` - User not authenticated
-   `INTERNAL_SERVER_ERROR` - Token generation failed

**Example:**

```typescript
const token = await trpc.meetings.generateToken.mutate();
// Use token to initialize Stream Video client
```

##### `meetings.generateChatToken`

Generates a Stream Chat JWT token for the authenticated user.

**Input:** None

**Output:**

```typescript
string; // JWT token for Stream Chat SDK
```

**Token Details:**

-   Valid for 24 hours
-   Includes user ID and name
-   Required for Stream Chat client initialization

**Errors:**

-   `UNAUTHORIZED` - User not authenticated
-   `INTERNAL_SERVER_ERROR` - Token generation failed

**Example:**

```typescript
const chatToken = await trpc.meetings.generateChatToken.mutate();
// Use token to initialize Stream Chat client
```

---

---

## Error Handling

SMTG uses consistent error handling patterns across REST and tRPC APIs.

### HTTP Status Codes (REST APIs)

| Status Code | Meaning               | Common Scenarios                                          |
| ----------- | --------------------- | --------------------------------------------------------- |
| `200`       | Success               | Request processed successfully                            |
| `400`       | Bad Request           | Invalid input, missing required fields, validation errors |
| `401`       | Unauthorized          | Missing authentication, invalid credentials               |
| `404`       | Not Found             | Resource doesn't exist or user lacks access               |
| `500`       | Internal Server Error | Unexpected server errors, external service failures       |

### tRPC Error Codes

| Error Code              | HTTP Equivalent | Description                                    |
| ----------------------- | --------------- | ---------------------------------------------- |
| `BAD_REQUEST`           | 400             | Invalid input data, validation failures        |
| `UNAUTHORIZED`          | 401             | Missing or invalid authentication              |
| `NOT_FOUND`             | 404             | Requested resource not found or not accessible |
| `INTERNAL_SERVER_ERROR` | 500             | Unexpected server errors                       |

### Error Response Formats

#### REST API Error Response

```json
{
    "error": "Descriptive error message",
    "details": "Additional error context (optional)"
}
```

**Example:**

```json
{
    "error": "Missing required fields",
    "details": "The 'meetingId' field is required"
}
```

#### tRPC Error Response

```json
{
    "error": {
        "message": "Detailed error message",
        "code": "ERROR_CODE",
        "data": {
            "code": "ERROR_CODE",
            "httpStatus": 400,
            "path": "agents.create"
        }
    }
}
```

**Example:**

```json
{
    "error": {
        "message": "Agent not found",
        "code": "NOT_FOUND",
        "data": {
            "code": "NOT_FOUND",
            "httpStatus": 404,
            "path": "agents.getOne"
        }
    }
}
```

### Common Error Scenarios

#### Authentication Errors

**Scenario:** User is not authenticated

```json
{
    "error": "Unauthorized"
}
```

**Solution:** Ensure user is logged in and session is valid

#### Validation Errors

**Scenario:** Invalid input data

```json
{
    "error": "Validation failed",
    "details": "Name must be at least 1 character long"
}
```

**Solution:** Check input data against validation rules

#### Not Found Errors

**Scenario:** Resource doesn't exist or user lacks access

```json
{
    "error": "Agent not found"
}
```

**Solution:** Verify resource ID and user permissions

#### Rate Limiting

**Scenario:** Too many requests

```json
{
    "error": "Rate limit exceeded",
    "details": "Maximum 100 requests per minute"
}
```

**Solution:** Implement request throttling on client side

---

## API Versioning

The current API version is **v1** (implicit). Breaking changes will be introduced in future versions with proper versioning in the URL path.

---

## Rate Limits

-   **Default:** 100 requests per minute per user
-   **Webhook endpoints:** No rate limiting (handled by Stream.io)
-   **Guest authentication:** 10 tokens per IP per hour

---

## Best Practices

### Authentication

1. **Store tokens securely:** Never expose tokens in client-side code
2. **Refresh tokens:** Implement token refresh logic before expiration
3. **Handle 401 errors:** Redirect to login when authentication fails

### Error Handling

1. **Always check status codes:** Don't assume success
2. **Display user-friendly messages:** Parse error responses for user display
3. **Log errors:** Track errors for debugging and monitoring

### Performance

1. **Use pagination:** Always paginate large lists (agents, meetings)
2. **Implement caching:** Cache frequently accessed data (agent details)
3. **Optimize queries:** Filter and search on the server side

### tRPC Usage

1. **Use type inference:** Leverage TypeScript types from tRPC
2. **Handle loading states:** Show loading indicators during queries
3. **Implement optimistic updates:** Update UI before server response for better UX

### Webhook Security

1. **Verify signatures:** Always validate webhook signatures
2. **Use HTTPS:** Ensure webhooks are sent over secure connections
3. **Implement idempotency:** Handle duplicate webhook events gracefully

---

## Environment Variables

Required environment variables for API functionality:

```bash
# Database
DATABASE_URL=postgresql://...

# Better Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# Stream.io
NEXT_PUBLIC_STREAM_API_KEY=your-stream-key
STREAM_API_SECRET=your-stream-secret

# OpenAI
OPENAI_API_KEY=sk-...

# Email (Optional)
RESEND_API_KEY=re_...

# Notion (Optional)
NOTION_CLIENT_ID=your-client-id
NOTION_CLIENT_SECRET=your-client-secret
NOTION_REDIRECT_URI=http://localhost:3000/api/notion/callback
```

---

## Additional Resources

-   [Better Auth Documentation](https://better-auth.com)
-   [tRPC Documentation](https://trpc.io)
-   [Stream Video API](https://getstream.io/video/docs/)
-   [Stream Chat API](https://getstream.io/chat/docs/)
-   [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
-   [Notion API](https://developers.notion.com)

---

## Support

For API-related issues:

1. Check error messages and status codes
2. Review this documentation
3. Check application logs
4. Contact support with request details and error messages
