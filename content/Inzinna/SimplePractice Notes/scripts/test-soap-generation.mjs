#!/usr/bin/env node
/**
 * Quick test: build a SOAP prompt from real session data and send to local Ollama.
 * Usage: node scripts/test-soap-generation.mjs
 */

const ENDPOINT = 'http://localhost:11434'
const MODEL = 'llama3.2:3b'

const sessionNotes = `wondering if could be shorter. saturday.
daughter of hx suicide risk. 10-15

1x at April ran away from home and missing for 5 days. staying with a random person. police find her. cut off her hair. said eliana hit her. 2 years ago. 2 weeks.

happened right before spring break.

the catalyst was getting into trouble, last time was brought boy to apartment, talking to boy on ig, lying and stealing. had a sister with daughter.

this week was in trouble for disrespectful towards teacher. ignoring directives.

aggressive with eliana.

her mom died in october. her and elina's mom died in a horrible way in october. trauma in childhood.`

const mseChecklist = {
  appearance: ['well-groomed', 'casually dressed', 'appropriate hygiene'],
  behavior: ['cooperative', 'good eye contact', 'psychomotor normal'],
  speech: ['normal rate', 'normal volume', 'coherent'],
  mood: '',
  affect: ['congruent', 'full range'],
  thoughtProcess: ['linear', 'goal-directed'],
  thoughtContent: ['no SI', 'no HI', 'no delusions'],
  perceptions: ['no hallucinations'],
  cognition: ['alert', 'oriented x4', 'intact memory'],
  insight: 'Good',
  judgment: '',
}

