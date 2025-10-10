# Domain Structure and Workspace

Liu domains collect reusable artifacts (tool definitions/implementations, plans, and schemas) under a root folder. The CLI can run plans from any workspace directory while resolving tools/plans from a chosen domain root.

Config
- The domain root contains `liu-domain.config.json`:
```
{
  "version": 1,
  "paths": {
    "plans": "plans",
    "tools": "tools/index.js",
    "types": "types",
    "schemas": "schemas"
  }
}
```

Layout
- `<root>/plans/` — `.liu.ts` (or `.liu.js`) plans by name: `name.liu.ts`
- `<root>/tools/index.js` — ESM module exporting domain tool functions
- `<root>/types/` — `.d.ts` type stubs for tools (optional, for editor/LLM)
- `<root>/schemas/` — JSON/YAML schemas (optional)
- `<root>/llm/templates/<provider>/<useCase>.txt` — provider-specific prompt templates (e.g., `nl_to_plan_ts.txt`)
- `<root>/liu-llm.config.json` — LLM profiles and active profile selection

Initialize
```
liu domain init --root path/to/domain
```

List and inspect
```
liu domain info --domain-root path/to/domain
liu list plans --domain-root path/to/domain
liu list tools --domain-root path/to/domain
```

Workspace and runs
- A workspace is any directory where you execute CLI/REPL commands; tools may read/write files relative to the workspace.
- Each run writes to `<workspace>/.liu-runs/<runId>/` with:
  - `plan.liu.ts` — a snapshot copy of the plan used
  - `meta.json` — `{ planName, original, hash, domainRoot }`
  - `state/` — JSON state when file-backed

Run a plan by name
```
liu run-plan <name> --domain-root path/to/domain --workspace . --run-id myrun --backend file
```

Backends
- `--backend memory`: ephemeral in-process state (useful in REPL/tests)
- `--backend file`: JSON state files under the run directory (default)

Notes
- The CLI resolves plans/tools relative to `--domain-root`. If omitted, it searches upward for `liu-domain.config.json`.
- Run directories are not overwritten unless `--force` is provided.
- LLM: use `liu llm compose` and `liu llm gen-plan` to generate `.liu.ts` from NL requests using domain-specific templates and LLM profiles.
