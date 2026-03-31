# 🎮 QuestLog React

Letterboxd for video games — built with React + FastAPI + Supabase.

## Requirements
- **Python 3.10+** — https://python.org
- **Node.js 18+** — https://nodejs.org

## Quick Start

### Windows
```
Double-click START.bat
```

### Mac / Linux
```bash
chmod +x start.sh
./start.sh
```

Open **http://localhost:3000** in your browser.

---

## Why React instead of Streamlit?

| Feature | Streamlit | React |
|---------|-----------|-------|
| Infinite scroll | ❌ Impossible without buttons | ✅ Native IntersectionObserver |
| Login across tabs | ❌ New WebSocket = new session | ✅ Supabase localStorage auto |
| Real-time UI | ❌ Full page rerun on every click | ✅ Component-level updates |
| Performance | ❌ Python rerun for everything | ✅ Fast client-side rendering |

## Architecture

```
Browser (React + Vite)
  ↓ IGDB calls        ↓ Auth + DB calls
FastAPI (Python)    Supabase (cloud)
  ↓
IGDB API
```

- **Frontend** (port 3000): React + Tailwind + Zustand + React Router
- **Backend** (port 8000): FastAPI — only used for IGDB (requires server-side auth)
- **Database**: Supabase — same schema as the Streamlit version, fully compatible

## Features
- ♾️ True infinite scroll — no buttons, no reloads
- 🔐 Persistent login — stays logged in across tabs, windows, restarts
- 🎮 500,000+ games from IGDB
- ⭐ Log, rate, and review games
- 👥 Follow friends, see their activity
- 🎯 Game detail pages with screenshots, trailers, reviews
- 📊 Personal dashboard with stats
- 🔍 Search games and members

## Deployment

### Frontend → Vercel (free)
1. Push the `frontend/` folder to GitHub
2. Import on vercel.com
3. Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `VITE_API_URL`

### Backend → Railway / Render (free tier)
1. Push the `backend/` folder to GitHub
2. Deploy on railway.app or render.com
3. Set env vars: `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET`
