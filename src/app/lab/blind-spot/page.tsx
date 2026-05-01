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
    a: <p>Open to a technical cofounder/CTO.</p>,
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
          Saturday's user test. Tamilyn wears Quest 3 plus Muse S. The orb expands and shifts red
          to green as her heart rate drops. Forest scene. Real EEG and HR streaming live.
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
          Working prototype on Quest 3. Muse S streams EEG and HR via Lab Streaming Layer into
          Unity. Biofeedback orb responds live. First user test Saturday.
        </p>
        <p>Next: eye-tracking integration and therapist dashboard.</p>
        <p>Adjacent traction at thepsychology.ai (see revenue below).</p>
      </>
    ),
  },
  {
    q: 'How long have each of you been working on this? How much of that has been full-time?',
    a: (
      <>
        <p>
          Anders: 7 months full-time on thepsychology.ai. 1 month part-time on the VR prototype. 6+
          years clinical (chronic pain, anxiety, PTSD, substance use, gender health) at UCLA, NYU,
          Brooklyn outpatient. Three years eye-gaze tracking research at SUNY Old Westbury
          (2015-2018), validating eye tracking for accommodative interventions in students with
          disabilities. ACT chronic pain groups with sickle cell patients at Ronald Reagan UCLA.
        </p>
        <p>
          Shaunak: 6+ years on the MedVR Symposium. 2 years in Mass Eye and Ear's Disruptive
          Technology Lab. 1 week ramped on this prototype.
        </p>
        <p>Both employed full-time clinically. Going full-time when funded.</p>
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
          Not from Blind Spot. Anders' adjacent product, thepsychology.ai, makes $300 MRR teaching
          postdocs to pass the EPPP licensure exam. 4 have passed.
        </p>
        <p>
          Same brand runs an intake, scheduling, insurance verification, and payroll pipeline for
          Inzinna Therapy Group. Paid contract. Proves we can build, sell, and retain.
        </p>
      </>
    ),
  },
  {
    q: "Why did you pick this idea to work on? Do you have domain expertise in this area? How do you know people need what you're making?",
    a: (
      <>
        <p>We're both clinicians who see the gap every day.</p>
        <p>
          Anders has treated thousands of patients with anxiety, PTSD, and chronic pain. Before
          clinical training, three years of eye-gaze tracking neuropsychology research at SUNY Old
          Westbury (2015-2018), validating eye tracking for accommodative interventions in students
          with disabilities. The eye-tracking thesis isn't a bet. It's a return.
        </p>
        <p>
          Shaunak is an ophthalmologist (Harvard MD, Mass Eye and Ear cornea/refractive
          fellowship). Six years co-founding the MedVR Symposium. He didn't wait for VR to come to
          ophthalmology. He's been building that field.
        </p>
        <p>
          The clinical limitation is obvious to both of us. VR exposure has no idea if the patient
          is actually anxious. Biofeedback creates no immersive context. The two have to be one
          system. Consumer EEG and AI coding tools finally made it buildable by clinicians.
        </p>
        <p>Nobody integrates the biofeedback loop into session content.</p>
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
        <p>Everyone picks two. Nobody picks all three.</p>
        <ul className="space-y-3 list-none [counter-reset:cat]">
          <li className="grid grid-cols-[1.5rem_1fr] gap-x-3 [counter-increment:cat] before:content-[counter(cat)] before:font-mono before:text-[11px] before:tracking-[0.18em] before:text-zinc-400 dark:before:text-zinc-600 before:pt-[2px]">
            <span>
              <strong>Therapy + biofeedback = no exposure.</strong> Meru Health (YC S18),
              Intellect (YC S21), Muse, HeartMath. No scenarios to practice in. Skill never
              leaves the app.
            </span>
          </li>
          <li className="grid grid-cols-[1.5rem_1fr] gap-x-3 [counter-increment:cat] before:content-[counter(cat)] before:font-mono before:text-[11px] before:tracking-[0.18em] before:text-zinc-400 dark:before:text-zinc-600 before:pt-[2px]">
            <span>
              <strong>Therapy + VR = no feedback, no eye doctor, no range.</strong> AppliedVR
              (pain only), Floreo (autism only), Amelia (exposure only), Limbix (shut down).
              Nobody knows what's working live. No ophthalmologist to catch the eye strain that
              kills retention. Real people walk in with more than one diagnosis and more than one
              identity. One-trick ponies don't scale.
            </span>
          </li>
          <li className="grid grid-cols-[1.5rem_1fr] gap-x-3 [counter-increment:cat] before:content-[counter(cat)] before:font-mono before:text-[11px] before:tracking-[0.18em] before:text-zinc-400 dark:before:text-zinc-600 before:pt-[2px]">
            <span>
              <strong>VR + eye tracking = no mental health.</strong> Vivid Vision, NovaSight,
              Luminopia. Treats amblyopia. Not humans.
            </span>
          </li>
        </ul>
        <p>
          <strong>So what.</strong> Bringing psychotherapy, VR, and biofeedback together treats
          mental, emotional, and physical health at a new level of understanding, speed, and
          scale. That earns FDA, insurance reimbursement, and 50M patients.
        </p>
        <p>
          <strong>Why us.</strong> A clinical psychologist and an ophthalmologist are the only
          team that can translate that clinical experience into VR scenes that handle every
          diagnosis a real human walks in with, keep patients in the headset without burning
          their eyes out, and adapt live. AI ships it in days, not years.
        </p>
      </>
    ),
  },
  {
    q: 'How do or will you make money? How much could you make?',
    a: (
      <>
        <p>Path to $100M+ ARR.</p>
        <Roadmap
          phases={[
            {
              label: 'Year 1, no FDA needed',
              title: 'D2C anxiety subscription',
              body: (
                <p>
                  43M Americans report social anxiety. 1% capture = 430K users. $20/mo = $103M
                  ARR.
                </p>
              ),
            },
            {
              label: 'Year 1-2',
              title: 'B2B clinician SaaS',
              body: (
                <p>
                  50,000+ licensed psychologists in the US. They get a VR therapy platform plus
                  an outcome dashboard: run sessions in-office, send patients home with assigned
                  protocols, track HRV and gaze data between visits, auto-generate
                  insurance-ready notes. 1% capture = 500 clinicians. $150/mo = $900K ARR. Stacks
                  on D2C.
                </p>
              ),
            },
            {
              label: 'Year 2-3, no FDA needed',
              title: 'Hospitals',
              body: (
                <p>
                  ~6,000 hospitals in the US, consolidated into ~700 health systems (Mass General
                  Brigham, Cleveland Clinic, Kaiser). Average system spends $250K+ per year on
                  clinical software. 1% capture = 7 systems × $250K = $1.75M ARR. Bought under
                  innovation and research budgets, no reimbursement required. Pain clinics,
                  surgery prep, oncology psych, integrated behavioral health.
                </p>
              ),
            },
            {
              label: 'Year 2-3',
              title: 'Enterprise wellness',
              body: (
                <p>
                  $60B+ US corporate wellness market. ~1,000 Fortune 1000 companies buy mental
                  health benefits the same way they buy Calm or Headspace. Average ~10,000
                  employees × $120/year per employee = $1.2M per company. 1% capture = 10
                  companies × $1.2M = $12M ARR.
                </p>
              ),
            },
            {
              label: 'Year 3+, the long shot',
              title: 'FDA clearance for chronic pain',
              body: (
                <>
                  <p>
                    Chronic pain costs the US $635B per year. 50M Americans live with it. That
                    is $12,700 per patient per year in current healthcare costs. AppliedVR's
                    RelieVRx is already FDA-cleared and reimbursed by Medicare and some
                    commercial payers, so the path exists. With FDA clearance and the 122 RCTs
                    already backing VR for chronic pain, 1% capture = 500K patients. At $50/mo =
                    $300M ARR.
                  </p>
                  <p>
                    Honest caveat: only 17.6% of providers can currently bill for VR services
                    [OE research]. We treat this as upside, not base case.
                  </p>
                </>
              ),
            },
            {
              label: 'Later',
              title: 'VR surgical simulation',
              body: (
                <p>Eyesi sells at $100K+ per program. Shaunak's domain.</p>
              ),
            },
          ]}
        />
        <p className="pt-2">
          Phases 1-4 stack to ~$118M ARR without FDA. Phase 5 is the lottery ticket. Phase 6 is
          the side bet.
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
      <>
        <p>
          A YC event in Boston two weeks ago. Accepted founders said 50 percent got in pre-product
          on the strength of team and idea. Anders texted Shaunak immediately. A week later, made a
          working prototype.
        </p>
        <p>
          A psychologist with eye-tracking research and an ophthalmologist who has been organizing
          healthcare VR/AR for six years is the kind of domain-expert founding team YC backs in
          healthcare. Meru Health (S18) and Intellect (S21) show the pattern. We're clinicians who
          see the gap daily, not technologists looking for a healthcare application.
        </p>
      </>
    ),
  },
  {
    q: 'How did you hear about Y Combinator?',
    a: <p>YC event in Boston, YC podcast, and general awareness in the startup community.</p>,
  },
  { q: 'Batch preference', a: <p>Summer 2026.</p> },
]

