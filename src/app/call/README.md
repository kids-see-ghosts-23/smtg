# Call Module

The Call module manages the real-time video call interface and components for meeting participation in the SMTG Notion application.

## Structure

```
src/modules/call/
└── ui/
    ├── components/
    │   ├── call-active.tsx
    │   ├── call-connect.tsx
    │   ├── call-ended.tsx
    │   ├── call-lobby.tsx
    │   ├── call-provider.tsx
    │   └── call-ui.tsx
    └── views/
        └── call-view.tsx
```

## Components

### Call Active (`call-active.tsx`)
Displays the active meeting interface with:
- Video streams for participants
- Meeting controls (mute, camera toggle, end call)
- Chat interface
- Meeting information display

### Call Connect (`call-connect.tsx`)
Handles the connection process to a meeting:
- Loading state while connecting
- Error handling for connection failures
- Retry mechanism

### Call Ended (`call-ended.tsx`)
Displays the meeting ended interface:
- Meeting summary information
- Options to return to dashboard
- Feedback collection

### Call Lobby (`call-lobby.tsx`)
Pre-meeting interface where users:
- Can test their audio/video
- View meeting details
- Join the meeting when ready

### Call Provider (`call-provider.tsx`)
Wrapper component that provides the Stream Video context:
- Initializes Stream Video client
- Manages call state
- Provides hooks for other components

### Call UI (`call-ui.tsx`)
Main component that orchestrates the call interface:
- Manages transitions between call states
- Integrates all call components
- Handles call lifecycle events

## Views

### Call View (`call-view.tsx`)
Top-level view component for the call page:
- Integrates with Next.js routing
- Manages URL parameters for meeting ID
- Provides the complete call experience

## Integration with External Services

### Stream Video SDK
The call module integrates with Stream's Video SDK to provide:
- Real-time video and audio communication
- Screen sharing capabilities
- Recording functionality
- Transcription services

### Stream Chat SDK
Integrated chat functionality:
- Real-time messaging during calls
- Message history
- File sharing

## State Management

The call module uses React state and Stream's built-in state management to handle:
- Connection status
- Participant list
- Audio/video device states
- Call controls
- Chat messages

## Customization

The call interface can be customized by:
- Modifying component styles
- Adding new call controls
- Extending participant features
- Customizing the lobby experience