// Report model and builders

/**
 * Create an empty report
 * @param {string} title
 */
export function createReport(title){
  return { title: String(title||''), sections: [] };
}

export function addTable(report, title, columns, rows){
  report.sections.push({ kind: 'table', title, data: { columns, rows } });
}

export function addList(report, title, items){
  report.sections.push({ kind: 'list', title, data: { items } });
}

export function addText(report, text){
  report.sections.push({ kind: 'text', data: { text } });
}

export function addFigure(report, title, spec, data){
  report.sections.push({ kind: 'figure', title, data: { spec, data } });
}

/**
 * Build a simple sector momentum report
 * @param {{ sectorScores: Array<{sector:string,score:number}>, leaders: Array<{sector:string,symbols:string[]}> }} args
 */
export function buildSectorMomentumReport(args){
  const rep = createReport('Sector Momentum');
  const rows = (args.sectorScores||[]).map(s => [s.sector, round(s.score||0)]);
  addTable(rep, 'Top Sectors', ['Sector','Score'], rows);
  const leaderItems = (args.leaders||[]).map(l => `${l.sector}: ${l.symbols.join(', ')}`);
  addList(rep, 'Leaders per Sector', leaderItems);
  return rep;
}

function round(x){ return Math.round(x*1000)/1000 }

