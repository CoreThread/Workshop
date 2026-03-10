const storage = {
  get apiBase() {
    return localStorage.getItem("apiBase") || "https://workshop-api.jaiswal-utkarshuj.workers.dev";
  },
  set apiBase(value) {
    localStorage.setItem("apiBase", value);
  },
  get token() {
    return localStorage.getItem("token") || "";
  },
  set token(value) {
    if (!value) localStorage.removeItem("token");
    else localStorage.setItem("token", value);
  }
};

const el = {
  apiBase: document.getElementById("apiBase"),
  saveApiBase: document.getElementById("saveApiBase"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  loginBtn: document.getElementById("loginBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  logoutTopBtn: document.getElementById("logoutTopBtn"),
  whoami: document.getElementById("whoami"),
  whoamiTop: document.getElementById("whoamiTop"),
  setup: document.getElementById("setup"),
  appWorkspace: document.getElementById("appWorkspace"),
  sessionDock: document.getElementById("sessionDock"),
  loginGateHint: document.getElementById("loginGateHint"),
  lanePrimary: document.getElementById("lane-primary"),
  laneInventory: document.getElementById("lane-inventory"),
  laneAnalytics: document.getElementById("lane-analytics"),
  laneHr: document.getElementById("lane-hr"),
  moduleBilling: document.getElementById("module-billing"),
  moduleArchive: document.getElementById("module-archive"),
  quickCreateCaseBtn: document.getElementById("quickCreateCaseBtn"),
  quickLoadFollowupsBtn: document.getElementById("quickLoadFollowupsBtn"),
  quickRunDailyCloseBtn: document.getElementById("quickRunDailyCloseBtn"),
  quickLoadArchiveIndexBtn: document.getElementById("quickLoadArchiveIndexBtn"),
  quickActionsHint: document.getElementById("quickActionsHint"),
  tabLanePrimary: document.getElementById("tabLanePrimary"),
  tabLaneInventory: document.getElementById("tabLaneInventory"),
  tabLaneAnalytics: document.getElementById("tabLaneAnalytics"),
  tabLaneHr: document.getElementById("tabLaneHr"),
  caseNo: document.getElementById("caseNo"),
  customerName: document.getElementById("customerName"),
  customerPhone: document.getElementById("customerPhone"),
  itemCategory: document.getElementById("itemCategory"),
  reportedIssue: document.getElementById("reportedIssue"),
  createCaseBtn: document.getElementById("createCaseBtn"),
  createResult: document.getElementById("createResult"),
  searchCaseNo: document.getElementById("searchCaseNo"),
  searchPhone: document.getElementById("searchPhone"),
  searchBtn: document.getElementById("searchBtn"),
  searchResults: document.getElementById("searchResults"),
  statusCaseId: document.getElementById("statusCaseId"),
  statusItemId: document.getElementById("statusItemId"),
  toStatus: document.getElementById("toStatus"),
  statusNote: document.getElementById("statusNote"),
  updateStatusBtn: document.getElementById("updateStatusBtn"),
  statusResult: document.getElementById("statusResult"),
  historyBtn: document.getElementById("historyBtn"),
  history: document.getElementById("history"),
  followupQueue: document.getElementById("followupQueue"),
  followupStatus: document.getElementById("followupStatus"),
  loadFollowupsBtn: document.getElementById("loadFollowupsBtn"),
  followupResults: document.getElementById("followupResults"),
  followupCaseId: document.getElementById("followupCaseId"),
  followupNote: document.getElementById("followupNote"),
  saveFollowupNoteBtn: document.getElementById("saveFollowupNoteBtn"),
  followupResult: document.getElementById("followupResult"),
  dailyCloseNote: document.getElementById("dailyCloseNote"),
  runDailyCloseBtn: document.getElementById("runDailyCloseBtn"),
  loadDailyCloseBtn: document.getElementById("loadDailyCloseBtn"),
  dailyCloseResult: document.getElementById("dailyCloseResult"),
  estimateCaseId: document.getElementById("estimateCaseId"),
  estimateItemId: document.getElementById("estimateItemId"),
  laborPaise: document.getElementById("laborPaise"),
  sparePaise: document.getElementById("sparePaise"),
  otherPaise: document.getElementById("otherPaise"),
  discountPaise: document.getElementById("discountPaise"),
  gstRequired: document.getElementById("gstRequired"),
  sendForDecision: document.getElementById("sendForDecision"),
  createEstimateBtn: document.getElementById("createEstimateBtn"),
  estimateId: document.getElementById("estimateId"),
  getEstimateBtn: document.getElementById("getEstimateBtn"),
  listCaseEstimatesBtn: document.getElementById("listCaseEstimatesBtn"),
  loadLatestEstimateBtn: document.getElementById("loadLatestEstimateBtn"),
  estimateDecision: document.getElementById("estimateDecision"),
  decisionByName: document.getElementById("decisionByName"),
  decisionByPhone: document.getElementById("decisionByPhone"),
  decisionChannel: document.getElementById("decisionChannel"),
  consentTemplateVersion: document.getElementById("consentTemplateVersion"),
  consentTextSnapshot: document.getElementById("consentTextSnapshot"),
  setEstimateDecisionBtn: document.getElementById("setEstimateDecisionBtn"),
  finalizeReason: document.getElementById("finalizeReason"),
  finalizeEstimateBtn: document.getElementById("finalizeEstimateBtn"),
  overrideReason: document.getElementById("overrideReason"),
  overrideLaborPaise: document.getElementById("overrideLaborPaise"),
  overrideSparePaise: document.getElementById("overrideSparePaise"),
  overrideOtherPaise: document.getElementById("overrideOtherPaise"),
  overrideDiscountPaise: document.getElementById("overrideDiscountPaise"),
  overrideEstimateBtn: document.getElementById("overrideEstimateBtn"),
  creditAmountPaise: document.getElementById("creditAmountPaise"),
  creditReason: document.getElementById("creditReason"),
  createCreditNoteBtn: document.getElementById("createCreditNoteBtn"),
  phase4Result: document.getElementById("phase4Result"),
  syncContextBtn: document.getElementById("syncContextBtn"),
  estimatePreview: document.getElementById("estimatePreview"),
  phase4Highlights: document.getElementById("phase4Highlights"),
  invoiceStateChip: document.getElementById("invoiceStateChip"),
  lockedChip: document.getElementById("lockedChip"),
  overrideChip: document.getElementById("overrideChip"),
  decisionChip: document.getElementById("decisionChip"),
  confirmFinalize: document.getElementById("confirmFinalize"),
  confirmOverride: document.getElementById("confirmOverride"),
  confirmCreditNote: document.getElementById("confirmCreditNote"),
  phase5CaseId: document.getElementById("phase5CaseId"),
  phase5CaseItemId: document.getElementById("phase5CaseItemId"),
  phase5InventoryItemId: document.getElementById("phase5InventoryItemId"),
  phase5SyncCaseBtn: document.getElementById("phase5SyncCaseBtn"),
  inventorySku: document.getElementById("inventorySku"),
  inventoryName: document.getElementById("inventoryName"),
  inventoryUom: document.getElementById("inventoryUom"),
  inventoryStockQty: document.getElementById("inventoryStockQty"),
  inventoryReorderQty: document.getElementById("inventoryReorderQty"),
  inventoryUnitCostPaise: document.getElementById("inventoryUnitCostPaise"),
  inventoryValuation: document.getElementById("inventoryValuation"),
  createInventoryBtn: document.getElementById("createInventoryBtn"),
  inventoryCreateResult: document.getElementById("inventoryCreateResult"),
  inventoryQuery: document.getElementById("inventoryQuery"),
  inventoryLowStockOnly: document.getElementById("inventoryLowStockOnly"),
  loadInventoryBtn: document.getElementById("loadInventoryBtn"),
  inventoryList: document.getElementById("inventoryList"),
  consumeQty: document.getElementById("consumeQty"),
  consumeUom: document.getElementById("consumeUom"),
  consumeUnitCostPaise: document.getElementById("consumeUnitCostPaise"),
  consumeLineCostPaise: document.getElementById("consumeLineCostPaise"),
  consumeNotes: document.getElementById("consumeNotes"),
  consumeOnCaseBtn: document.getElementById("consumeOnCaseBtn"),
  loadCaseConsumptionBtn: document.getElementById("loadCaseConsumptionBtn"),
  verifyLedgerBtn: document.getElementById("verifyLedgerBtn"),
  phase5Result: document.getElementById("phase5Result"),
  phase5LedgerResult: document.getElementById("phase5LedgerResult"),
  phase5StockWarning: document.getElementById("phase5StockWarning"),
  correctionConsumptionId: document.getElementById("correctionConsumptionId"),
  correctionQty: document.getElementById("correctionQty"),
  correctionType: document.getElementById("correctionType"),
  correctionReason: document.getElementById("correctionReason"),
  prepareCorrectionNoteBtn: document.getElementById("prepareCorrectionNoteBtn"),
  verifyCorrectionRefBtn: document.getElementById("verifyCorrectionRefBtn"),
  phase5CorrectionResult: document.getElementById("phase5CorrectionResult"),
  runPhase5SmokePayloadBtn: document.getElementById("runPhase5SmokePayloadBtn"),
  phase5SmokePayloadResult: document.getElementById("phase5SmokePayloadResult"),
  expenseDateLocal: document.getElementById("expenseDateLocal"),
  expenseCategory: document.getElementById("expenseCategory"),
  expenseAmountPaise: document.getElementById("expenseAmountPaise"),
  expensePaymentMode: document.getElementById("expensePaymentMode"),
  expenseNote: document.getElementById("expenseNote"),
  createExpenseBtn: document.getElementById("createExpenseBtn"),
  loadExpensesBtn: document.getElementById("loadExpensesBtn"),
  billName: document.getElementById("billName"),
  billCategory: document.getElementById("billCategory"),
  billAmountPaise: document.getElementById("billAmountPaise"),
  billDueDate: document.getElementById("billDueDate"),
  billFrequencyDays: document.getElementById("billFrequencyDays"),
  billReminderOffsets: document.getElementById("billReminderOffsets"),
  createBillBtn: document.getElementById("createBillBtn"),
  loadBillsBtn: document.getElementById("loadBillsBtn"),
  billId: document.getElementById("billId"),
  billPayAmountPaise: document.getElementById("billPayAmountPaise"),
  billPayMode: document.getElementById("billPayMode"),
  billPayNote: document.getElementById("billPayNote"),
  payBillBtn: document.getElementById("payBillBtn"),
  phase6Result: document.getElementById("phase6Result"),
  archiveUsageMb: document.getElementById("archiveUsageMb"),
  archiveQuotaMb: document.getElementById("archiveQuotaMb"),
  archiveThresholdPct: document.getElementById("archiveThresholdPct"),
  archiveUsageSource: document.getElementById("archiveUsageSource"),
  saveDbUsageBtn: document.getElementById("saveDbUsageBtn"),
  loadDbUsageBtn: document.getElementById("loadDbUsageBtn"),
  archiveTriggerForce: document.getElementById("archiveTriggerForce"),
  archiveTriggerLimit: document.getElementById("archiveTriggerLimit"),
  runArchiveTriggerCheckBtn: document.getElementById("runArchiveTriggerCheckBtn"),
  archiveIndexCaseNo: document.getElementById("archiveIndexCaseNo"),
  archiveIndexPhone: document.getElementById("archiveIndexPhone"),
  archiveIndexCustomerName: document.getElementById("archiveIndexCustomerName"),
  archiveIndexRestoreStatus: document.getElementById("archiveIndexRestoreStatus"),
  loadArchiveIndexBtn: document.getElementById("loadArchiveIndexBtn"),
  archiveRestoreId: document.getElementById("archiveRestoreId"),
  restoreArchiveBtn: document.getElementById("restoreArchiveBtn"),
  archiveAdminResult: document.getElementById("archiveAdminResult"),
  analyticsDays: document.getElementById("analyticsDays"),
  analyticsTimeoutMs: document.getElementById("analyticsTimeoutMs"),
  loadAnalyticsBtn: document.getElementById("loadAnalyticsBtn"),
  clearAnalyticsBtn: document.getElementById("clearAnalyticsBtn"),
  analyticsRoleChip: document.getElementById("analyticsRoleChip"),
  analyticsFinanceChip: document.getElementById("analyticsFinanceChip"),
  analyticsCaseKpi: document.getElementById("analyticsCaseKpi"),
  analyticsInventoryKpi: document.getElementById("analyticsInventoryKpi"),
  analyticsInventorySlices: document.getElementById("analyticsInventorySlices"),
  analyticsExpenseKpi: document.getElementById("analyticsExpenseKpi"),
  analyticsFinanceKpi: document.getElementById("analyticsFinanceKpi"),
  analyticsFinanceTrend: document.getElementById("analyticsFinanceTrend"),
  phase8Result: document.getElementById("phase8Result"),
  hrEmployeeCode: document.getElementById("hrEmployeeCode"),
  hrEmployeeName: document.getElementById("hrEmployeeName"),
  hrAttendanceDate: document.getElementById("hrAttendanceDate"),
  hrAttendanceStatus: document.getElementById("hrAttendanceStatus"),
  hrAttendanceHours: document.getElementById("hrAttendanceHours"),
  hrAttendanceNotes: document.getElementById("hrAttendanceNotes"),
  saveAttendanceBtn: document.getElementById("saveAttendanceBtn"),
  loadAttendanceBtn: document.getElementById("loadAttendanceBtn"),
  hrAdvanceDate: document.getElementById("hrAdvanceDate"),
  hrAdvanceAmountPaise: document.getElementById("hrAdvanceAmountPaise"),
  hrAdvanceSettledPaise: document.getElementById("hrAdvanceSettledPaise"),
  hrAdvanceRepaymentDate: document.getElementById("hrAdvanceRepaymentDate"),
  hrAdvanceStatus: document.getElementById("hrAdvanceStatus"),
  hrAdvanceReason: document.getElementById("hrAdvanceReason"),
  hrAdvanceNotes: document.getElementById("hrAdvanceNotes"),
  createAdvanceBtn: document.getElementById("createAdvanceBtn"),
  loadAdvancesBtn: document.getElementById("loadAdvancesBtn"),
  hrSummaryDays: document.getElementById("hrSummaryDays"),
  loadHrSummaryBtn: document.getElementById("loadHrSummaryBtn"),
  phase9Result: document.getElementById("phase9Result")
};

el.apiBase.value = storage.apiBase;

const phase5State = {
  lastConsumptionId: "",
  selectedInventory: null
};

const appState = {
  currentRole: "",
  compactMobileApplied: false,
  activeLane: "lane-primary"
};

const MOBILE_BREAKPOINT = 820;

function setText(node, text) {
  node.textContent = text;
}

function normalizeBase(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

function isLocalBase(base) {
  return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(base);
}

function buildFetchErrorMessage(base, originalMessage) {
  const pageIsHttps = window.location.protocol === "https:";
  const baseIsHttp = /^http:\/\//i.test(base);

  if (pageIsHttps && (baseIsHttp || isLocalBase(base))) {
    return "Cannot reach local/non-HTTPS API from deployed HTTPS site. Use API Base: https://workshop-api.jaiswal-utkarshuj.workers.dev";
  }

  if (isLocalBase(base) && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "Cannot reach localhost API from this browser context. Use API Base: https://workshop-api.jaiswal-utkarshuj.workers.dev";
  }

  return originalMessage || "Network request failed";
}

function setHidden(node, shouldHide) {
  if (!node) return;
  node.classList.toggle("is-hidden", shouldHide);
}

function applyLoginGate() {
  const loggedIn = Boolean(storage.token && appState.currentRole);
  setHidden(el.setup, loggedIn);
  setHidden(el.appWorkspace, !loggedIn);
  setHidden(el.sessionDock, !loggedIn);

  if (!el.loginGateHint) return;
  if (loggedIn) {
    setText(el.loginGateHint, "Workspace unlocked. Use lane tabs to navigate.");
  } else {
    setText(el.loginGateHint, "Login required to open operational lanes.");
  }
}

function setDisabled(node, shouldDisable, reason = "") {
  if (!node) return;
  node.disabled = shouldDisable;
  node.classList.toggle("is-disabled", shouldDisable);
  if (reason) node.title = reason;
  else node.removeAttribute("title");
}

function wireButtonClickEffects() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const button = target.closest("button");
    if (!(button instanceof HTMLButtonElement)) return;
    if (button.disabled) return;

    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    button.style.setProperty("--ripple-x", `${x}px`);
    button.style.setProperty("--ripple-y", `${y}px`);

    button.classList.remove("click-ripple");
    void button.offsetWidth;
    button.classList.add("click-ripple");
  });
}

