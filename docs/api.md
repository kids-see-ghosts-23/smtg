# API Documentation

The SMTG Notion application exposes several API endpoints for different functionalities. These include REST endpoints for specific operations and TRPC endpoints for type-safe communication.

## REST API Endpoints

### Authentication API

#### `POST /api/auth/[...all]`
Handles authentication requests including sign-in and sign-up operations.

**Implementation:**
Uses `better-auth/next-js` to handle authentication flows.

#### `GET /api/auth/[...all]`
Handles OAuth callback requests and authentication verification.

**Implementation:**
Uses `better-auth/next-js` to handle OAuth flows.

### Meetings API

#### `GET /api/meetings/[meetingId]`
Fetches meeting details by ID for joining purposes.

**Path Parameters:**
- `meetingId` - The unique identifier of the meeting

**Response:**
- `200` - Returns meeting information if the meeting is active or upcoming
- `404` - Meeting not found
- `400` - Meeting is not available for joining
- `500` - Internal server error

**Implementation:**
Queries the database for meeting details and validates meeting status.

### Webhook API

#### `POST /api/webhook`
Handles Stream.io webhooks for real-time event processing.

**Headers:**
- `x-signature` - Webhook signature for verification
- `x-api-key` - API key for authentication

**Request Body:**
JSON payload with event data.

**Supported Event Types:**

1. `call.session_started`
   - Triggered when a meeting call starts
   - Updates meeting status to "active"
   - Connects OpenAI real-time API

2. `call.session_participant_left`
   - Triggered when a participant leaves a call
   - Ends the call if necessary

3. `call.session_ended`
   - Triggered when a call session ends
   - Updates meeting status to "processing"

4. `call.transcription_ready`
   - Triggered when call transcription is ready
   - Stores transcript URL and triggers processing

5. `call.recording_ready`
   - Triggered when call recording is ready
   - Stores recording URL

6. `message.new`
   - Triggered when a new chat message is sent
   - Processes messages for completed meetings using OpenAI

**Response:**
- `200` - Success
- `400` - Missing signature or API key
- `401` - Invalid signature
- `404` - Meeting or agent not found

### Email API

#### `POST /api/send-summary-email`
Sends meeting summaries via email.

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "meetingName": "Team Standup",
  "summary": "Discussed project progress and blockers",
  "agentName": "Alex Assistant", // optional
  "date": "2025-01-15", // optional
  "duration": "30 minutes" // optional
}
```

**Response:**
- `200` - Email sent successfully
- `400` - Missing required fields
- `500` - Failed to send email

### TRPC API

#### `POST /api/trpc/[trpc]`
Main TRPC endpoint for handling mutations and commands.

#### `GET /api/trpc/[trpc]`
Main TRPC endpoint for handling queries.

**Implementation:**
Uses `@trpc/server/adapters/fetch` to handle requests with the app router.

### Inngest API

#### `POST /api/inngest`
Handles Inngest event processing.

#### `GET /api/inngest`
Provides Inngest introspection and health checks.

#### `PUT /api/inngest`
Alternative endpoint for Inngest event processing.

**Implementation:**
Uses `inngest/next` to serve Inngest functions.

## TRPC Procedures

Detailed documentation for TRPC procedures can be found in:
- [Agents Module Documentation](./agents.md#trpc-procedures)
- [Meetings Module Documentation](./meetings.md#trpc-procedures)

## Authentication

All TRPC procedures (except `generateToken` and `generateChatToken`) require authentication. The application uses Better Auth for authentication management.

## Error Handling

API endpoints follow standard HTTP status codes:
- `200` - Success
- `400` - Bad request (invalid input)
- `401` - Unauthorized (missing or invalid authentication)
- `404` - Not found
- `500` - Internal server error

Error responses follow this format:
```json
{
  "error": "Error message"
}
```