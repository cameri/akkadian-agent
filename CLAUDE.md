# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Akkadian Agent is a multi-platform bot supporting both Telegram and Nostr protocols, built with NestJS and TypeScript. The application uses MongoDB for persistence and follows CQRS patterns for handling commands and queries.

## Development Commands

**Building & Type Checking:**
- `pnpm run build` - Build the application
- `pnpm run build:check` - Type check without emitting files

**Development:**
- `pnpm run start:dev` - Run in development mode with hot-reload
- `pnpm run start:prod` - Run in production mode

**Testing:**
- `pnpm run test:unit` - Run unit tests
- `pnpm run test:unit:cov` - Run unit tests with coverage report
- `pnpm run test:integration` - Run integration tests using Cucumber
- `pnpm run test` - Run both unit and integration tests

**Code Quality:**
- `pnpm run lint:fix` - Lint and fix code issues
- `pnpm run format:fix` - Format code with Prettier

**Docker:**
- `pnpm run docker:start` - Start with Docker Compose
- `pnpm run docker:stop` - Stop Docker containers
- `pnpm run docker:logs` - View Docker logs

## Architecture

The application follows a modular architecture with clear separation of concerns:

- **Transports Layer** (`src/transports/`): Platform-specific implementations (Telegram, Nostr) that handle protocol-specific communication
- **Plugins Layer** (`src/plugins/`): Business logic modules (currently simple-replies) that implement bot functionality
- **Infrastructure** (`src/database/`, `src/instrumentation/`): Cross-cutting concerns like database access and logging
- **Main App** (`src/app.module.ts`, `src/main.ts`): Application bootstrap and module composition

The app uses microservices architecture where Telegram runs as a microservice strategy connected to the main NestJS application.

## Key Patterns

- **CQRS**: Commands and queries are separated with dedicated handlers
- **Repository Pattern**: Data access abstracted through repository classes
- **Plugin Architecture**: Features implemented as self-contained modules
- **Transport Abstraction**: Platform-specific code isolated in transport modules

## Environment Configuration

Required environment variables:
- `MONGODB_URI` - MongoDB connection string
- `APP_NAME` - Application name for logging/database
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `NOSTR_RELAY_URLS` - Comma-separated Nostr relay URLs
- `NOSTR_USER_WHITELIST` - Comma-separated Nostr user IDs

## Development Standards

**TypeScript:**
- Use TypeScript 5.8+
- Explicitly type function arguments, return values, and variables
- Prefer `type` over `interface` unless advanced features needed
- Use object hashes with `as const` instead of `enum`
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Use `kebab-case` for file names

**Database (MongoDB):**
- Use camelCase for field names in schemas
- Use lower, singular nouns with dashes for collection names
- Avoid embedding documents deeper than 2 levels
- Store dates in ISO 8601 format
- Use soft deletes with `deletedAt` field

**Testing:**
- Unit tests: Jest with AAA pattern (Arrange, Act, Assert)
- Integration tests: Cucumber with BDD principles
- Use `rxjs/testing`, `@golevelup/ts-jest`, and `@nestjs/testing`
- Maintain 80% coverage threshold for branches, functions, lines, statements
- Use `.spec.ts` for unit tests, `.step.ts` and `.feature` for integration tests

**Version Control:**
- Use `jj` for version control, not `git` directly
- Create new revision with `jj new -m "message"` before making changes
- Push with `jj git push`

## Specialized Agents

This project includes specialized Claude agents in `.claude/agents/` for different aspects of software development:

**Engineering Leadership:**
- **principal-architect** - Technical vision, system architecture, technology selection, and strategic decisions
- **staff-backend-developer** - Backend architecture, team leadership, performance optimization, and cross-system design
- **senior-backend-developer** - Feature ownership, code quality leadership, and team mentorship

**Product & Operations:**
- **product-manager** - Product strategy, requirements definition, roadmap planning, and stakeholder coordination
- **devops-engineer** - Infrastructure automation, CI/CD pipelines, monitoring, security, and developer productivity

These agents can be invoked by mentioning their names or will automatically activate based on the context of your requests. Each agent has specialized expertise and tools appropriate for their role.

## Agent Chaining Patterns

For optimal results, agents can be chained together in specific sequences to handle complex workflows. Here are recommended chaining patterns for this project:

### Feature Development Workflow
1. **product-manager** → Define requirements, user stories, and acceptance criteria
2. **principal-architect** → Design system architecture and technical approach
3. **senior-backend-developer** → Implement the feature with production-quality code
4. **devops-engineer** → Set up deployment, monitoring, and infrastructure

### Performance Optimization Workflow  
1. **staff-backend-developer** → Analyze performance bottlenecks and system architecture
2. **senior-backend-developer** → Implement optimizations and refactoring
3. **devops-engineer** → Update monitoring and infrastructure for improved performance

### System Architecture Workflow
1. **product-manager** → Define business requirements and constraints
2. **principal-architect** → Design overall system architecture and technology choices
3. **staff-backend-developer** → Design detailed implementation architecture
4. **devops-engineer** → Plan infrastructure and deployment architecture

### Agent Management Workflow
1. **agent-manager** → Analyze agent ecosystem and identify improvements
2. **agent-manager** → Optimize configurations and create new agents as needed

### Example Chaining Commands
- "First use the product-manager to define requirements, then principal-architect to design the system"
- "Use staff-backend-developer to analyze the performance issue, then senior-backend-developer to implement the fix"
- "Have the agent-manager review and optimize all our current agents"

Each agent starts with a clean context, so provide clear handoff instructions between agents to maintain workflow continuity.

## Code Quality Requirements

Always run these commands after making changes:

1. `pnpm run build:check` - Type checking
2. `pnpm run build` - Build verification  
3. `pnpm run lint:fix` - Linting
4. `pnpm run format:fix` - Code formatting
5. `pnpm run test:unit` - Unit tests with 100% coverage expected