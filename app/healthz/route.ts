import { NextResponse } from "next/server";

// Unauthenticated liveness probe for uptime checks and the conference
// keep-alive pinger. Rendered per request (not cached at build time) so it
// shows the app is actually serving; it doesn't call the admin backend.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } }
  );
}
