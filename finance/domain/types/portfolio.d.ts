export interface Position { symbol: string; qty: number; price?: number }
export interface Portfolio { name: string; positions: Position[] }

// Future tools
// export declare function getPortfolio(args: { name: string }): Portfolio;
// export declare function attributionReport(args: { portfolio: Portfolio; benchmark?: string; from: string; to: string }): any;

