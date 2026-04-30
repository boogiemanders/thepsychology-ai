# Leadership Meeting — April 15, 2026 (Full Transcript)

> Real transcript (not the Google-generated summary). Saved separately at [MEETING-2026-04-15.md](MEETING-2026-04-15.md).

**Attendees:** Gregory Inzinna, Juan Carlos Espinal, Anders Chan, Filomena DiFranco, Lorin Singh

**Duration:** ~58 minutes

---

## 00:00:00 — Opening

**Gregory Inzinna:** Glad to give you. Did you say anything important, Carlos, before we —

**Juan Carlos Espinal:** No, no,

**Anders Chan:** Nice.

**Juan Carlos Espinal:** just that by June or July before the interns come in I'll have like a forward-facing document about all the leadership positions that we currently have.

**Gregory Inzinna:** You got that, Gemini?

**Anders Chan:** Oh, right now —

**Gregory Inzinna:** Oh yeah. Well, I just wanted to make sure that we got it on record.

**Anders Chan:** All right, cool. I mean, if anyone else wants to — because I feel I'm just pre-announcing.

**Gregory Inzinna:** That's all we do.

**Anders Chan:** All right. Um, so there's four things.

## 00:00:55 — Anders Presents Plugins

**Anders Chan:** It's the plugins. Since the surveys are in, I feel I could talk about the plugins I've been building. I think Filomena would really like this one. Um, because the first one is just automating the Zocdoc to SimplePractice transfer and then the email to verification of benefits. I could demo this in a bit — what it looks like. It basically scrapes the whole Zocdoc file and then it autofills in SimplePractice. You could just read it through and press send. There's another button and it'll fill out the draft, sends it to David and the SOSA team CCing Greg and Carlos. Yeah, I feel that's a big time saver.

The barrier for that — so I could just email this zip file to each clinician to drag into their own Chrome extension library, but that's a little tedious. There's an easier way to put it on the extension store and keep it unlisted so it stays within the practice. But I think we would need — I think I would need help to get access to a cloud service like Google Cloud.

## 00:02:23 — Cloud Access + Calendar Integration

**Anders Chan:** That way if we make updates to this plugin it goes across to all clinicians. We don't have to have everyone redownload the whole thing over and over again. I could talk about this with you guys afterwards, but that's just the next bottleneck. I think it could be fixed in one or two days.

**Gregory Inzinna:** One other — this might be a bit of a — the other — there's a feature on Zocdoc that we were — what was it called Carlos, the thing where it was live book where it would book directly into the SimplePractice thing?

**Juan Carlos Espinal:** Uh, it was the calendar integration.

**Gregory Inzinna:** Calendar integration, which — we pro — did you mention that to him, Carlos?

**Juan Carlos Espinal:** No, but it's because no one has calendar integration currently as it stands.

**Gregory Inzinna:** So one of the things that we don't have on or we're not using right now on SimplePractice that is available is — they have an availability feature where you basically set your working hours, and any time you set — blocks of 45 minutes or an hour — if that is available, it can be booked if somebody has access to that kind of link. So SimplePractice and Zocdoc could be integrated to do calendar integration. We had thought about doing that before.

## 00:03:50 — Why Calendar Integration Stalled

**Gregory Inzinna:** The reason why we didn't is because we didn't really have the organization yet to have everybody have their working hours together like that. And it felt cumbersome, especially when we were going to use that same feature through SimplePractice to book via the website — where you saw on the link there were all these "book now" things. I imagine that would lead to there. So I'm not sure if that would help or hinder your process, but it's something you should be aware of. Maybe we give you admin privileges on the Zocdoc account if that would be helpful.

**Anders Chan:** I am happy to learn about it. I remember calling Zocdoc and they mentioned "how come you're not using this?" I was like, I don't know.

**Juan Carlos Espinal:** Well, the calendar integration thing is weird because partially — it also has to be that you have to have availability consistent enough for part of it, right? And we just don't. We do have that availability when we need clients. But then once it's off it kind of takes it away. So it makes more sense for doctors who currently always have bookings and always have appointments, where for us we only need five slots at a time or a massive amount.

## 00:05:45 — Patient Choice Awards Problem

