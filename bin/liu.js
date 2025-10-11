#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { validateLiuSource } from '../src/liu-validator.js';
import { prepareLiuModule } from '../src/liu-compiler.js';
import { runLiuPlanSource, runLiuPlanPersisted } from '../src/liu-runtime.js';
import { FileStateStore } from '../src/state.js';
import { initDomain, getDomainInfo, listArtifacts, runPlanByName, findDomainRoot, resumeRun } from '../src/domain.js';
import { mergeDefaults, resolveProfile } from '../src/llm/profiles.js';
import { loadConfig, saveConfig } from '../src/domain.js';
import { composePrompt } from '../src/llm/template-manager.js';
import { genPlanFromNL, annotatePlan, validatePlanText, savePlan } from '../src/llm/generator.js';

function usage() {
  console.log(`Liu TS CLI

Usage:
  liu validate <file>
  liu compile <file>
  liu run <file> [--tools <esm-module>]
  liu run-persisted <file> --plan-id <id> --state-file <dir> [--tools <esm-module>]
  liu state-show --plan-id <id> --state-file <dir>
  liu state-reset --plan-id <id> --state-file <dir>
  
  # Domain & REPL
  liu domain init [--root <dir>] [--force]
  liu domain info [--domain-root <dir>]
  liu list [plans|tools] [--domain-root <dir>]
  liu run-plan <name> [--domain-root <dir>] [--workspace <dir>] [--run-id <id>] [--backend memory|file] [--state-dir <dir>] [--force]
  liu continue-plan <name> [--domain-root <dir>] [--workspace <dir>] [--run-id <id>] [--backend memory|file] [--state-dir <dir>]
  liu resume --workspace <dir> --run-id <id> --payload <json> [--state-dir <dir>]
  liu repl [--domain-root <dir>] [--workspace <dir>] [--backend memory|file] [--state-dir <dir>] [--script <file>]

Options:
  --tools   Path to an ESM module that exports tool functions
Global options (can appear before the subcommand):
  --domain-root <dir>   Domain root directory
  --workspace <dir>     Workspace directory (default: cwd)
`);
}

async function loadTools(toolsPath) {
  if (!toolsPath) return {};
  const abs = path.resolve(process.cwd(), toolsPath);
  const mod = await import(pathToFileURL(abs).href);
  return mod;
}

