import { NextResponse, type NextRequest } from "next/server";

import { backendFetch } from "@/lib/backend";
import { isValidEventKey } from "@/lib/links";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const slug = typeof body?.event === "string" ? body.event : "";
  // Only someone who opened the event's QR link has its key.
  if (!/^[a-z0-9-]+$/.test(slug) || !isValidEventKey(slug, body?.key)) {
    return NextResponse.json(
      { message: "This check-in link isn't valid. Scan the QR code at the event." },
      { status: 403 }
    );
  }

  let res: Response;
  try {
    res = await backendFetch(`/events/${slug}/check-in`, {
      method: "POST",
      body: JSON.stringify({
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        walk_in: body.walk_in === true,
        session: typeof body.session === "string" ? body.session : null
      })
    });
  } catch {
    return NextResponse.json(
      { message: "Check-in is unavailable right now. Please see an organizer." },
      { status: 502 }
    );
  }

  const data = await res.json().catch(() => ({}));
  if (res.ok) return NextResponse.json(data);

  // FastAPI errors are either {code, message} or pydantic validation lists.
  const detail = data?.detail;
  const message =
    typeof detail?.message === "string"
      ? detail.message
      : "Please check your name and email and try again.";
  // A training walk-in offer lists the sessions that still have space.
  return NextResponse.json(
    { message, code: detail?.code, sessions: detail?.sessions ?? [] },
    { status: res.status }
  );
}
