Liu TS — Agent Notes

Scope and intent
- This `liu/` folder is a standalone package for the Liu TypeScript subset: a minimal, analyzable authoring surface to describe plans as constrained TypeScript/JavaScript modules.
- The package focuses on direct execution in a sandboxed VM with a strict validator and a compact helper surface. It intentionally excludes Liugent’s enterprise workflow engine, plan model, and persistence layers.

Code organization
- `src/` — ESM source
  - `validator` (`liu-validator.js`) — rejects disallowed JS/TS constructs
  - `compiler` (`liu-compiler.js`) — strips imports, rewrites `export default` to capture result
  - `runtime` (`liu-runtime.js`) — sandboxed VM executor
  - `helpers` (`helpers.js`, `helpers.d.ts`) — runtime helper functions and typings for authoring
  - `parser-ts` (`parser-ts.js`) — optional TS-based parser for AST inspection (runtime is not required to parse TS)
  - `ast` (`ast.js`) — AST node constructors (used by parser only)
  - `state.js` — simple state stores (in-memory, file)
  - `diagnostics.js` — human-readable diagnostics (constraints + TS syntax when available)
  - `llm/` — lightweight LLM integration (profiles, client, YAML templates)
- `bin/` — CLI entry (`liu.js`)
- `docs/` — package docs
 - `examples/` — example tools, plans, templates, REPL scripts

Style and conventions
- Language: modern JavaScript, ESM (`"type": "module"`)
- Indentation: 2 spaces; keep lines ~100–120 chars
- Filenames: kebab-case; symbols: `camelCase` for vars/functions, `PascalCase` for classes
- Avoid implicit coupling to the parent repository — no imports from `../src/core` or workflow engine

What not to add (for now)
- No enterprise "Plan"/workflow model or persistence engine
- No state backends or registries
- No networked LLM dependencies
  - Exception: the optional `src/llm/client.js` uses network if API keys are provided; keep contained under `src/llm/`.

Testing
- Keep lightweight, Node-only. Prefer small script-based tests in `tests/` (not added yet)
- Avoid network and filesystem writes in unit tests
 - Make targets (run from repo root or within `liu/`):
   - `make -C liu test` — in-memory runtime test
   - `make -C liu e2e` — CLI + REPL stepping tests
   - `make -C liu diag` — diagnostics output
   - `make -C liu cli-stepping` / `repl-stepping` / `repl-demo`

Releases
- Keep `package.json` self-contained. The package is intended to be imported by other projects and used via the CLI for validation and quick runs.

LLM integration (domain-scoped)
- Store LLM profiles under `llm` in `liu-domain.config.json`. Use CLI `liu llm profile ...` commands to manage.
- Compose prompts from YAML templates in `<domain>/llm/templates/nl_to_liu_ts/...`.
- Domain `.d.ts` files supply `toolsSignatures`, `schemaTypes`, and `helpersDts` for templates; no registry is assumed.
- `--allowed` is a free-form constraints channel surfaced to templates.

Agent workflow tips
- Prefer small, focused changes; keep public CLI stable (`liu ...`).
- Avoid coupling to the parent repository; operate within `liu/`.
- Document user-facing features in `liu/docs/` and add a make target for new test flow.

Missing / next opportunities
- Add tests for LLM compose/gen-plan flows (manual mode) and saving `.invalid.ts` on failed validation.
- Optional async tool support via source transform that inserts await at step boundaries.
- Richer TypeScript diagnostics mapping for more error kinds.
- Example domain `types/tools.d.ts` to demonstrate prompt variables end-to-end.
