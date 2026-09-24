import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getDiaryEntries, deleteLog, updateLog } from '../lib/db'
import { Spinner } from '../components/ui'
import toast from 'react-hot-toast'

const PLACEHOLDER = 'https://placehold.co/264x352/0f1c2e/0ea5e9?text='
const TEAL = 'var(--accent)'

const PRESET_TAGS = [
  'Platinum Trophy', 'Completed', '100%', 'DLC', 'Replay',
  'Speedrun', 'Coop', 'Multiplayer', 'Abandoned', 'Masterpiece',
]

// ── Star rating input ─────────────────────────────────────────
function StarInput({ value, onChange, size = 'lg' }) {
  const [hover, setHover] = useState(0)
  const sz = size === 'lg' ? 'text-2xl' : 'text-lg'
  return (
    <div className={`flex gap-0.5 ${sz}`}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n} type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110 cursor-pointer bg-transparent border-none outline-none"
          style={{ color: n <= (hover || value) ? '#f5c518' : 'var(--border-solid)' }}
        >★</button>
      ))}
    </div>
  )
}

// ── Tag pill ──────────────────────────────────────────────────
function TagPill({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="px-2.5 py-1 rounded-full text-[0.68rem] font-medium
                 border transition-all cursor-pointer"
      style={{
        background:   active ? 'rgba(102,192,244,0.15)' : 'transparent',
        borderColor:  active ? 'rgba(102,192,244,0.5)'  : 'rgba(38,38,58,1)',
        color:        active ? TEAL : 'var(--text3)',
      }}>
      {label}
    </button>
  )
}

