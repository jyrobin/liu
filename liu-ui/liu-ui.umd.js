(function (global, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(global.React, global.ReactDOM, global.WinBox);
  } else {
    global.LiuUI = factory(global.React, global.ReactDOM, global.WinBox);
  }
})(typeof window !== 'undefined' ? window : this, function (React, ReactDOM, WinBox) {
  'use strict';

  var hasCreateRoot = ReactDOM && typeof ReactDOM.createRoot === 'function';

  function createWinBoxRoot(opts) {
    opts = opts || {};
    var wb = WinBox.new({
      id: opts.id,
      root: opts.root || document.body,
      title: opts.title,
      icon: opts.icon,
      class: opts.className,
      x: opts.x, y: opts.y,
      width: opts.width, height: opts.height,
      top: opts.top, right: opts.right, bottom: opts.bottom, left: opts.left,
      minwidth: opts.minWidth, minheight: opts.minHeight,
      maxwidth: opts.maxWidth, maxheight: opts.maxHeight,
      background: opts.background,
      index: opts.index,
      modal: opts.modal,
      hidden: !!opts.hide,
      onclose: function (force) {
        if (typeof opts.onClose === 'function') {
          var noDefault = opts.onClose(!!force);
          if (noDefault) return true;
        }
        return false;
      },
      onmove: opts.onMove,
      onresize: opts.onResize,
      onfocus: opts.onFocus,
      onblur: opts.onBlur,
    });

    // flags via classes
    if (opts.noMin) wb.addClass('no-min'); else wb.removeClass('no-min');
    if (opts.noMax) wb.addClass('no-max'); else wb.removeClass('no-max');
    if (opts.noFull) wb.addClass('no-full'); else wb.removeClass('no-full');
    if (opts.noClose) wb.addClass('no-close'); else wb.removeClass('no-close');
    if (opts.noResize) wb.addClass('no-resize'); else wb.removeClass('no-resize');
    if (opts.noMove) wb.addClass('no-move'); else wb.removeClass('no-move');
    if (opts.noHeader) wb.addClass('no-header'); else wb.removeClass('no-header');
    if (opts.noShadow) wb.addClass('no-shadow'); else wb.removeClass('no-shadow');

    var container = wb.body;
    var rootHandle = null;
    if (hasCreateRoot) {
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

    function update(next) {
      if (!next) return;
      if (typeof next.title === 'string' && next.title !== opts.title) wb.setTitle(next.title);
      if (typeof next.icon === 'string' && next.icon !== opts.icon) wb.setIcon(next.icon);
      if (typeof next.background === 'string' && next.background !== opts.background) wb.setBackground(next.background);
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
        else ReactDOM.unmountComponentAtNode(container);
      } catch (e) {}
      try { wb.close(!!force); } catch (e) {}
    }

    return { winbox: wb, render: render, update: update, destroy: destroy };
  }

  // Hook-based host component (uses React hooks, no JSX)
  function WinBoxHost(props) {
    var options = props.options || {};
    var children = props.children;
    var apiRef = React.useRef(null);

    if (!apiRef.current) {
      apiRef.current = createWinBoxRoot(options);
    }

    React.useEffect(function () {
      return function () {
        try { apiRef.current && apiRef.current.destroy(true); } catch (e) {}
      };
    }, []);

    if (!apiRef.current || !apiRef.current.winbox || !apiRef.current.winbox.body) return null;
    var body = apiRef.current.winbox.body;
    return ReactDOM.createPortal(children, body);
  }

  return {
    createWinBoxRoot: createWinBoxRoot,
    WinBoxHost: WinBoxHost,
  };
});

