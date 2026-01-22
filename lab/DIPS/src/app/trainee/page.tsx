"use client";

import { useState } from "react";
import { SurveyLayout, FormSection, FormField, NavigationButtons } from "@/components/SurveyLayout";
import { Dropdown } from "@/components/Dropdown";
import { TextArea } from "@/components/TextArea";
import { DualRatingRow, DualRatingHeader } from "@/components/DualRatingRow";
import { CheckboxGroup } from "@/components/CheckboxGroup";
import { LikertScale } from "@/components/LikertScale";
import { DealbreakersTable } from "@/components/DealbreakersTable";
import { SuccessMessage } from "@/components/SuccessMessage";
import {
  TRAINING_LEVELS,
  THEORETICAL_ORIENTATIONS,
  CLINICAL_SETTINGS,
  CLINICAL_HOURS_RANGES,
  AGE_RANGES,
  GENDER_OPTIONS,
  RACE_ETHNICITY_OPTIONS,
  CLINICAL_SKILLS,
  COMPETENCE_SOURCES,
  FEASIBILITY_ITEMS,
  BARRIERS,
  PRIVACY_SCENARIOS,
  IMPORTANCE_LABELS,
  ABILITY_LABELS,
  CONFIDENCE_LABELS,
  LIKERT_5_LABELS,
} from "@/lib/survey-config";

const TOTAL_STEPS = 8;

interface FormData {
  // Demographics
  participantId: string;
  trainingLevel: string;
  orientation: string;
  setting: string;
  clinicalHours: string;
  age: string;
  gender: string;
  raceEthnicity: string;

  // Open-ended
  trainingNeeds1: string;
  trainingNeeds2: string;
  trainingNeeds3: string;
  desiredAIFeatures: string;

  // Skill matrices
  skillImportance: Record<string, number | null>;
  skillAbility: Record<string, number | null>;
  skillConfidence: Record<string, number | null>;
  skillCompetence: Record<string, number | null>;

  // Source of competence
  competenceSources: string[];
  competenceSourceOther: string;

  // Feasibility/Acceptability
  feasibilityResponses: Record<string, number | null>;

  // Barriers
  barriers: string[];
  barrierOther: string;

  // Privacy
  privacyResponses: Record<string, "dealbreaker" | "acceptable" | "unsure" | null>;
}

