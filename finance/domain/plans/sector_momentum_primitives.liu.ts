import {
  financeEnsureSessionEnv,
  logStatus,
  getUniverse,
  getSectorMap,
  getOhlcRangeBatch,
  computeMomentumBatch,
  aggregateSectorMomentum,
  rankTopKSectors,
  selectTopNPerSector,
  buildSectorReport,
  report,
  openSectorWindows,
  showPriceChart,
} from '@tools';

// Ensure we reuse current session (when triggered from the web UI)
financeEnsureSessionEnv();

logStatus({ level: 'info', message: 'Sector momentum leaders (lookback=3M, K=5, N=5)' });

// 1) Universe and sector mapping
const uni = getUniverse({ universe: 'US_LARGE' });
const map = getSectorMap({ symbols: (uni.universe && uni.universe.symbols) || [] });

// 2) OHLC handles and momentum scores
const handles = getOhlcRangeBatch({ symbols: (uni.universe && uni.universe.symbols) || [], lookback: '3M', interval: '1D' });
const scores = computeMomentumBatch({ handles: handles.handles || [], method: 'total_return', lookback: '3M' });

// 3) Aggregate by sector and rank top K sectors
const sectorAgg = aggregateSectorMomentum({ scores: scores.scores || [], mapping: map.mapping || [] });
const topSectors = rankTopKSectors({ sectorScores: sectorAgg.sectorScores || [], k: 5 });

// 4) Select top N leaders per top sector
const leaders = selectTopNPerSector({ scores: scores.scores || [], mapping: map.mapping || [], sectors: topSectors.topSectors || [], n: 5 });

// 5) Build a narrative report and append to chat
const rep = buildSectorReport({ sectorScores: sectorAgg.sectorScores || [], leaders: leaders.leaders || [] });
report({ title: 'Sector Momentum (3M) — Top 5', html: (rep && rep.html) || '' });

// 6) Optional: open sector/ticker windows (server decides content)
openSectorWindows({ sectors: leaders.leaders || [], lookback: '3M' });

// 7) Optional: open a couple of ticker charts as windows (for immediate taste)
// Keep plan simple: just pick 2-3 well-known tickers (in real impl, server windows above are sufficient)
showPriceChart({ symbol: 'AAPL', period: '3M', display: 'window' });
showPriceChart({ symbol: 'MSFT', period: '3M', display: 'window' });

export default { ok: true };