**Juan Carlos Espinal:** The same thing happened with why none of us could get the patient choice awards or badges. You have to have five reviews within a two-month span and then keep having reviews every month. If you don't get five reviews in that span, you lose the badge. So most times you guys aren't getting more people from bookings because you already have full caseloads. You'll lose the badge within the first time of getting it because no one is reviewing, and we don't solicit reviews. Technically we're not allowed to ask for reviews as psychologists. Zocdoc does a good job of sending out the review link, but unless the clinician is saying "fill out the review," they're not going to.

## 00:06:37 — Supervision Prep Tool

**Juan Carlos Espinal:** Some of the features aren't inherently good or keep therapists in mind. But yeah, we can give you access to see if maybe it could work or not.

**Anders Chan:** Okay, great. The next one is more in the works, but I think there's a lot of feedback in the survey for help preparing before supervision. What I have so far is still janky, I'll admit, but it works in a light way. It extracts all of the SimplePractice notes and treatment plan, and has a little panel on the right where you can sort of tinker with the diagnostic criteria — which you can use for the initial clinical evaluation note. Hopefully more prepped before supervision. That's still in the works. I'd say that's way later down the line.

## 00:07:50 — JustWorks Payroll

**Anders Chan:** The JustWorks with Carlos — it's working. The main thing is Bret's — it's knowing which insurance for that CPT code.

**Juan Carlos Espinal:** Yeah.

**Anders Chan:** It looks like you know it and I don't know how, but I think once that's figured out, it's all done. The last piece is the automation to fill in on JustWorks. They have this template you could upload into. So basically the data from SimplePractice could have a fork in the road going from an Excel sheet we can drag into Google Drive — so we can always backtrack and see what was done — and the other one makes it into a template that JustWorks can understand. Then we don't have to manually type in the hours anymore.

## 00:08:46 — Assessment Tools with Bret

**Anders Chan:** The theoretical one-minute. I think it's gonna come.

**Juan Carlos Espinal:** Nice.

**Anders Chan:** Last is updates about working with Bret the past week. He's almost — I've been doing a back and forth for the BAARS and ADHD-RS. They're two assessment tools for ADHD. He gave me all the tables and scoring and interpretation things. Same idea of just automating it. He tests it himself and gives me feedback — "this works" or "I want the language phrased in bullet points." That feels almost there too.

## 00:09:44 — Greg's Appreciation + Claude Account

**Gregory Inzinna:** That's it. No, it's really awesome, Anders. Thank you so much. You're helping us with systems we've been struggling with. It's going to be awesome to help Carlos with the basic operation stuff, but also — there's so much productivity. I always tell Bret, his expertise is really in diagnosing and understanding complex assessment for patients. Then all the other stuff — the administration, the test administration, the writing of the report, the basic kind of managing the writing up the results — there are ways to have the expert just intervene where the expert is best helpful. The externs will be able to help all of us with our stuff. I'm excited for that. Give us some feedback on the Claude account if you need more or whatever.

**Anders Chan:** Thank you. It's more than enough right now. I'm not hitting any rate limits. I feel like so far I've used 10% of the weekly limit in two days. It's great. I don't mind waiting a day every week. That's worst case scenario. I don't think that's even going to happen.

## 00:12:35 — Call Management Problem

**Gregory Inzinna:** Very cool. Another element — there are a few things of operations we want to iron out before the externs come, before we have the website up. The other one was the calls — how we get calls, how we route things. We're slowly building out who has what email accounts. Now we have a billing email that we're having someone monitor. Info — Ellie and Filomena are managing that. But a big limiting factor is that all the calls either get directed to myself or Carlos or really any of us. While we do want people to have direct access to their psychologist once they're assigned somebody, we don't want people directly reaching out like Psychology Today works. We just need a little more of a barrier rather than them reaching out to me, which is not helpful. I just end up redirecting a call to you guys anyway.

## 00:13:37 — Call System Options

**Gregory Inzinna:** Having some kind of company we pay a monthly fee to that answers the phone — there are a lot of HIPAA-compliant ones with a call center that redirects calls — or having an answering system, whether AI-powered or not, that says "choose one for this or describe your problem" and then reroutes you to the right place. Ultimately that's what we want. I don't know exactly how we want to do that, whether it's just to go to an answering machine, or better to put a message in email or text form that we process and get back to them at a reasonable time, or even with a feature to book. I don't know. Filomena, we just had briefly — had you looked into some of those things?

