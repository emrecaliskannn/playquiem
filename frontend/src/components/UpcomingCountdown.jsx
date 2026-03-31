import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const TEAL = '#0ea5e9'
const PLACEHOLDER = 'https://placehold.co/264x352/111116/94F5D8?text='

// ── Live countdown hook ───────────────────────────────────────
function useCountdown(releaseTs) {
  const calc = () => {
    const diff = releaseTs * 1000 - Date.now()
    if (diff <= 0) return null
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000)  / 60000)
    const s = Math.floor((diff % 60000)    / 1000)
    return { d, h, m, s, diff }
  }

  const [time, setTime] = useState(calc)

  useEffect(() => {
    if (!releaseTs) return
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id)
  }, [releaseTs])

  return time
}

// ── Countdown unit box ────────────────────────────────────────
function TimeBox({ value, label }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      minWidth: 38,
    }}>
      <div style={{
        background: 'rgba(14,165,233,0.08)',
        border: '1px solid rgba(14,165,233,0.18)',
        borderRadius: 7, padding: '5px 8px',
        fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
        fontWeight: 900, fontSize: '1.1rem', lineHeight: 1,
        color: TEAL, letterSpacing: '-0.02em',
        minWidth: 38, textAlign: 'center',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{
        fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
        fontSize: '0.48rem', fontWeight: 800,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'rgba(14,165,233,0.3)', marginTop: 3,
      }}>
        {label}
      </div>
    </div>
  )
}

