import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wnyedwhpidlxuiamdrro.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndueWVkd2hwaWRseHVpYW1kcnJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MjYxNjUsImV4cCI6MjA4OTQwMjE2NX0.6pJoZNVYIpFmITVdHZ53NU0aIxBcIlQdNb_Re8UWBpA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,        // ← stores session in localStorage automatically
    autoRefreshToken: true,      // ← refreshes tokens before expiry
    detectSessionInUrl: true,    // ← handles OAuth redirects
    storageKey: 'questlog-auth', // ← custom key to avoid conflicts
  }
})

export const API = import.meta.env.VITE_API_URL || 'https://playquiem.onrender.com'
