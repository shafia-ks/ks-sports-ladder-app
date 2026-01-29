# Inactivity Penalty System - Implementation Progress

## ✅ Phase 1: Database & API Foundation (COMPLETE)

### **Database Schema Created:**
1. **`ladder_inactivity_settings`** - Per-ladder configuration
   - All penalty settings (threshold, type, severity, frequency)
   - Protection floor settings
   - Leave system settings (max uses per type)
   - Notification settings

2. **`member_inactivity_tracking`** - Member activity tracking
   - Last match completed timestamp
   - Last penalty applied timestamp
   - Leave status (on_leave, leave_type, leave_started_at, reason)
   - Penalty history (total penalties, positions lost)

3. **`member_leave_history`** - Leave usage tracking
   - Tracks all leaves taken (for yearly limits)
   - Start/end dates
   - Leave type and reason

4. **`inactivity_penalty_log`** - Audit log
   - Complete penalty history
   - Rank before/after
   - Days inactive
   - Capped at bottom/floor flags

### **Database Features:**
✅ Auto-initialize tracking when member joins  
✅ Auto-update last_match_completed_at on match confirmation  
✅ RLS policies for security  
✅ Proper indexes for performance  
✅ Triggers for updated_at timestamps  

### **API Routes Created:**
1. `/api/ladders/[ladderId]/inactivity-settings`
   - GET: Fetch settings
   - PUT: Update settings (organizer/admin only)

2. `/api/ladders/[ladderId]/members/[userId]/leave`
   - POST: Toggle leave status with usage validation

3. `/api/ladders/[ladderId]/members/[userId]/inactivity`
   - GET: Fetch member tracking data

4. `/api/ladders/[ladderId]/members/[userId]/leave-usage`
   - GET: Fetch leave usage for current year

### **React Query Hooks Created:**
- `useInactivitySettings(ladderId)` - Fetch/cache settings
- `useUpdateInactivitySettings(ladderId)` - Update settings
- `useMemberTracking(ladderId, userId)` - Fetch member tracking
- `useLeaveUsage(ladderId, userId)` - Fetch leave usage
- `useToggleLeave(ladderId, userId)` - Toggle leave status

### **TypeScript Types:**
✅ Complete type definitions  
✅ Default settings constant  
✅ Display labels & icons for leave types  

---

## 🚧 Phase 2: UI Components (NEXT)

### **Components to Create:**

1. **`InactivitySettingsForm.tsx`**
   - Form for organizers to configure inactivity settings
   - Location: Ladder Settings page, new "Inactivity" tab

2. **`LeaveToggle.tsx`**
   - Simple checkbox/toggle for players to manage leave
   - Shows current status, leave type, usage remaining
   - Location: Player profile or dashboard

3. **`LeaveStatusBadge.tsx`**
   - Small badge showing "🏖️ On Leave (Vacation)"
   - Location: Rankings page, member lists

4. **`InactivityWarningBadge.tsx`**
   - Shows "⚠️ Inactive 25 days" for players nearing penalty
   - Location: Rankings page

5. **`PenaltyHistoryCard.tsx`**
   - Displays penalty log for a player
   - Location: Player profile

---

## 🚧 Phase 3: Penalty Calculation Logic (AFTER UI)

### **Functions to Create:**

1. **`calculateInactivityPenalty.ts`**
   - Check if player should be penalized
   - Calculate new rank with protections
   - Apply penalty and log

2. **`checkChallengeEligibility.ts`**
   - Prevent challenges if player on leave
   - Update existing challenge validation

3. **`sendInactivityNotifications.ts`**
   - Warning notifications (7 days before)
   - Penalty applied notifications

---

## 🚧 Phase 4: Cron Job (FINAL)

### **Scheduled Task:**
- Daily cron job to check all ladders
- Apply penalties where needed
- Send notifications
- Update tracking data

---

## 📋 Files Created (Phase 1):

```
supabase/migrations/
  └── 20260129_inactivity_penalty_system.sql

src/types/
  └── inactivity.ts

src/features/inactivity/api/
  ├── useInactivitySettings.ts
  └── useLeaveManagement.ts

src/app/api/ladders/[ladderId]/
  ├── inactivity-settings/route.ts
  └── members/[userId]/
      ├── inactivity/route.ts
      ├── leave/route.ts
      └── leave-usage/route.ts
```

---

## 🎯 Next Steps:

1. **Run migration** to create database tables
2. **Create UI components** for settings and leave management
3. **Integrate into existing pages** (ladder settings, player profile, rankings)
4. **Implement penalty calculation** logic
5. **Create cron job** for daily checks
6. **Test thoroughly** with various scenarios

---

## 🔧 How to Run Migration:

```bash
# Using Supabase CLI
npx supabase db push

# Or manually in Supabase Dashboard
# Copy contents of migration file and run in SQL Editor
```

---

## 📝 Notes:

- All API routes have proper authentication & authorization
- Leave toggle validates usage limits before allowing
- Database triggers handle automatic updates
- React Query hooks have proper caching (1-5 min staleTime)
- RLS policies ensure data security

---

**Status:** Phase 1 complete, ready for Phase 2 (UI components) 🚀
