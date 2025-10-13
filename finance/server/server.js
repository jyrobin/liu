#!/usr/bin/env node
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 5280);
const WEB_ROOT = path.join(__dirname, '..', 'web', 'public');
const DATA_DIR = path.join(__dirname, '..', 'data');
const SESS_DIR = path.join(DATA_DIR, 'sessions');
const SESS_INDEX = path.join(DATA_DIR, 'sessions.json');

// In-memory sessions: id -> { meta, blocks, clients }
const sessions = new Map();

async function ensureDataDirs() {
  await fs.mkdir(SESS_DIR, { recursive: true });
  if (!fssync.existsSync(SESS_INDEX)) {
    await fs.writeFile(SESS_INDEX, JSON.stringify({ sessions: {} }, null, 2));
  }
}

async function loadIndex() { try { const t = await fs.readFile(SESS_INDEX, 'utf8'); return JSON.parse(t); } catch { return { sessions: {} }; } }
async function saveIndex(idx) { await fs.writeFile(SESS_INDEX, JSON.stringify(idx, null, 2)); }
async function loadSessionFile(id) { try { const t = await fs.readFile(path.join(SESS_DIR, `${id}.json`), 'utf8'); return JSON.parse(t); } catch { return null; } }
async function saveSessionFile(id, obj) { await fs.writeFile(path.join(SESS_DIR, `${id}.json`), JSON.stringify(obj, null, 2)); }

function getSession(id) { if (!sessions.has(id)) sessions.set(id, { meta: null, blocks: [], clients: new Set() }); return sessions.get(id); }

async function initSession({ id, title }) {
  const now = Date.now();
  const meta = { sessionId: id, title: title || '', createdAt: now, updatedAt: now, deleted: false };
  sessions.set(id, { meta, blocks: [], clients: new Set() });
  const idx = await loadIndex();
  idx.sessions[id] = { sessionId: id, title: meta.title, createdAt: meta.createdAt, updatedAt: meta.updatedAt, deleted: false };
  await saveIndex(idx);
  await saveSessionFile(id, { meta, blocks: [] });
  return { meta, blocks: [] };
}

async function ensureLoaded(id) {
  const s = getSession(id);
  if (s.meta) return s;
  const disk = await loadSessionFile(id);
  if (disk) { sessions.set(id, { ...disk, clients: s.clients || new Set() }); return sessions.get(id); }
  return null;
}

function sseSend(res, event, data) {
  const line = typeof data === 'string' ? data : JSON.stringify(data);
  res.write(`event: ${event}\n`);
  res.write(`data: ${line}\n\n`);
}

async function appendBlock(sessionId, block) {
  let s = await ensureLoaded(sessionId);
  if (!s) s = await initSession({ id: sessionId, title: block?.title || '' });
  const b = { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, ts: Date.now(), ...block };
  s.blocks.push(b);
  s.meta.updatedAt = b.ts;
  await saveSessionFile(sessionId, { meta: s.meta, blocks: s.blocks });
  const idx = await loadIndex();
  if (idx.sessions[sessionId]) { idx.sessions[sessionId].updatedAt = s.meta.updatedAt; await saveIndex(idx); }
  for (const res of s.clients) { try { sseSend(res, 'block', b); } catch {} }
  return b;
}

async function readJson(req) { const chunks = []; for await (const c of req) chunks.push(c); const t = Buffer.concat(chunks).toString('utf8'); try { return t ? JSON.parse(t) : {}; } catch { return {}; } }
function json(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); }
function notFound(res) { res.writeHead(404); res.end('Not found'); }

function serveStatic(req, res, pathname) {
  const file = pathname === '/' ? '/index.html' : pathname;
  const p = path.join(WEB_ROOT, file.replace(/^\/+/, ''));
  if (!p.startsWith(WEB_ROOT)) return notFound(res);
  const ext = path.extname(p).toLowerCase();
  const type = ext === '.html' ? 'text/html' : ext === '.js' ? 'text/javascript' : ext === '.css' ? 'text/css' : 'text/plain';
  fssync.readFile(p, (err, buf) => { if (err) { notFound(res); return; } res.writeHead(200, { 'Content-Type': type }); res.end(buf); });
}

