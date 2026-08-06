import {
  getServerDashboardSession,
  requireDashboardSession,
} from "@/lib/session";
import {
  getAnalyticsData,
  getTrafficChartData,
} from "@/lib/realAnalyticsStats";

export async function GET(request) {
  const session = await getServerDashboardSession();
  const gate = requireDashboardSession(session);
  if (!gate.ok) return gate.response;

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";
    const only = searchParams.get("only");

    if (only === "traffic") {
      const traffic = await getTrafficChartData();
      return Response.json({ traffic });
    }

    const data = await getAnalyticsData(range);
    return Response.json(data);
  } catch (error) {
    console.error("GET /api/dashboard/analytics", error);
    return Response.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
