import { useEffect, useRef } from 'react'
import type { LogEntry } from '../types'

interface Props {
  entries: LogEntry[]
}

const TYPE_COLOR: Record<LogEntry['type'], string> = {
  info:    'var(--text-dim)',
  success: 'var(--success)',
  error:   'var(--danger)',
  system:  'var(--accent)',
}

const TYPE_PREFIX: Record<LogEntry['type'], string> = {
  info:    '·',
  success: '✓',
  error:   '✕',
  system:  '»',
}

export default function ActivityLog({ entries }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>Activity</span>
        <span style={styles.count}>{entries.length} events</span>
      </div>

      <div style={styles.scroll}>
        {entries.map(entry => (
          <div key={entry.id} style={styles.entry}>
            <span style={styles.time}>{entry.time}</span>
            <span style={{ ...styles.prefix, color: TYPE_COLOR[entry.type] }}>
              {TYPE_PREFIX[entry.type]}
            </span>
            <span style={{ ...styles.message, color: TYPE_COLOR[entry.type] }}>
              {entry.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'var(--surface)',
  },
  header: {
    padding: '13px 14px 10px',
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  title: {
    fontWeight: 600,
    fontSize: 12,
    color: 'var(--text)',
  },
  count: {
    fontSize: 10.5,
    color: 'var(--muted)',
  },
  scroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  entry: {
    display: 'flex',
    gap: 7,
    padding: '3px 14px',
    animation: 'fadeSlideIn 0.2s ease',
    alignItems: 'flex-start',
  },
  time: {
    fontSize: 10,
    color: 'var(--muted)',
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
    marginTop: 1,
    fontFamily: 'ui-monospace, monospace',
  },
  prefix: {
    fontSize: 11,
    flexShrink: 0,
    fontWeight: 700,
    marginTop: 0.5,
  },
  message: {
    fontSize: 11.5,
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
}
