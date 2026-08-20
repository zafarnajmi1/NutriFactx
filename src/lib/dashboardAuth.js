const SESSION_COOKIE = "nf_dashboard_session";
const SESSION_KEY = "nf_dashboard_session";

/** Demo accounts — UI auth only (replace with real auth later). */
export const DASHBOARD_USERS = [
  {
    id: "m1",
    name: "Admin",
    email: "admin@nutrifactx.com",
    password: "admin1234",
    role: "admin",
    title: "Admin",
    initials: "AD",
  },
  {
    id: "m2",
    name: "Bilal Ahmed",
    email: "bilal@nutrifactx.com",
    password: "manager123",
    role: "manager",
    title: "Manager",
    initials: "BA",
  },
  {
    id: "m3",
    name: "Hina Noor",
    email: "hina@nutrifactx.com",
    password: "manager123",
    role: "manager",
    title: "Manager",
    initials: "HN",
  },
];

function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.title,
    initials: user.initials,
  };
}

function writeCookie(value) {
  if (typeof document === "undefined") return;
  const encoded = encodeURIComponent(value);
  document.cookie = `${SESSION_COOKIE}=${encoded}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

function clearCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function loginDashboardUser(email, password) {
  const normalized = String(email || "").trim().toLowerCase();
  const pass = String(password || "");
  const found = DASHBOARD_USERS.find(
    (user) => user.email.toLowerCase() === normalized && user.password === pass,
  );

  if (!found) {
    return { ok: false, error: "Invalid email or password." };
  }

  if (found.role !== "admin" && found.role !== "manager") {
    return { ok: false, error: "Only admin or manager accounts can sign in." };
  }

  const session = toPublicUser(found);
  const payload = JSON.stringify(session);

  try {
    window.localStorage.setItem(SESSION_KEY, payload);
  } catch {
    /* ignore storage errors */
  }
  writeCookie(payload);

  return { ok: true, user: session };
}

export function setDashboardSession(user) {
  const session = toPublicUser(user);
  if (!session) {
    return { ok: false, error: "Invalid session user." };
  }

  const payload = JSON.stringify(session);
  try {
    window.localStorage.setItem(SESSION_KEY, payload);
  } catch {
    /* ignore */
  }
  writeCookie(payload);
  return { ok: true, user: session };
}

export async function loginDashboardUserFromApi(email, password) {
  try {
    const response = await fetch("/api/dashboard/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, error: data.error || "Invalid email or password." };
    }
    return setDashboardSession(data.user);
  } catch {
    return loginDashboardUser(email, password);
  }
}

export function logoutDashboardUser() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  clearCookie();
}

export function getDashboardSession() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.email && (parsed.role === "admin" || parsed.role === "manager")) {
        return parsed;
      }
    }
  } catch {
    /* fall through to cookie */
  }

  try {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${SESSION_COOKIE}=`));
    if (!match) return null;
    const parsed = JSON.parse(decodeURIComponent(match.split("=").slice(1).join("=")));
    if (parsed?.email && (parsed.role === "admin" || parsed.role === "manager")) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

/** Paths managers are allowed to open. */
export const MANAGER_ALLOWED_PREFIXES = [
  "/dashboard/articles",
  "/dashboard/comments",
];

export function isManagerAllowedPath(pathname) {
  const path = String(pathname || "");
  return MANAGER_ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function getDefaultDashboardPath(role) {
  return role === "manager" ? "/dashboard/articles" : "/dashboard";
}

export { SESSION_COOKIE };
