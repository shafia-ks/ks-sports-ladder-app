import { createClient, User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfill() {
  console.log("🔍 Fetching auth users...");
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (authError) {
    console.error("Failed to list auth users:", authError);
    process.exit(1);
  }

  const users = authUsers?.users ?? [];
  console.log(`Found ${users.length} auth users`);

  console.log("🔍 Fetching existing profile ids...");
  const { data: profiles, error: profileError } = await supabase
    .from("users")
    .select("id");

  if (profileError) {
    console.error("Failed to fetch existing profiles:", profileError);
    process.exit(1);
  }

  const existingIds = new Set((profiles ?? []).map((p) => p.id as string));
  const missing = users.filter((u) => !existingIds.has(u.id));

  if (missing.length === 0) {
    console.log("✅ No missing profiles. Nothing to do.");
    return;
  }

  console.log(`🛠 Creating ${missing.length} missing profile(s)...`);

  const rows = missing.map((u: User) => {
    const meta = (u.user_metadata as Record<string, unknown>) || {};
    const firstName = typeof meta.first_name === "string" ? meta.first_name : "";
    const lastName = typeof meta.last_name === "string" ? meta.last_name : "";
    const fullNameMeta = typeof meta.full_name === "string" ? meta.full_name : "";
    const fullName = fullNameMeta || [firstName, lastName].filter(Boolean).join(" ");

    return {
      id: u.id,
      email: u.email,
      full_name: fullName || u.email || null,
      role: "player",
      gdpr_accepted: false,
      sportsmanship_accepted: false,
      created_at: u.created_at,
    };
  });

  const { error: insertError } = await supabase.from("users").insert(rows);
  if (insertError) {
    console.error("Failed to insert missing profiles:", insertError);
    process.exit(1);
  }

  console.log("✅ Backfill complete. Inserted:");
  rows.forEach((row) => {
    console.log(`- ${row.email} (${row.id})`);
  });
}

backfill().catch((err) => {
  console.error("Unexpected error during backfill:", err);
  process.exit(1);
});
