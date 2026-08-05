/**
 * One-time script: update an existing admin user's password in Supabase Auth.
 *
 * Usage: node backend/scripts/reset-admin-password.js <new-password> [email]
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const newPassword = process.argv[2];
const email = process.argv[3] || process.env.ADMIN_EMAIL || "miguel@casabarbero.ph";

if (!newPassword) {
  console.error("Usage: node backend/scripts/reset-admin-password.js <new-password> [email]");
  process.exit(1);
}

async function main() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Lookup error:", error.message);
    process.exit(1);
  }

  const user = data.users.find((u) => u.email === email);
  if (!user) {
    console.error(`No auth user found with email ${email}`);
    process.exit(1);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword
  });

  if (updateError) {
    console.error("Update error:", updateError.message);
    process.exit(1);
  }

  console.log(`Password updated for ${email}`);
}

main();
