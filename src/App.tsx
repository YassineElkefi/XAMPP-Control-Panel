import { useState, useEffect, useRef, useCallback } from 'react'
import type { ServiceStatus, ServiceName, ServiceAction, LogEntry, StatusResult } from './types'
import ServiceCard from './components/ServiceCard'
import ActivityLog from './components/ActivityLog'
import Header from './components/Header'
import QuickActions from './components/QuickActions'

let logId = 0
const now = () =>
  new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

const SERVICES: { name: ServiceName; label: string; port: string }[] = [
  { name: 'apache', label: 'Apache',   port: '80 / 443' },
  { name: 'mysql',  label: 'MySQL',    port: '3306'      },
  { name: 'ftp',    label: 'ProFTPD',  port: '21'        },
]

export default function App() {
  const [status, setStatus] = useState<Record<ServiceName, ServiceStatus>>({
    apache: 'unknown',
    mysql:  'unknown',
    ftp:    'unknown',
  })
  const [loading, setLoading] = useState<Record<ServiceName | 'all', boolean>>({
    apache: false, mysql: false, ftp: false, all: false,
  })
  const [log, setLog] = useState<LogEntry[]>([
    { id: logId++, time: now(), type: 'system', message: 'XAMPP Control started.' },
  ])
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    setLog(prev => [...prev.slice(-99), { id: logId++, time: now(), type, message }])
  }, [])

  const fetchStatus = useCallback(async (silent = false) => {
    if (!silent) addLog('info', 'Checking service status…')
    try {
      const result: StatusResult = await window.xampp.status()
      setStatus({ apache: result.apache, mysql: result.mysql, ftp: result.ftp })
      if (!silent) addLog('system', `Status refreshed.`)
    } catch {
      addLog('error', 'Failed to read status.')
    }
  }, [addLog])

  // Poll every 8 seconds silently
  useEffect(() => {
    fetchStatus()
    pollRef.current = setInterval(() => fetchStatus(true), 8000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchStatus])

  const runService = async (service: ServiceName, action: ServiceAction) => {
    setLoading(l => ({ ...l, [service]: true }))
    setStatus(s => ({ ...s, [service]: 'loading' }))
    addLog('info', `${action.charAt(0).toUpperCase() + action.slice(1)}ing ${service}…`)
    try {
      const res = await window.xampp.service(service, action)
      if (res.success) {
        addLog('success', `${service} ${action}ed successfully.`)
      } else {
        addLog('error', `${service} ${action} failed: ${res.output}`)
      }
    } catch (e: any) {
      addLog('error', e.message)
    } finally {
      setLoading(l => ({ ...l, [service]: false }))
      await fetchStatus(true)
    }
  }

  const runAll = async (action: ServiceAction) => {
    setLoading(l => ({ ...l, all: true }))
    setStatus({ apache: 'loading', mysql: 'loading', ftp: 'loading' })
    addLog('info', `${action.charAt(0).toUpperCase() + action.slice(1)}ing all services…`)
    try {
      const res = await window.xampp.all(action)
      if (res.success) {
        addLog('success', `All services ${action}ed.`)
      } else {
        addLog('error', `All-services ${action} failed: ${res.output}`)
      }
    } catch (e: any) {
      addLog('error', e.message)
    } finally {
      setLoading(l => ({ ...l, all: false }))
      await fetchStatus(true)
    }
  }

  const openUrl = (url: string) => {
    window.xampp.openUrl(url)
    addLog('info', `Opened ${url}`)
  }

  const allRunning  = SERVICES.every(s => status[s.name] === 'running')
  const noneRunning = SERVICES.every(s => status[s.name] === 'stopped')

  return (
    <div style={styles.root}>
      <Header onRefresh={() => fetchStatus(false)} />

      <div style={styles.body}>
        {/* ── Left: service cards ── */}
        <div style={styles.left}>
          <div style={styles.cards}>
            {SERVICES.map(svc => (
              <ServiceCard
                key={svc.name}
                name={svc.name}
                label={svc.label}
                port={svc.port}
                status={status[svc.name]}
                loading={loading[svc.name]}
                onStart={() => runService(svc.name, 'start')}
                onStop={() => runService(svc.name, 'stop')}
                onRestart={() => runService(svc.name, 'restart')}
              />
            ))}
          </div>

          <QuickActions
            allRunning={allRunning}
            noneRunning={noneRunning}
            loadingAll={loading.all}
            onStartAll={() => runAll('start')}
            onStopAll={() => runAll('stop')}
            onOpenLocalhost={() => openUrl('http://localhost')}
            onOpenPhpMyAdmin={() => openUrl('http://localhost/phpmyadmin')}
          />
        </div>

        {/* ── Right: activity log ── */}
        <ActivityLog entries={log} />
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'var(--bg)',
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    gap: 1,
  },
  left: {
    width: 300,
    minWidth: 300,
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid var(--border)',
    overflow: 'hidden',
  },
  cards: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 12px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
}
