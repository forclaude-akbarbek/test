# Horizon SAT — demo

A clickable demo of a Digital SAT preparation platform for Uzbekistan (B2C students, B2B private schools, B2G government schools).
It is a **front-end-only prototype** for presenting to partners: all content (questions, vocabulary, scores, school names, prices) is placeholder data, and everything is stored in the browser.

## Demo logins

The login page has one-click "Demo access" buttons. Credentials:

| Account | Email | Password | Lands on |
|---|---|---|---|
| Student (B2C) | student@horizonsat.uz | demo1234 | Student portal (8 sections) |
| Private school (B2B) | school@horizonsat.uz | school1234 | B2B portal placeholder |
| Government school (B2G) | gov@horizonsat.uz | gov1234 | B2G portal placeholder |
| Admin | admin@horizonsat.uz | admin1234 | Admin panel (create B2B/B2G accounts) |

Students can also sign up. B2B/B2G accounts can only be created by the admin. **Admin → Reset demo** restores the original data before a presentation.

## What's included

- **Landing page** — Apple-style, animated, light/dark mode.
- **Student portal** — Dashboard, Practice, Study Plan, Results, Analytics, Question Bank, Vocabulary, Subscription.
- **Bluebook-style exam** — 2 adaptive modules per section, timer (hide/show), question navigator, mark for review, answer eliminator, highlighter, reference sheet, Desmos calculator, grid-in answers, break screen, autosave/resume, check-your-work page.
- **Free plan limits** — 1 full exam and 1 AI study plan per month, 5 new words per day; Premium (simulated Payme/Click/Uzum checkout) unlocks unlimited.
- **Admin panel** — create, disable and delete school accounts.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Deploy (Vercel, free)

1. Sign in at vercel.com with GitHub and click **Add New → Project**.
2. Import this repository and choose the branch. Vercel detects Vite automatically (build: `npm run build`, output: `dist`).
3. Click **Deploy**. Every push to the branch updates the same link.

## Notes for the production team

- Scoring uses a placeholder scale (`src/data/tests.ts → scaleSection`); replace with official conversion tables.
- `src/lib/store.ts` is the only data layer — replace its functions with API calls.
- Desmos uses the public demo key from the Desmos API docs; production needs a licensed key.
- The AI study plan is rule-based in the demo (`src/pages/portal/StudyPlan.tsx → generatePlan`); swap in a model call.
