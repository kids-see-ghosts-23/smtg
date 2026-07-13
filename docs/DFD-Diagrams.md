# Data Flow Diagrams (DFD) - Meeting Management & Collaboration System

## Level 0: Context Diagram

The Level 0 DFD shows the system as a single process with external entities and data flows.

```mermaid
graph TB
    User((User))
    EmailService[Email Service<br/>Resend]
    StreamVideo[Stream Video<br/>Service]
    GitHub[GitHub API]
    NotionAPI[Notion API]
    OpenAI[OpenAI API]
    YouTube[YouTube API]

    System[Meeting Management &<br/>Collaboration System<br/>0]

    User -->|Login Credentials| System
    User -->|Meeting Request| System
    User -->|Agent Configuration| System
    User -->|Join Meeting Link| System
    User -->|Document Upload| System
    User -->|GitHub Repository URL| System
    User -->|YouTube URL| System
    User -->|Web URL| System

    System -->|Verification Email| EmailService
    EmailService -->|Email Status| System

    System -->|Video Call Request| StreamVideo
    StreamVideo -->|Call Token & Stream| System

    System -->|Repository Analysis Request| GitHub
    GitHub -->|Repository Data| System

    System -->|Summary Export| NotionAPI
    NotionAPI -->|Export Status| System

    System -->|Content Processing| OpenAI
    OpenAI -->|AI Response| System

    System -->|Transcript Request| YouTube
    YouTube -->|Video Transcript| System

    System -->|Meeting Summary| User
    System -->|Agent Response| User
    System -->|Authentication Token| User
    System -->|Meeting Invitation| User
    System -->|Dashboard Data| User

    style System fill:#4A90E2,stroke:#2E5C8A,stroke-width:3px,color:#fff
    style User fill:#50C878,stroke:#2D7A4F,stroke-width:2px,color:#fff
    style EmailService fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
    style StreamVideo fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
    style GitHub fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
    style NotionAPI fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
    style OpenAI fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
    style YouTube fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
```

### External Entities:

-   **User**: End users (authenticated and guest users)
-   **Email Service**: Resend API for email verification and notifications
-   **Stream Video Service**: Real-time video/audio communication
-   **GitHub API**: Repository analysis and code data
-   **Notion API**: Export meeting summaries to Notion workspace
-   **OpenAI API**: AI-powered processing (embeddings, chat, analysis)
-   **YouTube API**: Video transcript extraction

---

## Level 1: Major Process Decomposition

The Level 1 DFD breaks down the system into major processes and shows data stores.

