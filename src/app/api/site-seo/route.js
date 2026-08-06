import {
  getSiteSeo,
  isValidSiteSeoPage,
  listSiteSeoPages,
  saveSiteSeo,
} from "@/lib/siteSeo";
import { getServerDashboardSession, requireAdmin } from "@/lib/session";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = String(searchParams.get("page") || "").trim();

    if (page) {
      if (!isValidSiteSeoPage(page)) {
        return Response.json({ error: "Unknown page." }, { status: 400 });
      }
      return Response.json({ seo: await getSiteSeo(page) });
    }

    return Response.json({ pages: await listSiteSeoPages() });
  } catch (error) {
    console.error("GET /api/site-seo", error);
    return Response.json(
      { error: "Failed to load SEO settings." },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  const session = await getServerDashboardSession();
  const gate = requireAdmin(session);
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const pageKey = String(body.pageKey || "").trim();
    if (!isValidSiteSeoPage(pageKey)) {
      return Response.json({ error: "Unknown page." }, { status: 400 });
    }

    const seo = await saveSiteSeo(pageKey, body.seo || body);
    return Response.json({ ok: true, seo });
  } catch (error) {
    if (error instanceof SyntaxError || /Unknown page/i.test(error.message)) {
      return Response.json(
        { error: error.message || "Invalid SEO payload." },
        { status: 400 },
      );
    }
    console.error("PUT /api/site-seo", error);
    return Response.json(
      { error: "Failed to save SEO settings." },
      { status: 500 },
    );
  }
}
