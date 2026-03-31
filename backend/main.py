"""
QuestLog Backend — FastAPI
Handles IGDB API calls (requires server-side Twitch auth)
Run: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests, os, re, xml.etree.ElementTree as ET
from functools import lru_cache
from datetime import datetime, timedelta

app = FastAPI(title="Playquiem API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── IGDB credentials ─────────────────────────────────────────
IGDB_CLIENT_ID     = os.getenv("IGDB_CLIENT_ID",     "8bholkiyi0854wqobf3t3e9t9gsaeh")
IGDB_CLIENT_SECRET = os.getenv("IGDB_CLIENT_SECRET",  "o02u8ztqki1w66w200s1a31jk44rgo")

_token_cache = {"token": None, "expires": datetime.min}

def get_igdb_token() -> str:
    global _token_cache
    if _token_cache["token"] and datetime.utcnow() < _token_cache["expires"]:
        return _token_cache["token"]
    r = requests.post("https://id.twitch.tv/oauth2/token", params={
        "client_id": IGDB_CLIENT_ID,
        "client_secret": IGDB_CLIENT_SECRET,
        "grant_type": "client_credentials"
    }, timeout=10)
    r.raise_for_status()
    data = r.json()
    _token_cache["token"] = data["access_token"]
    _token_cache["expires"] = datetime.utcnow() + timedelta(seconds=data["expires_in"] - 60)
    return _token_cache["token"]

def igdb(endpoint: str, body: str) -> list:
    token = get_igdb_token()
    r = requests.post(
        f"https://api.igdb.com/v4/{endpoint}",
        headers={"Client-ID": IGDB_CLIENT_ID, "Authorization": f"Bearer {token}"},
        data=body, timeout=12
    )
    return r.json() if r.ok else []

BASE_FIELDS = (
    "fields name,cover.url,first_release_date,genres.name,"
    "platforms.name,summary,total_rating,total_rating_count,hypes,follows;"
)

def fmt(raw: dict) -> dict:
    c = raw.get("cover", {}).get("url", "")
    if c: c = "https:" + c.replace("t_thumb", "t_cover_big")
    ts  = raw.get("first_release_date", 0)
    yr  = datetime.utcfromtimestamp(ts).year if ts else None
    rel = datetime.utcfromtimestamp(ts).strftime("%b %d, %Y") if ts else "TBA"
    return {
        "id":          raw["id"],
        "title":       raw.get("name", "?"),
        "cover":       c,
        "year":        yr,
        "released":    rel,
        "releaseTs":   ts,
        "genres":      [g["name"] for g in raw.get("genres", [])],
        "platforms":   [p["name"] for p in raw.get("platforms", [])],
        "summary":     raw.get("summary", ""),
        "rating":      round(raw.get("total_rating", 0) or 0, 1),
        "ratingCount": raw.get("total_rating_count", 0) or 0,
        "hypes":       raw.get("hypes", 0) or 0,
        "follows":     raw.get("follows", 0) or 0,
        # These are set by trending endpoint; default False/None for other endpoints
        "steamTrending": False,
        "trendScore":    None,
    }

# ── Endpoints ────────────────────────────────────────────────

@app.get("/api/games")
def get_games(
    offset:   int = Query(0, ge=0),
    limit:    int = Query(20, ge=1, le=40),
    genre:    str = Query(""),
    sort:     str = Query("rating"),
    q:        str = Query(""),
    platform: str = Query(""),
):
    sort_map = {
        "rating":     "total_rating desc",
        "popular":    "follows desc",
        "newest":     "first_release_date desc",
        "anticipated":"hypes desc",
    }
    sf = sort_map.get(sort, "total_rating desc")

    # Hardcoded platform IDs — most reliable method for IGDB
    PLATFORM_IDS = {
        "PC":               6,
        "PS1":              7,
        "PS2":              8,
        "PS3":              9,
        "PS4":              48,
        "PS5":              167,
        "Xbox 360":         12,
        "Xbox One":         49,
        "Xbox Series X|S":  169,
        "Nintendo Switch":  130,
        "Nintendo 64":      4,
        "Nintendo DS":      20,
        "Nintendo 3DS":     37,
        "Game Boy Advance": 24,
        "iOS":              39,
        "Android":          34,
    }

    pid = PLATFORM_IDS.get(platform) if platform else None

    if platform and pid is None:
        return []  # unknown platform

    # When platform is selected, use IGDB search with platform in where clause
    # Use IGDB array syntax: platforms = (ID) means "game is on this platform"
    if pid:
        base = f"cover != null & platforms = [{pid}]"
        if genre:
            graw = igdb("genres", f'fields id; where name = "{genre}"; limit 1;')
            if graw:
                base += f" & genres = [{graw[0]['id']}]"
        if q:
            # search + platform filter combined
            body = f'search "{q}"; {BASE_FIELDS} where {base}; limit {limit};' 
        else:
            body = f"{BASE_FIELDS} where {base}; sort {sf}; limit {limit}; offset {offset};"
        raw = igdb("games", body)
        return [fmt(g) for g in raw]

    # No platform filter
    if q:
        raw = igdb("games", f'search "{q}"; {BASE_FIELDS} limit {limit};')
        return [fmt(g) for g in raw]

    where = "cover != null & genres != null & total_rating_count > 10"

    if genre:
        graw = igdb("genres", f'fields id; where name = "{genre}"; limit 1;')
        if not graw:
            return []
        where += f" & genres = [{graw[0]['id']}]"

    body = f"{BASE_FIELDS} where {where}; sort {sf}; limit {limit}; offset {offset};"
    return [fmt(g) for g in igdb("games", body)]


@app.get("/api/games/{game_id}")
def get_game(game_id: int):
    raw = igdb("games",
        "fields name,cover.url,artworks.url,screenshots.url,"
        "first_release_date,genres.name,platforms.name,"
        "involved_companies.company.name,involved_companies.developer,"
        "involved_companies.publisher,"
        "summary,storyline,total_rating,total_rating_count,"
        "aggregated_rating,aggregated_rating_count,"
        "hypes,follows,franchise.name,"
        "similar_games.name,similar_games.cover.url,"
        "similar_games.total_rating,similar_games.genres.name,"
        "similar_games.platforms.name,similar_games.first_release_date,"
        "videos.video_id,videos.name,game_modes.name,themes.name;"
        f" where id={game_id}; limit 1;")
    if not raw:
        raise HTTPException(404, "Game not found")
    r = raw[0]

    cover = r.get("cover", {}).get("url", "")
    if cover: cover = "https:" + cover.replace("t_thumb", "t_cover_big")

    shots = []
    for s in r.get("screenshots", [])[:8]:
        u = s.get("url", "")
        if u: shots.append("https:" + u.replace("t_thumb", "t_screenshot_big"))
    for s in r.get("artworks", [])[:4]:
        u = s.get("url", "")
        if u: shots.append("https:" + u.replace("t_thumb", "t_screenshot_big"))

    devs, pubs = [], []
    for ic in r.get("involved_companies", []):
        name = ic.get("company", {}).get("name", "")
        if ic.get("developer"): devs.append(name)
        if ic.get("publisher"): pubs.append(name)

    ts = r.get("first_release_date", 0)

    similar = []
    for sg in r.get("similar_games", [])[:8]:
        sc = sg.get("cover", {}).get("url", "")
        if sc: sc = "https:" + sc.replace("t_thumb", "t_cover_big")
        sts = sg.get("first_release_date", 0)
        similar.append({
            "id": sg["id"], "title": sg.get("name","?"), "cover": sc,
            "year": datetime.utcfromtimestamp(sts).year if sts else None,
            "genres": [g["name"] for g in sg.get("genres",[])],
            "platforms": [p["name"] for p in sg.get("platforms",[])],
            "rating": round(sg.get("total_rating",0) or 0, 1),
            "summary": "", "hypes": 0, "releaseTs": sts,
        })

    return {
        "id": r["id"], "title": r.get("name","?"),
        "cover": cover, "screenshots": shots,
        "year": datetime.utcfromtimestamp(ts).year if ts else None,
        "released": datetime.utcfromtimestamp(ts).strftime("%B %d, %Y") if ts else "TBA",
        "releaseTs": ts,
        "genres":    [g["name"] for g in r.get("genres", [])],
        "platforms": [p["name"] for p in r.get("platforms", [])],
        "summary":   r.get("summary", ""),
        "storyline": r.get("storyline", ""),
        "developers": devs, "publishers": pubs,
        "rating":      round(r.get("total_rating", 0) or 0, 1),
        "ratingCount": r.get("total_rating_count", 0) or 0,
        "criticScore": round(r.get("aggregated_rating", 0) or 0, 1),
        "criticCount": r.get("aggregated_rating_count", 0) or 0,
        "hypes":       r.get("hypes", 0) or 0,
        "franchise":   r.get("franchise", {}).get("name", "") if r.get("franchise") else "",
        "videos":      [{"id": v["video_id"], "name": v.get("name","Trailer")} for v in r.get("videos", [])[:3]],
        "gameModes":   [m["name"] for m in r.get("game_modes", [])],
        "themes":      [t["name"] for t in r.get("themes", [])],
        "similar":     similar,
    }


# ── 1-hour cache for trending ────────────────────────────────
_trending_cache: dict = {"data": [], "ts": datetime.min}

def _fetch_steam_trending() -> list[int]:
    """
    Fetch top app IDs from SteamSpy (free, no key needed).
    Returns list of Steam appids sorted by 2-week player count.
    Falls back to empty list on any error.
    """
    try:
        # SteamSpy top100in2weeks — free endpoint, no auth required
        r = requests.get(
            "https://steamspy.com/api.php?request=top100in2weeks",
            timeout=6, headers={"User-Agent": "QuestLog/1.0"}
        )
        if not r.ok:
            return []
        data = r.json()
        # Sort by ccu_average (avg concurrent players over 2 weeks)
        sorted_apps = sorted(
            data.items(),
            key=lambda x: x[1].get("ccu_average", 0),
            reverse=True
        )
        return [int(appid) for appid, _ in sorted_apps[:30]]
    except Exception:
        return []

def _steam_appids_to_igdb(appids: list[int]) -> list[dict]:
    """
    Cross-reference Steam appids to IGDB games via external_games table.
    category=1 means Steam.
    """
    if not appids:
        return []
    uid_str = ",".join(str(a) for a in appids)
    ext = igdb("external_games",
        f"fields game,uid; where category=1 & uid=({uid_str}); limit 30;")
    igdb_ids = list({str(e["game"]) for e in ext if e.get("game")})
    if not igdb_ids:
        return []
    id_str = ",".join(igdb_ids[:20])
    raw = igdb("games",
        BASE_FIELDS + f" where id=({id_str}) & cover!=null; limit 20;")
    return raw

@app.get("/api/trending")
def get_trending(limit: int = 20):
    """
    'Popular Right Now' — hybrid IGDB + SteamSpy ranking.

    Sources:
      A) SteamSpy top100in2weeks → avg concurrent players → cross-ref to IGDB
         These games get a 'steam_trending' badge and top weighting.

      B) IGDB follows (users tracking game) — strongest IGDB popularity signal

      C) IGDB total_rating_count — volume of ratings ≈ playerbase size,
         filtered to total_rating > 70 so quality stays high

      D) IGDB hypes, last 90 days — catches newly released + upcoming titles

    Composite score (lower rank = more popular):
      steam_rank  × 0.40  (real player data — most reliable)
      follow_rank × 0.30  (IGDB engagement)
      rating_rank × 0.20  (longevity / playerbase size)
      hype_rank   × 0.10  (freshness signal)

    Cache: 1 hour (IGDB updates slowly; SteamSpy updates every 10 min but
           we don't need to hammer it)
    """
    global _trending_cache
    age = (datetime.utcnow() - _trending_cache["ts"]).total_seconds()
    if _trending_cache["data"] and age < 3600:
        return _trending_cache["data"][:limit]

    N = limit + 15  # overfetch to survive dedup losses

    # ── Source A: SteamSpy live players → IGDB lookup ────────
    steam_appids = _fetch_steam_trending()
    steam_raw    = _steam_appids_to_igdb(steam_appids)
    # Map igdb_id → steam rank (position in sorted list)
    steam_rank_map: dict[int, int] = {}
    for i, g in enumerate(steam_raw):
        steam_rank_map[g["id"]] = i

    # ── Source B: IGDB follows ────────────────────────────────
    by_follows = igdb("games",
        BASE_FIELDS +
        " where follows!=null & follows>50"
        " & cover!=null & genres!=null;"
        " sort follows desc;"
        f" limit {N};")

    # ── Source C: IGDB rating count (volume) ─────────────────
    by_ratings = igdb("games",
        BASE_FIELDS +
        " where total_rating_count>100 & total_rating>70"
        " & cover!=null & genres!=null;"
        " sort total_rating_count desc;"
        f" limit {N};")

    # ── Source D: IGDB hypes, last 30 days (monthly focus) ──
    d30 = int((datetime.utcnow() - timedelta(days=30)).timestamp())
    by_hypes = igdb("games",
        BASE_FIELDS +
        f" where hypes>10 & cover!=null & genres!=null"
        f" & first_release_date>{d30};"
        " sort hypes desc;"
        f" limit {N};")

    # ── Merge & deduplicate ───────────────────────────────────
    INF = 9999
    seen: dict[int, dict] = {}

    def upsert(gid, raw, field, rank):
        if gid not in seen:
            seen[gid] = {"raw": raw,
                         "steam_rank":  INF,
                         "follow_rank": INF,
                         "rating_rank": INF,
                         "hype_rank":   INF}
        seen[gid][field] = min(seen[gid][field], rank)

    # Steam games start with their steam rank
    for g in steam_raw:
        upsert(g["id"], g, "steam_rank", steam_rank_map[g["id"]])
    for i, g in enumerate(by_follows):
        upsert(g["id"], g, "follow_rank", i)
    for i, g in enumerate(by_ratings):
        upsert(g["id"], g, "rating_rank", i)
    for i, g in enumerate(by_hypes):
        upsert(g["id"], g, "hype_rank", i)

    # ── Composite score ───────────────────────────────────────
    def composite(e: dict) -> float:
        return (
            e["steam_rank"]  * 0.40 +
            e["follow_rank"] * 0.30 +
            e["rating_rank"] * 0.20 +
            e["hype_rank"]   * 0.10
        )

    ranked = sorted(seen.values(), key=composite)

    # ── Format + add dynamic activity metadata ───────────────
    import random, math

    # Seed with current hour so numbers stay stable for 1h but change each hour
    hour_seed = int(datetime.utcnow().strftime("%Y%m%d%H"))

    results = []
    for rank, entry in enumerate(ranked[:limit]):
        game = fmt(entry["raw"])
        is_steam = entry["steam_rank"] < INF

        # ── Simulated activity numbers (weighted by rank + seeded randomness) ──
        # Top-ranked games get higher base counts
        rng = random.Random(hour_seed + game["id"])
        # Monthly activity (30-day window — ~4x weekly numbers)
        base_plays   = max(200, int(32000 / (rank + 1.5)))
        base_entries = max(80,  int(12000 / (rank + 2.0)))

        # Add organic variance ±30%
        plays_this_month   = int(base_plays   * rng.uniform(0.70, 1.30))
        entries_this_month = int(base_entries * rng.uniform(0.70, 1.30))

        # Sleeper hit spike — indie gems punch above their weight
        if rank % 5 == 4:
            spike = rng.uniform(1.6, 2.8)
            plays_this_month   = int(plays_this_month   * spike)
            entries_this_month = int(entries_this_month * spike)

        # Format as compact string: 12345 → "12.3k"
        def compact(n):
            if n >= 1000: return f"{n/1000:.1f}k"
            return str(n)

        # Monthly badge system
        if rank == 0:
            badge = "🔥 #1 This Month"
        elif rank < 3:
            badge = f"🔥 Monthly #{rank+1}"
        elif is_steam:
            badge = "⚡ Steam Hot"
        elif rank % 5 == 4:
            badge = "💎 Sleeper Hit"
        elif entry["hype_rank"] < 5:
            badge = "📈 Rising Fast"
        else:
            badge = f"#{rank+1}"

        game["steamTrending"]    = is_steam
        game["trendScore"]       = round(composite(entry), 1)
        game["trendRank"]        = rank + 1
        game["badge"]            = badge
        game["playsThisMonth"]   = plays_this_month
        game["entriesThisMonth"] = entries_this_month
        game["playsLabel"]       = compact(plays_this_month)
        game["entriesLabel"]     = compact(entries_this_month)
        results.append(game)

    _trending_cache["data"] = results
    _trending_cache["ts"]   = datetime.utcnow()
    return results


@app.get("/api/recent")
def get_recent(limit: int = 20):
    now = int(datetime.utcnow().timestamp())
    d30 = int((datetime.utcnow() - timedelta(days=30)).timestamp())
    raw = igdb("games",
        f"{BASE_FIELDS} where first_release_date>={d30}"
        f" & first_release_date<={now} & cover!=null & genres!=null;"
        f" sort first_release_date desc; limit {limit};")
    return [fmt(g) for g in raw]


@app.get("/api/anticipated")
def get_anticipated(limit: int = 14):
    now = int(datetime.utcnow().timestamp())
    fut = int((datetime.utcnow() + timedelta(days=365)).timestamp())
    raw = igdb("games",
        f"{BASE_FIELDS} where first_release_date>{now}"
        f" & first_release_date<{fut} & hypes>0 & cover!=null;"
        f" sort hypes desc; limit {limit};")
    return [fmt(g) for g in raw]




# ══════════════════════════════════════════════════════════════
#  TRENDING ON PLAYQUIEM
#  Real community data — most logged games this week
# ══════════════════════════════════════════════════════════════
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://wnyedwhpidlxuiamdrro.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndueWVkd2hwaWRseHVpYW1kcnJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MjYxNjUsImV4cCI6MjA4OTQwMjE2NX0.6pJoZNVYIpFmITVdHZ53NU0aIxBcIlQdNb_Re8UWBpA")

def sb_get(table: str, query: str) -> list:
    """Query Supabase REST API directly."""
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/{table}?{query}",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
            },
            timeout=8
        )
        return r.json() if r.ok else []
    except Exception:
        return []

_community_trending_cache: dict = {"data": [], "ts": datetime.min}

@app.get("/api/trending/community")
def get_community_trending(limit: int = Query(12)):
    """
    Trending on Playquiem — games our users logged most in the last 7 days.
    Returns igdb_id, title, cover_url, log_count, avg_rating, recent_reviews.
    Cached 15 minutes.
    """
    global _community_trending_cache
    age = (datetime.utcnow() - _community_trending_cache["ts"]).total_seconds()
    if _community_trending_cache["data"] and age < 900:
        return _community_trending_cache["data"][:limit]

    # Get logs from last 7 days
    since = (datetime.utcnow() - timedelta(days=7)).isoformat()
    rows = sb_get("logs",
        f"select=igdb_id,title,cover_url,rating,review,created_at"
        f"&created_at=gte.{since}"
        f"&igdb_id=not.is.null"
        f"&order=created_at.desc"
        f"&limit=500"
    )

    if not rows:
        return []

    # Aggregate by igdb_id
    from collections import defaultdict
    games: dict = {}
    for row in rows:
        gid = row.get("igdb_id")
        if not gid:
            continue
        if gid not in games:
            games[gid] = {
                "igdb_id":    gid,
                "title":      row.get("title", "?"),
                "cover_url":  row.get("cover_url", ""),
                "log_count":  0,
                "ratings":    [],
                "reviews":    [],
            }
        games[gid]["log_count"] += 1
        if row.get("rating"):
            games[gid]["ratings"].append(row["rating"])
        if row.get("review"):
            games[gid]["reviews"].append(row["review"])

    # Sort by log_count, add computed fields
    ranked = sorted(games.values(), key=lambda x: x["log_count"], reverse=True)

    result = []
    for i, g in enumerate(ranked[:limit]):
        ratings = g["ratings"]
        result.append({
            "rank":        i + 1,
            "igdb_id":     g["igdb_id"],
            "title":       g["title"],
            "cover_url":   g["cover_url"] or "",
            "log_count":   g["log_count"],
            "avg_rating":  round(sum(ratings)/len(ratings), 1) if ratings else None,
            "review_count":len(g["reviews"]),
            "top_review":  g["reviews"][0] if g["reviews"] else None,
            "trending_score": g["log_count"],  # could weight by recency later
        })

    _community_trending_cache["data"] = result
    _community_trending_cache["ts"]   = datetime.utcnow()
    return result


@app.get("/api/trending/community/stats")
def get_community_stats():
    """Global community stats for the homepage widget."""
    since_week  = (datetime.utcnow() - timedelta(days=7)).isoformat()
    since_today = datetime.utcnow().replace(hour=0, minute=0, second=0).isoformat()

    week_logs  = sb_get("logs", f"select=id&created_at=gte.{since_week}&limit=1000")
    today_logs = sb_get("logs", f"select=id&created_at=gte.{since_today}&limit=500")
    reviews    = sb_get("logs", f"select=id&review=not.is.null&created_at=gte.{since_week}&limit=500")

    return {
        "logs_this_week":  len(week_logs),
        "logs_today":      len(today_logs),
        "reviews_this_week": len(reviews),
    }

@app.get("/health")
def health():
    return {"status": "ok"}


# ══════════════════════════════════════════════════════════════
#  GAME RECOMMENDATIONS
#  Based on genres of games the user has rated 4-5 stars
# ══════════════════════════════════════════════════════════════
@app.get("/api/recommendations")
def get_recommendations(genres: str = Query(""), exclude: str = Query("")):
    """
    genres: comma-separated list of genres the user likes
    exclude: comma-separated igdb_ids to exclude (already logged)
    """
    if not genres:
        # Fallback: return top-rated recent games
        raw = igdb("games",
            BASE_FIELDS + " where total_rating>80 & total_rating_count>200"
            " & cover!=null & genres!=null;"
            " sort total_rating desc; limit 12;")
        return [fmt(g) for g in raw]

    genre_list = [g.strip() for g in genres.split(",") if g.strip()][:4]
    exclude_ids = [e.strip() for e in exclude.split(",") if e.strip()]

    all_games = []
    seen_ids  = set(exclude_ids)

    for genre in genre_list:
        graw = igdb("genres", f'fields id; where name="{genre}"; limit 1;')
        if not graw:
            continue
        gid  = graw[0]["id"]
        raw  = igdb("games",
            BASE_FIELDS + f" where genres=({gid})"
            f" & total_rating>75 & total_rating_count>50"
            f" & cover!=null;"
            f" sort total_rating desc; limit 8;")
        for g in raw:
            if str(g["id"]) not in seen_ids:
                all_games.append(fmt(g))
                seen_ids.add(str(g["id"]))

    # Deduplicate and return top 12
    return all_games[:12]


# ══════════════════════════════════════════════════════════════
#  GAME NEWS  (RSS from multiple sources, no API key needed)
# ══════════════════════════════════════════════════════════════
NEWS_FEEDS = [
    ("IGN",           "https://feeds.ign.com/ign/all"),
    ("Eurogamer",     "https://www.eurogamer.net/?format=rss"),
    ("PC Gamer",      "https://www.pcgamer.com/rss/"),
    ("Rock Paper Shotgun", "https://www.rockpapershotgun.com/feed"),
    ("Kotaku",        "https://kotaku.com/rss"),
]

_news_cache: dict = {"data": [], "ts": datetime.min}

@app.get("/api/news")
def get_news(limit: int = Query(20)):
    global _news_cache
    age = (datetime.utcnow() - _news_cache["ts"]).total_seconds()
    if _news_cache["data"] and age < 1800:  # 30-min cache
        return _news_cache["data"][:limit]

    articles = []
    for source, url in NEWS_FEEDS:
        try:
            r = requests.get(url, timeout=6,
                headers={"User-Agent": "Mozilla/5.0 QuestLog/1.0"})
            if not r.ok:
                continue
            root = ET.fromstring(r.content)
            ns   = {"media": "http://search.yahoo.com/mrss/"}

            for item in root.findall(".//item")[:6]:
                title = item.findtext("title", "").strip()
                link  = item.findtext("link",  "").strip()
                desc  = item.findtext("description", "").strip()
                pub   = item.findtext("pubDate", "").strip()

                # Try to extract thumbnail
                thumb = ""
                enc   = item.find("enclosure")
                if enc is not None and enc.get("type", "").startswith("image"):
                    thumb = enc.get("url", "")
                if not thumb:
                    med = item.find("media:thumbnail", ns)
                    if med is not None:
                        thumb = med.get("url", "")
                if not thumb:
                    med = item.find("media:content", ns)
                    if med is not None and "image" in med.get("type", ""):
                        thumb = med.get("url", "")

                # Strip HTML from description
                clean = re.sub(r"<[^>]+>", "", desc)[:200]

                if title and link:
                    articles.append({
                        "title":   title,
                        "link":    link,
                        "summary": clean,
                        "source":  source,
                        "thumb":   thumb,
                        "pubDate": pub,
                    })
        except Exception:
            continue

    # Sort by pubDate (newest first)
    def parse_date(a):
        try:
            from email.utils import parsedate_to_datetime
            return parsedate_to_datetime(a["pubDate"])
        except Exception:
            return datetime.min

    articles.sort(key=parse_date, reverse=True)
    _news_cache["data"] = articles
    _news_cache["ts"]   = datetime.utcnow()
    return articles[:limit]


# ══════════════════════════════════════════════════════════════
#  WHO TO FOLLOW SUGGESTIONS
#  Finds games with shared genres to a given list of genre names
# ══════════════════════════════════════════════════════════════
@app.get("/api/suggestions/games")
def suggest_games_by_genres(genres: str = Query(""), limit: int = Query(6)):
    """Return games matching given genres for 'Who to Follow' taste matching."""
    if not genres:
        return []
    genre_list = [g.strip() for g in genres.split(",") if g.strip()][:3]
    seen = set()
    results = []
    for genre in genre_list:
        graw = igdb("genres", f'fields id; where name="{genre}"; limit 1;')
        if not graw:
            continue
        gid = graw[0]["id"]
        raw = igdb("games",
            BASE_FIELDS + f" where genres=({gid}) & total_rating>80"
            f" & cover!=null; sort total_rating desc; limit 5;")
        for g in raw:
            if g["id"] not in seen:
                seen.add(g["id"])
                results.append(fmt(g))
    return results[:limit]
