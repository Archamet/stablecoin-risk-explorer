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
  return (
    <div style={styles.page}>
      <NavBar />
      <main style={styles.main}>
        <p style={styles.blurb}>
          Aggregate KYC design intelligence derived from public USDC onchain data.
          Not transaction monitoring.
        </p>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Overview</h2>
          <p style={styles.placeholder}>Charts and KPI cards will appear here.</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Methodology</h2>
          <p style={styles.placeholder}>Dune query IDs, assumptions, and data provenance will appear here.</p>
        </section>
      </main>
    </div>
  )
}

export default App
