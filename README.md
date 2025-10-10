Liu TS (standalone)

Liu TS is a compact, constrained TypeScript/JavaScript authoring subset for writing small, analyzable plans that call project tools as plain functions. It provides:

- A strict validator to keep scripts simple and safe
- A sandboxed runtime to execute scripts and capture the default export
- Minimal helper surface (`@liu`) to enable common patterns (map items, retry, waits)
- A lightweight CLI for validation and quick runs

Authoring model
- Files use `.liu.ts` (or `.liu.js`) for better editor support
- Import tools as plain functions: `import { toolA, toolB } from '@tools'`
- Import helpers from `@liu`: `import { mapItems, retry, wait_event } from '@liu'`
- Use only top-level code with const/let (single-assignment principle)
- Export exactly one default value as the final result

Example
```
import { add, mul } from '@tools';

const s1 = add({ a: 2, b: 3 });
const s2 = mul({ a: s1.result, b: 10 });

export default { result: s2.result };
```

CLI
```
# Validate a script
liu validate path/to/plan.liu.ts

# Run a script with a local tools module (ESM)
liu run path/to/plan.liu.ts --tools ./examples/tools.js

# Run with simple persisted state (JSON files)
liu run-persisted path/to/plan.liu.ts --plan-id demo1 --state-file .liu-state --tools ./examples/tools.js
liu state-show . --plan-id demo1 --state-file .liu-state
liu state-reset . --plan-id demo1 --state-file .liu-state

# Print the transformed module (debug)
liu compile path/to/plan.liu.ts
```

Notes
- This package intentionally excludes enterprise plan/workflow engines. It focuses on the Liu TS authoring/runtime surface.
- TypeScript is optional at runtime; the runtime executes compiled JS. The TS parser (if present) is used for inspection only.
