// Ensure content script and CSS are injected into the tab
async function ensureContentScript(tabId) {
  try {
    // Check if already injected
    const results = await chrome.tabs.sendMessage(tabId, { type: 'getStatus' }).catch(() => null);
    if (results) return true;
  } catch {
    // Not injected yet
  }

  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['content.css'],
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    });
    return true;
  } catch (err) {
    console.error('Failed to inject content script:', err);
    return false;
  }
}

// Handle keyboard command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-selection') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    await ensureContentScript(tab.id);
    // Small delay to let injection complete
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, { type: 'toggleSelection' });
    }, 100);
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'captureScreenshot') {
    handleScreenshotCapture(msg, sender).then(sendResponse);
    return true;
  }
  if (msg.type === 'sendToServer') {
    handleSendToServer(msg.payload).then(sendResponse);
    return true;
  }
  if (msg.type === 'ensureContentScript') {
    ensureContentScript(msg.tabId).then(sendResponse);
    return true;
  }
  if (msg.type === 'checkServerHealth') {
    handleHealthCheck(msg.serverUrl).then(sendResponse);
    return true;
  }
});

async function handleScreenshotCapture(msg) {
  try {
    const tab = msg.tabId
      ? await chrome.tabs.get(msg.tabId)
      : (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

    const quality = msg.quality || 0.8;
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
    });

    if (!msg.rect) {
      return { screenshot: dataUrl };
    }

    // Crop using OffscreenCanvas
    const rect = msg.rect;
    const dpr = msg.devicePixelRatio || 1;
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);

    const canvas = new OffscreenCanvas(
      Math.round(rect.width * dpr),
      Math.round(rect.height * dpr)
    );
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      bitmap,
      Math.round(rect.left * dpr),
      Math.round(rect.top * dpr),
      Math.round(rect.width * dpr),
      Math.round(rect.height * dpr),
      0,
      0,
      canvas.width,
      canvas.height
    );

    const croppedBlob = await canvas.convertToBlob({
      type: 'image/png',
      quality,
    });
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = () => resolve({ screenshot: reader.result });
      reader.readAsDataURL(croppedBlob);
    });
  } catch (err) {
    return { error: err.message };
  }
}

async function handleSendToServer(payload) {
  try {
    const settings = await chrome.storage.sync.get({
      serverUrl: 'http://localhost:7890',
    });
    const url = `${settings.serverUrl}/elements`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      return { error: `Server returned ${resp.status}` };
    }
    const data = await resp.json();
    return { ok: true, data };
  } catch (err) {
    return { error: err.message };
  }
}

async function handleHealthCheck(serverUrl) {
  try {
    const url = serverUrl || (await chrome.storage.sync.get({ serverUrl: 'http://localhost:7890' })).serverUrl;
    const resp = await fetch(`${url}/health`, { method: 'GET', signal: AbortSignal.timeout(3000) });
    return { ok: resp.ok };
  } catch {
    return { ok: false };
  }
}