**Filomena DiFranco:** Yeah, I found a few systems. I don't know if you had some in mind. I had looked up a few. There was Ring Central, Grasshopper, and Open Phone. Those were like automated phone systems. I looked them up for HIPAA compliant. Those were the only ones that came up. I'm going to look into the reviews. I didn't know if you were looking for something that said "press one for new clients, press two for existing" — how were you thinking to form that? Did you want to separate them?

**Gregory Inzinna:** It's an interesting question, and I'll throw that to the group. We're always trying to strike the balance of being organized, very professional — if you call Mount Sinai, you're not going to directly get someone's cell phone — but we also want to be personable and efficient and warm. Lorin, ideas?

## 00:15:43 — Lorin's Psychiatrist Experience

**Lorin Singh:** Yeah. So I recently, like three months ago, made an appointment with a psychiatrist for ADHD. I got the user from Zocdoc. When I had to see my prescriber, my prescriber didn't show up. I tried to call the place and they have this call system just like you're describing. On top of it they have a text system. When I text asking about the provider, it's not automated but it's an actual person texting back. It's not my provider, and they're getting in touch with my provider to make sure they got on Zocdoc. They're following up with me and everything. This is someone not like they're hiring.

## 00:16:55 — Text-Based VA System

**Lorin Singh:** Also, if I was to call, I would be speaking to that person. They're telling me how to fill out SimplePractice and do certain things I'm missing or making sure I have all my intake stuff in. I don't know what they're using, but it pretty much is covering everything you're saying plus the navigation of getting assistance as a new client. Even if I had to send a text at a random time, they're the ones following up. I don't know if that sounds like something you guys are interested in, but I know other places are using something like that.

**Gregory Inzinna:** It's probably something like a VA — I don't even know what it stands for — but I've heard people say like a VA or someone who basically has access to your accounts, right? Like SimplePractice. We can add admins. More expensive probably than a just-call thing that redirects to us, but that's an option. I'm not sure if there are others that do that or something more. People want to be able to call and say "is my stuff in" and that person could also probably — I don't know if we could have the feature where they call and make sure their stuff is filled out beforehand.

## 00:17:53 — No-Show Fees + Cards on File

**Gregory Inzinna:** One of the other side things — Anders, this is for you too — I'm frustrated that we can never have, through Zocdoc, somebody we pay for booking and someone doesn't have to have a card on file. So there's no — we pay, and then if they cancel or don't show, we don't have a card on file, there's no no-show fee. A lot of practices sign a lot of paperwork to say if you don't cancel before 48 or 24 hours, you have to pay a fee. The challenge for us is that then that maybe disincentivizes somebody from booking. But then again, if they're not even willing to risk paying a $75 cancellation fee, they probably wouldn't be ready for therapy anyway. Just consider that. Back to your point, Lorin, there is some value in having a more comprehensive call system.

## 00:20:14 — Call Triage Value

**Juan Carlos Espinal:** Well yeah, the more comprehensive call system helps with some of the random stuff we get. Not even random — people calling to look for their provider, saying they're looking for a specific person. That would help navigate it. Whereas a lot of times we'll get a call or voicemail and we'll just text it to the person like "hey, call this person back, they just let us know they're looking for you." Even on day-of when they're rushing to get an appointment, a lot of times we're in session. They'll call Greg or myself and we'll be in a session and can't really get to it. Just having that extra layer — the turnaround time for a lot of these calls is usually not the same day. It's within 12 to 24 hours because we're the ones doing it. If there was a specific call person who was at the very least bringing it to somebody else's attention, it would move a lot faster. Almost like we have now where we can send reminders, but having it where the person's texting you that nudge — "hey, did you do this?" — could help get all that stuff filled out.

## 00:21:24 — Filomena's Text Script

**Filomena DiFranco:** I have a script I'll send to new people. Obviously now since I've been getting a bunch — when they book on Zocdoc I text them from my Google Voice and it's the same thing. I just filter it with when their appointment is and I write "if you could please fill these things out, I'm going to get an insurance check for you." I always send this text. For some reason it's been helpful because they will respond if they have questions. They don't call me because, like you guys said, I'd be in meetings and obviously my other job. These people are texting me through Voice like "hi, did you get my copay information back?" I have this little script. I just copy and paste it. I say "if you could fill the stuff out, if you have any questions" and that's it. That works for me. I don't know how helpful that is, but it's just something I do.

