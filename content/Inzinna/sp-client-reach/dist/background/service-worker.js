"use strict";
(() => {
  // src/lib/csv.ts
  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    let i = 0;
    if (text.charCodeAt(0) === 65279) text = text.slice(1);
    while (i < text.length) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 2;
            continue;
          }
          inQuotes = false;
          i++;
          continue;
        }
        field += c;
        i++;
        continue;
      }
      if (c === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (c === ",") {
        row.push(field);
        field = "";
        i++;
        continue;
      }
      if (c === "\r") {
        i++;
        continue;
      }
      if (c === "\n") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        i++;
        continue;
      }
      field += c;
      i++;
    }
    if (field !== "" || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }
  function rowsToObjects(rows) {
    if (rows.length === 0) return [];
    const header = rows[0].map((h) => h.trim());
    return rows.slice(1).map((r) => {
      const obj = {};
      header.forEach((h, idx) => {
        obj[h] = (r[idx] ?? "").trim();
      });
      return obj;
    });
  }
  function escapeField(v) {
    if (/[",\n\r]/.test(v)) {
      return '"' + v.replace(/"/g, '""') + '"';
    }
    return v;
  }
  function toCsv(header, rows) {
    const lines = [header, ...rows].map((r) => r.map(escapeField).join(","));
    return lines.join("\r\n") + "\r\n";
  }

  // src/lib/merge.ts
  var OFFICE_LOCATION = {
    Manhattan: "Manhattan",
    "Video Office": "Virtual"
  };
  function parseDateUs(s) {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
    if (!m) return null;
    const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
    return isNaN(d.getTime()) ? null : d;
  }
  function fmtDateUs(d) {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}/${dd}/${d.getFullYear()}`;
  }
  function normName(s) {
    return s.replace(/"[^"]*"/g, " ").replace(/[.']/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  }
  function pickDetailRow(rows) {
    return rows.slice().sort((a, b) => {
      const hasA = a["Phone number"] || a["Email"] ? 1 : 0;
      const hasB = b["Phone number"] || b["Email"] ? 1 : 0;
      if (hasA !== hasB) return hasB - hasA;
      const dA = parseDateUs(a["Last appointment"] || "")?.getTime() ?? 0;
      const dB = parseDateUs(b["Last appointment"] || "")?.getTime() ?? 0;
      return dB - dA;
    })[0];
  }
  function buildDetailIndex(details) {
    const byName = /* @__PURE__ */ new Map();
    for (const r of details) {
      const name = (r["Client"] || "").trim();
      if (!name) continue;
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push(r);
    }
    const exact = /* @__PURE__ */ new Map();
    const norm = /* @__PURE__ */ new Map();
    const firstLast = /* @__PURE__ */ new Map();
    for (const [name, rows] of byName) {
      const row = pickDetailRow(rows);
      exact.set(name, row);
      const n = normName(name);
      if (!norm.has(n)) norm.set(n, row);
      const toks = n.split(" ");
      if (toks.length >= 2) {
        const key = `${toks[0]}|${toks[toks.length - 1]}`;
        if (!firstLast.has(key)) firstLast.set(key, []);
        firstLast.get(key).push(row);
      }
    }
    return { exact, norm, firstLast };
  }
  function lookupClient(name, idx) {
    const exact = idx.exact.get(name);
    if (exact) return { row: exact, how: "exact" };
    const n = idx.norm.get(normName(name));
    if (n) return { row: n, how: "normalized" };
    const toks = normName(name).split(" ");
    if (toks.length >= 2) {
      const hits = idx.firstLast.get(`${toks[0]}|${toks[toks.length - 1]}`);
      if (hits && hits.length === 1) return { row: hits[0], how: "first+last" };
    }
    return { row: null, how: "not_found" };
  }
  var MAIN_PROVIDER_IDS = {
    inzinna: "1428233",
    // Gregory Inzinna (Greg)
    boatwright: "1486605",
    // Bret Boatwright
    singh: "1726930",
    // Lorin Singh
    chan: "1973632",
    // Anders Chan
    difranco: "1717850",
    // Filomena DiFranco
    espinal: "1822167"
    // Juan Carlos Espinal (Carlos)
  };
  function providerOrTrainee(clinician) {
    const tokens = clinician.toLowerCase().replace(/[.,]/g, "").split(/\s+/);
    for (const t of tokens) {
      if (MAIN_PROVIDER_IDS[t]) return MAIN_PROVIDER_IDS[t];
    }
    return "Trainee";
  }
  function splitName(full) {
    const toks = full.trim().split(/\s+/);
    if (toks.length <= 1) return [toks[0] ?? "", ""];
    return [toks.slice(0, -1).join(" "), toks[toks.length - 1]];
  }
  function expandCouple(name) {
    if (!name.includes(" & ")) return null;
    const sides = name.split(" & ").map((s) => s.trim()).filter(Boolean);
    if (sides.length < 2) return null;
    const lastNames = sides.map((s) => s.split(/\s+/)).map((toks) => toks.length >= 2 ? toks[toks.length - 1] : null);
    const fallbackLast = lastNames.find((l) => l !== null) ?? null;
    return sides.map((s) => {
      const toks = s.split(/\s+/);
      if (toks.length >= 2) return s;
      return fallbackLast ? `${s} ${fallbackLast}` : s;
    });
  }
  function mergeReports(attendanceCsv, detailsCsv) {
    const attRows = rowsToObjects(parseCsv(attendanceCsv));
    const appts = attRows.filter((r) => parseDateUs(r["date_of_service"] || ""));
    const details = rowsToObjects(parseCsv(detailsCsv)).filter((r) => (r["Client"] || "").trim());
    const byClient = /* @__PURE__ */ new Map();
    for (const r of appts) {
      const name = (r["client_name"] || "").trim();
      if (!name) continue;
      if (!byClient.has(name)) byClient.set(name, []);
      byClient.get(name).push({
        date: parseDateUs(r["date_of_service"]),
        office: (r["office_name"] || "").trim(),
        status: (r["status"] || "").trim(),
        clinician: (r["clinician_name"] || "").trim()
      });
    }
    const idx = buildDetailIndex(details);
    const rows = [];
    const rater8 = [];
    const stats = {
      appointments: appts.length,
      attendanceClients: byClient.size,
      detailClients: idx.exact.size,
      rows: 0,
      matched: 0,
      notFound: 0,
      coupleMembers: 0,
      missingContact: 0
    };
    for (const [name, clientAppts] of byClient) {
      const sorted = clientAppts.slice().sort((a, b) => b.date.getTime() - a.date.getTime());
      const shows = sorted.filter((a) => a.status === "Show");
      const showsManhattan = shows.filter((a) => a.office === "Manhattan").length;
      const showsVirtual = shows.filter((a) => a.office === "Video Office").length;
      let office = null;
      for (const pool of [shows, sorted]) {
        const hit = pool.find((a) => OFFICE_LOCATION[a.office]);
        if (hit) {
          office = hit.office;
          break;
        }
      }
      const location = office ? OFFICE_LOCATION[office] : "Unknown";
      const lastVisit = shows.length ? fmtDateUs(shows[0].date) : "";
      const provider = (shows[0] ?? sorted[0])?.clinician ?? "";
      const coupleMembers = idx.exact.has(name) ? null : expandCouple(name);
      const targets = coupleMembers ? coupleMembers.map((m) => ({ name: m, couple: name })) : [{ name, couple: null }];
      for (const t of targets) {
        const { row, how } = lookupClient(t.name, idx);
        const match = t.couple && row ? "couple_member" : how;
        const phone = row?.["Phone number"] ?? "";
        const email = row?.["Email"] ?? "";
        if (row) stats.matched++;
        else stats.notFound++;
        if (t.couple && row) stats.coupleMembers++;
        if (!phone && !email) stats.missingContact++;
        if (phone || email) {
          const [firstName, lastName] = splitName(t.name);
          for (const a of shows) {
            rater8.push([
              firstName,
              lastName,
              email,
              phone,
              a.clinician,
              providerOrTrainee(a.clinician),
              OFFICE_LOCATION[a.office] ?? a.office,
              fmtDateUs(a.date),
              a.status
            ]);
          }
        }
        rows.push({
          clientName: t.name,
          location,
          lastVisit,
          phone,
          email,
          provider,
          showsManhattan,
          showsVirtual,
          match,
          note: t.couple ? `from couple: ${t.couple}` : row ? "" : "not in client details export (archived?)"
        });
      }
    }
    rows.sort((a, b) => a.location.localeCompare(b.location) || a.clientName.localeCompare(b.clientName));
    const sortable = (us) => us.split("/").reverse().join("");
    rater8.sort(
      (a, b) => sortable(a[7]).localeCompare(sortable(b[7])) || a[1].localeCompare(b[1]) || a[0].localeCompare(b[0])
    );
    stats.rows = rows.length;
    return { rows, rater8, stats };
  }
  var RATER8_HEADER = [
    "First Name",
    "Last Name",
    "Email",
    "Cell Phone",
    "Provider",
    "Provider ID",
    "Location",
    "Appointment Date",
    "Appointment Status"
  ];

  // src/lib/rater8-upload.ts
  var RATER8_ORIGIN = "https://rave.rater8.com";
  var RATER8_TENANT_ID = 9008;
  var RATER8_POLLING_FOLDER_ID = "2719";
  var RATER8_POLLING_FOLDER_NAME = "Inzinna Therapy Group - Simple Practice - Manual";
  var SP = "https://secure.simplepractice.com";
  function isoDate(d) {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
  function parseIso(s) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  function owedWindow(lastUploadedThrough, now, notBefore = null) {
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const floor = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const overlapFloor = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);
    let start;
    if (lastUploadedThrough) {
      start = parseIso(lastUploadedThrough);
      start.setDate(start.getDate() + 1);
    } else {
      start = new Date(yesterday.getTime());
    }
    if (start.getTime() > yesterday.getTime()) return null;
    if (start.getTime() > overlapFloor.getTime()) start = overlapFloor;
    if (notBefore) {
      const notBeforeStart = parseIso(notBefore);
      notBeforeStart.setDate(notBeforeStart.getDate() + 1);
      if (start.getTime() < notBeforeStart.getTime()) start = notBeforeStart;
    }
    if (start.getTime() > yesterday.getTime()) return null;
    if (start.getTime() < floor.getTime()) start = floor;
    return { start: isoDate(start), end: isoDate(yesterday) };
  }
  function reportUrls(startsAt, endsAt) {
    const f = encodeURIComponent;
    return [
      `${SP}/frontend/client-attendance-report-rows.csv?filter%5BstartsAt%5D=${f(startsAt)}&filter%5BendsAt%5D=${f(endsAt)}&sort=clientName`,
      `${SP}/frontend/client-details-report-rows.csv?filter%5BclientStatus%5D=Active&sort=clientName`
    ];
  }
  function csvFilename(start, end) {
    return `rater8_${start}_to_${end}.csv`;
  }
  async function hashRow(row) {
    const data = new TextEncoder().encode(row.join("|"));
    const digest = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  async function filterUnsent(rows, sentLog) {
    const fresh = [];
    const hashes = [];
    const seen = /* @__PURE__ */ new Set();
    for (const row of rows) {
      const h = await hashRow(row);
      if (sentLog[h] || seen.has(h)) continue;
      seen.add(h);
      fresh.push(row);
      hashes.push(h);
    }
    return { fresh, hashes };
  }
  function pruneSentLog(sentLog, now, keepDays = 30) {
    const floor = isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - keepDays));
    const out = {};
    for (const [hash, date] of Object.entries(sentLog)) {
      if (date >= floor) out[hash] = date;
    }
    return out;
  }
  function parseJson(body) {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  function evaluateUpload(steps) {
    if (!steps.length) return { ok: false, loggedOut: false, detail: "no response from the rater8 tab" };
    const err = steps.find((s) => s.step === "error");
    if (err) return { ok: false, loggedOut: false, detail: err.body };
    for (const s of steps) {
      const j = parseJson(s.body);
      if (j === null) return { ok: false, loggedOut: true, detail: `${s.step}: got a login page instead of JSON` };
      if (j.unAuthorizedRequest) return { ok: false, loggedOut: true, detail: `${s.step}: not signed in` };
      if (s.status < 200 || s.status >= 300) {
        return { ok: false, loggedOut: false, detail: `${s.step}: HTTP ${s.status}` };
      }
      if (!j.success) {
        return { ok: false, loggedOut: false, detail: `${s.step}: rater8 answered success false` };
      }
    }
    const process = steps.find((s) => s.step === "process");
    if (!process) return { ok: false, loggedOut: false, detail: "file stored but processing never started" };
    const result = parseJson(process.body)?.result ?? {};
    const uploaded = result.filesUploaded ?? 0;
    const failed = result.filesFailed ?? 0;
    if (failed > 0 || uploaded < 1) {
      return { ok: false, loggedOut: false, detail: `rater8 processed ${uploaded} file(s), rejected ${failed}` };
    }
    return { ok: true, loggedOut: false, detail: `rater8 accepted ${uploaded} file(s)` };
  }

  // src/background/service-worker.ts
  var SP_ORIGIN = "https://secure.simplepractice.com";
  function openApp() {
    chrome.tabs.create({ url: chrome.runtime.getURL("app/app.html") });
  }
  if (chrome.action?.onClicked) {
    chrome.action.onClicked.addListener(openApp);
  }
  async function fetchCsvsInPage(urls) {
    const out = [];
    for (const url of urls) {
      try {
        const res = await fetch(url, { credentials: "same-origin" });
        const text = await res.text();
        out.push({ ok: res.ok, text, finalUrl: res.url });
      } catch (e) {
        out.push({ ok: false, text: String(e), finalUrl: url });
      }
    }
    return out;
  }
  function looksLikeLogin(r) {
    return r.finalUrl.includes("sign_in") || /^\s*<!doctype html|^\s*<html/i.test(r.text);
  }
  async function waitForTabComplete(tabId, timeoutMs) {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === "complete") return;
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }, timeoutMs);
      function listener(id, info) {
        if (id === tabId && info.status === "complete") {
          clearTimeout(timer);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      }
      chrome.tabs.onUpdated.addListener(listener);
    });
  }
  async function fetchReports(urls, surfaceLoginTab = true) {
    let [tab] = await chrome.tabs.query({ url: `${SP_ORIGIN}/*` });
    let createdTabId = null;
    if (!tab) {
      tab = await chrome.tabs.create({ url: `${SP_ORIGIN}/`, active: false });
      createdTabId = tab.id;
      await waitForTabComplete(tab.id, 2e4);
    }
    const tabId = tab.id;
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: fetchCsvsInPage,
        args: [urls]
      });
      const reports = result?.result ?? [];
      if (reports.length !== urls.length || reports.some((r) => !r.ok || looksLikeLogin(r))) {
        if (surfaceLoginTab) await chrome.tabs.update(tabId, { active: true });
        return { ok: false, error: "LOGIN_REQUIRED" };
      }
      if (createdTabId !== null) {
        chrome.tabs.remove(createdTabId).catch(() => {
        });
      }
      return { ok: true, reports: reports.map((r) => r.text) };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
  async function uploadCsvInPage(csvText, filename, tenantId, pollingFolderId, pollingFolderName) {
    const out = [];
    try {
      const fd = new FormData();
      fd.append(filename, new File([csvText], filename, { type: "text/csv" }), filename);
      fd.append("uploadername", "C:\\fakepath\\" + filename);
      fd.append("tenantId", String(tenantId));
      fd.append("pollingFolderId", pollingFolderId);
      const res1 = await fetch("/Integration/UploadFiles", {
        method: "POST",
        credentials: "same-origin",
        body: fd
      });
      const body1 = await res1.text();
      out.push({ step: "store", status: res1.status, body: body1 });
      let stored = null;
      try {
        const j = JSON.parse(body1);
        if (j?.success && Array.isArray(j?.result?.fileName)) stored = j.result.fileName;
      } catch {
      }
      if (!stored || !stored.length) return out;
      const res2 = await fetch("/api/services/app/integrationUploadFile/UploadIntegrationFiles", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileList: stored,
          tenantId,
          pollingFolderId,
          pollingFolderName,
          processLocationCodes: false,
          processAppointmentCodes: false,
          processDepartmentCodes: false,
          processEmployeeCodes: false
        })
      });
      out.push({ step: "process", status: res2.status, body: await res2.text() });
    } catch (e) {
      out.push({ step: "error", status: 0, body: String(e) });
    }
    return out;
  }
  async function uploadToRater8(csvText, filename, surfaceLoginTab) {
    let [tab] = await chrome.tabs.query({ url: `${RATER8_ORIGIN}/*` });
    let createdTabId = null;
    if (!tab) {
      tab = await chrome.tabs.create({ url: `${RATER8_ORIGIN}/`, active: false });
      createdTabId = tab.id;
      await waitForTabComplete(tab.id, 2e4);
      tab = await chrome.tabs.get(tab.id);
    }
    const tabId = tab.id;
    if (!tab.url?.startsWith(RATER8_ORIGIN)) {
      if (surfaceLoginTab) await chrome.tabs.update(tabId, { active: true });
      return { steps: [], loggedOutBeforeUpload: true };
    }
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: uploadCsvInPage,
        args: [csvText, filename, RATER8_TENANT_ID, RATER8_POLLING_FOLDER_ID, RATER8_POLLING_FOLDER_NAME]
      });
      const steps = result?.result ?? [];
      const verdict = evaluateUpload(steps);
      if (verdict.ok && createdTabId !== null) {
        chrome.tabs.remove(createdTabId).catch(() => {
        });
      }
      if (verdict.loggedOut && surfaceLoginTab) await chrome.tabs.update(tabId, { active: true });
      return { steps };
    } catch (e) {
      return { steps: [{ step: "error", status: 0, body: String(e) }] };
    }
  }
  var runInFlight = false;
  async function runAutoUpload(trigger) {
    if (runInFlight) return { ok: false, detail: "a run is already in progress" };
    runInFlight = true;
    try {
      return await doRun(trigger);
    } catch (e) {
      return { ok: false, detail: String(e) };
    } finally {
      runInFlight = false;
    }
  }
  async function doRun(trigger) {
    const settings = await chrome.storage.sync.get(["autoUploadEnabled", "slackWebhookUrl"]);
    if (trigger !== "manual" && !settings.autoUploadEnabled) {
      return { ok: false, detail: "auto-upload is switched off" };
    }
    const store = await chrome.storage.local.get(["lastUploadedThrough", "sentLog", "lastAttemptAt", "autoUploadFloor"]);
    const now = /* @__PURE__ */ new Date();
    const window = owedWindow(store.lastUploadedThrough ?? null, now, store.autoUploadFloor ?? null);
    if (!window) return { ok: true, detail: "nothing owed, already up to date" };
    if (trigger === "ridealong" && store.lastAttemptAt && Date.now() - store.lastAttemptAt < 3 * 60 * 1e3) {
      return { ok: false, detail: "tried a few minutes ago" };
    }
    await chrome.storage.local.set({ lastAttemptAt: Date.now() });
    const surface = trigger === "manual";
    const range = window.start === window.end ? window.end : `${window.start} to ${window.end}`;
    const sp = await fetchReports(reportUrls(window.start, window.end), surface);
    if (!sp.ok) {
      if (sp.error === "LOGIN_REQUIRED") {
        await chrome.storage.local.remove("lastAttemptAt");
        await setFailBadge(true);
        await recordRun(false, `waiting for a SimplePractice sign-in (${range})`);
        if (trigger !== "manual") await nudgeOnce(settings.slackWebhookUrl, now, "SimplePractice");
        return { ok: false, detail: "sign into SimplePractice first" };
      }
      await setFailBadge(true);
      await recordRun(false, `SimplePractice pull failed: ${sp.error} (${range})`);
      if (trigger !== "manual") {
        await postSlack(
          settings.slackWebhookUrl,
          `rater8 upload FAILED: SimplePractice pull error (${sp.error}). Open the extension and click "Upload to rater8 now" to retry.`
        );
      }
      return { ok: false, detail: `SimplePractice pull failed: ${sp.error}` };
    }
    const [attendance, details] = sp.reports;
    const merged = mergeReports(attendance, details);
    const sentLog = pruneSentLog(store.sentLog ?? {}, now);
    const { fresh, hashes } = await filterUnsent(merged.rater8, sentLog);
    if (!fresh.length) {
      await chrome.storage.local.set({ sentLog, lastUploadedThrough: window.end });
      await recordRun(true, `0 new visits (${range})`);
      await setFailBadge(false);
      if (trigger !== "manual") {
        await successOnce(settings.slackWebhookUrl, now, `rater8: 0 new visits to upload (${range}).`);
      }
      return { ok: true, detail: `0 new visits (${range})` };
    }
    const up = await uploadToRater8(toCsv(RATER8_HEADER, fresh), csvFilename(window.start, window.end), surface);
    const verdict = evaluateUpload(up.steps);
    if (up.loggedOutBeforeUpload || verdict.loggedOut) {
      await chrome.storage.local.remove("lastAttemptAt");
      await setFailBadge(true);
      await recordRun(false, `waiting for a rater8 sign-in (${range})`);
      if (trigger !== "manual") await nudgeOnce(settings.slackWebhookUrl, now, "rater8");
      return { ok: false, detail: "sign into rater8 first" };
    }
    if (!verdict.ok) {
      await setFailBadge(true);
      await recordRun(false, `${verdict.detail} (${range})`);
      if (trigger !== "manual") {
        await postSlack(
          settings.slackWebhookUrl,
          `rater8 upload FAILED: ${verdict.detail}. Open the extension and click "Upload to rater8 now" to retry.`
        );
      }
      return { ok: false, detail: verdict.detail };
    }
    for (const h of hashes) sentLog[h] = window.end;
    await chrome.storage.local.set({ sentLog, lastUploadedThrough: window.end });
    await recordRun(true, `uploaded ${fresh.length} visits (${range})`);
    await setFailBadge(false);
    if (trigger !== "manual") {
      await successOnce(settings.slackWebhookUrl, now, `rater8: uploaded ${fresh.length} visits (${range}).`);
    }
    return { ok: true, detail: `uploaded ${fresh.length} visits (${range})` };
  }
  async function recordRun(ok, detail) {
    await chrome.storage.local.set({ lastRunResult: { when: Date.now(), ok, detail } });
  }
  async function postSlack(webhook, text) {
    if (!webhook) return;
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text })
      });
    } catch {
    }
  }
  async function nudgeOnce(webhook, now, site) {
    const today = isoDate(now);
    const key = site === "SimplePractice" ? "lastNudgeDateSp" : "lastNudgeDateR8";
    const store = await chrome.storage.local.get(key);
    if (store[key] === today) return;
    await chrome.storage.local.set({ [key]: today });
    await postSlack(webhook, `rater8 upload waiting: sign into ${site} and I'll do the rest.`);
  }
  async function successOnce(webhook, now, text) {
    const today = isoDate(now);
    const { lastSuccessDate } = await chrome.storage.local.get("lastSuccessDate");
    if (lastSuccessDate === today) return;
    await chrome.storage.local.set({ lastSuccessDate: today });
    await postSlack(webhook, text);
  }
  async function setFailBadge(on) {
    await chrome.action.setBadgeText({ text: on ? "!" : "" });
    if (on) await chrome.action.setBadgeBackgroundColor({ color: "#d93025" });
  }
  var ALARM_NAME = "rater8-daily";
  function msUntilNext7am(now) {
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0);
    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
    return next.getTime() - now.getTime();
  }
  function armAlarm() {
    chrome.alarms.create(ALARM_NAME, {
      when: Date.now() + msUntilNext7am(/* @__PURE__ */ new Date()),
      periodInMinutes: 1440
    });
  }
  chrome.runtime.onInstalled.addListener(() => {
    armAlarm();
    void runAutoUpload("ridealong");
  });
  chrome.runtime.onStartup.addListener(() => {
    armAlarm();
    void runAutoUpload("ridealong");
  });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) void runAutoUpload("alarm");
  });
  chrome.tabs.onUpdated.addListener((_tabId, info, tab) => {
    if (info.status !== "complete" || !tab.url) return;
    const watched = tab.url.startsWith(`${SP_ORIGIN}/`) || tab.url.startsWith(`${RATER8_ORIGIN}/`);
    if (!watched || /sign_in|login/i.test(tab.url)) return;
    void runAutoUpload("ridealong");
  });
  chrome.runtime.onMessage.addListener(
    (msg, _sender, sendResponse) => {
      if (msg?.type === "FETCH_REPORTS") {
        fetchReports(msg.urls).then(sendResponse);
        return true;
      }
      if (msg?.type === "RUN_RATER8_UPLOAD") {
        runAutoUpload("manual").then(sendResponse);
        return true;
      }
    }
  );
})();
//# sourceMappingURL=service-worker.js.map
