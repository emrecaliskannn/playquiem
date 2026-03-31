import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
  Lists, ListDetail, Challenges, PublicProfile, Recommendations, GameNews
} from './pages/Features'
import { useAuthStore } from './store/authStore'

// ── Ad sidebar ───────────────────────────────────────────────
function AdSidebar({ side }) {
  const F = '"Helvetica Neue",Helvetica,Arial,sans-serif'
  const T = '#0ea5e9'
  const Box = ({ h, label, size }) => (
    <div style={{
      borderRadius: 12,
      border: '1px dashed rgba(14,165,233,0.15)',
      background: 'rgba(14,165,233,0.02)',
      minHeight: h,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: 12, marginBottom: 14,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        border: '1px solid rgba(14,165,233,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(14,165,233,0.3)', fontSize: 11,
      }}></div>
      <span style={{
        fontFamily: F, fontSize: '0.5rem', fontWeight: 800,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color: 'rgba(14,165,233,0.2)', textAlign: 'center',
      }}>{label}</span>
      {size && (
        <span style={{
          fontFamily: F, fontSize: '0.45rem',
          color: 'rgba(14,165,233,0.12)', textAlign: 'center',
        }}>{size}</span>
      )}
    </div>
  )
  return (
    <div style={{
      width: 140, flexShrink: 0,
      position: 'sticky', top: 80,
      alignSelf: 'flex-start',
      padding: '16px 8px',
    }}>
      <Box h={320} label="Advertisement" size="160 × 320" />
      <Box h={150} label="Ad" size="160 × 150" />
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
        <Route path="/lists"         element={<Lists />} />
        <Route path="/list/:id"      element={<ListDetail />} />
        <Route path="/challenges"    element={<Challenges />} />
        <Route path="/profile/:id"   element={<PublicProfile />} />
        <Route path="/players"        element={<MemberSearchPage />} />
        <Route path="/trending"       element={<div style={{maxWidth:900,margin:'0 auto',padding:'80px 24px 60px'}}><h1 style={{color:'#0ea5e9',fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif',fontWeight:900,fontSize:'2rem',marginBottom:28}}>Trending on Playquiem</h1><CommunityTrending /></div>} />
        <Route path="/for-you"       element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
        <Route path="/news"          element={<GameNews />} />
      </Routes>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#181824',
            color: '#e8e8f5',
            border: '1px solid #26263a',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#2dc653', secondary: '#09090f' } },
          error:   { iconTheme: { primary: '#e63946', secondary: '#09090f' } },
        }}
      />
    </BrowserRouter>
  )
}
