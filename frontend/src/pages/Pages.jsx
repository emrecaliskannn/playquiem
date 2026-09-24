// ── Profile ──────────────────────────────────────────────────
import { useSEO } from '../lib/seo'
import { useState, useEffect, useRef } from 'react'
import { GameController, BookOpen, SquaresFour, ChartBar, MagnifyingGlass, Globe, UsersThree, Camera, PencilSimple, SignOut, TrendUp } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getMyLogs, deleteLog, getRecentReviews, getFriendFeed,
         searchUsers, followUser, unfollowUser, isFollowing,
         getFollowerCount, getFollowingCount } from '../lib/db'
import { Avatar, Stars, ReviewCard, EmptyState, Spinner } from '../components/ui'
import toast from 'react-hot-toast'

export function Profile() {
  const { user, profile, updateProfile, uploadAvatar, signOut } = useAuthStore()
  const [logs,      setLogs]      = useState([])
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)
  const [editing,   setEditing]   = useState(false)
  const [bio,        setBio]        = useState('')
  const [nowPlaying, setNowPlaying] = useState(null)
  const [uploading,  setUploading]  = useState(false)
  const [avatarPrev, setAvatarPrev] = useState(null)
  const fileRef = useRef(null)
  const nav = useNavigate()

  const handleAvatarChange = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = ev => setAvatarPrev(ev.target.result)
    reader.readAsDataURL(file)
    // Upload
    setUploading(true)
    try {
      await uploadAvatar(file)
      toast.success('Avatar updated! ')
      setAvatarPrev(null) // use the stored URL now
    } catch(e) {
      toast.error(e.message)
      setAvatarPrev(null)
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    if (!user) { nav('/auth'); return }
    getMyLogs().then(l => {
      setLogs(l)
      // Find currently playing game
      const playing = l.find(g => g.status === 'Playing')
      setNowPlaying(playing || null)
    })
    getFollowerCount(user.id).then(setFollowers)
    getFollowingCount(user.id).then(setFollowing)
    setBio(profile?.bio || '')
  }, [user, profile])

  if (!user) return null
  const avg = logs.length ? (logs.reduce((s,r) => s + (r.rating||0), 0) / logs.length).toFixed(1) : '—'

  const BADGE_CLR = { Played:'text-green', Playing:'text-accent', Wishlist:'text-purple', Dropped:'text-red' }

  return (
    <div className="max-w-screen-xl mx-auto px-6 pt-20 pb-16">
      {/* Banner */}
      <div className="bg-gradient-to-br from-surf to-surf2 border border-border
                      rounded-2xl p-7 flex gap-6 items-center flex-wrap mb-8">
        {/* Clickable avatar */}
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          style={{
            position: 'relative', flexShrink: 0, cursor: uploading ? 'wait' : 'pointer',
            width: 80, height: 80,
          }}
          title="Click to change avatar"
        >
          {/* Avatar circle */}
          {(avatarPrev || profile?.avatar_url) ? (
            <img
              src={avatarPrev || profile.avatar_url}
              alt="avatar"
              style={{
                width: 80, height: 80, borderRadius: '50%', objectFit: 'cover',
                border: '2px solid rgba(102,192,244,0.4)',
                boxShadow: '0 0 0 4px rgba(102,192,244,0.08)',
                transition: 'opacity 0.2s',
                opacity: uploading ? 0.5 : 1,
              }}
            />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #60a5fa, rgba(102,192,244,0.35))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', fontWeight: 900, color: 'var(--bg)',
              fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
              border: '2px solid rgba(102,192,244,0.4)',
              opacity: uploading ? 0.5 : 1, transition: 'opacity 0.2s',
            }}>
              {(profile?.username || '?')[0].toUpperCase()}
            </div>
          )}

          {/* Hover overlay */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: uploading ? 'rgba(0,0,0,0.5)' : 'rgba(102,192,244,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: uploading ? 1 : 0, transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => { if (!uploading) e.currentTarget.style.opacity = '1' }}
          onMouseLeave={e => { if (!uploading) e.currentTarget.style.opacity = '0' }}
          >
            {uploading ? (
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '2px solid rgba(102,192,244,0.3)',
                borderTopColor: 'var(--accent)',
                animation: 'spin 0.7s linear infinite',
              }}/>
            ) : (
              <span style={{ fontSize: '1.2rem' }}></span>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div className="flex-1">
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:4 }}>
            <div className="font-display text-3xl tracking-[2px] text-white">
              @{profile?.username}
            </div>
            {nowPlaying && (
              <div style={{
                display:'inline-flex', alignItems:'center', gap:7,
                background:'rgba(102,192,244,0.1)', border:'1px solid rgba(102,192,244,0.3)',
                borderRadius:20, padding:'4px 12px',
              }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)',
                                flexShrink:0, animation:'pulse 1.5s ease infinite',
                                boxShadow:'0 0 8px rgba(102,192,244,0.6)' }}/>
                <span style={{ fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif',
                                fontSize:'0.68rem', fontWeight:700, color:'var(--accent)',
                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                                maxWidth:140 }}>
                  Playing: {nowPlaying.title}
                </span>
              </div>
            )}
          </div>
          {profile?.bio && <p className="text-white/60 text-sm mb-3">{profile.bio}</p>}
          <div className="flex gap-6">
            {[
              [logs.length,  'Games'],
              [avg,          'Avg Rating'],
              [followers,    'Followers'],
              [following,    'Following'],
            ].map(([v, l]) => (
              <div key={l} className="text-center">
                <div className="font-display text-2xl text-accent">{v}</div>
                <div className="text-muted text-[0.62rem] uppercase tracking-wide">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <button onClick={() => !uploading && fileRef.current?.click()}
              style={{
                padding:'7px 16px', borderRadius:10, cursor:'pointer',
                fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif',
                fontSize:'0.78rem', fontWeight:700,
                background:'rgba(102,192,244,0.08)',
                border:'1px solid rgba(102,192,244,0.3)',
                color:'var(--accent)', transition:'all 0.15s',
              }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(102,192,244,0.16)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(102,192,244,0.08)'}}>
              Change Avatar
            </button>
            <button onClick={() => setEditing(e => !e)}
              className="px-4 py-2 rounded-xl border border-border text-sm hover:border-accent/40 transition-colors">
               Edit Bio
            </button>
          </div>
          <button onClick={async () => {
              await signOut()
              window.location.href = '/'
            }}
            className="px-4 py-2 rounded-xl border border-red/30 text-red text-sm hover:bg-red/5 transition-colors">
            Sign Out
          </button>
        </div>
      </div>

      {editing && (
        <div className="bg-surf2 border border-border rounded-xl p-4 mb-6">
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
            placeholder="Tell the community about yourself…"
            className="w-full bg-surf border border-border rounded-xl px-4 py-2.5
                       text-white text-sm placeholder-muted outline-none resize-none
                       focus:border-accent transition-colors mb-3" />
          <button onClick={async () => {
            await updateProfile({ bio })
            setEditing(false)
            toast.success('Profile updated!')
          }} className="bg-accent text-bg font-bold px-5 py-2 rounded-xl text-sm">
            Save
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Rating dist */}
        <div className="bg-surf border border-border rounded-xl p-4 col-span-2">
          <h3 className="font-semibold mb-3">Rating Distribution</h3>
          {[5,4,3,2,1].map(n => {
            const count = logs.filter(l => l.rating === n).length
            const pct = logs.length ? Math.round((count/logs.length)*100) : 0
            return (
              <div key={n} className="flex items-center gap-2 mb-2">
                <span className="text-gold text-xs w-12">{'★'.repeat(n)}</span>
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full transition-all"
                       style={{width:`${pct}%`}} />
                </div>
                <span className="text-muted text-xs w-6">{count}</span>
              </div>
            )
          })}
        </div>
        {/* Status */}
        <div className="bg-surf border border-border rounded-xl p-4">
          <h3 className="font-semibold mb-3">Status</h3>
          {['Played','Playing','Wishlist','Dropped'].map(s => {
            const c = logs.filter(l => l.status === s).length
            return (
              <div key={s} className="flex justify-between text-sm mb-2">
                <span className={BADGE_CLR[s]}>{s}</span>
                <span className="text-muted">{c}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent logs */}
      <h2 className="font-display text-xl tracking-[2px] mb-4">Recently Logged</h2>
      {logs.length === 0 ? (
        <EmptyState icon=<GameController size={14} weight='bold'/> title="Nothing logged yet"
                    subtitle="Head to All Games to start logging!" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {logs.slice(0,12).map(row => (
            <div key={row.id} className="relative group">
              <div className="rounded-xl overflow-hidden bg-surf border border-border card-hover">
                <img src={row.cover_url || 'https://placehold.co/264x352/111118/26263a?text='}
                     className="w-full aspect-[3/4] object-cover block"
                     onError={e => e.target.src='https://placehold.co/264x352/111118/26263a?text='} />
                <div className="p-2">
                  <div className="text-[0.78rem] font-semibold truncate">{row.title}</div>
                  <Stars rating={row.rating} size="sm" />
                </div>
              </div>
              <button
                onClick={async () => {
                  await deleteLog(row.id)
                  setLogs(ls => ls.filter(l => l.id !== row.id))
                  toast.success('Removed')
                }}
                className="absolute top-1 right-1 bg-red/80 text-white rounded-lg
                           px-1.5 py-0.5 text-[0.6rem] opacity-0 group-hover:opacity-100
                           transition-opacity cursor-pointer">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Library ───────────────────────────────────────────────────
export function Library() {
  const { user } = useAuthStore()
  const [logs,    setLogs]    = useState([])
  const [filter,  setFilter]  = useState('')
  const [sort,    setSort]    = useState('recent')
  const [view,    setView]    = useState('grid')
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()
  const F = '"Helvetica Neue",Helvetica,Arial,sans-serif'
  const T = 'var(--accent)'

  useEffect(() => {
    if (!user) { nav('/auth'); return }
    getMyLogs().then(l => { setLogs(l); setLoading(false) })
  }, [user])

  const STATUS_COLOR = {
    Played:  { color:'#2dc653', bg:'rgba(45,198,83,0.1)',   border:'rgba(45,198,83,0.3)'   },
    Playing: { color:'var(--accent)', bg:'rgba(102,192,244,0.1)', border:'rgba(102,192,244,0.3)' },
    Wishlist:{ color:'var(--accent2)', bg:'rgba(179,157,219,0.1)', border:'rgba(179,157,219,0.3)' },
    Dropped: { color:'#e84545', bg:'rgba(232,69,69,0.1)',   border:'rgba(232,69,69,0.3)'   },
  }

  const sorted = [...(filter ? logs.filter(l=>l.status===filter) : logs)].sort((a,b) => {
    if (sort === 'rating')  return (b.rating||0) - (a.rating||0)
    if (sort === 'title')   return a.title.localeCompare(b.title)
    if (sort === 'recent')  return new Date(b.logged_at||0) - new Date(a.logged_at||0)
    return 0
  })

  const STATUS_COUNTS = ['Played','Playing','Wishlist','Dropped'].reduce((a,s) => {
    a[s] = logs.filter(l=>l.status===s).length; return a
  }, {})

  return (
    <div style={{ maxWidth:1400, margin:'0 auto', padding:'76px 24px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:F, fontWeight:900, fontSize:'2rem', color:T,
                      letterSpacing:'-0.03em', margin:'0 0 4px' }}>My Library</h1>
        <p style={{ fontFamily:F, fontSize:'0.82rem', color:'rgba(102,192,244,0.4)' }}>
          {logs.length} games · {STATUS_COUNTS.Playing||0} currently playing
        </p>
      </div>

      {/* Status summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10, marginBottom:24 }}>
        {[['All', logs.length, T, 'rgba(102,192,244,0.08)', 'rgba(102,192,244,0.2)'],
          ...Object.entries(STATUS_COLOR).map(([s,c]) => [s, STATUS_COUNTS[s]||0, c.color, c.bg, c.border])
        ].map(([label, count, color, bg, border]) => (
          <button key={label} onClick={() => setFilter(label === 'All' ? '' : label)} style={{
            padding:'12px 10px', borderRadius:12, cursor:'pointer', textAlign:'center',
            background: (filter===label || (label==='All'&&!filter)) ? bg : 'rgba(102,192,244,0.02)',
            border: `1px solid ${(filter===label || (label==='All'&&!filter)) ? border : 'rgba(102,192,244,0.08)'}`,
            transition:'all 0.15s',
          }}>
            <div style={{ fontFamily:F, fontWeight:900, fontSize:'1.4rem', color, lineHeight:1 }}>{count}</div>
            <div style={{ fontFamily:F, fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.1em',
                          textTransform:'uppercase', color:'rgba(102,192,244,0.4)', marginTop:4 }}>{label}</div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', gap:10, marginBottom:20, alignItems:'center', flexWrap:'wrap' }}>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={{
          background:'rgba(102,192,244,0.06)', border:'1px solid rgba(102,192,244,0.2)',
          borderRadius:10, padding:'8px 12px', fontFamily:F, fontSize:'0.78rem',
          color:T, outline:'none', cursor:'pointer', colorScheme:'dark',
        }}>
          <option value="recent">Recently Added</option>
          <option value="rating">Highest Rated</option>
          <option value="title">Title A-Z</option>
        </select>
        <div style={{ display:'flex', gap:4, marginLeft:'auto' }}>
          {[['grid',<SquaresFour size={16}/>],['list',<SquaresFour size={16} weight='fill'/>]].map(([v,ico]) => (
            <button key={v} onClick={()=>setView(v)} style={{
              width:36, height:36, borderRadius:8, cursor:'pointer',
              background: view===v ? 'rgba(102,192,244,0.15)' : 'transparent',
              border: `1px solid ${view===v ? 'rgba(102,192,244,0.4)' : 'rgba(102,192,244,0.12)'}`,
              color: view===v ? T : 'rgba(102,192,244,0.35)',
              fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center',
            }}>{ico}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}><Spinner/></div>
      ) : sorted.length === 0 ? (
        <EmptyState icon=<BookOpen size={14} weight='bold'/> title="Nothing here yet"
          subtitle="Log your first game to build your library."
          action="Browse Games" onAction={() => nav('/games')} />
      ) : view === 'grid' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:14 }}>
          {sorted.map(row => {
            const sc = STATUS_COLOR[row.status] || {}
            return (
              <div key={row.id} onClick={()=>row.igdb_id&&nav('/game/'+row.igdb_id)}
                style={{ cursor:'pointer', borderRadius:14, overflow:'hidden',
                          border:'1px solid rgba(102,192,244,0.08)', background:'var(--surface)',
                          transition:'all 0.18s', position:'relative' }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.borderColor='rgba(102,192,244,0.3)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.borderColor='rgba(102,192,244,0.08)'}}>
                <img src={row.cover_url||'https://placehold.co/264x352/111116/94F5D8?text='}
                     style={{ width:'100%', aspectRatio:'3/4', objectFit:'cover', display:'block' }}
                     onError={e=>e.target.src='https://placehold.co/264x352/111116/94F5D8?text='}/>
                <div style={{ padding:'8px 10px' }}>
                  <div style={{ fontFamily:F, fontSize:'0.75rem', fontWeight:700, color:T,
                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4 }}>
                    {row.title}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:'0.65rem', color:'rgba(102,192,244,0.5)' }}>
                      {'★'.repeat(row.rating||0)}
                    </div>
                    {row.status && (
                      <span style={{ fontFamily:F, fontSize:'0.52rem', fontWeight:800,
                                      padding:'2px 6px', borderRadius:4,
                                      color:sc.color, background:sc.bg, border:`1px solid ${sc.border}` }}>
                        {row.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {sorted.map(row => {
            const sc = STATUS_COLOR[row.status] || {}
            return (
              <div key={row.id} onClick={()=>row.igdb_id&&nav('/game/'+row.igdb_id)}
                style={{ display:'flex', alignItems:'center', gap:14, cursor:'pointer',
                          background:'var(--surface)', border:'1px solid rgba(102,192,244,0.08)',
                          borderRadius:12, padding:'10px 14px', transition:'border-color 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(102,192,244,0.28)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(102,192,244,0.08)'}>
                <img src={row.cover_url||'https://placehold.co/264x352/111116/94F5D8?text='}
                     style={{ width:40, height:54, objectFit:'cover', borderRadius:6, flexShrink:0 }}
                     onError={e=>e.target.src='https://placehold.co/264x352/111116/94F5D8?text='}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:F, fontSize:'0.88rem', fontWeight:700, color:T,
                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {row.title}
                  </div>
                  <div style={{ fontFamily:F, fontSize:'0.68rem', color:'rgba(102,192,244,0.4)', marginTop:2 }}>
                    {row.platform && <span>{row.platform} · </span>}
                    {row.logged_at && new Date(row.logged_at).toLocaleDateString('en',{month:'short',year:'numeric'})}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
                  <span style={{ fontFamily:F, fontSize:'0.75rem', color:'rgba(102,192,244,0.6)' }}>
                    {'★'.repeat(row.rating||0)}
                  </span>
                  {row.status && (
                    <span style={{ fontFamily:F, fontSize:'0.58rem', fontWeight:800,
                                    padding:'3px 8px', borderRadius:6,
                                    color:sc.color, background:sc.bg, border:`1px solid ${sc.border}` }}>
                      {row.status}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────
export function Dashboard() {
  const { user, profile } = useAuthStore()
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()
  const F = '"Helvetica Neue",Helvetica,Arial,sans-serif'
  const T = 'var(--accent)'

  useEffect(() => {
    if (!user) { nav('/auth'); return }
    getMyLogs().then(l => { setLogs(l); setLoading(false) })
  }, [user])

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh' }}>
      <Spinner size="lg"/>
    </div>
  )

  if (!logs.length) return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'76px 24px' }}>
      <h1 style={{ fontFamily:F, fontWeight:900, fontSize:'2rem', color:T, marginBottom:8 }}>Dashboard</h1>
      <EmptyState icon=<ChartBar size={14} weight='bold'/> title="Nothing logged yet"
        subtitle="Log some games to see your personal stats here."
        action="Browse Games" onAction={() => nav('/games')} />
    </div>
  )

  // ── Computed stats ──────────────────────────────────────────
  const total      = logs.length
  const rated      = logs.filter(l=>l.rating>0)
  const avg        = rated.length ? (rated.reduce((s,r)=>s+r.rating,0)/rated.length).toFixed(1) : '—'
  const reviews    = logs.filter(l=>l.review).length
  const platforms  = logs.reduce((a,l)=>{ if(l.platform){a[l.platform]=(a[l.platform]||0)+1}; return a },{})
  const topPlats   = Object.entries(platforms).sort((a,b)=>b[1]-a[1]).slice(0,6)
  const statuses   = logs.reduce((a,l)=>{ a[l.status]=(a[l.status]||0)+1; return a },{})
  const ratingDist = [5,4,3,2,1].map(n=>({ n, count:logs.filter(l=>l.rating===n).length }))
  const maxRating  = Math.max(...ratingDist.map(r=>r.count), 1)

  // Monthly activity (last 6 months)
  const now = new Date()
  const months = Array.from({length:6}).map((_,i) => {
    const d = new Date(now.getFullYear(), now.getMonth()-5+i, 1)
    return {
      label: d.toLocaleDateString('en',{month:'short'}),
      count: logs.filter(l => {
        if (!l.logged_at) return false
        const ld = new Date(l.logged_at)
        return ld.getFullYear()===d.getFullYear() && ld.getMonth()===d.getMonth()
      }).length,
    }
  })
  const maxMonth = Math.max(...months.map(m=>m.count), 1)

  const STAT_COLORS = ['var(--accent)','#2dc653','var(--accent2)','#f5c518']

  const Card = ({ value, label, color='var(--accent)', sub }) => (
    <div style={{ background:'rgba(102,192,244,0.04)', border:'1px solid rgba(102,192,244,0.1)',
                  borderRadius:16, padding:'20px 18px', textAlign:'center' }}>
      <div style={{ fontFamily:F, fontWeight:900, fontSize:'2.2rem', color, lineHeight:1, marginBottom:4 }}>
        {value}
      </div>
      <div style={{ fontFamily:F, fontSize:'0.6rem', fontWeight:800, letterSpacing:'0.12em',
                    textTransform:'uppercase', color:'rgba(102,192,244,0.4)' }}>{label}</div>
      {sub && <div style={{ fontFamily:F, fontSize:'0.58rem', color:'rgba(102,192,244,0.25)', marginTop:3 }}>{sub}</div>}
    </div>
  )

  const SectionTitle = ({ children }) => (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
      <h2 style={{ fontFamily:F, fontWeight:800, fontSize:'0.68rem', letterSpacing:'0.16em',
                    textTransform:'uppercase', color:'rgba(102,192,244,0.4)', margin:0 }}>{children}</h2>
      <div style={{ flex:1, height:1, background:'rgba(102,192,244,0.08)' }}/>
    </div>
  )

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'76px 24px 60px' }}>
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontFamily:F, fontWeight:900, fontSize:'2rem', color:T,
                      letterSpacing:'-0.03em', margin:'0 0 4px' }}>Dashboard</h1>
        <p style={{ fontFamily:F, fontSize:'0.82rem', color:'rgba(102,192,244,0.4)' }}>
          @{profile?.username} · your gaming stats
        </p>
      </div>

      {/* Key stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:36 }}>
        <Card value={total}   label="Games Logged"    color={STAT_COLORS[0]}/>
        <Card value={avg}     label="Avg Rating"       color={STAT_COLORS[1]}/>
        <Card value={reviews} label="Reviews Written"  color={STAT_COLORS[2]}/>
        <Card value={topPlats.length} label="Platforms Used" color={STAT_COLORS[3]}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:36 }}>

        {/* Rating distribution */}
        <div style={{ background:'rgba(102,192,244,0.03)', border:'1px solid rgba(102,192,244,0.08)',
                      borderRadius:16, padding:'20px 22px' }}>
          <SectionTitle>Rating Distribution</SectionTitle>
          {ratingDist.map(({n,count}) => (
            <div key={n} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ fontFamily:F, fontSize:'0.75rem', color:'rgba(102,192,244,0.6)', width:40 }}>
                {'★'.repeat(n)}
              </span>
              <div style={{ flex:1, height:8, background:'rgba(102,192,244,0.06)', borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:4, background:T,
                              width:`${(count/maxRating)*100}%`, transition:'width 0.8s ease',
                              opacity: 0.4 + (n/5)*0.6 }}/>
              </div>
              <span style={{ fontFamily:F, fontSize:'0.7rem', color:'rgba(102,192,244,0.5)', width:20, textAlign:'right' }}>
                {count}
              </span>
            </div>
          ))}
        </div>

        {/* Status breakdown */}
        <div style={{ background:'rgba(102,192,244,0.03)', border:'1px solid rgba(102,192,244,0.08)',
                      borderRadius:16, padding:'20px 22px' }}>
          <SectionTitle>Status Breakdown</SectionTitle>
          {[['Played','#2dc653'],['Playing',T],['Wishlist','var(--accent2)'],['Dropped','#e84545']].map(([s,c]) => (
            <div key={s} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ fontFamily:F, fontSize:'0.72rem', fontWeight:700, color:c, width:60 }}>{s}</span>
              <div style={{ flex:1, height:8, background:'rgba(102,192,244,0.06)', borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:4, background:c,
                              width:`${((statuses[s]||0)/total)*100}%`, opacity:0.7, transition:'width 0.8s ease' }}/>
              </div>
              <span style={{ fontFamily:F, fontSize:'0.7rem', color:'rgba(102,192,244,0.5)', width:20, textAlign:'right' }}>
                {statuses[s]||0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly activity bar chart */}
      <div style={{ background:'rgba(102,192,244,0.03)', border:'1px solid rgba(102,192,244,0.08)',
                    borderRadius:16, padding:'20px 22px', marginBottom:36 }}>
        <SectionTitle>Monthly Activity (Last 6 Months)</SectionTitle>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end', height:80 }}>
          {months.map(({label,count}) => (
            <div key={label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <span style={{ fontFamily:F, fontSize:'0.6rem', color:'rgba(102,192,244,0.5)' }}>{count||''}</span>
              <div style={{ width:'100%', borderRadius:6, background:T, opacity:0.7,
                            height: count ? `${Math.max(8,(count/maxMonth)*60)}px` : 4,
                            transition:'height 0.8s ease' }}/>
              <span style={{ fontFamily:F, fontSize:'0.62rem', color:'rgba(102,192,244,0.4)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Platform breakdown */}
      <div style={{ background:'rgba(102,192,244,0.03)', border:'1px solid rgba(102,192,244,0.08)',
                    borderRadius:16, padding:'20px 22px', marginBottom:36 }}>
        <SectionTitle>Top Platforms</SectionTitle>
        {topPlats.map(([plat,count]) => (
          <div key={plat} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
            <span style={{ fontFamily:F, fontSize:'0.78rem', color:'rgba(102,192,244,0.6)', width:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{plat}</span>
            <div style={{ flex:1, height:8, background:'rgba(102,192,244,0.06)', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:4, background:T, opacity:0.65,
                            width:`${(count/total)*100}%`, transition:'width 0.8s ease' }}/>
            </div>
            <span style={{ fontFamily:F, fontSize:'0.72rem', color:'rgba(102,192,244,0.5)', width:24, textAlign:'right' }}>{count}</span>
          </div>
        ))}
      </div>

      {/* Recently logged */}
      <SectionTitle>Recently Logged</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:12 }}>
        {logs.slice(0,6).map(row => (
          <div key={row.id} onClick={()=>row.igdb_id&&nav('/game/'+row.igdb_id)}
            style={{ cursor:'pointer', borderRadius:12, overflow:'hidden',
                      border:'1px solid rgba(102,192,244,0.08)', background:'var(--surface)',
                      transition:'all 0.18s' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.borderColor='rgba(102,192,244,0.3)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.borderColor='rgba(102,192,244,0.08)'}}>
            <img src={row.cover_url||'https://placehold.co/264x352/111116/94F5D8?text='}
                 style={{ width:'100%', aspectRatio:'3/4', objectFit:'cover', display:'block' }}
                 onError={e=>e.target.src='https://placehold.co/264x352/111116/94F5D8?text='}/>
            <div style={{ padding:'6px 8px' }}>
              <div style={{ fontFamily:F, fontSize:'0.68rem', fontWeight:700, color:T,
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.title}</div>
              <div style={{ fontSize:'0.6rem', color:'rgba(102,192,244,0.5)', marginTop:2 }}>{'★'.repeat(row.rating||0)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Search ────────────────────────────────────────────────────
export function Search() {
  const [q,       setQ]       = useState('')
  const [mode,    setMode]    = useState('games')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const nav = useNavigate()
  const { user } = useAuthStore()
  const F = '"Helvetica Neue",Helvetica,Arial,sans-serif'
  const T = 'var(--accent)'
  const API = import.meta.env.VITE_API_URL || 'https://playquiem.onrender.com'

  const doSearch = async (overrideQ) => {
    const query = overrideQ ?? q
    if (!query.trim()) return
    setLoading(true); setSearched(true)
    try {
      if (mode === 'games') {
        const r = await fetch(`${API}/api/games?q=${encodeURIComponent(query)}&limit=24`)
        setResults(await r.json())
      } else {
        setResults(await searchUsers(query))
      }
    } catch { setResults([]) }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth:1400, margin:'0 auto', padding:'76px 24px 60px' }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:F, fontWeight:900, fontSize:'2rem', color:T,
                      letterSpacing:'-0.03em', margin:'0 0 4px' }}>Search</h1>
        <p style={{ fontFamily:F, fontSize:'0.82rem', color:'rgba(102,192,244,0.4)' }}>
          Find games, players, reviews
        </p>
      </div>

      {/* Search bar */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:240, position:'relative' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="rgba(102,192,244,0.4)" strokeWidth="2.5"
               style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', flexShrink:0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input value={q} onChange={e=>setQ(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&doSearch()}
            placeholder={mode==='games' ? 'Search any game…' : 'Search members…'}
            style={{
              width:'100%', padding:'12px 16px 12px 42px', boxSizing:'border-box',
              background:'rgba(102,192,244,0.06)', border:'1px solid rgba(102,192,244,0.2)',
              borderRadius:12, fontFamily:F, fontSize:'0.92rem', color:T,
              caretColor:T, outline:'none', transition:'border-color 0.15s',
            }}
            onFocus={e=>e.target.style.borderColor='rgba(102,192,244,0.5)'}
            onBlur={e=>e.target.style.borderColor='rgba(102,192,244,0.2)'}/>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[['games',' Games'],['members',' Members']].map(([m,label]) => (
            <button key={m} onClick={()=>{setMode(m);setResults([]);setSearched(false)}} style={{
              padding:'10px 16px', borderRadius:12, cursor:'pointer',
              fontFamily:F, fontWeight:700, fontSize:'0.8rem',
              background: mode===m ? 'rgba(102,192,244,0.15)' : 'transparent',
              border: `1px solid ${mode===m ? 'rgba(102,192,244,0.4)' : 'rgba(102,192,244,0.15)'}`,
              color: mode===m ? T : 'rgba(102,192,244,0.4)',
              transition:'all 0.15s',
            }}>{label}</button>
          ))}
          <button onClick={()=>doSearch()} style={{
            padding:'10px 20px', borderRadius:12, cursor:'pointer',
            background:T, color:'var(--bg)', border:'none',
            fontFamily:F, fontWeight:900, fontSize:'0.82rem',
          }}>Search</button>
        </div>
      </div>

      {/* Results count */}
      {searched && !loading && (
        <p style={{ fontFamily:F, fontSize:'0.78rem', color:'rgba(102,192,244,0.35)', marginBottom:16 }}>
          {results.length} result{results.length!==1?'s':''} for "{q}"
        </p>
      )}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}><Spinner/></div>
      ) : !searched ? (
        <EmptyState icon="" title="Search Playquiem"
          subtitle="Find games by name, or discover other players" />
      ) : results.length === 0 ? (
        <EmptyState icon="" title={`No results for "${q}"`}
          subtitle="Try a different spelling or search term" />
      ) : mode === 'games' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:14 }}>
          {results.map(g => (
            <div key={g.id} onClick={()=>nav(`/game/${g.id}`)}
              style={{ cursor:'pointer', borderRadius:14, overflow:'hidden',
                        border:'1px solid rgba(102,192,244,0.08)', background:'var(--surface)',
                        transition:'all 0.18s' }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.borderColor='rgba(102,192,244,0.3)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.borderColor='rgba(102,192,244,0.08)'}}>
              <img src={g.cover||'https://placehold.co/264x352/111116/94F5D8?text='}
                   style={{ width:'100%', aspectRatio:'3/4', objectFit:'cover', display:'block' }}
                   onError={e=>e.target.src='https://placehold.co/264x352/111116/94F5D8?text='}/>
              <div style={{ padding:'8px 10px' }}>
                <div style={{ fontFamily:F, fontSize:'0.76rem', fontWeight:700, color:T,
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>
                  {g.title}
                </div>
                <div style={{ fontFamily:F, fontSize:'0.62rem', color:'rgba(102,192,244,0.4)', display:'flex', justifyContent:'space-between' }}>
                  <span>{g.year||''}</span>
                  {g.rating>0 && <span>★ {g.rating}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {results.map(u => (
            <div key={u.id} style={{ display:'flex', alignItems:'center', gap:14,
                                      background:'var(--surface)', border:'1px solid rgba(102,192,244,0.08)',
                                      borderRadius:14, padding:'14px 16px', transition:'border-color 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(102,192,244,0.25)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(102,192,244,0.08)'}>
              <div style={{ width:44, height:44, borderRadius:'50%', flexShrink:0,
                            background:'linear-gradient(135deg,#60a5fa,rgba(102,192,244,0.3))',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontFamily:F, fontWeight:800, fontSize:'1rem', color:'var(--bg)' }}>
                {(u.username||'?')[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={()=>nav(`/profile/${u.id}`)}>
                <div style={{ fontFamily:F, fontWeight:700, fontSize:'0.9rem', color:T }}>@{u.username}</div>
                {u.bio && <div style={{ fontFamily:F, fontSize:'0.72rem', color:'rgba(102,192,244,0.4)',
                                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.bio}</div>}
              </div>
              {user && u.id !== user.id && (
                <button onClick={async()=>{
                  const fol = await isFollowing(u.id)
                  fol ? await unfollowUser(u.id) : await followUser(u.id)
                  toast.success(fol?'Unfollowed':'Following! ')
                }} style={{
                  padding:'7px 16px', borderRadius:10, cursor:'pointer',
                  fontFamily:F, fontWeight:700, fontSize:'0.75rem',
                  background:'rgba(102,192,244,0.08)', border:'1px solid rgba(102,192,244,0.25)',
                  color:T, transition:'all 0.15s',
                }}>Follow</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Community ─────────────────────────────────────────────────
export function Community() {
  useSEO({ title: 'Community', description: 'See what games the Playquiem community is playing, rating and reviewing.' })
  const [reviews,  setReviews]  = useState([])
  const [feed,     setFeed]     = useState([])
  const [members,  setMembers]  = useState([])
  const [tab,      setTab]      = useState('reviews')
  const { user } = useAuthStore()
  const nav = useNavigate()
  const F = '"Helvetica Neue",Helvetica,Arial,sans-serif'
  const T = 'var(--accent)'

  useEffect(() => {
    getRecentReviews(20).then(setReviews)
    searchUsers('').then(m => setMembers(m.slice(0,12)))
    if (user) getFriendFeed().then(setFeed)
  }, [user])

  const SectionTitle = ({ children }) => (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
      <h2 style={{ fontFamily:F, fontWeight:800, fontSize:'0.68rem', letterSpacing:'0.16em',
                    textTransform:'uppercase', color:'rgba(102,192,244,0.4)', margin:0 }}>{children}</h2>
      <div style={{ flex:1, height:1, background:'rgba(102,192,244,0.08)' }}/>
    </div>
  )

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'76px 24px 60px' }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:F, fontWeight:900, fontSize:'2rem', color:T,
                      letterSpacing:'-0.03em', margin:'0 0 4px' }}>Community</h1>
        <p style={{ fontFamily:F, fontSize:'0.82rem', color:'rgba(102,192,244,0.4)' }}>
          See what everyone is playing and thinking
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:28, borderBottom:'1px solid rgba(102,192,244,0.08)', paddingBottom:0 }}>
        {[['reviews',' Reviews'],['activity',' Activity'],['members',' Members']].map(([key,label]) => (
          <button key={key} onClick={()=>setTab(key)} style={{
            padding:'10px 18px', background:'transparent', border:'none',
            borderBottom: `2px solid ${tab===key ? T : 'transparent'}`,
            fontFamily:F, fontWeight:700, fontSize:'0.8rem',
            color: tab===key ? T : 'rgba(102,192,244,0.35)',
            cursor:'pointer', transition:'color 0.15s', marginBottom:-1,
          }}>{label}</button>
        ))}
      </div>

      {/* Reviews tab */}
      {tab === 'reviews' && (
        <>
          {user && feed.length > 0 && (
            <div style={{ marginBottom:36 }}>
              <SectionTitle>Friend Activity</SectionTitle>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
                {feed.slice(0,6).map((rv,i) => <ReviewCard key={i} review={rv}/>)}
              </div>
            </div>
          )}
          <SectionTitle>Recent Reviews</SectionTitle>
          {reviews.length === 0 ? (
            <EmptyState icon="" title="No reviews yet" subtitle="Log a game and write the first review!"/>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
              {reviews.map(r => <ReviewCard key={r.id} review={r}/>)}
            </div>
          )}
        </>
      )}

      {/* Activity tab */}
      {tab === 'activity' && (
        <>
          <SectionTitle>Global Activity Feed</SectionTitle>
          {feed.length === 0 ? (
            <EmptyState icon="" title="Follow players to see their activity"
              subtitle="Find friends in the Members tab and follow them."
              action="Find Members" onAction={()=>setTab('members')}/>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {feed.map((rv,i) => (
                <div key={i} style={{ display:'flex', gap:14, background:'var(--surface)',
                                        border:'1px solid rgba(102,192,244,0.08)',
                                        borderRadius:14, padding:'14px 16px' }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', flexShrink:0,
                                background:'linear-gradient(135deg,#60a5fa,rgba(102,192,244,0.3))',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontFamily:F, fontWeight:800, color:'var(--bg)' }}>
                    {(rv.display_name||rv.username||'?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:F, fontSize:'0.78rem', color:'rgba(102,192,244,0.6)', marginBottom:4 }}>
                      <span style={{ fontWeight:700, color:T }}>@{rv.username}</span> logged a game
                    </div>
                    <div style={{ fontFamily:F, fontWeight:700, fontSize:'0.88rem', color:T }}>{rv.title}</div>
                    {rv.review && (
                      <div style={{ fontFamily:F, fontSize:'0.75rem', color:'rgba(102,192,244,0.45)',
                                    marginTop:5, fontStyle:'italic', borderLeft:'2px solid rgba(102,192,244,0.15)',
                                    paddingLeft:10, overflow:'hidden', display:'-webkit-box',
                                    WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                        "{rv.review}"
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily:F, fontSize:'0.75rem', color:'rgba(102,192,244,0.5)', flexShrink:0 }}>
                    {'★'.repeat(rv.rating||0)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Members tab */}
      {tab === 'members' && (
        <>
          <SectionTitle>Players on Playquiem</SectionTitle>
          {members.length === 0 ? (
            <EmptyState icon="" title="No members found" subtitle="Be the first to join!"/>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
              {members.map(u => (
                <div key={u.id} onClick={()=>nav(`/profile/${u.id}`)}
                  style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer',
                            background:'var(--surface)', border:'1px solid rgba(102,192,244,0.08)',
                            borderRadius:14, padding:'14px', transition:'all 0.15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(102,192,244,0.3)';e.currentTarget.style.transform='translateY(-2px)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(102,192,244,0.08)';e.currentTarget.style.transform='translateY(0)'}}>
                  <div style={{ width:42, height:42, borderRadius:'50%', flexShrink:0,
                                background:'linear-gradient(135deg,#60a5fa,rgba(102,192,244,0.3))',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontFamily:F, fontWeight:900, fontSize:'1rem', color:'var(--bg)' }}>
                    {(u.username||'?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:F, fontWeight:700, fontSize:'0.85rem', color:T,
                                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      @{u.username}
                    </div>
                    {u.bio && (
                      <div style={{ fontFamily:F, fontSize:'0.68rem', color:'rgba(102,192,244,0.35)',
                                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {u.bio}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
