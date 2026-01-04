# Organizer Ranking Management Features

## Overview
Organizers can now manage ladder rankings through two complementary features:

1. **Manual Ranking Adjustment** - Directly edit player positions
2. **Match Result Correction** - Edit or delete incorrect match results

Both features include audit logging and require justification for changes.

---

## Feature 1: Manual Ranking Adjustment

### Location
`/organizer/[ladder-id]/rankings`

### Access
- Organizers of the ladder
- System admins

### Functionality
- View current ladder rankings with visual rank indicators
- Move players up/down using arrow buttons
- Changes are highlighted in blue before saving
- **Required:** Reason for adjustment (logged in audit trail)
- Reset changes before saving

### UI Features
- Drag-style up/down controls
- Visual diff showing changed rankings
- Warning message about manual adjustments
- Mandatory reason field
- Save/Reset buttons

### API Endpoint
**POST** `/api/ladders/[id]/rankings/adjust`

**Request Body:**
```json
{
  "rankings": [
    { "user_id": "uuid", "rank": 1 },
    { "user_id": "uuid", "rank": 2 }
  ],
  "reason": "Correcting manual entry error",
  "adjusted_by": "user_uuid"
}
```

**Validations:**
- User must be organizer or admin
- User must be organizer of this specific ladder
- Reason is required (non-empty)
- All rankings must be valid

**Audit Trail:**
- Logs action: `manual_ranking_adjustment`
- Stores: previous rankings, new rankings, reason
- Creates ranking history snapshot

### Use Cases
- Fix data entry errors
- Handle special situations (injuries, withdrawals)
- Tournament seeding adjustments
- New member placement

---

## Feature 2: Match Result Correction

### Location
`/organizer/[ladder-id]/matches`

### Access
- Organizers of the ladder
- System admins

### Functionality

#### Edit Match Results
- Change match winner
- **Required:** Reason for edit
- Auto-recalculates rankings based on new result
- Creates new ranking history snapshot
- Logs edit in audit trail

#### Delete Match Results
- Remove incorrect match entirely
- **Required:** Reason for deletion
- Confirmation dialog
- Logs deletion in audit trail
- **Note:** Rankings may need manual adjustment after deletion

### UI Features
- List all matches with player names, scores, dates
- Edit button opens inline form
- Delete button with confirmation
- Visual status indicators
- Warning about ranking impacts

### API Endpoints

#### PATCH `/api/matches/[id]`
Edit a match result and recalculate rankings.

**Request Body:**
```json
{
  "winner_id": "new_winner_uuid",
  "set_scores": ["6-4", "6-3"],
  "played_at": "2026-01-04T10:00:00Z",
  "reason": "Incorrect winner recorded",
  "updated_by": "organizer_uuid"
}
```

**Process:**
1. Validates organizer permissions
2. Updates match data
3. If winner changed: recalculates rankings
4. Updates ladder_memberships with new ranks
5. Creates ranking history snapshot
6. Logs action in audit_logs

#### DELETE `/api/matches/[id]`
Remove an incorrect match.

**Query Parameters:**
- `reason` - Why the match is being deleted
- `deleted_by` - User UUID performing deletion

**Process:**
1. Validates organizer permissions
2. Retrieves match data
3. Logs deletion with full match details
4. Deletes match from database
5. Returns warning about manual ranking adjustment

### Use Cases
- Wrong winner recorded
- Incorrect score entry
- Duplicate match entries
- Match played but recorded incorrectly
- Disputed results resolved

---

## Permissions

### Organizer Permissions
- Can adjust rankings for **their ladders only**
- Can edit/delete matches for **their ladders only**
- Verified via `ladder_leaders` table

### Admin Permissions
- Can adjust rankings for **any ladder**
- Can edit/delete matches for **any ladder**
- System-wide access

---

## Audit Trail

All ranking changes are logged:

### Manual Adjustments
```json
{
  "action": "manual_ranking_adjustment",
  "resource_type": "ladder",
  "resource_id": "ladder_uuid",
  "user_id": "organizer_uuid",
  "details": {
    "reason": "User-provided reason",
    "previous_rankings": [...],
    "new_rankings": [...]
  }
}
```

