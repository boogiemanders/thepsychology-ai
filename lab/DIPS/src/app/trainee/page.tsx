"use client";

import { useState } from "react";
import { SurveyLayout, FormSection, FormField, NavigationButtons } from "@/components/SurveyLayout";
import { Dropdown } from "@/components/Dropdown";
import { TextArea } from "@/components/TextArea";
import { TripleRatingRow } from "@/components/TripleRatingRow";
import { CheckboxGroup } from "@/components/CheckboxGroup";
import { LikertScale } from "@/components/LikertScale";
import { DealbreakersTable } from "@/components/DealbreakersTable";
import { SuccessMessage } from "@/components/SuccessMessage";
import {
  TRAINING_LEVELS,
  THEORETICAL_ORIENTATIONS,
  WEEKLY_CLIENT_HOURS,
  WEEKLY_SUPERVISION_HOURS,
  AGE_RANGES,
  CLINICAL_SKILLS,
  FEASIBILITY_ITEMS,
  BARRIERS,
  PRIVACY_SCENARIOS,
  HIPAA_COMPLIANCE_SCENARIO,
  AI_TOOL_PERCEPTIONS,
  TIMEPOINT_OPTIONS,
  IMPORTANCE_LABELS,
  ABILITY_LABELS,
  CONFIDENCE_LABELS,
  LIKERT_5_LABELS,
} from "@/lib/survey-config";
import type { HipaaComplianceResponse } from "@/lib/survey-config";

const TOTAL_STEPS = 7;

interface FormData {
  // Demographics
  traineeId: string;
  date: string;
  timepoint: string;
  trainingLevel: string;
  trainingLevelOther: string;
  orientation: string;
  orientationOther: string;
  weeklyClientHours: string;
  weeklySupervisionHours: string;
  age: string;
  gender: string;
  raceEthnicity: string;

  // Open-ended
  trainingNeeds: string;
  desiredAIFeatures: string;
  aiConcerns: string;

  // Skill matrices (3 ratings per skill)
  skillImportance: Record<string, number | null>;
  skillAbility: Record<string, number | null>;
  skillConfidence: Record<string, number | null>;

  // AI description
  aiToolLooksLike: string;
  aiToolPerceptions: string[];
  aiToolPerceptionOther: string;

  // Feasibility/Acceptability
  feasibilityResponses: Record<string, number | null>;

  // Barriers
  barriers: string[];
  barrierOther: string;

  // Privacy
  privacyResponses: Record<string, "dealbreaker" | "acceptable" | "unsure" | null>;
  hipaaCompliance: HipaaComplianceResponse | null;
}

const initialFormData: FormData = {
  traineeId: "",
  date: "",
  timepoint: "",
  trainingLevel: "",
  trainingLevelOther: "",
  orientation: "",
  orientationOther: "",
  weeklyClientHours: "",
  weeklySupervisionHours: "",
  age: "",
  gender: "",
  raceEthnicity: "",
  trainingNeeds: "",
  desiredAIFeatures: "",
  aiConcerns: "",
  skillImportance: {},
  skillAbility: {},
  skillConfidence: {},
  aiToolLooksLike: "",
  aiToolPerceptions: [],
  aiToolPerceptionOther: "",
  feasibilityResponses: {},
  barriers: [],
  barrierOther: "",
  privacyResponses: {},
  hipaaCompliance: null,
};

