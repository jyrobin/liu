// OHLC store: generate synthetic OHLC and cache via handles
import { hashId, writeJSON, readJSON, cachePath } from './cache/fs-cache.js';
import { fetchOhlc as fetchYahooOhlc } from '../data/providers/yahoo.js';
import fssync from 'node:fs';

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
  const useMock = process.env.FINANCE_CORE_USE_MOCK === '1';
  const days = lookbackToDays(lookback);
  const handles = [];
  for (const s of (symbols||[])){
    const handleId = makeHandleId(s, lookback, interval);
    const cacheFile = cachePath('ohlc', handleId);
    if (!fssync.existsSync(cacheFile)){
      let rows;
      let source = 'mock';
      if (!useMock){
        try {
          rows = await fetchYahooOhlc(mapYahooParams({ symbol: s, lookback, interval }));
          source = 'yahoo';
        } catch (err) {
          console.warn(`[finance-core] Yahoo fetch failed for ${s} (${lookback}/${interval}):`, err?.message || err);
        }
      }
      if (!rows){
        rows = synthOhlc(s, days);
        source = 'mock';
      }
      await writeJSON('ohlc', handleId, { symbol: s, interval, lookback, source, rows });
    }
    handles.push({ kind: 'ohlc-handle', handleId, symbol: s, interval, rowsHint: useMock ? days : undefined });
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

function mapYahooParams({ symbol, lookback, interval }){
  const period = toYahooPeriod(lookback);
  const yfInterval = toYahooInterval(interval);
  return { symbol, period, interval: yfInterval };
}

function toYahooPeriod(lookback){
  if (lookback === '1M') return '1mo';
  if (lookback === '3M') return '3mo';
  if (lookback === '6M') return '6mo';
  if (lookback === '12M' || lookback === '1Y') return '1y';
  const m = /^([0-9]+)M$/.exec(lookback||'');
  if (m) return `${m[1]}mo`;
  return '3mo';
}

function toYahooInterval(interval){
  if (interval === '1D') return '1d';
  if (interval === '1W') return '1wk';
  if (interval === '1M') return '1mo';
  if (interval === '1H') return '1h';
  if (interval === '5m') return '5m';
  return '1d';
}
