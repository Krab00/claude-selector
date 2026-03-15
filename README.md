# claude-selector

A Chrome extension + Claude Code plugin that lets you select elements on a web page and send their CSS selectors and HTML to Claude Code.

## Installation

### 1. Install the Claude Code plugin

```bash
claude plugin add --git https://github.com/Krab00/claude-selector
```

This automatically:
- Installs the `/ai-service` skill
- Starts the local server when a Claude Code session begins
- Stops it when the session ends
- Shows a status line indicator when elements are captured

### 2. Install the Chrome Extension

1. Clone this repo (if you haven't already)
2. Open `chrome://extensions` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `extension/` directory

## Usage

1. Open Claude Code (the server starts automatically)
2. Open a web page in Chrome and press `Cmd+Shift+S` (or click the extension icon)
3. Click elements to select them (`Cmd/Ctrl+click` for multi-select)
4. Press `Cmd+Shift+E` to send to server, or `Cmd+C` to copy as JSON
5. Type your next prompt in Claude Code — captured elements are automatically injected into context

No need to run `/ai-service read` — the hook handles it. The status line shows `📎 web elements` when elements are waiting.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+S` | Toggle selection mode |
| `Cmd/Ctrl+click` | Multi-select elements |
| `Cmd+Shift+E` | Send to server |
| `Cmd+C` | Copy as JSON to clipboard |
| `Escape` | Exit selection mode |

Shortcuts are configurable in the extension settings.

### Commands

| Command | Description |
|---------|-------------|
| `/ai-service read` | Read the latest captured elements |
| `/ai-service clear` | Clear captured elements |
| `/ai-service status` | Check if the server is running |
| `/ai-service on` | Manually start the server |
| `/ai-service off` | Manually stop the server |

### Multi-session support

Multiple Claude Code sessions share one server. Elements captured in Chrome are delivered to all sessions independently — each session sees the indicator and receives elements on its next prompt. When all sessions have consumed the elements, they are automatically cleaned up.

## Project Structure

```
claude-selector/
├── .claude-plugin/
│   ├── plugin.json              # Plugin manifest
│   └── marketplace.json         # Marketplace config
├── hooks/
│   └── hooks.json               # Session lifecycle + auto-inject hooks
├── skills/
│   └── ai-service/
│       └── SKILL.md             # /ai-service slash command
├── scripts/
│   ├── start-server.sh          # Server start + session registration
│   ├── stop-server.sh           # Server stop + session cleanup
│   ├── inject-elements.sh       # UserPromptSubmit hook (auto-inject)
│   └── statusline.sh            # Status line indicator
├── server/                      # Bun HTTP server
│   ├── server.ts                # HTTP endpoints
│   ├── store.ts                 # Element storage + session tracking
│   └── index.ts                 # Entry point
└── extension/                   # Chrome extension
    ├── content.js               # Element selection on page
    ├── background.js            # Screenshot capture + server comms
    ├── popup/                   # Extension popup UI
    ├── options/                 # Settings page (shortcuts, data options)
    └── logs/                    # Logs viewer
```

## Development

```bash
cd server && bun install
claude --plugin-dir .            # Test the plugin locally
```
