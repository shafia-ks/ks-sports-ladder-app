import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 } as ResponseInit);
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "rankings";
  const ladderId = searchParams.get("ladderId");

  try {
    if (type === "rankings" && ladderId) {
      // Export ladder rankings
      const { data: members, error } = await supabaseAdmin
        .from("ladder_memberships")
        .select(`
          current_rank,
          status,
          accepted_at,
          users(full_name, email)
        `)
        .eq("ladder_id", ladderId)
        .eq("status", "active")
        .order("current_rank", { ascending: true });

      if (error) throw error;

      const csv = [
        "Rank,Player Name,Email,Status,Joined Date",
        ...(members || []).map((m: any) =>
          `${m.current_rank},"${m.users?.full_name || ""}","${m.users?.email || ""}","${m.status}","${new Date(m.accepted_at).toLocaleDateString()}"`
        ),
      ].join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="ladder-rankings-${ladderId}.csv"`,
        },
      });
    }

    if (type === "matches" && ladderId) {
      // Export match history
      const { data: matches, error } = await supabaseAdmin
        .from("matches")
        .select(`
          played_at,
          status,
          set_scores,
          player1:users!matches_player1_id_fkey(full_name),
          player2:users!matches_player2_id_fkey(full_name),
          winner:users!matches_winner_id_fkey(full_name)
        `)
        .eq("ladder_id", ladderId)
        .order("played_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      const csv = [
        "Date,Player 1,Player 2,Winner,Score,Status",
        ...(matches || []).map((m: any) =>
          `"${new Date(m.played_at).toLocaleDateString()}","${m.player1?.full_name || ""}","${m.player2?.full_name || ""}","${m.winner?.full_name || ""}","${JSON.stringify(m.set_scores || [])}","${m.status}"`
        ),
      ].join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="match-history-${ladderId}.csv"`,
        },
      });
    }

    if (type === "audit-logs") {
      // Export audit logs
      const { data: logs, error } = await supabaseAdmin
        .from("audit_logs")
        .select("created_at, entity_type, entity_id, action, performed_by")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;

      const csv = [
        "Timestamp,Entity Type,Entity ID,Action,Performed By",
        ...(logs || []).map((l: any) =>
          `"${new Date(l.created_at).toLocaleString()}","${l.entity_type}","${l.entity_id}","${l.action}","${l.performed_by || "System"}"`
        ),
      ].join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=\"audit-logs.csv\"",
        },
      });
    }

    return NextResponse.json({ error: "Invalid export type" }, { status: 400 } as ResponseInit);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 } as ResponseInit);
  }
}
