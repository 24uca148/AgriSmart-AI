# AgriSmart AI — Farmer Advisory Platform

### Status: Auth + Dashboard + real ML pipeline, fully merged

## Project Status

This build merges two prior snapshots:

- **Auth + Dashboard build** — full authentication: register, login, logout,
  sessions, captcha, protected routing, an admin panel, and the real
  field-advisory dashboard UI (prediction form, metric cards, charts).
- **ML backend build** — `server/ml_service.py` plus trained
  scikit-learn models (`rf_classifier.pkl`, `rf_regressor.pkl`,
  `dt_classifier.pkl`) and their training data (`synthetic_data.csv`).

They're combined so that **registering logs you straight into the real
dashboard** — there's no separate login step right after signup, since
`POST /api/auth/register` already starts a session for the new user —
and the dashboard's prediction form now returns **real model output**
instead of a stub.

### ✅ Fully built and working

- **Authentication** — register, login, logout, session persistence
  (`/api/auth/*`). Registration collects full name, username, email,
  mobile number, and password (all unique except full name). Login
  accepts a single "identifier" field that matches username OR email
  only — mobile number is collected at registration but isn't usable to
  log in.
- **Register → straight to dashboard** — registering creates the session
  server-side and the client immediately refreshes its user cache and
  navigates to `/`, landing on the live dashboard with no extra login.
- **Captcha** — both the login and register forms show a distorted
  security code with a refresh button (`client/src/components/Captcha.tsx`)
  that must be typed correctly before the form submits. This is
  client-side only — there's no captcha-verification service wired up on
  the server, so it stops typos/casual bots, not a determined attacker.
- **Protected routing** — logged-out users are redirected to `/login`;
  logged-in users reach the dashboard, admins can also reach `/admin`.
- **Bilingual UI (English/Tamil)** — `client/src/lib/i18n.tsx` provides
  an English/Tamil translation layer covering login, register, captcha,
  dashboard, the prediction form, metric cards, charts, and the admin
  panel. A language toggle ("EN | தமிழ்", `LanguageSwitcher` component)
  sits top-right on every page; English is the default, and the choice
  is remembered per-browser via `localStorage`. Dynamic data (crop
  names, risk levels, user records) stays as returned by the backend —
  only the surrounding UI text is translated.
- **Field advisory dashboard** — soil/weather input form
  (`PredictionForm.tsx`), metric cards, and charts, all built with
  Tailwind + shadcn/ui, gated behind login.
- **Soil test report photo upload** — farmers can attach a photo of
  their physical soil test report from the dashboard form
  (`SoilReportUpload.tsx`), right after the N/P/K/pH fields. The photo
  is resized client-side (max 1600px, re-encoded as JPEG) and uploaded
  immediately as a base64 data URI to `POST /api/soil-report`, stored on
  the user's row (`soilReportImage`/`soilReportUploadedAt` in
  `shared/schema.ts`) — one report per user, uploading a new one
  replaces the old. Admins see a "Soil Report" column in the user table
  with a "View Report" link that opens the photo in a dialog.
- **Shared type-safe API contract** (`shared/routes.ts`) and data model
  (`shared/schema.ts`) for both the `users` table and the `predictions`
  table.
- **In-memory storage layer** (`server/storage.ts`) implementing user
  CRUD + a seeded default admin account, plus prediction storage.
- **`GET /api/predictions`** — fully functional (returns stored
  predictions), now behind `requireAuth`.
- **Per-farmer data isolation** — every prediction is tied to the
  `userId` of whoever created it. `GET /api/predictions` and
  `POST /api/predictions` only ever read/write the logged-in user's own
  rows, so each farmer sees only their own analysis history, and a newly
  registered/logged-in user always starts with a clean slate.
- **Real ML predictions** — `POST /api/predictions` shells out to
  `server/ml_service.py`, which loads the trained
  `rf_classifier.pkl` (crop recommendation), `rf_regressor.pkl` (yield),
  and `dt_classifier.pkl` (pest risk) models and returns real output
  for the submitted soil/weather metrics. `POST /api/synthetic-data`
  regenerates the synthetic training set and retrains all three models.
  Requires a `python3` (or `python` on Windows) on `PATH` with the
  packages listed in `pyproject.toml` (`numpy`, `pandas`,
  `scikit-learn`) installed — override the interpreter name with the
  `PYTHON_BIN` env var if needed.
- **Automatic fallback when Python isn't available** — if the Python ML
  service can't run (Python isn't installed, the packages are missing,
  etc.), `POST /api/predictions` doesn't fail — it transparently falls
  back to a deterministic JS heuristic so the app still works out of the
  box. The server logs a one-time console warning explaining what's
  missing and how to install it so you get the real model-backed
  predictions. `POST /api/synthetic-data` similarly returns a friendly
  "skipped, Python not available" message (200) instead of erroring,
  since retraining specifically does need Python.
- **Admin panel** — `client/src/pages/Admin.tsx` at `/admin`, gated by a
  `requireAuth` + `requireAdmin` middleware pair on the server
  (`GET /api/admin/users`). Non-admins are redirected to `/`, guests to
  `/login`. Admins see a link to it on the dashboard header. It's a
  read-only user directory for now — no create/edit/delete actions yet.
