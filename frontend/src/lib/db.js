import { supabase } from './supabase'

// ── Logs ─────────────────────────────────────────────────────
export async function getMyLogs() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return []
  const { data } = await supabase
    .from('logs').select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(200)
  return data || []
}

export async function saveLog({ igdbId, title, coverUrl, genres, platform, rating, review, datePlayed, status, tags = '', replayed = false }) {
  // Use getSession() — reads from localStorage, no network call needed
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('You must be signed in to log games')

  // Build insert object — only include tags/replayed if columns exist
  const entry = {
    user_id:    session.user.id,
    igdb_id:    igdbId,
    title:      title,
    cover_url:  coverUrl || null,
    genres:     genres   || null,
    platform:   platform || 'Unknown',
    rating:     Number(rating) || 1,
    review:     review   || null,
    date_played: datePlayed || new Date().toISOString().slice(0, 10),
    status:     status   || 'Played',
  }

  // Try with tags + replayed first (needs diary_migration.sql to have been run)
  // If columns don't exist yet, fall back to insert without them
  let { error } = await supabase.from('logs').insert({ ...entry, tags, replayed })
  if (error && error.message?.includes('column')) {
    // Columns not yet added — insert without them
    const { error: e2 } = await supabase.from('logs').insert(entry)
    if (e2) throw new Error(e2.message)
  } else if (error) {
    throw new Error(error.message)
  }
}

export async function updateLog(id, updates) {
  const { error } = await supabase.from('logs').update(updates).eq('id', id)
  if (error) throw error
}

export async function getDiaryEntries() {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []
  const { data } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', user.id)
    .not('date_played', 'is', null)
    .order('date_played', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500)
  return data || []
}

export async function deleteLog(id) {
  const { error } = await supabase.from('logs').delete().eq('id', id)
  if (error) throw new Error(error.message) 
}

export async function isLogged(igdbId) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return false
  const { data } = await supabase
    .from('logs').select('id')
    .eq('user_id', session.user.id).eq('igdb_id', igdbId).limit(1)
  return (data?.length || 0) > 0
}

// ── Reviews ──────────────────────────────────────────────────
export async function getRecentReviews(limit = 20) {
  const { data } = await supabase
    .from('recent_reviews').select('*').limit(limit)
  return data || []
}

export async function getGameReviews(title) {
  const { data } = await supabase
    .from('recent_reviews').select('*').eq('title', title).limit(10)
  return data || []
}

// ── Social ───────────────────────────────────────────────────
export async function getFriendFeed() {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []
  const { data } = await supabase
    .from('friend_feed').select('*, review_likes(count)')
    .eq('follower_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)
  return data || []
}

export async function followUser(targetId) {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not logged in')

  // Insert the follow
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, following_id: targetId })

  if (error && !error.message.includes('duplicate')) throw new Error(error.message)

  // Send notification directly from JS — reliable regardless of trigger status
  const { data: prof } = await supabase
    .from('profiles').select('username').eq('id', user.id).single()
  const actor = prof?.username || 'Someone'

  const { error: notifError } = await supabase.from('notifications').insert({
    user_id:    targetId,
    type:       'follow',
    actor_id:   user.id,
    actor_name: actor,
    message:    actor + ' started following you',
    link:       '/profile/' + user.id,
    read:       false,
  })
  if (notifError) console.warn(notifError.message)
}

export async function unfollowUser(targetId) {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return
  await supabase.from('follows').delete()
    .eq('follower_id', user.id).eq('following_id', targetId)
}

export async function isFollowing(targetId) {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return false
  const { data } = await supabase
    .from('follows').select('id')
    .eq('follower_id', user.id).eq('following_id', targetId).limit(1)
  return (data?.length || 0) > 0
}

export async function getFollowerCount(userId) {
  const { count } = await supabase
    .from('follows').select('id', { count: 'exact', head: true })
    .eq('following_id', userId)
  return count || 0
}

export async function getFollowingCount(userId) {
  const { count } = await supabase
    .from('follows').select('id', { count: 'exact', head: true })
    .eq('follower_id', userId)
  return count || 0
}

export async function searchUsers(q) {
  const { data } = await supabase
    .from('profiles').select('*').ilike('username', `%${q}%`).limit(10)
  return data || []
}

export async function getProfile(userId) {
  const { data } = await supabase
    .from('profiles').select('*').eq('id', userId).single()
  return data || {}
}

export async function getUserLogs(userId) {
  const { data } = await supabase
    .from('logs').select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return data || []
}

// ── Friend Requests ───────────────────────────────────────────
export async function sendFriendRequest(toId) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not logged in')
  const { error } = await supabase.from('friend_requests').insert({
    from_id: session.user.id, to_id: toId, status: 'pending'
  })
  if (error) throw new Error(error.message) 
}

