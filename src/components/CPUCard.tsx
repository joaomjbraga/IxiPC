import { useEffect, useState, useRef } from 'react'
import { Cpu, Activity, Zap } from 'lucide-react'
import type { CPUInfo } from '../types'
import styles from './CPUCard.module.css'

export function CPUCard() {
  const [cpuInfo, setCpuInfo] = useState<CPUInfo | null>(null)
  const [history, setHistory] = useState<number[]>(new Array(30).fill(0))
  const [error, setError] = useState<boolean>(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await window.systemAPI.getCPUInfo()
        if (data) {
          setCpuInfo(data)
          setHistory(prev => [...prev.slice(1), data.usage])
          setError(false)
        }
      } catch (err) {
        console.error('Error fetching CPU info:', err)
        setError(true)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || history.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = 0
    const graphWidth = width - padding * 2
    const graphHeight = height - padding * 2

    ctx.clearRect(0, 0, width, height)

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, 'rgba(14, 165, 233, 0.4)')
    gradient.addColorStop(1, 'rgba(14, 165, 233, 0.05)')

    ctx.beginPath()
    history.forEach((value, index) => {
      const x = padding + (index / (history.length - 1)) * graphWidth
      const y = padding + graphHeight - (value / 100) * graphHeight
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.lineTo(width - padding, height - padding)
    ctx.lineTo(padding, height - padding)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    history.forEach((value, index) => {
      const x = padding + (index / (history.length - 1)) * graphWidth
      const y = padding + graphHeight - (value / 100) * graphHeight
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.strokeStyle = '#0ea5e9'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [history])

  const getUsageColor = (usage: number): string => {
    if (usage < 50) return 'var(--success)'
    if (usage < 80) return 'var(--warning)'
    return 'var(--danger)'
  }

  const truncateCPUName = (name: string): string => {
    const parts = name.split(' ')
    return parts.slice(0, 3).join(' ')
  }

  if (error) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <Cpu className={styles.icon} size={20} />
          <span className={styles.title}>CPU</span>
        </div>
        <div className={styles.loading}>Error loading data</div>
      </div>
    )
  }

  if (!cpuInfo) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <Cpu className={styles.icon} size={20} />
          <span className={styles.title}>CPU</span>
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Cpu className={styles.icon} size={20} />
        <span className={styles.title}>CPU</span>
      </div>

      <div className={styles.content}>
        <div className={styles.mainMetric}>
          <div className={styles.usageValue} style={{ color: getUsageColor(cpuInfo.usage) }}>
            {cpuInfo.usage.toFixed(1)}%
          </div>
          <div className={styles.usageLabel}>Usage</div>
        </div>

        <canvas ref={canvasRef} className={styles.graph} width={300} height={60} />

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>
              <Activity size={16} />
              <span>Processor</span>
            </div>
            <div className={styles.detailValue}>{truncateCPUName(cpuInfo.model)}</div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>
              <Zap size={16} />
              <span>Cores</span>
            </div>
            <div className={styles.detailValue}>{cpuInfo.cores} Cores</div>
          </div>
        </div>

        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ 
              width: `${cpuInfo.usage}%`,
              backgroundColor: getUsageColor(cpuInfo.usage)
            }} 
          />
        </div>
      </div>
    </div>
  )
}