const initialFormData: FormData = {
  participantId: "",
  trainingLevel: "",
  orientation: "",
  setting: "",
  clinicalHours: "",
  age: "",
  gender: "",
  raceEthnicity: "",
  trainingNeeds1: "",
  trainingNeeds2: "",
  trainingNeeds3: "",
  desiredAIFeatures: "",
  skillImportance: {},
  skillAbility: {},
  skillConfidence: {},
  skillCompetence: {},
  competenceSources: [],
  competenceSourceOther: "",
  feasibilityResponses: {},
  barriers: [],
  barrierOther: "",
  privacyResponses: {},
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
      <SurveyLayout title="Clinician/Trainee Survey">
        <SuccessMessage
          title="Thank you for completing the survey!"
          message="Your responses have been recorded. Your input will help shape the future of AI-assisted clinical training."
        />
      </SurveyLayout>
    );
  }

  return (
    <SurveyLayout
      title="Clinician/Trainee Survey"
      description="AI Training Tool Evaluation"
      currentStep={step}
      totalSteps={TOTAL_STEPS}
    >
      {/* Step 1: Demographics */}
      {step === 1 && (
        <>
          <FormSection
            title="Demographics"
            description="Please provide some background information about yourself."
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

            <FormField label="Training Level" required>
              <Dropdown
                name="trainingLevel"
                value={formData.trainingLevel}
                onChange={(v) => updateField("trainingLevel", v)}
                options={TRAINING_LEVELS}
                placeholder="Select your training level"
              />
            </FormField>

            <FormField label="Primary Theoretical Orientation" required>
              <Dropdown
                name="orientation"
                value={formData.orientation}
                onChange={(v) => updateField("orientation", v)}
                options={THEORETICAL_ORIENTATIONS}
                placeholder="Select your orientation"
              />
            </FormField>

            <FormField label="Primary Clinical Setting" required>
              <Dropdown
                name="setting"
                value={formData.setting}
                onChange={(v) => updateField("setting", v)}
                options={CLINICAL_SETTINGS}
                placeholder="Select your setting"
              />
            </FormField>

            <FormField label="Total Clinical Hours" required>
              <Dropdown
                name="clinicalHours"
                value={formData.clinicalHours}
                onChange={(v) => updateField("clinicalHours", v)}
                options={CLINICAL_HOURS_RANGES}
                placeholder="Select hour range"
              />
            </FormField>

            <FormField label="Age Range">
              <Dropdown
                name="age"
                value={formData.age}
                onChange={(v) => updateField("age", v)}
                options={AGE_RANGES}
                placeholder="Select age range"
              />
            </FormField>

            <FormField label="Gender">
              <Dropdown
                name="gender"
                value={formData.gender}
                onChange={(v) => updateField("gender", v)}
                options={GENDER_OPTIONS}
                placeholder="Select gender"
              />
            </FormField>

            <FormField label="Race/Ethnicity">
              <Dropdown
                name="raceEthnicity"
                value={formData.raceEthnicity}
                onChange={(v) => updateField("raceEthnicity", v)}
                options={RACE_ETHNICITY_OPTIONS}
                placeholder="Select race/ethnicity"
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

      {/* Step 2: Open-ended Questions */}
      {step === 2 && (
        <>
          <FormSection
            title="Training Needs & AI Features"
            description="Tell us about your training priorities and what AI tools could help."
          >
            <FormField
              label="What are your top 3 training needs?"
              sublabel="Please describe areas where you would benefit from additional training or practice."
            >
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-[var(--muted-foreground)]">1.</span>
                  <TextArea
                    name="trainingNeeds1"
                    value={formData.trainingNeeds1}
                    onChange={(v) => updateField("trainingNeeds1", v)}
                    placeholder="First training need..."
                    rows={2}
                  />
                </div>
                <div>
                  <span className="text-sm text-[var(--muted-foreground)]">2.</span>
                  <TextArea
                    name="trainingNeeds2"
                    value={formData.trainingNeeds2}
                    onChange={(v) => updateField("trainingNeeds2", v)}
                    placeholder="Second training need..."
                    rows={2}
                  />
                </div>
                <div>
                  <span className="text-sm text-[var(--muted-foreground)]">3.</span>
                  <TextArea
                    name="trainingNeeds3"
                    value={formData.trainingNeeds3}
                    onChange={(v) => updateField("trainingNeeds3", v)}
                    placeholder="Third training need..."
                    rows={2}
                  />
                </div>
              </div>
            </FormField>

            <FormField
              label="What AI features would be most helpful for your training?"
              sublabel="Describe any features or capabilities you'd want in an AI clinical training tool."
            >
              <TextArea
                name="desiredAIFeatures"
                value={formData.desiredAIFeatures}
                onChange={(v) => updateField("desiredAIFeatures", v)}
                placeholder="Describe desired AI features..."
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

      {/* Step 3: Skill Importance/Ability Matrix */}
      {step === 3 && (
        <>
          <FormSection
            title="Skill Importance & Ability"
            description="For each skill, rate both its importance to your work and your current ability level."
          >
            <DualRatingHeader
              column1Label="Importance"
              column1Subtitle="1 = Not Important, 5 = Essential"
              column2Label="Ability"
              column2Subtitle="1 = Cannot Do, 5 = Expert"
            />
            {CLINICAL_SKILLS.map((skill) => (
              <DualRatingRow
                key={skill.id}
                id={skill.id}
                label={skill.label}
                rating1Name="importance"
                rating1Value={formData.skillImportance[skill.id] ?? null}
                rating1Labels={IMPORTANCE_LABELS}
                onRating1Change={(v) =>
                  updateField("skillImportance", {
                    ...formData.skillImportance,
                    [skill.id]: v,
                  })
                }
                rating2Name="ability"
                rating2Value={formData.skillAbility[skill.id] ?? null}
                rating2Labels={ABILITY_LABELS}
                onRating2Change={(v) =>
                  updateField("skillAbility", {
                    ...formData.skillAbility,
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

      {/* Step 4: Confidence/Competence Matrix */}
      {step === 4 && (
        <>
          <FormSection
            title="Skill Confidence & Competence"
            description="For each skill, rate your confidence level and perceived competence."
          >
            <DualRatingHeader
              column1Label="Confidence"
              column1Subtitle="1 = Not Confident, 5 = Extremely"
              column2Label="Competence"
              column2Subtitle="1 = Cannot Do, 5 = Expert"
            />
            {CLINICAL_SKILLS.map((skill) => (
              <DualRatingRow
                key={skill.id}
                id={`${skill.id}-cc`}
                label={skill.label}
                rating1Name="confidence"
                rating1Value={formData.skillConfidence[skill.id] ?? null}
                rating1Labels={CONFIDENCE_LABELS}
                onRating1Change={(v) =>
                  updateField("skillConfidence", {
                    ...formData.skillConfidence,
                    [skill.id]: v,
                  })
                }
                rating2Name="competence"
                rating2Value={formData.skillCompetence[skill.id] ?? null}
                rating2Labels={ABILITY_LABELS}
                onRating2Change={(v) =>
                  updateField("skillCompetence", {
                    ...formData.skillCompetence,
                    [skill.id]: v,
                  })
                }
              />
            ))}
          </FormSection>

          <NavigationButtons
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        </>
      )}

      {/* Step 5: Source of Competence */}
      {step === 5 && (
        <>
          <FormSection
            title="Sources of Competence"
            description="Which sources have contributed most to your clinical competence? (Select all that apply)"
          >
            <CheckboxGroup
              options={COMPETENCE_SOURCES}
              selectedValues={formData.competenceSources}
              onChange={(v) => updateField("competenceSources", v)}
              showOtherInput={true}
              otherValue={formData.competenceSourceOther}
              onOtherChange={(v) => updateField("competenceSourceOther", v)}
            />
          </FormSection>

          <NavigationButtons
            onBack={() => setStep(4)}
            onNext={() => setStep(6)}
          />
        </>
      )}

      {/* Step 6: Feasibility/Acceptability */}
      {step === 6 && (
        <>
          <FormSection
            title="Feasibility & Acceptability"
            description="Please rate your agreement with each statement about AI training tools."
          >
            <div className="space-y-6">
              {FEASIBILITY_ITEMS.map((item) => (
                <div key={item.id}>
                  <p className="font-medium text-sm mb-3">{item.text}</p>
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
            onBack={() => setStep(5)}
            onNext={() => setStep(7)}
          />
        </>
      )}

      {/* Step 7: Barriers */}
      {step === 7 && (
        <>
          <FormSection
            title="Barriers to AI Training Tool Adoption"
            description="What barriers might prevent you from using AI clinical training tools? (Select all that apply)"
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
            onBack={() => setStep(6)}
            onNext={() => setStep(8)}
          />
        </>
      )}

      {/* Step 8: Privacy/HIPAA Dealbreakers */}
      {step === 8 && (
        <>
          <FormSection
            title="Privacy & Data Handling"
            description="For each scenario, indicate whether it would be a dealbreaker, acceptable, or you're unsure."
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
          </FormSection>

          <NavigationButtons
            onBack={() => setStep(7)}
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
