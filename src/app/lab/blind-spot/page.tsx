import type { Metadata } from 'next'
import Link from 'next/link'
import { VideoPlayer } from '@/components/ui/video-thumbnail-player'
import DepthHero from './depth-hero'

export const metadata: Metadata = {
  title: 'Blind Spot | thePsychology.ai',
  description: 'VR Therapy that Adapts to Your Nervous System',
}

type Stat = { value: string; label: string }

function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="my-2 grid grid-cols-1 sm:grid-cols-3">
      {stats.map((s, i) => (
        <div
          key={i}
          className="py-5 sm:py-6 sm:px-6 sm:[&:nth-child(3n+1)]:pl-0 sm:[&:nth-child(3n)]:pr-0"
        >
          <div className="text-[26px] sm:text-[30px] font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-50 leading-none mb-3">
            {s.value}
          </div>
          <div className="text-[12px] text-zinc-500 dark:text-zinc-500 leading-[1.45]">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  )
}

type Phase = { label: string; title: string; body: React.ReactNode }

function Roadmap({ phases }: { phases: Phase[] }) {
  return (
    <ol className="mt-6 divide-y divide-zinc-100 dark:divide-zinc-800/80">
      {phases.map((p, i) => (
        <li key={i} className="grid grid-cols-[3.25rem_1fr] gap-x-6 py-6 sm:py-7">
          <div className="font-mono text-[11px] tracking-[0.18em] text-zinc-400 dark:text-zinc-600 pt-[3px]">
            {String(i + 1).padStart(2, '0')}
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400 mb-2">
              {p.label}
            </div>
            <h4 className="text-[17px] sm:text-[19px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.25] mb-3">
              {p.title}
            </h4>
            <div className="text-[15px] text-zinc-600 dark:text-zinc-400 leading-[1.65] space-y-3">
              {p.body}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

type QA = { q: string; a: React.ReactNode }

const qas: QA[] = [
  {
    q: 'Who writes code, or does other technical work on your product? Was any of it done by a non-founder?',
    a: (
      <>
        <p>
          <Link
            href="/portfolio?member=anders"
            className="text-zinc-900 dark:text-zinc-50 underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-700 hover:decoration-zinc-900 dark:hover:decoration-zinc-50 transition-colors"
          >
            Anders
          </Link>{' '}
          built the working prototype with AI-assisted coding (Claude Code, VS Code). Unity VR
          scene on Meta Quest 3. Real-time pipeline pulls EEG and heart rate from a Muse S headband
          through Python (muselsl, pylsl, websockets). A biofeedback orb in the scene responds to
          the user's physiology live.
        </p>
        <p>
          <Link
            href="/portfolio?member=shaunak"
            className="text-zinc-900 dark:text-zinc-50 underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-700 hover:decoration-zinc-900 dark:hover:decoration-zinc-50 transition-colors"
          >
            Shaunak
          </Link>{' '}
          co-founded the MedVR Symposium and Hackathon for VR/AR in Healthcare in 2019 and has
          Unity experience from building a patient education tool. He owns the visual safety
          protocols, eye-tracking metrics, and ophthalmology-side engineering decisions.
        </p>
        <p>All technical work to date has been done by founders. No non-founder contributions.</p>
      </>
    ),
  },
  {
    q: 'Are you looking for a cofounder?',
    a: (
      <>
        <p>Open for a cofounder in software development.</p>
        <p>Current two-founder team:</p>
        <p>
          Anders Chan, clinical psychologist (UCLA postdoc, PsyD Long Island University). Three
          years of eye-gaze tracking research before clinical training.
        </p>
        <p>
          Shaunak Bakshi, MD (Harvard), Director of Refractive Services at New England Vision and
          Vermont Eye Laser. Co-founder of the MedVR Symposium and Hackathon for VR/AR in
          Healthcare since 2019.
        </p>
      </>
    ),
  },
  {
    q: 'Company name',
    a: (
      <>
        <p>Blind Spot.</p>
        <p className="text-zinc-500 dark:text-zinc-500">
          Backup names if trademark or domain falls through: Foveal, Saccade.
        </p>
      </>
    ),
  },
  {
    q: 'Describe what your company does in 50 characters or less',
    a: (
      <p>
        VR Therapy that Adapts to Your Nervous System
        <span className="ml-3 font-mono text-[11px] tracking-[0.18em] text-zinc-500 dark:text-zinc-500 align-middle">
          47 / 50
        </span>
      </p>
    ),
  },
  {
    q: 'Company URL',
    a: (
      <p>thepsychology.ai/lab/blind-spot. Holding URL until rebrand ships.</p>
    ),
  },
  {
    q: 'Demo',
    a: (
      <>
        <VideoPlayer
          thumbnailUrl="/blind-spot/demo-thumb.jpg"
          videoUrl="/blind-spot/demo.mp4"
          title="First user test"
          description="Quest 3 + Muse S, live EEG and heart rate"
          aspectRatio="16/9"
          className="mb-5"
          caption="As user's breathing matches biofeedback orb, her heart rate lowers which turns the orb green."
        />
        <p>
          Saturday's user test video. Tamilyn wears Quest 3 plus Muse S. She breathes slowly. The
          biofeedback orb expands and shifts from red to green as her heart rate lowers. Forest VR
          scene. Real EEG and heart rate streaming live.
        </p>
      </>
    ),
  },
  {
    q: 'What is your company going to make?',
    a: (
      <>
        <p>Most VR therapy plays a video at you. No feedback, no adaptation. We close the loop.</p>
        <p>
          Blind Spot reads your EEG, heart rate variability, and eye gaze, then changes the VR
          environment in real time based on what your body is doing. The system knows when you are
          stressed, when you are calm, and when you are avoiding eye contact. It responds.
        </p>
        <Roadmap
          phases={[
            {
              label: 'Now',
              title: 'Anxiety and performance',
              body: (
                <p>
                  Practice job interviews and public speaking with biofeedback showing your stress
                  response. Toastmasters with brain monitoring. ACT in VR (breathing, defusion,
                  mindfulness) visualized with live physiology. Direct-to-consumer wellness, no FDA
                  needed at this tier.
                </p>
              ),
            },
            {
              label: 'Next',
              title: 'Chronic pain, FDA pathway',
              body: (
                <p>
                  EaseVRx is the only FDA-cleared VR therapeutic. n=1,093, 12-month durability
                  data. Pain only. Open-loop. We extend their playbook with closed-loop biofeedback
                  and pursue FDA De Novo. That unlocks insurance reimbursement.
                </p>
              ),
            },
            {
              label: 'Later',
              title: 'PTSD, autism, depression, surgical training',
              body: (
                <p>
                  Same engine, different module. Eye gaze alone detects depression at 86 percent
                  accuracy in a single session. Nobody else has this stack.
                </p>
              ),
            },
          ]}
        />
      </>
    ),
  },
  {
    q: 'Where do you live now, and where would the company be based after YC?',
    a: (
      <p>
        Boston, USA (Anders) and Vermont, USA (Shaunak). Post-YC, primary operations in NY.
        Clinical pilot sites maintained in Boston and Vermont.
      </p>
    ),
  },
  {
    q: 'Explain your decision regarding location',
    a: (
      <p>
        Anders is in Boston. Access to Harvard, MGH, and BU for clinical pilots and research
        partnerships. Shaunak is in Vermont, practicing ophthalmologist with surgical expertise and
        a Mass Eye and Ear fellowship still in his network. Post-YC, primary operations move to NY
        for XR engineering talent and digital health investors. Pilot sites stay in Boston and
        Vermont.
      </p>
    ),
  },
  {
    q: 'How far along are you?',
    a: (
      <>
        <p>
          Working prototype on Meta Quest 3. The Muse S headband streams EEG and heart rate through
          Python (Lab Streaming Layer) into the Unity scene. A biofeedback orb expands and shifts
          color in response to live physiology. First real user test was Saturday. Video available.
        </p>
        <p>Eye tracking integration and a therapist dashboard are next.</p>
        <p>
          Adjacent traction at thepsychology.ai (Anders' existing site): $300 MRR, 4 postdocs
          have passed the EPPP licensure exam. Same brand currently runs an automated intake,
          scheduling, insurance verification, and payroll pipeline for Inzinna Therapy Group.
          Proves we can build, sell, and retain.
        </p>
      </>
    ),
  },
  {
    q: 'How long have each of you been working on this? How much of that has been full-time?',
    a: (
      <>
        <p>
          Anders: 7 months full-time on thepsychology.ai. 1 month part-time on the VR prototype. 6
          plus years of clinical work in chronic pain, anxiety, PTSD, substance use, and gender
          health (UCLA, NYU Langone, Montefiore, Pratt outpatient). 3 years of eye-gaze tracking
          neuropsychology research at SUNY Old Westbury (2015 to 2018) before clinical training,
          validating eye tracking for accommodative interventions in students with disabilities.
        </p>
        <p>
          Shaunak: 6 plus years on the MedVR Symposium. 2 years in Mass Eye and Ear's Disruptive
          Technology Lab. 1 week ramped on this specific prototype.
        </p>
        <p>
          Both currently employed full-time in clinical roles. Going full-time on Blind Spot when
          funded.
        </p>
      </>
    ),
  },
  {
    q: 'What tech stack are you using, or planning to use?',
    a: (
      <>
        <p>
          Unity (C#) on Meta Quest 3. Python for sensor processing: muselsl and pylsl for Muse S
          EEG and heart rate, Lab Streaming Layer for sync, websockets to Unity.
        </p>
        <p>
          Roadmap: Apple Watch HRV via WatchOS plus HealthKit, Quest 3 built-in eye tracking API,
          Photon Fusion for shared multiplayer rooms.
        </p>
        <p>AI tools: Claude Code for development.</p>
      </>
    ),
  },
  {
    q: 'Are people using your product?',
    a: (
      <p>
        No. Prototype stage. First real user test was Saturday. Video available as the demo
        attachment.
      </p>
    ),
  },
  {
    q: 'Do you have revenue?',
    a: (
      <>
        <p>
          Not from Blind Spot. The founder's adjacent product, thepsychology.ai, makes $300 MRR
          teaching psychology postdocs to pass the EPPP licensure exam. 4 have passed so far.
        </p>
        <p>
          Same brand also runs an intake automation, scheduling, insurance verification, and
          payroll pipeline for Inzinna Therapy Group. Paid contract. Proves the team can build,
          sell, and retain.
        </p>
      </>
    ),
  },
  {
    q: "Why did you pick this idea to work on? Do you have domain expertise in this area? How do you know people need what you're making?",
    a: (
      <>
        <p>We are both clinicians who see the gap every day.</p>
        <p>
          Anders is a clinical psychologist (UCLA postdoc, PsyD) who has treated thousands of
          patients with anxiety, PTSD, and chronic pain across UCLA, NYU Langone, Montefiore, and
          Pratt outpatient settings. He ran ACT-based chronic pain groups with sickle cell patients
          at Ronald Reagan UCLA Medical Center. He also did three years of eye-gaze tracking
          neuropsychology research at SUNY Old Westbury before clinical training, validating eye
          tracking technology for accommodative interventions. The eye-tracking thesis is not a
          bet. It is a return to his earliest research.
        </p>
        <p>
          Shaunak is an ophthalmologist (Harvard MD, Mass Eye and Ear cornea and refractive
          fellowship, Director of Refractive Services in Vermont). He has spent the last six years
          co-founding the MedVR Symposium. He has not waited for VR to come to ophthalmology. He
          has been building that field.
        </p>
        <p>
          The clinical limitation is obvious to both of us. VR exposure has no idea whether the
          patient is actually anxious. Biofeedback devices create no immersive therapeutic
          context. The two have to be one system. Consumer EEG and AI coding tools finally made
          the integration buildable by clinicians.
        </p>
        <p>The evidence base is enormous. Nobody integrates the biofeedback loop into the session content.</p>
        <StatGrid
          stats={[
            { value: '122', label: 'RCTs for VR chronic pain' },
            { value: '30', label: 'RCTs for VR anxiety' },
            { value: '86%', label: 'Depression detection from gaze, single session' },
            { value: '66-83%', label: 'PTSD remission with VR exposure' },
            { value: '$635B', label: 'Annual US chronic pain cost' },
            { value: 'd=0.49', label: 'EaseVRx effect size vs sham' },
          ]}
        />
        <p>We know people need this because we have been the clinicians wishing it existed.</p>
      </>
    ),
  },
  {
    q: "Who are your competitors? What do you understand about your business that they don't?",
    a: (
      <>
        <p>
          Mental health VR. AppliedVR (RelieVRx) is the only FDA-cleared VR therapeutic. Pain
          only. Open-loop. No biofeedback adapting session content. No eye tracking. Floreo:
          autism, no biofeedback. Amelia Virtual Care: exposure therapy, no physiological
          monitoring. Limbix shut down.
        </p>
        <p>
          Vision therapy VR. Vivid Vision, NovaSight (CureSight), Luminopia. All work in vision
          (amblyopia, strabismus). None work in mental health.
        </p>
        <p>Biofeedback devices. Muse meditation app. HeartMath HRV training. No immersion.</p>
        <p>
          What we understand that they do not. Mental health VR companies do not have eye doctors.
          Vision VR companies do not have psychologists. Biofeedback companies do not have VR. We
          sit at the intersection that nobody else can staff. The therapy drives the tech, not the
          other way around. EaseVRx is our precedent, not our competitor. We extend their playbook
          with closed-loop biofeedback, eye tracking, and a condition-agnostic engine.
        </p>
      </>
    ),
  },
  {
    q: 'How do or will you make money? How much could you make?',
    a: (
      <>
        <Roadmap
          phases={[
            {
              label: 'Now',
              title: 'D2C wellness subscription',
              body: (
                <p>
                  $25 per month. Anxiety and performance. 43 million Americans have social anxiety
                  disorder, most untreated. 0.1 percent capture is $12.9M ARR. No FDA needed at
                  this tier.
                </p>
              ),
            },
            {
              label: 'Next',
              title: 'B2B SaaS',
              body: (
                <p>
                  $200 to 400 per clinician seat per month, $5 to 15 per user per month for
                  enterprise. 50,000 plus licensed psychologists in the US. Corporate wellness is a
                  $60B plus market.
                </p>
              ),
            },
            {
              label: 'Later',
              title: 'FDA De Novo for chronic pain',
              body: (
                <p>
                  EaseVRx played this same path. CPT codes already exist for biofeedback therapy
                  and VR-assisted exposure. Chronic pain is 50M patients and $635B per year in
                  total cost. Payers want opioid alternatives.
                </p>
              ),
            },
            {
              label: 'Beyond',
              title: 'VR surgical simulation',
              body: (
                <p>
                  Eyesi costs $100K plus per program. We can ship the same training value at a
                  fraction of that, leveraging Shaunak's domain.
                </p>
              ),
            },
          ]}
        />
        <p className="pt-2">
          Conservative 5-year target: $20 to 50M ARR. Ceiling is much higher with FDA clearance
          and insurance reimbursement.
        </p>
      </>
    ),
  },
  {
    q: 'Which category best applies to your company?',
    a: <p>Consumer Health and Wellness initially. Healthcare / Digital Health post-FDA.</p>,
  },
  {
    q: 'Other ideas considered',
    a: (
      <ol className="space-y-3 list-none [counter-reset:idea]">
        <li className="grid grid-cols-[1.5rem_1fr] gap-x-3 [counter-increment:idea] before:content-[counter(idea)] before:font-mono before:text-[11px] before:tracking-[0.18em] before:text-zinc-400 dark:before:text-zinc-600 before:pt-[2px]">
          <span>
            VR for surgical training only (Shaunak's domain, Eyesi at $100K plus). Narrower
            market. Kept as a future module on the same platform.
          </span>
        </li>
        <li className="grid grid-cols-[1.5rem_1fr] gap-x-3 [counter-increment:idea] before:content-[counter(idea)] before:font-mono before:text-[11px] before:tracking-[0.18em] before:text-zinc-400 dark:before:text-zinc-600 before:pt-[2px]">
          <span>
            AI therapy chatbot with voice. Skipped due to regulatory complexity, crowded market
            (Woebot, Wysa), and our view that immersive VR plus biofeedback is a fundamentally
            different and more effective modality than text or voice.
          </span>
        </li>
        <li className="grid grid-cols-[1.5rem_1fr] gap-x-3 [counter-increment:idea] before:content-[counter(idea)] before:font-mono before:text-[11px] before:tracking-[0.18em] before:text-zinc-400 dark:before:text-zinc-600 before:pt-[2px]">
          <span>
            VR vision therapy (amblyopia, strabismus). Proven market with FDA precedent
            (Luminopia, NovaSight). We chose the harder bridge between vision science and mental
            health. Nobody else occupies that intersection.
          </span>
        </li>
      </ol>
    ),
  },
  { q: 'Have you formed any legal entity yet?', a: <p>No.</p> },
  { q: 'Have you taken any investment yet?', a: <p>No.</p> },
  { q: 'Are you currently fundraising?', a: <p>No.</p> },
  {
    q: 'What convinced you to apply to Y Combinator?',
    a: (
      <p>
        A YC event in Boston two weeks ago. Accepted founders said 50 percent got in pre-product,
        on the strength of team and idea. Anders texted Shaunak right then and there. A week
        later, working prototype. YC's healthcare portfolio (Nurx, Loyal) plus the "build
        something people want" ethos lines up with our approach. We are clinicians who see the
        gap daily, not technologists looking for a healthcare application.
      </p>
    ),
  },
  {
    q: 'How did you hear about Y Combinator?',
    a: <p>YC event in Boston, the YC podcast, and general awareness in the startup community.</p>,
  },
  { q: 'Batch preference', a: <p>Summer 2026.</p> },
]

export default function BlindSpotPage() {
  return (
    <main className="mx-auto max-w-[680px] px-6 py-14 sm:py-20">
      <div className="mb-14 sm:mb-20">
        <Link
          href="/lab"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          &larr; Lab
        </Link>
      </div>

      <section className="mb-14 sm:mb-20">
        <div className="relative aspect-[16/9] rounded-md overflow-hidden border border-zinc-100 dark:border-zinc-800/80 bg-zinc-950">
          <DepthHero
            src="/blind-spot/hero-depth-gray.mp4"
            poster="/blind-spot/hero-depth-voxel-poster.jpg"
          />
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500">
          Depth-Anything-V2 on a Quest 3 user. Drag to rotate. The system sees the body before it touches it.
        </p>
      </section>

      <header className="mb-16 sm:mb-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500 mb-6">
          Blind Spot &middot; YC Application &middot; S26
        </p>
        <h1 className="text-[34px] sm:text-[52px] font-semibold tracking-[-0.02em] leading-[1.04] text-zinc-900 dark:text-zinc-50 mb-6">
          VR therapy that adapts to your nervous system.
        </h1>
        <p className="text-[16px] sm:text-[17px] text-zinc-600 dark:text-zinc-400 leading-[1.55] max-w-[58ch]">
          Closed-loop biofeedback, EEG, heart rate, and eye gaze, that changes the VR session in
          real time. Built by a clinical psychologist and an ophthalmologist.
        </p>
      </header>

      <div className="mb-10 flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-900 dark:text-zinc-50">
          Application Answers
        </h2>
        <span className="font-mono text-[11px] tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
          {String(qas.length).padStart(2, '0')} fields
        </span>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
        {qas.map((item, i) => (
          <section key={i} className="py-10 sm:py-12 first:pt-8">
            <h3 className="text-[14px] sm:text-[15px] font-medium text-zinc-900 dark:text-zinc-50 leading-[1.4] mb-5 max-w-[54ch]">
              {item.q}
            </h3>
            <div className="text-[15px] sm:text-[16px] text-zinc-600 dark:text-zinc-400 leading-[1.65] space-y-5 max-w-[62ch]">
              {item.a}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-20 pt-8 border-t border-zinc-100 dark:border-zinc-800/80">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500">
          End of application &middot; Blind Spot &middot; 2026
        </p>
      </footer>
    </main>
  )
}
