import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execFileAsync = promisify(execFile)
const XAMPP = '/Applications/XAMPP/xamppfiles/xampp'
const SUDO = '/usr/bin/sudo'

let permissionSetup: Promise<void> | undefined
let mainWindow: BrowserWindow | null = null
const hasSingleInstanceLock = app.requestSingleInstanceLock()

if (!hasSingleInstanceLock) app.quit()

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`
}

async function setupPermissions(): Promise<void> {
  const script = app.isPackaged
    ? path.join(process.resourcesPath, 'setup-sudoers.sh')
    : path.join(app.getAppPath(), 'scripts/setup-sudoers.sh')
  const username = process.env.USER || process.env.LOGNAME

  if (!username) throw new Error('Could not determine the current macOS user.')

  const command = `/bin/sh ${shellQuote(script)} --username ${shellQuote(username)} --xampp ${shellQuote(XAMPP)}`
  const appleScript = `do shell script ${JSON.stringify(command)} with administrator privileges`
  await execFileAsync('/usr/bin/osascript', ['-e', appleScript])
}

async function ensurePermissions(): Promise<void> {
  if (permissionSetup) return permissionSetup

  permissionSetup = (async () => {
    if (process.platform !== 'darwin') throw new Error('This app only supports macOS.')
    await execFileAsync(SUDO, ['-n', '-l', '--', XAMPP])
  })().catch(async () => {
    await setupPermissions()
    await execFileAsync(SUDO, ['-n', '--', XAMPP, 'status'])
  })

  return permissionSetup
}

async function runPrivileged(binary: string, args: string[]) {
  await ensurePermissions()
  return execFileAsync(SUDO, ['-n', '--', binary, ...args])
}

function createWindow() {
  const win = new BrowserWindow({
    width: 720,
    height: 500,
    resizable: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  mainWindow = win

  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/renderer/index.html'))
  }
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow()
  } else {
    mainWindow.show()
  }
  if (process.platform === 'darwin') app.dock.show()
}

app.on('second-instance', showMainWindow)
app.on('activate', showMainWindow)
app.whenReady().then(() => {
  if (!hasSingleInstanceLock) return
  if (process.platform === 'darwin' && !app.isPackaged) {
    app.dock.setIcon(path.join(app.getAppPath(), 'build/icon.png'))
  }
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') app.dock.hide()
  else app.quit()
})

// ── XAMPP command runner ──────────────────────────────────────────────────────

async function runXampp(subcommand: string): Promise<{ success: boolean; output: string }> {
  try {
    const { stdout, stderr } = await runPrivileged(XAMPP, [subcommand])
    return { success: true, output: stdout || stderr || 'Done.' }
  } catch (err: any) {
    return { success: false, output: err.message || 'Unknown error' }
  }
}

// ── Status ────────────────────────────────────────────────────────────────────

ipcMain.handle('xampp:status', async () => {
  const result = await runXampp('status')
  const raw = result.output

  const parseService = (keyword: string): string => {
    const lines = raw.split('\n')
    const line = lines.find(l => l.toLowerCase().includes(keyword.toLowerCase()))
    if (!line) return 'unknown'
    const lower = line.toLowerCase()
    if (lower.includes('not running')) return 'stopped'
    if (lower.includes('deactivated')) return 'deactivated'
    if (lower.includes('running')) return 'running'
    return 'unknown'
  }

  const mysqlFromXampp = parseService('MySQL')

  // XAMPP's status for MySQL is unreliable — verify with lsof
  let mysqlStatus = mysqlFromXampp
  if (mysqlFromXampp === 'stopped') {
    try {
      const { stdout } = await runPrivileged('/usr/sbin/lsof', ['-nP', '-iTCP:3306', '-sTCP:LISTEN'])
      if (stdout.includes('mysqld')) mysqlStatus = 'running'
    } catch {
      // lsof returns exit code 1 when nothing is listening — keep 'stopped'
    }
  }

  return {
    apache: parseService('Apache'),
    mysql:  mysqlStatus,
    ftp:    parseService('ProFTPD'),
    raw:    result.output,
  }
})

// ── Per-service commands ──────────────────────────────────────────────────────

const SERVICE_COMMANDS: Record<string, Record<string, string>> = {
  apache: { start: 'startapache', stop: 'stopapache',  restart: 'reloadapache' },
  mysql:  { start: 'startmysql',  stop: '',             restart: 'reloadmysql'  },
  ftp:    { start: 'startftp',    stop: 'stopftp',      restart: 'startftp'     },
}

async function stopMysql(): Promise<{ success: boolean; output: string }> {
  try {
    // Kill the parent (mysqld_safe) first to prevent respawn
    try {
      const { stdout } = await runPrivileged('/usr/bin/pgrep', ['-f', 'mysqld_safe'])
      const pid = stdout.trim()
      if (pid) await runPrivileged('/bin/kill', ['-9', pid])
    } catch { /* not found, continue */ }

    // Small wait then kill the child (mysqld) 
    await new Promise(res => setTimeout(res, 500))

    try {
      const { stdout } = await runPrivileged('/usr/sbin/lsof', ['-nP', '-iTCP:3306', '-sTCP:LISTEN'])
      const match = stdout.match(/mysqld\s+(\d+)/)
      if (match) await runPrivileged('/bin/kill', ['-9', match[1]])
    } catch { /* already gone */ }

    return { success: true, output: 'MySQL stopped.' }
  } catch (err: any) {
    return { success: false, output: err.message || 'Failed to stop MySQL.' }
  }
}

ipcMain.handle('xampp:service', async (_e, service: string, action: string) => {
  if (service === 'mysql' && action === 'stop') return stopMysql()

  const cmd = SERVICE_COMMANDS[service]?.[action]
  if (!cmd) return { success: false, output: `Unknown service/action: ${service}/${action}` }
  return runXampp(cmd)
})

// ── All-services shortcuts ────────────────────────────────────────────────────

ipcMain.handle('xampp:all', async (_e, action: 'start' | 'stop' | 'restart') => {
  if (action === 'stop') {
    const xamppResult = await runXampp('stop')
    const mysqlResult = await stopMysql()
    return {
      success: xamppResult.success && mysqlResult.success,
      output: xamppResult.output + '\n' + mysqlResult.output,
    }
  }
  return runXampp(action)
})

// ── Open URLs ─────────────────────────────────────────────────────────────────

ipcMain.handle('open:url', (_e, url: string) => {
  shell.openExternal(url)
})
