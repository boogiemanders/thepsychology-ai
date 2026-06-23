# Google Ads Setup Guide (June 2026 UI)

Click-by-click walkthrough for the current Google Ads UI, verified against Google's own support docs (links in Sources below). Companion to [`google-ads-eppp-launch-checklist-2026-06-22.md`](./google-ads-eppp-launch-checklist-2026-06-22.md), which covers campaign strategy, keywords, and negatives. Use this doc for "where do I click" questions.

## What changed vs the old steps
- **GA4 linking moved.** It is no longer under "Linked accounts." It now lives under the **Tools** icon, then **Data manager** (click **+ Connect product**). The old menu name is gone.
- **Goals are now two settings, not one "Primary/Secondary" switch.** There is a goal-level switch called **"Use as an account goal"** (this is the new name for what people called "Primary") AND a separate action-level **Primary/Secondary** toggle. Both must be on for a conversion to drive bidding. Imported GA4 conversions arrive as **Secondary** by default, so you must change them.
- **Conversion import is split.** You start it under **Goals > Conversions > Summary** in Google Ads, but the GA4 link itself is set up in **Data manager**. The old "single import button" walkthrough is outdated.

---

## Stage 1: Link GA4 and import conversions

**A. Link GA4 to Google Ads**
1. Click the **Tools** icon (wrench, top of the page).
2. Click **Data manager**.
3. Click **+ Connect product**.
4. Under **Data source**, click **Google Analytics (GA4) & Firebase**.
5. Under **Link setup**, pick your GA4 property.
6. Click **Next**.
7. Leave the toggles on to import web metrics and audiences.
8. Click **Link**.

(Label may vary: if you see **Manage & link** instead of **+ Connect product**, the link already exists. Open it to confirm.)

**B. Import GA4 events as conversions**
9. Click the **Goals** icon.
10. Click **Conversions**, then **Summary**.
11. Click **+ Create conversion action** (some accounts show **+ New conversion action**).
12. Choose **Import**, then **Google Analytics 4 properties**.
13. Click **Continue**.
14. Check the boxes for **purchase**, **sign_up**, and **begin_checkout**.
15. Click **Import and continue**, then **Done**.

Note: imported GA4 events land as **Secondary**. Data can take up to 24 hours to show.

**C. Set purchase = account default (primary), the others = secondary**

There are two levels. Do both for purchase.

*Action level (Primary/Secondary):*
16. In **Goals > Conversions > Summary**, click the **purchase** conversion action.
17. Find the **Primary action / Secondary action** setting.
18. Set **purchase** to **Primary**.
19. Repeat for **sign_up** and **begin_checkout** and set each to **Secondary**.

*Goal level (account default):*
20. Go back to **Goals > Conversions > Summary**.
21. Find the goal that holds **purchase** (likely the **Purchase** goal).
22. Open it and check **"Use as an account goal"** (this is the account-default switch, the new name for "Primary goal").
23. For the goals holding sign_up and begin_checkout, leave **"Use as an account goal"** off so they stay observation-only.

Why both: the goal switch ("Use as an account goal") turns the whole goal on for bidding. The action switch (Primary) decides which specific events inside it actually count. Purchase needs both on. The others stay secondary so you do not double-count or bid on top-of-funnel events.

---

## Stage 2: Auto-tagging and Final URL suffix

**A. Turn on auto-tagging**
1. Click the **Admin** icon (gear).
2. Click **Account settings**.
3. Click the **Auto-tagging** section.
4. Check the box **"Tag the URL that people click through from my ad."**
5. Click **Save**.

**B. Add a Final URL suffix (account level)**
6. Still in **Admin > Account settings**.
7. Click **Tracking** (also labeled **Tracking template** in some accounts).
8. In the **Final URL suffix** field, paste your tracking parameters.
9. Click **Save**.

(You can also add a Final URL suffix at the campaign or ad-group level later. Account level is the simplest for one site.)

---

## Stage 3: Create a Search campaign (Sales objective) + bidding

1. Click the **Campaigns** icon.
2. Click the blue **+** button, then **New campaign**.
3. Pick the objective **Sales** (use **Leads** if you collect form fills instead of purchases).
4. Under **Select a campaign type**, click **Search**.
5. Confirm your conversion goals on screen, then click **Continue**.
6. Name the campaign.

**Bidding:**
7. On the **Bidding** step, under **"What do you want to focus on?"**, choose **Conversions**.
8. To let Google bid automatically, leave it on **Maximize conversions**. Do NOT check **"Set a target cost per action (target CPA)"** if you want "Maximize conversions without a target CPA."
9. To bid by hand instead, click **"Select a bid strategy directly"**, then choose **Manual CPC**.

Recommendation for a first-timer: start with **Maximize conversions, no target CPA**. You need conversion history before a target CPA works. Manual CPC gives control but needs daily babysitting.

