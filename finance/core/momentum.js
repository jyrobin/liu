// Momentum & returns
import { fetchOhlc } from './ohlc.js';

/**
 * Compute simple close-to-close returns for each handle over the lookback
 * Returns: [{ symbol, returns: number }]
 */
export async function computeReturnsBatch(handles){
  const out = [];
  for (const h of (handles||[])){
    const data = await fetchOhlc(h.handleId);
    const rows = data.rows || [];
    if (rows.length < 2){ out.push({ symbol: h.symbol, returns: 0 }); continue; }
    const first = rows[0].close;
    const last = rows[rows.length-1].close;
    const ret = (last - first) / (first || 1);
    out.push({ symbol: h.symbol, returns: ret });
  }
  return out;
}

/**
 * Compute momentum score; Phase 1: same as simple return.
 */
export async function computeMomentumBatch(handles, { method='total_return' }={}){
  const rets = await computeReturnsBatch(handles);
  return { scores: rets.map(r => ({ symbol: r.symbol, score: r.returns })) };
}

