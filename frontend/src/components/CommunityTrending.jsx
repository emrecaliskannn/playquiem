import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from './ui'

import { API } from '../lib/supabase'
const TEAL = 'var(--accent)'
const PLACEHOLDER = 'https://placehold.co/264x352/111116/94F5D8?text='

// ── Stat pill ─────────────────────────────────────────────────
function StatPill({ value, label }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '8px 16px',
      background: 'rgba(102,192,244,0.06)',
      border: '1px solid rgba(102,192,244,0.12)',
      borderRadius: 10,
    }}>
      <span style={{
        fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
        fontWeight: 900, fontSize: '1.3rem', letterSpacing: '-0.03em',
        color: TEAL, lineHeight: 1,
      }}>{value}</span>
      <span style={{
        fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
        fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'rgba(102,192,244,0.35)',
        marginTop: 3, whiteSpace: 'nowrap',
      }}>{label}</span>
    </div>
  )
}

// ── Trending row ──────────────────────────────────────────────
function TrendingRow({ game, showReview = false }) {
  const nav = useNavigate()
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => game.igdb_id && nav(`/game/${game.igdb_id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 14px', cursor: 'pointer',
        borderBottom: '1px solid rgba(102,192,244,0.05)',
        background: hovered ? 'rgba(102,192,244,0.04)' : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      {/* Rank */}
      <div style={{
        width: 28, flexShrink: 0, textAlign: 'center',
        fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
        fontWeight: 900, fontSize: '1.1rem',
        color: game.rank <= 3 ? TEAL : 'rgba(102,192,244,0.25)',
        textShadow: game.rank <= 3 ? '0 0 12px rgba(102,192,244,0.4)' : 'none',
      }}>
        {game.rank}
      </div>

      {/* Cover */}
      <img
        src={game.cover_url || PLACEHOLDER}
        alt={game.title}
        onError={e => e.target.src = PLACEHOLDER}
        style={{
          width: 36, height: 48, objectFit: 'cover',
          borderRadius: 6, flexShrink: 0,
          border: '1px solid rgba(102,192,244,0.1)',
          transition: 'transform 0.15s',
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
        }}
      />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
          fontWeight: 700, fontSize: '0.84rem', color: TEAL,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {game.title}
        </div>
        {showReview && game.top_review ? (
          <div style={{
            fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
            fontSize: '0.66rem', color: 'rgba(102,192,244,0.4)',
            fontStyle: 'italic', marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            "{game.top_review.slice(0, 60)}{game.top_review.length > 60 ? '…' : ''}"
          </div>
        ) : (
          <div style={{
            fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
            fontSize: '0.62rem', color: 'rgba(102,192,244,0.3)', marginTop: 2,
          }}>
            {game.avg_rating ? `★ ${game.avg_rating} avg` : ''}
            {game.review_count > 0 ? ` · ${game.review_count} review${game.review_count > 1 ? 's' : ''}` : ''}
          </div>
        )}
      </div>

      {/* Log count badge */}
      <div style={{
        flexShrink: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 1,
      }}>
        <div style={{
          fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
          fontWeight: 900, fontSize: '1rem',
          color: game.rank <= 3 ? TEAL : 'rgba(102,192,244,0.5)',
        }}>
          {game.log_count}
        </div>
        <div style={{
          fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
          fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'rgba(102,192,244,0.25)',
        }}>logs</div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function CommunityTrending({ compact = false }) {
  const nav = useNavigate()
  const [games,   setGames]   = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('chart')  // chart | reviews
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/trending/community?limit=${compact ? 5 : 12}`).then(r => r.json()),
      fetch(`${API}/api/trending/community/stats`).then(r => r.json()),
    ]).then(([games, stats]) => {
      setGames(Array.isArray(games) ? games : [])
      setStats(stats)
      setLastUpdated(new Date())
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const displayGames = compact ? games.slice(0, 5) : games

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid rgba(102,192,244,0.12)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 18px 12px',
        borderBottom: '1px solid rgba(102,192,244,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            {/* Live pulse dot */}
            <div style={{ position: 'relative', width: 8, height: 8 }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: TEAL, opacity: 0.8,
                animation: 'pulse-ring 2s ease-out infinite',
              }}/>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: TEAL, position: 'relative',
              }}/>
            </div>
            <span style={{
              fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
              fontWeight: 900, fontSize: '0.82rem', letterSpacing: '-0.01em',
              color: TEAL,
            }}>Trending on Playquiem</span>
          </div>
          <div style={{
            fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
            fontSize: '0.58rem', color: 'rgba(102,192,244,0.3)',
            letterSpacing: '0.05em',
          }}>
            Most logged by our community this week
            {lastUpdated && ` · updated ${lastUpdated.toLocaleTimeString('en', {hour:'2-digit',minute:'2-digit'})}`}
          </div>
        </div>

        {/* Community stats */}
        {stats && !compact && (
          <div style={{ display: 'flex', gap: 8 }}>
            <StatPill value={stats.logs_this_week}    label="logs / week" />
            <StatPill value={stats.logs_today}        label="today"       />
            <StatPill value={stats.reviews_this_week} label="reviews"     />
          </div>
        )}
      </div>

      {/* Tabs (full view only) */}
      {!compact && (
        <div style={{
          display: 'flex', borderBottom: '1px solid rgba(102,192,244,0.08)',
        }}>
          {[['chart', ' Chart'], ['reviews', ' With Reviews']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '9px 18px', background: 'transparent', border: 'none',
              borderBottom: tab === key ? `2px solid ${TEAL}` : '2px solid transparent',
              fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
              fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.05em',
              color: tab === key ? TEAL : 'rgba(102,192,244,0.35)',
              cursor: 'pointer', transition: 'color 0.15s',
              marginBottom: -1,
            }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}>
          <Spinner />
        </div>
      ) : displayGames.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}></div>
          <p style={{
            fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
            fontSize: '0.82rem', color: 'rgba(102,192,244,0.4)',
          }}>
            No logs this week yet — be the first!
          </p>
        </div>
      ) : (
        <div>
          {displayGames.map(game => (
            <TrendingRow
              key={game.igdb_id}
              game={game}
              showReview={tab === 'reviews'}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      {!compact && displayGames.length > 0 && (
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid rgba(102,192,244,0.06)',
          textAlign: 'center',
        }}>
          <button onClick={() => nav('/activity')} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
            fontSize: '0.7rem', fontWeight: 700,
            color: 'rgba(102,192,244,0.4)',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = TEAL}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(102,192,244,0.4)'}
          >
            View all community activity →
          </button>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.8; }
          70%  { transform: scale(2.2); opacity: 0;   }
          100% { transform: scale(2.2); opacity: 0;   }
        }
      `}</style>
    </div>
  )
}
