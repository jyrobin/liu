Finance Demo: External UI + Sessions

Overview
- An external web service streams finance blocks via SSE and persists session history.
- Finance domain tools manage a local mapping from friendly session names to server session IDs.
- Liu CLI/REPL is unaware of sessions; plans call tools. The mapping enables reusing sessions across runs.

Setup
1) Start the external UI service:
   make -C liu finance-web
   Opens http://localhost:5180/ (lists sessions; click to connect to one).

2) Initialize or reconnect a named session from CLI (no manual IDs):
   make -C liu finance-session-init
   - Env used by the tool:
     FINANCE_WEB_URL=http://localhost:5180
     FINANCE_SESSION_STORE=examples/finance/workspace/.finance-sessions.json
     FIN_SESSION_NAME=aapl-demo
     FIN_SESSION_TITLE="AAPL OHLC (Past Month)"

3) Send a text block into the active session:
   make -C liu finance-session-send
   - Env used:
     FIN_TEXT_TITLE="Note"
     FIN_TEXT="Hello from Liu plan."

4) Append an OHLC chart to the active session:
   node bin/liu.js --domain-root examples/finance/domain run-plan ohlc_chart_active \
     --workspace examples/finance/workspace --run-id ohlc_active

Endpoints (External Service)
- GET /api/sessions → list sessions (title, updatedAt)
- POST /api/session/init { sessionId?, title? } → { ok, sessionId, title }
- POST /api/append { sessionId, block } → { ok, block }
- POST /api/reset { sessionId } → { ok }
- POST /api/session/delete { sessionId } → { ok }
- GET /api/stream?sessionId=... → SSE, event: block

Blocks
- request: { kind: 'request', text }
- text:    { kind: 'text', title?, text }
- table:   { kind: 'table', title?, rows }
- chart:   { kind: 'chart', spec, data? } (Vega-Lite)

Plans and Tools
- Plans: examples/finance/domain/plans
  - init_session.liu.ts → calls financeEnsureSessionEnv()
  - send_text.liu.ts → calls uiAppendTextEnv()
  - ohlc_chart_active.liu.ts → uses current active session and appends chart
- Tools: examples/finance/domain/tools/index.js
  - financeEnsureSession(name,title) → create/reuse session and set active
  - financeEnsureSessionEnv() → env-based wrapper
  - uiAppendTextEnv()/uiAppendRequestEnv() → env-based text/request
  - uiAppendRequest()/uiAppendText()/uiAppendChart() → use active mapping when sessionId omitted
  - fetchDailyOHLC() → offline AAPL dataset

Notes
- The mapping file is workspace-local and not a Liu core concern.
- The external service persists events; UI replays on connect after restarts.

