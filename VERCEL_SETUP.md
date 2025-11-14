# Vercel Environment Setup

## Setting Up Supabase Environment Variables in Vercel

The Vercel build failed because the Supabase environment variables weren't available during the build process. Here's how to fix it:

### Step 1: Add Environment Variables to Vercel Dashboard

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project "thepsychology-ai"
3. Click **Settings** → **Environment Variables**
4. Add the following environment variables:

| Variable Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hwkuxietvwvbgdowxzkw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3a3V4aWV0dnd2Ymdkb3d4emt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTM1NTMsImV4cCI6MjA3ODQ2OTU1M30.ElDXc-JBYORsA4MGZ53y0NZfgGh9tpa81Yax9fENT6U` |

5. Make sure both are visible in:
   - Production
   - Preview
   - Development

### Step 2: Redeploy

After adding the environment variables:

1. Go back to **Deployments**
2. Click the three dots on the latest deployment
3. Select **Redeploy**

The build should now succeed!

### Why This Works

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public variables (prefix `NEXT_PUBLIC_`)
- These are embedded in the client-side JavaScript bundle
- The app now has lazy initialization, so it only creates the Supabase client when actually used
- During build time, the client code doesn't need to initialize the Supabase client

### Local Development

For local development, these variables are already in your `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=https://hwkuxietvwvbgdowxzkw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

These are picked up automatically when you run `npm run dev`.

### Troubleshooting

If the build still fails after adding environment variables:

1. Clear the Vercel build cache:
   - Go to Settings → Git
   - Click "Clear Build Cache"
   - Redeploy

2. Check that both environment variables are visible in all environments (Production, Preview, Development)

3. Verify the variable values are correct (no extra spaces or quotes)

For more info on Vercel environment variables: https://vercel.com/docs/projects/environment-variables
