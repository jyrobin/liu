export interface FactorExposure { name: string; value: number }
export interface RiskReport { date: string; exposures: FactorExposure[] }

// Future tools
// export declare function computeRisk(args: { portfolio: { positions: Array<{ symbol: string; qty: number }> } }): RiskReport;

