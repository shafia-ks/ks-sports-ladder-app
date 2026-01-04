# Ladder Dashboard Feature

## Overview

Added a comprehensive dashboard tab to the ladder detail page (`/ladders/[id]`) that provides role-aware KPIs and insights for both players and organizers.

## Features

### 📊 Dashboard Tab
- **Default landing tab** when viewing a ladder
- Shows different content based on user role (player vs organizer)
- Real-time activity feed
- Top performers leaderboard

### 👤 Player Metrics

When viewing as a ladder member, you see:

1. **Current Rank** - Your position with trend indicator (↑↓)
2. **Win Rate** - Percentage of matches won
3. **Total Matches** - Number of completed games
4. **Current Streak** - Consecutive wins (if applicable)

### 🎯 Organizer Metrics

Ladder organizers see additional management KPIs:

1. **Total Members** - Active player count
2. **Pending Approvals** - Members waiting for acceptance (highlighted if > 0)
3. **Active Challenges** - Currently ongoing challenge requests
4. **Recent Matches** - Matches completed in last 7 days

**Quick Actions:**
- Approve Members (with count badge)
- Manage Rankings
- Manage Matches

### 📈 Recent Activity Feed

Shows the latest 10 events across:
- ✅ Completed matches with winner
- ⚔️ New challenge requests
- 👥 Member joins

Each item includes:
- Icon indicator (match/challenge/member)
- Description of the event
- Relative timestamp (e.g., "2h ago", "Just now")

### 🏆 Top Performers

Displays top 5 ranked players with:
- Rank position badge (1-5)
- Player avatar and name
- Current rank number
- "Challenge" button (except for yourself)

## Technical Implementation

### Frontend (`src/app/ladders/[id]/page.tsx`)

- Added `dashboard` tab state (default)
- New imports: `LayoutDashboard`, `TrendingUp`, `TrendingDown`, `Users`, `CheckCircle`, `AlertCircle`, `Activity`, `Award`, `Zap`
- Fetches dashboard stats from API
- Role-aware rendering (checks `isOrganizer` flag)

### Backend (`src/app/api/ladders/[id]/dashboard-stats/route.ts`)

**Endpoint:** `GET /api/ladders/[id]/dashboard-stats?userId=<user_id>`

**Returns:**
```json
{
  "myStats": {
    "totalMatches": 15,
    "wins": 10,
    "losses": 5,
    "winRate": 67,
    "streak": 3,
    "rankChange": 2  // Positive = moved up
  },
  "organizerStats": {  // Only if user is organizer/admin
    "activeChallenges": 3,
    "recentMatches": 8
  },
  "recentActivity": [
    {
      "type": "match",
      "description": "John Doe defeated Jane Smith",
      "time": "2h ago"
    }
  ]
}
```

**Calculations:**
- **Win Rate**: `(wins / totalMatches) * 100`
- **Streak**: Consecutive wins/losses from most recent matches
- **Rank Change**: Compares current rank to previous snapshot in `ranking_history`
- **Recent Matches**: Counts matches in last 7 days

### UI Components

**Enhanced StatCard** (`src/components/ui/stat-card.tsx`):
- Supports `label` prop (simpler API)
- Accepts `ReactNode` for icon (more flexible)
- Trend can be number (rank change) or object (percentage)
- New `alert` prop for highlighting urgent items (amber border)
- Auto-renders trend arrows (↑ green, ↓ red)

## User Experience

### Player View Flow
1. Open ladder → Dashboard tab (default)
2. See personal performance at a glance
3. Check rank trend (am I moving up?)
4. View recent activity and top competitors
5. Quick challenge top players

### Organizer View Flow
1. Open ladder → Dashboard tab
2. See management KPIs immediately
3. **Pending Approvals** highlighted if action needed
4. Quick buttons to:
   - Approve members directly
   - Adjust rankings manually
   - Edit/delete matches
5. Monitor ladder health (activity, engagement)

## Security & Privacy

- Stats only shown for logged-in users
- Personal stats (`myStats`) require `userId` parameter
- Organizer stats only returned if user is:
  - Listed in `ladder_leaders` table, OR
  - Has `role='admin'` in `users` table
- Public users see activity feed only

## Database Tables Used

- `ladder_memberships` - Current rank, user membership
- `matches` - Match history, wins/losses
- `ranking_history` - Historical rank snapshots for trend calculation
- `ladder_leaders` - Organizer permission check
- `users` - Role verification, player names
- `challenges` - Active challenge count

## Future Enhancements

Potential additions:
- **Performance graphs** (rank over time chart)
- **Head-to-head records** (vs specific opponents)
- **Achievement badges** (10-win streak, #1 rank, etc.)
- **Activity heatmap** (matches by day/week)
- **Export stats** (PDF report)
- **Notifications panel** (upcoming matches, pending challenges)

## File Changes

### New Files
- `src/app/api/ladders/[id]/dashboard-stats/route.ts` - API endpoint

### Modified Files
- `src/app/ladders/[id]/page.tsx` - Added dashboard tab UI
- `src/components/ui/stat-card.tsx` - Enhanced with trend support

## Testing

To test the dashboard:

1. **As Player:**
   - Join a ladder
   - View ladder detail page
   - Dashboard should show your rank and stats
   - Play some matches to see stats update

2. **As Organizer:**
   - Create or manage a ladder
   - View dashboard
   - Should see both player + organizer sections
   - Pending approvals should highlight if any exist

3. **Activity Feed:**
   - Complete a match → should appear in feed
   - Create a challenge → should appear in feed
   - Times should show relative format ("2m ago", etc.)

## Notes

- Dashboard is the **default tab** (better UX than jumping straight to rankings)
- All stats are **real-time** (no caching)
- Trend calculations require at least 2 ranking snapshots
- Streak only shows positive (winning streaks), not losing streaks
- Activity feed combines matches + challenges, sorted by timestamp
