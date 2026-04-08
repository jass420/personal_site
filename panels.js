// ============================================
// Content Panel System
// Manages opening/closing of slide-in panels
// ============================================

let activePanel = null;
let onPanelChange = null;

export function initPanels(opts = {}) {
  onPanelChange = opts.onPanelChange || null;

  // Close button
  document.getElementById('panel-close-btn').addEventListener('click', closePanel);

  // Overlay click to close
  document.getElementById('panel-overlay').addEventListener('click', closePanel);

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activePanel) {
      closePanel();
    }
  });
}

export function openPanel(panelId) {
  if (activePanel === panelId) return;
  if (activePanel) closePanelImmediate();

  const panel = document.getElementById(`panel-${panelId}`);
  const overlay = document.getElementById('panel-overlay');
  const closeBtn = document.getElementById('panel-close-btn');

  if (!panel) return;

  // Show elements
  panel.style.display = 'block';
  overlay.style.display = 'block';
  closeBtn.style.display = 'flex';

  // Trigger animation on next frame
  requestAnimationFrame(() => {
    panel.classList.add('open');
    overlay.classList.add('visible');
  });

  activePanel = panelId;

  // Lazy-load YouTube iframes
  if (panelId === 'roomie-video') {
    panel.querySelectorAll('iframe[data-src]').forEach((iframe) => {
      if (!iframe.src || iframe.src === 'about:blank') {
        iframe.src = iframe.dataset.src;
      }
    });
  }

  if (onPanelChange) onPanelChange(true);
}

export function closePanel() {
  if (!activePanel) return;

  const panel = document.getElementById(`panel-${activePanel}`);
  const overlay = document.getElementById('panel-overlay');
  const closeBtn = document.getElementById('panel-close-btn');

  if (panel) panel.classList.remove('open');
  if (overlay) overlay.classList.remove('visible');

  const closedPanel = activePanel;
  activePanel = null;

  // Wait for transition to finish, then hide
  setTimeout(() => {
    if (panel && !activePanel) {
      panel.style.display = 'none';
    }
    if (overlay && !activePanel) {
      overlay.style.display = 'none';
    }
    if (closeBtn && !activePanel) {
      closeBtn.style.display = 'none';
    }
  }, 500);

  if (onPanelChange) onPanelChange(false);
}

function closePanelImmediate() {
  if (!activePanel) return;

  const panel = document.getElementById(`panel-${activePanel}`);
  const overlay = document.getElementById('panel-overlay');
  const closeBtn = document.getElementById('panel-close-btn');

  if (panel) {
    panel.classList.remove('open');
    panel.style.display = 'none';
  }
  if (overlay) {
    overlay.classList.remove('visible');
    overlay.style.display = 'none';
  }
  if (closeBtn) {
    closeBtn.style.display = 'none';
  }

  activePanel = null;
}

export function getActivePanel() {
  return activePanel;
}
