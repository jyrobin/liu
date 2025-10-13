import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Stack,
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  ShowChart as ShowChartIcon,
  Description as DescriptionIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface SidebarProps {
  onOpenWindow: (type: 'screener' | 'chart' | 'filings') => void;
  onRunPlan: () => void;
  onReset: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenWindow, onRunPlan, onReset }) => {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ color: 'text.primary' }}>
          Finance Tools
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Windows & Plans
        </Typography>
      </Box>

      {/* Navigation List */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <Typography
          variant="caption"
          sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary', fontWeight: 600 }}
        >
          OPEN WINDOWS
        </Typography>
        <List dense>
          <ListItemButton onClick={() => onOpenWindow('screener')}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <FilterListIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Screener" />
          </ListItemButton>
          <ListItemButton onClick={() => onOpenWindow('chart')}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <ShowChartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Chart" />
          </ListItemButton>
          <ListItemButton onClick={() => onOpenWindow('filings')}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <DescriptionIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Filings" />
          </ListItemButton>
        </List>

        <Divider sx={{ my: 1 }} />

        <Typography
          variant="caption"
          sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary', fontWeight: 600 }}
        >
          LIU INTEGRATION
        </Typography>
        <Box sx={{ px: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
            Run Liu plans with finance domain tools
          </Typography>
        </Box>
      </Box>

      {/* Actions */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Stack spacing={1}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<PlayArrowIcon />}
            onClick={onRunPlan}
          >
            Run Demo Plan
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<RefreshIcon />}
            onClick={onReset}
            size="small"
          >
            Reset Session
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default Sidebar;
