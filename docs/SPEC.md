# Sports Ladder Challenge Spec

## Scope & Architecture
- Modern, mobile-first web app for racket-sport ladders (squash/tennis/badminton, etc.).
- Frontend: Next.js + Tailwind CSS, hosted on Vercel; data fetching via React Query/SWR.
- Backend: Next.js API routes or Supabase Edge Functions.
- Data: PostgreSQL (Supabase) + Supabase Storage (avatars/screenshots), Supabase Auth (email/password; social later).
- Notifications: In-app, optional email; RBAC for admin/organizer/player/guest.
- Testing: Playwright/Cypress (E2E) + Jest (unit).

## Core Domain Entities (summary)
- User: id, name, email, avatar, bio, preferredSport, role (player|organizer|admin), createdAt, updatedAt.
- PlayerProfile: userId, per-ladder ranking snapshot, stats (wins, losses, noShows).
- Sport: id, name, scoringRules.
- Ladder: id, name, description, sportId, location, status (active|inactive), visibility (public|private), challengeRules, rankingRules.
- LadderMembership: ladderId, userId, joinDate, currentRank.
- Challenge: id, ladderId, challengerId, challengedId, createdAt, status (Pending|Accepted|Declined|Completed|Expired|Cancelled), scheduledDateTime, location, notes.
- Match: id, ladderId, challengeId?, player1Id, player2Id, setScores (array/JSON), winnerId, status (Submitted|Confirmed|Disputed), confirmedById, disputedById, playedAt.
- Season: id, ladderId, name, startDate, endDate, archived.
- Notification: id, userId, type, message, link, read, createdAt.
- AuditLog: entityType, entityId, action, performedBy, timestamp.

## Ranking Rules (configurable per ladder)
`rankingRules.type` options:
- `swap-positions`: lower-ranked winner swaps with higher-ranked loser; higher-ranked winner → no change.
- `default-swap-minimal-drop` (default):
  - If lower-ranked player wins: swap positions.
  - If higher-ranked player wins: winner stays; loser drops exactly one rank; players between shift accordingly.
- `slide-shift`: lower-ranked winner moves to loser position; loser drops one; all players between shift down by one.
- `points-elo` (future): point/Elo model; rankings sorted by score.

Atomic recalculation requirements (on every confirmed match):
- Perform ranking updates inside a transaction to avoid partial updates.
- Optional ranking history table for auditing/versioning.
- Emit AuditLog entry: "Ranking updated due to Match #<matchId>".

## Challenge Rules (extended and configurable)
Challenge rules are stored per ladder as `challengeRules` with the following shape:
```json
{
  "maxPositionsUp": <number>,
  "preventChallengingBusyPlayers": <boolean>,
  "maxActiveChallengesPerPlayer": <number>,
  "expiryDays": <number>
}
```

Rule definitions:
- `maxPositionsUp`: challenger may only target opponents up to this many ranks above their current rank.
- `preventChallengingBusyPlayers` (default true recommended): when true, a player cannot be challenged if they are busy (see busy definition below).
- `maxActiveChallengesPerPlayer`: cap on how many active challenges (sent or received) a single player may have at once.
- `expiryDays`: pending challenges auto-expire after this many days from creation.

Busy definition (used when `preventChallengingBusyPlayers` is true): a player is busy if they have any of the following involving them:
- A `Pending` challenge (sent or received).
- An `Accepted` challenge scheduled for a future date/time.
- A submitted match awaiting confirmation (status `Submitted`).

Required validation before creating a challenge
1) Rank range: challenged player must be within `maxPositionsUp` above the challenger.
2) Membership: both players must be active ladder members; neither is banned/suspended.
3) Busy checks (when `preventChallengingBusyPlayers` is true): challenged player not busy; challenger not busy.
4) Active challenge cap: neither player exceeds `maxActiveChallengesPerPlayer` active challenges (sent + received).
5) Self-challenge: challenger and challenged must differ.

If any rule fails, return clear, user-friendly errors, e.g.:
- "This player is currently engaged in an ongoing challenge or match." (busy rule)
- "You already have the maximum number of active challenges for this ladder." (cap rule)
- "You can only challenge up to <maxPositionsUp> positions above your current rank." (range rule)

## Notes
- Auto-expiry job/process should mark challenges `Expired` once `expiryDays` is reached.
- Challenge creation, acceptance, expiry, and match confirmation events should trigger notifications to involved players.
- All sensitive actions (challenge create/accept/decline, match submit/confirm/dispute, ranking update) must log to `AuditLog`.
