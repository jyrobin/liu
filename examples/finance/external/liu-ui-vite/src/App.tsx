import React from 'react';
import { createWinBoxRoot, WinBoxHost } from '../../../../liu-ui/src/index.js';

const desktop = () => document.getElementById('desktop') as HTMLElement;

// --- Demo content components ---
const Sparkline: React.FC<{ points: number[] }> = ({ points }) => {
  const w = 460, h = 120, pad = 8;
  const min = Math.min(...points), max = Math.max(...points);
  const span = Math.max(1, max - min);
  const step = (w - pad * 2) / Math.max(1, (points.length - 1));
  const d = points.map((v, i) => [pad + i * step, h - pad - ((v - min) / span) * (h - pad * 2)]);
  const path = d.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return (
    <svg width={w} height={h} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8 }}>
      <path d={path} fill="none" stroke="#2563eb" strokeWidth={2} />
      <line x1={0} y1={h - pad} x2={w} y2={h - pad} stroke="#f3f4f6" />
    </svg>
  );
};

const TickerChart: React.FC<{ symbol: string }> = ({ symbol }) => {
  const [points, setPoints] = React.useState<number[]>(() => seed(40));
  React.useEffect(() => { const t = setInterval(() => setPoints(ps => roll(ps)), 1200); return () => clearInterval(t); }, []);
  return (
    <div style={{ padding: 12 }}>
      <h3 style={{ margin: '0 0 8px' }}>Chart — {symbol}</h3>
      <div style={{ color: '#667085', fontSize: 12, marginBottom: 8 }}>Mock streaming to validate layout</div>
      <Sparkline points={points} />
    </div>
  );
};

const Screener: React.FC<{ onSelect: (sym: string) => void }> = ({ onSelect }) => {
  const [query, setQuery] = React.useState('Price > 50 AND Momentum12 > 0');
  const [results] = React.useState<string[]>(['AAPL', 'MSFT', 'NVDA', 'AMZN', 'META']);
  return (
    <div style={{ padding: 12 }}>
      <h3 style={{ margin: '0 0 8px' }}>Screener</h3>
      <div style={{ marginBottom: 8 }}>
        <input style={{ width: '100%', padding: 8 }} value={query} onChange={e => setQuery(e.target.value)} />
        <div style={{ color: '#667085', fontSize: 12, marginTop: 6 }}>Mock query — not evaluated</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead><tr><th align="left" style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>Symbol</th></tr></thead>
        <tbody>
        {results.map(s => (
          <tr key={s} style={{ cursor: 'pointer' }} onClick={() => onSelect(s)}>
            <td style={{ padding: '6px 8px', borderBottom: '1px solid #f5f5f5' }}>{s}</td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
};

const Filings: React.FC<{ symbol: string }> = ({ symbol }) => {
  const filings = React.useMemo(() => mockFilings(symbol), [symbol]);
  const [active, setActive] = React.useState(0);
  return (
    <div style={{ padding: 12 }}>
      <h3 style={{ margin: '0 0 8px' }}>Filings — {symbol}</h3>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 200 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {filings.map((f, i) => (
              <li key={i} style={{ padding: '6px 8px', background: i===active? '#eef2ff':'#fff', border: '1px solid #eee', marginBottom: 6, borderRadius: 6, cursor: 'pointer' }} onClick={() => setActive(i)}>
                <div style={{ fontWeight: 600 }}>{f.type} {f.period}</div>
                <div style={{ color: '#667085', fontSize: 12 }}>{f.date}</div>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1, background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
          <h4 style={{ margin: '0 0 8px' }}>{filings[active].title}</h4>
          <div style={{ color: '#667085', fontSize: 13 }}>{filings[active].summary}</div>
        </div>
      </div>
    </div>
  );
};

// --- App wiring: open Screener, Chart, Filings windows ---
const App: React.FC = () => {
  const selected = React.useRef<string>('AAPL');

  React.useEffect(() => {
    const root = desktop();
    const handlers: Record<string, () => void> = {
      'open-screener': () => openScreener(root, (s) => { selected.current = s; openChart(root, s); openFilings(root, s); }),
      'open-chart': () => openChart(root, selected.current),
      'open-filings': () => openFilings(root, selected.current),
      'tile': () => tileWindows(),
    };
    document.querySelectorAll('.toolbar [data-action]')
      .forEach(btn => btn.addEventListener('click', () => {
        const key = (btn as HTMLElement).dataset.action!;
        handlers[key]?.();
      }));
    // auto open defaults
    handlers['open-screener']();
    handlers['open-chart']();
    handlers['open-filings']();
  }, []);

  return null;
};

// --- Window helpers (using liu-ui ESM) ---
function openScreener(root: HTMLElement, onSelect: (s: string) => void) {
  const api = createWinBoxRoot({ root, title: 'Screener', x: 24, y: 80, width: 380, height: 320 });
  api.render(<Screener onSelect={onSelect} />);
  return api;
}

function openChart(root: HTMLElement, symbol: string) {
  const api = createWinBoxRoot({ root, title: `Chart — ${symbol}`, x: 'center', y: 40, width: 520, height: 220 });
  api.render(<TickerChart symbol={symbol} />);
  return api;
}

function openFilings(root: HTMLElement, symbol: string) {
  const api = createWinBoxRoot({ root, title: `Filings — ${symbol}`, x: 'right', y: 80, width: 520, height: 320 });
  api.render(<Filings symbol={symbol} />);
  return api;
}

function tileWindows() {
  const xs = [30, 60, 90, 120];
  const ys = [30, 60, 90, 120];
  const stack = (window as any).WinBox.stack();
  stack.forEach((w: any, i: number) => { try { w.resize(480, 260).move(xs[i % xs.length], ys[i % ys.length]); } catch {} });
}

// --- tiny mocks ---
function seed(n: number) { return Array.from({ length: n }, () => 100 + Math.random() * 20); }
function roll(ps: number[]) { return ps.slice(1).concat(ps[ps.length - 1] + (Math.random() - 0.5) * 2); }
function mockFilings(symbol: string) {
  return [
    { type: '10-Q', period: 'Q2', date: '2024-08-02', title: `${symbol} 10-Q (Q2)`, summary: 'Quarterly results, revenue +12% YoY, margin +80 bps.' },
    { type: '8-K', period: '—', date: '2024-07-18', title: `${symbol} 8-K`, summary: 'Press release: product update and outlook reaffirmed.' },
    { type: '10-K', period: 'FY', date: '2024-02-03', title: `${symbol} 10-K`, summary: 'Annual results with MD&A updates and risk factor revisions.' },
  ];
}

export default App;

