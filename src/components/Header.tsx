interface Props {
  onRefresh: () => void
}

export default function Header({ onRefresh }: Props) {
  return (
    <div style={styles.header}>
      {/* Space for traffic lights (hiddenInset) */}
      <div style={styles.trafficSpacer} />

      <div style={styles.titleGroup}>
        <span style={styles.logo}>⚙</span>
        <span style={styles.title}>XAMPP Control</span>
      </div>

      <button style={styles.refreshBtn} onClick={onRefresh} title="Refresh status">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <path
            d="M13.65 2.35A8 8 0 1 0 15 8h-2a6 6 0 1 1-1.06-3.39L10 6h5V1l-1.35 1.35z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  )
}

type ElectronCSSProperties = React.CSSProperties & {
  WebkitAppRegion?: 'drag' | 'no-drag'
}

const styles: Record<string, ElectronCSSProperties> = {
  header: {
    height: 48,
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
    WebkitAppRegion: 'drag' as any,
    flexShrink: 0,
    paddingRight: 12,
  },
  trafficSpacer: {
    width: 78,   // room for traffic light buttons
    flexShrink: 0,
  },
  titleGroup: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  },
  logo: {
    fontSize: 15,
    opacity: 0.6,
  },
  title: {
    fontWeight: 600,
    fontSize: 13,
    color: 'var(--text)',
    letterSpacing: '-0.01em',
  },
  refreshBtn: {
    WebkitAppRegion: 'no-drag' as any,
    background: 'none',
    border: 'none',
    color: 'var(--text-dim)',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.15s, background 0.15s',
  },
}
