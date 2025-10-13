import { useState, useEffect } from 'react';
import { InitSessionResponse, SessionsResponse } from '../types/api';

/**
 * Hook to manage Liu/Finance session
 * Maintains loose coupling - can function without Liu
 */
export const useSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        // Try to get existing sessions
        const sessionsRes = await fetch('/api/sessions');
        const sessionsData: SessionsResponse = await sessionsRes.json();

        let sid = sessionsData.sessions?.[0]?.sessionId || null;

        // If no existing session, create a new one
        if (!sid) {
          const initRes = await fetch('/api/session/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Finance Web (React)' }),
          });
          const initData: InitSessionResponse = await initRes.json();
          sid = initData.sessionId;
        }

        setSessionId(sid);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize session');
        setLoading(false);
      }
    };

    initSession();
  }, []);

  return { sessionId, loading, error };
};
