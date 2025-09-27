# Meetings Module

The Meetings module manages the complete lifecycle of meetings within the SMTG Notion application, from scheduling and creation to real-time participation, transcription, and follow-up.

## Structure

```
src/modules/meetings/
├── hooks/
│   └── use-meetings-filters.ts
├── server/
│   └── procedures.ts
├── ui/
│   └── ... (components and views)
├── params.ts
├── schemas.ts
└── types.ts
```

## TRPC Procedures

### Queries

#### `meetings.getOne({ id })`
Fetches a single meeting by its ID along with associated agent information.

**Input:**
```ts
{
  id: string
}
```

**Output:**
Returns a meeting object with all its properties, associated agent, and calculated duration.

#### `meetings.getMany({ page, pageSize, search, agentId, status })`
Fetches a paginated list of meetings with optional filtering.

**Input:**
```ts
{
  page?: number // default: 1
  pageSize?: number // default: 10, min: 1, max: 100
  search?: string // optional search term for meeting names
  agentId?: string // filter by specific agent
  status?: MeetingStatus // filter by meeting status
}
```

**Output:**
```ts
{
  items: Meeting[]
  total: number
  totalPages: number
}
```

#### `meetings.getTranscript({ id })`
Retrieves the transcript of a meeting with speaker information.

**Input:**
```ts
{
  id: string
}
```

**Output:**
Returns an array of transcript items with speaker details.

#### `meetings.generateToken()`
Generates a Stream Video token for the authenticated user.

**Input:**
None

**Output:**
Returns a JWT token for Stream Video authentication.

#### `meetings.generateChatToken()`
Generates a Stream Chat token for the authenticated user.

**Input:**
None

**Output:**
Returns a JWT token for Stream Chat authentication.

### Mutations

#### `meetings.create(input)`
Creates a new meeting and initializes the Stream Video call.

**Input:**
Follows the [meetingsInsertSchema](#schemas).

**Output:**
Returns the created meeting object.

#### `meetings.update(input)`
Updates an existing meeting.

**Input:**
Follows the [meetingsUpdateSchema](#schemas).

**Output:**
Returns the updated meeting object.

#### `meetings.remove({ id })`
Deletes a meeting.

**Input:**
```ts
{
  id: string
}
```

**Output:**
Returns the deleted meeting object.

## Schemas

### meetingsInsertSchema
Defines the validation schema for creating new meetings.

### meetingsUpdateSchema
Defines the validation schema for updating existing meetings.

## Types

### MeetingStatus
Enumeration of possible meeting statuses:
- `upcoming` - Scheduled for the future
- `active` - Currently in progress
- `completed` - Finished successfully
- `processing` - Being processed (transcription, summary generation)
- `cancelled` - Cancelled by user

### StreamTranscriptItem
Type definition for transcript items received from Stream.

## Hooks

### useMeetingsFilters
A custom hook for managing meeting filtering state in the UI.

## UI Components

UI components related to meeting management, scheduling, and display.