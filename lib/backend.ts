const backendBaseUrl = process.env.BACKEND_BASE_URL || "http://localhost:8000";
const adminToken = process.env.ADMIN_API_TOKEN || "";

// Server-only: forwards to the admin portal API with the admin token.
export function backendFetch(path: string, init: RequestInit = {}) {
  return fetch(`${backendBaseUrl}/api${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": adminToken,
      ...init.headers
    }
  });
}
