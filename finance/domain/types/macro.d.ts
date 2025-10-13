export interface MacroSeriesPoint { date: string; value: number }
export interface MacroSeries { name: string; points: MacroSeriesPoint[] }

// Future tools
// export declare function getMacroSeries(args: { name: string; from?: string; to?: string }): MacroSeries;

