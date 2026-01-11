# Event-Driven System Implementation Guide

## Phase 1 & 2 Migration - READY TO APPLY

### Overview
This guide covers the application of Phase 1 (Database Hardening) and Phase 2 (Event System) migrations for the event-driven architecture redesign.

---

## 🚀 Quick Start

### Step 1: Apply Database Migrations

You have two options:

#### Option A: Using Supabase CLI (Recommended)
```bash
# Navigate to project root
cd d:\Application\ks-sports-ladder-app

# Apply migrations
supabase db push
```

#### Option B: Manual Application via Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the migrations in order:
   - First: `supabase/migrations/20260111000000_event_driven_phase1.sql`
   - Second: `supabase/migrations/20260111000001_event_driven_phase2.sql`

### Step 2: Enable Realtime (Supabase Dashboard)
1. Go to **Database** → **Replication**
2. Enable Realtime for these tables:
   - ✅ `challenges`
   - ✅ `matches`
   - ✅ `ladder_memberships`

---

## 📋 What Was Added

### Phase 1: Database Hardening

#### New Columns
| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| `matches` | `submitted_by` | UUID | Tracks who submitted the score |
| `matches` | `dispute_reason` | TEXT | Stores dispute explanation |
| `ladder_memberships` | `cooling_expires_at` | TIMESTAMPTZ | Cooling period end time |

#### New Functions
1. **`check_player_availability(user_id, ladder_id)`**
   - Returns `TRUE` if player can challenge/be challenged
   - Checks: active challenges, active matches, cooling period

2. **`prevent_challenge_if_busy()`**
   - Trigger function that blocks challenge creation if either player is busy
   - Raises exception with clear error message

3. **`enforce_match_transitions()`**
   - Enforces valid state transitions for matches
   - Prevents self-confirmation
   - Requires `submitted_by` when submitting scores

4. **`auto_create_match_on_accept()`**
   - Automatically creates a match when challenge status → 'Accepted'

5. **`apply_cooling_on_confirm()`**
   - Sets cooling period for both players when match is confirmed
   - Uses ladder's `challenge_rules.cooldown_hours` setting

#### Updated Constraints
- **Match Status**: Now strictly enforces: `'Pending'`, `'ScoreSubmitted'`, `'Confirmed'`, `'Disputed'`, `'Cancelled'`

### Phase 2: Event System

#### New Views
- **`player_availability`**: Real-time view showing each player's availability status
  - `available`, `cooling`, `in_challenge`, `in_match`

#### New Functions
1. **`get_busy_players(ladder_id)`**
   - Returns list of busy players with reasons
   - Useful for API endpoints

2. **`notify_challenge_event()`**
   - Emits events: `ChallengeCreated`, `ChallengeAccepted`, `ChallengeDeclined`

3. **`notify_match_event()`**
   - Emits events: `MatchCreated`, `ScoreSubmitted`, `MatchConfirmed`, `MatchDisputed`

4. **`notify_ranking_update()`**
   - Emits event: `RankingUpdated` when player rank changes

#### Performance Indexes
- `idx_challenges_ladder_status` - Fast lookup of active challenges
- `idx_matches_ladder_status` - Fast lookup of active matches
- `idx_memberships_cooling` - Fast cooling period checks
- `idx_matches_submitted_by` - Fast submitter lookups

---

## 🧪 Testing the Migration

### Test 1: Challenge Blocking
```sql
-- This should FAIL if player is already in a challenge
INSERT INTO challenges (ladder_id, challenger_id, challenged_id, status)
VALUES ('ladder-uuid', 'busy-player-uuid', 'other-player-uuid', 'Pending');
-- Expected: ERROR: Challenger is currently busy or in cooling period
```

### Test 2: Match State Transition
```sql
-- This should FAIL (can't skip ScoreSubmitted state)
UPDATE matches 
SET status = 'Confirmed' 
WHERE id = 'match-uuid' AND status = 'Pending';
-- Expected: ERROR: Invalid match status transition from Pending to Confirmed
```

### Test 3: Self-Confirmation Block
```sql
-- This should FAIL
UPDATE matches 
SET status = 'Confirmed', confirmed_by = submitted_by
WHERE id = 'match-uuid' AND status = 'ScoreSubmitted';
-- Expected: ERROR: Player cannot confirm their own submitted score
```

