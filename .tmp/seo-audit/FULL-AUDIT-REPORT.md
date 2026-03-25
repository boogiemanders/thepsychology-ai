# SEO Audit Report — thepsychology.ai

**Date:** March 11, 2026
**Business Type:** EdTech / Online Education (EPPP Exam Prep)
**Pages in Sitemap:** 149
**Overall SEO Health Score: 68/100 (Grade: C)**

---

## Executive Summary

thepsychology.ai has a strong foundation — Lighthouse SEO score of 100, solid schema markup, good meta tags on the homepage, and excellent E-E-A-T signals (named founder with Psy.D., university logos, testimonials). However, **critical issues with broken sitemap URLs, disabled image optimization, a 19MB image, thin content on key pages, and missing structured data** are holding the site back from its ranking potential.

### Top 5 Critical Issues
1. **133+ sitemap URLs return 404** — All `/resources/topics/` pages (topic hubs + subtopics) are broken
2. **Image optimization disabled** — `images: { unoptimized: true }` in next.config.mjs
3. **19MB image file** — `yael-dror.png` in public/ will destroy Core Web Vitals
4. **Thin content on key SEO pages** — `/eppp-practice-questions` (~100 words), `/eppp-passing-score` (~150 words), `/resources` (~200 words)
5. **No `lang` attribute on HTML** — Detected as empty on localhost (production shows `en` but verify consistency)

### Top 5 Quick Wins
1. Remove or compress `yael-dror.png` (19MB → should be <200KB)
2. Enable Next.js image optimization (`unoptimized: false`)
3. Remove 404 URLs from sitemap (or fix the routes)
4. Add `BlogPosting` schema to blog articles
5. Fix image aspect ratio + color contrast issues (Lighthouse failures)

---

## 1. Technical SEO (Score: 18/25)

### Crawlability ✅ Mostly Good
- **robots.txt:** Well-structured, blocks app routes appropriately (`/dashboard/`, `/admin/`, `/api/`, etc.)
- **Sitemap:** Declared in robots.txt, 149 URLs, lastmod 2026-03-04
- **HTTPS:** Enforced, HTTP redirects to HTTPS ✅
- **Redirect:** `thepsychology.ai` → `www.thepsychology.ai` (single hop) ✅

### Indexability ⚠️ Major Issues
| Check | Status | Detail |
|-------|--------|--------|
| Canonical tags | ✅ Pass | Properly set on all tested pages |
| www redirect | ✅ Pass | Non-www → www, single redirect |
| Sitemap health | ❌ CRITICAL | **~133 of 149 URLs return 404** (all `/resources/topics/` pages) |
| 404 handling | ⚠️ Warning | Broken pages return proper 404 status (good), but shouldn't be in sitemap |

**Broken sitemap URLs include:**
- All 8 topic hub pages (`/resources/topics/1-biological-bases`, etc.)
- All ~125 subtopic pages (`/resources/topics/1-biological-bases/brain-regions-functions-cerebral-cortex`, etc.)
- Only 16 of 149 sitemap URLs confirmed working (homepage, blog, resources, practice-questions, eppp-* pages, contact, portfolio)

### Security & Headers
- HTTPS enforced ✅
- Mixed content: None detected ✅

### URL Structure ✅ Good
- Clean, descriptive slugs (`/blog/eppp-prep-programs-compared-2026`)
- Logical hierarchy (`/resources/topics/[domain]/[subtopic]`)
- No query parameter pollution

---

## 2. Content Quality (Score: 16/25)

### E-E-A-T Assessment ✅ Strong Signals
| Signal | Status | Detail |
|--------|--------|--------|
| Experience | ✅ Strong | Founder is a licensed psychologist (Psy.D.) who passed the EPPP |
| Expertise | ✅ Strong | Content by Dr. Anders Chan, Psy.D. with author bio |
| Authoritativeness | ✅ Good | University logos (UCLA, NYU, Northwestern), testimonials from named professionals |
| Trustworthiness | ✅ Good | Contact info, professional email, social profiles, transparent pricing |

### Content Depth ⚠️ Mixed

