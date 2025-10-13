# Finance Frontend Architecture

## Overview

The `finance/frontend` is a modern React + MUI + Vite application that provides a web interface for the Liu finance domain. It is **loosely coupled** with Liu - it can function independently as a finance web application, with Liu integration being an optional enhancement.

## Key Design Principles

### 1. Loose Coupling with Liu

**Finance web can function without Liu:**
- All core finance features work standalone
- Direct API calls to finance server for data
- No dependency on Liu runtime for basic operations

**Liu enhances the finance web:**
- Enables natural language request processing
- Allows running Liu TS plans from the UI
- Provides plan-driven research workflows
- Users at `finance/domain` can drive the web UI via tool calls

**Integration points:**
- `/api/run-plan` - Execute Liu plans (optional)
- SSE stream receives blocks from plan execution
- Tools in `finance/domain/tools` can emit UI blocks

### 2. Architecture

```
┌─────────────────────────────────────────────────┐
│                   Top Bar                       │
│           Finance Web + Liu Integration         │
├──────────┬──────────────────────┬───────────────┤
│          │                      │               │
│ Sidebar  │      ChatFeed        │    Canvas     │
│ (280px)  │      (flexible)      │    (360px)    │
│          │                      │               │
│ • Tools  │  • Request blocks    │ • Info area   │
│ • Plans  │  • Text blocks       │ • Win dock    │
│ • Actions│  • Chart blocks      │   (bottom)    │
│          │  • Plan previews     │               │
│          │  • Input composer    │               │
│          │                      │               │
└──────────┴──────────────────────┴───────────────┘
```

**Layout features:**
- Three-column resizable layout
- Left/right panels are optional and toggleable
- Middle panel is always visible (chat/feed)
- WinBox windows float across entire page

### 3. Component Structure

```
App.tsx                           # Main app with session & SSE
├── Sidebar                       # Left panel - navigation
├── ChatFeed                      # Middle panel - messages
│   └── ChartBlock               # Vega-Lite charts
└── Canvas                        # Right panel - visual area
    └── Dock                     # Minimized windows

ResizableColumns                  # Layout manager
├── Handle (left)
└── Handle (right)

Hooks:
├── useSession()                 # Session management
└── useSSE()                     # Server-sent events

Services:
├── api.ts                       # API client
└── winbox.ts                    # Window management
```

### 4. Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI framework | 18.2+ |
| TypeScript | Type safety | 5.2+ |
| Material-UI | Component library | 5.15+ |
| Vite | Build tool & dev server | 5.2+ |
| Vega/Vega-Lite | Chart rendering | 5.x/5.x |
| WinBox | Floating windows | 0.2.82 |

### 5. Data Flow

#### Plan Execution Flow
```
User clicks "Run Demo Plan"
    ↓
POST /api/run-plan { plan, sessionId }
    ↓
Server spawns: node bin/liu.js run-plan <name>
    ↓
Plan executes with finance/domain tools
    ↓
Tools POST blocks to /api/append
    ↓
Server broadcasts via SSE
    ↓
Frontend receives blocks
    ↓
UI renders (charts, text, windows)
```

#### Window Management Flow
```
Tool calls uiOpenWindow()
    ↓
POST /api/append { kind: 'winbox', ... }
    ↓
SSE broadcasts winbox block
    ↓
Frontend receives block
    ↓
openWinBox() creates floating window
    ↓
User minimizes window
    ↓
Chip added to dock
    ↓
User closes window
    ↓
POST /api/windows/remove
    ↓
Server removes from storage
    ↓
SSE broadcasts winbox-close
```

## Block Types

The finance web uses a streaming block protocol:

```typescript
// Request - user input
{ kind: 'request', text: string }

// Text - plain text output
{ kind: 'text', title?: string, text: string }

// Plan - Liu TS code preview
{ kind: 'plan', code: string }

// Chart - Vega-Lite visualization
{ kind: 'chart', spec: object, data?: array }

// WinBox - floating window
{ kind: 'winbox', title: string, x, y, width, height, html }

// Control blocks
{ kind: 'winbox-close', targetId: string }
{ kind: 'winbox-clear' }
{ kind: 'reset' }
```

## Development Workflow

### Setup

```bash
cd finance/frontend
npm install
```

### Development Mode

```bash
# Terminal 1: Start finance server
cd finance/server
node server.js

# Terminal 2: Start frontend dev server
cd finance/frontend
npm run dev
```

Open `http://localhost:5281` (frontend dev server)
- API calls proxy to `http://localhost:5280` (backend)
- Hot module replacement enabled
- TypeScript type checking

### Production Build

```bash
cd finance/frontend
npm run build
```

Output: `finance/frontend/dist/`

To serve in production:
1. Configure finance server to serve from `frontend/dist` instead of `web/public`
2. Or copy `dist/` contents to `web/public/`

