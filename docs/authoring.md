# Authoring Liu TS

File extensions
- Use `.liu.ts` (or `.liu.js`). TypeScript annotations are optional for authoring and editor IntelliSense.

Imports
- Tools: `import { foo, bar } from '@tools'`
- Helpers: `import { mapItems, retry, wait_event, wait_for, set_var } from '@liu'`

Allowed constructs
- Top-level const/let declarations (single-assignment principle)
- Object and array literals; numbers/strings/booleans/null
- References to previous const/let values
- Flat if/else-if/else chains (no nested if bodies)
- Function calls to imported tools and helpers
- A single `export default { ... }` value

Disallowed constructs
- `function`, `class`, `async`, `await`, `new`
- Loops (`for`, `while`) and arrow functions (`=>`)
- Dynamic imports, eval, or other dynamic code generation
- Multiple default exports

Patterns
- Result-style branching:
```
import { validate_invoice, notify } from '@tools';

const v = validate_invoice({ id: 'INV-123' });
if (v.ok) {
  export default { status: 'ok', invoice: v.invoice };
} else {
  const n = notify({ channel: 'ops', message: v.error });
  export default { status: 'invalid', notified: n.ok };
}
```

- Mapping with defaults and filtering:
```
import { mapItems } from '@liu';
import { process_line } from '@tools';

const results = mapItems(process_line, [ { sku: 'A' }, { sku: 'B' } ], {
  defaults: { warehouse: 'WH-1' },
  collectIf: { on: 'result', field: 'ok', value: true }
});

export default { results };
```

