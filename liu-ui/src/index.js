// ESM, typed wrapper for WinBox + React
import React from 'react';
import ReactDOM from 'react-dom';

const hasCreateRoot = ReactDOM && typeof ReactDOM.createRoot === 'function';

function resolveWinBox(provided) {
  const WB = provided || (typeof window !== 'undefined' ? window.WinBox : undefined);
  if (!WB) throw new Error('WinBox is not available. Pass it as the 2nd argument or include it globally.');
  return WB;
}

export function createWinBoxRoot(options = {}, providedWinBox) {
  const WinBox = resolveWinBox(providedWinBox);
  const wb = WinBox.new({
    id: options.id,
    root: options.root || (typeof document !== 'undefined' ? document.body : undefined),
    title: options.title,
    icon: options.icon,
    class: options.className,
    x: options.x, y: options.y,
    width: options.width, height: options.height,
    top: options.top, right: options.right, bottom: options.bottom, left: options.left,
    minwidth: options.minWidth, minheight: options.minHeight,
    maxwidth: options.maxWidth, maxheight: options.maxHeight,
    background: options.background,
    index: options.index,
    modal: options.modal,
    hidden: !!options.hide,
    onclose: (force) => {
      if (typeof options.onClose === 'function') {
        const noDefault = options.onClose(!!force);
        if (noDefault) return true;
      }
      return false;
    },
    onmove: options.onMove,
    onresize: options.onResize,
    onfocus: options.onFocus,
    onblur: options.onBlur,
  });

  wb[options.noMin ? 'addClass' : 'removeClass']('no-min');
  wb[options.noMax ? 'addClass' : 'removeClass']('no-max');
  wb[options.noFull ? 'addClass' : 'removeClass']('no-full');
  wb[options.noClose ? 'addClass' : 'removeClass']('no-close');
  wb[options.noResize ? 'addClass' : 'removeClass']('no-resize');
  wb[options.noMove ? 'addClass' : 'removeClass']('no-move');
  wb[options.noHeader ? 'addClass' : 'removeClass']('no-header');
  wb[options.noShadow ? 'addClass' : 'removeClass']('no-shadow');

  const container = wb.body;
  let rootHandle = null;
  if (hasCreateRoot && container) {
    rootHandle = ReactDOM.createRoot(container);
  }

  function render(element) {
    if (!container || !wb || !wb.body) return;
    if (hasCreateRoot && rootHandle) {
      rootHandle.render(element);
    } else {
      ReactDOM.render(element, container);
    }
  }

  function update(next = {}) {
    if (typeof next.title === 'string') wb.setTitle(next.title);
    if (typeof next.icon === 'string') wb.setIcon(next.icon);
    if (typeof next.background === 'string') wb.setBackground(next.background);
    if (next.width != null || next.height != null) {
      wb.resize(next.width != null ? next.width : wb.width,
                next.height != null ? next.height : wb.height);
    }
    if (next.x != null || next.y != null) {
      wb.move(next.x != null ? next.x : wb.x,
              next.y != null ? next.y : wb.y);
    }
  }

  function destroy(force) {
    try {
      if (hasCreateRoot && rootHandle) rootHandle.unmount();
      else if (container) ReactDOM.unmountComponentAtNode(container);
    } catch {}
    try { wb.close(!!force); } catch {}
  }

  return { winbox: wb, render, update, destroy };
}

export function useWinBox(options = {}, providedWinBox) {
  const apiRef = React.useRef(null);
  if (!apiRef.current) {
    apiRef.current = createWinBoxRoot(options, providedWinBox);
  }
  React.useEffect(() => () => {
    try { apiRef.current && apiRef.current.destroy(true); } catch {}
  }, []);
  const container = apiRef.current && apiRef.current.winbox && apiRef.current.winbox.body || null;
  return { api: apiRef.current, container };
}

export function WinBoxHost({ options = {}, children, winbox }) {
  const { api, container } = useWinBox(options, winbox);
  if (!api || !container) return null;
  return ReactDOM.createPortal(children, container);
}

export default { createWinBoxRoot, useWinBox, WinBoxHost };

