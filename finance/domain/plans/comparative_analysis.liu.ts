/**
 * Comparative Analysis Plan
 *
 * Demonstrates multi-symbol comparison using command pattern
 */

import {
  financeEnsureSessionEnv,
  showRequest,
  compareSymbols,
  compareRatios,
  showMessage,
  logStatus,
  logProgress
} from '@tools';

financeEnsureSessionEnv();

showRequest({ text: 'Compare AAPL, MSFT, and GOOGL across price and fundamentals' });

const symbols = ['AAPL', 'MSFT', 'GOOGL'];

// Price comparison
logProgress({ operation: 'Comparative Analysis', current: 1, total: 3, message: 'Comparing price performance...' });

compareSymbols({
  symbols: symbols,
  metric: 'returns',
  period: '1Y',
  display: 'both'  // Chart in feed + window
});

// Ratios comparison
logProgress({ operation: 'Comparative Analysis', current: 2, total: 3, message: 'Comparing financial ratios...' });

compareRatios({
  symbols: symbols,
  ratios: ['pe', 'roe', 'margin'],
  display: 'window'  // Interactive table/dashboard
});

// Summary
logProgress({ operation: 'Comparative Analysis', current: 3, total: 3, message: 'Generating summary...' });

showMessage({
  title: 'Analysis Complete',
  text: 'Comparison of AAPL, MSFT, and GOOGL completed. See charts and dashboards for details.'
});

logStatus({ level: 'success', message: 'Comparative analysis completed' });

export default { ok: true };
