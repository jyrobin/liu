import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Stack, Chip } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { Block } from '../../types/blocks';
import ChartBlock from '../blocks/ChartBlock';
import { focusWinBox } from '../../services/winbox';

interface ChatFeedProps {
  blocks: Block[];
  onSendMessage: (text: string) => void;
}

const ChatFeed: React.FC<ChatFeedProps> = ({ blocks, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const feedEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    onSendMessage(text);
    setInputText('');
  };

  // Auto-scroll to bottom on new blocks
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [blocks]);

  const renderBlock = (block: Block, index: number) => {
    const key = block.id || `block-${index}`;

    // Filter out non-chat kinds: logs/progress/window lifecycle etc.
    if (block.kind === 'log' || block.kind === 'progress' || block.kind === 'winbox' || block.kind === 'winbox-close' || block.kind === 'winbox-clear') {
      return null;
    }

    // Handle different block types
    if (block.kind === 'request') {
      return (
        <Paper
          key={key}
          sx={{
            p: 1.5,
            mb: 1.5,
            bgcolor: 'primary.50',
            borderLeft: 3,
            borderColor: 'primary.main',
          }}
        >
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, mb: 0.5 }}>
            REQUEST
          </Typography>
          <Typography variant="body2">{block.text}</Typography>
        </Paper>
      );
    }

    if (block.kind === 'text') {
      return (
        <Paper key={key} sx={{ p: 1.5, mb: 1.5 }}>
          {block.title && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
              {block.title.toUpperCase()}
            </Typography>
          )}
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {block.text}
          </Typography>
        </Paper>
      );
    }

    if (block.kind === 'plan') {
      return (
        <Paper key={key} sx={{ p: 1.5, mb: 1.5, bgcolor: 'grey.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip label="PLAN" size="small" color="secondary" />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Liu TS Plan Preview
            </Typography>
          </Box>
          <Box
            component="pre"
            sx={{
              fontFamily: 'ui-monospace, Menlo, Monaco, monospace',
              fontSize: 12,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              m: 0,
              p: 1,
              bgcolor: 'background.paper',
              borderRadius: 1,
              overflow: 'auto',
              maxHeight: 400,
            }}
          >
            {block.code}
          </Box>
        </Paper>
      );
    }

    if (block.kind === 'chart') {
      return (
        <Paper key={key} sx={{ p: 1.5, mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1 }}>
            CHART
          </Typography>
          <ChartBlock spec={block.spec} data={block.data} />
          {(block as any).windowRefId && (
            <Box sx={{ mt: 1 }}>
              <Chip size="small" label="Focus Window" onClick={() => focusWinBox((block as any).windowRefId)} />
            </Box>
          )}
        </Paper>
      );
    }

    if (block.kind === 'report') {
      return (
        <Paper key={key} sx={{ p: 1.5, mb: 1.5 }}>
          {block.title && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1 }}>
              {block.title.toUpperCase()}
            </Typography>
          )}
          <Box sx={{ '& a': { color: 'primary.main' } }} dangerouslySetInnerHTML={{ __html: (block as any).html }} />
          {(block as any).windowRefId && (
            <Box sx={{ mt: 1 }}>
              <Chip size="small" label="Focus Window" onClick={() => focusWinBox((block as any).windowRefId)} />
            </Box>
          )}
        </Paper>
      );
    }

    // Suppress internal info/error in chat; logs panel is for operational messages
    if (block.kind === 'info' || block.kind === 'error') return null;

    // Generic block rendering
    return (
      <Paper key={key} sx={{ p: 1.5, mb: 1.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
          {block.kind?.toUpperCase() || 'BLOCK'}
        </Typography>
        <Box
          component="pre"
          sx={{
            fontFamily: 'ui-monospace, Menlo, Monaco, monospace',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
            m: 0,
          }}
        >
          {JSON.stringify(block, null, 2)}
        </Box>
      </Paper>
    );
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Feed Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 2,
          py: 2,
        }}
      >
        <Box sx={{ maxWidth: 920, mx: 'auto' }}>
          {blocks.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                No messages yet
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Send a natural language request or run a Liu plan
              </Typography>
            </Box>
          )}
          {blocks.map(renderBlock)}
          <div ref={feedEndRef} />
        </Box>
      </Box>

      {/* Input Composer */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          p: 2,
        }}
      >
        <Box sx={{ maxWidth: 920, mx: 'auto' }}>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask (NL) — returns plan preview..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              sx={{ bgcolor: 'background.default' }}
            />
            <Button
              type="submit"
              variant="contained"
              endIcon={<SendIcon />}
              disabled={!inputText.trim()}
            >
              Send
            </Button>
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
            Liu integration optional - finance web functions independently
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatFeed;