## 00:22:15 — Standardizing Client Communication

**Juan Carlos Espinal:** It could be very helpful. The main thing we do send out is just the SimplePractice client portal thing. The reason there's sometimes a disconnect is because there have been a couple of times where people have said "I never got an email from you" because they reached out via email. I'm like, it's not from me directly. It says "Doctors and Psychological Services" specifically and they're like "oh, I deleted that email." Okay, great. So I had to go back — that whole back and forth where I said "go to the client portal." A follow-up email or follow-up text or a preemptive text is helpful ahead of time. As we're revamping the clinician manual, that might be standard practice for the new interns — they send the client portal email on SimplePractice but also send a follow-up text saying "your appointment has been confirmed for this time, please fill out this information ahead of your appointment." Even if we can put in "if you need to cancel under 24 hours there'll be a charge." It can probably just be a simple text that has all that.

## 00:23:56 — Update Default Messages

**Gregory Inzinna:** I zoned out for a second, but I want to make sure I mention this. We probably need to edit the default message that goes out to everybody. That's old. We want to be really intentional about what we say. Probably in that message put the general number to call. Also — did you say appointment reminders? Make sure to have those on for everybody. That is 100% super important because I get so many messages saying "sorry, I need to cancel tomorrow" right when they got their 24-hour appointment reminder. Very helpful. And Filomena, if you could — in the leadership drive, create a folder where you have what your domain is, what you're working on, and then protocols. Like your script — that's so helpful. If we added Ellie to that thing — oh, does she need the password?

## 00:24:51 — Ellie's Access

**Filomena DiFranco:** I met last week with Carlos, the three of us. I don't know if she ever got access to it, but we have been in touch.

**Juan Carlos Espinal:** I'll fix that right now. You'll get a reset password thing right now.

**Filomena DiFranco:** Okay, cool. And I could send that to her. She needed the SimplePractice too, right?

**Juan Carlos Espinal:** Yeah. She needs to be added as a scheduler.

**Gregory Inzinna:** I need to do that.

**Juan Carlos Espinal:** You need to add her as a scheduler. I don't think I can add this. Your owner thing is different.

**Gregory Inzinna:** Okay, I'll do that now too.

## 00:25:40 — Leadership Drive Structure

**Gregory Inzinna:** When I went to the leadership drive I created training programs. You can see with doctoral externship it goes four different layers in to the individuals. Keep in mind you're creating a system here that's meant to be really helpful to yourself but also to other people. If Filomena steps into a different role at a different time, you should be able to give that to your successor and have them be able to say "all right, here's the leadership drive, here's the admin folder, here's the front office folder" and they're going to have access and it's going to make sense. Probably one of the most important things we don't really have right now — we have a system that makes sense to us. We're really trying to make it make sense if any stranger looked at this. That's going to help us on the other side.

## 00:26:43 — Website Chatbot Idea

**Gregory Inzinna:** Some other thoughts with these features — one of the things I noticed with the website was that they had a little chatbot thing. On JustWorks I've been finding their AI chatbot so helpful. It saves me so much time. I don't have to call them. I can ask it a question anytime. It has access to our whole — it knows when it can't know something, then redirects me to the support thing. It's way better than just "is this article helpful." I think SimplePractice has one of the worst ones. It doesn't say anything. Whereas this thing will actually put more thought to it. I wonder if that would be maybe helpful. There's the literal chat AI thing and then more of like a call AI thing which would be more robust. Anders, would that be easy to do or more of a big step?

**Anders Chan:** I think the chatbot just typing is very realistic and doable. Since Bret's also traveling, I feel that's one project on standby. Once the Zocdoc/SimplePractice stuff is more finalized too, I could get a light RAG kind of model that pulls from the manual, Filomena's script, and we could test it from there.

## 00:28:41 — RAG Explanation

**Anders Chan:** There are more advanced models afterwards where — I think that's what JustWorks is doing where it has every single article or document and also makes a summary of each, then makes a summary of that. It'll always scan the lightest one first and keep going deeper if necessary. At the moment people find that the best way to do these things. The mainstream frustrating ones are they just do the exact text. Everything feels a little clunky or it might miss details because there's only so much it can remember at once.

