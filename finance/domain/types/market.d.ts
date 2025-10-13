export type TimeISO = string; // YYYY-MM-DD or ISO
export type Price = number;

export interface BarDaily { date: TimeISO; open: Price; high: Price; low: Price; close: Price; [k: string]: any }

export interface BarsDaily {
  symbol: string;
  timeframe: '1D';
  adjusted: boolean;
  rows: BarDaily[];
}

export declare function getDailyBars(args: { symbol: string; from?: TimeISO; to?: TimeISO; adjusted?: boolean }): BarsDaily;
export declare function enrichSMA(args: { bars: BarsDaily | { rows: BarDaily[] }; period?: number; field?: string; outField?: string }): BarsDaily;
export declare function enrichBollinger(args: { bars: BarsDaily | { rows: BarDaily[] }; period?: number; mult?: number; field?: string; out?: { mid?: string; upper?: string; lower?: string } }): BarsDaily;

