# Dashboard Module

The Dashboard module provides the main user interface for the SMTG Notion application, including navigation, user controls, and overview components.

## Structure

```
src/modules/dashboard/
└── ui/
    └── components/
        ├── dashboard-command.tsx
        ├── dashboard-navbar.tsx
        ├── dashboard-sidebar.tsx
        └── dashboard-user-button.tsx
```

## Components

### Dashboard Command (`dashboard-command.tsx`)
Implements the command palette interface:
- Quick navigation to different sections
- Search functionality
- Keyboard shortcuts
- Recently accessed items

### Dashboard Navbar (`dashboard-navbar.tsx`)
Top navigation bar with:
- Application logo
- Main navigation links
- Search bar
- User profile button
- Notification indicators

### Dashboard Sidebar (`dashboard-sidebar.tsx`)
Side navigation menu with:
- Main navigation sections
- Collapsible menu items
- Active route highlighting
- Quick action buttons

### Dashboard User Button (`dashboard-user-button.tsx`)
User profile component with:
- User avatar display
- User name and email
- Profile menu with settings and logout
- Theme toggle option

## Integration Points

### Navigation
The dashboard components integrate with Next.js App Router for client-side navigation between different sections of the application.

### Authentication
User profile components integrate with the authentication system to display user information and handle logout functionality.

### State Management
The dashboard uses React state and context for:
- Sidebar open/closed state
- Theme preferences
- User menu visibility
- Command palette visibility

## Customization

The dashboard can be customized by:
- Modifying navigation items and routes
- Adding new sidebar sections
- Customizing the command palette
- Updating the theme and styling
- Adding new user profile options

## Responsive Design

Dashboard components are designed to be responsive:
- Sidebar collapses on mobile devices
- Navbar adapts to different screen sizes
- Command palette is accessible on all devices
- User button adapts to available space

## Performance Considerations

- Lazy loading of components where appropriate
- Efficient state management to prevent unnecessary re-renders
- Optimized SVG icons for fast loading
- Proper error boundaries for component isolation