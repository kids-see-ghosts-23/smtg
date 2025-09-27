# Authentication Module

The Authentication module handles user authentication and authorization within the SMTG Notion application using the Better Auth library.

## Structure

```
src/modules/auth/
└── ui/
    └── views/
        ├── sign-in-view.tsx
        └── sign-up-view.tsx
```

```
src/lib/
├── auth-client.ts
└── auth.ts
```

## Implementation

### Backend Authentication (`src/lib/auth.ts`)

The authentication system is implemented using Better Auth with the following configuration:

- User model with email and password
- Session management
- OAuth provider support (configured via environment variables)

### Frontend Authentication Client (`src/lib/auth-client.ts`)

The frontend authentication client provides hooks and utilities for:
- User session management
- Sign in/up functionality
- Sign out functionality
- User data retrieval

### UI Views

#### Sign In View (`src/modules/auth/ui/views/sign-in-view.tsx`)
Provides the user interface for signing in to the application, including:
- Email and password form
- OAuth provider buttons
- Password reset option
- Sign up link for new users

#### Sign Up View (`src/modules/auth/ui/views/sign-up-view.tsx`)
Provides the user interface for creating new accounts, including:
- Name, email, and password form
- Terms and conditions acceptance
- Sign in link for existing users

## API Integration

Authentication is handled through the `/api/auth/[...all]` endpoints which are implemented using `better-auth/next-js`.

## Session Management

The application uses cookie-based session management with secure, HTTP-only cookies. Sessions are automatically refreshed and validated on each request.

## Security Features

- Password hashing using industry-standard algorithms
- CSRF protection
- Rate limiting on authentication attempts
- Secure cookie settings (HttpOnly, Secure, SameSite)
- OAuth state parameter validation

## Customization

The authentication system can be customized by modifying:
- User model fields in `src/lib/auth.ts`
- OAuth providers in the Better Auth configuration
- UI components in the auth views
- Session duration and security settings