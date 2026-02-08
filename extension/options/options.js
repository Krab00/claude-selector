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
loadSettings();
