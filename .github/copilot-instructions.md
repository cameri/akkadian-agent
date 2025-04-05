# Copilot Instructions

This project is a bot that supports both Telegram and Nostr. The application is built using NestJS and Node.js, and it uses MongoDB as the database.

## Coding Standards

- Use camelCase for variable and function names.
- Use PascalCase for component names.
- Use single quotes for strings.
- Use 2 spaces for indentation.
- Use template literals for strings that contain variables except when using them with the LogService.
- Use the latest JavaScript features (ES6+) where possible.

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

To build the docker image:
pnpm run docker:build

### Testing

- Use Jest for unit testing and Cucumber for integration testing.
- Use supertest for testing HTTP requests.

- Never assert on the console output, logging, or tracing of the app.

To test:
pnpm run test:unit

To run coverage report:
pnpm run test:unit:cov

To run integration tests:
pnpm run test:integration

## Contributing

Use `jj` for version control. Do not use `git` directly. `jj` is a distributed version control system that is similar to Git but has some differences in its workflow and commands.
- Always create a new revision using `jj new -m "your message"` before making new edits.
- Update the description of a revision using `jj describe -m "your message"` after you are done making all changes if needed.
- To split your changes into parent and child revisions, use `jj split [-r revision] <file,...>`. Use -r to split a specific revision other than the current one. Use -p to split the revision into two parallel revisions instead of a parent and child.
- To update your working copy with the latest changes from the main branch, use `jj status`.
- Always use `jj git push` to push your changes.

To see the diff of your changes:
jj diff

To update your working copy or see the status of your changes:
jj status

To see the log of your changes (e.g. to see the change history):
jj log

To see the log operations we've applied with jj:
jj op log

To squash the last two revisions:
jj squash

To undo the last revision:
jj undo

To rebase a revision and it's descendants on top of another revision:
jj rebase -s <source_revision> -d <destination_revision>