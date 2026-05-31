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
const EMAIL = process.env.WORKSHOP_IT_EMAIL || process.env.WORKSHOP_ADMIN_EMAIL || "it@rajeshelec.local";
const PASSWORD = process.env.WORKSHOP_IT_PASSWORD || process.env.WORKSHOP_ADMIN_PASSWORD || "Admin@12345!";

const inventoryRows = [
  { sku: "FAN-CAP-2.5UF", item_name: "Fan Capacitor 2.5uF", storage_location: "Rack A1 - Capacitors", uom: "pcs", current_stock_qty: 24, reorder_level_qty: 8, default_unit_cost_paise: 2800 },
  { sku: "FAN-CAP-3.15UF", item_name: "Fan Capacitor 3.15uF", storage_location: "Rack A1 - Capacitors", uom: "pcs", current_stock_qty: 18, reorder_level_qty: 6, default_unit_cost_paise: 3200 },
  { sku: "FAN-CAP-4UF", item_name: "Fan Capacitor 4uF", storage_location: "Rack A1 - Capacitors", uom: "pcs", current_stock_qty: 14, reorder_level_qty: 5, default_unit_cost_paise: 3800 },
  { sku: "EXH-CAP-1.5UF", item_name: "Exhaust Fan Capacitor 1.5uF", storage_location: "Rack A1 - Capacitors", uom: "pcs", current_stock_qty: 16, reorder_level_qty: 6, default_unit_cost_paise: 2400 },
  { sku: "MOTOR-RUN-CAP-25UF", item_name: "Motor Run Capacitor 25uF", storage_location: "Rack A2 - Motor Capacitors", uom: "pcs", current_stock_qty: 9, reorder_level_qty: 4, default_unit_cost_paise: 16500 },
  { sku: "MOTOR-RUN-CAP-36UF", item_name: "Motor Run Capacitor 36uF", storage_location: "Rack A2 - Motor Capacitors", uom: "pcs", current_stock_qty: 7, reorder_level_qty: 3, default_unit_cost_paise: 22000 },
  { sku: "MOTOR-START-CAP-100UF", item_name: "Motor Start Capacitor 100uF", storage_location: "Rack A2 - Motor Capacitors", uom: "pcs", current_stock_qty: 8, reorder_level_qty: 3, default_unit_cost_paise: 18500 },
  { sku: "FAN-BEARING-6201", item_name: "Fan Bearing 6201", storage_location: "Rack B1 - Bearings", uom: "pcs", current_stock_qty: 30, reorder_level_qty: 10, default_unit_cost_paise: 4500 },
  { sku: "FAN-BEARING-6202", item_name: "Fan Bearing 6202", storage_location: "Rack B1 - Bearings", uom: "pcs", current_stock_qty: 22, reorder_level_qty: 8, default_unit_cost_paise: 5200 },
  { sku: "PUMP-BEARING-6204", item_name: "Pump Bearing 6204", storage_location: "Rack B2 - Pump Bearings", uom: "pcs", current_stock_qty: 12, reorder_level_qty: 4, default_unit_cost_paise: 9500 },
  { sku: "PUMP-BEARING-6205", item_name: "Pump Bearing 6205", storage_location: "Rack B2 - Pump Bearings", uom: "pcs", current_stock_qty: 10, reorder_level_qty: 4, default_unit_cost_paise: 12500 },
  { sku: "OIL-SEAL-25X40X7", item_name: "Oil Seal 25x40x7", storage_location: "Rack B3 - Seals", uom: "pcs", current_stock_qty: 28, reorder_level_qty: 10, default_unit_cost_paise: 2500 },
  { sku: "MECH-SEAL-12MM", item_name: "Mechanical Seal 12mm", storage_location: "Rack B3 - Seals", uom: "pcs", current_stock_qty: 11, reorder_level_qty: 4, default_unit_cost_paise: 15500 },
  { sku: "SUB-SEAL-KIT-1HP", item_name: "Submersible Seal Kit 1HP", storage_location: "Rack B3 - Seals", uom: "kit", current_stock_qty: 6, reorder_level_qty: 3, default_unit_cost_paise: 18000 },
  { sku: "PUMP-IMPELLER-1HP", item_name: "Pump Impeller 1HP", storage_location: "Rack C1 - Pump Spares", uom: "pcs", current_stock_qty: 5, reorder_level_qty: 2, default_unit_cost_paise: 26000 },
  { sku: "SUB-CABLE-3C-1.5SQMM", item_name: "Submersible Cable 3 Core 1.5 sqmm", storage_location: "Rack C2 - Cable Roll", uom: "m", current_stock_qty: 75, reorder_level_qty: 25, default_unit_cost_paise: 4600 },
  { sku: "SUB-JOINT-KIT", item_name: "Submersible Cable Joint Kit", storage_location: "Rack C2 - Cable Roll", uom: "kit", current_stock_qty: 8, reorder_level_qty: 3, default_unit_cost_paise: 34000 },
  { sku: "COPPER-WIRE-32SWG", item_name: "Copper Winding Wire 32 SWG", storage_location: "Rack D1 - Winding Wire", uom: "kg", current_stock_qty: 4.5, reorder_level_qty: 1.5, default_unit_cost_paise: 98000 },
  { sku: "COPPER-WIRE-34SWG", item_name: "Copper Winding Wire 34 SWG", storage_location: "Rack D1 - Winding Wire", uom: "kg", current_stock_qty: 3.75, reorder_level_qty: 1.25, default_unit_cost_paise: 99000 },
  { sku: "VARNISH-INS-500ML", item_name: "Insulation Varnish 500ml", storage_location: "Rack D2 - Chemicals", uom: "bottle", current_stock_qty: 9, reorder_level_qty: 3, default_unit_cost_paise: 22000 },
  { sku: "GREASE-HT-100GM", item_name: "High Temperature Grease 100g", storage_location: "Rack D2 - Chemicals", uom: "tube", current_stock_qty: 12, reorder_level_qty: 4, default_unit_cost_paise: 9000 },
  { sku: "HEAT-SHRINK-6MM", item_name: "Heat Shrink Sleeve 6mm", storage_location: "Rack E1 - Electrical Consumables", uom: "m", current_stock_qty: 35, reorder_level_qty: 12, default_unit_cost_paise: 1800 },
  { sku: "INS-TAPE-ISI", item_name: "ISI Insulation Tape", storage_location: "Rack E1 - Electrical Consumables", uom: "roll", current_stock_qty: 26, reorder_level_qty: 10, default_unit_cost_paise: 2500 },
  { sku: "SOLDER-WIRE-100GM", item_name: "Solder Wire 100g", storage_location: "Rack E1 - Electrical Consumables", uom: "roll", current_stock_qty: 6, reorder_level_qty: 3, default_unit_cost_paise: 11000 },
  { sku: "TERM-BLOCK-15A", item_name: "Terminal Block 15A", storage_location: "Rack E2 - Switchgear", uom: "pcs", current_stock_qty: 20, reorder_level_qty: 8, default_unit_cost_paise: 3000 },
  { sku: "MOTOR-RELAY-230V", item_name: "Motor Relay 230V", storage_location: "Rack E2 - Switchgear", uom: "pcs", current_stock_qty: 7, reorder_level_qty: 3, default_unit_cost_paise: 16000 },
  { sku: "FAN-BLADE-SET-1200", item_name: "Ceiling Fan Blade Set 1200mm", storage_location: "Top Shelf F1 - Fan Body Parts", uom: "set", current_stock_qty: 5, reorder_level_qty: 2, default_unit_cost_paise: 28000 },
  { sku: "EXH-BLADE-225MM", item_name: "Exhaust Fan Blade 225mm", storage_location: "Top Shelf F2 - Exhaust Parts", uom: "pcs", current_stock_qty: 9, reorder_level_qty: 3, default_unit_cost_paise: 13000 },
  { sku: "FAN-SCREW-KIT", item_name: "Fan Screw and Washer Kit", storage_location: "Drawer G1 - Fasteners", uom: "kit", current_stock_qty: 18, reorder_level_qty: 6, default_unit_cost_paise: 6000 },
  { sku: "FAN-REG-STEP", item_name: "Step Type Fan Regulator", storage_location: "Rack E2 - Switchgear", uom: "pcs", current_stock_qty: 10, reorder_level_qty: 4, default_unit_cost_paise: 12500 }
].map((row) => ({
  valuation_method: "WEIGHTED_AVERAGE",
  is_active: true,
  ...row
}));

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

