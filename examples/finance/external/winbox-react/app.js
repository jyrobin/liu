/* Demo app using the minimal WinBoxReact wrapper */
(function () {
  const e = React.createElement;

  // Simple demo components
  function TickerChart(props) {
    const { symbol = 'AAPL' } = props;
    const [points, setPoints] = React.useState(() => seed(40));

    React.useEffect(() => {
      const t = setInterval(() => setPoints((ps) => roll(ps)), 1200);
      return () => clearInterval(t);
    }, []);

    return e('div', { className: 'panel' },
      e('h3', null, `Chart — ${symbol}`),
      e('div', { className: 'muted', style: { marginBottom: 8 } }, 'Fake streaming to validate layout / perf'),
      e(Sparkline, { points })
    );
  }

  function Sparkline({ points }) {
    // naive SVG sparkline
    const w = 460, h = 120, pad = 8;
    const min = Math.min(...points), max = Math.max(...points);
    const span = Math.max(1, max - min);
    const step = (w - pad * 2) / (points.length - 1);
    const d = points.map((v, i) => [pad + i * step, h - pad - ((v - min) / span) * (h - pad * 2)]);
    const path = d.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    return e('svg', { width: w, height: h, style: { background: '#fff', border: '1px solid #eee', borderRadius: 8 } },
      e('path', { d: path, fill: 'none', stroke: '#2563eb', strokeWidth: 2 }),
      e('line', { x1: 0, y1: h - pad, x2: w, y2: h - pad, stroke: '#f3f4f6' })
    );
  }

  function OrderBook() {
    const rows = React.useMemo(() => mockOrders(), []);
    return e('div', { className: 'panel' },
      e('h3', null, 'Order Book'),
      e('table', { className: 'table' },
        e('thead', null, e('tr', null,
          e('th', null, 'Side'),
          e('th', null, 'Price'),
          e('th', null, 'Qty'),
          e('th', null, 'Venue')
        )),
        e('tbody', null,
          rows.map((r, i) => e('tr', { key: i },
            e('td', { style: { color: r.side === 'BUY' ? '#16a34a' : '#dc2626' } }, r.side),
            e('td', null, r.price.toFixed(2)),
            e('td', null, r.qty.toFixed(0)),
            e('td', null, r.venue)
          ))
        )
      )
    );
  }

  function Metrics() {
    const [pnl, setPnl] = React.useState(12543.23);
    const [exp, setExp] = React.useState(1.23e6);
    const [risk, setRisk] = React.useState(0.42);
    React.useEffect(() => {
      const t = setInterval(() => {
        setPnl((v) => v + (Math.random() - 0.5) * 500);
        setExp((v) => v + (Math.random() - 0.5) * 10000);
        setRisk((v) => Math.max(0, Math.min(1, v + (Math.random() - 0.5) * 0.05)));
      }, 1500);
      return () => clearInterval(t);
    }, []);

    return e('div', { className: 'panel' },
      e('h3', null, 'Metrics'),
      e('div', { className: 'kpi' },
        e('div', null, e('div', { className: 'muted' }, 'PnL'), e('div', { style: { fontSize: 18, fontWeight: 600 } }, fmt(pnl))),
        e('div', null, e('div', { className: 'muted' }, 'Exposure'), e('div', { style: { fontSize: 18, fontWeight: 600 } }, fmt(exp))),
        e('div', null, e('div', { className: 'muted' }, 'Risk Score'), e('div', { style: { fontSize: 18, fontWeight: 600 } }, (risk * 100).toFixed(1) + '%'))
      )
    );
  }

  // MUI Demo inside a WinBox window
  function MUIDemo() {
    const MUI = window.MaterialUI;
    if (!MUI) {
      return e('div', { className: 'panel' },
        e('h3', null, 'MUI Components Demo'),
        e('div', { className: 'muted' }, 'MUI UMD not loaded. Place either of these files:'),
        e('ul', null,
          e('li', null, 'vendor/material-ui.development.js (preferred)'),
          e('li', null, 'vendor/material.development.js (alternate)')
        ),
        e('div', { className: 'muted' }, 'Then reload the page.')
      );
    }
    const {
      ThemeProvider,
      createTheme,
      Button,
      Menu,
      MenuItem,
      TextField,
      Box,
      Typography,
    } = MUI;

    const theme = React.useMemo(() => createTheme({
      palette: { mode: 'light', primary: { main: '#1d4ed8' } },
      shape: { borderRadius: 8 },
    }), []);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    return e(ThemeProvider, { theme },
      e('div', { className: 'panel' },
        e(Typography, { variant: 'h6', sx: { mb: 1 } }, 'MUI Components Demo'),
        e(Typography, { variant: 'body2', color: 'text.secondary', sx: { mb: 2 } }, 'Validates overlays and theming inside a WinBox body'),
        e(Box, { sx: { display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' } },
          e(TextField, { label: 'Symbol', size: 'small', defaultValue: 'AAPL' }),
          e(Button, { variant: 'contained', onClick: handleClick, id: 'mui-menu-btn' }, 'Open Menu'),
          e(Menu, { anchorEl, open, onClose: handleClose, anchorOrigin: { vertical: 'bottom', horizontal: 'left' } },
            e(MenuItem, { onClick: handleClose }, 'Action 1'),
            e(MenuItem, { onClick: handleClose }, 'Action 2'),
            e(MenuItem, { onClick: handleClose }, 'Action 3')
          )
        )
      )
    );
  }

  // Utilities
  function fmt(n) { return n.toLocaleString(undefined, { maximumFractionDigits: 2 }); }
  function seed(n) { return Array.from({ length: n }, () => 100 + Math.random() * 20); }
  function roll(ps) { return ps.slice(1).concat(ps[ps.length - 1] + (Math.random() - 0.5) * 2); }
  function mockOrders() {
    const venues = ['NYSE', 'NASDAQ', 'BATS', 'ARCA'];
    const rows = [];
    for (let i = 0; i < 25; i++) rows.push({
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      price: 98 + Math.random() * 6,
      qty: 100 + Math.random() * 900,
      venue: venues[(Math.random() * venues.length) | 0],
    });
    return rows;
  }

  // WinBox helpers
  const desktop = document.getElementById('desktop');

  function openChart() {
    const wb = LiuUI.createWinBoxRoot({
      root: desktop,
      title: 'Ticker Chart — AAPL',
      x: 'center', y: 40,
      width: 520, height: 220,
    });
    wb.render(e(TickerChart, { symbol: 'AAPL' }));
    return wb;
  }

  function openOrderBook() {
    const wb = LiuUI.createWinBoxRoot({
      root: desktop,
      title: 'Order Book',
      x: 40, y: 280,
      width: 520, height: 360,
    });
    wb.render(e(OrderBook));
    return wb;
  }

  function openMetrics() {
    const wb = LiuUI.createWinBoxRoot({
      root: desktop,
      title: 'Metrics',
      x: 'right', y: 40,
      width: 420, height: 220,
    });
    wb.render(e(Metrics));
    return wb;
  }

  function openMUI() {
    const wb = LiuUI.createWinBoxRoot({
      root: desktop,
      title: 'MUI Demo',
      x: 'center', y: 520,
      width: 520, height: 240,
    });
    wb.render(e(MUIDemo));
    return wb;
  }

  // Simple tiling: cascade by enumerating the stack
  function tile() {
    const xs = [30, 60, 90, 120];
    const ys = [30, 60, 90, 120];
    const stack = WinBox.stack();
    stack.forEach((w, i) => {
      try {
        w.resize(480, 260).move(xs[i % xs.length], ys[i % ys.length]);
      } catch (e) {}
    });
  }

  // Wire toolbar
  document.getElementById('openChart').onclick = openChart;
  document.getElementById('openOrderBook').onclick = openOrderBook;
  document.getElementById('openMetrics').onclick = openMetrics;
  document.getElementById('tile').onclick = tile;
  document.getElementById('openMUI').onclick = openMUI;

  // Auto-open a default layout
  openChart();
  openOrderBook();
  openMetrics();
  openMUI();
})();
