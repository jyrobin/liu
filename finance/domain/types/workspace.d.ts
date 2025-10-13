export interface WindowDescriptor { id?: string; title?: string; x?: number | string; y?: number | string; width?: number | string; height?: number | string; top?: number | string; right?: number | string; bottom?: number | string; left?: number | string; className?: string; html?: string }
export interface LayoutState { windows: WindowDescriptor[] }

// Future tools
// export declare function saveLayout(args: { name: string; layout: LayoutState }): { ok: boolean };
// export declare function loadLayout(args: { name: string }): LayoutState;

