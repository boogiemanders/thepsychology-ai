import type { Metadata } from 'next'
import Link from 'next/link'
import { VideoPlayer } from '@/components/ui/video-thumbnail-player'
import DepthHero from './depth-hero'
import { EditableArea, ResetEditsButton } from './editable-answer'

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
          built the working prototype with AI-assisted coding (Claude Code, VS Code); Muse S
          headband with real-time pipeline of EEG and heart rate through Python (muselsl, pylsl,
          websockets); and a Unity VR scene on Meta Quest 3, depicting a biofeedback orb that
          responds to the user's physiology live.
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
    a: <p>Open to a technical cofounder.</p>,
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
                  Users will be able to practice job interviews and public speaking with
                  biofeedback by using techniques in Acceptance and Commitment Therapy (ACT),
                  exposure (increasing difficulty/realism), and practicing coping skills in VR.
                  Imagine CBT + Toastmasters + body monitoring. By focusing on direct-to-consumer
                  wellness, no FDA is needed at this tier.
                </p>
              ),
            },
            {
              label: 'Next',
              title: 'Chronic pain, FDA pathway',
              body: (
                <p>
                  By creating tools for consumers and therapists to use, Blind Spot can build
                  evidence for its benefits and a case for FDA De Novo, which could then unlock
                  insurance reimbursement.
                </p>
              ),
            },
            {
              label: 'Later',
              title: 'PTSD, autism, depression, surgical training',
              body: (
                <p>
                  After getting approval with the largest market, we can build upon this engine
                  to expand to different modules. Eye gaze alone detects depression at 86 percent
                  accuracy in a single session. No other company has a stack that can specialize
                  across multiple diagnoses.
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
        Anders is in Boston with access to Harvard, MGH, and BU for clinical pilots and research
        partnerships. Shaunak is in Vermont, practicing ophthalmologist with surgical expertise and
        a Mass Eye and Ear fellowship still in his network. Post-YC, primary operations can move to
        NY for XR engineering talent and digital health investors. Pilot sites stay in Boston and
        Vermont.
      </p>
    ),
  },
  {
    q: 'How far along are you?',
    a: (
      <>
        <p>
          Working prototype demonstrating how a VR intervention can show benefits evidenced by
          live EEG and heart rate.
        </p>
        <p>Adjacent traction at thePsychology.ai (see revenue below).</p>
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
        No. Prototype stage. First real user test was 5/2/26. Video available as the demo
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
          Anders in his undergraduate, researched for three years of neuropsychology to find
          accommodative assessment/interventions for students with disabilities using a 10-minute
          task with eye gaze tracking technology. As he trained to become a clinical psychologist,
          he learned to treat thousands of patients with anxiety, PTSD, and chronic pain, yet
          noticed that no clinics were using technology to assist with diagnostics or
          interventions. It is a cultural norm to be spending hours flipping through pages of the
          diagnostic manual and copying and pasting text in intake forms. He still believes in
          human clinical judgment, and using technology to enhance it can help people spend their
          time on their values.
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
              Intellect (YC S21), and Muse are stuck within the app. Users have no scenarios to
              generalize their progress in. Bringing in VR can help users progress into more
              challenging scenarios at an appropriate pace.
            </span>
          </li>
          <li className="grid grid-cols-[1.5rem_1fr] gap-x-3 [counter-increment:cat] before:content-[counter(cat)] before:font-mono before:text-[11px] before:tracking-[0.18em] before:text-zinc-400 dark:before:text-zinc-600 before:pt-[2px]">
            <span>
              <strong>Therapy + VR = no feedback, no eye doctor, no range.</strong> AppliedVR
              (pain), EaseVRx (chronic pain, FDA-cleared), Floreo (autism), Amelia (exposure),
              and Limbix (shut down) all focus on one topic. We are aiming to help all topics
              available, which allows a larger addressable market. These companies are also
              using open-loops, meaning they are missing the user's live feedback. By adding
              biofeedback, we can add a closed-loop, which takes the user's live responses to
              increase the accuracy of interventions. Lastly, with an ophthalmologist, we can
              catch the eye strain that kills retention that other companies ignore.
            </span>
          </li>
          <li className="grid grid-cols-[1.5rem_1fr] gap-x-3 [counter-increment:cat] before:content-[counter(cat)] before:font-mono before:text-[11px] before:tracking-[0.18em] before:text-zinc-400 dark:before:text-zinc-600 before:pt-[2px]">
            <span>
              <strong>VR + eye tracking = no mental health.</strong> Vivid Vision, NovaSight, and
              Luminopia treat amblyopia. Not humans.
            </span>
          </li>
        </ul>
        <p>
          <strong>Why us?</strong> A clinical psychologist and an ophthalmologist can use
          psychotherapy, VR, and biofeedback to translate their clinical experience to treat
          mental, emotional, and physical health at a new level of understanding, speed, and
          scale that no individual clinician or piece of technology can do at the moment.
        </p>
        <p>
          <strong>How so?</strong> We can treat multiple diagnoses, use AI-assisted coding to
          develop new scenes appropriate for the user, adjust the level of exposure based off of
          biofeedback in real-time, and increase retention by reducing eye burnout. This
          combination could earn FDA, insurance compensation, and 50M users.
        </p>
      </>
    ),
  },
  {
    q: 'How do or will you make money? How much could you make?',
    a: (
      <>
        <p>
          Blind Spot could create value in six phases: D2C wellness, clinician SaaS, hospitals,
          enterprise wellness, FDA-cleared chronic pain, and later surgical simulation. Phases
          1-4 can potentially reach ~$118M ARR before FDA, when staying in wellness,
          clinician-controlled tools, research/innovation budgets, and workplace wellness. FDA
          becomes necessary to make specific claims about diagnosing and treating conditions and
          could open to $300M ARR.
        </p>
        <Roadmap
          phases={[
            {
              label: 'No FDA needed',
              title: 'D2C anxiety, stress, and performance wellness',
              body: (
                <p>
                  First phase is a VR wellness app for anxiety practice, stress control, public
                  speaking, social confidence, and performance pressure. At scale, 1% of 43M
                  anxiety-adjacent users at $20/month = $103M ARR. Growth starts through Anders'
                  organic psychology/AI content, VR communities, clinician referrals, creators,
                  and high-anxiety professionals. Paid CAC should stay around $40-$60.
                </p>
              ),
            },
            {
              label: 'Clinician-controlled, no FDA needed',
              title: 'B2B clinician SaaS',
              body: (
                <p>
                  Blind Spot sells to therapists as a $150/month clinician-controlled VR platform
                  for sessions, at-home practice, HRV/gaze tracking, progress tracking, and
                  insurance-ready notes; 1% of 50,000+ licensed psychologists = $900K ARR. This
                  may avoid FDA only if clinicians use it under their own license and informed
                  consent as a workflow, biofeedback, and support tool. thepsychology.ai workflow
                  automations can help clinicians choose protocols, summarize biofeedback, draft
                  notes, and save safety responses for panic, dissociation, cybersickness, or
                  trauma activation.
                </p>
              ),
            },
            {
              label: 'Innovation budgets, no FDA needed',
              title: 'Hospitals and health systems',
              body: (
                <p>
                  Blind Spot sells to hospitals as a VR platform for pain clinics, surgery prep,
                  oncology psychology, anxiety support, and integrated behavioral health. 1% of
                  roughly 700 health systems × $250K/year = $1.75M ARR. This may avoid FDA only
                  if sold first through innovation, research, and clinical workflow budgets
                  without disease-treatment claims. Hospital sales are slow, so the entry path is
                  paid pilots, research partnerships, innovation budgets, and clinical champions.
                </p>
              ),
            },
            {
              label: 'Workplace wellness, no FDA needed',
              title: 'Enterprise wellness',
              body: (
                <p>
                  Blind Spot sells to employers as a VR wellness benefit for stress, focus,
                  social confidence, anxiety support, and performance. 10 companies × 10,000
                  employees × $120/year = $12M ARR. This stays in workplace wellness, not medical
                  treatment, and becomes stronger after Blind Spot proves users engage, return,
                  feel safe, and keep using the product.
                </p>
              ),
            },
            {
              label: 'FDA De Novo required',
              title: 'FDA-cleared chronic pain',
              body: (
                <>
                  <p>
                    Blind Spot later expands into an FDA-cleared VR chronic pain product, likely
                    starting with chronic lower-back pain; if expanded across chronic pain over
                    time, 500K patients × $50/month = $300M ARR. The FDA path adds cost; the FY
                    2026 De Novo fee is $173,782, or $43,446 for a qualified small business, plus
                    the real cost of studies, regulatory work, quality systems, safety testing,
                    and documentation, likely $500K-$3M+ total.
                  </p>
                  <p>
                    FDA clearance can increase profit because Blind Spot can move from wellness
                    pricing to medical-device pricing, make treatment claims, get prescribed,
                    access payer reimbursement, and sell with more trust to hospitals and
                    providers. AppliedVR's RelieVRx shows this path exists for chronic lower-back
                    pain, but Blind Spot still needs product-specific studies, FDA clearance, and
                    payer adoption. At $300M ARR, profit could be roughly $60M-$180M/year
                    depending on whether net margin is 20%-60%.
                  </p>
                </>
              ),
            },
            {
              label: 'Side bet',
              title: 'VR surgical simulation',
              body: (
                <p>
                  Blind Spot can later expand into VR surgical simulation, especially
                  ophthalmology and eye-tracking-based training; Eyesi sells at $100K+ per
                  program. This fits Shaunak's strength as an ophthalmologist with VR and visual
                  safety experience, but it is not included in the base case.
                </p>
              ),
            },
          ]}
        />
        <div className="mt-4 overflow-hidden rounded-md border border-zinc-100 dark:border-zinc-800/80">
          <table className="w-full text-[14px]">
            <thead className="bg-zinc-50 dark:bg-zinc-900/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                  Phase
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                  Stream
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                  ARR potential
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              <tr>
                <td className="px-4 py-3 font-mono text-[12px] text-zinc-500 dark:text-zinc-500">01</td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">D2C wellness</td>
                <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">$103M</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-[12px] text-zinc-500 dark:text-zinc-500">02</td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">Clinician SaaS</td>
                <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">$900K</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-[12px] text-zinc-500 dark:text-zinc-500">03</td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">Hospitals</td>
                <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">$1.75M</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-[12px] text-zinc-500 dark:text-zinc-500">04</td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">Enterprise wellness</td>
                <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">$12M</td>
              </tr>
              <tr className="bg-zinc-50 dark:bg-zinc-900/40">
                <td className="px-4 py-3 font-mono text-[12px] text-zinc-500 dark:text-zinc-500">
                  Total
                </td>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  Phases 1-4 before FDA
                </td>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">~$118M</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-[12px] text-zinc-500 dark:text-zinc-500">05</td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  FDA-cleared chronic pain
                </td>
                <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">$300M upside</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-[12px] text-zinc-500 dark:text-zinc-500">06</td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">Surgical simulation</td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-500">Not included</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="pt-2">
          Bottom line: Blind Spot can potentially reach ~$118M ARR before FDA if it stays in
          wellness and clinician-controlled workflows. FDA clearance adds cost, but it can unlock
          the bigger $300M ARR chronic pain upside and raise profit by allowing medical claims,
          prescriptions, reimbursement, and higher-trust hospital/provider sales.
        </p>
        <p>
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
              <EditableArea
                as="h1"
                id="hero-h1"
                className="pointer-events-auto inline-block max-w-[18ch] text-[28px] sm:text-[44px] md:text-[56px] font-semibold tracking-[-0.02em] leading-[1.04] text-zinc-900 dark:text-zinc-50 outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700 rounded-sm"
              >
                VR Therapy That Adapts to Your Nervous System
              </EditableArea>
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
        <EditableArea
          as="p"
          id="intro"
          className="text-[16px] sm:text-[17px] text-zinc-600 dark:text-zinc-400 leading-[1.55] outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700 rounded-sm"
        >
          Most VR therapy plays a video at you. Ours reads your body and adapts. Built by a clinical
          psychologist and an ophthalmologist.
        </EditableArea>
      </header>

      <div className="mb-10 flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-900 dark:text-zinc-50">
          Application Answers
        </h2>
        <div className="flex items-baseline gap-x-5">
          <ResetEditsButton />
          <span className="font-mono text-[11px] tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            {String(qas.length).padStart(2, '0')} fields
          </span>
        </div>
      </div>
      <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
        Click any text to edit. Saved locally to your browser.
      </p>

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
            <EditableArea
              id={`a-${i}`}
              className="text-[15px] sm:text-[16px] text-zinc-600 dark:text-zinc-400 leading-[1.65] space-y-5 sm:col-span-8 outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700 rounded-sm"
            >
              {item.a}
            </EditableArea>
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
