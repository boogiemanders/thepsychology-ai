#!/usr/bin/env node
/**
 * NYSED License Verification
 *
 * Queries the NY State Education Department license verification site
 * via Playwright browser automation.
 *
 * Usage:
 *   node scripts/check-nysed-license.mjs "Anders Chan"
 *   node scripts/check-nysed-license.mjs "Anders Chan" --profession 068
 *   node scripts/check-nysed-license.mjs "Anders Chan" --notify   # sends email if full license found
 */

import { chromium } from "playwright-core";
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

async function checkLicense() {
  const executablePath =
    process.env.CHROME_PATH ||
    "/Users/anderschan/Library/Caches/ms-playwright/chromium-1208/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
  const browser = await chromium.launch({ headless: false, executablePath });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  // Intercept the API response
  let resolveApi;
  const apiResponsePromise = new Promise((resolve) => { resolveApi = resolve; });

  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("api.nysed.gov/rosa") && url.includes("byProfession") && response.status() === 200) {
      try {
        const json = await response.json();
        resolveApi(json);
      } catch {}
    }
  });

  try {
    console.log("Loading NYSED verification page...");
    await page.goto(
      "https://eservices.nysed.gov/professions/verification-search",
      { waitUntil: "load", timeout: 30000 }
    );

    // Wait for the Vue dropdowns to render
    await page.waitForSelector('input[aria-autocomplete="list"]', { timeout: 15000 });
    await page.waitForTimeout(1500);

    const dropdowns = page.locator('input[aria-autocomplete="list"]');

    // Step 1: Select "Search By" = "Name"
    console.log('Setting Search By = "Name"...');
    const searchByInput = dropdowns.nth(0);
    await searchByInput.click();
    await page.waitForTimeout(300);
    await searchByInput.pressSequentially("Name", { delay: 50 });
    await page.waitForTimeout(800);

    const nameOption = page.locator('[role="option"]').filter({ hasText: /^Name$/i }).first();
    if (await nameOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameOption.click();
    } else {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(200);
      await page.keyboard.press("Enter");
    }
    await page.waitForTimeout(500);

    // Step 2: Select Profession = "Psychologist (068)"
    console.log("Setting Profession = Psychologist...");
    const profInput = dropdowns.nth(1);
    await profInput.click();
    await page.waitForTimeout(300);
    await profInput.pressSequentially("Psychologist", { delay: 50 });
    await page.waitForTimeout(800);

    const psychOption = page.locator('[role="option"]').filter({ hasText: /Psychologist/i }).first();
    if (await psychOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await psychOption.click();
    } else {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(200);
      await page.keyboard.press("Enter");
    }
    await page.waitForTimeout(500);

    // Step 3: Fill name
    console.log(`Entering name: ${name}`);
    const nameField = page.locator("#searchInput");
    await nameField.waitFor({ state: "visible", timeout: 5000 });
    await nameField.click();
    await nameField.fill(name);
    await page.waitForTimeout(300);

    // Step 4: Click GO
    console.log("Clicking GO...");
    const goBtn = page.locator("#goButton");
    await page.waitForFunction(() => {
      const btn = document.querySelector("#goButton");
      return btn && !btn.disabled;
    }, { timeout: 5000 });
    await goBtn.click();

    // Wait for API response
    console.log("Waiting for results...\n");
    const data = await Promise.race([
      apiResponsePromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("No API response within 30s")), 30000)
      ),
    ]);

    const results = data?.content || [];
    printResults(results);

    // Check if a full license (not Limited Permit) exists
    if (notifyMode) {
      const fullLicense = results.find((item) => {
        const permitType = item.permitType?.value || "";
        const permitStatus = item.permitStatus?.value || "";
        const licenseStatus = item.licenseStatus?.value || item.status?.value || "";
        // A full license won't say "Limited Permit"
        const isLimited = permitType.toLowerCase().includes("limited");
        const isValid = permitStatus.toLowerCase().includes("valid") || licenseStatus.toLowerCase().includes("active");
        return !isLimited && isValid;
      });

      // Also check if there are multiple records — one might be the full license
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
  } catch (err) {
    console.error("\nError:", err.message);
    await page.screenshot({ path: "/tmp/nysed-debug.png" }).catch(() => {});
    process.exit(1);
  } finally {
    await browser.close();
  }
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
