import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import embed from 'vega-embed';

interface ChartBlockProps {
  spec: any;
  data?: any[];
}

const ChartBlock: React.FC<ChartBlockProps> = ({ spec, data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (!containerRef.current) return;

      try {
        // Clear previous chart
        containerRef.current.innerHTML = '';

        // Merge inline data if provided
        const chartSpec = { ...spec };
        if (data) {
          chartSpec.data = { values: data };
        }

        // Render chart
        await embed(containerRef.current, chartSpec, {
          actions: false,
          renderer: 'canvas',
        });

        setError(null);
      } catch (err) {
        console.error('Failed to render chart:', err);
        setError(err instanceof Error ? err.message : 'Failed to render chart');
      }
    };

    renderChart();
  }, [spec, data]);

  if (error) {
    return (
      <Box
        sx={{
          p: 2,
          bgcolor: 'error.50',
          borderRadius: 1,
          border: 1,
          borderColor: 'error.main',
        }}
      >
        <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
          Chart Error
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: 'ui-monospace, Menlo, Monaco, monospace',
            fontSize: 12,
            color: 'error.dark',
            mt: 0.5,
          }}
        >
          {error}
        </Typography>
      </Box>
    );
  }

  return <Box ref={containerRef} sx={{ width: '100%' }} />;
};

export default ChartBlock;
