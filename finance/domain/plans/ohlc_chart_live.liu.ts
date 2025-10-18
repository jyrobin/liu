import {
  financeEnsureSessionEnv,
  logStatus,
  openOhlcChart,
} from '@tools';

financeEnsureSessionEnv();

logStatus({ level: 'info', message: 'Opening live OHLC chart with TradingView lightweight charts' });

openOhlcChart({
  symbol: 'AAPL',
  lookback: '6M',
  interval: '1D',
});

export default { ok: true };
