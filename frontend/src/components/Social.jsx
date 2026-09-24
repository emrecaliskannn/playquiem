import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  searchMembers, sendFriendRequest, cancelFriendRequest,
  acceptFriendRequest, declineFriendRequest,
  getFriendRequestStatus, getPendingRequests, getWhoToFollow,
  getMyLogs, isFollowing, unfollowUser,
} from '../lib/db'
import { Spinner } from './ui'
import toast from 'react-hot-toast'

const TEAL = 'var(--accent)'

function MiniAvatar({ name = '?', size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #60a5fa, rgba(102,192,244,0.3))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
      fontWeight: 800, fontSize: size * 0.36, color: 'var(--bg)',
    }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  )
}

export function FriendButton({ targetId, size = 'md' }) {
  const { user } = useAuthStore()
  const nav = useNavigate()
  const [status, setStatus] = useState('loading')
  const [busy,   setBusy]   = useState(false)

  useEffect(() => {
    if (!user || user.id === targetId) { setStatus('self'); return }
    Promise.all([isFollowing(targetId), getFriendRequestStatus(targetId)])
      .then(([following, req]) => {
        if (following)             setStatus('following')
        else if (req === 'sent')     setStatus('sent')
        else if (req === 'received') setStatus('received')
        else                         setStatus('none')
      })
  }, [user, targetId])

  const handle = async () => {
    if (!user) { nav('/auth'); return }
    setBusy(true)
    try {
      if (status === 'none')      { await sendFriendRequest(targetId);  setStatus('sent');      toast.success('Request sent!') }
      else if (status === 'sent') { await cancelFriendRequest(targetId);setStatus('none');      toast('Cancelled') }
      else if (status === 'following') { await unfollowUser(targetId);  setStatus('none');      toast('Unfollowed') }
      else if (status === 'received')  { await acceptFriendRequest(targetId); setStatus('following'); toast.success('Friends! ') }
    } catch(e) { toast.error(e.message) }
    finally    { setBusy(false) }
  }

  if (status === 'self' || status === 'loading') return null
  const pad = size === 'sm' ? '5px 11px' : '8px 18px'
  const fz  = size === 'sm' ? '0.67rem'  : '0.76rem'
  const CFG = {
    none:      { label:'+ Add Friend',   bg:TEAL,                     color:'var(--bg)', border:TEAL },
    sent:      { label:'Sent ✓',         bg:'transparent',            color:TEAL,      border:'rgba(102,192,244,0.35)' },
    received:  { label:'Accept',       bg:'rgba(102,192,244,0.15)', color:TEAL,      border:'rgba(102,192,244,0.5)' },
    following: { label:'Friends ✓',      bg:'transparent',            color:'rgba(102,192,244,0.45)', border:'rgba(102,192,244,0.15)' },
  }
  const c = CFG[status]
  return (
    <button onClick={handle} disabled={busy} style={{
      background:c.bg, color:c.color, border:`1px solid ${c.border}`,
      padding:pad, borderRadius:8, cursor:busy?'wait':'pointer',
      fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif',
      fontWeight:700, fontSize:fz, opacity:busy?0.6:1,
      whiteSpace:'nowrap', transition:'opacity 0.15s',
    }}>{busy ? '…' : c.label}</button>
  )
}

export function MemberCard({ user: u }) {
  const nav = useNavigate()
  const { user: me } = useAuthStore()
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={e => { if (!e.target.closest('button')) nav(`/profile/${u.id}`) }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:14,
        padding:'13px 16px', cursor:'pointer',
        background: hov ? 'rgba(102,192,244,0.04)' : 'var(--surface)',
        border:`1px solid ${hov ? 'rgba(102,192,244,0.22)' : 'rgba(102,192,244,0.08)'}`,
        borderRadius:12, transition:'all 0.15s',
      }}
    >
      <MiniAvatar name={u.username} size={42} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontWeight:800, fontSize:'0.88rem', color:TEAL, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          @{u.username}
        </div>
        <div style={{ fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontSize:'0.63rem', color:'rgba(102,192,244,0.35)', marginTop:2 }}>
          {[u.gameCount > 0 && `${u.gameCount} games`, u.matchScore > 0 && `${u.matchScore} shared genres`, u.isFollowing && 'Friends'].filter(Boolean).join(' · ')}
        </div>
      </div>
      {me && me.id !== u.id && (
        <div onClick={e => e.stopPropagation()}>
          <FriendButton targetId={u.id} size="sm" />
        </div>
      )}
    </div>
  )
}

