# Finance Frontend

React + MUI + Vite frontend for the Liu Finance domain.

## Architecture

This is a **loosely coupled** frontend that:
- Can function independently without Liu
- Provides an optional "extension" to Liu for NL requests and plan execution
- Uses WinBox for floating windows across the entire page
- Implements a three-column layout with resizable panels

## Key Features

### 1. Loose Coupling with Liu
- Finance web works standalone with the finance server backend
- Liu integration is optional - adds ability to run plans and process NL requests
- Users can interact with finance domain tools without Liu runtime

### 2. Layout
- **Left Panel (Sidebar)**: Navigation and actions
- **Middle Panel (ChatFeed)**: Message feed with chart rendering via Vega-Lite
- **Right Panel (Canvas)**: Visual area with minimized window dock

### 3. WinBox Integration
- Floating windows across entire page (not scoped to canvas)
- Minimized window dock at bottom of canvas
- Window lifecycle managed through server API

### 4. Technologies
- **React 18** with TypeScript
- **Material-UI (MUI)** for components
- **Vite** for fast development and building
- **Vega/Vega-Lite** for chart rendering
- **WinBox** for floating windows

## Setup

### Install Dependencies

```bash
cd finance/frontend
npm install
```

### Development

Start the dev server (proxies API calls to finance server):

```bash
npm run dev
```

This starts the frontend on `http://localhost:5281` and proxies API calls to the finance server at `http://localhost:5280`.

### Build for Production

```bash
npm run build
```

The build output goes to `dist/` and can be served by the finance server.

## Integration with Finance Server

The finance server (`finance/server/server.js`) should:

1. **Serve the built frontend** from `finance/frontend/dist`
2. **Proxy WinBox assets** from `refs/winbox/dist`
3. **Provide API endpoints**:
   - `/api/sessions` - List sessions
   - `/api/session/init` - Initialize session
   - `/api/stream` - SSE stream for blocks
   - `/api/append` - Append block to session
   - `/api/run-plan` - Execute Liu plan
   - `/api/reset` - Reset session
   - `/api/windows/remove` - Remove window
   - `/api/windows/clear` - Clear all windows

## Usage with Liu

### Running Plans

From the UI:
1. Click "Run Demo Plan" in the sidebar
2. This calls `/api/run-plan` which spawns the Liu CLI
3. Plan executes with `finance/domain` tools
4. Tools POST blocks back to the session
5. UI receives blocks via SSE and renders them

From CLI:
```bash
# Set environment variables
export FINANCE_WEB_URL=http://localhost:5280
export FIN_SESSION_ID=<your-session-id>

# Run a plan
node bin/liu.js run-plan market_filings_demo --domain-root finance/domain
```

### Natural Language Requests

1. Type a request in the chat input
2. Currently shows a mock plan preview
3. In full implementation:
   - Request sent to LLM compose service
   - LLM generates Liu TS plan
   - Plan shown for approval
   - On approval, plan executed

## Project Structure

```
finance/frontend/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   └── ResizableColumns.tsx    # Three-column resizable layout
│   │   ├── panels/
│   │   │   ├── Sidebar.tsx             # Left panel
│   │   │   ├── ChatFeed.tsx            # Middle panel
│   │   │   └── Canvas.tsx              # Right panel
│   │   └── blocks/
│   │       └── ChartBlock.tsx          # Vega chart rendering
│   ├── hooks/
│   │   ├── useSession.ts               # Session management
│   │   └── useSSE.ts                   # Server-sent events
│   ├── services/
│   │   ├── api.ts                      # API client
│   │   └── winbox.ts                   # WinBox management
│   ├── types/
│   │   ├── blocks.ts                   # Block type definitions
│   │   ├── api.ts                      # API type definitions
│   │   └── winbox.d.ts                 # WinBox type definitions
│   ├── theme/
│   │   └── theme.ts                    # MUI theme
│   ├── App.tsx                         # Main app component
│   └── main.tsx                        # Entry point
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Design Principles

1. **Loose Coupling**: Finance web functions without Liu; Liu is an enhancement
2. **Type Safety**: Full TypeScript coverage
3. **Component Modularity**: Clear separation of concerns
4. **Streaming**: SSE for real-time updates from plan execution
5. **Extensibility**: Easy to add new block types and window content

## Development Tips

### Adding New Block Types

1. Add type to `src/types/blocks.ts`
2. Add rendering logic in `ChatFeed.tsx`
3. Finance domain tools can emit new block types

### Adding New Windows

1. Define window config in `App.tsx` or send from server/plan
2. WinBox handles all window management
3. Content can be HTML or React components mounted dynamically

### Styling

MUI theme is in `src/theme/theme.ts`. Customize:
- Colors
- Typography
- Component defaults
- Spacing

## Notes

- WinBox windows float on the page body (not scoped to canvas)
- Session state is server-side; frontend is stateless
- All finance domain tools are optional - UI works without them
- Charts render with Vega-Lite; any valid spec works
