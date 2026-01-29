# Inactivity Penalty System - Comprehensive Plan

## 🎯 Objective
Implement a configurable inactivity penalty system that automatically adjusts player rankings when they fail to play matches within a specified period, maintaining competitive integrity and encouraging active participation.

---

## 📊 Research Summary

### **Industry Best Practices:**

**Common Approaches:**
1. **Direct Rank/Point Deduction** - Most straightforward (League of Legends, VALORANT)
2. **Rating Deviation Increase** - More sophisticated (Chess.com Glicko system)
3. **Leaderboard Removal** - Hidden rank until return
4. **Relegation** - Drop divisions/positions

**Key Principles:**
- Clear communication of rules
- Reasonable grace periods (1-4 weeks)
- Gradual decay vs. sudden drops
- Protection floors (prevent dropping too far)
- Distinguish between casual breaks and abandonment

---

## ⚙️ Proposed Settings (Ladder Configuration)

### **1. Enable/Disable Inactivity Penalties**
```
Setting: inactivity_penalty_enabled
Type: Boolean
Default: false
Description: Master switch to enable/disable the entire system
```

---

### **2. Inactivity Period Calculation Method**
```
Setting: inactivity_calculation_method
Type: Enum
Options:
  - "calendar_month"     → Reset on 1st of each month
  - "rolling_30_days"    → Continuous 30-day window
  - "rolling_custom"     → Custom number of days (e.g., 21, 45, 60)
Default: "rolling_30_days"

Why:
- Calendar month: Simple, predictable, aligns with billing cycles
- Rolling 30 days: Fairer for mid-month joiners, continuous monitoring
- Rolling custom: Flexibility for different sports/communities
```

**Examples:**
```
Calendar Month:
- Player joins Jan 25
- Inactivity check: Feb 1 (only 7 days to play!)
- Problem: Unfair for late joiners ❌

Rolling 30 Days:
- Player joins Jan 25
- Inactivity check: Feb 24 (full 30 days)
- Fair for all join dates ✅

Rolling Custom (45 days):
- Player joins Jan 25
- Inactivity check: Mar 11 (45 days)
- Good for slower-paced ladders ✅
```

---

### **3. Inactivity Threshold**
```
Setting: inactivity_threshold_days
Type: Integer
Range: 7-365 days
Default: 30
Description: Number of days without a completed match before penalty applies

Recommended Values:
- Highly active leagues: 14-21 days
- Casual leagues: 30-45 days
- Seasonal leagues: 60-90 days
```

---

### **4. Grace Period for New Members**
```
Setting: new_member_grace_period_days
Type: Integer
Range: 0-60 days
Default: 14
Description: Days after joining before inactivity penalties can apply

Why: Prevents penalizing new members who join late in a period
```

**Edge Case Handling:**
```
Scenario: Player joins Jan 28, calendar month system, 30-day threshold

Without Grace Period:
- Join: Jan 28
- Check: Feb 1 (only 4 days!)
- Result: Immediate penalty ❌

With 14-Day Grace Period:
- Join: Jan 28
- Grace until: Feb 11
- First check: Feb 11 (14 days to play)
- Result: Fair opportunity ✅
```

---

### **5. Penalty Type**
```
Setting: penalty_type
Type: Enum
Options:
  - "rank_drop"          → Drop X positions
  - "percentage_drop"    → Drop X% of positions
  - "point_deduction"    → Lose X ranking points (if using point system)
  - "relegation"         → Drop to next division/tier
  - "removal"            → Remove from ladder (can rejoin)
Default: "rank_drop"
```

**Comparison:**

| Type | Example | Pros | Cons |
|------|---------|------|------|
| **Rank Drop** | Drop 3 positions | Simple, predictable | Same impact regardless of rank |
| **Percentage Drop** | Drop 10% of positions | Scales with ladder size | Can be harsh for top players |
| **Point Deduction** | Lose 50 points | Precise control | Requires point system |
| **Relegation** | Drop 1 division | Clear tiers | Requires division structure |
| **Removal** | Remove from ladder | Clears inactive players | Harsh, discourages return |

---

### **6. Penalty Severity**
```
Setting: penalty_severity
Type: Integer/Float (depends on penalty_type)

For rank_drop:
  Range: 1-10 positions
  Default: 3

For percentage_drop:
  Range: 5-25%
  Default: 10%

For point_deduction:
  Range: 10-500 points
  Default: 50

For relegation:
  Range: 1-3 divisions
  Default: 1
```