```mermaid
graph TB
    User((User))
    EmailService[Email Service]
    StreamVideo[Stream Video]
    GitHub[GitHub API]
    NotionAPI[Notion API]
    OpenAI[OpenAI API]
    YouTube[YouTube API]

    P1[1.0<br/>Authentication &<br/>User Management]
    P2[2.0<br/>Agent<br/>Management]
    P3[3.0<br/>Meeting<br/>Management]
    P4[4.0<br/>Video Call<br/>Processing]
    P5[5.0<br/>Content Analysis &<br/>Processing]
    P6[6.0<br/>Integration<br/>Management]
    P7[7.0<br/>Notification &<br/>Email Service]

    D1[(User DB)]
    D2[(Agent DB)]
    D3[(Meeting DB)]
    D4[(Document DB)]
    D5[(Session DB)]

    %% User to Processes
    User -->|Login/Signup Request| P1
    User -->|Agent Config| P2
    User -->|Meeting Request| P3
    User -->|Join Call| P4
    User -->|Content URLs/Files| P5
    User -->|Notion Auth| P6

    %% Process 1 - Authentication
    P1 -->|Verification Email| P7
    P1 -->|User Data| D1
    P1 -->|Session Data| D5
    D1 -->|User Info| P1
    P1 -->|Auth Token| User

    %% Process 2 - Agent Management
    P2 -->|Agent Data| D2
    P2 -->|Document Data| D4
    D2 -->|Agent Config| P2
    D4 -->|Document Chunks| P2
    P2 -->|GitHub Analysis| P5
    P2 -->|Agent Details| User
    P2 -->|Agent Context| P4

    %% Process 3 - Meeting Management
    P3 -->|Meeting Data| D3
    D3 -->|Meeting Info| P3
    D1 -->|User Info| P3
    D2 -->|Agent Info| P3
    P3 -->|Meeting Details| User
    P3 -->|Call Setup| P4
    P3 -->|Invitation| P7
    P3 -->|Summary Export| P6

    %% Process 4 - Video Call
    P4 -->|Call Request| StreamVideo
    StreamVideo -->|Stream Data| P4
    P4 -->|Meeting Updates| D3
    D3 -->|Meeting Context| P4
    P4 -->|Recording/Transcript| P5
    P4 -->|Call Interface| User

    %% Process 5 - Content Analysis
    P5 -->|Analysis Request| OpenAI
    OpenAI -->|AI Response| P5
    P5 -->|Repo Request| GitHub
    GitHub -->|Repo Data| P5
    P5 -->|Transcript Request| YouTube
    YouTube -->|Transcript| P5
    P5 -->|Embeddings| D4
    P5 -->|Summary| D3
    D4 -->|Vector Data| P5
    P5 -->|Processed Content| User

    %% Process 6 - Integration
    P6 -->|Export Request| NotionAPI
    NotionAPI -->|Status| P6
    D3 -->|Summary Data| P6
    P6 -->|Export Status| User

    %% Process 7 - Notifications
    P7 -->|Email| EmailService
    EmailService -->|Status| P7
    P7 -->|Confirmation| User

    style P1 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P2 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P3 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P4 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P5 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P6 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P7 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style D1 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
    style D2 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
    style D3 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
    style D4 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
    style D5 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
    style User fill:#50C878,stroke:#2D7A4F,stroke-width:2px,color:#fff
```

### Level 1 Processes:

1. **Authentication & User Management** - User registration, login, email verification
2. **Agent Management** - Create, configure, and manage AI agents with custom instructions
3. **Meeting Management** - Schedule, organize, and manage meetings
4. **Video Call Processing** - Handle real-time video calls with recording and transcription
5. **Content Analysis & Processing** - Process documents, GitHub repos, YouTube videos, web content
6. **Integration Management** - Manage third-party integrations (Notion)
7. **Notification & Email Service** - Handle all email communications

### Data Stores:

-   **D1: User DB** - Users, sessions, accounts, verification tokens
-   **D2: Agent DB** - Agent configurations and instructions
-   **D3: Meeting DB** - Meeting details, summaries, recordings
-   **D4: Document DB** - Documents, chunks, embeddings (RAG)
-   **D5: Session DB** - Active user sessions and tokens

---

## Level 2: Detailed Process Decomposition

### Level 2.1: Authentication & User Management (Process 1.0)

```mermaid
graph TB
    User((User))
    EmailService[Email Service]

    P11[1.1<br/>User<br/>Registration]
    P12[1.2<br/>Email<br/>Verification]
    P13[1.3<br/>User<br/>Login]
    P14[1.4<br/>Session<br/>Management]
    P15[1.5<br/>Guest User<br/>Authentication]

    D1[(User DB)]
    D5[(Session DB)]
    D6[(Verification DB)]

    User -->|Signup Data| P11
    P11 -->|User Record| D1
    P11 -->|Verification Token| D6
    P11 -->|Send Verification| P12

    P12 -->|Verification Email| EmailService
    D6 -->|Token| P12
    User -->|Verification Code| P12
    P12 -->|Update Status| D1
    P12 -->|Confirmation| User

    User -->|Login Credentials| P13
    D1 -->|User Data| P13
    P13 -->|Create Session| P14

    P14 -->|Session Record| D5
    D5 -->|Session Data| P14
    P14 -->|Auth Token| User
    P14 -->|Session Token| User

    User -->|Guest Join Request| P15
    P15 -->|Guest Record| D1
    P15 -->|Guest Session| D5
    P15 -->|Guest Token| User

    style P11 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P12 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P13 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P14 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P15 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style D1 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
    style D5 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
    style D6 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
```

