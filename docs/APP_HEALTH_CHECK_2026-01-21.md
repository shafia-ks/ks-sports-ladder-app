# 🏥 **APP HEALTH CHECK REPORT**
**Date:** 2026-01-21  
**Status:** ⚠️ **CRITICAL ISSUES DETECTED**

---

## 🚨 **1. CRITICAL: "OFFLINE" STATE & ASSET FAILURES**
**Severity:** CRITICAL 🔴

### **Observation**
- The application is stuck in a global "You're Offline" UI state on key pages:
  - `/dashboard`
  - `/ladders`
  - `/not-a-page-12345` (404 pages)
- **Browser Console Errors:** `net::ERR_FAILED` for critical JavaScript chunks (`main-app.js`, `vendor.js`) and CSS.
- **WebSocket Failure:** HMR (Hot Module Replacement) connection failed.

### **Root Cause Analysis (Potential)**
1. **Network/Environment:** The local development server (`localhost:3000`) is having trouble serving static assets. This could be due to:
   - Aggressive Webpack chunk splitting in `next.config.mjs`.
   - Local firewall or port blocking.
   - `experimental.optimizeCss` causing CSS loading issues.
2. **Hydration Mismatch:** A warning on `<body>` (`className` mismatch) suggests server-rendered HTML differs from client-side hydration, potentially triggered by `antigravity-scroll-lock` class injection or browser extensions.

### **Recommendations**
- **Simplify `next.config.mjs`:** Temporarily disable `optimizeCss` and custom webpack `splitChunks` to rule them out.
- **Check Network:** Verify `localhost` access and disable any VPNs/proxies.
- **Fix Hydration:** Investigate where `antigravity-scroll-lock` is coming from (likely a scroll-lock library hook) and ensure it only runs on the client.

---

## 🔄 **2. MISSING AUTO-UPDATES (CACHE INVALIDATION)**
**Severity:** HIGH 🟡

While match/challenge workflows were fixed, other key workflows are missing proper cache invalidation, meaning users won't see updates without refreshing.

### **A. Ladder Membership (Join/Leave)**
- **File:** `src/features/ladders/hooks/useLadderActions.ts`
- **Issue:** `joinLadder`, `approveMember`, `rejectMember` **ONLY** invalidate the specific ladder query (`['ladder', id]`).
- **Missing Invalidations:**
  - `['memberships', userId]`: To update "My Ladders" on dashboard.
  - `['pendingActions', userId]`: To update notifications/actions for organizers.
  - `['ladders']`: To update the global ladder list/counts.

### **B. Global Ladder List**
- **Issue:** Creating or archiving a ladder doesn't auto-update the "Explore Ladders" list.

### **Recommendations**
- Update `useLadderActions.ts` to invalidate `['memberships']`, `['pendingActions']`, and `['ladders']` upon successful mutations.

---

## 🔒 **3. SECURITY & PERMISSIONS**
**Severity:** MEDIUM 🟡

### **Observation**
- `middleware.ts` is configured to protect `/dashboard` and `/ladders`.
- However, the "Offline" state suggests that even authenticated users might be hitting barriers (or just broken assets).

### **Recommendations**
- Verify RLS policies for `ladders` and `ladder_memberships` to ensure they don't block `select` queries for authenticated users, which could cause data fetching errors (though usually returns 403, not asset failures).

---

## ⚡ **4. PERFORMANCE**
**Severity:** MEDIUM 🟢

### **Observation**
- **Image Optimization:** Warning: `Image with src "/app-icon-base.png" has "fill" but is missing "sizes" prop`.
- **Bundle Size:** `vendor.js` chunk failed to load, possibly due to size or corruption.

### **Recommendations**
- Add `sizes` prop to `next/image` components.
- Review `package.json` for heavy dependencies that might bloat the vendor chunk.

---

## 📝 **ACTION PLAN**

1.  **Fix "Offline" / Asset Issues:**
    -   Modify `next.config.mjs` to standard configuration.
    -   Restart dev server (User action required).
2.  **Fix Hydration Mismatch:**
    -   Locate `antigravity-scroll-lock` source and wrap in `useEffect`.
3.  **Implement Missing Auto-Updates:**
    -   Update `useLadderActions.ts` with comprehensive `invalidateQueries`.
4.  **Performance Polish:**
    -   Fix Image component props.