---

### **7. Penalty Frequency**
```
Setting: penalty_frequency
Type: Enum
Options:
  - "once"               → Apply penalty once, then stop
  - "recurring_monthly"  → Apply every month of inactivity
  - "recurring_period"   → Apply every X days of continued inactivity
Default: "once"

Why:
- Once: Gentle nudge, prevents excessive punishment
- Recurring: Continuous pressure to return
- Recurring period: Customizable escalation
```

**Examples:**
```
Once:
- 30 days inactive → Drop 3 positions
- 60 days inactive → Still at same position (no further penalty)
- Good for: Casual leagues

Recurring Monthly:
- 30 days inactive → Drop 3 positions
- 60 days inactive → Drop 3 more positions (total -6)
- 90 days inactive → Drop 3 more positions (total -9)
- Good for: Competitive leagues

Recurring Period (every 14 days):
- 30 days inactive → Drop 3 positions
- 44 days inactive → Drop 3 more positions
- 58 days inactive → Drop 3 more positions
- Good for: Highly active leagues
```

---

### **8. Penalty Floor (Protection)**
```
Setting: penalty_floor_enabled
Type: Boolean
Default: true

Setting: penalty_floor_type
Type: Enum
Options:
  - "rank_position"      → Can't drop below rank #X
  - "percentage"         → Can't drop below X% of ladder
  - "division"           → Can't drop below current division
Default: "percentage"

Setting: penalty_floor_value
Type: Integer
Examples:
  - rank_position: 20 (can't drop below #20)
  - percentage: 50 (can't drop below 50% of ladder)
  - division: 0 (can't drop out of current division)
Default: 50
```

**Why Protection Floors?**
- Prevents excessive punishment for long breaks (injury, work, family)
- Encourages return (not too far to climb back)
- Reduces "smurfing" (skilled players dominating lower ranks)

**Examples:**
```
Ladder with 100 members, player at #10:

No Floor:
- 6 months inactive, recurring monthly, -3 positions/month
- Final position: #28
- Problem: May discourage return

With 50% Floor:
- 6 months inactive, recurring monthly, -3 positions/month
- Calculated position: #28
- Floor: #50 (50% of 100)
- Final position: #28 (above floor, no protection needed)

With 25% Floor:
- Same scenario
- Calculated position: #28
- Floor: #25 (25% of 100)
- Final position: #25 (floor protection applied) ✅
```

---

### **9. Notification Settings**
```
Setting: notify_before_penalty
Type: Boolean
Default: true

Setting: notification_days_before
Type: Integer
Range: 1-14 days
Default: 7

Setting: notification_channels
Type: Array
Options: ["email", "in_app", "push"]
Default: ["email", "in_app"]
```

**Notification Timeline:**
```
Day 0: Player's last match
Day 23: Warning notification (7 days before penalty)
Day 30: Penalty applied
Day 30: Penalty notification sent
```

---

### **10. Return from Inactivity**
```
Setting: return_bonus_enabled
Type: Boolean
Default: false
Description: Give returning players a small boost to encourage comeback

Setting: return_bonus_type
Type: Enum
Options:
  - "restore_partial"    → Restore X% of lost positions
  - "bonus_points"       → Award bonus points on first match back
  - "grace_matches"      → First X matches don't affect rank
Default: "restore_partial"

Setting: return_bonus_value
Type: Integer
Default: 50 (restore 50% of lost positions)
```

**Example:**
```
Player was #10, dropped to #25 due to inactivity (lost 15 positions)

With 50% Restore:
- Returns and plays a match
- Restored: 15 × 50% = 7.5 → 8 positions
- New rank: #25 - 8 = #17 ✅
- Encourages return without full restoration
```

---

## 🔄 Edge Cases & Solutions

### **Edge Case 1: Player Joins Last Week of Month (Calendar System)**
```
Problem:
- Player joins Jan 28
- Calendar month system
- Inactivity check: Feb 1 (only 4 days to play!)

Solutions:
✅ Grace period (recommended): 14-day grace from join date
✅ Pro-rated threshold: First month requires only 7 days instead of 30
✅ Use rolling system instead of calendar month
```

---

