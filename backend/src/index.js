import { createClient } from "@supabase/supabase-js";

const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

const ITEM_STATUS_TRANSITIONS = {
  Received: ["Diagnosis", "Cancelled"],
  Diagnosis: ["WaitingApproval", "Cancelled"],
  WaitingApproval: ["ApprovedForRepair", "RejectedByCustomer", "Cancelled"],
  ApprovedForRepair: ["InRepair", "Cancelled"],
  RejectedByCustomer: ["Cancelled"],
  InRepair: ["Ready", "Cancelled"],
  Ready: ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: []
};

function getSupabaseConfig(env) {
  const publishableKey = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || "";
  const secretKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";

  return {
    url: env.SUPABASE_URL || "",
    publishableKey,
    secretKey,
    dbUrl: env.SUPABASE_DB_URL || ""
  };
}

function json(status, payload) {
  return Response.json(payload, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type"
    }
  });
}

function getIp(request) {
  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp) return cfIp;
  const forwardedFor = request.headers.get("X-Forwarded-For");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}

function getAttemptKey(ip, email) {
  return `${ip}:${(email || "").trim().toLowerCase()}`;
}

function getAttemptState(key) {
  const now = Date.now();
  let state = loginAttempts.get(key);

  if (!state) {
    state = { attempts: [], lockedUntil: 0 };
    loginAttempts.set(key, state);
  }

  state.attempts = state.attempts.filter((ts) => now - ts <= LOGIN_WINDOW_MS);
  if (state.lockedUntil && now > state.lockedUntil) {
    state.lockedUntil = 0;
  }

  return state;
}

function registerFailedAttempt(key) {
  const now = Date.now();
  const state = getAttemptState(key);
  state.attempts.push(now);

  if (state.attempts.length >= LOGIN_MAX_ATTEMPTS) {
    state.lockedUntil = now + LOGIN_LOCK_MS;
  }

  loginAttempts.set(key, state);
  return state;
}

function clearAttempts(key) {
  loginAttempts.delete(key);
}

function ensureId(value) {
  return typeof value === "string" && value.length > 0;
}

function ensureNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeCaseNo(value) {
  if (!ensureNonEmptyString(value)) return "";
  return value.trim();
}

function isValidCaseNo(value) {
  return /^[A-Za-z0-9][A-Za-z0-9\-/]{0,49}$/.test(value);
}

function getPagination(url) {
  const limitRaw = Number(url.searchParams.get("limit") || 20);
  const offsetRaw = Number(url.searchParams.get("offset") || 0);

  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.floor(limitRaw))) : 20;
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.floor(offsetRaw)) : 0;
  return { limit, offset };
}

function getBusinessDateInTimezone(timezone, isoDate = new Date().toISOString()) {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return dtf.format(new Date(isoDate));
}

function deriveHeaderStatus(itemStatuses) {
  if (!itemStatuses || itemStatuses.length === 0) return "Received";

  const allDeliveredOrCancelled = itemStatuses.every((s) => s === "Delivered" || s === "Cancelled");
  if (allDeliveredOrCancelled) return "DeliveredAll";

  const allReadyDeliveredCancelled = itemStatuses.every((s) => s === "Ready" || s === "Delivered" || s === "Cancelled");
  if (allReadyDeliveredCancelled) return "ReadyAll";

  const hasDelivered = itemStatuses.some((s) => s === "Delivered");
  if (hasDelivered) return "PartiallyReady";

  return "InProgress";
}

