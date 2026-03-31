import { useState, useEffect } from 'react'
import { ArrowLeft, Play, Plus, Check } from '@phosphor-icons/react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGame } from '../hooks/useGames'
import { GameCard, Spinner, ReviewCard } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { isLogged, getGameReviews, getMyLikes } from '../lib/db'
import LogModal from '../components/LogModal'

const T = '#0ea5e9'
const FONT = '"Helvetica Neue",Helvetica,Arial,sans-serif'
const PH = 'https://placehold.co/264x352/0a0a0a/94F5D8?text='

// ── Score ring ────────────────────────────────────────────────
function ScoreRing({ value, label }) {
  if (!value) return null
  const v   = Math.round(value)
  const col = v >= 75 ? '#2dc653' : v >= 55 ? '#f5c518' : '#e84545'
  const r   = 26, circ = 2 * Math.PI * r
  const fill = circ * (1 - v / 100)
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <div style={{ position:'relative', width:66, height:66 }}>
        <svg width="66" height="66" style={{ transform:'rotate(-90deg)' }}>
          <circle cx="33" cy="33" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5"/>
          <circle cx="33" cy="33" r={r} fill="none" stroke={col} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={fill}
            strokeLinecap="round" style={{ transition:'stroke-dashoffset 1s ease' }}/>
        </svg>
        <div style={{
          position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:FONT, fontWeight:900, fontSize:'1.1rem', color:col,
        }}>{v}</div>
      </div>
      <div style={{ fontFamily:FONT, fontSize:'0.58rem', fontWeight:700,
                    letterSpacing:'0.1em', textTransform:'uppercase',
                    color:'rgba(14,165,233,0.4)' }}>{label}</div>
    </div>
  )
}

// ── Tag chip ──────────────────────────────────────────────────
function Tag({ label, color=T, bg='rgba(14,165,233,0.08)' }) {
  return (
    <span style={{
      fontSize:'0.7rem', padding:'4px 12px', borderRadius:20,
      background:bg, border:`1px solid ${color}33`,
      color, fontFamily:FONT, fontWeight:600, whiteSpace:'nowrap',
    }}>{label}</span>
  )
}

