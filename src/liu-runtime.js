import vm from 'node:vm';
import { validateLiuSource } from './liu-validator.js';
import * as Helpers from './helpers.js';
import { prepareLiuModule } from './liu-compiler.js';
import { InMemoryStateStore } from './state.js';

// Minimal runtime: validate, compile, and execute in a sandboxed context
// Note: This initial runtime does not implement step-level persistence.

// Optional observer interface (all callbacks are optional):
// {
//   onStart?: (info) => void,
//   onStepStart?: ({ index, label, replay }) => void,
//   onStepComplete?: ({ index, label, value }) => void,
//   onStepWait?: ({ index, label, wait }) => void,
//   onStepError?: ({ index, label, error }) => void,
//   onPaused?: ({ wait, state }) => void,
//   onDone?: ({ result, state }) => void,
//   onRunError?: ({ error, state }) => void
// }

export async function runLiuPlanSource(source, { tools = {}, observer = null } = {}) {
  const validation = validateLiuSource(source);
  if (!validation.valid) {
    return { success: false, error: 'Validation failed', validation };
  }

  const code = prepareLiuModule(source);
  const context = {
    console: { log() {}, error() {}, warn() {} },
    __LIU_TOOLS__: tools,
    __LIU_HELPERS__: Helpers,
    __LIU_RESULT__: undefined
  };
  vm.createContext(context, { name: 'liu-plan-context' });
  try {
    if (observer && typeof observer.onStart === 'function') {
      try { observer.onStart({ mode: 'ephemeral' }); } catch (_) {}
    }
    const script = new vm.Script(code, { filename: 'inline.liu.ts' });
    script.runInContext(context, { timeout: 1000 });
    const result = context.__LIU_RESULT__;
    if (observer && typeof observer.onDone === 'function') {
      try { observer.onDone({ result, state: null }); } catch (_) {}
    }
    return { success: true, result, validation };
  } catch (e) {
    if (observer && typeof observer.onRunError === 'function') {
      try { observer.onRunError({ error: String(e?.message || e), state: null }); } catch (_) {}
    }
    return { success: false, error: e?.message || String(e), validation };
  }
}

// Pause signal used to unwind execution when a wait descriptor is produced
class PauseSignal extends Error {
  constructor(info) {
    super('LIU_PAUSE');
    this.name = 'PauseSignal';
    this.__LIU_PAUSE__ = true;
    this.info = info || null;
  }
}

// Create wrapped tool and helper maps that route calls through __LIU_STEP__ checkpoints
function makeWrappedBindings(tools, includeHelpers = true) {
  const wrapped = {};
  const stepify = (label, fn) => (args) => __LIU_STEP__(label, () => fn(args));
  // Tools
  for (const [k, v] of Object.entries(tools || {})) {
    if (typeof v === 'function') wrapped[k] = function(arg) { return __LIU_STEP__(k, () => v(arg)); };
    else wrapped[k] = v;
  }
  if (!includeHelpers) return { tools: wrapped, helpers: {} };
  // Helpers: wrap waits explicitly; others call tools and will checkpoint there
  const helpers = { ...Helpers };
  const wrapWait = (name) => {
    const orig = helpers[name];
    if (typeof orig === 'function') {
      helpers[name] = function(arg1 = {}, arg2 = {}, arg3 = {}) {
        return __LIU_STEP__(name, () => orig(arg1, arg2, arg3));
      };
    }
  };
  wrapWait('wait_event');
  wrapWait('wait_approval');
  wrapWait('wait_until');
  wrapWait('wait_for');
  return { tools: wrapped, helpers };
}