function laneTabs() {
  return [
    el.tabLanePrimary,
    el.tabLaneInventory,
    el.tabLaneAnalytics,
    el.tabLaneHr
  ].filter(Boolean);
}

function laneNodes() {
  return [
    el.lanePrimary,
    el.laneInventory,
    el.laneAnalytics,
    el.laneHr
  ].filter(Boolean);
}

function isLaneAllowed(node) {
  if (!node) return false;
  return !node.classList.contains("is-hidden");
}

function getAllowedLaneIds() {
  return laneNodes().filter(isLaneAllowed).map((node) => node.id);
}

function activateLane(laneId, options = {}) {
  const { scroll = false } = options;
  const allowed = getAllowedLaneIds();
  const nextLaneId = allowed.includes(laneId) ? laneId : allowed[0] || "lane-primary";

  laneNodes().forEach((lane) => {
    lane.classList.toggle("lane-active", lane.id === nextLaneId);
  });

  laneTabs().forEach((tab) => {
    const active = tab.dataset.laneTarget === nextLaneId;
    tab.classList.toggle("is-active", active);
    tab.classList.toggle("ghost", !active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });

  appState.activeLane = nextLaneId;
  if (scroll) {
    document.getElementById(nextLaneId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function syncLaneWithRoleVisibility() {
  activateLane(appState.activeLane, { scroll: false });
}

function wireLaneNavigation() {
  laneTabs().forEach((tab) => {
    tab.addEventListener("click", () => {
      const laneId = tab.dataset.laneTarget;
      if (!laneId) return;
      activateLane(laneId, { scroll: true });
    });
  });

  document.querySelectorAll(".jump-link[data-lane-target]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetLane = link.getAttribute("data-lane-target");
      const href = link.getAttribute("href") || "";
      if (!targetLane) return;

      event.preventDefault();
      activateLane(targetLane, { scroll: false });

      if (href.startsWith("#")) {
        const anchor = document.querySelector(href);
        anchor?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

function applyRoleView() {
  const role = (appState.currentRole || "").toUpperCase();

  if (!role) {
    setHidden(el.laneHr, false);
    setHidden(el.laneAnalytics, false);
    setHidden(el.moduleBilling, false);
    setHidden(el.moduleArchive, false);
    setDisabled(el.quickLoadArchiveIndexBtn, false);
    if (el.quickActionsHint) {
      setText(el.quickActionsHint, "Login to enforce role-aware workspace visibility.");
    }
    applyLoginGate();
    syncLaneWithRoleVisibility();
    return;
  }

  if (role === "ADMIN") {
    setHidden(el.laneHr, false);
    setHidden(el.laneAnalytics, false);
    setHidden(el.moduleBilling, false);
    setHidden(el.moduleArchive, false);
    setDisabled(el.quickLoadArchiveIndexBtn, false);
    if (el.quickActionsHint) setText(el.quickActionsHint, "Admin mode: all lanes available.");
    applyLoginGate();
    syncLaneWithRoleVisibility();
    return;
  }

  if (role === "IT") {
    setHidden(el.laneHr, true);
    setHidden(el.laneAnalytics, false);
    setHidden(el.moduleBilling, false);
    setHidden(el.moduleArchive, false);
    setDisabled(el.quickLoadArchiveIndexBtn, false);
    if (el.quickActionsHint) setText(el.quickActionsHint, "IT mode: HR lane hidden.");
    applyLoginGate();
    syncLaneWithRoleVisibility();
    return;
  }

  if (role === "STAFF") {
    setHidden(el.laneHr, true);
    setHidden(el.laneAnalytics, true);
    setHidden(el.moduleBilling, true);
    setHidden(el.moduleArchive, true);
    setDisabled(el.quickLoadArchiveIndexBtn, true, "Archive index is available for Admin/IT only.");
    if (el.quickActionsHint) {
      setText(el.quickActionsHint, "Staff mode: finance/archive/analytics/hr sections are hidden.");
    }
    applyLoginGate();
    syncLaneWithRoleVisibility();
    return;
  }

  if (el.quickActionsHint) {
    setText(el.quickActionsHint, `Role ${role}: default visibility applied.`);
  }
  applyLoginGate();
  syncLaneWithRoleVisibility();
}

function setCompactMobileMode() {
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  document.body.classList.toggle("compact-mobile", isMobile);

  if (isMobile && !appState.compactMobileApplied) {
    const autoCollapse = [el.laneInventory, el.laneAnalytics, el.laneHr]
      .filter(Boolean)
      .flatMap((lane) => Array.from(lane.querySelectorAll("details")));

    autoCollapse.forEach((node) => {
      node.removeAttribute("open");
    });
    appState.compactMobileApplied = true;
    return;
  }

  if (!isMobile) {
    appState.compactMobileApplied = false;
  }
}

function toBool(value) {
  return String(value).toLowerCase() === "true";
}

function toIntOrZero(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.trunc(parsed);
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function toDateLocalString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function toStampCompact(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
}

function parseCsvInts(value, fallback = [7, 3, 0]) {
  const raw = String(value || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (!raw.length) return fallback;
  const parsed = raw
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x) && Number.isInteger(x) && x >= 0);
  return parsed.length ? Array.from(new Set(parsed)) : fallback;
}

function paiseToRupees(paise) {
  return (paise / 100).toFixed(2);
}

function computePreview() {
  const labor = Math.max(0, toIntOrZero(el.laborPaise.value));
  const spare = Math.max(0, toIntOrZero(el.sparePaise.value));
  const other = Math.max(0, toIntOrZero(el.otherPaise.value));
  const discount = Math.max(0, toIntOrZero(el.discountPaise.value));
  const gstRequired = toBool(el.gstRequired.value);
  const base = Math.max(0, labor + spare + other - discount);
  const gstRateBps = gstRequired ? 1800 : 0;
  const gst = Math.max(0, Math.round((base * gstRateBps) / 10000));
  const total = base + gst;

  el.estimatePreview.textContent = [
    `BASE_BILL_PAISE: ${base} (Rs ${paiseToRupees(base)})`,
    `GST_RATE_BPS: ${gstRateBps}`,
    `GST_AMOUNT_PAISE: ${gst} (Rs ${paiseToRupees(gst)})`,
    `INVOICE_TOTAL_PAISE: ${total} (Rs ${paiseToRupees(total)})`
  ].join("\n");
}

function setPhase4Result(payload) {
  el.phase4Result.textContent = JSON.stringify(payload, null, 2);
}

async function refreshEstimateSnapshotSilently(actionTag = "refresh_estimate") {
  const estimateId = el.estimateId.value.trim();
  if (!estimateId) return;
  try {
    const snapshot = await api(`/v1/estimates/${estimateId}`, { method: "GET" });
    setPhase4Highlights(actionTag, snapshot);
  } catch {
    // Keep the original action result visible when refresh fails.
  }
}

function updatePhase4Chips(data = {}) {
  el.invoiceStateChip.textContent = data.invoice_state || data.invoiceState || "NA";
  const lockValue = data.is_financial_locked;
  el.lockedChip.textContent = lockValue === undefined ? "NA" : String(Boolean(lockValue));
  el.overrideChip.textContent = String(data.override_count ?? 0);
  el.decisionChip.textContent = data.decision || "NA";
}

function setPhase4Highlights(action, payload = {}) {
  const data = payload.data || {};
  const lines = [
    `action: ${action}`,
    `code: ${payload.code || "UNKNOWN"}`,
    `estimate_id: ${data.id || el.estimateId.value.trim() || "NA"}`,
    `decision: ${data.decision || "NA"}`,
    `invoice_state: ${data.invoice_state || "NA"}`,
    `locked: ${data.is_financial_locked === undefined ? "NA" : String(Boolean(data.is_financial_locked))}`,
    `override_count: ${data.override_count ?? "NA"}`,
    `invoice_total_paise: ${data.invoice_total_paise ?? "NA"}`,
    `last_override_reason: ${data.last_override_reason || "NA"}`
  ];

  el.phase4Highlights.textContent = lines.join("\n");
  updatePhase4Chips(data);
}

function ensurePhase4Confirm(checkbox, message, action) {
  if (!checkbox?.checked) {
    setPhase4Result({ action, error: message });
    return false;
  }
  return true;
}

function syncPhase4ContextFromCase() {
  if (el.statusCaseId.value.trim()) {
    el.estimateCaseId.value = el.statusCaseId.value.trim();
  }
  if (el.statusItemId.value.trim()) {
    el.estimateItemId.value = el.statusItemId.value.trim();
  }
}

function syncPhase5ContextFromCase() {
  if (el.statusCaseId.value.trim()) {
    el.phase5CaseId.value = el.statusCaseId.value.trim();
  }
  if (el.statusItemId.value.trim()) {
    el.phase5CaseItemId.value = el.statusItemId.value.trim();
  }
}

function syncOperationalContextFromCase() {
  syncPhase4ContextFromCase();
  syncPhase5ContextFromCase();
}

function setPhase5Result(payload) {
  el.phase5Result.textContent = JSON.stringify(payload, null, 2);
}

function setPhase5LedgerResult(payload) {
  el.phase5LedgerResult.textContent = JSON.stringify(payload, null, 2);
}

function setPhase5CorrectionResult(payload) {
  el.phase5CorrectionResult.textContent = JSON.stringify(payload, null, 2);
}

function setPhase5SmokePayloadResult(payload) {
  if (!el.phase5SmokePayloadResult) return;
  el.phase5SmokePayloadResult.textContent = JSON.stringify(payload, null, 2);
}

function setPhase6Result(payload) {
  if (!el.phase6Result) return;
  el.phase6Result.textContent = JSON.stringify(payload, null, 2);
}

function setArchiveAdminResult(payload) {
  if (!el.archiveAdminResult) return;
  el.archiveAdminResult.textContent = JSON.stringify(payload, null, 2);
}

function setPhase8Result(payload) {
  if (!el.phase8Result) return;
  el.phase8Result.textContent = JSON.stringify(payload, null, 2);
}

function setPhase9Result(payload) {
  if (!el.phase9Result) return;
  el.phase9Result.textContent = JSON.stringify(payload, null, 2);
}

function metricCard(label, value) {
  return `<div class="metric-card"><b>${label}</b><span>${value}</span></div>`;
}

function buildSeriesPreview(rows, valueKey, formatter = (x) => x) {
  if (!Array.isArray(rows) || rows.length === 0) return "none";
  return rows
    .slice(-3)
    .map((row) => `${row.business_date_local || "NA"}: ${formatter(row[valueKey] ?? 0)}`)
    .join(" | ");
}

function renderAnalyticsOverview(payload = {}) {
  const data = payload.data || {};
  const role = data.role || appState.currentRole || "NA";
  const finance = data.finance || {};
  const caseKpi = data.case_followup_kpis || {};
  const inventory = data.inventory_trend || {};
  const expenseTrend = data.expense_trend || {};

  if (el.analyticsRoleChip) el.analyticsRoleChip.textContent = role;
  if (el.analyticsFinanceChip) el.analyticsFinanceChip.textContent = finance.visibility || "hidden";

  if (el.analyticsCaseKpi) {
    el.analyticsCaseKpi.innerHTML = [
      metricCard("Received Cases", caseKpi.received_cases ?? 0),
      metricCard("Delivered Items", caseKpi.delivered_items ?? 0),
      metricCard("Pending Approvals", caseKpi.pending_approvals ?? 0),
      metricCard("Pending Pickups", caseKpi.pending_pickups ?? 0),
      metricCard("Overdue Follow-ups", caseKpi.overdue_followups ?? 0),
      metricCard("Business Date", data.business_date_local || "NA")
    ].join("");
  }

  if (el.analyticsInventoryKpi) {
    const topItems = (inventory.top_consumed_items || [])
      .map((row) => `${row.item_name || row.sku || row.inventory_item_id || "unknown"}: ${row.consumed_qty}`)
      .slice(0, 3)
      .join(" | ") || "none";

    el.analyticsInventoryKpi.innerHTML = [
      metricCard("Consumption Events", inventory.consumption_events ?? 0),
      metricCard("Consumed Qty Total", inventory.consumed_qty_total ?? 0),
      metricCard("Consumed Cost (paise)", inventory.consumed_cost_total_paise ?? 0),
      metricCard("Top Consumed", topItems)
    ].join("");
  }

  if (el.analyticsInventorySlices) {
    const daily = inventory.daily_consumption || [];
    const hottestDay = [...daily].sort((a, b) => (b.consumed_qty_total || 0) - (a.consumed_qty_total || 0))[0] || null;

    el.analyticsInventorySlices.innerHTML = [
      metricCard("Daily Points", daily.length),
      metricCard("Latest 3 Days Qty", buildSeriesPreview(daily, "consumed_qty_total")),
      metricCard("Latest 3 Days Cost", buildSeriesPreview(daily, "consumed_cost_total_paise")),
      metricCard("Peak Day", hottestDay ? `${hottestDay.business_date_local}: ${hottestDay.consumed_qty_total}` : "NA")
    ].join("");
  }

  if (el.analyticsExpenseKpi) {
    const byCategory = expenseTrend.by_category_paise || {};
    const topCategory = Object.keys(byCategory)
      .sort((a, b) => (byCategory[b] || 0) - (byCategory[a] || 0))[0] || "NA";

    el.analyticsExpenseKpi.innerHTML = [
      metricCard("Total Expenses (paise)", expenseTrend.expenses_total_paise ?? 0),
      metricCard("Top Expense Category", topCategory),
      metricCard("Analytics Window (days)", data.window_days ?? "NA")
    ].join("");
  }

  if (el.analyticsFinanceKpi) {
    if (finance.visibility === "full") {
      el.analyticsFinanceKpi.innerHTML = [
        metricCard("Recognized Revenue (paise)", finance.recognized_revenue_paise ?? 0),
        metricCard("Credit Notes (paise)", finance.credit_notes_paise ?? 0),
        metricCard("Expenses (paise)", finance.expenses_paise ?? 0),
        metricCard("Net After Expenses (paise)", finance.net_after_expenses_paise ?? 0)
      ].join("");
    } else if (finance.visibility === "restricted") {
      el.analyticsFinanceKpi.innerHTML = [
        metricCard("Visibility", "Restricted"),
        metricCard("Expenses (paise)", finance.expenses_paise ?? "hidden"),
        metricCard("Note", finance.notes || "Finance fields are restricted for this role")
      ].join("");
    } else {
      el.analyticsFinanceKpi.innerHTML = [
        metricCard("Visibility", "Hidden"),
        metricCard("Note", "Ops-only view for current role")
      ].join("");
    }
  }

  if (el.analyticsFinanceTrend) {
    const expenseTop = (expenseTrend.by_category_top || [])
      .map((row) => `${row.category}: ${row.total_paise}`)
      .slice(0, 3)
      .join(" | ") || "none";

    if (finance.visibility === "full") {
      const netDaily = finance.net_daily_after_expenses_paise || [];
      el.analyticsFinanceTrend.innerHTML = [
        metricCard("Top Expense Categories", expenseTop),
        metricCard("Revenue Daily (3)", buildSeriesPreview(finance.revenue_daily_paise || [], "recognized_revenue_paise")),
        metricCard("Credit Daily (3)", buildSeriesPreview(finance.credit_notes_daily_paise || [], "credit_notes_paise")),
        metricCard("Net Daily After Expenses (3)", buildSeriesPreview(netDaily, "net_after_expenses_paise"))
      ].join("");
    } else if (finance.visibility === "restricted") {
      const dailyExpense = finance.daily_expense_paise || expenseTrend.daily_expense_paise || [];
      el.analyticsFinanceTrend.innerHTML = [
        metricCard("Top Expense Categories", expenseTop),
        metricCard("Daily Expense (3)", buildSeriesPreview(dailyExpense, "amount_paise")),
        metricCard("Visibility", "Restricted"),
        metricCard("Note", finance.notes || "Finance detail is restricted")
      ].join("");
    } else {
      el.analyticsFinanceTrend.innerHTML = [
        metricCard("Visibility", "Hidden"),
        metricCard("Note", "No finance trend for current role")
      ].join("");
    }
  }
}

function clearAnalyticsOverview() {
  if (el.analyticsRoleChip) el.analyticsRoleChip.textContent = "NA";
  if (el.analyticsFinanceChip) el.analyticsFinanceChip.textContent = "NA";
  if (el.analyticsCaseKpi) el.analyticsCaseKpi.innerHTML = "";
  if (el.analyticsInventoryKpi) el.analyticsInventoryKpi.innerHTML = "";
  if (el.analyticsInventorySlices) el.analyticsInventorySlices.innerHTML = "";
  if (el.analyticsExpenseKpi) el.analyticsExpenseKpi.innerHTML = "";
  if (el.analyticsFinanceKpi) el.analyticsFinanceKpi.innerHTML = "";
  if (el.analyticsFinanceTrend) el.analyticsFinanceTrend.innerHTML = "";
  setPhase8Result({ action: "clear_analytics" });
}

function setPhase5StockWarning(message, tone = "") {
  if (!el.phase5StockWarning) return;
  el.phase5StockWarning.textContent = message || "";
  el.phase5StockWarning.classList.remove("warn", "ok");
  if (tone) el.phase5StockWarning.classList.add(tone);
}

function updatePhase5StockWarning() {
  const inv = phase5State.selectedInventory;
  if (!inv) {
    setPhase5StockWarning("Select inventory item to preview stock guard checks.");
    return;
  }

  const stock = Number(inv.current_stock_qty);
  const reorder = Number(inv.reorder_level_qty);
  const qty = Number(el.consumeQty.value || 0);
  if (!Number.isFinite(stock) || !Number.isFinite(reorder) || !Number.isFinite(qty) || qty <= 0) {
    setPhase5StockWarning("Enter a positive consume qty to run stock guard preview.");
    return;
  }

  const projected = stock - qty;
  if (projected < 0) {
    setPhase5StockWarning(`Projected stock is negative (${projected}). Consumption may be blocked by DB policy.`, "warn");
    return;
  }

  if (projected <= reorder) {
    setPhase5StockWarning(`Projected stock after consume: ${projected}. This reaches low-stock threshold (${reorder}).`, "warn");
    return;
  }

  setPhase5StockWarning(`Projected stock after consume: ${projected}. Within safe range.`, "ok");
}

function renderInventoryList(items = []) {
  if (!items.length) {
    el.inventoryList.innerHTML = "<p class='hint'>No inventory rows found</p>";
    phase5State.selectedInventory = null;
    updatePhase5StockWarning();
    return;
  }

  el.inventoryList.innerHTML = items
    .map((row) => {
      const lowStock = Number(row.current_stock_qty) <= Number(row.reorder_level_qty);
      return `<div class="case-item"><b>${row.item_name}</b><br/>sku: ${row.sku || "NA"}<br/>inventory_item_id: ${row.id}<br/>stock: ${row.current_stock_qty} ${row.uom || ""}<br/>reorder: ${row.reorder_level_qty}<br/>low_stock: ${String(lowStock)}<br/><button type="button" class="ghost use-inventory-btn" data-inventory-id="${row.id}" data-uom="${row.uom || ""}" data-stock="${row.current_stock_qty}" data-reorder="${row.reorder_level_qty}" data-item-name="${row.item_name}">Use for Consumption</button></div>`;
    })
    .join("");
}

async function api(path, options = {}) {
  const base = normalizeBase(storage.apiBase);
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (storage.token) headers.Authorization = `Bearer ${storage.token}`;

  let response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      headers
    });
  } catch (error) {
    const message = buildFetchErrorMessage(base, error?.message || "Failed to fetch");
    throw new Error(message);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.code || `HTTP ${response.status}`);
  }
  return data;
}

async function loadMe() {
  if (!storage.token) {
    appState.currentRole = "";
    setText(el.whoami, "Not logged in");
    if (el.whoamiTop) setText(el.whoamiTop, "Guest");
    applyRoleView();
    return;
  }
  try {
    const result = await api("/v1/auth/me", { method: "GET" });
    appState.currentRole = result?.data?.role || "";
    setText(el.whoami, `Logged in: ${result.data.full_name} (${result.data.role})`);
    if (el.whoamiTop) setText(el.whoamiTop, `${result.data.full_name} (${result.data.role})`);
    applyRoleView();
  } catch (error) {
    storage.token = "";
    appState.currentRole = "";
    setText(el.whoami, `Session invalid: ${error.message}`);
    if (el.whoamiTop) setText(el.whoamiTop, "Guest");
    applyRoleView();
  }
}

el.saveApiBase.addEventListener("click", () => {
  const base = normalizeBase(el.apiBase.value);
  storage.apiBase = base;

  const pageIsHttps = window.location.protocol === "https:";
  const baseIsHttp = /^http:\/\//i.test(base);
  if (pageIsHttps && (baseIsHttp || isLocalBase(base))) {
    setText(el.whoami, "API base saved, but this HTTPS site cannot call local/non-HTTPS API. Use worker URL.");
    return;
  }

  setText(el.whoami, `API base saved: ${storage.apiBase}`);
});

el.quickCreateCaseBtn?.addEventListener("click", () => {
  activateLane("lane-primary", { scroll: false });
  document.getElementById("module-case")?.scrollIntoView({ behavior: "smooth", block: "start" });
  el.createCaseBtn?.click();
});

el.quickLoadFollowupsBtn?.addEventListener("click", () => {
  activateLane("lane-primary", { scroll: false });
  document.getElementById("module-followup")?.scrollIntoView({ behavior: "smooth", block: "start" });
  el.loadFollowupsBtn?.click();
});

el.quickRunDailyCloseBtn?.addEventListener("click", () => {
  activateLane("lane-primary", { scroll: false });
  document.getElementById("module-followup")?.scrollIntoView({ behavior: "smooth", block: "start" });
  el.runDailyCloseBtn?.click();
});

el.quickLoadArchiveIndexBtn?.addEventListener("click", () => {
  if (el.quickLoadArchiveIndexBtn.disabled) return;
  activateLane("lane-primary", { scroll: false });
  document.getElementById("module-archive")?.scrollIntoView({ behavior: "smooth", block: "start" });
  el.loadArchiveIndexBtn?.click();
});

el.syncContextBtn?.addEventListener("click", () => {
  syncOperationalContextFromCase();
  setPhase4Result({ action: "sync_context", case_id: el.estimateCaseId.value.trim(), case_item_id: el.estimateItemId.value.trim() });
});

el.phase5SyncCaseBtn?.addEventListener("click", () => {
  syncPhase5ContextFromCase();
  setPhase5Result({
    action: "sync_case_context",
    case_id: el.phase5CaseId.value.trim(),
    case_item_id: el.phase5CaseItemId.value.trim()
  });
});

el.runPhase5SmokePayloadBtn?.addEventListener("click", () => {
  const now = new Date();
  const stamp = toStampCompact(now);
  const randomPhone = `97${Math.floor(100000000 + Math.random() * 900000000)}`;

  const generated = {
    smoke: "PHASE5_UI_PAYLOAD_GENERATED",
    generated_at_utc: now.toISOString(),
    steps: [
      "POST /v1/cases",
      "POST /v1/cases/{case_id}/items/{item_id}/status -> Diagnosis, WaitingApproval, ApprovedForRepair",
      "POST /v1/inventory/items",
      "POST /v1/cases/{case_id}/consumption",
      "GET /v1/inventory/ledger?ref_entity=case_consumption&ref_id={consumption_id}"
    ],
    payloads: {
      create_case: {
        case_no: `P5UI-GEN-${stamp}`,
        customer: {
          name: "Phase5 UI Smoke",
          phone: randomPhone
        },
        item: {
          item_category: "fan",
          reported_issue: "Phase5 regression smoke flow"
        }
      },
      create_inventory_item: {
        sku: `P5UI-GEN-SKU-${stamp}`,
        item_name: "Fan Capacitor 2.5uF Smoke",
        uom: "pcs",
        current_stock_qty: 40,
        reorder_level_qty: 8,
        default_unit_cost_paise: 1900,
        valuation_method: "WEIGHTED_AVERAGE"
      },
      consume_on_case: {
        case_item_id: "<from create_case response>",
        inventory_item_id: "<from create_inventory_item response>",
        qty: 4,
        uom: "pcs",
        unit_cost_paise_snapshot: 1900,
        notes: `phase5 generated smoke ${stamp}`
      }
    }
  };

  el.caseNo.value = generated.payloads.create_case.case_no;
  el.customerName.value = generated.payloads.create_case.customer.name;
  el.customerPhone.value = generated.payloads.create_case.customer.phone;
  el.itemCategory.value = generated.payloads.create_case.item.item_category;
  el.reportedIssue.value = generated.payloads.create_case.item.reported_issue;

  el.inventorySku.value = generated.payloads.create_inventory_item.sku;
  el.inventoryName.value = generated.payloads.create_inventory_item.item_name;
  el.inventoryUom.value = generated.payloads.create_inventory_item.uom;
  el.inventoryStockQty.value = String(generated.payloads.create_inventory_item.current_stock_qty);
  el.inventoryReorderQty.value = String(generated.payloads.create_inventory_item.reorder_level_qty);
  el.inventoryUnitCostPaise.value = String(generated.payloads.create_inventory_item.default_unit_cost_paise);
  el.consumeQty.value = String(generated.payloads.consume_on_case.qty);
  el.consumeUom.value = generated.payloads.consume_on_case.uom;
  el.consumeUnitCostPaise.value = String(generated.payloads.consume_on_case.unit_cost_paise_snapshot);
  el.consumeNotes.value = generated.payloads.consume_on_case.notes;

  setPhase5SmokePayloadResult(generated);
  updatePhase5StockWarning();
});

el.loginBtn.addEventListener("click", async () => {
  try {
    const result = await api("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: el.email.value.trim(),
        password: el.password.value
      })
    });
    storage.token = result.data.access_token;
    await loadMe();
  } catch (error) {
    setText(el.whoami, `Login failed: ${error.message}`);
  }
});