| Page | Words | Verdict |
|------|-------|---------|
| Homepage | ~2,000+ | ✅ Good — rich content, FAQ, testimonials |
| Blog: EPPP Prep Compared | ~4,200 | ✅ Excellent — comprehensive comparison |
| Blog hub | ~200 | ⚠️ Thin — just a listing page |
| /eppp-sections | ~300 | ⚠️ Thin — directory only, minimal explanation |
| /eppp-practice-questions | ~100 | ❌ Very thin for a competitive keyword |
| /eppp-passing-score | ~150 | ❌ Very thin — missing jurisdiction table, scoring details |
| /resources | ~200 | ⚠️ Thin — directory only |
| /resources/practice-questions | ✅ OK | Has actual sample questions with explanations |
| /resources/topics/* | ❌ 404 | All topic/subtopic pages broken |

### Heading Structure ✅ Good (Homepage)
- Single H1: "Prep That Actually Matches the EPPP" ✅
- Logical H2/H3 hierarchy ✅
- 14 FAQ entries as H3s ✅

### Heading Issues on Inner Pages
- Blog hub H1 is just "Blog" — should include keyword
- Some H2s have numbering prefixes ("1 Biological Bases of Behavior") — messy for SEO

---

## 3. On-Page SEO (Score: 17/20)

### Meta Tags ✅ Strong

| Page | Title | Description | Canonical |
|------|-------|-------------|-----------|
| Homepage | ✅ 63 chars, keyword-rich | ✅ 155 chars, compelling | ✅ |
| Blog | ✅ Good | ✅ Good | ✅ |
| Blog articles | ✅ Good | ✅ Good | ✅ |
| /eppp-sections | ✅ OK | ⚠️ Generic | ✅ |
| /eppp-practice-questions | ✅ OK | ⚠️ Short (60 chars) | ✅ |
| /eppp-passing-score | ✅ OK | ✅ Good | ✅ |
| /resources | ✅ OK | ⚠️ Very short (50 chars) | ✅ |

### Open Graph & Twitter Cards ✅
- All OG tags present (title, description, image, url, site_name, locale, type)
- Twitter card: `summary_large_image` with all required fields
- OG image: 1200x630 ✅

### Internal Linking ⚠️ Needs Work
- Homepage links to key pages ✅
- Blog articles link back to homepage with UTM params ✅
- **Missing:** Cross-linking between blog posts
- **Missing:** Contextual links from thin pages to related content
- **Missing:** Breadcrumbs on inner pages

### Keywords Meta Tag
- Present with 15 EPPP-related terms — not harmful but not a ranking factor

---

## 4. Schema & Structured Data (Score: 7/10)

### Current Implementation
| Schema Type | Page | Status |
|-------------|------|--------|
| Organization | All pages | ✅ Complete (name, url, logo, email, sameAs) |
| WebSite | All pages | ✅ Complete (name, url, description, publisher) |
| FAQPage | Homepage | ✅ 14 Q&As, well-structured |
| BlogPosting/Article | Blog articles | ❌ Missing — critical gap |

### Missing Schema Opportunities
1. **BlogPosting** — Blog articles have author/date but no Article schema
2. **Course** — The platform is essentially a course; Course schema would help
3. **Review/AggregateRating** — Testimonials could be marked up
4. **BreadcrumbList** — No breadcrumb schema on any page
5. **SoftwareApplication** — For the app/platform itself
6. **SearchAction** — Could enable sitelinks search box

---

## 5. Performance & Images (Score: 5/10)

### Lighthouse Scores
| Metric | Desktop | Mobile |
|--------|---------|--------|
| SEO | 100 | 100 |
| Accessibility | 96 | 91 |
| Best Practices | 85 | 85 |

### Lighthouse Failures (3 items)
1. **Image aspect ratio** — Some images displayed with incorrect aspect ratios
2. **Color contrast** — Background/foreground colors insufficient contrast ratio
3. **Paste-preventing inputs** — Input fields block paste (accessibility issue)

### Image Optimization ❌ Critical
| Issue | Severity | Detail |
|-------|----------|--------|
| Optimization disabled | ❌ Critical | `images: { unoptimized: true }` in next.config.mjs |
| 19MB image | ❌ Critical | `public/yael-dror.png` — 19MB PNG |
| No WebP/AVIF | ❌ High | 36 PNGs, 10 SVGs, 1 JPG, 1 GIF — zero modern formats |
| Large images | ⚠️ Medium | 5 images over 200KB (agent-template-og, brain diagrams) |
| Next.js Image usage | ✅ Good | 10 imports of `next/image` across components |
| Raw img tags | ✅ OK | Only 3 instances, all justified (icons, SVG fallback) |
| Alt text | ✅ Good | All 58 images have alt text on homepage |

### Image Size Breakdown
- `yael-dror.png`: **19MB** (!!!)
- `agent-template-og.png`: 444KB
- `basal-ganglia-base.png`: 355KB
- `agent-cta-background.png`: 325KB
- `brain-divisions-base.png`: 304KB
- `organizational-theories-diagram.png`: 233KB
- 29 other images: 5KB–169KB

---

## 6. AI Search Readiness (Score: 5/5)

### Citability Signals ✅ Strong
- **Named expert author** with credentials (Dr. Anders Chan, Psy.D.)
- **Specific, factual answers** in FAQ (EPPP format, scoring, sections)
- **Structured FAQ schema** — 14 Q&As ready for AI extraction
- **Comparison content** — EPPP prep programs guide is ideal for AI citation
- **Clear expertise signals** — university affiliations, professional testimonials

### Improvements for AI Visibility
- Add more definitive, quotable statements (e.g., "The EPPP has 225 questions...")
- Ensure topic pages exist (currently 404) — these would be AI citation goldmines
- Add `speakable` schema for voice search readiness

---

## Scoring Summary

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 25% | 72/100 | 18.0 |
| Content Quality | 25% | 64/100 | 16.0 |
| On-Page SEO | 20% | 85/100 | 17.0 |
| Schema/Structured Data | 10% | 70/100 | 7.0 |
| Performance & Images | 10% | 45/100 | 4.5 |
| AI Search Readiness | 5% | 80/100 | 4.0 |
| Images (standalone) | 5% | 30/100 | 1.5 |
| **Total** | **100%** | | **68.0** |

**Grade: C (60-74)**

---

## What's Working Well
1. Lighthouse SEO score of 100 on both desktop and mobile
2. Excellent E-E-A-T signals — real psychologist founder, university logos, named testimonials
3. Strong homepage with rich content, FAQ schema, and clear value prop
4. Good blog content (4,200-word comparison article)
5. Clean URL structure and proper canonical/redirect setup
6. All images have alt text
7. Well-structured robots.txt blocking app routes
