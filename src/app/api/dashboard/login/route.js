import { tryAuthenticateDashboardUser } from "@/lib/dashboardUsers";
import { DASHBOARD_USERS } from "@/lib/dashboardAuth";

function fallbackLogin(email, password) {
  const normalized = String(email || "").trim().toLowerCase();
  const pass = String(password || "");
  const found = DASHBOARD_USERS.find(
    (user) => user.email.toLowerCase() === normalized && user.password === pass,
  );
  if (!found) return null;
  return {
    id: found.id,
    name: found.name,
    email: found.email,
    role: found.role,
    title: found.title,
    initials: found.initials,
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    let user = await tryAuthenticateDashboardUser(email, password);
    if (!user) {
      user = fallbackLogin(email, password);
    }

    if (!user) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "manager") {
      return Response.json(
        { error: "Only admin or manager accounts can sign in." },
        { status: 403 },
      );
    }

    return Response.json({ user });
  } catch (error) {
    console.error("POST /api/dashboard/login", error);
    return Response.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
