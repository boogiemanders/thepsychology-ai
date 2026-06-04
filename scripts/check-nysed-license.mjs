#!/usr/bin/env node
/**
 * NYSED License Verification
 *
 * Queries the NY State Education Department ROSA API directly via HTTP/1.1.
 * (NYSED's WAF blocks HTTP/2 from headless browsers and curl by default.)
 *
 * Usage:
 *   node scripts/check-nysed-license.mjs "Anders Chan"
 *   node scripts/check-nysed-license.mjs "Anders Chan" --profession 068
 *   node scripts/check-nysed-license.mjs "Anders Chan" --notify   # sends email if full license found
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const args = process.argv.slice(2);
let name = null;
let professionCode = "068";
let notifyMode = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--profession" && args[i + 1]) {
    professionCode = args[i + 1];
    i++;
  } else if (args[i] === "--notify") {
    notifyMode = true;
  } else if (!args[i].startsWith("--")) {
    name = args[i];
  }
}

if (!name) {
  console.error('Usage: node scripts/check-nysed-license.mjs "Name" [--profession CODE] [--notify]');
  process.exit(1);
}

// NYSED stores names as "LASTNAME FIRSTNAME". If input looks like "First Last", flip it.
// Heuristic: if no comma and exactly two words, reverse them.
function toNysedNameFormat(input) {
  const trimmed = input.trim().toUpperCase();
  if (trimmed.includes(",")) return trimmed; // already "LAST, FIRST" style — strip comma
  const parts = trimmed.split(/\s+/);
  if (parts.length === 2) return `${parts[1]} ${parts[0]}`; // "FIRST LAST" -> "LAST FIRST"
  return trimmed; // 1 word or 3+ words, pass through as-is
}

name = toNysedNameFormat(name);

async function sendEmail(subject, text) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_EMAIL_FROM || "drchan@thepsychology.ai";
  const to = "drchan@thepsychology.ai";

  if (!apiKey) {
    console.error("RESEND_API_KEY not set — skipping email");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html: text.replace(/\n/g, "<br/>"),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend error ${res.status}: ${body}`);
  } else {
    console.log("Email sent successfully!");
  }
}

const ROSA_BASE = "https://api.nysed.gov/rosa/";
const ROSA_KEY = "BRJF4D6U646A5PNMIB77AAW9544QFQKAYAEWI9EPU0TNP72CEEO3L4KGVN5K3R44";
const ROSA_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Referer": "https://eservices.nysed.gov/professions/verification-search",
  "Origin": "https://eservices.nysed.gov",
  "Accept": "application/json, text/plain, */*",
  "x-oapi-key": ROSA_KEY,
};

// NYSED's WAF blocks HTTP/2 (used by headless Chromium and node fetch by default).
// HTTP/1.1 via curl works. We shell out to curl as the reliable path, with Playwright as fallback.
async function resolveHost(hostname) {
  const { execFileSync } = await import("child_process");
  try {
    const out = execFileSync("getent", ["hosts", hostname], { encoding: "utf8" });
    const ip = out.trim().split(/\s+/)[0];
    return ip || null;
  } catch {
    return null;
  }
}

async function queryRosaApi(endpoint, params) {
  const qs = new URLSearchParams({ ...params, pageNumber: 0, pageSize: 25 }).toString();
  const url = `${ROSA_BASE}${endpoint}?${qs}`;
  const headerArgs = Object.entries(ROSA_HEADERS).flatMap(([k, v]) => ["-H", `${k}: ${v}`]);
  const { execFileSync } = await import("child_process");

  // curl's internal DNS resolver can fail with "DNS cache overflow" in some envs;
  // pre-resolve via getent and pass --resolve to bypass it.
  const hostname = new URL(ROSA_BASE).hostname;
  const ip = await resolveHost(hostname);
  const resolveArgs = ip ? ["--resolve", `${hostname}:443:${ip}`] : [];

  const result = execFileSync("curl", ["--http1.1", "-s", url, ...resolveArgs, ...headerArgs, "--max-time", "20"], {
    encoding: "utf8",
    timeout: 25000,
  });
  return JSON.parse(result);
}

async function checkLicense() {
  // First check the license registry (full licensees show up here, not in permit search)
  let licenseData;
  try {
    console.log("Querying NYSED ROSA API (license search)...");
    licenseData = await queryRosaApi("V2/byProfessionAndName", {
      name,
      professionCode,
    });
  } catch (err) {
    console.error("License API query failed:", err.message);
    licenseData = { content: [] };
  }

  const licenseResults = licenseData?.content || [];

  // Deduplicate by licenseNumber (the API sometimes returns dupes)
  const seen = new Set();
  const uniqueLicenses = licenseResults.filter((item) => {
    const key = item.licenseNumber?.value || JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Also check permit search for Limited Permit status
  let permitData;
  try {
    console.log("Querying NYSED ROSA API (permit search)...");
    permitData = await queryRosaApi("V2/byProfessionAndPermitteeName", {
      permitteeName: name,
      professionCode,
    });
  } catch (err) {
    console.error("Permit API query failed:", err.message);
    permitData = { content: [] };
  }

  const permitResults = permitData?.content || [];

  console.log("\n--- License Records ---");
  printResults(uniqueLicenses);
  console.log("--- Permit Records ---");
  printResults(permitResults);

  if (notifyMode) {
    const fullLicenseRecord = uniqueLicenses[0];

    if (fullLicenseRecord) {
      const subject = "Your NY Psychology License Has Arrived!";
      const text = [
        `Your NYSED psychology license is now active!\n`,
        `Name: ${fullLicenseRecord?.name?.value || name}`,
        `Profession: ${fullLicenseRecord?.profession?.value || "Psychology (068)"}`,
        `License #: ${fullLicenseRecord?.licenseNumber?.value || ""}`,
        fullLicenseRecord?.dateOfLicensure?.value ? `Date of Licensure: ${fullLicenseRecord.dateOfLicensure.value}` : "",
        fullLicenseRecord?.address?.value ? `Address on file: ${fullLicenseRecord.address.value}` : "",
        `\nChecked: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}`,
        `\nVerify at: https://eservices.nysed.gov/professions/verification-search`,
      ].filter(Boolean).join("\n");

      console.log("\n*** FULL LICENSE DETECTED! Sending email... ***\n");
      await sendEmail(subject, text);
    } else {
      console.log("\nNo full license yet. Will check again tomorrow.");
    }
  }

  return { licenseData, permitData };
}

function printResults(results) {
  if (!results || results.length === 0) {
    console.log("No results found.");
    return;
  }

  console.log(`Found ${results.length} result(s):\n`);

  const skipKeys = new Set(["id", "professionCode", "supervisors", "formattedPermitNumber"]);

  for (const item of results) {
    console.log("─".repeat(60));
    for (const [key, val] of Object.entries(item)) {
      if (skipKeys.has(key)) continue;
      if (val === null || val === undefined) continue;

      if (typeof val === "object" && val.label && val.value) {
        console.log(`${val.label.padEnd(20)} ${val.value}`);
      } else if (typeof val === "string" && val) {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
        console.log(`${label.padEnd(20)} ${val}`);
      }
    }
    console.log("");
  }
}

checkLicense();
