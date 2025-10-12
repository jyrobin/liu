Liu UI — WinBox + React wrapper (UMD)

Overview
- A tiny, dependency-free wrapper to render React content inside WinBox windows.
- Exposes a global `LiuUI` UMD with:
  - `createWinBoxRoot(options)` → `{ winbox, render, update, destroy }`
  - `WinBoxHost` React component (hook-based) to portal children into a WinBox window.

Usage (UMD)
- Include scripts in your page:
  - WinBox bundle: `refs/winbox/dist/winbox.bundle.min.js`
  - React + ReactDOM (UMD): local or CDN
  - This wrapper: `liu-ui/liu-ui.umd.js`

Example
```
const desktop = document.getElementById('desktop');
const api = LiuUI.createWinBoxRoot({ root: desktop, title: 'My Window', width: 400, height: 240 });
api.render(React.createElement('div', null, 'Hello'));
```

Notes
- This is a lightweight, browser-focused build to support examples and quick demos without a bundler.
- A typed ESM version with `useWinBox` is available under `src/` in this folder.

