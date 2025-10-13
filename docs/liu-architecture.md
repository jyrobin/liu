Liu TS — Minimal Planning Core (Now + Next)

Intent
- Provide a small, analyzable TypeScript subset for writing validated plans that call project‑defined tools, with a simple runtime and CLI.
- Keep cognition low for LLMs by exposing higher‑level tools/agents and concise type surfaces; avoid heavyweight workflow engines or registries.

What Liu Is (today)
- Authoring subset: a constrained TS/JS dialect (“Liu TS”) validated by `src/liu-validator.js` (regex heuristic, disallows `for/while/async/await/=>`, classes/new, etc.).
- Compiler: `src/liu-compiler.js` strips imports and rewrites `export default` to capture results.
- Runtime: `src/liu-runtime.js` executes plans in a sandboxed VM, exposes helpers, loads domain tools/types.
- CLI: `bin/liu.js` runs/validates plans and renders diagnostics via `src/diagnostics.js`.
- Domain structure: any folder with `liu-domain.config.json` mapping
  - `plans/` — `.liu.ts` scripts (ESM subset)
  - `tools/` — `index.js` exports tool functions (sync, no network in examples)
  - `types/` — `.d.ts` tool signatures and domain schemas for LLMs/authoring
  - optional `schemas/`

Plan Lifecycle
1) Author/Generate a `.liu.ts` plan referencing `@tools` signatures.
2) Validator enforces the subset; compiler captures `export default`.
3) Runtime loads the domain tools/types and evaluates the plan.
4) Tools do the real work (I/O, UI appends, analysis), often by posting to a service.

LLM Integration (minimal, optional)
- `src/llm/` provides prompt templates and a thin client (no network unless keys provided).
- Typical compose loop:
  - Collect `toolsSignatures` + `schemaTypes` + constraints → prompt
  - LLM emits a draft Liu TS plan → validate → show diagnostics → iterate
  - On approval, run via CLI/runtime
- Future: MCP (Model Context Protocol) to discover schemas/tools/agents dynamically instead of static prompt stuffing.

Domains & High‑Level Tools
- Keep the number of surfaced tools small and high‑level (“agents” that orchestrate sub‑calls), to minimize LLM cognitive load.
- Tools may be backed by LLMs (intent routers, smart scrapers), caches, embeddings, index lookups; they still appear as plain functions in Liu plans.
- Plans stay orchestration‑only: select tools, set arguments, branch lightly — tools do the heavy lifting.

Safety & Validation Principles
- Prefer static/heuristic validation upfront (for readability and constrained behavior) over permissive scripting.
- Disallow constructs that undermine analyzability or increase execution risk.
- Plans are small and composable; complexity lives in tested tools with their own safety checks.

How It Relates to “Liugent” (extracted/minimized)
- Not included in Liu TS core: enterprise workflow engine, durable state, registries, global agent catalogs, full templating frameworks, long‑running job control.
- Included: the essence of plan authoring + validation + execution, with domain‑local tools/types and a light LLM compose path.
- You can build richer systems (routing, persistence, agent registries) on top by:
  - Adding libraries/services under a project’s `domain/` and `server/`
  - Wrapping Liu CLI for execution/approval flows
  - Using an MCP‑aware broker to compose plans with discovery

Reference Implementation: Finance (Full) Domain
- Service: `finance/server/server.js` (Node, SSE + REST) stores session feeds and serves a WinBox‑based UI.
- UI: `finance/web/public` (React + MUI) shows a chat/feed and opens windows from `winbox` blocks.
- Domain: `finance/domain` implements tools and types per sub‑domain (market, filings, …) and demo plans.
- Pattern: plans call `uiAppend*` and `uiOpenWindow*` tools → server appends blocks → UI renders.

Authoring Constraints (examples)
- Allowed: literals, object/array construction, `const`/`let`, `if`/`else if`/`else` (flat), function calls, return via `export default`.
- Disallowed: `for`, `while`, `async`/`await`, arrow functions, `function` declarations, `class`, `new`, try/catch, top‑level imports.
- Goal: short, declarative plans that LLMs can reliably produce and humans can audit quickly.

Current Building Blocks (src/)
- `liu-validator.js` — best‑effort static checks over stripped source
- `liu-compiler.js` — ESM transform for default export capture
- `liu-runtime.js` — VM execution with helpers and domain injection
- `helpers.js` / `helpers.d.ts` — small helper surface for plans
- `diagnostics.js` — maps validator and (optional) TS parser feedback to human‑readable messages
- `parser-ts.js`, `ast.js` — optional parser/constructors for richer inspection (not required to run plans)
- `state.js` — trivial in‑memory/file stores used by examples/tests

CLI & Workflows
- `bin/liu.js run-plan <name> --domain-root <dir> --workspace <dir> [--force]` — validate + run a plan.
- `make -C liu ...` examples wire Liu to a local server/UI (e.g., finance full web) via `FINANCE_WEB_URL` and `FIN_SESSION_ID` so effects appear live.

UI Patterns That Pair Well
- Streaming feeds (SSE) of typed “blocks” (request/text/plan/chart/winbox…)
- WinBox windows for contained tools/components (chart, filings, screener)
- Chat‑first layout for generating/reviewing plans; plan execution upon approval

Roadmap (incremental)
1) Validator: richer TypeScript diagnostics mapping; more precise construct checks.
2) Optional async tools: source transform to insert awaits at step boundaries.
3) LLM compose UX: structured prompts, constraint channels (`--allowed`), multi‑turn diagnosis.
4) MCP exploration: dynamic tool/schema/agent discovery; fewer static prompts.
5) Agent profiles: intent routers that select high‑level tools; caches/embeddings to reduce LLM hits.
6) Layout & persistence patterns for windowed UIs; save/load named research workspaces.

Non‑Goals (in Liu core)
- No enterprise workflow model, no durable job runner, no global registry.
- No opinionated persistence or network stack; domains choose their own.
- No monolithic templating system; domains bring their own minimal prompts/templates.

Mental Model
- Liu TS is the “plan layer”: tiny, validated scripts that orchestrate.
- Domains are the “capability layer”: tools/types/plans that encode knowledge.
- LLMs are “drafting assistants”: generate plan candidates within constraints, with humans approving execution.

