import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/supabase/audit";

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 } as ResponseInit);
  }

  const { data, error } = await supabaseAdmin
    .from("seasons")
    .select(`
      id,
      ladder_id,
      name,
      start_date,
      end_date,
      archived,
      created_at,
      ladders(name)
    `)
    .order("start_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 } as ResponseInit);
  }

  return NextResponse.json({ seasons: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 } as ResponseInit);
  }

  try {
    const body = await req.json();
    const { ladder_id, name, start_date, end_date } = body;

    const { data, error } = await supabaseAdmin
      .from("seasons")
      .insert({
        ladder_id,
        name,
        start_date,
        end_date,
        archived: false,
      })
      .select()
      .single();

    if (error) throw error;

    await createAuditLog({
      entityType: "season",
      entityId: data.id,
      action: `Season created: ${name}`,
      performedBy: "system",
    });

    return NextResponse.json({ season: data }, { status: 201 } as ResponseInit);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 } as ResponseInit);
  }
}
