// Finance Core: shared types (JSDoc for editor help)

/** @typedef {{date: string, open: number, high: number, low: number, close: number}} OhlcRow */
/** @typedef {'1D'|'1W'|'1M'|'1H'|'5m'} Interval */
/** @typedef {'1M'|'3M'|'6M'|'12M'|string} Lookback */

/** @typedef {{ id: string, symbols: string[] }} Universe */
/** @typedef {{ symbol: string, sector: string }} SectorMapItem */

/** @typedef {{ kind: 'ohlc-handle', handleId: string, symbol: string, interval: Interval, start?: string, end?: string, rowsHint?: number }} OhlcHandle */

/** @typedef {{ columns: string[], rows: any[] }} TableSection */
/** @typedef {{ items: string[] }} ListSection */
/** @typedef {{ text: string }} TextSection */
/** @typedef {{ spec: any, data?: any[] }} FigureSection */
/** @typedef {{ kind: 'table'|'list'|'text'|'figure'|'grid', data: any, title?: string }} ReportSection */
/** @typedef {{ title: string, sections: ReportSection[] }} Report */

export {}; // types only

