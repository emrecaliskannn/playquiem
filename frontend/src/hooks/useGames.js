import { useState, useEffect, useRef, useCallback } from 'react'
import { API } from '../lib/supabase'

// ── 300ms debounce hook ───────────────────────────────────────
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ── Infinite scroll + live search ────────────────────────────
export function useInfiniteScroll({ genre = '', sort = 'rating', q = '' }) {
  const [games,   setGames]   = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error,   setError]   = useState(null)
  const offsetRef   = useRef(0)
  const loadingRef  = useRef(false)
  const sentinelRef = useRef(null)
  const abortRef    = useRef(null)
  const LIMIT = 20

  // Debounce the query — API only fires 400ms after typing stops
  const debouncedQ = useDebounce(q, 400)
  const filterKey  = genre + '|' + sort + '|' + debouncedQ
  const prevKey    = useRef(filterKey)

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    setGames([])
    setHasMore(true)
    setError(null)
    offsetRef.current  = 0
    loadingRef.current = false
  }, [])

  // Reset when filter/search changes
  useEffect(() => {
    if (prevKey.current !== filterKey) {
      prevKey.current = filterKey
      reset()
    }
  }, [filterKey, reset])

  const fetchBatch = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const p = new URLSearchParams({
        offset: String(offsetRef.current),
        limit:  String(LIMIT),
        sort,
        ...(genre      && { genre }),
        ...(debouncedQ && { q: debouncedQ }),
      })
      const res  = await fetch(API + '/api/games?' + p, { signal: controller.signal })
      if (!res.ok) throw new Error('API error ' + res.status)
      const data = await res.json()
      setGames(prev => offsetRef.current === 0 ? data : [...prev, ...data])
      setHasMore(data.length === LIMIT)
      offsetRef.current += data.length
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [genre, sort, debouncedQ])

  // Initial fetch after each reset
  useEffect(() => {
    if (games.length === 0 && !loading && !error) fetchBatch()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  // IntersectionObserver — fires 400px before sentinel enters view
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && !loadingRef.current) fetchBatch() },
      { rootMargin: '400px 0px', threshold: 0 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [fetchBatch, hasMore, games.length])

  return { games, loading, hasMore, error, sentinelRef, debouncedQ }
}

// ── Single game ───────────────────────────────────────────────
export function useGame(id) {
  const [game,    setGame]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  useEffect(() => {
    if (!id) return
    setLoading(true); setGame(null)
    fetch(API + '/api/games/' + id)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(d => { setGame(d); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [id])
  return { game, loading, error }
}

// ── Section fetches ───────────────────────────────────────────
export function useSection(endpoint) {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(API + '/api/' + endpoint)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [endpoint])
  return { data, loading }
}
