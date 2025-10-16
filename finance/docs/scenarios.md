Here’s a crisp, outside‑in set of high‑level scenarios you can demo or grow
into, split by persona. Each scenario maps to a simple Liu plan (few tool
calls), the finance service does the heavy lifting, and the UI shows narrative
in chat (reports/charts) with windows for rich drill‑downs.

 Value/Fundamentals‑First

  - Companies & Fundamentals
      - KPI Snapshot + Peer Context
          - Ask: “Show AAPL KPIs and closest peers by margins, with peer compare.”
          - Chat: compact KPI report + small peer table; “Focus Window” chip.
          - Windows: Fundamentals dashboard (KPIs, ratios, trend microcards); Peer
  Comparison chart.
      - Estimate Revisions Pulse
          - Ask: “EPS revisions for NVDA last 90 days; flag big changes.”
          - Chat: revisions summary with flags; distribution mini-chart.
          - Windows: Analyst revision timeline + estimate table drill-down.
  - Filings & Disclosures
      - Filing Delta (Story over Time)
          - Ask: “What changed in AAPL MD&A YoY?” (or a specific filing)
          - Chat: diffs summary, key paragraphs extracted; “Focus Window” to filing
  viewer.
          - Windows: Filing viewer with section navigator & side‑by‑side diff.
      - Ownership Moves
          - Ask: “New 13F positions in LULU this quarter; top managers.”
          - Chat: list with manager links, summary stats.
          - Windows: Ownership browser (filters, highlights).
  - Sectors/Themes/Peers
      - Theme Lens
          - Ask: “AI infra theme: members and 1Y relative performance.”
          - Chat: theme summary; top/worst contributors; links.
          - Windows: Theme dashboard (treemap, rel perf chart, flows table).
      - Dynamic Peers by Fundamentals
          - Ask: “Peers to LLY by growth/margins; 6m returns overlay.”
          - Chat: peer list + quick stats.
          - Windows: multi-series overlay chart + peer cards.
  - News/Events/Sentiment
      - Event Digest with Angle
          - Ask: “All negative news on TSM last 7 days; summarize why.”
          - Chat: condensed narrative with links; sentiment badge.
          - Windows: News browser panel (filters, sources, time).
  - Macro/Cross‑Asset
      - Macro Context for a Name
          - Ask: “AAPL vs key macro (rates, USD, CPI regime).”
          - Chat: high-level macro effects summary (narrative).
          - Windows: macro dashboard with overlay and regime markers.
  - Portfolio & Analytics
      - Attribution in One Glance
          - Ask: “Attribution by sector vs SPY last quarter.”
          - Chat: attribution summary; sector deltas.
          - Windows: Attribution waterfall + sector contributions drill‑down.

  Chart/Technical‑Focused

  - Market Data & Microstructure
      - Chart + Window (Both)
          - Ask: “AAPL price (3M) with SMA(20) & volume.”
          - Chat: inline Vega chart with “Focus Window”.
          - Windows: richer chart (multi‑pane), interactions (markers, measurements).
      - Depth & Tape Glance
          - Ask: “MSFT L2 snapshot & recent prints (last 1k).”
          - Chat: quick note (liquidity pockets or anomalies).
          - Windows: Depth panel + Time & Sales window.
  - Screening & Ranking
      - Momentum Screen with Distributions
          - Ask: “Top 20 large caps by momentum, filter by liquidity.”
          - Chat: summary + histogram of factor scores.
          - Windows: Screener table with factor breakdowns per row.
  - Backtesting & Research
      - Quick Strategy Backtest (Monthly Rebalance)
          - Ask: “Test low‑vol + quality tilt since 2015.”
          - Chat: outcome summary (CAGR/vol/Sharpe, maxDD).
          - Windows: Equity curve + drawdown + turnover windows.
  - Alternative Data
      - Signal Overlay for Story
          - Ask: “Web traffic vs revenue YoY for ETSY; forward return context.”
          - Chat: overlay summary, correlations, ‘signal strength’ annotation.
          - Windows: Chart overlays + cohort breakdown window.
  - Risk & Compliance
      - Factor Check
          - Ask: “Factor exposures for my basket; any constraints breached?”
          - Chat: exposure summary, warnings.
          - Windows: Factor exposure timeline; constraints console.

  Cross‑cutting Scenarios (Both Personas)

  - Research Session Narrative (Chat‑first)
      - Ask: “Compare AAPL/MSFT/GOOGL across KPIs; pull 2 recent news items; quick
  valuation context.”
      - Chat: stitched narrative (reports + one chart). Chips to focus windows.
      - Windows: Comparison chart, AAPL fundamentals, news browser.
      - Why Liu: single short plan coordinating multiple high‑level tools with data‑shaped
  returns, easy to author/approve.
  - “Ask → Plan Preview → Approve → Run”
      - Ask: “Show peers for LLY by growth/margins, plus 6m returns overlay and last 2
  filings highlights.”
      - Chat: plan preview; user approves; plan runs.
      - Chat: reports & chart; “Focus Window” chips.
      - Windows: overlay chart, filings viewer.

  Why Liu + Finance (what’s compelling)

  - Small plans, big results: high‑level tools do the heavy lifting; plans stay readable,
  LLM‑friendly.
  - Right content in the right place:
      - Chat for narrative (request, text, plan preview, chart, report)
      - Windows for interactive drill‑downs
      - Logs panel for operational updates
  - Link‑through UX: “Focus Window” chips connect narrative to windows smoothly.
  - Data‑shaped returns: tools return status + ids/handles (e.g., windowId, chartId), enabling orchestration without dumping raw payloads.
  - Evolvable vocabulary: add smarter “agent‑like” tools later without changing plan form; introduce MCP for discovery when needed.

  Near‑term demos to prioritize

  - Fundamentals Snapshot + Peer Context (value)
  - Filing Delta (Story over Time) (value)
  - Chart + Window Both (technical) — already added as chart_both_demo
  - Momentum Screen with Distributions (technical)
  - Research Session Narrative (Chat‑first) (both personas)
