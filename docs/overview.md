# Liu TS Overview

Liu TS is a minimal TypeScript/JavaScript authoring subset for writing small, analyzable scripts that call project tools as plain functions. It is designed to be:

- Simple: only top-level code, const/let, if/else, object/array literals, and function calls
- Safe: strict validation blocks complex control flow and dynamic constructs
- Portable: runs in a Node.js VM without requiring TypeScript at runtime
- Extensible: helpers provide common patterns like mapping, retry, and waits

Key design choices
- Tools are plain functions `tool(args: object): object`.
- The final value is returned via `export default { ... }`.
- No user `async/await` or `try/catch`; error handling is explicit via values.
- A small CLI supports validation, compilation preview, and execution.

What Liu TS is not (yet)
- It is not a workflow engine; there is no built-in persistence/resume.
- It is not a full TypeScript compiler; type annotations are optional in authoring but stripped for execution.
- It intentionally avoids complex language features to keep scripts analyzable.

