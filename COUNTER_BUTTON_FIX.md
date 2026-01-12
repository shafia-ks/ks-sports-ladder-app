# Counter Button and Button Overflow Fixes

## ISSUE #1: Unwanted "Counter" Button

**Location**: Ladder Challenges page (`src/app/ladders/[id]/page.tsx` line 357-362)

**Problem**: A "Counter" button appears between the challenge accept/decline options. You don't want this counter-proposal feature.

**Fix**: Delete lines 357-362 in `src/app/ladders/[id]/page.tsx`:

```tsx
// DELETE THESE LINES (357-362):
<button
  onClick={() => setShowCounterProposal(challenge.id)}
  className="btn btn-sm border border-brand-300 text-brand-700 hover:bg-brand-50"
>
  Counter
</button>
```

**After removal**, the challenge will only show:
- ✅ Accept (green button)
- ✅ Decline (grey button)

---

## ISSUE #2: Decline Button Cut Off in Dashboard

**Location**: My Challenges Card (`src/features/ladders/components/dashboard/MyActiveChallengesCard.tsx` line 118-146)

**Problem**: The "Decline" button goes out of frame in the dashboard widget.

**Root Cause**: The flex layout uses `justify-between` which pushes content to edges when space is tight.

**Fix**: Already implemented in `MyActiveChallengesCard.tsx`:
- Changed from horizontal flex (`flex-row justify-between`) to vertical flex (`flex-col`)
- Made buttons full width with `flex-1`
- Buttons stack vertically on small screens

**Result**: Both Accept and Decline buttons fit properly without overflow.

---

## PRIORITY:

The **Counter button removal** is straightforward - just delete those 6 lines from the file.

The **button overflow fix** is already implemented in the codebase for the dashboard widget.

---

## MOST IMPORTANT FIX:

**Run FIX_rls_users_table.sql** - This will fix the "Unknown" names issue which is more critical than the Counter button!