export function WhoToFollow({ compact = false }) {
  const { user } = useAuthStore()
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    getMyLogs().then(async logs => {
      const gc = logs.flatMap(l => (l.genres||'').split(',').map(g=>g.trim()).filter(Boolean))
        .reduce((a,g) => { a[g]=(a[g]||0)+1; return a }, {})
      const top = Object.entries(gc).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([g])=>g)
      const d = await getWhoToFollow(top, compact ? 3 : 5)
      setSuggestions(d); setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  if (!user || (!loading && suggestions.length === 0)) return null
  return (
    <div style={{ background:'var(--surface)', border:'1px solid rgba(102,192,244,0.08)', borderRadius:14, overflow:'hidden' }}>
      <div style={{ padding:'10px 14px 8px', borderBottom:'1px solid rgba(102,192,244,0.06)', fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontSize:'0.55rem', fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(102,192,244,0.3)' }}>
         Who to Follow
      </div>
      {loading ? <div style={{padding:16,display:'flex',justifyContent:'center'}}><Spinner size="sm"/></div>
       : suggestions.map(u => (
        <div key={u.id}
          onClick={e => { if (!e.target.closest('button')) nav(`/profile/${u.id}`) }}
          style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderBottom:'1px solid rgba(102,192,244,0.04)', cursor:'pointer', transition:'background 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(102,192,244,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}
        >
          <MiniAvatar name={u.username} size={30} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontWeight:700, fontSize:'0.76rem', color:TEAL, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>@{u.username}</div>
            {u.matchScore > 0 && <div style={{ fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontSize:'0.58rem', color:'rgba(102,192,244,0.28)' }}>{u.matchScore} shared genre{u.matchScore!==1?'s':''}</div>}
          </div>
          <div onClick={e => e.stopPropagation()}><FriendButton targetId={u.id} size="sm"/></div>
        </div>
      ))}
    </div>
  )
}

export function PendingRequests() {
  const { user } = useAuthStore()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    getPendingRequests().then(d => { setRequests(d); setLoading(false) })
  }, [user])

  if (loading || requests.length === 0) return null

  const handleAccept  = async id => { await acceptFriendRequest(id);  setRequests(r=>r.filter(x=>x.from_id!==id)); toast.success('Friends! ') }
  const handleDecline = async id => { await declineFriendRequest(id); setRequests(r=>r.filter(x=>x.from_id!==id)) }

  return (
    <div style={{ background:'rgba(102,192,244,0.04)', border:'1px solid rgba(102,192,244,0.18)', borderRadius:14, overflow:'hidden', marginBottom:20 }}>
      <div style={{ padding:'11px 16px', borderBottom:'1px solid rgba(102,192,244,0.1)', fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontSize:'0.62rem', fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase', color:TEAL }}>
         Friend Requests ({requests.length})
      </div>
      {requests.map(req => (
        <div key={req.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid rgba(102,192,244,0.05)' }}>
          <MiniAvatar name={req.profiles?.username||'?'} size={36}/>
          <div style={{ flex:1, cursor:'pointer' }} onClick={() => nav(`/profile/${req.from_id}`)}>
            <div style={{ fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontWeight:700, fontSize:'0.84rem', color:TEAL }}>@{req.profiles?.username||'Someone'}</div>
            <div style={{ fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontSize:'0.63rem', color:'rgba(102,192,244,0.35)' }}>wants to be your friend</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>handleAccept(req.from_id)} style={{ background:TEAL, color:'var(--bg)', fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontWeight:800, fontSize:'0.7rem', padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer' }}>Accept</button>
            <button onClick={()=>handleDecline(req.from_id)} style={{ background:'transparent', color:'rgba(102,192,244,0.4)', fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontWeight:700, fontSize:'0.7rem', padding:'6px 14px', borderRadius:8, border:'1px solid rgba(102,192,244,0.15)', cursor:'pointer' }}>Decline</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function MemberSearch({ placeholder='Find players…', compact=false }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)
  const wrapRef  = useRef(null)
  const nav = useNavigate()

  const search = useCallback(async val => {
    if (!val.trim()) { setResults([]); setOpen(false); return }
    setLoading(true)
    const data = await searchMembers(val, 6)
    setResults(data); setOpen(data.length > 0); setLoading(false)
  }, [])

  const handleChange = e => {
    const val = e.target.value; setQ(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(val), 300)
  }

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={wrapRef} style={{ position:'relative' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(102,192,244,0.06)', border:'1px solid rgba(102,192,244,0.15)', borderRadius:10, padding: compact?'7px 12px':'9px 14px' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(102,192,244,0.4)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={q} onChange={handleChange} onFocus={()=>q&&results.length&&setOpen(true)} placeholder={placeholder}
          style={{ background:'transparent', border:'none', outline:'none', fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontSize:compact?'0.78rem':'0.85rem', color:TEAL, caretColor:TEAL, width:'100%' }}/>
        {loading && <Spinner size="sm"/>}
        {q && !loading && <button onClick={()=>{setQ('');setResults([]);setOpen(false)}} style={{background:'none',border:'none',color:'rgba(102,192,244,0.3)',cursor:'pointer',fontSize:16,lineHeight:1,padding:0}}>×</button>}
      </div>
      {open && results.length > 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'var(--surface)', border:'1px solid rgba(102,192,244,0.15)', borderRadius:12, overflow:'hidden', zIndex:200, boxShadow:'0 16px 48px rgba(0,0,0,0.8)' }}>
          {results.map(u => (
            <div key={u.id} onClick={()=>{nav(`/profile/${u.id}`);setOpen(false);setQ('')}}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid rgba(102,192,244,0.05)', transition:'background 0.12s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(102,192,244,0.06)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <MiniAvatar name={u.username} size={30}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontWeight:700, fontSize:'0.8rem', color:TEAL }}>@{u.username}</div>
                <div style={{ fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontSize:'0.6rem', color:'rgba(102,192,244,0.3)' }}>{u.gameCount} games{u.isFollowing?' · Friends':''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function MemberSearchPage() {
  const [q,        setQ]        = useState('')
  const [results,  setResults]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [searched, setSearched] = useState(false)
  const timerRef = useRef(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const { supabase } = await import('../lib/supabase')
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .not('username', 'is', null)
        .order('username', { ascending: true })
        .limit(50)
      setResults((data || []).map(u => ({ ...u, gameCount: 0, isFollowing: false })))
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  // Load all members on mount
  useEffect(() => { loadAll() }, [])

  const doSearch = useCallback(async val => {
    if (!val.trim()) { setSearched(false); loadAll(); return }
    setLoading(true); setSearched(true)
    try { const d = await searchMembersLight(val, 20); setResults(d) }
    catch { setResults([]) }
    finally { setLoading(false) }
  }, [loadAll])

  const handleChange = e => {
    const val = e.target.value; setQ(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(val), 300)
  }

  return (
    <div style={{ maxWidth:720, margin:'0 auto', padding:'76px 20px 60px' }}>
      <h1 style={{ fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontWeight:900, fontSize:'2rem', letterSpacing:'-0.03em', color:TEAL, marginBottom:6 }}>Find Players</h1>
      <p style={{ fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontSize:'0.82rem', color:'rgba(102,192,244,0.4)', marginBottom:24 }}>Search by username · click to view their profile</p>

      <PendingRequests />

      {/* Search bar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(102,192,244,0.06)', border:'1px solid rgba(102,192,244,0.2)', borderRadius:14, padding:'13px 18px', marginBottom:28 }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(102,192,244,0.4)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input value={q} onChange={handleChange} placeholder="Search by username…" autoComplete="off"
          style={{ flex:1, background:'transparent', border:'none', outline:'none', fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontSize:'1rem', color:TEAL, caretColor:TEAL }}/>
        {loading && <Spinner size="sm"/>}
        {q && !loading && <button onClick={()=>{setQ('');setResults([]);setSearched(false);clearTimeout(timerRef.current)}} style={{background:'none',border:'none',color:'rgba(102,192,244,0.3)',cursor:'pointer',fontSize:22,lineHeight:1,padding:0}}>×</button>}
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', paddingTop:48 }}><Spinner/></div>
      ) : results.length > 0 ? (
        <>
          <p style={{ fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontSize:'0.65rem', color:'rgba(102,192,244,0.3)', marginBottom:14, letterSpacing:'0.05em' }}>
            {results.length} player{results.length!==1?'s':''} found
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {results.map(u => <MemberCard key={u.id} user={u}/>)}
          </div>
        </>
      ) : searched ? (
        <div style={{ textAlign:'center', paddingTop:56 }}>
          <div style={{ fontSize:48, marginBottom:14 }}></div>
          <p style={{ fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontWeight:800, fontSize:'1.1rem', color:TEAL, marginBottom:6 }}>No players found for "{q}"</p>
          <p style={{ fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', fontSize:'0.8rem', color:'rgba(102,192,244,0.35)' }}>Try a different username</p>
        </div>
      ) : null}
    </div>
  )
}
