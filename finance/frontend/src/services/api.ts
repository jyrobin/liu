import {
  AppendBlockRequest,
  RunPlanRequest,
  ResetRequest,
  RemoveWindowRequest,
  ClearWindowsRequest,
} from '../types/api';
import { Block } from '../types/blocks';

/**
 * API service for finance web
 * Loosely coupled - can work with or without Liu
 */

export const appendBlock = async (sessionId: string, block: Block) => {
  const request: AppendBlockRequest = { sessionId, block };
  const response = await fetch('/api/append', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return response.json();
};

export const runPlan = async (
  plan: string,
  sessionId: string,
  options?: { name?: string; title?: string }
) => {
  const request: RunPlanRequest = {
    plan,
    sessionId,
    name: options?.name || 'web',
    title: options?.title || 'Web Plan',
  };
  const response = await fetch('/api/run-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return response.json();
};

export const resetSession = async (sessionId: string) => {
  const request: ResetRequest = { sessionId };
  const response = await fetch('/api/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return response.json();
};

export const removeWindow = async (sessionId: string, blockId: string) => {
  const request: RemoveWindowRequest = { sessionId, blockId };
  const response = await fetch('/api/windows/remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return response.json();
};

export const clearWindows = async (sessionId: string) => {
  const request: ClearWindowsRequest = { sessionId };
  const response = await fetch('/api/windows/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return response.json();
};
