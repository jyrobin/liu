import type { ComponentType } from 'react';
import LightweightOhlcWindow from './LightweightOhlcWindow';

const registry: Record<string, ComponentType<any>> = {
  'ohlc-lightweight': LightweightOhlcWindow,
};

export function getWinBoxComponent(name?: string): ComponentType<any> | undefined {
  if (!name) return undefined;
  return registry[name];
}
