import { useState, useEffect, useRef } from 'react'
import { Bell, Trophy, Calendar, List, Sword, Globe, Star, GameController, Newspaper, Ranking } from '@phosphor-icons/react'
import { PendingRequests, FriendButton } from '../components/Social'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase, API } from '../lib/supabase'
import { getDiaryEntries, getMyLogs, followUser, unfollowUser,
         isFollowing, getFollowerCount, getFollowingCount, getUserLogs } from '../lib/db'
import { Avatar, Stars, Spinner, EmptyState, GameCard } from '../components/ui'
import toast from 'react-hot-toast'

const TEAL = 'var(--accent)'

// ── helpers ───────────────────────────────────────────────────
const teal  = s => <span style={{color: TEAL}}>{s}</span>
const useSB = () => supabase
function Section({ title, children, action }) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl tracking-[3px] text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

// ════════════════════════════════════════════════════════════
//   ACTIVITY FEED
// ════════════════════════════════════════════════════════════
export function ActivityFeed() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    supabase.from('activity_feed').select('*').limit(50)
      .then(({ data }) => { setItems(data || []); setLoading(false) })
  }, [])

  const PHOLDER = 'https://placehold.co/264x352/111118/26263a?text='
  return (
    <div className="max-w-screen-lg mx-auto px-6 pt-20 pb-16">
      <h1 className="font-display text-4xl tracking-[4px] mb-2" style={{color:TEAL}}>
         Activity Feed
      </h1>
      <p className="text-muted text-sm mb-8">What the QuestLog community is playing right now</p>

      {loading ? <div className="flex justify-center py-12"><Spinner/></div>
      : items.length === 0 ? <EmptyState icon="" title="No activity yet" subtitle="Be the first to log a game!"/>
      : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-4 bg-surf border border-border
                                     rounded-xl p-3 hover:border-teal/20 transition-colors">
              <img src={item.cover_url || PHOLDER} alt={item.game_title}
                   onError={e => e.target.src = PHOLDER}
                   onClick={() => item.igdb_id && nav(`/game/${item.igdb_id}`)}
                   className="w-10 h-13 object-cover rounded-lg cursor-pointer
                              hover:opacity-80 transition-opacity flex-shrink-0"/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm cursor-pointer hover:text-teal transition-colors"
                        style={{color:TEAL}} onClick={() => nav(`/profile/${item.user_id}`)}>
                    @{item.username}
                  </span>
                  <span className="text-white/60 text-sm">logged</span>
                  <span className="font-semibold text-sm text-white truncate max-w-[160px]"
                        onClick={() => item.igdb_id && nav(`/game/${item.igdb_id}`)}
                        style={{cursor:'pointer'}}>
                    {item.game_title}
                  </span>
                </div>
                {item.rating > 0 && (
                  <div className="flex gap-px text-xs mt-0.5">
                    {[1,2,3,4,5].map(n =>
                      <span key={n} style={{color: n<=item.rating ? '#f5c518':'var(--border-solid)'}}>★</span>)}
                  </div>
                )}
                {item.review && (
                  <p className="text-white/50 text-xs mt-1 truncate italic">"{item.review}"</p>
                )}
              </div>
              <div className="text-muted text-xs flex-shrink-0 text-right">
                {new Date(item.created_at).toLocaleDateString('en',{month:'short',day:'numeric'})}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//   NOTIFICATIONS
// ════════════════════════════════════════════════════════════
export function Notifications() {
  const { user } = useAuthStore()
  const [notifs,  setNotifs]  = useState([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    if (!user) { nav('/auth'); return }

    // İlk yükleme
    supabase.from('notifications').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { setNotifs(data || []); setLoading(false) })

    // Sayfayı açınca tümünü okundu işaretle
    supabase.from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .then(() => {})

    // Realtime — yeni bildirim gelince listeye ekle
    const channel = supabase
      .channel('notifs-page')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifs(prev => [{ ...payload.new, read: true }, ...prev])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  const markRead = async () => {
    await supabase.from('notifications').update({read:true}).eq('user_id', user.id)
    setNotifs(n => n.map(x => ({...x, read:true})))
  }

  const ICONS = { follow:'👤', log:'🎮', review:'⭐', achievement:'🏆', challenge:'🎯', friend_request:'🤝' }

  return (
    <div className="max-w-screen-md mx-auto px-6 pt-20 pb-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl tracking-[4px]" style={{color:TEAL}}>
           Notifications
        </h1>
        {notifs.some(n => !n.read) && (
          <button onClick={markRead}
            className="text-sm border border-teal/30 text-teal px-4 py-1.5
                       rounded-xl hover:bg-teal/10 transition-colors">
            Mark all read
          </button>
        )}
      </div>

      <PendingRequests />
      {loading ? <div className="flex justify-center py-12"><Spinner/></div>
      : notifs.length === 0 ? <EmptyState icon="" title="No notifications yet" subtitle="Follow people to see their activity here"/>
      : (
        <div className="space-y-2">
          {notifs.map(n => (
            <div key={n.id}
              className="flex items-center gap-3 p-4 rounded-xl border transition-colors"
              style={{
                background: n.read ? 'transparent' : 'rgba(102,192,244,0.05)',
                borderColor: n.read ? 'var(--border-solid)' : 'rgba(102,192,244,0.2)',
              }}>
              <span className="text-xl flex-shrink-0">{ICONS[n.type] || ''}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/85">{n.message}</p>
                <p className="text-xs text-muted mt-0.5">
                  {new Date(n.created_at).toLocaleDateString('en',
                    {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                </p>
              </div>
              {!n.read && (
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:TEAL}}/>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//   ACHIEVEMENTS
// ════════════════════════════════════════════════════════════
const ALL_ACHIEVEMENTS = [
  { slug:'first_log',     icon:'', name:'First Quest',       desc:'Log your first game',                 req: l => l.length >= 1  },
  { slug:'logged_10',     icon:'', name:'Getting Started',   desc:'Log 10 games',                        req: l => l.length >= 10 },
  { slug:'logged_50',     icon:'', name:'Dedicated',         desc:'Log 50 games',                        req: l => l.length >= 50 },
  { slug:'logged_100',    icon:'', name:'Century',           desc:'Log 100 games',                       req: l => l.length >= 100 },
  { slug:'perfect_5',     icon:'★', name:'Perfectionist',     desc:'Give a 5-star rating',                req: l => l.some(x => x.rating===5) },
  { slug:'reviewer',      icon:'', name:'Critic',            desc:'Write 10 reviews',                    req: l => l.filter(x => x.review).length >= 10 },
  { slug:'multi_plat',    icon:'️',  name:'Multi-Platform',    desc:'Log games on 3+ platforms',           req: l => new Set(l.map(x=>x.platform)).size >= 3 },
  { slug:'genre_master',  icon:'', name:'Genre Master',      desc:'Log games in 5+ genres',              req: l => new Set(l.flatMap(x=>(x.genres||'').split(',').map(g=>g.trim()).filter(Boolean))).size >= 5 },
  { slug:'year_streak',   icon:'', name:'Year Logger',       desc:'Log games in 12 different months',    req: l => new Set(l.map(x=>(x.date_played||'').slice(0,7))).size >= 12 },
  { slug:'platinum',      icon:'', name:'Platinum Hunter',   desc:'Log a game with Platinum Trophy tag',  req: l => l.some(x=>(x.tags||'').includes('Platinum')) },
  { slug:'social',        icon:'', name:'Social Gamer',      desc:'Follow 5 people',                     req: () => false }, // checked separately
  { slug:'replayer',      icon:'↺',  name:'Nostalgic',         desc:'Log a game as a replay',               req: l => l.some(x => x.replayed) },
]

export function Achievements() {
  const { user } = useAuthStore()
  const [logs,   setLogs]   = useState([])
  const [earned, setEarned] = useState(new Set())
  const [loading,setLoading]= useState(true)
  const nav = useNavigate()

  useEffect(() => {
    if (!user) { nav('/auth'); return }
    Promise.all([
      getMyLogs(),
      supabase.from('user_achievements').select('achievement').eq('user_id', user.id)
    ]).then(([logs, { data: ach }]) => {
      setLogs(logs)
      const earnedSet = new Set((ach||[]).map(a => a.achievement))

      // Check & award new achievements
      ALL_ACHIEVEMENTS.forEach(async a => {
        if (!earnedSet.has(a.slug) && a.req(logs)) {
          await supabase.from('user_achievements').insert({
            user_id: user.id, achievement: a.slug
          }).then(({ error }) => {
            if (!error) {
              earnedSet.add(a.slug)
              toast.success(` Achievement unlocked: ${a.name}!`)
            }
          })
        }
      })
      setEarned(earnedSet)
      setLoading(false)
    })
  }, [user])

  const earnedCount = ALL_ACHIEVEMENTS.filter(a => earned.has(a.slug)).length

  return (
    <div className="max-w-screen-lg mx-auto px-6 pt-20 pb-16">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl tracking-[4px]" style={{color:TEAL}}>
             Achievements
          </h1>
          <p className="text-muted text-sm mt-1">
            {earnedCount} / {ALL_ACHIEVEMENTS.length} unlocked
          </p>
        </div>
        {/* Progress bar */}
        <div className="w-64">
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
                 style={{width:`${(earnedCount/ALL_ACHIEVEMENTS.length)*100}%`, background:TEAL}}/>
          </div>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner/></div> : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {ALL_ACHIEVEMENTS.map(a => {
            const got = earned.has(a.slug)
            return (
              <div key={a.slug}
                className="border rounded-2xl p-4 text-center transition-all"
                style={{
                  background: got ? 'rgba(102,192,244,0.07)' : 'var(--surface)',
                  borderColor: got ? 'rgba(102,192,244,0.3)' : 'var(--border-solid)',
                  opacity: got ? 1 : 0.45,
                }}>
                <div className="text-4xl mb-2">{a.icon}</div>
                <div className="font-semibold text-sm mb-1"
                     style={{color: got ? TEAL : 'var(--text)'}}>{a.name}</div>
                <div className="text-muted text-xs">{a.desc}</div>
                {got && (
                  <div className="text-[0.6rem] mt-2 font-bold tracking-wider"
                       style={{color:TEAL}}>UNLOCKED ✓</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//   YEAR IN REVIEW
// ════════════════════════════════════════════════════════════
export function YearInReview() {
  const { user } = useAuthStore()
  const [logs,    setLogs]    = useState([])
  const [year,    setYear]    = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    if (!user) { nav('/auth'); return }
    getMyLogs().then(all => {
      setLogs(all.filter(l => (l.date_played||l.created_at||'').startsWith(String(year))))
      setLoading(false)
    })
  }, [user, year])

  if (loading) return <div className="flex justify-center pt-32"><Spinner/></div>

  const total    = logs.length
  const avg      = total ? (logs.reduce((s,l)=>s+(l.rating||0),0)/total).toFixed(1) : 0
  const topGame  = [...logs].sort((a,b)=>(b.rating||0)-(a.rating||0))[0]
  const genres   = logs.flatMap(l=>(l.genres||'').split(',').map(g=>g.trim()).filter(Boolean))
  const topGenre = genres.length ? Object.entries(
    genres.reduce((a,g)=>{a[g]=(a[g]||0)+1;return a},{}))
    .sort((a,b)=>b[1]-a[1])[0]?.[0] : '—'
  const platforms = logs.reduce((a,l)=>{a[l.platform]=(a[l.platform]||0)+1;return a},{})
  const topPlat  = Object.entries(platforms).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—'
  const months   = logs.reduce((a,l)=>{
    const m=(l.date_played||l.created_at||'').slice(5,7); a[m]=(a[m]||0)+1; return a
  },{})
  const busyMonth = Object.entries(months).sort((a,b)=>b[1]-a[1])[0]
  const MONTH_NAMES=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const reviews  = logs.filter(l=>l.review).length

  const STAT = ({icon, value, label, sub}) => (
    <div className="bg-surf border border-border rounded-2xl p-6 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-display text-4xl leading-none mb-1" style={{color:TEAL}}>{value}</div>
      <div className="font-semibold text-sm text-white/80">{label}</div>
      {sub && <div className="text-muted text-xs mt-1">{sub}</div>}
    </div>
  )

  return (
    <div className="max-w-screen-lg mx-auto px-6 pt-20 pb-16">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex justify-center gap-2 mb-4">
          {[new Date().getFullYear(), new Date().getFullYear()-1, new Date().getFullYear()-2]
            .map(y => (
              <button key={y} onClick={() => setYear(y)}
                className="px-4 py-1.5 rounded-full text-sm border transition-colors cursor-pointer"
                style={{
                  background: year===y ? 'rgba(102,192,244,0.15)' : 'transparent',
                  borderColor: year===y ? 'rgba(102,192,244,0.5)' : 'var(--border-solid)',
                  color: year===y ? TEAL : 'var(--text3)',
                }}>{y}</button>
            ))}
        </div>
        <h1 className="font-display text-5xl tracking-[5px]" style={{color:TEAL}}>
          {year} IN REVIEW
        </h1>
        <p className="text-muted mt-2">Your gaming year, unwrapped</p>
      </div>

      {total === 0 ? (
        <EmptyState icon="" title={`No games logged in ${year}`}
                    subtitle="Start logging to see your year in review!"/>
      ) : (
        <>
          {/* Big stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <STAT icon="" value={total} label="Games Logged" sub={`${(total/12).toFixed(1)} per month`}/>
            <STAT icon="★" value={avg} label="Avg Rating" sub="out of 5 stars"/>
            <STAT icon="" value={reviews} label="Reviews Written" sub={`${Math.round(reviews/total*100)}% of logs`}/>
            <STAT icon="" value={busyMonth ? MONTH_NAMES[parseInt(busyMonth[0])] : '—'}
                  label="Busiest Month" sub={busyMonth ? `${busyMonth[1]} games` : ''}/>
          </div>

          {/* Highlights */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {/* Top game */}
            {topGame && (
              <div className="bg-surf border border-border rounded-2xl p-5 flex gap-4">
                <img src={topGame.cover_url || 'https://placehold.co/264x352/111118/26263a?text='}
                     className="w-14 rounded-xl object-cover flex-shrink-0"
                     onError={e=>e.target.src='https://placehold.co/264x352/111118/26263a?text='}/>
                <div>
                  <div className="text-muted text-xs uppercase tracking-widest mb-1">
                    ★ Top Rated
                  </div>
                  <div className="font-semibold">{topGame.title}</div>
                  <div className="flex gap-px mt-1">
                    {[1,2,3,4,5].map(n=>
                      <span key={n} style={{color:n<=topGame.rating?'#f5c518':'var(--border-solid)',fontSize:12}}>★</span>)}
                  </div>
                </div>
              </div>
            )}
            {/* Top genre */}
            <div className="bg-surf border border-border rounded-2xl p-5 text-center
                            flex flex-col items-center justify-center">
              <div className="text-muted text-xs uppercase tracking-widest mb-2"> Fav Genre</div>
              <div className="font-display text-2xl tracking-wider" style={{color:TEAL}}>
                {topGenre}
              </div>
            </div>
            {/* Top platform */}
            <div className="bg-surf border border-border rounded-2xl p-5 text-center
                            flex flex-col items-center justify-center">
              <div className="text-muted text-xs uppercase tracking-widest mb-2">️ Top Platform</div>
              <div className="font-display text-2xl tracking-wider" style={{color:TEAL}}>
                {topPlat}
              </div>
            </div>
          </div>

          {/* Monthly chart */}
          <div className="bg-surf border border-border rounded-2xl p-5 mb-8">
            <h3 className="font-semibold mb-4">Monthly Activity</h3>
            <div className="flex items-end gap-2 h-24">
              {MONTH_NAMES.slice(1).map((m, i) => {
                const count = months[String(i+1).padStart(2,'0')] || 0
                const maxC  = Math.max(...Object.values(months), 1)
                const h     = Math.round((count/maxC)*100)
                return (
                  <div key={m} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-muted text-[0.6rem]">{count||''}</div>
                    <div className="w-full rounded-t-md transition-all"
                         style={{height:`${h}%`, minHeight: count>0?4:0,
                                 background: count>0 ? TEAL : 'var(--border-solid)', opacity:0.8}}/>
                    <div className="text-muted text-[0.62rem]">{m}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* All logged games mini grid */}
          <h3 className="font-semibold mb-3">All {total} Games</h3>
          <div className="flex flex-wrap gap-2">
            {logs.map(l => (
              <img key={l.id}
                   src={l.cover_url||'https://placehold.co/264x352/111118/26263a?text='}
                   title={l.title} alt={l.title}
                   className="w-10 h-14 rounded-lg object-cover opacity-80 hover:opacity-100
                              hover:scale-110 transition-all cursor-pointer"
                   onClick={() => l.igdb_id && nav(`/game/${l.igdb_id}`)}
                   onError={e=>e.target.src='https://placehold.co/264x352/111118/26263a?text='}/>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//   CUSTOM LISTS
// ════════════════════════════════════════════════════════════
export function Lists() {
  const { user } = useAuthStore()
  const [lists,    setLists]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [creating, setCreating] = useState(false)
  const [filter,   setFilter]   = useState('all') // 'all' | 'mine'
  const [form,     setForm]     = useState({ title:'', description:'', is_public:true })
  const nav = useNavigate()
  const F = '"Helvetica Neue",Helvetica,Arial,sans-serif'

  useEffect(() => {
    supabase.from('lists')
      .select('*, profiles(username), list_items(cover_url)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => { setLists(data || []); setLoading(false) })
  }, [])

  const createList = async () => {
    if (!user) { toast.error('Sign in to create lists'); return }
    if (!form.title.trim()) { toast.error('Add a title'); return }
    const { data, error } = await supabase.from('lists').insert({
      user_id: user.id, ...form
    }).select().single()
    if (error) { toast.error(error.message); return }
    setLists(l => [{ ...data, profiles: { username: '' }, list_items: [] }, ...l])
    setCreating(false)
    setForm({ title:'', description:'', is_public:true })
    toast.success('List created!')
    nav(`/list/${data.id}`)
  }

  const deleteList = async (e, listId) => {
    e.stopPropagation()
    if (!confirm('Delete this list?')) return
    await supabase.from('list_items').delete().eq('list_id', listId)
    await supabase.from('lists').delete().eq('id', listId)
    setLists(l => l.filter(x => x.id !== listId))
    toast.success('List deleted')
  }

  const filtered = filter === 'mine' ? lists.filter(l => l.user_id === user?.id) : lists

  return (
    <div className="max-w-screen-lg mx-auto px-4 sm:px-6 pt-20 pb-16">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-display text-4xl tracking-[4px]" style={{ color: TEAL }}>
             Lists
          </h1>
          <p className="text-muted text-sm mt-1">Curated game collections</p>
        </div>
        {user && (
          <button onClick={() => setCreating(true)}
            className="font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity"
            style={{ background: TEAL, color: 'var(--bg)', fontFamily: F }}>
            + New List
          </button>
        )}
      </div>

      {/* Filter tabs */}
      {user && (
        <div className="flex gap-2 mb-6">
          {[['all', 'All Lists'], ['mine', 'My Lists']].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              style={{
                padding: '6px 16px', borderRadius: 20, fontFamily: F,
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                background: filter === key ? 'rgba(102,192,244,0.15)' : 'transparent',
                border: `1px solid ${filter === key ? 'rgba(102,192,244,0.4)' : 'rgba(102,192,244,0.12)'}`,
                color: filter === key ? TEAL : 'rgba(102,192,244,0.4)',
                transition: 'all 0.15s',
              }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-surf2 border border-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-semibold text-lg">Create a List</h3>
              <button onClick={() => setCreating(false)} className="text-muted hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-4">
              <input value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="List title…"
                className="w-full bg-surf border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal/50 transition-colors"
                style={{ color: TEAL }}/>
              <textarea value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description (optional)…" rows={3}
                className="w-full bg-surf border border-border rounded-xl px-4 py-2.5 text-sm outline-none resize-none text-white/80 focus:border-teal/50 transition-colors"/>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.is_public}
                  onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
                  className="w-4 h-4 cursor-pointer"/>
                <span className="text-sm text-white/70">Public — visible to everyone</span>
              </label>
              <button onClick={createList}
                className="w-full font-bold py-3 rounded-xl text-sm hover:opacity-90"
                style={{ background: TEAL, color: 'var(--bg)', fontFamily: F }}>
                Create List
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="flex justify-center py-12"><Spinner/></div>
      : filtered.length === 0 ? (
        <EmptyState icon="📋" title={filter === 'mine' ? "You have no lists yet" : "No lists yet"}
          subtitle={filter === 'mine' ? "Create your first curated game list!" : "Be the first to create a list!"}/>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(list => {
            const count = list.list_items?.length || 0
            const cover = list.list_items?.find(i => i.cover_url)?.cover_url
            const isOwner = user?.id === list.user_id
            return (
              <div key={list.id}
                onClick={() => nav(`/list/${list.id}`)}
                className="group bg-surf border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-teal/30 transition-all"
                style={{ transition: 'all 0.18s ease' }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform='none'}>
                {/* Cover strip */}
                <div style={{
                  height: 80, background: cover
                    ? `linear-gradient(to right, rgba(9,9,15,0.8), rgba(9,9,15,0.3)), url(${cover}) center/cover`
                    : 'linear-gradient(135deg, #111120, #1a1a2e)',
                  position: 'relative',
                }}>
                  {!list.is_public && (
                    <span style={{
                      position: 'absolute', top: 10, right: 10,
                      background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.5)',
                      fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px',
                      borderRadius: 20, fontFamily: F,
                    }}>🔒 PRIVATE</span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold group-hover:text-teal transition-colors truncate">{list.title}</h3>
                    {isOwner && (
                      <button onClick={e => deleteList(e, list.id)}
                        className="text-muted hover:text-red text-lg flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete list">×</button>
                    )}
                  </div>
                  {list.description && (
                    <p className="text-muted text-xs mb-3 line-clamp-2">{list.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-muted text-xs" style={{ fontFamily: F }}>
                      <span style={{ color: 'rgba(102,192,244,0.5)' }}>{count} game{count !== 1 ? 's' : ''}</span>
                      {list.profiles?.username && <span> · @{list.profiles.username}</span>}
                    </div>
                    {isOwner && (
                      <button onClick={e => { e.stopPropagation(); nav(`/list/${list.id}`) }}
                        style={{
                          background: 'rgba(102,192,244,0.08)', border: '1px solid rgba(102,192,244,0.2)',
                          color: TEAL, borderRadius: 8, padding: '4px 10px',
                          fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', fontFamily: F,
                        }}>
                        + Add Games
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── List Detail ───────────────────────────────────────────────
export function ListDetail() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [list,      setList]      = useState(null)
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [adding,    setAdding]    = useState(false)
  const [searchQ,   setSearchQ]   = useState('')
  const [results,   setResults]   = useState([])
  const [searching, setSearching] = useState(false)
  const [note,      setNote]      = useState('')
  const [editTitle, setEditTitle] = useState(false)
  const [newTitle,  setNewTitle]  = useState('')
  const nav = useNavigate()
  const F = '"Helvetica Neue",Helvetica,Arial,sans-serif'
  const searchTimer = useRef(null)
  const PHOLDER = 'https://placehold.co/264x352/111118/26263a?text='

  useEffect(() => {
    Promise.all([
      supabase.from('lists').select('*, profiles(username)').eq('id', id).single(),
      supabase.from('list_items').select('*').eq('list_id', id).order('position'),
    ]).then(([{ data: l }, { data: it }]) => {
      setList(l); setItems(it || []); setLoading(false)
      setNewTitle(l?.title || '')
    })
  }, [id])

  // Debounced search
  const handleSearch = q => {
    setSearchQ(q)
    clearTimeout(searchTimer.current)
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(`${API}/api/games?q=${encodeURIComponent(q)}&limit=8`)
        setResults(await r.json())
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 350)
  }

  const addGame = async g => {
    // Duplicate kontrolü
    if (items.some(i => i.igdb_id === g.id)) {
      toast.error(`${g.title} is already in this list`); return
    }
    const { data, error } = await supabase.from('list_items').insert({
      list_id: parseInt(id), igdb_id: g.id, title: g.title,
      cover_url: g.cover || '', genres: (g.genres || []).join(', '),
      position: items.length, note: note || null,
    }).select().single()
    if (error) { toast.error(error.message); return }
    setItems(i => [...i, data])
    setNote('')
    toast.success(`Added ${g.title}!`)
  }

  const removeItem = async (e, itemId, title) => {
    e.stopPropagation()
    if (!confirm(`Remove "${title}" from list?`)) return
    await supabase.from('list_items').delete().eq('id', itemId)
    setItems(i => i.filter(x => x.id !== itemId))
    toast.success('Removed')
  }

  const saveTitle = async () => {
    if (!newTitle.trim()) return
    await supabase.from('lists').update({ title: newTitle }).eq('id', id)
    setList(l => ({ ...l, title: newTitle }))
    setEditTitle(false)
    toast.success('Title updated')
  }

  if (loading) return <div className="flex justify-center pt-32"><Spinner/></div>
  if (!list) return <div className="text-center pt-32 text-muted">List not found</div>

  const isOwner = user?.id === list.user_id

  return (
    <div className="max-w-screen-lg mx-auto px-4 sm:px-6 pt-20 pb-16">
      <button onClick={() => nav('/lists')}
        className="text-muted text-sm hover:text-teal transition-colors mb-6 block">
        ← Back to Lists
      </button>

      {/* List header */}
      <div className="mb-8">
        {editTitle ? (
          <div className="flex gap-2 items-center mb-2">
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
              className="bg-surf border border-teal/30 rounded-xl px-4 py-2 text-xl font-bold outline-none flex-1"
              style={{ color: TEAL, fontFamily: F }}/>
            <button onClick={saveTitle}
              className="px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90"
              style={{ background: TEAL, color: 'var(--bg)', fontFamily: F }}>Save</button>
            <button onClick={() => setEditTitle(false)}
              className="text-muted hover:text-white px-3">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-3xl sm:text-4xl text-white">{list.title}</h1>
            {isOwner && (
              <button onClick={() => setEditTitle(true)}
                className="text-muted hover:text-teal transition-colors text-sm opacity-60 hover:opacity-100">✎</button>
            )}
          </div>
        )}
        {list.description && <p className="text-muted mb-2">{list.description}</p>}
        <p className="text-muted text-sm">
          by <span style={{ color: TEAL }} className="cursor-pointer hover:underline"
                   onClick={() => nav(`/profile/${list.user_id}`)}>
            @{list.profiles?.username}
          </span>{' · '}{items.length} game{items.length !== 1 ? 's' : ''}
          {!list.is_public && <span className="ml-2 text-xs opacity-50">🔒 Private</span>}
        </p>
      </div>

      {/* Add games panel (owner only) */}
      {isOwner && (
        <div className="mb-6">
          <button onClick={() => setAdding(a => !a)}
            className="font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity"
            style={{ background: adding ? 'rgba(102,192,244,0.15)' : TEAL, color: adding ? TEAL : 'var(--bg)', fontFamily: F, border: adding ? '1px solid rgba(102,192,244,0.3)' : 'none' }}>
            {adding ? '✓ Done' : '+ Add Games'}
          </button>

          {adding && (
            <div className="mt-3 bg-surf2 border border-border rounded-2xl p-4">
              {/* Search */}
              <div className="relative mb-3">
                <input value={searchQ}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search any game to add…"
                  className="w-full bg-surf border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal/40 transition-colors"
                  style={{ color: TEAL, fontFamily: F }}/>
                {searching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs">...</span>
                )}
                {searchQ && (
                  <button onClick={() => { setSearchQ(''); setResults([]) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white text-lg">×</button>
                )}
              </div>

              {/* Optional note */}
              <input value={note} onChange={e => setNote(e.target.value)}
                placeholder="Add a note (optional)…"
                className="w-full bg-surf border border-border rounded-xl px-4 py-2 text-xs outline-none mb-3 text-white/60 focus:border-teal/30 transition-colors"/>

              {/* Results */}
              {results.length > 0 && (
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {results.map(g => {
                    const alreadyAdded = items.some(i => i.igdb_id === g.id)
                    return (
                      <div key={g.id}
                        className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-white/5 transition-colors">
                        <img src={g.cover || PHOLDER} className="w-8 h-11 rounded object-cover flex-shrink-0"
                             onError={e => e.target.src = PHOLDER}/>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{g.title}</div>
                          {g.year && <div className="text-xs text-muted">{g.year}</div>}
                        </div>
                        {alreadyAdded ? (
                          <span className="text-xs px-3 py-1 rounded-lg"
                            style={{ color: '#2dc653', background: 'rgba(45,198,83,0.1)', fontFamily: F }}>
                            ✓ Added
                          </span>
                        ) : (
                          <button onClick={() => addGame(g)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-teal/30 text-teal hover:bg-teal/10 transition-colors font-bold"
                            style={{ fontFamily: F }}>
                            + Add
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {searchQ && !searching && results.length === 0 && (
                <p className="text-muted text-sm text-center py-4">No games found for "{searchQ}"</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Game list */}
      {items.length === 0 ? (
        <EmptyState icon="🎮" title="This list is empty"
          subtitle={isOwner ? 'Click "+ Add Games" to start building your list!' : 'Nothing here yet'}/>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.id || i}
              className="flex items-center gap-4 bg-surf border border-border rounded-xl p-3 hover:border-teal/20 transition-colors group cursor-pointer"
              onClick={() => item.igdb_id && nav(`/game/${item.igdb_id}`)}>
              {/* Rank */}
              <span className="font-display text-lg w-7 text-center flex-shrink-0"
                    style={{ color: i < 3 ? TEAL : 'rgba(102,192,244,0.25)' }}>
                {i + 1}
              </span>
              {/* Cover */}
              <img src={item.cover_url || PHOLDER} alt={item.title}
                   className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                   onError={e => e.target.src = PHOLDER}/>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm hover:text-teal transition-colors truncate">{item.title}</div>
                {item.note && <div className="text-muted text-xs mt-0.5 truncate italic">"{item.note}"</div>}
                {item.genres && <div className="text-muted text-xs mt-0.5 truncate">{item.genres}</div>}
              </div>
              {/* Remove */}
              {isOwner && (
                <button onClick={e => removeItem(e, item.id, item.title)}
                  className="text-muted hover:text-red transition-colors text-xl flex-shrink-0 opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red/10">
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ════════════════════════════════════════════════════════════
//   CHALLENGES
// ════════════════════════════════════════════════════════════
export function Challenges() {
  const { user } = useAuthStore()
  const [challenges, setChallenges] = useState([])
  const [logs,       setLogs]       = useState([])
  const [creating,   setCreating]   = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [form,       setForm]       = useState({
    title:'', description:'', goal_type:'count',
    goal_value:52, goal_filter:'',
    year: new Date().getFullYear(), is_public:true
  })
  const nav = useNavigate()

  useEffect(() => {
    Promise.all([
      supabase.from('challenges').select('*, profiles(username)')
        .order('created_at',{ascending:false}).limit(30),
      user ? getMyLogs() : Promise.resolve([])
    ]).then(([{data:ch}, myLogs]) => {
      setChallenges(ch||[]); setLogs(myLogs); setLoading(false)
    })
  }, [user])

  const calcProgress = (ch) => {
    const yearLogs = logs.filter(l =>
      (l.date_played||l.created_at||'').startsWith(String(ch.year)))
    if (ch.goal_type === 'count') return { current: yearLogs.length, goal: ch.goal_value }
    if (ch.goal_type === 'genre') {
      const n = yearLogs.filter(l => (l.genres||'').includes(ch.goal_filter)).length
      return { current: n, goal: ch.goal_value }
    }
    if (ch.goal_type === 'platform') {
      const n = yearLogs.filter(l => l.platform === ch.goal_filter).length
      return { current: n, goal: ch.goal_value }
    }
    return { current: 0, goal: ch.goal_value }
  }

  const createChallenge = async () => {
    if (!user) { toast.error('Sign in first'); return }
    if (!form.title.trim()) { toast.error('Add a title'); return }
    const { data, error } = await supabase.from('challenges').insert({
      user_id: user.id, ...form
    }).select('*, profiles(username)').single()
    if (error) { toast.error(error.message); return }
    setChallenges(c => [data,...c])
    setCreating(false)
    toast.success('Challenge created! ')
  }

  return (
    <div className="max-w-screen-lg mx-auto px-6 pt-20 pb-16">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl tracking-[4px]" style={{color:TEAL}}> Challenges</h1>
          <p className="text-muted text-sm mt-1">Set gaming goals and track your progress</p>
        </div>
        {user && (
          <button onClick={() => setCreating(true)}
            className="font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90"
            style={{background:TEAL, color:'var(--bg)'}}>
            + New Challenge
          </button>
        )}
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-surf2 border border-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-semibold text-lg">New Challenge</h3>
              <button onClick={()=>setCreating(false)} className="text-muted hover:text-white">×</button>
            </div>
            <div className="space-y-4">
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                placeholder="e.g. 52 Games in 2025…"
                className="w-full bg-surf border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{color:TEAL}}/>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted text-xs mb-1 block">Goal Type</label>
                  <select value={form.goal_type} onChange={e=>setForm(f=>({...f,goal_type:e.target.value}))}
                    className="w-full bg-surf border border-border rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{colorScheme:'dark',color:TEAL}}>
                    <option value="count">Total Games</option>
                    <option value="genre">Games in Genre</option>
                    <option value="platform">Games on Platform</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted text-xs mb-1 block">Target</label>
                  <input type="number" value={form.goal_value}
                    onChange={e=>setForm(f=>({...f,goal_value:parseInt(e.target.value)||1}))}
                    min={1} className="w-full bg-surf border border-border rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{color:TEAL}}/>
                </div>
              </div>
              {form.goal_type !== 'count' && (
                <input value={form.goal_filter}
                  onChange={e=>setForm(f=>({...f,goal_filter:e.target.value}))}
                  placeholder={form.goal_type==='genre' ? 'Genre name…' : 'Platform name…'}
                  className="w-full bg-surf border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{color:TEAL}}/>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted text-xs mb-1 block">Year</label>
                  <input type="number" value={form.year}
                    onChange={e=>setForm(f=>({...f,year:parseInt(e.target.value)}))}
                    className="w-full bg-surf border border-border rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{color:TEAL}}/>
                </div>
              </div>
              <textarea value={form.description}
                onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                placeholder="Description (optional)…" rows={2}
                className="w-full bg-surf border border-border rounded-xl px-4 py-2.5
                           text-sm outline-none resize-none text-white/80"/>
              <button onClick={createChallenge}
                className="w-full font-bold py-3 rounded-xl text-sm hover:opacity-90"
                style={{background:TEAL, color:'var(--bg)'}}>
                Create Challenge 
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="flex justify-center py-12"><Spinner/></div>
      : challenges.length === 0 ? <EmptyState icon="" title="No challenges yet" subtitle="Create the first challenge!"/>
      : (
        <div className="grid md:grid-cols-2 gap-4">
          {challenges.map(ch => {
            const isOwn = user?.id === ch.user_id
            const { current, goal } = isOwn ? calcProgress(ch) : {current:0, goal:ch.goal_value}
            const pct  = Math.min(Math.round((current/goal)*100), 100)
            const done = pct >= 100
            return (
              <div key={ch.id}
                className="border rounded-2xl p-5 transition-colors"
                style={{
                  background: done ? 'rgba(102,192,244,0.07)' : 'var(--surface)',
                  borderColor: done ? 'rgba(102,192,244,0.35)' : 'var(--border-solid)',
                }}>
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold">{ch.title}</h3>
                  {done && <span className="text-xs font-bold" style={{color:TEAL}}>DONE</span>}
                </div>
                <p className="text-muted text-xs mb-3">
                  by @{ch.profiles?.username} · {ch.year}
                </p>
                {ch.description && <p className="text-white/60 text-sm mb-3">{ch.description}</p>}
                {isOwn && (
                  <>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted">{current} / {goal} games</span>
                      <span style={{color:TEAL}}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                           style={{width:`${pct}%`, background:TEAL}}/>
                    </div>
                  </>
                )}
                {!isOwn && (
                  <div className="text-muted text-xs">
                    Goal: {goal} {ch.goal_type==='count' ? 'games' : ch.goal_filter + ' games'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//   PUBLIC PROFILE
// ════════════════════════════════════════════════════════════
export function PublicProfile() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [profile,   setProfile]   = useState(null)
  const [logs,      setLogs]      = useState([])
  const [following, setFollowing] = useState(false)
  const [followers, setFollowers] = useState(0)
  const [followingC,setFollowingC]= useState(0)
  const [loading,   setLoading]   = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      getUserLogs(id),
      getFollowerCount(id),
      getFollowingCount(id),
      user && id !== user.id ? isFollowing(id) : Promise.resolve(false),
    ]).then(([{data:p}, logs, frs, fing, folw]) => {
      setProfile(p)
      setLogs(logs)
      setFollowers(frs)
      setFollowingC(fing)
      setFollowing(folw)
      setLoading(false)
    })
  }, [id, user])

  const toggleFollow = async () => {
    if (!user) { nav('/auth'); return }
    if (following) {
      await unfollowUser(id)
      setFollowing(false)
      setFollowers(f => f - 1)
    } else {
      await followUser(id)
      setFollowing(true)
      setFollowers(f => f + 1)
    }
  }

  const PHOLDER = 'https://placehold.co/264x352/111118/26263a?text='
  const avg = logs.length ? (logs.reduce((s,r)=>s+(r.rating||0),0)/logs.length).toFixed(1) : '—'

  if (loading) return <div className="flex justify-center pt-32"><Spinner/></div>
  if (!profile) return <div className="text-center pt-32 text-muted">User not found</div>

  const isOwn = user?.id === id

  return (
    <div className="max-w-screen-lg mx-auto px-6 pt-20 pb-16">
      {/* Banner */}
      <div className="bg-gradient-to-br from-surf to-surf2 border border-border
                      rounded-2xl p-7 flex gap-6 items-center flex-wrap mb-8">
        <Avatar name={profile.username||'?'} size="lg" src={profile.avatar_url||''}/>
        <div className="flex-1">
          <div className="font-display text-3xl tracking-[2px] text-white mb-1">
            @{profile.username}
          </div>
          {profile.bio && <p className="text-white/60 text-sm mb-3">{profile.bio}</p>}
          <div className="flex gap-6">
            {[[logs.length,'Games'],[avg,'Avg'],[followers,'Followers'],[followingC,'Following']]
              .map(([v,l]) => (
                <div key={l} className="text-center">
                  <div className="font-display text-2xl" style={{color:TEAL}}>{v}</div>
                  <div className="text-muted text-[0.62rem] uppercase tracking-wide">{l}</div>
                </div>
              ))}
          </div>
        </div>
        {!isOwn && user && (
          <button onClick={toggleFollow}
            className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{
              background: following ? 'transparent' : TEAL,
              color: following ? TEAL : 'var(--bg)',
              border: `1px solid ${TEAL}`,
            }}>
            {following ? 'Following ✓' : '+ Follow'}
          </button>
        )}
        {isOwn && (
          <button onClick={() => nav('/profile')}
            className="px-5 py-2 rounded-xl border border-border text-sm hover:border-teal/40 transition-colors">
            Edit Profile
          </button>
        )}
      </div>

      {/* Recent games */}
      <h2 className="font-display text-2xl tracking-[3px] mb-4">Recently Logged</h2>
      {logs.length === 0 ? (
        <EmptyState icon="" title="Nothing logged yet"/>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {logs.slice(0,16).map(row => (
            <div key={row.id}
              onClick={() => row.igdb_id && nav(`/game/${row.igdb_id}`)}
              className="cursor-pointer group">
              <div className="rounded-xl overflow-hidden border border-border card-hover">
                <img src={row.cover_url||PHOLDER} alt={row.title}
                     className="w-full aspect-[3/4] object-cover"
                     onError={e=>e.target.src=PHOLDER}/>
              </div>
              <div className="flex gap-px mt-1 justify-center">
                {[1,2,3,4,5].map(n=>
                  <span key={n} style={{color:n<=row.rating?'#f5c518':'var(--border-solid)',fontSize:9}}>★</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//   RECOMMENDATIONS
// ════════════════════════════════════════════════════════════
export function Recommendations() {
  const { user } = useAuthStore()
  const [games,  setGames]  = useState([])
  const [loading,setLoading]= useState(true)
  const nav = useNavigate()

  useEffect(() => {
    if (!user) { nav('/auth'); return }
    getMyLogs().then(async logs => {
      // Get top genres from 4-5 star games
      const topLogs   = logs.filter(l => l.rating >= 4)
      const genreCounts = topLogs
        .flatMap(l => (l.genres||'').split(',').map(g=>g.trim()).filter(Boolean))
        .reduce((a,g) => { a[g]=(a[g]||0)+1; return a }, {})
      const topGenres = Object.entries(genreCounts)
        .sort((a,b)=>b[1]-a[1]).slice(0,4).map(([g])=>g)
      const exclude = logs.map(l=>l.igdb_id).filter(Boolean).join(',')

      const r = await fetch(
        `${API}/api/recommendations?genres=${encodeURIComponent(topGenres.join(','))}&exclude=${exclude}`)
      setGames(await r.json())
      setLoading(false)
    })
  }, [user])

  return (
    <div className="max-w-screen-xl mx-auto px-6 pt-20 pb-16">
      <h1 className="font-display text-4xl tracking-[4px] mb-2" style={{color:TEAL}}>
         For You
      </h1>
      <p className="text-muted text-sm mb-8">
        Based on your highest-rated games
      </p>
      {loading ? <div className="flex justify-center py-12"><Spinner/></div>
      : games.length === 0 ? (
        <EmptyState icon="" title="Log more games to get recommendations"
                    subtitle="Rate games 4-5 stars and we'll suggest similar ones"/>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {games.map(g => <GameCard key={g.id} game={g}/>)}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//   GAME NEWS
// ════════════════════════════════════════════════════════════
export function GameNews() {
  const [articles, setArticles] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('')

  useEffect(() => {
    fetch(`${API}/api/news?limit=30`)
      .then(r => r.json())
      .then(d => { setArticles(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const PHOLDER = 'https://placehold.co/400x200/111118/26263a?text='
  const sources = [...new Set(articles.map(a => a.source))]
  const filtered = filter ? articles.filter(a => a.source === filter) : articles

  return (
    <div className="max-w-screen-xl mx-auto px-6 pt-20 pb-16">
      <h1 className="font-display text-4xl tracking-[4px] mb-2" style={{color:TEAL}}>
         Game News
      </h1>
      <p className="text-muted text-sm mb-6">
        Latest from IGN, Eurogamer, PC Gamer, Rock Paper Shotgun & Kotaku
      </p>

      {/* Source filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilter('')}
          className="px-4 py-1.5 rounded-full text-sm border transition-colors cursor-pointer"
          style={{
            background:   !filter ? 'rgba(102,192,244,0.15)' : 'transparent',
            borderColor:  !filter ? 'rgba(102,192,244,0.5)'  : 'var(--border-solid)',
            color:        !filter ? TEAL : 'var(--text3)',
          }}>All</button>
        {sources.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-4 py-1.5 rounded-full text-sm border transition-colors cursor-pointer"
            style={{
              background:   filter===s ? 'rgba(102,192,244,0.15)' : 'transparent',
              borderColor:  filter===s ? 'rgba(102,192,244,0.5)'  : 'var(--border-solid)',
              color:        filter===s ? TEAL : 'var(--text3)',
            }}>{s}</button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner/></div>
      : filtered.length === 0 ? (
        <EmptyState icon="" title="No news available" subtitle="Check back soon or try a different source"/>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a, i) => (
            <a key={i} href={a.link} target="_blank" rel="noopener noreferrer"
               className="bg-surf border border-border rounded-2xl overflow-hidden
                          hover:border-teal/30 transition-colors group no-underline block">
              {a.thumb && (
                <img src={a.thumb} alt={a.title}
                     className="w-full h-36 object-cover"
                     onError={e => e.target.style.display='none'}/>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[0.62rem] font-bold tracking-wider px-2 py-0.5
                                   rounded border"
                        style={{color:TEAL, borderColor:'rgba(102,192,244,0.3)',
                                background:'rgba(102,192,244,0.08)'}}>
                    {a.source}
                  </span>
                  <span className="text-muted text-[0.62rem]">{a.pubDate?.slice(0,16)}</span>
                </div>
                <h3 className="font-semibold text-sm leading-snug mb-2 text-white/90
                                group-hover:text-teal transition-colors line-clamp-2">
                  {a.title}
                </h3>
                {a.summary && (
                  <p className="text-muted text-xs leading-relaxed line-clamp-2">{a.summary}</p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
