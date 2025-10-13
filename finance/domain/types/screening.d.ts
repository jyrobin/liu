export type ScreenExpr = string; // domain-specific expression language

export interface ScreenResultRow { symbol: string; [k: string]: number | string | null }
export interface ScreenResult { rows: ScreenResultRow[] }

// Future tools
// export declare function runScreen(args: { universe?: string[]; expr: ScreenExpr; limit?: number }): ScreenResult;

