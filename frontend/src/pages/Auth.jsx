import { useState } from 'react'
import { ArrowLeft } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const T    = '#0ea5e9'
const FONT = '"Helvetica Neue",Helvetica,Arial,sans-serif'

const inputStyle = {
  width: '100%', padding: '12px 16px',
  background: 'rgba(14,165,233,0.05)',
  border: '1px solid rgba(14,165,233,0.18)',
  borderRadius: 12, outline: 'none',
  fontFamily: FONT, fontSize: '0.9rem',
  color: T, caretColor: T,
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
}

const labelStyle = {
  fontFamily: FONT, fontSize: '0.62rem', fontWeight: 800,
  letterSpacing: '0.14em', textTransform: 'uppercase',
  color: 'rgba(14,165,233,0.45)', display: 'block', marginBottom: 7,
}

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
        onFocus={e => {
          setFocused(true)
          e.target.style.borderColor = 'rgba(14,165,233,0.5)'
          e.target.style.boxShadow   = '0 0 0 3px rgba(14,165,233,0.07)'
        }}
        onBlur={e => {
          setFocused(false)
          e.target.style.borderColor = 'rgba(14,165,233,0.18)'
          e.target.style.boxShadow   = 'none'
        }}
        style={{ ...inputStyle }}
      />
    </div>
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
  const { signIn, signUp } = useAuthStore()
  const nav = useNavigate()

  const handleSignIn = async e => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Welcome back! ')
      nav('/')
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
    setLoading(true)
    try {
      await signUp(email, password, username)
      toast.success('Account created! ')
      nav('/')
    } catch (err) {
      toast.error(err.message)
    } finally { setLoading(false) }
  }

  const handleReset = async e => {
    e.preventDefault()
    if (!resetEmail) return toast.error('Enter your email')
    setLoading(true)
    try {
      const { supabase } = await import('../lib/supabase')
      await supabase.auth.resetPasswordForEmail(resetEmail)
      toast.success('Reset email sent!')
      setTab('signin')
    } catch (err) {
      toast.error(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#070b12',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(14,165,233,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      {/* Grid dots background */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15,
        backgroundImage: `radial-gradient(circle, rgba(14,165,233,0.4) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        pointerEvents: 'none',
      }}/>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="/logo.png" alt="Playquiem" style={{
            width: 64, height: 64, objectFit: 'contain',
            margin: '0 auto 16px', display: 'block',
            filter: 'drop-shadow(0 0 20px rgba(14,165,233,0.5))',
          }}/>
          <h1 style={{
            fontFamily: FONT, fontWeight: 900, fontSize: '2rem',
            letterSpacing: '-0.03em', color: T, margin: 0,
            textShadow: '0 0 40px rgba(14,165,233,0.25)',
          }}>Playquiem</h1>
          <p style={{
            fontFamily: FONT, fontSize: '0.78rem',
            color: 'rgba(14,165,233,0.35)', marginTop: 6,
          }}>Your game diary. Your requiem.</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(17,17,22,0.9)',
          border: '1px solid rgba(14,165,233,0.12)',
          borderRadius: 20, overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(14,165,233,0.05)',
        }}>

          {/* Tabs */}
          {tab !== 'reset' && (
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(14,165,233,0.08)' }}>
              {[['signin','Sign In'],['signup','Create Account']].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} style={{
                  flex: 1, padding: '16px', background: 'transparent', border: 'none',
                  borderBottom: `2px solid ${tab === key ? T : 'transparent'}`,
                  fontFamily: FONT, fontWeight: 700, fontSize: '0.8rem',
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  color: tab === key ? T : 'rgba(14,165,233,0.35)',
                  cursor: 'pointer', transition: 'color 0.15s',
                  marginBottom: -1,
                }}>{label}</button>
              ))}
            </div>
          )}

          {/* Form content */}
          <div style={{ padding: '28px 28px 24px' }}>

            {/* Sign In */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn}>
                <Field label="Email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" autoComplete="email"/>
                <Field label="Password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password"/>
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '13px',
                  background: loading ? 'rgba(14,165,233,0.4)' : T,
                  color: '#070b12', border: 'none', borderRadius: 12,
                  fontFamily: FONT, fontWeight: 900, fontSize: '0.88rem',
                  letterSpacing: '0.04em', cursor: loading ? 'wait' : 'pointer',
                  transition: 'opacity 0.15s', marginTop: 4,
                }}>
                  {loading ? 'Signing in…' : 'Sign In →'}
                </button>
                <button type="button" onClick={() => setTab('reset')} style={{
                  width: '100%', marginTop: 12, background: 'none', border: 'none',
                  fontFamily: FONT, fontSize: '0.75rem', color: 'rgba(14,165,233,0.35)',
                  cursor: 'pointer', transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color=T}
                onMouseLeave={e => e.currentTarget.style.color='rgba(14,165,233,0.35)'}>
                  Forgot password?
                </button>
              </form>
            )}

            {/* Sign Up */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUp}>
                <Field label="Username" value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="coolplayer_42" autoComplete="username"/>
                <Field label="Email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" autoComplete="email"/>
                <Field label="Password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters" autoComplete="new-password"/>
                <Field label="Confirm Password" type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••" autoComplete="new-password"/>
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '13px',
                  background: loading ? 'rgba(14,165,233,0.4)' : T,
                  color: '#070b12', border: 'none', borderRadius: 12,
                  fontFamily: FONT, fontWeight: 900, fontSize: '0.88rem',
                  letterSpacing: '0.04em', cursor: loading ? 'wait' : 'pointer',
                  marginTop: 4,
                }}>
                  {loading ? 'Creating account…' : 'Create Account →'}
                </button>
              </form>
            )}

            {/* Reset password */}
            {tab === 'reset' && (
              <form onSubmit={handleReset}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}></div>
                  <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: '1.1rem',
                                color: T, margin: '0 0 6px' }}>Reset Password</h2>
                  <p style={{ fontFamily: FONT, fontSize: '0.78rem',
                               color: 'rgba(14,165,233,0.4)', margin: 0 }}>
                    Enter your email and we'll send a reset link
                  </p>
                </div>
                <Field label="Email" type="email" value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="you@example.com"/>
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '13px', background: T,
                  color: '#070b12', border: 'none', borderRadius: 12,
                  fontFamily: FONT, fontWeight: 900, fontSize: '0.88rem',
                  cursor: loading ? 'wait' : 'pointer', marginTop: 4,
                }}>
                  {loading ? 'Sending…' : 'Send Reset Link →'}
                </button>
                <button type="button" onClick={() => setTab('signin')} style={{
                  width: '100%', marginTop: 12, background: 'none', border: 'none',
                  fontFamily: FONT, fontSize: '0.75rem', color: 'rgba(14,165,233,0.35)',
                  cursor: 'pointer',
                }}><ArrowLeft size={13}/> Back to Sign In</button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom note */}
        <p style={{
          textAlign: 'center', marginTop: 20,
          fontFamily: FONT, fontSize: '0.68rem',
          color: 'rgba(14,165,233,0.2)',
        }}>
          By signing up you agree to track games responsibly 
        </p>
      </div>
    </div>
  )
}
