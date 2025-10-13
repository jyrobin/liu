(function(){
  const React = window.React;
  const ReactDOM = window.ReactDOM;
  const MUI = window.MaterialUI;
  const { Box, AppBar, Toolbar, Typography, Button, Drawer, List, ListItemButton, ListItemText, Divider, TextField, Stack, Paper } = MUI || {};

  if (!React || !ReactDOM) {
    document.body.innerHTML = '<div style="padding:20px;font-family:sans-serif">React not loaded</div>';
    return;
  }

  const e = React.createElement;

  function useSession() {
    const [sessionId, setSessionId] = React.useState(null);
    React.useEffect(() => {
      (async () => {
        try {
          const idx = await fetch('/api/sessions').then(r => r.json()).catch(() => ({ sessions: [] }));
          let sid = (idx.sessions && idx.sessions[0] && idx.sessions[0].sessionId) || null;
          if (!sid) {
            const r = await fetch('/api/session/init', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Finance Full (React)' }) }).then(r => r.json());
            sid = r.sessionId;
          }
          setSessionId(sid);
        } catch {}
      })();
    }, []);
    return [sessionId, setSessionId];
  }

  function useSSE(sessionId, onBlock){
    React.useEffect(() => {
      if (!sessionId) return;
      window.__FIN_SESSION_ID = sessionId;
      const url = `/api/stream?sessionId=${encodeURIComponent(sessionId)}`;
      const es = new EventSource(url);
      es.addEventListener('block', (ev) => { try { onBlock(JSON.parse(ev.data)); } catch {} });
      return () => { try { es.close(); } catch {} };
    }, [sessionId, onBlock]);
  }

  const WinReg = {};
  const USE_CANVAS_ROOT = false; // keep simple: use page root (body) for now
  function openWin(opts){
    const canvas = document.getElementById('canvas');
    const id = String(opts && opts.id ? opts.id : (Date.now()));
    try {
      function toNumber(v){ return (typeof v === 'number') ? v : undefined; }
      function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
      function normPos(o){
        const cw = Math.max(0, (canvas && canvas.clientWidth) || 0) || window.innerWidth;
        const ch = Math.max(0, (canvas && canvas.clientHeight) || 0) || window.innerHeight;
        const w = toNumber(o.width) || 480;
        const h = toNumber(o.height) || 300;
        let x = o.x, y = o.y;
        if (x === 'center') x = Math.max(8, Math.round((cw - w) / 2));
        if (x === 'right') x = Math.max(8, Math.round(cw - w - 8));
        if (y === 'center') y = Math.max(8, Math.round((ch - h) / 2));
        if (y === 'bottom') y = Math.max(8, Math.round(ch - h - 8));
        x = toNumber(x) ?? 12; y = toNumber(y) ?? 12;
        x = clamp(x, 8, Math.max(8, cw - w - 8));
        y = clamp(y, 8, Math.max(8, ch - h - 8));
        return { x, y, width: w, height: h };
      }
      const pos = normPos(opts || {});
      const params = { id, title: opts.title || 'Window', x: pos.x, y: pos.y, width: pos.width, height: pos.height, top: opts.top, right: opts.right, bottom: opts.bottom, left: opts.left, class: opts.className, onclose: () => { try { fetch('/api/windows/remove', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ sessionId: window.__FIN_SESSION_ID, blockId: id }) }); } catch{} return false; } };
      if (USE_CANVAS_ROOT && canvas) params.root = canvas;
      const wb = window.WinBox.new(params);
      try { console.debug('[winbox] create', { id, title: params.title, x: params.x, y: params.y, width: params.width, height: params.height, root: !!(USE_CANVAS_ROOT && canvas) }); } catch {}
      // Minimized dock support
      const dock = document.getElementById('dock');
      function addDockChip(){
        if (!dock) return;
        if (document.getElementById('dock-'+id)) return;
        const chip = document.createElement('button');
        chip.id = 'dock-'+id;
        chip.className = 'dock-chip';
        chip.textContent = String(opts.title || 'Window');
        chip.style.cssText = 'padding:4px 8px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;cursor:pointer;';
        chip.onclick = () => { try { wb.restore(); } catch {} };
        dock.appendChild(chip);
      }
      function removeDockChip(){
        const el = document.getElementById('dock-'+id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }
      wb.onminimize = () => { try { addDockChip(); } catch {} };
      wb.onrestore = () => { try { removeDockChip(); } catch {} };
      // also ensure removal on explicit close
      const prevClose = wb.onclose;
      wb.onclose = () => { try { removeDockChip(); } catch {} ; if (prevClose) return prevClose(); return false; };
      if (opts.html) wb.body.innerHTML = String(opts.html);
      WinReg[id] = wb;
      return true;
    } catch (e) { return false; }
  }
  function closeWin(id){ const wb = WinReg[id]; if (wb && wb.close) { try { wb.close(true); } catch {} } delete WinReg[id]; }
  function closeAllWins(){ Object.keys(WinReg).forEach(closeWin); }

  function ChartEmbed({ spec, data }){
    const hostRef = React.useRef(null);
    const [error, setError] = React.useState(null);
    React.useEffect(() => {
      const el = hostRef.current;
      if (!el) return;
      el.innerHTML = '';
      const s = { ...(spec || {}) };
      if (data) s.data = { values: data };
      if (!window.vegaEmbed) { setError('vega-embed not loaded'); return; }
      try {
        window.vegaEmbed(el, s, { actions: false }).catch((e) => { setError(String(e?.message || e)); });
      } catch (e) { setError(String(e?.message || e)); }
      return () => { if (el) el.innerHTML = ''; };
    }, [spec, data]);
    if (error) {
      return React.createElement('div', { style: { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 } }, 'Chart error: ' + error);
    }
    return React.createElement('div', { ref: hostRef });
  }

  function App(){
    const [sessionId] = useSession();
    const [blocks, setBlocks] = React.useState([]);

    const handleBlock = React.useCallback((b) => {
      if (b.kind === 'winbox') {
        const ok = openWin(b);
        setBlocks((prev) => prev.concat([{ kind: ok ? 'info' : 'error', text: ok ? `Opened window: ${b.title || 'Window'}` : `Failed to open window: ${b.title || 'Window'}` }]));
        return;
      }
      if (b.kind === 'winbox-close') return closeWin(b.targetId);
      if (b.kind === 'winbox-clear') return closeAllWins();
      if (b.kind === 'reset') { closeAllWins(); setBlocks([]); return; }
      setBlocks((prev) => prev.concat([b]));
    }, []);

    useSSE(sessionId, handleBlock);

    const send = async (block) => {
      if (!sessionId) return;
      await fetch('/api/append', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ sessionId, block }) });
    };
    const runPlan = async (name) => {
      if (!sessionId) return;
      await fetch('/api/run-plan', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ plan: name, sessionId, title: 'Web Demo Plan', name: 'web' }) });
    };
    const resetAll = async () => { if (!sessionId) return; await fetch('/api/reset', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ sessionId }) }); };

    // Layout: Sidebar (left), Chat (center), Canvas (right)
    const Sidebar = () => e(Box, { sx: { width: 260, p: 1, height:'100%', overflow:'auto', overflowX:'hidden' } },
      e(Typography, { variant:'subtitle2', sx:{ px:1, py:1, color:'#475569' } }, 'Navigation'),
      e(List, null,
        e(ListItemButton, { onClick: () => send({ kind:'winbox', title:'Screener', x:24, y:80, width:380, height:320, html:'<div style="padding:12px">Screener placeholder</div>' }) }, e(ListItemText, { primary:'Open Screener' })),
        e(ListItemButton, { onClick: () => send({ kind:'winbox', title:'Chart — AAPL', x:'center', y:40, width:520, height:220, html:'<div style="padding:12px">Chart placeholder</div>' }) }, e(ListItemText, { primary:'Open Chart' })),
        e(ListItemButton, { onClick: () => send({ kind:'winbox', title:'Filings — AAPL', x:'right', y:80, width:520, height:320, html:'<div style="padding:12px">Filings placeholder</div>' }) }, e(ListItemText, { primary:'Open Filings' }))
      ),
      e(Divider, { sx:{ my:1 } }),
      e(Button, { variant:'contained', size:'small', onClick: () => runPlan('market_filings_demo') }, 'Run Demo Plan'),
      e(Button, { sx:{ mt:1 }, variant:'outlined', size:'small', onClick: resetAll }, 'Reset')
    );

    const ChatFeed = () => e(Box, { sx: { flex: '1 1 auto', display:'flex', flexDirection:'column', alignItems:'center', height:'100%' } },
      e(Box, { sx:{ width:'100%', maxWidth: 920, px:2, py:1, flex:'1 1 auto', overflow:'auto' } },
        blocks.map((b, i) => {
          const key = b && b.id ? b.id : i;
          return e(Paper, { key, sx:{ p:1.25, mb:1, borderRadius:2 } },
            e(Typography, { variant:'caption', sx:{ color:'#64748b' } }, b.kind || 'Block'),
            b && b.kind === 'chart'
              ? e(Box, { sx:{ mt:0.5 } }, e(ChartEmbed, { spec: b.spec, data: b.data }))
              : e(Box, { sx:{ fontFamily:'ui-monospace, Menlo, monospace', fontSize:12, whiteSpace:'pre-wrap', mt:0.5 } }, typeof b === 'string' ? b : JSON.stringify(b, null, 2))
          );
        })
      ),
      e(ChatComposer, { onSend: async (text) => { await send({ kind:'request', text }); await send({ kind:'plan', code: '/* plan preview */' }); } })
    );

    const ChatComposer = ({ onSend }) => {
      const [text, setText] = React.useState('');
      const submit = (ev) => { ev.preventDefault(); const t=text.trim(); if (!t) return; onSend(t); setText(''); };
      return e(Box, { component:'form', onSubmit: submit, sx:{ position:'sticky', bottom:0, width:'100%', display:'flex', justifyContent:'center', py:1, backdropFilter:'blur(4px)', background:'rgba(246,248,251,0.6)' } },
        e(Box, { sx:{ width:'100%', maxWidth:920, px:2, display:'flex', gap:1 } },
          e(TextField, { size:'small', fullWidth:true, placeholder:'Ask (NL) — returns plan preview', value:text, onChange:(e)=>setText(e.target.value) }),
          e(Button, { type:'submit', variant:'contained' }, 'Send')
        )
      );
    };

    const Canvas = () => e(Box, { id:'canvas', sx:{ width: 540, minWidth: 420, position:'relative', background:'#f1f5f9', borderLeft:'1px solid #e5e7eb', height:'100%', overflow:'hidden' } },
      e(Box, { id:'dock', sx:{ position:'absolute', left:8, right:8, bottom:8, display:'flex', flexWrap:'wrap', gap:1 } })
    );

    return e(Box, { sx:{ height:'100vh', display:'flex', flexDirection:'column' } },
      e(AppBar, { position:'static', color:'default', elevation:0 },
        e(Toolbar, null, e(Typography, { variant:'subtitle1' }, 'Finance (React + MUI)'))
      ),
      e(Box, { sx:{ flex:'1 1 auto', minHeight:0, display:'flex', gap:0 } },
        e(Box, { sx:{ width: 260, borderRight:'1px solid #e5e7eb', height:'100%', overflow:'auto' } }, e(Sidebar)),
        e(Box, { sx:{ flex:'1 1 auto', minWidth:0, height:'100%', display:'flex', flexDirection:'column' } }, e(ChatFeed)),
        e(Canvas)
      )
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
})();