const transcriptLines = `4/2 Alex transcript

Alex: Hello.
Anders Chan, PsyD: Hey, goedemorgen.
Anders Chan, PsyD: Qual.
Alex: Yes, now I can.
Anders Chan, PsyD: Yeah, thank you for filling out the surveys this week. Really appreciate it.
Alex: No problem
Alex: You, you have everything?
Anders Chan, PsyD: Yes, yeah, I think we're all set.
Alex: OK
Alex: Um
Alex: well, sort of a deep dive into it. Um, I am wondering if we can cut our session a little bit short today because on what day is it? Thursday on Saturday, this past Saturday, um
Alex: my kid who I'm raising with my best friend, 14 years old, um, tried to overdose on her sertraline, so she took like
Alex: half of her pills, and we went to the hospital and now she is in Bellevue, um, in the psych ward, which is where she has been before.
Anders Chan, PsyD: Whoa
Anders Chan, PsyD: Mhm.
Alex: when she was like 11 or 12, and um we're about to go visit her. We have, we just got a call like um
Alex: like later on in the afternoon yesterday, I should have emailed you, but I didn't, but they were like, we need to, you know, we're meeting with her care team. We're leaving in like 1015 minutes to make go to go to Bellevue to meet with her care team at 10.
Anders Chan, PsyD: OK, understood
Anders Chan, PsyD: I'm so sorry to hear. That's really intense.
Alex: So I'm gonna, yeah.
Alex: Yeah
Alex: It's been, it's not been fun, but, you know, it'll be
Alex: it'll be OK. She's doing OK
Anders Chan, PsyD: Mhm.
Anders Chan, PsyD: Um, so
Anders Chan, PsyD: this has happened before.
Alex: Yeah
Alex: Um
Anders Chan, PsyD: Um, how many times would you say?
Alex: really just once we um, when she was 12, she, or no, actually
Alex: no, she was in, in, it was in 2024.
Alex: Yeah, like around this time to 2 years ago.
Alex: Is that right
Alex: Yeah, I mean, it must be
Alex: Anyway, um, when in like April,
Alex: um right around this time, she ran away from home and was missing for 5 days, um.
Alex: and we like mounted a big surf party to look for her, and we um
Alex: looked
Alex: uh for a long time. It turns out she was like kind of, she was staying with a random person who we didn't really know. And then um
Alex: the police ended up finding her and then they brought her to Harlem Hospital, and she had like cut off all her hair and then she said Eliana had hit her and then ACS got involved and then they did an investigation and Vic got like evaluated and was like put under observation for a little bit and then went to Bellevue for two weeks, um, in the child psych ward and spent, well, she was there for like 10 days and then um Eliana really advocated to get her like
Anders Chan, PsyD: Mm.
Alex: discharged early because it was just like horrible in there. Um, and then she got discharged and was in outpatient for a couple of days and then tried to run away again and then ended up back in CPAP and then spent another two weeks.
Alex: um, or two full weeks this time in in the psych ward, so I mean, I don't know if that counts as 1 or 2 hospitalizations, but honestly it feels like it was kind of all one incident. Um.
Anders Chan, PsyD: 11 large time. And Eliana is your life partner, best friend.
Alex: yeah.
Alex: Yeah
Anders Chan, PsyD: OK.
Alex: Mhm
Anders Chan, PsyD: And that was 2 years ago, also in April
Alex: Yeah
Anders Chan, PsyD: It is April just a coincidence?
Alex: No, I think it's, well, yes, I think it, I think it is mostly a coincidence. I do think that it wasn't necessarily
Alex: I mean, it happened right before spring break started, both times, and I, and I, you know, I don't know if that's like a subconscious thing that she's thinking about, but she's like, you know, the like, I remember thinking last time like we were talking about how it was like, thank God she's not gonna like miss
Alex: so much school right off the bat, um, and that's what we're thinking right now too, but
Anders Chan, PsyD: Mhm
Alex: I don't know how intentional it was. I mean, both times there was like a catalyst of her getting into trouble. Um,
Alex: you know, like, like the time two years ago right before she ran away, she got into a lot of trouble. She had like brought a um boy over to the apartment and was like speaking, you know, talking to an older boy on Instagram, and she was not supposed to have Instagram and there's like just, you know, there was a lot of like lying and stealing and issues and she had gotten in trouble and then, you know, they had like she and her sister had a fight and then she like ran away the next day and then today or this week, um,
Anders Chan, PsyD: Yeah
Alex: she had gotten in trouble on Friday night because um we got a call home from school because she's been like consistently disrespectful to our teachers, and we've been working on this for like weeks, um, like not doing homework, kind of ignoring.
Alex: directives, um, all that stuff and being disrespectful. And so, um
Anders Chan, PsyD: And, and
Alex: I went home at the time I was at work still, but Eliana, when she got home from school, they talked about it for like an hour and then Eliana went to check their grades, and it turns out they had been like
Alex: not submitting any of their homework assignments for one of the cla their classes, and so Eleana like popped her in the arm, um, and then she like got really aggressive with Eliana and started trying to hit her, and then Eliana like had to pin her down on the floor and it was like
Anders Chan, PsyD: and, and
Alex: and then I came home, we all talked about it for like 33 hours, like for a long time and she was just like totally shut down and both Elian and I were sort of like this feels really different than what we've been dealing with recently in terms of like her development, and we were like talking about what to do, we're looking, you know, we, we were talking about how it's like good to, you know, gonna be good to get her back into private therapy because she sees it, she sees a therapist at school, but the recommendation from her, um, psychiatrist and her therapist, like the family therapist that they saw
Alex: after the first hospitalization was that she just, you know, the important thing is to focus on like stuff that she likes in her life, like outside activities, and she said that she was feeling fine, so we just had stopped, like, you know, she'd stopped seeing her private therapist in addition to the school therapist and was just seeing the school therapist, but we were like looking into, you know, therapy.
Anders Chan, PsyD: Mhm
Alex: a private therapy to for her to restart again, um, and then this happened on Saturday, so.
Anders Chan, PsyD: Yeah, uh, um, I have one more question just about your daughter then, when she cut her hair, was that one time or does, does that come up randomly? She suddenly has a brand new haircut.
Alex: One time. Those are just the ones as far as I know.
Anders Chan, PsyD: OK.
Anders Chan, PsyD: OK. From a quick impression, that sounds like oppositional defiance.
Alex: We talked about We that. I don't know, I mean, her, her therapist and I'm like glad about this have been like not um
Alex: it's, it's like they've talked about it as like a diagnosis that it's really hard to come back from in terms of like people being willing to treat you and like
Anders Chan, PsyD: Yes. Mhm
Alex: and you know, kids, you know, not diagnosing kids with personality disorders type of thing. I'm like, you know, this is something definitely that's been floated for sure. Um, but it is
Anders Chan, PsyD: Yeah, I understand
Alex: yeah
Anders Chan, PsyD: It's, uh, yeah, I, I totally understand, especially for adding any like label uh that
Anders Chan, PsyD: for insurance or just for therapist who like see on paper.
Anders Chan, PsyD: Um, but, um, regardless, like, I think if you want to talk about it later on, like accession or next month. I, I, I think we could always just talk about it loosely without putting any stamp. Um, but just
Alex: Definitely.
Anders Chan, PsyD: getting any tools to
Alex: Yeah
Anders Chan, PsyD: um be able to manage as a parent.
Anders Chan, PsyD: I, I think, I think it could be really helpful.
Alex: I think so too, and I agree. Um, yeah.
Anders Chan, PsyD: And, and I'm also jumping a little fast cause our time is short, because I think ideally, I think we should, we could spend way more time on like, how tough it is for you to have to like
Alex: Totally, totally, no.
Alex: Totally
Anders Chan, PsyD: um manage, like work and hold, like it's, it's a similar like crisis stress
Anders Chan, PsyD: type of theme
Alex: Yeah, so I'm feeling tired right now. Um, and also like worried and all that stuff, but
Anders Chan, PsyD: Mhm
Alex: it it'll be OK
Alex: Right I see her. We saw her yesterday, which was good. Um, she is doing OK. I mean, she's still got like
Alex: I mean, 7Gs of sertraline coursing through her veins, so she's like kind of jittery right now. Um, but yeah, she's like, we'll see, we'll kind of see how it develops. I will definitely want to be talking more about this, so.
Anders Chan, PsyD: Mhm
Anders Chan, PsyD: Yeah
Anders Chan, PsyD: Um, I don't remember reading it in the
Anders Chan, PsyD: intake. So would you say this is like, or maybe you wrote it, and I, I just I just skimmed it.
Anders Chan, PsyD: Um, was it a, do you feel like this is more of a surprise that came up?
Alex: Yes, definitely. It's, I did not write it down because I don't, I did not like this is, this is very like, it feels like a major um
Alex: step backwards from where we thought we were, and I think like, I mean, her mom just died in October though, so it's like in some ways it's not, I mean, this is like stuff that we would have gotten into pretty shortly after we started it. Like I just I haven't got a chance to tell you anything, but like, you know, her and Elianama's mom died in like a pretty horrible way in October, and we were, you know, like she's, she's dealing with a lot and she's also, you know, she's been diagnosed with PTSD and like, you know, she's
Anders Chan, PsyD: Mm
Anders Chan, PsyD: Mm
Alex: had like a, a lot of childhood, so I mean, I think for her, we were asking her yesterday for her it seems like she doesn't feel like it's that surprising that she's like back here, but
Anders Chan, PsyD: Yeah
Alex: but I think for us, it felt like a really strong or like different behavioral shift, even though like we've been, we've been like been having disciplinary like behavioral issues for a couple of months, but like it didn't feel like this, you know, like it didn't feel like this is where we were heading, and it did not feel it like I feel, I feel very shocked that we are back here, and I think that I'm not sure how she's gonna feel once she's like more
Anders Chan, PsyD: Yeah
Alex: stable and settled. I think it's like it ultimately the doctor at the, the, the doctor at Bellevue was like, it's a coping skills issue, like she needs to learn how to develop coping skills so that she doesn't like, it's not between, like, we're not talking. I mean, there hasn't been self-harm in like 2 years, but then when we like took her to the hospital, they were like, you know, she had like caught up all her arms, right, like the morning of, you know, like it was, it felt, it felt like a pretty
Anders Chan, PsyD: Yeah
Anders Chan, PsyD: Mhm
Alex: big fast switch.
Anders Chan, PsyD: Yeah, yeah, that's very informative.
Anders Chan, PsyD: The opposition define is, is a very shallow view of it, um, but tra trauma is actually the deeper part.
Alex: Yeah
Alex: Yeah, exactly. So.
Anders Chan, PsyD: Mhm.
Alex: anyway, um, I am really sorry. I, I, I was like, I know that probably it, I don't, I don't know like for insurance purposes, you have to like build a session that's like I, you know, I feel I, I should have
Alex: canceled the
Anders Chan, PsyD: Oh no, I think it's OK. Um, like the amount of time we spend, it's, it's all documented. I, I think it if we're meeting less than like
Anders Chan, PsyD: 50 or 30 minutes, like there's different tiers for insurance. So, um, it's all, I think it's all done automatically for you.
Alex: OK, OK
Anders Chan, PsyD: Mhm
Alex: Well, that's good. Um, thank you. I would love to schedule another appointment.
Anders Chan, PsyD: Yeah, yeah, um, I think we, let me make sure if we
Alex: Oh yeah, it's, uh, are we just doing Thursdays now? Like Thursdays at 9:00 a.m.?
Anders Chan, PsyD: Yeah, I think today's time is a recurring one.
Alex: OK, that sounds pretty much good to me.
Alex: right now. I mean, next week, I'm supposedly have a
Alex: trial at 10, but that is probably actually fine.
Alex: Um
Anders Chan, PsyD: Are you sure? That like literally right before?
Alex: I mean, yeah, yeah, yeah. No, like it's gonna be, it, I mean, yes, but it's uh it's virtual, so I'm like, whatever, I'm gonna have to, I have, I have multiple things going on at once anyway, so the point is I can, let's keep it there for now and then we'll, we'll get, we'll revisit.
Anders Chan, PsyD: Oh OK
Anders Chan, PsyD: Yeah, if you have, if you have time after, after you come back from Bellevue, like, I just hope you make sure you have time for like a hot shower or sometime to stretch.
Anders Chan, PsyD: exercise
Anders Chan, PsyD: even for a minute
Alex: Totally should do that for sure.
Anders Chan, PsyD: Mhm
Alex: I will try
Anders Chan, PsyD: OK, cool
Alex: Thank you, thank you, thank you.
Anders Chan, PsyD: Yeah, happy to help. Hope you have a good week.
Alex: Well, thank you. I'll see you next week.
Anders Chan, PsyD: Mm. Take care. Bye.`

