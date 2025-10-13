Market Data & Microstructure

Scope
- Trades/quotes (TAQ), L1/L2 books, OHLCV bars, corporate actions.

Data
- Ticks, snapshots, aggregated bars; adjustments for splits/dividends.

Tools (initial)
- getDailyBars(symbol, from, to, adjusted?) → BarsDaily
- enrichSMA(bars, period) → BarsDaily
- enrichBollinger(bars, period, mult) → BarsDaily

Visualizations
- OHLC/candles with overlays (SMA/BB), depth/book, time & sales.

Queries
- “AAPL daily since 2015 adjusted”
- “5m bars with Bollinger(20,2) and VWAP overlay”

