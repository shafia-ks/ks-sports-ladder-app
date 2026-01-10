# 🎯 **PRIORITIZED ACTION PLAN**
## Production Readiness Checklist

---

## 🔴 **CRITICAL - DO FIRST (Before Any Production Use)**

### 1. **Apply Database Migration** ⏱️ 30 min
**Status:** ❌ Not Applied  
**Risk:** HIGH - App will break

```bash
# In Supabase SQL Editor, run:
supabase/migrations/20260110000000_update_status_constraints.sql
```

**Verification:**
```sql
-- Test that these work:
INSERT INTO matches (status) VALUES ('Pending');
UPDATE ladders SET status = 'archived' WHERE id = 'test';
```

---

### 2. **Implement Middleware Authentication** ⏱️ 4 hours
**Status:** ❌ CRITICAL SECURITY HOLE  
**Risk:** CRITICAL - Anyone can access admin routes

**File:** `src/middleware.ts`

**Implementation:**
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (!user || !['admin', 'organizer'].includes(user.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Protect authenticated routes
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/challenges/create') ||
    pathname.startsWith('/matches/submit')
  ) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/challenges/create',
    '/matches/submit',
    '/ladders/:id/settings',
    '/organizer/:path*'
  ],
};
```

---

### 3. **Standardize API Authentication** ⏱️ 6 hours
**Status:** ❌ Inconsistent  
**Risk:** HIGH - Data breach potential

**Create:** `src/lib/api/auth-middleware.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function requireAuth() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
      session: null,
      user: null
    };
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return { error: null, session, user };
}

export async function requireRole(allowedRoles: string[]) {
  const { error, user } = await requireAuth();
  
  if (error) return { error, user: null };
  
  if (!user || !allowedRoles.includes(user.role)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      ),
      user: null
    };
  }

  return { error: null, user };
}
```

**Usage in API routes:**
```typescript
// In every API route
import { requireAuth, requireRole } from '@/lib/api/auth-middleware';

export async function GET(request: Request) {
  const { error, user } = await requireAuth();
  if (error) return error;

  // Your logic here...
}

// For admin-only routes
export async function DELETE(request: Request) {
  const { error, user } = await requireRole(['admin']);
  if (error) return error;

  // Your logic here...
}
```

---

## 🟡 **HIGH PRIORITY - DO THIS WEEK**

### 4. **Integrate Sentry Error Tracking** ⏱️ 3 hours
**Status:** ❌ No production error visibility

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Configure:** `sentry.client.config.ts`
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
});
```

---

### 5. **Add Rate Limiting** ⏱️ 3 hours
**Status:** ❌ Vulnerable to abuse

```bash
npm install @upstash/ratelimit @upstash/redis
```

**Create:** `src/lib/api/rate-limit.ts`
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
  
  if (!success) {
    return {
      error: new Response('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }),
    };
  }

  return { error: null };
}
```

---

### 6. **Implement SWR for Client Caching** ⏱️ 8 hours
**Status:** ❌ Slow page loads

```bash
npm install swr
```

**Create:** `src/hooks/useLadder.ts`
```typescript
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useLadder(id: string) {
  const { data, error, mutate } = useSWR(
    id ? `/api/ladders/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
      refreshInterval: 0,
    }
  );

  return {
    ladder: data?.ladder,
    members: data?.members,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
```

**Replace in components:**
```typescript
// Before
const [data, setData] = useState(null);
useEffect(() => {
  fetch(`/api/ladders/${id}`).then(r => r.json()).then(setData);
}, [id]);

// After
const { ladder, members, isLoading } = useLadder(id);
```

---

## 🟢 **MEDIUM PRIORITY - DO THIS MONTH**

### 7. **Implement Realtime Updates** ⏱️ 12 hours
**Status:** ❌ Users must refresh manually

**Update:** `src/hooks/useRealtimeUpdates.ts`
```typescript
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useRealtimeLadder(ladderId: string, onUpdate: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`ladder:${ladderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ladder_members',
          filter: `ladder_id=eq.${ladderId}`,
        },
        (payload) => {
          console.log('[Realtime] Ladder update:', payload);
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ladderId, onUpdate]);
}
```

**Usage:**
```typescript
const { ladder, mutate } = useLadder(id);

