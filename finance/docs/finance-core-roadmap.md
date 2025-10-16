Finance Core Roadmap — Architecture, Rationale, and Phased Plan

Background & Rationale
- Goal: build a strong finance/core library that can be used standalone (via a CLI) and be scriptable by Liu plans at a high level.
- Principle: keep “heavy lifting” (data retrieval, caching, analytics, aggregation, report building) in finance/core. Plans remain small orchestration scripts returning data‑shaped results (ids/handles/metadata), not large payloads.
- UI contract: the server/clients append typed blocks (request/text/report/chart/winbox/log/progress). Chat displays narrative (report/chart), windows host interactive views, logs show operational events.
- LLM friendliness: expose a small, high‑level vocabulary in Liu (tools + .d.ts types) that maps onto core abstractions. The service/CLI do complex steps; plans only compose.
- “Commands as data”: tools and CLI return CommandResult objects with metadata (e.g., windowId, handle ids), enabling orchestration and linking (e.g., Focus Window) without fat payloads.

What “Core” Should Include (Now)
- Dataset handles and stores for OHLC/time series (batch‑friendly), universe + mapping providers, momentum/returns engines, aggregation helpers.
- Report model (no HTML in core) and lightweight renderers (HTML/JSON) separate from core logic.
- Simple file cache (pluggable later).

Scope Guardrails
- Keep core pure (no HTTP/server). finance/server calls into core; finance/cli exercises core directly.
- Avoid recursive plan complexity: plans orchestrate at one or two levels; core/CLI handle bulk processing.
- Momentum is a first concrete slice; design types/utilities to be broadly useful (fundamentals/filings/news/macro later reuse Report, aggregation, handles, cache).

Phased Plan (with checkboxes)

Phase 1 — Core Foundation (finance/core)
- [ ] Project skeleton (index.ts, types.ts)
- [ ] Universe store (universe.ts)
  - [ ] getUniverse(name) → { id, symbols }
- [ ] Mapping provider (mapping.ts)
  - [ ] getSectorMap(symbols) → [{ symbol, sector }]
- [ ] OHLC store (ohlc.ts)
  - [ ] OhlcHandle type (handleId, symbol, interval, range)
  - [ ] getOhlcRangeBatch(symbols, { lookback, interval }) → OhlcHandle[]
  - [ ] fetchOhlc(handleId) → TimeSeriesFrame<OhlcRow> (for CLI debug)
- [ ] Returns/Momentum engine (momentum.ts)
  - [ ] computeReturnsBatch(handles, lookback)
  - [ ] computeMomentumBatch(handles, { method: 'total_return'|'risk_adj', lookback })
- [ ] Aggregation helpers (aggregate.ts)
  - [ ] aggregateByGroup(scores, mapping, 'sector') → [{ sector, score }]
  - [ ] rankTopK(groupedScores, k)
  - [ ] selectTopNPerGroup(scores, mapping, topGroups, n)
- [ ] Report model (report.ts)
  - [ ] Report, ReportSection (table/list/text/figure/grid)
  - [ ] Builders: sector momentum report (table + leaders list)
- [ ] Renderers (renderers/html.ts)
  - [ ] renderHTML(report) → string (inline styles)
  - [ ] (optional) renderJSON(report)
- [ ] Cache (cache/*)
  - [ ] ID hashing for handles (symbol+range+interval)
  - [ ] read/write helpers

Phase 2 — CLI (finance/cli)
- [ ] CLI skeleton (bin/finance or src/index.ts)
- [ ] Command: universe get <name>
- [ ] Command: ohlc batch --symbols AAPL,MSFT --lookback 3M --interval 1D
- [ ] Command: momentum sector --universe US_LARGE --lookback 3M --k 5 --n 5
  - [ ] Calls core pipeline, prints summary, writes HTML report to stdout/file

Phase 3 — Liu Mapping (domain types/tools)
- [ ] Ensure Liu d.ts mirrors core (OhlcHandle, Universe, SectorMapItem, etc.) at high level
- [ ] Keep high‑level primitive tools (getUniverse, getOhlcRangeBatch, computeMomentumBatch, …) returning CommandResult with typed fields
- [ ] Keep/extend high‑level convenience commands (showPriceChart, showFundamentals, …) – server delegates to core

Phase 4 — Server Integration (optional for this phase)
- [ ] Replace mock command handlers with core calls
- [ ] Build reports via core + renderers/html
- [ ] Preserve SSE block contract; add windowRefId linking as needed

Deliverables & Acceptance
- finance/core with implemented skeleton and one end‑to‑end momentum flow producing a Report.
- finance/cli that runs the sector momentum demo end‑to‑end and writes an HTML report.
- Liu plan (already added) that composes primitives (sector_momentum_primitives.liu.ts), mapping onto the same conceptual pipeline.

Open Questions / Later Slices
- Data source adapters (APIs, DB) and richer cache (columnar)
- Fundamentals/Filings/News/Macro cores reusing the same Report + aggregation surfaces
- MCP integration for discovery (later), agent profiles, intent routing

