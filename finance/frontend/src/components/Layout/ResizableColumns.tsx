import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box, styled } from '@mui/material';

interface ResizableColumnsProps {
  leftColumn?: React.ReactNode;
  middleColumn: React.ReactNode;
  rightColumn?: React.ReactNode;
  showLeftColumn?: boolean;
  showRightColumn?: boolean;
  defaultLeftWidth?: number;
  defaultRightWidth?: number;
  minLeftWidth?: number;
  minRightWidth?: number;
  maxLeftWidth?: number;
  maxRightWidth?: number;
}

const ResizeHandle = styled(Box)(({ theme }) => ({
  width: 4,
  cursor: 'col-resize',
  backgroundColor: 'transparent',
  borderRight: `1px solid ${theme.palette.divider}`,
  transition: 'background-color 0.2s ease',
  position: 'relative',
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.palette.primary.main,
      opacity: 0.1,
    },
  },
  '&.dragging': {
    backgroundColor: theme.palette.primary.main,
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.palette.primary.main,
      opacity: 0.2,
    },
  },
}));

const ResizableColumns: React.FC<ResizableColumnsProps> = ({
  leftColumn,
  middleColumn,
  rightColumn,
  showLeftColumn = true,
  showRightColumn = true,
  defaultLeftWidth = 280,
  defaultRightWidth = 400,
  minLeftWidth = 240,
  minRightWidth = 320,
  maxLeftWidth = 480,
  maxRightWidth = 600,
}) => {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [rightWidth, setRightWidth] = useState(defaultRightWidth);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (side: 'left' | 'right') => (e: React.MouseEvent) => {
      e.preventDefault();
      if (side === 'left') {
        setIsDraggingLeft(true);
      } else {
        setIsDraggingRight(true);
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;

      if (isDraggingLeft && showLeftColumn) {
        const newWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, mouseX));
        setLeftWidth(newWidth);
      }

      if (isDraggingRight && showRightColumn) {
        const newWidth = Math.max(
          minRightWidth,
          Math.min(maxRightWidth, containerRect.width - mouseX)
        );
        setRightWidth(newWidth);
      }
    },
    [
      isDraggingLeft,
      isDraggingRight,
      showLeftColumn,
      showRightColumn,
      minLeftWidth,
      maxLeftWidth,
      minRightWidth,
      maxRightWidth,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
  }, []);

  useEffect(() => {
    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDraggingLeft, isDraggingRight, handleMouseMove, handleMouseUp]);

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100%',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      {/* Left Column */}
      {showLeftColumn && leftColumn && (
        <>
          <Box
            sx={{
              width: leftWidth,
              borderRight: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {leftColumn}
          </Box>

          {/* Left Resize Handle */}
          <ResizeHandle
            className={isDraggingLeft ? 'dragging' : ''}
            onMouseDown={handleMouseDown('left')}
            sx={{ flexShrink: 0 }}
          />
        </>
      )}

      {/* Middle Column */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {middleColumn}
      </Box>

      {/* Right Column */}
      {showRightColumn && rightColumn && (
        <>
          {/* Right Resize Handle */}
          <ResizeHandle
            className={isDraggingRight ? 'dragging' : ''}
            onMouseDown={handleMouseDown('right')}
            sx={{ flexShrink: 0 }}
          />

          <Box
            sx={{
              width: rightWidth,
              borderLeft: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            {rightColumn}
          </Box>
        </>
      )}
    </Box>
  );
};

export default ResizableColumns;
