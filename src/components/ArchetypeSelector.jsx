const ARCHETYPES = [
  { id: 'exchanges', label: 'Exchanges' },
  { id: 'custody_treasury', label: 'Custody / Treasury' },
  { id: 'payment_processors', label: 'Payment Processors' },
  { id: 'defi_protocols', label: 'DeFi Protocols' },
  { id: 'bridges_wrapped', label: 'Bridges / Wrapped' },
]

const styles = {
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  btn: (selected) => ({
    padding: '6px 14px',
    fontSize: '13px',
    borderRadius: '4px',
    border: '1px solid',
    borderColor: selected ? '#0070f3' : '#d0d0d0',
    background: selected ? '#0070f3' : '#fff',
    color: selected ? '#fff' : '#333',
    cursor: 'pointer',
    fontFamily: 'inherit',
  }),
}

export function ArchetypeSelector({ selectedArchetypes, onChange }) {
  function toggle(id) {
    if (selectedArchetypes.includes(id)) {
      onChange(selectedArchetypes.filter((a) => a !== id))
    } else {
      onChange([...selectedArchetypes, id])
    }
  }

  return (
    <div style={styles.wrapper}>
      {ARCHETYPES.map(({ id, label }) => (
        <button
          key={id}
          style={styles.btn(selectedArchetypes.includes(id))}
          onClick={() => toggle(id)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export const ALL_ARCHETYPES = ARCHETYPES.map((a) => a.id)
