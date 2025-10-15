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

// Command handler - processes finance domain commands
async function handleCommand(sessionId, command, params) {
  // Log commands for debugging
  console.log(`[Command] ${command}`, params);

  // Handle logging commands
  if (command === 'logStatus') {
    const b = await appendBlock(sessionId, {
      kind: 'log',
      level: params.level || 'info',
      message: params.message || '',
      ts: Date.now()
    });
    return { status: 'success', logId: b.id };
  }

  if (command === 'logProgress') {
    const b = await appendBlock(sessionId, {
      kind: 'progress',
      operation: params.operation || 'Operation',
      current: params.current || 0,
      total: params.total || 100,
      message: params.message
    });
    return { status: 'success', progressId: b.id };
  }

  if (command === 'showRequest') {
    const b = await appendBlock(sessionId, {
      kind: 'request',
      text: params.text || ''
    });
    return { status: 'success', requestId: b.id };
  }

  if (command === 'showMessage') {
    const b = await appendBlock(sessionId, {
      kind: 'text',
      title: params.title || 'Message',
      text: params.text || ''
    });
    return { status: 'success', textId: b.id };
  }

  // Mock implementations for demo (TODO: implement real logic)
  if (command === 'showPriceChart') {
    const { symbol, period, indicators, display } = params;

    // Mock chart data
    const mockSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      description: `${symbol} price chart (${period})`,
      width: 600,
      height: 300,
      mark: 'line',
      encoding: {
        x: { field: 'date', type: 'temporal' },
        y: { field: 'price', type: 'quantitative' }
      }
    };

    const mockData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 150 + Math.random() * 30
    }));

    let chartBlock, windowBlock;
    if (display === 'window' || display === 'both') {
      windowBlock = await appendBlock(sessionId, {
        kind: 'winbox',
        title: `${symbol} Price Chart`,
        x: 'center',
        y: 60,
        width: 700,
        height: 450,
        html: `<div style="padding:20px">
          <h3 style="margin:0 0 16px">$ {symbol} Price Chart</h3>
          <p style="color:#64748b">Period: ${period}</p>
          <p style="color:#64748b">Indicators: ${(indicators || []).join(', ') || 'None'}</p>
          <p style="margin-top:20px;padding:12px;background:#f1f5f9;border-radius:8px">
            📊 Mock chart data - Real implementation would show interactive Vega chart here
          </p>
        </div>`
      });
    }
    if (display === 'feed' || display === 'both') {
      chartBlock = await appendBlock(sessionId, {
        kind: 'chart',
        spec: mockSpec,
        data: mockData,
        windowRefId: windowBlock?.id
      });
    }
    return { status: 'success', chartId: chartBlock?.id, windowId: windowBlock?.id };
  }

  if (command === 'showFundamentals') {
    const { symbol, sections, display } = params;

    let feedBlock;
    if (display === 'feed' || display === 'both') {
      const reportHtml = `<div>
        <div style=\"display:flex;gap:16px\">\n          <div><div style=\"font-size:12px;color:#64748b\">Market Cap</div><div style=\"font-weight:600\">$2.8T</div></div>\n          <div><div style=\"font-size:12px;color:#64748b\">P/E</div><div style=\"font-weight:600\">28.5</div></div>\n          <div><div style=\"font-size:12px;color:#64748b\">EPS</div><div style=\"font-weight:600\">$6.42</div></div>\n        </div>
        <div style=\"margin-top:8px;color:#64748b\">Sections: ${(sections || []).join(', ')}</div>
      </div>`;
      feedBlock = await appendBlock(sessionId, { kind: 'report', title: `${symbol} Fundamentals`, html: reportHtml });
    }

    if (display === 'window' || display === 'both') {
      const windowBlock = await appendBlock(sessionId, {
        kind: 'winbox',
        title: `${symbol} Fundamentals`,
        x: 'right',
        y: 100,
        width: 500,
        height: 600,
        html: `<div style="padding:20px">
          <h3 style="margin:0 0 16px">${symbol} Fundamentals</h3>
          <div style="display:grid;gap:12px">
            <div style="padding:12px;background:#f8fafc;border-radius:8px">
              <div style="color:#64748b;font-size:12px;margin-bottom:4px">Market Cap</div>
              <div style="font-size:18px;font-weight:600">$2.8T</div>
            </div>
            <div style="padding:12px;background:#f8fafc;border-radius:8px">
              <div style="color:#64748b;font-size:12px;margin-bottom:4px">P/E Ratio</div>
              <div style="font-size:18px;font-weight:600">28.5</div>
            </div>
            <div style="padding:12px;background:#f8fafc;border-radius:8px">
              <div style="color:#64748b;font-size:12px;margin-bottom:4px">EPS</div>
              <div style="font-size:18px;font-weight:600">$6.42</div>
            </div>
          </div>
          <p style="margin-top:20px;padding:12px;background:#fef3c7;border-radius:8px;font-size:13px">
            📊 Mock data - Real implementation would fetch from API
          </p>
        </div>`
      });
      if (display === 'both') {
        const linkHtml = `<div style=\"font-size:12px;color:#64748b\">Opened window: ${symbol} Fundamentals</div>`;
        await appendBlock(sessionId, { kind:'report', title: `${symbol} Fundamentals`, html: linkHtml, windowRefId: windowBlock?.id });
      }
      return { status: 'success', feedId: feedBlock?.id, windowId: windowBlock?.id };
    }
    return { status: 'success', feedId: feedBlock?.id };
  }

  if (command === 'showNews') {
    const { symbol, limit, display } = params;
    const mockNews = [
      { title: `${symbol} Reports Strong Q3 Earnings`, source: 'Financial Times', time: '2h ago' },
      { title: `Analysts Upgrade ${symbol} to Buy`, source: 'Bloomberg', time: '5h ago' },
      { title: `${symbol} Announces New Product Line`, source: 'Reuters', time: '1d ago' },
    ].slice(0, limit || 5);

    let feedBlock;
    if (display === 'feed' || display === 'both') {
      feedBlock = await appendBlock(sessionId, {
        kind: 'text',
        title: `${symbol} News`,
        text: mockNews.map(n => `• ${n.title} (${n.source}, ${n.time})`).join('\n')
      });
    }

    if (display === 'window' || display === 'both') {
      const newsHtml = mockNews.map(n => `
        <div style="padding:12px;border-bottom:1px solid #e5e7eb">
          <div style="font-weight:600;margin-bottom:4px">${n.title}</div>
          <div style="font-size:12px;color:#64748b">${n.source} • ${n.time}</div>
        </div>
      `).join('');

      const windowBlock = await appendBlock(sessionId, {
        kind: 'winbox',
        title: `${symbol} News`,
        x: 100,
        y: 100,
        width: 500,
        height: 400,
        html: `<div style="height:100%;overflow:auto">
          <h3 style="margin:0;padding:20px 20px 16px;border-bottom:1px solid #e5e7eb">${symbol} News</h3>
          ${newsHtml}
        </div>`
      });
      return { status: 'success', feedId: feedBlock?.id, windowId: windowBlock?.id };
    }
    return { status: 'success', feedId: feedBlock?.id };
  }

  if (command === 'compareSymbols') {
    const { symbols, metric, period, display } = params;

    let feedBlock;
    if (display === 'feed' || display === 'both') {
      const html = `<div>\n        <div style=\"font-size:13px;color:#64748b\">Metric: ${metric} | Period: ${period}</div>\n        <ul style=\"margin:8px 0 0 16px\">${symbols.map((s)=>`<li>${s}</li>`).join('')}</ul>\n      </div>`;
      feedBlock = await appendBlock(sessionId, { kind:'report', title:'Symbol Comparison', html });
    }

    if (display === 'window' || display === 'both') {
      const windowBlock = await appendBlock(sessionId, {
        kind: 'winbox',
        title: 'Symbol Comparison',
        x: 'center',
        y: 80,
        width: 700,
        height: 500,
        html: `<div style="padding:20px">
          <h3 style="margin:0 0 16px">Comparing: ${symbols.join(', ')}</h3>
          <p style="color:#64748b">Metric: ${metric} | Period: ${period}</p>
          <div style="margin-top:20px;padding:16px;background:#f1f5f9;border-radius:8px">
            📊 Mock comparison chart would appear here
          </div>
        </div>`
      });
      if (display === 'both') {
        const linkHtml = `<div style=\"font-size:12px;color:#64748b\">Opened window: Symbol Comparison</div>`;
        await appendBlock(sessionId, { kind:'report', title: 'Symbol Comparison', html: linkHtml, windowRefId: windowBlock?.id });
      }
      return { status: 'success', feedId: feedBlock?.id, windowId: windowBlock?.id };
    }
    return { status: 'success', feedId: feedBlock?.id };
  }

  if (command === 'compareRatios') {
    const { symbols, ratios, display } = params;

    if (display === 'window' || display === 'both') {
      await appendBlock(sessionId, {
        kind: 'winbox',
        title: 'Ratio Comparison',
        x: 'right',
        y: 120,
        width: 600,
        height: 400,
        html: `<div style="padding:20px">
          <h3 style="margin:0 0 16px">Financial Ratios</h3>
          <p style="color:#64748b;margin-bottom:16px">Symbols: ${symbols.join(', ')}</p>
          <p style="color:#64748b">Ratios: ${(ratios || []).join(', ')}</p>
          <div style="margin-top:20px;padding:16px;background:#f1f5f9;border-radius:8px">
            📊 Mock ratio comparison table would appear here
          </div>
        </div>`
      });
    }
    return;
  }

  // Default: acknowledge unknown command
  await appendBlock(sessionId, {
    kind: 'text',
    title: 'Command Received',
    text: `Command: ${command}\nParams: ${JSON.stringify(params, null, 2)}\n\n⚠️ Mock implementation - add real logic in server.js`
  });
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
          await appendBlock(sessionId, { kind: 'log', level: 'info', message: `Launching plan: ${plan}`, ts: Date.now() });
        }
        const { spawn } = await import('node:child_process');
        const child = spawn(process.execPath, args, { env, stdio: 'ignore', detached: false });
        child.on('exit', async (code) => {
          try {
            if (sessionId) await appendBlock(sessionId, { kind: 'log', level: code === 0 ? 'success' : 'error', message: `Plan ${plan} exited with code ${code}`, ts: Date.now() });
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
    // command endpoint (NEW)
    if (req.method === 'POST' && pathname === '/api/command') {
      const body = await readJson(req);
      const sessionId = String(body.sessionId || '').trim();
      const commandBlock = body.command || {};
      const { command, params } = commandBlock;
      if (!sessionId || !command) return json(res, 400, { error: 'sessionId and command required' });

      try {
        // Handle commands and emit blocks; return metadata result
        const result = await handleCommand(sessionId, command, params || {});
        return json(res, 200, { ok: true, result });
      } catch (e) {
        return json(res, 500, { error: String(e?.message || e) });
      }
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
