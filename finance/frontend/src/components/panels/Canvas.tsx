import React, { useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

interface CanvasProps {
  // Canvas is primarily a visual container for the minimized dock
  // WinBox windows float across the entire page
}

const Canvas: React.FC<CanvasProps> = () => {
  const dockRef = useRef<HTMLDivElement>(null);

  // Expose dock container globally for WinBox service
  useEffect(() => {
    if (dockRef.current) {
      (window as any).__FINANCE_DOCK_CONTAINER = dockRef.current;
    }
    return () => {
      delete (window as any).__FINANCE_DOCK_CONTAINER;
    };
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: 'grey.50',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Info Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Windows appear as floating panels
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Minimize windows to see them in the dock below
          </Typography>
        </Box>
      </Box>

      {/* Minimized Window Dock */}
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
          maxHeight: 120,
          overflow: 'auto',
          zIndex: 1000,
        }}
      />
    </Box>
  );
};

export default Canvas;
