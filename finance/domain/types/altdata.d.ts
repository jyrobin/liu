export interface AltDataPoint { date: string; value: number }
export interface AltSeries { name: string; symbol?: string; points: AltDataPoint[] }

// Future tools
// export declare function getAltSeries(args: { name: string; symbol: string; from?: string; to?: string }): AltSeries;

