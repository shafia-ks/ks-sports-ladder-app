# Session Management Configuration

## ✅ Automatic Session Refresh (IMPLEMENTED)

The app now automatically refreshes the user's session when:
- The PWA is opened after being closed
- The browser tab gains focus after being in the background
- The app becomes visible after being hidden

**How it works:**
1. Listens for `visibilitychange` events
2. Calls `refreshSession()` when app becomes visible
3. Extends the session token automatically
4. Keeps users logged in without manual re-authentication

**Fallback behavior:**
- If session refresh fails (token truly expired), user is redirected to login
- No more unexpected landing page appearances
- Graceful degradation

---

## 📋 Optional: Increase Session Duration in Supabase

If you want to extend how long sessions last before requiring a refresh, you can adjust Supabase settings:

### Steps:

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings:**
   - Click "Authentication" in the left sidebar
   - Click "Settings" tab

3. **Adjust JWT Expiry:**
   - Find "JWT Expiry" setting
   - Default: `3600` seconds (1 hour)
   - Recommended: `604800` seconds (7 days)
   - Maximum: `2592000` seconds (30 days)

4. **Adjust Refresh Token Expiry:**
   - Find "Refresh Token Expiry" setting
   - Default: `604800` seconds (7 days)
   - Recommended: `2592000` seconds (30 days)
   - Maximum: `7776000` seconds (90 days)

5. **Save Changes**

### Current Behavior (with auto-refresh):

| Scenario | What Happens |
|----------|-------------|
| User opens PWA after 1 hour | ✅ Session auto-refreshed, stays logged in |
| User opens PWA after 1 day | ✅ Session auto-refreshed, stays logged in |
| User opens PWA after 7 days | ✅ Session auto-refreshed (if within refresh token expiry) |
| User opens PWA after 30+ days | ❌ Session expired, redirected to login |

### Recommended Settings:

```
JWT Expiry: 604800 (7 days)
Refresh Token Expiry: 2592000 (30 days)
```

This means:
- Users stay logged in for up to **30 days** without any action
- Auto-refresh keeps extending the session as long as they use the app
- Only truly inactive users (30+ days) need to log in again

---

## 🔒 Security Considerations

**Why not set it to forever?**
- Security best practice: Sessions should eventually expire
- Protects against stolen tokens
- Forces re-authentication periodically

**Our implementation balances:**
- ✅ User convenience (auto-refresh)
- ✅ Security (eventual expiry)
- ✅ PWA experience (seamless reopening)

---

## 🧪 Testing

To test the auto-refresh:

1. **Open the PWA**
2. **Close it** (don't log out)
3. **Wait a few minutes**
4. **Reopen the PWA**
5. **Check browser console** - you should see:
   ```
   Session refreshed successfully
   ```
6. **Verify** - you should be on the dashboard, not login page

---

## 📊 Monitoring

You can monitor session refresh activity in the browser console:
- ✅ Success: `"Session refreshed successfully"`
- ❌ Failure: `"Session refresh failed: [error]"`

If you see frequent failures, it might indicate:
- Network connectivity issues
- Supabase service issues
- Session duration settings too short
