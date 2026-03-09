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
  exchanges:          '#0070f3',
  custody_treasury:   '#7928ca',
  payment_processors: '#ff4d4d',
  defi_protocols:     '#f5a623',
  bridges_wrapped:    '#50e3c2',
}

const ARCHETYPES = ['exchanges', 'payment_processors', 'defi_protocols', 'custody_treasury', 'bridges_wrapped']

const styles = {
  wrapper: {
    width: '100%',
  },
  kycNote: {
    marginTop: '16px',
    fontSize: '13px',
    color: '#64748B',
    lineHeight: '1.5',
    paddingTop: '12px',
    borderTop: '1px solid #E2E8F0',
  },
  kycLabel: {
    fontWeight: '600',
    color: '#475569',
  },
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
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
            tickFormatter={(d) => {
              const date = new Date(d)
              return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
            }}
          />
          <YAxis
            tickFormatter={(v) => '$' + (v >= 1_000_000 ? (v / 1_000_000).toFixed(0) + 'M' : v.toLocaleString())}
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip
            formatter={(value) => '$' + value.toLocaleString()}
            contentStyle={{
              background: '#ffffff',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#1E293B',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px', color: '#64748B' }} />
          {ARCHETYPES.map((archetype) => (
            <Area
              key={archetype}
              type="monotone"
              dataKey={archetype}
              stackId="1"
              stroke={ARCHETYPE_COLOURS[archetype]}
              fill={ARCHETYPE_COLOURS[archetype]}
              fillOpacity={0.7}
              strokeWidth={1}
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