// Run with simple step-level persistence using a StateStore (in-memory or file-based)
export async function runLiuPlanPersisted(source, { tools = {}, store = null, planId = 'plan', timeoutMs = 2000, observer = null } = {}) {
  const validation = validateLiuSource(source);
  if (!validation.valid) {
    return { success: false, error: 'Validation failed', validation };
  }

  const code = prepareLiuModule(source);
  const stateStore = store || new InMemoryStateStore();
  const saved = await stateStore.load(planId);
  const ctxState = saved && typeof saved === 'object' ? saved : { steps: [], status: 'new' };

  // Create the sandboxed context skeleton
  const context = {
    console: { log() {}, error() {}, warn() {} },
    __LIU_TOOLS__: {},
    __LIU_HELPERS__: {},
    __LIU_RESULT__: undefined,
    __LIU_CTX__: { stepCursor: -1, steps: ctxState.steps || [], paused: false, pauseReason: null },
    __LIU_STEP__: function(label, fn) {
      const S = this.__LIU_CTX__ || context.__LIU_CTX__;
      const idx = ++S.stepCursor;
      const rec = S.steps[idx];
      const replay = !!(rec && rec.status === 'completed');
      if (!replay && observer && typeof observer.onStepStart === 'function') {
        try { observer.onStepStart({ index: idx, label, replay: false }); } catch (_) {}
      }
      if (replay) return rec.value;
      try {
        const val = fn();
        if (val && typeof val === 'object' && val.status === 'waiting') {
          S.paused = true;
          S.pauseReason = val;
          S.steps[idx] = { status: 'waiting', value: val, label };
          if (observer && typeof observer.onStepWait === 'function') {
            try { observer.onStepWait({ index: idx, label, wait: val }); } catch (_) {}
          }
          throw new PauseSignal({ index: idx, label, wait: val });
        }
        S.steps[idx] = { status: 'completed', value: val, label };
        if (observer && typeof observer.onStepComplete === 'function') {
          try { observer.onStepComplete({ index: idx, label, value: val }); } catch (_) {}
        }
        return val;
      } catch (e) {
        if (e && e.__LIU_PAUSE__) throw e;
        S.steps[idx] = { status: 'failed', error: String(e?.message || e), label };
        if (observer && typeof observer.onStepError === 'function') {
          try { observer.onStepError({ index: idx, label, error: String(e?.message || e) }); } catch (_) {}
        }
        throw e;
      }
    }
  };
  vm.createContext(context, { name: 'liu-plan-context' });

  // Build wrapped bindings that close over the context to access __LIU_STEP__
  const wrappedTools = {};
  for (const [k, v] of Object.entries(tools || {})) {
    if (typeof v === 'function') wrappedTools[k] = function(arg) { return context.__LIU_STEP__(k, () => v(arg)); };
    else wrappedTools[k] = v;
  }
  const helpers = { ...Helpers };
  const namesToWrap = ['wait_event', 'wait_approval', 'wait_until', 'wait_for'];
  for (const n of namesToWrap) {
    if (typeof helpers[n] === 'function') {
      const orig = helpers[n];
      helpers[n] = function(a = {}, b = {}, c = {}) { return context.__LIU_STEP__(n, () => orig(a, b, c)); };
    }
  }
  context.__LIU_TOOLS__ = wrappedTools;
  context.__LIU_HELPERS__ = helpers;

  try {
    if (observer && typeof observer.onStart === 'function') {
      try { observer.onStart({ mode: 'persisted', planId, previousSteps: context.__LIU_CTX__.steps.length }); } catch (_) {}
    }
    const script = new vm.Script(code, { filename: 'inline.liu.ts' });
    script.runInContext(context, { timeout: timeoutMs });
    // Completed
    const result = context.__LIU_RESULT__;
    const toSave = { steps: context.__LIU_CTX__.steps, status: 'completed', result };
    await stateStore.save(planId, toSave);
    if (observer && typeof observer.onDone === 'function') {
      try { observer.onDone({ result, state: toSave }); } catch (_) {}
    }
    return { success: true, result, paused: false, state: toSave };
  } catch (e) {
    if (e && e.__LIU_PAUSE__) {
      const toSave = { steps: context.__LIU_CTX__.steps, status: 'paused', wait: e.info?.wait };
      await stateStore.save(planId, toSave);
      if (observer && typeof observer.onPaused === 'function') {
        try { observer.onPaused({ wait: e.info?.wait, state: toSave }); } catch (_) {}
      }
      return { success: false, paused: true, wait: e.info?.wait, state: toSave };
    }
    const toSave = { steps: context.__LIU_CTX__.steps, status: 'failed', error: String(e?.message || e) };
    await stateStore.save(planId, toSave);
    if (observer && typeof observer.onRunError === 'function') {
      try { observer.onRunError({ error: String(e?.message || e), state: toSave }); } catch (_) {}
    }
    return { success: false, error: String(e?.message || e), paused: false, state: toSave };
  }
}

export { InMemoryStateStore };
