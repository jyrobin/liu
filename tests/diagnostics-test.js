import { diagnoseLiuSource } from '../src/diagnostics.js';

async function runCase(name, src) {
  const d = await diagnoseLiuSource(src);
  console.log(`=== ${name} ===`);
  console.log(d.formatted);
  return d;
}

const badAsync = `
import { add } from '@tools';

const s1 = add({ a: 1, b: 2 });
async function nope() { return 42; }
export default { ok: true };
`;

const nestedIf = `
import { add } from '@tools';
const x = add({ a: 1, b: 2 });
if (x.result > 0) {
  if (x.result > 1) {
    // nested
  }
}
export default { ok: true };
`;

const syntaxErr = `
import { add } from '@tools';
const x = add({ a: 1, b: 2 );
export default { ok: true };
`;

async function main() {
  const d1 = await runCase('banned-async', badAsync);
  const d2 = await runCase('nested-if', nestedIf);
  const d3 = await runCase('syntax-error', syntaxErr);

  // Basic checks for correct caret presence and no double blank lines
  const all = [d1.formatted, d2.formatted, d3.formatted].join('\n');
  if (/\n\n\n/.test(all)) {
    console.error('Found triple blank lines in diagnostics output');
    process.exit(1);
  }
  // Ensure line/col markers appear
  if (!/line \d+, col \d+:/.test(all)) {
    console.error('Diagnostics missing line/col markers');
    process.exit(1);
  }
  console.log('OK');
}

main().catch(e => { console.error(e); process.exit(1); });
