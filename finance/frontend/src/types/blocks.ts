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
  windowRefId?: string;
}

export interface ReportBlock extends BaseBlock {
  kind: 'report';
  title?: string;
  html: string;
  windowRefId?: string; // optional id of associated window
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
  component?: string;
  componentProps?: Record<string, any>;
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

export interface CommandBlock extends BaseBlock {
  kind: 'command';
  command: string;
  params: Record<string, any>;
}

export interface LogBlock extends BaseBlock {
  kind: 'log';
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  ts?: number;
}

export interface ProgressBlock extends BaseBlock {
  kind: 'progress';
  operation: string;
  current: number;
  total: number;
  message?: string;
}

export type Block =
  | RequestBlock
  | TextBlock
  | PlanBlock
  | ChartBlock
  | ReportBlock
  | WinBoxBlock
  | WinBoxCloseBlock
  | WinBoxClearBlock
  | ResetBlock
  | InfoBlock
  | ErrorBlock
  | CommandBlock
  | LogBlock
  | ProgressBlock;