export async function cancelFriendRequest(toId) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return
  await supabase.from('friend_requests').delete()
    .eq('from_id', session.user.id).eq('to_id', toId)
}

export async function acceptFriendRequest(fromId) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return
  const { error } = await supabase.from('friend_requests')
    .update({ status: 'accepted' })
    .eq('from_id', fromId).eq('to_id', session.user.id)
  if (error) throw new Error(error.message) 
}

export async function declineFriendRequest(fromId) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return
  await supabase.from('friend_requests').delete()
    .eq('from_id', fromId).eq('to_id', session.user.id)
}

export async function getFriendRequestStatus(otherUserId) {
  // Returns: 'none' | 'sent' | 'received' | 'accepted'
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return 'none'
  const uid = session.user.id
  const { data } = await supabase.from('friend_requests').select('*')
    .or(`and(from_id.eq.${uid},to_id.eq.${otherUserId}),and(from_id.eq.${otherUserId},to_id.eq.${uid})`)
    .limit(1).single()
  if (!data) return 'none'
  if (data.status === 'accepted') return 'accepted'
  if (data.from_id === uid) return 'sent'
  return 'received'
}

export async function getPendingRequests() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return []
  const { data } = await supabase.from('friend_requests')
    .select('*, profiles!friend_requests_from_id_fkey(username, bio)')
    .eq('to_id', session.user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  return data || []
}

export async function searchMembers(q, limit = 10) {
  if (!q.trim()) return []
  const { data: { session } } = await supabase.auth.getSession()
  const uid = session?.user?.id

  // Search by username
  const { data: users } = await supabase
    .from('profiles').select('*')
    .ilike('username', `%${q}%`)
    .limit(limit)
  if (!users?.length) return []

  // Enrich with game count + following status
  const enriched = await Promise.all(users.map(async u => {
    const { count: gameCount } = await supabase
      .from('logs').select('id', { count:'exact', head:true })
      .eq('user_id', u.id)
    const isFollowing = uid && uid !== u.id
      ? (await supabase.from('follows').select('id')
          .eq('follower_id', uid).eq('following_id', u.id).limit(1))
          .data?.length > 0
      : false
    return { ...u, gameCount: gameCount || 0, isFollowing }
  }))
  return enriched
}

export async function getWhoToFollow(myGenres = [], limit = 5) {
  // Find users who've logged many games in genres I like
  const { data: { session } } = await supabase.auth.getSession()
  const uid = session?.user?.id
  if (!uid || !myGenres.length) {
    // Fallback: return most active users
    const { data } = await supabase.from('profiles').select('*').limit(10)
    return (data || []).filter(u => u.id !== uid).slice(0, limit)
  }

  // Users who've logged games with matching genres (not already following)
  const genrePattern = myGenres.slice(0,3).join('|')
  const { data: logs } = await supabase
    .from('logs').select('user_id, genres')
    .ilike('genres', `%${myGenres[0]}%`)
    .neq('user_id', uid)
    .limit(50)

  if (!logs?.length) return []

  // Count genre matches per user
  const scores = {}
  logs.forEach(l => {
    const g = l.genres || ''
    const matches = myGenres.filter(genre => g.includes(genre)).length
    if (matches > 0) scores[l.user_id] = (scores[l.user_id] || 0) + matches
  })

  const topUserIds = Object.entries(scores)
    .sort((a,b) => b[1]-a[1]).slice(0, limit*2).map(([id]) => id)
  if (!topUserIds.length) return []

  // Filter out already-following
  const { data: following } = await supabase
    .from('follows').select('following_id').eq('follower_id', uid)
  const followingSet = new Set((following||[]).map(f => f.following_id))

  const candidates = topUserIds.filter(id => !followingSet.has(id))
  if (!candidates.length) return []

  const { data: profiles } = await supabase
    .from('profiles').select('*').in('id', candidates.slice(0, limit))
  return (profiles || []).map(p => ({ ...p, matchScore: scores[p.id] || 0 }))
}

// ── Review likes ──────────────────────────────────────────────
export async function likeReview(logId) {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return false
  const { error } = await supabase
    .from('review_likes')
    .insert({ user_id: user.id, log_id: logId })
  return !error
}

export async function unlikeReview(logId) {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return false
  await supabase.from('review_likes')
    .delete()
    .eq('user_id', user.id)
    .eq('log_id', logId)
  return true
}

export async function getMyLikes() {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return new Set()
  const { data } = await supabase
    .from('review_likes')
    .select('log_id')
    .eq('user_id', user.id)
  return new Set((data || []).map(r => r.log_id))
}