// ── Screenshot grid ───────────────────────────────────────────
function Screenshots({ shots }) {
  const [active, setActive] = useState(0)
  if (!shots?.length) return null
  return (
    <div style={{ marginBottom:36 }}>
      <SectionTitle>Screenshots</SectionTitle>
      {/* Main */}
      <div style={{ borderRadius:14, overflow:'hidden', marginBottom:10,
                    border:'1px solid rgba(14,165,233,0.08)', aspectRatio:'16/9' }}>
        <img src={shots[active]} alt="screenshot"
             style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
             onError={e=>e.target.style.display='none'}/>
      </div>
      {/* Thumbs */}
      {shots.length > 1 && (
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
          {shots.map((s,i) => (
            <img key={i} src={s} alt={`thumb ${i}`}
                 onClick={() => setActive(i)}
                 style={{
                   width:80, height:52, objectFit:'cover', borderRadius:8, flexShrink:0,
                   cursor:'pointer', opacity: i===active ? 1 : 0.45,
                   border: `1px solid ${i===active ? T : 'transparent'}`,
                   transition:'opacity 0.15s, border-color 0.15s',
                 }}
                 onError={e=>e.target.style.display='none'}/>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Section title ─────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12, marginBottom:16,
    }}>
      <h2 style={{
        fontFamily:FONT, fontWeight:800, fontSize:'0.68rem',
        letterSpacing:'0.16em', textTransform:'uppercase',
        color:'rgba(14,165,233,0.4)', margin:0,
      }}>{children}</h2>
      <div style={{ flex:1, height:1, background:'rgba(14,165,233,0.08)' }}/>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function GameDetail() {
  const { id }  = useParams()
  const nav     = useNavigate()
  const { user } = useAuthStore()
  const { game, loading, error } = useGame(Number(id))
  const [logged,  setLogged]  = useState(false)
  const [reviews, setReviews] = useState([])
  const [logOpen,  setLogOpen]  = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [myLikes,  setMyLikes]  = useState(new Set())

  useEffect(() => {
    if (!game) return
    if (user) {
      isLogged(game.id).then(setLogged)
      getMyLikes().then(setMyLikes)
    }
    getGameReviews(game.title).then(setReviews)
    setImgLoaded(false)
  }, [game?.id, user])

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center',
                  minHeight:'100vh', background:'#070b12' }}>
      <Spinner size="lg"/>
    </div>
  )
  if (error || !game) return (
    <div style={{ textAlign:'center', paddingTop:120, color:'rgba(14,165,233,0.4)', fontFamily:FONT }}>
      Game not found
    </div>
  )

  // Best background — artwork first, then first screenshot, then cover
  const bgImage = game.screenshots?.[0] || game.artworks?.[0] || game.cover || ''
  const releaseYear = game.year || ''

  return (
    <div style={{ background:'#070b12', minHeight:'100vh' }}>

      {/* ═══ LETTERBOXD-STYLE FULL-WIDTH BANNER ═══ */}
      <div style={{ position:'relative', overflow:'hidden' }}>

        {/* Full-width artwork — edge to edge, no blur */}
        <div style={{ position:'relative', width:'100%', height:480, overflow:'hidden' }}>
          {bgImage ? (
            <img src={bgImage} alt="banner" style={{
              width:'100%', height:'100%', objectFit:'cover',
              objectPosition:'center 25%', display:'block',
              filter: 'brightness(0.75) saturate(1.2)',
            }} onError={e => {
              // fallback to cover if screenshot fails
              if (game.cover && e.target.src !== game.cover) {
                e.target.src = game.cover
                e.target.style.filter = 'brightness(0.5) saturate(1.4) blur(8px)'
                e.target.style.transform = 'scale(1.08)'
              } else {
                e.target.style.display = 'none'
              }
            }}/>
          ) : (
            <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#0f1c2e,#142236)' }}/>
          )}
          {/* Extra dark overlay for games without wide screenshots */}
          <div style={{
            position:'absolute', inset:0,
            background:'rgba(7,11,18,0.35)',
          }}/>
          {/* Gradient fades */}
          <div style={{
            position:'absolute', bottom:0, left:0, right:0, height:'85%',
            background:'linear-gradient(to top, #070b12 0%, rgba(7,11,18,0.92) 35%, rgba(7,11,18,0.4) 70%, transparent 100%)',
          }}/>
          <div style={{
            position:'absolute', inset:0,
            background:'linear-gradient(to right, rgba(7,11,18,0.7) 0%, rgba(7,11,18,0.2) 50%, transparent 100%)',
          }}/>
          {/* Back button */}
          <button onClick={() => nav(-1)} style={{
            position:'absolute', top:88, left:28, zIndex:10,
            background:'rgba(7,11,18,0.65)', backdropFilter:'blur(12px)',
            border:'1px solid rgba(14,165,233,0.2)',
            borderRadius:8, padding:'6px 14px', cursor:'pointer',
            fontFamily:FONT, fontSize:'0.75rem', color:'rgba(14,165,233,0.7)',
            display:'inline-flex', alignItems:'center', gap:6, transition:'all 0.15s',
          }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(14,165,233,0.15)';e.currentTarget.style.color='#0ea5e9'}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(7,11,18,0.65)';e.currentTarget.style.color='rgba(14,165,233,0.7)'}}>
            <ArrowLeft size={14}/> Back
          </button>
        </div>

        {/* Cover + Info overlaid on banner bottom */}
        <div style={{
          position:'relative', marginTop:-200, zIndex:5,
          padding:'0 32px 40px',
          display:'flex', gap:28, alignItems:'flex-end', flexWrap:'wrap',
        }}>
          {/* Cover */}
          <div style={{ flexShrink:0, position:'relative' }}>
            <img src={game.cover || PH} alt={game.title}
              onLoad={() => setImgLoaded(true)}
              onError={e => e.target.src = PH}
              style={{
                width:190, borderRadius:12, display:'block',
                boxShadow:'0 32px 80px rgba(0,0,0,0.95), 0 0 0 2px rgba(14,165,233,0.2)',
                opacity: imgLoaded ? 1 : 0, transition:'opacity 0.4s ease',
              }}
            />
            {logged && (
              <div style={{
                position:'absolute', bottom:-10, left:'50%', transform:'translateX(-50%)',
                background:'#2dc653', color:'#070b12',
                fontFamily:FONT, fontWeight:800, fontSize:'0.6rem',
                padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap',
              }}>LOGGED</div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex:1, minWidth:260, paddingBottom:4 }}>
            {game.franchise && (
              <div style={{
                fontFamily:FONT, fontSize:'0.62rem', fontWeight:800,
                letterSpacing:'0.2em', textTransform:'uppercase',
                color:'rgba(14,165,233,0.55)', marginBottom:6,
              }}>{game.franchise}</div>
            )}
            <h1 style={{
              fontFamily:FONT, fontWeight:900,
              fontSize:'clamp(2rem, 5vw, 3.5rem)',
              letterSpacing:'-0.03em', lineHeight:1,
              color:'#ffffff', margin:'0 0 8px',
              textShadow:'0 2px 24px rgba(0,0,0,0.9)',
            }}>{game.title}</h1>
            <div style={{
              fontFamily:FONT, fontSize:'0.85rem',
              color:'rgba(255,255,255,0.5)', marginBottom:14,
              display:'flex', gap:8, flexWrap:'wrap', alignItems:'center',
            }}>
              {releaseYear && <span>{releaseYear}</span>}
              {game.developers?.[0] && <><span style={{opacity:0.4}}>·</span><span>{game.developers[0]}</span></>}
              {game.publishers?.[0] && game.publishers[0] !== game.developers?.[0] && (
                <><span style={{opacity:0.4}}>·</span><span style={{opacity:0.7}}>{game.publishers[0]}</span></>
              )}
            </div>

            {/* Score rings */}
            <div style={{ display:'flex', gap:20, marginBottom:14, flexWrap:'wrap' }}>
              <ScoreRing value={game.rating}      label="IGDB Users"/>
              <ScoreRing value={game.criticScore} label="Critics"/>
              {reviews.length > 0 && (
                <ScoreRing
                  value={reviews.reduce((s,r)=>s+(r.rating||0),0)/reviews.length*20}
                  label="Playquiem"
                />
              )}
            </div>

            {/* Tags */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:18 }}>
              {game.genres?.map(g => <Tag key={g} label={g}/>)}
              {game.gameModes?.slice(0,2).map(m => (
                <Tag key={m} label={m} color="#2dc653" bg="rgba(45,198,83,0.08)"/>
              ))}
              {game.platforms?.slice(0,3).map(p => (
                <Tag key={p} label={p} color="#6366f1" bg="rgba(99,102,241,0.08)"/>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
              {user ? (
                logged ? (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:8,
                                fontFamily:FONT, fontSize:'0.85rem', fontWeight:700, color:'#2dc653' }}>
                    <Check size={16} weight="bold"/> In your library
                  </div>
                ) : (
                  <button onClick={() => setLogOpen(true)} style={{
                    background:'#0ea5e9', color:'#070b12', border:'none', borderRadius:10,
                    fontFamily:FONT, fontWeight:900, fontSize:'0.88rem',
                    padding:'11px 26px', cursor:'pointer', letterSpacing:'0.03em',
                    boxShadow:'0 8px 32px rgba(14,165,233,0.3)', transition:'all 0.15s',
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 14px 40px rgba(14,165,233,0.45)'}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 8px 32px rgba(14,165,233,0.3)'}}>
                    <Plus size={16} weight="bold"/> Log this Game
                  </button>
                )
              ) : (
                <button onClick={() => nav('/auth')} style={{
                  background:'transparent', color:'#0ea5e9', cursor:'pointer',
                  border:'1px solid rgba(14,165,233,0.35)', borderRadius:10,
                  fontFamily:FONT, fontWeight:700, fontSize:'0.85rem',
                  padding:'10px 22px', transition:'background 0.15s',
                }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(14,165,233,0.1)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  Sign in to log
                </button>
              )}
              {game.videos?.length > 0 && (
                <a href={`https://youtube.com/watch?v=${game.videos[0].id}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display:'inline-flex', alignItems:'center', gap:7,
                    padding:'10px 18px', borderRadius:10, textDecoration:'none',
                    background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)',
                    fontFamily:FONT, fontWeight:700, fontSize:'0.82rem', color:'rgba(255,255,255,0.8)',
                    transition:'all 0.15s',
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'}>
                  <Play size={13} weight="fill"/> Trailer
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'40px 32px 60px' }}>

        {/* Summary */}
        {game.summary && (
          <div style={{ marginBottom:40 }}>
            <SectionTitle>About</SectionTitle>
            <p style={{
              fontFamily:FONT, fontSize:'0.92rem', lineHeight:1.8,
              color:'rgba(14,165,233,0.6)',
              borderLeft:`2px solid rgba(14,165,233,0.18)`, paddingLeft:18,
              maxWidth:720,
            }}>{game.summary}</p>
          </div>
        )}

        {/* Two column: meta + screenshots */}
        <div style={{ display:'grid', gridTemplateColumns:'minmax(200px,280px) 1fr', gap:32, marginBottom:40 }}>

          {/* Meta panel */}
          <div style={{
            background:'rgba(14,165,233,0.03)',
            border:'1px solid rgba(14,165,233,0.08)',
            borderRadius:16, padding:'20px 22px',
            alignSelf:'start',
          }}>
            <SectionTitle>Details</SectionTitle>
            {[
              ['Released',   game.released],
              ['Developer',  game.developers?.join(', ')],
              ['Publisher',  game.publishers?.join(', ')],
              ['Franchise',  game.franchise],
              ['Hype score', game.hypes > 0 ? `${game.hypes.toLocaleString()} wishlisted` : null],
              ['Followers',  game.follows > 0 ? `${game.follows.toLocaleString()} on IGDB` : null],
            ].filter(([,v]) => v).map(([label, value]) => (
              <div key={label} style={{
                display:'flex', flexDirection:'column', gap:2,
                padding:'9px 0', borderBottom:'1px solid rgba(14,165,233,0.05)',
              }}>
                <span style={{ fontFamily:FONT, fontSize:'0.58rem', fontWeight:800,
                                letterSpacing:'0.1em', textTransform:'uppercase',
                                color:'rgba(14,165,233,0.3)' }}>{label}</span>
                <span style={{ fontFamily:FONT, fontSize:'0.82rem', fontWeight:500,
                                color:'rgba(14,165,233,0.75)' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Screenshots */}
          <div>
            <Screenshots shots={game.screenshots}/>

            {/* Videos */}
            {game.videos?.length > 0 && (
              <div style={{ marginBottom:24 }}>
                <SectionTitle>Trailer</SectionTitle>
                <div style={{ borderRadius:14, overflow:'hidden',
                              border:'1px solid rgba(14,165,233,0.08)', aspectRatio:'16/9' }}>
                  <iframe width="100%" height="100%"
                    src={`https://www.youtube.com/embed/${game.videos[0].id}?rel=0`}
                    frameBorder="0" allowFullScreen
                    style={{ display:'block' }}/>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Community Reviews */}
        {reviews.length > 0 && (
          <div style={{ marginBottom:40 }}>
            <SectionTitle>Playquiem Reviews ({reviews.length})</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
              {reviews.map(r => <ReviewCard key={r.id} review={r} liked={myLikes.has(r.id)}/>)}
            </div>
          </div>
        )}

        {/* Similar Games */}
        {game.similar?.length > 0 && (
          <div>
            <SectionTitle>You Might Also Like</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:14 }}>
              {game.similar.slice(0,6).map(g => <GameCard key={g.id} game={g}/>)}
            </div>
          </div>
        )}

      </div>

      {/* Log modal */}
      {logOpen && (
        <LogModal game={game} onClose={() => setLogOpen(false)} onSaved={() => setLogged(true)}/>
      )}
    </div>
  )
}
