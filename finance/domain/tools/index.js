import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import cp from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEB_URL = process.env.FINANCE_WEB_URL || 'http://localhost:5280';
const STORE_PATH = process.env.FINANCE_SESSION_STORE || path.resolve(process.cwd(), '.finance-sessions.json');

function readStoreSync() { try { const t = fsSync.readFileSync(STORE_PATH, 'utf8'); return JSON.parse(t); } catch { return { active: null, byName: {} }; } }
function writeStoreSync(s) { fsSync.writeFileSync(STORE_PATH, JSON.stringify(s, null, 2)); }
function ensureUrl(u) { return (u || WEB_URL).replace(/\/$/, ''); }

function postJSONSync(url, body) {
  const args = ['-sS', '-X', 'POST', url, '-H', 'content-type: application/json', '-d', JSON.stringify(body)];
  const out = cp.execFileSync('curl', args, { encoding: 'utf8' });
  try { return JSON.parse(out || '{}'); } catch { return {}; }
}

export function financeEnsureSession({ name, title, serverUrl }) {
  const url = ensureUrl(serverUrl);
  const store = readStoreSync();
  if (store.byName[name]) { store.active = name; writeStoreSync(store); return { ok: true, name, sessionId: store.byName[name].sessionId, serverUrl: store.byName[name].serverUrl, reused: true }; }
  const resp = postJSONSync(`${url}/api/session/init`, { title: title || name, sessionId: null });
  const sessionId = resp.sessionId;
  store.byName[name] = { sessionId, serverUrl: url, title: resp.title || title || name, createdAt: Date.now() };
  store.active = name; writeStoreSync(store);
  postJSONSync(`${url}/api/append`, { sessionId, block: { kind: 'session', title: resp.title || title || name } });
  return { ok: true, name, sessionId, serverUrl: url, reused: false };
}

export function financeEnsureSessionEnv() {
  const name = process.env.FIN_SESSION_NAME || 'demo';
  const title = process.env.FIN_SESSION_TITLE || name;
  const serverUrl = process.env.FINANCE_WEB_URL || WEB_URL;
  return financeEnsureSession({ name, title, serverUrl });
}

export function financeUseSession({ name }) { const store = readStoreSync(); if (!store.byName[name]) throw new Error(`Unknown session name: ${name}`); store.active = name; writeStoreSync(store); return { ok: true, name, sessionId: store.byName[name].sessionId }; }
export function financeCurrentSession() { const store = readStoreSync(); const name = store.active; if (!name) return { active: null }; return { active: name, ...store.byName[name] }; }
export function financeRemoveSession({ name }) { const store = readStoreSync(); if (store.byName[name]) delete store.byName[name]; if (store.active === name) store.active = null; writeStoreSync(store); return { ok: true }; }

function getActiveMappingSync(explicitSessionId) {
  if (explicitSessionId) return { sessionId: explicitSessionId, serverUrl: WEB_URL };
  const store = readStoreSync();
  const name = store.active; if (!name) throw new Error('No active session. Call financeEnsureSession or financeUseSession first.');
  const rec = store.byName[name]; if (!rec) throw new Error('Active session mapping missing.');
  return { sessionId: rec.sessionId, serverUrl: rec.serverUrl };
}

export function uiAppendRequest({ sessionId, text }) { const map = getActiveMappingSync(sessionId); postJSONSync(`${ensureUrl(map.serverUrl)}/api/append`, { sessionId: map.sessionId, block: { kind: 'request', text: String(text || '') } }); return { ok: true }; }
export function uiAppendText({ sessionId, title, text }) { const map = getActiveMappingSync(sessionId); postJSONSync(`${ensureUrl(map.serverUrl)}/api/append`, { sessionId: map.sessionId, block: { kind: 'text', title: title || '', text: String(text || '') } }); return { ok: true }; }
export function uiAppendChart({ sessionId, spec, data }) { const map = getActiveMappingSync(sessionId); postJSONSync(`${ensureUrl(map.serverUrl)}/api/append`, { sessionId: map.sessionId, block: { kind: 'chart', spec: spec || {}, data: Array.isArray(data) ? data : [] } }); return { ok: true }; }

export function uiOpenWindow({ sessionId, title, x, y, width, height, top, right, bottom, left, className, html }) {
  const map = getActiveMappingSync(sessionId);
  const block = { kind: 'winbox', title: title || 'Window', x, y, width, height, top, right, bottom, left, className, html };
  postJSONSync(`${ensureUrl(map.serverUrl)}/api/append`, { sessionId: map.sessionId, block });
  return { ok: true };
}
export function uiOpenWindows({ sessionId, windows }) { const map = getActiveMappingSync(sessionId); if (!Array.isArray(windows)) return { ok: false }; for (const w of windows) { const block = { kind: 'winbox', ...(w || {}) }; postJSONSync(`${ensureUrl(map.serverUrl)}/api/append`, { sessionId: map.sessionId, block }); } return { ok: true }; }

export function fetchDailyOHLC({ symbol = 'AAPL', period = '1M' }) {
  // Reuse example dataset for now
  const exData = path.join(__dirname, '..', '..', 'examples', 'finance', 'domain', 'data', 'aapl_ohlc_month.json');
  const fallback = path.join(__dirname, '..', 'data', 'aapl_ohlc_month.json');
  const p = fsSync.existsSync(exData) ? exData : fallback;
  const text = fsSync.readFileSync(p, 'utf8');
  const rows = JSON.parse(text);
  return { symbol, period, rows };
}

