// API types for finance web service

export interface SessionInfo {
  sessionId: string;
  name?: string;
  title?: string;
}

export interface SessionsResponse {
  sessions: SessionInfo[];
}

export interface InitSessionRequest {
  title?: string;
  name?: string;
}

export interface InitSessionResponse {
  sessionId: string;
}

export interface AppendBlockRequest {
  sessionId: string;
  block: any;
}

export interface RunPlanRequest {
  plan: string;
  sessionId: string;
  name?: string;
  title?: string;
}

export interface ResetRequest {
  sessionId: string;
}

export interface RemoveWindowRequest {
  sessionId: string;
  blockId: string;
}

export interface ClearWindowsRequest {
  sessionId: string;
}
