import { financeEnsureSessionEnv, uiAppendRequest, getDailyBars, enrichSMA, uiAppendChart, listFilings, getFilingSections, uiOpenWindow } from '@tools';

// Ensure session (uses FIN_SESSION_ID if provided by the caller)
financeEnsureSessionEnv();

// Announce intent
uiAppendRequest({ text: 'Market + Filings demo: append AAPL chart and open a filings window.' });

// Market data: sample AAPL daily bars with SMA overlay
const bars = getDailyBars({ symbol: 'AAPL' });
const withSMA = enrichSMA({ bars, period: 10 });

const vlSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  description: 'AAPL daily OHLC with SMA(10)',
  width: 700,
  height: 300,
  layer: [
    { mark: { type: 'rule', tooltip: true }, encoding: { x: { field: 'date', type: 'temporal' }, y: { field: 'low', type: 'quantitative' }, y2: { field: 'high' }, color: { value: '#888' } } },
    { mark: { type: 'bar', tooltip: true }, encoding: { x: { field: 'date', type: 'temporal' }, y: { field: 'open', type: 'quantitative' }, y2: { field: 'close' }, color: { condition: { test: 'datum.close > datum.open', value: '#2ca02c' }, value: '#d62728' } } },
    { mark: { type: 'line', color: '#1d4ed8', tooltip: true }, encoding: { x: { field: 'date', type: 'temporal' }, y: { field: 'sma', type: 'quantitative', title: 'SMA(10)' } } }
  ]
};

uiAppendChart({ spec: vlSpec, data: withSMA.rows });

// Filings: mock list + sections and open a WinBox with summary
const fl = listFilings({ symbol: 'AAPL', limit: 3 });
const firstId = fl.rows && fl.rows.length ? fl.rows[0].id : '';
const sec = getFilingSections({ symbol: 'AAPL', filingId: firstId });

const f0 = (fl.rows && fl.rows.length > 0) ? fl.rows[0] : null;
const f1 = (fl.rows && fl.rows.length > 1) ? fl.rows[1] : null;
const f2 = (fl.rows && fl.rows.length > 2) ? fl.rows[2] : null;

const s0 = (sec.sections && sec.sections.length > 0) ? sec.sections[0] : null;
const s1 = (sec.sections && sec.sections.length > 1) ? sec.sections[1] : null;
const s2 = (sec.sections && sec.sections.length > 2) ? sec.sections[2] : null;

const html = (
  '<div style="padding:12px">' +
  '<h3 style="margin:0 0 8px">Filings — AAPL</h3>' +
  '<div style="margin-bottom:8px;color:#667085;font-size:12px">Latest:</div>' +
  '<ul style="list-style:none;padding:0;margin:0">' +
  (f0 ? ('<li style=\"padding:6px 8px;border:1px solid #eee;margin-bottom:6px;border-radius:6px;background:#fff\">' + f0.type + ' ' + f0.period + ' — ' + f0.date + '</li>') : '') +
  (f1 ? ('<li style=\"padding:6px 8px;border:1px solid #eee;margin-bottom:6px;border-radius:6px;background:#fff\">' + f1.type + ' ' + f1.period + ' — ' + f1.date + '</li>') : '') +
  (f2 ? ('<li style=\"padding:6px 8px;border:1px solid #eee;margin-bottom:6px;border-radius:6px;background:#fff\">' + f2.type + ' ' + f2.period + ' — ' + f2.date + '</li>') : '') +
  '</ul>' +
  '<div style="margin-top:10px;color:#667085;font-size:12px">Sections:</div>' +
  '<ul style="list-style:none;padding:0;margin:0">' +
  (s0 ? ('<li style=\"padding:6px 8px;border:1px solid #eee;margin-bottom:6px;border-radius:6px;background:#fff\"><b>' + s0.title + '</b><div style=\"color:#667085;font-size:12px\">' + s0.summary + '</div></li>') : '') +
  (s1 ? ('<li style=\"padding:6px 8px;border:1px solid #eee;margin-bottom:6px;border-radius:6px;background:#fff\"><b>' + s1.title + '</b><div style=\"color:#667085;font-size:12px\">' + s1.summary + '</div></li>') : '') +
  (s2 ? ('<li style=\"padding:6px 8px;border:1px solid #eee;margin-bottom:6px;border-radius:6px;background:#fff\"><b>' + s2.title + '</b><div style=\"color:#667085;font-size:12px\">' + s2.summary + '</div></li>') : '') +
  '</ul>' +
  '</div>'
);

uiOpenWindow({ title: 'Filings — AAPL', x: 'right', y: 80, width: 520, height: 320, html: html });

export default { ok: true };
