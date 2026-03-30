"use strict";
(() => {
  // src/lib/types.ts
  var DEFAULT_PREFERENCES = {
    providerFirstName: "Anders",
    providerLastName: "Chan",
    defaultLocation: "Video Office",
    firstVisitCPT: "90791",
    followUpCPT: "90837",
    vobTo: ["david@sosapartners.com", "support@sosapartners.com"],
    vobCc: ["greg@drinzinna.com", "carlos@drinzinna.com"],
    vobSignature: `Regards,
Anders

Anders H. Chan, PsyD (he/him)
Postdoctoral Fellow
DrAnders@DrInzinna.com
1-516-226-0379`
  };

  // src/lib/storage.ts
  var CLIENT_STORAGE_KEY = "capturedClient";
  var PENDING_VOB_KEY = "pendingVobDraft";
  var PREFS_KEY = "providerPreferences";
  var LEGACY_LOCAL_CLIENT_KEY = CLIENT_STORAGE_KEY;
  function normalizePreferences(prefs) {
    return {
      ...DEFAULT_PREFERENCES,
      ...prefs,
      providerFirstName: prefs?.providerFirstName?.trim() || DEFAULT_PREFERENCES.providerFirstName,
      providerLastName: prefs?.providerLastName?.trim() || DEFAULT_PREFERENCES.providerLastName,
      defaultLocation: prefs?.defaultLocation?.trim() || DEFAULT_PREFERENCES.defaultLocation,
      firstVisitCPT: prefs?.firstVisitCPT?.trim() || DEFAULT_PREFERENCES.firstVisitCPT,
      followUpCPT: prefs?.followUpCPT?.trim() || DEFAULT_PREFERENCES.followUpCPT,
      vobTo: prefs?.vobTo?.length ? prefs.vobTo : DEFAULT_PREFERENCES.vobTo,
      vobCc: prefs?.vobCc?.length ? prefs.vobCc : DEFAULT_PREFERENCES.vobCc,
      vobSignature: prefs?.vobSignature?.trim() || DEFAULT_PREFERENCES.vobSignature
    };
  }
  async function migrateLegacyClientIfPresent() {
    const legacyResult = await chrome.storage.local.get(LEGACY_LOCAL_CLIENT_KEY);
    const legacyClient = legacyResult[LEGACY_LOCAL_CLIENT_KEY];
    if (!legacyClient) return null;
    await chrome.storage.session.set({ [CLIENT_STORAGE_KEY]: legacyClient });
    await chrome.storage.local.remove(LEGACY_LOCAL_CLIENT_KEY);
    return legacyClient;
  }
  async function saveClient(client) {
    await chrome.storage.session.set({ [CLIENT_STORAGE_KEY]: client });
  }
  async function getClient() {
    const result = await chrome.storage.session.get(CLIENT_STORAGE_KEY);
    if (result[CLIENT_STORAGE_KEY]) {
      return result[CLIENT_STORAGE_KEY];
    }
    return migrateLegacyClientIfPresent();
  }
  async function clearClient() {
    await chrome.storage.session.remove(CLIENT_STORAGE_KEY);
    await chrome.storage.session.remove(PENDING_VOB_KEY);
    await chrome.storage.local.remove(LEGACY_LOCAL_CLIENT_KEY);
  }
  async function updateStatus(updates) {
    const client = await getClient();
    if (!client) return;
    client.status = { ...client.status, ...updates };
    await saveClient(client);
  }
  async function getPreferences() {
    const result = await chrome.storage.local.get(PREFS_KEY);
    return normalizePreferences(result[PREFS_KEY]);
  }
  async function savePreferences(prefs) {
    await chrome.storage.local.set({ [PREFS_KEY]: normalizePreferences(prefs) });
  }
  async function hasPreferences() {
    const result = await chrome.storage.local.get(PREFS_KEY);
    return !!result[PREFS_KEY];
  }
  async function savePendingVobDraft(draft) {
    await chrome.storage.session.set({ [PENDING_VOB_KEY]: draft });
  }

  // src/lib/vob-email.ts
  function abbreviateName(name) {
    return name.trim().substring(0, 3);
  }
  function formatTimeShort(time) {
    const match = time.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm|a|p)?/i);
    if (!match) return time;
    const hour = match[1];
    const ampm = (match[3] || "").toLowerCase();
    const suffix = ampm.startsWith("p") ? "p" : ampm.startsWith("a") ? "a" : "";
    return `${hour}${suffix}`;
  }
  function formatDateShort(dateStr) {
    if (!dateStr) return "";
    const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      return `${parseInt(isoMatch[2], 10)}/${parseInt(isoMatch[3], 10)}`;
    }
    const monthNames = {
      jan: 1,
      feb: 2,
      mar: 3,
      apr: 4,
      may: 5,
      jun: 6,
      jul: 7,
      aug: 8,
      sep: 9,
      oct: 10,
      nov: 11,
      dec: 12
    };
    const namedMatch = dateStr.match(/([A-Za-z]+)\s+(\d{1,2})/);
    if (namedMatch) {
      const month = monthNames[namedMatch[1].toLowerCase().substring(0, 3)];
      const day = parseInt(namedMatch[2], 10);
      if (month && day) return `${month}/${day}`;
    }
    const slashMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
    if (slashMatch) {
      return `${parseInt(slashMatch[1], 10)}/${parseInt(slashMatch[2], 10)}`;
    }
    return dateStr;
  }
  function buildVobSubject(client) {
    const first3 = abbreviateName(client.firstName);
    const last3 = abbreviateName(client.lastName);
    return `VOB \u2013 Inzinna - ${first3} ${last3}`;
  }
  async function buildVobBody(client) {
    const prefs = await getPreferences();
    const first3 = abbreviateName(client.firstName);
    const last3 = abbreviateName(client.lastName);
    const date = formatDateShort(client.appointmentDate);
    const time = formatTimeShort(client.appointmentTime);
    return `Hello,
New pt submitted: ${first3} ${last3} ${date} ${time}

${prefs.vobSignature}`;
  }
  async function openVobEmail(client) {
    const prefs = await getPreferences();
    const subject = buildVobSubject(client);
    const body = await buildVobBody(client);
    const to = prefs.vobTo.join(",");
    const cc = prefs.vobCc.join(",");
    await savePendingVobDraft({
      to: prefs.vobTo,
      cc: prefs.vobCc,
      subject,
      body,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(to)}&cc=${encodeURIComponent(cc)}`;
    window.open(gmailUrl, "_blank");
  }

  // src/popup/popup.ts
  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }
  function updateCheckItem(id, done) {
    const el = document.getElementById(id);
    if (!el) return;
    const icon = el.querySelector(".check-icon");
    if (done) {
      el.classList.add("done");
      if (icon) icon.textContent = "\u2713";
    } else {
      el.classList.remove("done");
      if (icon) icon.textContent = "\u25CB";
    }
  }
  function showView(view) {
    const emptyState = document.getElementById("empty-state");
    const clientInfo = document.getElementById("client-info");
    const settingsPanel = document.getElementById("settings-panel");
    if (view === "settings") {
      emptyState.style.display = "none";
      clientInfo.style.display = "none";
      settingsPanel.style.display = "flex";
    } else {
      settingsPanel.style.display = "none";
    }
  }
  async function populateSettingsForm() {
    const prefs = await getPreferences();
    document.getElementById("pref-firstName").value = prefs.providerFirstName;
    document.getElementById("pref-lastName").value = prefs.providerLastName;
    document.getElementById("pref-location").value = prefs.defaultLocation;
    document.getElementById("pref-firstCPT").value = prefs.firstVisitCPT;
    document.getElementById("pref-followUpCPT").value = prefs.followUpCPT;
    document.getElementById("pref-vobTo").value = prefs.vobTo.join(", ");
    document.getElementById("pref-vobCc").value = prefs.vobCc.join(", ");
    document.getElementById("pref-signature").value = prefs.vobSignature;
  }
  function readSettingsForm() {
    return {
      providerFirstName: document.getElementById("pref-firstName").value.trim(),
      providerLastName: document.getElementById("pref-lastName").value.trim(),
      defaultLocation: document.getElementById("pref-location").value,
      firstVisitCPT: document.getElementById("pref-firstCPT").value.trim() || DEFAULT_PREFERENCES.firstVisitCPT,
      followUpCPT: document.getElementById("pref-followUpCPT").value.trim() || DEFAULT_PREFERENCES.followUpCPT,
      vobTo: document.getElementById("pref-vobTo").value.split(",").map((s) => s.trim()).filter(Boolean),
      vobCc: document.getElementById("pref-vobCc").value.split(",").map((s) => s.trim()).filter(Boolean),
      vobSignature: document.getElementById("pref-signature").value
    };
  }
  async function render() {
    const client = await getClient();
    const prefs = await getPreferences();
    document.getElementById("provider-badge").textContent = `Provider: ${prefs.providerFirstName} ${prefs.providerLastName}`;
    const emptyState = document.getElementById("empty-state");
    const clientInfo = document.getElementById("client-info");
    if (!client) {
      emptyState.style.display = "block";
      clientInfo.style.display = "none";
      return;
    }
    emptyState.style.display = "none";
    clientInfo.style.display = "flex";
    document.getElementById("client-name").textContent = `${client.firstName} ${client.lastName}`;
    const metaParts = [];
    if (client.insuranceCompany) metaParts.push(client.insuranceCompany);
    if (client.appointmentDate) metaParts.push(client.appointmentDate);
    metaParts.push(`Captured ${formatDate(client.capturedAt)}`);
    document.getElementById("client-meta").textContent = metaParts.join(" \xB7 ");
    updateCheckItem("check-client", client.status.clientCreated);
    updateCheckItem("check-appointment", client.status.appointmentSet);
    updateCheckItem("check-insurance", client.status.insuranceAdded);
    updateCheckItem("check-vob", client.status.vobEmailSent);
  }
  document.getElementById("btn-toggle-btns")?.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const btns = document.querySelectorAll(".spn-floating-btn, .zsp-floating-btn");
        const anyVisible = Array.from(btns).some((b) => b.style.display !== "none");
        btns.forEach((b) => {
          b.style.display = anyVisible ? "none" : "";
        });
      }
    });
  });
  document.getElementById("btn-settings")?.addEventListener("click", async () => {
    await populateSettingsForm();
    showView("settings");
  });
  document.getElementById("btn-save-prefs")?.addEventListener("click", async () => {
    const prefs = readSettingsForm();
    await savePreferences(prefs);
    showView("main");
    render();
  });
  document.getElementById("btn-cancel-prefs")?.addEventListener("click", () => {
    showView("main");
    render();
  });
  document.getElementById("btn-vob")?.addEventListener("click", async () => {
    const client = await getClient();
    if (!client) return;
    await openVobEmail(client);
    await updateStatus({ vobEmailSent: true });
    render();
  });
  document.getElementById("btn-clear")?.addEventListener("click", async () => {
    await clearClient();
    render();
  });
  chrome.storage.onChanged.addListener(() => render());
  async function init() {
    const hasPrefs = await hasPreferences();
    if (!hasPrefs) {
      await populateSettingsForm();
      showView("settings");
    } else {
      render();
    }
  }
  init();
})();
//# sourceMappingURL=popup.js.map
