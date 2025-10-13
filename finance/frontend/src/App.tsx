import React, { useState, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, AppBar, Toolbar, Typography, CircularProgress } from '@mui/material';
import theme from './theme/theme';
import ResizableColumns from './components/Layout/ResizableColumns';
import Sidebar from './components/panels/Sidebar';
import ChatFeed from './components/panels/ChatFeed';
import Canvas from './components/panels/Canvas';
import { useSession } from './hooks/useSession';
import { useSSE } from './hooks/useSSE';
import { appendBlock, runPlan, resetSession } from './services/api';
import { openWinBox, closeAllWinBoxes } from './services/winbox';
import { Block, WinBoxBlock } from './types/blocks';

function App() {
  const { sessionId, loading, error } = useSession();
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Handle incoming blocks from SSE
  const handleBlock = useCallback((block: Block) => {
    // Handle special block types
    if (block.kind === 'winbox') {
      const dockContainer = (window as any).__FINANCE_DOCK_CONTAINER;
      const success = openWinBox(block as WinBoxBlock, dockContainer);
      setBlocks((prev) => [
        ...prev,
        {
          kind: success ? 'info' : 'error',
          text: success
            ? `Opened window: ${(block as WinBoxBlock).title || 'Window'}`
            : `Failed to open window: ${(block as WinBoxBlock).title || 'Window'}`,
        },
      ]);
      return;
    }

    if (block.kind === 'winbox-close') {
      const { closeWinBox } = require('./services/winbox');
      closeWinBox((block as any).targetId);
      return;
    }

    if (block.kind === 'winbox-clear') {
      closeAllWinBoxes();
      return;
    }

    if (block.kind === 'reset') {
      closeAllWinBoxes();
      setBlocks([]);
      return;
    }

    // Add block to feed
    setBlocks((prev) => [...prev, block]);
  }, []);

  useSSE(sessionId, handleBlock);

  // Handlers
  const handleSendMessage = async (text: string) => {
    if (!sessionId) return;

    try {
      // Append request block
      await appendBlock(sessionId, { kind: 'request', text });

      // Mock plan preview (in real implementation, this would call Liu LLM compose)
      const mockPlanCode = `import { financeEnsureSessionEnv, getDailyBars, uiAppendChart } from '@tools';

financeEnsureSessionEnv();
const data = getDailyBars({ symbol: 'AAPL', period: '1M' });
uiAppendChart({
  spec: {
    mark: 'line',
    encoding: {
      x: { field: 'date', type: 'temporal' },
      y: { field: 'close', type: 'quantitative' }
    }
  },
  data: data.rows
});`;

      await appendBlock(sessionId, { kind: 'plan', code: mockPlanCode });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleOpenWindow = async (type: 'screener' | 'chart' | 'filings') => {
    if (!sessionId) return;

    const windowConfigs = {
      screener: {
        title: 'Screener',
        x: 60,
        y: 80,
        width: 420,
        height: 360,
        html: '<div style="padding:16px"><h3 style="margin:0 0 12px 0">Stock Screener</h3><p style="color:#64748b;font-size:14px">Screener functionality coming soon...</p></div>',
      },
      chart: {
        title: 'Chart — AAPL',
        x: 'center' as const,
        y: 60,
        width: 560,
        height: 400,
        html: '<div style="padding:16px"><h3 style="margin:0 0 12px 0">Interactive Chart</h3><p style="color:#64748b;font-size:14px">Chart functionality coming soon...</p></div>',
      },
      filings: {
        title: 'Filings — AAPL',
        x: 'right' as const,
        y: 80,
        width: 520,
        height: 440,
        html: '<div style="padding:16px"><h3 style="margin:0 0 12px 0">SEC Filings</h3><p style="color:#64748b;font-size:14px">Filings browser coming soon...</p></div>',
      },
    };

    try {
      await appendBlock(sessionId, {
        kind: 'winbox',
        ...windowConfigs[type],
      });
    } catch (err) {
      console.error('Failed to open window:', err);
    }
  };

  const handleRunPlan = async () => {
    if (!sessionId) return;

    try {
      await runPlan('market_filings_demo', sessionId, {
        name: 'web',
        title: 'Demo Plan',
      });
    } catch (err) {
      console.error('Failed to run plan:', err);
    }
  };

  const handleReset = async () => {
    if (!sessionId) return;

    try {
      await resetSession(sessionId);
    } catch (err) {
      console.error('Failed to reset session:', err);
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography variant="h6" color="error">
            Failed to initialize session
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <AppBar position="static" color="default">
          <Toolbar>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Finance Web
            </Typography>
            <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
              with Liu Integration
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Main Layout */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ResizableColumns
            showLeftColumn={true}
            showRightColumn={true}
            leftColumn={
              <Sidebar
                onOpenWindow={handleOpenWindow}
                onRunPlan={handleRunPlan}
                onReset={handleReset}
              />
            }
            middleColumn={<ChatFeed blocks={blocks} onSendMessage={handleSendMessage} />}
            rightColumn={<Canvas />}
            defaultLeftWidth={280}
            defaultRightWidth={360}
            minLeftWidth={240}
            maxLeftWidth={400}
            minRightWidth={280}
            maxRightWidth={500}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
