export interface FilingItem { id: string; type: '10-K' | '10-Q' | '8-K' | string; period: string; date: string; title: string }
export interface FilingsList { symbol: string; rows: FilingItem[] }

export interface FilingSection { id: string; title: string; summary: string }
export interface FilingSections { symbol: string; filingId: string; sections: FilingSection[] }

export declare function listFilings(args: { symbol: string; limit?: number }): FilingsList;
export declare function getFilingSections(args: { symbol: string; filingId?: string }): FilingSections;

