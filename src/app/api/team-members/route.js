import {
  createTeamMember,
  listTeamMembers,
} from "@/lib/teamMembers";
import { getServerDashboardSession, requireAdmin } from "@/lib/session";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get("public") === "1";
    const members = await listTeamMembers({ activeOnly: publicOnly });
    return Response.json({ members });
  } catch (error) {
    console.error("GET /api/team-members", error);
    return Response.json(
      { error: "Failed to load team members." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const session = await getServerDashboardSession();
  const gate = requireAdmin(session);
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const member = await createTeamMember(body);
    return Response.json({ member }, { status: 201 });
  } catch (error) {
    if (/required/i.test(error.message)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("POST /api/team-members", error);
    return Response.json(
      { error: "Failed to create team member." },
      { status: 500 },
    );
  }
}
