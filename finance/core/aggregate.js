// Aggregation helpers

/** Aggregate symbol scores by sector mapping */
export function aggregateByGroup(scores, mapping, key='sector'){
  const map = new Map();
  const symToGroup = new Map((mapping||[]).map(m => [m.symbol, m[key] || 'Other']));
  for (const s of (scores||[])){
    const g = symToGroup.get(s.symbol) || 'Other';
    const prev = map.get(g) || { sector: g, sum: 0, count: 0 };
    prev.sum += Number(s.score||0);
    prev.count += 1;
    map.set(g, prev);
  }
  return Array.from(map.values()).map(v => ({ sector: v.sector, score: v.count ? v.sum / v.count : 0 }));
}

/** Rank top K groups by score */
export function rankTopK(grouped, k){
  const arr = (grouped||[]).slice().sort((a,b)=> (b.score||0) - (a.score||0));
  return arr.slice(0, Math.max(0, Number(k)||0));
}

/** For a list of top groups, select top N symbols by score per group */
export function selectTopNPerGroup(scores, mapping, topGroups, n){
  const symToGroup = new Map((mapping||[]).map(m => [m.symbol, m.sector || 'Other']));
  const groupSet = new Set((topGroups||[]).map(g => g.sector));
  const byGroup = new Map();
  for (const s of (scores||[])){
    const grp = symToGroup.get(s.symbol) || 'Other';
    if (!groupSet.has(grp)) continue;
    const arr = byGroup.get(grp) || [];
    arr.push({ symbol: s.symbol, score: Number(s.score||0) });
    byGroup.set(grp, arr);
  }
  const leaders = [];
  byGroup.forEach((arr, grp) => {
    arr.sort((a,b)=> b.score - a.score);
    leaders.push({ sector: grp, symbols: arr.slice(0, Math.max(0, Number(n)||0)).map(x=>x.symbol) });
  });
  return leaders;
}

