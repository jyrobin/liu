# Finance Command Architecture

## Overview

The finance domain has been redesigned around a **command-based architecture** where:

- **Liu plans** issue simple, high-level commands as vocabulary
- **Finance service** handles all heavy lifting (data, charts, HTML, domain logic)
- **Frontend** provides visualization with logs, progress, and floating windows

This achieves **maximum loose coupling** while maintaining rich integration.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      USER / LLM                              │
│                  (Natural Language)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    LIU RUNTIME                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Liu Plan (plan.liu.ts)                              │   │
│  │  ─────────────────────                               │   │
│  │  financeEnsureSessionEnv();                          │   │
│  │  showPriceChart({ symbol: 'AAPL', display: 'both'}); │   │
│  │  showFundamentals({ symbol: 'AAPL' });               │   │
│  │  logStatus({ level: 'success', message: 'Done' });   │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ Commands (thin wrappers)
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              FINANCE DOMAIN TOOLS                            │
│              (finance/domain/tools/)                         │
│                                                              │
│  // Thin wrappers - just POST commands                      │
│  export function showPriceChart(args) {                     │
│    return sendCommand('showPriceChart', args);              │
│  }                                                           │
│                                                              │
│  function sendCommand(cmd, params) {                        │
│    POST /api/command { command: cmd, params }              │
│  }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP POST
                         │ { kind: 'command', command, params }
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              FINANCE SERVICE                                 │
│              (finance/server + handlers)                     │
│                                                              │
│  Command Handler:                                            │
│  ─────────────────                                           │
│  1. Receive command                                          │
│  2. Fetch data (DB, APIs, calculations)                      │
│  3. Build chart specs / HTML / dashboards                    │
│  4. Emit blocks to session:                                  │
│     - Charts → feed or window                                │
│     - Windows → WinBox with content                          │
│     - Logs → right panel                                     │
│     - Progress → right panel                                 │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │ SSE Stream
                         │ Blocks: chart, winbox, log, progress
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              FINANCE FRONTEND                                │
│              (React + MUI + Vite)                            │
│                                                              │
│  ┌─────────┬──────────────┬─────────────────────────┐       │
│  │ Sidebar │  ChatFeed    │  Canvas (Right Panel)   │       │
│  │         │              │  ┌───────────────────┐  │       │
│  │ Tools   │  • Charts    │  │  Tabs:            │  │       │
│  │ Plans   │  • Messages  │  │  • Logs           │  │       │
│  │ Actions │  • Plans     │  │  • Progress       │  │       │
│  │         │              │  │  • Dock           │  │       │
│  │         │              │  └───────────────────┘  │       │
│  └─────────┴──────────────┴─────────────────────────┘       │
│                                                              │
│  WinBox Windows (float across entire page)                  │
└─────────────────────────────────────────────────────────────┘
```

## Key Principles

### 1. Command as Vocabulary

Liu plans use commands as a **vocabulary** to express intent:

```typescript
// OLD APPROACH (Heavy lifting in plan):
const data = getDailyBars({ symbol: 'AAPL' });
const withSMA = enrichSMA({ bars: data, period: 10 });
const vlSpec = {
  // ... 50 lines of Vega-Lite spec ...
};
uiAppendChart({ spec: vlSpec, data: withSMA.rows });

// NEW APPROACH (Command-based):
showPriceChart({
  symbol: 'AAPL',
  period: '3M',
  indicators: ['sma'],
  display: 'both'
});
```

**Benefits**:
- Plans are concise (3-10 lines vs 50-100 lines)
- LLMs can generate plans more reliably
- Domain expertise stays in service
- Easy to change implementation without touching plans

### 2. Service Handles Everything

The finance service is responsible for:

**Data Operations**:
- Fetching from APIs, databases, files
- Calculations (SMA, Bollinger, ratios, etc.)
- Aggregations and transformations
- Caching and optimization

**Visualization**:
- Building Vega-Lite chart specs
- Generating HTML dashboards
- Formatting tables and lists
- Creating interactive widgets

**Domain Logic**:
- Financial calculations
- Business rules
- Validation
- Error handling

### 3. Display Options

Commands support flexible display modes:

```typescript
// In feed only (inline chart)
showPriceChart({ symbol: 'AAPL', display: 'feed' });

