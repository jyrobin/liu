// Sector momentum pipeline (Phase 1)
import { getUniverse } from '../universe.js';
import { getSectorMap } from '../mapping.js';
import { getOhlcRangeBatch } from '../ohlc.js';
import { computeMomentumBatch } from '../momentum.js';
import { aggregateByGroup, rankTopK, selectTopNPerGroup } from '../aggregate.js';
import { buildSectorMomentumReport } from '../report.js';
import { renderHTML } from '../renderers/html.js';

/**
 * Run sector momentum pipeline end-to-end and return report + artifacts
 * @param {{ universe?: string, lookback?: string, interval?: string, k?: number, n?: number }} opts
 */
export async function runSectorMomentum(opts={}){
  const prevMock = process.env.FINANCE_CORE_USE_MOCK;
  if (opts.mock === true) process.env.FINANCE_CORE_USE_MOCK = '1';
  else if (opts.mock === false) process.env.FINANCE_CORE_USE_MOCK = '0';
  try {
  const universeName = opts.universe || 'US_LARGE';
  const lookback = opts.lookback || '3M';
  const interval = opts.interval || '1D';
  const k = Number(opts.k || 5);
  const n = Number(opts.n || 5);

  const uni = getUniverse(universeName);
  const mapping = await getSectorMap(uni.symbols);
  const handles = await getOhlcRangeBatch(uni.symbols, { lookback, interval });
  const momentum = await computeMomentumBatch(handles, { method: 'total_return', lookback });
  const sectorScores = aggregateByGroup(momentum.scores, mapping, 'sector');
  const topSectors = rankTopK(sectorScores, k);
  const leaders = selectTopNPerGroup(momentum.scores, mapping, topSectors, n);

  const report = buildSectorMomentumReport({ sectorScores: topSectors, leaders });
  const html = renderHTML(report);

  return { report, html, sectorScores: topSectors, leaders };
  } finally {
    if (prevMock === undefined) delete process.env.FINANCE_CORE_USE_MOCK;
    else process.env.FINANCE_CORE_USE_MOCK = prevMock;
  }
}
