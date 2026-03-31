# Playquiem — Android APK Guide

## What you need first (one-time installs)

| Tool | Download | Why |
|------|----------|-----|
| **Node.js 18+** | nodejs.org | Builds the React app |
| **Android Studio** | developer.android.com/studio | Compiles the APK |
| **Java JDK 17** | Included with Android Studio | Required by Gradle |

---

## Step 1 — Install Android Studio

1. Download and install Android Studio
2. On first launch, run the **Setup Wizard** (installs Android SDK automatically)
3. When prompted, install **Android SDK Platform 34**
4. Set the `ANDROID_HOME` environment variable:
   - Windows: Search "Environment Variables" → System Variables → New
   - Name: `ANDROID_HOME`
   - Value: `C:\Users\YOUR_NAME\AppData\Local\Android\Sdk`

---

## Step 2 — Find your PC's WiFi IP

Your phone and PC must be on the **same WiFi network**.

Open Command Prompt and run:
```
ipconfig
```
Look for **IPv4 Address** under your WiFi adapter — e.g. `192.168.1.42`

---

## Step 3 — Run BUILD_ANDROID.bat

Double-click **`BUILD_ANDROID.bat`** in the questlog-react folder.

It will:
1. Ask for your WiFi IP → saves it so the app connects to your backend
2. Install npm dependencies
3. Build the React app
4. Set up Capacitor + Android project
5. Open Android Studio automatically

---

## Step 4 — Build the APK in Android Studio

1. Wait for **Gradle sync** to finish (progress bar at the bottom, ~2-3 min first time)
2. Menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Wait for build to complete
4. Click **"locate"** in the popup, or find the APK at:
   ```
   questlog-react\frontend\android\app\build\outputs\apk\debug\app-debug.apk
   ```

---

## Step 5 — Install on your phone

**Option A — USB cable:**
1. Enable Developer Options on phone (tap Build Number 7 times in Settings → About Phone)
2. Enable USB Debugging
3. In Android Studio: **Run → Run 'app'** — installs directly

**Option B — Transfer the file:**
1. Copy `app-debug.apk` to your phone (USB, Google Drive, email, etc.)
2. On phone: Settings → Security → **Install Unknown Apps** → enable for your file manager
3. Open the APK file → Install

---

## Step 6 — Run the backend

The app needs your PC's backend running. Open Command Prompt in the `backend` folder:
```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

The `--host 0.0.0.0` flag is critical — it lets your phone reach the backend over WiFi.

Keep this running whenever you use the app.

---

## Rebuilding after code changes

Just double-click **`REBUILD_ANDROID.bat`** — it rebuilds and syncs in ~30 seconds.
Then in Android Studio: **Build → Build APK**.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "ANDROID_HOME not set" | Set environment variable (Step 1) |
| "Gradle sync failed" | File → Sync Project with Gradle Files |
| App can't connect to backend | Check phone and PC are on same WiFi |
| "Install blocked" | Enable Unknown Apps in phone settings |
| Blank white screen | Check backend is running with `--host 0.0.0.0` |

---

## Architecture

```
Your Phone (Playquiem APK)
       ↓  WiFi (same network)
Your PC :8000 (FastAPI backend → IGDB API)
       ↓  Internet
  Supabase (database — works from anywhere)
```

Supabase calls work from anywhere because they go directly to the cloud.
Only the IGDB/backend calls need the same WiFi network.
