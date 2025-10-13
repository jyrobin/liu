// Block types for the finance web streaming protocol

export interface BaseBlock {
  id?: string;
  kind: string;
}

export interface RequestBlock extends BaseBlock {
  kind: 'request';
  text: string;
}

export interface TextBlock extends BaseBlock {
  kind: 'text';
  title?: string;
  text: string;
}

export interface PlanBlock extends BaseBlock {
  kind: 'plan';
  code: string;
}

export interface ChartBlock extends BaseBlock {
  kind: 'chart';
  spec: any; // Vega-Lite spec
  data?: any[]; // Optional inline data
}

export interface WinBoxBlock extends BaseBlock {
  kind: 'winbox';
  id?: string;
  title?: string;
  x?: number | string;
  y?: number | string;
  width?: number;
  height?: number;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  className?: string;
  html?: string;
}

export interface WinBoxCloseBlock extends BaseBlock {
  kind: 'winbox-close';
  targetId: string;
}

export interface WinBoxClearBlock extends BaseBlock {
  kind: 'winbox-clear';
}

export interface ResetBlock extends BaseBlock {
  kind: 'reset';
}

export interface InfoBlock extends BaseBlock {
  kind: 'info';
  text: string;
}

export interface ErrorBlock extends BaseBlock {
  kind: 'error';
  text: string;
}

export type Block =
  | RequestBlock
  | TextBlock
  | PlanBlock
  | ChartBlock
  | WinBoxBlock
  | WinBoxCloseBlock
  | WinBoxClearBlock
  | ResetBlock
  | InfoBlock
  | ErrorBlock;
