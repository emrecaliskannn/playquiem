import { useState, useEffect } from 'react'
import { Heart, Star as StarIcon } from '@phosphor-icons/react'
import { likeReview, unlikeReview } from '../lib/db'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { Star, Calendar, Flame } from 'lucide-react'

const PLACEHOLDER = 'https://placehold.co/264x352/111118/26263a?text='

// ── Stars ────────────────────────────────────────────────────
export function Stars({ rating, max = 5, size = 'sm' }) {
  const sz = size === 'lg' ? 'text-xl' : 'text-sm'
  return (
    <div className={`flex gap-0.5 ${sz}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < rating ? 'text-gold' : 'text-border'}>★</span>
      ))}
    </div>
  )
}

// ── Genre tags ───────────────────────────────────────────────
export function GenreTags({ genres = [], max = 2 }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {genres.slice(0, max).map(g => (
        <span key={g}
          className="text-[0.58rem] px-1.5 py-0.5 rounded
                     bg-accent/10 border border-accent/20 text-accent">
          {g}
        </span>
      ))}
    </div>
  )
}

// ── Score badge ───────────────────────────────────────────────
export function ScoreBadge({ score }) {
  if (!score) return null
  const color = score >= 75 ? 'text-green border-green/30 bg-green/10'
              : score >= 55 ? 'text-gold border-gold/30 bg-gold/10'
              :               'text-red border-red/30 bg-red/10'
  return (
    <span className={`absolute top-2 right-2 text-[0.72rem] font-bold
                      px-1.5 py-0.5 rounded border ${color}`}>
      ★{score}
    </span>
  )
}

// ── Game card ────────────────────────────────────────────────
export function GameCard({ game, onLog, logged }) {
  const nav = useNavigate()
  const [imgErr, setImgErr] = useState(false)
  const [hov, setHov] = useState(false)
  const F = '"Helvetica Neue",Helvetica,Arial,sans-serif'
  const T = '#0ea5e9'

  return (
    <div style={{ width: '100%' }}>
      {/* Image wrapper — strict aspect ratio */}
      <div
        onClick={() => nav(`/game/${game.id}`)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '133.33%', /* 3:4 ratio */
          borderRadius: 10,
          overflow: 'hidden',
          background: '#0f1c2e',
          border: `1px solid ${hov ? 'rgba(14,165,233,0.4)' : 'rgba(14,165,233,0.08)'}`,
          cursor: 'pointer',
          transform: hov ? 'translateY(-3px)' : 'none',
          boxShadow: hov ? '0 8px 24px rgba(14,165,233,0.12)' : 'none',
          transition: 'all 0.18s ease',
        }}
      >
        <img
          src={imgErr ? PLACEHOLDER : (game.cover || PLACEHOLDER)}
          onError={() => setImgErr(true)}
          alt={game.title}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', display: 'block',
          }}
        />
        <ScoreBadge score={game.rating} />
      </div>

      {/* Title — exactly 2 lines, never more */}
      <div
        onClick={() => nav(`/game/${game.id}`)}
        title={game.title}
        style={{
          fontFamily: F, fontSize: '0.76rem', fontWeight: 700,
          color: hov ? T : 'rgba(255,255,255,0.82)',
          lineHeight: '1.3',
          height: '2.6em', /* exactly 2 lines */
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          padding: '6px 1px 4px',
          cursor: 'pointer',
          transition: 'color 0.15s',
        }}
      >
        {game.title}
      </div>

      {/* Log button — fixed height so rows stay aligned */}
      <div style={{ height: 30 }}>
        {onLog && (
          logged ? (
            <div style={{
              fontFamily: F, fontSize: '0.62rem', fontWeight: 700,
              color: '#2dc653', textAlign: 'center', paddingTop: 4,
            }}>Logged</div>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onLog(game) }}
              style={{
                width: '100%', height: '100%',
                fontFamily: F, fontSize: '0.7rem', fontWeight: 700,
                color: 'rgba(14,165,233,0.75)',
                border: '1px solid rgba(14,165,233,0.18)',
                background: 'rgba(14,165,233,0.04)',
                borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = T
                e.currentTarget.style.borderColor = 'rgba(14,165,233,0.4)'
                e.currentTarget.style.background = 'rgba(14,165,233,0.1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(14,165,233,0.75)'
                e.currentTarget.style.borderColor = 'rgba(14,165,233,0.18)'
                e.currentTarget.style.background = 'rgba(14,165,233,0.04)'
              }}
            >+ Log</button>
          )
        )}
      </div>
    </div>
  )
}

// ── Skeleton card ────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-surf border border-border">
      <div className="aspect-[3/4] shimmer" />
      <div className="p-2.5 space-y-1.5">
        <div className="h-2.5 w-3/4 rounded shimmer" />
        <div className="h-2 w-1/2 rounded shimmer" />
      </div>
    </div>
  )
}

// ── Skeleton grid ────────────────────────────────────────────
export function SkeletonGrid({ count = 10 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}

// ── Avatar ───────────────────────────────────────────────────
export function Avatar({ name = '?', size = 'md', src }) {
  const initials = name.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  const sz = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return src
    ? <img src={src} className={`${sz} rounded-full object-cover`} />
    : (
      <div className={`${sz} rounded-full bg-gradient-to-br from-accent to-purple
                        flex items-center justify-center font-bold text-bg`}>
        {initials}
      </div>
    )
}

// ── Review card ───────────────────────────────────────────────
export function ReviewCard({ review, liked: initialLiked = false }) {
  const PLACEHOLDER = 'https://placehold.co/264x352/0f1c2e/0ea5e9?text='
  const F = '"Helvetica Neue",Helvetica,Arial,sans-serif'
  const T = '#0ea5e9'
  const { user } = useAuthStore()
  const [liked,     setLiked]     = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(review.like_count || 0)
  const [loading,   setLoading]   = useState(false)

  const handleLike = async e => {
    e.stopPropagation()
    if (!user || loading) return
    setLoading(true)
    if (liked) {
      await unlikeReview(review.id)
      setLiked(false)
      setLikeCount(c => Math.max(0, c - 1))
    } else {
      await likeReview(review.id)
      setLiked(true)
      setLikeCount(c => c + 1)
    }
    setLoading(false)
  }

  return (
    <div style={{
      background: '#0f1c2e',
      border: `1px solid ${liked ? 'rgba(14,165,233,0.3)' : 'rgba(14,165,233,0.08)'}`,
      borderRadius: 14, padding: 16,
      transition: 'border-color 0.15s',
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
        <Avatar name={review.display_name || review.username} src={review.avatar_url||''} size="sm"/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:F, fontWeight:700, fontSize:'0.82rem', color:T,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {review.display_name || review.username}
          </div>
          <div style={{ fontFamily:F, fontSize:'0.62rem', color:'rgba(14,165,233,0.35)' }}>
            {review.created_at?.slice(0,10)}
          </div>
        </div>
        {/* Like button */}
        <button onClick={handleLike} disabled={!user || loading} style={{
          display:'flex', alignItems:'center', gap:5,
          padding:'5px 12px', borderRadius:20, cursor: user ? 'pointer' : 'default',
          background: liked ? 'rgba(14,165,233,0.15)' : 'rgba(14,165,233,0.05)',
          border: `1px solid ${liked ? 'rgba(14,165,233,0.4)' : 'rgba(14,165,233,0.12)'}`,
          transition:'all 0.15s',
          opacity: loading ? 0.6 : 1,
        }}
        onMouseEnter={e => { if(user) e.currentTarget.style.background='rgba(14,165,233,0.18)' }}
        onMouseLeave={e => e.currentTarget.style.background = liked ? 'rgba(14,165,233,0.15)' : 'rgba(14,165,233,0.05)'}
        >
          <svg width="13" height="13" viewBox="0 0 24 24"
            fill={liked ? T : 'none'}
            stroke={liked ? T : 'rgba(14,165,233,0.5)'}
            strokeWidth="2" style={{ transition:'all 0.15s', transform: liked ? 'scale(1.15)' : 'scale(1)' }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span style={{ fontFamily:F, fontSize:'0.68rem', fontWeight:700,
                          color: liked ? T : 'rgba(14,165,233,0.45)' }}>
            {likeCount > 0 ? likeCount : ''}
          </span>
        </button>
      </div>

      {/* Game info */}
      <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
        <img src={review.cover_url || PLACEHOLDER}
          style={{ width:34, height:46, objectFit:'cover', borderRadius:6, flexShrink:0,
                    border:'1px solid rgba(14,165,233,0.1)' }}
          onError={e => e.target.src = PLACEHOLDER}/>
        <div>
          <div style={{ fontFamily:F, fontWeight:700, fontSize:'0.88rem', color:'#ffffff', marginBottom:2 }}>
            {review.title}
          </div>
          <div style={{ fontSize:'0.72rem', color:'rgba(14,165,233,0.6)' }}>
            {'★'.repeat(review.rating||0)}
            <span style={{ color:'rgba(14,165,233,0.15)' }}>{'★'.repeat(5-(review.rating||0))}</span>
          </div>
        </div>
      </div>

      {/* Review text */}
      {review.review && (
        <p style={{
          fontFamily:F, fontSize:'0.78rem', lineHeight:1.65,
          color:'rgba(255,255,255,0.6)',
          borderLeft:'2px solid rgba(14,165,233,0.15)',
          paddingLeft:10, margin:0, fontStyle:'italic',
          display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical',
          overflow:'hidden',
        }}>"{review.review}"</p>
      )}
    </div>
  )
}

// ── Loading spinner ───────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-8 h-8'
  return (
    <div className={`${sz} border-2 border-border border-t-accent rounded-full animate-spin`} />
  )
}

// ── Empty state ───────────────────────────────────────────────
export function EmptyState({ icon = '', title, subtitle, action, onAction }) {
  const T = '#0ea5e9'
  const F = '"Helvetica Neue",Helvetica,Arial,sans-serif'

  // SVG illustration — subtle teal geometric shapes
  const Illustration = () => (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none"
         style={{ margin: '0 auto 16px', display: 'block', opacity: 0.35 }}>
      {/* Grid dots */}
      {[0,1,2,3,4].map(x => [0,1,2,3].map(y => (
        <circle key={`${x}-${y}`}
          cx={16 + x * 22} cy={16 + y * 22} r="1.5"
          fill={T} opacity={0.4 + (x+y) * 0.06}/>
      )))}
      {/* Central diamond */}
      <polygon points="60,28 80,48 60,68 40,48"
        stroke={T} strokeWidth="1.5" fill="none" opacity="0.7"/>
      {/* Inner diamond */}
      <polygon points="60,36 72,48 60,60 48,48"
        stroke={T} strokeWidth="1" fill={T} fillOpacity="0.08" opacity="0.8"/>
      {/* Cross hairs */}
      <line x1="60" y1="20" x2="60" y2="32" stroke={T} strokeWidth="1" opacity="0.5"/>
      <line x1="60" y1="64" x2="60" y2="76" stroke={T} strokeWidth="1" opacity="0.5"/>
      <line x1="32" y1="48" x2="44" y2="48" stroke={T} strokeWidth="1" opacity="0.5"/>
      <line x1="76" y1="48" x2="88" y2="48" stroke={T} strokeWidth="1" opacity="0.5"/>
    </svg>
  )

  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <Illustration />
      <div style={{ fontSize: '2.4rem', marginBottom: 14, lineHeight: 1 }}>{icon}</div>
      <div style={{
        fontFamily: F, fontWeight: 800, fontSize: '1.05rem',
        color: T, marginBottom: 8, letterSpacing: '-0.01em',
      }}>{title}</div>
      {subtitle && (
        <div style={{
          fontFamily: F, fontSize: '0.82rem',
          color: 'rgba(14,165,233,0.4)', maxWidth: 340, margin: '0 auto',
          lineHeight: 1.6,
        }}>{subtitle}</div>
      )}
      {action && onAction && (
        <button onClick={onAction} style={{
          marginTop: 20, background: T, color: '#070b12',
          fontFamily: F, fontWeight: 800, fontSize: '0.8rem',
          padding: '10px 22px', borderRadius: 10, border: 'none',
          cursor: 'pointer', letterSpacing: '0.03em',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity='1'}>
          {action}
        </button>
      )}
    </div>
  )
}
