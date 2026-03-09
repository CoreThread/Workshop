import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv(path.resolve(process.cwd(), ".env"));

const supabaseUrl = process.env.SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const tenantId = process.env.DEFAULT_TENANT_ID || "00000000-0000-0000-0000-000000000001";

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceKey);

const targets = [
  {
    full_name: "IT User",
    email: process.env.WORKSHOP_IT_EMAIL || "it@rajeshelec.local",
    password: process.env.WORKSHOP_IT_PASSWORD || "Admin@12345!",
    role: "IT"
  },
  {
    full_name: "Staff User",
    email: process.env.WORKSHOP_STAFF_EMAIL || "staff@rajeshelec.local",
    password: process.env.WORKSHOP_STAFF_PASSWORD || "Admin@12345!",
    role: "Staff"
  }
];

async function findAuthUserByEmail(email) {
  let page = 1;
  while (page <= 20) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const users = data?.users || [];
    const found = users.find((u) => String(u.email || "").toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (users.length < 200) break;
    page += 1;
  }
  return null;
}

async function ensureRoleUser(target) {
  let authUser = await findAuthUserByEmail(target.email);
  if (!authUser) {
    const { data, error } = await client.auth.admin.createUser({
      email: target.email,
      password: target.password,
      email_confirm: true,
      user_metadata: { full_name: target.full_name }
    });
    if (error) throw error;
    authUser = data.user;
  } else {
    const { error } = await client.auth.admin.updateUserById(authUser.id, {
      password: target.password,
      email_confirm: true,
      user_metadata: {
        ...(authUser.user_metadata || {}),
        full_name: target.full_name
      },
      ban_duration: "none"
    });
    if (error) throw error;
  }

  const { data: existing, error: existingError } = await client
    .from("users")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", target.email)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing?.id) {
    const { error: updateError } = await client
      .from("users")
      .update({
        auth_user_id: authUser.id,
        full_name: target.full_name,
        role: target.role,
        is_active: true,
        email: target.email,
        deactivated_at: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id);
    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await client
      .from("users")
      .insert({
        tenant_id: tenantId,
        auth_user_id: authUser.id,
        full_name: target.full_name,
        email: target.email,
        role: target.role,
        is_active: true
      });
    if (insertError) throw insertError;
  }

  return {
    email: target.email,
    role: target.role,
    auth_user_id: authUser.id,
    is_active: true
  };
}

try {
  const rows = [];
  for (const target of targets) {
    const ensured = await ensureRoleUser(target);
    rows.push(ensured);
  }

  console.log(JSON.stringify({
    setup: "PHASE8_ROLE_TEST_USERS_READY",
    tenant_id: tenantId,
    users: rows
  }, null, 2));
  process.exit(0);
} catch (error) {
  console.error(error?.message || error);
  process.exit(1);
}