// In window only (floating WinBox)
showPriceChart({ symbol: 'AAPL', display: 'window' });

// Both (chart in feed + interactive window)
showPriceChart({ symbol: 'AAPL', display: 'both' });
```

This allows:
- Quick inline views for fast scanning
- Detailed windows for deep analysis
- Both for comprehensive workflows

### 4. Logs & Progress

Commands can emit logs and progress for observability:

```typescript
logStatus({
  level: 'info',
  message: 'Fetching AAPL data...'
});

logProgress({
  operation: 'Multi-Symbol Analysis',
  current: 5,
  total: 10,
  message: 'Processing MSFT...'
});
```

These appear in the **right panel** with three tabs:
- **Logs**: Status messages with levels (info/success/warning/error)
- **Progress**: Progress bars for long operations
- **Dock**: Minimized window chips

## Command Categories

### Market Commands
- `showPriceChart` - OHLC with indicators
- `showVolumeChart` - Volume analysis
- `showMarketOverview` - Market heatmap
- `compareSymbols` - Multi-symbol comparison

### Fundamentals Commands
- `showFundamentals` - Company dashboard
- `showEarnings` - Earnings history & estimates
- `compareRatios` - Financial ratios table

### Filings Commands
- `showFilings` - SEC filings browser
- `showFilingDetail` - Specific filing sections

### Screening Commands
- `openScreener` - Stock screener with criteria
- `showScreenResults` - Screening results table

### News & Sentiment Commands
- `showNews` - News feed
- `showSentiment` - Sentiment analysis

### Portfolio Commands
- `showPortfolio` - Portfolio dashboard
- `showPosition` - Position detail
- `runBacktest` - Backtest simulation

### Workspace Commands
- `createWatchlist` - Create watchlist
- `showWatchlist` - Show watchlist with live data
- `saveWorkspace` / `loadWorkspace` - Layout management

### Logging Commands
- `logStatus` - Status message
- `logProgress` - Progress indicator

## Example Plans

### Simple Market Overview

```typescript
import { financeEnsureSessionEnv, showPriceChart, logStatus } from '@tools';

financeEnsureSessionEnv();

logStatus({ level: 'info', message: 'Loading market data...' });

showPriceChart({
  symbol: 'AAPL',
  period: '3M',
  indicators: ['sma', 'volume'],
  display: 'both'
});

logStatus({ level: 'success', message: 'Chart ready' });

export default { ok: true };
```

### Multi-Symbol Comparison

```typescript
import {
  financeEnsureSessionEnv,
  compareSymbols,
  compareRatios,
  logProgress
} from '@tools';

financeEnsureSessionEnv();

const symbols = ['AAPL', 'MSFT', 'GOOGL'];

logProgress({
  operation: 'Comparison',
  current: 1,
  total: 2,
  message: 'Comparing prices...'
});

compareSymbols({
  symbols,
  metric: 'returns',
  period: '1Y',
  display: 'both'
});

logProgress({
  operation: 'Comparison',
  current: 2,
  total: 2,
  message: 'Comparing ratios...'
});

compareRatios({
  symbols,
  ratios: ['pe', 'roe', 'margin'],
  display: 'window'
});

export default { ok: true };
```

### Comprehensive Analysis

```typescript
import {
  financeEnsureSessionEnv,
  showRequest,
  showPriceChart,
  showFundamentals,
  showNews,
  showMessage,
  logStatus
} from '@tools';

financeEnsureSessionEnv();

showRequest({ text: 'Full analysis of AAPL' });

logStatus({ level: 'info', message: 'Step 1/3: Price chart' });
showPriceChart({
  symbol: 'AAPL',
  period: '6M',
  indicators: ['sma', 'bollinger'],
  display: 'both'
});

logStatus({ level: 'info', message: 'Step 2/3: Fundamentals' });
showFundamentals({
  symbol: 'AAPL',
  sections: ['overview', 'income', 'ratios'],
  display: 'window'
});

logStatus({ level: 'info', message: 'Step 3/3: News' });
showNews({
  symbol: 'AAPL',
  limit: 10,
  display: 'feed'
});

