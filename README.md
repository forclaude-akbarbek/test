# Horizon SAT — demo

A clickable demo of a Digital SAT preparation platform for Uzbekistan (B2C students, B2B private schools, B2G government schools).
It is a **front-end-only prototype** for presenting to partners: all content (questions, vocabulary, scores, school names, prices) is placeholder data, and everything is stored in the browser.

## Demo logins

The login page has one-click "Demo access" buttons. Credentials:

| Account | Email | Password | Lands on |
|---|---|---|---|
| Student (independent, Free plan) | student@horizonsat.uz | demo1234 | Student portal |
| School student (Registan, 11-A) | jasur@horizonsat.uz | jasur1234 | Student portal with school assignments |
| Teacher (Registan) | teacher@horizonsat.uz | teacher1234 | School portal, own classes only |
| Private school director (B2B) | school@horizonsat.uz | school1234 | School portal |
| Government school (B2G) | gov.school@horizonsat.uz | govschool1234 | School portal (part of the network) |
| Government network (B2G) | gov@horizonsat.uz | gov1234 | Network portal |
| Admin | admin@horizonsat.uz | admin1234 | Admin panel |

Accounts created inside the demo (students, teachers, schools) get a temporary password and must set their own on first sign-in.
Five wrong passwords pause sign-in for 60 seconds. **Admin → Reset demo** restores the original data before a presentation.

## What's included

- **Landing page** — Apple-style, animated, light/dark mode.
- **Student portal** — Dashboard (with school assignments), Practice, Study Plan, Results, Analytics, Question Bank, Vocabulary, Subscription, Settings.
- **Bluebook-style exam** — 2 adaptive modules per section, timer, navigator, mark for review, answer eliminator, highlighter, reference sheet, Desmos, grid-in answers, break screen, autosave/resume.
- **School portal (B2B and government schools)** — Overview, Students (add one or import a list, issue logins, reset passwords), Classes (skills heatmap), Assignments (mocks, section tests, practice sets, vocabulary; completion tracked automatically), Results (distribution, at-risk students), Teachers (logins scoped to their classes), Reports (CSV + printable summary), Settings (licence seats).
- **Government network portal (B2G)** — National overview with a map of Uzbekistan's 14 regions, Regions, Schools (open any school's dashboard read-only), Talent pool with shortlist, national Mock days reaching every school, Reports, school account management.
- **Admin panel** — create private schools, government schools and networks with their administrator login; manage, reset and disable logins.

Everything is connected: a director adds a student → the student signs in and sets a password → sees the assignment → takes it → the director, teacher and network see the result.

## Demo data

All content is placeholder data generated in the browser: 190 original SAT-style questions, 112 vocabulary words, 42 government schools (3 per region) and 1 private school with about 4,900 generated students. Real activity by demo accounts is stored in the browser (localStorage), so each device starts from the same demo state.

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
