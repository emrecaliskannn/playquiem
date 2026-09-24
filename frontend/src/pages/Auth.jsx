import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Eye, EyeSlash } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase, API } from '../lib/supabase'
import toast from 'react-hot-toast'

const T    = 'var(--accent)'
const FONT = '"Helvetica Neue",Helvetica,Arial,sans-serif'

const BG_GAMES = [
  { url: 'https://images.igdb.com/igdb/image/upload/t_720p/ar4va2.webp',  title: '' },
  { url: 'https://images.igdb.com/igdb/image/upload/t_720p/ar3qmt.webp',  title: '' },
  { url: 'https://images.igdb.com/igdb/image/upload/t_720p/ar3m5u.webp',  title: '' },
  { url: 'https://images.igdb.com/igdb/image/upload/t_720p/ar3se9.webp',  title: '' },
  { url: 'https://images.igdb.com/igdb/image/upload/t_720p/ar4jgj.webp',  title: '' },
  { url: 'https://images.igdb.com/igdb/image/upload/t_720p/ar814.webp',   title: '' },
]

const inputStyle = {
  width: '100%', padding: '13px 16px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, outline: 'none',
  fontFamily: FONT, fontSize: '0.92rem',
  color: 'var(--text)', caretColor: 'var(--text)',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
}

const labelStyle = {
  fontFamily: FONT, fontSize: '0.6rem', fontWeight: 800,
  letterSpacing: '0.14em', textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 6,
}

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete, suffix, error }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
          onFocus={e => {
            e.target.style.borderColor = 'rgba(102,192,244,0.5)'
            e.target.style.boxShadow   = '0 0 0 3px rgba(102,192,244,0.08)'
          }}
          onBlur={e => {
            e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'
            e.target.style.boxShadow   = 'none'
          }}
          style={{ ...inputStyle, paddingRight: suffix ? 44 : 16,
            borderColor: error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)' }}
        />
        {suffix && (
          <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)' }}>
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <div style={{ fontFamily:FONT, fontSize:'0.7rem', color:'#f87171', marginTop:4 }}>{error}</div>
      )}
    </div>
  )
}

function PasswordField({ label, value, onChange, placeholder, autoComplete, error }) {
  const [show, setShow] = useState(false)
  return (
    <Field
      label={label} type={show ? 'text' : 'password'}
      value={value} onChange={onChange}
      placeholder={placeholder} autoComplete={autoComplete}
      error={error}
      suffix={
        <button type="button" onClick={() => setShow(s => !s)}
          style={{ background:'none', border:'none', cursor:'pointer',
                   color:'rgba(255,255,255,0.35)', padding:0, display:'flex' }}>
          {show ? <EyeSlash size={17}/> : <Eye size={17}/>}
        </button>
      }
    />
  )
}

