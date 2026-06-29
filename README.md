# VibeShare

A personal home for all your vibecoded projects. Store everything, choose what
the world sees, organize by category, and let other people apply to feature
their own projects — with you reviewing every submission first.

## Features

- **Accounts** — sign up / log in. Passwords hashed with bcrypt.
- **Your projects** — add an external link + screenshot, organize by category.
- **Visibility control** — the admin toggles each of their projects public/hidden.
- **Community submissions** — any user can apply with a project; it enters a
  review queue. The admin approves or rejects it before it appears publicly.
- **Admin** — single seeded account (`Capy`). No signup path can create or
  become an admin.
- **Hardened login** — signed JWT session cookies (httpOnly, secure, sameSite),
  rate-limiting with a 15-minute lockout after 5 failed attempts, and
  middleware (`src/proxy.ts`) guarding `/admin` and `/dashboard`.

## Tech

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Drizzle ORM ·
Neon Postgres · jose · bcryptjs.

## Local development

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL + SESSION_SECRET
npm run db:push             # create tables
npm run seed                # seed categories + Capy admin (prints password once)
npm run dev
```

## Deploy

Deployed on Vercel. Set `DATABASE_URL` and `SESSION_SECRET` env vars, run
`npm run db:push` and `npm run seed` against the production database.
