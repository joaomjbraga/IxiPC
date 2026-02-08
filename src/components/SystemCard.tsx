import { useEffect, useState } from 'react'
import { Monitor, Timer, Cpu as CpuIcon, HardDrive } from 'lucide-react'
import type { SystemInfo } from '../types'
import styles from './SystemCard.module.css'

export function SystemCard() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await window.systemAPI.getSystemInfo()
        if (data) {
          setSystemInfo(data)
          setError(false)
        }
      } catch (err) {
        console.error('Error fetching system info:', err)
        setError(true)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const getOSName = (os: string): string => {
    if (os === 'Windows_NT') return 'Windows'
    if (os === 'Darwin') return 'macOS'
    if (os === 'Linux') return 'Linux'
    return os
  }

  if (error) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <Monitor className={styles.icon} size={20} />
          <span className={styles.title}>SYSTEM</span>
        </div>
        <div className={styles.loading}>Error loading data</div>
      </div>
    )
  }

  if (!systemInfo) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <Monitor className={styles.icon} size={20} />
          <span className={styles.title}>SYSTEM</span>
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Monitor className={styles.icon} size={20} />
        <span className={styles.title}>SYSTEM</span>
      </div>

      <div className={styles.content}>
        <div className={styles.mainInfo}>
          <div className={styles.osName}>{getOSName(systemInfo.os)}</div>
          <div className={styles.version}>{systemInfo.version}</div>
        </div>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>
              <CpuIcon size={16} />
              <span>Architecture</span>
            </div>
            <div className={styles.detailValue}>{systemInfo.arch}</div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>
              <Timer size={16} />
              <span>Uptime</span>
            </div>
            <div className={styles.detailValue}>{formatUptime(systemInfo.uptime)}</div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>
              <HardDrive size={16} />
              <span>Platform</span>
            </div>
            <div className={styles.detailValue}>{systemInfo.os}</div>
          </div>
        </div>

        <div className={styles.uptimeBar}>
          <div className={styles.uptimeBarFill} />
        </div>
      </div>
    </div>
  )
}
