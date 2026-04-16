import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Payroll Autofill | Inzinna Lab',
  description: 'SimplePractice CSV to JustWorks time cards. Calculates per-clinician pay, adjusts hourly rates, fills time cards automatically.',
}

const clinicians = [
  { name: 'LMSW (flat rate)', type: 'Flat per session', examplePay: 500, exampleHours: 8.5, exampleRate: 58.48 },
  { name: 'LMSW (flat rate)', type: 'Flat per session', examplePay: 450, exampleHours: 7.5, exampleRate: 60.00 },
  { name: 'Licensed Psychologist', type: 'CPT-based rates', examplePay: 625, exampleHours: 9.0, exampleRate: 69.44 },
  { name: 'Licensed Psychologist', type: 'CPT-based rates', examplePay: 1200, exampleHours: 15.0, exampleRate: 80.00 },
  { name: 'Limited Permit', type: 'CPT-based rates', examplePay: 1350, exampleHours: 18.0, exampleRate: 75.00 },
  { name: 'Licensed Psychologist + Supervisor', type: '80% of billed + 5% of supervisee totals', examplePay: 4200, exampleHours: 32.0, exampleRate: 131.25 },
]

const steps = [
  { num: '01', title: 'Export CSV', desc: 'Pull the appointment status report from SimplePractice.' },
  { num: '02', title: 'Upload to Extension', desc: 'Click the brain icon in Chrome, drop in the CSV.' },
  { num: '03', title: 'Tag Insurance', desc: 'For payer-dependent clinicians, pick each patient\'s insurance. Remembered across payroll runs.' },
  { num: '04', title: 'Add Pending Sessions', desc: 'Pre-fill expected sessions not yet in the CSV (e.g. Friday mornings). Confirm or mark no-show later.' },
  { num: '05', title: 'Review Totals', desc: 'See per-clinician pay, adjusted hourly rate, daily hours breakdown.' },
  { num: '06', title: 'Fill JustWorks', desc: 'Navigate to each time card, click Fill. Rate and hours auto-populate.' },
  { num: '07', title: 'Verify', desc: 'Extension checks the JustWorks pay total matches. Green = exact.' },
]

const insuranceMock = [
  { client: 'Amara Osei', ins: 'united' as const },
  { client: 'Sinjun Strom', ins: 'aetna' as const },
  { client: 'T. Mendez', ins: 'united' as const },
  { client: 'Kev Lynch', ins: null },
]

const pendingMock = [
  { date: 'Fri 4/18', client: 'Hana P.', code: '90837', status: 'completed' as const },
  { date: 'Fri 4/18', client: 'Jesse R.', code: '90834', status: 'pending' as const },
  { date: 'Fri 4/18', client: 'Morgan D.', code: '90837', status: 'no-show' as const },
]