export default function TraineeSurvey() {
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
          surveyType: "trainee",
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
      <SurveyLayout title="AI Clinical Training Tool Evaluation (Trainee)">
        <SuccessMessage
          title="Thank you for completing this survey."
          message="Your responses have been recorded. Your input will help shape the future of AI-assisted clinical training."
        />
      </SurveyLayout>
    );
  }

  return (
    <SurveyLayout
      title="AI Clinical Training Tool Evaluation (Trainee)"
      description="Clinician Survey (10–12 minutes)"
      currentStep={step}
      totalSteps={TOTAL_STEPS}
    >
      {/* Step 1: Demographics */}
      {step === 1 && (
        <>
          <FormSection
            title="Section 1: Demographics"
            description="Estimated time: 2 minutes"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <FormField label="Trainee ID">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter ID"
                  value={formData.traineeId}
                  onChange={(e) => updateField("traineeId", e.target.value)}
                />
              </FormField>

              <FormField label="Date">
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) => updateField("date", e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Timepoint">
              <Dropdown
                name="timepoint"
                value={formData.timepoint}
                onChange={(v) => updateField("timepoint", v)}
                options={TIMEPOINT_OPTIONS}
                placeholder="Select timepoint"
              />
            </FormField>

            <FormField label="1.1 Current training level" required>
              <Dropdown
                name="trainingLevel"
                value={formData.trainingLevel}
                onChange={(v) => updateField("trainingLevel", v)}
                options={TRAINING_LEVELS}
                placeholder="Select your training level"
              />
              {formData.trainingLevel === "other" && (
                <input
                  type="text"
                  className="form-input mt-2"
                  placeholder="Please specify..."
                  value={formData.trainingLevelOther}
                  onChange={(e) => updateField("trainingLevelOther", e.target.value)}
                />
              )}
            </FormField>

            <FormField label="1.2 Primary theoretical orientation" required>
              <Dropdown
                name="orientation"
                value={formData.orientation}
                onChange={(v) => updateField("orientation", v)}
                options={THEORETICAL_ORIENTATIONS}
                placeholder="Select your orientation"
              />
              {formData.orientation === "other" && (
                <input
                  type="text"
                  className="form-input mt-2"
                  placeholder="Please specify..."
                  value={formData.orientationOther}
                  onChange={(e) => updateField("orientationOther", e.target.value)}
                />
              )}
            </FormField>

            <FormField label="1.4 Current weekly direct client contact hours" required>
              <Dropdown
                name="weeklyClientHours"
                value={formData.weeklyClientHours}
                onChange={(v) => updateField("weeklyClientHours", v)}
                options={WEEKLY_CLIENT_HOURS}
                placeholder="Select hour range"
              />
            </FormField>

            <FormField label="1.5 Current weekly supervision hours received" required>
              <Dropdown
                name="weeklySupervisionHours"
                value={formData.weeklySupervisionHours}
                onChange={(v) => updateField("weeklySupervisionHours", v)}
                options={WEEKLY_SUPERVISION_HOURS}
                placeholder="Select hour range"
              />
            </FormField>

            <FormField label="1.6 Age range">
              <Dropdown
                name="age"
                value={formData.age}
                onChange={(v) => updateField("age", v)}
                options={AGE_RANGES}
                placeholder="Select age range"
              />
            </FormField>

            <FormField label="1.7 Gender identity">
              <input
                type="text"
                className="form-input"
                placeholder="Enter gender identity"
                value={formData.gender}
                onChange={(e) => updateField("gender", e.target.value)}
              />
            </FormField>

            <FormField label="1.8 Race/ethnicity" sublabel="Select all that apply">
              <input
                type="text"
                className="form-input"
                placeholder="Enter race/ethnicity"
                value={formData.raceEthnicity}
                onChange={(e) => updateField("raceEthnicity", e.target.value)}
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

      {/* Step 2: Open-Ended Questions */}
      {step === 2 && (
        <>
          <FormSection
            title="Section 2: Open-Ended Questions"
            description="Estimated time: 2 minutes"
          >
            <FormField
              label="2.1 What are your TOP 3 TRAINING NEEDS right now as a psychology trainee?"
              sublabel="List in order of priority"
            >
              <TextArea
                name="trainingNeeds"
                value={formData.trainingNeeds}
                onChange={(v) => updateField("trainingNeeds", v)}
                placeholder="1. &#10;2. &#10;3. "
                rows={5}
              />
            </FormField>

            <FormField
              label="2.2 What specific features or capabilities would make an AI clinical training tool WORTH USING regularly in your practice?"
              sublabel="Be as specific as possible"
            >
              <TextArea
                name="desiredAIFeatures"
                value={formData.desiredAIFeatures}
                onChange={(v) => updateField("desiredAIFeatures", v)}
                placeholder="Describe desired AI features..."
                rows={4}
              />
            </FormField>

            <FormField
              label="2.3 What concerns do you have about using AI?"
            >
              <TextArea
                name="aiConcerns"
                value={formData.aiConcerns}
                onChange={(v) => updateField("aiConcerns", v)}
                placeholder="Describe your concerns..."
                rows={4}
              />
            </FormField>
          </FormSection>

          <NavigationButtons
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        </>
      )}

      {/* Step 3: Skill Importance / Ability / Confidence */}
      {step === 3 && (
        <>
          <FormSection
            title="Section 3: Skill Importance / Ability / Confidence"
            description="Estimated time: 3 minutes. For each clinical skill, rate its IMPORTANCE to your current practice, your current ABILITY level, and your CONFIDENCE performing it independently."
          >
            <div className="mb-4 p-3 bg-[var(--muted)] rounded-lg text-xs text-[var(--muted-foreground)] space-y-1">
              <p><strong>Importance:</strong> 1 Not important, 2 Somewhat important, 3 Important, 4 Very important, 5 Critical</p>
              <p><strong>Ability:</strong> 1 Novice, 2 Advanced beginner, 3 Competent, 4 Proficient, 5 Expert</p>
              <p><strong>Confidence:</strong> 1 Not confident, 2 Slightly confident, 3 Moderately confident, 4 Very confident, 5 Extremely confident</p>
            </div>

            {/* Desktop column headers */}
            <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr] gap-3 border-b-2 border-[var(--border)] pb-3 mb-2 ml-[33%]">
              <div className="text-center">
                <div className="font-semibold text-xs">Importance</div>
                <div className="text-[10px] text-[var(--muted-foreground)]">1–5</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-xs">Ability</div>
                <div className="text-[10px] text-[var(--muted-foreground)]">1–5</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-xs">Confidence</div>
                <div className="text-[10px] text-[var(--muted-foreground)]">1–5</div>
              </div>
            </div>

            {CLINICAL_SKILLS.map((skill, index) => (
              <TripleRatingRow
                key={skill.id}
                id={skill.id}
                label={`3.${index + 1} ${skill.label}`}
                rating1Value={formData.skillImportance[skill.id] ?? null}
                rating1Labels={IMPORTANCE_LABELS}
                onRating1Change={(v) =>
                  updateField("skillImportance", {
                    ...formData.skillImportance,
                    [skill.id]: v,
                  })
                }
                rating2Value={formData.skillAbility[skill.id] ?? null}
                rating2Labels={ABILITY_LABELS}
                onRating2Change={(v) =>
                  updateField("skillAbility", {
                    ...formData.skillAbility,
                    [skill.id]: v,
                  })
                }
                rating3Value={formData.skillConfidence[skill.id] ?? null}
                rating3Labels={CONFIDENCE_LABELS}
                onRating3Change={(v) =>
                  updateField("skillConfidence", {
                    ...formData.skillConfidence,
                    [skill.id]: v,
                  })
                }
              />
            ))}
          </FormSection>

          <NavigationButtons
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        </>
      )}

      {/* Step 4: AI Description + What Does AI Mean to You? */}
      {step === 4 && (
        <>
          <FormSection
            title='Section 4: AI Description + "What Does AI Mean to You?"'
            description="Estimated time: 1 minute"
          >
            <FormField
              label="4.1 What do you think an AI tool for clinical work would look like?"
            >
              <TextArea
                name="aiToolLooksLike"
                value={formData.aiToolLooksLike}
                onChange={(v) => updateField("aiToolLooksLike", v)}
                placeholder="Describe what you envision..."
                rows={4}
              />
            </FormField>

            <FormField
              label="4.2 What would an AI clinical training tool do?"
              sublabel="Check all that apply"
            >
              <CheckboxGroup
                options={AI_TOOL_PERCEPTIONS}
                selectedValues={formData.aiToolPerceptions}
                onChange={(v) => updateField("aiToolPerceptions", v)}
                showOtherInput={true}
                otherValue={formData.aiToolPerceptionOther}
                onOtherChange={(v) => updateField("aiToolPerceptionOther", v)}
              />
            </FormField>
          </FormSection>

          <NavigationButtons
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        </>
      )}

      {/* Step 5: Feasibility / Acceptability */}
      {step === 5 && (
        <>
          <FormSection
            title="Section 5: Feasibility / Acceptability"
            description="Estimated time: 2 minutes. Rate your agreement with each statement about using an AI clinical training tool in your practice."
          >
            <div className="mb-4 p-3 bg-[var(--muted)] rounded-lg text-xs text-[var(--muted-foreground)]">
              <p>1 Strongly disagree, 2 Disagree, 3 Neutral, 4 Agree, 5 Strongly agree</p>
            </div>

            <div className="space-y-6">
              {FEASIBILITY_ITEMS.map((item, index) => (
                <div key={item.id}>
                  <p className="font-medium text-sm mb-3">5.{index + 1} {item.text}</p>
                  <LikertScale
                    name={item.id}
                    value={formData.feasibilityResponses[item.id] ?? null}
                    onChange={(v) =>
                      updateField("feasibilityResponses", {
                        ...formData.feasibilityResponses,
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
            onBack={() => setStep(4)}
            onNext={() => setStep(6)}
          />
        </>
      )}

      {/* Step 6: Barriers Checklist */}
      {step === 6 && (
        <>
          <FormSection
            title="Section 6: Barriers Checklist"
            description="Estimated time: 1 minute. Check ALL barriers that would make you hesitant to use an AI clinical training tool."
          >
            <CheckboxGroup
              options={BARRIERS}
              selectedValues={formData.barriers}
              onChange={(v) => updateField("barriers", v)}
              showOtherInput={true}
              otherValue={formData.barrierOther}
              onOtherChange={(v) => updateField("barrierOther", v)}
            />
          </FormSection>

          <NavigationButtons
            onBack={() => setStep(5)}
            onNext={() => setStep(7)}
          />
        </>
      )}

      {/* Step 7: Privacy / HIPAA Dealbreakers */}
      {step === 7 && (
        <>
          <FormSection
            title="Section 7: Privacy / HIPAA Dealbreakers"
            description="Estimated time: 1 minute. Indicate whether each scenario would be a DEALBREAKER (would prevent you from using the tool)."
          >
            <DealbreakersTable
              scenarios={PRIVACY_SCENARIOS}
              responses={formData.privacyResponses}
              onChange={(id, value) =>
                updateField("privacyResponses", {
                  ...formData.privacyResponses,
                  [id]: value,
                })
              }
            />

            {/* Scenario 7.5 with different response options */}
            <div className="mt-6 p-4 border border-[var(--border)] rounded-lg">
              <p className="font-medium text-sm mb-3">
                7.5 {HIPAA_COMPLIANCE_SCENARIO.text}
              </p>
              <div className="space-y-2">
                {[
                  { value: "required" as const, label: "This is REQUIRED for me to use the tool" },
                  { value: "preferred" as const, label: "This is preferred but not required" },
                  { value: "no_effect" as const, label: "This does not affect my decision" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-[var(--muted)] transition-colors">
                    <input
                      type="radio"
                      name="hipaaCompliance"
                      checked={formData.hipaaCompliance === option.value}
                      onChange={() => updateField("hipaaCompliance", option.value)}
                      className="w-5 h-5 accent-[var(--primary)]"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </FormSection>

          <NavigationButtons
            onBack={() => setStep(6)}
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
