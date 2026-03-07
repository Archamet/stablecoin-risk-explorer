import { useState, useEffect } from 'react'

export function useArchetypeData({ start, end, token }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)
  const [duneQueryId, setDuneQueryId] = useState(null)

  useEffect(() => {
    if (!start || !end || !token) return

    const params = new URLSearchParams({ start, end, token })

    setLoading(true)
    setError(null)

    fetch(`/api/archetype?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        const LABEL_MAP = {
          'Exchange': 'exchanges',
          'Custody/Treasury': 'custody_treasury',
          'Payment Processor': 'payment_processors',
          'DeFi Protocol': 'defi_protocols',
          'Bridge/Wrapped': 'bridges_wrapped',
        }
        const normalised = (json.data ?? []).map((row) => ({
          ...row,
          archetype: LABEL_MAP[row.archetype] ?? row.archetype,
        }))
        setData(normalised)
        setFetchedAt(json.fetched_at ?? null)
        setDuneQueryId(json.dune_query_id ?? null)
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [start, end, token])

  return { data, loading, error, fetchedAt, duneQueryId }
}
