# Documentation Summary

This document provides an overview of all the documentation available for the SMTG Notion application.

## Table of Contents

1. [API Documentation](./api.md) - Complete documentation for all API endpoints
2. [Database Schema](./database.md) - Complete database structure and relationships
3. [TRPC Implementation](./trpc.md) - Type-safe API communication setup
4. [Agents Module](./agents.md) - Documentation for the agents management system
5. [Meetings Module](./meetings.md) - Documentation for the meetings management system
6. [Authentication Module](./auth.md) - Documentation for the authentication system
7. [Call Module](./call.md) - Documentation for the real-time video call system
8. [Dashboard Module](./dashboard.md) - Documentation for the main dashboard interface
9. [Home Module](./home.md) - Documentation for the home/landing page

## Overview

The SMTG Notion application is structured into several modules, each responsible for a specific aspect of the functionality:

- **Agents**: Management of AI agents that participate in meetings
- **Meetings**: Complete lifecycle management of meetings from scheduling to follow-up
- **Authentication**: User authentication and authorization system
- **Call**: Real-time video call interface and components
- **Dashboard**: Main user interface with navigation and overview components
- **Home**: Landing page and entry point for authenticated users

Additionally, the application includes detailed technical documentation:

- **Database Schema**: Complete PostgreSQL schema with Drizzle ORM definitions
- **TRPC Implementation**: Type-safe API communication setup and usage

## API Endpoints

The application exposes both REST and TRPC endpoints for different use cases:

- REST endpoints for webhooks, authentication, and specific operations
- TRPC endpoints for type-safe client-server communication

Detailed API documentation can be found in the [API Documentation](./api.md) file.

## External Services

The application integrates with several external services:

- **Stream Video & Chat**: Real-time communication platform
- **OpenAI**: AI processing for transcriptions and chat responses
- **Inngest**: Serverless event-driven background processing
- **Neon Database**: PostgreSQL database with Drizzle ORM
- **Better Auth**: Authentication library

## Development

For development setup and available scripts, please refer to the main [README.md](../README.md) file.

## Technical Documentation

For detailed technical implementation details, refer to:
- [Database Schema Documentation](./database.md) - Complete database structure
- [TRPC Implementation Documentation](./trpc.md) - Type-safe API communication