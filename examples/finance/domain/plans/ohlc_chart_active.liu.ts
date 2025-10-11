import { uiAppendRequest, fetchDailyOHLC, uiAppendChart } from '@tools';

uiAppendRequest({ text: 'Append AAPL OHLC chart to the current session.' });

const data = fetchDailyOHLC({ symbol: 'AAPL', period: '1M' });

const vlSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  description: 'AAPL daily OHLC',
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