useRealtimeLadder(id, () => {
  mutate(); // Refresh data when realtime update received
});
```

---

### 8. **Add Loading Skeletons** ⏱️ 6 hours
**Status:** ⚠️ Partial - needs more

**Create skeletons for:**
- Ladder list page
- Challenge list page
- Match history page
- User profile page

**Example:**
```typescript
{isLoading ? (
  <div className="space-y-4">
    {[1,2,3,4,5].map(i => (
      <div key={i} className="card p-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    ))}
  </div>
) : (
  <ActualContent data={data} />
)}
```

---

### 9. **Fix TypeScript Types** ⏱️ 6 hours
**Status:** ⚠️ Too many `any` types

**Files to fix:**
- `src/components/dashboard/my-ladders-grid.tsx`
- `src/components/dashboard/pending-actions.tsx`
- `src/app/challenges/create/page.tsx`

**Create:** `src/types/database.ts`
```typescript
export interface Ladder {
  id: string;
  name: string;
  description: string | null;
  sport_id: string;
  location: string | null;
  visibility: 'public' | 'private';
  status: 'active' | 'inactive' | 'archived';
  challenge_rules: ChallengeRules;
  ranking_rules: RankingRules;
  created_at: string;
  created_by: string;
}

export interface Challenge {
  id: string;
  ladder_id: string;
  challenger_id: string;
  challenged_id: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Cancelled' | 'Expired';
  scheduled_date_time: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  expires_at: string;
}

// ... more types
```

---

### 10. **Remove Console.logs** ⏱️ 2 hours
**Status:** ❌ 30+ console.logs in code

**Create:** `src/lib/utils/logger.ts`
```typescript
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (...args: any[]) => {
    if (isDev) console.log('[DEBUG]', ...args);
  },
  info: (...args: any[]) => {
    if (isDev) console.info('[INFO]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
    // Send to Sentry in production
  },
};
```

**Replace all:**
```bash
# Find and replace
console.log → logger.debug
console.error → logger.error
console.warn → logger.warn
```

---

## 🔵 **LOW PRIORITY - FUTURE ENHANCEMENTS**

### 11. **Add Unit Tests** ⏱️ 16 hours
**Status:** ❌ 0% coverage

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Priority test files:**
1. API routes (auth, CRUD)
2. Ranking calculation logic
3. Challenge validation
4. Form components

---

### 12. **Accessibility Improvements** ⏱️ 8 hours
**Status:** ⚠️ Needs work

**Checklist:**
- [ ] Add aria-labels to all buttons
- [ ] Keyboard navigation for modals
- [ ] Focus management
- [ ] Screen reader testing
- [ ] Color contrast (WCAG AA)

---

### 13. **Performance Optimization** ⏱️ 8 hours

**Tasks:**
- [ ] Image optimization (Next.js Image)
- [ ] Code splitting
- [ ] Bundle analysis
- [ ] Lazy loading
- [ ] Database query optimization

---

## 📊 **PROGRESS TRACKER**

### Week 1: Security & Stability
- [ ] Apply database migration
- [ ] Implement middleware auth
- [ ] Standardize API auth
- [ ] Integrate Sentry
- [ ] Add rate limiting

**Target:** 100% complete

---

### Week 2: Performance
- [ ] Implement SWR caching
- [ ] Add loading skeletons
- [ ] Fix TypeScript types
- [ ] Remove console.logs

**Target:** 80% complete

---

### Week 3: Realtime & UX
- [ ] Implement realtime updates
- [ ] Accessibility improvements
- [ ] Error message improvements

**Target:** 70% complete

---

### Week 4: Quality & Testing
- [ ] Write critical tests
- [ ] Performance optimization
- [ ] Documentation updates

**Target:** 60% complete

---

## 🎯 **SUCCESS METRICS**

### Security
- ✅ All routes protected
- ✅ Rate limiting active
- ✅ No auth bypasses

### Performance
- ✅ Lighthouse score > 90
- ✅ API response < 200ms
- ✅ Page load < 3s

### Quality
- ✅ Zero console.logs
- ✅ TypeScript strict mode
- ✅ Test coverage > 50%

---

**Last Updated:** 2026-01-10  
**Next Review:** After Week 1 completion
