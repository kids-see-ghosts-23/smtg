# API Documentation

The SMTG application exposes several API endpoints for different functionalities. These include REST endpoints for specific operations and tRPC endpoints for type-safe communication.

## REST API Endpoints

### Authentication API

#### `POST /api/auth/[...all]`

Handles authentication requests including sign-in and sign-up operations.

**Implementation:** Uses `better-auth/next-js` to handle authentication flows.

#### `GET /api/auth/[...all]`

Handles OAuth callback requests and authentication verification.

**Implementation:** Uses `better-auth/next-js` to handle OAuth flows.

### Meetings API

#### `GET /api/meetings/[meetingId]`

Fetches meeting details by ID for joining purposes.

**Path Parameters:**

-   `meetingId` - The unique identifier of the meeting

**Response:**

-   `200` - Returns meeting information if the meeting is active or upcoming
-   `404` - Meeting not found
-   `400` - Meeting is not available for joining
-   `500` - Internal server error

**Implementation:** Queries the database for meeting details and validates meeting status.

### Webhook API

#### `POST /api/webhook`

Handles Stream.io webhooks for real-time event processing.

**Headers:**

-   `x-signature` - Webhook signature for verification
-   `x-api-key` - API key for authentication

**Request Body:** JSON payload with event data.

**Supported Event Types:**

1. **`call.session_started`**

    - Triggered when a meeting call starts
    - Updates meeting status to "active"
    - Connects OpenAI real-time API

2. **`call.session_participant_left`**

    - Triggered when a participant leaves a call
    - Ends the call if necessary

3. **`call.session_ended`**

    - Triggered when a call session ends
    - Updates meeting status to "processing"

4. **`call.transcription_ready`**

    - Triggered when call transcription is ready
    - Stores transcript URL and triggers processing

5. **`call.recording_ready`**

    - Triggered when call recording is ready
    - Stores recording URL

6. **`message.new`**
    - Triggered when a new chat message is sent
    - Processes messages for completed meetings using OpenAI

**Response:**

-   `200` - Success
-   `400` - Missing signature or API key
-   `401` - Invalid signature
-   `404` - Meeting or agent not found

### Email API

#### `POST /api/send-summary-email`

Sends meeting summaries via email using the configured email service.

**Request Body:**

```json
{
    "to": "recipient@example.com",
    "meetingName": "Team Standup",
    "summary": "Meeting discussion summary",
    "agentName": "Alex Assistant", // optional
    "date": "2025-01-15", // optional
    "duration": "30 minutes" // optional
}
```

**Response:**

-   `200` - Email sent successfully with result object
-   `400` - Missing required fields (`to`, `meetingName`, `summary`)
-   `500` - Failed to send email

**Implementation:** Uses EmailService to generate HTML content and send formatted emails.

### Notion Integration API

#### `POST /api/send-summary-notion`

Creates a new Notion page with meeting summary content.

**Request Body:**

```json
{
    "notionToken": "secret_xyz...",
    "notionPageId": "page-uuid",
    "meetingName": "Team Standup",
    "summary": "## Key Points\n- Discussed progress\n- Identified blockers",
    "agentName": "Alex Assistant", // optional
    "date": "2025-01-15", // optional
    "duration": "30 minutes" // optional
}
```

**Response:**

-   `200` - Success with created page ID

```json
{
    "success": true,
    "pageId": "created-page-uuid"
}
```

-   `400` - Missing required fields (`notionToken`, `notionPageId`, `meetingName`, `summary`)
-   `401` - Invalid Notion token or insufficient permissions
-   `404` - Notion page not found or access denied
-   `500` - Failed to create Notion page

**Features:**

-   Converts Markdown to Notion blocks (headings, paragraphs, lists)
-   Supports inline formatting (bold, italic, code)
-   Creates structured page with metadata (agent, date, duration)

#### `GET /api/notion/callback`

Handles Notion OAuth callback for integration setup.

**Query Parameters:**

-   `code` - OAuth authorization code from Notion

**Response:**

-   `200` - HTML page with postMessage to parent window containing:

```json
{
    "access_token": "token",
    "page": {
        "id": "page-id",
        "title": "Page Title"
    }
}
```

-   `400` - Missing authorization code

**Implementation:** Exchanges authorization code for access token and fetches user's first page.

### YouTube Transcript API

#### `POST /api/youtube-transcript`

Extracts transcript content from YouTube videos for agent training.

**Request Body:**

```json
{
    "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**

-   `200` - Success with extracted content

```json
{
    "content": "YouTube Video Transcript Content:\n[transcript text]...\n\nUse this transcript content to provide accurate information..."
}
```

-   `400` - Missing URL or invalid YouTube URL format
-   `404` - No transcript available for the video
-   `500` - Failed to extract transcript

**Supported URL Formats:**

-   `https://www.youtube.com/watch?v=VIDEO_ID`
-   `https://youtu.be/VIDEO_ID`
-   `https://www.youtube.com/embed/VIDEO_ID`
-   `https://www.youtube.com/v/VIDEO_ID`