// Build the prompt using the updated system prompt from soap-prompt.ts
const SYSTEM_PROMPT = `You are a clinical documentation assistant for a licensed psychologist. Your task is to generate a SOAP progress note from a session transcript and clinical context.

OUTPUT FORMAT: Return a valid JSON object with exactly four string keys:
{"subjective":"...","objective":"...","assessment":"...","plan":"..."}

Do NOT wrap the JSON in markdown code fences. Return ONLY the raw JSON object.

HOW TO EXTRACT FROM A TRANSCRIPT:
1. Read the entire transcript and identify the KEY THEMES discussed (e.g., anxiety, parenting stress, work conflict, trauma history). Do NOT retell the conversation chronologically.
2. For each theme, extract: (a) what the client reported, (b) specific details and numbers (scores, frequencies, dates), (c) notable quotes that capture the client's experience.
3. Note what the clinician assessed or screened for (e.g., "clinician conducted PTSD criteria screening" or "clinician explored substance use history").
4. Identify trajectory: did the client report improvement, worsening, or no change on any symptoms?
5. Extract any scheduling, homework, or next-step decisions made during the session.
6. Convert raw client language to clinical prose: "my stomach hurts when I'm worried" → "Client reports somatic manifestation of anxiety (GI distress)."

DOCUMENTATION STANDARDS:
- Use third-person clinical prose (e.g., "Client reported..." not "I said...")
- Use DSM-5 terminology for diagnoses and symptoms
- Use plain, direct language at about an early-teen reading level when possible
- Prefer simple words over formal or academic wording (e.g., "worry" over "apprehension," "got worse" over "exacerbated")
- Keep the note sounding clinical, but not polished or overly literary
- Reference specific content from the session — do not write generic filler
- Only include information explicitly stated in the transcript or session notes
- Do NOT fabricate quotes, symptoms, or clinical observations not present in the data
- Write for insurance/medical necessity — be specific about functional impairment and treatment rationale
- Organize by theme, not chronologically

SECTION REQUIREMENTS:

SUBJECTIVE: What the client reported. Organize by THEME, not chronology:
- Primary concerns discussed this session (group related topics together)
- Symptom changes since last session (better, worse, same) — quantify when possible
- Relevant life events or stressors mentioned (with dates/details from transcript)
- Mood self-report if stated (use client's words)
- Risk factors: SI/HI denial or endorsement (ALWAYS document — write "denied SI/HI" if not discussed)
- Substance use updates if discussed (quantify: frequency, amount)
- Keep it concise — 1 paragraph per major theme, not a transcript summary

OBJECTIVE: What the clinician observed and assessed. Include:
- Diagnostic assessment activities conducted this session (e.g., "Clinician assessed for PTSD criteria; client does not meet full criteria at this time")
- Clinical data points extracted during the interview: substance use quantified, injury/medical history, self-report scales or ratings
- Behavioral observations during session (engagement, emotional responses, coping demonstrated)
- Full Mental Status Exam:
  Appearance: [from checklist or transcript observations]
  Behavior: [from checklist or transcript observations]
  Speech: [from checklist or transcript observations]
  Mood/Affect: [mood is client's words; affect is clinician's observation]
  Thoughts: [thought process and content, SI/HI status]
  Cognition: [orientation, attention, memory observations]
  Insight/Judgment: [from checklist or inferred from session]
- Screening scores if administered (PHQ-9, GAD-7, C-SSRS)

ASSESSMENT: Clinical synthesis (NOT a summary — this is your ANALYSIS):
- Current symptom presentation and severity — note what improved vs worsened
- Diagnostic formulation: does the presentation fit the active diagnoses? Any rule-outs explored?
- Historical patterns identified (e.g., "long-standing performance anxiety with somatic manifestations predates current stressors")
- Functional impact on daily life, work, relationships — be specific
- Protective factors (support system, insight, motivation) and risk factors
- How the client's treatment preferences/style should inform the approach
- Statement of medical necessity for continued treatment

PLAN: Actionable next steps:
- Treatment frequency, modality, and scheduling changes (include specific day/time if discussed)
- Specific focus for next session based on this session's content
- Interventions to use or continue (name specific techniques: CBT, exposure, MI, etc.)
- Between-session assignments or skills to practice
- Any referrals, medication coordination, or safety planning
- Next appointment date/time if mentioned`

