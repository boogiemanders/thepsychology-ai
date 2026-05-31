# Checkpoint: TikTok auto-publish (build later)

## Status
NOT built. LinkedIn auto-publish on Slack approve is live (Zernio text post). TikTok
approve still just marks `approved` + shows copy-paste text in `handle-interaction.ts`.

## Why TikTok is deferred
Marketing drafts are text-only (`body_md`, no media — see `src/lib/marketing/types.ts`).
TikTok posts require a video file. We need a video-generation step before TikTok can
auto-publish. Decision (2026-05-30): set up video generation later, then wire TikTok.

## What's already in place to reuse
- Zernio posting works for video via the separate Auto Poster tool
  (`~/Downloads/Auto Poster Project/.claude/skills/auto-poster/scripts/post_to_zernio.py`),
  which uploads a local file (presign -> PUT -> publicUrl) and posts with `mediaItems`.
- TikTok account is connected on Zernio: accountId `6a1b7abc2b2567671a77654f`
  (handle `thepsychology.ai`). Profile id `6a1b7a701f5bd8a16eebe720`.
- LinkedIn auto-publish pattern to mirror: `src/lib/marketing/publish-linkedin.ts`.

## Build plan when ready
1. Add a video source to the draft shape (e.g. `media_url` / generated video path on
   `MarketingDraft` + `DraftInput` in `types.ts`).
2. New `publish-tiktok.ts`: if the video is a local path, run the presign->PUT->publicUrl
   upload (port the logic from `post_to_zernio.py`); if it's already a public URL, use it.
   Then POST to Zernio `/posts` with `platforms:[{platform:'tiktok',accountId}]`,
   `mediaItems:[{type:'video',url}]`, `publishNow:true`, fresh `x-request-id`.
3. In `handle-interaction.ts`, add a `draft.type === "tiktok"` branch that calls it,
   mirroring the linkedin branch (status -> published, link in the Slack card).
4. Env already needed: `ZERNIO_API_KEY` (shared). Add nothing new beyond the TikTok
   accountId, which Zernio resolves from the platform target.
