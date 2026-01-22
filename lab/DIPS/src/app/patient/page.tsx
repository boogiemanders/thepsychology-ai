"use client";

import { useState } from "react";
import { SurveyLayout, FormSection, FormField, NavigationButtons } from "@/components/SurveyLayout";
import { RatingScale } from "@/components/RatingScale";
import { TextArea } from "@/components/TextArea";
import { SuccessMessage } from "@/components/SuccessMessage";
import { PATIENT_ITEMS } from "@/lib/survey-config";

interface FormData {
  patientId: string;
  sessionDate: string;
  itemRatings: Record<string, number | null>;
  additionalFeedback: string;
}

const initialFormData: FormData = {
  patientId: "",
  sessionDate: new Date().toISOString().split("T")[0],
  itemRatings: {},
  additionalFeedback: "",
};

export default function PatientCheckIn() {
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
          surveyType: "patient",
          data: formData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert("Failed to submit. Please try again.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <SurveyLayout title="Patient Check-In">
        <SuccessMessage
          title="Thank you!"
          message="Your feedback has been recorded. We appreciate you taking the time to share your experience."
        />
      </SurveyLayout>
    );
  }

  return (
    <SurveyLayout
      title="Patient Check-In"
      description="Session feedback"
    >
      <FormSection description="Your responses are confidential and help us improve the quality of care.">
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="form-label">Patient ID</label>
            <span className="form-sublabel">Optional</span>
            <input
              type="text"
              className="form-input"
              placeholder="Enter ID if provided"
              value={formData.patientId}
              onChange={(e) => updateField("patientId", e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Session Date</label>
            <span className="form-sublabel">&nbsp;</span>
            <input
              type="date"
              className="form-input"
              value={formData.sessionDate}
              onChange={(e) => updateField("sessionDate", e.target.value)}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Session Feedback"
        description="Please rate each item from 0 (Not at all) to 10 (Completely)."
      >
        <div className="space-y-6">
          {PATIENT_ITEMS.map((item) => (
            <div key={item.id}>
              <p className="font-medium text-sm mb-3">{item.text}</p>
              <RatingScale
                name={item.id}
                value={formData.itemRatings[item.id] ?? null}
                onChange={(v) =>
                  updateField("itemRatings", {
                    ...formData.itemRatings,
                    [item.id]: v,
                  })
                }
                min={0}
                max={10}
                lowLabel="Not at all"
                highLabel="Completely"
              />
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title="Additional Feedback" description="Optional">
        <TextArea
          name="additionalFeedback"
          value={formData.additionalFeedback}
          onChange={(v) => updateField("additionalFeedback", v)}
          placeholder="Is there anything else you'd like to share about today's session?"
          rows={4}
        />
      </FormSection>

      <NavigationButtons
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isLastStep={true}
        canProceed={true}
        showBack={false}
      />
    </SurveyLayout>
  );
}
