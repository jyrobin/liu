const streamEl = document.getElementById('stream');
streamEl.className = 'stream';
const WINBOX_REGISTRY = {};

function block(title, payload) {
  const el = document.createElement('div'); el.className = 'block';
  const h = document.createElement('div'); h.className = 'title'; h.textContent = title; el.appendChild(h);
  const pre = document.createElement('div'); pre.className = 'payload'; pre.textContent = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2); el.appendChild(pre);
  streamEl.appendChild(el); el.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

async function post(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body||{}) });
  return await r.json();
}

function handleBlock(b) {
  if (b.kind === 'request') return block('Request', b.text || '');
  if (b.kind === 'plan') return block('Plan', b.code || '');
  if (b.kind === 'text') return block(b.title || 'Text', b.text || '');
  if (b.kind === 'chart') return block('Chart', 'Use examples/finance web for chart rendering');
  if (b.kind === 'winbox') return openWinBox(b);
  if (b.kind === 'winbox-close') return closeWinBoxById(b.targetId);
  if (b.kind === 'winbox-clear') return closeAllWinBoxes();
  return block('Block', b);
}

function openWinBox(opts) {
  if (typeof WinBox === 'undefined') return block('WinBox missing', 'WinBox library not loaded');
  const { id, title = 'Window', x, y, width, height, top, right, bottom, left, className, html } = opts || {};
  const blockId = opts && opts.id ? String(opts.id) : String(Date.now());
  try {
    const wb = WinBox.new({ id: blockId, title, x, y, width, height, top, right, bottom, left, class: className, onclose: () => { try { if (window.__FIN_SESSION_ID) post('/api/windows/remove', { sessionId: window.__FIN_SESSION_ID, blockId: blockId }); } catch {} return false; } });
    if (html) wb.body.innerHTML = String(html);
    WINBOX_REGISTRY[blockId] = wb;
  }
  catch (e) { return block('WinBox error', String(e?.message || e)); }
}

function closeWinBoxById(id) {
  if (!id) return;
  const wb = WINBOX_REGISTRY[id];
  if (wb && typeof wb.close === 'function') {
    try { wb.close(true); } catch {}
  }
  delete WINBOX_REGISTRY[id];
}

function closeAllWinBoxes() {
  for (const id of Object.keys(WINBOX_REGISTRY)) {
    closeWinBoxById(id);
  }
}

async function connectOrInit() {
  // pick the latest session or init a new one
  const idx = await fetch('/api/sessions').then(r => r.json()).catch(() => ({ sessions: [] }));
  let sessionId = idx.sessions?.[0]?.sessionId;
  if (!sessionId) { const r = await post('/api/session/init', { title: 'Finance Full Demo' }); sessionId = r.sessionId; }
  const url = `/api/stream?sessionId=${encodeURIComponent(sessionId)}`;
  const evt = new EventSource(url);
  evt.addEventListener('block', (e) => { try { handleBlock(JSON.parse(e.data)); } catch {} });
  // create main window with chat
  createMainWindow(sessionId);
  window.__FIN_SESSION_ID = sessionId;
}

function createMainWindow(sessionId) {
  const main = WinBox.new({ id: 'main', title: 'Main', x: 12, y: 12, width: 520, height: 260, class: 'no-close' });
  const root = document.createElement('div'); root.style.padding = '10px';
  root.innerHTML = `
    <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px">
      <button id="open-screener">Screener</button>
      <button id="open-chart">Chart</button>
      <button id="open-filings">Filings</button>
      <button id="run-demo-plan">Run Demo Plan</button>
      <button id="close-all-windows">Close All Windows</button>
    </div>
    <div>
      <div style="color:#667085; font-size:12px; margin-bottom:6px">Ask (NL) — returns plan preview:</div>
      <form id="chat-form" style="display:flex; gap:6px">
        <input id="chat-input" placeholder="e.g., Show AAPL OHLC last month" style="flex:1; padding:6px" />
        <button type="submit">Send</button>
      </form>
    </div>
  `;
  main.body.appendChild(root);

  const form = root.querySelector('#chat-form');
  const input = root.querySelector('#chat-input');
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); const text = input.value.trim(); if (!text) return;
    await post('/api/append', { sessionId, block: { kind: 'request', text } });
    // naive stub: synthesize a plan preview string
    const code = `import { financeEnsureSessionEnv, fetchDailyOHLC, uiAppendChart } from '@tools';\n\nfinanceEnsureSessionEnv();\nconst data = fetchDailyOHLC({ symbol: 'AAPL', period: '1M' });\nuiAppendChart({ spec: {/* ... */}, data: data.rows });`;
    await post('/api/append', { sessionId, block: { kind: 'plan', code } });
  });

  root.querySelector('#open-screener').addEventListener('click', async () => {
    await post('/api/append', { sessionId, block: { kind: 'winbox', title: 'Screener', x: 560, y: 12, width: 380, height: 320, html: '<div style="padding:12px">Screener placeholder</div>' } });
  });
  root.querySelector('#open-chart').addEventListener('click', async () => {
    await post('/api/append', { sessionId, block: { kind: 'winbox', title: 'Chart — AAPL', x: 'center', y: 40, width: 520, height: 220, html: '<div style="padding:12px">Chart placeholder</div>' } });
  });
  root.querySelector('#open-filings').addEventListener('click', async () => {
    await post('/api/append', { sessionId, block: { kind: 'winbox', title: 'Filings — AAPL', x: 'right', y: 80, width: 520, height: 320, html: '<div style="padding:12px">Filings placeholder</div>' } });
  });

  root.querySelector('#run-demo-plan').addEventListener('click', async () => {
    await post('/api/run-plan', { plan: 'market_filings_demo', sessionId, name: 'web', title: 'Web Demo Plan' });
  });

  root.querySelector('#close-all-windows').addEventListener('click', async () => {
    await post('/api/windows/clear', { sessionId });
  });
}

connectOrInit();
