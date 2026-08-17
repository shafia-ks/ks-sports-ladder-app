# Sports Ladder App - Bug List & Issues Tracking

This document tracks bugs, status mismatches, and rendering issues identified in the repository.

---

## 1. [FIXED] Double-Stringified `set_scores` Render Crash
* **Target Match ID**: `bbe2054b-e52c-4742-8c84-61797c1bcd54`
* **Description**: `set_scores` was stored in the database as a double-stringified JSON array (`"[\"11-7\", ...]"`). When fetched, `MatchCard.tsx` and `SubmitScoreDialog.tsx` called `.map()` on the string, causing a `TypeError` and crashing the dashboard.
* **Fix Applied**: 
  * Updated [MatchCard.tsx](file:///d:/Projects/ks-sports-ladder-app/src/components/matches/MatchCard.tsx) and [SubmitScoreDialog.tsx](file:///d:/Projects/ks-sports-ladder-app/src/components/matches/SubmitScoreDialog.tsx) to check and safely parse stringified JSON arrays.
  * Added Zod-like parse guards in [route.ts (submit API)](file:///d:/Projects/ks-sports-ladder-app/src/app/api/matches/[id]/submit/route.ts) to parse incoming string payloads before writing to the database.
  * Created migration script [20260711000000_cleanup_double_stringified_scores.sql](file:///d:/Projects/ks-sports-ladder-app/supabase/migrations/20260711000000_cleanup_double_stringified_scores.sql) to fix existing database records.
* **Status**: Fixed & Pushed to [PR #3](https://github.com/shafia-ks/ks-sports-ladder-app/pull/3).

---

## 2. [FIXED] `'Submitted'` vs `'ScoreSubmitted'` Status Mismatch
* **Description**: The database stores submitted match scores with status `'ScoreSubmitted'`. However, frontend components and API endpoints were filtering or checking for `'Submitted'`. This caused active matches awaiting confirmation to disappear from the user's dashboard and active matches count.
* **Fix Applied**:
  * Corrected `'Submitted'` to `'ScoreSubmitted'` in [MyActiveMatchesCard.tsx](file:///d:/Projects/ks-sports-ladder-app/src/features/ladders/components/dashboard/MyActiveMatchesCard.tsx) and [LadderMatchesCard.tsx](file:///d:/Projects/ks-sports-ladder-app/src/features/ladders/components/dashboard/LadderMatchesCard.tsx).
  * Updated active matches check in [route.ts (ladders/[id] API)](file:///d:/Projects/ks-sports-ladder-app/src/app/api/ladders/[id]/route.ts).
* **Status**: Fixed & Pushed to [PR #3](https://github.com/shafia-ks/ks-sports-ladder-app/pull/3).

---

## 3. [OPEN] Orphaned Accepted Challenge (Missing Match Record)
* **Target Challenge ID**: `813d9913-9d6e-4778-90b5-2bf1a5fc41da`
* **Description**: The challenge is in the `'Accepted'` status, but no corresponding match record exists in the `matches` table. Benni Binder sees it under "Scheduled Matches" on the Challenges tab but cannot submit the score because the Matches tab has no card.
* **Immediate Database Workaround**:
  Run this script in the Supabase SQL editor to restore the missing match:
  ```sql
  INSERT INTO matches (ladder_id, challenge_id, player1_id, player2_id, status, created_at)
  SELECT ladder_id, id, challenger_id, challenged_id, 'Pending', NOW()
  FROM challenges
  WHERE id = '813d9913-9d6e-4778-90b5-2bf1a5fc41da'
  ON CONFLICT DO NOTHING;
  ```
* **Long-Term Preventive Measures**:
  1. **Application-Level Transactions**: Move match creation from database triggers to Next.js API routes using explicit transactions to catch failures early.
  2. **Restrict Match Deletions**: Add database constraint/trigger preventing deletion of `matches` that are linked to active challenges, or cascade-cancel the challenge if the match is deleted.
* **Status**: Awaiting implementation of preventive measures.

---

## 4. [INVESTIGATING] User Identity / Match Filter Mismatch
* **Description**: Investigate if there are duplicate accounts/profiles for **Khader Mohammad** (e.g. mismatch between active logged-in ID and the ID under which matches were recorded).
* **Diagnostic Query**:
  ```sql
  SELECT id, email, full_name, role, created_at
  FROM users
  WHERE full_name ILIKE '%Khader%' OR email ILIKE '%khader%';
  ```
* **Status**: Awaiting results of the diagnostic query.
