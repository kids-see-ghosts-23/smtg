# Data Flow Diagram - Level 2

This diagram provides detailed breakdowns of each Level 1 process into sub-processes, showing the internal operations and data flows within each major functional area.

---

## 1.0 - Authentication & User Management (Level 2)

```mermaid
graph TB
    %% External Entities
    User[👤 User]
    Guest[👥 Guest User]

    %% Sub-processes
    P11((1.1<br/>User<br/>Login))
    P12((1.2<br/>Session<br/>Management))
    P13((1.3<br/>Guest User<br/>Creation))
    P14((1.4<br/>Token<br/>Generation))

    %% Data Store
    DB[(Database)]

    %% Data Flows
    User -->|Email & Password| P11
    P11 -->|Credentials| DB
    DB -->|User Record| P11
    P11 -->|Validated User| P12
    P12 -->|Session Data| DB
    DB -->|Existing Session| P12
    P12 -->|Session Info| P14
    P14 -->|Auth Token| User

    Guest -->|Name & Meeting ID| P13
    P13 -->|Guest Record| DB
    P13 -->|Guest Info| P14
    P14 -->|Guest Token| Guest

    classDef entityStyle fill:#e1f5ff,stroke:#0288d1,stroke-width:3px
    classDef processStyle fill:#fff9c4,stroke:#f57f17,stroke-width:3px
    classDef datastoreStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px

    class User,Guest entityStyle
    class P11,P12,P13,P14 processStyle
    class DB datastoreStyle
```

### Sub-processes:

-   **1.1 User Login**: Validate user credentials against database
-   **1.2 Session Management**: Create and track user sessions
-   **1.3 Guest User Creation**: Register guest participants for meetings
-   **1.4 Token Generation**: Generate JWT tokens for authenticated access

---

## 2.0 - Agent Management (Level 2)

```mermaid
graph TB
    %% External Entity
    User[👤 User]

    %% Sub-processes
    P21((2.1<br/>Create<br/>Agent))
    P22((2.2<br/>Update<br/>Agent))
    P23((2.3<br/>Delete<br/>Agent))
    P24((2.4<br/>Retrieve<br/>Agent))

    %% Data Store
    DB[(Database)]

    %% Data Flows
    User -->|Agent Name & Instructions| P21
    P21 -->|Agent Record| DB
    P21 -->|Created Agent| User

    User -->|Agent ID & Updates| P22
    P22 -->|Updated Data| DB
    DB -->|Existing Agent| P22
    P22 -->|Updated Agent| User

    User -->|Agent ID| P23
    P23 -->|Delete Request| DB
    DB -->|Deleted Agent| P23
    P23 -->|Confirmation| User

    User -->|Query Parameters| P24
    DB -->|Agent Records| P24
    P24 -->|Agent List/Details| User

    classDef entityStyle fill:#e1f5ff,stroke:#0288d1,stroke-width:3px
    classDef processStyle fill:#fff9c4,stroke:#f57f17,stroke-width:3px
    classDef datastoreStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px

    class User entityStyle
    class P21,P22,P23,P24 processStyle
    class DB datastoreStyle
```

### Sub-processes:

-   **2.1 Create Agent**: Insert new agent with custom instructions
-   **2.2 Update Agent**: Modify existing agent properties
-   **2.3 Delete Agent**: Remove agent and cascade delete related data
-   **2.4 Retrieve Agent**: Fetch single agent or paginated list with search

---

## 3.0 - Meeting Management (Level 2)