### **Edge Case 2: Player Has Pending Match**
```
Problem:
- Player challenged someone 29 days ago
- Match scheduled for tomorrow (day 31)
- Penalty triggers today (day 30)

Solution:
✅ Check for pending/scheduled matches
✅ Extend grace period if match is scheduled within next 7 days
✅ Only count "completed" matches, not pending
```

**Implementation:**
```sql
-- Don't penalize if player has upcoming match
WHERE NOT EXISTS (
  SELECT 1 FROM matches
  WHERE (player1_id = user.id OR player2_id = user.id)
  AND status IN ('Pending', 'Scheduled')
  AND scheduled_at <= NOW() + INTERVAL '7 days'
)
```

---

### **Edge Case 3: Player on Vacation/Leave**
```
Problem:
- Player goes on vacation for 6 weeks
- Doesn't want to lose rank

Solution:
✅ "Vacation Mode" setting
  - Player can mark themselves as "on leave"
  - Maximum leave duration: 30-60 days
  - Can't challenge or be challenged while on leave
  - No penalties during leave
  - Auto-returns after max duration
```

**Settings:**
```
Setting: vacation_mode_enabled
Type: Boolean
Default: true

Setting: max_vacation_days
Type: Integer
Range: 7-90 days
Default: 30

Setting: vacation_limit_per_year
Type: Integer
Range: 1-4
Default: 2 (can take 2 vacations per year)
```

---

### **Edge Case 4: Ladder Size Changes**
```
Problem:
- Penalty: Drop 10% of ladder
- Ladder had 100 members (10 positions)
- Now has 50 members (5 positions)
- Which to use?

Solution:
✅ Use ladder size at time of penalty calculation
✅ Recalculate percentage based on current size
✅ Store absolute positions, not percentages
```

---

### **Edge Case 5: Multiple Penalties Stacking**
```
Problem:
- Player inactive for 90 days
- Recurring monthly penalties
- Should all 3 months apply at once or gradually?

Solution:
✅ Apply penalties gradually (one per period)
✅ Track last_penalty_applied_at
✅ Only apply one penalty per threshold period
```

**Implementation:**
```javascript
// Check if enough time passed since last penalty
const daysSinceLastPenalty = (now - last_penalty_applied_at) / (1000 * 60 * 60 * 24);

if (daysSinceLastPenalty >= inactivity_threshold_days) {
  applyPenalty();
  last_penalty_applied_at = now;
}
```

---

### **Edge Case 6: Player Drops Below Bottom of Ladder**
```
Problem:
- Player at #48 in 50-member ladder
- Penalty: Drop 5 positions
- Calculated: #53 (doesn't exist!)

Solution:
✅ Cap at bottom of ladder (#50)
✅ Or remove from ladder if drops below
✅ Configurable behavior
```

**Setting:**
```
Setting: penalty_exceeds_bottom_action
Type: Enum
Options:
  - "cap_at_bottom"      → Stay at last position
  - "remove_from_ladder" → Remove entirely
Default: "cap_at_bottom"
```

---

### **Edge Case 7: Tied Rankings**
```
Problem:
- Players #10, #11, #12 all tied
- Player #10 gets penalty: drop 3 positions
- Where do they land?

Solution:
✅ Break ties by last_match_date (most recent first)
✅ Apply penalty to absolute position, not tied group
✅ Recalculate ties after penalty
```

---

### **Edge Case 8: Disputed/Voided Matches**
```
Problem:
- Player played a match 25 days ago
- Match gets disputed and voided on day 28
- Now they have no matches in 30 days
- Should penalty apply?

Solution:
✅ Only count "Completed" matches (not Disputed, Voided, Cancelled)
✅ Recalculate inactivity when match status changes
✅ Grace period: If match voided, give 7 days to play new match
```

---

## 📋 Database Schema Changes