**Gregory Inzinna:** Having it be almost have access to all those documents at once — if you can store that there, we already have some pretty comprehensive documents. We need to finalize and flush those things out and make sure they're really consistent with each other. Definitely a plan for after the whole Zocdoc payroll thing. Maybe as you think about your year, Anders, plan out what priorities you're going to focus on when. This is important but certainly after we solve just getting bookings happening and the call thing happening. That's what's going to primarily happen when we launch the website — a lot of email inquiries, phone call inquiries, or just bookings. Chatbot is more convenience rather than making those things happen. It's more improving quality of service rather than a channel through which bookings are happening.

## 00:31:17 — Chatbot Cost

**Anders Chan:** Yeah, and it's really affordable. It'll probably cost 0.5 cents — sorry, 0.005 — a fraction of a penny for each message. After someone talks with it for 20 minutes, it'll probably still cost about a penny.

**Gregory Inzinna:** Carlos, can we afford it? Fraction.

**Anders Chan:** We could make a little guard rail for once it gets too therapist-y. And the voice agent — once the chatbot is satisfactory, we could literally just add on the voice agent feature afterwards.

## 00:32:34 — Dawn and Nighttime Therapy

**Gregory Inzinna:** Cool. By the way — have any of you seen an ad for Dawn? They're 24/7. Their ad on the subway is "anxiety doesn't wait for your therapist appointment" or something, like it happens at 3 a.m. and so you need to be able to call someone 24/7. Which, as we know, is not the point. When therapy is happening the right way, it's meant to give you the ability to tolerate those moments in between. That's part of what we do. But I wonder how they're doing it.

**Juan Carlos Espinal:** It brings up a good point — potentially having nighttime positions for your long-haul truckers. Lorin was saying she's a night owl. Maybe you just take care of all the nighttime professions. Think about all the doctors on night shift.

**Lorin Singh:** It would work because I'm up till 4 or 5 a.m. every night.

**Gregory Inzinna:** Are you serious?

**Lorin Singh:** Yeah, that's why I'm looking half dead at 11 o'clock.

**Gregory Inzinna:** Is this your first thing of the day? No, I hear you. That was in a different life — that was me too.

## 00:34:20 — Night Therapy Market Research

**Juan Carlos Espinal:** It could be something we open up in a couple years. Who knows. If there's interest — there could be interest in Zocdoc saying they're only offering — we have to see how many people would even ask for it. That might be just like an AI thing. Anders, direction — start to add more work. What would be the interest in therapy after 10 o'clock, from 10 p.m. to 6 or 7? Because most clinicians start at 8. Filomena, I think you have one of your first appointments at 8 in the morning. What would that look like? Would there be enough of a reason for us to even have those positions? We would be cornering the market because I don't know if anybody else is offering 2 a.m. therapy sessions.

**Gregory Inzinna:** I'm not sure we have to go all the way into that, but I like the idea of tracking when things are happening, seeing if there's demand. We could do research and patient surveys to see if there is demand. The advertising for that would probably be much less expensive than advertising for normal spots.

## 00:35:14 — Training Model Positioning

**Gregory Inzinna:** With the whole advertising thing, a lot of it is how we're positioning ourselves. I'm noticing a lot more — if you read through the website and the content now, a lot of the positioning is that we are — they're actually embracing the whole training model of us. It's not just an isolated clinician. It's somebody who has a support system. What did it say — I like this phrase — it's like your clinician is better to support you and they are supported themselves. Take a look. As they flesh out the website more, that'll be more cleanly represented. But that's the angle.

## 00:36:14 — Culture: Rigorous and Kind

**Gregory Inzinna:** It is important for what we want to do as leadership, especially as we get the externs, to help develop what that means in terms of work culture as a place, and how we can impart that to our clinicians and students. This is a real thing. They came to us because they feel "oh wow, this is a place that really cares for their clinicians and cares for each other as a team." That's both actually experienced and seen. I notice a lot of my former students are really — they come from programs where being kind to people and supportive doesn't go well with also being rigorous. Their professors equate being kind and caring with being lazy or not as rigorous in workload. I don't think that's good leadership. I don't think that's true. You don't have to choose between intense goals and rigor and kindness. You need respect and structure — we also want to find a way to impart that it's valuable — but it doesn't have to be something where you're scared to show your mistakes. Actually, that is the problem. A lot of students are afraid "can I reach out, can I say this?" Our rationale can just be very forward with the fact that a clinician who feels confident, just like a patient, to show their most shameful things — that is a much better thing that we're very intentionally going for. We're very intentional about being good to our patients by trying to accept their insurance and make it affordable, by being good to our clinicians and from the top down from leadership. I hope that's what we can do together. I invite any feedback that relates to us doing better on that.

