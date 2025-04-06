# Copilot Instructions

This project is a bot that supports both Telegram and Nostr. The application is built using NestJS and Node.js, and it uses MongoDB as the database.

## Coding Standards

- Detailed coding standards are outlined in the `typescript-instructions.md` file.

## General

- Summarize changes in the changelog.md file.

### Dependency management

- Use pnpm for package management.

### Build & run

- After you are done making changes, always try to check the types, build the app, lint and format documents, test the app and ensure coverage is 100%, and build the docker image. Use the following commands to do so:

To build the app:
pnpm run build

To run type checks:
pnpm run build:check

To lint:
pnpm run lint:fix

To format:
pnpm run format:fix


## Version Control

- USe `jj` for version control. Detailed instructions are in the `using-jj-instructions.md` file.
