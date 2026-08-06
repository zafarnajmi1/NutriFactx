import { listSubscribers } from "@/lib/subscribers";
import { getServerDashboardSession, requireAdmin } from "@/lib/session";

export async function GET() {
  const session = await getServerDashboardSession();
  const gate = requireAdmin(session);
  if (!gate.ok) return gate.response;

  try {
    return Response.json({ subscribers: await listSubscribers() });
  } catch (error) {
    console.error("GET /api/subscribers", error);
    return Response.json(
      { error: "Failed to load subscribers." },
      { status: 500 },
    );
  }
}
