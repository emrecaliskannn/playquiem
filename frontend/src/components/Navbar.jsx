import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { MagnifyingGlass, X, Bell, User, GameController, House, BookOpen, List, UsersThree, Newspaper, SignOut, CaretDown } from '@phosphor-icons/react'
import { useAuthStore } from '../store/authStore'
import { API } from '../lib/supabase'

const NAV = [
  { label: 'GAMES',     to: '/'          },
  { label: 'ALL GAMES', to: '/games'     },
  { label: 'DIARY',     to: '/diary'     },
  { label: 'COMMUNITY', to: '/community' },
  { label: 'NEWS',      to: '/news'      },
  { label: 'PLAYERS',   to: '/players'   },
  { label: 'LISTS',     to: '/lists'     },
]

export default function Navbar() {
  const { user, profile, signOut } = useAuthStore()
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [q,          setQ]          = useState('')
  const [results,    setResults]    = useState([])
  const [searching,  setSearching]  = useState(false)
  const [activeIdx,  setActiveIdx]  = useState(-1)
  const searchRef  = useRef(null)
  const timerRef   = useRef(null)
  const inputRef   = useRef(null)
  const nav = useNavigate()
  const loc = useLocation()

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setQ('')
    setResults([])
    setActiveIdx(-1)
  }, [])

  const handleSearch = e => {
    e.preventDefault()
    if (q.trim()) {
      nav(`/games?q=${encodeURIComponent(q.trim())}`)
      closeSearch()
    }
  }

  const goToGame = game => {
    nav(`/game/${game.id}`)
    closeSearch()
  }

  // Debounced live search
  useEffect(() => {
    if (!q.trim()) { setResults([]); setSearching(false); return }
    setSearching(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`${API}/api/games?q=${encodeURIComponent(q.trim())}&limit=6`)
        const data = await r.json()
        setResults(Array.isArray(data) ? data : [])
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 280)
    return () => clearTimeout(timerRef.current)
  }, [q])

  // Close on outside click
  useEffect(() => {
    const h = e => { if (searchRef.current && !searchRef.current.contains(e.target)) closeSearch() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [closeSearch])

  // Keyboard navigation
  const handleKeyDown = e => {
    if (!results.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i+1, results.length-1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i-1, -1)) }
    if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); goToGame(results[activeIdx]) }
    if (e.key === 'Escape') closeSearch()
  }

  const initials = (profile?.username || 'U')[0].toUpperCase()

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 pq-glass"
        style={{ height: 58 }}
      >
        <div
          className="mx-auto h-full flex items-center gap-0 px-6"
          style={{ maxWidth: 1400 }}
        >

          {/* ── Logo ── */}
          <Link
            to="/"
            className="flex items-center gap-3 flex-shrink-0 mr-10 no-underline"
            style={{ textDecoration: 'none' }}
          >
            <span style={{
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontWeight: 800,
              fontSize: '1.15rem',
              letterSpacing: '-0.02em',
              color: '#0ea5e9',
              textShadow: '0 0 20px rgba(14,165,233,0.3)',
            }}>
              Playquiem
            </span>
          </Link>

          {/* ── Nav links ── */}
          <div className="hidden md:flex items-stretch h-full flex-1">
            {NAV.map(({ label, to }) => {
              const active = loc.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className="no-underline flex items-center px-4 transition-all"
                  style={{
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: active ? '#0ea5e9' : 'rgba(14,165,233,0.45)',
                    borderBottom: active ? '2px solid #0ea5e9' : '2px solid transparent',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s, border-color 0.15s',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => { if (!active) e.target.style.color = 'rgba(14,165,233,0.8)' }}
                  onMouseLeave={e => { if (!active) e.target.style.color = 'rgba(14,165,233,0.45)' }}
                >
                  {label}
                </Link>
              )
            })}
          </div>

          {/* ── Right side ── */}
          <div className="flex items-center gap-2 ml-auto">

            {/* Search */}
            <button
              onClick={() => { setSearchOpen(s => !s); setTimeout(() => inputRef.current?.focus(), 50) }}
              className="p-2 rounded-lg transition-colors"
              style={{
                background: 'transparent',
                border: 'none',
                color: searchOpen ? '#0ea5e9' : 'rgba(14,165,233,0.4)',
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(14,165,233,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              {searchOpen ? <X size={17} /> : <MagnifyingGlass size={17} weight="bold"/>}
            </button>

            {/* Notification bell */}
            {user && (
              <button
                onClick={() => nav('/notifications')}
                className="p-2 rounded-lg transition-colors"
                style={{ background: 'transparent', border: 'none', color: 'rgba(14,165,233,0.4)', fontSize: 16 }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(14,165,233,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
                title="Notifications"
              >
                
              </button>
            )}

            {/* User menu / Sign in */}
            {user ? (
              <div className="relative ml-1">
                <button
                  onClick={() => setMenuOpen(m => !m)}
                  className="flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all"
                  style={{
                    background: 'rgba(14,165,233,0.07)',
                    border: '1px solid rgba(14,165,233,0.15)',
                    cursor: 'pointer',
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(14,165,233,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(14,165,233,0.07)'}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0ea5e9, rgba(14,165,233,0.4))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 800, color: '#070b12', flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0ea5e9', display: 'none' }}
                        className="sm:block">
                    @{profile?.username || '…'}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'rgba(14,165,233,0.35)' }}></span>
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden"
                    style={{
                      width: 200,
                      background: '#0f1c2e',
                      border: '1px solid rgba(14,165,233,0.12)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(14,165,233,0.05)',
                      zIndex: 100,
                    }}
                  >
                    {[
                      { icon: null, label: 'My Profile',    to: '/profile'      },
                      { icon: '', label: 'My Library',    to: '/library'      },
                      { icon: <BookOpen size={16} weight='bold'/>, label: 'Diary',         to: '/diary'        },
                      { icon: '', label: 'For You',       to: '/for-you'      },
                      { icon: '', label: 'Achievements',  to: '/achievements' },
                      { icon: '', label: 'Year in Review',to: '/year-review'  },
                      { icon: '', label: 'Challenges',    to: '/challenges'   },
                      { icon: '', label: 'Activity Feed', to: '/activity'     },
                    ].map(({ icon, label, to }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setMenuOpen(false)}
                        className="no-underline flex items-center gap-2.5 px-4 py-2.5 transition-colors"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 16px',
                          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                          fontSize: '0.8rem', fontWeight: 500,
                          color: 'rgba(14,165,233,0.75)',
                          textDecoration: 'none',
                          borderBottom: '1px solid rgba(14,165,233,0.04)',
                          transition: 'background 0.12s, color 0.12s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(14,165,233,0.07)'
                          e.currentTarget.style.color = '#0ea5e9'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'rgba(14,165,233,0.75)'
                        }}
                      >
                        <span style={{ fontSize: 14 }}>{icon}</span>
                        {label}
                      </Link>
                    ))}
                    <div style={{ borderTop: '1px solid rgba(14,165,233,0.08)' }} />
                    <button
                      onClick={async () => {
                        setMenuOpen(false)
                        await signOut()
                        window.location.href = '/'
                      }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '9px 16px',
                        display: 'flex', alignItems: 'center', gap: 10,
                        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                        fontSize: '0.8rem', fontWeight: 500,
                        color: '#E84545', background: 'transparent', border: 'none',
                        cursor: 'pointer', transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(232,69,69,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >
                      <span></span> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  background: '#0ea5e9', color: '#070b12',
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.06em',
                  padding: '7px 16px', borderRadius: 8,
                  textDecoration: 'none', transition: 'opacity 0.15s',
                  marginLeft: 4,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity='1'}
              >
                SIGN IN
              </Link>
            )}
          </div>
        </div>

        {/* ── Instant search dropdown ── */}
        {searchOpen && (
          <div ref={searchRef} style={{
            position: 'absolute', top: 58, left: 0, right: 0,
            background: 'rgba(10,10,10,0.97)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(14,165,233,0.1)',
            zIndex: 200,
          }}>
            {/* Search input */}
            <form onSubmit={handleSearch} style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="rgba(14,165,233,0.4)" strokeWidth="2.5" style={{flexShrink:0}}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={inputRef}
                autoFocus
                value={q}
                onChange={e => { setQ(e.target.value); setActiveIdx(-1) }}
                onKeyDown={handleKeyDown}
                placeholder="Search any game…"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  fontSize: '1rem', color: '#0ea5e9',
                  outline: 'none', caretColor: '#0ea5e9',
                }}
              />
              {searching && (
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                  border: '2px solid rgba(14,165,233,0.2)',
                  borderTopColor: '#0ea5e9',
                  animation: 'spin 0.7s linear infinite',
                }}/>
              )}
              {q && !searching && (
                <button onClick={() => { setQ(''); setResults([]); inputRef.current?.focus() }}
                  style={{ background:'none', border:'none', color:'rgba(14,165,233,0.35)',
                           cursor:'pointer', fontSize:20, lineHeight:1, padding:0, flexShrink:0 }}>
                  ×
                </button>
              )}
            </form>

            {/* Results */}
            {results.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(14,165,233,0.08)' }}>
                {results.map((game, i) => (
                  <div
                    key={game.id}
                    onClick={() => goToGame(game)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 24px', cursor: 'pointer',
                      background: i === activeIdx ? 'rgba(14,165,233,0.07)' : 'transparent',
                      borderBottom: '1px solid rgba(14,165,233,0.04)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(14,165,233,0.07)'; setActiveIdx(i) }}
                    onMouseLeave={e => { if (activeIdx !== i) e.currentTarget.style.background='transparent' }}
                  >
                    <img
                      src={game.cover || 'https://placehold.co/264x352/111116/94F5D8?text='}
                      alt={game.title}
                      onError={e => e.target.src='https://placehold.co/264x352/111116/94F5D8?text='}
                      style={{ width: 32, height: 42, objectFit: 'cover', borderRadius: 6, flexShrink: 0,
                               border: '1px solid rgba(14,165,233,0.1)' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                        fontWeight: 700, fontSize: '0.88rem', color: '#0ea5e9',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{game.title}</div>
                      <div style={{
                        fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                        fontSize: '0.65rem', color: 'rgba(14,165,233,0.35)', marginTop: 2,
                      }}>
                        {[game.year, game.genres?.[0], game.platforms?.[0]].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    {game.rating > 0 && (
                      <div style={{
                        fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                        fontSize: '0.72rem', color: 'rgba(14,165,233,0.5)', flexShrink: 0,
                      }}> {game.rating}</div>
                    )}
                  </div>
                ))}
                {/* View all results */}
                <div
                  onClick={() => { nav(`/games?q=${encodeURIComponent(q.trim())}`); closeSearch() }}
                  style={{
                    padding: '10px 24px', cursor: 'pointer', textAlign: 'center',
                    fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                    fontSize: '0.75rem', fontWeight: 700,
                    color: 'rgba(14,165,233,0.45)',
                    borderTop: '1px solid rgba(14,165,233,0.06)',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color='#0ea5e9'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(14,165,233,0.45)'}
                >
                  See all results for "{q}" →
                </div>
              </div>
            )}

            {/* No results */}
            {q.length > 1 && !searching && results.length === 0 && (
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid rgba(14,165,233,0.08)',
                fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                fontSize: '0.8rem', color: 'rgba(14,165,233,0.3)',
                textAlign: 'center',
              }}>
                No games found for "{q}"
              </div>
            )}
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </nav>

      {/* Close dropdown on outside click */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  )
}