**Sub-processes:**

-   **1.1 User Registration**: Create new user accounts with email/password
-   **1.2 Email Verification**: Verify user email addresses via verification codes
-   **1.3 User Login**: Authenticate existing users and validate credentials
-   **1.4 Session Management**: Create, validate, and manage user sessions
-   **1.5 Guest User Authentication**: Temporary authentication for meeting guests

---

### Level 2.2: Agent Management (Process 2.0)

```mermaid
graph TB
    User((User))
    GitHub[GitHub API]
    OpenAI[OpenAI API]

    P21[2.1<br/>Create<br/>Agent]
    P22[2.2<br/>Configure Agent<br/>Instructions]
    P23[2.3<br/>Upload<br/>Documents]
    P24[2.4<br/>Process RAG<br/>Documents]
    P25[2.5<br/>GitHub Repository<br/>Integration]
    P26[2.6<br/>Query Agent<br/>Knowledge Base]

    D1[(User DB)]
    D2[(Agent DB)]
    D4[(Document DB)]

    User -->|Agent Details| P21
    D1 -->|User ID| P21
    P21 -->|Agent Record| D2
    P21 -->|Agent ID| User

    User -->|Instructions & Config| P22
    D2 -->|Agent Data| P22
    P22 -->|Updated Config| D2
    P22 -->|Confirmation| User

    User -->|PDF Files| P23
    P23 -->|Document Record| D4
    P23 -->|Process Request| P24

    P24 -->|Text Content| OpenAI
    OpenAI -->|Embeddings| P24
    D4 -->|Document Info| P24
    P24 -->|Chunks & Vectors| D4
    P24 -->|Status| User

    User -->|GitHub URL| P25
    P25 -->|Analysis Request| GitHub
    GitHub -->|Repo Data| P25
    D2 -->|Agent Context| P25
    P25 -->|Repo Info| D2
    P25 -->|Analysis Result| User

    User -->|Query| P26
    D4 -->|Vector Search| P26
    D2 -->|Agent Instructions| P26
    P26 -->|Context| OpenAI
    OpenAI -->|Response| P26
    P26 -->|Answer| User

    style P21 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P22 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P23 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P24 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P25 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P26 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style D1 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
    style D2 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
    style D4 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
```

**Sub-processes:**

-   **2.1 Create Agent**: Initialize new AI agent with basic information
-   **2.2 Configure Agent Instructions**: Set custom instructions and behavior
-   **2.3 Upload Documents**: Upload PDF documents for agent knowledge base
-   **2.4 Process RAG Documents**: Extract text, generate embeddings, store chunks
-   **2.5 GitHub Repository Integration**: Analyze and integrate GitHub repository data
-   **2.6 Query Agent Knowledge Base**: Retrieve information using vector similarity search

---

### Level 2.3: Meeting Management (Process 3.0)

```mermaid
graph TB
    User((User))
    EmailService[Email Service]

    P31[3.1<br/>Create<br/>Meeting]
    P32[3.2<br/>Schedule<br/>Meeting]
    P33[3.3<br/>Send<br/>Invitations]
    P34[3.4<br/>Manage Meeting<br/>Status]
    P35[3.5<br/>Update Meeting<br/>Records]
    P36[3.6<br/>Generate Meeting<br/>Summary]

    D1[(User DB)]
    D2[(Agent DB)]
    D3[(Meeting DB)]

    User -->|Meeting Details| P31
    D1 -->|User Info| P31
    D2 -->|Agent Info| P31
    P31 -->|Meeting Record| D3
    P31 -->|Meeting ID| P32

    P32 -->|Schedule Info| D3
    D3 -->|Meeting Data| P32
    P32 -->|Invitation List| P33
    P32 -->|Confirmation| User

    P33 -->|Invitation Emails| EmailService
    D3 -->|Meeting Details| P33
    P33 -->|Guest Records| D1
    P33 -->|Status| User

    User -->|Status Change| P34
    D3 -->|Current Status| P34
    P34 -->|Updated Status| D3
    P34 -->|Notification| P35

    P35 -->|Meeting Updates| D3
    D3 -->|Meeting Data| P35
    P35 -->|Update Confirmation| User

    D3 -->|Recording/Transcript| P36
    P36 -->|Summary Text| D3
    P36 -->|Summary| User

    style P31 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P32 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P33 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P34 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P35 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P36 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style D1 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
    style D2 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
    style D3 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
```

