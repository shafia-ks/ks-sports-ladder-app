# ks-sports-ladder-app — User Guide

## What this app does
A ladder app for racket sports (squash, tennis, badminton, etc.) where players join ladders, issue challenges within rank limits, record match results, and see rankings update automatically per ladder rules.

## Who can use it
- Guests: Can view public ladders if allowed by the organizer.
- Players: Join ladders, issue/accept/decline challenges, submit match results, manage notifications.
- Organizers/Admins: Create and configure ladders, manage memberships, resolve disputes, run seasons, oversee leader requests.

## Key features
- Ladder management: Create ladders, configure challenge and ranking rules per ladder, manage memberships and visibility.
- Challenge guardrails: Enforces max positions up, busy checks, active challenge caps, and auto-expiry timers.
- Match handling: Submit scores, confirm or dispute results, route disputes to organizers/admins.
- Ranking updates: Default swap-with-minimal-drop plus alternative rules; updates run after confirmed matches.
- Notifications and reminders: In-app alerts for challenge and match events; daily reminders for pending challenges.
- Admin workflows: Seasons, disputes, leader requests, and ladder settings for organizers/admins.

## Getting started
1) Sign up (email/password) and log in.
2) Set your profile (name, sport preference, avatar) once available in settings.
3) Join a ladder that fits your sport/location (public ladders) or request access if private.
4) Read the ladder rules (max positions up, busy rules, active challenge cap, expiry days) before challenging.

## Navigating the app
- Dashboard: Quick view of your ladders, active challenges, upcoming matches, and notifications.
- Ladders list: Browse or filter ladders; open a ladder for rankings and rules.
- Ladder detail: See current ranking order, challenge rules, members, and open actions (challenge, join, settings if you are an organizer).
- Challenges: End-to-end flow for creating, reviewing, and responding to challenges.
- Matches: Submit scores for completed challenges; confirm or dispute submissions.
- Notifications: In-app feed for important events (challenges, matches, admin actions).
- Admin area: Organizers can manage seasons, disputes, leader requests, and ladder settings.

## Ladders and memberships
- Joining: Join an open ladder directly; private ladders may require organizer approval.
- Leaving: You may leave a ladder; rankings shift accordingly based on organizer rules (not yet automated in UI).
- Membership data: Each ladder tracks your current rank and match history within that ladder.

## Challenges
- Allowed opponents: You may only challenge within the ladder-defined `maxPositionsUp` range above your current rank.
- Busy check: If busy-prevention is on, you cannot challenge a player who is busy (pending challenge, accepted future match, or submitted match awaiting confirmation). You must also be free.
- Active cap: You cannot exceed the ladder `maxActiveChallengesPerPlayer` across sent and received challenges.
- Expiry: Pending challenges auto-expire after `expiryDays` days.
- Statuses: Pending, Accepted, Declined, Completed (after match confirmation), Expired, Cancelled.
- Actions:
  - Create challenge: Pick an eligible opponent from the ladder table.
  - Accept/Decline: The challenged player responds from the Challenges page or notification.
  - Cancel: Challenger can cancel a pending challenge.
  - Reminders: System can send daily reminders for pending challenges.

## Challenge workflow (examples)
- Start a challenge: From a ladder, select an opponent within range. Example: Ladder rule `maxPositionsUp = 3`; Alice is rank 5 and challenges Bob at rank 3. The request is valid because Bob is only two spots above.
- Acceptance: Bob accepts; status becomes Accepted with a scheduled date/time.
- Play and submit: After the match, Alice submits scores (e.g., 11-8, 7-11, 11-9). Status becomes Submitted.
- Confirm or dispute: Bob confirms → status Confirmed; rankings update. If Bob disputes, it moves to Disputed for organizer review.
- Ranking effect (default rule): Because Alice was lower-ranked and won, she swaps into rank 3; Bob drops to rank 5; players between shift accordingly.
- Expiry example: If Bob never responds and `expiryDays = 3`, the challenge auto-moves to Expired after three days; no ranking changes occur.

## Matches
- Submitting: After playing, submit set scores (player1 vs player2) from the Matches page or the linked challenge detail.
- Confirmation: The opponent confirms or disputes the submitted result.
- Disputes: If disputed, the match moves to the disputes queue for organizer/admin review.
- Statuses: Submitted, Confirmed, Disputed.

## Rankings
- Each ladder has a ranking rule. Default: lower-ranked winner swaps; if higher-ranked player wins, the loser drops exactly one rank (others shift). Alternative rules include full swaps or slide-shift; Elo/points may be added later.
- Rankings update only after a match is confirmed.
- Ranking updates are atomic to avoid partial ordering issues.

## Notifications
- You receive notifications for challenge events (created, accepted, declined, cancelled, expired), match submissions and confirmations, disputes, and ranking updates.
- Check the Notifications page for unread items; mark as read after review.

## Seasons (organizer)
- Organizers can create seasons for a ladder with start/end dates and archive them when complete.
- Seasonal play can reset or snapshot rankings between seasons depending on organizer settings (future option).

## Disputes (organizer/admin)
- Disputed matches appear in the Disputes section for review.
- Organizers/admins can resolve by editing the result, confirming as-is, or cancelling the challenge/match per local rules.

## Leader requests (organizer/admin)
- Players may request leader/organizer privileges for a ladder.
- Approve or decline requests in the Leader Requests section; approvals grant management access to that ladder.

## Access and security
- Auth: Email/password via Supabase Auth (social login can be added later).
- Roles: Player vs Organizer/Admin determine which actions appear in the UI and APIs.
- API protection: Sensitive actions should verify the current session and enforce row-level rules; service-role keys are reserved for admin flows.

## Glossary
- Ladder: Ordered list of players competing for rank within a sport/location.
- Challenge: A request to play a higher-ranked opponent within allowed range.
- Match: The recorded result of a played challenge; drives ranking updates after confirmation.
- Busy: A player with a pending challenge, accepted future challenge, or a submitted match awaiting confirmation.
- Active challenge: Any challenge that is Pending or Accepted.
- Expiry: Automatic transition from Pending to Expired after the ladder-defined time limit.

## Tips for fair play
- Confirm or decline challenges promptly to avoid expiry or reminders.
- Keep scores accurate on submission; use disputes only when necessary.
- Review ladder rules before challenging to avoid failed attempts.
- Communicate clearly with opponents about schedule and location.
