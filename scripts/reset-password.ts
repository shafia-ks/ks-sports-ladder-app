import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetPassword() {
  const email = process.argv[2] || "khaderwiz@outlook.com";
  const newPassword = process.argv[3] || "TempPassword123!";

  try {
    console.log(`Resetting password for: ${email}`);

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

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      return;
    }

    console.log(`✅ Password reset successfully!`);
    console.log(`Email: ${email}`);
    console.log(`New Password: ${newPassword}`);
    console.log(`\n⚠️  User should change password after login!`);
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

resetPassword().catch(console.error);
