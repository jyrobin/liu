Finance (full domain) — scaffold

Overview
- A top-level, self-contained finance domain with a lightweight service and a WinBox-based web UI.
- Domain schemas and tool bindings live next to the service, separate from Liu core.

Project Structure
- `finance/`
  - `server/` — Node HTTP server (REST + SSE) serving the web UI and appending stream blocks
    - `server.js` — sessions API (`/api/session/init`, `/api/append`, `/api/stream`) and static serving
  - `web/` — static web app using WinBox windows
    - `public/`
      - `index.html` — loads WinBox, connects to stream, creates a Main window with chat + nav
      - `app.js` — client logic: SSE stream, handle blocks (text/chart/winbox/plan), open WinBox windows
      - `style.css` — minimal styles
  - `domain/` — domain-facing types and tool bindings for Liu plans
    - `types/tools.d.ts` — tool signatures for plan authoring
    - `tools/index.js` — tools used by plans to talk to the service (ensure session, append blocks, open windows, etc.)
  - `data/` — sample datasets (optional; reuses existing for now)

Concepts
- Main window: a pinned WinBox that hosts minimal nav and a chat box. Chat emits `request` blocks and can also surface generated Liu plans for approval/execution.
- Other content windows: Charts/Filings/Screener/etc. pop out as their own WinBox instances.
- Stream: the page also shows a chronological stream of blocks (text, plan, chart, etc.) under the chat, similar to the earlier example.

Run
- Start server: `node finance/server/server.js`
- Open UI: http://localhost:5280
- From Liu plans, use `finance/domain/tools` (set `FINANCE_WEB_URL=http://localhost:5280`).

