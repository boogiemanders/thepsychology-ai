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
  var INDIVIDUAL_PROVIDER_TOKENS = /* @__PURE__ */ new Set([
    "inzinna",
    // Gregory Inzinna (Greg)
    "boatwright",
    // Bret Boatwright
    "singh",
    // Lorin Singh
    "chan",
    // Anders Chan
    "difranco",
    // Filomena DiFranco
    "espinal"
    // Juan Carlos Espinal (Carlos)
  ]);
  function reviewProfile(clinician) {
    const tokens = clinician.toLowerCase().replace(/[.,]/g, "").split(/\s+/);
    return tokens.some((t) => INDIVIDUAL_PROVIDER_TOKENS.has(t)) ? "Individual" : "Practice";
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
              reviewProfile(a.clinician),
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
    "Review Profile",
    "Location",
    "Appointment Date",
    "Appointment Status"
  ];
  var FULL_HEADER = [
    "Client",
    "Location",
    "Last Visit",
    "Phone",
    "Email",
    "Provider",
    "Shows Manhattan",
    "Shows Virtual",
    "Match",
    "Note"
  ];
  function fullRows(rows) {
    return rows.map((r) => [
      r.clientName,
      r.location,
      r.lastVisit,
      r.phone,
      r.email,
      r.provider,
      String(r.showsManhattan),
      String(r.showsVirtual),
      r.match,
      r.note
    ]);
  }

  // src/app/app.ts
  var SP = "https://secure.simplepractice.com";
  var DEFAULT_TOKEN = "inz-r8-93kx7q4ftn2m";
  var $ = (id) => document.getElementById(id);
  var hasChrome = typeof chrome !== "undefined" && !!chrome.runtime?.id;
  var merged = null;
  var periodLabel = "";
  var activeFilter = "all";
  var manualFiles = {};
  function iso(d) {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
  function applyPreset(preset) {
    const start = $("start-date");
    const end = $("end-date");
    const today = /* @__PURE__ */ new Date();
    if (preset === "custom") return;
    if (preset === "this-month") {
      start.value = iso(new Date(today.getFullYear(), today.getMonth(), 1));
      end.value = iso(today);
    } else if (preset === "last-month") {
      start.value = iso(new Date(today.getFullYear(), today.getMonth() - 1, 1));
      end.value = iso(new Date(today.getFullYear(), today.getMonth(), 0));
    } else {
      const days = Number(preset);
      const s = new Date(today);
      s.setDate(s.getDate() - days);
      start.value = iso(s);
      end.value = iso(today);
    }
  }
  async function loadSettings() {
    if (!hasChrome) return { url: "", token: DEFAULT_TOKEN };
    const got = await chrome.storage.sync.get(["webAppUrl", "webAppToken"]);
    return { url: got.webAppUrl ?? "", token: got.webAppToken ?? DEFAULT_TOKEN };
  }
  async function saveSettings(url, token) {
    if (!hasChrome) return;
    await chrome.storage.sync.set({ webAppUrl: url, webAppToken: token });
  }
  function setStatus(id, msg, kind = "") {
    const el = $(id);
    el.textContent = msg;
    el.className = `status ${kind}`.trim();
  }
  function reportUrls(startsAt, endsAt) {
    const f = encodeURIComponent;
    return [
      `${SP}/frontend/client-attendance-report-rows.csv?filter%5BstartsAt%5D=${f(startsAt)}&filter%5BendsAt%5D=${f(endsAt)}&sort=clientName`,
      `${SP}/frontend/client-details-report-rows.csv?filter%5BclientStatus%5D=Active&sort=clientName`
    ];
  }
  async function pullFromSp() {
    const startsAt = $("start-date").value;
    const endsAt = $("end-date").value;
    if (!startsAt || !endsAt) {
      setStatus("fetch-status", "Pick a start and end date first.", "error");
      return;
    }
    if (!hasChrome) {
      setStatus("fetch-status", "Open this page through the extension icon to pull directly.", "error");
      return;
    }
    const btn = $("fetch-btn");
    btn.disabled = true;
    setStatus("fetch-status", "Pulling both reports from SimplePractice...");
    try {
      const res = await chrome.runtime.sendMessage({
        type: "FETCH_REPORTS",
        urls: reportUrls(startsAt, endsAt)
      });
      if (!res?.ok) {
        if (res?.error === "LOGIN_REQUIRED") {
          setStatus("fetch-status", "SimplePractice wants you to log in. Log in on the tab that just opened, then press the button again.", "error");
        } else {
          setStatus("fetch-status", `Could not pull reports: ${res?.error ?? "unknown error"}`, "error");
        }
        return;
      }
      const [attendance, details] = res.reports;
      runMerge(attendance, details, `${startsAt} to ${endsAt}`);
      setStatus("fetch-status", "Reports pulled.", "ok");
    } finally {
      btn.disabled = false;
    }
  }
  function detectKind(text) {
    const first = text.slice(0, 300).split("\n")[0].toLowerCase();
    if (first.includes("client_name") && first.includes("office_name")) return "attendance";
    if (first.startsWith("client,") || first.includes("client") && first.includes("phone number")) return "details";
    return null;
  }
  async function handleFiles(files) {
    for (const file of Array.from(files)) {
      const text = await file.text();
      const kind = detectKind(text);
      if (!kind) continue;
      manualFiles[kind] = text;
      const slot = $(`slot-${kind}`);
      slot.textContent = `${kind === "attendance" ? "attendance" : "client details"}: ${file.name}`;
      slot.classList.add("loaded");
    }
    if (manualFiles.attendance && manualFiles.details) {
      runMerge(manualFiles.attendance, manualFiles.details, "");
    }
  }
  function runMerge(attendanceCsv, detailsCsv, label) {
    merged = mergeReports(attendanceCsv, detailsCsv);
    if (!label) {
      const dates = merged.rows.map((r) => r.lastVisit).filter(Boolean).map((s) => {
        const [mm, dd, yyyy] = s.split("/");
        return `${yyyy}-${mm}-${dd}`;
      }).sort();
      label = dates.length ? `${dates[0]} to ${dates[dates.length - 1]}` : "unknown period";
    }
    periodLabel = label;
    render();
  }
  function visibleRows() {
    if (!merged) return [];
    if (activeFilter === "all") return merged.rows;
    if (activeFilter === "issues") {
      return merged.rows.filter((r) => r.match === "not_found" || !r.phone && !r.email);
    }
    return merged.rows.filter((r) => r.location === activeFilter);
  }
  function render() {
    if (!merged) return;
    $("results").classList.remove("hidden");
    $("period-label").textContent = periodLabel;
    const s = merged.stats;
    const manhattan = merged.rows.filter((r) => r.location === "Manhattan").length;
    const virtual = merged.rows.filter((r) => r.location === "Virtual").length;
    $("stats-line").textContent = `${s.rows} people from ${s.appointments} appointments \xB7 ${manhattan} Manhattan \xB7 ${virtual} Virtual \xB7 ${s.notFound} not in client details \xB7 ${s.missingContact} without contact info \xB7 ${merged.rater8.length} rater8 rows (one per visit)`;
    const tbody = $("results-table").querySelector("tbody");
    tbody.innerHTML = "";
    for (const r of visibleRows()) {
      const tr = document.createElement("tr");
      if (r.match === "not_found" || !r.phone && !r.email) tr.className = "problem";
      const cells = [
        r.clientName,
        `<span class="loc-badge loc-${r.location}">${r.location}</span>`,
        r.lastVisit,
        r.phone,
        r.email,
        r.provider,
        r.match === "not_found" && r.note ? `${r.match} \xB7 ${r.note}` : r.match
      ];
      cells.forEach((c, i) => {
        const td = document.createElement("td");
        if (i === 1) td.innerHTML = c;
        else td.textContent = c;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
  }
  function downloadCsv(filename, content) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function safeLabel() {
    return periodLabel.replace(/[^0-9a-z-]+/gi, "_");
  }
  async function sendToSheet() {
    if (!merged) return;
    const { url, token } = await loadSettings();
    if (!url) {
      setStatus("action-status", "Add the Google Sheet web app URL in settings (gear icon) first.", "error");
      $("settings").classList.remove("hidden");
      return;
    }
    const btn = $("send-sheet");
    btn.disabled = true;
    setStatus("action-status", "Sending to Google Sheet...");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          token,
          tab: periodLabel,
          header: FULL_HEADER,
          rows: fullRows(merged.rows)
        })
      });
      const data = await res.json().catch(() => null);
      if (data?.ok) {
        setStatus("action-status", `Sheet tab "${periodLabel}" updated (${data.rows} rows).`, "ok");
      } else {
        setStatus("action-status", `Sheet update failed: ${data?.error ?? `HTTP ${res.status}`}`, "error");
      }
    } catch (e) {
      setStatus("action-status", `Sheet update failed: ${e}`, "error");
    } finally {
      btn.disabled = false;
    }
  }
  async function copyList(kind) {
    const rows = visibleRows();
    const values = [...new Set(rows.map((r) => kind === "email" ? r.email : r.phone).filter(Boolean))];
    await navigator.clipboard.writeText(values.join(", "));
    setStatus("action-status", `Copied ${values.length} ${kind === "email" ? "emails" : "phone numbers"} (${activeFilter}).`, "ok");
  }
  async function init() {
    applyPreset("30");
    $("preset").addEventListener(
      "change",
      (e) => applyPreset(e.target.value)
    );
    $("fetch-btn").addEventListener("click", pullFromSp);
    const settings = await loadSettings();
    $("webapp-url").value = settings.url;
    $("webapp-token").value = settings.token;
    $("settings-toggle").addEventListener("click", () => $("settings").classList.toggle("hidden"));
    $("save-settings").addEventListener("click", async () => {
      await saveSettings($("webapp-url").value.trim(), $("webapp-token").value.trim());
      setStatus("settings-status", "Saved.", "ok");
    });
    const dz = $("drop-zone");
    dz.addEventListener("dragover", (e) => {
      e.preventDefault();
      dz.classList.add("dragover");
    });
    dz.addEventListener("dragleave", () => dz.classList.remove("dragover"));
    dz.addEventListener("drop", (e) => {
      e.preventDefault();
      dz.classList.remove("dragover");
      if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
    });
    $("file-input").addEventListener("change", (e) => {
      const input = e.target;
      if (input.files) handleFiles(input.files);
    });
    $("dl-rater8").addEventListener("click", () => {
      if (!merged) return;
      downloadCsv(`rater8_${safeLabel()}.csv`, toCsv(RATER8_HEADER, merged.rater8));
    });
    $("dl-full").addEventListener("click", () => {
      if (!merged) return;
      downloadCsv(`client_locations_${safeLabel()}.csv`, toCsv(FULL_HEADER, fullRows(merged.rows)));
    });
    $("send-sheet").addEventListener("click", sendToSheet);
    $("copy-emails").addEventListener("click", () => copyList("email"));
    $("copy-phones").addEventListener("click", () => copyList("phone"));
    document.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        activeFilter = chip.dataset.filter;
        render();
      });
    });
  }
  init();
})();
//# sourceMappingURL=app.js.map
