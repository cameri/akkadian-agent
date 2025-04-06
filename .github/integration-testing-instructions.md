# Integration Test Instructions

## General Guidelines

- Use Cucumber and the `node:assert` library for integration tests.
- Use `nock` and `supertest` for mocking HTTP requests and testing APIs.
- Ensure step definitions are reusable and modular, and avoid duplication.
- Use regular function syntax instead of arrow functions for step definitions to ensure proper context binding (`this` type should be `TestWorld`)
- Use test containers for integration tests that require a database or external service.
- Use BDD (Behavior-Driven Development) principles to write tests that are easy to read and understand.
- Use Gherkin syntax for writing feature files.
- Use `BeforeAll` and `AfterAll` hooks to set up and tear down for the entire test suite.
- Use `Before` and `After` hooks to set up and tear down for each feature scenario.
- Use `Given`, `When`, and `Then` keywords to structure tests.
- Use `And` and `But` keywords to add additional conditions or actions.
- Use `Scenario Outline` and `Examples` to create parameterized tests.
- Use `Background` to define common steps for multiple scenarios.
- Use `@tags` to categorize scenarios and control test execution. Categorize scenarios based on their purpose, such as `@smoke`, `@regression`, `@performance`, etc.
- Use `.step.ts` files for step definitions and `.feature` files for feature files.
- Avoid using magic numbers or strings in tests. Use fixtures or factories to create test data.
- Do not use test doubles (mocks, stubs, fakes) in integration tests unless absolutely necessary.

