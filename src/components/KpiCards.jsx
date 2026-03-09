const ARCHETYPES = [
  {
    id: 'exchanges',
    label: 'Exchanges',
    kyc: 'High volume signals retail onboarding risk concentration',
  },
  {
    id: 'custody_treasury',
    label: 'Custody / Treasury',
    kyc: 'Large transfers indicate institutional CDD requirements',
  },
  {
    id: 'payment_processors',
    label: 'Payment Processors',
    kyc: 'Velocity patterns inform merchant due diligence thresholds',
  },
  {
    id: 'defi_protocols',
    label: 'DeFi Protocols',
    kyc: 'Protocol flows require source of funds assessment frameworks',
  },
  {
    id: 'bridges_wrapped',
    label: 'Bridges / Wrapped',
    kyc: 'Cross-chain activity signals jurisdictional risk exposure',
  },
]

const styles = {
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '12px',
  },
  card: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#94A3B8',
    margin: 0,
  },
  volume: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1E293B',
    margin: '4px 0 2px 0',
  },
  txCount: {
    fontSize: '12px',
    color: '#94A3B8',
    margin: 0,
  },
  kycNote: {
    fontSize: '11px',
    color: '#64748B',
    lineHeight: '1.5',
    margin: 0,
    marginTop: '8px',
    borderTop: '1px solid #E2E8F0',
    paddingTop: '8px',
  },
}

function latestForArchetype(data, archetypeId) {
  const rows = data.filter((r) => r.archetype === archetypeId)
  if (!rows.length) return null
  return rows.reduce((latest, r) => (r.date > latest.date ? r : latest), rows[0])
}

function formatUSD(value) {
  if (value == null) return '—'
  if (value >= 1_000_000_000) return '$' + (value / 1_000_000_000).toFixed(1) + 'B'
  if (value >= 1_000_000) return '$' + (value / 1_000_000).toFixed(1) + 'M'
  return '$' + Number(value).toLocaleString()
}

export function KpiCards({ data = [] }) {
  return (
    <div style={styles.row}>
      {ARCHETYPES.map(({ id, label, kyc }) => {
        const row = latestForArchetype(data, id)
        return (
          <div key={id} style={styles.card}>
            <p style={styles.label}>{label}</p>
            <p style={styles.volume}>{formatUSD(row?.volume_usd)}</p>
            <p style={styles.txCount}>
              {row ? Number(row.tx_count).toLocaleString() + ' txns' : '—'}
            </p>
            <p style={styles.kycNote}>{kyc}</p>
          </div>
        )
      })}
    </div>
  )
}