async function main(argv) {
  const raw = argv.slice(2);
  // Extract global options and strip them from args
  const globals = { domainRoot: null, workspace: null };
  const args = [];
  for (let i = 0; i < raw.length; i++) {
    const t = raw[i];
    if (t === '--domain-root') { globals.domainRoot = raw[++i] || null; continue; }
    if (t === '--workspace') { globals.workspace = raw[++i] || null; continue; }
    args.push(t);
  }
  const [cmd, ...restAll] = args;
  const maybeFile = (restAll[0] && !String(restAll[0]).startsWith('-')) ? restAll[0] : undefined;
  const rest = maybeFile ? restAll.slice(1) : restAll;
  if (!cmd) { usage(); process.exit(0); }
  const file = maybeFile;

  let source = null;
  let srcPath = null;
  const needsFile = ['validate','compile','run','run-persisted'].includes(cmd);
  if (needsFile) {
    if (!file) { usage(); process.exit(2); }
    srcPath = path.resolve(process.cwd(), file);
    source = await fs.readFile(srcPath, 'utf8');
  }

  if (cmd === 'validate') {
    const result = validateLiuSource(source);
    if (result.valid) {
      console.log('Valid');
      if (result.warnings?.length) {
        console.log('Warnings:');
        for (const w of result.warnings) console.log(' -', w);
      }
      process.exit(0);
    } else {
      console.error('Invalid:');
      for (const e of result.errors) console.error(' -', e);
      if (result.warnings?.length) {
        console.error('Warnings:');
        for (const w of result.warnings) console.error(' -', w);
      }
      process.exit(1);
    }
  }

  if (cmd === 'compile') {
    const code = prepareLiuModule(source);
    console.log(code);
    return;
  }

  if (cmd === 'run') {
    // Parse flags
    let toolsPath = null;
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '--tools') toolsPath = rest[++i];
    }
    const tools = await loadTools(toolsPath);
    const res = await runLiuPlanSource(source, { tools });
    if (res.success) {
      console.log(JSON.stringify(res.result, null, 2));
      process.exit(0);
    } else {
      console.error('Execution error:', res.error);
      if (res.validation && !res.validation.valid) {
        console.error('Validation errors:', res.validation.errors);
      }
      process.exit(1);
    }
  }

  if (cmd === 'run-persisted') {
    let toolsPath = null;
    let planId = null;
    let stateDir = null;
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '--tools') toolsPath = rest[++i];
      else if (rest[i] === '--plan-id') planId = rest[++i];
      else if (rest[i] === '--state-file' || rest[i] === '--state-dir') stateDir = rest[++i];
    }
    if (!planId || !stateDir) { usage(); process.exit(2); }
    const tools = await loadTools(toolsPath);
    const store = new FileStateStore(stateDir);
    const res = await runLiuPlanPersisted(source, { tools, store, planId });
    if (res.paused) {
      console.log(JSON.stringify({ status: 'paused', wait: res.wait }, null, 2));
      process.exit(0);
    }
    if (res.success) {
      console.log(JSON.stringify(res.result, null, 2));
      process.exit(0);
    } else {
      console.error('Execution error:', res.error);
      process.exit(1);
    }
  }

  if (cmd === 'state-show') {
    let planId = null; let stateDir = null;
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '--plan-id') planId = rest[++i];
      else if (rest[i] === '--state-file' || rest[i] === '--state-dir') stateDir = rest[++i];
    }
    if (!planId || !stateDir) { usage(); process.exit(2); }
    const store = new FileStateStore(stateDir);
    const st = await store.load(planId);
    console.log(JSON.stringify(st || {}, null, 2));
    return;
  }

  if (cmd === 'state-reset') {
    let planId = null; let stateDir = null;
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '--plan-id') planId = rest[++i];
      else if (rest[i] === '--state-file' || rest[i] === '--state-dir') stateDir = rest[++i];
    }
    if (!planId || !stateDir) { usage(); process.exit(2); }
    const store = new FileStateStore(stateDir);
    await store.remove(planId);
    console.log('OK');
    return;
  }

  // Domain commands
  if (cmd === 'domain') {
    const sub = maybeFile;
    if (sub === 'init') {
      let root = null, force = false;
      for (let i = 0; i < rest.length; i++) {
        if (rest[i] === '--root') root = rest[++i];
        else if (rest[i] === '--force') force = true;
      }
      root = root ? path.resolve(process.cwd(), root) : process.cwd();
      await initDomain(root, { force });
      console.log('Domain initialized at', root);
      return;
    }
    if (sub === 'info') {
      let domainRoot = globals.domainRoot;
      for (let i = 0; i < rest.length; i++) {
        if (rest[i] === '--domain-root') domainRoot = rest[++i];
      }
      domainRoot = domainRoot ? path.resolve(process.cwd(), domainRoot) : (await findDomainRoot(process.cwd()));
      if (!domainRoot) { console.error('No domain root found'); process.exit(1); }
      const info = await getDomainInfo(domainRoot);
      console.log(JSON.stringify(info, null, 2));
      return;
    }
    usage();
    process.exit(2);
  }

  if (cmd === 'list') {
    let kind = maybeFile || 'plans';
    let domainRoot = globals.domainRoot;
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '--domain-root') domainRoot = rest[++i];
    }
    domainRoot = domainRoot ? path.resolve(process.cwd(), domainRoot) : (await findDomainRoot(process.cwd()));
    if (!domainRoot) { console.error('No domain root found'); process.exit(1); }
    const items = await listArtifacts(domainRoot, kind);
    console.log(items.join('\n'));
    return;
  }

  if (cmd === 'run-plan') {
    const name = maybeFile; // here the "file" slot carries plan name
    if (!name) { usage(); process.exit(2); }
    let domainRoot = globals.domainRoot, workspace = globals.workspace, runId = null, backend = 'file', stateDir = null, force = false;
    for (let i = 0; i < rest.length; i++) {
      const t = rest[i];
      if (t === '--domain-root') domainRoot = rest[++i];
      else if (t === '--workspace') workspace = rest[++i];
      else if (t === '--run-id') runId = rest[++i];
      else if (t === '--backend') backend = rest[++i];
      else if (t === '--state-dir' || t === '--state-file') stateDir = rest[++i];
      else if (t === '--force') force = true;
    }
    domainRoot = domainRoot ? path.resolve(process.cwd(), domainRoot) : (await findDomainRoot(process.cwd()));
    if (!domainRoot) { console.error('No domain root found'); process.exit(1); }
    const ws = workspace ? path.resolve(process.cwd(), workspace) : process.cwd();
    const result = await runPlanByName({ domainRoot, workspace: ws, planName: name, runId, backend, stateDir, force });
    console.log(JSON.stringify(result.output, null, 2));
    process.exit(result.success ? 0 : 1);
  }

  if (cmd === 'continue-plan') {
    const name = maybeFile; // plan name
    if (!name) { usage(); process.exit(2); }
    let domainRoot = globals.domainRoot, workspace = globals.workspace, runId = null, backend = 'file', stateDir = null;
    for (let i = 0; i < rest.length; i++) {
      const t = rest[i];
      if (t === '--domain-root') domainRoot = rest[++i];
      else if (t === '--workspace') workspace = rest[++i];
      else if (t === '--run-id') runId = rest[++i];
      else if (t === '--backend') backend = rest[++i];
      else if (t === '--state-dir' || t === '--state-file') stateDir = rest[++i];
    }
    domainRoot = domainRoot ? path.resolve(process.cwd(), domainRoot) : (await findDomainRoot(process.cwd()));
    if (!domainRoot) { console.error('No domain root found'); process.exit(1); }
    const ws = workspace ? path.resolve(process.cwd(), workspace) : process.cwd();
    const result = await runPlanByName({ domainRoot, workspace: ws, planName: name, runId, backend, stateDir, continueExisting: true });
    console.log(JSON.stringify(result.output, null, 2));
    process.exit(result.success ? 0 : 1);
  }

  if (cmd === 'resume') {
    let workspace = globals.workspace, runId = null, payload = null, stateDir = null;
    for (let i = 0; i < rest.length; i++) {
      const t = rest[i];
      if (t === '--workspace') workspace = rest[++i];
      else if (t === '--run-id') runId = rest[++i];
      else if (t === '--payload') payload = rest[++i];
      else if (t === '--state-dir' || t === '--state-file') stateDir = rest[++i];
    }
    if (!workspace || !runId || payload == null) { usage(); process.exit(2); }
    const ws = path.resolve(process.cwd(), workspace);
    const out = await resumeRun({ workspace: ws, runId, payload, stateDir });
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  // LLM commands
  if (cmd === 'llm') {
    const sub = maybeFile;
    if (sub === 'status') {
      let domainRoot = globals.domainRoot;
      for (let i = 0; i < rest.length; i++) if (rest[i] === '--domain-root') domainRoot = rest[++i];
      domainRoot = domainRoot ? path.resolve(process.cwd(), domainRoot) : (await findDomainRoot(process.cwd()));
      if (!domainRoot) { console.error('No domain root found'); process.exit(1); }
      const dcfg = await loadConfig(domainRoot);
      const cfg = mergeDefaults(dcfg.llm || {});
      console.log(JSON.stringify({ domainRoot, config: cfg, source: 'liu-domain.config.json' }, null, 2));
      return;
    }
    if (sub === 'profile') {
      const action = rest[0];
      let domainRoot = globals.domainRoot;
      for (let i = 0; i < rest.length; i++) if (rest[i] === '--domain-root') domainRoot = rest[++i];
      domainRoot = domainRoot ? path.resolve(process.cwd(), domainRoot) : (await findDomainRoot(process.cwd()));
      if (!domainRoot) { console.error('No domain root found'); process.exit(1); }
      const dcfg = await loadConfig(domainRoot);
      const cfg = mergeDefaults(dcfg.llm || {});
      if (action === 'list') { console.log(Object.keys(cfg.profiles).join('\n')); return; }
      if (action === 'show') { console.log(JSON.stringify(cfg, null, 2)); return; }
      if (action === 'use') {
        const name = rest[1]; if (!name) { console.error('usage: llm profile use <name>'); process.exit(2); }
        cfg.activeProfile = name;
        dcfg.llm = cfg; await saveConfig(domainRoot, dcfg); console.log('OK'); return;
      }
      if (action === 'set') {
        let name = null, provider = null, model = null, apiKey = null;
        for (let i = 0; i < rest.length; i++) {
          const t = rest[i];
          if (t === '--name') name = rest[++i];
          else if (t === '--provider') provider = rest[++i];
          else if (t === '--model') model = rest[++i];
          else if (t === '--api-key') apiKey = rest[++i];
        }
        if (!name || !provider || !model) { console.error('missing --name/--provider/--model'); process.exit(2); }
        cfg.profiles[name] = { provider, model, apiKey: apiKey || cfg.profiles[name]?.apiKey || null, extras: cfg.profiles[name]?.extras || {} };
        if (!cfg.activeProfile) cfg.activeProfile = name;
        dcfg.llm = cfg;
        await saveConfig(domainRoot, dcfg);
        console.log('OK');
        return;
      }
      console.error('usage: llm profile (list|show|use <name>|set --name ...)');
      process.exit(2);
    }
    if (sub === 'compose') {
      let domainRoot = globals.domainRoot, request = null, allowed = null, profileName = null;
      for (let i = 0; i < rest.length; i++) {
        const t = rest[i];
        if (t === '--domain-root') domainRoot = rest[++i];
        else if (t === '--request') request = rest[++i];
        else if (t === '--allowed-kinds' || t === '--allowed') { try { allowed = JSON.parse(rest[++i]); } catch { allowed = rest[i]; } }
        else if (t === '--profile') profileName = rest[++i];
      }
      domainRoot = domainRoot ? path.resolve(process.cwd(), domainRoot) : (await findDomainRoot(process.cwd()));
      if (!domainRoot) { console.error('No domain root found'); process.exit(1); }
      const dcfg = await loadConfig(domainRoot);
      const llmCfg = mergeDefaults(dcfg.llm || {});
      const prof = resolveProfile(llmCfg, profileName);
      const prompt = await composePrompt({ domainRoot, provider: prof.provider, params: { nlRequest: request, allowed, model: prof.model } });
      console.log(prompt);
      return;
    }
    if (sub === 'gen-plan') {
      let domainRoot = globals.domainRoot, request = null, profileName = null, manual = false, save = false, planName = null, outDir = null, allowed = null;
      for (let i = 0; i < rest.length; i++) {
        const t = rest[i];
        if (t === '--domain-root') domainRoot = rest[++i];
        else if (t === '--request') request = rest[++i];
        else if (t === '--profile') profileName = rest[++i];
        else if (t === '--manual') manual = true;
        else if (t === '--save') save = true;
        else if (t === '--name') planName = rest[++i];
        else if (t === '--out-dir') outDir = rest[++i];
        else if (t === '--allowed-kinds' || t === '--allowed') { try { allowed = JSON.parse(rest[++i]); } catch { allowed = rest[i]; } }
      }
      domainRoot = domainRoot ? path.resolve(process.cwd(), domainRoot) : (await findDomainRoot(process.cwd()));
      if (!domainRoot) { console.error('No domain root found'); process.exit(1); }
      const { prompt, planText, profile } = await genPlanFromNL({ domainRoot, request, allowed, profileName, manual });
      let finalPlan = planText;
      if (manual) {
        console.log('--- BEGIN PROMPT ---');
        console.log(prompt);
        console.log('--- END PROMPT ---');
        console.error('Paste plan to stdin, end with Ctrl-D (EOF).');
        const chunks = [];
        for await (const chunk of process.stdin) chunks.push(chunk);
        finalPlan = Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf8');
      }
      const diag = validatePlanText(finalPlan || '');
      const annotated = annotatePlan({ planText: finalPlan || '', profile, request, valid: diag.valid });
      if (save) {
        const saved = await savePlan({ domainRoot, content: annotated, name: planName, valid: diag.valid, outDir });
        console.log(saved);
      } else {
        console.log(annotated);
      }
      if (!diag.valid) {
        console.error('Validation errors:', diag.errors);
        process.exit(1);
      }
      return;
    }
    console.error('usage: llm (status|profile ...|compose ...|gen-plan ...)');
    process.exit(2);
  }

  if (cmd === 'repl') {
    let domainRoot = globals.domainRoot, workspace = globals.workspace, backend = 'memory', stateDir = null, scriptFile = null;
    for (let i = 0; i < rest.length; i++) {
      const t = rest[i];
      if (t === '--domain-root') domainRoot = rest[++i];
      else if (t === '--workspace') workspace = rest[++i];
      else if (t === '--backend') backend = rest[++i];
      else if (t === '--state-dir' || t === '--state-file') stateDir = rest[++i];
      else if (t === '--script') scriptFile = rest[++i];
    }
    domainRoot = domainRoot ? path.resolve(process.cwd(), domainRoot) : (await findDomainRoot(process.cwd()));
    if (!domainRoot) { console.error('No domain root found'); process.exit(1); }
    const wsAbs = workspace ? path.resolve(process.cwd(), workspace) : process.cwd();
    let currentRunId = null;
    function promptFor(runId) { return runId ? `liu[${runId}]> ` : 'liu> '; }
    const runScript = async (line) => {
      const parts = line.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return;
      const cmd2 = parts[0];
      if (cmd2.startsWith('.')) {
        const ws = wsAbs;
        const sub = cmd2;
        if (sub === '.help' || sub === '.h') {
          console.log(`REPL commands:\n.help/.h                 Show this help\n.runs                    List available run IDs in workspace\n.use <runId>             Set current run ID\n.current                 Show current run ID\n.reset <runId>           Delete run directory and state\n.pwd                     Show workspace\nexit|quit                Exit REPL`);
          return;
        }
        if (sub === '.runs') {
          try {
            const names = await fs.readdir(path.join(ws, '.liu-runs'));
            const out = [];
            for (const n of names) {
              try { const st = await fs.stat(path.join(ws, '.liu-runs', n)); if (st.isDirectory()) out.push(n); } catch {}
            }
            console.log(out.sort().join('\n'));
          } catch { console.log(''); }
          return;
        }
        if (sub === '.use') { const id = parts[1]; if (!id) { console.log('usage: .use <runId>'); return; } currentRunId = id; return; }
        if (sub === '.current') { console.log(currentRunId || ''); return; }
        if (sub === '.reset') {
          const id = parts[1] || currentRunId;
          if (!id) { console.log('usage: .reset <runId>'); return; }
          await fs.rm(path.join(ws, '.liu-runs', id), { recursive: true, force: true });
          if (currentRunId === id) currentRunId = null;
          console.log('OK');
          return;
        }
        if (sub === '.pwd') { console.log(ws); return; }
        console.log('Unknown command');
        return;
      }
      if (cmd2 === 'exit' || cmd2 === 'quit') { process.exit(0); }
      if (cmd2 === 'list') {
        const kind = parts[1] || 'plans';
        const items = await listArtifacts(domainRoot, kind);
        console.log(items.join('\n'));
        return;
      }
      if (cmd2 === 'run-plan') {
        const name = parts[1];
        const ws = wsAbs;
        // parse inline flags after the name
        let localRunId = null, localBackend = backend, localStateDir = stateDir, localForce = false;
        for (let i = 2; i < parts.length; i++) {
          const t = parts[i];
          if (t === '--run-id') localRunId = parts[++i];
          else if (t === '--backend') localBackend = parts[++i];
          else if (t === '--state-dir' || t === '--state-file') localStateDir = parts[++i];
          else if (t === '--force') localForce = true;
        }
        if (!localRunId) localRunId = (currentRunId || name);
        const opts = { domainRoot, workspace: ws, planName: name, backend: localBackend, stateDir: localStateDir, force: localForce, runId: localRunId };
        const res = await runPlanByName(opts);
        console.log(JSON.stringify(res.output, null, 2));
        currentRunId = localRunId;
        return;
      }
      if (cmd2 === 'continue-plan') {
        const name = parts[1];
        const ws = wsAbs;
        let localRunId = null, localBackend = backend, localStateDir = stateDir;
        for (let i = 2; i < parts.length; i++) {
          const t = parts[i];
          if (t === '--run-id') localRunId = parts[++i];
          else if (t === '--backend') localBackend = parts[++i];
          else if (t === '--state-dir' || t === '--state-file') localStateDir = parts[++i];
        }
        if (!localRunId) localRunId = (currentRunId || name);
        const res = await runPlanByName({ domainRoot, workspace: ws, planName: name, runId: localRunId, backend: localBackend, stateDir: localStateDir, continueExisting: true });
        console.log(JSON.stringify(res.output, null, 2));
        currentRunId = localRunId;
        return;
      }
      if (cmd2 === 'resume') {
        const firstArg = parts[1] || '';
        const planId = firstArg.startsWith('{') || firstArg === '' ? (currentRunId || '') : firstArg;
        const payload = firstArg.startsWith('{') ? parts.slice(1).join(' ') : parts.slice(2).join(' ');
        const ws = wsAbs;
        const out = await resumeRun({ workspace: ws, runId: planId, payload, stateDir });
        console.log(JSON.stringify(out, null, 2));
        return;
      }
      if (cmd2 === 'state-show') {
        const planId = parts[1] || currentRunId || '';
        const ws = workspace ? path.resolve(process.cwd(), workspace) : process.cwd();
        const dir = stateDir || path.join(ws, '.liu-runs', planId, 'state');
        const store = new FileStateStore(dir);
        const st = await store.load(planId);
        console.log(JSON.stringify(st || {}, null, 2));
        return;
      }
      if (cmd2 === 'state-reset') {
        const planId = parts[1] || currentRunId || '';
        const ws = workspace ? path.resolve(process.cwd(), workspace) : process.cwd();
        const dir = stateDir || path.join(ws, '.liu-runs', planId, 'state');
        const store = new FileStateStore(dir);
        await store.remove(planId);
        console.log('OK');
        return;
      }
      console.log('Unknown command');
    };
    if (scriptFile) {
      const abs = path.resolve(process.cwd(), scriptFile);
      const text = await fs.readFile(abs, 'utf8');
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        const s = line.trim();
        if (!s || s.startsWith('#')) continue;
        await runScript(s);
      }
      return;
    }
    // Interactive loop
    const rl = await import('node:readline');
    const iface = rl.createInterface({ input: process.stdin, output: process.stdout, prompt: promptFor(currentRunId) });
    iface.prompt();
    iface.on('line', async (line) => {
      try { await runScript(line); } catch (e) { console.error('Error:', e?.message || e); }
      iface.setPrompt(promptFor(currentRunId));
      iface.prompt();
    }).on('close', () => process.exit(0));
    return;
  }


  usage();
}

main(process.argv).catch(err => {
  console.error('Fatal:', err?.stack || err);
  process.exit(1);
});
