import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('systemAPI', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getCPUInfo: () => ipcRenderer.invoke('get-cpu-info'),
  getMemoryInfo: () => ipcRenderer.invoke('get-memory-info'),
  getDiskInfo: () => ipcRenderer.invoke('get-disk-info'),
  getAllInfo: () => ipcRenderer.invoke('get-all-info'),
})

contextBridge.exposeInMainWorld('electronAPI', {
   close: () => ipcRenderer.send('window-close')
})
