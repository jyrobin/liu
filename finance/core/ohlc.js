// OHLC store: generate synthetic OHLC and cache via handles
import { hashId, writeJSON, readJSON } from './cache/fs-cache.js';

/**
 * Create a handle id for an OHLC request
 */
function makeHandleId(symbol, lookback, interval){
  return hashId(['ohlc', symbol, lookback, interval]);
}

/**
 * Generate synthetic OHLC for a symbol
 * @returns {import('./types.js').OhlcRow[]}
 */
function synthOhlc(symbol, days){
  const rows = [];
  let price = 100 + Math.random() * 20;
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24*60*60*1000).toISOString().slice(0,10);
    const delta = (Math.random() - 0.5) * 2;
    const open = price;
    const high = open + Math.abs(delta) * 2;
    const low = open - Math.abs(delta) * 2;
    const close = open + delta;
    price = close;
    rows.push({ date, open: round(open), high: round(high), low: round(low), close: round(close) });
  }
  return rows;
}
function round(x){ return Math.round(x*100)/100 }

/**
 * getOhlcRangeBatch returns handles and writes cache files (Phase 1 mock)
 */
export async function getOhlcRangeBatch(symbols, { lookback='3M', interval='1D' }={}){
  const days = lookbackToDays(lookback);
  const handles = [];
  for (const s of (symbols||[])){
    const handleId = makeHandleId(s, lookback, interval);
    const rows = synthOhlc(s, days);
    await writeJSON('ohlc', handleId, { symbol: s, interval, rows });
    handles.push({ kind: 'ohlc-handle', handleId, symbol: s, interval, rowsHint: rows.length });
  }
  return handles;
}

export async function fetchOhlc(handleId){
  const obj = await readJSON('ohlc', handleId);
  return obj;
}

function lookbackToDays(lb){
  if (lb === '1M') return 22;
  if (lb === '3M') return 66;
  if (lb === '6M') return 132;
  if (lb === '12M' || lb === '1Y') return 264;
  const m = /^([0-9]+)M$/.exec(lb||'');
  if (m) return Number(m[1]) * 22;
  return 66;
}

