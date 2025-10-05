# Call Module Documentation

> **Overview**: The Call module provides a comprehensive real-time video conferencing experience for the SMTG application, powered by Stream Video SDK. It handles everything from pre-call setup to active meetings and post-call summaries.

---

## Module Structure

```
src/modules/call/
└── ui/
    ├── components/
    │   ├── call-active.tsx       # Active call interface
    │   ├── call-connect.tsx      # Stream client initialization
    │   ├── call-ended.tsx        # Post-call screen
    │   ├── call-lobby.tsx        # Pre-call setup
    │   ├── call-provider.tsx     # Authentication wrapper
    │   └── call-ui.tsx           # Call state orchestrator
    └── views/
        └── call-view.tsx         # Main call view component

src/app/call/
├── layout.tsx                    # Call page layout
└── [meetingId]/
    └── page.tsx                  # Dynamic call page route
```

---

## Call Flow Architecture

```mermaid
User → CallView → CallProvider → CallConnect → CallUI
                                              ↓
                                    Lobby → Active → Ended
```

### Flow Sequence

1. **Entry Point** (`page.tsx`): Server-side authentication and meeting validation
2. **View Layer** (`call-view.tsx`): Data fetching and error handling
3. **Provider Layer** (`call-provider.tsx`): User authentication (registered/guest)
4. **Connection Layer** (`call-connect.tsx`): Stream client initialization
5. **UI Layer** (`call-ui.tsx`): State-driven UI rendering

---

## Core Components

### 1. **CallView** (`call-view.tsx`)

**Purpose**: Top-level view component that validates meeting access and handles data fetching.

**Key Features**:

-   Dual query support (authenticated users & guests)
-   Meeting status validation (prevents joining completed meetings)
-   Guest user detection via sessionStorage
-   Error state handling for invalid meetings

**Implementation Details**:

```typescript
// Uses tRPC for data fetching
- meetings.getOne: For authenticated users
- meetings.getOneForGuest: For guest participants

// Checks meeting status
if (status === "completed") → Show error state
else → Render CallProvider
```

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `meetingId` | `string` | Unique meeting identifier from URL params |

---

### 2. **CallProvider** (`call-provider.tsx`)

**Purpose**: Authentication wrapper that determines user type and provides appropriate credentials.

**User Types Supported**:

1. **Authenticated Users**: Uses Better-Auth session
2. **Guest Users**: Uses sessionStorage data

**Key Features**:

-   Automatic user detection
-   Guest user handling via sessionStorage (`guestUser_${meetingId}`)
-   Avatar generation for users without images
-   Loading state during authentication

**Data Flow**:

```typescript
// Guest User Path
sessionStorage.getItem(`guestUser_${meetingId}`)
→ Parse JSON → Extract {id, name, image, token}
→ Pass to CallConnect

// Authenticated User Path
authClient.useSession()
→ Extract user data → Pass to CallConnect
```

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `meetingId` | `string` | Meeting identifier |
| `meetingName` | `string` | Display name for the meeting |

---

### 3. **CallConnect** (`call-connect.tsx`)

**Purpose**: Initializes Stream Video client and establishes the call connection.

**Key Responsibilities**:

1. **Client Initialization**: Creates StreamVideoClient with API key and user credentials
2. **Token Management**: Generates/retrieves authentication tokens
3. **Call Setup**: Creates call instance with disabled camera/mic (lobby default)
4. **Cleanup**: Properly disconnects client on unmount

**Implementation Highlights**:

```typescript
// Client initialization
const client = new StreamVideoClient({
    apiKey: STREAM_VIDEO_API_KEY,
    user: { id, name, image },
    token: guestToken || generateToken(),
});

// Call setup
const call = client.call("default", meetingId);
call.camera.disable(); // Start with camera off
call.microphone.disable(); // Start with mic off
```

**Props**:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `meetingId` | `string` | ✅ | Meeting identifier |
| `meetingName` | `string` | ✅ | Meeting display name |
| `userId` | `string` | ❌ | User ID |
| `userName` | `string` | ❌ | User display name |
| `userImage` | `string` | ❌ | User avatar URL |
| `isGuest` | `boolean` | ❌ | Guest user flag |
| `guestToken` | `string` | ❌ | Guest authentication token |

