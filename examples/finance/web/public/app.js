import embed from 'https://cdn.jsdelivr.net/npm/vega-embed@6.25.0/+esm';

const streamEl = document.getElementById('stream');
const sidInput = document.getElementById('sid');
const connectBtn = document.getElementById('connect');
const listEl = document.createElement('div');
listEl.className = 'sessions';
document.getElementById('app').insertBefore(listEl, streamEl);

function block(title, payload) {
  const el = document.createElement('div');
  el.className = 'block';
  const h = document.createElement('div');
  h.className = 'title';
  h.textContent = title;
  el.appendChild(h);
  const pre = document.createElement('div');
  pre.className = 'payload';
  pre.textContent = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
  el.appendChild(pre);
  streamEl.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

async function renderChart(spec, data) {
  const el = document.createElement('div');
  el.className = 'block chart';
  streamEl.appendChild(el);
  try {
    const s = { ...spec };
    if (data) s.data = { values: data };
    await embed(el, s, { actions: false });
  } catch (e) {
    el.textContent = 'Chart render error: ' + (e?.message || e);
  }
}

function handleBlock(b) {
  if (b.kind === 'request') return block('Request', b.text || '');
  if (b.kind === 'plan') return block('Plan', b.code || '');
  if (b.kind === 'text') return block(b.title || 'Text', b.text || '');
  if (b.kind === 'table') return block(b.title || 'Table', b.rows || []);
  if (b.kind === 'chart') return renderChart(b.spec || {}, b.data || null);
  if (b.kind === 'winbox') return openWinBox(b);
  return block('Block', b);
}

function connect(sessionId) {
  streamEl.innerHTML = '';
  const url = `/api/stream?sessionId=${encodeURIComponent(sessionId)}`;
  const evt = new EventSource(url);
  evt.addEventListener('open', () => block('connected', { sessionId }));
  evt.addEventListener('error', () => block('error', { sessionId }));
  evt.addEventListener('block', (e) => {
    try { handleBlock(JSON.parse(e.data)); } catch { /* ignore */ }
  });
  return evt;
}

function main() {
  const sp = new URLSearchParams(location.search);
  const sid = sp.get('sessionId') || '';
  if (sid) { sidInput.value = sid; connect(sid); }
  connectBtn.onclick = () => { const v = sidInput.value.trim(); if (v) connect(v); };
  refreshSessions();
}

main();

async function refreshSessions() {
  try {
    const r = await fetch('/api/sessions');
    const j = await r.json();
    const items = (j.sessions || []);
    if (!items.length) { listEl.innerHTML = '<div class="hint">No sessions yet.</div>'; return; }
    listEl.innerHTML = '<div class="hint">Sessions:</div>' + items.map(s => `<div><a href="?sessionId=${encodeURIComponent(s.sessionId)}">${s.title || s.sessionId}</a> <span class="hint">(${new Date(s.updatedAt).toLocaleString()})</span></div>`).join('');
  } catch (e) { /* ignore */ }
}

// --- WinBox support ---
function openWinBox(opts) {
  if (typeof WinBox === 'undefined') return block('WinBox missing', 'WinBox library not loaded');
  const {
    id,
    title = 'Window',
    x, y, width, height,
    top, right, bottom, left,
    className,
    html,
  } = opts || {};
  try {
    const wb = WinBox.new({ id, title, x, y, width, height, top, right, bottom, left, class: className });
    if (html) wb.body.innerHTML = String(html);
  } catch (e) {
    return block('WinBox error', String(e?.message || e));
  }
}
