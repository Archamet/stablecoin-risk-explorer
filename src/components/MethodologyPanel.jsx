import { useState } from 'react'

const ARCHETYPES = [
  { label: 'Exchanges', definition: 'Centralised exchange deposit/withdrawal addresses' },
  { label: 'Custody / Treasury', definition: 'Institutional custodians, corporate treasury' },
  { label: 'Payment Processors', definition: 'Merchant settlement, B2B payment rails' },
  { label: 'DeFi Protocols', definition: 'AMMs, lending, yield aggregators' },
  { label: 'Bridges / Wrapped', definition: 'Cross-chain bridges, wrapped token contracts' },
]

const DUNE_QUERIES = [
  { label: 'Archetype volume timeseries', id: '6796353' },
  { label: 'Archetype transfer size distribution', id: '6796354' },
  { label: 'Archetype supply snapshot', id: '6796356' },
  { label: 'Stress event overlay', id: '6796357' },
]

const styles = {
  wrapper: {
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  toggleBtn: {
    width: '100%',
    background: '#fff',
    border: 'none',
    borderBottom: '1px solid #e0e0e0',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
    textAlign: 'left',
  },
  chevron: (open) => ({
    fontSize: '11px',
    color: '#888',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.15s ease',
  }),
  body: {
    background: '#fff',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#888',
    margin: '0 0 10px 0',
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  listItem: {
    fontSize: '13px',
    color: '#333',
    lineHeight: '1.4',
  },
  archetypeLabel: {
    fontWeight: '600',
  },
  link: {
    color: '#0070f3',
    textDecoration: 'none',
    fontSize: '13px',
  },
  timestamp: {
    fontSize: '12px',
    color: '#aaa',
    marginTop: '-12px',
  },
  privacyNote: {
    fontSize: '12px',
    color: '#555',
    lineHeight: '1.6',
    background: '#f8f9fa',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    padding: '12px',
    margin: 0,
  },
}

export function MethodologyPanel({ fetchedAt, duneQueryId }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={styles.wrapper}>
      <button style={styles.toggleBtn} onClick={() => setOpen((o) => !o)}>
        <span>Methodology &amp; Data Sources</span>
        <span style={styles.chevron(open)}>&#9660;</span>
      </button>

      {open && (
        <div style={styles.body}>
          <div>
            <p style={styles.sectionTitle}>Archetype Definitions</p>
            <ul style={styles.list}>
              {ARCHETYPES.map(({ label, definition }) => (
                <li key={label} style={styles.listItem}>
                  <span style={styles.archetypeLabel}>{label}</span> — {definition}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p style={styles.sectionTitle}>Coverage Note</p>
            <p style={styles.privacyNote}>
              Volume charts show the five classified archetypes only. The majority of USDC transfers are to unclassified addresses and are excluded from visualisations. This reflects the nature of public blockchain data — most activity cannot be attributed to a known institutional counterparty type.
            </p>
          </div>

          <div>
            <p style={styles.sectionTitle}>Data Sources</p>
            <ul style={styles.list}>
              {DUNE_QUERIES.map(({ label, id }) => (
                <li key={id} style={styles.listItem}>
                  {label}:{' '}
                  <a
                    href={`https://dune.com/queries/${id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                  >
                    query #{id}
                  </a>
                </li>
              ))}
            </ul>
            {fetchedAt && (
              <p style={styles.timestamp}>Last fetched: {new Date(fetchedAt).toUTCString()}</p>
            )}
            {duneQueryId && (
              <p style={styles.timestamp}>Active query ID: {duneQueryId}</p>
            )}
          </div>

          <p style={styles.privacyNote}>
            This dashboard uses public onchain data only. It is not connected to internal
            transaction records, KYC systems, or any personal data. This is KYC design
            intelligence, not transaction monitoring.
          </p>
        </div>
      )}
    </div>
  )
}
