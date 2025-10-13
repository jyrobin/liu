import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadSampleBars(symbol) {
  // Reuse example dataset for AAPL daily OHLC
  const exData = path.join(__dirname, '..', '..', 'examples', 'finance', 'domain', 'data', 'aapl_ohlc_month.json');
  const fallback = path.join(__dirname, '..', 'data', 'aapl_ohlc_month.json');
  const p = fs.existsSync(exData) ? exData : fallback;
  if (!fs.existsSync(p)) return [];
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return []; }
}

export function getDailyBars({ symbol = 'AAPL', from, to, adjusted = true } = {}) {
  let rows = loadSampleBars(symbol);
  if (from) rows = rows.filter(r => r.date >= from);
  if (to) rows = rows.filter(r => r.date <= to);
  // adjusted flag is ignored for sample data
  return { symbol, timeframe: '1D', adjusted, rows };
}

export function enrichSMA({ bars, period = 20, field = 'close', outField = 'sma' } = {}) {
  const rows = (bars?.rows || bars || []).map(r => ({ ...r }));
  let sum = 0;
  for (let i = 0; i < rows.length; i++) {
    sum += Number(rows[i][field] || 0);
    if (i >= period) sum -= Number(rows[i - period][field] || 0);
    rows[i][outField] = i >= period - 1 ? sum / period : null;
  }
  return { ...bars, rows };
}

export function enrichBollinger({ bars, period = 20, mult = 2, field = 'close', out = { mid: 'bb_mid', upper: 'bb_upper', lower: 'bb_lower' } } = {}) {
  const rows = (bars?.rows || bars || []).map(r => ({ ...r }));
  const means = [];
  for (let i = 0; i < rows.length; i++) {
    const start = Math.max(0, i - period + 1);
    const slice = rows.slice(start, i + 1);
    const vals = slice.map(r => Number(r[field] || 0));
    const mean = vals.reduce((a, b) => a + b, 0) / slice.length;
    const variance = vals.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / slice.length;
    const sd = Math.sqrt(variance);
    rows[i][out.mid] = slice.length >= period ? mean : null;
    rows[i][out.upper] = slice.length >= period ? mean + mult * sd : null;
    rows[i][out.lower] = slice.length >= period ? mean - mult * sd : null;
    means.push(mean);
  }
  return { ...bars, rows };
}

