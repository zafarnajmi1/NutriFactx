import {
  isAnalyticsBot,
  trackPageView,
  updatePageEngagement,
} from "@/lib/analytics";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const userAgent = request.headers.get("user-agent") || "";
    if (isAnalyticsBot(userAgent)) {
      return Response.json({ ok: true, tracked: false }, { status: 202 });
    }

    const body = await request.json();
    const context = {
      userAgent,
      siteHost:
        request.headers.get("x-forwarded-host") ||
        request.headers.get("host") ||
        "",
      countryCode:
        request.headers.get("cf-ipcountry") ||
        request.headers.get("x-vercel-ip-country") ||
        "",
    };

    const result =
      body.type === "engagement"
        ? await updatePageEngagement(body)
        : await trackPageView(body, context);

    return Response.json({ ok: true, ...result }, { status: 202 });
  } catch (error) {
    console.error("POST /api/analytics", error);
    return Response.json({ error: "Analytics event failed" }, { status: 500 });
  }
}
