export interface NewsItem { id: string; ts: string; headline: string; source?: string; url?: string; sentiment?: 'pos'|'neg'|'neu'; symbols?: string[]; topics?: string[] }
export interface NewsList { items: NewsItem[] }

// Future tools
// export declare function listNews(args: { symbols?: string[]; since?: string; until?: string; limit?: number }): NewsList;

