# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Liu project cloned
- Finance server ready

## 1. Install Dependencies

```bash
cd finance/frontend
npm install
```

This will install:
- React 18 + TypeScript
- Material-UI (MUI)
- Vite
- Vega/Vega-Lite for charts
- WinBox for floating windows

## 2. Start Development

### Option A: Development Mode (Recommended)

```bash
# Terminal 1: Start finance backend server
cd finance/server
node server.js
# Server runs on http://localhost:5280

# Terminal 2: Start frontend dev server
cd finance/frontend
npm run dev
# Frontend runs on http://localhost:5281
```

Open your browser to `http://localhost:5281`

The dev server automatically:
- Proxies API calls to backend at `:5280`
- Enables hot module replacement
- Provides source maps for debugging

### Option B: Use Existing Server

The finance server already serves from `web/public`. To use the new React app:

1. Build the frontend:
```bash
cd finance/frontend
npm run build
```

2. Copy build output:
```bash
# Option 1: Copy to web/public
cp -r dist/* ../web/public/

# Option 2: Update server to serve from frontend/dist
# Edit finance/server/server.js line 11:
# const WEB_ROOT = path.join(__dirname, '..', 'frontend', 'dist');
```

3. Start server:
```bash
cd finance/server
node server.js
```

Open `http://localhost:5280`

## 3. Basic Usage

### Open Windows
- Click "Screener" in sidebar → opens screener window
- Click "Chart" → opens chart window
- Click "Filings" → opens filings window

Windows float across the page. Minimize them to see chips in the dock.

### Send Messages
1. Type a message in the chat input at bottom
2. Press Send
3. Currently shows a mock plan preview
4. In full Liu integration, this would generate and execute plans

### Run Liu Plans
1. Click "Run Demo Plan" in sidebar
2. Plan executes via `/api/run-plan`
3. Results appear as blocks in the feed
4. Windows may open automatically

### Reset Session
- Click "Reset Session" to clear all blocks and windows

## 4. Understanding the Layout

```
┌─────────────────────────────────────┐
│         Finance Web Header          │
├──────────┬─────────────┬────────────┤
│          │             │            │
│ Sidebar  │  ChatFeed   │  Canvas    │
│          │             │            │
│ Nav &    │  Messages   │  Visual    │
│ Actions  │  Charts     │  Area +    │
│          │  Plans      │  Dock      │
│          │             │            │
└──────────┴─────────────┴────────────┘
```

- **Sidebar (left)**: Tools and actions
- **ChatFeed (middle)**: Message stream with charts
- **Canvas (right)**: Info area + minimized window dock

Columns are resizable - drag the handles between them.

## 5. Liu Integration

### Environment Variables

When running Liu plans that should appear in the web UI:

```bash
export FINANCE_WEB_URL=http://localhost:5280
export FIN_SESSION_ID=<your-session-id>
```

Get session ID from browser console:
```javascript
console.log(window.__FIN_SESSION_ID)
```

### Run Plan from CLI

```bash
node bin/liu.js run-plan market_filings_demo \
  --domain-root finance/domain \
  --workspace finance/workspace
```

Results appear in the browser automatically via SSE.

## 6. Development Tips

### Hot Reload
Edit any `.tsx` or `.ts` file - changes appear instantly in browser.

### Type Checking
```bash
npm run type-check
```

### View Block Types
Open browser console and type:
```javascript
// See all blocks received
window.__DEBUG_BLOCKS = true
```

### Inspect WinBox Windows
```javascript
// List all open windows
Object.keys(window.__winbox_registry || {})
```

## 7. Troubleshooting

### Port Already in Use
```bash
# Change frontend port in vite.config.ts:
server: { port: 5282 }
```

### API Calls Failing
- Check finance server is running on `:5280`
- Check Vite proxy configuration in `vite.config.ts`
- Check browser console for CORS errors

### WinBox Not Loading
- Ensure `refs/winbox/dist` exists
- Check browser console for 404 errors on `/_refs/winbox/`
- Verify finance server proxies WinBox assets

### Charts Not Rendering
- Check browser console for Vega errors
- Verify chart spec is valid Vega-Lite
- Check `vega`, `vega-lite`, `vega-embed` are installed

### TypeScript Errors
```bash
# Rebuild type definitions
npm run type-check

# Clear cache and rebuild
rm -rf node_modules/.vite
npm run dev
```

## 8. Next Steps

### Customize Theme
Edit `src/theme/theme.ts` to change colors and styles.

### Add Block Types
1. Define type in `src/types/blocks.ts`
2. Add rendering in `src/components/panels/ChatFeed.tsx`
3. Emit from finance tools or plans

### Add Windows
Create new window configs in `App.tsx` or emit from plans/tools:

```javascript
await appendBlock(sessionId, {
  kind: 'winbox',
  title: 'My Window',
  x: 100,
  y: 100,
  width: 400,
  height: 300,
  html: '<div>Content</div>'
});
```

### Integrate with Finance Domain
Add tools in `finance/domain/tools/` that emit blocks via `/api/append`.

## 9. Production Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy dist/ folder
# - Copy to server
# - Configure server to serve static files
# - Ensure API endpoints available
```

## Resources

- **Main docs**: `/docs/finance-frontend.md`
- **Architecture**: `/docs/liu-architecture.md`
- **Finance domain**: `/docs/finance-web.md`
- **MUI docs**: https://mui.com/
- **Vite docs**: https://vitejs.dev/
- **Vega-Lite**: https://vega.github.io/vega-lite/

## Support

Check browser console for errors and logs.

Happy coding!
