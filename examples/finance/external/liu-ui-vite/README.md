Liu UI (ESM) + Vite demo

Overview
- Demonstrates importing `liu-ui/src` (typed ESM) in a Vite React app.
- Shows a small Screener + Chart + Filings windows flow using WinBox windows.

Prereqs
- Node 18+

Install & Run
```
cd examples/finance/external/liu-ui-vite
npm install
npm run dev
# open the printed local URL
```

Notes
- WinBox CSS/JS are loaded from `refs/winbox/dist` via `<script>`/`<link>` in `index.html`.
- The code imports from `../../../../liu-ui/src/index.js` (typed ESM). No npm publish required.
- All data is mocked; no network calls.

