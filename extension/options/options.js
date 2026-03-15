const fields = {
  serverUrl: document.getElementById('serverUrl'),
  autoConnect: document.getElementById('autoConnect'),
  includeSelector: document.getElementById('includeSelector'),
  includeOuterHTML: document.getElementById('includeOuterHTML'),
  includeInnerHTML: document.getElementById('includeInnerHTML'),
  includeTextContent: document.getElementById('includeTextContent'),
  includeAttributes: document.getElementById('includeAttributes'),
  includeComputedStyles: document.getElementById('includeComputedStyles'),
  includeScreenshot: document.getElementById('includeScreenshot'),
  screenshotQuality: document.getElementById('screenshotQuality'),
};
const qualityValue = document.getElementById('qualityValue');
const saveBtn = document.getElementById('saveBtn');
const saveMsg = document.getElementById('saveMsg');

const defaults = {
  serverUrl: 'http://localhost:7890',
  autoConnect: false,
  includeSelector: true,
  includeOuterHTML: true,
  includeInnerHTML: true,
  includeTextContent: true,
  includeAttributes: true,
  includeComputedStyles: false,
  includeScreenshot: false,
  screenshotQuality: 0.8,
};

function loadSettings() {
  chrome.storage.sync.get(defaults, (settings) => {
    fields.serverUrl.value = settings.serverUrl;
    fields.autoConnect.checked = settings.autoConnect;
    fields.includeSelector.checked = settings.includeSelector;
    fields.includeOuterHTML.checked = settings.includeOuterHTML;
    fields.includeInnerHTML.checked = settings.includeInnerHTML;
    fields.includeTextContent.checked = settings.includeTextContent;
    fields.includeAttributes.checked = settings.includeAttributes;
    fields.includeComputedStyles.checked = settings.includeComputedStyles;
    fields.includeScreenshot.checked = settings.includeScreenshot;
    fields.screenshotQuality.value = settings.screenshotQuality;
    qualityValue.textContent = Number(settings.screenshotQuality).toFixed(2);
  });
}

function saveSettings() {
  const settings = {
    serverUrl: fields.serverUrl.value || defaults.serverUrl,
    autoConnect: fields.autoConnect.checked,
    includeSelector: fields.includeSelector.checked,
    includeOuterHTML: fields.includeOuterHTML.checked,
    includeInnerHTML: fields.includeInnerHTML.checked,
    includeTextContent: fields.includeTextContent.checked,
    includeAttributes: fields.includeAttributes.checked,
    includeComputedStyles: fields.includeComputedStyles.checked,
    includeScreenshot: fields.includeScreenshot.checked,
    screenshotQuality: parseFloat(fields.screenshotQuality.value),
  };
  chrome.storage.sync.set(settings, () => {
    saveMsg.style.display = 'inline';
    setTimeout(() => { saveMsg.style.display = 'none'; }, 2000);
  });
}

fields.screenshotQuality.addEventListener('input', () => {
  qualityValue.textContent = Number(fields.screenshotQuality.value).toFixed(2);
});

saveBtn.addEventListener('click', saveSettings);

document.getElementById('changeShortcutBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

// --- Keybinding editor ---

const defaultBindings = {
  copy: { key: 'c', meta: true, shift: false, alt: false, ctrl: false },
  send: { key: 'e', meta: true, shift: false, alt: false, ctrl: true },
  exit: { key: 'Escape', meta: false, shift: false, alt: false, ctrl: false },
};

let currentBindings = { ...defaultBindings };
const keyCopyInput = document.getElementById('keyCopy');
const keySendInput = document.getElementById('keySend');
const keyExitInput = document.getElementById('keyExit');

function formatBinding(b) {
  const isMac = navigator.platform.includes('Mac');
  const parts = [];
  if (b.ctrl) parts.push(isMac ? '⌃' : 'Ctrl');
  if (b.meta) parts.push(isMac ? '⌘' : 'Meta');
  if (b.shift) parts.push('Shift');
  if (b.alt) parts.push(isMac ? '⌥' : 'Alt');
  parts.push(b.key === ' ' ? 'Space' : b.key);
  return parts.join('+');
}

function loadBindings() {
  chrome.storage.sync.get({ keybindings: null }, (s) => {
    if (s.keybindings) currentBindings = s.keybindings;
    keyCopyInput.value = formatBinding(currentBindings.copy);
    keySendInput.value = formatBinding(currentBindings.send);
    keyExitInput.value = formatBinding(currentBindings.exit);
  });
}

function recordKey(inputEl, bindingName) {
  inputEl.classList.add('recording');
  inputEl.value = 'Press keys...';

  function handler(e) {
    e.preventDefault();
    // Ignore bare modifier keys
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    const binding = {
      key: e.key,
      meta: e.metaKey,
      ctrl: e.ctrlKey,
      shift: e.shiftKey,
      alt: e.altKey,
    };
    currentBindings[bindingName] = binding;
    inputEl.value = formatBinding(binding);
    inputEl.classList.remove('recording');
    document.removeEventListener('keydown', handler, true);

    chrome.storage.sync.set({ keybindings: currentBindings });
  }

  document.addEventListener('keydown', handler, true);
}

document.getElementById('recordCopy').addEventListener('click', () => recordKey(keyCopyInput, 'copy'));
document.getElementById('recordSend').addEventListener('click', () => recordKey(keySendInput, 'send'));
document.getElementById('recordExit').addEventListener('click', () => recordKey(keyExitInput, 'exit'));

loadBindings();
loadSettings();