function handleLogout() {
  storage.token = "";
  appState.currentRole = "";
  setText(el.whoami, "Logged out");
  if (el.whoamiTop) setText(el.whoamiTop, "Guest");
  clearAnalyticsOverview();
  applyRoleView();
}

el.logoutBtn.addEventListener("click", handleLogout);
el.logoutTopBtn?.addEventListener("click", handleLogout);

el.loadAnalyticsBtn?.addEventListener("click", async () => {
  try {
    const days = Math.max(1, toIntOrZero(el.analyticsDays.value || "30"));
    const timeoutMs = Math.max(1000, toIntOrZero(el.analyticsTimeoutMs.value || "9000"));
    const result = await api(`/v1/analytics/overview?days=${days}&query_timeout_ms=${timeoutMs}`, { method: "GET" });
    renderAnalyticsOverview(result);
    setPhase8Result({ action: "load_analytics_overview", ...result });
  } catch (error) {
    setPhase8Result({ action: "load_analytics_overview", error: error.message });
  }
});

el.clearAnalyticsBtn?.addEventListener("click", () => {
  clearAnalyticsOverview();
});

el.saveAttendanceBtn?.addEventListener("click", async () => {
  try {
    const payload = {
      employee_code: el.hrEmployeeCode.value.trim(),
      employee_name: el.hrEmployeeName.value.trim(),
      business_date_local: el.hrAttendanceDate.value.trim() || undefined,
      attendance_status: el.hrAttendanceStatus.value,
      hours_worked: toNumberOrNull(el.hrAttendanceHours.value),
      notes: el.hrAttendanceNotes.value.trim() || undefined
    };

    const result = await api("/v1/hr/attendance", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setPhase9Result({ action: "save_attendance", ...result });
  } catch (error) {
    setPhase9Result({ action: "save_attendance", error: error.message });
  }
});

el.loadAttendanceBtn?.addEventListener("click", async () => {
  try {
    const params = new URLSearchParams();
    if (el.hrEmployeeCode.value.trim()) params.set("employee_code", el.hrEmployeeCode.value.trim());
    if (el.hrAttendanceStatus.value.trim()) params.set("attendance_status", el.hrAttendanceStatus.value.trim());
    params.set("limit", "20");

    const result = await api(`/v1/hr/attendance?${params.toString()}`, { method: "GET" });
    setPhase9Result({ action: "load_attendance", ...result });
  } catch (error) {
    setPhase9Result({ action: "load_attendance", error: error.message });
  }
});

el.createAdvanceBtn?.addEventListener("click", async () => {
  try {
    const payload = {
      employee_code: el.hrEmployeeCode.value.trim(),
      employee_name: el.hrEmployeeName.value.trim(),
      advance_date_local: el.hrAdvanceDate.value.trim() || undefined,
      amount_paise: toIntOrZero(el.hrAdvanceAmountPaise.value),
      settled_amount_paise: toIntOrZero(el.hrAdvanceSettledPaise.value),
      repayment_due_date_local: el.hrAdvanceRepaymentDate.value.trim() || undefined,
      status: el.hrAdvanceStatus.value,
      reason: el.hrAdvanceReason.value.trim() || undefined,
      notes: el.hrAdvanceNotes.value.trim() || undefined
    };

    const result = await api("/v1/hr/advances", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setPhase9Result({ action: "create_advance", ...result });
  } catch (error) {
    setPhase9Result({ action: "create_advance", error: error.message });
  }
});

el.loadAdvancesBtn?.addEventListener("click", async () => {
  try {
    const params = new URLSearchParams();
    if (el.hrEmployeeCode.value.trim()) params.set("employee_code", el.hrEmployeeCode.value.trim());
    if (el.hrAdvanceStatus.value.trim()) params.set("status", el.hrAdvanceStatus.value.trim());
    params.set("limit", "20");

    const result = await api(`/v1/hr/advances?${params.toString()}`, { method: "GET" });
    setPhase9Result({ action: "load_advances", ...result });
  } catch (error) {
    setPhase9Result({ action: "load_advances", error: error.message });
  }
});

el.loadHrSummaryBtn?.addEventListener("click", async () => {
  try {
    const days = Math.max(1, toIntOrZero(el.hrSummaryDays.value || "30"));
    const result = await api(`/v1/hr/summary?days=${days}`, { method: "GET" });
    setPhase9Result({ action: "load_hr_summary", ...result });
  } catch (error) {
    setPhase9Result({ action: "load_hr_summary", error: error.message });
  }
});

el.createCaseBtn.addEventListener("click", async () => {
  try {
    const result = await api("/v1/cases", {
      method: "POST",
      body: JSON.stringify({
        case_no: el.caseNo.value.trim(),
        customer: {
          name: el.customerName.value.trim(),
          phone: el.customerPhone.value.trim()
        },
        item: {
          item_category: el.itemCategory.value.trim(),
          reported_issue: el.reportedIssue.value.trim()
        }
      })
    });

    setText(el.createResult, `Created: case_id=${result.data.case_id}, item_id=${result.data.case_item_id}`);
    el.statusCaseId.value = result.data.case_id;
    el.statusItemId.value = result.data.case_item_id;
    syncOperationalContextFromCase();
  } catch (error) {
    setText(el.createResult, `Create failed: ${error.message}`);
  }
});

el.searchBtn.addEventListener("click", async () => {
  try {
    const params = new URLSearchParams();
    if (el.searchCaseNo.value.trim()) params.set("case_no", el.searchCaseNo.value.trim());
    if (el.searchPhone.value.trim()) params.set("phone", el.searchPhone.value.trim());

    const path = `/v1/cases${params.toString() ? `?${params.toString()}` : ""}`;
    const result = await api(path, { method: "GET" });

    if (!result.data || result.data.length === 0) {
      el.searchResults.innerHTML = "<p class='hint'>No cases found</p>";
      return;
    }

    el.searchResults.innerHTML = result.data
      .map((row) => {
        const customerRaw = row.customers;
        const customer = Array.isArray(customerRaw)
          ? (customerRaw[0] || {})
          : (customerRaw || {});
        return `<div class="case-item"><b>${row.case_no}</b><br/>case_id: ${row.id}<br/>status: ${row.header_status}<br/>customer: ${customer.name || ""} (${customer.phone || ""})<br/><button type="button" class="ghost use-case-btn" data-case-id="${row.id}">Use in Status/Phase4</button></div>`;
      })
      .join("");
  } catch (error) {
    el.searchResults.innerHTML = `<p class='hint'>Search failed: ${error.message}</p>`;
  }
});

el.updateStatusBtn.addEventListener("click", async () => {
  try {
    const caseId = el.statusCaseId.value.trim();
    const itemId = el.statusItemId.value.trim();
    const result = await api(`/v1/cases/${caseId}/items/${itemId}/status`, {
      method: "POST",
      body: JSON.stringify({
        to_status: el.toStatus.value,
        note: el.statusNote.value.trim()
      })
    });
    setText(el.statusResult, `Updated: ${result.data.from_status} -> ${result.data.to_status} | header=${result.data.header_status}`);
    syncOperationalContextFromCase();
  } catch (error) {
    setText(el.statusResult, `Status update failed: ${error.message}`);
  }
});

el.searchResults.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.classList.contains("use-case-btn")) return;

  const caseId = target.getAttribute("data-case-id") || "";
  if (!caseId) return;

  el.statusCaseId.value = caseId;
  el.estimateCaseId.value = caseId;
  el.phase5CaseId.value = caseId;
  setText(el.statusResult, `Case selected: ${caseId}. Load item IDs from case detail flow if needed.`);
});

