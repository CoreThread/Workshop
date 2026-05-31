import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(scriptDir, "..");
const envPath = path.join(backendRoot, ".env");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv(envPath);

const API_BASE = (process.env.WORKSHOP_SEED_API_BASE || process.env.WORKSHOP_LOCAL_API_BASE || "https://workshop-api.jaiswal-utkarshuj.workers.dev").replace(/\/$/, "");
const EMAIL = process.env.WORKSHOP_ADMIN_EMAIL || "admin@rajeshelec.local";
const PASSWORD = process.env.WORKSHOP_ADMIN_PASSWORD || "Admin@12345!";
const CASE_PREFIX = process.env.WORKSHOP_SEED_CASE_PREFIX || "AG";
const START_NO = Math.max(1, Number(process.env.WORKSHOP_SEED_START_NO || "1"));
const curatedCases = [
  {
    customer: { name: "Amit Jaiswal", phone: "9876000001" },
    notes: "Ceiling fan from drawing room. Customer reported issue started after voltage fluctuation during evening peak load.",
    items: [
      { item_category: "fan", brand: "Havells", model: "Stealth Air 1200", condition_in: "dust on blades, canopy slightly loose", reported_issue: "fan only hums and does not rotate unless blades are pushed by hand", flow: ["Diagnosis", "ApprovedForRepair", "InRepair", "Ready"] }
    ]
  },
  {
    customer: { name: "Sunita Verma", phone: "9876000002" },
    notes: "Kitchen exhaust from first floor rental unit. Customer needs estimate approval from landlord before repair.",
    items: [
      { item_category: "exhaust", brand: "Crompton", model: "VentPro 225", condition_in: "grease deposits on grill and frame", reported_issue: "motor runs with burnt smell and airflow is very weak", flow: ["Diagnosis", "WaitingApproval"] }
    ]
  },
  {
    customer: { name: "Rakesh Gupta", phone: "9876000003" },
    notes: "Agricultural monoblock motor brought from field shed. Customer said breaker trips within seconds.",
    items: [
      { item_category: "motor", brand: "Kirloskar", model: "Mini 1HP", condition_in: "terminal box dusty, coupling worn", reported_issue: "motor trips on load and winding smell is noticeable", flow: ["Diagnosis", "ApprovedForRepair", "InRepair", "WaitingPart"] }
    ]
  },
  {
    customer: { name: "Pooja Sharma", phone: "9876000004" },
    notes: "Submersible pump from farmhouse borewell. Customer needs water urgently and asked for realistic delivery commitment.",
    items: [
      { item_category: "submersable", brand: "CRI", model: "4W12", condition_in: "mud stains, cable joint retaped", reported_issue: "pump starts but does not lift water above first stage", flow: ["Diagnosis", "ApprovedForRepair", "InRepair", "Ready", "OutForDelivery"] }
    ]
  },
  {
    customer: { name: "Mahesh Patel", phone: "9876000005" },
    notes: "Two-piece intake from small hotel: one ceiling fan and one kitchen exhaust, both from the same property visit.",
    items: [
      { item_category: "fan", brand: "Orient", model: "Summer Cool", condition_in: "paint scratches, slight wobble", reported_issue: "fan shakes heavily at speed 4 and makes bearing noise", flow: ["Diagnosis", "ApprovedForRepair", "InRepair", "Ready", "Delivered"] },
      { item_category: "exhaust", brand: "Bajaj", model: "Fresh Air 225", condition_in: "oil stains on frame", reported_issue: "exhaust runs but shutter is jammed and air throw is very weak", flow: ["Diagnosis", "ApprovedForRepair", "InRepair"] }
    ]
  },
  {
    customer: { name: "Kavita Mishra", phone: "9876000006" },
    notes: "Old table fan motor converted for workshop use. Customer asked to stop if repair cost crosses practical value.",
    items: [
      { item_category: "motor", brand: "CG", model: "MonoBlock Assist", condition_in: "outer body dented, shaft dusty", reported_issue: "starter engages but rotor does not pick up consistently", flow: ["Diagnosis", "WaitingApproval", "RejectedByCustomer"] }
    ]
  },
  {
    customer: { name: "Naresh Yadav", phone: "9876000007" },
    notes: "Shop shutter side exhaust. Operator reported issue after cleaning staff washed the area aggressively.",
    items: [
      { item_category: "exhaust", brand: "Anchor", model: "Industrial 300", condition_in: "moisture marks on housing", reported_issue: "switch is on but fan is completely dead after water exposure", flow: ["Diagnosis"] }
    ]
  },
  {
    customer: { name: "Ritu Pandey", phone: "9876000008" },
    notes: "Ceiling fan from bedroom with intermittent speed fluctuations mainly during late night use.",
    items: [
      { item_category: "fan", brand: "Usha", model: "Swift Breeze", condition_in: "blade balance slightly off", reported_issue: "speed drops after 20 minutes and regulator response is inconsistent", flow: ["Diagnosis", "ApprovedForRepair", "InRepair", "Ready", "OutForDelivery", "Delivered"] }
    ]
  },
  {
    customer: { name: "Dinesh Maurya", phone: "9876000009" },
    notes: "Borewell pump from village side service visit. Customer already approved replacement of standard wearable parts if needed.",
    items: [
      { item_category: "submersable", brand: "Texmo", model: "AquaX", condition_in: "mud deposits on outlet and clamps", reported_issue: "pump pressure is low and motor cuts out after a few minutes", flow: ["Diagnosis", "ApprovedForRepair", "InRepair", "WaitingPart"] }
    ]
  },
  {
    customer: { name: "Neha Soni", phone: "9876000010" },
    notes: "Household fan and exhaust dropped together by customer’s son before office hours.",
    items: [
      { item_category: "fan", brand: "Crompton", model: "HighSpeed 1200", condition_in: "dusty blades, rod straight", reported_issue: "fan is not starting and capacitor seems swollen", flow: ["Diagnosis", "ApprovedForRepair", "Ready"] },
      { item_category: "exhaust", brand: "Havells", model: "Ventil Air", condition_in: "grill dusty but intact", reported_issue: "exhaust vibrates loudly and noise increases after one minute", flow: ["Diagnosis", "WaitingApproval"] }
    ]
  },
  {
    customer: { name: "Manoj Tiwari", phone: "9876000011" },
    notes: "Workshop helper brought a spare pump motor for urgent same-week field installation.",
    items: [
      { item_category: "motor", brand: "ABB", model: "Workshop Drive", condition_in: "shaft slightly dusty, fan cover bent", reported_issue: "bearing sound is high and frame gets unusually hot under light load", flow: ["Diagnosis", "ApprovedForRepair", "InRepair", "Ready"] }
    ]
  },
  {
    customer: { name: "Asha Kushwaha", phone: "9876000012" },
    notes: "Submersible unit received from plumbing contractor. Customer asked for direct return if winding is fully burnt.",
    items: [
      { item_category: "submersable", brand: "V-Guard", model: "Borewell Plus", condition_in: "pipe thread worn, cable taped", reported_issue: "dry-run incident followed by total failure to start", flow: ["Diagnosis", "WaitingApproval", "RejectedByCustomer"] }
    ]
  },
  {
    customer: { name: "Suresh Patel", phone: "9876000013" },
    notes: "Two-fan service lot from coaching center classroom. One is urgent, one can wait if spare is delayed.",
    items: [
      { item_category: "fan", brand: "Bajaj", model: "Fresco 1200", condition_in: "heavy classroom dust on housing", reported_issue: "fan rotates slowly even at full regulator", flow: ["Diagnosis", "ApprovedForRepair", "InRepair", "Ready", "Delivered"] },
      { item_category: "fan", brand: "Orient", model: "Wendy", condition_in: "minor blade bend", reported_issue: "fan makes scraping noise after startup", flow: ["Diagnosis", "ApprovedForRepair", "InRepair", "WaitingPart"] }
    ]
  },
  {
    customer: { name: "Rekha Jaiswal", phone: "9876000014" },
    notes: "Store-room exhaust brought in after pest-control cleaning. Customer requested only fault diagnosis first.",
    items: [
      { item_category: "exhaust", brand: "Luminous", model: "AirSwift", condition_in: "frame cleaned recently, switch wire taped", reported_issue: "fan is fully dead and there is possible internal open circuit", flow: ["Diagnosis"] }
    ]
  },
  {
    customer: { name: "Pankaj Gupta", phone: "9876000015" },
    notes: "Field-replacement motor for water circulation setup. Customer approved repair but wants delivery at site, not pickup from shop.",
    items: [
      { item_category: "motor", brand: "Siemens", model: "AgriRun 1.5HP", condition_in: "terminal screws rusty", reported_issue: "motor hums and trips, capacitor and bearing both suspected", flow: ["Diagnosis", "ApprovedForRepair", "InRepair", "Ready", "OutForDelivery"] }
    ]
  },
  {
    customer: { name: "Sunil Verma", phone: "9876000016" },
    notes: "Mixed household lot from annual maintenance: one fan and one submersible controller-side complaint.",
    items: [
      { item_category: "fan", brand: "Usha", model: "Bloom Daffodil", condition_in: "canopy okay, downrod firm", reported_issue: "fan does not start in the morning but works after several switch toggles", flow: ["Diagnosis", "ApprovedForRepair", "InRepair"] },
      { item_category: "submersable", brand: "Crompton", model: "AquaGold", condition_in: "cable entry resealed", reported_issue: "pump starts then loses lift pressure after 5 minutes", flow: ["Diagnosis", "WaitingApproval"] }
    ]
  },
  {
    customer: { name: "Anil Sharma", phone: "9876000017" },
    notes: "Godown exhaust fan from grain store. Customer warned that dust conditions are severe and wants honest viability feedback.",
    items: [
      { item_category: "exhaust", brand: "Almonard", model: "Heavy Duty Vent 300", condition_in: "grain dust packed around hub", reported_issue: "motor overheats quickly and fan slows down after startup", flow: ["Diagnosis", "ApprovedForRepair", "InRepair", "Ready"] }
    ]
  },
  {
    customer: { name: "Vikram Pandey", phone: "9876000018" },
    notes: "Pressure pump motor from apartment terrace. Customer wants status by evening because water supply is intermittent.",
    items: [
      { item_category: "motor", brand: "CRI", model: "PressurePro", condition_in: "outer body intact, terminal cap replaced earlier", reported_issue: "motor starts but pressure drops and relay trips after heating", flow: ["Diagnosis", "ApprovedForRepair", "InRepair", "WaitingPart"] }
    ]
  },
  {
    customer: { name: "Mukesh Yadav", phone: "9876000019" },
    notes: "One ceiling fan from guest room and one exhaust from bathroom, both collected during home visit.",
    items: [
      { item_category: "fan", brand: "Havells", model: "Andria", condition_in: "blade set matched, body slightly dusty", reported_issue: "fan is slow and capacitor appears weak", flow: ["Diagnosis", "ApprovedForRepair", "Ready", "Delivered"] },
      { item_category: "exhaust", brand: "Bajaj", model: "Maxima DX", condition_in: "frame slightly bent near grill", reported_issue: "fan runs with strong vibration and rattling noise", flow: ["Diagnosis", "ApprovedForRepair", "InRepair"] }
    ]
  },
  {
    customer: { name: "Kiran Tiwari", phone: "9876000020" },
    notes: "Borewell pump from school campus. Admin approved quick inspection but final repair approval depends on committee call.",
    items: [
      { item_category: "submersable", brand: "Texmo", model: "SchoolLine 5S", condition_in: "mud marks on outlet and cable", reported_issue: "pump is drawing current but discharge is negligible", flow: ["Diagnosis", "WaitingApproval"] }
    ]
  }
];

