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
    btn.style.display = areFloatingButtonsVisible() ? "" : "none";
    return btn;
  }
  function floatingButtonsState() {
    return window;
  }
  function areFloatingButtonsVisible() {
    const state = floatingButtonsState();
    if (typeof state.__zspFloatingButtonsVisible !== "boolean") {
      state.__zspFloatingButtonsVisible = true;
    }
    return state.__zspFloatingButtonsVisible;
  }
  function setFloatingButtonsVisible(visible) {
    const state = floatingButtonsState();
    state.__zspFloatingButtonsVisible = visible;
    const buttons = document.querySelectorAll(".spn-floating-btn, .zsp-floating-btn");
    buttons.forEach((button) => {
      button.style.display = visible ? "" : "none";
    });
    if (visible) {
      for (const callback of state.__zspFloatingButtonsOnShow ?? []) {
        callback();
      }
    }
    return visible;
  }
  function registerFloatingButtonsController(onShow) {
    const state = floatingButtonsState();
    if (onShow) {
      state.__zspFloatingButtonsOnShow ??= [];
      state.__zspFloatingButtonsOnShow.push(onShow);
    }
    if (state.__zspFloatingButtonsListenerRegistered) return;
    state.__zspFloatingButtonsListenerRegistered = true;
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.type === "get-floating-buttons-visibility") {
        sendResponse({ visible: areFloatingButtonsVisible() });
        return true;
      }
      if (msg?.type === "toggle-floating-buttons") {
        sendResponse({ visible: setFloatingButtonsVisible(!areFloatingButtonsVisible()) });
        return true;
      }
    });
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
  function fillTextLikeField(el, value) {
    if (!el || !value) return false;
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    )?.set;
    const setter = el instanceof HTMLTextAreaElement ? nativeTextAreaValueSetter : nativeInputValueSetter;
    if (setter) {
      setter.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
    return true;
  }
  function fillField(selector, value, root = document) {
    const el = root.querySelector(selector);
    return fillTextLikeField(el, value);
  }

  // src/content/simplepractice.ts
  function tryFill(selectors, value) {
    if (!value) return false;
    for (const sel of selectors) {
      if (fillField(sel, value)) return true;
    }
    return false;
  }
  var wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  function normalizedText(value) {
    return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  }
  function isVisible(el) {
    return !(el instanceof HTMLElement) || el.offsetParent !== null || el.getClientRects().length > 0;
  }
  function findFieldContainer(labelText) {
    const target = normalizedText(labelText);
    const labels = document.querySelectorAll('label, .form-label, .field-label, .spds-label, [class*="label"]');
    for (const label of Array.from(labels)) {
      if (!normalizedText(label.textContent).includes(target)) continue;
      const container = label.closest('.form-group, .field-wrapper, [class*="field"], [class*="row"], [class*="group"]') ?? label.parentElement ?? label.nextElementSibling?.parentElement;
      if (container instanceof HTMLElement) {
        return container;
      }
    }
    return null;
  }
  function findFieldElement(labelText, selector) {
    const container = findFieldContainer(labelText);
    if (!container) return null;
    return container.querySelector(selector);
  }
  function findVisibleButtonByText(text) {
    const target = normalizedText(text);
    const buttons = Array.from(document.querySelectorAll("button")).filter(isVisible);
    for (const button of buttons) {
      if (!(button instanceof HTMLButtonElement)) continue;
      if (normalizedText(button.textContent).includes(target)) {
        return button;
      }
    }
    return null;
  }
  function selectOptionInElement(select, valueOrText) {
    if (!select || !valueOrText) return false;
    const target = normalizedText(valueOrText);
    for (const option of Array.from(select.options)) {
      const optionValue = normalizedText(option.value);
      const optionText = normalizedText(option.text);
      if (optionValue === target || optionText === target || optionValue.includes(target) || optionText.includes(target)) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }
    return false;
  }
  async function clickDropdownOption(trigger, optionText, optionSelector = '.select-box__option[role="option"], .ember-power-select-option, [role="option"], li[role="option"], button[role="option"]') {
    if (!trigger || !optionText) return false;
    trigger.click();
    await wait(300);
    const menuId = trigger.getAttribute("aria-controls");
    const scope = menuId ? document.getElementById(menuId) ?? document : document;
    const options = Array.from(scope.querySelectorAll(optionSelector)).filter(isVisible);
    const target = normalizedText(optionText);
    const exact = options.find((opt) => normalizedText(opt.textContent) === target);
    const partial = options.find((opt) => normalizedText(opt.textContent).includes(target));
    const match = exact ?? partial;
    if (!match) return false;
    match.click();
    return true;
  }
  function parseDobParts(dob) {
    const match = dob.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      return { month: match[1], day: match[2], year: match[3] };
    }
    const isoMatch = dob.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return { month: isoMatch[2], day: isoMatch[3], year: isoMatch[1] };
    }
    return { month: "", day: "", year: "" };
  }
  function fillDob(dob) {
    const { month, day, year } = parseDobParts(dob);
    if (!month) return 0;
    let filled = 0;
    const monthSelect = document.querySelector('select[name="month"]');
    if (monthSelect) {
      const monthNum = parseInt(month, 10).toString();
      for (const option of Array.from(monthSelect.options)) {
        if (option.value === monthNum || option.value === month || option.text.toLowerCase().includes(getMonthName(parseInt(month, 10)))) {
          monthSelect.value = option.value;
          monthSelect.dispatchEvent(new Event("change", { bubbles: true }));
          filled++;
          break;
        }
      }
    }
    const daySelect = document.querySelector('select[name="day"]');
    if (daySelect) {
      const dayNum = parseInt(day, 10).toString();
      for (const option of Array.from(daySelect.options)) {
        if (option.value === dayNum || option.value === day) {
          daySelect.value = option.value;
          daySelect.dispatchEvent(new Event("change", { bubbles: true }));
          filled++;
          break;
        }
      }
    }
    const yearSelect = document.querySelector('select[name="year"]');
    if (yearSelect) {
      for (const option of Array.from(yearSelect.options)) {
        if (option.value === year) {
          yearSelect.value = option.value;
          yearSelect.dispatchEvent(new Event("change", { bubbles: true }));
          filled++;
          break;
        }
      }
    }
    return filled;
  }
  function getMonthName(num) {
    const names = [
      "",
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december"
    ];
    return names[num] || "";
  }
  function formatDateForSp(date) {
    const cleaned = date.trim();
    if (!cleaned) return "";
    const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      return `${Number(isoMatch[2])}/${Number(isoMatch[3])}/${isoMatch[1]}`;
    }
    const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (slashMatch) {
      const year = slashMatch[3];
      return year ? `${Number(slashMatch[1])}/${Number(slashMatch[2])}/${year.length === 2 ? `20${year}` : year}` : `${Number(slashMatch[1])}/${Number(slashMatch[2])}`;
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
      const year = namedMatch[3];
      if (month && day && year) return `${month}/${day}/${year}`;
    }
    return cleaned;
  }
  async function fillReferredBy() {
    const targetTrigger = findFieldElement("referred by", '.select-box__selected-option.typeahead-trigger, .typeahead-trigger, [role="combobox"]') ?? Array.from(document.querySelectorAll(".select-box__selected-option.typeahead-trigger")).find((trigger) => normalizedText(trigger.textContent) === "select") ?? null;
    if (!targetTrigger) {
      console.log("[ZSP] Referred by trigger not found");
      return false;
    }
    if (await clickDropdownOption(targetTrigger, "Zoc Doc")) {
      console.log("[ZSP] Set Referred by to Zoc Doc");
      return true;
    }
    console.log('[ZSP] "Zoc Doc" option not found in referral dropdown');
    return false;
  }
  async function fillStatusActive() {
    const trigger = findFieldElement("status", '.spds-input-dropdown-list-trigger, [aria-haspopup="listbox"]');
    if (!trigger) {
      console.log("[ZSP] Status dropdown not found");
      return false;
    }
    return clickDropdownOption(trigger, "Active");
  }
  function enableReminderToggles() {
    const toggles = /* @__PURE__ */ new Set();
    const directMatches = document.querySelectorAll(
      'input[type="checkbox"][name*="remind" i], input[type="checkbox"][id*="remind" i]'
    );
    directMatches.forEach((toggle) => toggles.add(toggle));
    const reminderContainers = Array.from(document.querySelectorAll("section, fieldset, div, label")).filter((el) => normalizedText(el.textContent).includes("reminder"));
    for (const container of reminderContainers) {
      container.querySelectorAll('input[type="checkbox"]').forEach((toggle) => {
        toggles.add(toggle);
      });
    }
    let enabled = 0;
    for (const toggle of toggles) {
      if (toggle.checked) continue;
      const label = toggle.closest("label") ?? document.querySelector(`label[for="${toggle.id}"]`);
      if (label instanceof HTMLElement) {
        label.click();
      } else {
        toggle.click();
      }
      enabled++;
    }
    return enabled;
  }
  function buildAddressSearchText(address) {
    const parts = [address.street, address.city, address.state, address.zip].map((part) => part.trim()).filter(Boolean);
    return parts.join(", ");
  }
  function normalizeSexForSp(value) {
    const normalized = normalizedText(value);
    if (normalized === "male" || normalized === "m") return "Male";
    if (normalized === "female" || normalized === "f") return "Female";
    return "";
  }
  async function trySelectAddressSuggestion(input, query) {
    input.focus();
    fillTextLikeField(input, query);
    await wait(800);
    const options = Array.from(document.querySelectorAll(
      '.select-box__option[role="option"], .ember-power-select-option, [role="option"], li[role="option"]'
    )).filter(isVisible);
    const target = normalizedText(query);
    const exact = options.find((opt) => normalizedText(opt.textContent) === target);
    const partial = options.find((opt) => normalizedText(opt.textContent).includes(target));
    const first = options[0];
    const match = exact ?? partial ?? first;
    if (match && !normalizedText(match.textContent).includes("start typing")) {
      match.click();
      return true;
    }
    return input.value.trim().length > 0;
  }
  async function fillClientAddress(address) {
    const fullAddress = buildAddressSearchText(address);
    if (!fullAddress) return 0;
    let addressInput = document.querySelector(
      'input[id^="addressStreet_"][role="searchbox"], input[id^="addressStreet_"]'
    );
    if (!addressInput || !isVisible(addressInput)) {
      const addAddressButton = document.querySelector(
        "button.add-address, button.pill-button.add-address"
      );
      if (addAddressButton && isVisible(addAddressButton)) {
        addAddressButton.click();
        await wait(300);
        addressInput = document.querySelector(
          'input[id^="addressStreet_"][role="searchbox"], input[id^="addressStreet_"], .select-box__input[role="searchbox"]'
        );
      }
    }
    if (!addressInput || !isVisible(addressInput)) {
      const trigger = findFieldElement("address", '.select-box__selected-option.typeahead-trigger, .typeahead-trigger, [role="combobox"]') ?? Array.from(document.querySelectorAll(".select-box__selected-option.typeahead-trigger")).find((el) => normalizedText(el.textContent).includes("search address")) ?? null;
      if (trigger) {
        trigger.click();
        await wait(300);
        addressInput = document.querySelector(
          'input[id^="addressStreet_"][role="searchbox"], input[id^="addressStreet_"], .select-box__input[role="searchbox"]'
        );
      }
    }
    if (addressInput) {
      if (await trySelectAddressSuggestion(addressInput, fullAddress)) return 1;
      if (address.street && address.street !== fullAddress) {
        if (await trySelectAddressSuggestion(addressInput, address.street)) return 1;
      }
    }
    let filled = 0;
    if (tryFill([
      'input[name="addressStreet"]',
      'input[name="street"]',
      'input[name*="addressStreet" i]',
      'input[placeholder*="Street" i]'
    ], address.street)) filled++;
    if (tryFill([
      'input[name="city"]',
      'input[name*="city" i]',
      'input[placeholder*="City" i]'
    ], address.city)) filled++;
    if (tryFill([
      'input[name="state"]',
      'input[name*="state" i]',
      'input[placeholder*="State" i]'
    ], address.state)) filled++;
    if (tryFill([
      'input[name="zip"]',
      'input[name="postalCode"]',
      'input[name*="zip" i]',
      'input[name*="postal" i]',
      'input[placeholder*="ZIP" i]'
    ], address.zip)) filled++;
    return filled;
  }
  async function fillClientDemographics() {
    assertExtensionContext();
    const client = await getClient().catch((err) => {
      console.error("[ZSP] fillClientDemographics error:", err);
      showToast("Extension reloaded \u2014 please refresh this page.", "error");
      return null;
    });
    if (!client) {
      showToast("No captured client. Capture from ZocDoc first.", "error");
      return;
    }
    let filled = 0;
    if (tryFill(['input[name="firstName"]'], client.firstName)) filled++;
    if (tryFill(['input[name="lastName"]'], client.lastName)) filled++;
    const sexValue = normalizeSexForSp(client.sex);
    if (sexValue && selectOptionInElement(
      document.querySelector('select[name="sex"]'),
      sexValue
    )) {
      filled++;
    }
    filled += fillDob(client.dob);
    if (client.email) {
      const addEmailBtn = Array.from(document.querySelectorAll("button.add-row-button")).find((btn) => btn.textContent?.trim().includes("Add email"));
      if (addEmailBtn) {
        addEmailBtn.click();
        await wait(300);
      }
      if (tryFill(['input[name="email"]', 'input[type="email"]', 'input[placeholder*="Email"]'], client.email)) filled++;
    }
    if (client.phone) {
      const addPhoneBtn = Array.from(document.querySelectorAll("button.add-row-button")).find((btn) => btn.textContent?.trim().includes("Add phone"));
      if (addPhoneBtn) {
        addPhoneBtn.click();
        await wait(300);
      }
      if (tryFill(['input[name="phone"]', 'input[type="tel"]', 'input[placeholder*="Phone"]'], client.phone)) filled++;
    }
    filled += await fillClientAddress(client.address);
    const insuranceRadio = document.querySelector('input[name="billingType"][value="Insurance"]');
    if (insuranceRadio) {
      const label = insuranceRadio.closest("label");
      if (label) {
        label.click();
      } else {
        insuranceRadio.click();
      }
      filled++;
    }
    const groupInsuranceRadio = document.querySelector('input[name="billingTypeGroupAppt"][value="Insurance"]');
    if (groupInsuranceRadio) {
      const label = groupInsuranceRadio.closest("label");
      if (label) {
        label.click();
      } else {
        groupInsuranceRadio.click();
      }
      filled++;
    }
    if (await fillStatusActive()) filled++;
    const prefs = await getPreferences();
    const clinicianSelect = document.querySelector('select[name="clinician"], select#new-client-clinician');
    if (clinicianSelect) {
      for (const option of Array.from(clinicianSelect.options)) {
        if (option.text.includes(prefs.providerFirstName) || option.text.includes(prefs.providerLastName)) {
          clinicianSelect.value = option.value;
          clinicianSelect.dispatchEvent(new Event("change", { bubbles: true }));
          filled++;
          break;
        }
      }
    }
    if (selectOptionInElement(
      document.querySelector('select#new-client-office, select[name="office"]'),
      prefs.defaultLocation
    )) {
      filled++;
    }
    const referralFilled = await fillReferredBy();
    if (referralFilled) filled++;
    filled += enableReminderToggles();
    await updateStatus({ clientCreated: true });
    showToast(`Filled ${filled} fields for ${client.firstName} ${client.lastName}`, "success");
    console.log("[ZSP] Filled client demographics:", { filled, firstName: client.firstName, lastName: client.lastName });
  }
  async function fillPayerTypeahead(insuranceCompany) {
    let payerInput = findFieldElement("payer", '.select-box__input[role="searchbox"], .ember-power-select-search-input, input[role="searchbox"]') ?? findFieldElement("insurance company", '.select-box__input[role="searchbox"], .ember-power-select-search-input, input[role="searchbox"]') ?? document.querySelector('.select-box__input[role="searchbox"], input[placeholder*="payer" i], input[placeholder*="insurance" i]');
    if (!payerInput) {
      const trigger = findFieldElement("payer", '.select-box__trigger, .typeahead-trigger, .ember-power-select-trigger, [role="combobox"]') ?? findFieldElement("insurance company", '.select-box__trigger, .typeahead-trigger, .ember-power-select-trigger, [role="combobox"]') ?? findFieldElement("insurance plan", '.select-box__trigger, .typeahead-trigger, .ember-power-select-trigger, [role="combobox"]');
      if (trigger) {
        trigger.click();
        await wait(400);
        payerInput = document.querySelector('.select-box__input[role="searchbox"], .ember-power-select-search-input, input[role="searchbox"]');
      }
    }
    if (!payerInput) {
      const trigger = findFieldElement("payer", '.select-box__trigger, .typeahead-trigger, .ember-power-select-trigger, [role="combobox"]') ?? findFieldElement("insurance company", '.select-box__trigger, .typeahead-trigger, .ember-power-select-trigger, [role="combobox"]') ?? document.querySelector(".select-box__trigger, .ember-power-select-trigger");
      if (trigger) {
        trigger.click();
        await wait(400);
        payerInput = document.querySelector('.select-box__input[role="searchbox"], .ember-power-select-search-input');
      }
    }
    if (payerInput && !isVisible(payerInput)) {
      payerInput = document.querySelector('.select-box__input[role="searchbox"], .ember-power-select-search-input, input[role="searchbox"]');
    }
    if (!payerInput) {
      if (tryFill(['input[name="insurance_company"]', 'input[name*="payer"]'], insuranceCompany)) return 1;
      console.log("[ZSP] Payer typeahead input not found");
      return 0;
    }
    payerInput.focus();
    fillTextLikeField(payerInput, insuranceCompany);
    await wait(1e3);
    const options = Array.from(document.querySelectorAll('.ember-power-select-option, .select-kit-row, .select-box__option, [role="option"]')).filter(isVisible);
    const lowerCompany = insuranceCompany.toLowerCase();
    let bestMatch = null;
    for (const opt of options) {
      const text = opt.textContent?.trim().toLowerCase() ?? "";
      if (text === lowerCompany) {
        ;
        opt.click();
        console.log("[ZSP] Payer selected (exact):", text);
        return 1;
      }
      if (text.includes(lowerCompany) && text.length < (bestMatch?.textContent?.length ?? Infinity)) {
        bestMatch = opt;
      }
    }
    if (bestMatch) {
      bestMatch.click();
      console.log("[ZSP] Payer selected (partial):", bestMatch.textContent?.trim());
      return 1;
    }
    const firstOption = options[0];
    if (firstOption) {
      firstOption.click();
      console.log("[ZSP] Payer selected (first option):", firstOption.textContent?.trim());
      return 1;
    }
    console.log("[ZSP] No payer options found for:", insuranceCompany);
    return 0;
  }
  async function fillInsurance() {
    try {
      assertExtensionContext();
    } catch (err) {
      if (isExtensionContextInvalidatedError(err)) {
        showToast("Extension reloaded \u2014 please refresh this page.", "error");
        return;
      }
      throw err;
    }
    const client = await getClient().catch((err) => {
      console.error("[ZSP] fillInsurance error:", err);
      showToast("Extension reloaded \u2014 please refresh this page.", "error");
      return null;
    });
    if (!client) {
      showToast("No captured client. Capture from ZocDoc first.", "error");
      return;
    }
    let filled = 0;
    const addInsuranceButton = document.querySelector(
      "button#add-insurance-info-button, button.add-insurance-info"
    );
    if (addInsuranceButton) {
      addInsuranceButton.click();
      await wait(500);
    }
    if (client.insuranceCompany) {
      filled += await fillPayerTypeahead(client.insuranceCompany);
    }
    if (tryFill([
      "input#memberId",
      'input[name="memberId"]',
      'input[name="member_id"]',
      'input[name*="member" i]',
      'input[placeholder*="Member" i]'
    ], client.memberId)) filled++;
    if (tryFill([
      'input[name="groupNumber"]',
      'input[name="group_number"]',
      "input#groupNumber",
      'input[name*="group" i]',
      'input[placeholder*="Group" i]'
    ], client.groupNumber)) filled++;
    if (tryFill([
      'input[name="subscriberName"]',
      'input[name="subscriber_name"]',
      'input[name*="subscriber" i]',
      'input[name*="insured" i]',
      'input[placeholder*="Subscriber" i]'
    ], client.subscriberName)) filled++;
    if (tryFill([
      'input[name="copay"]',
      "input#copay",
      'input[name*="copay" i]',
      'input[placeholder*="Copay" i]'
    ], client.copay)) filled++;
    if (client.insuranceCardFront) {
      filled += await uploadInsuranceCard(client.insuranceCardFront, "front");
    }
    if (client.insuranceCardBack) {
      filled += await uploadInsuranceCard(client.insuranceCardBack, "back");
    }
    await wait(500);
    const saveClientButton = findVisibleButtonByText("Save Client") ?? document.querySelector('button[type="submit"]');
    if (saveClientButton) {
      saveClientButton.click();
      await wait(500);
    }
    await updateStatus({ insuranceAdded: true });
    showToast(`Filled ${filled} insurance fields`, "success");
  }
  async function uploadInsuranceCard(base64Data, side) {
    try {
      const dropzones = Array.from(document.querySelectorAll(".dropzone-inner"));
      let targetInput = null;
      for (const dz of dropzones) {
        const heading = dz.querySelector("h5");
        const zoneText = `${heading?.textContent ?? ""} ${dz.textContent ?? ""}`.toLowerCase();
        if (side === "back" && zoneText.includes("back")) {
          targetInput = dz.querySelector('input[type="file"]') ?? dz.querySelector('label.file-upload input[type="file"]');
          break;
        }
        if (side === "front" && zoneText.includes("front")) {
          targetInput = dz.querySelector('input[type="file"]') ?? dz.querySelector('label.file-upload input[type="file"]');
          break;
        }
      }
      if (!targetInput) {
        const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
        if (side === "front") {
          targetInput = fileInputs[0] ?? null;
        } else {
          targetInput = fileInputs[fileInputs.length - 1] ?? null;
        }
      }
      if (!targetInput || !base64Data) return 0;
      const response = await fetch(base64Data);
      const blob = await response.blob();
      const file = new File([blob], `insurance-card-${side}.png`, { type: "image/png" });
      const dt = new DataTransfer();
      dt.items.add(file);
      targetInput.files = dt.files;
      targetInput.dispatchEvent(new Event("change", { bubbles: true }));
      console.log(`[ZSP] Uploaded insurance card ${side}`);
      return 1;
    } catch (err) {
      console.error(`[ZSP] Failed to upload insurance card ${side}:`, err);
      return 0;
    }
  }
  async function fillAppointment() {
    try {
      assertExtensionContext();
    } catch (err) {
      if (isExtensionContextInvalidatedError(err)) {
        showToast("Extension reloaded \u2014 please refresh this page.", "error");
        return;
      }
      throw err;
    }
    const client = await getClient().catch((err) => {
      console.error("[ZSP] fillAppointment error:", err);
      showToast("Extension reloaded \u2014 please refresh this page.", "error");
      return null;
    });
    if (!client) {
      showToast("No captured client. Capture from ZocDoc first.", "error");
      return;
    }
    let filled = 0;
    const clientName = `${client.firstName} ${client.lastName}`.trim();
    if (clientName) {
      const typeaheadTrigger = findFieldElement("client", '.typeahead-trigger, .ember-power-select-trigger, [role="combobox"]') ?? document.querySelector(".typeahead-trigger");
      if (typeaheadTrigger) {
        typeaheadTrigger.click();
        await wait(300);
        const searchInput = document.querySelector('.ember-power-select-search-input, .select-kit-filter input, input[placeholder*="Search"]');
        if (searchInput) {
          fillTextLikeField(searchInput, client.lastName);
          await wait(800);
          const options = document.querySelectorAll('.ember-power-select-option, .select-kit-row, [role="option"]');
          for (const opt of Array.from(options)) {
            const text = opt.textContent?.trim().toLowerCase() ?? "";
            if (text.includes(client.lastName.toLowerCase()) || text.includes(client.firstName.toLowerCase())) {
              ;
              opt.click();
              filled++;
              break;
            }
          }
        }
      }
    }
    if (client.appointmentDate) {
      const formattedDate = formatDateForSp(client.appointmentDate);
      if (tryFill(['input[name="startDate"]', 'input[name="date"]'], formattedDate)) filled++;
    }
    if (client.appointmentTime) {
      if (tryFill(['input[name="startTime"]', 'input[name="time"]'], client.appointmentTime)) filled++;
    }
    const prefs = await getPreferences();
    const officeSelect = document.querySelector('select#new-client-office, select[name="office"]');
    if (selectOptionInElement(officeSelect, prefs.defaultLocation)) filled++;
    const codeSelect = document.querySelector('select[name="code"]');
    if (selectOptionInElement(codeSelect, prefs.firstVisitCPT)) filled++;
    filled += await setupRecurringAppointment(prefs);
    const notes = [
      client.reasonForVisit,
      client.presentingConcerns ? `Presenting concerns: ${client.presentingConcerns}` : "",
      client.medications ? `Medications: ${client.medications}` : "",
      client.priorTreatment ? `Prior treatment: ${client.priorTreatment}` : ""
    ].filter(Boolean).join("\n");
    if (notes && tryFill(['textarea[name*="note"]', 'textarea[name*="reason"]'], notes)) filled++;
    await updateStatus({ appointmentSet: true });
    showToast(`Filled ${filled} appointment fields`, "success");
  }
  async function setupRecurringAppointment(prefs) {
    let filled = 0;
    const recurringToggle = document.querySelector(
      'input#recurring-toggle, input[name="recurringToggle"], input[name="recurring"], input[type="checkbox"][id*="recurring"]'
    );
    if (!recurringToggle) {
      const toggleLabel = Array.from(document.querySelectorAll('label, .toggle-label, [class*="toggle"]')).find((el) => el.textContent?.trim().toLowerCase().includes("recurring"));
      if (toggleLabel) {
        ;
        toggleLabel.click();
        filled++;
        await wait(600);
      } else {
        console.log("[ZSP] Recurring toggle not found");
        return 0;
      }
    } else if (!recurringToggle.checked) {
      const label = recurringToggle.closest("label") || document.querySelector(`label[for="${recurringToggle.id}"]`);
      if (label) {
        ;
        label.click();
      } else {
        recurringToggle.click();
      }
      filled++;
      await wait(600);
    }
    if (prefs.followUpCPT) {
      const allCodeSelects = document.querySelectorAll('select[name="code"], select[name="recurringCode"], select[name="recurring_code"], select[name*="cpt" i]');
      const targetSelect = allCodeSelects.length > 1 ? allCodeSelects[allCodeSelects.length - 1] : allCodeSelects[0];
      if (targetSelect) {
        if (selectOptionInElement(targetSelect, prefs.followUpCPT)) filled++;
      }
    }
    const freqSelect = document.querySelector('select[name="frequency"], select[name="recurrenceFrequency"], select[name*="repeat" i]');
    if (freqSelect) {
      for (const option of Array.from(freqSelect.options)) {
        if (option.text.toLowerCase().includes("week")) {
          freqSelect.value = option.value;
          freqSelect.dispatchEvent(new Event("change", { bubbles: true }));
          filled++;
          break;
        }
      }
    }
    console.log("[ZSP] Recurring appointment setup:", { filled });
    return filled;
  }
  async function sendVobEmail() {
    try {
      assertExtensionContext();
      const client = await getClient();
      if (!client) {
        showToast("No captured client. Capture from ZocDoc first.", "error");
        return;
      }
      await openVobEmail(client);
      await updateStatus({ vobEmailSent: true });
      showToast("VOB email opened in Gmail", "success");
    } catch (err) {
      console.error("[ZSP] sendVobEmail error:", err);
      showToast("Extension reloaded \u2014 please refresh this page.", "error");
    }
  }
  function injectInlineButton(label, onClick, anchorSelector, id) {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    const anchor = document.querySelector(anchorSelector);
    if (!anchor) return;
    const btn = document.createElement("button");
    btn.id = id;
    btn.textContent = label;
    btn.type = "button";
    btn.style.cssText = "margin:8px 0;padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,sans-serif;";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      onClick();
    }, true);
    const parent = anchor.closest(".input-module_component__0r299")?.parentElement ?? anchor.parentElement;
    if (parent) {
      parent.insertBefore(btn, parent.firstChild);
    }
  }
  function removeInjectedElement(id) {
    document.getElementById(id)?.remove();
  }
  function syncInjectedUi() {
    const firstNameInput = document.querySelector('input[name="firstName"]');
    if (firstNameInput) {
      injectInlineButton(
        "Fill from ZocDoc",
        fillClientDemographics,
        'input[name="firstName"]',
        "zsp-fill-btn"
      );
    } else {
      removeInjectedElement("zsp-fill-btn");
    }
    const insuranceForm = document.querySelector(
      'button#add-insurance-info-button, button.add-insurance-info, input[name="memberId"], input[name*="member"], .dropzone-inner, .select-box__input[role="searchbox"]'
    ) ?? (window.location.pathname.includes("/edit/billing-insurance") ? document.body : null);
    if (insuranceForm) {
      injectButton("Fill Insurance from ZocDoc", fillInsurance, { id: "zsp-insurance-btn", position: "bottom-left-high" });
    } else {
      removeInjectedElement("zsp-insurance-btn");
    }
    const apptForm = document.querySelector('input[name="startTime"], select[name="code"]');
    if (apptForm) {
      injectButton("Fill Appointment from ZocDoc", fillAppointment, { id: "zsp-appt-btn", position: "bottom-left-higher" });
    } else {
      removeInjectedElement("zsp-appt-btn");
    }
    injectButton("Send VOB Email", sendVobEmail, { id: "zsp-vob-btn", position: "bottom-left" });
  }
  function watchForForms() {
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        syncInjectedUi();
      }, 500);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        syncInjectedUi();
        watchForForms();
      });
    } else {
      syncInjectedUi();
      watchForForms();
    }
  }
  init();
  registerFloatingButtonsController(() => {
    syncInjectedUi();
  });
})();
//# sourceMappingURL=simplepractice.js.map