### Match Edits
```json
{
  "action": "match_result_edited",
  "resource_type": "match",
  "resource_id": "match_uuid",
  "user_id": "organizer_uuid",
  "details": {
    "reason": "User-provided reason",
    "previous_data": {...},
    "updates": {...}
  }
}
```

### Match Deletions
```json
{
  "action": "match_deleted",
  "resource_type": "match",
  "resource_id": "match_uuid",
  "user_id": "organizer_uuid",
  "details": {
    "reason": "User-provided reason",
    "match_data": {...}
  }
}
```

---

## Ranking History

Every manual adjustment and match edit creates a snapshot in `ranking_history`:

```sql
INSERT INTO ranking_history (ladder_id, match_id, snapshot)
VALUES (
  'ladder_uuid',
  'match_uuid_or_null',
  '[{"userId": "...", "currentRank": 1}, ...]'
);
```

This enables:
- Ranking rollback (future feature)
- Audit trail visualization
- Historical analysis
- Dispute resolution

---

## Navigation Flow

### From Organizer Dashboard
1. `/organizer` - View all your ladders
2. Click ladder card → "Members" button
3. `/organizer/[id]/members` - Member management
4. Click "Manual Rankings" button → `/organizer/[id]/rankings`
5. Or click "Matches" from dashboard → `/organizer/[id]/matches`

### Quick Access Links
- Organizer Dashboard: Settings | Members | Matches | Invite buttons on each ladder card
- Members Page: "Manual Rankings" and "Invite Members" buttons at top

---

## Best Practices

### When to Use Manual Rankings
✅ Correcting data entry mistakes
✅ Handling player withdrawals/injuries
✅ Initial tournament seeding
✅ Special circumstances with documentation

❌ Regular match results (use match submission)
❌ Favoritism or arbitrary changes
❌ Frequent adjustments (indicates system issues)

### When to Edit/Delete Matches
✅ Wrong winner recorded
✅ Incorrect scores entered
✅ Duplicate entries
✅ Player dispute resolved with evidence

❌ Changing past results without reason
❌ Removing losses to help players
❌ Deleting legitimate disputes

### Documentation Requirements
- **Always provide clear reasons**
- Be specific: "Corrected winner from John to Jane based on score sheet"
- Reference external evidence when possible
- Document special circumstances

---

## Future Enhancements

### Potential Features
1. **Ranking Rollback** - Undo to previous snapshot
2. **Bulk Match Import** - CSV upload with validation
3. **Match Replay** - Recalculate all rankings from scratch
4. **Approval Workflow** - Require admin approval for large adjustments
5. **Change Notifications** - Alert affected players
6. **Ranking Freeze** - Lock rankings during tournaments
7. **Audit Report** - Export all changes for review

### Considered but Not Implemented
- Drag-and-drop rankings (accessibility concerns)
- Automatic conflict resolution (too complex)
- Historical ranking charts (visualization overhead)

---

## Files Created

### Frontend
- `/src/app/organizer/[id]/rankings/page.tsx` - Manual ranking adjustment UI
- `/src/app/organizer/[id]/matches/page.tsx` - Match management UI

### Backend
- `/src/app/api/ladders/[id]/rankings/adjust/route.ts` - Manual ranking API
- `/src/app/api/matches/[id]/route.ts` - PATCH/DELETE methods added

### Updates
- `/src/app/organizer/page.tsx` - Added "Matches" button to dashboard
- `/src/app/organizer/[id]/members/page.tsx` - Added "Manual Rankings" button

---

## Security Considerations

1. **Permission Checks**
   - Verify organizer role
   - Verify ladder ownership
   - Check admin override

2. **Audit Logging**
   - All changes logged with user ID
   - Reasons required and stored
   - Previous state captured

3. **Data Validation**
   - Ranking arrays validated
   - User IDs verified
   - Reasons required (non-empty)

4. **Rate Limiting** (Future)
   - Prevent abuse
   - Limit frequent changes
   - Alert on suspicious activity