async function findInventoryItemBySku(sku, token) {
  const result = await api(`/v1/inventory/items?q=${encodeURIComponent(sku)}&limit=20`, { method: "GET" }, token);
  const rows = Array.isArray(result.data) ? result.data : [];
  return rows.find((row) => String(row.sku || "").toUpperCase() === sku.toUpperCase()) || null;
}

async function createOrUpdateInventoryItem(row, token) {
  const existing = await findInventoryItemBySku(row.sku, token);
  if (existing?.id) {
    const result = await api(`/v1/inventory/items/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify(row)
    }, token);
    return { action: "updated", id: existing.id, sku: row.sku, name: row.item_name, data: result.data };
  }

  const result = await api("/v1/inventory/items", {
    method: "POST",
    body: JSON.stringify(row)
  }, token);
  return { action: "created", id: result?.data?.id || null, sku: row.sku, name: row.item_name, data: result.data };
}

async function main() {
  const token = await login();
  if (!token) throw new Error("Login did not return an access token");

  const results = [];
  for (const row of inventoryRows) {
    results.push(await createOrUpdateInventoryItem(row, token));
  }

  const created = results.filter((row) => row.action === "created").length;
  const updated = results.filter((row) => row.action === "updated").length;

  console.log(JSON.stringify({
    seed: "REAL_WORLD_INVENTORY_READY",
    api_base: API_BASE,
    login_email: EMAIL,
    total: results.length,
    created,
    updated,
    sample: results.slice(0, 8).map((row) => ({ action: row.action, sku: row.sku, name: row.name }))
  }, null, 2));
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});