Finance external demos (windowed UI with WinBox)

Overview
- Purpose: try a desktop-like window manager in the browser using WinBox, with React components rendered inside each window.
- This demo does not depend on react-winbox. It uses a tiny wrapper that renders React into the WinBox body via a portal/root.
- Scope: quick UX exploration only. Not a full app.

Layout
- `examples/finance/external/winbox-react/` — static demo using local WinBox assets (from `refs/`), local-first React/MUI.

Run
- From the repo root (`liu/`), start any static server. Examples:
  - `python3 -m http.server 8080` (Python 3)
  - `npx serve` (if available)
- Open: `http://localhost:8080/examples/finance/external/winbox-react/index.html`

Notes
- WinBox CSS/JS are sourced from `../../../../refs/winbox/dist/...` (local, no network).
- React/ReactDOM load with local-first, CDN-fallback. Place these files under `examples/finance/external/winbox-react/vendor/`:
  - `react.development.js` (or `react.production.min.js`) from `react@18/umd/`
  - `react-dom.development.js` (or `react-dom.production.min.js`) from `react-dom@18/umd/`
- MUI/Emotion load with local-first, CDN-fallback. To avoid CORS/CDN issues, place these files under `examples/finance/external/winbox-react/vendor/`:
  - `emotion-react.umd.min.js` (from `@emotion/react@11/dist/`)
  - `emotion-styled.umd.min.js` (from `@emotion/styled@11/dist/`)
  - `material-ui.development.js` (preferred) OR `material.development.js` (alternate), from `@mui/material@5.x/umd/` depending on the version you downloaded.
  The page will prefer local copies and fallback to CDN if missing.
- Ensure the document body has a non-zero height (the page sets 100vh).

Next steps (suggested)
- Replace CDN React with local dev build or a standard bundler (Vite) if you want hot-reload.
- Add a basic WindowManager: open/close/focus windows, persist layout to `localStorage`.
- Integrate a chart (e.g., lightweight-charts) and a table to validate interactions and z-index with overlays.
