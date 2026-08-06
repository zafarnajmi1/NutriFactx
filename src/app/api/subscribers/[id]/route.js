import { deleteSubscriber, updateSubscriber } from "@/lib/subscribers";
import { getServerDashboardSession, requireAdmin } from "@/lib/session";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(request, { params }) {
  const session = await getServerDashboardSession();
  const gate = requireAdmin(session);
  if (!gate.ok) return gate.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();

    if (!name || !email) {
      return Response.json(
        { error: "Name and email are required." },
        { status: 400 },
      );
    }
    if (!EMAIL_PATTERN.test(email)) {
      return Response.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    const subscriber = await updateSubscriber(id, {
      ...body,
      name,
      email,
    });
    if (!subscriber) {
      return Response.json({ error: "Subscriber not found." }, { status: 404 });
    }
    return Response.json({ subscriber });
  } catch (error) {
    if (error?.code === "23505") {
      return Response.json(
        { error: "That email address is already subscribed." },
        { status: 409 },
      );
    }
    console.error("PATCH /api/subscribers/[id]", error);
    return Response.json(
      { error: "Failed to update subscriber." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request, { params }) {
  const session = await getServerDashboardSession();
  const gate = requireAdmin(session);
  if (!gate.ok) return gate.response;

  try {
    const { id } = await params;
    if (!(await deleteSubscriber(id))) {
      return Response.json({ error: "Subscriber not found." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/subscribers/[id]", error);
    return Response.json(
      { error: "Failed to delete subscriber." },
      { status: 500 },
    );
  }
}