---

### 4. **CallUI** (`call-ui.tsx`)

**Purpose**: State machine that orchestrates transitions between call states.

**Call States**:

1. **Lobby** (`"lobby"`): Pre-call setup and device testing
2. **Active** (`"call"`): Live meeting in progress
3. **Ended** (`"ended"`): Post-call summary

**State Transitions**:

```typescript
lobby → (join) → active → (leave) → ended
```

**Methods**:
| Method | Action | Effect |
|--------|--------|--------|
| `handleJoin()` | `call.join()` | Transitions to active call |
| `handleLeave()` | `call.endCall()` | Transitions to ended state |

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `meetingName` | `string` | Displayed in active call header |

---

### 5. **CallLobby** (`call-lobby.tsx`)

**Purpose**: Pre-call interface for device setup and testing.

**Features**:

-   📹 **Video Preview**: Live camera feed with fallback to avatar
-   🎤 **Audio Controls**: Microphone toggle with visual feedback
-   📷 **Video Controls**: Camera toggle
-   🔐 **Permission Handling**: Prompts for browser media permissions
-   ✅ **Ready Check**: Join button to start call
-   ❌ **Cancel Option**: Return to meetings list

**UI Components**:

-   `VideoPreview`: Stream SDK component for camera preview
-   `ToggleAudioPreviewButton`: Mic toggle button
-   `ToggleVideoPreviewButton`: Camera toggle button
-   `DisabledVideoPreview`: Fallback when camera is off
-   `AllowBrowserPermissions`: Permission prompt message

**Permission Checks**:

```typescript
const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
const { hasBrowserPermission: hasCamPermission } = useCameraState();
```

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `onJoin` | `() => void` | Callback to transition to active call |

---

### 6. **CallActive** (`call-active.tsx`)

**Purpose**: Active meeting interface with participant video and controls.

**Components Used**:

-   `SpeakerLayout`: Stream SDK component for participant grid
-   `CallControls`: Stream SDK component for call actions

**Available Controls** (via Stream SDK):

-   🎤 Toggle microphone
-   📹 Toggle camera
-   🖥️ Screen sharing
-   💬 Chat (if enabled)
-   🔴 End call

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `onLeave` | `() => void` | Callback to end the call |
| `meetingName` | `string` | Meeting title displayed in header |

---

### 7. **CallEnded** (`call-ended.tsx`)

**Purpose**: Post-call screen with summary information.

**Features**:

-   ✅ Confirmation message
-   📧 Summary notification (appears in a few minutes)
-   🔙 Navigation back to meetings dashboard

**User Experience**:

-   Reassures user that call has ended successfully
-   Informs about upcoming meeting summary
-   Provides clear path back to meetings list

---

## Technical Implementation

### Stream Video Integration

**SDK Version**: `@stream-io/video-react-sdk` ^1.18.12

**Configuration** (`src/lib/stream-video.ts`):

```typescript
import { StreamClient } from "@stream-io/node-sdk";

export const streamVideo = new StreamClient(
    process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
    process.env.STREAM_VIDEO_SECRET_KEY!
);
```

**Environment Variables Required**:

-   `NEXT_PUBLIC_STREAM_VIDEO_API_KEY`: Client-side API key
-   `STREAM_VIDEO_SECRET_KEY`: Server-side secret key

---

### Authentication Flow

#### Authenticated Users

```typescript
1. Server checks session → auth.api.getSession()
2. Redirect to /sign-in if no session
3. Fetch user data → authClient.useSession()
4. Generate token → trpc.meetings.generateToken()
5. Initialize Stream client
```

#### Guest Users

```typescript
1. Guest joins via /join/[meetingId]
2. Guest data stored in sessionStorage
3. Retrieve guest token from sessionStorage
4. Initialize Stream client with guest credentials
```

**SessionStorage Schema**:

