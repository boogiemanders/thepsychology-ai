"use strict";
(() => {
  // src/lib/types.ts
  var DEFAULT_STATUS = {
    clientCreated: false,
    appointmentSet: false,
    insuranceAdded: false,
    vobEmailSent: false
  };

  // src/lib/storage.ts
  var CLIENT_STORAGE_KEY = "capturedClient";
  async function saveClient(client) {
    await chrome.storage.session.set({ [CLIENT_STORAGE_KEY]: client });
  }

  // src/content/shared.ts
  function injectButton(label, onClick, options) {
    const id = options?.id ?? "zsp-action-btn";
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    const btn = document.createElement("button");
    btn.id = id;
    btn.textContent = label;
    btn.className = "zsp-floating-btn";
    if (options?.position === "bottom-right-high") {
      btn.style.bottom = "90px";
    } else if (options?.position === "bottom-left") {
      btn.style.right = "auto";
      btn.style.left = "20px";
    } else if (options?.position === "bottom-left-high") {
      btn.style.right = "auto";
      btn.style.left = "20px";
      btn.style.bottom = "70px";
    } else if (options?.position === "bottom-left-higher") {
      btn.style.right = "auto";
      btn.style.left = "20px";
      btn.style.bottom = "120px";
    }
    btn.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
    }, true);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      onClick();
    }, true);
    document.body.appendChild(btn);
    return btn;
  }
  function isExtensionContextInvalidatedError(err) {
    if (!(err instanceof Error)) return false;
    return /Extension context invalidated|Cannot read properties of undefined \(reading 'local'\)|Cannot read properties of undefined \(reading 'session'\)/i.test(err.message);
  }
  function assertExtensionContext() {
    if (typeof chrome === "undefined" || !chrome.runtime?.id || !chrome.storage || !chrome.storage.session && !chrome.storage.local) {
      throw new Error("Extension context invalidated.");
    }
  }
  function showToast(message, type = "success") {
    const existing = document.getElementById("zsp-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.id = "zsp-toast";
    toast.className = `zsp-toast zsp-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("zsp-toast-hide");
      setTimeout(() => toast.remove(), 300);
    }, 3e3);
  }
  async function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read blob"));
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result);
          return;
        }
        reject(new Error("Blob did not produce a string result"));
      };
      reader.readAsDataURL(blob);
    });
  }
  async function urlToBase64(resourceUrl) {
    const response = await fetch(resourceUrl, { credentials: "include" });
    if (!response.ok) {
      throw new Error(`Failed to fetch resource: ${response.status}`);
    }
    return blobToDataUrl(await response.blob());
  }
  async function imageToBase64(imgUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context unavailable"));
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${imgUrl}`));
      img.src = imgUrl;
    });
  }

  // src/content/zocdoc.ts
  function getText(selector) {
    const el = document.querySelector(selector);
    return el?.textContent?.trim() ?? "";
  }
  function isVisible(el) {
    return !(el instanceof HTMLElement) || el.offsetParent !== null || el.getClientRects().length > 0;
  }
  function getImgSrc(selector) {
    const el = document.querySelector(selector);
    const img = el?.querySelector("img") ?? (el instanceof HTMLImageElement ? el : null);
    return img?.src ?? "";
  }
  function textLines(value) {
    return value.split(/\r?\n|,/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
  function getVisibleElement(selector) {
    const visible = Array.from(document.querySelectorAll(selector)).find(isVisible);
    return visible ?? document.querySelector(selector);
  }
  function normalizeWhitespace(value) {
    return value.replace(/\s+/g, " ").trim();
  }
  function getVisibleText(selectors) {
    for (const selector of selectors) {
      const visibleMatch = Array.from(document.querySelectorAll(selector)).find((el) => isVisible(el) && normalizeWhitespace(el.textContent ?? "").length > 0);
      if (visibleMatch) {
        return normalizeWhitespace(visibleMatch.textContent ?? "");
      }
      const anyMatch = Array.from(document.querySelectorAll(selector)).find((el) => normalizeWhitespace(el.textContent ?? "").length > 0);
      if (anyMatch) {
        return normalizeWhitespace(anyMatch.textContent ?? "");
      }
    }
    return "";
  }
  function findPatientRecordLink() {
    return getVisibleElement('[data-test="patient-record-link"]') ?? getVisibleElement('a[href*="/patient/"][href*="/record"]');
  }
  var lastObservedContext = {
    fullName: "",
    dobRaw: "",
    phone: "",
    email: "",
    addressRaw: "",
    appointmentRaw: "",
    sexRaw: ""
  };
  function rememberIfPresent(key, value) {
    if (typeof value === "string" && value.trim()) {
      lastObservedContext[key] = value;
    }
  }
  function snapshotVisiblePatientContext() {
    const patientLink = findPatientRecordLink();
    rememberIfPresent("fullName", getVisibleText([
      '[data-test="patient-record-header"]',
      '[data-test="patient-record-link"]',
      'a[href*="/patient/"][href*="/record"]'
    ]) || normalizeWhitespace(patientLink?.textContent ?? ""));
    rememberIfPresent("dobRaw", getText('[data-test="patient-dob"]') || getText('[data-test="age-content"]'));
    rememberIfPresent("phone", getText('[data-test="phone-number-content"]'));
    rememberIfPresent("email", getText('[data-test="email-content"]'));
    rememberIfPresent("addressRaw", getText('[data-test="address-content"]') || findCalendarCardAddress(patientLink));
    rememberIfPresent("appointmentRaw", getText('[data-test="appointment-details-section-appointment-time"]'));
    rememberIfPresent("sexRaw", getText('[data-test="sex-content"]'));
  }
  function parseName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return { first: "", last: "" };
    if (parts.length === 1) return { first: parts[0], last: "" };
    return { first: parts[0], last: parts.slice(1).join(" ") };
  }
  function parseDob(text) {
    const match = text.match(/DOB:\s*(\d{2}\/\d{2}\/\d{4})/);
    return match?.[1] ?? "";
  }
  function parseAddress(text) {
    const parts = text.split(",").map((s) => s.trim());
    if (parts.length >= 4) {
      return { street: parts[0], city: parts[1], state: parts[2], zip: parts[3] };
    }
    if (parts.length === 3) {
      const lastParts = parts[2].split(/\s+/);
      if (lastParts.length >= 2) {
        return { street: parts[0], city: parts[1], state: lastParts[0], zip: lastParts[1] };
      }
      return { street: parts[0], city: parts[1], state: parts[2], zip: "" };
    }
    return { street: text, city: "", state: "", zip: "" };
  }
  function looksLikeStreetAddress(text) {
    const normalized = normalizeWhitespace(text);
    return /,\s*[A-Za-z .'-]+,\s*[A-Z]{2},\s*\d{5}(?:-\d{4})?$/.test(normalized);
  }
  function findCalendarCardAddress(patientLink) {
    const knownCalendarAddress = getVisibleElement("div.sc-ijDOKB.bmbNov");
    if (knownCalendarAddress && looksLikeStreetAddress(knownCalendarAddress.textContent ?? "")) {
      return normalizeWhitespace(knownCalendarAddress.textContent ?? "");
    }
    let current = patientLink?.parentElement ?? null;
    let depth = 0;
    while (current && depth < 6) {
      const candidates = current.querySelectorAll("div, span, p");
      for (const candidate of Array.from(candidates)) {
        const text = normalizeWhitespace(candidate.textContent ?? "");
        if (looksLikeStreetAddress(text)) {
          return text;
        }
      }
      current = current.parentElement;
      depth++;
    }
    return "";
  }
  function findCardCaptureRoot(start) {
    let current = start;
    let depth = 0;
    while (current && depth < 6) {
      if (current.querySelector("a[href], img")) {
        return current;
      }
      current = current.parentElement;
      depth++;
    }
    return start;
  }
  function pad2(value) {
    return value.toString().padStart(2, "0");
  }
  function toIsoDate(year, month, day) {
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }
  function inferAppointmentYear(month, day) {
    const now = /* @__PURE__ */ new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    if (month < currentMonth || month === currentMonth && day < currentDay - 1) {
      return currentYear + 1;
    }
    return currentYear;
  }
  function normalizeAppointmentDate(text) {
    const cleaned = text.trim();
    if (!cleaned) return "";
    const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      return toIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
    }
    const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (slashMatch) {
      const month = Number(slashMatch[1]);
      const day = Number(slashMatch[2]);
      const yearRaw = slashMatch[3];
      const year = yearRaw ? yearRaw.length === 2 ? 2e3 + Number(yearRaw) : Number(yearRaw) : inferAppointmentYear(month, day);
      return toIsoDate(year, month, day);
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
    const namedMatch = cleaned.match(/([A-Za-z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?$/);
    if (namedMatch) {
      const month = monthNames[namedMatch[1].slice(0, 3).toLowerCase()];
      const day = Number(namedMatch[2]);
      if (!month || !day) return cleaned;
      const year = namedMatch[3] ? Number(namedMatch[3]) : inferAppointmentYear(month, day);
      return toIsoDate(year, month, day);
    }
    return cleaned;
  }
  function extractInsuranceCompany(...sources) {
    const ignoredPatterns = [
      /^insurance$/i,
      /^view details$/i,
      /^view card$/i,
      /^download$/i,
      /^member/i,
      /^group/i,
      /^subscriber/i,
      /^policy/i,
      /^copay/i,
      /^in-network$/i,
      /^out-of-network$/i
    ];
    for (const source of sources) {
      for (const line of textLines(source)) {
        if (ignoredPatterns.some((pattern) => pattern.test(line))) continue;
        return line;
      }
    }
    return "";
  }
  async function captureCardFromElement(container) {
    if (!container) return "";
    const link = container.closest("a[href]") ?? container.querySelector("a[href]");
    if (link instanceof HTMLAnchorElement && link.href) {
      try {
        return await urlToBase64(link.href);
      } catch {
      }
    }
    const img = container.querySelector("img");
    if (img?.src) {
      try {
        return await urlToBase64(img.src);
      } catch {
        try {
          return await imageToBase64(img.src);
        } catch {
          return "";
        }
      }
    }
    return "";
  }
  function parseAppointmentDateTime(text) {
    let cleaned = text.replace(/^Appointment\s*time/i, "").replace(/\s*(EDT|EST|CDT|CST|MDT|MST|PDT|PST)\s*$/i, "").trim();
    const atMatch = cleaned.match(/(.+?)\s+at\s+(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    if (atMatch) {
      const datePart = atMatch[1].replace(/^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*/i, "").trim();
      return { date: normalizeAppointmentDate(datePart), time: atMatch[2].trim() };
    }
    return { date: normalizeAppointmentDate(cleaned), time: "" };
  }
  async function captureClient() {
    try {
      assertExtensionContext();
      snapshotVisiblePatientContext();
      const patientLink = findPatientRecordLink();
      const fullName = getVisibleText([
        '[data-test="patient-record-header"]',
        '[data-test="patient-record-link"]',
        'a[href*="/patient/"][href*="/record"]'
      ]) || normalizeWhitespace(patientLink?.textContent ?? "") || lastObservedContext.fullName;
      const { first, last } = parseName(fullName);
      if (!first && !last) {
        showToast("No client selected. Click a patient row first to open their details.", "error");
        return;
      }
      const dobRaw = getText('[data-test="patient-dob"]') || getText('[data-test="age-content"]') || lastObservedContext.dobRaw;
      const dob = parseDob(dobRaw);
      const phone = getText('[data-test="phone-number-content"]') || lastObservedContext.phone;
      const email = getText('[data-test="email-content"]') || lastObservedContext.email;
      const addressRaw = getText('[data-test="address-content"]') || findCalendarCardAddress(patientLink) || lastObservedContext.addressRaw;
      const addressClean = addressRaw.replace(/^Address/i, "").trim();
      const address = parseAddress(addressClean);
      const apptTimeRaw = getText('[data-test="appointment-details-section-appointment-time"]') || lastObservedContext.appointmentRaw;
      let appt = parseAppointmentDateTime(apptTimeRaw);
      if (!appt.date) {
        const tableAppt = document.querySelector('[data-test^="appointmentDateColumn-"]');
        if (tableAppt?.textContent) {
          appt = parseAppointmentDateTime(tableAppt.textContent.trim());
        }
      }
      let cardFront = "";
      let cardBack = "";
      const frontSrc = getImgSrc('[data-test="image-front"]');
      const backSrc = getImgSrc('[data-test="image-back"]');
      if (frontSrc) {
        try {
          cardFront = await imageToBase64(frontSrc);
        } catch {
        }
      }
      if (backSrc) {
        try {
          cardBack = await imageToBase64(backSrc);
        } catch {
        }
      }
      if (!cardFront || !cardBack) {
        const downloadBtns = document.querySelectorAll('button[data-test="download-button"]');
        for (const [index, btn2] of Array.from(downloadBtns).entries()) {
          const container = findCardCaptureRoot(btn2.parentElement) ?? btn2.closest('[class*="card"], [class*="image"], [class*="insurance"]') ?? btn2.parentElement;
          const isBack = container?.textContent?.toLowerCase().includes("back") ?? index > 0;
          const captured = await captureCardFromElement(container);
          if (!captured) continue;
          if (isBack && !cardBack) {
            cardBack = captured;
          } else if (!cardFront) {
            cardFront = captured;
          } else if (!cardBack) {
            cardBack = captured;
          }
        }
      }
      const insuranceRow = getText('[data-test="intake-insurance-row"]');
      const networkStatus = getText('[data-test="network-status"]');
      const insuranceCompany = extractInsuranceCompany(insuranceRow, networkStatus);
      const sexRaw = getText('[data-test="sex-content"]') || lastObservedContext.sexRaw;
      const sex = sexRaw.replace(/^Sex/i, "").trim();
      const client = {
        firstName: first,
        lastName: last,
        sex,
        dob,
        phone: phone.replace(/^Phone\s*number/i, "").trim(),
        email: email.replace(/^Email/i, "").trim(),
        address: {
          street: address.street,
          city: address.city,
          state: address.state,
          zip: address.zip
        },
        insuranceCompany,
        memberId: "",
        // Need to get from intake submission details
        groupNumber: "",
        subscriberName: "",
        subscriberRelationship: "",
        copay: "",
        insuranceCardFront: cardFront,
        insuranceCardBack: cardBack,
        appointmentDate: appt.date,
        appointmentTime: appt.time,
        serviceType: "",
        reasonForVisit: "",
        presentingConcerns: "",
        medications: "",
        priorTreatment: "",
        capturedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: { ...DEFAULT_STATUS }
      };
      await saveClient(client);
      const fieldsFound = [
        client.firstName,
        client.lastName,
        client.sex,
        client.dob,
        client.phone,
        client.email,
        client.address.street,
        client.appointmentDate,
        client.appointmentTime,
        client.insuranceCardFront
      ].filter(Boolean).length;
      showToast(
        `Captured ${client.firstName} ${client.lastName} (${fieldsFound} fields)`,
        "success"
      );
      const btn = document.getElementById("zsp-capture-btn");
      if (btn) {
        btn.textContent = `Captured: ${client.firstName} ${client.lastName}`;
        btn.classList.add("zsp-btn-success");
      }
      console.log("[ZSP] Captured client:", {
        name: `${client.firstName} ${client.lastName}`,
        sex: client.sex,
        dob: client.dob,
        phone: client.phone,
        email: client.email,
        address: client.address,
        appointment: `${client.appointmentDate} at ${client.appointmentTime}`,
        hasInsuranceCardFront: !!client.insuranceCardFront,
        hasInsuranceCardBack: !!client.insuranceCardBack
      });
    } catch (err) {
      console.error("[ZSP] Capture error:", err);
      if (isExtensionContextInvalidatedError(err)) {
        showToast("Extension reloaded. Refresh this ZocDoc tab and try again.", "error");
        return;
      }
      showToast("Error capturing client data. Check console for details.", "error");
    }
  }
  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        snapshotVisiblePatientContext();
        inject();
        watchPatientContext();
      });
    } else {
      snapshotVisiblePatientContext();
      inject();
      watchPatientContext();
    }
  }
  function inject() {
    injectButton("Capture Client", captureClient, { id: "zsp-capture-btn", position: "bottom-right-high" });
  }
  function watchPatientContext() {
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        snapshotVisiblePatientContext();
      }, 150);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  init();
})();
//# sourceMappingURL=zocdoc.js.map
