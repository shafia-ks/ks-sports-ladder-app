# Architecture Fix: Ladder-Specific Organizer Roles

## Problem Statement
The original implementation treated organizer roles as application-wide, when they should be **ladder-specific**. This meant:
- Users could only have one global "organizer" role
- A user couldn't be organizer of multiple ladders
- The approval workflow didn't distinguish between ladders
- The system conflated global "admin" role with "organizer" role

## Solution
Restructured the role system so that:
1. **Global roles** (`role` column in `users` table): `player` or `admin` only
2. **Ladder-specific organizers**: Tracked in `ladder_leaders` table (one user can be organizer of multiple ladders)
3. **Ladder-specific requests**: `leader_requests` table now includes `ladder_id` column
4. **Approval workflow**: When approving an organizer request, create entry in `ladder_leaders` instead of setting global role

## Database Changes

### Migration: `20260106160000_ladder_specific_organizer_roles.sql`
- Added `ladder_id` column to `leader_requests` table (nullable for backward compat)
- Added constraint: `(requested_role = 'organizer' AND ladder_id IS NOT NULL) OR (requested_role = 'admin' AND ladder_id IS NULL)`
- Added indexes for efficient ladder-based queries
- Added documentation to clarify that user.role should only be 'player' or 'admin'

### Key Tables
```
leader_requests:
  - user_id (who requested)
  - requested_role ('organizer' or 'admin')
  - ladder_id (which ladder, required for 'organizer')
  - status ('pending', 'approved', 'rejected')

ladder_leaders:
  - ladder_id (which ladder)
  - user_id (who is the organizer)
  - unique constraint on (ladder_id, user_id)

users:
  - role ('player' or 'admin' globally)
```

## API Changes

### POST /api/leader-requests
**Old behavior:**
```javascript
{
  user_id: "...",
  requested_role: "organizer",
  reason: "..."
}
```

**New behavior:**
```javascript
{
  user_id: "...",
  requested_role: "organizer",
  reason: "...",
  ladder_id: "..." // REQUIRED for organizer requests
}
```

### GET /api/leader-requests
Now supports query parameters:
- `?ladder_id=xxx` - Get all requests for a specific ladder
- `?user_id=xxx` - Get requests by a specific user
- `?status=pending` - Filter by status

Response now includes joined ladder and user data for context.

### PATCH /api/leader-requests/[id]
**Approval logic:**
- If `requested_role === 'organizer'`: Create entry in `ladder_leaders` table (ladder-specific)
- If `requested_role === 'admin'`: Update user.role to 'admin' (global)
- Each gets appropriate notification with correct link

## Frontend Changes

### RoleRequest Component
- Added optional `ladder_id` prop
- When `ladder_id` is provided:
  - Shows "Request to Organize This Ladder" instead of generic heading
  - Only allows "organizer" role (no "admin" option)
  - Sends ladder_id with request
- When `ladder_id` is NOT provided:
  - Shows full role selection (organizer or admin)
  - Defaults to "organizer" for backward compat

### Dashboard
- Still shows role request form, but now sends ladder_id when available
- Should eventually show ladder-specific request for each active ladder

## Benefits
1. **Multiple ladder roles**: Users can organize multiple ladders
2. **Cleaner role system**: Organizer is ladder-specific, not global
3. **Better approval workflow**: Admin sees which ladder each request is for
4. **Scalability**: System can easily grow to multiple organizers per ladder
5. **Flexibility**: Can eventually have co-organizers, role hierarchy per ladder

## Migration Path
1. Deploy database migration
2. Deploy API changes (backward compatible - ladder_id is required for new organizer requests)
3. Deploy frontend changes (only show ladder-specific form when ladder_id provided)
4. Legacy admin requests (without ladder_id) will fail with helpful error message

## Testing Checklist
- [ ] User submits request to organize a specific ladder
- [ ] Request appears in admin dashboard with ladder info
- [ ] Admin approves request → User gets ladder_leaders entry
- [ ] User is now organizer of that specific ladder
- [ ] User can request to organize a different ladder (concurrent requests)
- [ ] Both requests can be independently approved/rejected
- [ ] User still appears as "player" role in global users table
