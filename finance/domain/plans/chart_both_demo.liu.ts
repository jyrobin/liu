import { financeEnsureSessionEnv, showPriceChart, logStatus } from '@tools';

// Ensure we reuse the current session when triggered from the web
financeEnsureSessionEnv();

// Announce intent to the logs panel
logStatus({ level: 'info', message: 'Demo: showPriceChart with display="both"' });

// Open an AAPL price chart in both chat (inline) and a window
const res = showPriceChart({ symbol: 'AAPL', period: '3M', indicators: ['sma'], display: 'both' });

if (res.status !== 'success') {
  logStatus({ level: 'error', message: 'showPriceChart failed' });
}

export default { ok: true };

