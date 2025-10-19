import React from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { WinBoxBlock } from '../types/blocks';
import { removeWindow } from './api';
import { getWinBoxComponent } from '../components/winbox/registry';

/**
 * WinBox Registry - tracks all open windows
 * Allows floating windows across the entire page
 */
const winBoxRegistry: Record<string, any> = {};
let nextZIndex = 3000;
const componentRoots: Record<string, Root> = {};

/**
 * Dock chip management for minimized windows
 */
const dockChips: Record<string, HTMLElement> = {};

/**
 * Open a WinBox window
 * Windows float across the entire page (attached to body by default)
 */
export const openWinBox = (opts: WinBoxBlock, dockContainer?: HTMLElement): boolean => {
  if (!window.WinBox) {
    console.error('WinBox library not loaded');
    return false;
  }

  const id = String(opts.id || Date.now());

  try {
    const {
      title = 'Window',
      x,
      y,
      width = 480,
      height = 300,
      className,
      html,
      component,
      componentProps,
    } = opts;

    // Normalize position
    const normalizePos = (val: number | string | undefined, isX: boolean, size: number) => {
      if (val === 'center') {
        const containerSize = isX ? window.innerWidth : window.innerHeight;
        return Math.max(8, Math.round((containerSize - size) / 2));
      }
      if (val === 'right' && isX) {
        return Math.max(8, Math.round(window.innerWidth - size - 8));
      }
      if (val === 'bottom' && !isX) {
        return Math.max(8, Math.round(window.innerHeight - size - 8));
      }
      return typeof val === 'number' ? val : 12;
    };

    const posX = normalizePos(x, true, width);
    const posY = normalizePos(y, false, height);

    const winBox = new window.WinBox({
      id,
      title,
      x: posX,
      y: posY,
      width,
      height,
      class: className,
      onclose: () => {
        // Notify server to remove window from storage
        try {
          const sessionId = window.__FIN_SESSION_ID;
          if (sessionId) {
            removeWindow(sessionId, id);
          }
        } catch (err) {
          console.error('Failed to remove window:', err);
        }
        cleanupWinBox(id);
      },
      onminimize: () => {
        addDockChip(id, title, winBox, dockContainer);
      },
      onrestore: () => {
        removeDockChip(id);
      },
      onfocus: () => {
        try {
          const dom = (winBox as any)?.dom;
          if (dom) dom.style.zIndex = String(++nextZIndex);
        } catch {}
      },
    });

    if (component) {
      const Component = getWinBoxComponent(component);
      if (!Component) {
        winBox.body.innerHTML = `<div style="padding:16px;font-size:13px;color:#64748b;">Unknown component: ${component}</div>`;
      } else {
        winBox.body.innerHTML = '';
        const root = createRoot(winBox.body);
        componentRoots[id] = root;
        root.render(React.createElement(Component, componentProps || {}));
      }
    } else if (html) {
      winBox.body.innerHTML = html;
    }

    // Ensure initial focus order is above MUI surfaces
    try {
      const dom = (winBox as any)?.dom;
      if (dom) dom.style.zIndex = String(++nextZIndex);
    } catch {}

    winBoxRegistry[id] = winBox;
    return true;
  } catch (err) {
    console.error('Failed to create WinBox:', err);
    return false;
  }
};

/**
 * Close a WinBox window by ID
 */
export const closeWinBox = (id: string) => {
  const winBox = winBoxRegistry[id];
  if (!winBox || typeof winBox.close !== 'function') {
    cleanupWinBox(id);
    return;
  }
  try {
    winBox.close(true);
  } catch (err) {
    console.error('Failed to close WinBox:', err);
    cleanupWinBox(id);
  }
};

/**
 * Close all WinBox windows
 */
export const closeAllWinBoxes = () => {
  Object.keys(winBoxRegistry).forEach(closeWinBox);
};

/**
 * Add a chip to the dock for a minimized window
 */
const addDockChip = (
  id: string,
  title: string,
  winBox: any,
  dockContainer?: HTMLElement
) => {
  if (!dockContainer) return;
  if (dockChips[id]) return; // Already exists

  const chip = document.createElement('button');
  chip.id = `dock-chip-${id}`;
  chip.className = 'dock-chip';
  chip.textContent = title;
  chip.style.cssText = `
    padding: 6px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    background: #fff;
    cursor: pointer;
    font-size: 13px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    transition: all 0.2s ease;
  `;

  chip.onmouseover = () => {
    chip.style.background = '#f1f5f9';
    chip.style.borderColor = '#cbd5e1';
  };

  chip.onmouseout = () => {
    chip.style.background = '#fff';
    chip.style.borderColor = '#e5e7eb';
  };

  chip.onclick = () => {
    try {
      winBox.restore();
    } catch (err) {
      console.error('Failed to restore WinBox:', err);
    }
  };

  dockContainer.appendChild(chip);
  dockChips[id] = chip;
};

/**
 * Remove a chip from the dock
 */
const removeDockChip = (id: string) => {
  const chip = dockChips[id];
  if (chip && chip.parentNode) {
    chip.parentNode.removeChild(chip);
  }
  delete dockChips[id];
};

/**
 * Get all open window IDs
 */
export const getOpenWindowIds = (): string[] => {
  return Object.keys(winBoxRegistry);
};

/** Focus a WinBox window by ID */
export const focusWinBox = (id: string) => {
  const wb = winBoxRegistry[id];
  if (wb && typeof wb.focus === 'function') {
    try { wb.focus(); } catch (err) { console.error('Failed to focus WinBox:', err); }
  }
};

function cleanupWinBox(id: string) {
  const root = componentRoots[id];
  if (root) {
    try { root.unmount(); } catch (err) { console.error('Failed to unmount component:', err); }
    delete componentRoots[id];
  }
  removeDockChip(id);
  delete winBoxRegistry[id];
}
