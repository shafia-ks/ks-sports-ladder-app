# Email Setup Guide - Supabase SMTP

## ✅ What's Implemented

Your invitation system now uses **Supabase's built-in email service**. The code is ready and will:

1. **Existing Users**: Send in-app notifications ✅
2. **New Users**: Send email invitations via Supabase SMTP ✅

## 🔧 Required Setup (One-Time)

### Step 1: Configure SMTP in Supabase Dashboard

1. Go to your **Supabase Dashboard**
2. Navigate to: **Project Settings** → **Authentication** → **SMTP Settings**
3. Enable **Custom SMTP**

### Step 2: Choose an SMTP Provider

You have several options:

#### **Option A: Gmail (Free, Quick Setup)**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP Username: your-email@gmail.com
SMTP Password: [App Password - see below]
Sender Email: your-email@gmail.com
Sender Name: KS Sports Ladder
```

**To get Gmail App Password:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate password for "Mail"
5. Use that password in SMTP settings

#### **Option B: SendGrid (Recommended for Production)**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP Username: apikey
SMTP Password: [Your SendGrid API Key]
Sender Email: noreply@yourdomain.com
Sender Name: KS Sports Ladder
```

#### **Option C: AWS SES, Mailgun, etc.**
Follow their SMTP configuration docs

### Step 3: Verify Environment Variables

Make sure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🧪 Testing

### Test Existing User Invitations
1. Invite an existing user to a ladder
2. Check server logs for: `✅ Notification created for user {id}`
3. User should see notification in `/notifications`

### Test New User Email Invitations
1. Invite a new email address
2. Check server logs for: `✅ Email sent via Supabase to: email@example.com`
3. Check recipient's inbox (including spam folder)

### If Emails Don't Send
Check server logs for:
- `❌ Supabase credentials missing` → Check `.env.local`
- `❌ Supabase email error` → Check SMTP configuration in dashboard
- `📧 Email details (not sent)` → SMTP not configured yet

## 📊 Current Status

| Feature | Status | Action Needed |
|---------|--------|---------------|
| Code Implementation | ✅ Complete | None |
| Notification System | ✅ Working | None |
| Email Integration | ⚠️ Needs SMTP | Configure in Supabase Dashboard |

## 🚀 Quick Start (5 minutes)

1. **Supabase Dashboard** → Auth → SMTP Settings
2. Use **Gmail** with App Password (easiest for testing)
3. Save settings
4. Test by inviting a new user
5. Check logs and inbox

## 🔍 Troubleshooting

**Problem**: Emails not sending
- **Solution**: Check Supabase SMTP settings are saved and enabled

**Problem**: "Credentials missing" error
- **Solution**: Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

**Problem**: Emails go to spam
- **Solution**: Use a verified domain with SendGrid/SES in production

**Problem**: Notifications not showing for existing users
- **Solution**: Check server logs for notification creation errors

## 📝 Notes

- **Development**: Gmail works fine for testing
- **Production**: Use SendGrid, AWS SES, or Mailgun
- **Fallback**: If SMTP fails, emails are logged to console
- **Security**: Service role key should NEVER be exposed to client
