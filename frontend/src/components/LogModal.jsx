import { useState, useEffect } from 'react'
import { saveLog } from '../lib/db'
import toast from 'react-hot-toast'

const TEAL = '#0ea5e9'
const PLACEHOLDER = 'https://placehold.co/264x352/111116/94F5D8?text='

const PLATFORMS = [
  'PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X',
  'Xbox One', 'Nintendo Switch', 'iOS', 'Android',
  'PlayStation 3', 'Xbox 360', 'Nintendo Wii U', 'Other',
]

const STATUSES = ['Played', 'Playing', 'Wishlist', 'Dropped']

const PRESET_TAGS = [
  'Platinum Trophy', '100%', 'DLC', 'Replay',
  'Speedrun', 'Co-op', 'Multiplayer', 'Masterpiece',
]

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n} type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{
            fontSize: '1.6rem', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, lineHeight: 1,
            color: n <= (hover || value) ? '#F5C842' : 'rgba(14,165,233,0.12)',
            textShadow: n <= (hover || value) ? '0 0 10px rgba(245,200,66,0.4)' : 'none',
            transition: 'color 0.1s, transform 0.1s',
            transform: n <= hover ? 'scale(1.2)' : 'scale(1)',
          }}
        >★</button>
      ))}
      {value > 0 && (
        <span style={{
          fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
          fontSize: '0.72rem', color: 'rgba(14,165,233,0.4)',
          alignSelf: 'center', marginLeft: 4,
        }}>
          {['', 'Awful', 'Poor', 'Decent', 'Great', 'Masterpiece'][value]}
        </span>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block', marginBottom: 7,
        fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
        fontSize: '0.6rem', fontWeight: 800,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'rgba(14,165,233,0.4)',
      }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  background: 'rgba(14,165,233,0.05)',
  border: '1px solid rgba(14,165,233,0.15)',
  borderRadius: 9, padding: '10px 13px',
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
  fontSize: '0.84rem', color: TEAL, outline: 'none',
  caretColor: TEAL, transition: 'border-color 0.15s',
}

