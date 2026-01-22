"use client";

import { useState } from "react";
import { SurveyLayout, FormSection, FormField, NavigationButtons } from "@/components/SurveyLayout";
import { Dropdown } from "@/components/Dropdown";
import { TextArea } from "@/components/TextArea";
import { LikertScale } from "@/components/LikertScale";
import { SuccessMessage } from "@/components/SuccessMessage";
import {
  AI_POLICY_OPTIONS,
  SUPERVISOR_IMPACT_ITEMS,
  LIKERT_5_LABELS,
} from "@/lib/survey-config";

const TOTAL_STEPS = 3;

const SUPERVISOR_ROLES = [
  { value: "primary_supervisor", label: "Primary Supervisor" },
  { value: "secondary_supervisor", label: "Secondary/Adjunct Supervisor" },
  { value: "training_director", label: "Training Director" },
  { value: "clinic_director", label: "Clinic Director" },
  { value: "faculty", label: "Faculty/Instructor" },
  { value: "other", label: "Other" },
] as const;

const SUPERVISEE_COUNTS = [
  { value: "1", label: "1" },
  { value: "2-3", label: "2-3" },
  { value: "4-6", label: "4-6" },
  { value: "7-10", label: "7-10" },
  { value: "11+", label: "11+" },
] as const;

interface FormData {
  participantId: string;
  role: string;
  superviseeCount: string;
  aiPolicy: string;
  impactResponses: Record<string, number | null>;
  bestImprovement: string;
  biggestConcern: string;
}

const initialFormData: FormData = {
  participantId: "",
  role: "",
  superviseeCount: "",
  aiPolicy: "",
  impactResponses: {},
  bestImprovement: "",
  biggestConcern: "",
};

export default function SupervisorSurvey() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/DIPS/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyType: "supervisor",
          data: formData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert("Failed to submit survey. Please try again.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to submit survey. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <SurveyLayout title="Supervisor Survey">
        <SuccessMessage
          title="Thank you for completing the survey!"
          message="Your responses have been recorded. Your input as a supervisor is invaluable for understanding AI's role in clinical training."
        />
      </SurveyLayout>
    );
  }

  return (
    <SurveyLayout
      title="Supervisor Survey"
      description="AI Training Tool Evaluation"
      currentStep={step}
      totalSteps={TOTAL_STEPS}
    >
      {/* Step 1: Background */}
      {step === 1 && (
        <>
          <FormSection
            title="Supervisor Background"
            description="Tell us about your supervisory role."
          >
            <FormField label="Participant ID" sublabel="Optional - for longitudinal tracking">
              <input
                type="text"
                className="form-input"
                placeholder="Enter ID if provided"
                value={formData.participantId}
                onChange={(e) => updateField("participantId", e.target.value)}
              />
            </FormField>

            <FormField label="Your Role" required>
              <Dropdown
                name="role"
                value={formData.role}
                onChange={(v) => updateField("role", v)}
                options={SUPERVISOR_ROLES}
                placeholder="Select your role"
              />
            </FormField>

            <FormField label="Number of Supervisees" required>
              <Dropdown
                name="superviseeCount"
                value={formData.superviseeCount}
                onChange={(v) => updateField("superviseeCount", v)}
                options={SUPERVISEE_COUNTS}
                placeholder="Select number"
              />
            </FormField>

            <FormField label="Your Clinic's AI Policy" required>
              <Dropdown
                name="aiPolicy"
                value={formData.aiPolicy}
                onChange={(v) => updateField("aiPolicy", v)}
                options={AI_POLICY_OPTIONS}
                placeholder="Select policy"
              />
            </FormField>
          </FormSection>

          <NavigationButtons
            onNext={() => setStep(2)}
            showBack={false}
            canProceed={true}
          />
        </>
      )}

      {/* Step 2: Impact Items */}
      {step === 2 && (
        <>
          <FormSection
            title="AI Impact on Supervision"
            description="Please rate your agreement with each statement about AI in clinical training."
          >
            <div className="space-y-6">
              {SUPERVISOR_IMPACT_ITEMS.map((item) => (
                <div key={item.id}>
                  <p className="font-medium text-sm mb-3">{item.text}</p>
                  <LikertScale
                    name={item.id}
                    value={formData.impactResponses[item.id] ?? null}
                    onChange={(v) =>
                      updateField("impactResponses", {
                        ...formData.impactResponses,
                        [item.id]: v,
                      })
                    }
                    labels={LIKERT_5_LABELS}
                  />
                </div>
              ))}
            </div>
          </FormSection>

          <NavigationButtons
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        </>
      )}

      {/* Step 3: Open-ended */}
      {step === 3 && (
        <>
          <FormSection
            title="Your Thoughts"
            description="Share your perspective on AI in clinical training."
          >
            <FormField
              label="What is the single best improvement AI could bring to clinical training?"
            >
              <TextArea
                name="bestImprovement"
                value={formData.bestImprovement}
                onChange={(v) => updateField("bestImprovement", v)}
                placeholder="Describe the most valuable potential improvement..."
                rows={4}
              />
            </FormField>

            <FormField label="What is your biggest concern about AI in clinical training?">
              <TextArea
                name="biggestConcern"
                value={formData.biggestConcern}
                onChange={(v) => updateField("biggestConcern", v)}
                placeholder="Describe your primary concern..."
                rows={4}
              />
            </FormField>
          </FormSection>

          <NavigationButtons
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isLastStep={true}
            canProceed={true}
          />
        </>
      )}
    </SurveyLayout>
  );
}
