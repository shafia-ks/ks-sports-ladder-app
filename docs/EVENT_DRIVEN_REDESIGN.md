# Event-Driven Architecture Redesign

## 1. Executive Summary
This document outlines the redesign of the KS Sports Ladder system to a fully event-driven architecture. The goal is to enforce strict state integrity, eliminate race conditions, and ensure all user interfaces react immediately to domain state changes using Supabase Realtime adjustments.

## 2. Gap Analysis

| Feature | Current State | Target State | Gap |
| :--- | :--- | :--- | :--- |
| **Architecture** | Polling / REST Response | **Event-Driven (Realtime)** | UI currently waits for fetch or reload; needs subscriptions. |
| **State Source** | Mixed (Client + DB) | **DB as Single Source of Truth** | Client calculates some states; DB must enforce all transitions. |
| **Availability** | Implicit (Active Challenge) | **Explicit & Enforced** | "Busy" is calculated on read. Needs DB constraints to prevent concurrency. |
| **Concurrency** | Minimal controls | **Strict Atomic Operations** | No locking currently; Race conditions possible on double-submit. |
| **Cooling Period** | Logic unclear/missing | **Strict Availability Lock** | Need dedicated `cooling_expires_at` column separated from ranking logic. |
| **Permissions** | Basic Checks | **Role-Based Enforcement** | RLS policies need to be tightened for specific transitions. |

## 3. Data Model Enhancements

To support the redesign, the database schema requires the following updates:

### 3.1 New Columns & Types

**Table: `matches`**
- `submitted_by` (UUID, Foreign Key options) - User who submitted the score.
- `confirmed_by` (UUID, Foreign Key) - User who confirmed the score.
- `disputed_by` (UUID, Foreign Key) - User who raised a dispute.
- `dispute_reason` (TEXT) - Usage: Reason provided for dispute.
- `status` (ENUM Update) - Add/Enforce: `'Created', 'ScoreSubmitted', 'Disputed', 'Confirmed', 'Cancelled'`.

**Table: `ladder_memberships`**
- `cooling_expires_at` (TIMESTAMPTZ) - If set and > NOW(), player is "Busy" (Unchallengeable/Unavailable).

**Table: `challenges`**
- Ensure status ENUM is strictly: `'Pending', 'Accepted', 'Declined', 'Cancelled'`.

### 3.2 Database Triggers (The Enforcers)

We will use PostgreSQL Triggers to enforce business rules at the lowest level.

1.  **Block Simultaneous Challenges**:
    *   `BEFORE INSERT ON challenges`: Check if `challenger_id` or `challenged_id` is already in an *active* challenge or match. Raise exception if true.
    *   Check `cooling_expires_at`: Raise exception if `> NOW()`.

2.  **Match Status Transitions**:
    *   `BEFORE UPDATE ON matches`: Enforce valid state map.
        *   `Created` -> `ScoreSubmitted` (Valid)
        *   `Created` -> `Confirmed` (Invalid - must submit score first)
        *   `ScoreSubmitted` -> `ScoreSubmitted` (Invalid - cannot overwrite unless organizer)
        *   `ScoreSubmitted` -> `Confirmed` (Valid - only by OTHER player/Admin)

3.  **Auto-Create Match**:
    *   `AFTER UPDATE ON challenges`: When status changes to `'Accepted'`, automatically `INSERT INTO matches`.

4.  **Ranking & Cooling Trigger**:
    *   `AFTER UPDATE ON matches`: When status changes to `'Confirmed'`:
        *   Call `ranking_update_func()` (Updates ranks immediately).
        *   Update `ladder_memberships` for both players: set `cooling_expires_at = NOW() + INTERVAL 'configure_hours'`.

## 4. Event Logic Specifications

All frontend dashboards (Main, Ladder, Rankings) will subscribe to Supabase Realtime channels.

### 4.1 Channels
- `public:challenges` (filter: `ladder_id`)
- `public:matches` (filter: `ladder_id`)
- `public:ladder_memberships` (filter: `ladder_id`) - *For ranking/cooling updates*

### 4.2 Handling Events

| Event | Trigger Condition | Dashboard Reaction |
| :--- | :--- | :--- |
| **ChallengeCreated** | `INSERT challenges (status='Pending')` | **Ladder Dash:** Show "1 Active Pending". **Rankings:** Mark target & challenger as "Busy". |
| **ChallengeAccepted** | `UPDATE challenges (status='Accepted')` | **Ladder Dash:** Remove from Pending challenge list (or show as Accepted). **Matches:** New match appears in "Active Matches". Players remain "Busy". |
| **ChallengeDeclined** | `UPDATE challenges (status='Declined')` | **Rankings:** Unmark "Busy" (Players become available immediately). |
| **ScoreSubmitted** | `UPDATE matches (status='ScoreSubmitted')` | **Match Card:** Show "Confirm/Dispute" buttons to opponent. Status badge updates. |
| **MatchConfirmed** | `UPDATE matches (status='Confirmed')` | **Rankings:** Updates *immediately* (listen to `ladder_memberships` UPDATE). **Match Card:** Moves to History/Completed. **Availability:** Players remain "Busy" (Cooling). |
| **CoolingExpired** | *Implicit (Time-based)* | **Rankings/UI:** When `NOW() > cooling_expires_at`, "Busy" indicator disappears. Client-side timer can handle visual countdown, but server rejects early attempts. |

## 5. Implementation Roadmap

### Phase 1: Database Hardening (The Foundation)
1.  Create Migration: Add `submitted_by`, `dispute_reason` to matches; `cooling_expires_at` to memberships.
2.  Create Functions/Triggers:
    *   `check_player_availability()`
    *   `enforce_match_transitions()`
    *   `auto_create_match_on_accept()`
    *   `apply_cooling_and_ranking()` (Or keep ranking flexible in app logic if too complex for SQL, but enforce cooling DB-side).

### Phase 2: Backend Logic Update
1.  Update API `POST /challenges` to handle error explicitly (if DB rejects due to busy).
2.  Update API `PATCH /matches/[id]/submit` to require user context and set `submitted_by`.
3.  Update API `POST /matches/[id]/confirm` to solely handle confirmation (validate user != submitted_by).

### Phase 3: Frontend Event Integration
1.  Create `useLadderRealtime(ladderId)` hook.
2.  Subscribe to `postgres_changes` on `challenges`, `matches`, `ladder_memberships`.
3.  Replace all `useEffect` polling with Realtime event handlers to update local TanStack Query cache or Context state.

## 6. Logic Edge Cases & Solutions

*   **Race Condition: Double Submit**: Trigger `BEFORE UPDATE` checks `old.status`. If it's already `ScoreSubmitted`, the second request fails.
*   **Self-Confirm**: Row Level Security (RLS) or Trigger checks `auth.uid() != submitted_by`.
*   **Dispute**: Simply a status change to `Disputed`. Handled by `admin/organizer` view.

This design ensures the database is the **Master of State**, and the UI is a **Reactive View** of that state.