**Features:**

-   Automatic video ID extraction from various URL formats
-   Transcript length limiting (5000 characters maximum)
-   Server-side processing to avoid CORS issues

### tRPC API

#### `POST /api/trpc/[trpc]`

Main tRPC endpoint for handling mutations and commands.

#### `GET /api/trpc/[trpc]`

Main tRPC endpoint for handling queries.

**Implementation:** Uses `@trpc/server/adapters/fetch` to handle requests with the app router.

### Inngest API

#### `POST /api/inngest`

Handles Inngest event processing for background jobs.

#### `GET /api/inngest`

Provides Inngest introspection and health checks.

#### `PUT /api/inngest`

Alternative endpoint for Inngest event processing.

**Implementation:** Uses `inngest/next` to serve Inngest functions.

## tRPC Procedures

### Agents Router (`/api/trpc/agents`)

#### **Queries**

##### `agents.getOne`

Fetches a single agent by ID with meeting count.

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
    meetingCount: number;
}
```

##### `agents.getMany`

Fetches paginated list of agents with optional search and filtering.

**Input:**

```typescript
{
  page?: number; // default: 1
  pageSize?: number; // default: 10, min: 1, max: 100
  search?: string; // optional search term
}
```

**Output:**

```typescript
{
  items: Agent[];
  total: number;
  totalPages: number;
}
```

#### **Mutations**

##### `agents.create`

Creates a new agent.

**Input:**

```typescript
{
    name: string;
    instructions: string;
}
```

**Output:** Created agent object.

##### `agents.update`

Updates an existing agent.

**Input:**

```typescript
{
  id: string;
  name?: string;
  instructions?: string;
}
```

**Output:** Updated agent object.

##### `agents.remove`

Deletes an agent by ID.

**Input:**

```typescript
{
    id: string;
}
```

**Output:** Deleted agent object.

### Meetings Router (`/api/trpc/meetings`)

#### **Queries**

##### `meetings.getOne`

Fetches a single meeting by ID with agent details and duration.

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
    agent: Agent;
    duration: number | null; // in seconds
}
```

##### `meetings.getMany`

Fetches paginated list of meetings with filtering options.

**Input:**

```typescript
{
  page?: number;
  pageSize?: number;
  search?: string;
  agentId?: string;
  status?: MeetingStatus;
}
```

**Output:**

```typescript
{
  items: MeetingWithAgent[];
  total: number;
  totalPages: number;
}
```

##### `meetings.getTranscript`

Fetches formatted transcript data for a meeting.

**Input:**

```typescript
{
    id: string;
}
```

**Output:**

```typescript
Array<{
    speaker_id: string;
    text: string;
    start_time: number;
    end_time: number;
    user: {
        name: string;
        image: string;
    };
}>;
```

#### **Mutations**

##### `meetings.create`

Creates a new meeting and Stream.io call.

**Input:**

```typescript
{
    name: string;
    agentId: string;
}
```

**Output:** Created meeting object.

##### `meetings.update`

Updates an existing meeting.

**Input:**

```typescript
{
  id: string;
  name?: string;
  status?: MeetingStatus;
  summary?: string;
}
```

**Output:** Updated meeting object.

##### `meetings.remove`

Deletes a meeting by ID.

**Input:**

```typescript
{
    id: string;
}
```

**Output:** Deleted meeting object.

##### `meetings.generateToken`

Generates Stream Video token for authenticated user.

**Output:** JWT token string for Stream Video API.

##### `meetings.generateChatToken`

Generates Stream Chat token for authenticated user.

**Output:** JWT token string for Stream Chat API.

## Authentication

-   **tRPC Procedures:** All procedures require authentication except `generateToken` and `generateChatToken`
-   **REST Endpoints:** Most endpoints require authentication via session or API keys
-   **Implementation:** Uses Better Auth for session management

## Error Handling

### HTTP Status Codes

-   `200` - Success
-   `400` - Bad request (invalid input, missing required fields)
-   `401` - Unauthorized (invalid credentials, missing authentication)
-   `404` - Not found (resource doesn't exist)
-   `500` - Internal server error

### tRPC Error Codes

-   `BAD_REQUEST` - Invalid input data
-   `UNAUTHORIZED` - Missing or invalid authentication
-   `NOT_FOUND` - Requested resource not found
-   `INTERNAL_SERVER_ERROR` - Unexpected server error

### Error Response Format

**REST APIs:**

```json
{
    "error": "Descriptive error message"
}
```

**tRPC:**

```json
{
    "error": {
        "message": "Error message",
        "code": "ERROR_CODE"
    }
}
```
