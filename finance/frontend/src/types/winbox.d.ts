// WinBox type definitions

declare global {
  interface Window {
    WinBox: typeof WinBox;
    __FIN_SESSION_ID?: string;
  }
}

interface WinBoxOptions {
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
  class?: string;
  root?: HTMLElement;
  onclose?: () => boolean | void;
  onminimize?: () => void;
  onrestore?: () => void;
  onfocus?: () => void;
  onblur?: () => void;
  onmove?: (x: number, y: number) => void;
  onresize?: (width: number, height: number) => void;
}

declare class WinBox {
  constructor(options: WinBoxOptions);
  static new(options: WinBoxOptions): WinBox;

  id: string;
  body: HTMLElement;

  close(force?: boolean): void;
  minimize(): void;
  restore(): void;
  focus(): void;
  hide(): void;
  show(): void;
  setTitle(title: string): void;
  move(x: number, y: number): void;
  resize(width: number, height: number): void;
}

export default WinBox;
