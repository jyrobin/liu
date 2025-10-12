export declare function financeEnsureSession(args: { name: string; title?: string; serverUrl?: string }): { ok: boolean; name: string; sessionId: string; serverUrl: string; reused: boolean };
export declare function financeEnsureSessionEnv(): { ok: boolean; name: string; sessionId: string; serverUrl: string; reused: boolean };
export declare function financeUseSession(args: { name: string }): { ok: boolean; name: string; sessionId: string };
export declare function financeCurrentSession(): { active: string | null; sessionId?: string; serverUrl?: string; title?: string };
export declare function financeRemoveSession(args: { name: string }): { ok: boolean };

export declare function uiAppendRequest(args: { sessionId?: string; text: string }): { ok: boolean };
export declare function uiAppendText(args: { sessionId?: string; title?: string; text: string }): { ok: boolean };
export declare function uiAppendChart(args: { sessionId?: string; spec: any; data?: any[] }): { ok: boolean };

export declare function uiOpenWindow(args: { sessionId?: string; title?: string; x?: number | string; y?: number | string; width?: number | string; height?: number | string; top?: number | string; right?: number | string; bottom?: number | string; left?: number | string; className?: string; html?: string }): { ok: boolean };
export declare function uiOpenWindows(args: { sessionId?: string; windows: Array<{ id?: string; title?: string; x?: number | string; y?: number | string; width?: number | string; height?: number | string; top?: number | string; right?: number | string; bottom?: number | string; left?: number | string; className?: string; html?: string }> }): { ok: boolean };

export declare function fetchDailyOHLC(args: { symbol: string; period?: string }): { symbol: string; period: string; rows: Array<{ date: string; open: number; high: number; low: number; close: number }>} ;

