# Finance Domain + Web — Command Architecture

A clean, command-based finance domain for Liu with a modern React frontend.

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│  Liu Plans (Vocabulary/Commands)                     │
│  ─────────────────────────────────                   │
│  showPriceChart({ symbol: 'AAPL', display: 'both'}) │
│  showFundamentals({ symbol: 'AAPL' })                │
│  logStatus({ level: 'success', message: 'Done' })    │
└────────────────┬─────────────────────────────────────┘
                 │ Commands (thin POST wrappers)
                 ↓
┌──────────────────────────────────────────────────────┐
│  Finance Service (Heavy Lifting)                     │
│  ──────────────────────────────                      │
│  • Fetch data (APIs, DB, calculations)               │
│  • Build charts (Vega-Lite specs)                    │
│  • Generate HTML/dashboards                          │
│  • Emit blocks to session (SSE)                      │
└────────────────┬─────────────────────────────────────┘
                 │ SSE Stream (blocks)
                 ↓
┌──────────────────────────────────────────────────────┐
│  React Frontend (Visualization)                      │
│  ────────────────────────────                        │
│  • Sidebar: Tools & demo plans                       │
│  • ChatFeed: Charts, messages, plans                 │
│  • Canvas: Logs, progress, minimized windows         │
│  • WinBox: Floating windows across page              │
└──────────────────────────────────────────────────────┘
```

## Project Structure

```
finance/
├── domain/                    # Liu domain (vocabulary)
│   ├── tools/
│   │   └── index.js          # Command wrappers (POST to service)
│   ├── types/
│   │   └── tools.d.ts        # 30+ command signatures
│   ├── plans/
│   │   ├── market_overview.liu.ts          # Demo plan 1
│   │   └── comparative_analysis.liu.ts     # Demo plan 2
│   └── liu-domain.config.json
│
├── frontend/                  # React + MUI + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/ResizableColumns.tsx
│   │   │   ├── panels/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── ChatFeed.tsx
│   │   │   │   └── Canvas.tsx
│   │   │   └── blocks/ChartBlock.tsx
│   │   ├── hooks/
│   │   │   ├── useSession.ts
│   │   │   └── useSSE.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── winbox.ts
│   │   ├── types/
│   │   │   ├── blocks.ts
│   │   │   ├── api.ts
│   │   │   └── winbox.d.ts
│   │   ├── theme/theme.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── server/                    # Finance service (to be implemented)
│   └── server.js             # HTTP + SSE + command handler
│
└── workspace/                 # User workspaces
```

## Quick Start

### 1. Install Frontend Dependencies

```bash
cd finance/frontend
npm install
```

### 2. Start Development

```bash
# Terminal 1: Start finance server
cd finance/server
node server.js
# Server at http://localhost:5280

# Terminal 2: Start frontend dev server
cd finance/frontend
npm run dev
# Frontend at http://localhost:5281
```

### 3. Use the UI

- **Open windows**: Click Screener/Chart/Filings in sidebar
- **Run demo plans**: Click "Market Overview" or "Comparative Analysis"
- **View logs**: Check right panel → Logs tab
- **View progress**: Check right panel → Progress tab
- **Reset**: Click "Reset Session" button

## Command-Based Design

### Liu Plans Use Simple Commands

```typescript
// market_overview.liu.ts
import {
  financeEnsureSessionEnv,
  showPriceChart,
  showFundamentals,
  showNews,
  logStatus
} from '@tools';

financeEnsureSessionEnv();

logStatus({ level: 'info', message: 'Loading data...' });

showPriceChart({
  symbol: 'AAPL',
  period: '3M',
  indicators: ['sma', 'volume'],
  display: 'both'  // feed + window
});

showFundamentals({
  symbol: 'AAPL',
  sections: ['overview', 'ratios'],
  display: 'window'
});

showNews({
  symbol: 'AAPL',
  limit: 5,
  display: 'feed'
});

logStatus({ level: 'success', message: 'Done!' });

