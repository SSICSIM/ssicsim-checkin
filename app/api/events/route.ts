import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/backend";

// Only the slug and name are exposed publicly.
export async function GET() {
  try {
    const res = await backendFetch("/events");
    if (!res.ok) throw new Error(String(res.status));
    const events: { slug: string; name: string }[] = await res.json();
    return NextResponse.json(events.map(({ slug, name }) => ({ slug, name })));
  } catch {
    return NextResponse.json({ message: "Couldn't load events." }, { status: 502 });
  }
}
