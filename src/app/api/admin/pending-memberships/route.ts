import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/api/auth-middleware";

export async function GET(req: NextRequest) {
  return requireAdmin(req, async () => {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase env vars missing" },
        { status: 500 }
      );
    }

    try {
      // Fetch pending memberships
      const { data: memberships, error: membershipsError } = await supabaseAdmin
        .from("ladder_memberships")
        .select("id, ladder_id, user_id, status, requested_at")
        .eq("status", "pending")
        .order("requested_at", { ascending: false });

      if (membershipsError) throw membershipsError;

      if (!memberships || memberships.length === 0) {
        return NextResponse.json({ memberships: [] });
      }

      // Fetch ladder details
      const ladderIds = [...new Set(memberships.map(m => m.ladder_id))];
      const { data: ladders, error: laddersError } = await supabaseAdmin
        .from("ladders")
        .select("id, name")
        .in("id", ladderIds);

      if (laddersError) throw laddersError;

      // Fetch user details from public.users table
      const userIds = [...new Set(memberships.map(m => m.user_id))];
      const { data: users, error: usersError } = await supabaseAdmin
        .from("users")
        .select("id, email, full_name")
        .in("id", userIds);

      if (usersError) throw usersError;

      // Create lookup maps
      const ladderMap = new Map((ladders ?? []).map(l => [l.id, l]));
      const userMap = new Map((users ?? []).map(u => [u.id, u]));

      // Combine the data
      const enrichedMemberships = memberships.map(membership => ({
        ...membership,
        ladders: ladderMap.get(membership.ladder_id) ?? null,
        users: userMap.get(membership.user_id) ?? null,
      }));

      return NextResponse.json({ memberships: enrichedMemberships });
    } catch (error) {
      console.error("GET /api/admin/pending-memberships error:", error);
      return NextResponse.json(
        { error: "Failed to fetch pending memberships" },
        { status: 500 }
      );
    }
  });
}
