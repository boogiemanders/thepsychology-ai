"use client";

import { Clock, ClipboardList, Users, UserCheck, Heart } from "lucide-react";
import Link from "next/link";
import { SURVEYS } from "@/lib/survey-config";
import { AnimatedThemeToggler } from "@/components/animated-theme-toggler";
import { Breadcrumb } from "@/components/Breadcrumb";

const LAB_URL = process.env.NODE_ENV === "development" ? "http://localhost:3002/lab" : "/lab";

export default function DIPSLanding() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-4">
            <Breadcrumb
              items={[
                { label: "Lab", href: LAB_URL },
                { label: "DIPS" },
              ]}
            />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "var(--primary)" }}
            >
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">DIPS Survey Tool</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Dr. Inzinna Psychological Services
              </p>
            </div>
            <AnimatedThemeToggler />
          </div>
          <p className="text-[var(--muted-foreground)] max-w-2xl">
            AI Clinical Training Tool Evaluation Surveys. Help us understand training needs
            and attitudes toward AI-assisted learning tools for psychology trainees.
          </p>
        </div>
      </header>

      {/* Survey Cards */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold mb-6">Select a Survey</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Trainee Survey */}
          <Link href="/trainee" className="survey-card">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: SURVEYS.trainee.color }}
              >
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="card-title text-base">{SURVEYS.trainee.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {SURVEYS.trainee.description}
                </p>
                <div className="flex items-center gap-1 mt-3 text-xs text-[var(--muted-foreground)]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{SURVEYS.trainee.duration}</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Supervisor Survey */}
          <Link href="/supervisor" className="survey-card">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: SURVEYS.supervisor.color }}
              >
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="card-title text-base">{SURVEYS.supervisor.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {SURVEYS.supervisor.description}
                </p>
                <div className="flex items-center gap-1 mt-3 text-xs text-[var(--muted-foreground)]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{SURVEYS.supervisor.duration}</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Per-Trainee Rating */}
          <Link href="/rating" className="survey-card">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: SURVEYS.rating.color }}
              >
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="card-title text-base">{SURVEYS.rating.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {SURVEYS.rating.description}
                </p>
                <div className="flex items-center gap-1 mt-3 text-xs text-[var(--muted-foreground)]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{SURVEYS.rating.duration}</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Patient Check-In */}
          <Link href="/patient" className="survey-card">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: SURVEYS.patient.color }}
              >
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="card-title text-base">{SURVEYS.patient.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {SURVEYS.patient.description}
                </p>
                <div className="flex items-center gap-1 mt-3 text-xs text-[var(--muted-foreground)]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{SURVEYS.patient.duration}</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer info */}
        <div className="mt-12 pt-8 border-t border-[var(--border)]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-[var(--muted-foreground)]">
            <div className="flex items-center gap-2">
              <span className="font-medium">Collaboration:</span>
              <span>Dr. Inzinna Psychological Services + thepsychology.ai</span>
            </div>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-4">
            Your responses are confidential and will be used for research purposes only.
            Participant IDs are optional and used only for longitudinal tracking.
          </p>
        </div>
      </main>
    </div>
  );
}
