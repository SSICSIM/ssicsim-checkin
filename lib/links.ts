import { createHmac, timingSafeEqual } from "node:crypto";

const linkSecret = process.env.CHECKIN_LINK_SECRET || "";

// Server-only: the key in an event's QR link. Without the secret nobody can
// build a working link from just the event slug.
function eventKey(slug: string) {
  return createHmac("sha256", linkSecret).update(slug).digest("base64url").slice(0, 16);
}

export function isValidEventKey(slug: string, key: unknown) {
  if (!linkSecret || typeof key !== "string") return false;
  const expected = Buffer.from(eventKey(slug));
  const given = Buffer.from(key);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
