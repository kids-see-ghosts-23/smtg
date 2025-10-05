# Documentation Summary

This document provides an overview of all the documentation available for the SMTG Notion application.

## Table of Contents

1. [API Documentation](./api.md) - Complete documentation for all API endpoints
2. [Database Schema](./database.md) - Complete database structure and relationships
3. [TRPC Implementation](./trpc.md) - Type-safe API communication setup
4. [Agents Module](./agents.md) - Documentation for the agents management system
5. [Meetings Module](./meetings.md) - Documentation for the meetings management system
6. [Authentication Module](./auth.md) - Documentation for the authentication system
7. [Call Module](./call.md) - Comprehensive guide to the real-time video conferencing system

## Overview

The SMTG(Smart Meetings Tranformed by GenAI) application is structured into several modules, each responsible for a specific aspect of the functionality:

-   **Agents**: Management of AI agents that participate in meetings
-   **Meetings**: Complete lifecycle management of meetings from scheduling to follow-up
-   **Authentication**: User authentication and authorization system (supports both authenticated and guest users)
-   **Call**: Comprehensive real-time video conferencing system with Stream Video SDK integration, supporting:
    -   Pre-call device testing and setup (lobby)
    -   Active video calls with participant management
    -   Post-call summary and meeting wrap-up
    -   Both authenticated and guest user participation
    -   Audio/video controls, screen sharing, and call recording capabilities
-   **Database Schema**: Complete PostgreSQL schema with Drizzle ORM definitions
-   **TRPC Implementation**: Type-safe API communication setup and usage

## API Endpoints

The application exposes both REST and TRPC endpoints for different use cases:

-   REST endpoints for webhooks, authentication, and specific operations
-   TRPC endpoints for type-safe client-server communication

Detailed API documentation can be found in the [API Documentation](./api.md) file.

## External Services

The application integrates with several external services:

-   **Stream Video & Chat**: Real-time communication platform powering video calls, audio streaming, and participant management
    -   Video SDK v1.18.12+ for video conferencing
    -   Supports screen sharing, recording, and transcription
    -   Handles participant state and call lifecycle
-   **OpenAI**: AI processing for transcriptions and chat responses
-   **Inngest**: Serverless event-driven background processing
-   **Neon Database**: PostgreSQL database with Drizzle ORM
-   **Better Auth**: Authentication library supporting both registered users and guest access

## Development

For development setup and available scripts, please refer to the main [README.md](../README.md) file.

## Technical Documentation

For detailed technical implementation details, refer to:

-   [Database Schema Documentation](./database.md) - Complete database structure
-   [TRPC Implementation Documentation](./trpc.md) - Type-safe API communication
-   [Call Module Documentation](./call.md) - In-depth guide covering:
    -   Call flow architecture and component interactions
    -   Stream Video SDK integration and configuration
    -   Authentication flows (authenticated users + guest participants)
    -   State management and lifecycle handling
    -   Error handling and security considerations
    -   Performance optimizations and testing strategies
