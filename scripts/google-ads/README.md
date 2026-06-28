# Google Ads API integration

Internal scripts to manage our single Google Ads account (EPPP Prep - Search - US+CA):
read reports, mine wasted-spend search terms into negatives, and (later) adjust bids/budgets.

We use the maintained `google-ads-api` TypeScript client instead of raw REST because it
handles OAuth token refresh, tracks the quarterly API version bump, and keeps GAQL typed.

## Phase status
- Phase 1 (built): `client.ts` (auth) + `report.ts` (read-only connectivity + 7-day snapshot).
- Phase 2 (after reads verified): negative-keyword mining with a guarded `--apply`, daily Slack report.

## What you create once (founder)
The code is ready. It needs 6 values in `.env.local`:

1. **Developer token** (have it). Google Ads > Tools > API Center. Explorer access is enough
   (it reaches the production account, 2,880 ops/day).
2. **Google Cloud project + OAuth client:**
   - console.cloud.google.com, create or pick a project.
   - APIs & Services > Library > enable **Google Ads API**.
   - OAuth consent screen > External (or Internal on Workspace) > add your email as a test user.
   - Credentials > Create credentials > OAuth client ID > **Desktop app**. Copy Client ID + Client secret.
3. **Refresh token:** authorize your Google account (the one that can see the ad account) once.
   Easiest path: developers.google.com/oauthplayground > gear icon > "Use your own OAuth credentials"
   > paste client id/secret > authorize scope `https://www.googleapis.com/auth/adwords` >
   "Exchange authorization code for tokens" > copy the **refresh token**.
4. **Customer ID:** the ad account id, 10 digits no dashes (top right in Google Ads).
5. **Login customer ID:** only if the account sits under a manager (MCC). The manager's id, no dashes. Otherwise skip.

## .env.local
```
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...
GOOGLE_ADS_REFRESH_TOKEN=...
GOOGLE_ADS_CUSTOMER_ID=1234567890
# GOOGLE_ADS_LOGIN_CUSTOMER_ID=1234567890   # only if under a manager account
```

## Install + run
```
bun add google-ads-api      # already added to package.json; this installs it
bun run gads:report         # or: npx tsx scripts/google-ads/report.ts
```
If it prints the account name, campaign stats, and search terms with no error, auth works
and Phase 2 is unblocked.

## Basic access application (optional)
You already have **Explorer** access, which works against the production account at 2,880
operations/day. That is plenty for one small account, so Basic access is **not required** to
run these scripts. Submit the application only to future-proof (and note there is a Feb 2026
review backlog, so it is slow). Form answers if you do submit:

- **Q6 (business model + how you use Google Ads):**
  > thePsychology.ai is a subscription web app that helps psychologists prepare for the EPPP
  > licensing exam, with adaptive practice questions, full-length practice exams, and study tools.
  > After a 7-day free trial, access is a monthly subscription. We run Google Ads Search campaigns
  > in the US and Canada to acquire trial signups for EPPP-related searches. We will use the Google
  > Ads API to manage our own single account more efficiently: pulling search-term and performance
  > reports, adding negative keywords to cut wasted spend, and adjusting bids and budgets. The tool
  > is internal only, used by our team to manage our own advertising. We are not building a product
  > for third parties.
- **Q7 (design doc):** upload `~/Downloads/thepsychology-google-ads-api-design-doc.rtf`.
- **Q8:** Internal users - employees only.
- **Q9:** No.
