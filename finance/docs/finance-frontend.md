Finance Frontend — React + MUI + Vite

Overview
- React + MUI application that connects to the finance server and visualizes the session feed (SSE) and windows.
- Three-column layout: Sidebar (left), Chat/Feed (center), Canvas (right).
- Windows currently attach to `body` for stability; minimized dock appears at the canvas bottom.

Display Policy (chat vs. logs vs. windows)
- Chat/Feed (middle): conversation and narrative content only
  - request — NL intent
  - text — summaries/reports in plain text
  - report — HTML reports (tables/metrics/diagrams) rendered inline
  - plan — Liu TS plan preview
  - chart — inline Vega-Lite chart
- Logs/Progress (right): operational/status signals
  - log — info/success/warning/error entries
  - progress — long-running task progress bars
- Windows (floating): windowed tools/dashboards
  - winbox — open a window (not reflected in chat)
  - winbox-close/clear — lifecycle events, no chat rendering
  - reset — clears feed + windows

Structure
- `frontend/src/components/Layout/ResizableColumns.tsx` — column layout
- `frontend/src/components/panels/Sidebar.tsx` — commands & plans menu
- `frontend/src/components/panels/ChatFeed.tsx` — renders blocks; charts via Vega‑Lite
- `frontend/src/components/panels/Canvas.tsx` — window canvas + minimized dock
- `frontend/src/services/api.ts` — HTTP calls to server (sessions/append/command)
- `frontend/src/services/winbox.ts` — WinBox helpers (open/close/minimize)
- `frontend/src/hooks/useSession.ts` — bootstrap session
- `frontend/src/hooks/useSSE.ts` — SSE subscription

Blocks Rendered
- `request` — displays NL intent
- `text` — plain text with title
- `plan` — plan preview code block
- `chart` — Vega‑Lite via vega + vega‑lite + vega‑embed
- `log` — level‑tagged log entries
- `progress` — progress bars
- `winbox` — opens a floating window
- `winbox-close|clear|reset` — lifecycle events for windows/feed

Commands UI
- Sidebar triggers command tools through the domain (via server `/api/command`).
- “Run Demo Plan” calls `/api/run-plan` to execute a Liu plan in the current session.
- “Reset Session” calls `/api/reset` to clear feed + windows.

Notes
- Vendor UMD files (React/DOM, Emotion, MUI, Vega stack) can be local for offline dev.
- Windows use high z-index to float over MUI surfaces.
- Canvas scoping is feature‑flagged for later; body‑root windows are simpler and stable.
