export interface StrategyConfig { name: string; params?: Record<string, any> }
export interface BacktestStats { cagr?: number; vol?: number; maxDD?: number; sharpe?: number; turnover?: number }

// Future tools
// export declare function backtest(args: { strategy: StrategyConfig; from: string; to: string }): { stats: BacktestStats; equity: Array<{ date: string; value: number }> };

