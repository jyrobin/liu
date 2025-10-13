export interface CompanyIdents { ticker: string; name: string; lei?: string; isin?: string; cusip?: string; exchange?: string; mic?: string }
export interface StatementItem { period: string; date: string; metric: string; value: number }

export type RatioMetric = 'ROIC' | 'GrossMargin' | 'OperatingMargin' | 'NetMargin' | 'EVtoEBITDA' | string;

export interface RatiosSeries { symbol: string; items: Array<{ date: string; metric: RatioMetric; value: number }>; }

// Future tools
// export declare function getCompany(args: { symbol: string }): CompanyIdents;
// export declare function getRatios(args: { symbol: string; metrics: RatioMetric[] }): RatiosSeries;

