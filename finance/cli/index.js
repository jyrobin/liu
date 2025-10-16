#!/usr/bin/env node
// Simple CLI to exercise finance/core
import fs from 'node:fs/promises';
import { getUniverse, getOhlcRangeBatch, runSectorMomentum } from '../core/index.js';

function parseArgs(argv){
  const args = argv.slice(2);
  return args;
}

async function main(){
  const args = parseArgs(process.argv);
  const cmd = args[0];
  if (!cmd || cmd === 'help') return usage();

  if (cmd === 'universe' && args[1] === 'get'){
    const name = args[2] || 'US_LARGE';
    const uni = getUniverse(name);
    console.log(JSON.stringify(uni, null, 2));
    return;
  }

  if (cmd === 'ohlc' && args[1] === 'batch'){
    const symbolsArg = pickFlag(args, '--symbols') || 'AAPL,MSFT';
    const lookback = pickFlag(args, '--lookback') || '3M';
    const interval = pickFlag(args, '--interval') || '1D';
    const symbols = symbolsArg.split(',').map(s=>s.trim()).filter(Boolean);
    const handles = await getOhlcRangeBatch(symbols, { lookback, interval });
    console.log(JSON.stringify({ handles }, null, 2));
    return;
  }

  if (cmd === 'momentum' && args[1] === 'sector'){
    const universe = pickFlag(args, '--universe') || 'US_LARGE';
    const lookback = pickFlag(args, '--lookback') || '3M';
    const k = Number(pickFlag(args, '--k') || 5);
    const n = Number(pickFlag(args, '--n') || 5);
    const out = pickFlag(args, '--out');
    const { html, sectorScores, leaders } = await runSectorMomentum({ universe, lookback, k, n });
    console.log(JSON.stringify({ sectorScores, leaders }, null, 2));
    if (out){ await fs.writeFile(out, html, 'utf8'); console.error(`Wrote report: ${out}`); }
    return;
  }

  return usage(`Unknown command: ${cmd}`);
}

function pickFlag(args, flag){
  const i = args.indexOf(flag);
  if (i >= 0 && i+1 < args.length) return args[i+1];
  return undefined;
}

function usage(err){
  if (err) console.error(err);
  console.error(`
Finance CLI (Phase 2)

Usage:
  finance cli universe get <name>
  finance cli ohlc batch --symbols AAPL,MSFT --lookback 3M --interval 1D
  finance cli momentum sector --universe US_LARGE --lookback 3M --k 5 --n 5 [--out report.html]
`);
  process.exit(err ? 1 : 0);
}

main().catch((e)=>{ console.error(e?.stack||e); process.exit(1); });

