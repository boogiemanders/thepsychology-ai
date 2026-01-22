import { NextResponse } from "next/server";
import { google } from "googleapis";
import {
  CLINICAL_SKILLS,
  FEASIBILITY_ITEMS,
  TRAINEE_SKILL_AREAS,
  PATIENT_ITEMS,
  SUPERVISOR_IMPACT_ITEMS,
  PRIVACY_SCENARIOS,
} from "@/lib/survey-config";

const TAB_NAMES = ["Trainee", "Supervisor", "Rating", "Patient"];

async function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !privateKey) {
    throw new Error("Google service account credentials not configured");
  }

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getHeaders(surveyType: string): string[] {
  switch (surveyType) {
    case "Trainee":
      return [
        "Timestamp",
        "Timepoint",
        "Participant ID",
        "Training Level",
        "Orientation",
        "Setting",
        "Clinical Hours",
        "Age",
        "Gender",
        "Race/Ethnicity",
        "Training Need 1",
        "Training Need 2",
        "Training Need 3",
        "Desired AI Features",
        // Skill Importance
        ...CLINICAL_SKILLS.map((s) => `Importance: ${s.label}`),
        // Skill Ability
        ...CLINICAL_SKILLS.map((s) => `Ability: ${s.label}`),
        // Skill Confidence
        ...CLINICAL_SKILLS.map((s) => `Confidence: ${s.label}`),
        // Skill Competence
        ...CLINICAL_SKILLS.map((s) => `Competence: ${s.label}`),
        // Sources
        "Competence Sources",
        "Competence Source Other",
        // Feasibility
        ...FEASIBILITY_ITEMS.map((item) => `Feasibility: ${item.text.substring(0, 50)}...`),
        // Barriers
        "Barriers",
        "Barrier Other",
        // Privacy
        ...PRIVACY_SCENARIOS.map((s) => `Privacy: ${s.text.substring(0, 40)}...`),
      ];

    case "Supervisor":
      return [
        "Timestamp",
        "Timepoint",
        "Participant ID",
        "Role",
        "Supervisee Count",
        "AI Policy",
        // Impact items
        ...SUPERVISOR_IMPACT_ITEMS.map((item) => `Impact: ${item.text.substring(0, 50)}...`),
        "Best Improvement",
        "Biggest Concern",
      ];

    case "Rating":
      return [
        "Timestamp",
        "Timepoint",
        "Supervisor ID",
        "Trainee ID",
        // Skill ratings
        ...TRAINEE_SKILL_AREAS.map((skill) => `Rating: ${skill.label}`),
        "Overall Change",
        "Notes",
      ];

    case "Patient":
      return [
        "Timestamp",
        "Timepoint",
        "Patient ID",
        "Session Date",
        // Item ratings
        ...PATIENT_ITEMS.map((item) => item.text),
        "Additional Feedback",
      ];

    default:
      return [];
  }
}

export async function POST() {
  try {
    const sheetId = process.env.DIPS_SHEET_ID;
    if (!sheetId) {
      return NextResponse.json({ error: "DIPS_SHEET_ID not configured" }, { status: 500 });
    }

    const auth = await getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });

    const results: Record<string, string> = {};

    for (const tabName of TAB_NAMES) {
      const headers = getHeaders(tabName);

      try {
        // Clear existing content and add headers
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${tabName}!A1`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [headers],
          },
        });
        results[tabName] = `Added ${headers.length} headers`;
      } catch (error) {
        results[tabName] = `Error: ${error}`;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Init sheets error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
