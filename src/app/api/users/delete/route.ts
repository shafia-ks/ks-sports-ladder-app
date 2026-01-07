import { NextRequest, NextResponse } from "next/server";

/**
 * Delete a user account (placeholder)
 * Not implemented to avoid accidental data loss without a full cascade plan.
 */
export async function DELETE(_request: NextRequest) {
  return NextResponse.json(
    { error: "Account deletion not implemented. Define cascade plan first." },
    { status: 501 }
  );
}