// ── Single countdown card ─────────────────────────────────────
function CountdownCard({ game, rank }) {
  const nav  = useNavigate()
  const time = useCountdown(game.releaseTs)
  const [hovered, setHovered] = useState(false)

  const daysLeft = time ? time.d : 0
  const urgency  = daysLeft <= 7  ? 'soon'
                 : daysLeft <= 30 ? 'month'
                 : 'future'

  const urgencyColor = urgency === 'soon'   ? '#E84545'
                     : urgency === 'month'  ? '#F5A94F'
                     : TEAL

  return (
    <div
      onClick={() => game.id && nav(`/game/${game.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#13131a' : '#0c1422',
        border: `1px solid ${hovered ? 'rgba(14,165,233,0.22)' : 'rgba(14,165,233,0.08)'}`,
        borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 36px rgba(14,165,233,0.08)' : 'none',
      }}
    >
      {/* Cover with rank overlay */}
      <div style={{ position: 'relative' }}>
        <img
          src={game.cover || PLACEHOLDER}
          alt={game.title}
          onError={e => e.target.src = PLACEHOLDER}
          style={{
            width: '100%', aspectRatio: '3/4',
            objectFit: 'cover', display: 'block',
            transition: 'transform 0.2s',
            transform: hovered ? 'scale(1.03)' : 'scale(1)',
          }}
        />

        {/* Rank badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
          fontWeight: 900, fontSize: '1.6rem', lineHeight: 1,
          color: TEAL, textShadow: '0 2px 14px rgba(14,165,233,0.6)',
        }}>
          #{rank}
        </div>

        {/* Urgency badge */}
        {urgency === 'soon' && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(232,69,69,0.9)',
            color: '#fff', fontSize: '0.5rem', fontWeight: 800,
            padding: '3px 7px', borderRadius: 4,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            animation: 'pq-blink 1.5s ease-in-out infinite',
          }}>
            THIS WEEK
          </div>
        )}
        {urgency === 'month' && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(245,169,79,0.85)',
            color: '#070b12', fontSize: '0.5rem', fontWeight: 800,
            padding: '3px 7px', borderRadius: 4,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            THIS MONTH
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
          background: 'linear-gradient(to top, rgba(10,10,15,1) 0%, transparent 100%)',
        }}/>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        {/* Title */}
        <div style={{
          fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
          fontWeight: 800, fontSize: '0.82rem', color: TEAL,
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          marginBottom: 4,
        }}>
          {game.title}
        </div>

        {/* Release date */}
        <div style={{
          fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
          fontSize: '0.6rem', color: 'rgba(14,165,233,0.4)',
          marginBottom: 10,
        }}>
          {game.released || 'TBA'}
          {game.platforms?.[0] && ` · ${game.platforms[0]}`}
        </div>

        {/* Countdown or TBA */}
        {time ? (
          <div>
            {time.d > 0 ? (
              /* Days + hours + min */
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
                <TimeBox value={time.d} label="days" />
                <div style={{ color: 'rgba(14,165,233,0.2)', fontSize: '0.9rem', marginBottom: 14 }}>:</div>
                <TimeBox value={time.h} label="hrs"  />
                <div style={{ color: 'rgba(14,165,233,0.2)', fontSize: '0.9rem', marginBottom: 14 }}>:</div>
                <TimeBox value={time.m} label="min"  />
                {time.d === 0 && (
                  <>
                    <div style={{ color: 'rgba(14,165,233,0.2)', fontSize: '0.9rem', marginBottom: 14 }}>:</div>
                    <TimeBox value={time.s} label="sec" />
                  </>
                )}
              </div>
            ) : (
              /* Last day — show full h:m:s */
              <div style={{ display: 'flex', gap: 4 }}>
                <TimeBox value={time.h} label="hrs" />
                <div style={{ color: 'rgba(14,165,233,0.2)', fontSize: '0.9rem', marginBottom: 14 }}>:</div>
                <TimeBox value={time.m} label="min" />
                <div style={{ color: 'rgba(14,165,233,0.2)', fontSize: '0.9rem', marginBottom: 14 }}>:</div>
                <TimeBox value={time.s} label="sec" />
              </div>
            )}
          </div>
        ) : (
          <div style={{
            fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
            fontSize: '0.68rem', fontWeight: 700,
            color: 'rgba(14,165,233,0.3)',
          }}>
            Release date TBA
          </div>
        )}

        {/* Hype bar */}
        {game.hypes > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginBottom: 4,
            }}>
              <span style={{
                fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                fontSize: '0.55rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(14,165,233,0.28)',
              }}>Hype</span>
              <span style={{
                fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                fontSize: '0.6rem', fontWeight: 800, color: 'rgba(14,165,233,0.5)',
              }}>{game.hypes.toLocaleString()}</span>
            </div>
            <div style={{
              height: 3, background: 'rgba(14,165,233,0.08)',
              borderRadius: 2, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${Math.min((game.hypes / 1000) * 100, 100)}%`,
                background: `linear-gradient(90deg, rgba(14,165,233,0.4), ${TEAL})`,
                transition: 'width 0.8s ease',
              }}/>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────
export default function UpcomingCountdown({ games = [], loading = false }) {
  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 16,
      }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{
            background: '#0c1422', borderRadius: 14, overflow: 'hidden',
            border: '1px solid rgba(14,165,233,0.06)',
          }}>
            <div className="shimmer" style={{ aspectRatio: '3/4' }}/>
            <div style={{ padding: '10px 12px 12px' }}>
              <div className="shimmer" style={{ height: 11, borderRadius: 4, marginBottom: 8 }}/>
              <div className="shimmer" style={{ height: 8, borderRadius: 4, width: '60%', marginBottom: 12 }}/>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(i => (
                  <div key={i} className="shimmer"
                       style={{ height: 42, width: 38, borderRadius: 7 }}/>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!games.length) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>⏳</div>
        <p style={{
          fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
          fontSize: '0.82rem', color: 'rgba(14,165,233,0.35)',
        }}>No upcoming games found</p>
      </div>
    )
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 16,
      }}>
        {games.map((g, i) => (
          <CountdownCard key={g.id} game={g} rank={i + 1} />
        ))}
      </div>

      <style>{`
        @keyframes pq-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
      `}</style>
    </>
  )
}
