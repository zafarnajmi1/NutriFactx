import {
  listSiteContentPages,
  savePageContent,
} from "@/lib/sitePageContent";
import { getServerDashboardSession, requireAdmin } from "@/lib/session";

export async function GET() {
  const session = await getServerDashboardSession();
  const gate = requireAdmin(session);
  if (!gate.ok) return gate.response;

  try {
    const pages = await listSiteContentPages();
    return Response.json({ pages });
  } catch (error) {
    console.error("GET /api/site-pages", error);
    return Response.json({ error: "Failed to load pages." }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerDashboardSession();
  const gate = requireAdmin(session);
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const pageKey = String(body.pageKey || "").trim();
    if (!pageKey) {
      return Response.json({ error: "Page key is required." }, { status: 400 });
    }

    const content = await savePageContent(pageKey, body.content || {});
    return Response.json({ content });
  } catch (error) {
    if (/required|Unknown page/i.test(error.message)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("PUT /api/site-pages", error);
    return Response.json({ error: "Failed to save page." }, { status: 500 });
  }
}