### Type Checking

```bash
npm run type-check
```

## Integration with Finance Domain

### From Finance Tools

Finance domain tools can emit blocks:

```javascript
// finance/domain/tools/index.js
export async function uiAppendChart({ spec, data }) {
  await fetch(`${FINANCE_WEB_URL}/api/append`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: process.env.FIN_SESSION_ID,
      block: { kind: 'chart', spec, data }
    })
  });
}

export async function uiOpenWindow({ title, x, y, width, height, html }) {
  await fetch(`${FINANCE_WEB_URL}/api/append`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: process.env.FIN_SESSION_ID,
      block: { kind: 'winbox', title, x, y, width, height, html }
    })
  });
}
```

### From Liu Plans

```typescript
// finance/domain/plans/example.liu.ts
import { financeEnsureSessionEnv, getDailyBars, uiAppendChart, uiOpenWindow } from '@tools';

financeEnsureSessionEnv();

const data = getDailyBars({ symbol: 'AAPL', period: '1M' });

uiAppendChart({
  spec: {
    mark: 'line',
    encoding: {
      x: { field: 'date', type: 'temporal' },
      y: { field: 'close', type: 'quantitative' }
    }
  },
  data: data.rows
});

uiOpenWindow({
  title: 'Details',
  x: 'right',
  y: 60,
  width: 400,
  height: 300,
  html: '<div style="padding:16px">Window content</div>'
});
```

## WinBox Integration

### Window Lifecycle

1. **Creation**: SSE receives `winbox` block → `openWinBox()` called
2. **Float**: Window attached to `body` (not scoped to canvas)
3. **Minimize**: Chip added to dock in canvas
4. **Restore**: Click dock chip → window restored
5. **Close**: User closes → POST `/api/windows/remove` → SSE broadcasts close

### Dock Management

The dock is in the Canvas component:
- Located at bottom of canvas
- Shows chips for minimized windows
- Click chip to restore window
- Automatically removes chip on window close

### Window Positioning

Supports flexible positioning:
```javascript
x: number | 'center' | 'right'
y: number | 'center' | 'bottom'
width: number (default: 480)
height: number (default: 300)
```

## Extending the Frontend

### Adding New Block Types

1. **Define type** in `src/types/blocks.ts`:
```typescript
export interface CustomBlock extends BaseBlock {
  kind: 'custom';
  data: any;
}
```

2. **Add to union** in `src/types/blocks.ts`:
```typescript
export type Block = ... | CustomBlock;
```

3. **Render in ChatFeed** (`src/components/panels/ChatFeed.tsx`):
```typescript
if (block.kind === 'custom') {
  return <CustomBlockComponent data={block.data} />;
}
```

### Adding New Windows

Windows can contain:
- Static HTML (set `html` property)
- Dynamic content (mount React component after creation)
- External content (iframe)

Example - React component in window:
```typescript
const wb = openWinBox({ title: 'Custom', ... });
const root = createRoot(wb.body);
root.render(<MyComponent />);
```

### Customizing Theme

Edit `src/theme/theme.ts`:
```typescript
const theme = createTheme({
  palette: {
    primary: { main: '#your-color' },
    // ...
  },
  // ...
});
```

## Deployment Considerations

### Development
- Vite dev server with HMR
- Proxy to backend at `:5280`
- Source maps enabled

### Production
- Build with `npm run build`
- Output to `dist/`
- Configure server to serve static files
- Consider CDN for assets

### Backend Integration
- Server must proxy WinBox assets from `refs/winbox/dist`
- Server provides all `/api/*` endpoints
- Session management on server side
- SSE for real-time updates

## Future Enhancements

1. **Liu Compose Integration**
   - Add LLM service for NL → Plan generation
   - Plan approval flow in UI
   - Multi-turn plan refinement

2. **Advanced Windows**
   - Save/restore layouts
   - Window tiling/cascading
   - Context sharing between windows

3. **Enhanced Charts**
   - Interactive tooltips
   - Zoom/pan controls
   - Export to image/data

4. **Collaboration**
   - Multi-user sessions
   - Shared workspaces
   - Real-time cursor tracking

5. **Workspace Management**
   - Named sessions
   - Session history
   - Search across sessions

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Type Coverage
```bash
npm run type-check
```

## Summary

The finance frontend demonstrates:
- **Loose coupling** - works independently or with Liu
- **Modern stack** - React, MUI, Vite, TypeScript
- **Flexible layout** - resizable three-column design
- **Rich interactions** - charts, windows, streaming updates
- **Extensible** - easy to add new block types and features

The architecture maintains clear separation between:
- **Finance domain** - tools and data
- **Finance web** - UI and presentation
- **Liu runtime** - plan execution (optional)

This separation allows each component to evolve independently while providing seamless integration when needed.
