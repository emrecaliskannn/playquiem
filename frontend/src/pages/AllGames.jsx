import { useState } from 'react'
import { MagnifyingGlass, Funnel, SortAscending } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useInfiniteScroll } from '../hooks/useGames'
import { GameCard, SkeletonCard, Spinner } from '../components/ui'
import LogModal from '../components/LogModal'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const GENRES = [
  { value: '', label: 'All Genres' },
  { value: 'Role-playing (RPG)', label: 'RPG' },
  { value: 'Action', label: 'Action' },
  { value: 'Adventure', label: 'Adventure' },
  { value: 'Shooter', label: 'Shooter' },
  { value: 'Strategy', label: 'Strategy' },
  { value: 'Simulation', label: 'Simulation' },
  { value: 'Horror', label: 'Horror' },
  { value: 'Fighting', label: 'Fighting' },
  { value: 'Racing', label: 'Racing' },
  { value: 'Sport', label: 'Sports' },
  { value: 'Puzzle', label: 'Puzzle' },
  { value: 'Platform', label: 'Platformer' },
  { value: 'Indie', label: 'Indie' },
  { value: 'Arcade', label: 'Arcade' },
  { value: 'Music', label: 'Music' },
]

const SORTS = [
  { value: 'rating',       label: 'Top Rated'        },
  { value: 'popular',      label: 'Most Popular'      },
  { value: 'newest',       label: 'Newest'            },
  { value: 'anticipated',  label: 'Most Anticipated'  },
]


const SEL = {
  background: 'rgba(14,165,233,0.07)',
  borderColor: 'rgba(14,165,233,0.25)',
  color: '#0ea5e9',
  colorScheme: 'dark',
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
}

const LABEL = {
  display: 'block',
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
  fontSize: '0.6rem', fontWeight: 800,
  letterSpacing: '0.14em', textTransform: 'uppercase',
  color: '#0ea5e9', marginBottom: 6,
}

export default function AllGames() {
  const [q,        setQ]        = useState('')
  const [genre,    setGenre]    = useState('')
  const [sort,     setSort]     = useState('rating')
  const [loggedSet,setLoggedSet]= useState(new Set())
  const [logTarget,setLogTarget]= useState(null)
  const { user } = useAuthStore()
  const nav = useNavigate()

  const { games, loading, hasMore, error, sentinelRef, debouncedQ } =
    useInfiniteScroll({ genre, sort, q })

  const handleLog = game => {
    if (!user) { toast.error('Sign in to log games'); nav('/auth'); return }
    setLogTarget(game)
  }


  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '76px 24px 60px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
          fontWeight: 900, fontSize: '2rem', letterSpacing: '-0.03em',
          color: '#0ea5e9', marginBottom: 4,
        }}> All Games</h1>
        <p style={{
          fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
          fontSize: '0.82rem', color: 'rgba(14,165,233,0.4)',
        }}>Browse 500,000+ games — type to search live</p>
      </div>

      {/* ── Filter bar ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f1c2e, #142236)',
        border: '1px solid rgba(14,165,233,0.18)',
        borderRadius: 16, padding: '18px 20px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>

          {/* Search */}
          <div style={{ flex: '2 1 200px' }}>
            <label style={LABEL}>Search</label>
            <div style={{ position: 'relative' }}>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Type to search any game…"
                autoComplete="off"
                style={{
                  width: '100%', padding: '9px 36px 9px 14px',
                  borderRadius: 10, border: '1px solid rgba(14,165,233,0.25)',
                  background: 'rgba(14,165,233,0.07)',
                  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                  fontSize: '0.88rem', color: '#0ea5e9', caretColor: '#0ea5e9',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(14,165,233,0.55)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(14,165,233,0.25)'}
              />
              {q && (
                <button onClick={() => setQ('')} style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'rgba(14,165,233,0.45)', cursor: 'pointer',
                  fontSize: 18, lineHeight: 1, padding: 0,
                }}>×</button>
              )}
            </div>
            {q && q !== debouncedQ && (
              <p style={{
                fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                fontSize: '0.6rem', color: 'rgba(14,165,233,0.4)', marginTop: 4,
              }}>Searching…</p>
            )}
          </div>

          {/* Genre */}
          <div style={{ flex: '1 1 140px' }}>
            <label style={LABEL}>Genre</label>
            <select
              value={genre}
              onChange={e => setGenre(e.target.value)}
              style={{ ...SEL, width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">All Genres</option>
              {GENRES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>

          {/* Console */}
          <div style={{ flex: '1 1 150px' }}>
            <label style={{
              ...LABEL,
              color: 'rgba(14,165,233,0.5)' || 'rgba(14,165,233,0.5)',
            }}>Console</label>
</div>

          {/* Sort */}
          <div style={{ flex: '1 1 140px' }}>
            <label style={LABEL}>Sort By</label>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{ ...SEL, width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid', outline: 'none', cursor: 'pointer' }}
            >
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

        </div>

        {/* Active filters summary */}
        {genre && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {genre && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.35)',
                color: '#0ea5e9',
              }}>
                {genre}
                <button onClick={() => setGenre('')} style={{ background:'none', border:'none', color:'rgba(14,165,233,0.5)', cursor:'pointer', fontSize:14, lineHeight:1, padding:0 }}>×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <p style={{
          fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
          fontSize: '0.78rem', color: 'rgba(14,165,233,0.4)',
        }}>
          {loading && games.length === 0 ? 'Loading…'
            : `${games.length} games`
              + (debouncedQ ? ` for "${debouncedQ}"` : '')
              + (genre ? ` · ${genre}` : '')}
        </p>
        {loading && games.length > 0 && <Spinner size="sm" />}
      </div>

      {/* ── Game grid ── */}
      {error ? (
        <div style={{ textAlign: 'center', paddingTop: 40, color: '#E84545' }}>{error}</div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 14,
            alignItems: 'start',
          }}>
            {loading && games.length === 0 &&
              Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}

            {games.map(g => (
              <GameCard
                key={g.id}
                game={g}
                onLog={handleLog}
                logged={loggedSet.has(g.id)}
              />
            ))}
          </div>

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} style={{ height: 40 }} />

          {/* End of results */}
          {!loading && !hasMore && games.length > 0 && (
            <p style={{
              textAlign: 'center', paddingTop: 16,
              fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
              fontSize: '0.72rem', color: 'rgba(14,165,233,0.25)',
            }}>
              — {games.length} games loaded —
            </p>
          )}

          {/* Empty state */}
          {!loading && games.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}></div>
              <p style={{
                fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                fontWeight: 800, fontSize: '1rem', color: '#0ea5e9', marginBottom: 6,
              }}>No games found</p>
              <p style={{
                fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                fontSize: '0.8rem', color: 'rgba(14,165,233,0.35)',
              }}>Try a different search or filter</p>
            </div>
          )}
        </>
      )}

      {/* Log modal */}
      {logTarget && (
        <LogModal
          game={logTarget}
          onClose={() => setLogTarget(null)}
          onSaved={() => setLoggedSet(prev => new Set([...prev, logTarget.id]))}
        />
      )}
    </div>
  )
}