export default function Auth() {
  const [tab,        setTab]        = useState('signin')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [username,   setUsername]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [bgIdx,      setBgIdx]      = useState(0)
  const [showPanel,  setShowPanel]  = useState(false)
  const [showWelcome,setShowWelcome]= useState(false)
  const [welcomeName,setWelcomeName]= useState('')
  const [usernameStatus, setUsernameStatus] = useState(null)
  const usernameTimer = useRef(null)

  const { signIn, signUp } = useAuthStore()
  const nav = useNavigate()

  useEffect(() => {
    const t = setInterval(() => setBgIdx(i => (i + 1) % BG_GAMES.length), 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!username || username.length < 3) { setUsernameStatus(null); return }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setUsernameStatus(null); return }
    setUsernameStatus('checking')
    clearTimeout(usernameTimer.current)
    usernameTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles').select('id').eq('username', username).single()
      setUsernameStatus(data ? 'taken' : 'available')
    }, 600)
  }, [username])

  const handleSignIn = async e => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      const data = await signIn(email, password)
      const name = data?.user?.user_metadata?.username || email.split('@')[0]
      setWelcomeName(name)
      setShowWelcome(true)
      setTimeout(() => nav('/'), 2000)
    } catch (err) {
      toast.error(err.message.includes('Invalid') ? 'Wrong email or password' : err.message)
    } finally { setLoading(false) }
  }

  const handleSignUp = async e => {
    e.preventDefault()
    if (!username || !email || !password || !confirm) return toast.error('Please fill in all fields')
    if (password !== confirm) return toast.error("Passwords don't match")
    if (password.length < 6)  return toast.error('Password must be at least 6 characters')
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return toast.error('Username: letters, numbers and _ only')
    if (usernameStatus === 'taken') return toast.error('Username already taken')
    setLoading(true)
    try {
      await signUp(email, password, username)
      setWelcomeName(username)
      setShowWelcome(true)
      setTimeout(() => nav('/'), 2000)
    } catch (err) {
      toast.error(err.message)
    } finally { setLoading(false) }
  }

  const handleReset = async e => {
    e.preventDefault()
    if (!resetEmail) return toast.error('Enter your email')
    setLoading(true)
    try {
      await supabase.auth.resetPasswordForEmail(resetEmail)
      toast.success('Reset email sent!')
      setTab('signin')
    } catch (err) {
      toast.error(err.message)
    } finally { setLoading(false) }
  }

  // Welcome screen
  if (showWelcome) return (
    <div style={{
      minHeight:'100vh', background:'var(--bg)',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      animation:'fadeIn 0.4s ease',
    }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}`}</style>
      <div style={{
        width:80, height:80, borderRadius:'50%',
        background:'rgba(102,192,244,0.1)',
        border:'2px solid rgba(102,192,244,0.4)',
        display:'flex', alignItems:'center', justifyContent:'center',
        marginBottom:24, fontSize:32,
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h1 style={{ fontFamily:FONT, fontWeight:900, fontSize:'2rem', color:'var(--text)', marginBottom:8 }}>
        Welcome, {welcomeName}!
      </h1>
      <p style={{ fontFamily:FONT, fontSize:'0.85rem', color:'rgba(255,255,255,0.4)' }}>
        Taking you to your dashboard...
      </p>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', position:'relative', overflow:'hidden' }}>

      <style>{`
        @keyframes heroFadeIn { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes panelSlide { from { opacity:0; transform:translateX(40px) } to { opacity:1; transform:translateX(0) } }
        .auth-cta:hover { background: rgba(102,192,244,0.18) !important; }
        .auth-signin:hover { background: rgba(102,192,244,1) !important; }
        @media (max-width: 640px) {
          .auth-bg { background-position: 60% center !important; }
        }
        @media (orientation: portrait) {
          .auth-bg { background-position: center 30% !important; }
        }
      `}</style>

      {/* Full-screen background slideshow */}
      {BG_GAMES.map((img, i) => (
        <div key={i} className="auth-bg" style={{
          position:'absolute', inset:0,
          backgroundImage:`url(${typeof img === 'string' ? img : img.url})`,
          backgroundSize:'cover',
          backgroundPosition:'center center',
          backgroundRepeat:'no-repeat',
          opacity: i === bgIdx ? 1 : 0,
          transition:'opacity 1.5s ease',
        }}/>
      ))}

      {/* Gradient overlays — mobilde daha yoğun */}
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }}/>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(9,9,15,1) 0%, rgba(9,9,15,0.6) 40%, rgba(9,9,15,0.2) 100%)' }}/>
      {/* Mobil için sağ/sol edge karartma */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(9,9,15,0.3) 0%, transparent 30%, transparent 70%, rgba(9,9,15,0.3) 100%)' }}/>

      {/* Image credit */}
      <div style={{
        position:'absolute', bottom:16, right:16,
        fontFamily:FONT, fontSize:'0.6rem', color:'rgba(255,255,255,0.2)',
        writingMode:'vertical-rl', letterSpacing:'0.08em',
      }}>
        {BG_GAMES[bgIdx]?.title}
      </div>

      {/* Top nav */}
      <div style={{
        position:'absolute', top:0, left:0, right:0,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'16px 20px', zIndex:10,
      }}>
        <span style={{ fontFamily:FONT, fontWeight:900, fontSize:'1.2rem', letterSpacing:'-0.03em', color:'var(--accent)' }}>
          Playquiem
        </span>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => { setTab('signin'); setShowPanel(true) }}
            style={{
              padding:'8px 14px', background:'transparent',
              border:'1px solid rgba(255,255,255,0.25)', borderRadius:8,
              fontFamily:FONT, fontWeight:700, fontSize:'0.75rem',
              color:'rgba(255,255,255,0.8)', cursor:'pointer',
              letterSpacing:'0.03em', transition:'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.6)'; e.currentTarget.style.color='#fff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.25)'; e.currentTarget.style.color='rgba(255,255,255,0.8)' }}>
            Sign In
          </button>
          <button onClick={() => { setTab('signup'); setShowPanel(true) }}
            style={{
              padding:'8px 14px',
              background:'var(--accent)',
              border:'1px solid transparent', borderRadius:8,
              fontFamily:FONT, fontWeight:700, fontSize:'0.75rem',
              color:'#0a0a0f', cursor:'pointer',
              letterSpacing:'0.03em',
            }}>
            Create Account
          </button>
        </div>
      </div>

      {/* Hero content */}
      {!showPanel && (
        <div style={{
          position:'relative', zIndex:5,
          minHeight:'100vh',
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'flex-end',
          paddingBottom:'12vh', paddingLeft:20, paddingRight:20,
          textAlign:'center',
          animation:'heroFadeIn 0.8s ease both',
        }}>
          <h1 style={{
            fontFamily:FONT, fontWeight:900,
            fontSize:'clamp(1.6rem, 5vw, 3.4rem)',
            lineHeight:1.2, letterSpacing:'-0.02em',
            color:'#fff', margin:'0 0 10px',
            textShadow:'0 2px 20px rgba(0,0,0,0.5)',
            maxWidth:680,
          }}>
            Log games you've played.<br/>
            Discover what to play next.<br/>
            Share with your friends.
          </h1>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', width:'100%', maxWidth:380 }}>
            <button
              onClick={() => { setTab('signup'); setShowPanel(true) }}
              style={{
                flex:1, minWidth:130, padding:'14px 24px',
                background:'var(--accent)',
                border:'none', borderRadius:10,
                fontFamily:FONT, fontWeight:900, fontSize:'0.9rem',
                color:'#0a0a0f', cursor:'pointer',
                letterSpacing:'0.03em',
                transition:'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}>
              Create Account
            </button>
            <button
              onClick={() => { setTab('signin'); setShowPanel(true) }}
              style={{
                flex:1, minWidth:130, padding:'14px 24px',
                background:'transparent',
                border:'1px solid rgba(255,255,255,0.3)', borderRadius:10,
                fontFamily:FONT, fontWeight:700, fontSize:'0.9rem',
                color:'rgba(255,255,255,0.85)', cursor:'pointer',
                letterSpacing:'0.03em',
                transition:'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.7)'; e.currentTarget.style.color='#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.3)'; e.currentTarget.style.color='rgba(255,255,255,0.85)' }}>
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* Auth panel — slides in from right */}
      {showPanel && (
        <div style={{
          position:'relative', zIndex:10,
          minHeight:'100vh',
          display:'flex', alignItems:'center', justifyContent:'center',
          padding:'70px 16px 40px',
          animation:'panelSlide 0.35s ease both',
        }}>
          <div style={{ width:'100%', maxWidth:400 }}>

            {/* Back to hero */}
            <button onClick={() => setShowPanel(false)} style={{
              display:'flex', alignItems:'center', gap:6,
              background:'none', border:'none', cursor:'pointer',
              fontFamily:FONT, fontSize:'0.75rem', color:'rgba(255,255,255,0.35)',
              marginBottom:24, padding:0, transition:'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.35)'}>
              <ArrowLeft size={14}/> Back
            </button>

            {/* Logo */}
            <div style={{ marginBottom:28, textAlign:'center' }}>
              <h2 style={{ fontFamily:FONT, fontWeight:900, fontSize:'1.6rem', letterSpacing:'-0.03em', color:'var(--accent)', margin:0 }}>
                Playquiem
              </h2>
              <p style={{ fontFamily:FONT, fontSize:'0.75rem', color:'rgba(255,255,255,0.25)', marginTop:5 }}>
                Your game diary. Your requiem.
              </p>
            </div>

            {/* Card */}
            <div style={{
              background:'rgba(10,10,18,0.92)',
              border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:18, overflow:'hidden',
              backdropFilter:'blur(28px)',
            }}>
              {/* Tabs */}
              {tab !== 'reset' && (
                <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                  {[['signin','Sign In'],['signup','Create Account']].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)} style={{
                      flex:1, padding:'15px', background:'transparent', border:'none',
                      borderBottom:`2px solid ${tab === key ? 'var(--accent)' : 'transparent'}`,
                      fontFamily:FONT, fontWeight:700, fontSize:'0.75rem',
                      letterSpacing:'0.06em', textTransform:'uppercase',
                      color: tab === key ? 'var(--accent)' : 'rgba(255,255,255,0.25)',
                      cursor:'pointer', transition:'color 0.15s',
                      marginBottom:-1,
                    }}>{label}</button>
                  ))}
                </div>
              )}

              <div style={{ padding:'26px 26px 22px' }}>

                {/* Sign In */}
                {tab === 'signin' && (
                  <form onSubmit={handleSignIn}>
                    <Field label="Email" type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" autoComplete="email"/>
                    <PasswordField label="Password" value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" autoComplete="current-password"/>
                    <button type="submit" disabled={loading} style={{
                      width:'100%', padding:'14px',
                      background: loading ? 'rgba(102,192,244,0.4)' : 'var(--accent)',
                      color:'#0a0a0f', border:'none', borderRadius:10,
                      fontFamily:FONT, fontWeight:900, fontSize:'0.92rem',
                      letterSpacing:'0.04em', cursor: loading ? 'wait' : 'pointer',
                      marginTop:4,
                    }}>
                      {loading ? 'Signing in…' : 'Sign In →'}
                    </button>
                    <button type="button" onClick={() => setTab('reset')} style={{
                      width:'100%', marginTop:10, background:'none', border:'none',
                      fontFamily:FONT, fontSize:'0.72rem', color:'rgba(255,255,255,0.22)',
                      cursor:'pointer', transition:'color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.55)'}
                    onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.22)'}>
                      Forgot password?
                    </button>
                  </form>
                )}

                {/* Sign Up */}
                {tab === 'signup' && (
                  <form onSubmit={handleSignUp}>
                    <div style={{ marginBottom:14 }}>
                      <label style={labelStyle}>Username</label>
                      <div style={{ position:'relative' }}>
                        <input
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          placeholder="coolplayer_42"
                          autoComplete="username"
                          onFocus={e => { e.target.style.borderColor='rgba(102,192,244,0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(102,192,244,0.08)' }}
                          onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none' }}
                          style={{ ...inputStyle, paddingRight:36,
                            borderColor: usernameStatus === 'taken' ? 'rgba(239,68,68,0.4)' :
                                         usernameStatus === 'available' ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'
                          }}
                        />
                        <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:14 }}>
                          {usernameStatus === 'checking' && <span style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>...</span>}
                          {usernameStatus === 'available' && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                          {usernameStatus === 'taken' && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                        </div>
                      </div>
                      {usernameStatus === 'taken' && <div style={{ fontFamily:FONT, fontSize:'0.7rem', color:'#f87171', marginTop:4 }}>Username already taken</div>}
                      {usernameStatus === 'available' && <div style={{ fontFamily:FONT, fontSize:'0.7rem', color:'#4ade80', marginTop:4 }}>Username available ✓</div>}
                    </div>
                    <Field label="Email" type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" autoComplete="email"/>
                    <PasswordField label="Password" value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="At least 6 characters" autoComplete="new-password"/>
                    <PasswordField label="Confirm Password" value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••" autoComplete="new-password"
                      error={confirm && confirm !== password ? "Passwords don't match" : null}/>
                    <button type="submit" disabled={loading || usernameStatus === 'taken'} style={{
                      width:'100%', padding:'14px',
                      background: (loading || usernameStatus === 'taken') ? 'rgba(102,192,244,0.3)' : 'var(--accent)',
                      color:'#0a0a0f', border:'none', borderRadius:10,
                      fontFamily:FONT, fontWeight:900, fontSize:'0.92rem',
                      letterSpacing:'0.04em', cursor: loading ? 'wait' : 'pointer',
                      marginTop:4,
                    }}>
                      {loading ? 'Creating account…' : 'Create Account →'}
                    </button>
                  </form>
                )}

                {/* Reset */}
                {tab === 'reset' && (
                  <form onSubmit={handleReset}>
                    <div style={{ textAlign:'center', marginBottom:20 }}>
                      <h2 style={{ fontFamily:FONT, fontWeight:800, fontSize:'1.05rem', color:'var(--text)', margin:'0 0 5px' }}>Reset Password</h2>
                      <p style={{ fontFamily:FONT, fontSize:'0.75rem', color:'rgba(255,255,255,0.3)', margin:0 }}>
                        Enter your email and we'll send a reset link
                      </p>
                    </div>
                    <Field label="Email" type="email" value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="you@example.com"/>
                    <button type="submit" disabled={loading} style={{
                      width:'100%', padding:'14px', background:'var(--accent)',
                      color:'#0a0a0f', border:'none', borderRadius:10,
                      fontFamily:FONT, fontWeight:900, fontSize:'0.92rem',
                      cursor: loading ? 'wait' : 'pointer', marginTop:4,
                    }}>
                      {loading ? 'Sending…' : 'Send Reset Link →'}
                    </button>
                    <button type="button" onClick={() => setTab('signin')} style={{
                      width:'100%', marginTop:10, background:'none', border:'none',
                      fontFamily:FONT, fontSize:'0.72rem', color:'rgba(255,255,255,0.22)',
                      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4,
                      transition:'color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.55)'}
                    onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.22)'}>
                      <ArrowLeft size={13}/> Back to Sign In
                    </button>
                  </form>
                )}
              </div>
            </div>

            <p style={{
              textAlign:'center', marginTop:16,
              fontFamily:FONT, fontSize:'0.65rem',
              color:'rgba(255,255,255,0.12)',
            }}>
              By signing up you agree to track games responsibly
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
