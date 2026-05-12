# Inzi Chatbot — Install Guide

**For:** Greg's marketing team / web developer
**Last updated:** 2026-05-11

## TL;DR

To get Inzi on Greg's WordPress site, the marketing team installs **one snippet** in the site's header/footer area. Same workflow as Google Analytics or Calendly.

The exact snippet depends on which delivery method we pick (see "Delivery method — TBD" below). Once decided, install is 2 minutes.

---

## Delivery method — TBD before install

We have two options. Pick one before installing.

### Option A — Embedded widget (recommended for production)

A single `<script>` tag that loads Inzi as a floating chat bubble in the corner of every page.

```html
<!-- Add to <head> or before </body> -->
<script
  src="https://thepsychology.ai/inzi/widget.js"
  data-tenant="inzinna"
  async
></script>
```

- Pros: native feel, opens in corner, no iframe weirdness, mobile-friendly
- Cons: we (Inzinna) need to ship the widget bundle first. Not built yet.
- Status: **TODO on our side.** ETA ~1 week after we confirm we're going this route.

### Option B — Iframe embed (works today, lower fidelity)

A single `<iframe>` you can drop anywhere on the site.

```html
<iframe
  src="https://thepsychology.ai/lab/inzinna/chatbot"
  style="position:fixed;bottom:24px;right:24px;width:380px;height:600px;border:0;z-index:9999"
  title="Inzi — Inzinna chat assistant"
  allow="microphone"
></iframe>
```

- Pros: works today, no widget bundle needed
- Cons: less native, mic permission prompts are clunky on some browsers, mobile responsive needs CSS tuning

**Recommendation:** Use Option B on a staging URL to validate the experience. Move to Option A before public launch.

---

## Where to paste it

| WordPress setup | Where to paste |
|---|---|
| Has WPCode / Insert Headers and Footers plugin | Plugin → Header section → save |
| Theme has a custom-code field | Appearance → Theme Customizer → Custom Code (or similar) |
| Neither | Install WPCode plugin first (free, takes 30 seconds) |

**Don't paste into:** the post editor, page content, theme files, or `functions.php`. Header/footer plugin only.

---

## Which pages to enable

Default: **every page.** Inzi answers FAQ, scheduling, billing, and clinician contact — all are useful on any page.

If the marketing team wants to limit it (e.g., hide on legal pages), most header/footer plugins support per-page rules. We can configure exclusions later.

---

## What to test after install

Open the staging site and confirm:

1. Chat bubble appears in bottom-right corner (or iframe loads, for Option B)
2. Clicking it opens the chat panel
3. Send a test question like "what insurance do you take?" — bot should answer with a citation
4. Click "Book a session" — booking form should appear
5. Open browser DevTools Console — no errors mentioning `inzi`, `chatbot`, or `gtag`

If any of those fail, send us the URL and a screenshot of the Console tab.

---

## What it won't do

- Won't slow your site — script loads `async`, total page weight added is <50KB
- Won't conflict with your theme, page builder, or other plugins
- Won't store anything in your WordPress database (data lives on our servers — see Privacy & Data Flow doc)
- Won't change your site's design outside the chat bubble

---

## To remove

Delete the snippet from the header/footer plugin. That's it. No leftover files, no database rows.

---

## Contact

For install issues, ping: dranders@drinzinna.com