export default function LogModal({ game, onClose, onSaved }) {
  const [platform,   setPlatform]   = useState('')
  const [status,     setStatus]     = useState('Played')
  const [rating,     setRating]     = useState(0)
  const [review,     setReview]     = useState('')
  const [datePlayed, setDatePlayed] = useState(new Date().toISOString().slice(0, 10))
  const [tags,       setTags]       = useState(new Set())
  const [customTag,  setCustomTag]  = useState('')
  const [replayed,   setReplayed]   = useState(false)
  const [saving,     setSaving]     = useState(false)

  // Default platform to first available
  useEffect(() => {
    const first = game?.platforms?.[0] || 'PC'
    setPlatform(first)
  }, [game])

  const toggleTag = t => setTags(prev => {
    const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n
  })

  const handleSave = async () => {
    if (!rating) { toast.error('Please give a star rating'); return }
    if (!platform) { toast.error('Please select a platform'); return }
    setSaving(true)
    try {
      await saveLog({
        igdbId:     game.id,
        title:      game.title,
        coverUrl:   game.cover || '',
        genres:     (game.genres || []).join(', '),
        platform,   status,   rating,
        review:     review || '',
        datePlayed,
        tags:       Array.from(tags).join(', '),
        replayed,
      })
      toast.success(`Logged "${game.title}" `)
      onSaved?.()
      onClose()
    } catch (e) {
      toast.error(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Close on backdrop click
  const handleBackdrop = e => {
    if (e.target === e.currentTarget) onClose()
  }

  // Close on Escape
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  if (!game) return null

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, overflowY: 'auto',
      }}
    >
      <div style={{
        background: '#0c1422',
        border: '1px solid rgba(14,165,233,0.15)',
        borderRadius: 18, width: '100%', maxWidth: 480,
        boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(14,165,233,0.05)',
        overflow: 'hidden', margin: 'auto',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(14,165,233,0.08)',
        }}>
          <img
            src={game.cover || PLACEHOLDER}
            alt={game.title}
            onError={e => e.target.src = PLACEHOLDER}
            style={{
              width: 44, height: 58, objectFit: 'cover',
              borderRadius: 8, flexShrink: 0,
              border: '1px solid rgba(14,165,233,0.12)',
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
              fontWeight: 900, fontSize: '1rem', color: TEAL,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{game.title}</div>
            {game.year && (
              <div style={{
                fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                fontSize: '0.65rem', color: 'rgba(14,165,233,0.35)', marginTop: 2,
              }}>{game.year}</div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(14,165,233,0.06)',
              border: '1px solid rgba(14,165,233,0.12)',
              borderRadius: 8, width: 30, height: 30, cursor: 'pointer',
              color: 'rgba(14,165,233,0.5)', fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >×</button>
        </div>

        {/* Form */}
        <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Rating — most important, show first */}
          <Field label="★ Your Rating">
            <StarInput value={rating} onChange={setRating} />
          </Field>

          {/* Platform + Status row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label=" Platform">
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', colorScheme: 'dark' }}
                onFocus={e => e.target.style.borderColor='rgba(14,165,233,0.4)'}
                onBlur={e  => e.target.style.borderColor='rgba(14,165,233,0.15)'}
              >
                {/* Show game's own platforms first */}
                {game.platforms?.map(p =>
                  <option key={p} value={p}>{p}</option>
                )}
                {/* Then remaining presets not already shown */}
                {PLATFORMS.filter(p => !game.platforms?.includes(p)).map(p =>
                  <option key={p} value={p}>{p}</option>
                )}
              </select>
            </Field>

            <Field label=" Status">
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', colorScheme: 'dark' }}
                onFocus={e => e.target.style.borderColor='rgba(14,165,233,0.4)'}
                onBlur={e  => e.target.style.borderColor='rgba(14,165,233,0.15)'}
              >
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          {/* Date */}
          <Field label=" Date Played">
            <input
              type="date"
              value={datePlayed}
              onChange={e => setDatePlayed(e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark', cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor='rgba(14,165,233,0.4)'}
              onBlur={e  => e.target.style.borderColor='rgba(14,165,233,0.15)'}
            />
          </Field>

          {/* Review */}
          <Field label=" Review (optional)">
            <textarea
              value={review}
              onChange={e => setReview(e.target.value)}
              placeholder="Write your thoughts on this game…"
              rows={3}
              style={{
                ...inputStyle, resize: 'vertical', minHeight: 80,
              }}
              onFocus={e => e.target.style.borderColor='rgba(14,165,233,0.4)'}
              onBlur={e  => e.target.style.borderColor='rgba(14,165,233,0.15)'}
            />
          </Field>

          {/* Tags */}
          <Field label=" Tags (optional)">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
              {PRESET_TAGS.map(t => (
                <button
                  key={t} type="button" onClick={() => toggleTag(t)}
                  style={{
                    padding: '4px 11px', borderRadius: 20,
                    fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                    fontSize: '0.7rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.12s',
                    background: tags.has(t) ? 'rgba(14,165,233,0.15)' : 'transparent',
                    border: `1px solid ${tags.has(t) ? 'rgba(14,165,233,0.45)' : 'rgba(14,165,233,0.15)'}`,
                    color: tags.has(t) ? TEAL : 'rgba(14,165,233,0.4)',
                  }}
                >{t}</button>
              ))}
            </div>
            <input
              value={customTag}
              onChange={e => setCustomTag(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && customTag.trim()) {
                  toggleTag(customTag.trim()); setCustomTag('')
                }
              }}
              placeholder="Custom tag… (press Enter)"
              style={{ ...inputStyle, fontSize: '0.78rem' }}
              onFocus={e => e.target.style.borderColor='rgba(14,165,233,0.4)'}
              onBlur={e  => e.target.style.borderColor='rgba(14,165,233,0.15)'}
            />
          </Field>

          {/* Replay toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div
              onClick={() => setReplayed(r => !r)}
              style={{
                width: 38, height: 22, borderRadius: 11, position: 'relative',
                background: replayed ? 'rgba(14,165,233,0.25)' : 'rgba(14,165,233,0.08)',
                border: `1px solid ${replayed ? 'rgba(14,165,233,0.5)' : 'rgba(14,165,233,0.15)'}`,
                transition: 'all 0.2s', flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: 2,
                left: replayed ? 'calc(100% - 18px)' : 2,
                width: 16, height: 16, borderRadius: '50%',
                background: replayed ? TEAL : 'rgba(14,165,233,0.3)',
                transition: 'left 0.2s, background 0.2s',
              }}/>
            </div>
            <span style={{
              fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
              fontSize: '0.8rem', color: 'rgba(14,165,233,0.6)',
            }}>↺ This is a replay</span>
          </label>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '12px',
              background: rating > 0 ? TEAL : 'rgba(14,165,233,0.2)',
              color: '#070b12', border: 'none', borderRadius: 10,
              fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
              fontWeight: 900, fontSize: '0.88rem', letterSpacing: '0.04em',
              cursor: rating > 0 ? 'pointer' : 'not-allowed',
              transition: 'opacity 0.15s, transform 0.15s',
              opacity: saving ? 0.7 : 1,
              transform: saving ? 'none' : undefined,
            }}
            onMouseEnter={e => { if (rating > 0 && !saving) e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => e.currentTarget.style.opacity = saving ? '0.7' : '1'}
          >
            {saving ? 'Saving…' : 'Save to Playquiem '}
          </button>

          {!rating && (
            <p style={{
              fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
              fontSize: '0.65rem', color: 'rgba(14,165,233,0.3)',
              textAlign: 'center', marginTop: -8,
            }}>
              Give a star rating to save
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