await ensureDataDirs();

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = urlObj;
  try {
    // WinBox assets from refs
    if (req.method === 'GET' && pathname.startsWith('/_refs/winbox/')) {
      const rel = pathname.replace('/_refs/winbox/', '');
      const base = path.join(__dirname, '..', '..', 'refs', 'winbox', 'dist');
      const p = path.join(base, rel);
      if (!p.startsWith(base)) return notFound(res);
      const ext = path.extname(p).toLowerCase();
      const type = ext === '.html' ? 'text/html' : ext === '.js' ? 'text/javascript' : ext === '.css' ? 'text/css' : 'application/octet-stream';
      fssync.readFile(p, (err, buf) => { if (err) { notFound(res); return; } res.writeHead(200, { 'Content-Type': type }); res.end(buf); });
      return;
    }
    // run a Liu plan via CLI
    if (req.method === 'POST' && pathname === '/api/run-plan') {
      const body = await readJson(req);
      const plan = String(body.plan || '').trim();
      if (!plan) return json(res, 400, { error: 'plan required' });
      const sessionId = String(body.sessionId || '').trim();
      const name = String(body.name || 'web');
      const title = String(body.title || 'Web Triggered');
      const workspace = path.resolve(__dirname, '..', 'workspace');
      const baseUrl = `http://${req.headers.host}`;
      // spawn: node ../../bin/liu.js --domain-root finance/domain run-plan <plan> --workspace ... --run-id ... --force
      const cli = path.resolve(__dirname, '..', '..', 'bin', 'liu.js');
      const args = [cli, '--domain-root', path.resolve(__dirname, '..', 'domain'), 'run-plan', plan, '--workspace', workspace, '--run-id', `web_${Date.now()}`, '--force'];
      const env = { ...process.env, FINANCE_WEB_URL: baseUrl, FINANCE_SESSION_STORE: path.resolve(__dirname, '..', 'workspace', '.finance-sessions.json'), FIN_SESSION_NAME: name, FIN_SESSION_TITLE: title };
      if (sessionId) env.FIN_SESSION_ID = sessionId;
      try {
        if (sessionId) {
          await appendBlock(sessionId, { kind: 'text', title: 'Run Plan', text: `Launching plan: ${plan}` });
        }
        const { spawn } = await import('node:child_process');
        const child = spawn(process.execPath, args, { env, stdio: 'ignore', detached: false });
        child.on('exit', async (code) => {
          try {
            if (sessionId) await appendBlock(sessionId, { kind: 'text', title: 'Plan Finished', text: `Plan ${plan} exited with code ${code}` });
          } catch {}
        });
        return json(res, 200, { ok: true });
      } catch (e) {
        return json(res, 500, { error: String(e?.message || e) });
      }
    }
    // sessions list
    if (req.method === 'GET' && pathname === '/api/sessions') {
      const idx = await loadIndex();
      const items = Object.values(idx.sessions).filter(s => !s.deleted).sort((a,b) => (b.updatedAt||0)-(a.updatedAt||0));
      return json(res, 200, { sessions: items });
    }
    // init session
    if (req.method === 'POST' && pathname === '/api/session/init') {
      const body = await readJson(req);
      const sid = String(body.sessionId || `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`);
      const title = String(body.title || '');
      const existing = await ensureLoaded(sid);
      if (!existing) await initSession({ id: sid, title });
      const s = await ensureLoaded(sid);
      return json(res, 200, { ok: true, sessionId: sid, title: s?.meta?.title || title });
    }
    // append block
    if (req.method === 'POST' && pathname === '/api/append') {
      const body = await readJson(req);
      const sessionId = String(body.sessionId || '').trim();
      if (!sessionId) return json(res, 400, { error: 'sessionId required' });
      const block = body.block || {};
      const saved = await appendBlock(sessionId, block);
      return json(res, 200, { ok: true, block: saved });
    }
    // remove a specific window (by block id) and notify clients
    if (req.method === 'POST' && pathname === '/api/windows/remove') {
      const body = await readJson(req);
      const sessionId = String(body.sessionId || '').trim();
      const blockId = String(body.blockId || '').trim();
      if (!sessionId || !blockId) return json(res, 400, { error: 'sessionId and blockId required' });
      const s = await ensureLoaded(sessionId) || getSession(sessionId);
      const before = (s.blocks || []).length;
      s.blocks = (s.blocks || []).filter(b => !(b && b.kind === 'winbox' && b.id === blockId));
      await saveSessionFile(sessionId, { meta: s.meta || { sessionId, title: '', createdAt: Date.now(), updatedAt: Date.now(), deleted: false }, blocks: s.blocks });
      // broadcast close event (not persisted)
      for (const res2 of s.clients) { try { sseSend(res2, 'block', { kind: 'winbox-close', targetId: blockId }); } catch {} }
      return json(res, 200, { ok: true, removed: before - (s.blocks || []).length });
    }
    // clear all windows and notify clients
    if (req.method === 'POST' && pathname === '/api/windows/clear') {
      const body = await readJson(req);
      const sessionId = String(body.sessionId || '').trim();
      if (!sessionId) return json(res, 400, { error: 'sessionId required' });
      const s = await ensureLoaded(sessionId) || getSession(sessionId);
      const before = (s.blocks || []).length;
      s.blocks = (s.blocks || []).filter(b => !(b && b.kind === 'winbox'));
      await saveSessionFile(sessionId, { meta: s.meta || { sessionId, title: '', createdAt: Date.now(), updatedAt: Date.now(), deleted: false }, blocks: s.blocks });
      for (const res2 of s.clients) { try { sseSend(res2, 'block', { kind: 'winbox-clear' }); } catch {} }
      return json(res, 200, { ok: true, removed: before - (s.blocks || []).length });
    }
    // reset: clear all blocks (feed + windows) for a session
    if (req.method === 'POST' && pathname === '/api/reset') {
      const body = await readJson(req);
      const sessionId = String(body.sessionId || '').trim();
      if (!sessionId) return json(res, 400, { error: 'sessionId required' });
      const s = await ensureLoaded(sessionId) || getSession(sessionId);
      s.blocks = [];
      await saveSessionFile(sessionId, { meta: s.meta || { sessionId, title: '', createdAt: Date.now(), updatedAt: Date.now(), deleted: false }, blocks: [] });
      for (const res2 of s.clients) { try { sseSend(res2, 'block', { kind: 'reset' }); } catch {} }
      return json(res, 200, { ok: true });
    }
    // stream
    if (req.method === 'GET' && pathname === '/api/stream') {
      const sessionId = urlObj.searchParams.get('sessionId');
      if (!sessionId) { res.writeHead(400); res.end('sessionId required'); return; }
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' });
      const s = await ensureLoaded(sessionId) || getSession(sessionId);
      const disk = await loadSessionFile(sessionId);
      const blocks = disk?.blocks || s.blocks || [];
      for (const b of blocks) sseSend(res, 'block', b);
      s.clients.add(res); req.on('close', () => { s.clients.delete(res); });
      return;
    }
    // static
    return serveStatic(req, res, pathname);
  } catch (e) {
    json(res, 500, { error: String(e?.message || e) });
  }
});

server.listen(PORT, () => { console.log(`Finance (full) listening on http://localhost:${PORT}`); });
