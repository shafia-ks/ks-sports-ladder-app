import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdmin() {
  const adminEmail = process.argv[2] || "admin@example.com";
  const adminPassword = process.argv[3] || "AdminPassword123!";
  const fullName = process.argv[4] || "Admin User";

  try {
    console.log(`Creating admin user with email: ${adminEmail}`);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return;
    }

    const userId = authData.user.id;
    console.log(`✓ Auth user created with ID: ${userId}`);

    // Create user profile
    const { error: profileError } = await supabase.from("users").insert({
      id: userId,
      email: adminEmail,
      full_name: fullName,
      role: "admin",
      gdpr_accepted: true,
      gdpr_accepted_at: new Date().toISOString(),
      sportsmanship_accepted: true,
      sportsmanship_accepted_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("Error creating user profile:", profileError);
      return;
    }

    console.log(`✓ Admin user profile created`);
    console.log(`\n✅ Admin account created successfully!`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`\n⚠️  Please change this password after first login!`);
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

seedAdmin().catch(console.error);
