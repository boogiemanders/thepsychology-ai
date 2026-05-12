# Inzi Chatbot — Documentation Bundle

**From:** Dr. Anders Chan, Postdoctoral Fellow at Inzinna Psychological Services
**For:** Dr. Inzinna + Tidal Health Group
**Date:** 2026-05-11

This folder contains everything you need to evaluate, install, and explain Inzi — our AI chat assistant — on the new Inzinna site.

---

## Start here (1 page)

📄 **[ONE-PAGER.md](./ONE-PAGER.md)** — What Inzi is, who it's for, what it does, what it costs. Forward this to anyone who needs the 60-second pitch (board, staff, partners).

## For the person installing it on the site

📄 **[INSTALL-GUIDE.md](./INSTALL-GUIDE.md)** — Exact snippet to paste, where it goes, what to test. 2-minute install once we agree on delivery method (widget script vs. iframe).

## For legal / compliance review

📄 **[PRIVACY-AND-DATA-FLOW.md](./PRIVACY-AND-DATA-FLOW.md)** — What data is captured, where it goes, every sub-processor (Vercel/Supabase/OpenAI/Resend), retention, HIPAA posture, recommended visitor disclosure language.

## Reference material (for context, not action)

📄 **[Inzinna-Brand-Strategy.md](./Inzinna-Brand-Strategy.md)** — Inzi's voice and tone is tuned to this. Useful if marketing wants to align messaging around the chatbot.

📄 **[Inzinna-Visitor-FAQ.md](./Inzinna-Visitor-FAQ.md)** — Sample of the kinds of questions Inzi is trained to answer. Useful for QA and for marketing to anticipate visitor needs.

---

## What to expect from me

**Before install:**
- Live demo on a call (10 minutes — I'll screen-share `https://thepsychology.ai/lab/inzinna/chatbot`)
- A staging snippet you can drop into a non-public WP environment to validate
- Answers to anything in the privacy doc that legal flags

**At install:**
- I can join a screen-share with whoever pastes the snippet (5 minutes max)
- Or I can send the snippet and you paste it — no login needed

**After install:**
- I monitor and update Inzi from our side. You would not need to touch it again.
- Conversion events flow into your existing GA4 property automatically (once we have your GA4 Measurement ID)
- If you want changes — new FAQs, different routing, branding tweaks — email me; turnaround is 24-48 hours

---

## Timeline

Install can't happen until Tidal Health Group finishes building the site and is ready to share access. No rush from our side — Inzi is ready when you are.

**Staging site:** https://inzinna.kinsta.cloud/ — once the build is far enough along, we'll test the snippet here first before touching production.

## Open items to resolve before install

1. **GA4 Measurement ID.** What's the `G-XXXXXXXXXX` for Dr. Inzinna's site? Inzi can fire conversion events to it.
2. **Header/footer snippet setup.** Which plugin or theme field are you using to inject site-wide scripts?
3. **Pages.** Should Inzi appear on every page or only specific ones?
4. **Legal review.** Does Dr. Inzinna's lawyer need to sign off on `PRIVACY-AND-DATA-FLOW.md` before launch? If so, what's the turnaround?
5. **Delivery method.** Per the install guide, do we go iframe (today) or wait for the widget bundle (~1 week)?
6. **Access timing.** When the staging site is ready for the chatbot, who do I coordinate with for the snippet install?

---

## Contact

**Dr. Anders Chan**
dranders@drinzinna.com

For technical issues during install, email above and I'll respond same-day.
