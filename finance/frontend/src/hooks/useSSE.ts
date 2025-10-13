import { useEffect, useCallback } from 'react';
import { Block } from '../types/blocks';

/**
 * Hook to manage Server-Sent Events (SSE) stream
 * Receives blocks from Liu plan execution and other sources
 */
export const useSSE = (
  sessionId: string | null,
  onBlock: (block: Block) => void
) => {
  const handleBlock = useCallback(
    (block: Block) => {
      onBlock(block);
    },
    [onBlock]
  );

  useEffect(() => {
    if (!sessionId) return;

    // Set global session ID for WinBox callbacks
    window.__FIN_SESSION_ID = sessionId;

    const url = `/api/stream?sessionId=${encodeURIComponent(sessionId)}`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener('block', (event) => {
      try {
        const block: Block = JSON.parse(event.data);
        handleBlock(block);
      } catch (err) {
        console.error('Failed to parse block:', err);
      }
    });

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
    };

    return () => {
      try {
        eventSource.close();
      } catch (err) {
        console.error('Failed to close event source:', err);
      }
    };
  }, [sessionId, handleBlock]);
};
