import {
  createDashboardUser,
  listDashboardUsers,
} from "@/lib/dashboardUsers";
import { getServerDashboardSession, requireAdmin } from "@/lib/session";

export async function GET() {
  const session = await getServerDashboardSession();
  const gate = requireAdmin(session);
  if (!gate.ok) return gate.response;

  try {
    const users = await listDashboardUsers();
    return Response.json({ users });
  } catch (error) {
    console.error("GET /api/dashboard/users", error);
    return Response.json({ error: "Failed to load users." }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerDashboardSession();
  const gate = requireAdmin(session);
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const user = await createDashboardUser(body);
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if (/required|already exists|at least/i.test(error.message)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("POST /api/dashboard/users", error);
    return Response.json({ error: "Failed to create user." }, { status: 500 });
  }
}
