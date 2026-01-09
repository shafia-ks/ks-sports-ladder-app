import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const limitParam = searchParams.get("limit");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  let query = supabaseAdmin
    .from("notifications")
    .select("id, user_id, type, message, link, read, created_at, metadata")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get unread count
  const { count } = await supabaseAdmin
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  return NextResponse.json({
    notifications: data ?? [],
    unreadCount: count || 0
  });
}

export async function PATCH(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  const json = await req.json();
  const { notificationId, notificationIds, markAllAsRead, userId } = json;

  // Mark all as read for a user
  if (markAllAsRead && userId) {
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "All notifications marked as read" });
  }

  // Mark specific notification(s) as read
  if (notificationId) {
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (notificationIds && Array.isArray(notificationIds)) {
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .in("id", notificationIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
