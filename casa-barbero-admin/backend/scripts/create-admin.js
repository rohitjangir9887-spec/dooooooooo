/**
 * One-time script: create the first admin user in Supabase Auth
 * and insert them into the admin_users table.
 *
 * Usage: node backend/scripts/create-admin.js
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN = {
  email: process.env.ADMIN_EMAIL || "miguel@casabarbero.ph",
  password: process.env.ADMIN_PASSWORD || "barbero2026",
  name: "Miguel Santos",
  role: "owner"
};

async function main() {
  // Create auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN.email,
    password: ADMIN.password,
    email_confirm: true
  });

  if (error) {
    console.error("Auth error:", error.message);
    process.exit(1);
  }

  const userId = data.user.id;
  console.log("Auth user created:", userId);

  // Insert into admin_users
  const { error: dbError } = await supabase.from("admin_users").upsert({
    id: userId,
    email: ADMIN.email,
    name: ADMIN.name,
    role: ADMIN.role,
    is_active: true
  });

  if (dbError) {
    console.error("DB error:", dbError.message);
    process.exit(1);
  }

  console.log(`Admin '${ADMIN.name}' (${ADMIN.email}) created successfully.`);
}

main();
