import { financeEnsureSessionEnv, uiOpenWindows } from '@tools';

// Ensure the external web UI session exists
financeEnsureSessionEnv();

// Open three WinBox windows with simple content
uiOpenWindows({
  windows: [
    {
      title: 'Screener',
      x: 24,
      y: 80,
      width: 380,
      height: 320,
      html: `
        <div style="padding:12px">
          <h3 style="margin:0 0 8px">Screener</h3>
          <div style="margin-bottom:8px;color:#667085;font-size:12px">Mock results</div>
          <table style="width:100%;border-collapse:collapse;background:#fff">
            <thead><tr><th align="left" style="padding:6px 8px;border-bottom:1px solid #eee">Symbol</th><th align="right" style="padding:6px 8px;border-bottom:1px solid #eee">Price</th></tr></thead>
            <tbody>
              <tr><td style="padding:6px 8px;border-bottom:1px solid #f5f5f5">AAPL</td><td align="right" style="padding:6px 8px;border-bottom:1px solid #f5f5f5">178.23</td></tr>
              <tr><td style="padding:6px 8px;border-bottom:1px solid #f5f5f5">MSFT</td><td align="right" style="padding:6px 8px;border-bottom:1px solid #f5f5f5">415.66</td></tr>
              <tr><td style="padding:6px 8px;border-bottom:1px solid #f5f5f5">NVDA</td><td align="right" style="padding:6px 8px;border-bottom:1px solid #f5f5f5">950.12</td></tr>
              <tr><td style="padding:6px 8px;border-bottom:1px solid #f5f5f5">AMZN</td><td align="right" style="padding:6px 8px;border-bottom:1px solid #f5f5f5">182.77</td></tr>
            </tbody>
          </table>
        </div>
      `
    },
    {
      title: 'Chart — AAPL',
      x: 'center',
      y: 40,
      width: 520,
      height: 220,
      html: `
        <div style="padding:12px">
          <h3 style="margin:0 0 8px">Chart — AAPL</h3>
          <div style="color:#667085;font-size:12px">Placeholder chart (use uiAppendChart for real)</div>
          <div style="height:140px;background:#fff;border:1px solid #eee;border-radius:8px"></div>
        </div>
      `
    },
    {
      title: 'Filings — AAPL',
      x: 'right',
      y: 80,
      width: 520,
      height: 320,
      html: `
        <div style="padding:12px">
          <h3 style="margin:0 0 8px">Filings — AAPL</h3>
          <ul style="list-style:none;padding:0;margin:0">
            <li style="padding:6px 8px;background:#eef2ff;border:1px solid #eee;margin-bottom:6px;border-radius:6px">10-Q (Q2) — 2024-08-02</li>
            <li style="padding:6px 8px;background:#fff;border:1px solid #eee;margin-bottom:6px;border-radius:6px">8-K — 2024-07-18</li>
            <li style="padding:6px 8px;background:#fff;border:1px solid #eee;margin-bottom:6px;border-radius:6px">10-K (FY) — 2024-02-03</li>
          </ul>
        </div>
      `
    }
  ]
});

export default { ok: true };

