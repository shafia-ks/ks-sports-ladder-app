# Restructured Navigation Architecture

## Overview
The application has been reorganized with clear role-based information architecture. Navigation, workflows, and page hierarchy now match the user's role, making the experience intuitive for players, organizers, and admins.

## New Route Structure

### Public Routes
- `/` - Home page
- `/login` - User login
- `/signup/invitation?code=...` - Public sign-up with invitation code

### Player Routes (`/`)
- `/dashboard` - Player dashboard (my active ladders, challenges)
- `/ladders` - Browse all public ladders
- `/ladders/[id]` - View ladder rankings and details
- `/profile` - User profile settings
- `/notifications` - My notifications
- `/challenges` - My active challenges
- `/matches` - My match history

### Organizer Routes (`/organizer/*`)
All organizer-specific features are now under the `/organizer` namespace:
- `/organizer` - **Organizer Dashboard** (lists their created ladders)
- `/organizer/[id]/members` - **Consolidated Member Management**
  - View and approve pending members
  - Manage co-organizers
  - All in one place
- `/organizer/[id]/invite` - **Invite Members** (send invitations)

### Admin Routes (`/admin/*`)
System administration features only:
- `/admin` - **Admin Dashboard** (system stats, quick links)
- `/admin/organizer-requests` - **Review Organizer Requests** (approve/reject player requests)
- `/admin/users` - **User Management** (roles, permissions, membership approvals)
- `/admin/ladders` - Ladder management
- `/admin/seasons` - Season management
- `/admin/disputes` - Dispute resolution
- `/admin/audit-logs` - Audit trail

## Role-Based Navigation

### TopNav Links by Role

**Player:**
- Dashboard | Ladders | Notifications | Profile

**Organizer:**
- My Ladders | Dashboard | Notifications | Profile

**Admin:**
- Dashboard | Users | Requests | Disputes | Audits | Seasons

## Key Changes Made

### 1. Role-Aware TopNav Component
- `src/components/layout/top-nav.tsx` now renders different navigation links based on `user.role`
- Each role gets a customized menu with only relevant actions
- Removes clutter and confusion

### 2. New `/organizer` Namespace
- **Created:** `src/app/organizer/page.tsx` (dashboard)
- **Created:** `src/app/organizer/[id]/members/page.tsx` (consolidated member management)
- **Created:** `src/app/organizer/[id]/invite/page.tsx` (invite members)
- Organizers no longer access tools from `/admin` - everything is in `/organizer`

### 3. Consolidated Member Management
- `/organizer/[id]/members` combines:
  - Co-organizer management (add/remove organizers)
  - Member approval workflow (approved/pending)
  - Quick access to send invitations
- Clean, unified interface in one place

### 4. Renamed Admin Pages
- `/admin/leader-requests` → `/admin/organizer-requests` (clearer naming)
- Admin dashboard now says "Organizer Requests" instead of "Leader Requests"

### 5. Simplified Admin Dashboard
- Removed "Organizer Console" card (moved to `/organizer`)
- Removed "Invite Members" card (moved to `/organizer`)
- Admin sees system-wide features only
- Organizers go to `/organizer` for their tools

### 6. Role-Aware Dashboard
- `/dashboard` now redirects based on role:
  - **Organizers** → `/organizer` (their ladder management)
  - **Admins** → `/admin` (system console)
  - **Players** → Shows their active ladders, challenges, and rankings
- Each role gets a clear entry point

## Removed/Deprecated Pages
- `src/app/admin/organizer-console/` - Functionality moved to `/organizer/page.tsx`
- `src/app/admin/ladders/[id]/organizers/` - Functionality moved to `/organizer/[id]/members/`
- `src/app/admin/invite/` - Functionality moved to `/organizer/[id]/invite`
- `src/app/admin/leader-requests/` - Moved to `/admin/organizer-requests/`

*Note: Old pages can be kept temporarily for backward compatibility, but users should be redirected.*

## User Experience Flow

### New Player Flow
1. Login → Dashboard (shows their ladders)
2. Browse Ladders → `/ladders`
3. Join Ladder → Approved/Pending membership
4. View Ladder → `/ladders/[id]` (rankings, matches)
5. Create Challenge → `/challenges/create`

### New Organizer Flow
1. Login → Dashboard (generic player dashboard)
2. Or navigate to "My Ladders" in TopNav → `/organizer`
3. See all their created ladders
4. Click "Members" on a ladder → `/organizer/[id]/members`
5. Approve pending members, add co-organizers, or invite new members
6. Everything is self-contained and clear

### New Admin Flow
1. Login → Dashboard (can be navigated manually)
2. See pending organizer requests notification in TopNav
3. Click "Requests" → `/admin/organizer-requests`
4. Approve/reject organizer upgrade requests
5. Access other admin tools from `/admin` menu

## Benefits of This Architecture

1. **Clear Information Hierarchy** - Routes reflect user roles
2. **Reduced Confusion** - Players don't see organizer/admin features
3. **Consolidated Workflows** - Organizers do all member management in one place
4. **Better Navigation** - TopNav adapts to role, showing only relevant links
5. **Scalability** - Easy to add more organizer or admin features under their namespace
6. **Intuitive** - Users naturally expect to find their tools under their role
7. **Reduced Cognitive Load** - Fewer scattered options = clearer user experience

## API Endpoints (Unchanged)
- `/api/ladders/*` - Ladder operations
- `/api/invitations/*` - Invitation CRUD
- `/api/leader-requests/*` - Organizer request approvals
- `/api/admin/*` - System-wide operations
- `/api/users/*` - User profiles

All API endpoints remain the same. This is purely a frontend routing restructure.

## Future Improvements
1. Add breadcrumbs for better navigation context
2. Create role-specific "getting started" guides
3. Add admin audit logs for all organizer actions
4. Create organizer analytics dashboard
5. Add member invitation email templates
