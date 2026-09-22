# TNPSC Tracker — Project Notes

## Current State
- Deployed: https://mypreptrack.vercel.app/
- GitHub: https://github.com/AWT-SRIRAM/STUDENT_CARRER
- Repo folder: S:\mathi\tnpsc-tracker

## What's Built (Phase 1)
- Dashboard with streak, calendar, today's plan, quote of the day
- Syllabus tracker: TNPSC Group 4 (Part A/B/C)
- 6-stage revision system (Learn → R1 → R2 → R3 → R4 → Mastered)
- Due-for-revision panel with due-only gate
- Sick mode (7 days, preserves streak)
- Mock tests: Log + Past Papers tabs
- Daily Affairs: scrapes tnpscthervupettagam.com, auto-saves to notes
- Practice Hub: minnalvegakanitham.in direct links
- AI Quiz: Groq (Llama 4) + Gemini fallback
- Dark mode: pure black + blue accents
- Light mode: soft slate + orange accents
- LocalStorage-based, no login

## Data Keys in localStorage
- tnpsc_progress_v2
- tnpsc_streak, tnpsc_last_date, tnpsc_sick
- tnpsc_xp, tnpsc_xp_date
- tnpsc_actions, tnpsc_actions_date, tnpsc_topics, tnpsc_topics_date
- tnpsc_today_plan
- tnpsc_history, tnpsc_goal_history
- tnpsc_mocks
- tnpsc_onboarding
- tnpsc_daily_notes, tnpsc_ca_cache, tnpsc_ca_date
- tnpsc_attempted_papers
- tnpsc_quote_text, tnpsc_quote_author, tnpsc_quote_date
- tnpsc_dark

## Environment Variables (in .env.local)
- GROQ_API_KEY
- GEMINI_API_KEY
- NEXT_PUBLIC_SUPABASE_URL (added)
- NEXT_PUBLIC_SUPABASE_ANON_KEY (added)

## Supabase Setup
- Project created: yes
- Tables created: profiles, progress, friendships
- RLS enabled: yes
- Project URL: [paste from Supabase settings]
- Region: Mumbai (ap-south-1)

## Phase 2 Plan (Next)
1. Username + password auth (no email)
2. Cross-device sync via Supabase progress table
3. Friend system (search by username, send request, accept)
4. Buddy streak (shared streak between friends)
5. Recovery code for password reset (12-char code shown on signup)
6. Auto-migrate existing localStorage data on first login

## Phase 3 (Later)
- Multi-track support (TANCET, Cloud certs)
- Parent view (read-only dashboard)
- Leaderboards

## Supabase Design Decisions
- Username stored as fake email: username@tnpsc-app.local
- Progress stored as single JSON blob per user per track
- RLS policies ensure users only see their own data