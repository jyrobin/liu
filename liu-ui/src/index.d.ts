import * as React from 'react';

export type XY = number | string;
export type Size = number | string;

export interface WinBoxOptions {
  id?: string;
  root?: HTMLElement;
  title?: string;
  icon?: string;
  className?: string;
  x?: XY;
  y?: XY;
  width?: Size;
  height?: Size;
  top?: XY;
  right?: XY;
  bottom?: XY;
  left?: XY;
  minWidth?: Size;
  minHeight?: Size;
  maxWidth?: Size;
  maxHeight?: Size;
  background?: string;
  index?: number;
  modal?: boolean;
  hide?: boolean;
  noMin?: boolean;
  noMax?: boolean;
  noFull?: boolean;
  noClose?: boolean;
  noResize?: boolean;
  noMove?: boolean;
  noHeader?: boolean;
  noShadow?: boolean;
  onClose?: (force: boolean) => boolean | void;
  onMove?: (x: number, y: number) => any;
  onResize?: (width: number, height: number) => any;
  onFocus?: () => any;
  onBlur?: () => any;
}

export interface WinBoxAPI {
  winbox: any;
  render: (element: React.ReactElement) => void;
  update: (next?: Partial<WinBoxOptions>) => void;
  destroy: (force?: boolean) => void;
}

export function createWinBoxRoot(options?: WinBoxOptions, winbox?: any): WinBoxAPI;

export function useWinBox(options?: WinBoxOptions, winbox?: any): {
  api: WinBoxAPI;
  container: HTMLElement | null;
};

export interface WinBoxHostProps {
  options?: WinBoxOptions;
  winbox?: any;
  children?: React.ReactNode;
}

export function WinBoxHost(props: WinBoxHostProps): React.ReactElement | null;

declare const _default: {
  createWinBoxRoot: typeof createWinBoxRoot;
  useWinBox: typeof useWinBox;
  WinBoxHost: typeof WinBoxHost;
};
export default _default;

