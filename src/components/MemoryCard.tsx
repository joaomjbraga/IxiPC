import { useEffect, useState } from 'react'
import { MemoryStick, Database, TrendingUp } from 'lucide-react'
import type { MemoryInfo } from '../types'
import styles from './MemoryCard.module.css'

export function MemoryCard() {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await window.systemAPI.getMemoryInfo()
        if (data) {
          setMemoryInfo(data)
          setError(false)
        }
      } catch (err) {
        console.error('Error fetching memory info:', err)
        setError(true)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes: number): string => {
    const gb = bytes / (1024 ** 3)
    return `${gb.toFixed(2)} GB`
  }

  const getUsageColor = (usage: number): string => {
    if (usage < 60) return 'var(--success)'
    if (usage < 85) return 'var(--warning)'
    return 'var(--danger)'
  }

  if (error) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <MemoryStick className={styles.icon} size={20} />
          <span className={styles.title}>MEMORY</span>
        </div>
        <div className={styles.loading}>Error loading data</div>
      </div>
    )
  }

  if (!memoryInfo) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <MemoryStick className={styles.icon} size={20} />
          <span className={styles.title}>MEMORY</span>
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  const circumference = 2 * Math.PI * 38
  const strokeDashoffset = circumference - (memoryInfo.usagePercent / 100) * circumference

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <MemoryStick className={styles.icon} size={20} />
        <span className={styles.title}>MEMORY</span>
      </div>

      <div className={styles.content}>
        <div className={styles.circularProgress}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="rgba(0, 0, 0, 0.3)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke={getUsageColor(memoryInfo.usagePercent)}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
          <div className={styles.circularText}>
            <div className={styles.percentage} style={{ color: getUsageColor(memoryInfo.usagePercent) }}>
              {memoryInfo.usagePercent.toFixed(1)}%
            </div>
            <div className={styles.label}>In Use</div>
          </div>
        </div>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>
              <Database size={16} />
              <span>Total</span>
            </div>
            <div className={styles.detailValue}>{formatBytes(memoryInfo.total)}</div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>
              <TrendingUp size={16} />
              <span>Used</span>
            </div>
            <div className={styles.detailValue}>{formatBytes(memoryInfo.used)}</div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>
              <MemoryStick size={16} />
              <span>Free</span>
            </div>
            <div className={styles.detailValue}>{formatBytes(memoryInfo.free)}</div>
          </div>
        </div>

        <div className={styles.memoryBar}>
          <div 
            className={styles.memoryBarFill}
            style={{ 
              width: `${memoryInfo.usagePercent}%`,
              backgroundColor: getUsageColor(memoryInfo.usagePercent)
            }}
          />
        </div>
      </div>
    </div>
  )
}