```mermaid
graph TB
    %% External Entities
    User[👤 User]
    EmailSys[📧 Email System]
    StreamAPI[🎥 Stream API]

    %% Sub-processes
    P31((3.1<br/>Create<br/>Meeting))
    P32((3.2<br/>Update<br/>Meeting))
    P33((3.3<br/>Delete<br/>Meeting))
    P34((3.4<br/>Retrieve<br/>Meeting))
    P35((3.5<br/>Send<br/>Invitations))

    %% Data Store
    DB[(Database)]

    %% Data Flows
    User -->|Meeting Details| P31
    P31 -->|Meeting Record| DB
    P31 -->|Call Request| StreamAPI
    StreamAPI -->|Call Created| P31
    P31 -->|Created Meeting| User

    User -->|Meeting ID & Updates| P32
    P32 -->|Updated Data| DB
    DB -->|Existing Meeting| P32
    P32 -->|Updated Meeting| User

    User -->|Meeting ID| P33
    P33 -->|Delete Request| DB
    DB -->|Deleted Meeting| P33
    P33 -->|Confirmation| User

    User -->|Query Parameters| P34
    DB -->|Meeting Records| P34
    P34 -->|Meeting List/Details| User

    User -->|Recipient Emails| P35
    DB -->|Meeting & Agent Data| P35
    P35 -->|Invitation Email| EmailSys
    P35 -->|Confirmation| User

    classDef entityStyle fill:#e1f5ff,stroke:#0288d1,stroke-width:3px
    classDef processStyle fill:#fff9c4,stroke:#f57f17,stroke-width:3px
    classDef datastoreStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px

    class User,EmailSys,StreamAPI entityStyle
    class P31,P32,P33,P34,P35 processStyle
    class DB datastoreStyle
```

### Sub-processes:

-   **3.1 Create Meeting**: Create meeting record and initialize Stream call
-   **3.2 Update Meeting**: Modify meeting properties (name, agent, status)
-   **3.3 Delete Meeting**: Remove meeting and associated guest users
-   **3.4 Retrieve Meeting**: Fetch meetings with filters and pagination
-   **3.5 Send Invitations**: Email invitations with calendar events to participants

---

## 4.0 - Document Processing / RAG (Level 2)

```mermaid
graph TB
    %% External Entities
    User[👤 User]
    OpenAI[🤖 OpenAI API]

    %% Sub-processes
    P41((4.1<br/>Upload &<br/>Validate<br/>PDF))
    P42((4.2<br/>Extract<br/>Text))
    P43((4.3<br/>Generate<br/>Embeddings))
    P44((4.4<br/>Store<br/>Chunks))
    P45((4.5<br/>Query<br/>Knowledge<br/>Base))

    %% Data Store
    DB[(Database)]

    %% Data Flows
    User -->|PDF File| P41
    P41 -->|Validated File| P42
    P42 -->|Raw Text| P43
    P43 -->|Text Chunks| OpenAI
    OpenAI -->|Embeddings| P43
    P43 -->|Chunks & Embeddings| P44
    P44 -->|Document & Chunks| DB
    P44 -->|Status| User

    P45 -->|Query Text| OpenAI
    OpenAI -->|Query Embedding| P45
    DB -->|Document Chunks| P45
    P45 -->|Relevant Context| User

    classDef entityStyle fill:#e1f5ff,stroke:#0288d1,stroke-width:3px
    classDef processStyle fill:#fff9c4,stroke:#f57f17,stroke-width:3px
    classDef datastoreStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px

    class User,OpenAI entityStyle
    class P41,P42,P43,P44,P45 processStyle
    class DB datastoreStyle
```

### Sub-processes:

-   **4.1 Upload & Validate PDF**: Accept PDF files and verify format/size
-   **4.2 Extract Text**: Parse PDF and extract text content
-   **4.3 Generate Embeddings**: Split text into chunks and generate vector embeddings
-   **4.4 Store Chunks**: Save document metadata and chunks with embeddings
-   **4.5 Query Knowledge Base**: Perform semantic search using cosine similarity

---

## 5.0 - Real-time Meeting Processing (Level 2)