const treatmentPlan = `Diagnosis: F41.9 - Anxiety disorder, unspecified

Presenting problem:
Alex is a 29 yo White, asexual female with a law degree working as a staff attorney, public defender for 3 years, living with her best friend and best friend's little sister (14 yo). She shared goals to "manage anxiety, relationship navigation, and coping skills". She reports taking Lexapro 20 mg daily.

Her GAD-7 and clinical interview reports a longstanding history of anxiety beginning in early childhood with somatic symptoms (pit in stomach, nausea, decreased appetite), cognitive symptoms ("something bad is going to happen"), difficulty regulating emotions in conflict, persistent distress and impaired concentration.

Client strengths: Accomplishments, interests, and activities; Motivation to change; Capable of independent living

Goal 1: Improve emotion regulation and reduce anxiety symptoms (Status: No improvement, ETA: 2 months)
  Objective 1A: Client will identify and describe 3 internal cues of anxiety (thoughts, body sensations, triggers) during sessions or journaling. (ETA: 4 weeks, Status: No improvement)
  Objective 1B: Client will demonstrate use of at least 2 coping strategies (e.g., grounding, breathing, cognitive reframing) to reduce anxiety intensity from baseline by 30% (self-report). (ETA: 8 weeks, Status: No improvement)

Goal 2: Increase self-trust and reduce shame-driven interpersonal distress (Status: No improvement, ETA: 12 weeks)
  Objective 2A: Client will identify and verbalize 2-3 recurring interpersonal patterns (e.g., fear of wrongdoing, need to "fix" conflict) and link them to past experiences. (ETA: 8-10 weeks, Status: No improvement)
  Objective 2B: Client will demonstrate increased self-trust by making decisions or tolerating conflict without excessive rumination in at least 2 situations, as reported in session. (ETA: 12 weeks, Status: No improvement)

Interventions: Dialectical Behavior Therapy (DBT), Interpersonal Effectiveness, Emotional Focused Therapy (EFT)
Treatment type: Individual, weekly, Estimated length: 12 weeks`

