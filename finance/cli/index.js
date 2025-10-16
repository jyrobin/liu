#!/usr/bin/env node
// Finance CLI (yargs) to exercise finance/core
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'node:fs/promises';
import { getUniverse, getOhlcRangeBatch, runSectorMomentum } from '../core/index.js';

await yargs(hideBin(process.argv))
  .scriptName('finance')
  // Global options
  .option('json', {
    type: 'boolean',
    desc: 'Output JSON for machine-friendly use',
    global: true,
    default: false,
  })
  .option('out', {
    type: 'string',
    desc: 'Write report (e.g., HTML) to file',
    global: true,
  })
  // Universe
  .command('universe get <name>', 'Get a universe', (y) =>
    y.positional('name', { type: 'string', desc: 'Universe name' }),
    async (args) => {
      const uni = getUniverse(args.name);
      if (args.json) console.log(JSON.stringify(uni, null, 2));
      else console.log(uni);
    }
  )
  // OHLC batch
  .command('ohlc batch', 'Get OHLC handles for symbols', (y) =>
    y
      .option('symbols', { type: 'string', demandOption: true, desc: 'Comma-separated symbols' })
      .option('lookback', { type: 'string', default: '3M' })
      .option('interval', { type: 'string', default: '1D' }),
    async (args) => {
      const symbols = String(args.symbols).split(',').map((s) => s.trim()).filter(Boolean);
      const handles = await getOhlcRangeBatch(symbols, { lookback: args.lookback, interval: args.interval });
      const payload = { handles };
      if (args.json) console.log(JSON.stringify(payload, null, 2));
      else console.log(payload);
    }
  )
  // Momentum: sector
  .command('momentum sector', 'Run sector momentum pipeline', (y) =>
    y
      .option('universe', { type: 'string', default: 'US_LARGE' })
      .option('lookback', { type: 'string', default: '3M' })
      .option('interval', { type: 'string', default: '1D' })
      .option('k', { type: 'number', default: 5 })
      .option('n', { type: 'number', default: 5 }),
    async (args) => {
      const { html, sectorScores, leaders } = await runSectorMomentum({
        universe: args.universe,
        lookback: args.lookback,
        interval: args.interval,
        k: args.k,
        n: args.n,
      });
      const summary = { sectorScores, leaders };
      if (args.json) console.log(JSON.stringify(summary, null, 2));
      else console.log(summary);
      if (args.out) {
        await fs.writeFile(String(args.out), html, 'utf8');
        console.error(`Wrote report: ${args.out}`);
      }
    }
  )
  .demandCommand(1, 'Please specify a command')
  .strict()
  .help()
  .parse();
