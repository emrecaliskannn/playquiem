import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import AllGames from './pages/AllGames'
import GameDetail from './pages/GameDetail'
import Auth from './pages/Auth'
import { Profile, Library, Dashboard, Search, Community } from './pages/Pages'
import Diary from './pages/Diary'
import CommunityTrending from './components/CommunityTrending'
import { MemberSearchPage } from './components/Social'
import {
  ActivityFeed, Notifications, Achievements, YearInReview,
  Challenges, PublicProfile, Recommendations, GameNews, Lists, ListDetail
} from './pages/Features'
import { useAuthStore } from './store/authStore'

// ── Ad sidebar ───────────────────────────────────────────────
function AdSidebar({ side }) {
  return (
    <div style={{
      width: 160, flexShrink: 0,
      position: 'sticky', top: 80,
      alignSelf: 'flex-start',
      padding: '16px 4px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <SidebarAd />
      <RectangleAd />
    </div>
  )
}

// ── Page layout with ad sidebars ─────────────────────────────
function PageLayout({ children }) {
  const location = useLocation()
  // Home has its own ad layout, Auth is full-screen — skip ads
  const noAds = ['/', '/auth'].includes(location.pathname)
  if (noAds) return <>{children}</>
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      minHeight: '100vh',
    }}>
      {/* Left ad */}
      <div className="hidden xl:block">
        <AdSidebar side="left" />
      </div>

      {/* Page content */}
      <div style={{ flex: 1, minWidth: 0, maxWidth: 1200 }}>
        {children}
      </div>

      {/* Right ad */}
      <div className="hidden xl:block">
        <AdSidebar side="right" />
      </div>
    </div>
  )
}

function AnimatedRoutes({ children }) {
  const location = useLocation()
  return (
    <div
      key={location.pathname}
      style={{
        animation: 'pageIn 0.22s ease forwards',
      }}
    >
      {children}
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return null
  return user ? children : <Navigate to="/auth" replace />
}

// ── Footer ───────────────────────────────────────────────────
function Footer() {
  const location = useLocation()
  if (location.pathname === '/auth') return null
  const F = '"Helvetica Neue",Helvetica,Arial,sans-serif'
  return (
    <footer style={{
      borderTop: '1px solid rgba(102,192,244,0.07)',
      padding: '28px 24px',
      marginTop: 40,
      display: 'flex', flexWrap: 'wrap',
      alignItems: 'center', justifyContent: 'space-between',
      gap: 12,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap: 20 }}>
        <span style={{ fontFamily:F, fontWeight:900, fontSize:'1rem', color:'var(--accent)', letterSpacing:'-0.02em' }}>
          Playquiem
        </span>
        <span style={{ fontFamily:F, fontSize:'0.7rem', color:'rgba(102,192,244,0.25)' }}>
          Your game diary. Your requiem.
        </span>
      </div>
      <div style={{ display:'flex', gap:20, alignItems:'center' }}>
        {[
          ['Games', '/games'],
          ['Community', '/community'],
          ['Trending', '/trending'],
          ['News', '/news'],
        ].map(([label, to]) => (
          <Link key={to} to={to} style={{
            fontFamily:F, fontSize:'0.72rem', color:'rgba(102,192,244,0.3)',
            textDecoration:'none', transition:'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color='rgba(102,192,244,0.7)'}
          onMouseLeave={e => e.currentTarget.style.color='rgba(102,192,244,0.3)'}>
            {label}
          </Link>
        ))}
        <span style={{ fontFamily:F, fontSize:'0.68rem', color:'rgba(102,192,244,0.15)' }}>
          v1.0 · © HardW Interactive
        </span>
      </div>
    </footer>
  )
}

// ── Scroll to top ────────────────────────────────────────────
function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Sayfa değişince en üste çık
  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])

  if (!visible) return null
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{
        position: 'fixed', bottom: 80, right: 20, zIndex: 50,
        width: 40, height: 40, borderRadius: '50%',
        background: 'rgba(102,192,244,0.15)',
        border: '1px solid rgba(102,192,244,0.25)',
        color: 'var(--accent)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem', transition: 'all 0.2s',
        backdropFilter: 'blur(8px)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background='rgba(102,192,244,0.25)'; e.currentTarget.style.transform='translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.background='rgba(102,192,244,0.15)'; e.currentTarget.style.transform='translateY(0)' }}
      title="Scroll to top"
    >
      ↑
    </button>
  )
}


