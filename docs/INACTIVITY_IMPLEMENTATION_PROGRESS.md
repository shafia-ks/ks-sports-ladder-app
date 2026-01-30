# Inactivity Penalty System - Implementation Progress

## ✅ Phase 1: Database & API Foundation (COMPLETE)

### **Database Schema Created:**
1. **`ladder_inactivity_settings`** - Per-ladder configuration ✅
2. **`member_inactivity_tracking`** - Member activity tracking ✅
3. **`member_leave_history`** - Leave usage tracking ✅
4. **`inactivity_penalty_log`** - Audit log ✅

### **Database Features:**
✅ Auto-initialize tracking when member joins  
✅ Auto-update last_match_completed_at on match confirmation  
✅ RLS policies for security  
✅ Proper indexes for performance  
✅ Triggers for updated_at timestamps  

### **API Routes Created:**
1. `/api/ladders/[id]/inactivity-settings` ✅
   - GET: Fetch settings
   - PUT: Update settings (organizer/admin only)

2. `/api/ladders/[id]/members/[memberId]/leave` ✅
   - POST: Toggle leave status with usage validation

3. `/api/ladders/[id]/members/[memberId]/inactivity` ✅
   - GET: Fetch member tracking data

4. `/api/ladders/[id]/members/[memberId]/leave-usage` ✅
   - GET: Fetch leave usage for current year

### **React Query Hooks Created:**
- `useInactivitySettings(ladderId)` ✅
- `useUpdateInactivitySettings(ladderId)` ✅
- `useMemberTracking(ladderId, userId)` ✅
- `useLeaveUsage(ladderId, userId)` ✅
- `useToggleLeave(ladderId, userId)` ✅

### **TypeScript Types:**
✅ Complete type definitions  
✅ Default settings constant  
✅ Display labels & icons for leave types  

### **Build Status:**
✅ Type check passing  
✅ Build successful  
✅ All routing conflicts resolved  

---

## 🚧 Phase 2: UI Components (IN PROGRESS)

### **Components to Create:**

#### **1. InactivitySettingsForm.tsx** (Priority: High)
**Purpose:** Allow organizers to configure inactivity penalty settings  
**Location:** `src/features/inactivity/components/InactivitySettingsForm.tsx`  
**Features:**
- Toggle inactivity system on/off
- Configure threshold days
- Select penalty type and severity
- Set protection floor
- Configure leave system limits
- Enable/disable notifications

**Integration:** Add to Ladder Settings page as new "Inactivity & Leave" tab

---

#### **2. LeaveToggle.tsx** (Priority: High)
**Purpose:** Simple UI for players to manage their leave status  
**Location:** `src/features/inactivity/components/LeaveToggle.tsx`  
**Features:**
- Current leave status display
- Toggle leave on/off
- Select leave type (vacation, injury, work/travel, personal)
- Show remaining uses for each type
- Optional reason field
- Validation against usage limits

**Integration:** Add to Player Dashboard or Profile page

---

#### **3. LeaveStatusBadge.tsx** (Priority: Medium)
**Purpose:** Display leave status on rankings and member lists  
**Location:** `src/features/inactivity/components/LeaveStatusBadge.tsx`  
**Features:**
- Small badge showing "🏖️ On Leave (Vacation)"
- Different icons for each leave type
- Tooltip with leave start date and reason

**Integration:** Rankings page, member lists

---

#### **4. InactivityWarningBadge.tsx** (Priority: Medium)
**Purpose:** Show warning for players nearing penalty  
**Location:** `src/features/inactivity/components/InactivityWarningBadge.tsx`  
**Features:**
- Shows "⚠️ Inactive 25 days" for players nearing threshold
- Color-coded (yellow warning, red critical)
- Tooltip with days until penalty

**Integration:** Rankings page

---

#### **5. PenaltyHistoryCard.tsx** (Priority: Low)
**Purpose:** Display penalty log for a player  
**Location:** `src/features/inactivity/components/PenaltyHistoryCard.tsx`  
**Features:**
- List of all penalties applied
- Date, reason, rank before/after
- Total positions lost to inactivity

**Integration:** Player profile page

---

## 🚧 Phase 3: Penalty Calculation Logic (NEXT)

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
✅ supabase/migrations/20260129_inactivity_penalty_system.sql
✅ supabase/MANUAL_MIGRATION_inactivity.sql
✅ src/types/inactivity.ts
✅ src/features/inactivity/api/useInactivitySettings.ts
✅ src/features/inactivity/api/useLeaveManagement.ts
✅ src/app/api/ladders/[id]/inactivity-settings/route.ts
✅ src/app/api/ladders/[id]/members/[memberId]/leave/route.ts
✅ src/app/api/ladders/[id]/members/[memberId]/inactivity/route.ts
✅ src/app/api/ladders/[id]/members/[memberId]/leave-usage/route.ts
✅ docs/INACTIVITY_IMPLEMENTATION_PROGRESS.md
```

---

## 🎯 Current Status:

**Phase 1: COMPLETE ✅**
- Database schema deployed
- API routes working
- React Query hooks ready
- Build passing
- Type check passing

**Phase 2: STARTING NOW 🚀**
- Creating UI components
- Starting with InactivitySettingsForm and LeaveToggle

---

## 📝 Notes:

- Migration successfully applied to Supabase
- All routing conflicts resolved
- Using consistent parameter names ([id], [memberId])
- Ready to build UI components

---

**Status:** Phase 1 complete, moving to Phase 2 (UI components) 🚀
