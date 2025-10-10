# Liu TS Project Guide (Standalone)

This document summarizes the core concepts, layout, and commands of the standalone Liu TS package so a new conversation (or contributor) can pick it up from scratch.

## What is Liu TS?

A compact, constrained TypeScript/JavaScript authoring subset for small, analyzable plans that call domain tools as plain functions. It offers:
- Strict validator and diagnostics
- Sandboxed runtime, with optional simple persistence (in-memory or file)
- Minimal helpers that encode control patterns (map items, waits, retry)
- Simple CLI/REPL and a domain-scoped LLM integration to generate plans from NL

## Key Concepts

- Plan file: `.liu.ts` (or `.liu.js`)
  - Imports tools from `@tools` (domain ESM module), helpers from `@liu`
  - Only top-level code; no functions/classes/loops/async/new; flat `if/else`
  - Single `export default { ... }` result
- Tools: plain functions `(args: object) → object` supplied by the domain at runtime
- Helpers: `mapItems`, `retry`, `wait_event/approval/until/for`, `set_var` (see `src/helpers.d.ts`)
- Diagnostics: constraint + TS syntax diagnostics with line/col carets
- REPL: sqlite-style dot commands for quick iteration
- Persistence: `run-persisted` and REPL `run-plan/continue-plan` with file- or memory-backed state

## Repository Layout

- `src/`
  - `liu-validator.js`: constraint checks
  - `liu-compiler.js`: binds `@tools` and `@liu`, captures default export result
  - `liu-runtime.js`: sandboxed execution; persisted runner and step checkpoints
  - `helpers.js` + `helpers.d.ts`: helper runtime + types
  - `diagnostics.js`: human-readable diagnostics; uses TypeScript (if present)
  - `state.js`: in-memory + file state stores
  - `domain.js`: domain config and run folder handling
  - `parser-ts.js`, `ast.js`: optional Liu AST utilities
  - `llm/`: profiles (stateless), client, template manager, YAML template utilities
- `bin/liu.js`: CLI entry
- `docs/`: user docs and this guide
- `examples/`: example domain tools, templates, sample plans, scripts
- `tests/`: lightweight tests and e2e scripts

## Domain Structure (author-provided)

- `liu-domain.config.json` — includes `paths` and `llm` config
- `tools/index.js` — ESM module exporting domain tools
- `types/*.d.ts` — tool signatures and schema types (fed into LLM templates)
- `plans/*.liu.ts` — saved plans
- `llm/templates/nl_to_liu_ts/<provider>/<model>.yaml` — provider-aware templates

## CLI Overview

- Validate/compile/run a plan file
```
liu validate <file>
liu compile <file>
liu run <file> [--tools <esm-module>]
liu run-persisted <file> --plan-id <id> --state-file <dir> [--tools <esm-module>]
liu state-show --plan-id <id> --state-file <dir>
liu state-reset --plan-id <id> --state-file <dir>
```

- Domain and runs (global: `--domain-root`, `--workspace`)
```
liu domain init [--root <dir>] [--force]
liu domain info [--domain-root <dir>]
liu list [plans|tools] [--domain-root <dir>]
liu run-plan <name> [--run-id <id>] [--backend memory|file] [--state-dir <dir>] [--force]
liu continue-plan <name> [--run-id <id>] [--backend memory|file] [--state-dir <dir>]
liu resume --workspace <dir> --run-id <id> --payload <json>
```

- REPL
```
liu repl [--domain-root <dir>] [--workspace <dir>] [--backend memory|file] [--state-dir <dir>] [--script <file>]
```
Inside REPL:
- Dot commands: `.help/.h`, `.runs`, `.use <runId>`, `.current`, `.reset <runId>`, `.pwd`
- Run/continue/resume/state-show/state-reset mirror CLI; prompt shows `liu[runId]>` when a current run is active

- LLM
```
liu llm status
liu llm profile list|show|use <name>|set --name ... --provider ... --model ... [--api-key ...]
liu llm compose --request "..." [--allowed <json|text>] [--profile <name>]
liu llm gen-plan --request "..." [--manual] [--save] [--name <plan>] [--out-dir <dir>] [--allowed <json|text>] [--profile <name>]
```
- Profiles live under `llm` in `liu-domain.config.json`; stateless merge happens at runtime.
- Templates come from domain YAML; variables are extracted from `types/*.d.ts` and `helpers.d.ts`.

## Diagnostics

- Run:
```
make -C liu diag
```
- Output includes line/col and carets for constraints + TS syntax (if TypeScript present). No spurious blank lines.

## Make Targets

- `make -C liu test` — in-memory runtime test
- `make -C liu e2e` — CLI and REPL stepping tests
- `make -C liu diag` — diagnostics showcase
- `make -C liu cli-stepping` / `repl-stepping` / `repl-demo`

## Known Gaps / Next Work

- LLM testing: add cases for `llm compose` and `gen-plan` manual mode (prompt assembly, annotation, `.invalid.ts` save).
- Optional async tool support: source transform that inserts `await` at step boundaries (keeping authoring simple).
- Richer TS diagnostics: semantic errors and better mapping beyond syntactic checks.
- Seed more example templates/types to demonstrate template variables and allowed constraints end-to-end.