**Sub-processes:**

-   **3.1 Create Meeting**: Initialize new meeting with name and agent
-   **3.2 Schedule Meeting**: Set meeting time and parameters
-   **3.3 Send Invitations**: Email invitations to participants
-   **3.4 Manage Meeting Status**: Update status (upcoming, active, completed, cancelled)
-   **3.5 Update Meeting Records**: Maintain meeting information and metadata
-   **3.6 Generate Meeting Summary**: Create AI-powered meeting summaries

---

### Level 2.4: Video Call Processing (Process 4.0)

```mermaid
graph TB
    User((User))
    StreamVideo[Stream Video API]
    OpenAI[OpenAI API]

    P41[4.1<br/>Initialize<br/>Video Call]
    P42[4.2<br/>Manage Call<br/>Participants]
    P43[4.3<br/>Real-time Agent<br/>Interaction]
    P44[4.4<br/>Recording<br/>Management]
    P45[4.5<br/>Transcription<br/>Processing]
    P46[4.6<br/>End Call &<br/>Cleanup]

    D2[(Agent DB)]
    D3[(Meeting DB)]
    D4[(Document DB)]

    User -->|Join Call Request| P41
    D3 -->|Meeting Info| P41
    P41 -->|Call Setup| StreamVideo
    StreamVideo -->|Call Token| P41
    P41 -->|Call Interface| User

    User -->|Add/Remove Guest| P42
    P42 -->|Participant Update| StreamVideo
    D3 -->|Guest List| P42
    P42 -->|Updated List| D3

    User -->|Voice/Chat Input| P43
    D2 -->|Agent Instructions| P43
    D4 -->|Knowledge Base| P43
    P43 -->|Query| OpenAI
    OpenAI -->|AI Response| P43
    P43 -->|Agent Voice/Text| StreamVideo
    StreamVideo -->|Response to User| User

    P44 -->|Start/Stop Recording| StreamVideo
    StreamVideo -->|Recording Stream| P44
    P44 -->|Recording URL| D3

    StreamVideo -->|Audio Stream| P45
    P45 -->|Transcription Request| OpenAI
    OpenAI -->|Transcript| P45
    P45 -->|Transcript Data| D3

    User -->|End Call| P46
    P46 -->|Call End| StreamVideo
    D3 -->|Meeting Data| P46
    P46 -->|Final Status| D3
    P46 -->|Summary Trigger| User

    style P41 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P42 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P43 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P44 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P45 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P46 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style D2 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
    style D3 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
    style D4 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
```

**Sub-processes:**

-   **4.1 Initialize Video Call**: Set up video call session with Stream API
-   **4.2 Manage Call Participants**: Add/remove guests during the call
-   **4.3 Real-time Agent Interaction**: AI agent participates in conversation using voice/text
-   **4.4 Recording Management**: Record video/audio of the meeting
-   **4.5 Transcription Processing**: Real-time or post-call transcription
-   **4.6 End Call & Cleanup**: Clean up resources and update meeting status

---

### Level 2.5: Content Analysis & Processing (Process 5.0)

