# Background Exam Generation System

## Overview

The background exam generation system is designed to pre-generate EPPP practice and diagnostic exams for users in the background, ensuring they have fast access to exams without waiting for on-demand generation.

## Architecture

### Components

1. **API Routes**
   - `/api/pre-generate-exam` - Generates exams using Claude API
   - `/api/get-pre-generated-exam` - Retrieves pre-generated exams for users
   - `/api/cron/generate-exams` - Scheduled cron job for periodic generation and cleanup
   - `/api/pre-gen-analytics` - Monitoring and analytics endpoint

2. **Client-Side Libraries**
   - `lib/pre-generated-exams.ts` - Core functions for managing pre-generated exams
   - `lib/background-job-handler.ts` - Job queue with retry logic

3. **Database**
   - `public.pre_generated_exams` - Table storing generated exams
   - Indexes for efficient queries
   - Row-level security (RLS) policies

## How It Works

### Trigger-Based Generation

Pre-generation is triggered in the following scenarios:

1. **Dashboard Page Load** (`src/app/dashboard/page.tsx`)
   ```typescript
   useEffect(() => {
     if (user?.id) {
       triggerBackgroundPreGeneration(user.id, 'diagnostic')
       triggerBackgroundPreGeneration(user.id, 'practice')
     }
   }, [user?.id])
   ```

2. **Exam Generator Page Load** (`src/app/exam-generator/page.tsx`)
   ```typescript
   useEffect(() => {
     if (userId && !examType) {
       triggerBackgroundPreGeneration(userId, 'diagnostic')
       triggerBackgroundPreGeneration(userId, 'practice')
     }
   }, [userId, examType])
   ```

### Scheduled Generation (Cron Job)

The `/api/cron/generate-exams` endpoint should be called periodically (e.g., every 6 hours) to:

1. Find all active users
2. Check if they have valid pre-generated exams
3. Generate missing exams
4. Clean up expired exams

### Job Queue and Retry Logic

The `background-job-handler.ts` library provides:

- **In-memory job queue** for tracking pending generation tasks
- **Automatic retries** (up to 3 attempts) with exponential backoff
- **Timeout protection** (2 minutes per job)
- **Non-blocking execution** to avoid blocking the UI

## Setup and Configuration

### Environment Variables

Add the following to your `.env.local`:

```
# Required for pre-generation
ANTHROPIC_API_KEY=<your-anthropic-api-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Optional: For cron security
CRON_SECRET=<your-secret-token>

# Optional: For analytics
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

### Setting Up Cron Jobs

#### Option 1: Vercel Crons (Recommended)

Create `vercel.json` in the root of your project:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-exams",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

The cron schedule `0 */6 * * *` runs every 6 hours. Adjust as needed:
- `0 */2 * * *` - Every 2 hours
- `0 0 * * *` - Once daily (midnight UTC)
- `0 12 * * *` - Once daily (noon UTC)

#### Option 2: External Cron Service (Upstash, cron-job.org, etc.)

Set up an HTTP POST request to:

```
POST https://yourapp.com/api/cron/generate-exams
Authorization: Bearer <CRON_SECRET>
```

#### Option 3: Node Cron (Development/Self-Hosted)

Create `src/lib/cron-setup.ts`:

```typescript
import cron from 'node-cron'

export function setupCronJobs() {
  // Run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      const response = await fetch('http://localhost:3000/api/cron/generate-exams', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        },
      })
      const result = await response.json()
      console.log('[Cron] Job completed:', result)
    } catch (error) {
      console.error('[Cron] Job failed:', error)
    }
  })
}
```

### Database Setup

The required table is created by the migration in `supabase/migrations/20250114_create_pre_generated_exams.sql`.

To run migrations:

```bash
supabase migration list
supabase migration up
```

## Monitoring

### Analytics Endpoint

Get system health and statistics:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" \
  https://yourapp.com/api/pre-gen-analytics
```

Response example:

```json
{
  "success": true,
  "stats": {
    "totalGenerated": 450,
    "totalUsed": 280,
    "totalUnused": 170,
    "totalExpired": 0,
    "averageExamsPerUser": 3.2,
    "diagnosticCount": 150,
    "practiceCount": 300,
    "usedPercentage": 62,
    "expiringWithin24h": 15,
    "userStats": {
      "usersWithPreGen": 142,
      "usersWithoutPreGen": 58,
      "avgPreGenPerUser": 3.2
    },
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

### Logs

Monitor the logs for `[Pre-Gen]`, `[BGJob]`, and `[Cron]` prefixes:

```bash
# View pre-generation logs
tail -f logs/pre-gen.log | grep "\[Pre-Gen\]"