```mermaid
graph TB
    %% External Entities
    User[👤 User]
    Guest[👥 Guest]
    StreamAPI[🎥 Stream API]
    OpenAI[🤖 OpenAI API]

    %% Sub-processes
    P51((5.1<br/>Initialize<br/>Session))
    P52((5.2<br/>Manage<br/>Participants))
    P53((5.3<br/>Connect<br/>AI Agent))
    P54((5.4<br/>Process<br/>Webhooks))
    P55((5.5<br/>Update<br/>Status))

    %% Data Store
    DB[(Database)]

    %% Data Flows
    User -->|Join Request| P51
    Guest -->|Join Request| P51
    P51 -->|Token Request| StreamAPI
    StreamAPI -->|Stream Token| P51
    P51 -->|Participant Info| P52

    P52 -->|Participant Events| StreamAPI
    StreamAPI -->|Video/Audio| P52
    P52 -->|Stream| User
    P52 -->|Stream| Guest

    DB -->|Agent Instructions| P53
    P53 -->|Enhanced Instructions| OpenAI
    OpenAI -->|AI Responses| P53
    P53 -->|AI Audio| StreamAPI

    StreamAPI -->|Webhook Events| P54
    P54 -->|Status Change| P55
    P55 -->|Updated Status| DB

    classDef entityStyle fill:#e1f5ff,stroke:#0288d1,stroke-width:3px
    classDef processStyle fill:#fff9c4,stroke:#f57f17,stroke-width:3px
    classDef datastoreStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px

    class User,Guest,StreamAPI,OpenAI entityStyle
    class P51,P52,P53,P54,P55 processStyle
    class DB datastoreStyle
```

### Sub-processes:

-   **5.1 Initialize Session**: Set up Stream call and generate participant tokens
-   **5.2 Manage Participants**: Handle join/leave events and stream video/audio
-   **5.3 Connect AI Agent**: Integrate OpenAI real-time agent into the call
-   **5.4 Process Webhooks**: Handle Stream webhook events (start, end, participant changes)
-   **5.5 Update Status**: Update meeting status (upcoming → active → processing)

---

## 6.0 - Post-Meeting Processing (Level 2)

```mermaid
graph TB
    %% External Entities
    User[👤 User]
    StreamAPI[🎥 Stream API]
    OpenAI[🤖 OpenAI API]

    %% Sub-processes
    P61((6.1<br/>Fetch<br/>Transcript))
    P62((6.2<br/>Identify<br/>Speakers))
    P63((6.3<br/>Generate<br/>Summary))
    P64((6.4<br/>Update<br/>Records))

    %% Data Store
    DB[(Database)]

    %% Data Flows
    StreamAPI -->|Transcript URL| P61
    StreamAPI -->|Recording URL| P61
    P61 -->|Raw Transcript| P62

    DB -->|User & Agent Data| P62
    P62 -->|Speaker-Tagged Transcript| P63

    P63 -->|Transcript with Context| OpenAI
    OpenAI -->|AI Summary| P63
    P63 -->|Summary| P64

    P64 -->|Summary & URLs| DB
    P64 -->|Completion Notice| User

    classDef entityStyle fill:#e1f5ff,stroke:#0288d1,stroke-width:3px
    classDef processStyle fill:#fff9c4,stroke:#f57f17,stroke-width:3px
    classDef datastoreStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px

    class User,StreamAPI,OpenAI entityStyle
    class P61,P62,P63,P64 processStyle
    class DB datastoreStyle
```

### Sub-processes:

-   **6.1 Fetch Transcript**: Retrieve transcript and recording URLs from Stream webhook
-   **6.2 Identify Speakers**: Match speaker IDs with user, agent, and guest records
-   **6.3 Generate Summary**: Use OpenAI to create structured meeting summary
-   **6.4 Update Records**: Save summary, URLs, and mark meeting as completed

---

## Process Details Summary

### 1.0 Authentication & User Management

| Process                 | Input            | Output         | Data Store Operations |
| ----------------------- | ---------------- | -------------- | --------------------- |
| 1.1 User Login          | Email, Password  | Validated User | SELECT user           |
| 1.2 Session Management  | User ID          | Session Info   | INSERT/SELECT session |
| 1.3 Guest User Creation | Name, Meeting ID | Guest Record   | INSERT guestUsers     |
| 1.4 Token Generation    | User/Guest Info  | JWT Token      | None (in-memory)      |

### 2.0 Agent Management

