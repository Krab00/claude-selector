const toggleBtn = document.getElementById('toggleBtn');
const elementList = document.getElementById('elementList');
const sendBtn = document.getElementById('sendBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const serverStatus = document.getElementById('serverStatus');
const autoSendBtn = document.getElementById('autoSendBtn');
const settingsLink = document.getElementById('settingsLink');
const toast = document.getElementById('toast');

let activeTabId = null;

function showToast(msg, duration = 2000) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function ensureInjected(tabId) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'ensureContentScript', tabId }, resolve);
  });
}

async function sendToTab(tabId, msg) {
  return chrome.tabs.sendMessage(tabId, msg);
}

async function init() {
  const tab = await getActiveTab();
  if (!tab?.id) return;
  activeTabId = tab.id;

  // Load auto-send state
  chrome.storage.sync.get({ autoSendOnExit: false }, (s) => {
    updateAutoSend(s.autoSendOnExit);
  });

  // Check server health
  chrome.runtime.sendMessage({ type: 'checkServerHealth' }, (resp) => {
    if (resp?.ok) {
      serverStatus.classList.add('online');
      serverStatus.classList.remove('offline');
      serverStatus.title = 'Server online';
    } else {
      serverStatus.classList.add('offline');
      serverStatus.classList.remove('online');
      serverStatus.title = 'Server offline';
    }
  });

  // Get current status
  await ensureInjected(activeTabId);
  setTimeout(async () => {
    try {
      const status = await sendToTab(activeTabId, { type: 'getStatus' });
      updateToggle(status?.active);
      if (status?.count > 0) {
        refreshElementList();
      }
    } catch {
      // Content script not ready yet
    }
  }, 150);
}

function updateToggle(active) {
  if (active) {
    toggleBtn.textContent = 'ON';
    toggleBtn.classList.add('active');
  } else {
    toggleBtn.textContent = 'OFF';
    toggleBtn.classList.remove('active');
  }
}

async function refreshElementList() {
  try {
    const resp = await sendToTab(activeTabId, {
      type: 'getSelectedElements',
      options: { outerHTML: false, innerHTML: false, computedStyles: false, boundingRect: false },
    });
    if (!resp?.elements?.length) {
      elementList.innerHTML = '<div class="empty">No elements selected</div>';
      return;
    }
    elementList.innerHTML = resp.elements
      .map(
        (el) =>
          `<div class="element-item"><span class="num">${el.index}.</span>${el.selector || el.textContent?.substring(0, 50) || '(element)'}</div>`
      )
      .join('');
  } catch {
    elementList.innerHTML = '<div class="empty">No elements selected</div>';
  }
}

toggleBtn.addEventListener('click', async () => {
  if (!activeTabId) return;
  await ensureInjected(activeTabId);
  setTimeout(async () => {
    try {
      const resp = await sendToTab(activeTabId, { type: 'toggleSelection' });
      updateToggle(resp?.active);
    } catch {
      showToast('Failed to toggle');
    }
  }, 100);
});

sendBtn.addEventListener('click', async () => {
  if (!activeTabId) return;
  try {
    const settings = await chrome.storage.sync.get({
      includeSelector: true,
      includeOuterHTML: true,
      includeInnerHTML: true,
      includeTextContent: true,
      includeAttributes: true,
      includeComputedStyles: false,
      includeScreenshot: false,
    });
    const options = {
      selector: settings.includeSelector,
      outerHTML: settings.includeOuterHTML,
      innerHTML: settings.includeInnerHTML,
      textContent: settings.includeTextContent,
      attributes: settings.includeAttributes,
      computedStyles: settings.includeComputedStyles,
    };
    const resp = await sendToTab(activeTabId, { type: 'getSelectedElements', options });
    if (!resp?.elements?.length) {
      showToast('No elements selected');
      return;
    }
    const tab = await getActiveTab();
    const payload = {
      source: { url: tab.url, title: tab.title },
      elements: resp.elements,
      timestamp: new Date().toISOString(),
    };
    const result = await chrome.runtime.sendMessage({ type: 'sendToServer', payload });
    if (result?.ok) {
      showToast('Sent to server');
    } else {
      showToast('Error: ' + (result?.error || 'unknown'));
    }
  } catch (err) {
    showToast('Error: ' + err.message);
  }
});

copyBtn.addEventListener('click', async () => {
  if (!activeTabId) return;
  try {
    const resp = await sendToTab(activeTabId, { type: 'getSelectedElements', options: {} });
    if (!resp?.elements?.length) {
      showToast('No elements selected');
      return;
    }
    const tab = await getActiveTab();
    const payload = {
      source: { url: tab.url, title: tab.title },
      elements: resp.elements,
      timestamp: new Date().toISOString(),
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    showToast('Copied to clipboard');
  } catch (err) {
    showToast('Copy failed: ' + err.message);
  }
});

clearBtn.addEventListener('click', async () => {
  if (!activeTabId) return;
  try {
    await sendToTab(activeTabId, { type: 'clearSelection' });
    elementList.innerHTML = '<div class="empty">No elements selected</div>';
    showToast('Cleared');
  } catch {
    showToast('Failed to clear');
  }
});

function updateAutoSend(active) {
  if (active) {
    autoSendBtn.textContent = 'ON';
    autoSendBtn.classList.add('active');
  } else {
    autoSendBtn.textContent = 'OFF';
    autoSendBtn.classList.remove('active');
  }
}

autoSendBtn.addEventListener('click', async () => {
  const s = await chrome.storage.sync.get({ autoSendOnExit: false });
  const newVal = !s.autoSendOnExit;
  await chrome.storage.sync.set({ autoSendOnExit: newVal });
  updateAutoSend(newVal);
});

document.getElementById('logsLink').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('logs/logs.html') });
});

settingsLink.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Refresh element list periodically while popup is open
setInterval(refreshElementList, 1000);

init();
