import {
  deleteDashboardUser,
  getDashboardUserById,
  updateDashboardUser,
} from "@/lib/dashboardUsers";
import { getServerDashboardSession, requireAdmin } from "@/lib/session";

export async function PATCH(request, { params }) {
  const session = await getServerDashboardSession();
  const gate = requireAdmin(session);
  if (!gate.ok) return gate.response;

  const { id: rawId } = await params;
  const id = String(rawId || "").trim();
  if (!id) {
    return Response.json({ error: "User id is required." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const user = await updateDashboardUser(id, body);
    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }
    return Response.json({ user });
  } catch (error) {
    if (/required|already exists|at least/i.test(error.message)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("PATCH /api/dashboard/users/[id]", error);
    return Response.json({ error: "Failed to update user." }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const session = await getServerDashboardSession();
  const gate = requireAdmin(session);
  if (!gate.ok) return gate.response;

  const { id: rawId } = await params;
  const id = String(rawId || "").trim();
  if (!id) {
    return Response.json({ error: "User id is required." }, { status: 400 });
  }

  try {
    const existing = await getDashboardUserById(id);
    if (!existing) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    if (
      String(session.email || "").toLowerCase() ===
      String(existing.email).toLowerCase()
    ) {
      return Response.json(
        { error: "You cannot remove your own account." },
        { status: 400 },
      );
    }

    const removed = await deleteDashboardUser(id);
    if (!removed) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/dashboard/users/[id]", error);
    return Response.json({ error: "Failed to remove user." }, { status: 500 });
  }
}
