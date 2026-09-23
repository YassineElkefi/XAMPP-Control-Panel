export type ServiceStatus = 'running' | 'stopped' | 'unknown' | 'loading' | 'deactivated'
export type ServiceName = 'apache' | 'mysql' | 'ftp'
export type ServiceAction = 'start' | 'stop' | 'restart'

export interface StatusResult {
  apache: ServiceStatus
  mysql: ServiceStatus
  ftp: ServiceStatus
  raw: string
}

export interface LogEntry {
  id: number
  time: string
  type: 'info' | 'success' | 'error' | 'system'
  message: string
}

// Extend window with our IPC bridge
declare global {
  interface Window {
    xampp: {
      status: () => Promise<StatusResult>
      service: (service: ServiceName, action: ServiceAction) => Promise<{ success: boolean; output: string }>
      all: (action: ServiceAction) => Promise<{ success: boolean; output: string }>
      openUrl: (url: string) => Promise<void>
    }
  }
}