// ── Mobile bottom navigation ─────────────────────────────────
function MobileNav() {
  const location = useLocation()
  const { user } = useAuthStore()
  const F = '"Helvetica Neue",Helvetica,Arial,sans-serif'
  const T = 'var(--accent)'

  const items = [
    { to: '/',          icon: '⌂', label: 'Home'    },
    { to: '/games',     icon: '◈', label: 'Games'   },
    { to: '/diary',     icon: '▤', label: 'Diary',  auth: true },
    { to: '/community', icon: '○', label: 'Social'  },
    { to: '/profile',   icon: '◉', label: 'Profile', auth: true },
  ]

  return (
    <nav className="pq-mobile-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: 'var(--nav-bg)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      padding: '8px 0 env(safe-area-inset-bottom)',
    }}>
      {items.map(item => {
        if (item.auth && !user) return null
        const active = location.pathname === item.to
        return (
          <Link key={item.to} to={item.to} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3, padding: '6px 0',
            textDecoration: 'none',
            color: active ? 'var(--accent)' : 'var(--text3)',
            transition: 'color 0.15s',
          }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontFamily: F, fontSize: '0.6rem', fontWeight: 700,
                           letterSpacing: '0.04em' }}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export default function App() {
  const init = useAuthStore(s => s.init)

  useEffect(() => {
    // Initialize auth — Supabase reads from localStorage automatically
    // This fires on every page load AND tab switch
    init()
  }, [])

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/games"     element={<AllGames />} />
        <Route path="/game/:id"  element={<GameDetail />} />
        <Route path="/search"    element={<Search />} />
        <Route path="/community" element={<Community />} />
        <Route path="/auth"      element={<Auth />} />
        <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/library"   element={<ProtectedRoute><Library /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/diary"         element={<ProtectedRoute><Diary /></ProtectedRoute>} />
        <Route path="/activity"      element={<ActivityFeed />} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/achievements"  element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
        <Route path="/year-review"   element={<ProtectedRoute><YearInReview /></ProtectedRoute>} />
        <Route path="/challenges"    element={<Challenges />} />
        <Route path="/lists"         element={<ProtectedRoute><Lists /></ProtectedRoute>} />
        <Route path="/list/:id"      element={<ListDetail />} />
        <Route path="/profile/:id"   element={<PublicProfile />} />
        <Route path="/players"        element={<MemberSearchPage />} />
        <Route path="/trending"       element={<div style={{maxWidth:900,margin:'0 auto',padding:'80px 24px 60px'}}><h1 style={{color:'var(--accent)',fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif',fontWeight:900,fontSize:'2rem',marginBottom:28}}>Trending on Playquiem</h1><CommunityTrending /></div>} />
        <Route path="/for-you"       element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
        <Route path="/news"          element={<GameNews />} />
      </Routes>
      <MobileNav />
      <Footer />
      <ScrollToTop />
      <Toaster
        position="bottom-right"
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            background: '#13131e',
            color: '#e0f2fe',
            border: '1px solid rgba(102,192,244,0.15)',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
            fontWeight: 500,
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            maxWidth: '340px',
          },
          success: {
            iconTheme: { primary: '#2dc653', secondary: '#0a0a0f' },
            style: {
              background: '#0d1f12',
              border: '1px solid rgba(45,198,83,0.2)',
              color: '#7effa8',
            },
          },
          error: {
            iconTheme: { primary: '#e63946', secondary: '#0a0a0f' },
            style: {
              background: '#1f0d0e',
              border: '1px solid rgba(230,57,70,0.25)',
              color: '#ffa0a6',
            },
          },
          loading: {
            iconTheme: { primary: '#66c0f4', secondary: '#0a0a0f' },
          },
        }}
      />
    </BrowserRouter>
  )
}
