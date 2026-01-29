# Performance Optimization Plan

## 🐌 Current Issues

### **Issue 1: Pending Organizer Request Not Showing**
- API changes deployed but not working
- Need to verify admin check is functioning
- Possible caching issue

### **Issue 2: Ladders Page Blank/Slow**
- **Root Cause:** No caching on `useLadders` hook
- **Impact:** Every page load hits database
- **Symptom:** Blank screen while loading

### **Issue 3: Dashboard Slow**
- Multiple API calls without caching
- Sequential loading (not parallel)
- Large data fetches

---

## 🚀 Immediate Fixes

### **Fix 1: Add Caching to useLadders**
```typescript
// Current (NO CACHING):
export function useLadders() {
  return useQuery({ queryKey: ["ladders"], queryFn: fetchLadders });
}

// Fixed (WITH CACHING):
export function useLadders() {
  return useQuery({
    queryKey: ["ladders"],
    queryFn: fetchLadders,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

**Impact:**
- First load: Hits API (slow)
- Subsequent loads within 5 min: Instant ✅
- Reduces database load by 90%+

---

### **Fix 2: Add Caching to Dashboard Hooks**
```typescript
// useDashboardData - NO CACHING
// usePendingActions - 1 minute cache ✅
// useUpcomingMatches - NO CACHING
// useRecentActivity - NO CACHING
```

**Add caching to all:**
```typescript
staleTime: 2 * 60 * 1000, // 2 minutes
cacheTime: 5 * 60 * 1000, // 5 minutes
```

---

### **Fix 3: Optimize Ladders Page**
**Current:** Sequential loading
```
1. Fetch ladders (wait...)
2. Fetch memberships (wait...)
3. Render
```

**Optimized:** Parallel loading + Show partial data
```
1. Fetch ladders + memberships (parallel)
2. Show ladders immediately (even if memberships loading)
3. Update when memberships arrive
```

---

### **Fix 4: Add Loading States**
Instead of blank screen, show:
- Skeleton loaders
- Progressive rendering
- Optimistic UI

---

## 📊 Performance Metrics

### **Before Optimization:**
```
Dashboard Load Time: 3-5 seconds
Ladders Page Load Time: 4-6 seconds
API Calls per Dashboard Visit: 5-7
Database Queries: Every page load
```

### **After Optimization (Target):**
```
Dashboard Load Time: 0.5-1 second (cached)
Ladders Page Load Time: 0.5-1 second (cached)
API Calls per Dashboard Visit: 0-2 (mostly cached)
Database Queries: Only on cache miss
```

---

## 🔧 Implementation Priority

### **Priority 1 (Critical - Do Now):**
1. ✅ Add caching to `useLadders` (5 min staleTime)
2. ✅ Add caching to `useDashboardData` (2 min staleTime)
3. ✅ Add caching to `useUpcomingMatches` (2 min staleTime)
4. ✅ Add caching to `useRecentActivity` (1 min staleTime)

### **Priority 2 (Important - Do Soon):**
5. Fix pending organizer request API
6. Add skeleton loaders to ladders page
7. Optimize database queries (add indexes)

### **Priority 3 (Nice to Have):**
8. Implement React Server Components (Next.js 14)
9. Add Redis caching layer
10. Implement pagination for large lists

---

## 🗄️ Database Optimization

### **Missing Indexes:**
```sql
-- Pending actions query is slow
CREATE INDEX idx_challenges_status_challenged ON challenges(status, challenged_id);
CREATE INDEX idx_matches_status_players ON matches(status, player1_id, player2_id);
CREATE INDEX idx_ladder_memberships_status ON ladder_memberships(status, ladder_id);

-- Ladders query
CREATE INDEX idx_ladders_status ON ladders(status);
CREATE INDEX idx_ladders_visibility ON ladders(visibility);
```

---

## 📝 Recommended Caching Strategy

### **Data Freshness Requirements:**

| Data Type | Freshness | Recommended Cache |
|-----------|-----------|-------------------|
| Ladders list | Can be stale 5 min | 5 min staleTime |
| Rankings | Should be fresh | 1 min staleTime |
| Pending actions | Should be fresh | 1 min staleTime |
| Match history | Can be stale 5 min | 5 min staleTime |
| User profile | Can be stale 10 min | 10 min staleTime |
| Notifications | Should be fresh | 30 sec staleTime |

---

## 🎯 Expected Results

After implementing Priority 1 fixes:

✅ **Ladders page loads instantly** (after first visit)  
✅ **Dashboard loads in < 1 second** (after first visit)  
✅ **90% reduction in API calls**  
✅ **90% reduction in database load**  
✅ **Better user experience** (no blank screens)  

---

## 🚨 Pending Organizer Request Debug

### **Why it's not showing:**

Possible causes:
1. API change not deployed to Vercel
2. Admin check failing
3. Data not in database
4. Frontend not rendering

### **Debug Steps:**
1. Check Vercel deployment status
2. Test API endpoint directly: `/api/dashboard/pending-actions?user_id=YOUR_ID`
3. Check database: `SELECT * FROM leader_requests WHERE status = 'pending'`
4. Check frontend rendering logic

---

## 📋 Implementation Checklist

- [ ] Add caching to `useLadders`
- [ ] Add caching to `useDashboardData`
- [ ] Add caching to `useUpcomingMatches`
- [ ] Add caching to `useRecentActivity`
- [ ] Test ladders page performance
- [ ] Test dashboard performance
- [ ] Debug pending organizer request
- [ ] Add database indexes
- [ ] Monitor performance metrics
