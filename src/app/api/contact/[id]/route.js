import {
  deleteContactMessage,
  updateContactMessage,
} from "@/lib/contactMessages";
import {
  getServerDashboardSession,
  requireAdmin,
  requireDashboardSession,
} from "@/lib/session";

export async function PATCH(request, { params }) {
  const session = await getServerDashboardSession();
  const gate = requireDashboardSession(session);
  if (!gate.ok) return gate.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateContactMessage(id, {
      status: body.status,
      message: body.message ?? body.text,
    });

    if (!updated) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    return Response.json({ message: updated });
  } catch (error) {
    console.error("PATCH /api/contact/[id]", error);
    return Response.json({ error: "Failed to update message" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const session = await getServerDashboardSession();
  const gate = requireAdmin(session);
  if (!gate.ok) return gate.response;

  try {
    const { id } = await params;
    const ok = await deleteContactMessage(id);
    if (!ok) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/contact/[id]", error);
    return Response.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
