const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  label: {
    fontSize: '13px',
    color: '#555',
  },
  input: {
    fontSize: '13px',
    padding: '5px 8px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    fontFamily: 'inherit',
    color: '#1a1a1a',
  },
}

function toISODate(date) {
  return date.toISOString().slice(0, 10)
}

function defaultDates() {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 90)
  return { start: toISODate(start), end: toISODate(end) }
}

export const DEFAULT_DATE_RANGE = defaultDates()

export function TimeRangeSelector({ start, end, onStartChange, onEndChange }) {
  return (
    <div style={styles.wrapper}>
      <label style={styles.label}>
        From&nbsp;
        <input
          type="date"
          style={styles.input}
          value={start}
          max={end}
          onChange={(e) => onStartChange(e.target.value)}
        />
      </label>
      <label style={styles.label}>
        To&nbsp;
        <input
          type="date"
          style={styles.input}
          value={end}
          min={start}
          onChange={(e) => onEndChange(e.target.value)}
        />
      </label>
    </div>
  )
}