el.createInventoryBtn?.addEventListener("click", async () => {
  try {
    const payload = {
      sku: el.inventorySku.value.trim() || null,
      item_name: el.inventoryName.value.trim(),
      uom: el.inventoryUom.value.trim() || "pcs",
      current_stock_qty: toNumberOrNull(el.inventoryStockQty.value),
      reorder_level_qty: toNumberOrNull(el.inventoryReorderQty.value),
      default_unit_cost_paise: toIntOrZero(el.inventoryUnitCostPaise.value),
      valuation_method: el.inventoryValuation.value
    };

    const result = await api("/v1/inventory/items", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (result?.data?.id) {
      el.phase5InventoryItemId.value = result.data.id;
    }
    setText(el.inventoryCreateResult, `Created inventory item: ${result?.data?.id || "NA"}`);
    setPhase5Result({ action: "create_inventory_item", ...result });
  } catch (error) {
    setText(el.inventoryCreateResult, `Inventory create failed: ${error.message}`);
    setPhase5Result({ action: "create_inventory_item", error: error.message });
  }
});

el.loadInventoryBtn?.addEventListener("click", async () => {
  try {
    const params = new URLSearchParams();
    const query = el.inventoryQuery.value.trim();
    if (query) params.set("q", query);
    params.set("low_stock_only", String(toBool(el.inventoryLowStockOnly.value)));
    params.set("limit", "20");

    const result = await api(`/v1/inventory/items?${params.toString()}`, { method: "GET" });
    renderInventoryList(result.data || []);
    if (!el.phase5InventoryItemId.value.trim() && result.data?.[0]?.id) {
      el.phase5InventoryItemId.value = result.data[0].id;
    }
    if (result.data?.[0]) {
      phase5State.selectedInventory = result.data[0];
      updatePhase5StockWarning();
    }
    setPhase5Result({ action: "list_inventory_items", ...result });
  } catch (error) {
    el.inventoryList.innerHTML = `<p class='hint'>Inventory load failed: ${error.message}</p>`;
    setPhase5StockWarning("Unable to evaluate stock warning because inventory list load failed.", "warn");
    setPhase5Result({ action: "list_inventory_items", error: error.message });
  }
});

el.inventoryList?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.classList.contains("use-inventory-btn")) return;

  const inventoryId = target.getAttribute("data-inventory-id") || "";
  const uom = target.getAttribute("data-uom") || "";
  const stock = Number(target.getAttribute("data-stock") || "NaN");
  const reorder = Number(target.getAttribute("data-reorder") || "NaN");
  const itemName = target.getAttribute("data-item-name") || "";
  if (!inventoryId) return;

  el.phase5InventoryItemId.value = inventoryId;
  phase5State.selectedInventory = {
    id: inventoryId,
    item_name: itemName,
    current_stock_qty: stock,
    reorder_level_qty: reorder,
    uom
  };
  if (!el.consumeUom.value.trim() && uom) {
    el.consumeUom.value = uom;
  }
  updatePhase5StockWarning();
  setPhase5Result({ action: "select_inventory_item", inventory_item_id: inventoryId, uom });
});

