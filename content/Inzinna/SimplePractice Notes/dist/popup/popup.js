"use strict";
(() => {
  // src/lib/types.ts
  var DEFAULT_NOTE_STATUS = {
    intakeCaptured: false,
    noteGenerated: false,
    noteReviewed: false,
    noteSubmitted: false
  };
  var EMPTY_PROGRESS_NOTE = {
    clientName: "",
    sessionDate: "",
    sessionType: "",
    cptCode: "",
    duration: "",
    chiefComplaint: "",
    presentingComplaint: "",
    mentalStatusExam: {
      appearance: "",
      behavior: "",
      speech: "",
      mood: "",
      affect: "",
      thoughtProcess: "",
      thoughtContent: "",
      perceptions: "",
      cognition: "",
      insight: "",
      judgment: ""
    },
    diagnosticImpressions: [],
    clinicalFormulation: "",
    treatmentPlan: {
      goals: [],
      interventions: [],
      frequency: "",
      referrals: ""
    },
    plan: "",
    generatedAt: "",
    status: { ...DEFAULT_NOTE_STATUS }
  };
  var DEFAULT_PREFERENCES = {
    providerFirstName: "Anders",
    providerLastName: "Chan",
    defaultLocation: "Video Office",
    firstVisitCPT: "90791",
    followUpCPT: "90837"
  };

  // src/lib/storage.ts
  var INTAKE_KEY = "spn_intake";
  var NOTE_KEY = "spn_note";
  var PREFS_KEY = "spn_preferences";
  async function getIntake() {
    const result = await chrome.storage.session.get(INTAKE_KEY);
    return result[INTAKE_KEY] ?? null;
  }
  async function getNote() {
    const result = await chrome.storage.session.get(NOTE_KEY);
    return result[NOTE_KEY] ?? null;
  }
  function normalizePreferences(prefs) {
    return {
      ...DEFAULT_PREFERENCES,
      ...prefs,
      providerFirstName: prefs?.providerFirstName?.trim() || DEFAULT_PREFERENCES.providerFirstName,
      providerLastName: prefs?.providerLastName?.trim() || DEFAULT_PREFERENCES.providerLastName,
      defaultLocation: prefs?.defaultLocation?.trim() || DEFAULT_PREFERENCES.defaultLocation,
      firstVisitCPT: prefs?.firstVisitCPT?.trim() || DEFAULT_PREFERENCES.firstVisitCPT,
      followUpCPT: prefs?.followUpCPT?.trim() || DEFAULT_PREFERENCES.followUpCPT
    };
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
  async function clearAll() {
    await chrome.storage.session.remove([INTAKE_KEY, NOTE_KEY]);
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
    const intakeInfo = document.getElementById("intake-info");
    const settingsPanel = document.getElementById("settings-panel");
    if (view === "settings") {
      emptyState.style.display = "none";
      intakeInfo.style.display = "none";
      settingsPanel.style.display = "flex";
    } else {
      settingsPanel.style.display = "none";
    }
  }
  function renderIntakeFields(intake) {
    const container = document.getElementById("intake-fields");
    container.innerHTML = "";
    const fields = [
      ["Name", intake.fullName || `${intake.firstName} ${intake.lastName}`.trim()],
      ["DOB", intake.dob],
      ["Sex", intake.sex],
      ["Gender", intake.genderIdentity],
      ["Phone", intake.phone],
      ["Address", intake.address.raw || [intake.address.street, intake.address.city, intake.address.state, intake.address.zip].filter(Boolean).join(", ")],
      ["Race", intake.race],
      ["Emergency Contact", intake.emergencyContact],
      ["Chief Complaint", intake.chiefComplaint],
      ["Goals", intake.counselingGoals],
      ["Prior Treatment", intake.priorTreatment],
      ["Medications", intake.medications],
      ["Prescribing MD", intake.prescribingMD],
      ["PCP", intake.primaryCarePhysician],
      ["Alcohol", intake.alcoholUse],
      ["Drugs", intake.drugUse],
      ["SI", intake.suicidalIdeation],
      ["Suicide Attempts", intake.suicideAttemptHistory],
      ["HI", intake.homicidalIdeation],
      ["Psych Hospitalization", intake.psychiatricHospitalization],
      ["Family MH Hx", intake.familyPsychiatricHistory],
      ["Marital Status", intake.maritalStatus],
      ["Relationship", intake.relationshipDescription],
      ["Living Situation", intake.livingArrangement],
      ["Education", intake.education],
      ["Occupation", intake.occupation],
      ["Abuse Hx", intake.physicalSexualAbuseHistory],
      ["DV Hx", intake.domesticViolenceHistory],
      ["Recent Symptoms", intake.recentSymptoms],
      ["Additional Info", intake.additionalInfo]
    ];
    for (const [label, value] of fields) {
      const item = document.createElement("div");
      item.className = "field-item";
      const labelEl = document.createElement("span");
      labelEl.className = "field-label";
      labelEl.textContent = label;
      const valueEl = document.createElement("span");
      valueEl.className = value ? "field-value" : "field-value empty";
      valueEl.textContent = value || "(not captured)";
      if (value && value.length > 80) {
        valueEl.textContent = value.substring(0, 80) + "...";
        valueEl.title = value;
      }
      item.appendChild(labelEl);
      item.appendChild(valueEl);
      container.appendChild(item);
    }
  }
  async function populateSettingsForm() {
    const prefs = await getPreferences();
    document.getElementById("pref-firstName").value = prefs.providerFirstName;
    document.getElementById("pref-lastName").value = prefs.providerLastName;
    document.getElementById("pref-location").value = prefs.defaultLocation;
    document.getElementById("pref-firstCPT").value = prefs.firstVisitCPT;
    document.getElementById("pref-followUpCPT").value = prefs.followUpCPT;
  }
  function readSettingsForm() {
    return {
      providerFirstName: document.getElementById("pref-firstName").value.trim(),
      providerLastName: document.getElementById("pref-lastName").value.trim(),
      defaultLocation: document.getElementById("pref-location").value,
      firstVisitCPT: document.getElementById("pref-firstCPT").value.trim() || DEFAULT_PREFERENCES.firstVisitCPT,
      followUpCPT: document.getElementById("pref-followUpCPT").value.trim() || DEFAULT_PREFERENCES.followUpCPT
    };
  }
  async function render() {
    const intake = await getIntake();
    const note = await getNote();
    const prefs = await getPreferences();
    document.getElementById("provider-badge").textContent = `Provider: ${prefs.providerFirstName} ${prefs.providerLastName}`;
    const emptyState = document.getElementById("empty-state");
    const intakeInfo = document.getElementById("intake-info");
    if (!intake) {
      emptyState.style.display = "block";
      intakeInfo.style.display = "none";
      return;
    }
    emptyState.style.display = "none";
    intakeInfo.style.display = "flex";
    document.getElementById("client-name").textContent = `${intake.firstName} ${intake.lastName}`.trim() || "Client";
    const metaParts = [];
    if (intake.insuranceCompany) metaParts.push(intake.insuranceCompany);
    metaParts.push(`Captured ${formatDate(intake.capturedAt)}`);
    document.getElementById("client-meta").textContent = metaParts.join(" \xB7 ");
    updateCheckItem("check-intake", true);
    updateCheckItem("check-note-gen", note?.status?.noteGenerated ?? false);
    updateCheckItem("check-note-review", note?.status?.noteReviewed ?? false);
    updateCheckItem("check-note-submit", note?.status?.noteSubmitted ?? false);
    renderIntakeFields(intake);
    const notePreview = document.getElementById("note-preview");
    const noteContent = document.getElementById("note-content");
    if (note) {
      notePreview.style.display = "block";
      const sections = [];
      if (note.chiefComplaint) sections.push(`CC: ${note.chiefComplaint}`);
      if (note.diagnosticImpressions.length) {
        sections.push(`Dx: ${note.diagnosticImpressions.map((d) => `${d.name} (${d.code})`).join(", ")}`);
      }
      if (note.plan) sections.push(`Plan: ${note.plan}`);
      noteContent.textContent = sections.join("\n\n") || 'Note generated \u2014 click "Fill Note" on the SP notes page';
    } else {
      notePreview.style.display = "none";
    }
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
  document.getElementById("btn-clear")?.addEventListener("click", async () => {
    await clearAll();
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
