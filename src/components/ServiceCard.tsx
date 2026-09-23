import type { ServiceName, ServiceStatus } from '../types'

interface Props {
  name: ServiceName
  label: string
  port: string
  status: ServiceStatus
  loading: boolean
  onStart: () => void
  onStop: () => void
  onRestart: () => void
}

const STATUS_COLOR: Record<ServiceStatus, string> = {
  running:     'var(--success)',
  stopped:     'var(--danger)',
  unknown:     'var(--muted)',
  loading:     'var(--warning)',
  deactivated: 'var(--muted)',
}

const STATUS_LABEL: Record<ServiceStatus, string> = {
  running:     'Running',
  stopped:     'Stopped',
  unknown:     'Unknown',
  loading:     '…',
  deactivated: 'Deactivated',
}

const SERVICE_ICON: Record<ServiceName, string> = {
  apache: '🌐',
  mysql:  '🗄',
  ftp:    '📂',
}

export default function ServiceCard({
  name, label, port, status, loading,
  onStart, onStop, onRestart,
}: Props) {
  const isRunning = status === 'running'
  const isStopped = status === 'stopped'
  const isLoading = status === 'loading' || loading
  const isDeactivated = status === 'deactivated'
  const dotColor  = STATUS_COLOR[status]

  return (
    <div style={styles.card}>
      <div style={styles.top}>
        <div style={styles.left}>
          <span style={styles.icon}>{SERVICE_ICON[name]}</span>
          <div style={styles.info}>
            <span style={styles.label}>{label}</span>
            <span style={styles.port}>port {port}</span>
          </div>
        </div>

        <div style={styles.statusBadge}>
          <span
            style={{
              ...styles.dot,
              background: dotColor,
              boxShadow: isRunning ? `0 0 6px ${dotColor}` : 'none',
              animation: isRunning ? 'pulse 2.4s ease-in-out infinite' : 'none',
              opacity: isDeactivated ? 0.4 : 1,
            }}
          />
          <span style={{ ...styles.statusText, color: dotColor }}>
            {isLoading ? '…' : STATUS_LABEL[status]}
          </span>
        </div>
      </div>

      <div style={styles.actions}>
        <ActionBtn
          label="Start"
          onClick={onStart}
          disabled={isRunning || isLoading || isDeactivated}
          variant="success"
        />
        <ActionBtn
          label="Stop"
          onClick={onStop}
          disabled={isStopped || isLoading || isDeactivated}
          variant="danger"
        />
        <ActionBtn
          label="Restart"
          onClick={onRestart}
          disabled={isStopped || isLoading || isDeactivated}
          variant="default"
        />
      </div>
    </div>
  )
}

function ActionBtn({
  label, onClick, disabled, variant,
}: {
  label: string
  onClick: () => void
  disabled: boolean
  variant: 'success' | 'danger' | 'default'
}) {
  const color =
    variant === 'success' ? 'var(--success)' :
    variant === 'danger'  ? 'var(--danger)'  :
    'var(--text-dim)'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        color: disabled ? 'var(--muted)' : color,
        borderColor: disabled ? 'var(--border)' : color + '44',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {label}
    </button>
  )
}

const btnBase: React.CSSProperties = {
  flex: 1,
  background: 'none',
  border: '1px solid',
  borderRadius: 'var(--radius-sm)',
  padding: '5px 0',
  fontSize: 11.5,
  fontWeight: 500,
  transition: 'opacity 0.15s, background 0.15s',
  fontFamily: 'inherit',
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '12px 13px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  top: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
  },
  icon: {
    fontSize: 18,
    lineHeight: 1,
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  label: {
    fontWeight: 600,
    fontSize: 13,
    color: 'var(--text)',
  },
  port: {
    fontSize: 11,
    color: 'var(--text-dim)',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: 500,
  },
  actions: {
    display: 'flex',
    gap: 6,
  },
}
