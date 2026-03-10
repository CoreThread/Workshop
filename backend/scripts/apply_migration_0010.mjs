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

const backendRoot = process.cwd();
const envPath = path.join(backendRoot, ".env");
const migrationPath = path.join(backendRoot, "migrations", "0010_phase9_hr_attendance_advances.sql");

const env = parseDotEnv(envPath);
const dbUrl = env.SUPABASE_DB_URL;
if (!dbUrl) {
  throw new Error("SUPABASE_DB_URL is missing in backend/.env");
}

const sqlText = fs.readFileSync(migrationPath, "utf8");
const client = postgres(dbUrl, { ssl: "require", max: 1 });

try {
  await client.unsafe(sqlText);
  console.log("MIGRATION_0010_APPLIED_OK");
} finally {
  await client.end();
}
