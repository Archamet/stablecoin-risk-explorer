import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const styles = {
  wrapper: {
    width: '100%',
  },
  kycNote: {
    marginTop: '12px',
    fontSize: '13px',
    color: '#555',
    fontStyle: 'italic',
    lineHeight: '1.5',
  },
  kycLabel: {
    fontWeight: '600',
    fontStyle: 'normal',
    color: '#333',
  },
}

const ARCHETYPE_LABELS = {
  exchanges: 'Exchanges',
  custody_treasury: 'Custody / Treasury',
  payment_processors: 'Payment Processors',
  defi_protocols: 'DeFi Protocols',
  bridges_wrapped: 'Bridges / Wrapped',
}

function formatUSD(value) {
  return '$' + Number(value).toLocaleString()
}

function latestDayData(data) {
  if (!data.length) return []
  const latestDate = data.reduce((max, row) => (row.date > max ? row.date : max), data[0].date)
  return data
    .filter((row) => row.date === latestDate)
    .map((row) => ({
      archetype: ARCHETYPE_LABELS[row.archetype] ?? row.archetype,
      median_size: row.median_size,
      pct90_size: row.pct90_size,
    }))
}

export function SizeDistributionChart({ data = [] }) {
  const chartData = latestDayData(data)

  return (
    <div style={styles.wrapper}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 0 }}>
          <XAxis
            dataKey="archetype"
            tick={{ fontSize: 11, fill: '#888' }}
            tickLine={false}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis
            tickFormatter={(v) =>
              '$' + (v >= 1_000_000 ? (v / 1_000_000).toFixed(0) + 'M' : v.toLocaleString())
            }
            tick={{ fontSize: 11, fill: '#888' }}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip formatter={(value) => formatUSD(value)} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          <Bar dataKey="median_size" name="Median size" fill="#0070f3" radius={[3, 3, 0, 0]} />
          <Bar dataKey="pct90_size" name="90th percentile" fill="#f5a623" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p style={styles.kycNote}>
        <span style={styles.kycLabel}>KYC design question: </span>
        How should transaction size thresholds differ by counterparty archetype in CDD programmes?
      </p>
    </div>
  )
}
