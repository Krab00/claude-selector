const logList = document.getElementById('logList');
const clearBtn = document.getElementById('clearBtn');

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-GB', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function renderLogs(logs) {
  if (!logs.length) {
    logList.innerHTML = '<div class="empty">No logs yet</div>';
    return;
  }
  logList.innerHTML = logs.map(l => `
    <div class="log-entry">
      <span class="log-time">${formatTime(l.ts)}</span>
      <span class="log-tag ${l.type}">${l.type}</span>
      <span class="log-msg">${escapeHtml(l.msg)}</span>
    </div>
  `).join('');
  // Auto-scroll to bottom
  window.scrollTo(0, document.body.scrollHeight);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function loadLogs() {
  chrome.storage.local.get({ selectorLogs: [] }, (s) => {
    renderLogs(s.selectorLogs);
  });
}

clearBtn.addEventListener('click', () => {
  chrome.storage.local.set({ selectorLogs: [] }, loadLogs);
});

// Live update
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.selectorLogs) {
    renderLogs(changes.selectorLogs.newValue || []);
  }
});

loadLogs();
