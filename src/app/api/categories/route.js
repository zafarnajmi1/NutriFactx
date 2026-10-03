import {
  createCategory,
  deleteCategory,
  listCategoryNames,
  renameCategory,
} from "@/lib/categories";
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

export async function PATCH(request) {
  const session = await getServerDashboardSession();
  const gate = requireDashboardSession(session);
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const name = await renameCategory(body.name, body.newName);
    return Response.json({ name });
  } catch (error) {
    if (/choose a|enter a|already exists|under 60|valid category/i.test(error.message || "")) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("PATCH /api/categories", error);
    return Response.json({ error: "Failed to edit category." }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getServerDashboardSession();
  const gate = requireDashboardSession(session);
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json().catch(() => ({}));
    const result = await deleteCategory(body.name);
    return Response.json(result);
  } catch (error) {
    if (/choose a|keep at least/i.test(error.message || "")) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("DELETE /api/categories", error);
    return Response.json({ error: "Failed to delete category." }, { status: 500 });
  }
}