export default function BlindSpotPage() {
  return (
    <main className="py-14 sm:py-20">
      <div className="mx-auto max-w-[1080px] px-6 mb-14 sm:mb-20">
        <Link
          href="/lab"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          &larr; Lab
        </Link>
      </div>

      <section className="mb-14 sm:mb-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <div className="relative aspect-[16/9] rounded-md overflow-hidden border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900">
            <DepthHero
              src="/blind-spot/hero-depth-gray.mp4"
              poster="/blind-spot/hero-depth-voxel-poster.jpg"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-6 sm:bottom-10 px-6 sm:px-10">
              <h1 className="max-w-[18ch] text-[28px] sm:text-[44px] md:text-[56px] font-semibold tracking-[-0.02em] leading-[1.04] text-zinc-900 dark:text-zinc-50">
                VR Therapy That Adapts to Your Nervous System
              </h1>
            </div>
          </div>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500">
            Drag to rotate
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1080px] px-6">

      <header className="mb-16 sm:mb-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500 mb-6">
          Blind Spot &middot; YC Application &middot; S26
        </p>
        <p className="text-[16px] sm:text-[17px] text-zinc-600 dark:text-zinc-400 leading-[1.55]">
          Most VR therapy plays a video at you. Ours reads your body and adapts. Built by a clinical
          psychologist and an ophthalmologist.
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
          <section
            key={i}
            className="grid grid-cols-1 gap-y-5 py-10 first:pt-8 sm:grid-cols-12 sm:gap-x-10 sm:py-14"
          >
            <div className="sm:col-span-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600 mb-3">
                {String(i + 1).padStart(2, '0')} / {String(qas.length).padStart(2, '0')}
              </div>
              <h3 className="text-[14px] sm:text-[15px] font-medium text-zinc-900 dark:text-zinc-50 leading-[1.4]">
                {item.q}
              </h3>
            </div>
            <div className="text-[15px] sm:text-[16px] text-zinc-600 dark:text-zinc-400 leading-[1.65] space-y-5 sm:col-span-8">
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
      </div>
    </main>
  )
}
