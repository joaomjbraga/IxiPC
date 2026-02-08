export interface SystemInfo {
  os: string
  version: string
  arch: string
  uptime: number
}

export interface CPUInfo {
  model: string
  cores: number
  usage: number
}

export interface MemoryInfo {
  total: number
  used: number
  free: number
  usagePercent: number
}

export interface DiskHealth {
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

export interface DiskInfo {
  total: number
  used: number
  free: number
  usagePercent: number
  health?: DiskHealth
}

export interface AllSystemInfo {
  system: SystemInfo
  cpu: CPUInfo
  memory: MemoryInfo
  disk: DiskInfo
}

export interface SystemAPI {
  getSystemInfo: () => Promise<SystemInfo>
  getCPUInfo: () => Promise<CPUInfo>
  getMemoryInfo: () => Promise<MemoryInfo>
  getDiskInfo: () => Promise<DiskInfo>
  getAllInfo: () => Promise<AllSystemInfo>
}

export interface electronAPI {
  close: () => void
}

declare global {
  interface Window {
    systemAPI: SystemAPI
    electronAPI: electronAPI
  }
}

export { }

