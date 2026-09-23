<p align="center">
  <h1 align="center">⚙️ XAMPP Control</h1>
  <p align="center">A clean, native-feeling macOS control panel for XAMPP — built with Electron, React, and TypeScript.</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/macOS-13%2B-black?style=flat-square&logo=apple" />
  <img src="https://img.shields.io/badge/Electron-28-47848F?style=flat-square&logo=electron" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/XAMPP-8.2-FB7A24?style=flat-square" />
</p>

---

> **⚠️ Important:** XAMPP Control does **not** include or replace XAMPP itself.
> You must have [XAMPP for macOS](https://www.apachefriends.org/download.html) installed at `/Applications/XAMPP` before using this app.

---

## What it does

XAMPP's default control panel breaks on recent versions of macOS. This app replaces it with a lightweight native window that lets you:

- Start, stop, and restart **Apache**, **MySQL**, and **ProFTPD** individually or all at once
- See live service status with auto-refresh every 8 seconds
- Open **localhost** and **phpMyAdmin** directly from the panel
- Track every action in a real-time activity log

---

## Compatibility

|                      | Requirement                               |
| -------------------- | ----------------------------------------- |
| **macOS**      | Ventura 13 or later                       |
| **XAMPP**      | 8.x (installed at `/Applications/XAMPP`) |
| **Node.js**    | 18 or later                               |
| **Electron**   | 28                                        |
| **React**      | 18                                        |
| **TypeScript** | 5                                         |
| **Vite**       | 5                                         |

---

## Setup

### 1 — Install XAMPP

Install XAMPP for macOS at `/Applications/XAMPP` before opening XAMPP Control.

### 2 — Install the app

#### For users

Download the DMG from this repository's GitHub Releases page. Do not run `npm install` or `npm run build`; those commands are only for developers building the app.

Choose the correct file for the Mac:

- `arm64` for Apple silicon Macs (M1, M2, M3, and newer)
- `x64` for Intel Macs

Open the DMG, drag **XAMPP Control** to Applications, and launch it. The first time the app checks service status, macOS will show its standard administrator authorization dialog. XAMPP Control installs a restricted sudoers rule for the current macOS user and then uses non-interactive `sudo` for service actions.

If macOS says the developer cannot be verified, right-click the app, choose **Open**, and confirm. For a smoother installation, the developer must code-sign and notarize the app with Apple.

#### For developers

Run the following commands to create the DMGs:

```bash
npm install
npm run build
```

The generated DMG files are written to `dist/` and should be uploaded to a GitHub Release.

For local development, you can configure the sudo permissions manually:

```bash
chmod +x scripts/setup-sudoers.sh
./scripts/setup-sudoers.sh
```

> This script only grants `sudo` access to four specific binaries:
> `/Applications/XAMPP/xamppfiles/xampp`, `lsof`, `kill`, and `pgrep`.
> It does not grant blanket sudo access.

To remove the permissions at any time:

```bash
sudo rm /etc/sudoers.d/xampp-control
```

### 3 — Run locally

```bash
# Start the development app
npm run dev
```

The release build creates one DMG for Apple silicon and one for Intel Macs. Distribution outside your own Mac should use a valid Developer ID certificate and Apple notarization so Gatekeeper accepts the app without manual overrides.

---

## Project structure

```
xampp-control/
├── electron/
│   ├── main.ts          # Main process — window creation + IPC handlers
│   └── preload.ts       # Context bridge — exposes window.xampp to renderer
├── scripts/
│   └── setup-sudoers.sh # One-time sudo permissions setup
├── src/
│   ├── App.tsx           # Root layout, state management, polling
│   ├── types.ts          # Shared TypeScript types
│   ├── index.css         # Design tokens + base styles
│   └── components/
│       ├── Header.tsx        # Title bar (macOS traffic-light aware)
│       ├── ServiceCard.tsx   # Per-service card with Start/Stop/Restart
│       ├── QuickActions.tsx  # Global controls + browser shortcuts
│       └── ActivityLog.tsx   # Live scrolling event log
└── vite.config.ts        # Vite + vite-plugin-electron config
```

---

## How it works

The app is split into two Electron processes:

- **Main process** (`electron/main.ts`) — runs shell commands via `sudo`, manages the window, and handles all IPC calls
- **Renderer process** (`src/`) — the React UI, sandboxed with `contextIsolation: true`, communicates only through the typed `window.xampp` bridge

MySQL stop is handled separately from XAMPP's own `stopmysql` command because `mysqld` runs under the `_mysql` user via `mysqld_safe` and does not respond to XAMPP's stop reliably. The app kills `mysqld_safe` first (the parent), then force-kills any remaining `mysqld` process on port 3306.

---

## Customising XAMPP commands

If your XAMPP version uses different subcommands, edit `SERVICE_COMMANDS` in `electron/main.ts`:

```ts
const SERVICE_COMMANDS = {
  apache: { start: 'startapache', stop: 'stopapache', restart: 'reloadapache' },
  mysql:  { start: 'startmysql',  stop: '',           restart: 'reloadmysql'  },
  ftp:    { start: 'startftp',    stop: 'stopftp',    restart: 'startftp'     },
}
```

> `mysql.stop` is intentionally empty — MySQL is stopped via direct process kill. See `stopMysql()` in `main.ts`.
