import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

type AuthMetadata = Record<string, unknown> & {
  full_name?: string;
  fullName?: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
};

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  try {
    // 1) Read auth users (source of truth for who exists)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (authError) {
      console.error("listUsers error", authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const authUsers = authData?.users ?? [];

    // Build map of disabled status from auth app_metadata
    const disabledMap = new Map<string, boolean>(
      authUsers.map((u) => [u.id, !!(u.app_metadata as any)?.disabled])
    );

    // 2) Fetch profiles we already have
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, created_at, gdpr_accepted, sportsmanship_accepted");

    if (profilesError) {
      console.error("profiles fetch error", profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    // 3) Find auth users missing profiles
    const missing = authUsers.filter((u) => !profileMap.has(u.id));

    if (missing.length > 0) {
      const rows = missing.map((u) => {
        const meta = (u.user_metadata || {}) as AuthMetadata;
        const firstName = meta.first_name || meta.firstName || "";
        const lastName = meta.last_name || meta.lastName || "";
        const fullName = meta.full_name || meta.fullName || `${firstName} ${lastName}`.trim();

        return {
          id: u.id,
          email: u.email,
          full_name: fullName || u.email || null,
          role: "player",
          gdpr_accepted: meta.gdpr_accepted || false,
          sportsmanship_accepted: meta.sportsmanship_accepted || false,
          created_at: u.created_at,
        };
      });

      const { error: insertError } = await supabaseAdmin.from("users").insert(rows);
      if (insertError) {
        console.error("profile insert error", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // Merge inserted rows into map
      rows.forEach((row) => profileMap.set(row.id, row));
    }

    // 4) Return consolidated profiles sorted by created_at desc
    const users = Array.from(profileMap.values())
      .map((p) => ({ ...p, disabled: disabledMap.get(p.id) || false }))
      .sort((a, b) => {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate;
      });

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error("GET /api/users unexpected error", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
