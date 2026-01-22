import { google } from "googleapis";

// Environment variables for Google Sheets API
// GOOGLE_SERVICE_ACCOUNT_EMAIL - Service account email
// GOOGLE_PRIVATE_KEY - Private key from service account JSON
// DIPS_SHEET_ID - Single Google Sheet ID with 4 tabs

// Tab names within the single Google Sheet
const TAB_NAMES: Record<string, string> = {
  trainee: "Trainee",
  supervisor: "Supervisor",
  rating: "Rating",
  patient: "Patient",
};

async function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !privateKey) {
    throw new Error("Google service account credentials not configured");
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return auth;
}

export async function appendToSheet(
  surveyType: string,
  rowData: string[]
): Promise<boolean> {
  const sheetId = process.env.DIPS_SHEET_ID;
  const tabName = TAB_NAMES[surveyType];

  if (!sheetId) {
    console.error("DIPS_SHEET_ID not configured");
    return false;
  }

  if (!tabName) {
    console.error(`Unknown survey type: ${surveyType}`);
    return false;
  }

  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${tabName}!A:ZZ`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowData],
      },
    });

    return true;
  } catch (error) {
    console.error("Error appending to Google Sheet:", error);
    return false;
  }
}

// Helper to flatten nested objects into a single row
export function flattenData(data: Record<string, unknown>, prefix = ""): string[] {
  const result: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      result.push("");
    } else if (typeof value === "object" && !Array.isArray(value)) {
      result.push(...flattenData(value as Record<string, unknown>, fullKey));
    } else if (Array.isArray(value)) {
      result.push(value.join(", "));
    } else {
      result.push(String(value));
    }
  }

  return result;
}

// Get column headers for a survey type
export function getHeaders(surveyType: string): string[] {
  switch (surveyType) {
    case "trainee":
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
        // Skill Importance (10)
        "Importance: Assessment",
        "Importance: Diagnosis",
        "Importance: Treatment Planning",
        "Importance: Therapeutic Alliance",
        "Importance: Intervention Selection",
        "Importance: Case Conceptualization",
        "Importance: Documentation",
        "Importance: Risk Assessment",
        "Importance: Cultural Competence",
        "Importance: Ethical Decision-Making",
        // Skill Ability (10)
        "Ability: Assessment",
        "Ability: Diagnosis",
        "Ability: Treatment Planning",
        "Ability: Therapeutic Alliance",
        "Ability: Intervention Selection",
        "Ability: Case Conceptualization",
        "Ability: Documentation",
        "Ability: Risk Assessment",
        "Ability: Cultural Competence",
        "Ability: Ethical Decision-Making",
        // Skill Confidence (10)
        "Confidence: Assessment",
        "Confidence: Diagnosis",
        "Confidence: Treatment Planning",
        "Confidence: Therapeutic Alliance",
        "Confidence: Intervention Selection",
        "Confidence: Case Conceptualization",
        "Confidence: Documentation",
        "Confidence: Risk Assessment",
        "Confidence: Cultural Competence",
        "Confidence: Ethical Decision-Making",
        // Skill Competence (10)
        "Competence: Assessment",
        "Competence: Diagnosis",
        "Competence: Treatment Planning",
        "Competence: Therapeutic Alliance",
        "Competence: Intervention Selection",
        "Competence: Case Conceptualization",
        "Competence: Documentation",
        "Competence: Risk Assessment",
        "Competence: Cultural Competence",
        "Competence: Ethical Decision-Making",
        // Sources
        "Competence Sources",
        "Competence Source Other",
        // Feasibility (10)
        "FA1", "FA2", "FA3", "FA4", "FA5", "FA6", "FA7", "FA8", "FA9", "FA10",
        // Barriers
        "Barriers",
        "Barrier Other",
        // Privacy (5)
        "Privacy 1", "Privacy 2", "Privacy 3", "Privacy 4", "Privacy 5",
      ];

    case "supervisor":
      return [
        "Timestamp",
        "Timepoint",
        "Participant ID",
        "Role",
        "Supervisee Count",
        "AI Policy",
        // Impact items (7)
        "SI1", "SI2", "SI3", "SI4", "SI5", "SI6", "SI7",
        "Best Improvement",
        "Biggest Concern",
      ];

    case "rating":
      return [
        "Timestamp",
        "Timepoint",
        "Supervisor ID",
        "Trainee ID",
        // Skill ratings (7)
        "TS1", "TS2", "TS3", "TS4", "TS5", "TS6", "TS7",
        "Overall Change",
        "Notes",
      ];

    case "patient":
      return [
        "Timestamp",
        "Timepoint",
        "Patient ID",
        "Session Date",
        // Item ratings (7)
        "PI1", "PI2", "PI3", "PI4", "PI5", "PI6", "PI7",
        "Additional Feedback",
      ];

    default:
      return [];
  }
}

// Detect timepoint based on date
export function detectTimepoint(timestamp: string): string {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // Simple quarterly timepoint detection
  if (month <= 3) return `Q1 ${year}`;
  if (month <= 6) return `Q2 ${year}`;
  if (month <= 9) return `Q3 ${year}`;
  return `Q4 ${year}`;
}