## 00:38:50 — The Slogan

**Juan Carlos Espinal:** The quote was, "Better support for your therapist means better care for you."

**Gregory Inzinna:** So we'll see what resonates, but I like that.

**Lorin Singh:** Speaking of advertising a little bit — I've been trying to work on standardized brochures plus different sector brochures for outreach. I haven't finalized anything but I've been getting the wording down for each one. While I was doing it, because my mind goes a million miles per hour, I started thinking about welcome boxes. If I'm saying the wrong thing — when we outreach to certain places, I want us to be unforgettable. What we're doing here is kind of different. We're a different type of practice. What could we give people that's inexpensive but makes us different? The standard idea is a pen. You always give them a pen. But I wanted something that makes us different.

## 00:39:53 — Skeleton Key Concept

**Lorin Singh:** The idea I came up with — I want to bounce this off you guys — is a skeleton key. The skeleton key — I was looking up these things. They could be pens. They could be USBs with the brochures on it. There's so many different things. The point of the skeleton key is — we're breaking doors. We're breaking barriers in mental health. When you outreach to someone, it's like saying "I'm giving you the key. The key is in your hand to help with the mental health of your employees." So, "you have the key, what are you going to do with this key?" I wanted something where it's like "remember us."

## 00:40:54 — Slogan Brainstorm

**Lorin Singh:** I came up with slogans. I had two that were really good but I didn't know if I could fit both on a key. "Unlock what others ignore" and "Open minds open doors." I thought "Open minds open doors" was my final one because we have a logo of a brain. So I was going off of that. I'm trying to think of something that makes us stand out, also looks modern but classy enough where people would want to reach out back to us. What do you guys think?

**Gregory Inzinna:** I like it. What do you guys think?

## 00:41:40 — B2B Slogan Discussion

**Juan Carlos Espinal:** I like "Open minds open doors" a lot. We don't technically really have a slogan. Our whole mantra has been affordable, accessible, equitable. That's really good but it doesn't speak to the fact that we are just a therapist for all kinds of things as well. It could be both interchangeable where we speak to being affordable/equitable/accessible, but also the idea that we're branching away — not branching away — but we're also not just an insurance-based therapy service. We can also be the therapist you do want to pay the $400 a session for. We're the best of both. I think that's a great slogan.

**Gregory Inzinna:** By the way, this is to companies, right? Or direct — this is our first B2B thing. Whereas the other stuff — because we do have kind of a slogan. It's the thing on the first page which is like "understanding comes first" or something. This whole tailored thing — that's the whole integrative thing. "The tailored therapy comes from understanding first." We're going to take time but also not going to be so snuffy and old-school psychoanalysts. We're integrative, modern, but not eclectic in that we don't stand for nothing. We stand for something very specifically — understanding, the alliance being the thing that helps that work all happen. But that's directly to the public, not necessarily directly to businesses which have maybe a different kind of — they want — they do want to unlock people's potential.

## 00:43:25 — Key Imagery

**Gregory Inzinna:** Which is a very straight up way of saying they want their people to feel taken care of yes as employees, they can offer good benefits, but also specifically they want to have happy and productive employees. There's a lot of research on that. So "unlocking your potential" — the key fits really nicely with that.

**Lorin Singh:** I was trying to think what could it be. I didn't want to hand them something that's not useful. I saw there are USB keys. So I was going down a rabbit hole. I didn't set anything on it. I'm thinking of cost too. This could be something down the line when we get more money. In the beginning we could start giving a smaller, cheaper, more cost-effective key for now. It could be part of our brand. The key also represents us.

**Gregory Inzinna:** I love it. We probably need to — one of the biggest things is to create the brochure and documents — what's going to go in that. I'm willing to spend the money to create a folder if we have the designs. There's probably some — we haven't been totally given the full brand kit yet, Carlos, because they still need to finish the website.

## 00:45:30 — Website Timeline

**Juan Carlos Espinal:** We're looking at June 1. They're hopeful we can get it done mid-May. I'm not too hopeful based off how it has taken longer to get back on different pieces. Nothing on our end — more about them on the mock, the rendering and all that. It's taking slightly longer at every piece, even an extra day or two. That adds up. I think we should be live for the website June 1 so we can start the campaign that same week.

