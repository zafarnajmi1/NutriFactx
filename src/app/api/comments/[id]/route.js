import {
  deleteComment,
  updateComment,
} from "@/lib/comments";
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
    const isAdmin = session.role === "admin";

    const updated = await updateComment(
      id,
      {
        content: body.content ?? body.text,
        status: body.status,
      },
      { canChangeStatus: isAdmin },
    );

    if (!updated) {
      return Response.json({ error: "Comment not found" }, { status: 404 });
    }

    return Response.json({ comment: updated });
  } catch (error) {
    console.error("PATCH /api/comments/[id]", error);
    return Response.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const session = await getServerDashboardSession();
  const gate = requireAdmin(session);
  if (!gate.ok) return gate.response;

  try {
    const { id } = await params;
    const ok = await deleteComment(id);
    if (!ok) {
      return Response.json({ error: "Comment not found" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/comments/[id]", error);
    return Response.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
