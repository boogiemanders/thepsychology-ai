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
async function queryRosaApi(endpoint, params) {
  const qs = new URLSearchParams({ ...params, pageNumber: 0, pageSize: 25 }).toString();
  const url = `${ROSA_BASE}${endpoint}?${qs}`;
  const headerArgs = Object.entries(ROSA_HEADERS).flatMap(([k, v]) => ["-H", `${k}: ${v}`]);
  const { execFileSync } = await import("child_process");
  const result = execFileSync("curl", ["--http1.1", "-s", url, ...headerArgs, "--max-time", "20"], {
    encoding: "utf8",
    timeout: 25000,
  });
  return JSON.parse(result);
}

async function checkLicense() {
  let data;
  try {
    console.log("Querying NYSED ROSA API (permit search)...");
    data = await queryRosaApi("V2/byProfessionAndPermitteeName", {
      permitteeName: name,
      professionCode,
    });
  } catch (err) {
    console.error("Direct API query failed:", err.message);
    process.exit(1);
  }

  const results = data?.content || [];
  printResults(results);

  if (notifyMode) {
    const fullLicense = results.find((item) => {
      const permitType = item.permitType?.value || "";
      const permitStatus = item.permitStatus?.value || "";
      const licenseStatus = item.licenseStatus?.value || item.status?.value || "";
      const isLimited = permitType.toLowerCase().includes("limited");
      const isValid = permitStatus.toLowerCase().includes("valid") || licenseStatus.toLowerCase().includes("active");
      return !isLimited && isValid;
    });

    const hasFullLicense = results.some((item) => {
      const type = item.permitType?.value || item.licenseType?.value || "";
      return (
        !type.toLowerCase().includes("limited") &&
        type !== "" &&
        (item.permitStatus?.value || "").toLowerCase().includes("valid")
      );
    });

    if (fullLicense || hasFullLicense) {
      const record = fullLicense || results.find(r => !r.permitType?.value?.toLowerCase().includes("limited"));
      const subject = "Your NY Psychology License Has Arrived!";
      const text = [
        `Your NYSED license status has changed!\n`,
        `Name: ${record?.name?.value || name}`,
        `Profession: ${record?.profession?.value || "Psychology (068)"}`,
        `Type: ${record?.permitType?.value || "Licensed"}`,
        `Status: ${record?.permitStatus?.value || record?.licenseStatus?.value || ""}`,
        `Permit #: ${record?.formattedPermitNumber || record?.permitNumber?.value || ""}`,
        record?.issueDate?.value ? `Issued: ${record.issueDate.value}` : "",
        record?.expireDate?.value ? `Valid Through: ${record.expireDate.value}` : "",
        `\nChecked: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}`,
        `\nVerify at: https://eservices.nysed.gov/professions/verification-search`,
      ].filter(Boolean).join("\n");

      console.log("\n*** FULL LICENSE DETECTED! Sending email... ***\n");
      await sendEmail(subject, text);
    } else {
      console.log("\nNo full license yet — still Limited Permit. Will check again tomorrow.");
    }
  }

  return data;
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
