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
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  ShowChart as ShowChartIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  CompareArrows as CompareArrowsIcon,
  AutoGraph as AutoGraphIcon,
  CandlestickChart as CandlestickChartIcon,
} from '@mui/icons-material';

interface SidebarProps {
  onOpenWindow: (type: 'screener' | 'chart' | 'filings') => void;
  onRunPlan: (planName: string) => void;
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
          DEMO PLANS
        </Typography>
        <Box sx={{ px: 2, mb: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Run Liu plans with finance commands
          </Typography>
        </Box>
        <List dense>
          <ListItemButton onClick={() => onRunPlan('market_overview')}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <TrendingUpIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Market Overview"
              secondary="Price, fundamentals, news"
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItemButton>
          <ListItemButton onClick={() => onRunPlan('chart_both_demo')}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <ShowChartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Chart (both) Demo"
              secondary="Inline chart + window"
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItemButton>
          <ListItemButton onClick={() => onRunPlan('ohlc_chart_live')}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <CandlestickChartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="OHLC Chart (live)"
              secondary="TradingView lightweight"
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItemButton>
          <ListItemButton onClick={() => onRunPlan('sector_momentum_primitives')}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <AutoGraphIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Sector Momentum (Live)"
              secondary="Real Yahoo Finance slice"
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItemButton>
          <ListItemButton onClick={() => onRunPlan('comparative_analysis')}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <CompareArrowsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Comparative Analysis"
              secondary="AAPL, MSFT, GOOGL"
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItemButton>
        </List>
      </Box>

      {/* Actions */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<RefreshIcon />}
          onClick={onReset}
          size="small"
        >
          Reset Session
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;
