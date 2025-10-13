Finance Web (Full) — Architecture & Liu Integration

Purpose
- Provide a minimal, self-contained finance service and a WinBox-based web UI to drive plan‑driven research workflows.
- Keep the domain schemas + tool bindings next to the service, decoupled from Liu core.

High‑Level Architecture
- Finance Web Server (`finance/server/server.js`)
  - Static: serves `finance/web/public` (React + MUI app)
  - Streaming: `/api/stream?sessionId=...` (SSE feed of blocks)
  - Session mgmt: `/api/session/init`, `/api/sessions`
  - Append blocks: `/api/append`
  - Plan execution: `/api/run-plan` → shells out to Liu CLI with domain root `finance/domain`
  - Window lifecycle: `/api/windows/remove`, `/api/windows/clear`
  - Reset session: `/api/reset` (clears feed + windows)
  - Assets: `/_refs/winbox/...` proxies `refs/winbox/dist`

- Finance Web UI (`finance/web/public`)
  - React + Material UI. Layout: left Sidebar, center Chat/Feed, right Canvas.
  - Chat/Feed: renders blocks (request/text/plan/chart). Charts use Vega‑Lite via `vega + vega‑lite + vega‑embed`.
  - Windows: created by WinBox in response to `winbox` blocks. Currently attached to `body` for stability (optional canvas scoping under a feature flag).
  - Minimized dock: window chips (bottom of the canvas) restore minimized windows.

- Finance Domain (`finance/domain`)
  - Tools (`tools/index.js` + submodules): imperative functions plans call; they POST to the server.
  - Types (`types/*.d.ts`): sub‑domain shapes + tool signatures for Liu plan authoring.
  - Plans (`plans/*.liu.ts`): plan scripts composed by humans/LLMs; validated & executed by Liu CLI.

- Liu CLI (`bin/liu.js`)
  - Executes plans with the selected domain root.
  - Enforces Liu TS subset, compiles, runs plans in a sandbox; plans call tools synchronously.

Data & Blocks Model
- A “session” is a server‑persisted feed of blocks plus connected SSE clients.
- Typical blocks emitted by plans or UI:
  - `request` — NL intent or prompt snippet
  - `text` — free‑form text
  - `plan` — TS plan preview (not executed by the UI)
  - `chart` — Vega‑Lite spec + optional inline values (rendered by the UI)
  - `winbox` — open a window (WinBox)
  - `winbox-close` — close a specific window (ephemeral event)
  - `winbox-clear` — close all windows (ephemeral event)
  - `reset` — server reset; clients clear feed + windows

Plan/Tool Flow
- From UI “Run Demo Plan”:
  1) UI POST `/api/run-plan { plan, sessionId }`
  2) Server spawns: `node bin/liu.js --domain-root finance/domain run-plan <plan> ...`
     - Env: `FINANCE_WEB_URL`, `FINANCE_SESSION_STORE`, `FIN_SESSION_NAME/TITLE`, and `FIN_SESSION_ID=sessionId` to reuse the current page session.
  3) Plan runs, calling tools: tools POST blocks to `/api/append` for the same `sessionId`.
  4) SSE feed delivers blocks to the UI; Chat renders text/plan/chart; WinBox windows open.

- From CLI directly (Make target):
  - `make -C liu finance-full-run PLAN=<name> SID=<sessionId>` executes a plan into the active browser session.

UI Layout & Behavior
- Sidebar (left)
  - Fixed 260px width; navigation actions (open screener/chart/filings), run plan, reset.
  - Height 100%, vertical scroll only (overflow‑x hidden).

- Chat (center)
  - Column with max width; sticky composer at bottom; feed scrolls independently.
  - Renders chart blocks via Vega‑Lite; shows errors if libs are missing.

- Canvas (right)
  - Visual area for windows. Current stable mode: windows attach to `body` (WinBox default). Optional canvas‑scoping is feature‑flagged and will be revisited.
  - Minimized dock: shows chips for minimized windows; click to restore.

WinBox Lifecycle
- Open: append a `winbox` block — UI calls `new WinBox({ ... })`.
- Close (user): `onclose` posts `/api/windows/remove` to delete storage + emits `winbox-close`.
- Close (programmatic): server broadcasts `winbox-close` or `winbox-clear`; UI closes windows.
- Reset: POST `/api/reset` → server clears storage and emits `reset`; UI clears feed + windows.

Domain Tools (selected)
- Session
  - `financeEnsureSession({ name, title, serverUrl })`
  - `financeEnsureSessionEnv()` — reuses `FIN_SESSION_ID` if provided (web‑initiated runs)
  - `financeUseSession`, `financeCurrentSession`, `financeRemoveSession`
- UI/stream
  - `uiAppendRequest`, `uiAppendText`, `uiAppendChart`
  - `uiOpenWindow`, `uiOpenWindows`
- Market
  - `getDailyBars`, `enrichSMA`, `enrichBollinger`
- Filings
  - `listFilings`, `getFilingSections`

Plans
- `market_filings_demo.liu.ts` — demo that appends an OHLC+SMA chart and opens a Filings window.
- Example authoring constraints: Liu TS validator disallows `for/while/async/await/=>`; use simple expressions, object/array literals, and function calls to tools.

Configuration & Assets
- Ports
  - Full finance server: http://localhost:5280 (Make: `finance-full-web`)
- Environment
  - `FINANCE_WEB_URL` — base URL for server (used by tools)
  - `FINANCE_SESSION_STORE` — path to session mapping JSON (per workspace)
  - `FIN_SESSION_ID` — reuse existing session (binds tools to current UI session)
- Vendor (optional, recommended for offline):
  - Place UMD builds under `finance/web/public/vendor`:
    - React + ReactDOM (`react*.js`, `react-dom*.js`)
    - Emotion (`emotion-react.umd.min.js`, `emotion-styled.umd.min.js`)
    - MUI (`material-ui.development.js` or `material.development.js`)
    - Vega stack (`vega.js`, `vega-lite.js`, `vega-embed.js`)

Make Targets
- `make -C liu finance-full-web` — start server (http://localhost:5280)
- `make -C liu finance-full-list-sessions` — list sessions
- `make -C liu finance-full-run PLAN=market_filings_demo SID=<sessionId>` — run plan into a session

Roadmap (UI + Windows)
1) Optional canvas scoping re‑enable with safe queuing and strict bounds.
2) Canvas toolbar (Tile/Cascade/Reset) + better dock chips.
3) Context bus (e.g., active symbol) and window subscriptions.
4) Save/load named layouts (positions/sizes/z‑order) per session.
5) Plan review/approval in chat (generate/preview plans with LLM integration).

Relation to Liu
- Liu remains the plan runtime and validator; the finance domain is just another domain with tools/types/plans.
- The finance web depends on Liu only to spawn plans (`/api/run-plan`), passing env to reuse the current session so all effects are visible in the open page.
- Domains can evolve independently: add tools/types/plans without touching Liu core.