export default { ok: true };
```

**Plans are 10-15 lines vs 50-100+ in old approach!**

### Finance Service Handles Everything

The service receives commands and:
1. Fetches data from APIs/DB
2. Performs calculations (SMA, ratios, etc.)
3. Builds chart specs (Vega-Lite)
4. Generates HTML/dashboards
5. Emits blocks via SSE

### Frontend Visualizes

- **ChatFeed**: Inline charts, messages, plan previews
- **Canvas**: Logs (info/success/warning/error), progress bars, dock
- **WinBox**: Floating windows with interactive content

## Available Commands

### Market
- `showPriceChart` - OHLC with indicators
- `showVolumeChart` - Volume analysis
- `showMarketOverview` - Market heatmap
- `compareSymbols` - Multi-symbol comparison

### Fundamentals
- `showFundamentals` - Company dashboard
- `showEarnings` - Earnings history
- `compareRatios` - Financial ratios

### Filings
- `showFilings` - SEC filings browser
- `showFilingDetail` - Filing sections

### Other
- `showNews`, `showSentiment` - News & sentiment
- `showPortfolio`, `showPosition` - Portfolio
- `openScreener`, `showScreenResults` - Screening
- `logStatus`, `logProgress` - Logging

See `domain/types/tools.d.ts` for complete list (30+ commands).

## Display Modes

Every `show*` command supports:

```typescript
display: 'feed'    // Inline in chat feed
display: 'window'  // Floating WinBox window
display: 'both'    // Both feed + window
```

## Benefits

✅ **Concise Plans**: 10-15 lines vs 50-100+
✅ **Service Owns Logic**: All domain expertise centralized
✅ **LLM-Friendly**: Simple vocabulary, reliable generation
✅ **Flexible Display**: Choose feed/window/both per command
✅ **Observable**: Logs and progress in UI
✅ **Loose Coupling**: Frontend works without Liu

## Service Implementation

The finance service needs to implement:

### 1. Command Endpoint

```javascript
POST /api/command
{
  sessionId: "sess_123",
  command: {
    command: "showPriceChart",
    params: {
      symbol: "AAPL",
      period: "3M",
      indicators: ["sma"],
      display: "both"
    }
  }
}
```

### 2. Command Handler

```javascript
async function handleShowPriceChart(sessionId, params) {
  // 1. Fetch data
  const data = await fetchMarketData(params.symbol, params.period);

  // 2. Apply indicators
  if (params.indicators?.includes('sma')) {
    data = applySMA(data);
  }

  // 3. Build Vega-Lite spec
  const chartSpec = buildVegaSpec(data);

  // 4. Emit blocks based on display mode
  if (params.display === 'feed' || params.display === 'both') {
    await appendBlock(sessionId, {
      kind: 'chart',
      spec: chartSpec,
      data: data.rows
    });
  }

  if (params.display === 'window' || params.display === 'both') {
    const html = buildDashboard(params.symbol, data);
    await appendBlock(sessionId, {
      kind: 'winbox',
      title: `${params.symbol} Chart`,
      width: 800,
      height: 500,
      html
    });
  }
}
```

### 3. Logging

```javascript
await appendBlock(sessionId, {
  kind: 'log',
  level: 'info',
  message: 'Fetching data...',
  ts: Date.now()
});

await appendBlock(sessionId, {
  kind: 'progress',
  operation: 'Multi-Symbol Analysis',
  current: 5,
  total: 10,
  message: 'Processing MSFT...'
});
```

## Documentation

- `/docs/finance-command-architecture.md` - Complete architecture guide
- `/docs/finance-frontend.md` - Frontend architecture
- `frontend/README.md` - Frontend setup & usage
- `frontend/QUICKSTART.md` - Quick start guide

## Next Steps

1. **Implement Service**: Create command handlers in `server/`
2. **Add Real Data**: Connect to real APIs (Alpha Vantage, IEX, etc.)
3. **Build Dashboards**: Create rich HTML widgets for windows
4. **Add Commands**: Extend vocabulary with new commands
5. **Deploy**: Build frontend and configure production server

---

**Clean, command-based architecture with maximum loose coupling!**
