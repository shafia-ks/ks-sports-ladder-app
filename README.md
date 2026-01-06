# ks-sports-ladder-app
Modern ladder challenge app for squash and racket sports. Next.js 14 App Router, Tailwind, React Query, Supabase, and configurable ranking/challenge rules per ladder.

## Color Palette

### Brand Colors (Primary Blue)
- `brand-50`: #f2f8ff (lightest)
- `brand-100`: #dcebff
- `brand-200`: #b3d4ff
- `brand-500`: #2e7bff (base)
- `brand-600`: #1f5fd6 (buttons)
- `brand-700`: #1649a6 (hover)
- `brand-900`: #0a234d (darkest)

### Semantic Colors
- **Success**: Green scale (#22c55e base) - used for confirmed, accepted states
- **Warning**: Amber scale (#f59e0b base) - used for pending, awaiting states
- **Danger**: Red scale (#ef4444 base) - used for declined, disputed, error states
- **Info**: Sky blue scale (#0ea5e9 base) - used for informational badges
- **Neutral**: Slate scale - default text, borders, backgrounds

## UI Components

### Badges
- `.badge-brand`, `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`, `.badge-neutral`
- Usage: `<Badge variant="success" icon={Check}>Accepted</Badge>`

### Buttons
- `.btn-primary` (brand blue), `.btn-secondary` (outlined), `.btn-danger` (red)
- Usage: `<button className="btn btn-primary">Create</button>`

### Status Badges
- `<StatusBadge status="Pending" type="challenge" />` - auto-detects icon and color

### Progress Bars
- `<ProgressBar value={60} max={100} label="Win Rate" showPercentage />`

### Stat Cards
- `<StatCard title="Current Rank" value="#4" icon={Trophy} trend={{ value: 2, isPositive: true }} />`

### Icons (lucide-react)
- Trophy, Swords, Target, Calendar, MapPin, Bell, Settings, Home, LayoutDashboard, Menu, X, Check, Clock, AlertCircle

## Getting started
1) Install deps: `npm install`
2) Copy `.env.example` to `.env.local` and set Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`).
   > **Note on Migration**: We are migrating from `SUPABASE_SERVICE_ROLE_KEY` to `SUPABASE_SECRET_KEY`. The old key is still supported for backward compatibility but will print a warning in development. Please update your `.env` files to use `SUPABASE_SECRET_KEY`.
3) Run dev server: `npm run dev`
4) Run unit tests: `npm test`
5) Run E2E (Playwright): `npm run e2e` (start dev server first)

## Key tech
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + custom Space Grotesk font
- React Query for data fetching
- Supabase (auth, DB, storage) client stub in `src/lib/supabase/client.ts`
- Zod for API validation
- Jest + Testing Library; Playwright for E2E

## Notable modules
- `docs/SPEC.md`: product and rules spec, including ranking + challenge constraints.
- `src/types/domain.ts`: domain model definitions.
- `src/lib/ranking/ranking-engine.ts`: pluggable ranking logic (swap, default minimal-drop, slide, future points/Elo).
- `src/lib/challenges/validation.ts`: ladder challenge validation (range, busy checks, active cap, self-prevention).
- API stubs under `src/app/api/*` for ladders, challenges, matches, notifications.
- UI shell under `src/app/*` with pages for dashboards, ladders, challenges, matches, admin, seasons, disputes, notifications.

## Next steps
- Apply schema: run `docs/supabase/schema.sql` in Supabase SQL editor or CLI.
- Wire Supabase auth and RLS: configure email/password, enable RLS, add policies for ladders/challenges/matches/notifications.
- Replace server routes to use user session (instead of service role) where appropriate; keep service role for admin tasks.
- Add route protection middleware and RBAC checks.
- Expand UI to use live data via React Query hooks (`src/features/*`).
- Add scheduled job/cron (Supabase cron or external) for challenge auto-expiry.
- Implement notifications delivery (in-app + optional email) and audit logging.
