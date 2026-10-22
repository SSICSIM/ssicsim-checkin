import { NextResponse, type NextRequest } from "next/server";

import { backendFetch } from "@/lib/backend";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const slug = typeof body?.event === "string" ? body.event : "";
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ message: "Please choose an event." }, { status: 400 });
  }

  let res: Response;
  try {
    res = await backendFetch(`/events/${slug}/check-in`, {
      method: "POST",
      body: JSON.stringify({
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email
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
  return NextResponse.json({ message }, { status: res.status });
}
