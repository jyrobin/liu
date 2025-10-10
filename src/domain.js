import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import crypto from 'node:crypto';
import { runLiuPlanPersisted } from './liu-runtime.js';
import { InMemoryStateStore, FileStateStore } from './state.js';

const DEFAULT_CONFIG = {
  version: 1,
  paths: {
    plans: 'plans',
    tools: 'tools/index.js',
    types: 'types',
    schemas: 'schemas'
  }
};

export async function findDomainRoot(startDir) {
  let dir = path.resolve(startDir);
  while (true) {
    const cfg = path.join(dir, 'liu-domain.config.json');
    try { await fs.access(cfg); return dir; } catch (_) {}
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export async function initDomain(rootDir, { force = false } = {}) {
  await fs.mkdir(rootDir, { recursive: true });
  const cfgPath = path.join(rootDir, 'liu-domain.config.json');
  try { if (!force) { await fs.access(cfgPath); throw new Error('Domain already initialized'); } } catch (_) {}
  await fs.writeFile(cfgPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
  // Folders
  const d = DEFAULT_CONFIG.paths;
  await fs.mkdir(path.join(rootDir, d.plans), { recursive: true });
  await fs.mkdir(path.join(rootDir, d.tools, '..'), { recursive: true }); // ensure tools dir
  await fs.mkdir(path.join(rootDir, d.types), { recursive: true });
  await fs.mkdir(path.join(rootDir, d.schemas), { recursive: true });
  // Scaffolds
  const toolsDir = path.join(rootDir, path.dirname(d.tools));
  await fs.writeFile(path.join(toolsDir, 'index.js'), SAMPLE_TOOLS_JS);
  await fs.writeFile(path.join(rootDir, d.types, 'tools.d.ts'), SAMPLE_TOOLS_DTS);
  await fs.writeFile(path.join(rootDir, d.plans, 'sample.liu.ts'), SAMPLE_PLAN_TS);
}

export async function loadConfig(domainRoot) {
  const p = path.join(domainRoot, 'liu-domain.config.json');
  const text = await fs.readFile(p, 'utf8');
  const cfg = JSON.parse(text);
  // Fill defaults
  const merged = { ...DEFAULT_CONFIG, ...cfg, paths: { ...DEFAULT_CONFIG.paths, ...(cfg.paths || {}) } };
  return merged;
}

export async function saveConfig(domainRoot, cfg) {
  const p = path.join(domainRoot, 'liu-domain.config.json');
  await fs.writeFile(p, JSON.stringify(cfg, null, 2));
}

export async function getDomainInfo(domainRoot) {
  const cfg = await loadConfig(domainRoot);
  const info = { root: domainRoot, config: cfg };
  const plansDir = path.join(domainRoot, cfg.paths.plans);
  const toolsPath = path.join(domainRoot, cfg.paths.tools);
  info.plans = await safeList(plansDir, (f) => f.endsWith('.liu.ts') || f.endsWith('.liu.js'));
  info.tools = await fileExists(toolsPath) ? [toolsPath] : [];
  return info;
}

export async function listArtifacts(domainRoot, kind = 'plans') {
  const cfg = await loadConfig(domainRoot);
  if (kind === 'tools') {
    return [cfg.paths.tools];
  }
  const plansDir = path.join(domainRoot, cfg.paths.plans);
  const files = await safeList(plansDir, (f) => f.endsWith('.liu.ts') || f.endsWith('.liu.js'));
  return files.map(f => path.basename(f).replace(/\.(liu\.(ts|js))$/, ''));
}

export async function runPlanByName({ domainRoot, workspace, planName, runId, backend = 'file', stateDir = null, force = false, continueExisting = false }) {
  const cfg = await loadConfig(domainRoot);
  const plansDir = path.join(domainRoot, cfg.paths.plans);
  const planPathTs = path.join(plansDir, `${planName}.liu.ts`);
  const planPathJs = path.join(plansDir, `${planName}.liu.js`);
  const planPath = (await fileExists(planPathTs)) ? planPathTs : (await fileExists(planPathJs) ? planPathJs : null);
  if (!planPath) throw new Error(`Plan not found: ${planName}`);
  const toolsModPath = path.join(domainRoot, cfg.paths.tools);
  if (!await fileExists(toolsModPath)) throw new Error(`Tools module not found: ${toolsModPath}`);
  const tools = await import(pathToFileURL(toolsModPath).href);
  const source = await fs.readFile(planPath, 'utf8');
  const hash = sha256(source);
  const ws = path.resolve(workspace);
  const rid = runId || planName;
  const runDir = path.join(ws, '.liu-runs', rid);
  let useSource = source;
  if (await fileExists(runDir)) {
    if (force) {
      await fs.rm(runDir, { recursive: true, force: true });
    } else if (continueExisting) {
      // Reuse existing snapshot and state
      const snapPath = path.join(runDir, 'plan.liu.ts');
      if (await fileExists(snapPath)) {
        useSource = await fs.readFile(snapPath, 'utf8');
      }
    } else {
      throw new Error(`Run directory exists: ${runDir} (use --force to override)`);
    }
  }
  if (!(await fileExists(runDir))) {
    await fs.mkdir(runDir, { recursive: true });
    await fs.mkdir(path.join(runDir, 'state'), { recursive: true });
    await fs.writeFile(path.join(runDir, 'plan.liu.ts'), source);
    await fs.writeFile(path.join(runDir, 'meta.json'), JSON.stringify({ planName, original: planPath, hash, domainRoot }, null, 2));
  }

  // Choose state store
  let store;
  if (backend === 'memory') store = new InMemoryStateStore();
  else {
    const sdir = stateDir || path.join(runDir, 'state');
    store = new FileStateStore(sdir);
  }
  // Run
  const res = await runLiuPlanPersisted(useSource, { tools, store, planId: rid });
  const output = res.paused ? { status: 'paused', wait: res.wait } : (res.success ? res.result : { error: res.error });
  return { success: !!res.success, paused: !!res.paused, output, runDir };
}

export async function resumeRun({ workspace, runId, payload, stateDir = null }) {
  const ws = path.resolve(workspace);
  const runDir = path.join(ws, '.liu-runs', runId);
  const sdir = stateDir || path.join(runDir, 'state');
  const store = new FileStateStore(sdir);
  const state = await store.load(runId);
  if (!state) throw new Error('No state found');
  const steps = Array.isArray(state.steps) ? state.steps : [];
  const idx = steps.findIndex(s => s && s.status === 'waiting');
  if (idx < 0) throw new Error('No waiting step to resume');
  let payloadObj = payload;
  if (typeof payload === 'string') {
    try { payloadObj = JSON.parse(payload); } catch { payloadObj = { value: payload }; }
  }
  steps[idx] = { status: 'completed', value: payloadObj, label: steps[idx]?.label || 'resumed' };
  state.steps = steps;
  state.status = 'resuming';
  await store.save(runId, state);
  return { ok: true, index: idx };
}

async function safeList(dir, filterFn) {
  try {
    const names = await fs.readdir(dir);
    const files = [];
    for (const n of names) {
      const p = path.join(dir, n);
      const st = await fs.stat(p);
      if (st.isFile() && (!filterFn || filterFn(p))) files.push(p);
    }
    return files;
  } catch (_) {
    return [];
  }
}

async function fileExists(p) { try { await fs.access(p); return true; } catch (_) { return false; } }
function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

const SAMPLE_TOOLS_JS = `export function add({ a, b }) { return { result: Number(a) + Number(b) }; }
export function mul({ a, b }) { return { result: Number(a) * Number(b) }; }
export function notify({ channel, message }) { console.log(\`[\${channel}] \${message}\`); return { ok: true }; }
`;

const SAMPLE_TOOLS_DTS = `export declare function add(args: { a: number; b: number }): { result: number };
export declare function mul(args: { a: number; b: number }): { result: number };
export declare function notify(args: { channel: string; message: string }): { ok: boolean };
`;

const SAMPLE_PLAN_TS = `import { add, mul } from '@tools';
const s1 = add({ a: 2, b: 3 });
const s2 = mul({ a: s1.result, b: 10 });
export default { result: s2.result };
`;
