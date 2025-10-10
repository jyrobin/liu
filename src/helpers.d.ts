// Type definitions for Liu helpers (strict, no any)

export type StandardError = { code?: string; message: string; cause?: unknown };

export type WaitSpec = {
  eventType?: string;
  approval?: { approver?: string };
  correlationKey?: string;
  timeoutMs?: number;
  deadlineISO?: string;
};

export type ToolFn<TArgs extends object, TResult> = (args: TArgs) => TResult;
type AnyToolFn = { bivarianceHack(args: unknown): unknown }['bivarianceHack'];

export function mapItems<TItem extends object, TResult>(
  tool: ToolFn<TItem, TResult>,
  items: readonly Readonly<TItem>[],
  options?: {
    defaults?: Partial<TItem>;
    collectIf?: { on: 'result' | 'item'; field: string; op?: 'eq' | 'ne' | 'gt' | 'lt' | 'ge' | 'le'; value: unknown };
  }
): TResult[];

export function retry<TArgs extends object, TResult>(opts: { step: readonly [ToolFn<TArgs, TResult>, TArgs]; times?: number; backoffMs?: number }): TResult;

export function wait_for<TArgs extends object, TResult>(tool: ToolFn<TArgs, TResult>, args: TArgs, wait: WaitSpec): TResult;
export function wait_for(wait: WaitSpec): { status: 'waiting' };

export function wait_event(options?: WaitSpec): { status: 'waiting'; kind: 'event' };
export function wait_approval(options?: WaitSpec): { status: 'waiting'; kind: 'approval' };
export function wait_until(options?: WaitSpec): { status: 'waiting'; kind: 'until' };

export function set_var<T>(args: { value: T }): { result: T };

