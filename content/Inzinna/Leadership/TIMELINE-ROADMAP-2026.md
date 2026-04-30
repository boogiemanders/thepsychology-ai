# Anders — 2026 Roadmap Entries

> Drafted for the ITG Roadmap 2026 Google doc. Plain language, same 7-field format Carlos asked for.

---

## Project 1

**Project / Task Name:** Zocdoc → SimplePractice Plugin

**Description:** Pulls new patient info from Zocdoc and fills it into SimplePractice by itself. Also writes the draft email that checks a patient's insurance coverage. Saves the clinician about 15 minutes per new intake.

**Timeline:** Live on clinician computers within 2–3 weeks of getting Google Workspace admin access.

**Current Stage:** Working plugin. Only on my computer right now. Waiting on Greg for Google Workspace admin access so I can push it to all clinicians without each person having to install it by hand.

**Action Steps:**
1. Get Google Workspace admin access from Greg.
2. Submit the plugin to the Chrome Web Store as Private (1–3 day review).
3. Push-install it to the clinician group through Workspace admin.
4. Start with P02 as the first pilot (she asked for this tool in the April survey).

**Support Needed:** Google Workspace admin access. Signed HIPAA BAA with Google. Zocdoc admin access so I can test the calendar integration feature Greg mentioned.

**Priority Level:** High

---

## Project 2

**Project / Task Name:** Leadership Roadmap Timeline (this doc)

**Description:** One shared Google doc where every leader writes what they're working on and when it'll be done. Later, I turn it into a visual calendar with filters so we can see the full year at a glance.

**Timeline:** Google doc version filled in within 1 week. Visual calendar version ready by end of May.

**Current Stage:** Carlos is creating the main Google Drive folder. Once everyone fills in their section, I start the visual version.

**Action Steps:**
1. Carlos creates the folder + main doc.
2. Each leader fills in their section.
3. I build a visual, filterable calendar once the doc is populated.

**Support Needed:** Every leader inputs their projects and timelines.

**Priority Level:** High

---

## Project 3

**Project / Task Name:** Supervision Prep Tool

**Description:** Pulls notes and treatment plans from SimplePractice. Shows a panel where the clinician can review and tune diagnostic criteria before supervision. Helps clinicians (especially externs) walk into supervision prepared instead of scrambling.

**Timeline:** Polished version ready before externs arrive (June/July). Current version is rough but works in a light way.

**Current Stage:** Working but janky. Needs UI cleanup and more testing.

**Action Steps:**
1. Clean up the UI.
2. Get feedback from a couple of clinicians.
3. Fix bugs and rough spots.
4. Roll out to externs before their first supervision.

**Support Needed:** 1–2 clinicians to test it.

**Priority Level:** Medium

---

## Project 4

**Project / Task Name:** JustWorks Payroll Autofill

**Description:** Reads the SimplePractice payroll CSV. Applies each clinician's pay rules (no-show rates, supervision splits, private pay, etc.). Fills JustWorks time cards so Carlos doesn't have to type in hours by hand.

**Timeline:** Done by end of May.

**Current Stage:** Working. 5 out of 9 clinicians already match their real pay exactly. The other 4 have small hand-added extras (admin hours, Fusion events) waiting on Carlos to clarify.

**Action Steps:**
1. Get Carlos's answers on the open pay rules (no-show rates, Fusion events, admin hours).
2. Figure out how to tell which insurance paid for each CPT code (the SP CSV doesn't show it).
3. Build the JustWorks upload template so we can skip manual entry.
4. Run one full pay period end to end as a test.

**Support Needed:** Carlos's answers to the open questions. A SimplePractice report that shows insurance payer per session (or confirmation no such report exists).

**Priority Level:** High

---

## Project 5

**Project / Task Name:** ADHD Assessment Scorers (BAARS + ADHD-RS)

**Description:** Live on the lab site. Scores the BAARS (all 4 forms — adult/child, self/other report) and ADHD-RS by themselves. Writes a clean clinical summary with percentiles in plain language. Lets Bret skip the scoring grunt work and focus on the diagnosis itself.

**Timeline:** Finished version by end of April.

**Current Stage:** Live and in testing with Bret. Getting feedback on report phrasing (he wants more bullet points).

**Action Steps:**
1. Apply Bret's feedback (bullet-point output).
2. Lock in the scoring and interpretation logic.
3. Share the link with the rest of the clinical team.

**Support Needed:** Bret's feedback (already happening).

**Priority Level:** High

---

## Project 6

**Project / Task Name:** Inzinna Website Chatbot

**Description:** A typing chatbot on the Inzinna website. Handles common questions like "what insurance do you take," "how do I fill out my paperwork," or "who's my clinician." Costs about a penny per full conversation. Voice agent can be added later once the typing version works well.

**Timeline:** Start after the website launches June 1. First version live by end of June.

**Current Stage:** Idea stage. Waiting on (1) the website to launch and (2) the Zocdoc and payroll plugins to finish first.

**Action Steps:**
1. Wait for the June 1 website launch.
2. Build a light RAG model that pulls from the clinician manual and Filomena's client text script.
3. Add guardrails so it never gives therapy advice or anything therapist-y.
4. Test with real questions from real inquiries.

**Support Needed:** Website access from Carlos so I can embed it. A finished clinician manual to feed the chatbot.

**Priority Level:** Medium

---

## Project 7

**Project / Task Name:** Call Management System

**Description:** Right now most calls hit Greg or Carlos during sessions, causing interruptions. A HIPAA-safe call routing system (or a VA-style text service like the one Lorin described) sends each call to the right person or bumps it to text. Cuts interruptions. Keeps the clinic running when Greg and Carlos are with clients.

**Timeline:** Platform picked by end of May. System live by end of June.

**Current Stage:** Needs a decision. Filomena is reviewing Ring Central, Grasshopper, and Open Phone for HIPAA compliance.

**Action Steps:**
1. Filomena finishes reviewing the three platforms.
2. Team picks one.
3. Set up call routing and a text-based option.
4. Decide if we also want a VA service (a real person who texts patients back, like the one Lorin's psychiatrist's office uses).

**Support Needed:** Team decision on platform. Budget sign-off. My role here is support, not lead — I can help with the AI/chatbot piece if we go that route.

**Priority Level:** High
