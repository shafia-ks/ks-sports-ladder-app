import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const userId = formData.get("userId") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        // Verify user is admin or organizer of this ladder
        const { data: userProfile } = await supabaseAdmin
            .from("users")
            .select("role")
            .eq("id", userId)
            .single();

        const { data: isOrganizer } = await supabaseAdmin
            .from("ladder_leaders")
            .select("id")
            .eq("ladder_id", params.id)
            .eq("user_id", userId)
            .single();

        if (userProfile?.role !== "admin" && !isOrganizer) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Create Supabase client for storage operations
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${params.id}-${Date.now()}.${fileExt}`;
        const filePath = `ladder-profiles/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("public")
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from("public")
            .getPublicUrl(filePath);

        // Update ladder with new profile picture URL
        const { error: updateError } = await supabaseAdmin
            .from("ladders")
            .update({ profile_picture_url: publicUrl })
            .eq("id", params.id);

        if (updateError) {
            console.error("Update error:", updateError);
            return NextResponse.json({ error: "Failed to update ladder" }, { status: 500 });
        }

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error("Profile picture upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload profile picture" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        // Verify user is admin or organizer
        const { data: userProfile } = await supabaseAdmin
            .from("users")
            .select("role")
            .eq("id", userId)
            .single();

        const { data: isOrganizer } = await supabaseAdmin
            .from("ladder_leaders")
            .select("id")
            .eq("ladder_id", params.id)
            .eq("user_id", userId)
            .single();

        if (userProfile?.role !== "admin" && !isOrganizer) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Get current profile picture URL to delete from storage
        const { data: ladder } = await supabaseAdmin
            .from("ladders")
            .select("profile_picture_url")
            .eq("id", params.id)
            .single();

        // Update ladder to remove profile picture
        const { error: updateError } = await supabaseAdmin
            .from("ladders")
            .update({ profile_picture_url: null })
            .eq("id", params.id);

        if (updateError) {
            return NextResponse.json({ error: "Failed to update ladder" }, { status: 500 });
        }

        // Optionally delete from storage (extract path from URL)
        if (ladder?.profile_picture_url) {
            try {
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                );

                const url = new URL(ladder.profile_picture_url);
                const pathParts = url.pathname.split("/public/");
                if (pathParts.length > 1) {
                    const filePath = pathParts[1];
                    await supabase.storage.from("public").remove([filePath]);
                }
            } catch (err) {
                console.error("Failed to delete file from storage:", err);
                // Don't fail the request if storage deletion fails
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Profile picture delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete profile picture" },
            { status: 500 }
        );
    }
}
