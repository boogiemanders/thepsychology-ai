# SEO Quick Wins — thepsychology.ai

Items fixable in <15 minutes with high impact. Sorted by impact.

---

## 1. Remove/Compress yael-dror.png (5 min)
**Impact:** High — 19MB image destroys page load
**Action:** Delete if unused, or compress to WebP <200KB
```bash
# Check usage
grep -r "yael-dror" src/
# If unused, delete it
rm public/yael-dror.png
```

## 2. Enable Image Optimization (2 min)
**Impact:** High — unlocks automatic WebP/AVIF, lazy loading, responsive images
**File:** `next.config.mjs`
**Action:** Remove `images: { unoptimized: true }` or set to `false`

## 3. Remove 404 URLs from Sitemap (10 min)
**Impact:** Critical — 133 broken URLs sending bad signals to Google
**Action:** Either remove `/resources/topics/*` URLs from sitemap generation, or only include URLs that actually resolve

## 4. Add BlogPosting Schema (10 min)
**Impact:** Medium — enables rich results for blog articles in SERPs
**Action:** Add JSON-LD BlogPosting schema to blog layout component

## 5. Fix Blog Hub H1 (1 min)
**Impact:** Low-Medium — "Blog" → keyword-rich heading
**Action:** Change H1 from "Blog" to "EPPP Study Guides & Exam Tips"

## 6. Fix Image Aspect Ratios (5 min)
**Impact:** Low — Lighthouse failure, minor visual issue
**Action:** Add `width: auto` or `height: auto` CSS to openai.svg, claude.png, notebooklm.png (flagged in console warnings)

## 7. Expand /resources Meta Description (2 min)
**Impact:** Low — current is only 50 chars
**Action:** Expand to: "Free EPPP study guides organized by exam domain, practice questions with explanations, and full-length sample exams. Built by psychologists who passed."
