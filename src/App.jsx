import { useState } from 'react'
import { ArchetypeSelector, ALL_ARCHETYPES } from './components/ArchetypeSelector'
import { TimeRangeSelector, DEFAULT_DATE_RANGE } from './components/TimeRangeSelector'
import { KpiCards } from './components/KpiCards'
import { VolumeChart } from './components/VolumeChart'
import { SizeDistributionChart } from './components/SizeDistributionChart'
import { MethodologyPanel } from './components/MethodologyPanel'
import { useArchetypeData } from './hooks/useArchetypeData'

const styles = {
  page: {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: '#1a1a1a',
    background: '#f8f9fa',
    minHeight: '100vh',
    margin: 0,
  },
  navbar: {
    background: '#fff',
    borderBottom: '1px solid #e0e0e0',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    height: '56px',
  },
  navTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
    color: '#1a1a1a',
  },
  main: {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  blurb: {
    fontSize: '14px',
    color: '#555',
    margin: '0 0 40px 0',
    lineHeight: '1.5',
    borderLeft: '3px solid #0070f3',
    paddingLeft: '12px',
  },
  section: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    padding: '24px',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#888',
    margin: '0 0 12px 0',
  },
  placeholder: {
    fontSize: '14px',
    color: '#aaa',
    margin: 0,
  },
}

function NavBar() {
  return (
    <nav style={styles.navbar}>
      <h1 style={styles.navTitle}>Stablecoin Use-Case Risk Explorer</h1>
    </nav>
  )
}

function App() {
  const [selectedArchetypes, setSelectedArchetypes] = useState(ALL_ARCHETYPES)
  const [start, setStart] = useState(DEFAULT_DATE_RANGE.start)
  const [end, setEnd] = useState(DEFAULT_DATE_RANGE.end)

  const { data, loading, error, fetchedAt, duneQueryId } = useArchetypeData({
    start,
    end,
    token: 'USDC',
  })

  const filteredData = data.filter((row) => selectedArchetypes.includes(row.archetype))

  return (
    <div style={styles.page}>
      <NavBar />
      <main style={styles.main}>
        <p style={styles.blurb}>
          Public onchain data, analysed by counterparty type to inform KYC programme design.
        </p>

        <section style={styles.section}>
          <div style={{ marginBottom: '16px' }}>
            <ArchetypeSelector
              selectedArchetypes={selectedArchetypes}
              onChange={setSelectedArchetypes}
            />
          </div>
          <TimeRangeSelector
            start={start}
            end={end}
            onStartChange={setStart}
            onEndChange={setEnd}
          />
        </section>

        {loading && (
          <p style={{ fontSize: '14px', color: '#888', textAlign: 'center', padding: '32px 0' }}>
            Loading…
          </p>
        )}

        {error && (
          <p style={{ fontSize: '14px', color: '#cc0000', padding: '12px 16px', background: '#fff5f5', border: '1px solid #fcc', borderRadius: '6px' }}>
            Failed to load data: {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Overview</h2>
              <KpiCards data={filteredData} />
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Volume by Archetype</h2>
              <VolumeChart data={filteredData} />
            </section>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Transfer Size Distribution</h2>
              <SizeDistributionChart data={filteredData} />
            </section>
          </>
        )}

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Methodology</h2>
          <MethodologyPanel fetchedAt={fetchedAt} duneQueryId={duneQueryId} />
        </section>
      </main>
    </div>
  )
}

export default App
