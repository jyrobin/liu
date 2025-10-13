import React, { useRef, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { Block } from '../../types/blocks';

interface CanvasProps {
  blocks: Block[];
}

interface LogEntry {
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

interface ProgressEntry {
  operation: string;
  current: number;
  total: number;
  message?: string;
}

const Canvas: React.FC<CanvasProps> = ({ blocks }) => {
  const dockRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = React.useState(0);

  // Expose dock container globally for WinBox service
  useEffect(() => {
    if (dockRef.current) {
      (window as any).__FINANCE_DOCK_CONTAINER = dockRef.current;
    }
    return () => {
      delete (window as any).__FINANCE_DOCK_CONTAINER;
    };
  }, []);

  // Extract logs and progress from blocks
  const { logs, progress } = useMemo(() => {
    const logEntries: LogEntry[] = [];
    const progressEntries: ProgressEntry[] = [];

    blocks.forEach((block: any) => {
      if (block.kind === 'log') {
        logEntries.push({
          level: block.level || 'info',
          message: block.message || '',
          timestamp: block.ts || Date.now(),
        });
      }
      if (block.kind === 'progress') {
        // Replace or add progress entry
        const existing = progressEntries.findIndex((p) => p.operation === block.operation);
        const entry = {
          operation: block.operation,
          current: block.current || 0,
          total: block.total || 100,
          message: block.message,
        };
        if (existing >= 0) {
          progressEntries[existing] = entry;
        } else {
          progressEntries.push(entry);
        }
      }
    });

    return {
      logs: logEntries.slice(-50), // Keep last 50 logs
      progress: progressEntries,
    };
  }, [blocks]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />;
      case 'warning':
        return <WarningIcon fontSize="small" sx={{ color: 'warning.main' }} />;
      case 'error':
        return <ErrorIcon fontSize="small" sx={{ color: 'error.main' }} />;
      default:
        return <InfoIcon fontSize="small" sx={{ color: 'info.main' }} />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: 'background.paper',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="fullWidth">
          <Tab label="Logs" />
          <Tab label="Progress" />
          <Tab label="Dock" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* Logs Tab */}
        {activeTab === 0 && (
          <Box>
            {logs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <InfoIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No logs yet
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Logs from plan execution will appear here
                </Typography>
              </Box>
            ) : (
              <List dense>
                {logs.map((log, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      mb: 0.5,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'background.default',
                    }}
                  >
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                      {getLevelIcon(log.level)}
                    </Box>
                    <ListItemText
                      primary={log.message}
                      secondary={new Date(log.timestamp).toLocaleTimeString()}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <Chip
                      label={log.level.toUpperCase()}
                      size="small"
                      color={getLevelColor(log.level) as any}
                      sx={{ ml: 1 }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}

        {/* Progress Tab */}
        {activeTab === 1 && (
          <Box>
            {progress.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <InfoIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No active operations
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Progress indicators will appear here
                </Typography>
              </Box>
            ) : (
              <Box>
                {progress.map((p, index) => {
                  const percent = (p.current / p.total) * 100;
                  return (
                    <Paper key={index} sx={{ p: 2, mb: 2 }}>
                      <Typography variant="body2" fontWeight={600} gutterBottom>
                        {p.operation}
                      </Typography>
                      {p.message && (
                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                          {p.message}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={percent}
                          sx={{ flex: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" fontWeight={600}>
                          {p.current}/{p.total}
                        </Typography>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        {/* Dock Tab */}
        {activeTab === 2 && (
          <Box>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Minimized Windows
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Windows you minimize will appear in the dock below
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Minimized Window Dock - Always visible at bottom */}
      <Box
        ref={dockRef}
        id="winbox-dock"
        sx={{
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: 8,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          minHeight: 32,
          maxHeight: 100,
          overflow: 'auto',
          zIndex: 1000,
          bgcolor: 'background.default',
          p: 1,
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
        }}
      />
    </Box>
  );
};

export default Canvas;
