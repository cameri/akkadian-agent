# Akkadian Agent

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![NestJS](https://img.shields.io/badge/nestjs-10.x-red.svg)](https://nestjs.com)
[![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-%3E%3D5.0.0-blue.svg)](https://www.typescriptlang.org/)

A Telegram and Nostr bot built with NestJS that supports automated replies and message handling.

## Description

Akkadian Agent is a versatile bot that can:
- Handle messages from both Telegram and Nostr platforms
- Support configurable automated replies
- Store message patterns and responses in MongoDB
- Scale efficiently with containerized deployment

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (>= 18.x)
- pnpm (>= 8.6.0)
- MongoDB (>= 6.0)
- Docker (optional, for containerized deployment)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/cameri/akkadian-agent.git
cd akkadian-agent
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy the sample environment file and configure your variables:
```bash
cp sample.env .env
```

## Configuration

The following environment variables are required:

- `MONGODB_URI`: MongoDB connection string
- `APP_NAME`: Application name for logging and database connection
- `LOG_LEVEL`: Logging level (default: 'info')
- `LOG_FORMAT`: Log format ('json' or 'pretty')

For Telegram bot:
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token from BotFather

For Nostr:
- `NOSTR_RELAY_URLS`: Comma-separated list of Nostr relay WebSocket URLs
- `NOSTR_USER_WHITELIST`: Comma-separated list of whitelisted Nostr user IDs

## Usage

### Running Locally

Development mode with hot-reload:
```bash
pnpm run start:dev
```

Production mode:
```bash
pnpm run build
pnpm run start:prod
```

### Using Docker

Build and run with Docker Compose:
```bash
pnpm run docker:start
```

Stop containers:
```bash
pnpm run docker:stop
```

View logs:
```bash
pnpm run docker:logs
```

## Development

### Building

Check types:
```bash
pnpm run build:check
```

Build the application:
```bash
pnpm run build
```

### Testing

Run unit tests:
```bash
pnpm run test:unit
```

Run integration tests:
```bash
pnpm run test:e2e
```

Generate coverage report:
```bash
pnpm run test:unit:cov
```

### Code Quality

Format code:
```bash
pnpm run format:fix
```

Lint code:
```bash
pnpm run lint:fix
```

## Project Structure

```plain
├── .claude/                   # Claude AI agent configurations
│   └── agents/               # Specialized agent definitions
├── .github/                  # GitHub workflows and templates
├── .husky/                   # Git hooks configuration
├── .vscode/                  # VSCode workspace settings
├── scripts/                  # Development and deployment scripts
│   └── mongo/                # MongoDB utilities
├── src/                      # Application source code
│   ├── @types/               # TypeScript type definitions
│   ├── database/             # Database configuration and setup
│   ├── instrumentation/      # Logging and monitoring
│   │   └── logging/          # Logging infrastructure
│   ├── plugins/              # Business logic modules
│   │   ├── factoids/         # Factoids plugin implementation
│   │   └── simple-replies/   # Simple replies plugin
│   ├── scheduling/           # Task scheduling utilities
│   └── transports/           # Platform-specific implementations
│       ├── nostr/            # Nostr protocol integration
│       └── telegram/         # Telegram bot integration
└── tests/                    # Test suites and configurations
    ├── features/             # Cucumber feature files
    └── step-definitions/     # Test step implementations
```

## Built With

- [Node.js](https://nodejs.org/) - JavaScript runtime
- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [MongoDB](https://www.mongodb.com/) - Document database
- [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types
- [Mongoose](https://mongoosejs.com/) - MongoDB object modeling
- [Jest](https://jestjs.io/) - Testing framework
- [ESLint](https://eslint.org/) - Code linting
- [Prettier](https://prettier.io/) - Code formatting

## Contributing

Please read our [Contributing Guide](.github/CONTRIBUTING.md) for details on our development process and how to submit changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
