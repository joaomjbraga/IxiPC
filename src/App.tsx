import styles from './App.module.css'
import { CPUCard } from './components/CPUCard'
import { DiskCard } from './components/DiskCard'
import { Header } from './components/Header'
import { MemoryCard } from './components/MemoryCard'
import { SystemCard } from './components/SystemCard'

function App() {
  return (
    <>
      <Header />
      <div className={styles.container}>
        <main className={styles.dashboard}>
          <div className={styles.gridContainer}>
            <SystemCard />
            <CPUCard />
            <MemoryCard />
            <DiskCard />
          </div>
        </main>
      </div>
    </>
  )
}

export default App

