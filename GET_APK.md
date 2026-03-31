# How to get your Playquiem APK from GitHub (free, no Android Studio)

## What happens
You push code to GitHub → GitHub's servers build the APK → You download it.
Total time: ~10 minutes first time, ~5 minutes after.

---

## Step 1 — Create a free GitHub account
Go to **github.com** → Sign up (free)

---

## Step 2 — Create a new repository
1. Click **+** → **New repository**
2. Name it `playquiem`
3. Set to **Private** (your Supabase keys are in the code)
4. Click **Create repository**

---

## Step 3 — Install Git (if not installed)
Download from **git-scm.com** → install with defaults

---

## Step 4 — Push your code
Open Command Prompt inside the `questlog-react` folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/playquiem.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 5 — Watch it build
1. Go to your repo on GitHub
2. Click the **Actions** tab
3. You'll see "Build Android APK" running with a yellow spinner
4. Wait ~5-8 minutes for it to finish (green checkmark ✅)

---

## Step 6 — Download the APK
1. Click on the completed workflow run
2. Scroll down to **Artifacts**
3. Click **playquiem-debug-apk** → downloads a .zip
4. Unzip it → you get `app-debug.apk`

---

## Step 7 — Install on your Android phone
1. Copy `app-debug.apk` to your phone (USB, Google Drive, WhatsApp to yourself, etc.)
2. On phone: **Settings → Security → Install unknown apps → Enable** for your file manager
3. Open the APK file → **Install**
4. Playquiem appears on your home screen 🎮

---

## After making changes
Every time you push new code, GitHub automatically builds a new APK:
```bash
git add .
git commit -m "Update"
git push
```
Then download the new APK from the Actions tab.

---

## Important: The app needs your backend running
The APK connects to your PC's backend over WiFi.
When using the app, run `START.bat` on your PC first.

For a fully standalone app (no PC needed), you'd need to deploy
the backend to a cloud service like Railway.app (free tier available).
