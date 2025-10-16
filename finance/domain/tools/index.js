/**
 * Finance Domain Tools — Command Implementation
 *
 * These are THIN WRAPPERS that send commands to the finance service.
 * The service handles all the heavy lifting:
 * - Data fetching and processing
 * - Chart generation
 * - HTML rendering
 * - Complex domain logic
 *
 * Tools simply POST command blocks to /api/command
 */

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import cp from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEB_URL = process.env.FINANCE_WEB_URL || 'http://localhost:5280';
const STORE_PATH = process.env.FINANCE_SESSION_STORE || path.resolve(process.cwd(), '.finance-sessions.json');

function readStoreSync() {
  try {
    const t = fsSync.readFileSync(STORE_PATH, 'utf8');
    return JSON.parse(t);
  } catch {
    return { active: null, byName: {} };
  }
}

function writeStoreSync(s) {
  fsSync.writeFileSync(STORE_PATH, JSON.stringify(s, null, 2));
}

function ensureUrl(u) {
  return (u || WEB_URL).replace(/\/$/, '');
}

function postJSONSync(url, body) {
  const args = [
    '-sS',
    '-X',
    'POST',
    url,
    '-H',
    'content-type: application/json',
    '-d',
    JSON.stringify(body),
  ];
  const out = cp.execFileSync('curl', args, { encoding: 'utf8' });
  try {
    return JSON.parse(out || '{}');
  } catch {
    return {};
  }
}

// ============================================================================
// Session Management
// ============================================================================

export function financeEnsureSession({ name, title, serverUrl }) {
  const url = ensureUrl(serverUrl);
  const store = readStoreSync();
  if (store.byName[name]) {
    store.active = name;
    writeStoreSync(store);
    return {
      ok: true,
      name,
      sessionId: store.byName[name].sessionId,
      serverUrl: store.byName[name].serverUrl,
      reused: true,
    };
  }
  const resp = postJSONSync(`${url}/api/session/init`, { title: title || name, sessionId: null });
  const sessionId = resp.sessionId;
  store.byName[name] = {
    sessionId,
    serverUrl: url,
    title: resp.title || title || name,
    createdAt: Date.now(),
  };
  store.active = name;
  writeStoreSync(store);
  return { ok: true, name, sessionId, serverUrl: url, reused: false };
}

export function financeEnsureSessionEnv() {
  const name = process.env.FIN_SESSION_NAME || 'demo';
  const title = process.env.FIN_SESSION_TITLE || name;
  const serverUrl = process.env.FINANCE_WEB_URL || WEB_URL;
  const providedId = process.env.FIN_SESSION_ID || '';

  if (providedId) {
    const url = ensureUrl(serverUrl);
    const store = readStoreSync();
    store.byName[name] = { sessionId: providedId, serverUrl: url, title, createdAt: Date.now() };
    store.active = name;
    writeStoreSync(store);
    return { ok: true, name, sessionId: providedId, serverUrl: url, reused: true };
  }
  return financeEnsureSession({ name, title, serverUrl });
}

export function financeUseSession({ name }) {
  const store = readStoreSync();
  if (!store.byName[name]) throw new Error(`Unknown session name: ${name}`);
  store.active = name;
  writeStoreSync(store);
  return { ok: true, name, sessionId: store.byName[name].sessionId };
}

export function financeCurrentSession() {
  const store = readStoreSync();
  const name = store.active;
  if (!name) return { active: null };
  return { active: name, ...store.byName[name] };
}

export function financeRemoveSession({ name }) {
  const store = readStoreSync();
  if (store.byName[name]) delete store.byName[name];
  if (store.active === name) store.active = null;
  writeStoreSync(store);
  return { ok: true };
}

function getActiveMappingSync(explicitSessionId) {
  if (explicitSessionId) return { sessionId: explicitSessionId, serverUrl: WEB_URL };
  const store = readStoreSync();
  const name = store.active;
  if (!name) throw new Error('No active session. Call financeEnsureSession first.');
  const rec = store.byName[name];
  if (!rec) throw new Error('Active session mapping missing.');
  return { sessionId: rec.sessionId, serverUrl: rec.serverUrl };
}

/**
 * Send a command to the finance service
 * The service handles all processing and decides what to render
 */
function sendCommand(command, params) {
  const map = getActiveMappingSync(params.sessionId);
  const url = ensureUrl(map.serverUrl);

  // Send command block to service
  const block = {
    kind: 'command',
    command,
    params: { ...params, sessionId: undefined }, // Remove sessionId from params
  };

  const resp = postJSONSync(`${url}/api/command`, { sessionId: map.sessionId, command: block }) || {};
  return resp.result || { status: 'ok' };
}

// ============================================================================
// Display Commands
// ============================================================================

export function showMessage(args) {
  return sendCommand('showMessage', args);
}

export function showRequest(args) {
  return sendCommand('showRequest', args);
}

// ============================================================================
// Market Commands
// ============================================================================

export function showPriceChart(args) {
  return sendCommand('showPriceChart', args);
}

export function showVolumeChart(args) {
  return sendCommand('showVolumeChart', args);
}

export function showMarketOverview(args) {
  return sendCommand('showMarketOverview', args);
}

export function compareSymbols(args) {
  return sendCommand('compareSymbols', args);
}

// ============================================================================
// Fundamentals Commands
// ============================================================================

export function showFundamentals(args) {
  return sendCommand('showFundamentals', args);
}

