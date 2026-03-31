import { useState, useEffect, useRef } from 'react'
import { TrendUp, Star, Trophy, Sword, Globe, Newspaper, BookOpen, SquaresFour, Ranking, Target, Confetti, Clock, GameController } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useSection } from '../hooks/useGames'
import { GameCard, SkeletonCard, ReviewCard, EmptyState } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { getRecentReviews, getFriendFeed, getMyLogs, getMyLikes } from '../lib/db'
import { MemberSearch, WhoToFollow } from '../components/Social'
import CommunityTrending from '../components/CommunityTrending'
import UpcomingCountdown from '../components/UpcomingCountdown'

const TEAL = '#0ea5e9'
const FONT = '"Helvetica Neue",Helvetica,Arial,sans-serif'
const PLACEHOLDER = 'https://placehold.co/264x352/111116/94F5D8?text='

// ── Ad slot ───────────────────────────────────────────────────
function AdSlot() {
  const Box = ({ h, label, size }) => (
    <div style={{
      borderRadius: 12, border: '1px dashed rgba(14,165,233,0.16)',
      background: 'rgba(14,165,233,0.02)',
      minHeight: h, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12,
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '1px solid rgba(14,165,233,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(14,165,233,0.25)', fontSize: 11,
      }}></div>
      <span style={{
        fontFamily: FONT, fontSize: '0.52rem', fontWeight: 800,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color: 'rgba(14,165,233,0.2)', textAlign: 'center',
      }}>{label}</span>
      {size && (
        <span style={{ fontFamily: FONT, fontSize: '0.48rem',
                        color: 'rgba(14,165,233,0.12)', textAlign: 'center' }}>
          {size}
        </span>
      )}
    </div>
  )
  return (
    <aside style={{ width: 140, flexShrink: 0, position: 'sticky', top: 80,
                    alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Box h={300} label="Advertisement" size="140 × 300" />
      <Box h={130} label="Ad" />
    </aside>
  )
}

// ── Divider ───────────────────────────────────────────────────
function Divider({ label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, margin:'8px 0 32px' }}>
      <div style={{ flex:1, height:1,
        background:'linear-gradient(to right, rgba(14,165,233,0.3), rgba(14,165,233,0.04))' }}/>
      {label && (
        <span style={{ fontFamily:FONT, fontSize:'0.55rem', fontWeight:800,
                        letterSpacing:'0.18em', textTransform:'uppercase',
                        color:'rgba(14,165,233,0.3)', whiteSpace:'nowrap' }}>
          {label}
        </span>
      )}
      <div style={{ flex:1, height:1,
        background:'linear-gradient(to left, rgba(14,165,233,0.3), rgba(14,165,233,0.04))' }}/>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────
function Section({ title, sub, badge, children }) {
  return (
    <section style={{ marginBottom: 0 }}>
      <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:10,
                    height:52, marginBottom:16 }}>
        <h2 style={{ fontFamily:FONT, fontWeight:800, fontSize:'0.95rem',
                      color:TEAL, textTransform:'uppercase', letterSpacing:'0.07em',
                      margin:0, whiteSpace:'nowrap' }}>
          {title}
        </h2>
        {badge && (
          <span style={{ fontFamily:FONT, fontSize:'0.58rem', fontWeight:800,
                          letterSpacing:'0.12em', textTransform:'uppercase', color:TEAL,
                          background:'rgba(14,165,233,0.1)', border:'1px solid rgba(14,165,233,0.28)',
                          padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
             {badge}
          </span>
        )}
        {sub && (
          <span style={{ fontFamily:FONT, fontSize:'0.6rem',
                          color:'rgba(14,165,233,0.25)', letterSpacing:'0.04em',
                          marginLeft:'auto', whiteSpace:'nowrap' }}>
            {sub}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

// ── Horizontal scroll row ─────────────────────────────────────
function HScrollRow({ children }) {
  const rowRef = useRef(null)
  const [canLeft,  setCanLeft]  = useState(false)
  const [canRight, setCanRight] = useState(true)

  const update = () => {
    const el = rowRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  const scroll = dir => {
    rowRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })
    setTimeout(update, 350)
  }

  const Arrow = ({ dir }) => {
    const enabled = dir === -1 ? canLeft : canRight
    return (
      <button onClick={() => scroll(dir)} disabled={!enabled} style={{
        position:'absolute', top:'50%', transform:'translateY(-50%)',
        [dir === -1 ? 'left' : 'right']: -18,
        width:36, height:36, borderRadius:'50%', zIndex:10,
        display:'flex', alignItems:'center', justifyContent:'center',
        background: enabled ? 'rgba(10,10,10,0.92)' : 'rgba(10,10,10,0.4)',
        border: `1px solid ${enabled ? 'rgba(14,165,233,0.35)' : 'rgba(14,165,233,0.1)'}`,
        color: enabled ? TEAL : 'rgba(14,165,233,0.2)',
        cursor: enabled ? 'pointer' : 'default',
        fontFamily:FONT, fontSize:'1rem', fontWeight:700,
        backdropFilter:'blur(8px)',
        boxShadow: enabled ? '0 4px 16px rgba(0,0,0,0.6)' : 'none',
        transition:'all 0.15s',
      }}
      onMouseEnter={e => { if (enabled) e.currentTarget.style.background='rgba(14,165,233,0.15)' }}
      onMouseLeave={e => { if (enabled) e.currentTarget.style.background='rgba(10,10,10,0.92)' }}
      >
        {dir === -1 ? '‹' : '›'}
      </button>
    )
  }

  return (
    <div style={{ position:'relative', margin:'0 20px', marginBottom:0 }}>
      <Arrow dir={-1} />
      <div ref={rowRef} onScroll={update} style={{
        display:'flex', gap:14, overflowX:'auto', paddingBottom:8,
        scrollbarWidth:'none', msOverflowStyle:'none',
        scrollSnapType:'x mandatory', WebkitOverflowScrolling:'touch',
      }}>
        {children}
      </div>
      <Arrow dir={1} />
      {canLeft  && <div style={{ position:'absolute', top:0, left:0, bottom:8, width:40, pointerEvents:'none', background:'linear-gradient(to right, #070b12, transparent)' }}/>}
      {canRight && <div style={{ position:'absolute', top:0, right:0, bottom:8, width:40, pointerEvents:'none', background:'linear-gradient(to left, #070b12, transparent)' }}/>}
    </div>
  )
}

// ── Popular card ──────────────────────────────────────────────
function PopCard({ game, rank }) {
  const nav = useNavigate()
  const [hov, setHov] = useState(false)
  const isSleeper = game.badge === ' Sleeper Hit'
  const isTop3    = rank <= 3
  const border = isTop3 ? 'rgba(14,165,233,0.45)' : isSleeper ? 'rgba(179,157,219,0.35)' : game.steamTrending ? 'rgba(14,165,233,0.25)' : 'rgba(255,255,255,0.05)'
  return (
    <div onClick={() => nav('/game/' + game.id)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width:138, borderRadius:14, overflow:'hidden', cursor:'pointer', flexShrink:0,
        border:`1px solid ${hov ? 'rgba(14,165,233,0.55)' : border}`,
        transform: hov ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hov ? '0 16px 40px rgba(14,165,233,0.12)' : 'none',
        transition:'all 0.22s cubic-bezier(.4,0,.2,1)', position:'relative',
        scrollSnapAlign:'start',
      }}>
      <img src={game.cover || PLACEHOLDER} alt={game.title}
           style={{ width:'100%', aspectRatio:'3/4', objectFit:'cover', display:'block' }}
           onError={e => e.target.src = PLACEHOLDER} />
      <div style={{ position:'absolute', top:7, left:8, fontFamily:FONT,
                    fontWeight:900, fontSize:'2rem', color:TEAL, lineHeight:1,
                    textShadow:'0 2px 20px rgba(14,165,233,0.7)' }}>#{rank}</div>
      {game.badge && (
        <div style={{
          position:'absolute', top:7, right:6,
          background: isSleeper ? 'rgba(179,157,219,0.2)' : 'rgba(14,165,233,0.12)',
          border: isSleeper ? '1px solid rgba(179,157,219,0.4)' : '1px solid rgba(14,165,233,0.35)',
          color: isSleeper ? '#6366f1' : TEAL,
          fontSize:'0.42rem', fontWeight:800, padding:'2px 5px', borderRadius:4,
          letterSpacing:'0.08em', fontFamily:FONT, whiteSpace:'nowrap',
        }}>{game.badge}</div>
      )}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'32px 10px 10px',
                    background:'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.7) 60%, transparent 100%)' }}>
        <div style={{ fontFamily:FONT, fontSize:'0.76rem', fontWeight:800, color:TEAL,
                      lineHeight:1.2, overflow:'hidden', display:'-webkit-box',
                      WebkitLineClamp:2, WebkitBoxOrient:'vertical', marginBottom:5 }}>
          {game.title}
        </div>
        {game.playsLabel && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontFamily:FONT, fontSize:'0.58rem', color:'rgba(14,165,233,0.55)',
                          display:'flex', alignItems:'center', gap:3 }}>
              <span></span>
              <span style={{ fontWeight:700 }}>{game.playsLabel}</span>
              <span style={{ opacity:0.6 }}>/ mo</span>
            </div>
            {game.entriesLabel && (
              <div style={{ fontFamily:FONT, fontSize:'0.55rem', color:'rgba(14,165,233,0.4)',
                            display:'flex', alignItems:'center', gap:2 }}>
                <span></span><span style={{ fontWeight:700 }}>{game.entriesLabel}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Requiem hero ──────────────────────────────────────────────
function RequiemHero({ game }) {
  const nav = useNavigate()
  if (!game) return null
  return (
    <div onClick={() => game.igdb_id && nav('/game/' + game.igdb_id)}
      style={{ cursor:'pointer', marginBottom:36, borderRadius:16, overflow:'hidden',
               border:'1px solid rgba(14,165,233,0.15)', background:'#0c1422', position:'relative' }}
      onMouseEnter={e => e.currentTarget.style.borderColor='rgba(14,165,233,0.3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor='rgba(14,165,233,0.15)'}>
      {game.cover_url && (
        <div style={{ position:'absolute', inset:0, backgroundImage:`url(${game.cover_url})`,
                      backgroundSize:'cover', backgroundPosition:'center',
                      filter:'blur(40px) brightness(0.12)', transform:'scale(1.1)' }}/>
      )}
      <div style={{ position:'relative', display:'flex', gap:24, padding:'28px 32px', alignItems:'center' }}>
        {game.cover_url && (
          <img src={game.cover_url} alt={game.title} style={{ width:100, borderRadius:10, flexShrink:0,
            boxShadow:'0 8px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(14,165,233,0.15)' }}
            onError={e => e.target.style.display='none'} />
        )}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:FONT, fontSize:'0.55rem', fontWeight:800, letterSpacing:'0.2em',
                        textTransform:'uppercase', color:'rgba(14,165,233,0.4)', marginBottom:8 }}>
            Recently Finished
          </div>
          <div style={{ fontFamily:FONT, fontWeight:900, fontSize:'1.7rem', letterSpacing:'-0.03em',
                        color:TEAL, lineHeight:1.1, marginBottom:8 }}>{game.title}</div>
          {game.rating > 0 && (
            <div style={{ display:'flex', gap:2, marginBottom:10 }}>
              {[1,2,3,4,5].map(n => (
                <span key={n} style={{ fontSize:'1rem', color: n <= game.rating ? TEAL : 'rgba(14,165,233,0.15)' }}>★</span>
              ))}
            </div>
          )}
          {game.review && (
            <p style={{ fontFamily:FONT, fontSize:'0.8rem', lineHeight:1.6,
                        color:'rgba(14,165,233,0.5)', fontStyle:'italic', maxWidth:460,
                        borderLeft:'2px solid rgba(14,165,233,0.2)', paddingLeft:12 }}>
              "{game.review.slice(0,130)}{game.review.length > 130 ? '…' : ''}"
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Nav sidebar ───────────────────────────────────────────────
function Sidebar({ user }) {
  const nav = useNavigate()
  const QUICK = [
    { icon:'›', label:'Trending',      sub:'This week on PQ',              to:'/trending',     auth:false },
    { icon:'·', label:'For You',       sub:'Your picks',                   to:'/for-you',      auth:true  },
    { icon:'·', label:'Achievements',  sub:'Milestones',                   to:'/achievements', auth:true  },
    { icon:'·', label:'Year in Review',sub:String(new Date().getFullYear()),to:'/year-review',  auth:true  },
    { icon:'·', label:'Challenges',    sub:'Goals',                        to:'/challenges',   auth:false },
    { icon:'·', label:'Activity',      sub:'Community feed',               to:'/activity',     auth:false },
    { icon:'·', label:'Lists',         sub:'Collections',                  to:'/lists',        auth:false },
    { icon:'·', label:'News',          sub:'Latest',                       to:'/news',         auth:false },
  ]
  return (
    <aside style={{ width:180, flexShrink:0 }} className="hidden lg:block sticky top-20 self-start">
      <div style={{ background:'#0f1c2e', border:'1px solid rgba(14,165,233,0.08)',
                    borderRadius:14, overflow:'hidden', marginBottom:12 }}>
        <div style={{ padding:'10px 14px 8px', borderBottom:'1px solid rgba(14,165,233,0.06)',
                      fontFamily:FONT, fontSize:'0.55rem', fontWeight:800,
                      letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(14,165,233,0.3)' }}>
          Discover
        </div>
        {QUICK.map(({ icon, label, sub, to, auth }) => {
          if (auth && !user) return null
          return (
            <button key={to} onClick={() => nav(to)} style={{
              width:'100%', display:'flex', alignItems:'center', gap:10,
              padding:'9px 14px', textAlign:'left', background:'transparent',
              border:'none', borderBottom:'1px solid rgba(14,165,233,0.04)',
              cursor:'pointer', transition:'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(14,165,233,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <span style={{ fontSize:15 }}>{icon}</span>
              <div style={{ minWidth:0 }}>
                <div style={{ fontFamily:FONT, fontSize:'0.76rem', fontWeight:600,
                              color:'rgba(14,165,233,0.75)', whiteSpace:'nowrap',
                              overflow:'hidden', textOverflow:'ellipsis' }}>{label}</div>
                <div style={{ fontFamily:FONT, fontSize:'0.58rem', color:'rgba(14,165,233,0.28)' }}>{sub}</div>
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ marginBottom:10 }}>
        <MemberSearch placeholder="Find friends…" compact={true} />
      </div>
      <WhoToFollow compact={true} />

      {user && (
        <div style={{ background:'#0f1c2e', border:'1px solid rgba(14,165,233,0.08)',
                      borderRadius:14, padding:'10px 0', marginTop:10 }}>
          {[['·','Diary','/diary'],['·','Library','/library'],['·','Dashboard','/dashboard']].map(([ico,lbl,to]) => (
            <button key={to} onClick={() => nav(to)} style={{
              width:'100%', display:'flex', alignItems:'center', gap:9,
              padding:'8px 14px', background:'transparent', border:'none',
              cursor:'pointer', transition:'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(14,165,233,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <span style={{ fontSize:13 }}>{ico}</span>
              <span style={{ fontFamily:FONT, fontSize:'0.74rem', fontWeight:600, color:'rgba(14,165,233,0.6)' }}>{lbl}</span>
              <span style={{ marginLeft:'auto', fontSize:'0.65rem', color:'rgba(14,165,233,0.2)' }}>→</span>
            </button>
          ))}
        </div>
      )}
    </aside>
  )
}

// ── Main Home ─────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuthStore()
  const nav = useNavigate()
  const { data: trending,    loading: tl } = useSection('trending')
  const { data: recent,      loading: rl } = useSection('recent')
  const { data: anticipated, loading: al } = useSection('anticipated')
  const [updatedAt,  setUpdatedAt]  = useState(null)
  const [reviews,    setReviews]    = useState([])
  const [friendFeed, setFriendFeed] = useState([])
  const [lastPlayed, setLastPlayed] = useState(null)
  const [news,       setNews]       = useState([])
  const [myLikes,    setMyLikes]    = useState(new Set())

  useEffect(() => { if (trending?.length) setUpdatedAt(new Date()) }, [trending])

  useEffect(() => {
    getRecentReviews(8).then(setReviews)
    getMyLikes().then(setMyLikes)
    fetch((import.meta.env.VITE_API_URL || 'https://playquiem.onrender.com') + '/api/news?limit=9')
      .then(r => r.json()).then(setNews).catch(() => {})
    if (user) {
      getFriendFeed().then(setFriendFeed)
      getMyLogs().then(logs => {
        const finished = logs.find(l => l.status === 'Played' && l.rating >= 1)
        if (finished) setLastPlayed(finished)
      })
    }
  }, [user])

  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'76px 0 60px' }}>

      {/* Left ad (xl+) */}
      <div className="hidden xl:block" style={{ width:160, flexShrink:0, padding:'76px 10px 0' }}>
        <AdSlot />
      </div>

      {/* Center: sidebar + content */}
      <div style={{ flex:1, maxWidth:1140, minWidth:0, padding:'0 20px', display:'flex', gap:24, alignItems:'flex-start' }}>

        <Sidebar user={user} />

        {/* Main content */}
        <div style={{ flex:1, minWidth:0 }}>

          {/* Requiem hero */}
          {user && lastPlayed && <RequiemHero game={lastPlayed} />}

          {/* Hero banner */}
          {(!user || !lastPlayed) && (
            <div style={{ borderRadius:20, border:'1px solid rgba(14,165,233,0.12)',
                          background:'linear-gradient(135deg, #0c1422 0%, #0f1c2e 100%)',
                          padding:'36px 40px', marginBottom:36, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, right:0, width:280, height:280,
                            background:'radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)',
                            transform:'translate(30%,-30%)' }}/>
              {user ? (
                <>
                  <p style={{ fontFamily:FONT, fontSize:'0.6rem', fontWeight:800, letterSpacing:'0.2em',
                              textTransform:'uppercase', color:'rgba(14,165,233,0.4)', marginBottom:10 }}>Welcome back</p>
                  <h1 style={{ fontFamily:FONT, fontWeight:900, fontSize:'2.2rem', letterSpacing:'-0.03em',
                              color:TEAL, lineHeight:1.1, marginBottom:8 }}>What will you play today?</h1>
                  <p style={{ fontFamily:FONT, fontSize:'0.85rem', color:'rgba(14,165,233,0.4)' }}>Log a game to see your Requiem here.</p>
                </>
              ) : (
                <>
                  <p style={{ fontFamily:FONT, fontSize:'0.6rem', fontWeight:800, letterSpacing:'0.2em',
                              textTransform:'uppercase', color:'rgba(14,165,233,0.35)', marginBottom:10 }}>A diary for the games you love</p>
                  <h1 style={{ fontFamily:FONT, fontWeight:900, fontSize:'2.4rem', letterSpacing:'-0.03em',
                              color:TEAL, lineHeight:1.1, marginBottom:12 }}>Playquiem.</h1>
                  <p style={{ fontFamily:FONT, fontSize:'0.85rem', color:'rgba(14,165,233,0.45)', marginBottom:20, maxWidth:420 }}>
                    Track every game. Write your requiem. Share your journey.
                  </p>
                  <button onClick={() => nav('/auth')} style={{
                    background:TEAL, color:'#070b12', fontFamily:FONT,
                    fontWeight:800, fontSize:'0.8rem', padding:'10px 22px',
                    borderRadius:10, border:'none', cursor:'pointer', letterSpacing:'0.04em',
                  }}>GET STARTED →</button>
                </>
              )}
            </div>
          )}

          {/* Popular Right Now */}
          <Section title="Popular Right Now"
            badge="Trending This Month"
            sub={updatedAt ? `Monthly Top 20 · updated ${updatedAt.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})}` : 'Monthly Top 20 · 1h cache'}>
            <HScrollRow>
              {tl
                ? Array.from({length:20}).map((_,i) => (
                    <div key={i} style={{ width:138, flexShrink:0, borderRadius:14, overflow:'hidden',
                                          background:'#0f1c2e', border:'1px solid rgba(14,165,233,0.05)', scrollSnapAlign:'start' }}>
                      <div className="shimmer" style={{ aspectRatio:'3/4' }}/>
                    </div>
                  ))
                : trending.map((g,i) => (
                    <div key={g.id} style={{ scrollSnapAlign:'start', flexShrink:0 }}>
                      <PopCard game={g} rank={i+1}/>
                    </div>
                  ))
              }
            </HScrollRow>
          </Section>

          <Divider label="Recently Released" />

          {/* Recently Released */}
          <Section title="Recently Released" sub="Last 30 days">
            <HScrollRow>
              {rl
                ? Array.from({length:8}).map((_,i) => (
                    <div key={i} style={{ flexShrink:0, scrollSnapAlign:'start' }}>
                      <SkeletonCard/>
                    </div>
                  ))
                : recent.map(g => (
                    <div key={g.id} style={{ flexShrink:0, scrollSnapAlign:'start' }}>
                      <GameCard game={g}/>
                    </div>
                  ))
              }
            </HScrollRow>
          </Section>

          <Divider label="Coming Soon" />

          {/* Coming Soon */}
          <Section title="Coming Soon" sub="Live countdowns to most anticipated releases">
            <UpcomingCountdown games={anticipated} loading={al} />
          </Section>

          <Divider label="Friend Activity" />

          {/* Friend Feed */}
          {user && friendFeed.length > 0 && (
            <Section title="Friend Activity" sub="From people you follow">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
                {friendFeed.slice(0,5).map((rv,i) => (
                  <div key={i} style={{ background:'#0f1c2e', border:'1px solid rgba(14,165,233,0.07)', borderRadius:12, padding:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0,
                                    background:'linear-gradient(135deg,#0ea5e9,rgba(14,165,233,0.3))',
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    fontSize:'0.65rem', fontWeight:800, color:'#070b12' }}>
                        {(rv.display_name||rv.username||'?')[0].toUpperCase()}
                      </div>
                      <span style={{ fontFamily:FONT, fontSize:'0.72rem', fontWeight:700, color:'rgba(14,165,233,0.7)',
                                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>@{rv.username}</span>
                    </div>
                    <div style={{ fontFamily:FONT, fontSize:'0.76rem', fontWeight:700, color:TEAL,
                                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{rv.title}</div>
                    <div style={{ color:TEAL, fontSize:'0.75rem', marginTop:4 }}>
                      {'★'.repeat(rv.rating||0)}<span style={{ color:'rgba(14,165,233,0.2)' }}>{'★'.repeat(5-(rv.rating||0))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Divider label="Community" />

          {/* Trending on Playquiem */}
          <Section title="Trending on Playquiem" sub="Real community data · refreshed every 15 min">
            <CommunityTrending />
          </Section>

          <Divider label="Community Reviews" />

          {/* Community Reviews */}
          <Section title="Community Reviews" sub="Fresh takes from real players">
            {reviews.length === 0
              ? <EmptyState icon="" title="No reviews yet" subtitle="Log a game and write the first review!"/>
              : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
                  {reviews.map(r => <ReviewCard key={r.id} review={r} liked={myLikes.has(r.id)}/>)}
                </div>
              )
            }
          </Section>

          <Divider label="Game News" />

          {/* Game News */}
          <Section title="Game News" sub="IGN · Eurogamer · PC Gamer · RPS · Kotaku">
            {news.length === 0 ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
                {Array.from({length:6}).map((_,i) => (
                  <div key={i} style={{ borderRadius:12, overflow:'hidden', background:'#0f1c2e', border:'1px solid rgba(14,165,233,0.06)' }}>
                    <div className="shimmer" style={{ height:140 }}/>
                    <div style={{ padding:14 }}>
                      <div className="shimmer" style={{ height:10, borderRadius:4, marginBottom:8, width:'60%' }}/>
                      <div className="shimmer" style={{ height:13, borderRadius:4 }}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
                {news.map((a,i) => (
                  <a key={i} href={a.link} target="_blank" rel="noopener noreferrer"
                    style={{ display:'block', textDecoration:'none', background:'#0f1c2e',
                              border:'1px solid rgba(14,165,233,0.07)', borderRadius:12, overflow:'hidden',
                              transition:'border-color 0.15s, transform 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(14,165,233,0.22)';e.currentTarget.style.transform='translateY(-3px)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(14,165,233,0.07)';e.currentTarget.style.transform='translateY(0)'}}>
                    {a.thumb && <img src={a.thumb} alt={a.title} style={{ width:'100%', height:140, objectFit:'cover', display:'block' }} onError={e=>e.target.style.display='none'}/>}
                    <div style={{ padding:14 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                        <span style={{ fontFamily:FONT, fontSize:'0.56rem', fontWeight:800, letterSpacing:'0.14em',
                                        padding:'2px 7px', borderRadius:4, background:'rgba(14,165,233,0.08)',
                                        border:'1px solid rgba(14,165,233,0.2)', color:TEAL }}>{a.source}</span>
                        <span style={{ fontSize:'0.58rem', color:'rgba(14,165,233,0.25)', fontFamily:FONT }}>{a.pubDate?.slice(5,16)}</span>
                      </div>
                      <div style={{ fontFamily:FONT, fontWeight:700, fontSize:'0.82rem', lineHeight:1.4, color:TEAL,
                                    marginBottom:6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{a.title}</div>
                      {a.summary && (
                        <div style={{ fontFamily:FONT, fontSize:'0.7rem', lineHeight:1.55, color:'rgba(14,165,233,0.38)',
                                      display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{a.summary}</div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </Section>

        </div>
      </div>

      {/* Right ad (xl+) */}
      <div className="hidden xl:block" style={{ width:160, flexShrink:0, padding:'76px 10px 0' }}>
        <AdSlot />
      </div>

    </div>
  )
}
