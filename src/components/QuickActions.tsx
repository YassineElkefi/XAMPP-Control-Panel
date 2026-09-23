interface Props {
  allRunning:      boolean
  noneRunning:     boolean
  loadingAll:      boolean
  onStartAll:      () => void
  onStopAll:       () => void
  onOpenLocalhost: () => void
  onOpenPhpMyAdmin:() => void
}

export default function QuickActions({
  allRunning, noneRunning, loadingAll,
  onStartAll, onStopAll, onOpenLocalhost, onOpenPhpMyAdmin,
}: Props) {
  return (
    <div style={styles.container}>
      <div style={styles.divider} />

      <div style={styles.section}>
        <span style={styles.sectionLabel}>All services</span>
        <div style={styles.row}>
          <button
            style={{ ...styles.btn, ...styles.btnSuccess }}
            onClick={onStartAll}
            disabled={allRunning || loadingAll}
          >
            ▶ Start all
          </button>
          <button
            style={{ ...styles.btn, ...styles.btnDanger }}
            onClick={onStopAll}
            disabled={noneRunning || loadingAll}
          >
            ⏹ Stop all
          </button>
        </div>
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <span style={styles.sectionLabel}>Open in browser</span>
        <div style={styles.row}>
          <button style={{ ...styles.btn, ...styles.btnAccent }} onClick={onOpenLocalhost}>
            🌐 localhost
          </button>
          <button style={{ ...styles.btn, ...styles.btnAccent }} onClick={onOpenPhpMyAdmin}>
            📁 phpMyAdmin
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flexShrink: 0,
    padding: '0 12px 14px',
  },
  divider: {
    height: 1,
    background: 'var(--border)',
    margin: '10px 0',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  sectionLabel: {
    fontSize: 10.5,
    color: 'var(--text-dim)',
    fontWeight: 500,
    letterSpacing: '0.04em',
  },
  row: {
    display: 'flex',
    gap: 6,
  },
  btn: {
    flex: 1,
    border: '1px solid',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 0',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.15s',
  },
  btnSuccess: {
    background: 'rgba(62,207,142,0.1)',
    borderColor: 'rgba(62,207,142,0.3)',
    color: 'var(--success)',
  },
  btnDanger: {
    background: 'rgba(248,113,113,0.1)',
    borderColor: 'rgba(248,113,113,0.3)',
    color: 'var(--danger)',
  },
  btnAccent: {
    background: 'rgba(79,142,247,0.1)',
    borderColor: 'rgba(79,142,247,0.3)',
    color: 'var(--accent)',
  },
}