// Build user prompt
const sections = []

// Treatment Plan
sections.push(`=== TREATMENT PLAN ===\n${treatmentPlan}`)

// MSE
const mseLines = []
const fmt = (label, values) => { if (values.length > 0) mseLines.push(`${label}: ${values.join(', ')}`) }
fmt('Appearance', mseChecklist.appearance)
fmt('Behavior', mseChecklist.behavior)
fmt('Speech', mseChecklist.speech)
if (mseChecklist.mood) mseLines.push(`Mood (client's words): "${mseChecklist.mood}"`)
fmt('Affect', mseChecklist.affect)
fmt('Thought process', mseChecklist.thoughtProcess)
fmt('Thought content', mseChecklist.thoughtContent)
fmt('Perceptions', mseChecklist.perceptions)
fmt('Cognition', mseChecklist.cognition)
if (mseChecklist.insight) mseLines.push(`Insight: ${mseChecklist.insight}`)
if (mseChecklist.judgment) mseLines.push(`Judgment: ${mseChecklist.judgment}`)
sections.push(`=== MSE CHECKLIST (clinician observations) ===\n${mseLines.join('\n')}`)

// Session notes
sections.push(`=== CLINICIAN SESSION NOTES ===\n${sessionNotes}`)

// Transcript
sections.push(`=== SESSION TRANSCRIPT ===\n${transcriptLines}`)

