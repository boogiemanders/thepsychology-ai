"use client";

import { useState } from "react";
import { SurveyLayout, FormSection, FormField, NavigationButtons } from "@/components/SurveyLayout";
import { Dropdown } from "@/components/Dropdown";
import { TextArea } from "@/components/TextArea";
import { LikertScaleCompact } from "@/components/LikertScale";
import { SuccessMessage } from "@/components/SuccessMessage";
import { TRAINEE_SKILL_AREAS, CHANGE_OPTIONS, ABILITY_LABELS } from "@/lib/survey-config";

interface FormData {
  supervisorId: string;
  traineeId: string;
  skillRatings: Record<string, number | null>;
  overallChange: string;
  notes: string;
}

const initialFormData: FormData = {
  supervisorId: "",
  traineeId: "",
  skillRatings: {},
  overallChange: "",
  notes: "",
};

export default function PerTraineeRating() {
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
          surveyType: "rating",
          data: formData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert("Failed to submit rating. Please try again.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <SurveyLayout title="Per-Trainee Rating">
        <SuccessMessage
          title="Rating Submitted"
          message="Thank you for submitting this trainee rating."
        />
      </SurveyLayout>
    );
  }

  const canSubmit = true; // Allow demo without filling fields

  return (
    <SurveyLayout
      title="Per-Trainee Rating"
      description="Quick competency assessment"
    >
      <FormSection
        title="Trainee Identification"
        description="Enter IDs for tracking (optional)."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Your Supervisor ID" sublabel="Optional">
            <input
              type="text"
              className="form-input"
              placeholder="Enter your ID"
              value={formData.supervisorId}
              onChange={(e) => updateField("supervisorId", e.target.value)}
            />
          </FormField>
          <FormField label="Trainee ID" sublabel="Optional">
            <input
              type="text"
              className="form-input"
              placeholder="Enter trainee ID"
              value={formData.traineeId}
              onChange={(e) => updateField("traineeId", e.target.value)}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Skill Area Ratings"
        description="Rate this trainee's current competency in each area (1 = Beginner, 5 = Expert)."
      >
        <div className="space-y-4">
          {TRAINEE_SKILL_AREAS.map((skill) => (
            <div
              key={skill.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-[var(--border)] last:border-b-0"
            >
              <span className="font-medium text-sm">{skill.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--muted-foreground)] hidden sm:inline">
                  {ABILITY_LABELS[0]}
                </span>
                <LikertScaleCompact
                  name={skill.id}
                  value={formData.skillRatings[skill.id] ?? null}
                  onChange={(v) =>
                    updateField("skillRatings", {
                      ...formData.skillRatings,
                      [skill.id]: v,
                    })
                  }
                />
                <span className="text-xs text-[var(--muted-foreground)] hidden sm:inline">
                  {ABILITY_LABELS[ABILITY_LABELS.length - 1]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Overall Progress"
        description="How has this trainee changed since the last timepoint?"
      >
        <FormField label="Overall Change" required>
          <Dropdown
            name="overallChange"
            value={formData.overallChange}
            onChange={(v) => updateField("overallChange", v)}
            options={CHANGE_OPTIONS}
            placeholder="Select change level"
          />
        </FormField>

        <FormField label="Additional Notes" sublabel="Optional observations or feedback">
          <TextArea
            name="notes"
            value={formData.notes}
            onChange={(v) => updateField("notes", v)}
            placeholder="Any additional notes about this trainee..."
            rows={3}
          />
        </FormField>
      </FormSection>

      <NavigationButtons
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isLastStep={true}
        canProceed={canSubmit}
        showBack={false}
      />
    </SurveyLayout>
  );
}