- **Admin "who's logged in" view** — the admin user table has a Status
  column showing **Online**/**Offline** per user, computed from real
  active sessions (not just a `lastLogin` timestamp): a user counts as
  online for as long as their session is valid, and flips to offline the
  moment they log out or their session expires.
- **Admin sign-in toggle** — the login page has an "Administrator? Sign in
  here" link that switches the form into admin mode; logging in that way
  sends `adminMode: true` to `/api/auth/login`, which the server rejects
  for non-admin accounts, and on success routes straight to `/admin`.
- **PostgreSQL persistence** — set `DATABASE_URL` to a Postgres
  connection string and both user accounts and predictions are stored in
  real Postgres tables (via Drizzle) instead of resetting on every
  restart. Sessions move to Postgres too (via `connect-pg-simple`), so
  logins — and the admin online/offline view — also survive a restart.
  If `DATABASE_URL` isn't set, the app automatically falls back to
  in-memory storage/sessions (handy for a quick local trial, but data
  resets whenever the server restarts).

### ❌ Not started

- **Admin write actions** — the admin panel can view users but can't yet
  promote/demote admins, deactivate accounts, or manage predictions data.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Wouter
- **Backend:** Node.js, Express 5, express-session, bcryptjs, Zod
- **Shared:** Drizzle ORM (`users` + `predictions` schemas)
- **Database:** PostgreSQL (via `pg` + Drizzle) when `DATABASE_URL` is set; otherwise an in-memory fallback

## Getting Started

```bash
npm install
pip install -r <(python3 -c "import tomllib,sys; print('\n'.join(tomllib.load(open('pyproject.toml','rb'))['project']['dependencies']))")
# (or simply: pip install numpy==1.26.0 pandas==2.1.1 scikit-learn==1.3.2)

# Optional but recommended: point at a real Postgres database so data
# and sessions persist across restarts.
export DATABASE_URL="postgres://user:password@localhost:5432/agrismart"
npm run db:push   # creates the users/predictions tables from shared/schema.ts

npm run dev
```

The app serves both the API and the client on `http://localhost:5000`.
On Windows, `run_agri.bat` does the same (installs deps if needed, then
starts the dev server and opens the browser) — install the Python
dependencies above separately first, and set `DATABASE_URL` before
running it if you want Postgres persistence.

If `DATABASE_URL` is not set, the server logs
`[storage] DATABASE_URL not set — using in-memory storage` and runs
fully functional but non-persistent (all data resets on restart) — handy
for a quick trial without setting up Postgres first.

### Default admin account

A default admin account is seeded automatically on first run:

- Username: `admin`
- Password: `admin123`

Override with `DEFAULT_ADMIN_USERNAME`, `DEFAULT_ADMIN_PASSWORD`, and
`DEFAULT_ADMIN_EMAIL` environment variables.

### Try it out

1. Install Python + Node deps (see above), then `npm run dev`.
2. Go to `http://localhost:5000/register` and create an account.
3. You'll land straight on the dashboard — no separate login needed.
4. Fill in the field-metrics form and submit: it returns a real crop
   recommendation, yield estimate, pest-risk level, and irrigation
   guidance from the trained models.
5. Log out and register a second account (or open a private/incognito
   window): it starts with zero analyses — you'll never see the first
   user's predictions.
6. Log in as `admin` / `admin123` and open the Admin panel: every
   registered user is listed with an **Online**/**Offline** status badge
   reflecting who's actually got a live session right now.

## Project Structure

```
client/           React frontend
  src/pages/       Login, Register, Dashboard (real UI), Admin, not-found
  src/components/dashboard/  PredictionForm, MetricCards, PredictionCharts
  src/hooks/       use-auth, use-predictions, use-toast, use-mobile
server/           Express backend
  routes.ts        Auth routes, admin routes, predictions routes (all requireAuth-gated except auth itself); computes each user's online/offline status for the admin view
  storage.ts       Storage layer: PostgreSQL-backed (DbStorage) when DATABASE_URL is set, in-memory (MemStorage) fallback otherwise — same IStorage interface either way
  db.ts            PostgreSQL connection (pg + Drizzle), only used when DATABASE_URL is set
  index.ts         App entry point / session setup (Postgres-backed sessions via connect-pg-simple when DATABASE_URL is set, in-memory otherwise)
  ml_service.py    Loads/trains the crop, yield & pest-risk models; invoked as a subprocess
  rf_classifier.pkl, rf_regressor.pkl, dt_classifier.pkl   Trained scikit-learn models
  synthetic_data.csv   Training data used to produce the models above
shared/           Code shared between client and server
  schema.ts        `users` table + `predictions` table (with a `userId` foreign key) + Zod schemas
  routes.ts        Typed API contract (auth, admin, predictions)
pyproject.toml     Python deps (numpy/pandas/scikit-learn) for server/ml_service.py
```

## API Endpoints

| Method | Path                  | Status |
|--------|-----------------------|--------|
| POST   | `/api/auth/register`  | ✅ Working (auto-logs in) |
| POST   | `/api/auth/login`     | ✅ Working |
| POST   | `/api/auth/logout`    | ✅ Working |
| GET    | `/api/auth/me`        | ✅ Working |
| GET    | `/api/admin/users`    | ✅ Working (requires logged-in admin) — includes each user's `isOnline` status |
| GET    | `/api/predictions`    | ✅ Working (requires login, scoped to the current user only) |
| POST   | `/api/predictions`    | ✅ Working — real ML prediction via `ml_service.py`, saved against the current user |
| POST   | `/api/synthetic-data` | ✅ Working — regenerates data & retrains all 3 models |
| POST   | `/api/soil-report`    | ✅ Working — uploads/replaces the current user's soil test report photo |