**Gregory Inzinna:** One thing that would be nice as we grow out the year — for us to have one document with our intended timeline for everything for the rest of the year. Would that be helpful? Make sense to people?

**Lorin Singh:** Yeah, that would —

**Gregory Inzinna:** How can we best organize that? Would it be best for everybody to have our own sections and put their stuff, or month by month?

**Lorin Singh:** You could break it down by sectors like how Carlos already has that document he created for us — marketing, operations, or this or that. Under that have different timelines for something underneath there.

## 00:47:19 — Timeline Format

**Juan Carlos Espinal:** Just so I can visualize — you're talking about a year calendar, what we expect different thresholds to be? Yeah, I think that makes the most sense.

**Gregory Inzinna:** Phases. If we have a big project we want to launch by — boom — we put "all right, the goal is do this" and then if it needs to be broken down into multiple phases, specify what those phases are.

**Juan Carlos Espinal:** I can copy something similar to what Pierce did. Let me see if I can find that. The way he broke it down is actually really nice. I mean, I hate looking at it because it just says how much it's extended from when we were supposed to be started.

**Gregory Inzinna:** That's supposed to be a two to three month project, by the way, which I don't know why they just —

**Juan Carlos Espinal:** They overpromised. Which is fine — which is not fine — but we did not need to.

**Gregory Inzinna:** We didn't need it. It would make sense that our lifetime website should take six months to build.

## 00:47:59 — Feedback Handling

**Juan Carlos Espinal:** Is it marketing priorities? There's so many emails.

**Lorin Singh:** By the way, were you guys good with the feedback for the website?

**Gregory Inzinna:** Yeah. I wasn't there, but Carlos and Bret brought it to Pierce. I think one of the limiting factors — they're able to edit some. I didn't realize they need a certain thing to be ADA compliant, which is part of what they're doing with us. To be compliant they have to make the colors specifically contrast in the right way. So I'm not sure. I think there was still room to integrate the feedback within those limits. Thank you for sharing the feedback.

**Juan Carlos Espinal:** That was the main thing. I did share the comments and they're trying to work with some of it. But the main thing was that the contrast needed to work well for a bunch of different things. If not, the website would not be able to be published.

## 00:49:03 — Sharing the Staging Site

**Juan Carlos Espinal:** Okay, two more seconds, guys. Let me share my screen. Can you guys see it?

**Gregory Inzinna:** You're using Safari, so it doesn't really share it when you do it.

**Lorin Singh:** It's blurry.

**Anders Chan:** It'll take a second maybe.

**Gregory Inzinna:** Oh, there you go.

**Juan Carlos Espinal:** So this is how they have it done. Different sections so everybody can have their different section. Here's just the deadline, the time frame. Green is that they've met these — they've done this. Something like this, I'm thinking. We can attach another document that lays out what each part means so we know what's going on.

**Gregory Inzinna:** Love it. The challenge or the thing about that is that is just one project, the website. We both want — we can have almost different layers where we have that for individual projects but also that for our whole year. All those things are to track a lot of specific tasks related to one project. So we can have different versions of that.

## 00:51:17 — Starting Simple

**Juan Carlos Espinal:** I guess we have to figure out what the projects are that we want. What are the specific projects?

**Gregory Inzinna:** Yeah. We've kind of talked about them. Maybe everybody — before we put it into the larger calendar, maybe we just have one document where everybody puts the projects they're working on and the estimated timelines. Does that make sense?

**Juan Carlos Espinal:** Yeah. It doesn't have to be a full Excel sheet. Just a regular Google doc, a regular Word doc, where you put in saying "this is what I'm working on and this is when I expect it to be done." Doesn't have to be a firm deadline. Just so we have an idea — for example, Anders and the payroll project, it's probably going to be a month and a half. I know he has confidence he can do it sooner, but if it takes longer, that's fine. Just so we know come May the payroll project will be done and we don't have to think about it anymore. That's closed.

## 00:52:10 — Anders Offers Visual Calendar

**Gregory Inzinna:** Carlos, can you just start the folder where there's a main folder and that document in it, and kind of start from there? Because then we also have the other stuff like the thing you and Bret were talking about, Anders, with the assessments. Which is further but still worth putting on the timelines.

