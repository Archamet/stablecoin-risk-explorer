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
        setData(json.data ?? [])
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
