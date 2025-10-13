export function listFilings({ symbol = 'AAPL', limit = 10 } = {}) {
  const items = [
    { id: `${symbol}-10Q-2024Q2`, type: '10-Q', period: 'Q2', date: '2024-08-02', title: `${symbol} 10-Q (Q2)` },
    { id: `${symbol}-8K-20240718`, type: '8-K', period: '-', date: '2024-07-18', title: `${symbol} 8-K` },
    { id: `${symbol}-10K-2024FY`, type: '10-K', period: 'FY', date: '2024-02-03', title: `${symbol} 10-K` },
  ];
  return { symbol, rows: items.slice(0, limit) };
}

export function getFilingSections({ symbol = 'AAPL', filingId } = {}) {
  // Mocked sections with small summaries
  const sections = [
    { id: 'business', title: 'Business', summary: 'Company overview, segments, strategy, and competition.' },
    { id: 'risk-factors', title: 'Risk Factors', summary: 'Key operational, market, and regulatory risks.' },
    { id: 'mdna', title: "Management's Discussion and Analysis", summary: 'Drivers of recent performance, outlook, and capital allocation.' },
    { id: 'financial-statements', title: 'Financial Statements', summary: 'Consolidated statements and notes.' },
  ];
  return { symbol, filingId: filingId || `${symbol}-LATEST`, sections };
}