```mermaid
graph TB
    User((User))
    GitHub[GitHub API]
    YouTube[YouTube API]
    OpenAI[OpenAI API]

    P51[5.1<br/>GitHub Repository<br/>Analysis]
    P52[5.2<br/>YouTube Video<br/>Processing]
    P53[5.3<br/>Web Content<br/>Scraping]
    P54[5.4<br/>PDF Document<br/>Processing]
    P55[5.5<br/>Generate<br/>Embeddings]
    P56[5.6<br/>Mindmap<br/>Generation]

    D3[(Meeting DB)]
    D4[(Document DB)]

    User -->|GitHub URL| P51
    P51 -->|Repo Request| GitHub
    GitHub -->|Repo Structure| P51
    GitHub -->|Code Content| P51
    P51 -->|Analysis| OpenAI
    OpenAI -->|Summary| P51
    P51 -->|Results| User

    User -->|YouTube URL| P52
    P52 -->|Transcript Request| YouTube
    YouTube -->|Captions| P52
    P52 -->|Transcript| OpenAI
    OpenAI -->|Summary| P52
    P52 -->|Video Summary| User

    User -->|Web URL| P53
    P53 -->|Scrape Content| OpenAI
    OpenAI -->|Extracted Data| P53
    P53 -->|Web Content| User

    User -->|PDF Upload| P54
    P54 -->|Text Extraction| OpenAI
    OpenAI -->|Parsed Text| P54
    P54 -->|Document| D4
    P54 -->|Process Trigger| P55

    P55 -->|Text Chunks| OpenAI
    OpenAI -->|Vector Embeddings| P55
    D4 -->|Document Data| P55
    P55 -->|Vectors| D4
    P55 -->|Completion| User

    D3 -->|Meeting Transcript| P56
    P56 -->|Generate Mindmap| OpenAI
    OpenAI -->|Structured Data| P56
    P56 -->|Mindmap| User
    P56 -->|Mindmap URL| D3

    style P51 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P52 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P53 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P54 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P55 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P56 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style D3 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
    style D4 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
```

**Sub-processes:**

-   **5.1 GitHub Repository Analysis**: Analyze repository structure, code, and documentation
-   **5.2 YouTube Video Processing**: Extract and process video transcripts
-   **5.3 Web Content Scraping**: Scrape and extract data from web URLs
-   **5.4 PDF Document Processing**: Parse and extract text from PDF files
-   **5.5 Generate Embeddings**: Create vector embeddings for semantic search (RAG)
-   **5.6 Mindmap Generation**: Generate visual mindmaps from meeting transcripts

---

### Level 2.6: Integration Management (Process 6.0)

```mermaid
graph TB
    User((User))
    NotionAPI[Notion API]

    P61[6.1<br/>Connect<br/>Notion Account]
    P62[6.2<br/>OAuth<br/>Authentication]
    P63[6.3<br/>Export Summary<br/>to Notion]
    P64[6.4<br/>Format Notion<br/>Content]
    P65[6.5<br/>Verify Export<br/>Status]

    D1[(User DB)]
    D3[(Meeting DB)]

    User -->|Connect Request| P61
    P61 -->|OAuth Redirect| P62

    P62 -->|Auth Request| NotionAPI
    NotionAPI -->|Auth Code| P62
    P62 -->|Token Exchange| NotionAPI
    NotionAPI -->|Access Token| P62
    P62 -->|Store Token| D1
    P62 -->|Success| User

    User -->|Export Request| P63
    D3 -->|Meeting Summary| P63
    D1 -->|Notion Token| P63
    P63 -->|Format Request| P64

    P64 -->|Structured Data| NotionAPI
    NotionAPI -->|Page ID| P64
    P64 -->|Verify Request| P65

    P65 -->|Check Status| NotionAPI
    NotionAPI -->|Status| P65
    P65 -->|Confirmation| User

    style P61 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P62 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P63 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P64 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P65 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style D1 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
    style D3 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
```

**Sub-processes:**