### Test 4: Auto Match Creation
```sql
-- Accept a challenge
UPDATE challenges 
SET status = 'Accepted' 
WHERE id = 'challenge-uuid';

-- Check that match was auto-created
SELECT * FROM matches 
WHERE player1_id = (SELECT challenger_id FROM challenges WHERE id = 'challenge-uuid')
ORDER BY created_at DESC LIMIT 1;
-- Expected: New match with status = 'Pending'
```

---

## 🔍 Verification Checklist

After applying migrations, verify:

- [ ] All migrations ran without errors
- [ ] New columns exist: `matches.submitted_by`, `matches.dispute_reason`, `ladder_memberships.cooling_expires_at`
- [ ] Functions exist: `check_player_availability`, `prevent_challenge_if_busy`, etc.
- [ ] Triggers exist: `check_availability_before_challenge`, `enforce_match_state_transitions`, etc.
- [ ] View exists: `player_availability`
- [ ] Indexes created successfully
- [ ] Realtime enabled for `challenges`, `matches`, `ladder_memberships`

---

## 🚨 Rollback Plan (If Needed)

If you need to rollback:

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS check_availability_before_challenge ON challenges;
DROP TRIGGER IF EXISTS enforce_match_state_transitions ON matches;
DROP TRIGGER IF EXISTS create_match_on_challenge_accept ON challenges;
DROP TRIGGER IF EXISTS apply_cooling_period_on_confirm ON matches;
DROP TRIGGER IF EXISTS challenge_event_notification ON challenges;
DROP TRIGGER IF EXISTS match_event_notification ON matches;
DROP TRIGGER IF EXISTS ranking_update_notification ON ladder_memberships;

-- Drop functions
DROP FUNCTION IF EXISTS check_player_availability;
DROP FUNCTION IF EXISTS prevent_challenge_if_busy;
DROP FUNCTION IF EXISTS enforce_match_transitions;
DROP FUNCTION IF EXISTS auto_create_match_on_accept;
DROP FUNCTION IF EXISTS apply_cooling_on_confirm;
DROP FUNCTION IF EXISTS notify_challenge_event;
DROP FUNCTION IF EXISTS notify_match_event;
DROP FUNCTION IF EXISTS notify_ranking_update;
DROP FUNCTION IF EXISTS get_busy_players;

-- Drop view
DROP VIEW IF EXISTS player_availability;

-- Remove columns (CAUTION: This deletes data)
ALTER TABLE matches DROP COLUMN IF EXISTS submitted_by;
ALTER TABLE matches DROP COLUMN IF EXISTS dispute_reason;
ALTER TABLE ladder_memberships DROP COLUMN IF EXISTS cooling_expires_at;
```

---

## 📝 Next Steps (Phase 3 & 4)

After successfully applying Phase 1 & 2:

1. **Phase 3: Backend API Updates** (Next)
   - Update `/api/challenges` to handle new error messages
   - Update `/api/matches/[id]/submit` to set `submitted_by`
   - Update `/api/matches/[id]/confirm` to validate permissions

2. **Phase 4: Frontend Realtime Integration** (Final)
   - Create `useLadderRealtime` hook
   - Subscribe to database changes
   - Update UI components to react to events

---

## 💡 Tips

- **Backup First**: Always backup your database before running migrations
- **Test Environment**: Apply to a test/staging environment first if available
- **Monitor Logs**: Watch Supabase logs during migration for any warnings
- **Gradual Rollout**: Consider feature flags for the frontend changes

---

## 🆘 Troubleshooting

### "Function already exists" error
- This is safe to ignore if re-running migrations
- The `CREATE OR REPLACE` syntax handles this

### "Trigger already exists" error
- Migrations include `DROP TRIGGER IF EXISTS` to handle this
- Safe to re-run

### "Column already exists" error
- Migrations include `ADD COLUMN IF NOT EXISTS`
- Safe to re-run

### Realtime not working
- Verify tables are added to replication in Supabase Dashboard
- Check that RLS policies allow reading the tables
- Ensure Supabase client is configured with correct `anon` key

---

**Status**: ✅ Ready to apply
**Estimated Time**: 5-10 minutes
**Risk Level**: Low (includes rollback plan)
