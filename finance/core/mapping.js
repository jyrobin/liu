// Mapping provider (symbol -> sector)

const MOCK_SECTORS = {
  AAPL: 'Technology', MSFT: 'Technology', GOOGL: 'Communication Services', NVDA: 'Technology',
  AMZN: 'Consumer Discretionary', META: 'Communication Services', TSLA: 'Consumer Discretionary',
  AVGO: 'Technology', JPM: 'Financials', V: 'Financials'
};

/**
 * Return sector mapping for a list of symbols (mock for Phase 1)
 * @param {string[]} symbols
 * @returns {{ symbol: string, sector: string }[]}
 */
export function getSectorMap(symbols) {
  return (symbols || []).map(s => ({ symbol: s, sector: MOCK_SECTORS[s] || 'Other' }));
}