// Instructions
sections.push(
  `=== INSTRUCTIONS ===\nGenerate a SOAP progress note for this session. The treating clinician is Anders Chan, PsyD. ` +
  `Use the MSE checklist data for the Objective section's Mental Status Exam. ` +
  `Use the transcript and session notes to populate the Subjective, Assessment, and Plan sections. ` +
  `Write in plain, simple clinical language rather than formal or academic language. ` +
  `Return ONLY valid JSON with keys: subjective, objective, assessment, plan.`
)

const userPrompt = sections.join('\n\n')

console.log('=== SENDING TO OLLAMA ===')
console.log(`Model: ${MODEL}`)
console.log(`Prompt length: ${userPrompt.length} chars`)
console.log()

import http from 'node:http'

const start = Date.now()

// Use node:http to bypass undici's headers timeout
const { fullResponse, tokenCount } = await new Promise((resolve, reject) => {
  const postData = JSON.stringify({
    model: MODEL,
    prompt: userPrompt,
    system: SYSTEM_PROMPT,
    stream: true,
    options: { temperature: 0.3, num_predict: 700, num_ctx: 16384 },
  })

  const req = http.request(`${ENDPOINT}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
    timeout: 600_000,
  }, (res) => {
    if (res.statusCode !== 200) {
      let body = ''
      res.on('data', c => body += c)
      res.on('end', () => reject(new Error(`Ollama ${res.statusCode}: ${body}`)))
      return
    }
    let full = ''
    let tokens = 0
    res.setEncoding('utf8')
    res.on('data', (chunk) => {
      for (const line of chunk.split('\n').filter(Boolean)) {
        try {
          const parsed = JSON.parse(line)
          if (parsed.response) {
            full += parsed.response
            tokens++
            if (tokens % 50 === 0) process.stdout.write('.')
          }
          if (parsed.done) {
            resolve({ fullResponse: full, tokenCount: tokens })
            return
          }
        } catch {}
      }
    })
    res.on('end', () => resolve({ fullResponse: full, tokenCount: tokens }))
    res.on('error', reject)
  })
  req.on('error', reject)
  req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')) })
  req.write(postData)
  req.end()
})
console.log()

const elapsed = ((Date.now() - start) / 1000).toFixed(1)
const tokPerSec = (tokenCount / (elapsed)).toFixed(1)
console.log(`=== RESPONSE (${elapsed}s, ~${tokenCount} tokens, ~${tokPerSec} tok/s) ===\n`)

// Try to parse as JSON and pretty-print
try {
  let raw = fullResponse
  // Strip markdown fences if present
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenceMatch) raw = fenceMatch[1]
  const soap = JSON.parse(raw)
  console.log('SUBJECTIVE:\n' + soap.subjective + '\n')
  console.log('OBJECTIVE:\n' + soap.objective + '\n')
  console.log('ASSESSMENT:\n' + soap.assessment + '\n')
  console.log('PLAN:\n' + soap.plan + '\n')
} catch {
  console.log('(Raw response — not valid JSON)\n')
  console.log(fullResponse)
}