### **New Table: `ladder_inactivity_settings`**
```sql
CREATE TABLE ladder_inactivity_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ladder_id UUID NOT NULL REFERENCES ladders(id) ON DELETE CASCADE,
  
  -- Master switch
  enabled BOOLEAN DEFAULT false,
  
  -- Calculation method
  calculation_method VARCHAR(20) DEFAULT 'rolling_30_days',
    -- 'calendar_month', 'rolling_30_days', 'rolling_custom'
  
  -- Thresholds
  threshold_days INTEGER DEFAULT 30,
  new_member_grace_days INTEGER DEFAULT 14,
  
  -- Penalty configuration
  penalty_type VARCHAR(20) DEFAULT 'rank_drop',
    -- 'rank_drop', 'percentage_drop', 'point_deduction', 'relegation', 'removal'
  penalty_severity INTEGER DEFAULT 3,
  penalty_frequency VARCHAR(20) DEFAULT 'once',
    -- 'once', 'recurring_monthly', 'recurring_period'
  
  -- Protection floor
  floor_enabled BOOLEAN DEFAULT true,
  floor_type VARCHAR(20) DEFAULT 'percentage',
    -- 'rank_position', 'percentage', 'division'
  floor_value INTEGER DEFAULT 50,
  
  -- Notifications
  notify_before_penalty BOOLEAN DEFAULT true,
  notification_days_before INTEGER DEFAULT 7,
  notification_channels TEXT[] DEFAULT ARRAY['email', 'in_app'],
  
  -- Return bonus
  return_bonus_enabled BOOLEAN DEFAULT false,
  return_bonus_type VARCHAR(20) DEFAULT 'restore_partial',
  return_bonus_value INTEGER DEFAULT 50,
  
  -- Vacation mode
  vacation_mode_enabled BOOLEAN DEFAULT true,
  max_vacation_days INTEGER DEFAULT 30,
  vacation_limit_per_year INTEGER DEFAULT 2,
  
  -- Edge case handling
  penalty_exceeds_bottom_action VARCHAR(20) DEFAULT 'cap_at_bottom',
    -- 'cap_at_bottom', 'remove_from_ladder'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ladder_inactivity_ladder ON ladder_inactivity_settings(ladder_id);
```

---

### **New Table: `member_inactivity_tracking`**
```sql
CREATE TABLE member_inactivity_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ladder_id UUID NOT NULL REFERENCES ladders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Tracking
  last_match_completed_at TIMESTAMPTZ,
  last_penalty_applied_at TIMESTAMPTZ,
  total_penalties_applied INTEGER DEFAULT 0,
  
  -- Vacation mode
  on_vacation BOOLEAN DEFAULT false,
  vacation_started_at TIMESTAMPTZ,
  vacation_ends_at TIMESTAMPTZ,
  vacations_taken_this_year INTEGER DEFAULT 0,
  
  -- Penalty history
  positions_lost_to_inactivity INTEGER DEFAULT 0,
  original_rank_before_penalties INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(ladder_id, user_id)
);

CREATE INDEX idx_member_inactivity_ladder_user ON member_inactivity_tracking(ladder_id, user_id);
CREATE INDEX idx_member_inactivity_last_match ON member_inactivity_tracking(last_match_completed_at);
```

---

### **New Table: `inactivity_penalty_log`**
```sql
CREATE TABLE inactivity_penalty_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ladder_id UUID NOT NULL REFERENCES ladders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Penalty details
  penalty_type VARCHAR(20) NOT NULL,
  penalty_severity INTEGER NOT NULL,
  rank_before INTEGER NOT NULL,
  rank_after INTEGER NOT NULL,
  positions_dropped INTEGER NOT NULL,
  
  -- Context
  days_inactive INTEGER NOT NULL,
  last_match_date TIMESTAMPTZ,
  reason TEXT,
  
  -- Reversal (if player returns and gets bonus)
  reversed BOOLEAN DEFAULT false,
  reversed_at TIMESTAMPTZ,
  
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inactivity_log_ladder ON inactivity_penalty_log(ladder_id);
CREATE INDEX idx_inactivity_log_user ON inactivity_penalty_log(user_id);
CREATE INDEX idx_inactivity_log_applied ON inactivity_penalty_log(applied_at);
```

---

## 🔄 Cron Job / Scheduled Task