**Anders Chan:** Yeah, I'd like to offer — after we have a Google doc and everyone fills in all our goals and expectations and timelines — I would like to then vibe code a little calendar that you could — like in between, it'll take some time, but to really envision it — something loosely inspired by Google Sheets but like the filters for Excel where you can go through whichever project and see which person's contribution. Once everything's done manually on a Word doc, I think it's a lot easier to make something to visualize.

**Gregory Inzinna:** Anders, I think you have permission at every level to make what we do better. If there would be a better way to start that, definitely let us know. I love that feel — more of that, please.

## 00:53:21 — School Brochures

**Juan Carlos Espinal:** Lorin, I just sent you the school brochure — sent it to everyone so everybody can see it. It's a real basic model because I actually suck at all this kind of stuff. But it has all the information potentially we would need. I guess you can work with that and figure out —

**Lorin Singh:** Definitely. I already started pulling from that and customizing it. The only thing is I didn't get the — I work weird. Normally I type and design at the same time, but because we didn't get our website down, because I like to match, I like to color coordinate and bring our themes into whatever I'm designing. Because we haven't officially finished that, I haven't worked on color yet.

**Juan Carlos Espinal:** What I can do is show you the link to the staging site. That's going to be the closest thing to what we have for everything for the website. Even if we change the colors to a certain degree, it'll still be in the same palette. You can start doing stuff based off that. No matter what we do going forward, it'll still be within the same vein and still follow the same color schemes. I'll share that with all of you guys so you can see what it'll look like. Keep in mind it's not a finished product. There's errors. There's stuff in there that's straight up Latin. It's not even actual content. But it will be good for you to see it. As you're making up your own content, we can add it there.

## 00:54:55 — Staging Site Walkthrough

**Gregory Inzinna:** It would be so important to have consistency among our whole look. CFL — we're all going to drop off soon anyway. But if we can have the shared drive have everybody's separate thing or just all the work so we can look at other people's — that would be — oh, is this the website, Carlos?

**Juan Carlos Espinal:** Yeah, that's just the staging site. A lot of the stuff you can't even click on, but at least it looks like what typically our clothes are going to look like.

**Lorin Singh:** Okay.

**Juan Carlos Espinal:** There'll be some adjustments, but the colors and everything — that's what it looks like.

**Gregory Inzinna:** And the self-assessment and the user interface of that — I'm really interested to see. Schedule a consultation — really interested.

## 00:55:48 — Insurance Logos Warning

**Juan Carlos Espinal:** Just last thing, so you guys know — I'm working on getting language in our credentialing contracts to include the logos. But for now we can't include any logos on any stuff we put out. We can put the name of the insurance we take, but we can't use their specific logo — the specific Cigna logo, specific Aetna logo. If you put that on your brochures, just put the actual words that we take these insurances, but don't put any logos until we get approval. We want to get either explicit instruction that we can use it or put that in our contract as we negotiate group rates.

**Lorin Singh:** Okay.

**Gregory Inzinna:** Carlos, it might also be helpful to show this to Carmen. Flag to her that the group — changing the name does not change the NPI and does not change the tax ID, but it does change — we will change the name eventually. Flag that to her as well.

## 00:57:30 — Name Change

**Juan Carlos Espinal:** Eventually — almost soon — because we need to buy the domain and then —

**Gregory Inzinna:** We can still buy the domain. We don't have — I asked the lawyer for an update on this. She's still —

**Juan Carlos Espinal:** The change of the name is relatively simple.

**Lorin Singh:** It's fine though if I create the brochures with a new name right now?

**Gregory Inzinna:** Yeah. We're just waiting for New York State. The nice thing about having it be my name is they can't really tell you you can't use that name — unless somebody buys it.

**Juan Carlos Espinal:** Unless somebody buys it.

**Gregory Inzinna:** So we got to get on it.

**Juan Carlos Espinal:** You never know if your brother might want to sell you the —

**Gregory Inzinna:** Yeah, right. Exactly. Anders, we got to meet because I have a patient emergency I need to interrupt an hour for. Let's wrap this up. Thank you all. We'll talk soon.

**Juan Carlos Espinal:** All right. Bye guys.

**Lorin Singh:** Hi.

**Gregory Inzinna:** Take care.

---

*Transcription ended 00:58:27.*
