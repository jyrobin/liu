/**
 * Market Overview Plan — Command-Based Example
 *
 * This plan demonstrates the NEW command-based approach:
 * - Liu plans issue simple, high-level commands
 * - Finance service handles all data fetching, chart building, HTML generation
 * - Plans are concise and focus on "what" not "how"
 */

import {
  financeEnsureSessionEnv,
  showRequest,
  showMessage,
  showPriceChart,
  showFundamentals,
  showNews,
  logStatus
} from '@tools';

// Establish session
financeEnsureSessionEnv();

// Echo user intent
showRequest({ text: 'Show me a market overview for AAPL with fundamentals and recent news' });

// Log progress
logStatus({ level: 'info', message: 'Fetching AAPL market data...' });

// Show price chart with indicators
// Service fetches data, builds chart spec, renders in feed AND/OR window
showPriceChart({
  symbol: 'AAPL',
  period: '3M',
  indicators: ['sma', 'volume'],
  display: 'both'  // Inline chart in feed + floating window
});

logStatus({ level: 'info', message: 'Loading fundamentals...' });

// Show fundamentals
// Service fetches company data, builds dashboard, opens window
showFundamentals({
  symbol: 'AAPL',
  sections: ['overview', 'ratios'],
  display: 'window'  // Opens floating window with interactive dashboard
});

logStatus({ level: 'info', message: 'Fetching recent news...' });

// Show news
// Service fetches news, formats HTML, renders in feed
showNews({
  symbol: 'AAPL',
  category: 'ALL',
  limit: 5,
  display: 'feed'  // Shows as list in chat feed
});

// Final message
showMessage({
  title: 'Complete',
  text: 'Market overview ready. Price chart, fundamentals dashboard, and news feed are displayed.'
});

logStatus({ level: 'success', message: 'Market overview plan completed successfully' });

export default { ok: true };
