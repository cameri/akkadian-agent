# Unit Testing Instructions

- Use Jest and Supertest for unit tests.
- Use `rxjs/testing` for testing RxJS code, `@golevelup/ts-jest` for testing TypeScript code, and `@nestjs/testing` for testing NestJS code.
- Use the AAA pattern (Arrange, Act, Assert) for writing tests and separate the three sections with blank lines.
- Use descriptive names for test cases (e.g. `it('should do X when given Y and Z')`).
- Avoid using magic numbers or strings in tests: use constants or enums instead.
- Use fixtures or factories to create test data.
- Use a consistent naming convention for test files and test cases (e.g., `.spec.ts` for test files and `describe()` for test suites).
- Use `beforeEach()` and `afterEach()` to set up and tear down test data and test doubles. Avoid using `beforeAll()` and `afterAll()` unless necessary.
- Use test doubles (spies, mocks, or stubs) to isolate the code being tested.
- Avoid testing external dependencies or side effects (e.g., network calls, file I/O, database queries) in unit tests. Use mocks or stubs to replace these dependencies.
- Avoid importing from other test files or sharing test data between tests. Each test should be self-contained and independent.
- Use code coverage tools to measure the effectiveness of tests and identify untested code.
- Do not attempt to rewrite existing test suites whole, instead focus on improving the quality of existing tests incrementally.
- Never assert on the console output, logging, or tracing of the app.

To test: `pnpm run test:unit`
To run coverage report: `pnpm run test:unit:cov`
To run integration tests: `pnpm run test:integration`
