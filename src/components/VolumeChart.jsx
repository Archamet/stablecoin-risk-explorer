import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const ARCHETYPE_COLOURS = {
  exchanges: '#0070f3',
  custody_treasury: '#7928ca',
  payment_processors: '#ff4d4d',
  defi_protocols: '#f5a623',
  bridges_wrapped: '#50e3c2',
}

const ARCHETYPES = Object.keys(ARCHETYPE_COLOURS)

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

function formatUSD(value) {
  return '$' + value.toLocaleString()
}

function pivotData(data) {
  const byDate = {}
  for (const row of data) {
    if (row.archetype === 'unknown') continue
    if (!byDate[row.date]) byDate[row.date] = { date: row.date }
    byDate[row.date][row.archetype] = row.volume_usd
  }
  return Object.values(byDate).sort((a, b) => (a.date < b.date ? -1 : 1))
}

export function VolumeChart({ data = [] }) {
  const chartData = pivotData(data)

  return (
    <div style={styles.wrapper}>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#888' }}
            tickLine={false}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis
            tickFormatter={(v) => '$' + (v >= 1_000_000 ? (v / 1_000_000).toFixed(0) + 'M' : v.toLocaleString())}
            tick={{ fontSize: 11, fill: '#888' }}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip formatter={(value) => formatUSD(value)} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          {ARCHETYPES.map((archetype) => (
            <Area
              key={archetype}
              type="monotone"
              dataKey={archetype}
              stackId="1"
              stroke={ARCHETYPE_COLOURS[archetype]}
              fill={ARCHETYPE_COLOURS[archetype]}
              fillOpacity={0.6}
              strokeWidth={1.5}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <p style={styles.kycNote}>
        <span style={styles.kycLabel}>KYC design question: </span>
        What volume concentration by counterparty type should trigger enhanced due diligence thresholds?
      </p>
    </div>
  )
}
