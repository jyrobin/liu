// Mapping provider (symbol -> sector)

import { fetchProfile } from '../data/providers/yahoo.js';
import { cachePath, ensureDirSync } from './cache/fs-cache.js';
import fs from 'node:fs/promises';
import fssync from 'node:fs';

const MAP_DIR = 'finance/cache/mapping';
const MOCK_SECTORS = {
  AAPL: 'Technology',
  MSFT: 'Technology',
  GOOGL: 'Communication Services',
  NVDA: 'Technology',
  AMZN: 'Consumer Discretionary',
  META: 'Communication Services',
  TSLA: 'Consumer Discretionary',
  AVGO: 'Technology',
  JPM: 'Financials',
  V: 'Financials',
};

/**
 * Return sector mapping for a list of symbols (mock for Phase 1)
 * @param {string[]} symbols
 * @returns {{ symbol: string, sector: string }[]}
 */
export async function getSectorMap(symbols) {
  ensureDirSync(MAP_DIR);
  const results = [];
  for (const symbol of (symbols||[])){
    const cacheFile = cachePath('mapping', symbol);
    if (fssync.existsSync(cacheFile)){
      const text = await fs.readFile(cacheFile, 'utf8');
      results.push(JSON.parse(text));
      continue;
    }
    let mapping;
    if (process.env.FINANCE_CORE_USE_MOCK === '1') {
      mapping = { symbol, sector: MOCK_SECTORS[symbol] || 'Other' };
    } else {
      try {
        const profile = await fetchProfile(symbol);
        mapping = { symbol, sector: profile.sector || 'Other' };
      } catch (err) {
        console.warn(`[finance-core] Profile fetch failed for ${symbol}:`, err?.message || err);
        mapping = { symbol, sector: 'Other' };
      }
    }
    await fs.writeFile(cacheFile, JSON.stringify(mapping, null, 2), 'utf8');
    results.push(mapping);
  }
  return results;
}
