import { X, Cpu } from 'lucide-react'
import styles from './Header.module.css'

export function Header() {
  const handleClose = () => {
    window.electronAPI.close()
  }

  return (
    <div className={styles.header}>
      <div className={styles.logo}>
        <Cpu size={18} />
        <span className={styles.title}>IxiPC</span>
        <span className={styles.version}>v1.0</span>
      </div>
      
      <button className={styles.closeButton} onClick={handleClose}>
        <X size={16} />
      </button>
    </div>
  )
}