```typescript
Key: `guestUser_${meetingId}`;
Value: {
    id: string;
    name: string;
    image: string | null;
    token: string;
}
```

---

### State Management

**Call State** (managed by Stream SDK):

-   `CallingState.IDLE`: Before joining
-   `CallingState.JOINING`: Connection in progress
-   `CallingState.JOINED`: Active call
-   `CallingState.LEFT`: After leaving

**UI State** (local React state):

```typescript
type UIState = "lobby" | "call" | "ended";
```

**Hooks Used**:

-   `useCall()`: Access call instance
-   `useCameraState()`: Camera status and controls
-   `useMicrophoneState()`: Microphone status and controls
-   `useCallStateHooks()`: Combined state hooks

---

### Data Fetching (tRPC)

**Endpoints Used**:

| Endpoint                  | Purpose                               | Auth Required |
| ------------------------- | ------------------------------------- | ------------- |
| `meetings.getOne`         | Fetch meeting for authenticated users | ✅ Yes        |
| `meetings.getOneForGuest` | Fetch meeting for guest users         | ❌ No         |
| `meetings.generateToken`  | Generate Stream token                 | ✅ Yes        |

**Query Prefetching**:

```typescript
// In page.tsx (server component)
queryClient.prefetchQuery(trpc.meetings.getOne.queryOptions({ id: meetingId }));
```

---

## Styling & Theming

**CSS Import**:

```typescript
import "@stream-io/video-react-sdk/dist/css/styles.css";
```

**Custom Styles**:

-   Background: Radial gradient (`from-sidebar-accent to-sidebar`)
-   Rounded UI elements with backdrop blur
-   Dark theme for active call interface
-   Consistent spacing and padding

**Tailwind Classes**:

-   Responsive layouts with flexbox
-   Custom gradient backgrounds
-   Shadow effects for depth
-   Rounded corners for modern look

---

## Error Handling

### Error Scenarios

1. **Meeting Completed**:

```typescript
if (data.status === "completed") {
    return <ErrorState title="Meeting has ended" />;
}
```

2. **No Session** (page.tsx):

```typescript
if (!session) {
    redirect("/sign-in");
}
```

3. **Client Initialization Failure**:

```typescript
if (!client || !call) {
    return <LoadingSpinner />;
}
```

4. **Redirect on Missing User**:

```typescript
if (!userId || !userName) {
    window.location.href = `/join/${meetingId}`;
}
```

---

## Integration Points

### With Meetings Module

-   Fetches meeting data via tRPC
-   Validates meeting status
-   Generates authentication tokens

### With Auth Module

-   Uses Better-Auth for session management
-   Supports both authenticated and guest users
-   Handles avatar generation

### With Stream Platform

-   Video/audio streaming
-   Participant management
-   Call recording (if enabled)
-   Real-time communication

---

## Responsive Design

**Desktop Experience**:

-   Full-size video layout
-   Side-by-side controls
-   Optimal for multi-participant calls

**Mobile Considerations**:

-   Fully responsive design, works well on mobile devices as well.
-   Stacked layout for controls
-   Touch-optimized buttons
-   Responsive video grid

---

## Security Considerations

1. **Token Generation**: Server-side only (tRPC)
2. **Guest Access**: Time-limited tokens
3. **Meeting Validation**: Status checks before joining
4. **Secure Cleanup**: Proper disconnection on unmount

---

## Performance Optimizations

1. **Query Prefetching**: Meeting data loaded server-side
2. **Lazy Loading**: Stream SDK loaded only when needed
3. **Cleanup Hooks**: Prevents memory leaks
4. **Disabled Devices**: Camera/mic off by default in lobby

## Dependencies

```json
{
    "@stream-io/video-react-sdk": "^1.18.12",
    "@stream-io/node-sdk": "latest",
    "better-auth": "latest",
    "@trpc/react-query": "latest"
}
```

## Related Documentation

-   [Meetings Module](./meetings.md)
-   [Authentication](./auth.md)
-   [Stream Video SDK Docs](https://getstream.io/video/docs/)
-   [tRPC Documentation](./trpc.md)
