import { getSocialLinks, saveSocialLinks, SOCIAL_PLATFORMS } from "@/lib/socialLinks";
import { getServerDashboardSession, requireAdmin } from "@/lib/session";

function normalizeLinks(value) {
  const links = {};
  for (const platform of SOCIAL_PLATFORMS) {
    const url = String(value?.[platform] || "").trim();
    if (!url) {
      links[platform] = "";
      continue;
    }
    if (url.length > 500) {
      throw new Error(`${platform} URL is too long.`);
    }
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`Enter a valid URL for ${platform}.`);
    }
    if (parsed.protocol !== "https:") {
      throw new Error(`${platform} URL must use HTTPS.`);
    }
    links[platform] = parsed.toString();
  }
  return links;
}

export async function GET() {
  try {
    return Response.json({ links: await getSocialLinks() });
  } catch (error) {
    console.error("GET /api/social-links", error);
    return Response.json(
      { error: "Failed to load social links." },
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
    const links = normalizeLinks(body.links);
    return Response.json({ ok: true, links: await saveSocialLinks(links) });
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      /URL|HTTPS|too long/i.test(error.message)
    ) {
      return Response.json(
        { error: error.message || "Invalid social links." },
        { status: 400 },
      );
    }
    console.error("PUT /api/social-links", error);
    return Response.json(
      { error: "Failed to save social links." },
      { status: 500 },
    );
  }
}
