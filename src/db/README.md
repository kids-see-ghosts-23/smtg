
# Database Schema Documentation

This document provides detailed documentation of the database schema used in the SMTG Notion application. The application uses PostgreSQL with Drizzle ORM for database management.

## Overview

The database schema consists of two main categories of tables:

1. **User Management Tables** - For handling user authentication and sessions
2. **Application Tables** - For storing application-specific data (agents and meetings)

---

## User Management Tables

### Users Table


| Column        | Type      | Constraints               | Description                          |
| ------------- | --------- | ------------------------- | ------------------------------------ |
| id            | text      | Primary key               | Unique identifier for the user       |
| name          | text      | Not null                  | User's full name                     |
| email         | text      | Not null, Unique          | User's email address                 |
| emailVerified | boolean   | Not null, default `false` | Whether the user's email is verified |
| image         | text      |                           | URL to the user's profile image      |
| createdAt     | timestamp | Not null, default now     | When the user was created            |
| updatedAt     | timestamp | Not null, default now     | When the user was last updated       |

---

### Sessions Table

| Column    | Type      | Constraints           | Description                       |
| --------- | --------- | --------------------- | --------------------------------- |
| id        | text      | Primary key           | Unique identifier for the session |
| expiresAt | timestamp | Not null              | When the session expires          |
| token     | text      | Not null, Unique      | Session token                     |
| createdAt | timestamp | Not null              | When the session was created      |
| updatedAt | timestamp | Not null              | When the session was last updated |
| ipAddress | text      |                       | IP address of the client          |
| userAgent | text      |                       | User agent string of the client   |
| userId    | text      | Not null, Foreign key | References `user.id`              |

---

### Accounts Table

| Column                | Type      | Constraints           | Description                                |
| --------------------- | --------- | --------------------- | ------------------------------------------ |
| id                    | text      | Primary key           | Unique identifier for the account          |
| accountId             | text      | Not null              | Account identifier from the provider       |
| providerId            | text      | Not null              | Identifier for the auth provider           |
| userId                | text      | Not null, Foreign key | References `user.id`                       |
| accessToken           | text      |                       | Provider access token                      |
| refreshToken          | text      |                       | Provider refresh token                     |
| idToken               | text      |                       | ID token from the provider                 |
| accessTokenExpiresAt  | timestamp |                       | Expiry of the access token                 |
| refreshTokenExpiresAt | timestamp |                       | Expiry of the refresh token                |
| scope                 | text      |                       | Scope of the authorization                 |
| password              | text      |                       | Hashed password (if password auth enabled) |
| createdAt             | timestamp | Not null              | When the account was created               |
| updatedAt             | timestamp | Not null              | When the account was last updated          |

---

### Verification Table

| Column     | Type      | Constraints | Description                            |
| ---------- | --------- | ----------- | -------------------------------------- |
| id         | text      | Primary key | Unique identifier for the verification |
| identifier | text      | Not null    | Identifier (usually email)             |
| value      | text      | Not null    | Verification token                     |
| expiresAt  | timestamp | Not null    | When the verification expires          |
| createdAt  | timestamp | Default now | When the verification was created      |
| updatedAt  | timestamp | Default now | When the verification was last updated |

---

## Application Tables

### Agents Table


| Column       | Type      | Constraints           | Description                               |
| ------------ | --------- | --------------------- | ----------------------------------------- |
| id           | text      | Primary key, nanoid   | Unique identifier for the agent           |
| name         | text      | Not null              | Agent's name                              |
| userId       | text      | Not null, Foreign key | References `user.id` (owner of the agent) |
| instructions | text      | Not null              | Instructions defining agent behavior      |
| githubRepo   | text      |                       | Optional GitHub repo linked to the agent  |
| createdAt    | timestamp | Not null, default now | When the agent was created                |
| updatedAt    | timestamp | Not null, default now | When the agent was last updated           |

---

### Meetings Table

| Column        | Type           | Constraints                | Description                                |
| ------------- | -------------- | -------------------------- | ------------------------------------------ |
| id            | text           | Primary key, nanoid        | Unique identifier for the meeting          |
| name          | text           | Not null                   | Meeting title/name                         |
| userId        | text           | Not null, Foreign key      | References `user.id` (creator of meeting)  |
| agentId       | text           | Not null, Foreign key      | References `agents.id` (participant agent) |
| status        | meeting_status | Not null, default upcoming | Current status of the meeting              |
| startedAt     | timestamp      |                            | When the meeting started                   |
| endedAt       | timestamp      |                            | When the meeting ended                     |
| transcriptUrl | text           |                            | URL to meeting transcript                  |
| recordingUrl  | text           |                            | URL to meeting recording                   |
| summary       | text           |                            | Summary of the meeting                     |
| createdAt     | timestamp      | Not null, default now      | When the meeting was created               |
| updatedAt     | timestamp      | Not null, default now      | When the meeting was last updated          |

**Meeting Status Values:**

* `upcoming` – Scheduled for the future
* `active` – Currently in progress
* `completed` – Finished successfully
* `processing` – Undergoing transcription/summary generation
* `cancelled` – Cancelled by user