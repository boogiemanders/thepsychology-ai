import { NextRequest, NextResponse } from "next/server";
import { appendToSheet, detectTimepoint } from "@/lib/google-sheets";
import { CLINICAL_SKILLS, FEASIBILITY_ITEMS, TRAINEE_SKILL_AREAS, PATIENT_ITEMS, SUPERVISOR_IMPACT_ITEMS, PRIVACY_SCENARIOS } from "@/lib/survey-config";

interface SubmissionPayload {
  surveyType: "trainee" | "supervisor" | "rating" | "patient";
  data: Record<string, unknown>;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: SubmissionPayload = await request.json();
    const { surveyType, data, timestamp } = payload;

    if (!surveyType || !data || !timestamp) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const timepoint = detectTimepoint(timestamp);
    let rowData: string[];

    switch (surveyType) {
      case "trainee":
        rowData = formatTraineeData(timestamp, timepoint, data);
        break;
      case "supervisor":
        rowData = formatSupervisorData(timestamp, timepoint, data);
        break;
      case "rating":
        rowData = formatRatingData(timestamp, timepoint, data);
        break;
      case "patient":
        rowData = formatPatientData(timestamp, timepoint, data);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid survey type" },
          { status: 400 }
        );
    }

    const success = await appendToSheet(surveyType, rowData);

    if (success) {
      return NextResponse.json({ success: true, timepoint });
    } else {
      // If Google Sheets fails, log the data and return success anyway
      // This prevents data loss - data can be recovered from server logs
      console.log(`[DIPS ${surveyType}] Fallback log:`, JSON.stringify(payload));
      return NextResponse.json({ success: true, timepoint, fallback: true });
    }
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}

function formatTraineeData(
  timestamp: string,
  timepoint: string,
  data: Record<string, unknown>
): string[] {
  const skillImportance = (data.skillImportance || {}) as Record<string, number | null>;
  const skillAbility = (data.skillAbility || {}) as Record<string, number | null>;
  const skillConfidence = (data.skillConfidence || {}) as Record<string, number | null>;
  const skillCompetence = (data.skillCompetence || {}) as Record<string, number | null>;
  const feasibilityResponses = (data.feasibilityResponses || {}) as Record<string, number | null>;
  const privacyResponses = (data.privacyResponses || {}) as Record<string, string | null>;

  return [
    timestamp,
    timepoint,
    String(data.participantId || ""),
    String(data.trainingLevel || ""),
    String(data.orientation || ""),
    String(data.setting || ""),
    String(data.clinicalHours || ""),
    String(data.age || ""),
    String(data.gender || ""),
    String(data.raceEthnicity || ""),
    String(data.trainingNeeds1 || ""),
    String(data.trainingNeeds2 || ""),
    String(data.trainingNeeds3 || ""),
    String(data.desiredAIFeatures || ""),
    // Skill Importance
    ...CLINICAL_SKILLS.map((s) => String(skillImportance[s.id] ?? "")),
    // Skill Ability
    ...CLINICAL_SKILLS.map((s) => String(skillAbility[s.id] ?? "")),
    // Skill Confidence
    ...CLINICAL_SKILLS.map((s) => String(skillConfidence[s.id] ?? "")),
    // Skill Competence
    ...CLINICAL_SKILLS.map((s) => String(skillCompetence[s.id] ?? "")),
    // Sources
    Array.isArray(data.competenceSources) ? data.competenceSources.join(", ") : "",
    String(data.competenceSourceOther || ""),
    // Feasibility
    ...FEASIBILITY_ITEMS.map((item) => String(feasibilityResponses[item.id] ?? "")),
    // Barriers
    Array.isArray(data.barriers) ? data.barriers.join(", ") : "",
    String(data.barrierOther || ""),
    // Privacy
    ...PRIVACY_SCENARIOS.map((s) => String(privacyResponses[s.id] ?? "")),
  ];
}

function formatSupervisorData(
  timestamp: string,
  timepoint: string,
  data: Record<string, unknown>
): string[] {
  const impactResponses = (data.impactResponses || {}) as Record<string, number | null>;

  return [
    timestamp,
    timepoint,
    String(data.participantId || ""),
    String(data.role || ""),
    String(data.superviseeCount || ""),
    String(data.aiPolicy || ""),
    // Impact items
    ...SUPERVISOR_IMPACT_ITEMS.map((item) => String(impactResponses[item.id] ?? "")),
    String(data.bestImprovement || ""),
    String(data.biggestConcern || ""),
  ];
}

function formatRatingData(
  timestamp: string,
  timepoint: string,
  data: Record<string, unknown>
): string[] {
  const skillRatings = (data.skillRatings || {}) as Record<string, number | null>;

  return [
    timestamp,
    timepoint,
    String(data.supervisorId || ""),
    String(data.traineeId || ""),
    // Skill ratings
    ...TRAINEE_SKILL_AREAS.map((skill) => String(skillRatings[skill.id] ?? "")),
    String(data.overallChange || ""),
    String(data.notes || ""),
  ];
}

function formatPatientData(
  timestamp: string,
  timepoint: string,
  data: Record<string, unknown>
): string[] {
  const itemRatings = (data.itemRatings || {}) as Record<string, number | null>;

  return [
    timestamp,
    timepoint,
    String(data.patientId || ""),
    String(data.sessionDate || ""),
    // Item ratings
    ...PATIENT_ITEMS.map((item) => String(itemRatings[item.id] ?? "")),
    String(data.additionalFeedback || ""),
  ];
}