export function showEarnings(args) {
  return sendCommand('showEarnings', args);
}

export function compareRatios(args) {
  return sendCommand('compareRatios', args);
}

// ============================================================================
// Filings Commands
// ============================================================================

export function showFilings(args) {
  return sendCommand('showFilings', args);
}

export function showFilingDetail(args) {
  return sendCommand('showFilingDetail', args);
}

// ============================================================================
// Screening Commands
// ============================================================================

export function openScreener(args) {
  return sendCommand('openScreener', args);
}

export function showScreenResults(args) {
  return sendCommand('showScreenResults', args);
}

// ============================================================================
// News & Sentiment Commands
// ============================================================================

export function showNews(args) {
  return sendCommand('showNews', args);
}

export function showSentiment(args) {
  return sendCommand('showSentiment', args);
}

// ============================================================================
// Portfolio Commands
// ============================================================================

export function showPortfolio(args) {
  return sendCommand('showPortfolio', args);
}

export function showPosition(args) {
  return sendCommand('showPosition', args);
}

export function runBacktest(args) {
  return sendCommand('runBacktest', args);
}

// ============================================================================
// Workspace Commands
// ============================================================================

export function createWatchlist(args) {
  return sendCommand('createWatchlist', args);
}

export function showWatchlist(args) {
  return sendCommand('showWatchlist', args);
}

export function saveWorkspace(args) {
  return sendCommand('saveWorkspace', args);
}

export function loadWorkspace(args) {
  return sendCommand('loadWorkspace', args);
}

// ============================================================================
// Advanced Analysis Commands
// ============================================================================

export function runAnalysis(args) {
  return sendCommand('runAnalysis', args);
}

export function showRisk(args) {
  return sendCommand('showRisk', args);
}

// ============================================================================
// Logging/Status Commands
// ============================================================================

export function logStatus(args) {
  return sendCommand('logStatus', args);
}

export function logProgress(args) {
  return sendCommand('logProgress', args);
}

// ============================================================================
// Low-Level UI Commands
// ============================================================================

export function appendCustomChart(args) {
  const map = getActiveMappingSync(args.sessionId);
  const url = ensureUrl(map.serverUrl);
  postJSONSync(`${url}/api/append`, {
    sessionId: map.sessionId,
    block: { kind: 'chart', spec: args.spec, data: args.data, title: args.title },
  });
  return { ok: true };
}

export function openCustomWindow(args) {
  const map = getActiveMappingSync(args.sessionId);
  const url = ensureUrl(map.serverUrl);
  postJSONSync(`${url}/api/append`, {
    sessionId: map.sessionId,
    block: {
      kind: 'winbox',
      title: args.title || 'Window',
      x: args.x,
      y: args.y,
      width: args.width,
      height: args.height,
      url: args.url,
    },
  });
  return { ok: true };
}

// ============================================================================
// Primitive Data/Analysis Tools (batch-friendly)
// ============================================================================

function postCommand(map, command, params) {
  const url = ensureUrl(map.serverUrl);
  const resp = postJSONSync(`${url}/api/command`, { sessionId: map.sessionId, command: { command, params } }) || {};
  return resp.result || { status: 'ok' };
}

export function getUniverse(args) {
  const map = getActiveMappingSync(args.sessionId);
  return postCommand(map, 'getUniverse', { universe: args.universe });
}

export function getSectorMap(args) {
  const map = getActiveMappingSync(args.sessionId);
  return postCommand(map, 'getSectorMap', { symbols: args.symbols });
}

export function getOhlcRangeBatch(args) {
  const map = getActiveMappingSync(args.sessionId);
  return postCommand(map, 'getOhlcRangeBatch', { symbols: args.symbols, lookback: args.lookback, interval: args.interval });
}

export function computeMomentumBatch(args) {
  const map = getActiveMappingSync(args.sessionId);
  return postCommand(map, 'computeMomentumBatch', { handles: args.handles, method: args.method, lookback: args.lookback });
}

export function aggregateSectorMomentum(args) {
  const map = getActiveMappingSync(args.sessionId);
  return postCommand(map, 'aggregateSectorMomentum', { scores: args.scores, mapping: args.mapping });
}

export function rankTopKSectors(args) {
  const map = getActiveMappingSync(args.sessionId);
  return postCommand(map, 'rankTopKSectors', { sectorScores: args.sectorScores, k: args.k });
}

export function selectTopNPerSector(args) {
  const map = getActiveMappingSync(args.sessionId);
  return postCommand(map, 'selectTopNPerSector', { scores: args.scores, mapping: args.mapping, sectors: args.sectors, n: args.n });
}

export function buildSectorReport(args) {
  const map = getActiveMappingSync(args.sessionId);
  return postCommand(map, 'buildSectorReport', { sectorScores: args.sectorScores, leaders: args.leaders });
}

export function openSectorWindows(args) {
  const map = getActiveMappingSync(args.sessionId);
  return postCommand(map, 'openSectorWindows', { sectors: args.sectors, lookback: args.lookback });
}

// Append a rich HTML report block to the chat feed
export function report(args) {
  const map = getActiveMappingSync(args.sessionId);
  const url = ensureUrl(map.serverUrl);
  postJSONSync(`${url}/api/append`, {
    sessionId: map.sessionId,
    block: {
      kind: 'report',
      title: args.title || '',
      html: args.html || '',
      windowRefId: args.windowRefId,
    },
  });
  return { ok: true };
}
