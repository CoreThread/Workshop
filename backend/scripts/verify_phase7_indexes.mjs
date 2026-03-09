import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

function parseDotEnv(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
    env[key] = value;
  }
  return env;
}

function resolveBackendRoot() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "package.json")) && fs.existsSync(path.join(cwd, "migrations"))) {
    return cwd;
  }

  const parent = path.resolve(cwd, "..");
  if (fs.existsSync(path.join(parent, "package.json")) && fs.existsSync(path.join(parent, "migrations"))) {
    return parent;
  }

  throw new Error("Unable to resolve backend root. Run this script from backend/ or backend/scripts/");
}

const expectedIndexes = [
  "idx_customers_tenant_phone",
  "idx_cases_tenant_case_no",
  "idx_cases_tenant_created_at",
  "idx_case_items_tenant_case_status",
  "idx_case_spare_consumption_tenant_item_consumed_at",
  "idx_stock_ledger_tenant_inventory_txn_at",
  "idx_case_status_history_tenant_case_changed",
  "idx_case_status_history_tenant_item_changed",
  "idx_expenses_tenant_date",
  "idx_expenses_tenant_category_date",
  "idx_recurring_bills_tenant_due_date",
  "idx_recurring_bills_tenant_active_due",
  "idx_db_usage_snapshots_tenant_observed",
  "idx_archive_index_tenant_case_no",
  "idx_archive_index_tenant_phone",
  "idx_archive_index_tenant_restore_status",
  "idx_api_request_logs_observed",
  "idx_api_request_logs_path_method",
  "idx_api_request_logs_error",
  "idx_api_request_logs_latency"
];

const backendRoot = resolveBackendRoot();
const envPath = path.join(backendRoot, ".env");

if (!fs.existsSync(envPath)) {
  throw new Error(`Missing env file: ${envPath}`);
}

const env = parseDotEnv(envPath);
const dbUrl = env.SUPABASE_DB_URL;
if (!dbUrl) {
  throw new Error("SUPABASE_DB_URL is missing in backend/.env");
}

const client = postgres(dbUrl, { ssl: "require", max: 1 });

try {
  const rows = await client`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
  `;

  const existing = new Set(rows.map((r) => r.indexname));
  const missing = expectedIndexes.filter((name) => !existing.has(name));

  const summary = {
    smoke: missing.length === 0 ? "PHASE7_INDEXES_OK" : "PHASE7_INDEXES_MISSING",
    expected_index_count: expectedIndexes.length,
    existing_index_count: existing.size,
    missing_index_count: missing.length,
    missing_indexes: missing
  };

  console.log(JSON.stringify(summary, null, 2));

  if (missing.length > 0) {
    process.exitCode = 1;
  }
} finally {
  await client.end();
}
