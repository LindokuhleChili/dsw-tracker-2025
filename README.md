# CompuClass Roadmap
**Channel Zero — University of Johannesburg**

A full-stack project tracking dashboard with real-time updates, authentication, and live charts.

---

## Stack
- **Next.js 14** (App Router)
- **Supabase** (Postgres database + Auth + Real-time)
- **Vercel** (hosting)
- **Recharts** (charts)
- **Tailwind CSS** (styling)

---

## Setup Guide (Free — takes ~20 minutes)

### Step 1 — Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → "Start your project" → create a free account
2. Click **New project** → name it `compuclass-roadmap` → choose a region close to South Africa (e.g. EU West)
3. Wait ~2 minutes for it to spin up

### Step 2 — Run the database schema
1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy the entire contents of `supabase-schema.sql` and paste it in
4. Click **Run** — this creates all tables, sets up security rules, and seeds all your project data

### Step 3 — Get your API keys
1. In Supabase, go to **Settings → API**
2. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon / public** key (long string starting with `eyJ...`)

### Step 4 — Create a GitHub repo
1. Go to [github.com](https://github.com) → New repository → name it `compuclass-roadmap`
2. Upload all these project files (or use `git init`, `git add .`, `git commit`, `git push`)

### Step 5 — Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) → create a free account → **Add New Project**
2. Import your GitHub repo
3. In the **Environment Variables** section, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL     = your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-supabase-anon-key
   ```
4. Click **Deploy** — done! Vercel gives you a live URL.

### Step 6 — Create your account
1. Visit your live Vercel URL
2. Click **Sign up** and create an account with your email
3. Log in and you'll see all your project data

---

## Features

### Dashboard (/)
- Live progress stats (tasks done, in progress, to do, story points, days remaining)
- Overall completion bar
- Milestone timeline
- Per-stream summary cards

### Tasks (/tasks)
- All tasks grouped by stream
- **Click any status badge to update it** — charts update instantly everywhere
- Filter by stream or status
- Add new tasks with priority, points, sprint, and month
- Delete tasks

### Charts (/charts)
- Overall status pie chart
- Tasks by stream (stacked bar)
- Story points done vs remaining
- Burndown chart (actual vs ideal)
- Priority distribution
- **All charts update in real-time** when any task status changes — even if another team member changes it

### Milestones (/milestones)
- Timeline view of all milestones
- Click to update status (Complete / Active / Upcoming)
- Add or delete milestones

---

## Local development

```bash
npm install
cp .env.local.example .env.local
# Fill in your Supabase values in .env.local
npm run dev
# Open http://localhost:3000
```

---

## Team
- Lutho Buyaphi — UI Enhancement
- Thabo Kumalo — Gamification
- Kamo (Kamohelo) — Chemistry Lab
- Mila (Emilia) — Documentation
- Lindo — Support & QA

**Deadline: 30 September 2025**
