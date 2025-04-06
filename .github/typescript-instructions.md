# TypeScript Instructions

- Use TypeScript 5.8 or later.
- Don't add comments to the code unless necessary.
- Explicitly type function arguments, return values, and variables.
- Prefer `type` over `interface` unless advanced features are needed.
- Avoid `enum`; use `as const` with union types.
- Use `readonly` for immutability.
- Use optional chaining (`?.`) for nested properties.
- Use nullish coalescing (`??`) for default values.
- Use ES6 module syntax for imports.
- Group imports by standard libraries, third-party libraries, and local modules.
- Use `kebab-case` for file names.
- Handle errors explicitly with `try/catch` or `.catch()`. If an async function can never throw an error then use `void` as the return type and prefix the call with `void`.
- Use custom error classes for app-specific errors.
- Suggest install new versions of TypeScript and Node.js if the current version is outdated.