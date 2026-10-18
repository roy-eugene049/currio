# Currio

**Learn something new every day.**

Currio is a curiosity micro-learning app — bite-sized curios, streaks that stay gentle, topics you choose, and tools that help facts stick. Built with Expo (SDK 57) and Supabase.

**Current version:** 1.5.0

---

## What’s in the app

| Area | Highlights |
|------|------------|
| Daily curios | Reader, shuffle, interest-based feed (local + remote) |
| Habit | Streaks, curiosity nudges, streak-at-risk, soft freeze |
| Library | Bookmarks, named **collections**, topic filters |
| Home widget | Android **Today’s Currio** home-screen widget |
| Quiz | Optional **curiosity quiz** every few curios — one correct answer, skip anytime |
| Share & email | Branded share cards, welcome email, weekly digest |
| Account | Auth + cloud sync via Supabase |

---

## Stack

- **App** — Expo Router, React Native, NativeWind, Zustand, React Query
- **Backend** — Supabase (Auth, Postgres, Edge Functions, RLS)
- **Email** — Resend (welcome + weekly digest)
- **Delivery** — EAS Build

---

## Quick start

```bash
npm install
npx expo start
```

Open with a [development build](https://docs.expo.dev/develop/development-builds/introduction/), simulator/emulator, or Expo Go where compatible.

### Environment

Copy `.env.example` to `.env` and fill in your Supabase (and optional) keys. Restart Metro after changes:

```bash
npx expo start -c
```

### Useful scripts

| Script | Purpose |
|--------|---------|
| `npm run lint` | ESLint |
| `npm run supabase:deploy:functions` | Deploy Edge Functions |
| `npm run build:apk` | EAS preview APK |

Expo SDK reference for this project: [docs.expo.dev/versions/v57.0.0](https://docs.expo.dev/versions/v57.0.0/)

---

## Project layout

```text
src/app/           Expo Router screens
src/components/    UI (reader, bookmarks, challenge, profile, …)
src/services/      Sync, curios, challenges, notifications
src/store/         Zustand app + auth state
supabase/          Migrations + Edge Functions
```

---

## License

Private — all rights reserved unless otherwise noted.