showMessage({
  title: 'Analysis Complete',
  text: 'AAPL analysis ready. Charts, dashboards, and news available.'
});

logStatus({ level: 'success', message: 'All done!' });

export default { ok: true };
```

## Frontend Layout

### Adjustments Made

1. **Middle Column (ChatFeed)**
   - Smaller minimum width (more flexible)
   - Shows charts, messages, plans
   - Auto-scrolls to latest content

2. **Right Panel (Canvas)**
   - **Three tabs**: Logs, Progress, Dock
   - **Logs tab**: Status messages with icons and colors
   - **Progress tab**: Progress bars for operations
   - **Dock tab**: Info about minimized windows
   - **Dock area**: Always visible at bottom for window chips

3. **Sidebar (Left)**
   - Navigation and quick actions
   - Run plan button
   - Reset session button

## Service Implementation Guide

When implementing the finance service command handler:

### 1. Command Endpoint

```javascript
// POST /api/command
app.post('/api/command', async (req, res) => {
  const { sessionId, command } = req.body;
  const { command: cmdName, params } = command;

  try {
    await handleCommand(sessionId, cmdName, params);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Command Handlers

```javascript
async function handleCommand(sessionId, cmdName, params) {
  switch (cmdName) {
    case 'showPriceChart':
      await handleShowPriceChart(sessionId, params);
      break;
    case 'showFundamentals':
      await handleShowFundamentals(sessionId, params);
      break;
    // ... more commands
  }
}

async function handleShowPriceChart(sessionId, params) {
  const { symbol, period, indicators, display } = params;

  // 1. Fetch data
  const data = await fetchMarketData(symbol, period);

  // 2. Apply indicators
  if (indicators?.includes('sma')) {
    data = await applySMA(data);
  }

  // 3. Build chart spec
  const chartSpec = buildVegaSpec(data, indicators);

  // 4. Emit blocks based on display mode
  if (display === 'feed' || display === 'both') {
    await appendBlock(sessionId, {
      kind: 'chart',
      spec: chartSpec,
      data: data.rows
    });
  }

  if (display === 'window' || display === 'both') {
    // Build interactive dashboard HTML
    const html = buildInteractiveDashboard(symbol, data, chartSpec);

    await appendBlock(sessionId, {
      kind: 'winbox',
      title: `${symbol} Price Chart`,
      width: 800,
      height: 500,
      html
    });
  }
}
```

### 3. Emit Logs

```javascript
async function emitLog(sessionId, level, message) {
  await appendBlock(sessionId, {
    kind: 'log',
    level,
    message,
    ts: Date.now()
  });
}

async function emitProgress(sessionId, operation, current, total, message) {
  await appendBlock(sessionId, {
    kind: 'progress',
    operation,
    current,
    total,
    message
  });
}
```

## Benefits Summary

### For Liu Plans
- ✅ Concise and readable
- ✅ Easy for LLMs to generate
- ✅ Focus on "what" not "how"
- ✅ Domain-independent patterns

### For Finance Service
- ✅ Owns all domain logic
- ✅ Can optimize independently
- ✅ Centralized data access
- ✅ Easier to test and maintain

### For Frontend
- ✅ Rich visualization options
- ✅ Logs and progress visibility
- ✅ Flexible layout
- ✅ Can function without Liu

### For Users
- ✅ Fast responses (service handles complexity)
- ✅ Consistent UX
- ✅ Observable operations
- ✅ Mix inline + window content

## Migration Path

To migrate existing tools:

1. **Identify heavy operations** - data fetching, calculations, chart building
2. **Move to service** - create command handlers
3. **Simplify tool** - just POST command
4. **Update type signature** - add display options
5. **Test both modes** - feed, window, both

## Future Enhancements

1. **Command chaining** - Commands that trigger other commands
2. **Conditional display** - Service decides feed vs window based on data size
3. **Interactive commands** - User can interact with displayed content
4. **Command history** - Replay commands, undo/redo
5. **Custom commands** - User-defined command vocabularies

---

This architecture maximizes **loose coupling** while enabling **tight integration** - the hallmark of a well-designed system.