| Process            | Input              | Output        | Data Store Operations   |
| ------------------ | ------------------ | ------------- | ----------------------- |
| 2.1 Create Agent   | Name, Instructions | Agent Record  | INSERT agents           |
| 2.2 Update Agent   | Agent ID, Updates  | Updated Agent | UPDATE agents           |
| 2.3 Delete Agent   | Agent ID           | Confirmation  | DELETE agents (cascade) |
| 2.4 Retrieve Agent | Search, Pagination | Agent List    | SELECT agents           |

### 3.0 Meeting Management

| Process              | Input               | Output          | Data Store Operations     |
| -------------------- | ------------------- | --------------- | ------------------------- |
| 3.1 Create Meeting   | Name, Agent ID      | Meeting Record  | INSERT meetings           |
| 3.2 Update Meeting   | Meeting ID, Updates | Updated Meeting | UPDATE meetings           |
| 3.3 Delete Meeting   | Meeting ID          | Confirmation    | DELETE meetings (cascade) |
| 3.4 Retrieve Meeting | Filters, Pagination | Meeting List    | SELECT meetings + agents  |
| 3.5 Send Invitations | Emails, Meeting ID  | Email Sent      | SELECT meetings + agents  |

### 4.0 Document Processing (RAG)

| Process                  | Input               | Output           | Data Store Operations                  |
| ------------------------ | ------------------- | ---------------- | -------------------------------------- |
| 4.1 Upload & Validate    | PDF File            | Validated Buffer | None                                   |
| 4.2 Extract Text         | PDF Buffer          | Raw Text         | None (processing)                      |
| 4.3 Generate Embeddings  | Text Chunks         | Embeddings       | None (API call)                        |
| 4.4 Store Chunks         | Chunks + Embeddings | Document ID      | INSERT agentDocuments + documentChunks |
| 4.5 Query Knowledge Base | Query String        | Relevant Chunks  | SELECT documentChunks (vector search)  |

### 5.0 Real-time Meeting Processing

| Process                 | Input              | Output             | Data Store Operations                |
| ----------------------- | ------------------ | ------------------ | ------------------------------------ |
| 5.1 Initialize Session  | Join Request       | Stream Token       | SELECT meetings + agents             |
| 5.2 Manage Participants | Participant Events | Video/Audio Stream | None (Stream API)                    |
| 5.3 Connect AI Agent    | Agent Instructions | AI Responses       | SELECT agents (for instructions)     |
| 5.4 Process Webhooks    | Webhook Payload    | Event Handled      | None (event processing)              |
| 5.5 Update Status       | Status Change      | Updated Meeting    | UPDATE meetings (status, timestamps) |

### 6.0 Post-Meeting Processing

| Process               | Input         | Output            | Data Store Operations              |
| --------------------- | ------------- | ----------------- | ---------------------------------- |
| 6.1 Fetch Transcript  | Webhook Event | Transcript Data   | UPDATE meetings (URLs)             |
| 6.2 Identify Speakers | Speaker IDs   | Tagged Transcript | SELECT users + agents + guestUsers |
| 6.3 Generate Summary  | Transcript    | AI Summary        | None (API call)                    |
| 6.4 Update Records    | Summary       | Completion        | UPDATE meetings (summary, status)  |

---

## Key Data Transformations

### Authentication Flow (1.0)

```
User Credentials → Validated User → Session → JWT Token
```

### Agent Lifecycle (2.0)

```
Agent Details → Database Record → Enhanced with RAG → Used in Meetings
```

### Meeting Lifecycle (3.0)

```
Meeting Request → Database Record → Stream Call → Active Session → Completed with Artifacts
```

### RAG Pipeline (4.0)

```
PDF File → Extracted Text → Text Chunks → Embeddings → Searchable Vector Database
```

### Meeting Execution (5.0)

```
Join Request → Stream Token → Connected Participants → AI Interaction → Webhook Events → Status Updates
```

### Post-Processing Pipeline (6.0)

```
Transcript URL → Parsed Transcript → Speaker-Tagged → AI Summary → Completed Meeting
```

---

_Last Updated: January 15, 2026_
