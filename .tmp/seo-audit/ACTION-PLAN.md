# SEO Action Plan — thepsychology.ai

Prioritized by severity. Estimated impact on SEO Health Score in parentheses.

---

## Critical (Fix Immediately)

### 1. Fix or Remove Broken Sitemap URLs (+10 points)
**133 of 149 sitemap URLs return 404.** This tells Google your site has massive crawl errors.

**Options:**
- **A) Fix the routes** — If `/resources/topics/` pages are supposed to exist, deploy them
- **B) Remove from sitemap** — If they're planned but not built yet, remove them from `sitemap.xml` until they're live
- **C) Build them** — These topic/subtopic pages would be high-value SEO assets if they existed

**Files:** `src/app/sitemap.ts` or wherever sitemap is generated

### 2. Compress/Remove yael-dror.png (+3 points)
**19MB PNG** in `public/`. This alone can tank Core Web Vitals.

**Action:** Compress to <200KB using WebP format, or remove if unused.
```bash
# Check if it's referenced anywhere
grep -r "yael-dror" src/
```

### 3. Enable Next.js Image Optimization (+5 points)
**`images: { unoptimized: true }`** disables all automatic optimization.

**File:** `next.config.mjs`
**Action:** Set `unoptimized: false` (or remove the setting entirely). Configure `remotePatterns` for any external image domains.

---

## High (Fix Within 7 Days)

### 4. Expand Thin Content Pages (+4 points)
These pages target competitive keywords but have almost no content:

| Page | Current | Target | What to Add |
|------|---------|--------|-------------|
| `/eppp-practice-questions` | ~100 words | 800+ words | Explain each domain, what to expect, link to practice sets |
| `/eppp-passing-score` | ~150 words | 1,000+ words | Jurisdiction table, scoring methodology, study strategies |
| `/eppp-sections` | ~300 words | 800+ words | Brief description of each domain, difficulty, weight |
| `/resources` | ~200 words | 500+ words | Intro paragraph, how to use resources, study path |

### 5. Add BlogPosting Schema to Articles (+2 points)
Blog articles have author/date info but no Article/BlogPosting JSON-LD.

**Add to each blog article:**
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "...",
  "author": { "@type": "Person", "name": "Dr. Anders Chan, Psy.D." },
  "datePublished": "2026-02-16",
  "publisher": { "@type": "Organization", "name": "thePsychology.ai" },
  "image": "...",
  "description": "..."
}
```

### 6. Convert Images to WebP/AVIF (+2 points)
All 36 PNGs and 1 JPG should be modern formats.
- Use `sharp` or `squoosh` to batch convert
- Especially the 5 images over 200KB (brain diagrams, OG images)

### 7. Fix Lighthouse Accessibility Failures (+2 points)
- **Color contrast:** Find and fix low-contrast text
- **Image aspect ratio:** Fix images displayed at wrong ratios (CSS `width: auto` or `height: auto`)
- **Paste-preventing inputs:** Remove `onPaste` handlers on input fields

---

## Medium (Fix Within 30 Days)

### 8. Improve Blog Hub H1
Change H1 from "Blog" → "EPPP Study Guides & Exam Prep Tips" or similar keyword-rich heading.

### 9. Add BreadcrumbList Schema
Add breadcrumb structured data to all inner pages for better SERP display.

### 10. Add Cross-Linking Between Blog Posts
Each blog article should link to 2-3 related articles. Currently they only link back to homepage.

### 11. Improve Meta Descriptions on Thin Pages
- `/resources`: Expand from 50 chars to 120-155 chars
- `/eppp-practice-questions`: Expand from 60 chars to 120-155 chars

### 12. Add Course Schema
The platform is essentially a course. Add Course structured data:
```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "EPPP Exam Prep",
  "provider": { "@type": "Organization", "name": "thePsychology.ai" },
  "description": "...",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
}
```

---

## Low (Backlog)

### 13. Add Speakable Schema for Voice Search
Mark key FAQ answers and definitions as speakable.

### 14. Clean Up Heading Numbering
Practice questions page has H2s like "1 Biological Bases of Behavior" — remove numbering or make it consistent.

### 15. Add SearchAction Schema
Enable potential sitelinks search box in SERPs.

### 16. Consider Adding `hreflang` Tags
If there's any plan for internationalization, set up hreflang early.

---

## Impact Projection

If all Critical + High items are fixed:
- **Current Score:** 68/100 (C)
- **Projected Score:** 86/100 (B)
- **Key unlocks:** Proper indexing of 133 content pages, faster load times, richer SERP features