-   **6.1 Connect Notion Account**: Initiate Notion integration
-   **6.2 OAuth Authentication**: Handle OAuth flow for Notion authorization
-   **6.3 Export Summary to Notion**: Send meeting summary to Notion workspace
-   **6.4 Format Notion Content**: Structure data in Notion's block format
-   **6.5 Verify Export Status**: Confirm successful export to Notion

---

### Level 2.7: Notification & Email Service (Process 7.0)

```mermaid
graph TB
    User((User))
    EmailService[Email Service<br/>Resend API]

    P71[7.1<br/>Verification<br/>Email]
    P72[7.2<br/>Meeting<br/>Invitation Email]
    P73[7.3<br/>Summary<br/>Email]
    P74[7.4<br/>Email Template<br/>Rendering]
    P75[7.5<br/>Email Status<br/>Tracking]

    D1[(User DB)]
    D3[(Meeting DB)]
    D6[(Verification DB)]

    D6 -->|Token| P71
    D1 -->|User Email| P71
    P71 -->|Render Template| P74
    P74 -->|HTML Email| P71
    P71 -->|Send Email| EmailService
    EmailService -->|Status| P75

    D3 -->|Meeting Details| P72
    D1 -->|Guest Emails| P72
    P72 -->|Render Template| P74
    P74 -->|HTML Email| P72
    P72 -->|Send Email| EmailService
    EmailService -->|Status| P75

    D3 -->|Summary Data| P73
    D1 -->|User Email| P73
    P73 -->|Render Template| P74
    P74 -->|HTML Email| P73
    P73 -->|Send Email| EmailService
    EmailService -->|Status| P75

    P75 -->|Delivery Status| User
    P75 -->|Log Status| D3

    style P71 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P72 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P73 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P74 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style P75 fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    style D1 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
    style D3 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
    style D6 fill:#95E1D3,stroke:#38A89D,stroke-width:2px
```

**Sub-processes:**

-   **7.1 Verification Email**: Send email verification codes to new users
-   **7.2 Meeting Invitation Email**: Send meeting invitations to participants
-   **7.3 Summary Email**: Send meeting summaries via email
-   **7.4 Email Template Rendering**: Format and render HTML email templates
-   **7.5 Email Status Tracking**: Track email delivery status and logs

---

## Summary

### System Overview

This Meeting Management & Collaboration System is a comprehensive platform that enables:

-   **User authentication** with email verification and guest access
-   **AI-powered agents** with custom knowledge bases (RAG) and GitHub integration
-   **Video meetings** with real-time AI agent participation
-   **Content processing** from multiple sources (GitHub, YouTube, PDFs, web)
-   **Third-party integrations** (Notion export)
-   **Automated notifications** via email

### Key Data Flows

1. **User Registration Flow**: User → Registration → Email Verification → Login → Session
2. **Agent Creation Flow**: User → Create Agent → Upload Documents → Process RAG → Query Agent
3. **Meeting Flow**: User → Schedule Meeting → Send Invitations → Video Call → Recording/Transcript → Generate Summary → Export to Notion
4. **Content Analysis Flow**: User → Submit Content URL → Process Content → Generate Summary/Analysis → Return Results

### Technology Stack

-   **Frontend**: Next.js, React, TailwindCSS
-   **Backend**: Next.js API Routes, tRPC
-   **Database**: PostgreSQL with Drizzle ORM
-   **Authentication**: Better Auth
-   **Video**: Stream Video SDK
-   **AI**: OpenAI API (GPT, Embeddings, Whisper)
-   **Background Jobs**: Inngest
-   **Email**: Resend API
-   **Integrations**: GitHub API, YouTube API, Notion API

### Database Schema

-   **Users**: User accounts, sessions, verification tokens
-   **Agents**: AI agent configurations and instructions
-   **Meetings**: Meeting records, status, summaries, recordings
-   **Documents**: PDF documents with vector embeddings for RAG
-   **Guest Users**: Temporary users for meeting participation
