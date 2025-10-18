/**
 * Finance Domain Tools — Command/Vocabulary Layer
 *
 * These tools are COMMANDS that tell the finance service what to do.
 * The finance service handles all:
 * - Data fetching
 * - Chart building
 * - HTML generation
 * - Complex domain logic
 *
 * Liu plans use these tools as a vocabulary to drive the finance web.
 */

// ============================================================================
// Session Management
// ============================================================================

export declare function financeEnsureSession(args: {
  name: string;
  title?: string;
  serverUrl?: string
}): { ok: boolean; name: string; sessionId: string; serverUrl: string; reused: boolean };

export declare function financeEnsureSessionEnv(): {
  ok: boolean;
  name: string;
  sessionId: string;
  serverUrl: string;
  reused: boolean
};

export declare function financeUseSession(args: {
  name: string
}): { ok: boolean; name: string; sessionId: string };

export declare function financeCurrentSession(): {
  active: string | null;
  sessionId?: string;
  serverUrl?: string;
  title?: string
};

export declare function financeRemoveSession(args: {
  name: string
}): { ok: boolean };

// Data-shaped command result
export type CommandResult = { status: string } & Record<string, any>;

// ============================================================================
// Core Data Schemas (handles, not raw payloads)
// ============================================================================

export type Interval = '1D' | '1W' | '1M' | '1H' | '5m';
export type Lookback = '1M' | '3M' | '6M' | '12M' | string;

export interface OhlcHandle {
  kind: 'ohlc-handle';
  handleId: string;
  symbol: string;
  interval: Interval;
  start?: string; // ISO date
  end?: string;   // ISO date
  rowsHint?: number; // optional hint (e.g., cached size)
}

export interface Universe {
  id: string;
  symbols: string[];
}

export interface SectorMapItem { symbol: string; sector: string }

// ============================================================================
// Primitive Tools (batch-friendly, server-backed)
// ============================================================================

export declare function getUniverse(args: { sessionId?: string; universe: string }): CommandResult & { universe?: Universe };

export declare function getSectorMap(args: { sessionId?: string; symbols: string[] }): CommandResult & { mapping?: SectorMapItem[] };

export declare function getOhlcRangeBatch(args: { sessionId?: string; symbols: string[]; lookback: Lookback; interval: Interval }): CommandResult & { handles?: OhlcHandle[] };

export declare function computeMomentumBatch(args: { sessionId?: string; handles: OhlcHandle[]; method?: 'total_return' | 'risk_adj'; lookback?: Lookback }): CommandResult & { scores?: Array<{ symbol: string; score: number }> };

export declare function aggregateSectorMomentum(args: { sessionId?: string; scores: Array<{ symbol: string; score: number }>; mapping: SectorMapItem[] }): CommandResult & { sectorScores?: Array<{ sector: string; score: number; trendSpec?: any }> };

export declare function rankTopKSectors(args: { sessionId?: string; sectorScores: Array<{ sector: string; score: number }>; k: number }): CommandResult & { topSectors?: Array<{ sector: string; score: number }> };

export declare function selectTopNPerSector(args: { sessionId?: string; scores: Array<{ symbol: string; score: number }>; mapping: SectorMapItem[]; sectors: Array<{ sector: string }>; n: number }): CommandResult & { leaders?: Array<{ sector: string; symbols: string[] }> };

export declare function buildSectorReport(args: { sessionId?: string; sectorScores: Array<{ sector: string; score: number }>; leaders: Array<{ sector: string; symbols: string[] }> }): CommandResult & { html?: string };

export declare function openSectorWindows(args: { sessionId?: string; sectors: Array<{ sector: string; symbols: string[] }>; lookback?: Lookback }): CommandResult & { windowIds?: Array<{ sector: string; windowId: string }> };

export declare function openOhlcChart(args: { sessionId?: string; symbol: string; lookback?: Lookback; interval?: Interval; width?: number; height?: number; mock?: boolean | '1' | '0' | 'true' | 'false' }): CommandResult & {
  windowId?: string;
  handleId?: string;
  rows?: number;
  source?: string;
};