# View cron job logs
tail -f logs/cron.log | grep "\[Cron\]"

# View background job logs
tail -f logs/bgjob.log | grep "\[BGJob\]"
```

## Performance Considerations

### API Rate Limiting

The Claude API has rate limits. To avoid hitting them:

1. **Batch Generation**: The cron job processes users in batches
2. **Exponential Backoff**: Retries use exponential backoff
3. **Queue Management**: Jobs are queued and processed sequentially

### Database Performance

The table has optimized indexes:

```sql
-- User + Type + Unused status (most common query)
CREATE INDEX idx_pre_gen_exams_user_type_unused
  ON public.pre_generated_exams(user_id, exam_type, used)
  WHERE used = FALSE;

-- Expiration cleanup
CREATE INDEX idx_pre_gen_exams_expires
  ON public.pre_generated_exams(expires_at);

-- Used exam cleanup
CREATE INDEX idx_pre_gen_exams_used_created
  ON public.pre_generated_exams(used, created_at);
```

### Storage

- **Diagnostic exam**: ~71 questions, ~100KB per exam
- **Practice exam**: ~225 questions, ~300KB per exam
- **Expiration**: Exams expire after 7 days
- **Cleanup**: Used exams are deleted after 1 day

Estimated storage per user with 6-hour generation schedule:
- 4 exams/day × 200KB average = 800KB/day
- After cleanup: Typically 2 active exams × 200KB = 400KB

## Troubleshooting

### Issue: Exams Not Being Generated

**Check:**
1. Is the cron job running? Check logs for `[Cron]` entries
2. Is `ANTHROPIC_API_KEY` set correctly?
3. Is `SUPABASE_SERVICE_ROLE_KEY` set correctly?
4. Are there API rate limits being hit?

**Solution:**
```bash
# Manually trigger generation for a user
curl -X POST https://yourapp.com/api/pre-generate-exam \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-here",
    "examType": "diagnostic"
  }'
```

### Issue: Job Queue Growing

**Check:**
1. Are jobs failing repeatedly?
2. Is the API returning errors?
3. Is the database accessible?

**Solution:**
```typescript
// In browser console
import { getJobQueueStatus, clearJobQueue } from '@/lib/background-job-handler'

// Check status
console.log(getJobQueueStatus())

// Clear stuck jobs (be careful!)
clearJobQueue()
```

### Issue: Database Storage Growing

**Check:**
1. Are exams being deleted after expiration?
2. Are used exams being cleaned up?

**Solution:**
```sql
-- Check oldest exams
SELECT created_at, expires_at, used, exam_type
FROM pre_generated_exams
ORDER BY created_at
LIMIT 10;

-- Manually clean up expired exams
DELETE FROM pre_generated_exams
WHERE expires_at < NOW()
OR (used = TRUE AND created_at < NOW() - INTERVAL '1 day');
```

## Best Practices

1. **Scheduling**: Run cron jobs during off-peak hours (e.g., 2 AM, 8 AM, 2 PM UTC)
2. **Monitoring**: Set up alerts for cron job failures
3. **Analytics**: Review analytics weekly to ensure system health
4. **User Experience**: Users should see pre-generated exams load in <100ms
5. **Cost Management**: Monitor API costs; adjust frequency if needed

## Future Improvements

1. **Distributed Queue**: Use Redis for multi-instance deployments
2. **Smart Generation**: Generate exams based on user behavior patterns
3. **A/B Testing**: Experiment with generation frequency and timing
4. **Machine Learning**: Predict which exam types users will take next
5. **Caching**: Cache frequently accessed exams in CDN

## Related Files

- `src/app/api/pre-generate-exam/route.ts` - Exam generation endpoint
- `src/app/api/get-pre-generated-exam/route.ts` - Exam retrieval endpoint
- `src/app/api/cron/generate-exams/route.ts` - Cron job endpoint
- `src/app/api/pre-gen-analytics/route.ts` - Analytics endpoint
- `src/lib/pre-generated-exams.ts` - Core library
- `src/lib/background-job-handler.ts` - Job queue handler
- `supabase/migrations/20250114_create_pre_generated_exams.sql` - Database schema