function toIsoStringSafe(value) {
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

function toSafeInt(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.trunc(parsed);
}

function isNonNegativeInt(value) {
  return Number.isInteger(value) && value >= 0;
}

function parsePaise(value, fallback = 0) {
  const parsed = toSafeInt(value, fallback);
  if (!isNonNegativeInt(parsed)) return null;
  return parsed;
}

function parseNumericQty(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function parsePositiveNumber(value, fallback = null) {
  const parsed = parseNumericQty(value, fallback);
  if (parsed === null) return null;
  return parsed > 0 ? parsed : null;
}

function toLowerTrim(value) {
  return ensureNonEmptyString(value) ? value.trim().toLowerCase() : "";
}

function toStableJson(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((x) => toStableJson(x)).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${toStableJson(value[k])}`).join(",")}}`;
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseSettingNumber(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function isValidDateLocal(value) {
  if (!ensureNonEmptyString(value)) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function addDaysDateLocal(dateLocal, days) {
  if (!isValidDateLocal(dateLocal)) return null;
  const base = new Date(`${dateLocal}T00:00:00.000Z`);
  if (Number.isNaN(base.getTime())) return null;
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function getBillReminderState(dueDateLocal, businessDateLocal) {
  if (!isValidDateLocal(dueDateLocal) || !isValidDateLocal(businessDateLocal)) return "unknown";

  const due = new Date(`${dueDateLocal}T00:00:00.000Z`);
  const business = new Date(`${businessDateLocal}T00:00:00.000Z`);
  const diffDays = Math.round((due.getTime() - business.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "due_today";
  if (diffDays <= 3) return "due_in_3_days";
  if (diffDays <= 7) return "due_in_7_days";
  return "upcoming";
}

function computeGstPaise(baseBillPaise, gstRateBps) {
  const base = BigInt(baseBillPaise);
  const rate = BigInt(gstRateBps);
  const gst = (base * rate + 5000n) / 10000n;
  const gstNumber = Number(gst);
  if (!Number.isSafeInteger(gstNumber)) return null;
  return gstNumber;
}

function computeInvoiceAmounts(input) {
  const labor = parsePaise(input.labor_amount_paise, 0);
  const spare = parsePaise(input.spare_amount_paise, 0);
  const other = parsePaise(input.other_amount_paise, 0);
  const discount = parsePaise(input.discount_amount_paise, 0);
  const gstRateBps = toSafeInt(input.gst_rate_bps, 1800);

  if (labor === null || spare === null || other === null || discount === null) {
    return { error: "Amount fields must be non-negative integers in paise" };
  }
  if (!isNonNegativeInt(gstRateBps)) {
    return { error: "gst_rate_bps must be a non-negative integer" };
  }

  const baseBill = labor + spare + other - discount;
  if (!isNonNegativeInt(baseBill)) {
    return { error: "base bill cannot be negative after discount" };
  }

  const gstAmount = computeGstPaise(baseBill, gstRateBps);
  if (gstAmount === null) {
    return { error: "gst amount overflow" };
  }

  const invoiceTotal = baseBill + gstAmount;
  if (!Number.isSafeInteger(invoiceTotal) || invoiceTotal < 0) {
    return { error: "invoice total overflow" };
  }

  return {
    data: {
      labor_amount_paise: labor,
      spare_amount_paise: spare,
      other_amount_paise: other,
      discount_amount_paise: discount,
      base_bill_amount_paise: baseBill,
      gst_rate_bps: gstRateBps,
      gst_amount_paise: gstAmount,
      invoice_total_paise: invoiceTotal
    }
  };
}

async function getSettingValue(serviceClient, tenantId, key, fallback) {
  const { data, error } = await serviceClient
    .from("settings")
    .select("value_json")
    .eq("tenant_id", tenantId)
    .eq("key", key)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return fallback;
  return data.value_json ?? fallback;
}

function normalizeEstimateDecision(value) {
  if (!ensureNonEmptyString(value)) return "";
  const trimmed = value.trim();
  if (["Approved", "Rejected", "Pending"].includes(trimmed)) return trimmed;
  return "";
}

function estimateStatusFromDecision(decision) {
  if (decision === "Approved") return "Approved";
  if (decision === "Rejected") return "Rejected";
  return "Sent";
}

function itemStatusFromDecision(decision) {
  if (decision === "Approved") return "ApprovedForRepair";
  if (decision === "Rejected") return "RejectedByCustomer";
  return null;
}

async function insertAuditLog(serviceClient, payload) {
  await serviceClient.from("audit_log").insert(payload);
}

async function buildDailyCloseSnapshot(serviceClient, tenantId, businessDateLocal, timezone) {
  const nowIso = new Date().toISOString();
  const threeDaysAgoIso = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)).toISOString();

  const { data: payments, error: payErr } = await serviceClient
    .from("payments")
    .select("id, amount_paise, payment_type, payment_mode, paid_at_utc")
    .eq("tenant_id", tenantId)
    .gte("paid_at_utc", threeDaysAgoIso)
    .lte("paid_at_utc", nowIso);

  if (payErr) {
    return { error: "Unable to build cash close summary" };
  }

  const todaysPayments = (payments || []).filter((row) => {
    return getBusinessDateInTimezone(timezone, row.paid_at_utc) === businessDateLocal;
  });

  const totalCollectedPaise = todaysPayments.reduce((sum, row) => sum + Number(row.amount_paise || 0), 0);
  const paymentCount = todaysPayments.length;

  const { data: pendingApprovalItems, error: pendingApprovalErr } = await serviceClient
    .from("case_items")
    .select("id, case_id, line_no, item_status, updated_at, cases!inner(case_no)")
    .eq("tenant_id", tenantId)
    .eq("item_status", "WaitingApproval")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (pendingApprovalErr) {
    return { error: "Unable to build pending approval snapshot" };
  }

  const { data: pendingDeliveryItems, error: pendingDeliveryErr } = await serviceClient
    .from("case_items")
    .select("id, case_id, line_no, item_status, updated_at, cases!inner(case_no)")
    .eq("tenant_id", tenantId)
    .in("item_status", ["Ready", "RejectedByCustomer"])
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (pendingDeliveryErr) {
    return { error: "Unable to build pending delivery snapshot" };
  }

  let overdueBills = {
    supported: false,
    reason: "Recurring bills module not active in current V1 scope",
    total_overdue_count: 0,
    items: []
  };

  const { data: recurringBills, error: billErr } = await serviceClient
    .from("recurring_bills")
    .select("id, bill_name, due_date, amount_paise")
    .eq("tenant_id", tenantId)
    .lt("due_date", businessDateLocal)
    .order("due_date", { ascending: true })
    .limit(100);

  if (!billErr) {
    overdueBills = {
      supported: true,
      reason: null,
      total_overdue_count: (recurringBills || []).length,
      items: recurringBills || []
    };
  }

  return {
    businessDateLocal,
    cashCloseSummary: {
      total_collected_paise: totalCollectedPaise,
      payment_count: paymentCount,
      generated_at_utc: nowIso
    },
    pendingApprovals: {
      total_count: (pendingApprovalItems || []).length,
      items: pendingApprovalItems || []
    },
    pendingDeliveries: {
      total_count: (pendingDeliveryItems || []).length,
      items: pendingDeliveryItems || []
    },
    overdueBills
  };
}

async function writeCaseStatusHistory(serviceClient, payload) {
  const { error } = await serviceClient.from("case_status_history").insert(payload);
  return error;
}

async function createOrResolveCustomer(serviceClient, tenantId, customerInput, actorUserId) {
  const customerName = customerInput?.name?.trim();
  const customerPhone = customerInput?.phone?.trim();

  if (!customerName || !customerPhone) {
    return { error: "customer.name and customer.phone are required" };
  }

  const { data: existingCustomer, error: existingErr } = await serviceClient
    .from("customers")
    .select("id, name, phone")
    .eq("tenant_id", tenantId)
    .eq("phone", customerPhone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingErr) {
    return { error: "Unable to resolve customer" };
  }

  const nowIso = new Date().toISOString();

  if (existingCustomer) {
    const patch = {
      name: customerName,
      email: customerInput?.email || null,
      alternate_phone: customerInput?.alternate_phone || null,
      address: customerInput?.address || null,
      updated_at: nowIso,
      updated_by: actorUserId
    };

    await serviceClient.from("customers").update(patch).eq("id", existingCustomer.id);
    return { customerId: existingCustomer.id };
  }

  const { data: newCustomer, error: createErr } = await serviceClient
    .from("customers")
    .insert({
      tenant_id: tenantId,
      name: customerName,
      phone: customerPhone,
      alternate_phone: customerInput?.alternate_phone || null,
      address: customerInput?.address || null,
      contact_preference: customerInput?.contact_preference || null,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorUserId,
      updated_by: actorUserId,
      is_active: true
    })
    .select("id")
    .single();

  if (createErr || !newCustomer?.id) {
    return { error: "Unable to create customer" };
  }

  return { customerId: newCustomer.id };
}

function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = payloadBase64 + "=".repeat((4 - (payloadBase64.length % 4)) % 4);
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

function getBearerToken(request) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return "";
  return auth.slice(7).trim();
}

function getPublicClient(env) {
  const cfg = getSupabaseConfig(env);
  if (!cfg.url || !cfg.publishableKey) return null;
  return createClient(cfg.url, cfg.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function getServiceClient(env) {
  const cfg = getSupabaseConfig(env);
  if (!cfg.url || !cfg.secretKey) return null;
  return createClient(cfg.url, cfg.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

async function requireAuth(request, env) {
  const token = getBearerToken(request);
  if (!token) {
    return { error: json(401, { code: "AUTH_REQUIRED", message: "Missing bearer token" }) };
  }

  const publicClient = getPublicClient(env);
  const serviceClient = getServiceClient(env);
  if (!publicClient || !serviceClient) {
    return { error: json(500, { code: "CONFIG_ERROR", message: "Supabase keys are not fully configured" }) };
  }

  const userResult = await publicClient.auth.getUser(token);
  if (userResult.error || !userResult.data?.user?.id) {
    return { error: json(401, { code: "INVALID_TOKEN", message: "Token is invalid or expired" }) };
  }

  const authUserId = userResult.data.user.id;
  const { data: appUser, error: appUserErr } = await serviceClient
    .from("users")
    .select("id, tenant_id, role, is_active, full_name, auth_user_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (appUserErr) {
    return { error: json(500, { code: "USER_LOOKUP_FAILED", message: "Unable to load user profile" }) };
  }

  if (!appUser || !appUser.is_active) {
    return { error: json(403, { code: "USER_INACTIVE", message: "User access is disabled" }) };
  }

  const payload = decodeJwtPayload(token);
  const tokenIssuedAt = payload?.iat ? Number(payload.iat) * 1000 : null;

  if (tokenIssuedAt) {
    const { data: revokeRows, error: revokeErr } = await serviceClient
      .from("user_token_revocations")
      .select("revoked_after_utc")
      .eq("tenant_id", appUser.tenant_id)
      .eq("auth_user_id", authUserId)
      .order("revoked_after_utc", { ascending: false })
      .limit(1);

    if (!revokeErr && revokeRows && revokeRows.length > 0) {
      const revokedAfter = new Date(revokeRows[0].revoked_after_utc).getTime();
      if (tokenIssuedAt < revokedAfter) {
        return { error: json(401, { code: "SESSION_REVOKED", message: "Session revoked. Please login again." }) };
      }
    }
  }

  return {
    user: {
      id: appUser.id,
      authUserId,
      tenantId: appUser.tenant_id,
      role: appUser.role,
      fullName: appUser.full_name
    },
    token,
    serviceClient
  };
}

function requireRole(user, allowedRoles) {
  return allowedRoles.includes(user.role);
}

function mapDbRuleError(error, defaultCode = "VALIDATION_ERROR", defaultMessage = "Request violates database rules") {
  const errCode = String(error?.code || "");
  if (errCode === "P0001" || errCode === "23503" || errCode === "23514") {
    return {
      status: 409,
      code: defaultCode,
      message: error?.message || defaultMessage
    };
  }
  return null;
}

function getConfigStatus(env) {
  const cfg = getSupabaseConfig(env);

  return {
    supabase_url: Boolean(cfg.url),
    supabase_publishable_key: Boolean(cfg.publishableKey),
    supabase_secret_key: Boolean(cfg.secretKey),
    supabase_db_url: Boolean(cfg.dbUrl),
    key_mode: env.SUPABASE_SECRET_KEY ? "modern" : (env.SUPABASE_SERVICE_ROLE_KEY ? "legacy" : "unset")
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const configStatus = getConfigStatus(env);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": "Authorization, Content-Type"
        }
      });
    }

    if (request.method === "POST" && url.pathname === "/v1/auth/login") {
      const ip = getIp(request);
      let body;
      try {
        body = await request.json();
      } catch {
        return json(400, { code: "INVALID_JSON", message: "Request body must be valid JSON" });
      }

      const email = body?.email;
      const password = body?.password;

      if (!email || !password) {
        return json(400, { code: "VALIDATION_ERROR", message: "email and password are required" });
      }

      const attemptKey = getAttemptKey(ip, email);
      const state = getAttemptState(attemptKey);
      if (state.lockedUntil && Date.now() < state.lockedUntil) {
        return json(429, {
          code: "AUTH_LOCKED",
          message: "Too many failed attempts. Try again later.",
          locked_until_utc: new Date(state.lockedUntil).toISOString()
        });
      }

      const publicClient = getPublicClient(env);
      const serviceClient = getServiceClient(env);
      if (!publicClient || !serviceClient) {
        return json(500, { code: "CONFIG_ERROR", message: "Supabase keys are not fully configured" });
      }

      const result = await publicClient.auth.signInWithPassword({ email, password });
      if (result.error || !result.data?.user || !result.data?.session) {
        const failed = registerFailedAttempt(attemptKey);
        return json(401, {
          code: "LOGIN_FAILED",
          message: "Invalid credentials",
          attempts_in_window: failed.attempts.length
        });
      }

      const { data: appUser, error: appUserErr } = await serviceClient
        .from("users")
        .select("id, tenant_id, role, is_active, full_name, auth_user_id")
        .eq("auth_user_id", result.data.user.id)
        .maybeSingle();

      if (appUserErr || !appUser || !appUser.is_active) {
        registerFailedAttempt(attemptKey);
        return json(403, {
          code: "USER_NOT_ALLOWED",
          message: "User does not have active access"
        });
      }

      clearAttempts(attemptKey);

      return json(200, {
        code: "OK",
        message: "Login successful",
        data: {
          access_token: result.data.session.access_token,
          refresh_token: result.data.session.refresh_token,
          expires_at: result.data.session.expires_at,
          user: {
            id: appUser.id,
            auth_user_id: appUser.auth_user_id,
            full_name: appUser.full_name,
            role: appUser.role,
            tenant_id: appUser.tenant_id
          }
        }
      });
    }

    if (request.method === "GET" && url.pathname === "/v1/auth/me") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;

      return json(200, {
        code: "OK",
        data: {
          id: auth.user.id,
          auth_user_id: auth.user.authUserId,
          tenant_id: auth.user.tenantId,
          role: auth.user.role,
          full_name: auth.user.fullName
        }
      });
    }

    if (request.method === "POST" && url.pathname === "/v1/cases") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json(400, { code: "INVALID_JSON", message: "Request body must be valid JSON" });
      }

      const caseNo = normalizeCaseNo(body?.case_no);
      if (!isValidCaseNo(caseNo)) {
        return json(400, { code: "VALIDATION_ERROR", message: "case_no is required and must match offline format" });
      }

      const item = body?.item || {};
      if (!ensureNonEmptyString(item?.item_category) || !ensureNonEmptyString(item?.reported_issue)) {
        return json(400, { code: "VALIDATION_ERROR", message: "item.item_category and item.reported_issue are required" });
      }

      const serviceClient = auth.serviceClient;
      const nowIso = new Date().toISOString();
      const receivedAtUtc = body?.received_at_utc || nowIso;
      const businessDate = getBusinessDateInTimezone(env.DEFAULT_TIMEZONE || "Asia/Kolkata", receivedAtUtc);

      const customerResult = await createOrResolveCustomer(serviceClient, auth.user.tenantId, body?.customer || {}, auth.user.id);
      if (customerResult.error) {
        return json(400, { code: "VALIDATION_ERROR", message: customerResult.error });
      }

      const caseInsert = {
        tenant_id: auth.user.tenantId,
        case_no: caseNo,
        customer_id: customerResult.customerId,
        received_at_utc: receivedAtUtc,
        received_business_date_local: businessDate,
        intake_mode: ensureNonEmptyString(body?.intake_mode) ? body.intake_mode : "walk_in",
        total_units_received: 1,
        priority: ensureNonEmptyString(body?.priority) ? body.priority : "normal",
        header_status: "Received",
        notes: body?.notes || null,
        created_at: nowIso,
        updated_at: nowIso,
        created_by: auth.user.id,
        updated_by: auth.user.id,
        is_active: true
      };

      const { data: newCase, error: caseErr } = await serviceClient
        .from("cases")
        .insert(caseInsert)
        .select("id, case_no, customer_id, header_status, created_at")
        .single();

      if (caseErr) {
        const isDuplicate = String(caseErr.message || "").toLowerCase().includes("duplicate") || String(caseErr.code || "") === "23505";
        if (isDuplicate) {
          return json(409, { code: "CASE_NO_ALREADY_EXISTS", message: "case_no already exists for tenant" });
        }
        return json(500, { code: "CASE_CREATE_FAILED", message: "Unable to create case" });
      }

      const { data: newItem, error: itemErr } = await serviceClient
        .from("case_items")
        .insert({
          tenant_id: auth.user.tenantId,
          case_id: newCase.id,
          line_no: 1,
          item_category: item.item_category.trim(),
          brand: item.brand || null,
          model: item.model || null,
          serial_no: item.serial_no || null,
          color: item.color || null,
          condition_in: item.condition_in || null,
          reported_issue: item.reported_issue.trim(),
          diagnosis_notes: item.diagnosis_notes || null,
          repairability: item.repairability || null,
          item_status: "Received",
          promised_date_local: item.promised_date_local || null,
          created_at: nowIso,
          updated_at: nowIso,
          created_by: auth.user.id,
          updated_by: auth.user.id,
          is_active: true
        })
        .select("id, line_no, item_status")
        .single();

      if (itemErr) {
        await serviceClient.from("cases").delete().eq("id", newCase.id);
        return json(500, { code: "CASE_ITEM_CREATE_FAILED", message: "Case header created but item insert failed and was rolled back" });
      }

      await writeCaseStatusHistory(serviceClient, {
        tenant_id: auth.user.tenantId,
        case_id: newCase.id,
        case_item_id: newItem.id,
        from_status: null,
        to_status: "Received",
        changed_at_utc: nowIso,
        changed_by: auth.user.id,
        note: "Case created"
      });

      return json(201, {
        code: "OK",
        message: "Case created",
        data: {
          case_id: newCase.id,
          case_no: newCase.case_no,
          header_status: newCase.header_status,
          case_item_id: newItem.id,
          case_item_status: newItem.item_status
        }
      });
    }

    if (request.method === "GET" && url.pathname === "/v1/cases") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      const caseNo = normalizeCaseNo(url.searchParams.get("case_no") || "");
      const phone = (url.searchParams.get("phone") || "").trim();
      const { limit, offset } = getPagination(url);

      let query = auth.serviceClient
        .from("cases")
        .select("id, case_no, customer_id, header_status, received_at_utc, created_at, customers(name, phone)")
        .eq("tenant_id", auth.user.tenantId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (caseNo) query = query.eq("case_no", caseNo);
      if (phone) {
        const { data: matchingCustomers, error: customerErr } = await auth.serviceClient
          .from("customers")
          .select("id")
          .eq("tenant_id", auth.user.tenantId)
          .eq("phone", phone)
          .limit(200);

        if (customerErr) {
          return json(500, { code: "CASE_SEARCH_FAILED", message: "Unable to resolve phone filter" });
        }

        const customerIds = (matchingCustomers || []).map((row) => row.id);
        if (customerIds.length === 0) {
          return json(200, {
            code: "OK",
            data: [],
            pagination: { limit, offset }
          });
        }

        query = query.in("customer_id", customerIds);
      }

      const { data, error } = await query;
      if (error) {
        return json(500, { code: "CASE_SEARCH_FAILED", message: "Unable to search cases" });
      }

      return json(200, {
        code: "OK",
        data: data || [],
        pagination: { limit, offset }
      });
    }

    if (request.method === "GET" && /^\/v1\/cases\/[^/]+$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      const caseId = url.pathname.split("/")[3];
      const { data, error } = await auth.serviceClient
        .from("cases")
        .select("id, case_no, customer_id, header_status, intake_mode, total_units_received, priority, notes, received_at_utc, received_business_date_local, customers(name, phone)")
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", caseId)
        .maybeSingle();

      if (error) return json(500, { code: "CASE_FETCH_FAILED", message: "Unable to fetch case" });
      if (!data) return json(404, { code: "NOT_FOUND", message: "Case not found" });

      return json(200, { code: "OK", data });
    }

    if (request.method === "PATCH" && /^\/v1\/cases\/[^/]+$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      const caseId = url.pathname.split("/")[3];
      let body;
      try {
        body = await request.json();
      } catch {
        return json(400, { code: "INVALID_JSON", message: "Request body must be valid JSON" });
      }

      const patch = {};
      if (body?.priority !== undefined) patch.priority = body.priority;
      if (body?.notes !== undefined) patch.notes = body.notes;
      if (body?.followup_due_at_utc !== undefined) patch.followup_due_at_utc = body.followup_due_at_utc;
      if (body?.followup_notes !== undefined) patch.followup_notes = body.followup_notes;
      patch.updated_at = new Date().toISOString();
      patch.updated_by = auth.user.id;

      const { data, error } = await auth.serviceClient
        .from("cases")
        .update(patch)
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", caseId)
        .select("id, case_no, header_status, priority, notes, followup_due_at_utc, followup_notes")
        .maybeSingle();

      if (error) return json(500, { code: "CASE_UPDATE_FAILED", message: "Unable to update case" });
      if (!data) return json(404, { code: "NOT_FOUND", message: "Case not found" });

      return json(200, { code: "OK", message: "Case updated", data });
    }

    if (request.method === "GET" && /^\/v1\/cases\/[^/]+\/items$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      const caseId = url.pathname.split("/")[3];
      const { data, error } = await auth.serviceClient
        .from("case_items")
        .select("id, case_id, line_no, item_category, brand, model, serial_no, reported_issue, diagnosis_notes, item_status, promised_date_local, ready_at_utc, delivered_at_utc")
        .eq("tenant_id", auth.user.tenantId)
        .eq("case_id", caseId)
        .order("line_no", { ascending: true });

      if (error) return json(500, { code: "CASE_ITEMS_FETCH_FAILED", message: "Unable to fetch case items" });
      return json(200, { code: "OK", data: data || [] });
    }

    if (request.method === "GET" && /^\/v1\/cases\/[^/]+\/consumption$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      const caseId = url.pathname.split("/")[3];
      const { limit, offset } = getPagination(url);
      let query = auth.serviceClient
        .from("case_spare_consumption")
        .select("id, case_id, case_item_id, inventory_item_id, qty, uom, unit_cost_paise_snapshot, line_cost_paise, consumed_at_utc, consumed_by, reversal_of_consumption_id, notes, created_at, case_items!inner(id, case_id, line_no, item_status), inventory_items!inner(id, sku, item_name, uom)")
        .eq("tenant_id", auth.user.tenantId)
        .eq("case_id", caseId)
        .order("consumed_at_utc", { ascending: false })
        .range(offset, offset + limit - 1);

      const caseItemId = (url.searchParams.get("case_item_id") || "").trim();
      if (caseItemId) query = query.eq("case_item_id", caseItemId);

      const { data, error } = await query;
      if (error) {
        return json(500, { code: "CASE_CONSUMPTION_FETCH_FAILED", message: "Unable to fetch case consumption" });
      }

      return json(200, {
        code: "OK",
        data: data || [],
        pagination: { limit, offset }
      });
    }

    if (request.method === "POST" && /^\/v1\/cases\/[^/]+\/consumption$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      const caseId = url.pathname.split("/")[3];
      let body;
      try {
        body = await request.json();
      } catch {
        return json(400, { code: "INVALID_JSON", message: "Request body must be valid JSON" });
      }

      const caseItemId = body?.case_item_id;
      const inventoryItemId = body?.inventory_item_id;
      const qty = parseNumericQty(body?.qty, null);

      if (!ensureId(caseItemId) || !ensureId(inventoryItemId)) {
        return json(400, { code: "VALIDATION_ERROR", message: "case_item_id and inventory_item_id are required" });
      }
      if (qty === null || qty <= 0) {
        return json(400, { code: "VALIDATION_ERROR", message: "qty must be a positive number" });
      }

      const svc = auth.serviceClient;
      const { data: caseExists, error: caseErr } = await svc
        .from("cases")
        .select("id")
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", caseId)
        .maybeSingle();
      if (caseErr) return json(500, { code: "CASE_FETCH_FAILED", message: "Unable to validate case" });
      if (!caseExists) return json(404, { code: "NOT_FOUND", message: "Case not found" });

      const unitCostInput = body?.unit_cost_paise_snapshot;
      const parsedUnitCost = unitCostInput === undefined || unitCostInput === null || unitCostInput === ""
        ? null
        : parsePaise(unitCostInput, 0);
      if (unitCostInput !== undefined && parsedUnitCost === null) {
        return json(400, { code: "VALIDATION_ERROR", message: "unit_cost_paise_snapshot must be non-negative paise integer" });
      }

      const lineCostInput = body?.line_cost_paise;
      const parsedLineCost = lineCostInput === undefined || lineCostInput === null || lineCostInput === ""
        ? null
        : parsePaise(lineCostInput, 0);
      if (lineCostInput !== undefined && parsedLineCost === null) {
        return json(400, { code: "VALIDATION_ERROR", message: "line_cost_paise must be non-negative paise integer" });
      }

      const nowIso = new Date().toISOString();
      const insertPayload = {
        tenant_id: auth.user.tenantId,
        case_id: caseId,
        case_item_id: caseItemId,
        inventory_item_id: inventoryItemId,
        qty,
        uom: ensureNonEmptyString(body?.uom) ? body.uom.trim() : null,
        unit_cost_paise_snapshot: parsedUnitCost,
        line_cost_paise: parsedLineCost,
        consumed_at_utc: toIsoStringSafe(body?.consumed_at_utc) || nowIso,
        consumed_by: auth.user.id,
        notes: ensureNonEmptyString(body?.notes) ? body.notes.trim() : null,
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
        created_by: auth.user.id,
        updated_by: auth.user.id
      };

      const { data: created, error: createErr } = await svc
        .from("case_spare_consumption")
        .insert(insertPayload)
        .select("id, case_id, case_item_id, inventory_item_id, qty, uom, unit_cost_paise_snapshot, line_cost_paise, consumed_at_utc, notes, created_at")
        .single();

      if (createErr) {
        const mapped = mapDbRuleError(createErr, "CASE_CONSUMPTION_RULE_VIOLATION", "Consumption failed due to inventory/case rule violation");
        if (mapped) return json(mapped.status, { code: mapped.code, message: mapped.message });
        return json(500, { code: "CASE_CONSUMPTION_CREATE_FAILED", message: "Unable to create case consumption" });
      }

      const { data: itemStock } = await svc
        .from("inventory_items")
        .select("id, sku, item_name, current_stock_qty, reorder_level_qty")
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", inventoryItemId)
        .maybeSingle();

      return json(201, {
        code: "OK",
        message: "Case consumption recorded and stock deducted",
        data: {
          consumption: created,
          inventory_after: itemStock || null
        }
      });
    }

    if (request.method === "POST" && /^\/v1\/cases\/[^/]+\/items\/[^/]+\/status$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      const parts = url.pathname.split("/");
      const caseId = parts[3];
      const itemId = parts[5];
      let body;
      try {
        body = await request.json();
      } catch {
        return json(400, { code: "INVALID_JSON", message: "Request body must be valid JSON" });
      }

      const toStatus = body?.to_status;
      if (!ensureNonEmptyString(toStatus)) {
        return json(400, { code: "VALIDATION_ERROR", message: "to_status is required" });
      }

      const serviceClient = auth.serviceClient;
      const { data: item, error: itemErr } = await serviceClient
        .from("case_items")
        .select("id, case_id, item_status, tenant_id")
        .eq("tenant_id", auth.user.tenantId)
        .eq("case_id", caseId)
        .eq("id", itemId)
        .maybeSingle();

      if (itemErr) return json(500, { code: "CASE_ITEM_FETCH_FAILED", message: "Unable to fetch case item" });
      if (!item) return json(404, { code: "NOT_FOUND", message: "Case item not found" });

      const fromStatus = item.item_status;
      const allowed = ITEM_STATUS_TRANSITIONS[fromStatus] || [];
      if (!allowed.includes(toStatus)) {
        return json(409, {
          code: "INVALID_STATUS_TRANSITION",
          message: `Invalid transition from ${fromStatus} to ${toStatus}`
        });
      }

      const nowIso = new Date().toISOString();
      const patch = {
        item_status: toStatus,
        updated_at: nowIso,
        updated_by: auth.user.id
      };
      if (toStatus === "Ready") patch.ready_at_utc = nowIso;
      if (toStatus === "Delivered") patch.delivered_at_utc = nowIso;

      const { error: updateErr } = await serviceClient
        .from("case_items")
        .update(patch)
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", itemId)
        .eq("case_id", caseId);

      if (updateErr) {
        return json(500, { code: "CASE_ITEM_STATUS_UPDATE_FAILED", message: "Unable to update item status" });
      }

      const histErr = await writeCaseStatusHistory(serviceClient, {
        tenant_id: auth.user.tenantId,
        case_id: caseId,
        case_item_id: itemId,
        from_status: fromStatus,
        to_status: toStatus,
        changed_at_utc: nowIso,
        changed_by: auth.user.id,
        note: body?.note || null
      });

      if (histErr) {
        return json(500, { code: "CASE_STATUS_HISTORY_FAILED", message: "Status changed but history insert failed" });
      }

      const { data: statuses } = await serviceClient
        .from("case_items")
        .select("item_status")
        .eq("tenant_id", auth.user.tenantId)
        .eq("case_id", caseId)
        .eq("is_active", true);

      const headerStatus = deriveHeaderStatus((statuses || []).map((row) => row.item_status));
      await serviceClient
        .from("cases")
        .update({ header_status: headerStatus, updated_at: nowIso, updated_by: auth.user.id })
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", caseId);

      return json(200, {
        code: "OK",
        message: "Case item status updated",
        data: { case_id: caseId, case_item_id: itemId, from_status: fromStatus, to_status: toStatus, header_status: headerStatus }
      });
    }

    if (request.method === "GET" && /^\/v1\/cases\/[^/]+\/estimates$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      const caseId = url.pathname.split("/")[3];
      const { limit, offset } = getPagination(url);
      const { data, error } = await auth.serviceClient
        .from("item_estimates")
        .select("id, case_item_id, estimate_version_no, labor_amount_paise, spare_amount_paise, other_amount_paise, discount_amount_paise, base_bill_amount_paise, gst_rate_bps, gst_amount_paise, invoice_total_paise, estimate_status, decision, invoice_state, is_financial_locked, finalized_at_utc, finalized_by, override_count, created_at, updated_at, case_items!inner(id, case_id, line_no, item_status)")
        .eq("tenant_id", auth.user.tenantId)
        .eq("case_items.case_id", caseId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) return json(500, { code: "ESTIMATE_FETCH_FAILED", message: "Unable to fetch case estimates" });
      return json(200, { code: "OK", data: data || [], pagination: { limit, offset } });
    }

    if (request.method === "GET" && url.pathname === "/v1/inventory/items") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      const { limit, offset } = getPagination(url);
      const q = (url.searchParams.get("q") || "").trim();
      const lowStockOnly = String(url.searchParams.get("low_stock_only") || "false").toLowerCase() === "true";

      let query = auth.serviceClient
        .from("inventory_items")
        .select("id, sku, item_name, uom, current_stock_qty, reorder_level_qty, default_unit_cost_paise, valuation_method, is_active, created_at, updated_at")
        .eq("tenant_id", auth.user.tenantId)
        .order("updated_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (q) {
        query = query.or(`item_name.ilike.%${q}%,sku.ilike.%${q}%`);
      }

      if (lowStockOnly) {
        query = query.filter("current_stock_qty", "lte", "reorder_level_qty");
      }

      const { data, error } = await query;
      if (error) {
        return json(500, { code: "INVENTORY_FETCH_FAILED", message: "Unable to fetch inventory items" });
      }

      return json(200, { code: "OK", data: data || [], pagination: { limit, offset } });
    }

    if (request.method === "POST" && url.pathname === "/v1/inventory/items") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json(400, { code: "INVALID_JSON", message: "Request body must be valid JSON" });
      }

      if (!ensureNonEmptyString(body?.item_name)) {
        return json(400, { code: "VALIDATION_ERROR", message: "item_name is required" });
      }

      const currentStockQty = parseNumericQty(body?.current_stock_qty, 0);
      const reorderLevelQty = parseNumericQty(body?.reorder_level_qty, 0);
      if (currentStockQty === null || currentStockQty < 0 || reorderLevelQty === null || reorderLevelQty < 0) {
        return json(400, { code: "VALIDATION_ERROR", message: "current_stock_qty and reorder_level_qty must be non-negative numbers" });
      }

      const defaultUnitCostPaise = parsePaise(body?.default_unit_cost_paise, 0);
      if (defaultUnitCostPaise === null) {
        return json(400, { code: "VALIDATION_ERROR", message: "default_unit_cost_paise must be non-negative paise integer" });
      }

      const valuationMethod = ensureNonEmptyString(body?.valuation_method) ? body.valuation_method.trim() : "WEIGHTED_AVERAGE";
      if (!["FIFO", "WEIGHTED_AVERAGE"].includes(valuationMethod)) {
        return json(400, { code: "VALIDATION_ERROR", message: "valuation_method must be FIFO or WEIGHTED_AVERAGE" });
      }

      const nowIso = new Date().toISOString();
      const payload = {
        tenant_id: auth.user.tenantId,
        sku: ensureNonEmptyString(body?.sku) ? body.sku.trim() : null,
        item_name: body.item_name.trim(),
        uom: ensureNonEmptyString(body?.uom) ? body.uom.trim() : "pcs",
        current_stock_qty: currentStockQty,
        reorder_level_qty: reorderLevelQty,
        default_unit_cost_paise: defaultUnitCostPaise,
        valuation_method: valuationMethod,
        is_active: body?.is_active === undefined ? true : Boolean(body.is_active),
        created_at: nowIso,
        updated_at: nowIso,
        created_by: auth.user.id,
        updated_by: auth.user.id
      };

      const { data: created, error: createErr } = await auth.serviceClient
        .from("inventory_items")
        .insert(payload)
        .select("id, sku, item_name, uom, current_stock_qty, reorder_level_qty, default_unit_cost_paise, valuation_method, is_active, created_at")
        .single();

      if (createErr) {
        const duplicate = String(createErr.code || "") === "23505";
        if (duplicate) {
          return json(409, { code: "INVENTORY_SKU_EXISTS", message: "sku already exists for tenant" });
        }
        return json(500, { code: "INVENTORY_CREATE_FAILED", message: "Unable to create inventory item" });
      }

      return json(201, { code: "OK", message: "Inventory item created", data: created });
    }

    if (request.method === "PATCH" && /^\/v1\/inventory\/items\/[^/]+$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      const inventoryItemId = url.pathname.split("/")[4];
      let body;
      try {
        body = await request.json();
      } catch {
        return json(400, { code: "INVALID_JSON", message: "Request body must be valid JSON" });
      }

      const patch = {
        updated_at: new Date().toISOString(),
        updated_by: auth.user.id
      };

      if (body?.sku !== undefined) patch.sku = ensureNonEmptyString(body.sku) ? body.sku.trim() : null;
      if (body?.item_name !== undefined) {
        if (!ensureNonEmptyString(body.item_name)) {
          return json(400, { code: "VALIDATION_ERROR", message: "item_name cannot be empty" });
        }
        patch.item_name = body.item_name.trim();
      }
      if (body?.uom !== undefined) patch.uom = ensureNonEmptyString(body.uom) ? body.uom.trim() : "pcs";

      if (body?.reorder_level_qty !== undefined) {
        const reorderQty = parseNumericQty(body.reorder_level_qty, null);
        if (reorderQty === null || reorderQty < 0) {
          return json(400, { code: "VALIDATION_ERROR", message: "reorder_level_qty must be non-negative" });
        }
        patch.reorder_level_qty = reorderQty;
      }

      if (body?.default_unit_cost_paise !== undefined) {
        const defaultCost = parsePaise(body.default_unit_cost_paise, 0);
        if (defaultCost === null) {
          return json(400, { code: "VALIDATION_ERROR", message: "default_unit_cost_paise must be non-negative paise integer" });
        }
        patch.default_unit_cost_paise = defaultCost;
      }

      if (body?.valuation_method !== undefined) {
        const valuationMethod = ensureNonEmptyString(body.valuation_method) ? body.valuation_method.trim() : "";
        if (!["FIFO", "WEIGHTED_AVERAGE"].includes(valuationMethod)) {
          return json(400, { code: "VALIDATION_ERROR", message: "valuation_method must be FIFO or WEIGHTED_AVERAGE" });
        }
        patch.valuation_method = valuationMethod;
      }

      if (body?.is_active !== undefined) patch.is_active = Boolean(body.is_active);

      const { data: updated, error: updateErr } = await auth.serviceClient
        .from("inventory_items")
        .update(patch)
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", inventoryItemId)
        .select("id, sku, item_name, uom, current_stock_qty, reorder_level_qty, default_unit_cost_paise, valuation_method, is_active, updated_at")
        .maybeSingle();

      if (updateErr) {
        const duplicate = String(updateErr.code || "") === "23505";
        if (duplicate) {
          return json(409, { code: "INVENTORY_SKU_EXISTS", message: "sku already exists for tenant" });
        }
        return json(500, { code: "INVENTORY_UPDATE_FAILED", message: "Unable to update inventory item" });
      }
      if (!updated) return json(404, { code: "NOT_FOUND", message: "Inventory item not found" });

      return json(200, { code: "OK", message: "Inventory item updated", data: updated });
    }

    if (request.method === "GET" && url.pathname === "/v1/inventory/ledger") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      const { limit, offset } = getPagination(url);
      const inventoryItemId = (url.searchParams.get("inventory_item_id") || "").trim();
      const refEntity = (url.searchParams.get("ref_entity") || "").trim();
      const refId = (url.searchParams.get("ref_id") || "").trim();

      let query = auth.serviceClient
        .from("stock_ledger")
        .select("id, inventory_item_id, txn_type, ref_entity, ref_id, qty, unit_cost_paise, total_cost_paise, balance_after_qty, txn_at_utc, created_by, inventory_items(id, sku, item_name, uom)")
        .eq("tenant_id", auth.user.tenantId)
        .order("txn_at_utc", { ascending: false })
        .range(offset, offset + limit - 1);

      if (inventoryItemId) query = query.eq("inventory_item_id", inventoryItemId);
      if (refEntity) query = query.eq("ref_entity", refEntity);
      if (refId) query = query.eq("ref_id", refId);

      const { data, error } = await query;
      if (error) return json(500, { code: "INVENTORY_LEDGER_FETCH_FAILED", message: "Unable to fetch stock ledger" });

      return json(200, { code: "OK", data: data || [], pagination: { limit, offset } });
    }

    if (request.method === "GET" && /^\/v1\/estimates\/[^/]+$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      const estimateId = url.pathname.split("/")[3];
      const { data, error } = await auth.serviceClient
        .from("item_estimates")
        .select("id, tenant_id, case_item_id, estimate_version_no, labor_amount_paise, spare_amount_paise, other_amount_paise, discount_amount_paise, base_bill_amount_paise, gst_rate_bps, gst_amount_paise, invoice_total_paise, rounding_mode_snapshot, estimate_status, decision, decision_at_utc, decision_by_name, decision_by_phone, decision_channel, consent_template_version_id, consent_text_snapshot, sent_at_utc, decision_due_at_utc, invoice_state, is_financial_locked, finalized_at_utc, finalized_by, finalized_reason, override_count, last_override_at_utc, last_override_by, last_override_reason, created_at, updated_at")
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", estimateId)
        .maybeSingle();

      if (error) return json(500, { code: "ESTIMATE_FETCH_FAILED", message: "Unable to fetch estimate" });
      if (!data) return json(404, { code: "NOT_FOUND", message: "Estimate not found" });
      return json(200, { code: "OK", data });
    }

    if (request.method === "POST" && url.pathname === "/v1/estimates") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json(400, { code: "INVALID_JSON", message: "Request body must be valid JSON" });
      }

      const caseId = body?.case_id;
      const caseItemId = body?.case_item_id;
      if (!ensureId(caseId) || !ensureId(caseItemId)) {
        return json(400, { code: "VALIDATION_ERROR", message: "case_id and case_item_id are required" });
      }

      const svc = auth.serviceClient;
      const { data: caseItem, error: caseItemErr } = await svc
        .from("case_items")
        .select("id, case_id, line_no, item_status")
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", caseItemId)
        .eq("case_id", caseId)
        .eq("is_active", true)
        .maybeSingle();

      if (caseItemErr) return json(500, { code: "CASE_ITEM_FETCH_FAILED", message: "Unable to load case item" });
      if (!caseItem) return json(404, { code: "NOT_FOUND", message: "Case item not found for case" });

      const defaultGstRate = toSafeInt(await getSettingValue(svc, auth.user.tenantId, "gst_rate_bps", 1800), 1800);
      const roundingModeSetting = await getSettingValue(svc, auth.user.tenantId, "gst_rounding_mode", "invoice_level");
      const roundingMode = ensureNonEmptyString(roundingModeSetting)
        ? String(roundingModeSetting)
        : "invoice_level";

      const gstRequired = body?.gst_required === undefined ? true : Boolean(body.gst_required);
      const amountResult = computeInvoiceAmounts({
        labor_amount_paise: body?.labor_amount_paise,
        spare_amount_paise: body?.spare_amount_paise,
        other_amount_paise: body?.other_amount_paise,
        discount_amount_paise: body?.discount_amount_paise,
        gst_rate_bps: gstRequired ? (body?.gst_rate_bps ?? defaultGstRate) : 0
      });
      if (amountResult.error) {
        return json(400, { code: "VALIDATION_ERROR", message: amountResult.error });
      }

      const { data: latestVersionRows, error: versionErr } = await svc
        .from("item_estimates")
        .select("estimate_version_no")
        .eq("tenant_id", auth.user.tenantId)
        .eq("case_item_id", caseItemId)
        .order("estimate_version_no", { ascending: false })
        .limit(1);

      if (versionErr) {
        return json(500, { code: "ESTIMATE_VERSION_FAILED", message: "Unable to resolve estimate version" });
      }

      const nextVersion = ((latestVersionRows && latestVersionRows[0]?.estimate_version_no) || 0) + 1;
      const nowIso = new Date().toISOString();
      const estimateStatus = body?.send_for_decision ? "Sent" : "Draft";

      const insertPayload = {
        tenant_id: auth.user.tenantId,
        case_item_id: caseItemId,
        estimate_version_no: nextVersion,
        ...amountResult.data,
        rounding_mode_snapshot: roundingMode,
        estimate_status: estimateStatus,
        decision: "Pending",
        sent_at_utc: body?.send_for_decision ? nowIso : null,
        decision_due_at_utc: toIsoStringSafe(body?.decision_due_at_utc),
        created_at: nowIso,
        updated_at: nowIso,
        created_by: auth.user.id,
        updated_by: auth.user.id,
        is_active: true
      };

      const { data: created, error: createErr } = await svc
        .from("item_estimates")
        .insert(insertPayload)
        .select("id, case_item_id, estimate_version_no, base_bill_amount_paise, gst_rate_bps, gst_amount_paise, invoice_total_paise, estimate_status, decision, invoice_state, is_financial_locked")
        .single();

      if (createErr) {
        return json(500, { code: "ESTIMATE_CREATE_FAILED", message: "Unable to create estimate" });
      }

      return json(201, { code: "OK", message: "Estimate created", data: created });
    }

    if (request.method === "POST" && /^\/v1\/estimates\/[^/]+\/decision$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      const estimateId = url.pathname.split("/")[3];
      let body;
      try {
        body = await request.json();
      } catch {
        return json(400, { code: "INVALID_JSON", message: "Request body must be valid JSON" });
      }

      const decision = normalizeEstimateDecision(body?.decision);
      if (!decision) {
        return json(400, { code: "VALIDATION_ERROR", message: "decision must be Approved, Rejected, or Pending" });
      }

      const svc = auth.serviceClient;
      const { data: estimate, error: estimateErr } = await svc
        .from("item_estimates")
        .select("id, case_item_id, estimate_version_no, decision, estimate_status, is_financial_locked")
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", estimateId)
        .maybeSingle();

      if (estimateErr) return json(500, { code: "ESTIMATE_FETCH_FAILED", message: "Unable to load estimate" });
      if (!estimate) return json(404, { code: "NOT_FOUND", message: "Estimate not found" });
      if (estimate.is_financial_locked) {
        return json(409, { code: "FINANCIAL_LOCKED", message: "Estimate is financially locked" });
      }

      const nowIso = new Date().toISOString();
      const estimateStatus = estimateStatusFromDecision(decision);
      const { data: updatedEstimate, error: updateErr } = await svc
        .from("item_estimates")
        .update({
          decision,
          estimate_status: estimateStatus,
          decision_at_utc: nowIso,
          decision_by_name: ensureNonEmptyString(body?.decision_by_name) ? body.decision_by_name.trim() : null,
          decision_by_phone: ensureNonEmptyString(body?.decision_by_phone) ? body.decision_by_phone.trim() : null,
          decision_channel: ensureNonEmptyString(body?.decision_channel) ? body.decision_channel.trim() : null,
          consent_template_version_id: ensureNonEmptyString(body?.consent_template_version_id) ? body.consent_template_version_id.trim() : null,
          consent_text_snapshot: ensureNonEmptyString(body?.consent_text_snapshot) ? body.consent_text_snapshot.trim() : null,
          updated_at: nowIso,
          updated_by: auth.user.id
        })
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", estimate.id)
        .select("id, case_item_id, estimate_version_no, estimate_status, decision, decision_at_utc")
        .single();

      if (updateErr) {
        return json(500, { code: "ESTIMATE_DECISION_FAILED", message: "Unable to update estimate decision" });
      }

      const toItemStatus = itemStatusFromDecision(decision);
      if (toItemStatus) {
        const { data: item, error: itemErr } = await svc
          .from("case_items")
          .select("id, case_id, item_status")
          .eq("tenant_id", auth.user.tenantId)
          .eq("id", estimate.case_item_id)
          .maybeSingle();

        if (itemErr) {
          return json(500, { code: "CASE_ITEM_FETCH_FAILED", message: "Decision saved but case item fetch failed" });
        }

        if (item) {
          const allowed = ITEM_STATUS_TRANSITIONS[item.item_status] || [];
          if (allowed.includes(toItemStatus)) {
            await svc
              .from("case_items")
              .update({
                item_status: toItemStatus,
                updated_at: nowIso,
                updated_by: auth.user.id
              })
              .eq("tenant_id", auth.user.tenantId)
              .eq("id", item.id);

            await writeCaseStatusHistory(svc, {
              tenant_id: auth.user.tenantId,
              case_id: item.case_id,
              case_item_id: item.id,
              from_status: item.item_status,
              to_status: toItemStatus,
              changed_at_utc: nowIso,
              changed_by: auth.user.id,
              note: `Estimate decision ${decision}`
            });

            const { data: statuses } = await svc
              .from("case_items")
              .select("item_status")
              .eq("tenant_id", auth.user.tenantId)
              .eq("case_id", item.case_id)
              .eq("is_active", true);

            const headerStatus = deriveHeaderStatus((statuses || []).map((row) => row.item_status));
            await svc
              .from("cases")
              .update({ header_status: headerStatus, updated_at: nowIso, updated_by: auth.user.id })
              .eq("tenant_id", auth.user.tenantId)
              .eq("id", item.case_id);
          }
        }
      }

      return json(200, { code: "OK", message: "Estimate decision updated", data: updatedEstimate });
    }

    if (request.method === "POST" && /^\/v1\/billing\/estimates\/[^/]+\/finalize$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      const estimateId = url.pathname.split("/")[4];
      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const svc = auth.serviceClient;
      const { data: estimate, error: estimateErr } = await svc
        .from("item_estimates")
        .select("id, case_item_id, estimate_version_no, decision, estimate_status, invoice_total_paise, is_financial_locked, invoice_state")
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", estimateId)
        .maybeSingle();

      if (estimateErr) return json(500, { code: "ESTIMATE_FETCH_FAILED", message: "Unable to load estimate" });
      if (!estimate) return json(404, { code: "NOT_FOUND", message: "Estimate not found" });
      if (estimate.is_financial_locked || estimate.invoice_state === "FINALIZED") {
        return json(409, { code: "ALREADY_FINALIZED", message: "Estimate is already finalized" });
      }
      if (estimate.decision !== "Approved") {
        return json(409, { code: "APPROVAL_REQUIRED", message: "Only approved estimate can be finalized" });
      }

      const nowIso = new Date().toISOString();
      const finalizeReason = ensureNonEmptyString(body?.reason) ? body.reason.trim() : null;
      const { data: finalized, error: finalizeErr } = await svc
        .from("item_estimates")
        .update({
          invoice_state: "FINALIZED",
          is_financial_locked: true,
          finalized_at_utc: nowIso,
          finalized_by: auth.user.id,
          finalized_reason: finalizeReason,
          updated_at: nowIso,
          updated_by: auth.user.id
        })
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", estimate.id)
        .select("id, case_item_id, estimate_version_no, invoice_total_paise, invoice_state, is_financial_locked, finalized_at_utc, finalized_by")
        .single();

      if (finalizeErr) return json(500, { code: "FINALIZE_FAILED", message: "Unable to finalize estimate" });

      await insertAuditLog(svc, {
        tenant_id: auth.user.tenantId,
        actor_user_id: auth.user.id,
        action: "INVOICE_FINALIZED",
        entity_type: "item_estimates",
        entity_id: estimate.id,
        reason: finalizeReason,
        payload_json: {
          decision: estimate.decision,
          invoice_total_paise: estimate.invoice_total_paise,
          finalized_at_utc: nowIso
        }
      });

      return json(200, { code: "OK", message: "Estimate finalized and financially locked", data: finalized });
    }

    if (request.method === "PATCH" && /^\/v1\/billing\/estimates\/[^/]+$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      const estimateId = url.pathname.split("/")[4];
      let body;
      try {
        body = await request.json();
      } catch {
        return json(400, { code: "INVALID_JSON", message: "Request body must be valid JSON" });
      }

      const svc = auth.serviceClient;
      const { data: estimate, error: estimateErr } = await svc
        .from("item_estimates")
        .select("id, labor_amount_paise, spare_amount_paise, other_amount_paise, discount_amount_paise, gst_rate_bps, base_bill_amount_paise, gst_amount_paise, invoice_total_paise, estimate_status, decision, invoice_state, is_financial_locked, override_count")
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", estimateId)
        .maybeSingle();

      if (estimateErr) return json(500, { code: "ESTIMATE_FETCH_FAILED", message: "Unable to load estimate" });
      if (!estimate) return json(404, { code: "NOT_FOUND", message: "Estimate not found" });

      const isLocked = Boolean(estimate.is_financial_locked || estimate.invoice_state === "FINALIZED");
      const overrideReason = ensureNonEmptyString(body?.override_reason) ? body.override_reason.trim() : null;
      if (isLocked && !overrideReason) {
        return json(409, { code: "FINANCIAL_LOCKED", message: "Finalized invoice can be edited only with override_reason" });
      }

      const gstRequired = body?.gst_required === undefined ? true : Boolean(body.gst_required);
      const amountResult = computeInvoiceAmounts({
        labor_amount_paise: body?.labor_amount_paise ?? estimate.labor_amount_paise,
        spare_amount_paise: body?.spare_amount_paise ?? estimate.spare_amount_paise,
        other_amount_paise: body?.other_amount_paise ?? estimate.other_amount_paise,
        discount_amount_paise: body?.discount_amount_paise ?? estimate.discount_amount_paise,
        gst_rate_bps: gstRequired ? (body?.gst_rate_bps ?? estimate.gst_rate_bps) : 0
      });
      if (amountResult.error) {
        return json(400, { code: "VALIDATION_ERROR", message: amountResult.error });
      }

      const nowIso = new Date().toISOString();
      const patch = {
        ...amountResult.data,
        updated_at: nowIso,
        updated_by: auth.user.id
      };

      if (isLocked) {
        patch.last_override_at_utc = nowIso;
        patch.last_override_by = auth.user.id;
        patch.last_override_reason = overrideReason;
        patch.override_count = (estimate.override_count || 0) + 1;
      }

      const { data: updated, error: updateErr } = await svc
        .from("item_estimates")
        .update(patch)
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", estimate.id)
        .select("id, labor_amount_paise, spare_amount_paise, other_amount_paise, discount_amount_paise, base_bill_amount_paise, gst_rate_bps, gst_amount_paise, invoice_total_paise, invoice_state, is_financial_locked, override_count, last_override_at_utc, last_override_by, last_override_reason, updated_at")
        .single();

      if (updateErr) return json(500, { code: "ESTIMATE_UPDATE_FAILED", message: "Unable to update estimate billing values" });

      if (isLocked) {
        await insertAuditLog(svc, {
          tenant_id: auth.user.tenantId,
          actor_user_id: auth.user.id,
          action: "FINANCIAL_OVERRIDE",
          entity_type: "item_estimates",
          entity_id: estimate.id,
          reason: overrideReason,
          payload_json: {
            before: {
              labor_amount_paise: estimate.labor_amount_paise,
              spare_amount_paise: estimate.spare_amount_paise,
              other_amount_paise: estimate.other_amount_paise,
              discount_amount_paise: estimate.discount_amount_paise,
              base_bill_amount_paise: estimate.base_bill_amount_paise,
              gst_rate_bps: estimate.gst_rate_bps,
              gst_amount_paise: estimate.gst_amount_paise,
              invoice_total_paise: estimate.invoice_total_paise
            },
            after: {
              labor_amount_paise: updated.labor_amount_paise,
              spare_amount_paise: updated.spare_amount_paise,
              other_amount_paise: updated.other_amount_paise,
              discount_amount_paise: updated.discount_amount_paise,
              base_bill_amount_paise: updated.base_bill_amount_paise,
              gst_rate_bps: updated.gst_rate_bps,
              gst_amount_paise: updated.gst_amount_paise,
              invoice_total_paise: updated.invoice_total_paise
            }
          }
        });
      }

      return json(200, { code: "OK", message: isLocked ? "Finalized estimate overridden" : "Estimate updated", data: updated });
    }

    if (request.method === "POST" && /^\/v1\/billing\/estimates\/[^/]+\/credit-note$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      const estimateId = url.pathname.split("/")[4];
      let body;
      try {
        body = await request.json();
      } catch {
        return json(400, { code: "INVALID_JSON", message: "Request body must be valid JSON" });
      }

      const reason = ensureNonEmptyString(body?.reason) ? body.reason.trim() : "";
      if (!reason) {
        return json(400, { code: "VALIDATION_ERROR", message: "reason is required" });
      }

      const svc = auth.serviceClient;
      const { data: estimate, error: estimateErr } = await svc
        .from("item_estimates")
        .select("id, estimate_version_no, invoice_total_paise, invoice_state, is_financial_locked")
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", estimateId)
        .maybeSingle();

      if (estimateErr) return json(500, { code: "ESTIMATE_FETCH_FAILED", message: "Unable to load estimate" });
      if (!estimate) return json(404, { code: "NOT_FOUND", message: "Estimate not found" });
      if (!estimate.is_financial_locked || estimate.invoice_state !== "FINALIZED") {
        return json(409, { code: "NOT_FINALIZED", message: "Credit note is allowed only for finalized invoice" });
      }

      const requestedAmount = parsePaise(body?.credit_amount_paise, estimate.invoice_total_paise);
      if (requestedAmount === null || requestedAmount <= 0) {
        return json(400, { code: "VALIDATION_ERROR", message: "credit_amount_paise must be a positive paise integer" });
      }
      if (requestedAmount > estimate.invoice_total_paise) {
        return json(400, { code: "VALIDATION_ERROR", message: "credit amount cannot exceed invoice total" });
      }

      const now = new Date();
      const yyyy = now.getUTCFullYear();
      const seq = `${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}`;
      const creditNoteNo = `CN-${yyyy}-${seq}`;

      const { data: creditNote, error: noteErr } = await svc
        .from("financial_credit_notes")
        .insert({
          tenant_id: auth.user.tenantId,
          item_estimate_id: estimate.id,
          credit_note_no: creditNoteNo,
          credit_amount_paise: requestedAmount,
          reason,
          status: "posted",
          metadata_json: body?.metadata_json || null,
          created_by: auth.user.id
        })
        .select("id, credit_note_no, credit_amount_paise, reason, status, created_at")
        .single();

      if (noteErr) {
        return json(500, { code: "CREDIT_NOTE_CREATE_FAILED", message: "Unable to create credit note" });
      }

      if (requestedAmount === estimate.invoice_total_paise) {
        await svc
          .from("item_estimates")
          .update({
            invoice_state: "REVERSED",
            updated_at: now.toISOString(),
            updated_by: auth.user.id
          })
          .eq("tenant_id", auth.user.tenantId)
          .eq("id", estimate.id);
      }

      await insertAuditLog(svc, {
        tenant_id: auth.user.tenantId,
        actor_user_id: auth.user.id,
        action: "CREDIT_NOTE_CREATED",
        entity_type: "item_estimates",
        entity_id: estimate.id,
        reason,
        payload_json: {
          credit_note_no: creditNoteNo,
          credit_amount_paise: requestedAmount,
          invoice_total_paise: estimate.invoice_total_paise
        }
      });

      return json(201, { code: "OK", message: "Credit note posted", data: creditNote });
    }

    if (request.method === "GET" && url.pathname === "/v1/expenses") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      const { limit, offset } = getPagination(url);
      const fromDate = (url.searchParams.get("from_date") || "").trim();
      const toDate = (url.searchParams.get("to_date") || "").trim();
      const category = (url.searchParams.get("category") || "").trim();

      let query = auth.serviceClient
        .from("expenses")
        .select("id, tenant_id, expense_date_local, category, amount_paise, payment_mode, note, receipt_ref, is_active, created_at, created_by")
        .eq("tenant_id", auth.user.tenantId)
        .eq("is_active", true)
        .order("expense_date_local", { ascending: false })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (isValidDateLocal(fromDate)) query = query.gte("expense_date_local", fromDate);
      if (isValidDateLocal(toDate)) query = query.lte("expense_date_local", toDate);
      if (category) query = query.eq("category", category);

      const { data, error } = await query;
      if (error) return json(500, { code: "EXPENSES_FETCH_FAILED", message: "Unable to fetch expenses" });

      return json(200, { code: "OK", data: data || [], pagination: { limit, offset } });
    }

    if (request.method === "POST" && url.pathname === "/v1/expenses") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json(400, { code: "INVALID_JSON", message: "Request body must be valid JSON" });
      }

      const category = ensureNonEmptyString(body?.category) ? body.category.trim() : "";
      const amountPaise = parsePaise(body?.amount_paise, -1);
      if (!category) return json(400, { code: "VALIDATION_ERROR", message: "category is required" });
      if (!Number.isInteger(amountPaise) || amountPaise < 0) {
        return json(400, { code: "VALIDATION_ERROR", message: "amount_paise must be a non-negative paise integer" });
      }

      const timezone = env.DEFAULT_TIMEZONE || "Asia/Kolkata";
      const expenseDateLocal = isValidDateLocal(body?.expense_date_local)
        ? String(body.expense_date_local).trim()
        : getBusinessDateInTimezone(timezone);

      const nowIso = new Date().toISOString();
      const payload = {
        tenant_id: auth.user.tenantId,
        expense_date_local: expenseDateLocal,
        category,
        amount_paise: amountPaise,
        payment_mode: ensureNonEmptyString(body?.payment_mode) ? body.payment_mode.trim() : null,
        note: ensureNonEmptyString(body?.note) ? body.note.trim() : null,
        receipt_ref: ensureNonEmptyString(body?.receipt_ref) ? body.receipt_ref.trim() : null,
        is_active: body?.is_active === undefined ? true : Boolean(body.is_active),
        created_at: nowIso,
        updated_at: nowIso,
        created_by: auth.user.id,
        updated_by: auth.user.id
      };

      const { data, error } = await auth.serviceClient
        .from("expenses")
        .insert(payload)
        .select("id, expense_date_local, category, amount_paise, payment_mode, note, receipt_ref, is_active, created_at")
        .single();

      if (error) {
        const mapped = mapDbRuleError(error, "EXPENSE_CREATE_FAILED", "Expense payload violates database rules");
        if (mapped) return json(mapped.status, { code: mapped.code, message: mapped.message });
        return json(500, { code: "EXPENSE_CREATE_FAILED", message: "Unable to create expense" });
      }

      return json(201, { code: "OK", message: "Expense created", data });
    }

    if (request.method === "GET" && url.pathname === "/v1/recurring-bills") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      const { limit, offset } = getPagination(url);
      const businessDate = getBusinessDateInTimezone(env.DEFAULT_TIMEZONE || "Asia/Kolkata");
      const reminderFilter = (url.searchParams.get("reminder_state") || "").trim();

      const { data, error } = await auth.serviceClient
        .from("recurring_bills")
        .select("id, bill_name, category, amount_paise, due_date, frequency_days, reminder_offsets_json, last_paid_at_utc, last_paid_amount_paise, last_payment_note, is_active, updated_at")
        .eq("tenant_id", auth.user.tenantId)
        .eq("is_active", true)
        .order("due_date", { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) return json(500, { code: "RECURRING_BILLS_FETCH_FAILED", message: "Unable to fetch recurring bills" });

      const enriched = (data || []).map((row) => ({
        ...row,
        reminder_state: getBillReminderState(row.due_date, businessDate)
      }));

      const filtered = reminderFilter
        ? enriched.filter((row) => row.reminder_state === reminderFilter)
        : enriched;

      return json(200, {
        code: "OK",
        data: filtered,
        meta: { business_date_local: businessDate },
        pagination: { limit, offset }
      });
    }

    if (request.method === "POST" && url.pathname === "/v1/recurring-bills") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json(400, { code: "INVALID_JSON", message: "Request body must be valid JSON" });
      }

      const billName = ensureNonEmptyString(body?.bill_name) ? body.bill_name.trim() : "";
      const amountPaise = parsePaise(body?.amount_paise, -1);
      const dueDate = ensureNonEmptyString(body?.due_date) ? body.due_date.trim() : "";
      const frequencyDays = toSafeInt(body?.frequency_days, 30);
      if (!billName) return json(400, { code: "VALIDATION_ERROR", message: "bill_name is required" });
      if (!Number.isInteger(amountPaise) || amountPaise < 0) {
        return json(400, { code: "VALIDATION_ERROR", message: "amount_paise must be a non-negative paise integer" });
      }
      if (!isValidDateLocal(dueDate)) return json(400, { code: "VALIDATION_ERROR", message: "due_date must be YYYY-MM-DD" });
      if (!Number.isInteger(frequencyDays) || frequencyDays < 1) {
        return json(400, { code: "VALIDATION_ERROR", message: "frequency_days must be a positive integer" });
      }

      let reminderOffsets = [7, 3, 0];
      if (Array.isArray(body?.reminder_offsets)) {
        const parsed = body.reminder_offsets
          .map((x) => toSafeInt(x, -1))
          .filter((x) => Number.isInteger(x) && x >= 0);
        if (parsed.length > 0) reminderOffsets = Array.from(new Set(parsed)).sort((a, b) => b - a);
      }

      const nowIso = new Date().toISOString();
      const payload = {
        tenant_id: auth.user.tenantId,
        bill_name: billName,
        category: ensureNonEmptyString(body?.category) ? body.category.trim() : null,
        amount_paise: amountPaise,
        due_date: dueDate,
        frequency_days: frequencyDays,
        reminder_offsets_json: reminderOffsets,
        is_active: body?.is_active === undefined ? true : Boolean(body.is_active),
        created_at: nowIso,
        updated_at: nowIso,
        created_by: auth.user.id,
        updated_by: auth.user.id
      };

      const { data, error } = await auth.serviceClient
        .from("recurring_bills")
        .insert(payload)
        .select("id, bill_name, category, amount_paise, due_date, frequency_days, reminder_offsets_json, is_active, created_at")
        .single();

      if (error) {
        const mapped = mapDbRuleError(error, "RECURRING_BILL_CREATE_FAILED", "Recurring bill payload violates database rules");
        if (mapped) return json(mapped.status, { code: mapped.code, message: mapped.message });
        return json(500, { code: "RECURRING_BILL_CREATE_FAILED", message: "Unable to create recurring bill" });
      }

      return json(201, { code: "OK", message: "Recurring bill created", data });
    }

    if (request.method === "PATCH" && /^\/v1\/recurring-bills\/[^/]+$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      const billId = url.pathname.split("/")[3];
      let body;
      try {
        body = await request.json();
      } catch {
        return json(400, { code: "INVALID_JSON", message: "Request body must be valid JSON" });
      }

      const patch = {
        updated_at: new Date().toISOString(),
        updated_by: auth.user.id
      };

      if (body?.bill_name !== undefined) {
        if (!ensureNonEmptyString(body.bill_name)) {
          return json(400, { code: "VALIDATION_ERROR", message: "bill_name cannot be empty" });
        }
        patch.bill_name = body.bill_name.trim();
      }
      if (body?.category !== undefined) patch.category = ensureNonEmptyString(body.category) ? body.category.trim() : null;
      if (body?.amount_paise !== undefined) {
        const amount = parsePaise(body.amount_paise, -1);
        if (!Number.isInteger(amount) || amount < 0) {
          return json(400, { code: "VALIDATION_ERROR", message: "amount_paise must be non-negative paise integer" });
        }
        patch.amount_paise = amount;
      }
      if (body?.due_date !== undefined) {
        if (!isValidDateLocal(body.due_date)) {
          return json(400, { code: "VALIDATION_ERROR", message: "due_date must be YYYY-MM-DD" });
        }
        patch.due_date = body.due_date.trim();
      }
      if (body?.frequency_days !== undefined) {
        const freq = toSafeInt(body.frequency_days, 0);
        if (!Number.isInteger(freq) || freq < 1) {
          return json(400, { code: "VALIDATION_ERROR", message: "frequency_days must be a positive integer" });
        }
        patch.frequency_days = freq;
      }
      if (body?.reminder_offsets !== undefined) {
        if (!Array.isArray(body.reminder_offsets)) {
          return json(400, { code: "VALIDATION_ERROR", message: "reminder_offsets must be an array of non-negative integers" });
        }
        const parsed = body.reminder_offsets
          .map((x) => toSafeInt(x, -1))
          .filter((x) => Number.isInteger(x) && x >= 0);
        patch.reminder_offsets_json = Array.from(new Set(parsed)).sort((a, b) => b - a);
      }
      if (body?.is_active !== undefined) patch.is_active = Boolean(body.is_active);

      const { data, error } = await auth.serviceClient
        .from("recurring_bills")
        .update(patch)
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", billId)
        .select("id, bill_name, category, amount_paise, due_date, frequency_days, reminder_offsets_json, is_active, updated_at")
        .maybeSingle();

      if (error) {
        const mapped = mapDbRuleError(error, "RECURRING_BILL_UPDATE_FAILED", "Recurring bill update violates database rules");
        if (mapped) return json(mapped.status, { code: mapped.code, message: mapped.message });
        return json(500, { code: "RECURRING_BILL_UPDATE_FAILED", message: "Unable to update recurring bill" });
      }
      if (!data) return json(404, { code: "NOT_FOUND", message: "Recurring bill not found" });

      return json(200, { code: "OK", message: "Recurring bill updated", data });
    }

    if (request.method === "POST" && /^\/v1\/recurring-bills\/[^/]+\/pay$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      const billId = url.pathname.split("/")[3];
      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const { data: bill, error: billErr } = await auth.serviceClient
        .from("recurring_bills")
        .select("id, bill_name, amount_paise, due_date, frequency_days, is_active")
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", billId)
        .maybeSingle();

      if (billErr) return json(500, { code: "RECURRING_BILL_FETCH_FAILED", message: "Unable to load recurring bill" });
      if (!bill || !bill.is_active) return json(404, { code: "NOT_FOUND", message: "Recurring bill not found" });

      const paidAmount = parsePaise(body?.paid_amount_paise, bill.amount_paise);
      if (!Number.isInteger(paidAmount) || paidAmount < 0) {
        return json(400, { code: "VALIDATION_ERROR", message: "paid_amount_paise must be a non-negative paise integer" });
      }

      const paidAtUtc = toIsoStringSafe(body?.paid_at_utc) || new Date().toISOString();
      const nextDueDate = addDaysDateLocal(bill.due_date, Number(bill.frequency_days) || 30);
      if (!nextDueDate) {
        return json(500, { code: "RECURRING_BILL_PAY_FAILED", message: "Unable to compute next due date" });
      }

      const note = ensureNonEmptyString(body?.note) ? body.note.trim() : null;
      const mode = ensureNonEmptyString(body?.payment_mode) ? body.payment_mode.trim() : null;

      const { data: paymentRow, error: payErr } = await auth.serviceClient
        .from("bill_payments")
        .insert({
          tenant_id: auth.user.tenantId,
          recurring_bill_id: bill.id,
          paid_amount_paise: paidAmount,
          paid_at_utc: paidAtUtc,
          payment_mode: mode,
          note,
          created_by: auth.user.id
        })
        .select("id, recurring_bill_id, paid_amount_paise, paid_at_utc, payment_mode, note, created_at")
        .single();

      if (payErr) {
        const mapped = mapDbRuleError(payErr, "RECURRING_BILL_PAY_FAILED", "Bill payment violates database rules");
        if (mapped) return json(mapped.status, { code: mapped.code, message: mapped.message });
        return json(500, { code: "RECURRING_BILL_PAY_FAILED", message: "Unable to save bill payment" });
      }

      const { data: updatedBill, error: updateErr } = await auth.serviceClient
        .from("recurring_bills")
        .update({
          due_date: nextDueDate,
          last_paid_at_utc: paidAtUtc,
          last_paid_amount_paise: paidAmount,
          last_payment_note: note,
          updated_at: new Date().toISOString(),
          updated_by: auth.user.id
        })
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", bill.id)
        .select("id, bill_name, amount_paise, due_date, frequency_days, last_paid_at_utc, last_paid_amount_paise, last_payment_note")
        .single();

      if (updateErr) return json(500, { code: "RECURRING_BILL_PAY_FAILED", message: "Payment logged but recurring bill update failed" });

      return json(200, {
        code: "OK",
        message: "Recurring bill payment logged and next due date advanced",
        data: {
          payment: paymentRow,
          recurring_bill: updatedBill
        }
      });
    }

    if (request.method === "GET" && url.pathname === "/v1/followups") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      const queue = (url.searchParams.get("queue") || "").trim();
      const itemStatusParam = (url.searchParams.get("item_status") || "").trim();
      const { limit, offset } = getPagination(url);

      let statuses = [];
      if (itemStatusParam) {
        statuses = [itemStatusParam];
      } else if (queue === "pending_pickups") {
        statuses = ["Ready", "RejectedByCustomer"];
      } else {
        statuses = ["WaitingApproval"];
      }

      const { data, error } = await auth.serviceClient
        .from("case_items")
        .select("id, case_id, line_no, item_status, updated_at, cases!inner(id, case_no, followup_due_at_utc, followup_notes, followup_reminder_state, followup_last_contact_at_utc, customers(name, phone))")
        .eq("tenant_id", auth.user.tenantId)
        .in("item_status", statuses)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return json(500, { code: "FOLLOWUP_FETCH_FAILED", message: "Unable to fetch follow-up queue" });
      }

      return json(200, {
        code: "OK",
        data: data || [],
        filters: {
          queue: queue || "pending_approvals",
          item_status: itemStatusParam || null
        },
        pagination: { limit, offset }
      });
    }

    if (request.method === "POST" && /^\/v1\/followups\/cases\/[^/]+\/note$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      const caseId = url.pathname.split("/")[4];
      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const note = ensureNonEmptyString(body.note) ? body.note.trim() : null;
      const dueAt = toIsoStringSafe(body.followup_due_at_utc);
      const reminderState = ensureNonEmptyString(body.followup_reminder_state) ? body.followup_reminder_state.trim() : null;
      const contactNow = body.mark_contacted_now === undefined ? true : Boolean(body.mark_contacted_now);

      if (!note && !dueAt && !reminderState && !contactNow) {
        return json(400, { code: "VALIDATION_ERROR", message: "Provide at least one follow-up update field" });
      }

      const nowIso = new Date().toISOString();
      const patch = {
        updated_at: nowIso,
        updated_by: auth.user.id
      };
      if (note !== null) patch.followup_notes = note;
      if (dueAt) patch.followup_due_at_utc = dueAt;
      if (reminderState !== null) patch.followup_reminder_state = reminderState;
      if (contactNow) patch.followup_last_contact_at_utc = nowIso;

      const { data, error } = await auth.serviceClient
        .from("cases")
        .update(patch)
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", caseId)
        .select("id, case_no, followup_due_at_utc, followup_notes, followup_reminder_state, followup_last_contact_at_utc")
        .maybeSingle();

      if (error) return json(500, { code: "FOLLOWUP_UPDATE_FAILED", message: "Unable to update follow-up fields" });
      if (!data) return json(404, { code: "NOT_FOUND", message: "Case not found" });

      return json(200, { code: "OK", message: "Follow-up updated", data });
    }

    if (request.method === "POST" && url.pathname === "/v1/daily-close") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const timezone = env.DEFAULT_TIMEZONE || "Asia/Kolkata";
      const businessDateLocal = ensureNonEmptyString(body.business_date_local)
        ? body.business_date_local.trim()
        : getBusinessDateInTimezone(timezone);

      const snapshot = await buildDailyCloseSnapshot(auth.serviceClient, auth.user.tenantId, businessDateLocal, timezone);
      if (snapshot.error) {
        return json(500, { code: "DAILY_CLOSE_BUILD_FAILED", message: snapshot.error });
      }

      const nowIso = new Date().toISOString();
      const notes = ensureNonEmptyString(body.notes) ? body.notes.trim() : null;

      const { data, error } = await auth.serviceClient
        .from("daily_close_snapshots")
        .upsert({
          tenant_id: auth.user.tenantId,
          business_date_local: businessDateLocal,
          closed_at_utc: nowIso,
          closed_by: auth.user.id,
          notes,
          cash_close_summary_json: snapshot.cashCloseSummary,
          pending_deliveries_json: snapshot.pendingDeliveries,
          pending_approvals_json: snapshot.pendingApprovals,
          overdue_bills_json: snapshot.overdueBills
        }, { onConflict: "tenant_id,business_date_local" })
        .select("id, tenant_id, business_date_local, closed_at_utc, closed_by, notes")
        .single();

      if (error) {
        return json(500, { code: "DAILY_CLOSE_SAVE_FAILED", message: "Unable to save daily close snapshot" });
      }

      return json(200, {
        code: "OK",
        message: "Daily close snapshot saved",
        data: {
          snapshot: data,
          cash_close_summary: snapshot.cashCloseSummary,
          pending_deliveries: snapshot.pendingDeliveries,
          pending_approvals: snapshot.pendingApprovals,
          overdue_bills: snapshot.overdueBills
        }
      });
    }

    if (request.method === "GET" && url.pathname === "/v1/daily-close/latest") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      const { data, error } = await auth.serviceClient
        .from("daily_close_snapshots")
        .select("id, tenant_id, business_date_local, closed_at_utc, closed_by, notes, cash_close_summary_json, pending_deliveries_json, pending_approvals_json, overdue_bills_json")
        .eq("tenant_id", auth.user.tenantId)
        .order("business_date_local", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return json(500, { code: "DAILY_CLOSE_FETCH_FAILED", message: "Unable to fetch latest daily close" });
      if (!data) return json(404, { code: "NOT_FOUND", message: "No daily close snapshot found" });

      return json(200, { code: "OK", data });
    }

    if (request.method === "GET" && url.pathname === "/v1/admin/ops-status") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      const { data, error } = await auth.serviceClient
        .from("ops_job_status")
        .select("id, tenant_id, job_name, status, last_run_at_utc, last_success_at_utc, last_error_message, details_json, updated_at, updated_by")
        .eq("tenant_id", auth.user.tenantId)
        .order("updated_at", { ascending: false });

      if (error) return json(500, { code: "OPS_STATUS_FETCH_FAILED", message: "Unable to fetch ops status" });
      return json(200, { code: "OK", data: data || [] });
    }

    if (request.method === "POST" && /^\/v1\/admin\/ops-status\/[^/]+$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      const jobName = decodeURIComponent(url.pathname.split("/")[4]);
      if (!ensureNonEmptyString(jobName)) {
        return json(400, { code: "VALIDATION_ERROR", message: "job name is required" });
      }

      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const status = ensureNonEmptyString(body.status) ? body.status.trim() : null;
      if (!status) {
        return json(400, { code: "VALIDATION_ERROR", message: "status is required" });
      }

      const nowIso = new Date().toISOString();
      const payload = {
        tenant_id: auth.user.tenantId,
        job_name: jobName,
        status,
        last_run_at_utc: toIsoStringSafe(body.last_run_at_utc) || nowIso,
        last_success_at_utc: toIsoStringSafe(body.last_success_at_utc),
        last_error_message: body.last_error_message || null,
        details_json: body.details_json || null,
        updated_at: nowIso,
        updated_by: auth.user.id
      };

      const { data, error } = await auth.serviceClient
        .from("ops_job_status")
        .upsert(payload, { onConflict: "tenant_id,job_name" })
        .select("id, tenant_id, job_name, status, last_run_at_utc, last_success_at_utc, last_error_message, details_json, updated_at, updated_by")
        .single();

      if (error) return json(500, { code: "OPS_STATUS_SAVE_FAILED", message: "Unable to save ops status" });
      return json(200, { code: "OK", message: "Ops status updated", data });
    }

    if (request.method === "GET" && url.pathname === "/v1/admin/db-usage") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      const [quotaSetting, thresholdSetting] = await Promise.all([
        getSettingValue(auth.serviceClient, auth.user.tenantId, "db_quota_mb", 500),
        getSettingValue(auth.serviceClient, auth.user.tenantId, "db_archive_threshold_pct", 90)
      ]);

      const defaultQuotaMb = parseSettingNumber(quotaSetting, 500);
      const defaultThresholdPct = parseSettingNumber(thresholdSetting, 90);

      const { data: latest, error } = await auth.serviceClient
        .from("db_usage_snapshots")
        .select("id, observed_at_utc, usage_mb, quota_mb, utilization_pct, threshold_pct, is_triggered, source, details_json, created_at")
        .eq("tenant_id", auth.user.tenantId)
        .order("observed_at_utc", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return json(500, { code: "DB_USAGE_FETCH_FAILED", message: "Unable to fetch DB usage snapshot" });
      }

      const usageMb = latest ? Number(latest.usage_mb) : null;
      const quotaMb = latest ? Number(latest.quota_mb) : defaultQuotaMb;
      const thresholdPct = latest ? Number(latest.threshold_pct) : defaultThresholdPct;
      const utilizationPct = latest
        ? Number(latest.utilization_pct)
        : (quotaMb > 0 && usageMb !== null ? Number(((usageMb / quotaMb) * 100).toFixed(2)) : null);

      const triggerReady = utilizationPct !== null && utilizationPct >= thresholdPct;

      return json(200, {
        code: "OK",
        data: {
          latest_snapshot: latest || null,
          usage_mb: usageMb,
          quota_mb: quotaMb,
          utilization_pct: utilizationPct,
          threshold_pct: thresholdPct,
          trigger_ready: triggerReady
        }
      });
    }

    if (request.method === "POST" && url.pathname === "/v1/admin/db-usage") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const [quotaSetting, thresholdSetting] = await Promise.all([
        getSettingValue(auth.serviceClient, auth.user.tenantId, "db_quota_mb", 500),
        getSettingValue(auth.serviceClient, auth.user.tenantId, "db_archive_threshold_pct", 90)
      ]);

      const usageMb = parseNumericQty(body.usage_mb, null);
      const quotaMb = parsePositiveNumber(body.quota_mb, parseSettingNumber(quotaSetting, 500));
      const thresholdPct = parsePositiveNumber(body.threshold_pct, parseSettingNumber(thresholdSetting, 90));

      if (usageMb === null || usageMb < 0) {
        return json(400, { code: "VALIDATION_ERROR", message: "usage_mb must be a non-negative number" });
      }
      if (quotaMb === null) {
        return json(400, { code: "VALIDATION_ERROR", message: "quota_mb must be a positive number" });
      }
      if (thresholdPct === null || thresholdPct > 100) {
        return json(400, { code: "VALIDATION_ERROR", message: "threshold_pct must be in range (0, 100]" });
      }

      const utilizationPct = Number(((usageMb / quotaMb) * 100).toFixed(2));
      const isTriggered = utilizationPct >= thresholdPct;

      const payload = {
        tenant_id: auth.user.tenantId,
        observed_at_utc: toIsoStringSafe(body.observed_at_utc) || new Date().toISOString(),
        usage_mb: usageMb,
        quota_mb: quotaMb,
        utilization_pct: utilizationPct,
        threshold_pct: thresholdPct,
        is_triggered: isTriggered,
        source: ensureNonEmptyString(body.source) ? body.source.trim() : "manual",
        details_json: body.details_json || null,
        created_by: auth.user.id
      };

      const { data, error } = await auth.serviceClient
        .from("db_usage_snapshots")
        .insert(payload)
        .select("id, observed_at_utc, usage_mb, quota_mb, utilization_pct, threshold_pct, is_triggered, source, details_json, created_at")
        .single();

      if (error) return json(500, { code: "DB_USAGE_SAVE_FAILED", message: "Unable to save DB usage snapshot" });

      return json(201, {
        code: "OK",
        message: "DB usage snapshot saved",
        data: {
          ...data,
          trigger_ready: isTriggered
        }
      });
    }

    if (request.method === "POST" && url.pathname === "/v1/admin/archive/trigger-check") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const force = Boolean(body.force);
      const limit = Math.max(1, Math.min(50, toSafeInt(body.limit, 10)));

      const [thresholdSetting, hotRetentionSetting] = await Promise.all([
        getSettingValue(auth.serviceClient, auth.user.tenantId, "db_archive_threshold_pct", 90),
        getSettingValue(auth.serviceClient, auth.user.tenantId, "archive_hot_retention_days", 60)
      ]);

      const thresholdPct = parseSettingNumber(thresholdSetting, 90);
      const hotRetentionDays = Math.max(1, Math.floor(parseSettingNumber(hotRetentionSetting, 60)));

      const { data: latestUsage, error: usageErr } = await auth.serviceClient
        .from("db_usage_snapshots")
        .select("id, observed_at_utc, usage_mb, quota_mb, utilization_pct, threshold_pct, is_triggered")
        .eq("tenant_id", auth.user.tenantId)
        .order("observed_at_utc", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (usageErr) return json(500, { code: "ARCHIVE_TRIGGER_CHECK_FAILED", message: "Unable to load DB usage snapshot" });
      if (!latestUsage) return json(400, { code: "DB_USAGE_REQUIRED", message: "Create a DB usage snapshot before trigger-check" });

      const effectiveThreshold = Number(latestUsage.threshold_pct || thresholdPct);
      const utilizationPct = Number(latestUsage.utilization_pct || 0);
      const triggerReady = utilizationPct >= effectiveThreshold;

      if (!triggerReady && !force) {
        return json(409, {
          code: "ARCHIVE_TRIGGER_NOT_MET",
          message: `Archive trigger requires utilization >= ${effectiveThreshold}% (current ${utilizationPct}%)`,
          data: {
            utilization_pct: utilizationPct,
            threshold_pct: effectiveThreshold,
            force_allowed: true
          }
        });
      }

      const cutoffIso = new Date(Date.now() - (hotRetentionDays * 24 * 60 * 60 * 1000)).toISOString();
      const { data: candidates, error: candidateErr } = await auth.serviceClient
        .from("cases")
        .select("id, case_no, header_status, created_at, customers(name, phone)")
        .eq("tenant_id", auth.user.tenantId)
        .eq("is_active", true)
        .in("header_status", ["DeliveredAll", "Closed"])
        .lte("created_at", cutoffIso)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (candidateErr) return json(500, { code: "ARCHIVE_TRIGGER_CHECK_FAILED", message: "Unable to fetch archive candidates" });

      return json(200, {
        code: "OK",
        message: "Archive trigger check complete",
        data: {
          utilization_pct: utilizationPct,
          threshold_pct: effectiveThreshold,
          trigger_ready: triggerReady || force,
          forced: force,
          hot_retention_days: hotRetentionDays,
          cutoff_created_at_utc: cutoffIso,
          candidate_count: (candidates || []).length,
          candidates: candidates || [],
          note: "Run /v1/admin/archive/cases/{case_id} with verified backup bundle + checksum to archive each case"
        }
      });
    }

    if (request.method === "GET" && url.pathname === "/v1/admin/archive-index") {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      const { limit, offset } = getPagination(url);
      const caseNo = (url.searchParams.get("case_no") || "").trim();
      const phone = (url.searchParams.get("phone") || "").trim();
      const customerName = (url.searchParams.get("customer_name") || "").trim();
      const restoreStatus = (url.searchParams.get("restore_status") || "").trim();

      let query = auth.serviceClient
        .from("archive_index")
        .select("id, source_case_id, case_no, customer_name, customer_phone, final_status, archived_at_utc, archive_location_ref, backup_checksum_sha256, checksum_verified, restore_status, restored_at_utc, restored_by, notes, created_at")
        .eq("tenant_id", auth.user.tenantId)
        .eq("is_active", true)
        .order("archived_at_utc", { ascending: false })
        .range(offset, offset + limit - 1);

      if (caseNo) query = query.ilike("case_no", `%${caseNo}%`);
      if (phone) query = query.ilike("customer_phone", `%${phone}%`);
      if (customerName) query = query.ilike("customer_name", `%${customerName}%`);
      if (restoreStatus) query = query.eq("restore_status", restoreStatus);

      const { data, error } = await query;
      if (error) return json(500, { code: "ARCHIVE_INDEX_FETCH_FAILED", message: "Unable to fetch archive index" });

      return json(200, { code: "OK", data: data || [], pagination: { limit, offset } });
    }

    if (request.method === "POST" && /^\/v1\/admin\/archive\/cases\/[^/]+$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      const caseId = url.pathname.split("/")[5];
      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const providedChecksum = toLowerTrim(body.backup_checksum_sha256);
      const backupBundle = body.backup_bundle_json;
      const dryRun = Boolean(body.dry_run);
      const allowOpenCase = Boolean(body.allow_open_case);

      if (!backupBundle || typeof backupBundle !== "object") {
        return json(400, { code: "BACKUP_REQUIRED", message: "backup_bundle_json object is required before archive" });
      }
      if (!providedChecksum || providedChecksum.length < 32) {
        return json(400, { code: "BACKUP_REQUIRED", message: "backup_checksum_sha256 is required before archive" });
      }

      const svc = auth.serviceClient;
      const { data: caseRow, error: caseErr } = await svc
        .from("cases")
        .select("id, case_no, header_status, is_active, notes, customers(name, phone)")
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", caseId)
        .maybeSingle();

      if (caseErr) return json(500, { code: "ARCHIVE_CASE_FETCH_FAILED", message: "Unable to load case" });
      if (!caseRow) return json(404, { code: "NOT_FOUND", message: "Case not found" });

      if (!allowOpenCase && !["DeliveredAll", "Closed"].includes(caseRow.header_status)) {
        return json(409, { code: "ARCHIVE_NOT_ALLOWED", message: "Only DeliveredAll/Closed cases are eligible by default" });
      }

      const computedChecksum = await sha256Hex(toStableJson(backupBundle));
      if (computedChecksum !== providedChecksum) {
        return json(409, {
          code: "BACKUP_CHECKSUM_MISMATCH",
          message: "Provided backup checksum does not match computed checksum. Archive is blocked.",
          data: { provided_checksum_sha256: providedChecksum, computed_checksum_sha256: computedChecksum }
        });
      }

      const nowIso = new Date().toISOString();
      const customerObj = Array.isArray(caseRow.customers) ? (caseRow.customers[0] || {}) : (caseRow.customers || {});
      const archivePayload = {
        tenant_id: auth.user.tenantId,
        source_case_id: caseRow.id,
        case_no: caseRow.case_no,
        customer_name: customerObj.name || null,
        customer_phone: customerObj.phone || null,
        final_status: caseRow.header_status,
        archived_at_utc: nowIso,
        archive_location_ref: ensureNonEmptyString(body.archive_location_ref) ? body.archive_location_ref.trim() : null,
        backup_bundle_json: backupBundle,
        backup_checksum_sha256: providedChecksum,
        computed_checksum_sha256: computedChecksum,
        checksum_verified: true,
        restore_status: "ARCHIVED",
        notes: ensureNonEmptyString(body.notes) ? body.notes.trim() : null,
        is_active: true,
        updated_at: nowIso,
        updated_by: auth.user.id,
        created_by: auth.user.id
      };

      if (dryRun) {
        return json(200, {
          code: "OK",
          message: "Archive dry-run validation passed",
          data: {
            dry_run: true,
            case_id: caseRow.id,
            case_no: caseRow.case_no,
            eligible_status: caseRow.header_status,
            checksum_verified: true,
            archive_payload_preview: archivePayload
          }
        });
      }

      const { data: archiveRow, error: archiveErr } = await svc
        .from("archive_index")
        .upsert(archivePayload, { onConflict: "tenant_id,source_case_id" })
        .select("id, source_case_id, case_no, archived_at_utc, backup_checksum_sha256, computed_checksum_sha256, checksum_verified, restore_status")
        .single();

      if (archiveErr) return json(500, { code: "ARCHIVE_INDEX_SAVE_FAILED", message: "Unable to save archive index" });

      if (caseRow.is_active) {
        await svc
          .from("cases")
          .update({
            is_active: false,
            updated_at: nowIso,
            updated_by: auth.user.id
          })
          .eq("tenant_id", auth.user.tenantId)
          .eq("id", caseRow.id);

        await svc
          .from("case_items")
          .update({
            is_active: false,
            updated_at: nowIso,
            updated_by: auth.user.id
          })
          .eq("tenant_id", auth.user.tenantId)
          .eq("case_id", caseRow.id);
      }

      await insertAuditLog(svc, {
        tenant_id: auth.user.tenantId,
        actor_user_id: auth.user.id,
        action: "ARCHIVE_CASE",
        entity_type: "cases",
        entity_id: caseRow.id,
        reason: ensureNonEmptyString(body.notes) ? body.notes.trim() : "Archive workflow",
        payload_json: {
          archive_id: archiveRow.id,
          case_no: caseRow.case_no,
          checksum_verified: true,
          backup_checksum_sha256: providedChecksum,
          computed_checksum_sha256: computedChecksum
        }
      });

      return json(200, {
        code: "OK",
        message: "Case archived successfully (hot DB set inactive after backup checksum verification)",
        data: {
          archive: archiveRow,
          case_id: caseRow.id,
          case_no: caseRow.case_no,
          case_active_after_archive: false
        }
      });
    }

    if (request.method === "POST" && /^\/v1\/admin\/archive\/restore\/[^/]+$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin/IT role required" });
      }

      const archiveId = url.pathname.split("/")[5];
      const svc = auth.serviceClient;

      const { data: archiveRow, error: archiveErr } = await svc
        .from("archive_index")
        .select("id, source_case_id, case_no, checksum_verified, restore_status")
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", archiveId)
        .eq("is_active", true)
        .maybeSingle();

      if (archiveErr) return json(500, { code: "ARCHIVE_RESTORE_FAILED", message: "Unable to load archive entry" });
      if (!archiveRow) return json(404, { code: "NOT_FOUND", message: "Archive entry not found" });
      if (!archiveRow.checksum_verified) {
        return json(409, { code: "ARCHIVE_RESTORE_BLOCKED", message: "Archive restore blocked because checksum was not verified" });
      }

      const nowIso = new Date().toISOString();

      await svc
        .from("cases")
        .update({
          is_active: true,
          updated_at: nowIso,
          updated_by: auth.user.id
        })
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", archiveRow.source_case_id);

      await svc
        .from("case_items")
        .update({
          is_active: true,
          updated_at: nowIso,
          updated_by: auth.user.id
        })
        .eq("tenant_id", auth.user.tenantId)
        .eq("case_id", archiveRow.source_case_id);

      const { data: updatedArchive, error: updErr } = await svc
        .from("archive_index")
        .update({
          restore_status: "RESTORED",
          restored_at_utc: nowIso,
          restored_by: auth.user.id,
          updated_at: nowIso,
          updated_by: auth.user.id
        })
        .eq("tenant_id", auth.user.tenantId)
        .eq("id", archiveRow.id)
        .select("id, source_case_id, case_no, restore_status, restored_at_utc, restored_by")
        .single();

      if (updErr) return json(500, { code: "ARCHIVE_RESTORE_FAILED", message: "Case reactivated but archive status update failed" });

      await insertAuditLog(svc, {
        tenant_id: auth.user.tenantId,
        actor_user_id: auth.user.id,
        action: "RESTORE_ARCHIVED_CASE",
        entity_type: "cases",
        entity_id: archiveRow.source_case_id,
        reason: "Archive restore flow",
        payload_json: {
          archive_id: archiveRow.id,
          case_no: archiveRow.case_no
        }
      });

      return json(200, {
        code: "OK",
        message: "Archived case restored to hot DB",
        data: updatedArchive
      });
    }

    if (request.method === "GET" && /^\/v1\/cases\/[^/]+\/status-history$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin", "IT", "Staff"])) {
        return json(403, { code: "FORBIDDEN", message: "Role not allowed" });
      }

      const caseId = url.pathname.split("/")[3];
      const { limit, offset } = getPagination(url);
      const { data, error } = await auth.serviceClient
        .from("case_status_history")
        .select("id, case_id, case_item_id, from_status, to_status, changed_at_utc, changed_by, note")
        .eq("tenant_id", auth.user.tenantId)
        .eq("case_id", caseId)
        .order("changed_at_utc", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) return json(500, { code: "CASE_STATUS_HISTORY_FETCH_FAILED", message: "Unable to fetch status history" });
      return json(200, { code: "OK", data: data || [], pagination: { limit, offset } });
    }

    if (request.method === "POST" && /^\/v1\/admin\/users\/[^/]+\/deactivate$/.test(url.pathname)) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      if (!requireRole(auth.user, ["Admin"])) {
        return json(403, { code: "FORBIDDEN", message: "Admin role required" });
      }

      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : "Admin deactivation";
      const targetUserId = url.pathname.split("/")[4];
      if (!ensureId(targetUserId)) {
        return json(400, { code: "VALIDATION_ERROR", message: "Invalid target user id" });
      }

      const svc = auth.serviceClient;
      const nowIso = new Date().toISOString();

      const { data: targetUser, error: targetErr } = await svc
        .from("users")
        .select("id, tenant_id, auth_user_id, role, is_active")
        .eq("id", targetUserId)
        .eq("tenant_id", auth.user.tenantId)
        .maybeSingle();

      if (targetErr) {
        return json(500, { code: "USER_FETCH_FAILED", message: "Unable to load target user" });
      }
      if (!targetUser) {
        return json(404, { code: "NOT_FOUND", message: "Target user not found" });
      }
      if (!targetUser.is_active) {
        return json(200, { code: "OK", message: "User already deactivated" });
      }

      const { error: updateErr } = await svc
        .from("users")
        .update({
          is_active: false,
          deactivated_at: nowIso,
          deactivated_by: auth.user.id,
          updated_at: nowIso,
          updated_by: auth.user.id
        })
        .eq("id", targetUser.id)
        .eq("tenant_id", auth.user.tenantId);

      if (updateErr) {
        return json(500, { code: "DEACTIVATE_FAILED", message: "Unable to deactivate user" });
      }

      if (targetUser.auth_user_id) {
        await svc
          .from("user_token_revocations")
          .insert({
            tenant_id: auth.user.tenantId,
            auth_user_id: targetUser.auth_user_id,
            revoked_after_utc: nowIso,
            reason,
            created_by: auth.user.id
          });
      }

      await svc.from("audit_log").insert({
        tenant_id: auth.user.tenantId,
        actor_user_id: auth.user.id,
        action: "DEACTIVATE_USER",
        entity_type: "users",
        entity_id: targetUser.id,
        reason,
        payload_json: {
          target_role: targetUser.role,
          target_auth_user_id: targetUser.auth_user_id,
          deactivated_at: nowIso
        }
      });

      return json(200, {
        code: "OK",
        message: "User deactivated and active sessions revoked",
        data: {
          user_id: targetUser.id,
          tenant_id: auth.user.tenantId,
          deactivated_at_utc: nowIso
        }
      });
    }

    if (url.pathname === "/health") {
      return json(200, {
        ok: true,
        service: "workshop-api",
        version: "v1",
        timestamp: new Date().toISOString(),
        config: configStatus
      });
    }

    if (url.pathname === "/v1/system/config-status") {
      return json(200, {
        ok: true,
        config: configStatus
      });
    }

    if (url.pathname.startsWith("/v1")) {
      return json(501, {
        code: "NOT_IMPLEMENTED",
        message: "Phase 0 contract scaffold is ready. Endpoint implementation starts in Phase 1.",
        path: url.pathname
      });
    }

    return json(404, {
      code: "NOT_FOUND",
      message: "Route not found"
    });
  }
};