const statusColors = {
  pending:   { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  completed: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  'no-show': { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
}

function StatusPill({ status, label, active }: { status: keyof typeof statusColors; label: string; active: boolean }) {
  const c = statusColors[status]
  return (
    <span className={`
      inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-mono font-semibold
      ${active ? `${c.bg} ${c.text} ${c.border} border` : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-700'}
    `}>
      {label}
    </span>
  )
}

export default function PayrollPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Back link */}
        <Link
          href="/lab#projects"
          className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-12"
        >
          &larr; Lab
        </Link>

        {/* Header */}
        <div className="mb-16">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-3">
            Inzinna Practice Automation
          </p>
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Payroll Autofill
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl">
            Turns a SimplePractice CSV export into JustWorks-ready time cards.
            Calculates actual session hours from billing codes, computes an adjusted
            hourly rate so the math lands exactly, and fills the time card fields.
          </p>
        </div>

        {/* How it works */}
        <section className="mb-16">
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-8">
            How It Works
          </h2>
          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.num} className="flex gap-4">
                <span className="text-xs font-mono text-zinc-300 dark:text-zinc-700 mt-0.5 shrink-0">
                  {step.num}
                </span>
                <div>
                  <p className="text-sm font-medium mb-0.5">{step.title}</p>
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Insurance per patient — Bret */}
        <section className="mb-16">
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-4">
            Insurance Tagging
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            Payer-dependent clinicians get paid differently based on the patient's insurance.
            The CSV doesn't include payer info, so the extension lets you tag each patient once.
            It remembers your picks across payroll runs.
          </p>

          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            {/* Mock card header */}
            <div className="px-5 pt-4 pb-3 border-b border-zinc-200 dark:border-zinc-800 flex items-baseline justify-between">
              <div className="flex items-baseline gap-3">
                <span className="text-sm font-semibold">Bret Boatwright</span>
                <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 text-zinc-500">
                  80% of billing
                </span>
              </div>
              <span className="text-sm font-mono font-semibold text-sky-600 dark:text-sky-400">$4,200.00</span>
            </div>

            {/* Insurance list */}
            <div className="px-5 py-4">
              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 mb-3">
                Insurance per client
              </p>
              <div className="space-y-2">
                {insuranceMock.map((row) => (
                  <div key={row.client} className="flex items-center gap-3">
                    <span className="flex-1 text-[13px] text-zinc-700 dark:text-zinc-300 truncate">
                      {row.client}
                    </span>
                    <span className="inline-flex gap-0.5">
                      <span className={`
                        inline-block text-[10.5px] px-2.5 py-0.5 rounded-l border font-medium
                        ${row.ins === 'united'
                          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                          : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                        }
                      `}>
                        United
                      </span>
                      <span className={`
                        inline-block text-[10.5px] px-2.5 py-0.5 rounded-r border font-medium
                        ${row.ins === 'aetna'
                          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                          : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                        }
                      `}>
                        Aetna
                      </span>
                    </span>
                    {!row.ins && (
                      <span className="text-[9.5px] font-mono bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
                        pick insurance
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic mt-3">
                Selections persist across payroll runs. New patients show up untagged.
              </p>
            </div>
          </div>
        </section>

        {/* Pending Friday sessions — Emily */}
        <section className="mb-16">
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-4">
            Pending Sessions
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2">
            Payroll runs Friday morning. Some clinicians still have sessions that afternoon.
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            Pre-fill expected sessions as placeholders. At end of day, confirm each one or mark it no-show.
            Pay adjusts automatically.
          </p>

          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            {/* Mock card header */}
            <div className="px-5 pt-4 pb-3 border-b border-zinc-200 dark:border-zinc-800 flex items-baseline justify-between">
              <div className="flex items-baseline gap-3">
                <span className="text-sm font-semibold">Emily Underwood</span>
                <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 text-zinc-500">
                  CPT-based
                </span>
              </div>
              <span className="text-sm font-mono font-semibold text-sky-600 dark:text-sky-400">$1,080.00</span>
            </div>

            <div className="px-5 py-4">
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                  Pending Sessions
                </p>
                <span className="text-[11.5px] font-mono font-semibold">$200.00</span>
              </div>

              <div className="space-y-2">
                {pendingMock.map((row, i) => {
                  const sc = statusColors[row.status]
                  return (
                    <div key={i} className={`
                      flex items-center gap-2 rounded border px-3 py-2
                      ${row.status === 'no-show'
                        ? `${sc.bg} ${sc.border}`
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                      }
                    `}>
                      <span className="text-[10.5px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0 w-16">
                        {row.date}
                      </span>
                      <span className="flex-1 text-[13px] text-zinc-700 dark:text-zinc-300 truncate">
                        {row.client}
                      </span>
                      <span className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 shrink-0">
                        {row.code}
                      </span>
                      <span className="inline-flex gap-0.5 shrink-0">
                        <StatusPill status="pending" label="P" active={row.status === 'pending'} />
                        <StatusPill status="completed" label="C" active={row.status === 'completed'} />
                        <StatusPill status="no-show" label="N" active={row.status === 'no-show'} />
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Add button mock */}
              <div className="mt-3 border border-dashed border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 text-center">
                <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500">+ add pending session</span>
              </div>

              {/* Legend */}
              <div className="mt-4 flex gap-4 text-[10px] text-zinc-400 dark:text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <StatusPill status="pending" label="P" active={true} />
                  Counts at full rate
                </span>
                <span className="flex items-center gap-1.5">
                  <StatusPill status="completed" label="C" active={true} />
                  Confirmed
                </span>
                <span className="flex items-center gap-1.5">
                  <StatusPill status="no-show" label="N" active={true} />
                  No-show rate ($40)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* The Math */}
        <section className="mb-16">
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-4">
            The Math
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            JustWorks only understands hourly rate x hours. Clinician pay is per-session. The extension finds the hourly rate that makes JustWorks arrive at the correct total.
          </p>

          {/* Worked example */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">Example: one clinician, one week</p>
            </div>
            <div className="p-5 space-y-6">
              {/* Step 1: Sessions at different rates */}
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500 mb-2">From SimplePractice -- every session pays differently</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2">
                    <span>Mon -- 90837 (60 min)</span>
                    <span className="font-medium text-sky-600 dark:text-sky-400">$75</span>
                  </div>
                  <div className="flex justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2">
                    <span>Mon -- 90834 (45 min)</span>
                    <span className="font-medium text-sky-600 dark:text-sky-400">$65</span>
                  </div>
                  <div className="flex justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2">
                    <span>Wed -- 90791 (60 min)</span>
                    <span className="font-medium text-sky-600 dark:text-sky-400">$80</span>
                  </div>
                  <div className="flex justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2">
                    <span>Wed -- 90837 (60 min)</span>
                    <span className="font-medium text-sky-600 dark:text-sky-400">$75</span>
                  </div>
                  <div className="flex justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2">
                    <span>Fri -- 90832 (30 min)</span>
                    <span className="font-medium text-sky-600 dark:text-sky-400">$50</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Manual adjustment */}
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500 mb-2">Manual adjustment -- not in SimplePractice</p>
                <div className="flex justify-between bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded px-3 py-2 text-sm">
                  <span>Didactics (1 hr)</span>
                  <span className="font-medium text-sky-600 dark:text-sky-400">+ $75</span>
                </div>
              </div>

              {/* Step 3: The problem */}
              <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded px-4 py-3 text-[13px] text-zinc-600 dark:text-zinc-400">
                5 sessions + 1 manual entry = 6 line items at 5 different rates.
                <br />JustWorks only has <span className="font-semibold text-zinc-900 dark:text-zinc-100">one hourly rate</span> field.
              </div>

              {/* Step 4: The solve */}
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500 mb-2">The solve</p>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex-1 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-3">
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-1">Total Pay</p>
                    <p className="text-lg font-bold text-sky-600 dark:text-sky-400">$420</p>
                    <p className="text-[10px] text-zinc-400">all rates combined</p>
                  </div>
                  <span className="text-zinc-300 dark:text-zinc-700 text-lg shrink-0">/</span>
                  <div className="flex-1 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-3">
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-1">Actual Hours</p>
                    <p className="text-lg font-bold">5h 15m</p>
                    <p className="text-[10px] text-zinc-400">real time worked</p>
                  </div>
                  <span className="text-zinc-300 dark:text-zinc-700 text-lg shrink-0">=</span>
                  <div className="flex-1 text-center bg-white dark:bg-zinc-900 border border-sky-300 dark:border-sky-700 rounded px-3 py-3">
                    <p className="text-[10px] text-sky-500 dark:text-sky-400 mb-1">JW Rate</p>
                    <p className="text-lg font-bold text-sky-600 dark:text-sky-400">$80.00/hr</p>
                    <p className="text-[10px] text-zinc-400">changes weekly</p>
                  </div>
                </div>
              </div>

              {/* Step 5: What JustWorks sees */}
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500 mb-2">What JustWorks sees</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-center">
                    <p className="text-[10px] text-zinc-400">Mon</p>
                    <p className="font-medium">1h 45m</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-center">
                    <p className="text-[10px] text-zinc-400">Wed</p>
                    <p className="font-medium">2h 00m</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-center">
                    <p className="text-[10px] text-zinc-400">Fri</p>
                    <p className="font-medium">1h 30m</p>
                  </div>
                </div>
              </div>

              {/* Result */}
              <div className="bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded px-4 py-3">
                <p className="text-sm text-sky-800 dark:text-sky-300">
                  $80.00/hr x 5.25h = <span className="font-bold">$420.00</span> -- exact match.
                </p>
                <p className="text-xs text-sky-600 dark:text-sky-400 mt-1">
                  Real hours on the right days. One rate that makes the total land. Adjusted each week.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Example rates */}
        <section className="mb-16">
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-6">
            Example Output
          </h2>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-left text-[11px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  <th className="px-4 py-3">Clinician</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Total Pay</th>
                  <th className="px-4 py-3 text-right">Hours</th>
                  <th className="px-4 py-3 text-right">JW Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {clinicians.map((c, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{c.type}</td>
                    <td className="px-4 py-3 text-right text-sky-600 dark:text-sky-400 font-medium">
                      ${c.examplePay.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-500">{c.exampleHours}h</td>
                    <td className="px-4 py-3 text-right font-mono text-sky-600 dark:text-sky-400">
                      ${c.exampleRate.toFixed(2)}/hr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2">
            Sample data. Actual rates come from the compensation legend and SimplePractice CSV.
          </p>
        </section>

        {/* Install */}
        <section className="mb-16">
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-4">
            Install
          </h2>
          <div className="space-y-3 text-[13px] text-zinc-600 dark:text-zinc-400">
            <p>1. Open <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">chrome://extensions</code></p>
            <p>2. Enable Developer Mode (top right)</p>
            <p>3. Click Load Unpacked</p>
            <p>4. Select the <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">dist/</code> folder from the extension build</p>
          </div>
        </section>

        {/* Status */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400 dark:bg-amber-500" />
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
              Testing
            </span>
          </div>
          <p className="text-[13px] text-zinc-400 dark:text-zinc-500 mt-2">
            Running in parallel with manual payroll for 2-3 cycles. Target: production-ready by July 2026.
          </p>
        </div>
      </div>
    </div>
  )
}