10. Set your **daily budget**.

---

## Stage 4: Location targeting (US + Canada, Presence, exclude Quebec)

In the campaign settings, open the **Locations** section.

**Add targets:**
1. Click **"Enter another location"** (the search box).
2. Type **United States**, then click **Add**.
3. Type **Canada**, then click **Add**.

**Set the location option to Presence:**
4. Click **Location options** (you may need to click **Advanced search** or expand the small **Options** link to see it).
5. Under **Target**, choose **"Presence: People in or regularly in your targeted locations."**
6. (The default is "Presence or interest." You are overriding it.)

**Exclude Quebec:**
7. In the same Locations search box, type **Quebec**.
8. When it appears, click **Exclude** (not Add).
9. Quebec now shows under the **Excluded locations** heading.
10. Confirm the exclude option reads **"Location exclusion (Presence)"** under Location options.

(If you do not see an **Exclude** button next to the typed location, click **Advanced search**, search **Quebec**, then click **Exclude** there.)

---

## Stage 5: Ad groups and keywords

1. On the **Ad groups** step, keep the type as **Standard**.
2. Name the ad group.
3. In the keyword box, add keywords with match types:
   - Broad match: type the words plain, like `eppp prep course`
   - Phrase match: wrap in quotes, like `"eppp practice exam"`
   - Exact match: wrap in brackets, like `[eppp practice test]`
4. Click **+ New ad group** to add more groups. Keep each group tight (one theme each).

---

## Stage 6: Campaign-level negative keywords

**Add negatives to this campaign:**
1. Click the **Campaigns** icon, then the **Audiences, keywords, and content** dropdown.
2. Click **Search keywords**.
3. Open the **Negative search keywords** tab.
4. Click the **+** button.
5. Choose **Campaign** as the level, then pick your campaign.
6. Type negatives. Match-type symbols work here too: plain = broad, `"quotes"` = phrase, `[brackets]` = exact.
7. Click **Save**.

**Optional: reusable negative keyword list**
8. Click the **Tools** icon.
9. Open the **Shared library** dropdown.
10. Click **Exclusion lists**, then the **Negative keyword lists** tab.
11. Click **+**, name the list, add words, click **Save**.
12. To apply it, select the list, click **Apply to campaigns**, check your campaign, click **Done**.

Use a list when the same junk terms hit many campaigns. For one campaign, the inline method above is enough.

---

## Stage 7: Responsive Search Ad

1. On the **Ads** step (or Ad group > **+ New ad** > **Responsive search ad**).
2. Enter the **Final URL** (the page people land on).
3. Add **headlines**: up to **15**, each max **30 characters**. Write at least 8 to 10 for a good Ad Strength.
4. Add **descriptions**: up to **4**, each max **90 characters**.
5. (Optional) Fill the two **Path** fields, max **15 characters** each.
6. Watch the **Ad strength** meter. Aim for Good or Excellent.
7. Click **Save** / **Done**.

---

## Stage 8: Publish and read the per-country report

**Publish:**
1. Review the summary screen and clear any alerts.
2. Click **Publish campaign**.

**Read the Locations report later:**
3. Click the **Campaigns** icon.
4. Click **Insights & reports**.
5. Click **When and where your ads showed**.
6. Open the **Matched locations** tab to see where ads actually ran, or **Targeted locations** to see by what you targeted.
7. Drill from **Country** (US vs Canada) down to region or city.
8. Set the date range top-right; click the download icon to export.

---

## Sources
- Link GA4 (Data manager): https://support.google.com/google-ads/answer/7519537
- Create conversions from GA4 events: https://support.google.com/google-ads/answer/13735417 and https://support.google.com/google-ads/answer/2375435
- Account-default goals: https://support.google.com/google-ads/answer/4677036
- Primary vs secondary actions: https://support.google.com/google-ads/answer/11461796
- Auto-tagging: https://support.google.com/google-ads/answer/3095550
- Final URL suffix: https://support.google.com/google-ads/answer/9054021
- Create a Search campaign: https://support.google.com/google-ads/answer/9510373
- Maximize conversions: https://support.google.com/google-ads/answer/7381968
- Manual CPC: https://support.google.com/google-ads/answer/2464960
- Target geographic locations: https://support.google.com/google-ads/answer/1722043
- Exclude geographic locations: https://support.google.com/google-ads/answer/1722040
- Advanced location options (Presence): https://support.google.com/google-ads/answer/1722038
- Add campaign negative keywords: https://support.google.com/google-ads/answer/7102995
- Negative keyword lists: https://support.google.com/google-ads/answer/7449003
- Responsive search ads: https://support.google.com/google-ads/answer/7684791
- Matched locations report: https://support.google.com/google-ads/answer/7492954