### **Daily Inactivity Check**
```typescript
// Run daily at 2 AM
// Cron: 0 2 * * *

async function checkInactivityPenalties() {
  // 1. Get all ladders with inactivity penalties enabled
  const ladders = await getLaddersWithInactivityEnabled();
  
  for (const ladder of ladders) {
    const settings = ladder.inactivity_settings;
    
    // 2. Get all active members
    const members = await getActiveLadderMembers(ladder.id);
    
    for (const member of members) {
      // 3. Skip if on vacation
      if (member.on_vacation) continue;
      
      // 4. Skip if within grace period (new member)
      const daysSinceJoin = daysBetween(member.joined_at, now());
      if (daysSinceJoin < settings.new_member_grace_days) continue;
      
      // 5. Get last completed match
      const lastMatch = await getLastCompletedMatch(ladder.id, member.user_id);
      
      if (!lastMatch) {
        // Never played a match - use join date
        const daysSinceJoin = daysBetween(member.joined_at, now());
        if (daysSinceJoin >= settings.threshold_days) {
          await applyPenalty(ladder, member, settings, daysSinceJoin);
        }
      } else {
        // Check inactivity since last match
        const daysInactive = daysBetween(lastMatch.completed_at, now());
        
        if (daysInactive >= settings.threshold_days) {
          // Check if penalty already applied recently
          const daysSinceLastPenalty = member.last_penalty_applied_at
            ? daysBetween(member.last_penalty_applied_at, now())
            : Infinity;
          
          // Apply penalty if:
          // - First penalty (last_penalty_applied_at is null), OR
          // - Recurring and enough time passed
          if (!member.last_penalty_applied_at ||
              (settings.penalty_frequency !== 'once' && 
               daysSinceLastPenalty >= settings.threshold_days)) {
            await applyPenalty(ladder, member, settings, daysInactive);
          }
        }
      }
      
      // 6. Check if warning notification needed
      if (settings.notify_before_penalty) {
        const daysUntilPenalty = settings.threshold_days - daysInactive;
        if (daysUntilPenalty === settings.notification_days_before) {
          await sendInactivityWarning(member, daysUntilPenalty);
        }
      }
    }
  }
}
```

---

## 🎨 UI Components

### **1. Ladder Settings Page - Inactivity Section**
```
┌─────────────────────────────────────────────────────┐
│ ⚙️ Inactivity Penalty Settings                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ [✓] Enable inactivity penalties                     │
│                                                      │
│ Calculation Method:                                 │
│ ○ Calendar month (resets on 1st of each month)     │
│ ● Rolling 30 days (continuous monitoring)          │
│ ○ Custom period: [45] days                         │
│                                                      │
│ Inactivity Threshold: [30] days                     │
│ ℹ️ Players must play at least 1 match every 30 days │
│                                                      │
│ New Member Grace Period: [14] days                  │
│ ℹ️ New members have 14 days before penalties apply  │
│                                                      │
│ Penalty Type:                                       │
│ ● Drop positions: [3] positions                    │
│ ○ Drop percentage: [10]%                           │
│ ○ Remove from ladder                               │
│                                                      │
│ Penalty Frequency:                                  │
│ ● Apply once, then stop                            │
│ ○ Recurring monthly                                │
│ ○ Recurring every [30] days                        │
│                                                      │
│ Protection Floor:                                   │
│ [✓] Enable protection floor                        │
│ ● Can't drop below [50]% of ladder                 │
│ ○ Can't drop below rank #[20]                      │
│                                                      │
│ Notifications:                                      │
│ [✓] Notify players [7] days before penalty         │
│ [✓] Email  [✓] In-app  [ ] Push                    │
│                                                      │
│ [Save Settings]                                     │
└─────────────────────────────────────────────────────┘
```

---

### **2. Member Profile - Inactivity Status**
```
┌─────────────────────────────────────────────────────┐
│ Activity Status                                      │
├─────────────────────────────────────────────────────┤
│ Last Match: 23 days ago                             │
│ ⚠️ Warning: 7 days until inactivity penalty         │
│                                                      │
│ [Schedule a Match] [Request Vacation Mode]          │
└─────────────────────────────────────────────────────┘
```

---

### **3. Vacation Mode Request**
```
┌─────────────────────────────────────────────────────┐
│ 🏖️ Request Vacation Mode                            │
├─────────────────────────────────────────────────────┤
│ Taking a break? Set yourself as "on vacation" to    │
│ pause inactivity penalties.                         │
│                                                      │
│ Start Date: [Jan 29, 2026]                          │
│ End Date:   [Feb 28, 2026]  (30 days)               │
│                                                      │
│ Reason (optional):                                  │
│ [Work travel                                    ]   │
│                                                      │
│ ℹ️ You have 2 vacation periods remaining this year  │
│ ℹ️ Maximum vacation duration: 30 days               │
│ ℹ️ You cannot challenge or be challenged while away │
│                                                      │
│ [Cancel] [Request Vacation]                         │
└─────────────────────────────────────────────────────┘
```

