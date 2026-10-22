import { backendFetch } from "@/lib/backend";
import { isValidEventKey } from "@/lib/links";

import { CheckInForm, type EventOption } from "../../check-in-form";
import { ScanPrompt } from "../../scan-prompt";

export const dynamic = "force-dynamic";

async function findEvent(slug: string): Promise<EventOption | null> {
  const res = await backendFetch(`/events/${slug}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(String(res.status));
  // Only the slug and name reach the browser.
  const { name } = await res.json();
  return { slug, name };
}

export default async function EventCheckInPage({
  params
}: {
  params: Promise<{ slug: string; key: string }>;
}) {
  const { slug, key } = await params;
  if (!isValidEventKey(slug, key)) {
    return <ScanPrompt message="This check-in link isn't valid. Scan the QR code at the event." />;
  }

  let event: EventOption | null;
  try {
    event = await findEvent(slug);
  } catch {
    return <ScanPrompt message="Check-in is unavailable right now. Please see an organizer." />;
  }
  if (!event) {
    return <ScanPrompt message="This event isn't open for check-in. Please see an organizer." />;
  }

  return <CheckInForm event={event} checkInKey={key} />;
}