el.consumeQty?.addEventListener("input", () => {
  updatePhase5StockWarning();
});

el.consumeOnCaseBtn?.addEventListener("click", async () => {
  try {
    const caseId = el.phase5CaseId.value.trim();
    const caseItemId = el.phase5CaseItemId.value.trim();
    const inventoryItemId = el.phase5InventoryItemId.value.trim();
    const qty = toNumberOrNull(el.consumeQty.value);

    if (!caseId || !caseItemId || !inventoryItemId) {
      setPhase5Result({ action: "consume_on_case", error: "case_id, case_item_id, and inventory_item_id are required" });
      return;
    }
    if (qty === null || qty <= 0) {
      setPhase5Result({ action: "consume_on_case", error: "qty must be a positive number" });
      return;
    }

    const unitCost = toNumberOrNull(el.consumeUnitCostPaise.value);
    const lineCost = toNumberOrNull(el.consumeLineCostPaise.value);
    const payload = {
      case_item_id: caseItemId,
      inventory_item_id: inventoryItemId,
      qty,
      uom: el.consumeUom.value.trim() || undefined,
      unit_cost_paise_snapshot: unitCost === null ? undefined : Math.trunc(unitCost),
      line_cost_paise: lineCost === null ? undefined : Math.trunc(lineCost),
      notes: el.consumeNotes.value.trim() || undefined
    };

    const result = await api(`/v1/cases/${caseId}/consumption`, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const createdConsumptionId = result?.data?.consumption?.id || "";
    if (createdConsumptionId) {
      phase5State.lastConsumptionId = createdConsumptionId;
    }

    setPhase5Result({
      action: "consume_on_case",
      last_consumption_id: phase5State.lastConsumptionId || null,
      ...result
    });
  } catch (error) {
    setPhase5Result({ action: "consume_on_case", error: error.message });
  }
});

el.loadCaseConsumptionBtn?.addEventListener("click", async () => {
  try {
    const caseId = el.phase5CaseId.value.trim();
    if (!caseId) {
      setPhase5Result({ action: "load_case_consumption", error: "Provide case_id" });
      return;
    }

    const params = new URLSearchParams();
    if (el.phase5CaseItemId.value.trim()) params.set("case_item_id", el.phase5CaseItemId.value.trim());
    params.set("limit", "20");

    const result = await api(`/v1/cases/${caseId}/consumption?${params.toString()}`, { method: "GET" });
    if (result.data?.[0]?.id) {
      phase5State.lastConsumptionId = result.data[0].id;
    }
    setPhase5Result({
      action: "load_case_consumption",
      last_consumption_id: phase5State.lastConsumptionId || null,
      ...result
    });
  } catch (error) {
    setPhase5Result({ action: "load_case_consumption", error: error.message });
  }
});

el.verifyLedgerBtn?.addEventListener("click", async () => {
  try {
    const params = new URLSearchParams();
    params.set("ref_entity", "case_consumption");
    params.set("limit", "20");

    const inventoryItemId = el.phase5InventoryItemId.value.trim();
    if (inventoryItemId) params.set("inventory_item_id", inventoryItemId);
    if (phase5State.lastConsumptionId) params.set("ref_id", phase5State.lastConsumptionId);

    if (!inventoryItemId && !phase5State.lastConsumptionId) {
      setPhase5LedgerResult({ action: "verify_ledger", error: "Select inventory item or create/load consumption first" });
      return;
    }

    const result = await api(`/v1/inventory/ledger?${params.toString()}`, { method: "GET" });
    const rows = result.data || [];
    const ledgerMatch = phase5State.lastConsumptionId
      ? rows.some((row) => row.ref_id === phase5State.lastConsumptionId)
      : rows.length > 0;

    setPhase5LedgerResult({
      action: "verify_ledger",
      ref_entity: "case_consumption",
      checked_ref_id: phase5State.lastConsumptionId || null,
      ledger_match_found: ledgerMatch,
      ledger_rows: rows
    });
  } catch (error) {
    setPhase5LedgerResult({ action: "verify_ledger", error: error.message });
  }
});

el.prepareCorrectionNoteBtn?.addEventListener("click", () => {
  const originalConsumptionId = el.correctionConsumptionId.value.trim() || phase5State.lastConsumptionId;
  const correctionQty = Number(el.correctionQty.value || 0);
  const correctionType = el.correctionType.value;
  const reason = el.correctionReason.value.trim();

  if (!originalConsumptionId) {
    setPhase5CorrectionResult({ action: "prepare_correction_note", error: "Provide original consumption_id or load case consumption first" });
    return;
  }
  if (!Number.isFinite(correctionQty) || correctionQty <= 0) {
    setPhase5CorrectionResult({ action: "prepare_correction_note", error: "correction qty must be positive" });
    return;
  }
  if (!reason) {
    setPhase5CorrectionResult({ action: "prepare_correction_note", error: "correction reason is required" });
    return;
  }

  const structuredNote = `CORRECTION_REQUEST type=${correctionType}; original_consumption_id=${originalConsumptionId}; correction_qty=${correctionQty}; reason=${reason}`;
  const existingNote = el.consumeNotes.value.trim();
  el.consumeNotes.value = existingNote ? `${existingNote} | ${structuredNote}` : structuredNote;

  setPhase5CorrectionResult({
    action: "prepare_correction_note",
    status: "READY",
    correction_type: correctionType,
    original_consumption_id: originalConsumptionId,
    correction_qty: correctionQty,
    next_step: "Use approved backend/admin reversal-correction path and keep this note in audit trail",
    note_preview: structuredNote
  });
});

el.verifyCorrectionRefBtn?.addEventListener("click", async () => {
  try {
    const originalConsumptionId = el.correctionConsumptionId.value.trim() || phase5State.lastConsumptionId;
    if (!originalConsumptionId) {
      setPhase5CorrectionResult({ action: "verify_correction_ref", error: "Provide original consumption_id" });
      return;
    }

    const params = new URLSearchParams();
    params.set("ref_entity", "case_consumption");
    params.set("ref_id", originalConsumptionId);
    params.set("limit", "10");

    const result = await api(`/v1/inventory/ledger?${params.toString()}`, { method: "GET" });
    const rows = result.data || [];
    setPhase5CorrectionResult({
      action: "verify_correction_ref",
      original_consumption_id: originalConsumptionId,
      ledger_ref_found: rows.length > 0,
      ledger_rows: rows
    });
  } catch (error) {
    setPhase5CorrectionResult({ action: "verify_correction_ref", error: error.message });
  }
});

el.createExpenseBtn?.addEventListener("click", async () => {
  try {
    const payload = {
      expense_date_local: el.expenseDateLocal.value.trim() || undefined,
      category: el.expenseCategory.value.trim(),
      amount_paise: toIntOrZero(el.expenseAmountPaise.value),
      payment_mode: el.expensePaymentMode.value.trim() || undefined,
      note: el.expenseNote.value.trim() || undefined
    };
    const result = await api("/v1/expenses", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setPhase6Result({ action: "create_expense", ...result });
  } catch (error) {
    setPhase6Result({ action: "create_expense", error: error.message });
  }
});

el.loadExpensesBtn?.addEventListener("click", async () => {
  try {
    const params = new URLSearchParams();
    if (el.expenseCategory.value.trim()) params.set("category", el.expenseCategory.value.trim());
    params.set("limit", "20");
    const result = await api(`/v1/expenses?${params.toString()}`, { method: "GET" });
    setPhase6Result({ action: "load_expenses", ...result });
  } catch (error) {
    setPhase6Result({ action: "load_expenses", error: error.message });
  }
});

el.createBillBtn?.addEventListener("click", async () => {
  try {
    const payload = {
      bill_name: el.billName.value.trim(),
      category: el.billCategory.value.trim() || undefined,
      amount_paise: toIntOrZero(el.billAmountPaise.value),
      due_date: el.billDueDate.value.trim() || toDateLocalString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      frequency_days: Math.max(1, toIntOrZero(el.billFrequencyDays.value || "30")),
      reminder_offsets: parseCsvInts(el.billReminderOffsets.value)
    };
    const result = await api("/v1/recurring-bills", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (result?.data?.id) el.billId.value = result.data.id;
    setPhase6Result({ action: "create_recurring_bill", ...result });
  } catch (error) {
    setPhase6Result({ action: "create_recurring_bill", error: error.message });
  }
});

el.loadBillsBtn?.addEventListener("click", async () => {
  try {
    const result = await api("/v1/recurring-bills?limit=20", { method: "GET" });
    if (!el.billId.value.trim() && result.data?.[0]?.id) {
      el.billId.value = result.data[0].id;
    }
    setPhase6Result({ action: "load_recurring_bills", ...result });
  } catch (error) {
    setPhase6Result({ action: "load_recurring_bills", error: error.message });
  }
});

el.payBillBtn?.addEventListener("click", async () => {
  try {
    const billId = el.billId.value.trim();
    if (!billId) {
      setPhase6Result({ action: "pay_recurring_bill", error: "Provide recurring bill ID" });
      return;
    }

    const paidAmountRaw = el.billPayAmountPaise.value.trim();
    const payload = {
      paid_amount_paise: paidAmountRaw ? toIntOrZero(paidAmountRaw) : undefined,
      payment_mode: el.billPayMode.value.trim() || undefined,
      note: el.billPayNote.value.trim() || undefined
    };

    const result = await api(`/v1/recurring-bills/${billId}/pay`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setPhase6Result({ action: "pay_recurring_bill", ...result });
  } catch (error) {
    setPhase6Result({ action: "pay_recurring_bill", error: error.message });
  }
});

el.saveDbUsageBtn?.addEventListener("click", async () => {
  try {
    const payload = {
      usage_mb: Number(el.archiveUsageMb.value),
      quota_mb: Number(el.archiveQuotaMb.value),
      threshold_pct: Number(el.archiveThresholdPct.value),
      source: el.archiveUsageSource.value.trim() || "ui-manual",
      details_json: {
        source: "archive-admin-ui"
      }
    };

    const result = await api("/v1/admin/db-usage", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    setArchiveAdminResult({ action: "save_db_usage", ...result });
  } catch (error) {
    setArchiveAdminResult({ action: "save_db_usage", error: error.message });
  }
});

el.loadDbUsageBtn?.addEventListener("click", async () => {
  try {
    const result = await api("/v1/admin/db-usage", { method: "GET" });
    const usage = result?.data;
    if (usage?.usage_mb !== null && usage?.usage_mb !== undefined) {
      el.archiveUsageMb.value = String(usage.usage_mb);
    }
    if (usage?.quota_mb !== null && usage?.quota_mb !== undefined) {
      el.archiveQuotaMb.value = String(usage.quota_mb);
    }
    if (usage?.threshold_pct !== null && usage?.threshold_pct !== undefined) {
      el.archiveThresholdPct.value = String(usage.threshold_pct);
    }
    setArchiveAdminResult({ action: "load_db_usage", ...result });
  } catch (error) {
    setArchiveAdminResult({ action: "load_db_usage", error: error.message });
  }
});

el.runArchiveTriggerCheckBtn?.addEventListener("click", async () => {
  try {
    const payload = {
      force: toBool(el.archiveTriggerForce.value),
      limit: Math.max(1, toIntOrZero(el.archiveTriggerLimit.value || "10"))
    };
    const result = await api("/v1/admin/archive/trigger-check", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setArchiveAdminResult({ action: "archive_trigger_check", ...result });
  } catch (error) {
    setArchiveAdminResult({ action: "archive_trigger_check", error: error.message });
  }
});

el.loadArchiveIndexBtn?.addEventListener("click", async () => {
  try {
    const params = new URLSearchParams();
    if (el.archiveIndexCaseNo.value.trim()) params.set("case_no", el.archiveIndexCaseNo.value.trim());
    if (el.archiveIndexPhone.value.trim()) params.set("phone", el.archiveIndexPhone.value.trim());
    if (el.archiveIndexCustomerName.value.trim()) params.set("customer_name", el.archiveIndexCustomerName.value.trim());
    if (el.archiveIndexRestoreStatus.value.trim()) params.set("restore_status", el.archiveIndexRestoreStatus.value.trim());
    params.set("limit", "20");

    const result = await api(`/v1/admin/archive-index?${params.toString()}`, { method: "GET" });
    const firstArchiveId = result?.data?.[0]?.id;
    if (!el.archiveRestoreId.value.trim() && firstArchiveId) {
      el.archiveRestoreId.value = firstArchiveId;
    }
    setArchiveAdminResult({ action: "load_archive_index", ...result });
  } catch (error) {
    setArchiveAdminResult({ action: "load_archive_index", error: error.message });
  }
});

el.restoreArchiveBtn?.addEventListener("click", async () => {
  try {
    const archiveId = el.archiveRestoreId.value.trim();
    if (!archiveId) {
      setArchiveAdminResult({ action: "restore_archive", error: "Provide archive_id" });
      return;
    }

    const result = await api(`/v1/admin/archive/restore/${archiveId}`, {
      method: "POST",
      body: JSON.stringify({})
    });
    setArchiveAdminResult({ action: "restore_archive", ...result });
  } catch (error) {
    setArchiveAdminResult({ action: "restore_archive", error: error.message });
  }
});

el.historyBtn.addEventListener("click", async () => {
  try {
    const caseId = el.statusCaseId.value.trim();
    const result = await api(`/v1/cases/${caseId}/status-history`, { method: "GET" });
    el.history.textContent = JSON.stringify(result.data, null, 2);
  } catch (error) {
    el.history.textContent = `History failed: ${error.message}`;
  }
});

el.loadFollowupsBtn.addEventListener("click", async () => {
  try {
    const params = new URLSearchParams();
    const queue = el.followupQueue.value;
    const itemStatus = el.followupStatus.value.trim();
    if (queue) params.set("queue", queue);
    if (itemStatus) params.set("item_status", itemStatus);

    const result = await api(`/v1/followups?${params.toString()}`, { method: "GET" });
    if (!result.data || result.data.length === 0) {
      el.followupResults.innerHTML = "<p class='hint'>No follow-up rows found</p>";
      return;
    }

    el.followupResults.innerHTML = result.data
      .map((row) => {
        const caseObjRaw = row.cases;
        const caseObj = Array.isArray(caseObjRaw) ? (caseObjRaw[0] || {}) : (caseObjRaw || {});
        const customerRaw = caseObj.customers;
        const customer = Array.isArray(customerRaw) ? (customerRaw[0] || {}) : (customerRaw || {});
        return `<div class="case-item"><b>${caseObj.case_no || ""}</b><br/>case_id: ${row.case_id}<br/>item_id: ${row.id}<br/>status: ${row.item_status}<br/>customer: ${customer.name || ""} (${customer.phone || ""})</div>`;
      })
      .join("");

    if (!el.followupCaseId.value.trim()) {
      el.followupCaseId.value = result.data[0].case_id;
    }
  } catch (error) {
    el.followupResults.innerHTML = `<p class='hint'>Follow-up load failed: ${error.message}</p>`;
  }
});

el.saveFollowupNoteBtn.addEventListener("click", async () => {
  try {
    const caseId = el.followupCaseId.value.trim();
    if (!caseId) {
      setText(el.followupResult, "Provide case ID");
      return;
    }

    const result = await api(`/v1/followups/cases/${caseId}/note`, {
      method: "POST",
      body: JSON.stringify({
        note: el.followupNote.value.trim(),
        followup_reminder_state: "REMINDED",
        mark_contacted_now: true
      })
    });

    setText(el.followupResult, `Saved follow-up for ${result.data.case_no}`);
  } catch (error) {
    setText(el.followupResult, `Follow-up save failed: ${error.message}`);
  }
});

el.runDailyCloseBtn.addEventListener("click", async () => {
  try {
    const result = await api("/v1/daily-close", {
      method: "POST",
      body: JSON.stringify({ notes: el.dailyCloseNote.value.trim() || "EOD close" })
    });
    el.dailyCloseResult.textContent = JSON.stringify(result.data, null, 2);
  } catch (error) {
    el.dailyCloseResult.textContent = `Daily close failed: ${error.message}`;
  }
});

el.loadDailyCloseBtn.addEventListener("click", async () => {
  try {
    const result = await api("/v1/daily-close/latest", { method: "GET" });
    el.dailyCloseResult.textContent = JSON.stringify(result.data, null, 2);
  } catch (error) {
    el.dailyCloseResult.textContent = `Load latest close failed: ${error.message}`;
  }
});

el.createEstimateBtn.addEventListener("click", async () => {
  try {
    const payload = {
      case_id: el.estimateCaseId.value.trim(),
      case_item_id: el.estimateItemId.value.trim(),
      labor_amount_paise: toIntOrZero(el.laborPaise.value),
      spare_amount_paise: toIntOrZero(el.sparePaise.value),
      other_amount_paise: toIntOrZero(el.otherPaise.value),
      discount_amount_paise: toIntOrZero(el.discountPaise.value),
      gst_required: toBool(el.gstRequired.value),
      send_for_decision: toBool(el.sendForDecision.value)
    };

    const result = await api("/v1/estimates", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    el.estimateId.value = result.data.id;
    setPhase4Result({ action: "create_estimate", ...result });
    setPhase4Highlights("create_estimate", result);
    await refreshEstimateSnapshotSilently("create_estimate_refresh");
  } catch (error) {
    setPhase4Result({ action: "create_estimate", error: error.message });
  }
});

el.getEstimateBtn.addEventListener("click", async () => {
  try {
    const estimateId = el.estimateId.value.trim();
    if (!estimateId) {
      setPhase4Result({ action: "get_estimate", error: "Provide estimate_id" });
      return;
    }
    const result = await api(`/v1/estimates/${estimateId}`, { method: "GET" });
    setPhase4Result({ action: "get_estimate", ...result });
    setPhase4Highlights("get_estimate", result);
  } catch (error) {
    setPhase4Result({ action: "get_estimate", error: error.message });
  }
});

el.listCaseEstimatesBtn.addEventListener("click", async () => {
  try {
    const caseId = el.estimateCaseId.value.trim();
    if (!caseId) {
      setPhase4Result({ action: "list_case_estimates", error: "Provide case_id" });
      return;
    }
    const result = await api(`/v1/cases/${caseId}/estimates`, { method: "GET" });
    setPhase4Result({ action: "list_case_estimates", ...result });
    if (result.data && result.data[0]) {
      updatePhase4Chips(result.data[0]);
      el.phase4Highlights.textContent = [
        "action: list_case_estimates",
        `count: ${result.data.length}`,
        `latest_estimate_id: ${result.data[0].id}`,
        `latest_invoice_state: ${result.data[0].invoice_state || "NA"}`,
        `latest_locked: ${String(Boolean(result.data[0].is_financial_locked))}`,
        `latest_override_count: ${result.data[0].override_count ?? 0}`
      ].join("\n");
    }
  } catch (error) {
    setPhase4Result({ action: "list_case_estimates", error: error.message });
  }
});

el.loadLatestEstimateBtn?.addEventListener("click", async () => {
  try {
    const caseId = el.estimateCaseId.value.trim();
    if (!caseId) {
      setPhase4Result({ action: "load_latest_estimate", error: "Provide case_id" });
      return;
    }

    const result = await api(`/v1/cases/${caseId}/estimates?limit=1`, { method: "GET" });
    const latest = result.data?.[0];
    if (!latest) {
      setPhase4Result({ action: "load_latest_estimate", error: "No estimates found for case" });
      return;
    }

    el.estimateId.value = latest.id;
    setPhase4Result({ action: "load_latest_estimate", estimate_id: latest.id, latest });
    updatePhase4Chips(latest);
    el.phase4Highlights.textContent = [
      "action: load_latest_estimate",
      `estimate_id: ${latest.id}`,
      `decision: ${latest.decision || "NA"}`,
      `invoice_state: ${latest.invoice_state || "NA"}`,
      `locked: ${String(Boolean(latest.is_financial_locked))}`,
      `override_count: ${latest.override_count ?? 0}`
    ].join("\n");
  } catch (error) {
    setPhase4Result({ action: "load_latest_estimate", error: error.message });
  }
});

el.setEstimateDecisionBtn.addEventListener("click", async () => {
  try {
    const estimateId = el.estimateId.value.trim();
    if (!estimateId) {
      setPhase4Result({ action: "set_estimate_decision", error: "Provide estimate_id" });
      return;
    }

    const result = await api(`/v1/estimates/${estimateId}/decision`, {
      method: "POST",
      body: JSON.stringify({
        decision: el.estimateDecision.value,
        decision_by_name: el.decisionByName.value.trim(),
        decision_by_phone: el.decisionByPhone.value.trim(),
        decision_channel: el.decisionChannel.value,
        consent_template_version_id: el.consentTemplateVersion.value.trim(),
        consent_text_snapshot: el.consentTextSnapshot.value.trim()
      })
    });

    setPhase4Result({ action: "set_estimate_decision", ...result });
    setPhase4Highlights("set_estimate_decision", result);
    await refreshEstimateSnapshotSilently("set_estimate_decision_refresh");
  } catch (error) {
    setPhase4Result({ action: "set_estimate_decision", error: error.message });
  }
});

el.finalizeEstimateBtn.addEventListener("click", async () => {
  if (!ensurePhase4Confirm(el.confirmFinalize, "Confirm financial lock before finalizing", "finalize_estimate")) {
    return;
  }

  try {
    const estimateId = el.estimateId.value.trim();
    if (!estimateId) {
      setPhase4Result({ action: "finalize_estimate", error: "Provide estimate_id" });
      return;
    }

    const result = await api(`/v1/billing/estimates/${estimateId}/finalize`, {
      method: "POST",
      body: JSON.stringify({ reason: el.finalizeReason.value.trim() || "Finalize from UI" })
    });

    setPhase4Result({ action: "finalize_estimate", ...result });
    setPhase4Highlights("finalize_estimate", result);
    await refreshEstimateSnapshotSilently("finalize_estimate_refresh");
  } catch (error) {
    setPhase4Result({ action: "finalize_estimate", error: error.message });
  }
});

el.overrideEstimateBtn.addEventListener("click", async () => {
  if (!ensurePhase4Confirm(el.confirmOverride, "Confirm audited override before editing finalized estimate", "override_estimate")) {
    return;
  }

  try {
    const estimateId = el.estimateId.value.trim();
    if (!estimateId) {
      setPhase4Result({ action: "override_estimate", error: "Provide estimate_id" });
      return;
    }

    const result = await api(`/v1/billing/estimates/${estimateId}`, {
      method: "PATCH",
      body: JSON.stringify({
        labor_amount_paise: toIntOrZero(el.overrideLaborPaise.value),
        spare_amount_paise: toIntOrZero(el.overrideSparePaise.value),
        other_amount_paise: toIntOrZero(el.overrideOtherPaise.value),
        discount_amount_paise: toIntOrZero(el.overrideDiscountPaise.value),
        gst_required: toBool(el.gstRequired.value),
        override_reason: el.overrideReason.value.trim()
      })
    });

    setPhase4Result({ action: "override_estimate", ...result });
    setPhase4Highlights("override_estimate", result);
    await refreshEstimateSnapshotSilently("override_estimate_refresh");
  } catch (error) {
    setPhase4Result({ action: "override_estimate", error: error.message });
  }
});

el.createCreditNoteBtn.addEventListener("click", async () => {
  if (!ensurePhase4Confirm(el.confirmCreditNote, "Confirm credit note posting before submitting", "create_credit_note")) {
    return;
  }

  try {
    const estimateId = el.estimateId.value.trim();
    if (!estimateId) {
      setPhase4Result({ action: "create_credit_note", error: "Provide estimate_id" });
      return;
    }

    const result = await api(`/v1/billing/estimates/${estimateId}/credit-note`, {
      method: "POST",
      body: JSON.stringify({
        credit_amount_paise: toIntOrZero(el.creditAmountPaise.value),
        reason: el.creditReason.value.trim(),
        metadata_json: {
          source: "phase4-ui"
        }
      })
    });

    setPhase4Result({ action: "create_credit_note", ...result });
    setPhase4Highlights("create_credit_note", result);
    await refreshEstimateSnapshotSilently("create_credit_note_refresh");
  } catch (error) {
    setPhase4Result({ action: "create_credit_note", error: error.message });
  }
});

[
  el.laborPaise,
  el.sparePaise,
  el.otherPaise,
  el.discountPaise,
  el.gstRequired
].forEach((node) => {
  node?.addEventListener("input", computePreview);
  node?.addEventListener("change", computePreview);
});

computePreview();
updatePhase5StockWarning();
wireButtonClickEffects();
wireLaneNavigation();
activateLane("lane-primary", { scroll: false });
applyRoleView();
setCompactMobileMode();
window.addEventListener("resize", setCompactMobileMode);
if (!el.expenseDateLocal.value) {
  el.expenseDateLocal.value = toDateLocalString();
}
if (!el.billDueDate.value) {
  el.billDueDate.value = toDateLocalString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
}
if (el.hrAttendanceDate && !el.hrAttendanceDate.value) {
  el.hrAttendanceDate.value = toDateLocalString();
}
if (el.hrAdvanceDate && !el.hrAdvanceDate.value) {
  el.hrAdvanceDate.value = toDateLocalString();
}
loadMe();
applyLoginGate();
