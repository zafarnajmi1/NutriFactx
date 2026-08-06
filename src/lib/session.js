import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./dashboardAuth";

/** Read dashboard session from request cookie (server / route handlers). */
export async function getServerDashboardSession() {
  try {
    const store = await cookies();
    const raw = store.get(SESSION_COOKIE)?.value;
    if (!raw) return null;
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (parsed?.email && (parsed.role === "admin" || parsed.role === "manager")) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function requireDashboardSession(session) {
  if (!session) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true };
}

export function requireAdmin(session) {
  if (!session) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.role !== "admin") {
    return { ok: false, response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true };
}
