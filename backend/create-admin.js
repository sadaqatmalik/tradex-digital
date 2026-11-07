
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");
const { hashPassword } = require("./adminAuth");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
async function createAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  // Password exactly 6 numeric digits hona chahiye
  if (!email || !password || !/^\d{6}$/.test(password)) {
    throw new Error(
      "Email required hai aur password exactly 6 digits ka hona chahiye."
    );
  }

  const password_hash = await hashPassword(password);

  const { data, error } = await supabase
    .from("admin_accounts")
    .insert({
      email,
      password_hash,
      role: "main_admin",
      is_active: true
    })
    .select("id, email, role")
    .single();

  if (error) throw error;

  console.log("Main Admin account created successfully.");
  console.log("Admin email:", data.email);
  console.log("Role:", data.role);
}

createAdmin()
  .catch(error => {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  });