import { app, BrowserWindow, ipcMain } from 'electron'
import { exec } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null = null

interface SystemInfo {
  os: string
  version: string
  arch: string
  uptime: number
}

interface CPUInfo {
  model: string
  cores: number
  usage: number
}

interface MemoryInfo {
  total: number
  used: number
  free: number
  usagePercent: number
}

interface DiskHealth {
  temperature?: number
  powerOnHours?: number
  powerCycleCount?: number
  reallocatedSectors?: number
  pendingSectors?: number
  healthStatus?: 'good' | 'warning' | 'critical' | 'unknown'
  smartAvailable: boolean
  lifePercentage?: number
  wearLeveling?: number
  model?: string
  serial?: string
}

interface DiskInfo {
  total: number
  used: number
  free: number
  usagePercent: number
  health?: DiskHealth
}

function getSystemInfo(): SystemInfo {
  return {
    os: os.type(),
    version: os.release(),
    arch: os.arch(),
    uptime: os.uptime()
  }
}

function getCPUModel(): string {
  const cpus = os.cpus()
  return cpus[0]?.model || 'Unknown CPU'
}

function getCPUCores(): number {
  return os.cpus().length
}

let previousCPUInfo = { idle: 0, total: 0 }

function getCPUUsage(): number {
  const cpus = os.cpus()
  let idle = 0
  let total = 0

  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      total += cpu.times[type as keyof typeof cpu.times]
    }
    idle += cpu.times.idle
  })

  const idleDiff = idle - previousCPUInfo.idle
  const totalDiff = total - previousCPUInfo.total

  previousCPUInfo = { idle, total }

  if (totalDiff === 0) {
    return 0
  }

  const usage = 100 - (100 * idleDiff / totalDiff)
  return Math.max(0, Math.min(100, usage))
}

function getMemoryInfo(): MemoryInfo {
  const total = os.totalmem()
  const free = os.freemem()
  const used = total - free
  const usagePercent = (used / total) * 100

  return {
    total,
    used,
    free,
    usagePercent
  }
}

async function getDiskHealthWindows(): Promise<DiskHealth> {
  const health: DiskHealth = {
    smartAvailable: false,
    healthStatus: 'unknown'
  }

  try {
    const { stdout } = await execAsync(
      'wmic diskdrive get Model,Status,SerialNumber /format:list',
      { timeout: 5000, windowsHide: true }
    )

    if (stdout.includes('Status=OK')) {
      health.healthStatus = 'good'
      health.smartAvailable = true
    }

    const modelMatch = stdout.match(/Model=(.+)/)
    if (modelMatch && modelMatch[1]?.trim()) {
      health.model = modelMatch[1].trim()
    }

    const serialMatch = stdout.match(/SerialNumber=(.+)/)
    if (serialMatch && serialMatch[1]?.trim()) {
      health.serial = serialMatch[1].trim()
    }
  } catch (error) {
    console.error('Windows disk health error:', error)
  }

  return health
}

async function getDiskHealthLinux(): Promise<DiskHealth> {
  const health: DiskHealth = {
    smartAvailable: false,
    healthStatus: 'unknown'
  }

  const devices = ['/dev/sda', '/dev/nvme0n1', '/dev/sdb', '/dev/nvme0']

  for (const device of devices) {
    try {
      const { stdout } = await execAsync(
        `which smartctl > /dev/null 2>&1 && smartctl -a ${device} 2>/dev/null || echo "not_available"`,
        { timeout: 5000 }
      )

      if (!stdout || stdout.includes('not_available') || stdout.length < 10) {
        continue
      }

      health.smartAvailable = stdout.includes('SMART support is: Enabled') ||
                              stdout.includes('SMART/Health Information')

      const tempMatch = stdout.match(/Temperature.*?(\d+)\s*Celsius/i) ||
                       stdout.match(/Temperature:\s*(\d+)/i)
      if (tempMatch) {
        health.temperature = parseInt(tempMatch[1], 10)
      }

      const powerOnMatch = stdout.match(/Power_On_Hours.*?(\d+)/) ||
                          stdout.match(/Power On Hours:\s*([\d,]+)/)
      if (powerOnMatch) {
        health.powerOnHours = parseInt(powerOnMatch[1].replace(/,/g, ''), 10)
      }

      const cycleMatch = stdout.match(/Power_Cycle_Count.*?(\d+)/) ||
                        stdout.match(/Power Cycles:\s*([\d,]+)/)
      if (cycleMatch) {
        health.powerCycleCount = parseInt(cycleMatch[1].replace(/,/g, ''), 10)
      }

      const modelMatch = stdout.match(/Device Model:\s*(.+)/) ||
                        stdout.match(/Model Number:\s*(.+)/)
      if (modelMatch) {
        health.model = modelMatch[1].trim()
      }

      const serialMatch = stdout.match(/Serial Number:\s*(.+)/)
      if (serialMatch) {
        health.serial = serialMatch[1].trim()
      }

      if (stdout.includes('PASSED') || stdout.includes('test result: PASSED')) {
        health.healthStatus = 'good'
      }

      if (health.smartAvailable) {
        break
      }
    } catch (error) {
      continue
    }
  }

  return health
}

