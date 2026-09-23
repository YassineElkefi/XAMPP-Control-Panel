import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('xampp', {
  status: () => ipcRenderer.invoke('xampp:status'),
  service: (service: string, action: string) => ipcRenderer.invoke('xampp:service', service, action),
  all: (action: 'start' | 'stop' | 'restart') => ipcRenderer.invoke('xampp:all', action),
  openUrl: (url: string) => ipcRenderer.invoke('open:url', url),
})
