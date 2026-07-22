# Currio

**Learn something new every day.**

Currio is a curiosity micro-learning app — bite-sized curios, streaks that stay gentle, topics you choose, and tools that help facts stick. Built with Expo (SDK 54) and Supabase.

**Current version:** [1.2.0](./docs/RELEASE_NOTES.md) · [Release notes](./docs/RELEASE_NOTES.md)

---

## What’s in the app

| Area | Highlights |
|------|------------|
| Daily curios | Reader, shuffle, interest-based feed (local + remote) |
| Habit | Streaks, curiosity nudges, streak-at-risk, soft freeze |
| Library | Bookmarks, named **collections**, topic filters |
| Quiz | Optional **curiosity quiz** every few curios — one correct answer, skip anytime |
| Share & email | Branded share cards, welcome email, weekly digest |
| Account | Auth + cloud sync via Supabase |

Full changelog by version: **[docs/RELEASE_NOTES.md](./docs/RELEASE_NOTES.md)**

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

Copy your Supabase and related keys into `.env` (see [docs/BACKEND.md](./docs/BACKEND.md)). Restart Metro after changes:

```bash
npx expo start -c
```

### Useful scripts

| Script | Purpose |
|--------|---------|
| `npm run lint` | ESLint |
| `npm run curios:seed` | Seed the `curios` catalog into Supabase |
| `npm run brand:assets` | Regenerate icon / splash from brand sources |
| `npm run supabase:deploy:functions` | Deploy Edge Functions |
| `npm run build:apk` | EAS preview APK |

---

## Documentation

| Doc | Description |
|-----|-------------|
| [**Release notes**](./docs/RELEASE_NOTES.md) | Shipped features by app version |
| [Feature roadmap](./docs/FEATURE_ROADMAP.md) | Phased product plan |
| [Backend](./docs/BACKEND.md) | Supabase auth, schema, sync |
| [AI engine](./docs/AI_ENGINE.md) | Curio generation & feed architecture |
| [Implementation guide](./docs/IMPLEMENTATION_GUIDE.md) | AI + Pexels setup walkthrough |
| [Welcome email](./docs/WELCOME_EMAIL.md) | Resend welcome flow |
| [Weekly digest](./docs/WEEKLY_DIGEST.md) | Sunday digest setup |

Expo SDK reference for this project: [docs.expo.dev/versions/v54.0.0](https://docs.expo.dev/versions/v54.0.0/)

---

## Project layout

```text
src/app/           Expo Router screens
src/components/    UI (reader, bookmarks, challenge, profile, …)
src/services/      Sync, curios, challenges, notifications
src/store/         Zustand app + auth state
docs/              Product & engineering docs
supabase/          Migrations + Edge Functions
```

---

## License

Private — all rights reserved unless otherwise noted.
