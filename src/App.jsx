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
    fontFamily: "'Inter', system-ui, sans-serif",
    color: '#1a1a1a',
    background: '#F1F5F9',
    minHeight: '100vh',
    margin: 0,
  },
  navbar: {
    background: '#fff',
    borderBottom: '1px solid #CBD5E1',
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    height: '64px',
  },
  navTitle: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    margin: 0,
    color: '#94A3B8',
  },
  main: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '40px 32px',
  },
  blurb: {
    fontSize: '13px',
    color: '#94A3B8',
    margin: '0 0 32px 0',
    lineHeight: '1.6',
    letterSpacing: '0.01em',
  },
  section: {
    background: '#fff',
    border: '1px solid #CBD5E1',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#94A3B8',
    margin: '0 0 16px 0',
    paddingBottom: '12px',
    borderBottom: '1px solid #E2E8F0',
  },
  kycNote: {
    fontSize: '13px',
    color: '#64748B',
    margin: '0 0 20px 0',
    lineHeight: '1.6',
  },
  kycLabel: {
    fontWeight: '600',
    color: '#475569',
  },
  loadingText: {
    fontSize: '13px',
    color: '#94A3B8',
    textAlign: 'center',
    padding: '48px 0',
    letterSpacing: '0.02em',
  },
  errorBox: {
    fontSize: '13px',
    color: '#DC2626',
    padding: '12px 16px',
    background: '#FFF5F5',
    border: '1px solid #CBD5E1',
    borderRadius: '12px',
    marginBottom: '20px',
  },
}

// Inject Inter font
if (typeof document !== 'undefined') {
  const link = document.createElement('link')
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
}

function NavBar() {
  return (
    <nav style={styles.navbar}>
      <h1 style={styles.navTitle}>On-Chain KYC Intelligence Dashboard</h1>
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
          <h2 style={styles.sectionTitle}>Filters</h2>
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
          <p style={styles.loadingText}>Loading data…</p>
        )}

        {error && (
          <p style={styles.errorBox}>
            Failed to load data: {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Overview</h2>
              <p style={styles.kycNote}>
                <span style={styles.kycLabel}>KYC design question: </span>
                Which counterparty types represent the greatest concentration of USDC activity,
                and how should this inform your customer risk segmentation framework?
              </p>
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