---

### **4. Penalty Notification (Email)**
```
Subject: Inactivity Penalty Applied - PCS Munich Ladder

Hi Shafia,

You haven't played a match in the PCS Munich ladder for 30 days.

As per the ladder rules, an inactivity penalty has been applied:
- Previous Rank: #10
- New Rank: #13
- Positions Dropped: 3

To avoid future penalties, please play at least one match every 30 days.

[Schedule a Match Now]

If you're taking a break, you can enable Vacation Mode to pause penalties.

[Enable Vacation Mode]

Thanks,
KS Sports Ladder Team
```

---

### **5. Warning Notification (7 days before)**
```
Subject: ⚠️ Inactivity Warning - PCS Munich Ladder

Hi Shafia,

You haven't played a match in 23 days. If you don't play within the next 7 days, an inactivity penalty will be applied:

- Current Rank: #10
- Penalty: Drop 3 positions
- Penalty Date: Feb 5, 2026

[Schedule a Match] [View Available Opponents]

Need a break? Enable Vacation Mode to pause penalties.

[Enable Vacation Mode]

Thanks,
KS Sports Ladder Team
```

---

## 📊 Recommended Default Settings

### **For Highly Active Ladders (Weekly Play Expected):**
```yaml
enabled: true
calculation_method: rolling_30_days
threshold_days: 14
new_member_grace_days: 7
penalty_type: rank_drop
penalty_severity: 2
penalty_frequency: recurring_monthly
floor_enabled: true
floor_type: percentage
floor_value: 30
notify_before_penalty: true
notification_days_before: 5
```

---

### **For Casual Ladders (Monthly Play Expected):**
```yaml
enabled: true
calculation_method: rolling_30_days
threshold_days: 30
new_member_grace_days: 14
penalty_type: rank_drop
penalty_severity: 3
penalty_frequency: once
floor_enabled: true
floor_type: percentage
floor_value: 50
notify_before_penalty: true
notification_days_before: 7
```

---

### **For Seasonal Ladders (Quarterly Seasons):**
```yaml
enabled: true
calculation_method: rolling_custom
threshold_days: 60
new_member_grace_days: 21
penalty_type: percentage_drop
penalty_severity: 10
penalty_frequency: once
floor_enabled: true
floor_type: percentage
floor_value: 50
notify_before_penalty: true
notification_days_before: 14
```

---

## 🚀 Implementation Phases

### **Phase 1: Database & Settings (Week 1)**
- Create database tables
- Add settings UI in ladder configuration
- Admin can enable/configure penalties

### **Phase 2: Tracking & Calculation (Week 2)**
- Track last match dates
- Implement inactivity calculation logic
- Handle all edge cases

### **Phase 3: Penalty Application (Week 3)**
- Implement penalty application logic
- Rank adjustment algorithm
- Protection floor logic

### **Phase 4: Notifications (Week 4)**
- Warning notifications (7 days before)
- Penalty applied notifications
- Email templates

### **Phase 5: Vacation Mode (Week 5)**
- Vacation request UI
- Vacation tracking
- Auto-return logic

### **Phase 6: Cron Job & Testing (Week 6)**
- Daily cron job
- Comprehensive testing
- Edge case validation

---

## ✅ Success Metrics

**Engagement:**
- % increase in monthly active players
- Average days between matches (should decrease)
- % of players who receive warnings vs. penalties

**Fairness:**
- % of players using vacation mode
- % of penalties appealed/disputed
- Player satisfaction surveys

**Technical:**
- Cron job success rate
- Notification delivery rate
- Edge case handling accuracy

---

## 🎯 Summary

This comprehensive inactivity penalty system provides:

✅ **Flexibility** - Multiple calculation methods, penalty types, frequencies  
✅ **Fairness** - Grace periods, protection floors, vacation mode  
✅ **Edge Case Handling** - 8+ edge cases addressed  
✅ **User-Friendly** - Clear notifications, warnings, easy configuration  
✅ **Scalable** - Works for ladders of any size, activity level  
✅ **Configurable** - Organizers control all aspects  

**Recommended Default:** Rolling 30-day system with 3-position drop, once per period, 50% protection floor, 7-day warning notifications.
