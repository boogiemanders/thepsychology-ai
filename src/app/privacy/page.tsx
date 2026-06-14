import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What thePsychology.ai collects, how we use it, and what we never do with your data.",
  alternates: {
    canonical: "/privacy",
  },
}

const SUPPORT_EMAIL = "DrChan@thepsychology.ai"

export default function PrivacyPolicyPage() {
  return (
    <main className="w-full px-6 py-16">
      <div className="mx-auto w-full max-w-2xl space-y-12">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">
            Effective June 10, 2026
          </p>
        </header>

        <section className="rounded-xl border border-border bg-accent/40 p-5">
          <p className="text-sm text-muted-foreground">
            The short version: we collect what we need to run your account and
            track your study progress. We never sell it. And because this is an
            exam prep tool, not a clinical tool, we store zero patient or
            client information.
          </p>
        </section>

        <div className="space-y-12 text-[15px] leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              What we collect
            </h2>
            <p>
              <span className="font-medium text-foreground">Account info.</span>{" "}
              Your email, your name, and your password. The password is stored
              hashed by Supabase, our login provider. We never see it.
            </p>
            <p>
              <span className="font-medium text-foreground">
                How you found us.
              </span>{" "}
              Your answer to &ldquo;how did you hear about us,&rdquo; referral
              codes, and the campaign tags on the link you clicked to get here.
              We also note whether you signed up on a phone or a computer.
            </p>
            <p>
              <span className="font-medium text-foreground">Study data.</span>{" "}
              Practice exam history, question attempts, quiz scores, study
              progress, the topics you say you are interested in, your language
              preference, and any custom audio lessons you generate. This is
              study-progress data about you as a test taker. It is not health
              data.
            </p>
            <p>
              <span className="font-medium text-foreground">Usage.</span> Which
              pages you visit inside the app and when you were last active, so
              we can see what is useful and what is broken.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              How we use it
            </h2>
            <p>
              To run your account, save your progress, personalize your lessons
              and audio, fix bugs, see which marketing actually works, and send
              you emails that matter. When you sign up, we also get a small
              internal notification (your name, email, and signup date) so a
              human knows you joined. That is it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              What we never do
            </h2>
            <p>
              We never sell your data. We never hand it to advertisers or data
              brokers.
            </p>
            <p>
              We never store patient or client information. This product helps
              psychologists pass the EPPP. It holds no therapy records, no
              client names, no clinical documentation, nothing covered by
              HIPAA. There is no patient data here because there are no
              patients here.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Payments</h2>
            <p>
              Stripe handles all payments. Your card number never touches our
              servers. We keep your subscription status and Stripe&rsquo;s
              reference ID for your account, nothing more.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              Analytics and cookies
            </h2>
            <p>
              We use Google Analytics 4 to count visits and see which pages
              people use. It sets cookies and records the pages you view and
              roughly where traffic comes from. When you are signed in, we
              connect that activity to a random account ID (never your name or
              email) so we can see the path from a first visit to signing up or
              subscribing. We also tell Google when someone starts checkout or
              buys a subscription, including the amount paid, so we can measure
              how well the site works. We never send Google your name, email, or
              card details. We also use cookies to keep you logged in. No ad
              trackers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Emails</h2>
            <p>
              We send account emails (password resets, receipts) and occasional
              study nudges, delivered through Resend. Want fewer emails? You
              can turn off marketing communications in your in-app consent
              settings, or email us and we will stop. Account emails like
              password resets still arrive because you need them.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              Research, only if you opt in
            </h2>
            <p>
              You can choose to contribute your study data to research on how
              people prepare for licensure exams. If you do, your data is
              exported under an anonymized research ID that is never linked to
              your name or email. You can change this choice in your consent
              settings at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              Retention and deletion
            </h2>
            <p>
              We keep your data while your account is active. Want it gone?
              Email{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary underline underline-offset-4"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              and we will delete your account and study data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              Third-party services
            </h2>
            <p>These are the only services that touch your data:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <span className="font-medium text-foreground">Supabase</span>:
                database and login.
              </li>
              <li>
                <span className="font-medium text-foreground">Stripe</span>:
                payments.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Google Analytics
                </span>
                : usage and conversion measurement (receives a random account
                ID, never your name or email).
              </li>
              <li>
                <span className="font-medium text-foreground">Resend</span>:
                email delivery.
              </li>
              <li>
                <span className="font-medium text-foreground">Vercel</span>:
                hosting.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Cloudflare R2
                </span>
                : stores the audio lesson files you generate.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  OpenAI and Anthropic
                </span>
                : power the AI lessons, practice questions, audio, and study
                plans. They receive the study content needed to generate those,
                never your name, email, or payment details.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              Changes to this policy
            </h2>
            <p>
              If we change how we handle your data, we will update this page
              and the date at the top.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              Questions?
            </h2>
            <p>
              Email{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary underline underline-offset-4"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>

        <footer className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            This policy covers the thePsychology.ai website and app.
          </p>
        </footer>
      </div>
    </main>
  )
}
