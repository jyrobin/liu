#!/usr/bin/env node
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 5180);
const DATA_DIR = path.join(__dirname, 'data');
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

async function loadIndex() {
  try { const t = await fs.readFile(SESS_INDEX, 'utf8'); return JSON.parse(t); }
  catch { return { sessions: {} }; }
}

async function saveIndex(idx) { await fs.writeFile(SESS_INDEX, JSON.stringify(idx, null, 2)); }

async function loadSessionFile(id) {
  const p = path.join(SESS_DIR, `${id}.json`);
  try { const t = await fs.readFile(p, 'utf8'); return JSON.parse(t); }
  catch { return null; }
}

async function saveSessionFile(id, obj) {
  const p = path.join(SESS_DIR, `${id}.json`);
  await fs.writeFile(p, JSON.stringify(obj, null, 2));
}

function getSession(id) {
  if (!sessions.has(id)) sessions.set(id, { meta: null, blocks: [], clients: new Set() });
  return sessions.get(id);
}

async function initSession({ id, title }) {
  const now = Date.now();
  const meta = { sessionId: id, title: title || '', createdAt: now, updatedAt: now, deleted: false };
  const rec = { meta, blocks: [] };
  sessions.set(id, { ...rec, clients: new Set() });
  const idx = await loadIndex();
  idx.sessions[id] = { sessionId: id, title: meta.title, createdAt: meta.createdAt, updatedAt: meta.updatedAt, deleted: false };
  await saveIndex(idx);
  await saveSessionFile(id, rec);
  return rec;
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
  if (!s) {
    s = await initSession({ id: sessionId, title: block?.title || '' });
  }
  const b = { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, ts: Date.now(), ...block };
  s.blocks.push(b);
  s.meta.updatedAt = b.ts;
  await saveSessionFile(sessionId, { meta: s.meta, blocks: s.blocks });
  const idx = await loadIndex();
  if (idx.sessions[sessionId]) { idx.sessions[sessionId].updatedAt = s.meta.updatedAt; await saveIndex(idx); }
  for (const res of s.clients) {
    try { sseSend(res, 'block', b); } catch { /* ignore */ }
  }
  return b;
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

function json(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); }
function notFound(res) { res.writeHead(404); res.end('Not found'); }

function serveStatic(req, res, pathname) {
  const root = path.join(__dirname, 'public');
  const file = pathname === '/' ? '/index.html' : pathname;
  const p = path.join(root, file.replace(/^\/+/, ''));
  if (!p.startsWith(root)) return notFound(res);
  const ext = path.extname(p).toLowerCase();
  const type = ext === '.html' ? 'text/html' : ext === '.js' ? 'text/javascript' : ext === '.css' ? 'text/css' : 'text/plain';
  fssync.readFile(p, (err, buf) => {
    if (err) { notFound(res); return; }
    res.writeHead(200, { 'Content-Type': type });
    res.end(buf);
  });
}

await ensureDataDirs();

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = urlObj;
  try {
    if (req.method === 'GET' && pathname === '/api/sessions') {
      const idx = await loadIndex();
      const items = Object.values(idx.sessions).filter(s => !s.deleted).sort((a,b) => (b.updatedAt||0)-(a.updatedAt||0));
      return json(res, 200, { sessions: items });
    }
    if (req.method === 'POST' && pathname === '/api/session/init') {
      const body = await readJson(req);
      const sid = String(body.sessionId || `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`);
      const title = String(body.title || '');
      const existing = await ensureLoaded(sid);
      if (!existing) await initSession({ id: sid, title });
      const s = await ensureLoaded(sid);
      return json(res, 200, { ok: true, sessionId: sid, title: s?.meta?.title || title });
    }
    if (req.method === 'POST' && pathname === '/api/append') {
      const body = await readJson(req);
      const sessionId = String(body.sessionId || '').trim();
      if (!sessionId) return json(res, 400, { error: 'sessionId required' });
      const block = body.block || {};
      const saved = await appendBlock(sessionId, block);
      return json(res, 200, { ok: true, block: saved });
    }
    if (req.method === 'POST' && pathname === '/api/reset') {
      const body = await readJson(req);
      const sessionId = String(body.sessionId || '').trim();
      if (!sessionId) return json(res, 400, { error: 'sessionId required' });
      const s = getSession(sessionId);
      sessions.set(sessionId, { meta: s.meta || { sessionId, title: '', createdAt: Date.now(), updatedAt: Date.now(), deleted: false }, blocks: [], clients: new Set() });
      await saveSessionFile(sessionId, { meta: sessions.get(sessionId).meta, blocks: [] });
      return json(res, 200, { ok: true });
    }
    if (req.method === 'POST' && pathname === '/api/session/delete') {
      const body = await readJson(req);
      const sessionId = String(body.sessionId || '').trim();
      if (!sessionId) return json(res, 400, { error: 'sessionId required' });
      const idx = await loadIndex();
      if (!idx.sessions[sessionId]) return json(res, 404, { error: 'not found' });
      idx.sessions[sessionId].deleted = true;
      await saveIndex(idx);
      const sess = await ensureLoaded(sessionId);
      if (sess && sess.meta) { sess.meta.deleted = true; await saveSessionFile(sessionId, { meta: sess.meta, blocks: sess.blocks }); }
      return json(res, 200, { ok: true });
    }
    if (req.method === 'GET' && pathname === '/api/stream') {
      const sessionId = urlObj.searchParams.get('sessionId');
      if (!sessionId) { res.writeHead(400); res.end('sessionId required'); return; }
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      const s = await ensureLoaded(sessionId) || getSession(sessionId);
      // Replay from disk (if any)
      const disk = await loadSessionFile(sessionId);
      const blocks = disk?.blocks || s.blocks || [];
      for (const b of blocks) sseSend(res, 'block', b);
      // Subscribe
      s.clients.add(res);
      req.on('close', () => { s.clients.delete(res); });
      return;
    }
    // Static
    return serveStatic(req, res, pathname);
  } catch (e) {
    json(res, 500, { error: String(e?.message || e) });
  }
});

server.listen(PORT, () => {
  console.log(`Finance Web listening on http://localhost:${PORT}`);
});
