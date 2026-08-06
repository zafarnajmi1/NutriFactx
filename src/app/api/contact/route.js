import {
  createContactMessage,
  listContactMessages,
} from "@/lib/contactMessages";
import {
  getServerDashboardSession,
  requireDashboardSession,
} from "@/lib/session";

/** Dashboard: list contact messages */
export async function GET() {
  const session = await getServerDashboardSession();
  const gate = requireDashboardSession(session);
  if (!gate.ok) return gate.response;

  try {
    const messages = await listContactMessages();
    return Response.json({ messages });
  } catch (error) {
    console.error("GET /api/contact", error);
    return Response.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

/** Public: submit contact form */
export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const topic = String(body.topic || "Other").trim();
    const message = String(body.message || "").trim();
    const consent = Boolean(body.consent);

    if (!name || !email || !message) {
      return Response.json(
        { error: "Name, email, and message are required." },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    if (!consent) {
      return Response.json(
        { error: "Please agree to be contacted before sending." },
        { status: 400 },
      );
    }

    const saved = await createContactMessage({ name, email, topic, message });
    return Response.json(
      {
        ok: true,
        message: "Message sent. We’ll get back to you soon.",
        item: saved,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/contact", error);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}
