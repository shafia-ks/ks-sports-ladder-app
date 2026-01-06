import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function confirmUser() {
  const email = process.argv[2] || "khaderwiz@outlook.com";

  try {
    console.log(`Confirming email for: ${email}`);

    // Get user by email
    const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();

    if (getUserError) {
      console.error("Error listing users:", getUserError);
      return;
    }

    const user = users?.users.find((u) => u.email === email);

    if (!user) {
      console.error(`User with email ${email} not found`);
      return;
    }

    // Confirm email
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });

    if (updateError) {
      console.error("Error confirming email:", updateError);
      return;
    }

    console.log(`✅ Email confirmed successfully!`);
    console.log(`Email: ${email}`);
    console.log(`User ID: ${user.id}`);
    console.log(`\n✓ User can now log in without email verification.`);
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

confirmUser().catch(console.error);
