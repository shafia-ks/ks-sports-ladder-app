# Inactivity Penalty System - Cron Job Setup

## Overview

The inactivity penalty system includes an automated daily cron job that:
- Checks all ladders with inactivity system enabled
- Calculates days inactive for each member
- Sends warning notifications to players nearing penalties
- Applies penalties to players who exceed the threshold
- Records all actions in the penalty history

## Cron Job Configuration

### Vercel Deployment

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/inactivity-check",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Schedule:** Runs daily at 2:00 AM UTC

### Manual Trigger

You can manually trigger the cron job for testing:

```bash
curl -X POST https://your-app.vercel.app/api/cron/inactivity-check \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Environment Variables

Add to your `.env.local` and Vercel environment variables:

```env
# Optional: Secret token to protect the cron endpoint
CRON_SECRET=your-secret-token-here

# Required: Your app URL for internal API calls
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Security

The cron endpoint is protected by:
1. **Authorization Header:** Requires `Bearer ${CRON_SECRET}` token
2. **Vercel Cron:** Only Vercel's cron service can call it in production

## How It Works

1. **Fetch Enabled Ladders**
   - Queries `ladder_inactivity_settings` for ladders with `enabled = true`

2. **Process Each Ladder**
   - Calls `/api/ladders/[id]/apply-inactivity-penalties` for each ladder
   - This endpoint handles all the logic for that specific ladder

3. **For Each Member:**
   - Skip if on leave
   - Skip if in grace period
   - Calculate days inactive
   - Send warning if approaching threshold
   - Apply penalty if past threshold
   - Record in history
   - Send notification

4. **Return Results**
   - Total ladders processed
   - Total penalties applied
   - Total warnings sent
   - Detailed results per ladder

## Response Format

```json
{
  "success": true,
  "laddersProcessed": 5,
  "totalPenalties": 12,
  "totalWarnings": 8,
  "results": [
    {
      "ladderId": "ladder-123",
      "success": true,
      "penaltiesApplied": 3,
      "warningsSent": 2
    }
  ],
  "timestamp": "2026-01-30T02:00:00.000Z"
}
```

## Monitoring

### Vercel Dashboard
- View cron execution logs in Vercel Dashboard → Functions → Cron
- Check for errors and execution times

### Database Logs
- Check `inactivity_penalty_history` table for applied penalties
- Check `notifications` table for sent notifications

## Alternative Cron Services

If not using Vercel, you can use:

### GitHub Actions

Create `.github/workflows/inactivity-cron.yml`:

```yaml
name: Inactivity Check Cron

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  check-inactivity:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Inactivity Check
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/inactivity-check \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### External Cron Services

- **Cron-job.org:** Free cron service
- **EasyCron:** Paid cron service
- **AWS EventBridge:** AWS-based scheduling

## Testing

### Test Locally

```bash
# Start your dev server
npm run dev

# In another terminal, trigger the cron
curl -X POST http://localhost:3000/api/cron/inactivity-check \
  -H "Authorization: Bearer your-test-secret"
```

### Test Individual Ladder

```bash
curl -X POST http://localhost:3000/api/ladders/LADDER_ID/apply-inactivity-penalties
```

## Troubleshooting

### Cron Not Running
1. Check Vercel Dashboard → Settings → Crons
2. Verify `vercel.json` is in root directory
3. Redeploy the application

### No Penalties Applied
1. Check if inactivity system is enabled for ladders
2. Verify members have `last_match_completed_at` timestamps
3. Check if members are in grace period
4. Verify threshold days are set correctly

### Notifications Not Sent
1. Check `notifications` table for entries
2. Verify notification settings are enabled
3. Check console logs for errors

## Performance Considerations

- **Batch Processing:** Processes all ladders in sequence
- **Timeout:** Vercel cron has 10-second timeout on Hobby plan
- **Optimization:** For large numbers of ladders, consider:
  - Splitting into multiple cron jobs
  - Using background jobs (e.g., Inngest, QStash)
  - Implementing pagination

## Future Enhancements

- [ ] Email notifications (currently in-app only)
- [ ] Slack/Discord webhooks for organizers
- [ ] Configurable cron schedule per ladder
- [ ] Retry logic for failed penalty applications
- [ ] Detailed analytics dashboard
