"use client";

import { AnimatedThemeToggler } from "./animated-theme-toggler";
import { Breadcrumb } from "./Breadcrumb";

const LAB_URL = process.env.NODE_ENV === "development" ? "http://localhost:3002/lab" : "/lab";

interface SurveyLayoutProps {
  title: string;
  description?: string;
  currentStep?: number;
  totalSteps?: number;
  children: React.ReactNode;
}

export function SurveyLayout({
  title,
  description,
  currentStep,
  totalSteps,
  children,
}: SurveyLayoutProps) {
  const progress = currentStep && totalSteps ? (currentStep / totalSteps) * 100 : null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--background)] border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Breadcrumb
              items={[
                { label: "Lab", href: LAB_URL },
                { label: "DIPS", href: "/" },
                { label: title },
              ]}
            />
            <AnimatedThemeToggler />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h1 className="text-lg font-semibold">{title}</h1>
              {description && (
                <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
              )}
            </div>
            {currentStep && totalSteps && (
              <span className="text-sm text-[var(--muted-foreground)]">
                Step {currentStep} of {totalSteps}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {progress !== null && (
            <div className="mt-4 progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="form-section">
      {title && <h2 className="text-lg font-semibold mb-1">{title}</h2>}
      {description && (
        <p className="text-sm text-[var(--muted-foreground)] mb-4">{description}</p>
      )}
      {children}
    </section>
  );
}

export function FormField({
  label,
  sublabel,
  required,
  error,
  children,
}: {
  label: string;
  sublabel?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="form-label">
        {label}
        {required && <span className="text-[var(--error)] ml-1">*</span>}
      </label>
      {sublabel && <span className="form-sublabel">{sublabel}</span>}
      {children}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

export function NavigationButtons({
  onBack,
  onNext,
  onSubmit,
  backLabel = "Back",
  nextLabel = "Next",
  submitLabel = "Submit",
  isSubmitting = false,
  canProceed = true,
  showBack = true,
  isLastStep = false,
}: {
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  backLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  canProceed?: boolean;
  showBack?: boolean;
  isLastStep?: boolean;
}) {
  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-[var(--border)]">
      {showBack && onBack ? (
        <button type="button" onClick={onBack} className="btn btn-secondary">
          {backLabel}
        </button>
      ) : (
        <div />
      )}

      {isLastStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canProceed || isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? "Submitting..." : submitLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="btn btn-primary"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}
