// Minimal validator for Liu TS subset (best-effort, regex-based)

export function validateLiuSource(source) {
  const errors = [];
  const warn = [];
  const add = (m) => errors.push(m);

  const stripped = stripStringsAndComments(String(source));

  // Disallow constructs to keep scripts analyzable and safe
  const banned = [
    /\bfunction\b/,
    /\bclass\b/,
    /\basync\b/,
    /\bawait\b/,
    /\bnew\s+[A-Za-z_$]/,
    /\bwhile\b/,
    /\bfor\b/,
    /=>/ // no arrow functions for now
  ];
  for (const re of banned) {
    if (re.test(stripped)) add(`Disallowed construct matched: ${re}`);
  }

  // Allow let (SSA to be enforced later); disallow var
  if (/\bvar\b/.test(stripped)) add('`var` is not allowed; use const or let (single-assignment).');

  // Heuristic: Disallow nested if; allow else-if chains
  const nestedIfError = detectNestedIf(stripped);
  if (nestedIfError) add(nestedIfError);

  // Encourage single default export
  const exportDefaultMatches = stripped.match(/export\s+default/g) || [];
  if (exportDefaultMatches.length !== 1) warn.push('Expected exactly one `export default`');

  return { valid: errors.length === 0, errors, warnings: warn };
}

function stripStringsAndComments(src) {
  let out = '';
  let i = 0;
  let inSL = false, inML = false, inSQ = false, inDQ = false, inBT = false;
  while (i < src.length) {
    const c = src[i], n = src[i+1];
    if (!inSQ && !inDQ && !inBT && !inSL && !inML && c === '/' && n === '/') { inSL = true; i += 2; out += '  '; continue; }
    if (inSL && c === '\n') { inSL = false; out += c; i++; continue; }
    if (inSL) { out += ' '; i++; continue; }
    if (!inSQ && !inDQ && !inBT && !inSL && !inML && c === '/' && n === '*') { inML = true; i += 2; out += '  '; continue; }
    if (inML && c === '*' && n === '/') { inML = false; i += 2; out += '  '; continue; }
    if (inML) { out += ' '; i++; continue; }
    if (!inSQ && !inDQ && !inBT && c === "'") { inSQ = true; out += ' '; i++; continue; }
    if (inSQ && c === "'" && src[i-1] !== '\\') { inSQ = false; out += ' '; i++; continue; }
    if (inSQ) { out += ' '; i++; continue; }
    if (!inSQ && !inDQ && !inBT && c === '"') { inDQ = true; out += ' '; i++; continue; }
    if (inDQ && c === '"' && src[i-1] !== '\\') { inDQ = false; out += ' '; i++; continue; }
    if (inDQ) { out += ' '; i++; continue; }
    if (!inSQ && !inDQ && c === '`') { inBT = !inBT; out += ' '; i++; continue; }
    if (inBT) { out += ' '; i++; continue; }
    out += c; i++;
  }
  return out;
}

function detectNestedIf(src) {
  let depth = 0;
  const ifBodyStack = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const ahead = src.slice(i);
    if (ahead.startsWith('if')) {
      const before = src[i-1] || ' ';
      const after = src.slice(i+2).trimStart();
      if (/[^A-Za-z0-9_$]/.test(before) && after.startsWith('(')) {
        const prev = src.slice(Math.max(0, i-6), i);
        const isElseIf = /else\s+$/.test(prev);
        const activeBodyDepth = ifBodyStack.length ? ifBodyStack[ifBodyStack.length-1] : -1;
        if (!isElseIf && activeBodyDepth >= 0 && depth >= activeBodyDepth) {
          return 'Nested if detected (only flat if/else-if/else chains are allowed)';
        }
      }
    }
    if (c === '{') { depth++; }
    else if (c === '}') {
      depth--;
      while (ifBodyStack.length && depth < ifBodyStack[ifBodyStack.length-1]) {
        ifBodyStack.pop();
      }
    }
    if (c === '{') {
      const back = src.slice(Math.max(0, i-50), i);
      if (/if\s*\([^)]*\)\s*$/.test(back)) {
        ifBodyStack.push(depth);
      }
    }
    i++;
  }
  return null;
}

