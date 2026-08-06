"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const VISITOR_KEY = "nf_analytics_visitor";
const SESSION_KEY = "nf_analytics_session";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const HEARTBEAT_MS = 15 * 1000;
const recentPageKeys = new Map();

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getPageKey(pathname) {
  const now = Date.now();
  const recent = recentPageKeys.get(pathname);
  if (recent && now - recent.createdAt < 1_000) return recent.pageKey;

  const pageKey = createId();
  recentPageKeys.set(pathname, { pageKey, createdAt: now });
  return pageKey;
}

function getStoredJson(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function getAnalyticsIdentity() {
  let visitorId = window.localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = createId();
    window.localStorage.setItem(VISITOR_KEY, visitorId);
  }

  const now = Date.now();
  let session = getStoredJson(SESSION_KEY);
  if (
    !session?.id ||
    !session.lastActivity ||
    now - session.lastActivity > SESSION_TIMEOUT_MS
  ) {
    session = { id: createId(), lastActivity: now };
  } else {
    session.lastActivity = now;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return { visitorId, sessionId: session.id };
}

function touchSession(sessionId) {
  try {
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ id: sessionId, lastActivity: Date.now() }),
    );
  } catch {
    /* Analytics must never interrupt the website. */
  }
}

function postAnalytics(payload) {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon && payload.type === "engagement") {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon("/api/analytics", blob)) return;
  }

  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (
      !pathname ||
      pathname.startsWith("/dashboard") ||
      navigator.doNotTrack === "1"
    ) {
      return undefined;
    }

    const { visitorId, sessionId } = getAnalyticsIdentity();
    const pageKey = getPageKey(pathname);
    const params = new URLSearchParams(window.location.search);
    let activeStartedAt =
      document.visibilityState === "visible" ? performance.now() : null;
    let accumulatedActiveMs = 0;
    let maxScroll = 0;

    const engagementPayload = () => ({
      type: "engagement",
      visitorId,
      sessionId,
      pageKey,
      engagementMs: Math.round(
        accumulatedActiveMs +
          (activeStartedAt === null ? 0 : performance.now() - activeStartedAt),
      ),
      maxScroll,
    });

    const flushEngagement = () => {
      touchSession(sessionId);
      postAnalytics(engagementPayload());
    };

    postAnalytics({
      type: "pageview",
      visitorId,
      sessionId,
      pageKey,
      path: `${pathname}${window.location.search}`,
      title: document.title,
      referrer: document.referrer,
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
    });

    const handleScroll = () => {
      const documentHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const percentage =
        documentHeight <= 0
          ? 100
          : Math.round((window.scrollY / documentHeight) * 100);
      maxScroll = Math.max(maxScroll, Math.min(100, percentage));
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (activeStartedAt !== null) {
          accumulatedActiveMs += performance.now() - activeStartedAt;
          activeStartedAt = null;
        }
        flushEngagement();
      } else if (activeStartedAt === null) {
        activeStartedAt = performance.now();
      }
    };

    const interval = window.setInterval(flushEngagement, HEARTBEAT_MS);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pagehide", flushEngagement);
    document.addEventListener("visibilitychange", handleVisibility);
    handleScroll();

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pagehide", flushEngagement);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (activeStartedAt !== null) {
        accumulatedActiveMs += performance.now() - activeStartedAt;
        activeStartedAt = null;
      }
      flushEngagement();
    };
  }, [pathname]);

  return null;
}
