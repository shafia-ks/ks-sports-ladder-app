# Password Reset Configuration

## Issue
Password reset links from email show as "expired" and redirect to login page immediately.

## Root Cause
Supabase needs the redirect URL to be whitelisted in the project settings.

## Solution

### 1. Configure Redirect URLs in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add the following URLs to **Redirect URLs**:

   **For Local Development:**
   ```
   http://localhost:3000/auth/reset-password
   ```

   **For Production:**
   ```
   https://your-domain.com/auth/reset-password
   https://your-domain.vercel.app/auth/reset-password
   ```

4. Click **Save**

### 2. Verify Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Find the **Reset Password** template
3. Ensure the reset link uses the correct redirect URL:
   ```html
   <a href="{{ .ConfirmationURL }}">Reset Password</a>
   ```

### 3. Test the Flow

1. Go to `/login`
2. Click "Forgot password? Send reset link"
3. Enter your email
4. Check your email inbox
5. Click the reset link
6. You should now see the "Set New Password" page instead of being redirected to login

## Code Changes Made

- **Increased timeout**: Changed from 300ms to 1000ms initial wait
- **Added retry logic**: Now retries 3 times with 500ms delays
- **Better error handling**: Shows error for 3 seconds before redirecting

## Common Issues

### Still showing as expired?
- **Check Supabase logs**: Go to Logs → Auth Logs to see if there are any errors
- **Verify redirect URL**: Make sure it exactly matches what's configured in Supabase
- **Check token expiry**: Reset tokens expire after 1 hour by default
- **Browser cache**: Try in incognito mode

### Token already used?
- Reset tokens are single-use only
- Request a new reset link if you've already used one

## Environment Variables

Ensure these are set correctly:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