// ── Log entry row (single diary line) ────────────────────────
function DiaryRow({ entry, onDelete, onEdit }) {
  const nav = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const date = entry.date_played ? new Date(entry.date_played + 'T12:00:00') : null
  const day   = date ? date.getDate().toString().padStart(2, '0') : '—'
  const month = date ? date.toLocaleString('en', { month: 'short' }).toUpperCase() : ''

  const tags = (entry.tags || '').split(',').map(t => t.trim()).filter(Boolean)

  return (
    <div className="group border-b last:border-b-0 border-white/5">
      <div className="flex items-center gap-3 py-3 px-2 hover:bg-white/[0.02]
                      transition-colors rounded-lg">

        {/* Date block */}
        <div className="flex-shrink-0 w-12 text-center">
          <div className="font-display text-xl leading-none" style={{ color: TEAL }}>
            {day}
          </div>
          <div className="text-[0.6rem] font-bold tracking-widest"
               style={{ color: 'rgba(102,192,244,0.45)' }}>
            {month}
          </div>
        </div>

        {/* Cover thumbnail */}
        <img
          src={entry.cover_url || PLACEHOLDER}
          alt={entry.title}
          onError={e => e.target.src = PLACEHOLDER}
          onClick={() => entry.igdb_id && nav(`/game/${entry.igdb_id}`)}
          className="w-8 h-10 object-cover rounded flex-shrink-0
                     cursor-pointer hover:opacity-80 transition-opacity"
        />

        {/* Title + meta + hover actions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              onClick={() => entry.igdb_id && nav(`/game/${entry.igdb_id}`)}
              className="font-semibold text-sm text-white hover:text-teal
                         transition-colors cursor-pointer truncate max-w-[140px] sm:max-w-[200px]"
              title={entry.title}>
              {entry.title}
            </span>
            {entry.replayed && (
              <span className="text-[0.58rem] px-1.5 py-0.5 rounded border
                               text-purple border-purple/30 bg-purple/10">
                ↺ Replay
              </span>
            )}
            {entry.status && entry.status !== 'Played' && (
              <span className="text-[0.58rem] px-1.5 py-0.5 rounded border
                               text-muted border-border">
                {entry.status}
              </span>
            )}
            {/* Edit + Delete — title'ın yanında, hover'da görünür */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
              <button
                onClick={() => onEdit(entry)}
                className="w-6 h-6 rounded flex items-center justify-center text-xs
                           text-muted hover:text-white hover:bg-white/10 transition-colors">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                onClick={() => onDelete(entry.id)}
                className="w-6 h-6 rounded flex items-center justify-center text-xs
                           text-muted hover:text-red hover:bg-red/10 transition-colors">
                ×
              </button>
            </div>
          </div>
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-0.5">
              {tags.map(t => (
                <span key={t} className="text-[0.6rem] px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(102,192,244,0.08)', color: TEAL }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Yıldızlar — sabit genişlik, hiç kaymaz */}
        <div className="flex-shrink-0 flex gap-px text-sm hidden sm:flex" style={{ width: '5.5rem', justifyContent: 'flex-end' }}>
          {[1,2,3,4,5].map(n => (
            <span key={n} style={{ color: n <= entry.rating ? '#f5c518' : 'var(--border-solid)' }}>★</span>
          ))}
        </div>
        {/* Mobilde sadece dolu yıldızlar */}
        <div className="flex-shrink-0 flex gap-px text-sm sm:hidden">
          {[1,2,3,4,5].map(n => (
            <span key={n} style={{ color: n <= entry.rating ? '#f5c518' : 'transparent', fontSize:'0.7rem' }}>★</span>
          ))}
        </div>

        {/* Review butonu — her zaman yer tutar */}
        <div className="flex-shrink-0" style={{ width: '2.25rem', paddingRight: '0.5rem' }}>
          {entry.review && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-6 h-6 rounded flex items-center justify-center text-[0.7rem] transition-colors cursor-pointer"
              style={{
                background: expanded ? 'rgba(102,192,244,0.15)' : 'rgba(255,255,255,0.05)',
                color: expanded ? TEAL : 'var(--text3)',
              }}
              title="Read review">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Review expansion */}
      {expanded && entry.review && (
        <div className="px-16 pb-3">
          <p className="text-[0.8rem] text-white/65 leading-relaxed
                        border-l-2 pl-3 italic"
             style={{ borderColor: 'rgba(102,192,244,0.3)' }}>
            "{entry.review}"
          </p>
        </div>
      )}
    </div>
  )
}

// ── Edit modal ────────────────────────────────────────────────
function EditModal({ entry, onSave, onClose }) {
  const [rating,     setRating]     = useState(entry.rating || 0)
  const [review,     setReview]     = useState(entry.review || '')
  const [datePlayed, setDatePlayed] = useState(entry.date_played || '')
  const [status,     setStatus]     = useState(entry.status || 'Played')
  const [replayed,   setReplayed]   = useState(entry.replayed || false)
  const [activeTags, setActiveTags] = useState(
    new Set((entry.tags || '').split(',').map(t => t.trim()).filter(Boolean))
  )
  const [customTag, setCustomTag] = useState('')

  const toggleTag = t => {
    setActiveTags(prev => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })
  }

  const handleSave = async () => {
    await onSave(entry.id, {
      rating, review: review || null,
      date_played: datePlayed,
      status, replayed,
      tags: Array.from(activeTags).join(', '),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center
                    justify-center p-4 overflow-y-auto">
      <div className="bg-surf2 border border-border rounded-2xl p-6
                      w-full max-w-md my-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <img src={entry.cover_url || PLACEHOLDER} alt={entry.title}
               className="w-10 h-13 object-cover rounded-lg"
               onError={e => e.target.src = PLACEHOLDER} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{entry.title}</h3>
            <p className="text-muted text-xs">Edit diary entry</p>
          </div>
          <button onClick={onClose}
            className="text-muted hover:text-white w-7 h-7 flex items-center
                       justify-center rounded-lg hover:bg-white/10 transition-colors">
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-[0.65rem] font-bold tracking-[1.2px]
                               uppercase mb-1.5" style={{ color: TEAL }}>
               Date Played
            </label>
            <input type="date" value={datePlayed}
              onChange={e => setDatePlayed(e.target.value)}
              className="w-full bg-surf border border-border rounded-xl px-4 py-2.5
                         text-sm outline-none focus:border-teal/50 transition-colors"
              style={{ colorScheme: 'dark', color: TEAL }} />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-[0.65rem] font-bold tracking-[1.2px]
                               uppercase mb-2" style={{ color: TEAL }}>
              ★ Rating
            </label>
            <StarInput value={rating} onChange={setRating} />
          </div>

          {/* Status */}
          <div>
            <label className="block text-[0.65rem] font-bold tracking-[1.2px]
                               uppercase mb-1.5" style={{ color: TEAL }}>
               Status
            </label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full bg-surf border border-border rounded-xl px-4 py-2.5
                         text-sm outline-none"
              style={{ colorScheme: 'dark', color: TEAL }}>
              {['Played', 'Playing', 'Wishlist', 'Dropped'].map(s =>
                <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Replayed toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => setReplayed(r => !r)}
              className="w-9 h-5 rounded-full transition-colors relative flex-shrink-0"
              style={{ background: replayed ? 'rgba(102,192,244,0.3)' : 'var(--border-solid)' }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full transition-transform bg-white"
                   style={{ left: replayed ? 'calc(100% - 18px)' : '2px' }} />
            </div>
            <span className="text-sm text-white/70">↺ This is a replay</span>
          </label>

          {/* Tags */}
          <div>
            <label className="block text-[0.65rem] font-bold tracking-[1.2px]
                               uppercase mb-2" style={{ color: TEAL }}>
               Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_TAGS.map(t => (
                <TagPill key={t} label={t}
                  active={activeTags.has(t)}
                  onClick={() => toggleTag(t)} />
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={customTag}
                onChange={e => setCustomTag(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && customTag.trim()) {
                    toggleTag(customTag.trim())
                    setCustomTag('')
                  }
                }}
                placeholder="Custom tag… (press Enter)"
                className="flex-1 bg-surf border border-border rounded-xl px-3 py-1.5
                           text-xs outline-none focus:border-teal/40 transition-colors"
                style={{ color: TEAL }}
              />
            </div>
          </div>

          {/* Review */}
          <div>
            <label className="block text-[0.65rem] font-bold tracking-[1.2px]
                               uppercase mb-1.5" style={{ color: TEAL }}>
               Review <span className="text-muted normal-case font-normal">(optional)</span>
            </label>
            <textarea value={review} onChange={e => setReview(e.target.value)}
              placeholder="Write your thoughts…"
              rows={4}
              className="w-full bg-surf border border-border rounded-xl px-4 py-2.5
                         text-sm placeholder-muted outline-none resize-none
                         focus:border-teal/50 transition-colors"
              style={{ color: 'rgba(232,232,245,0.9)' }} />
          </div>

          <button onClick={handleSave}
            className="w-full font-bold py-3 rounded-xl text-sm
                       transition-opacity hover:opacity-90"
            style={{ background: TEAL, color: 'var(--bg)' }}>
            Save Entry ✓
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Diary page ───────────────────────────────────────────
export default function Diary() {
  const { user } = useAuthStore()
  const nav = useNavigate()
  const [entries,   setEntries]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [editEntry, setEditEntry] = useState(null)
  const [filterYear, setFilterYear] = useState('')

  const loadEntries = useCallback(() => {
    if (!user) { nav('/auth'); return }
    getDiaryEntries().then(data => {
      setEntries(data)
      setLoading(false)
    })
  }, [user])

  useEffect(() => { loadEntries() }, [loadEntries])

  // Sayfaya geri dönünce yenile
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadEntries() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadEntries])

  const handleDelete = async id => {
    if (!confirm('Remove this diary entry?')) return
    await deleteLog(id)
    setEntries(e => e.filter(x => x.id !== id))
    toast.success('Entry removed')
  }

  const handleSave = async (id, updates) => {
    await updateLog(id, updates)
    setEntries(e => e.map(x => x.id === id ? { ...x, ...updates } : x))
    setEditEntry(null)
    toast.success('Entry updated!')
  }

  // Group by month/year
  const grouped = entries
    .filter(e => !filterYear || (e.date_played || '').startsWith(filterYear))
    .reduce((acc, entry) => {
      const d   = entry.date_played ? new Date(entry.date_played + 'T12:00:00') : new Date(entry.created_at)
      const key = d.toLocaleString('en', { month: 'long' }).toUpperCase() + ' ' + d.getFullYear()
      if (!acc[key]) acc[key] = []
      acc[key].push(entry)
      return acc
    }, {})

  // Year filter options
  const years = [...new Set(entries.map(e => (e.date_played || e.created_at || '').slice(0, 4)))]
    .filter(Boolean).sort().reverse()

  const totalEntries = entries.length
  const avgRating = entries.length
    ? (entries.reduce((s, e) => s + (e.rating || 0), 0) / entries.length).toFixed(1)
    : '—'

  return (
    <div className="max-w-screen-lg mx-auto px-6 pt-20 pb-16">

      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl tracking-[4px]"
              style={{ color: TEAL }}>
             Game Diary
          </h1>
          <p className="text-muted text-sm mt-1">
            Your complete gaming history, chronologically
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex gap-5">
          {[
            [totalEntries, 'Entries'],
            [avgRating,    'Avg Rating'],
            [years.length, 'Years'],
          ].map(([v, l]) => (
            <div key={l} className="text-center">
              <div className="font-display text-2xl" style={{ color: TEAL }}>{v}</div>
              <div className="text-muted text-[0.62rem] uppercase tracking-wide">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Year filter */}
      {years.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setFilterYear('')}
            className="px-4 py-1.5 rounded-full text-sm border transition-colors cursor-pointer"
            style={{
              background:   !filterYear ? 'rgba(102,192,244,0.15)' : 'transparent',
              borderColor:  !filterYear ? 'rgba(102,192,244,0.5)'  : 'var(--border-solid)',
              color:        !filterYear ? TEAL : 'var(--text3)',
            }}>
            All Time
          </button>
          {years.map(y => (
            <button key={y} onClick={() => setFilterYear(y)}
              className="px-4 py-1.5 rounded-full text-sm border transition-colors cursor-pointer"
              style={{
                background:   filterYear === y ? 'rgba(102,192,244,0.15)' : 'transparent',
                borderColor:  filterYear === y ? 'rgba(102,192,244,0.5)'  : 'var(--border-solid)',
                color:        filterYear === y ? TEAL : 'var(--text3)',
              }}>
              {y}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20"><Spinner /></div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4"></div>
          <p className="font-semibold text-lg text-white/80">Your diary is empty</p>
          <p className="text-muted text-sm mt-2">Log games to build your diary</p>
          <button onClick={() => nav('/games')}
            className="mt-5 px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: TEAL, color: 'var(--bg)' }}>
            Browse Games
          </button>
        </div>
      )}

      {/* Diary — grouped by month */}
      {!loading && Object.entries(grouped).map(([monthLabel, monthEntries]) => (
        <div key={monthLabel} className="mb-6">
          {/* Month header */}
          <div className="flex items-center gap-3 mb-2">
            <span className="font-display text-sm tracking-[3px]"
                  style={{ color: TEAL }}>
              {monthLabel}
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(102,192,244,0.15)' }} />
            <span className="text-muted text-[0.68rem]">{monthEntries.length} entries</span>
          </div>

          {/* Entries */}
          <div className="bg-surf border border-border rounded-2xl overflow-hidden">
            {/* Column headers */}
            <div className="flex items-center gap-3 px-2 py-2 border-b border-white/5">
              <div className="w-12 text-[0.6rem] font-bold tracking-widest text-muted text-center">DATE</div>
              <div className="w-8" />
              <div className="flex-1 text-[0.6rem] font-bold tracking-widest text-muted">GAME</div>
              <div className="text-[0.6rem] font-bold tracking-widest text-muted text-right flex-shrink-0 hidden sm:block" style={{ width: '5.5rem' }}>RATING</div>
              <div className="text-[0.6rem] font-bold tracking-widest text-muted text-right flex-shrink-0 sm:hidden">★</div>
              <div style={{ width: '2.25rem', flexShrink: 0 }} />
            </div>

            {monthEntries.map(entry => (
              <DiaryRow
                key={entry.id}
                entry={entry}
                onDelete={handleDelete}
                onEdit={setEditEntry}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Edit modal */}
      {editEntry && (
        <EditModal
          entry={editEntry}
          onSave={handleSave}
          onClose={() => setEditEntry(null)}
        />
      )}
    </div>
  )
}
