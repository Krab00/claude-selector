# claude-selector

A Chrome extension + Claude Code plugin that lets you select elements on a web page and send their CSS selectors and HTML to Claude Code.

## Installation

### 1. Install the Claude Code plugin

```bash
claude plugin add --git https://github.com/user/claude-selector
```

This automatically:
- Installs the `/ai-service` skill
- Starts the local server when a Claude Code session begins
- Stops it when the session ends

### 2. Install the Chrome Extension

1. Clone this repo (if you haven't already)
2. Open `chrome://extensions` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `extension/` directory

## Usage

1. Open Claude Code (the server starts automatically)
2. Open a web page in Chrome and click the extension icon
3. Toggle selection mode (or press `Cmd+Shift+P` / `Ctrl+Shift+P`)
4. Click elements to select them (`Cmd/Ctrl+click` for multi-select)
5. Click "Send" in the extension popup
6. In Claude Code, run `/ai-service read` to get the captured elements

### Commands

| Command             | Description                          |
|---------------------|--------------------------------------|
| `/ai-service read`  | Read the latest captured elements    |
| `/ai-service status`| Check if the server is running       |
| `/ai-service on`    | Manually start the server            |
| `/ai-service off`   | Manually stop the server             |

## Project Structure

```
claude-selector/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── hooks/
│   └── hooks.json           # Auto-start/stop server hooks
├── skills/
│   └── ai-service/
│       └── SKILL.md         # /ai-service slash command
├── scripts/
│   ├── start-server.sh      # Server start script
│   └── stop-server.sh       # Server stop script
├── server/                  # Bun HTTP server
└── extension/               # Chrome extension
```

## Development

```bash
cd server && bun install
claude --plugin-dir .        # Test the plugin locally
```
