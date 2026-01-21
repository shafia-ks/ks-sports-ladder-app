# Design: Smart Targets (Quick Challenge) Feature

## 1. Objective
Simplify the challenge process by automatically presenting the user with a curated list of "Valid & Available" opponents on their main dashboard. This removes the need for users to browse full rank lists or calculate rule eligibility manually.

## 2. Backend Logic (Supabase RPC)
We will create a database function `get_smart_targets(p_user_id)` that performs the following filtering:

1.  **Identify User's Context:**
    *   Get all `ladder_memberships` for `p_user_id` where `status = 'active'`.

2.  **Find Potential Opponents (Per Ladder):**
    *   Select other members where:
        *   `rank` < `user_rank` (Only people above you).
        *   `rank` >= `user_rank - max_positions_up` (Within the ladder's allowed calculation rule).

3.  **Availability Filter (Crucial Step):**
    *   **Exclude Busy:** Opponent ID must NOT exist in the `challenges` or `matches` tables with statuses like `'Pending'`, `'Accepted'`, `'ScoreSubmitted'`, `'Disputed'`.
    *   **Exclude Cooldown:** Check if `cooling_expires_at` > `NOW()`.

4.  **Sorting & Limits:**
    *   Sort by "Closest Rank" (Easiest target) or "Highest Possible Rank" (Highest reward).
    *   Limit to 3-5 suggestions total.

### Proposed SQL Structure (Draft)
```sql
SELECT 
  opponent.id,
  opponent.full_name,
  opponent.avatar_url,
  ladder.name as ladder_name,
  mem.current_rank as opponent_rank,
  (my_mem.current_rank - mem.current_rank) as rank_diff
FROM ladder_memberships my_mem
JOIN ladder_memberships mem ON mem.ladder_id = my_mem.ladder_id
JOIN users opponent ON opponent.id = mem.user_id
JOIN ladders ladder ON ladder.id = mem.ladder_id
WHERE my_mem.user_id = p_user_id
  AND mem.current_rank < my_mem.current_rank -- Above me
  AND mem.current_rank >= (my_mem.current_rank - 3) -- Example rule
  AND '...Opponent is NOT Busy check...'
ORDER BY mem.current_rank DESC;
```

## 3. Frontend UI Design
The "Quick Challenge" widget will be placed at the top of the **Main Dashboard**.

### Visual Elements
*   **Header:** "Climb the Ladder" or "Suggested Opponents".
*   **List Layout:** Clean rows for each opponent.
*   **Data Points:**
    *   **Avatar & Name**: Friendly, personal feel.
    *   **Context**: e.g., "Tennis League • Rank #4".
    *   **Opportunity Badge**: "2 Spots Ahead" (Green badge).
    *   **Action**: A primary "Challenge" button.

### Multi-Ladder Handling
*   If the user is in multiple ladders (e.g., Tennis and Ping Pong), the list will mix the best targets from both, clearly labeled with the Ladder Icon/Name.
*   This creates a unified "Action List" rather than forcing the user to switch active tabs.

## 4. User Flow
1.  **Dashboard Load:** User sees the widget immediately.
2.  **Click Challenge:** 
    *   Instead of navigating to a new page, a **Modal** opens.
    *   **Modal Content:** "Challenge [Name] in [Ladder]".
    *   **Config:** Date/Time picker.
    *   **Send:** One-click confirmation.
3.  **Success:** The widget updates to remove that opponent (since they are now 'Pending').

---
*See attached image for Visual Mockup.*