const COUNT = Math.max(1, Math.min(curatedCases.length, Number(process.env.WORKSHOP_SEED_COUNT || String(curatedCases.length))));

function buildCasePayload(index) {
  const curated = curatedCases[index];
  return {
    case_no: `${CASE_PREFIX}-${String(START_NO + index).padStart(3, "0")}`,
    customer: { ...curated.customer },
    items: curated.items.map((item) => ({
      item_category: item.item_category,
      brand: item.brand,
      model: item.model,
      condition_in: item.condition_in,
      reported_issue: item.reported_issue
    })),
    notes: curated.notes
  };
}

function itemFlowFor(index, itemIndex) {
  return curatedCases[index]?.items?.[itemIndex]?.flow || ["Diagnosis"];
}

async function api(pathname, options = {}, token = "") {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${pathname}`, {
    ...options,
    headers
  });

  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { message: text || `HTTP ${response.status}` };
  }

  if (!response.ok) {
    const message = payload?.message || payload?.code || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

async function login() {
  const result = await api("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });
  return result?.data?.access_token || "";
}

async function findCaseByNumber(caseNo, token) {
  const result = await api(`/v1/cases?case_no=${encodeURIComponent(caseNo)}&limit=1`, { method: "GET" }, token);
  return Array.isArray(result.data) ? result.data[0] || null : null;
}

async function createCase(payload, token) {
  return api("/v1/cases", {
    method: "POST",
    body: JSON.stringify(payload)
  }, token);
}

async function loadCaseItems(caseId, token) {
  const result = await api(`/v1/cases/${caseId}/items`, { method: "GET" }, token);
  return Array.isArray(result.data) ? result.data : [];
}

async function updateItemStatus(caseId, itemId, toStatus, note, token) {
  return api(`/v1/cases/${caseId}/items/${itemId}/status`, {
    method: "POST",
    body: JSON.stringify({ to_status: toStatus, note })
  }, token);
}

async function saveFollowup(caseId, itemFlow, caseNo, token) {
  const lastStatus = itemFlow[itemFlow.length - 1] || "";
  const statusKey = lastStatus === "WaitingApproval"
    ? "waiting_approval"
    : lastStatus === "Ready"
      ? "ready"
      : lastStatus === "OutForDelivery"
        ? "out_for_delivery"
        : "";

  if (!statusKey) return;

  const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const noteByScenario = {
    waiting_approval: `Estimate discussion pending for ${caseNo}. Customer asked for callback tomorrow afternoon.`,
    ready: `Repair completed for ${caseNo}. Customer informed to arrange pickup.`,
    out_for_delivery: `Delivery initiated for ${caseNo}. Helper expected to reach customer area by evening.`
  };

  await api(`/v1/followups/cases/${caseId}/note`, {
    method: "POST",
    body: JSON.stringify({
      note: noteByScenario[statusKey],
      followup_due_at_utc: dueAt,
      followup_reminder_state: "PENDING",
      mark_contacted_now: true
    })
  }, token);
}

async function seed() {
  console.log(`[seed] api=${API_BASE} count=${COUNT} start=${CASE_PREFIX}-${String(START_NO).padStart(3, "0")}`);
  console.log(`[seed] logging in as ${EMAIL}`);

  const token = await login();
  if (!token) throw new Error("Login failed for seed script");

  const created = [];
  const skipped = [];

  for (let index = 0; index < COUNT; index += 1) {
    const payload = buildCasePayload(index);
    console.log(`[seed] ${index + 1}/${COUNT} checking ${payload.case_no}`);

    const existing = await findCaseByNumber(payload.case_no, token);
    if (existing?.id) {
      skipped.push(payload.case_no);
      console.log(`[seed] skipped existing ${payload.case_no}`);
      continue;
    }

    const caseResult = await createCase(payload, token);
    const caseId = caseResult.data.case_id;
    const items = await loadCaseItems(caseId, token);
    console.log(`[seed] created ${payload.case_no} with ${items.length} item(s)`);

    for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
      const item = items[itemIndex];
      const itemFlow = itemFlowFor(index, itemIndex);
      console.log(`[seed] ${payload.case_no} item ${itemIndex + 1}/${items.length} -> ${itemFlow.join(" -> ") || "no-op"}`);
      for (const toStatus of itemFlow) {
        await updateItemStatus(caseId, item.id, toStatus, `Seed flow: ${itemFlow.join(" -> ")}`, token);
      }
      await saveFollowup(caseId, itemFlow, payload.case_no, token);
    }

    created.push({
      case_no: payload.case_no,
      case_id: caseId,
      item_count: items.length,
      customer_name: payload.customer.name
    });

    console.log(`[seed] completed ${payload.case_no}`);
  }

  console.log(JSON.stringify({
    seed: "REAL_WORLD_CASES_READY",
    api_base: API_BASE,
    requested_count: COUNT,
    created_count: created.length,
    skipped_existing_count: skipped.length,
    created,
    skipped_existing_case_nos: skipped
  }, null, 2));
}

seed().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});