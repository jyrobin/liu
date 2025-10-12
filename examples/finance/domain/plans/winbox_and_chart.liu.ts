import { financeEnsureSessionEnv, uiAppendRequest, uiOpenWindow, fetchDailyOHLC, uiAppendChart } from '@tools';

// Ensure we have an active external UI session
financeEnsureSessionEnv();

// Announce intent
uiAppendRequest({ text: 'Open a WinBox window and append an AAPL OHLC chart.' });

// Open a simple WinBox window with contextual text
uiOpenWindow({
  title: 'AAPL — Notes',
  x: 'right',
  y: 40,
  width: 420,
  height: 200,
  html: `
    <div style="padding:12px">
      <h3 style="margin:0 0 8px">AAPL — Notes</h3>
      <div style="color:#667085;font-size:13px">
        This window demonstrates WinBox integration. The OHLC chart for the past month
        is appended to the stream area below via a Vega-Lite spec.
      </div>
    </div>
  `
});

// Load data and append a Vega-Lite chart block to the stream
const data = fetchDailyOHLC({ symbol: 'AAPL', period: '1M' });

const vlSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  description: 'AAPL daily OHLC (past month)',
  width: 700,
  height: 300,
  data: { name: 'ohlc' },
  layer: [
    { mark: { type: 'rule', tooltip: true }, encoding: { x: { field: 'date', type: 'temporal' }, y: { field: 'low', type: 'quantitative' }, y2: { field: 'high' }, color: { value: '#888' } } },
    { mark: { type: 'bar', tooltip: true }, encoding: { x: { field: 'date', type: 'temporal' }, y: { field: 'open', type: 'quantitative' }, y2: { field: 'close' }, color: { condition: { test: 'datum.close > datum.open', value: '#2ca02c' }, value: '#d62728' } } }
  ]
};

uiAppendChart({ spec: vlSpec, data: data.rows });

export default { ok: true };

