const storage = {
  get apiBase() {
    return localStorage.getItem("apiBase") || "http://127.0.0.1:8788";
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
  whoami: document.getElementById("whoami"),
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
  phase4Result: document.getElementById("phase4Result")
};

el.apiBase.value = storage.apiBase;

function setText(node, text) {
  node.textContent = text;
}

function toBool(value) {
  return String(value).toLowerCase() === "true";
}

function toIntOrZero(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.trunc(parsed);
}

function setPhase4Result(payload) {
  el.phase4Result.textContent = JSON.stringify(payload, null, 2);
}

async function api(path, options = {}) {
  const base = storage.apiBase.replace(/\/$/, "");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (storage.token) headers.Authorization = `Bearer ${storage.token}`;

  const response = await fetch(`${base}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.code || `HTTP ${response.status}`);
  }
  return data;
}

async function loadMe() {
  if (!storage.token) {
    setText(el.whoami, "Not logged in");
    return;
  }
  try {
    const result = await api("/v1/auth/me", { method: "GET" });
    setText(el.whoami, `Logged in: ${result.data.full_name} (${result.data.role})`);
  } catch (error) {
    storage.token = "";
    setText(el.whoami, `Session invalid: ${error.message}`);
  }
}

el.saveApiBase.addEventListener("click", () => {
  storage.apiBase = el.apiBase.value.trim();
  setText(el.whoami, `API base saved: ${storage.apiBase}`);
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

el.logoutBtn.addEventListener("click", () => {
  storage.token = "";
  setText(el.whoami, "Logged out");
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
    el.estimateCaseId.value = result.data.case_id;
    el.estimateItemId.value = result.data.case_item_id;
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
        return `<div class="case-item"><b>${row.case_no}</b><br/>case_id: ${row.id}<br/>status: ${row.header_status}<br/>customer: ${customer.name || ""} (${customer.phone || ""})</div>`;
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
  } catch (error) {
    setText(el.statusResult, `Status update failed: ${error.message}`);
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
  } catch (error) {
    setPhase4Result({ action: "list_case_estimates", error: error.message });
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
  } catch (error) {
    setPhase4Result({ action: "set_estimate_decision", error: error.message });
  }
});

el.finalizeEstimateBtn.addEventListener("click", async () => {
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
  } catch (error) {
    setPhase4Result({ action: "finalize_estimate", error: error.message });
  }
});

el.overrideEstimateBtn.addEventListener("click", async () => {
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
  } catch (error) {
    setPhase4Result({ action: "override_estimate", error: error.message });
  }
});

el.createCreditNoteBtn.addEventListener("click", async () => {
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
  } catch (error) {
    setPhase4Result({ action: "create_credit_note", error: error.message });
  }
});

loadMe();