export declare function runSectorMomentum(args: { sessionId?: string; universe?: string; lookback?: Lookback; interval?: Interval; k?: number; n?: number; mock?: boolean | '1' | '0' | 'true' | 'false'; openWindows?: boolean }): CommandResult & {
  html?: string;
  sectorScores?: Array<{ sector: string; score: number }>;
  leaders?: Array<{ sector: string; symbols: string[] }>;
  windowIds?: Array<{ sector: string; windowId: string }>;
};

// ============================================================================
// Display Commands — Content in Feed
// ============================================================================

/**
 * Show a message in the chat feed
 */
export declare function showMessage(args: {
  sessionId?: string;
  text: string;
  title?: string;
}): CommandResult;

/**
 * Show a request block (user intent echo)
 */
export declare function showRequest(args: {
  sessionId?: string;
  text: string;
}): CommandResult;

// ============================================================================
// Market Commands
// ============================================================================

/**
 * Show price chart for a symbol
 * Service handles: data fetch, chart spec, rendering
 * Options: feed (inline chart) | window (floating) | both
 */
export declare function showPriceChart(args: {
  sessionId?: string;
  symbol: string;
  period?: '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '5Y';
  indicators?: Array<'sma' | 'ema' | 'bollinger' | 'volume'>;
  display?: 'feed' | 'window' | 'both';
  windowTitle?: string;
}): CommandResult;

/**
 * Show volume chart
 */
export declare function showVolumeChart(args: {
  sessionId?: string;
  symbol: string;
  period?: string;
  display?: 'feed' | 'window' | 'both';
}): CommandResult;

/**
 * Show market overview/heatmap
 */
export declare function showMarketOverview(args: {
  sessionId?: string;
  market?: 'US' | 'GLOBAL' | 'CRYPTO';
  display?: 'feed' | 'window' | 'both';
}): CommandResult;

/**
 * Compare multiple symbols
 */
export declare function compareSymbols(args: {
  sessionId?: string;
  symbols: string[];
  metric?: 'price' | 'returns' | 'volume';
  period?: string;
  display?: 'feed' | 'window' | 'both';
}): CommandResult;

// ============================================================================
// Fundamentals Commands
// ============================================================================

/**
 * Show company fundamentals dashboard
 */
export declare function showFundamentals(args: {
  sessionId?: string;
  symbol: string;
  sections?: Array<'overview' | 'income' | 'balance' | 'cashflow' | 'ratios'>;
  display?: 'feed' | 'window' | 'both';
}): CommandResult;

/**
 * Show earnings history and estimates
 */
export declare function showEarnings(args: {
  sessionId?: string;
  symbol: string;
  quarters?: number;
  display?: 'feed' | 'window' | 'both';
}): CommandResult;

/**
 * Show financial ratios comparison
 */
export declare function compareRatios(args: {
  sessionId?: string;
  symbols: string[];
  ratios?: Array<'pe' | 'pb' | 'roe' | 'debt' | 'margin'>;
  display?: 'feed' | 'window' | 'both';
}): CommandResult;

// ============================================================================
// Filings Commands
// ============================================================================

/**
 * Show SEC filings browser
 */
export declare function showFilings(args: {
  sessionId?: string;
  symbol: string;
  types?: Array<'10-K' | '10-Q' | '8-K' | 'ALL'>;
  limit?: number;
  display?: 'window';  // Filings typically need window
}): CommandResult;

/**
 * Show specific filing sections
 */
export declare function showFilingDetail(args: {
  sessionId?: string;
  symbol: string;
  filingId: string;
  sections?: Array<'risk' | 'mda' | 'financials' | 'ALL'>;
  display?: 'feed' | 'window' | 'both';
}): CommandResult;

// ============================================================================
// Screening Commands
// ============================================================================

/**
 * Open stock screener with criteria
 */
export declare function openScreener(args: {
  sessionId?: string;
  preset?: 'growth' | 'value' | 'dividend' | 'momentum' | 'custom';
  criteria?: {
    marketCap?: { min?: number; max?: number };
    pe?: { min?: number; max?: number };
    volume?: { min?: number };
    sector?: string[];
  };
}): CommandResult;

/**
 * Show screening results
 */
