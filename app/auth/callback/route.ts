import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "../../lib/auth/server";

// Keep the earlier callback route safe; Firebase email templates use /auth/action.
export async function GET(request: NextRequest) {
  const destination = authConfig()?.origin ?? new URL(request.url).origin;
  return NextResponse.redirect(`${destination}/?auth=link-error`, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
}
