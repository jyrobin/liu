// Liu helpers: mapItems, retry, waits and small utilities

export function mapItems(toolFn, items, options = null) {
  const res = [];
  const defaults = options && typeof options === 'object' && options.defaults && typeof options.defaults === 'object' ? options.defaults : null;
  const collectIf = options && typeof options === 'object' ? options.collectIf : null;
  function getPath(obj, path) {
    if (!obj || !path) return undefined;
    const parts = String(path).split('.');
    let cur = obj;
    for (const p of parts) { if (cur && typeof cur === 'object') cur = cur[p]; else return undefined; }
    return cur;
  }
  function evalPredicate(item, result) {
    if (!collectIf || typeof collectIf !== 'object') return true;
    const on = collectIf.on === 'result' ? result : item;
    const left = getPath(on, collectIf.field);
    const right = collectIf.value;
    const op = collectIf.op || 'eq';
    switch (op) {
      case 'eq': return left === right;
      case 'ne': return left !== right;
      case 'gt': return Number(left) > Number(right);
      case 'lt': return Number(left) < Number(right);
      case 'ge': return Number(left) >= Number(right);
      case 'le': return Number(left) <= Number(right);
      default: return !!left;
    }
  }
  for (const it of items || []) {
    let arg = it;
    if (defaults && arg && typeof arg === 'object') {
      arg = { ...defaults, ...arg };
    }
    const out = toolFn(arg);
    if (evalPredicate(it, out)) res.push(out);
  }
  return res;
}

export function retry(opts) {
  const { step, times = 1, backoffMs = 0 } = opts || {};
  if (!Array.isArray(step) || typeof step[0] !== 'function') {
    throw new Error('retry: step must be [toolFn, input]');
  }
  const [toolFn, input] = step;
  let last;
  for (let i = 0; i < Math.max(1, times); i++) {
    try {
      last = toolFn(input);
      return last;
    } catch (e) {
      last = { error: String(e?.message || e) };
      if (i < times - 1 && backoffMs > 0) {
        // Busy wait replacement to keep runtime synchronous; no timers in VM
        const end = Date.now() + Number(backoffMs);
        while (Date.now() < end) {}
      }
    }
  }
  return last;
}

export function wait_event(options = {}) {
  return { status: 'waiting', kind: 'event', ...options };
}

export function wait_approval(options = {}) {
  return { status: 'waiting', kind: 'approval', ...options };
}

export function wait_until(options = {}) {
  return { status: 'waiting', kind: 'until', ...options };
}

export function wait_for(toolFnOrSpec, args = null, waitSpec = {}) {
  if (typeof toolFnOrSpec === 'function') {
    return toolFnOrSpec(args || {});
  }
  return { status: 'waiting', ...waitSpec };
}

export function set_var(args = {}) {
  return { result: args?.value };
}

