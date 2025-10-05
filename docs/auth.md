# Authentication Documentation

## Overview

The SMTG application implements a comprehensive authentication system using [Better Auth](https://www.better-auth.com/), a modern authentication library for Next.js applications. The system supports multiple authentication methods, email verification, password reset functionality, and secure session management.

---

## Table of Contents

-   [Architecture](#architecture)
-   [Authentication Methods](#authentication-methods)
-   [Database Schema](#database-schema)
-   [Setup & Configuration](#setup--configuration)
-   [Authentication Flow](#authentication-flow)
-   [API Endpoints](#api-endpoints)
-   [Client-Side Usage](#client-side-usage)
-   [UI Components](#ui-components)
-   [Email Integration](#email-integration)
-   [Security Features](#security-features)
-   [Customization](#customization)

---

## Architecture

### Project Structure

```
src/
├── lib/
│   ├── auth.ts              # Server-side auth configuration
│   ├── auth-client.ts       # Client-side auth client
│   └── email.ts             # Email service for verification/reset
├── modules/auth/
│   └── ui/
│       └── views/
│           ├── sign-in-view.tsx      # Sign in page component
│           └── sign-up-view.tsx      # Sign up page component
├── app/
│   ├── api/auth/[...all]/
│   │   └── route.ts         # Better Auth API route handler
│   └── (auth)/
│       ├── layout.tsx       # Auth pages layout
│       ├── sign-in/         # Sign in page
│       ├── sign-up/         # Sign up page
│       ├── verify-email/    # Email verification page
│       └── resend-verification/  # Resend verification page
└── db/
    └── schema.ts            # Database schema definitions
```

---

## Authentication Methods

### 1. Email & Password Authentication

Users can create accounts and sign in using email and password credentials.

**Features:**

-   Password strength validation
-   Email verification required before first sign-in
-   Secure password hashing (handled by Better Auth)
-   Password reset functionality

### 2. OAuth Social Login

The application supports OAuth authentication with:

-   **Google** - Sign in with Google account
-   **GitHub** - Sign in with GitHub account

**Benefits:**

-   Faster onboarding process
-   No password management required
-   Leverages trusted identity providers

---

## Database Schema

### User Table

Stores core user information and authentication state.

```typescript
user {
  id: string (primary key)
  name: string
  email: string (unique)
  emailVerified: boolean (default: false)
  image: string (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Session Table

Manages active user sessions with security metadata.

```typescript
session {
  id: string (primary key)
  expiresAt: timestamp
  token: string (unique)
  createdAt: timestamp
  updatedAt: timestamp
  ipAddress: string
  userAgent: string
  userId: string (foreign key -> user.id)
}
```

### Account Table

Links users to authentication providers (OAuth or email/password).

```typescript
account {
  id: string (primary key)
  accountId: string
  providerId: string
  userId: string (foreign key -> user.id)
  accessToken: string
  refreshToken: string
  idToken: string
  accessTokenExpiresAt: timestamp
  refreshTokenExpiresAt: timestamp
  scope: string
  password: string (hashed)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Verification Table

Handles email verification and password reset tokens.

```typescript
verification {
  id: string (primary key)
  identifier: string (email)
  value: string (token)
  expiresAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## Setup & Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Database
DATABASE_URL=postgresql://...

# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email Service (Gmail example)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### OAuth Provider Setup

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `{BETTER_AUTH_URL}/api/auth/callback/google`

#### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set Authorization callback URL: `{BETTER_AUTH_URL}/api/auth/callback/github`
4. Copy Client ID and generate Client Secret

---

## Authentication Flow

### Sign Up Flow

```mermaid
User → Sign Up Form → Better Auth → Create User (unverified)
                                  → Send Verification Email
                                  → Redirect to Sign In
```

1. User fills out sign-up form (name, email, password)
2. Better Auth creates user account with `emailVerified: false`
3. Verification email is sent via EmailService
4. User redirected to sign-in page with success message
5. User clicks verification link in email
6. Email verified, user can now sign in

### Sign In Flow

```mermaid
User → Sign In Form → Better Auth → Check Email Verified
                                  → Create Session (if verified)
                                  → Return Session Token
                                  → Redirect to Dashboard
```

1. User enters email and password
2. Better Auth validates credentials
3. Checks if email is verified
4. If not verified: Shows error with resend option
5. If verified: Creates session and returns token
6. Session stored in HTTP-only cookie
7. User redirected to dashboard

### OAuth Flow

```mermaid
User → Click OAuth Button → Redirect to Provider
                          → User Authorizes
                          → Callback to App
                          → Better Auth Creates/Links Account
                          → Create Session
                          → Redirect to Dashboard
```

---

## API Endpoints

All authentication endpoints are handled through a single catch-all route:

### Base Route

```
/api/auth/[...all]
```

### Available Endpoints

| Method | Endpoint                            | Description                           |
| ------ | ----------------------------------- | ------------------------------------- |
| POST   | `/api/auth/sign-up/email`           | Register new user with email/password |
| POST   | `/api/auth/sign-in/email`           | Sign in with email/password           |
| POST   | `/api/auth/sign-in/social`          | Initiate OAuth sign-in                |
| GET    | `/api/auth/callback/google`         | Google OAuth callback                 |
| GET    | `/api/auth/callback/github`         | GitHub OAuth callback                 |
| POST   | `/api/auth/sign-out`                | Sign out current user                 |
| POST   | `/api/auth/send-verification-email` | Send/resend verification email        |
| GET    | `/api/auth/verify-email`            | Verify email with token               |
| POST   | `/api/auth/forget-password`         | Request password reset                |
| POST   | `/api/auth/reset-password`          | Reset password with token             |
| GET    | `/api/auth/get-session`             | Get current session                   |

---

## Client-Side Usage

### Auth Client Instance

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({});
```

### Sign Up Example

```typescript
import { authClient } from "@/lib/auth-client";

const handleSignUp = async (data: {
    name: string;
    email: string;
    password: string;
}) => {
    authClient.signUp.email(
        {
            name: data.name,
            email: data.email,
            password: data.password,
            callbackURL: "/",
        },
        {
            onSuccess: () => {
                console.log("Account created! Check your email.");
            },
            onError: ({ error }) => {
                console.error("Sign up failed:", error.message);
            },
        }
    );
};
```

### Sign In Example

```typescript
import { authClient } from "@/lib/auth-client";

const handleSignIn = async (data: { email: string; password: string }) => {
    authClient.signIn.email(
        {
            email: data.email,
            password: data.password,
            callbackURL: "/",
        },
        {
            onSuccess: () => {
                console.log("Signed in successfully!");
            },
            onError: ({ error }) => {
                if (error.status === 403) {
                    console.error("Please verify your email first");
                } else {
                    console.error("Sign in failed:", error.message);
                }
            },
        }
    );
};
```

### OAuth Sign In Example

```typescript
import { authClient } from "@/lib/auth-client";

const handleOAuthSignIn = (provider: "google" | "github") => {
    authClient.signIn.social(
        {
            provider,
            callbackURL: "/",
        },
        {
            onSuccess: () => {
                console.log("OAuth sign in successful!");
            },
            onError: ({ error }) => {
                console.error("OAuth sign in failed:", error.message);
            },
        }
    );
};
```

### Get Current Session

```typescript
import { authClient } from "@/lib/auth-client";

// Using the hook
const session = authClient.useSession();

if (session.data) {
    console.log("User:", session.data.user);
} else {
    console.log("Not authenticated");
}
```

### Sign Out

```typescript
import { authClient } from "@/lib/auth-client";

const handleSignOut = async () => {
    await authClient.signOut({
        fetchOptions: {
            onSuccess: () => {
                console.log("Signed out successfully");
            },
        },
    });
};
```

---

## UI Components

### Sign In View (`src/modules/auth/ui/views/sign-in-view.tsx`)

**Features:**

-   Email/password form with validation
-   Google and GitHub OAuth buttons
-   Email verification status handling
-   Resend verification email option
-   Link to sign-up page
-   Link to resend verification page
-   Error and success message displays

**Form Validation:**

-   Email format validation
-   Required field validation
-   Real-time form feedback

### Sign Up View (`src/modules/auth/ui/views/sign-up-view.tsx`)

**Features:**

-   Name, email, and password fields
-   Password confirmation with matching validation
-   Google and GitHub OAuth buttons
-   Success message with email verification reminder
-   Auto-redirect to sign-in after 3 seconds
-   Link to sign-in page for existing users

**Form Validation:**

-   Name required
-   Valid email format
-   Password required
-   Passwords must match

### Verify Email Page (`src/app/(auth)/verify-email/page.tsx`)

**Features:**

-   Automatic token extraction from URL
-   Real-time verification status
-   Loading, success, and error states
-   Auto-redirect to sign-in after successful verification
-   Links to sign-in and sign-up on error

### Resend Verification Page (`src/app/(auth)/resend-verification/page.tsx`)

**Features:**

-   Email input form
-   Send verification email functionality
-   Success and error feedback
-   Links to sign-in and sign-up pages

---

## Email Integration

### Email Service (`src/lib/email.ts`)

The application uses Nodemailer for sending transactional emails.

#### Configuration

```typescript
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});
```

#### Email Types

**1. Email Verification**

-   Sent automatically on sign-up
-   Contains verification link with token
-   Professionally styled HTML template
-   24-hour token expiration

**2. Password Reset**

-   Sent when user requests password reset
-   Contains reset link with token
-   1-hour token expiration
-   Security warning included

**3. Meeting Invitations** _(Additional feature)_

-   Sent to meeting participants
-   Includes calendar integration (.ics file)
-   Google Calendar quick-add link
-   Meeting details and join URL

#### HTML Email Templates

All emails use responsive HTML templates with:

-   Modern, professional design
-   Mobile-friendly layouts
-   Proper branding
-   Clear call-to-action buttons
-   Alternative plain text versions

---

## Security Features

### Password Security

-   **Hashing**: Passwords are hashed using bcrypt (handled by Better Auth)
-   **Salting**: Unique salt for each password
-   **Validation**: Minimum length and complexity requirements (client-side)

### Session Security

-   **HTTP-Only Cookies**: Prevents XSS attacks
-   **Secure Flag**: Ensures HTTPS transmission in production
-   **SameSite**: Prevents CSRF attacks
-   **Session Expiration**: Automatic token expiration
-   **IP Address Tracking**: Stored for security auditing
-   **User Agent Tracking**: Device/browser fingerprinting

### Email Verification

-   **Required for Access**: Users must verify email before signing in
-   **Token-Based**: Secure, time-limited verification tokens
-   **Single Use**: Tokens invalidated after use
-   **Expiration**: Tokens expire after 24 hours

### CSRF Protection

-   Built-in CSRF protection by Better Auth
-   Token validation on state-changing operations

### Rate Limiting

-   Protection against brute-force attacks
-   Configurable rate limits per endpoint
-   IP-based throttling

### OAuth Security

-   **State Parameter**: Prevents CSRF in OAuth flow
-   **Token Validation**: Verifies OAuth tokens
-   **Secure Storage**: Tokens stored encrypted in database

---

## Customization

### Adding Custom User Fields

Modify the user schema in `src/db/schema.ts`:

```typescript
export const user = pgTable("user", {
    // Existing fields...

    // Add custom fields
    phoneNumber: text("phone_number"),
    role: text("role").default("user"),
    bio: text("bio"),
});
```

Then update Better Auth configuration if needed.

### Configuring Session Duration

In `src/lib/auth.ts`:

```typescript
export const auth = betterAuth({
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
        updateAge: 60 * 60 * 24, // Update session every 24 hours
    },
    // ...other config
});
```

### Adding New OAuth Providers

Better Auth supports many providers. To add more:

```typescript
export const auth = betterAuth({
    socialProviders: {
        google: {
            /* ... */
        },
        github: {
            /* ... */
        },
        // Add new provider
        discord: {
            clientId: process.env.DISCORD_CLIENT_ID as string,
            clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
        },
    },
    // ...other config
});
```

### Customizing Email Templates

Modify the email generation methods in `src/lib/email.ts`:

```typescript
generateVerificationHTML(userName: string, verificationUrl: string): string {
  // Customize HTML template
  // Add your branding, colors, styles
  return `<!-- Your custom HTML -->`;
}
```

### Custom Authentication Callbacks

Add custom logic after authentication events:

```typescript
export const auth = betterAuth({
    emailVerification: {
        async afterEmailVerification(user) {
            // Custom logic after email verification
            console.log(`Email verified for ${user.email}`);

            // E.g., grant welcome bonus, send welcome email, etc.
        },
    },
    // ...other config
});
```

---

## Best Practices

### Client-Side

1. **Never store tokens in localStorage** - Let Better Auth handle cookie storage
2. **Check session on protected routes** - Use middleware or guards
3. **Handle loading states** - Provide feedback during authentication
4. **Show clear error messages** - Help users understand what went wrong
5. **Validate forms** - Provide real-time validation feedback

### Server-Side

1. **Always validate session** - Check authentication on protected API routes
2. **Use environment variables** - Never hardcode secrets
3. **Implement rate limiting** - Protect against abuse
4. **Log authentication events** - Track sign-ins, failures for security
5. **Keep Better Auth updated** - Stay current with security patches

### Database

1. **Use connection pooling** - Optimize database connections
2. **Regular backups** - Protect user data
3. **Index frequently queried fields** - Email, user ID, session tokens
4. **Monitor performance** - Track auth-related query times

---

## Troubleshooting

### Common Issues

**Issue: "Email not verified" error**

-   Solution: Check email for verification link, use resend verification page

**Issue: OAuth redirect not working**

-   Solution: Verify callback URLs in OAuth provider settings match `BETTER_AUTH_URL`

**Issue: Emails not sending**

-   Solution: Check EMAIL_USER and EMAIL_PASSWORD, ensure app password is used for Gmail

**Issue: Session not persisting**

-   Solution: Check cookie settings, ensure BETTER_AUTH_URL matches application URL

**Issue: Database connection errors**

-   Solution: Verify DATABASE_URL format and database is accessible

---

## Resources

-   [Better Auth Documentation](https://www.better-auth.com/docs)
-   [Better Auth GitHub](https://github.com/better-auth/better-auth)
-   [Next.js Authentication Guide](https://nextjs.org/docs/authentication)
-   [Drizzle ORM Documentation](https://orm.drizzle.team/)

---

## Support

For authentication-related issues:

1. Check this documentation thoroughly
2. Review Better Auth documentation
3. Check application logs for error details
4. Verify all environment variables are set correctly
5. Ensure database migrations are up to date