async function getDiskHealth(): Promise<DiskHealth> {
  const platform = os.platform()

  if (platform === 'win32') {
    return await getDiskHealthWindows()
  } else if (platform === 'linux' || platform === 'darwin') {
    return await getDiskHealthLinux()
  }

  return {
    smartAvailable: false,
    healthStatus: 'unknown'
  }
}

async function getDiskInfoWindows(): Promise<DiskInfo> {
  try {
    const { stdout } = await execAsync(
      'wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:list',
      { timeout: 5000, windowsHide: true }
    )

    const freeMatch = stdout.match(/FreeSpace=(\d+)/)
    const sizeMatch = stdout.match(/Size=(\d+)/)

    if (freeMatch && sizeMatch) {
      const free = parseInt(freeMatch[1], 10)
      const total = parseInt(sizeMatch[1], 10)
      const used = total - free
      const usagePercent = total > 0 ? (used / total) * 100 : 0

      const health = await getDiskHealth()

      return { total, used, free, usagePercent, health }
    }
  } catch (error) {
    console.error('Windows disk info error:', error)
  }

  return { total: 0, used: 0, free: 0, usagePercent: 0 }
}

async function getDiskInfoLinux(): Promise<DiskInfo> {
  try {
    const { stdout } = await execAsync('df -k / 2>/dev/null', { timeout: 5000 })
    const lines = stdout.trim().split('\n')

    if (lines.length > 1) {
      const parts = lines[1].trim().split(/\s+/)
      if (parts.length >= 4) {
        const total = parseInt(parts[1], 10) * 1024
        const used = parseInt(parts[2], 10) * 1024
        const free = parseInt(parts[3], 10) * 1024
        const usagePercent = total > 0 ? (used / total) * 100 : 0

        const health = await getDiskHealth()

        return { total, used, free, usagePercent, health }
      }
    }
  } catch (error) {
    console.error('Linux disk info error:', error)
  }

  return { total: 0, used: 0, free: 0, usagePercent: 0 }
}

async function getDiskInfo(): Promise<DiskInfo> {
  const platform = os.platform()

  if (platform === 'win32') {
    return await getDiskInfoWindows()
  } else {
    return await getDiskInfoLinux()
  }
}

function setupIpcHandlers() {
  ipcMain.handle('get-system-info', async () => {
    try {
      return getSystemInfo()
    } catch (error) {
      console.error('Error getting system info:', error)
      return {
        os: 'Unknown',
        version: 'Unknown',
        arch: 'Unknown',
        uptime: 0
      }
    }
  })

  ipcMain.handle('get-cpu-info', async () => {
    try {
      const usage = getCPUUsage()
      return {
        model: getCPUModel(),
        cores: getCPUCores(),
        usage
      }
    } catch (error) {
      console.error('Error getting CPU info:', error)
      return {
        model: 'Unknown CPU',
        cores: 0,
        usage: 0
      }
    }
  })

  ipcMain.handle('get-memory-info', async () => {
    try {
      return getMemoryInfo()
    } catch (error) {
      console.error('Error getting memory info:', error)
      return {
        total: 0,
        used: 0,
        free: 0,
        usagePercent: 0
      }
    }
  })

  ipcMain.handle('get-disk-info', async () => {
    try {
      return await getDiskInfo()
    } catch (error) {
      console.error('Error getting disk info:', error)
      return {
        total: 0,
        used: 0,
        free: 0,
        usagePercent: 0
      }
    }
  })

  ipcMain.handle('get-all-info', async () => {
    try {
      const [systemInfo, cpuUsage, memoryInfo, diskInfo] = await Promise.all([
        Promise.resolve(getSystemInfo()),
        Promise.resolve(getCPUUsage()),
        Promise.resolve(getMemoryInfo()),
        getDiskInfo()
      ])

      return {
        system: systemInfo,
        cpu: {
          model: getCPUModel(),
          cores: getCPUCores(),
          usage: cpuUsage
        },
        memory: memoryInfo,
        disk: diskInfo
      }
    } catch (error) {
      console.error('Error getting all info:', error)
      return {
        system: { os: 'Unknown', version: 'Unknown', arch: 'Unknown', uptime: 0 },
        cpu: { model: 'Unknown CPU', cores: 0, usage: 0 },
        memory: { total: 0, used: 0, free: 0, usagePercent: 0 },
        disk: { total: 0, used: 0, free: 0, usagePercent: 0 }
      }
    }
  })
}

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 638,
    resizable: false,
    title: 'IxiPC',
    icon: path.join(process.env.VITE_PUBLIC || 'logo.svg'),
    titleBarStyle: 'hidden',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  win.on('closed', () => {
    win = null
  })
}

ipcMain.on('window-close', () => {
  const focusedWindow = BrowserWindow.getFocusedWindow()
  if (focusedWindow) {
    focusedWindow.close()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.whenReady().then(() => {
  setupIpcHandlers()
  createWindow()
})
