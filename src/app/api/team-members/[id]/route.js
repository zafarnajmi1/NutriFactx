import {
  deleteTeamMember,
  getTeamMemberById,
  updateTeamMember,
} from "@/lib/teamMembers";
import { deleteR2TeamImage } from "@/lib/r2";
import { getServerDashboardSession, requireAdmin } from "@/lib/session";

async function cleanupTeamImage(imageUrl) {
  if (!imageUrl) return;
  try {
    await deleteR2TeamImage(imageUrl);
  } catch (error) {
    console.error("Cloudflare team image cleanup", error);
  }
}

export async function PATCH(request, { params }) {
  const session = await getServerDashboardSession();
  const gate = requireAdmin(session);
  if (!gate.ok) return gate.response;

  try {
    const { id } = await params;
    const existing = await getTeamMemberById(id);
    if (!existing) {
      return Response.json({ error: "Team member not found." }, { status: 404 });
    }

    const body = await request.json();
    const member = await updateTeamMember(id, body);
    if (existing.image && existing.image !== member.image) {
      await cleanupTeamImage(existing.image);
    }

    return Response.json({ member });
  } catch (error) {
    if (/required/i.test(error.message)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("PATCH /api/team-members/[id]", error);
    return Response.json(
      { error: "Failed to update team member." },
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
    const existing = await getTeamMemberById(id);
    if (!existing) {
      return Response.json({ error: "Team member not found." }, { status: 404 });
    }

    const deleted = await deleteTeamMember(id);
    if (!deleted) {
      return Response.json({ error: "Team member not found." }, { status: 404 });
    }

    await cleanupTeamImage(deleted.image_url);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/team-members/[id]", error);
    return Response.json(
      { error: "Failed to delete team member." },
      { status: 500 },
    );
  }
}
