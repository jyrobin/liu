// Universe store (mock implementation for Phase 1)

/**
 * Return a simple universe by name.
 * In Phase 1 we return mock lists; later can plug real sources.
 * @param {string} name
 * @returns {{ id: string, symbols: string[] }}
 */
export function getUniverse(name) {
  const id = String(name || 'US_LARGE');
  const defaults = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'AMZN', 'META', 'TSLA', 'AVGO', 'JPM', 'V'];
  return { id, symbols: defaults };
}

