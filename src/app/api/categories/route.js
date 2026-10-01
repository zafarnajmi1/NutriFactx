import { createCategory, listCategoryNames } from "@/lib/categories";
import {
  getServerDashboardSession,
  requireDashboardSession,
} from "@/lib/session";

export async function GET() {
  const session = await getServerDashboardSession();
  const gate = requireDashboardSession(session);
  if (!gate.ok) return gate.response;

  try {
    const categories = await listCategoryNames();
    return Response.json({ categories });
  } catch (error) {
    console.error("GET /api/categories", error);
    return Response.json({ error: "Failed to load categories." }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerDashboardSession();
  const gate = requireDashboardSession(session);
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const name = await createCategory(body.name);
    return Response.json({ name }, { status: 201 });
  } catch (error) {
    if (/enter a|already exists|under 60/i.test(error.message || "")) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("POST /api/categories", error);
    return Response.json({ error: "Failed to add category." }, { status: 500 });
  }
}
