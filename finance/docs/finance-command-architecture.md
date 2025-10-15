Finance Command Architecture — Hybrid “Commands as Data”

Goal
- Heavy lifting at the finance service; light, analyzable scripting at the Liu plan layer.
- Keep plans looking like regular programs (tool calls returning data‑shaped results), not opaque command queues.

Core Pattern
- Liu plan calls a domain tool:
  - const r = showPriceChart({ symbol:'AAPL', display:'both' });
  - r.status === 'success'; r.chartId; r.windowId
- Tool is a thin wrapper that POSTs to `/api/command` on the finance service.
- Service handles data fetch/compute, builds charts/dashboards, appends feed/window blocks, and returns metadata (ids/handles).
- The plan can branch or call subsequent tools using returned ids/handles.

Why “Commands as Data”
- Plans remain small and deterministic for LLMs and humans.
- Return values carry domain concepts with metadata instead of raw payloads.
- We can evolve towards higher‑level tools/agents without changing the plan structure.

Service Contract (Shape)
- Request:
  - POST `/api/command` { sessionId, command: { command: string, params: object } }
- Response:
  - `{ ok: true, result: { status: 'success'|'error'|'unknown', ...metadata } }`
  - Metadata fields (examples): `chartId`, `windowId`, `feedId`, `logId`, `progressId`.
- Side effects:
  - Appends blocks to session via SSE (request/text/plan/chart/winbox/log/progress).

Examples
- showPriceChart → `{ status:'success', chartId?, windowId? }`
- showFundamentals → `{ status:'success', feedId?, windowId? }`
- showNews → `{ status:'success', feedId?, windowId? }`
- compareSymbols/compareRatios → `{ status:'success', feedId?, windowId? }`
- logStatus/logProgress → `{ status:'success', logId?/progressId? }`

Liu Plan Style (regular program)

```
import { financeEnsureSessionEnv, showPriceChart, showFundamentals, logStatus } from '@tools';

financeEnsureSessionEnv();
logStatus({ level:'info', message:'Loading…' });

const p = showPriceChart({ symbol:'AAPL', period:'3M', display:'both' });
if (p.status !== 'success') {
  logStatus({ level:'error', message:'Chart failed' });
}
const f = showFundamentals({ symbol:'AAPL', display:'window' });
export default { ok:true };
```

Types in Domain
- tools.d.ts introduces a generic `CommandResult = { status:string } & Record<string,any>`.
- Command tools return `CommandResult` with `{ chartId, windowId, feedId, … }` as applicable.

Service Implementation Notes
- `handleCommand()` in `finance/server/server.js` now returns metadata from append operations.
- `/api/command` returns `{ ok:true, result }` so tools can expose data‑shaped results.
- Append helpers already return saved block objects; we reuse their ids.

Frontend
- Still subscribes to SSE blocks and renders feed/windows.
- Metadata returned to plans is for orchestration/branching, not required by the frontend.

Evolving the Vocabulary
- Introduce higher‑level tools (agents) that encapsulate multi‑step workflows server‑side.
- Expose smaller, richer type surfaces in `.d.ts` so LLMs can draft plans with less cognitive load.
- Optionally integrate MCP for discovering tools/schemas/agents dynamically (later).