export declare function showScreenResults(args: {
  sessionId?: string;
  results: Array<{ symbol: string; name: string; score: number }>;
  display?: 'feed' | 'window' | 'both';
}): CommandResult;

// ============================================================================
// News & Sentiment Commands
// ============================================================================

/**
 * Show news feed for symbol or market
 */
export declare function showNews(args: {
  sessionId?: string;
  symbol?: string;
  category?: 'market' | 'earnings' | 'analyst' | 'ALL';
  limit?: number;
  display?: 'feed' | 'window' | 'both';
}): CommandResult;

/**
 * Show sentiment analysis
 */
export declare function showSentiment(args: {
  sessionId?: string;
  symbol: string;
  sources?: Array<'news' | 'social' | 'analyst'>;
  display?: 'feed' | 'window' | 'both';
}): CommandResult;

// ============================================================================
// Portfolio Commands
// ============================================================================

/**
 * Show portfolio dashboard
 */
export declare function showPortfolio(args: {
  sessionId?: string;
  portfolioId?: string;
  display?: 'window';
}): CommandResult;

/**
 * Show position detail
 */
export declare function showPosition(args: {
  sessionId?: string;
  symbol: string;
  portfolioId?: string;
  display?: 'feed' | 'window' | 'both';
}): CommandResult;

/**
 * Run backtest simulation
 */
export declare function runBacktest(args: {
  sessionId?: string;
  strategy: string;
  symbols: string[];
  period?: string;
  display?: 'feed' | 'window' | 'both';
}): CommandResult;

// ============================================================================
// Workspace Commands
// ============================================================================

/**
 * Create a watchlist
 */
export declare function createWatchlist(args: {
  sessionId?: string;
  name: string;
  symbols: string[];
}): { ok: boolean };

/**
 * Show watchlist with live updates
 */
export declare function showWatchlist(args: {
  sessionId?: string;
  name: string;
  display?: 'window';
}): { ok: boolean };

/**
 * Save current workspace layout
 */
export declare function saveWorkspace(args: {
  sessionId?: string;
  name: string;
}): { ok: boolean };

/**
 * Load workspace layout
 */
export declare function loadWorkspace(args: {
  sessionId?: string;
  name: string;
}): { ok: boolean };

// ============================================================================
// Advanced Analysis Commands
// ============================================================================

/**
 * Run custom analysis
 */
export declare function runAnalysis(args: {
  sessionId?: string;
  type: 'correlation' | 'regression' | 'factor' | 'risk';
  symbols: string[];
  params?: Record<string, any>;
  display?: 'feed' | 'window' | 'both';
}): { ok: boolean };

/**
 * Show risk metrics
 */
export declare function showRisk(args: {
  sessionId?: string;
  symbol: string;
  metrics?: Array<'beta' | 'sharpe' | 'var' | 'maxdrawdown'>;
  display?: 'feed' | 'window' | 'both';
}): { ok: boolean };

// ============================================================================
// Logging/Status Commands
// ============================================================================

/**
 * Log a status message (appears in logs panel)
 */
export declare function logStatus(args: {
  sessionId?: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}): CommandResult;

/**
 * Log progress for long-running operations
 */
export declare function logProgress(args: {
  sessionId?: string;
  operation: string;
  current: number;
  total: number;
  message?: string;
}): CommandResult;

// ============================================================================
// Low-Level UI Commands (for special cases)
// ============================================================================

/**
 * Append a custom chart (for advanced use)
 * Prefer specific show* commands when possible
 */
export declare function appendCustomChart(args: {
  sessionId?: string;
  spec: any;
  data?: any[];
  title?: string;
}): { ok: boolean };

/**
 * Open a custom window (for advanced use)
 * Prefer specific show* commands when possible
 */
export declare function openCustomWindow(args: {
  sessionId?: string;
  title?: string;
  x?: number | string;
  y?: number | string;
  width?: number;
  height?: number;
  url?: string;  // Load external URL or service endpoint
}): { ok: boolean };

/**
 * Append a rich HTML report into the chat feed
 */
export declare function report(args: {
  sessionId?: string;
  title?: string;
  html: string;
  windowRefId?: string;
}): { ok: boolean };
