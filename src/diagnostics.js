import vm from 'node:vm';

// Produce human-readable diagnostics for Liu TS source
// Combines: constraint checks with positions + optional syntax check via vm.Script

export async function diagnoseLiuSource(source) {
  const text = String(source || '');
  const messages = [];

  // Helper to record a finding
  const add = (idx, len, msg) => {
    const { line, column, caret } = posToLineCol(text, idx, len);
    messages.push({ line, column, message: msg, caret });
  };

  // Constraint checks (simple token scans)
  const tokens = [
    { re: /\bfunction\b/g, msg: 'Functions are not allowed' },
    { re: /\bclass\b/g, msg: 'Classes are not allowed' },
    { re: /\basync\b/g, msg: 'async/await are not allowed' },
    { re: /\bawait\b/g, msg: 'async/await are not allowed' },
    { re: /\bwhile\b/g, msg: 'Loops are not allowed' },
    { re: /\bfor\b/g, msg: 'Loops are not allowed' },
    { re: /=>/g, msg: 'Arrow functions are not allowed' },
    { re: /\bvar\b/g, msg: 'var is not allowed; use const/let (single-assignment)' },
  ];
  for (const t of tokens) {
    let m;
    while ((m = t.re.exec(text)) !== null) add(m.index, m[0].length, t.msg);
  }

  // Nested if heuristic: flag an inner `if` if directly within another if-block
  const ifPositions = [];
  let mIf;
  const reIf = /\bif\s*\(/g;
  while ((mIf = reIf.exec(text)) !== null) ifPositions.push(mIf.index);
  if (ifPositions.length > 1) {
    // crude but effective: mark all ifs after the first as potential nested
    for (let i = 1; i < ifPositions.length; i++) add(ifPositions[i], 2, 'Nested if detected (only flat if/else-if/else allowed)');
  }

  // Syntax check with TypeScript if available; fallback to vm.Script
  let tsUsed = false;
  try {
    const ts = await import('typescript');
    const fileName = 'plan.liu.ts';
    const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.ES2022, /*setParentNodes*/ true, ts.ScriptKind.TS);
    // Create a minimal program to surface syntactic diagnostics
    const options = { noLib: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext };
    const host = ts.createCompilerHost(options);
    host.getSourceFile = (f, langVersion) => (f === fileName ? sf : undefined);
    host.readFile = () => undefined; host.fileExists = (f) => f === fileName;
    host.getCanonicalFileName = f => f; host.getCurrentDirectory = () => '';
    host.getNewLine = () => '\n'; host.writeFile = () => {};
    const program = ts.createProgram([fileName], options, host);
    const diags = program.getSyntacticDiagnostics(sf);
    for (const d of diags) {
      const start = d.start || 0; const len = d.length || 1;
      const { line, character } = sf.getLineAndCharacterOfPosition(start);
      const { caret } = posToLineCol(text, start, len);
      messages.push({ line: line + 1, column: character + 1, message: ts.flattenDiagnosticMessageText(d.messageText, '\n'), caret });
    }
    tsUsed = diags.length > 0;
  } catch (_) { /* TS not available */ }
  if (!tsUsed) {
    try { new vm.Script(text, { filename: 'plan.liu.ts' }); }
    catch (e) { const { index, length } = { index: 0, length: 1 }; add(index, length, `Syntax error: ${String(e.message || '').split('\n')[0]}`); }
  }

  // Format output lines with carets
  const formatted = formatMessages(text, messages);
  return { ok: messages.length === 0, messages, formatted };
}

function posToLineCol(text, index, len) {
  let line = 1, col = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === '\n') { line++; col = 1; } else { col++; }
  }
  const caret = ' '.repeat(Math.max(0, col - 1)) + '^'.repeat(Math.max(1, len || 1));
  return { line, column: col, caret };
}

function extractErrorIndex(err) {
  // Try to parse something like: SyntaxError: Unexpected token ')' at plan.liu.ts:3
  const m = String(err && err.stack || '').match(/:(\d+):(\d+)/);
  if (!m) return null;
  const line = parseInt(m[1], 10);
  const col = parseInt(m[2], 10);
  // Convert line/col to index (approximate)
  let idx = 0; let l = 1; let c = 1;
  const s = String(err.source || '');
  // Fall back to zero if no source attached
  const text = s.length ? s : '';
  // Without original source bound to error, return null to let caller compute caret on start
  return null;
}

function formatMessages(text, messages) {
  const lines = text.split(/\r?\n/);
  const out = [];
  for (const m of messages) {
    const src = lines[m.line - 1] || '';
    out.push(`line ${m.line}, col ${m.column}: ${m.message}`);
    out.push(src);
    out.push(m.caret);
  }
  return out.join('\n');
}
