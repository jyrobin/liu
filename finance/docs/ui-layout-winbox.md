WinBox UI Layout (React + MUI)

Layout Principles
- Left Sidebar: fixed 220–260px for nav, filters, session/layout controls.
- Chat Panel: centered column with max width (e.g., 860–980px) and left alignment when wide; sticky composer at bottom; feed above.
- Right Canvas: dedicated WinBox canvas; all windows are bounded here (WinBox `root` set to the canvas element). Prevents overlap with chat/sidebar.
- Visual Separation: distinct background shades and a divider between chat and canvas.

Windows Behavior
- Canvas-bounded: position/resize/move limited to the canvas; optional grid-snap.
- Z-order discipline: focus borders; optional dimming of non-focused windows; ESC clears focus; cycling hotkeys.
- Minimize/dock: minimized windows appear as chips/“taskbar” inside the canvas.
- Groups/context: windows subscribe to a shared context (e.g., active symbol). Chat or sidebar updates broadcast to windows.

Feed ⇄ Windows Linking
- Inline chips in feed to focus/flash a created window.
- Optional pinned window at top of canvas; floating windows below.
- Quick previews on hover.

Right-Side Use Without Interference
- Two zones: “Pinned” (maximized window) + “Floating” (others).
- Transient utilities: notifications/inspectors in a lower-right stack; auto-dismiss.
- View modes: “Research” (more canvas) vs “Chat-first” (larger feed), responsive to width.

Responsiveness
- ≥1440px: full 3-column layout.
- 1024–1440px: canvas narrows; prefer pinned window; minimize others.
- <1024px: canvas collapses to drawer or tabbed windows.

Persistence & IPC
- Layout saved/restored per session.
- Event bus for context updates (symbol/universe); windows opt-in and react to events.

Phased Implementation
1) Structural grid (sidebar + chat + canvas) and WinBox confinement.
2) Canvas toolbar (tile/cascade/close-all) and dock strip (for minimized windows).
3) Context bus for active symbol.
4) Feed chips linking to windows.
5) Grid snap + overflow controls; pinned window mode.
6) Save/load layouts; responsive tweaks.

