(() => {
  // Prevent double-injection
  if (window.__claudeSelectorInjected) return;
  window.__claudeSelectorInjected = true;

  let selectionMode = false;
  let selectedElements = [];
  let hoveredElement = null;

  function toggleSelectionMode(forceState) {
    selectionMode = forceState !== undefined ? forceState : !selectionMode;
    if (selectionMode) {
      document.body.classList.add('claude-selector-active');
      document.addEventListener('mouseover', onMouseOver, true);
      document.addEventListener('mouseout', onMouseOut, true);
      document.addEventListener('click', onClick, true);
      document.addEventListener('keydown', onKeyDown, true);
    } else {
      document.body.classList.remove('claude-selector-active');
      document.removeEventListener('mouseover', onMouseOver, true);
      document.removeEventListener('mouseout', onMouseOut, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
      clearHover();
    }
    return selectionMode;
  }

  function onMouseOver(e) {
    if (!selectionMode) return;
    e.stopPropagation();
    clearHover();
    hoveredElement = e.target;
    if (!hoveredElement.classList.contains('claude-selector-selected') &&
        !hoveredElement.classList.contains('claude-selector-badge')) {
      hoveredElement.classList.add('claude-selector-hover');
    }
  }

  function onMouseOut(e) {
    if (!selectionMode) return;
    e.stopPropagation();
    clearHover();
  }

  function clearHover() {
    if (hoveredElement) {
      hoveredElement.classList.remove('claude-selector-hover');
      hoveredElement = null;
    }
  }

  function onClick(e) {
    if (!selectionMode) return;
    // Ignore clicks on our own badges
    if (e.target.classList.contains('claude-selector-badge')) return;

    e.preventDefault();
    e.stopPropagation();

    const el = e.target;
    clearHover();

    const isMultiSelect = e.metaKey || e.ctrlKey;

    if (!isMultiSelect) {
      // Regular click: clear previous, select new
      clearSelection();
    }

    // Toggle: if already selected, deselect
    const idx = selectedElements.indexOf(el);
    if (idx !== -1) {
      deselectElement(el, idx);
    } else {
      selectElement(el);
    }

    updateBadges();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      clearSelection();
      toggleSelectionMode(false);
    }
  }

  function selectElement(el) {
    el.classList.remove('claude-selector-hover');
    el.classList.add('claude-selector-selected');
    selectedElements.push(el);
  }

  function deselectElement(el, idx) {
    el.classList.remove('claude-selector-selected');
    removeBadge(el);
    selectedElements.splice(idx, 1);
  }

  function clearSelection() {
    selectedElements.forEach(el => {
      el.classList.remove('claude-selector-selected');
      removeBadge(el);
    });
    selectedElements = [];
  }

  function updateBadges() {
    // Remove all existing badges first
    document.querySelectorAll('.claude-selector-badge').forEach(b => b.remove());
    selectedElements.forEach((el, i) => {
      // Ensure position context for absolute badge
      const pos = getComputedStyle(el).position;
      if (pos === 'static') {
        el.style.position = 'relative';
      }
      const badge = document.createElement('span');
      badge.className = 'claude-selector-badge';
      badge.textContent = String(i + 1);
      el.appendChild(badge);
    });
  }

  function removeBadge(el) {
    const badge = el.querySelector('.claude-selector-badge');
    if (badge) badge.remove();
  }

  // Generate a unique CSS selector for an element
  function getUniqueSelector(el) {
    if (el.id) {
      return `#${CSS.escape(el.id)}`;
    }

    const path = [];
    let current = el;
    while (current && current !== document.body && current !== document.documentElement) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        path.unshift(`#${CSS.escape(current.id)}`);
        break;
      }
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          c => c.tagName === current.tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-child(${Array.from(parent.children).indexOf(current) + 1})`;
        }
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    return path.join(' > ');
  }

  // Collect data from all selected elements
  function collectElementData(options = {}) {
    return selectedElements.map((el, i) => {
      const data = { index: i + 1 };

      if (options.selector !== false) {
        data.selector = getUniqueSelector(el);
      }
      if (options.outerHTML !== false) {
        // Clone and remove our badge before capturing
        const clone = el.cloneNode(true);
        clone.querySelectorAll('.claude-selector-badge').forEach(b => b.remove());
        clone.classList.remove('claude-selector-selected', 'claude-selector-hover');
        data.outerHTML = clone.outerHTML;
      }
      if (options.innerHTML !== false) {
        const clone = el.cloneNode(true);
        clone.querySelectorAll('.claude-selector-badge').forEach(b => b.remove());
        data.innerHTML = clone.innerHTML;
      }
      if (options.textContent !== false) {
        data.textContent = el.textContent.replace(/\s+/g, ' ').trim();
      }
      if (options.attributes !== false) {
        data.attributes = {};
        for (const attr of el.attributes) {
          if (!attr.name.startsWith('class') || true) {
            data.attributes[attr.name] = attr.value;
          }
        }
        // Clean our classes from the class attribute
        if (data.attributes.class) {
          data.attributes.class = data.attributes.class
            .replace(/claude-selector-\S+/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        }
      }
      if (options.computedStyles) {
        const computed = getComputedStyle(el);
        const styleProps = Array.isArray(options.computedStyles)
          ? options.computedStyles
          : ['display', 'position', 'width', 'height', 'color', 'backgroundColor', 'fontSize', 'fontFamily'];
        data.computedStyles = {};
        for (const prop of styleProps) {
          data.computedStyles[prop] = computed.getPropertyValue(
            prop.replace(/([A-Z])/g, '-$1').toLowerCase()
          );
        }
      }
      if (options.boundingRect !== false) {
        const rect = el.getBoundingClientRect();
        data.boundingRect = {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          left: Math.round(rect.left),
        };
      }

      return data;
    });
  }

  // Message handler
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.type) {
      case 'toggleSelection': {
        const state = toggleSelectionMode(msg.forceState);
        sendResponse({ active: state });
        break;
      }
      case 'getSelectedElements': {
        const data = collectElementData(msg.options || {});
        sendResponse({ elements: data, count: selectedElements.length });
        break;
      }
      case 'clearSelection': {
        clearSelection();
        updateBadges();
        sendResponse({ ok: true });
        break;
      }
      case 'getStatus': {
        sendResponse({
          active: selectionMode,
          count: selectedElements.length,
        });
        break;
      }
      default:
        sendResponse({ error: 'unknown message type' });
    }
    return true; // keep channel open for async
  });
})();
