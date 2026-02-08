import { useEffect, useState } from 'react'
import { HardDrive, Database, Shield, Thermometer, Clock } from 'lucide-react'
import type { DiskInfo } from '../types'
import styles from './DiskCard.module.css'

export function DiskCard() {
  const [diskInfo, setDiskInfo] = useState<DiskInfo | null>(null)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await window.systemAPI.getDiskInfo()
        if (data) {
          setDiskInfo(data)
          setError(false)
        }
      } catch (err) {
        console.error('Error fetching disk info:', err)
        setError(true)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes: number): string => {
    const gb = bytes / (1024 ** 3)
    return `${gb.toFixed(2)} GB`
  }

  const getHealthColor = (status?: string): string => {
    if (!status || status === 'unknown') return 'var(--text-muted)'
    if (status === 'good') return 'var(--success)'
    if (status === 'warning') return 'var(--warning)'
    return 'var(--danger)'
  }

  const getUsageColor = (usage: number): string => {
    if (usage < 70) return 'var(--success)'
    if (usage < 90) return 'var(--warning)'
    return 'var(--danger)'
  }

  if (error) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <HardDrive className={styles.icon} size={20} />
          <span className={styles.title}>STORAGE</span>
        </div>
        <div className={styles.loading}>Error loading data</div>
      </div>
    )
  }

  if (!diskInfo) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <HardDrive className={styles.icon} size={20} />
          <span className={styles.title}>STORAGE</span>
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <HardDrive className={styles.icon} size={20} />
        <span className={styles.title}>STORAGE</span>
      </div>

      <div className={styles.content}>
        <div className={styles.storageInfo}>
          <div className={styles.storageBar}>
            <div 
              className={styles.storageBarFill}
              style={{ 
                width: `${diskInfo.usagePercent}%`,
                backgroundColor: getUsageColor(diskInfo.usagePercent)
              }}
            />
          </div>
          <div className={styles.storageStats}>
            <span style={{ color: getUsageColor(diskInfo.usagePercent) }}>
              {diskInfo.usagePercent.toFixed(1)}%
            </span>
            <span className={styles.storageLabel}>Used</span>
          </div>
        </div>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>
              <Database size={16} />
              <span>Total</span>
            </div>
            <div className={styles.detailValue}>{formatBytes(diskInfo.total)}</div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>
              <HardDrive size={16} />
              <span>Used</span>
            </div>
            <div className={styles.detailValue}>{formatBytes(diskInfo.used)}</div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>
              <Database size={16} />
              <span>Free</span>
            </div>
            <div className={styles.detailValue}>{formatBytes(diskInfo.free)}</div>
          </div>
        </div>

        {diskInfo.health && diskInfo.health.smartAvailable && (
          <div className={styles.healthSection}>
            <div className={styles.healthHeader}>
              <Shield size={14} />
              <span>HEALTH</span>
            </div>
            
            <div className={styles.healthGrid}>
              {diskInfo.health.healthStatus && (
                <div className={styles.healthItem}>
                  <span className={styles.healthLabel}>Status</span>
                  <span 
                    className={styles.healthValue}
                    style={{ color: getHealthColor(diskInfo.health.healthStatus) }}
                  >
                    {diskInfo.health.healthStatus.toUpperCase()}
                  </span>
                </div>
              )}

              {diskInfo.health.temperature !== undefined && diskInfo.health.temperature > 0 && (
                <div className={styles.healthItem}>
                  <Thermometer size={12} />
                  <span className={styles.healthLabel}>Temp</span>
                  <span className={styles.healthValue}>{diskInfo.health.temperature}°C</span>
                </div>
              )}

              {diskInfo.health.powerOnHours !== undefined && diskInfo.health.powerOnHours > 0 && (
                <div className={styles.healthItem}>
                  <Clock size={12} />
                  <span className={styles.healthLabel}>Power On</span>
                  <span className={styles.healthValue}>{diskInfo.health.powerOnHours}h</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
