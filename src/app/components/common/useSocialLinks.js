"use client";

import { useEffect, useState } from "react";

/** Social profile URLs saved in the dashboard, keyed by platform. */
export default function useSocialLinks() {
  const [links, setLinks] = useState({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/social-links")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error("Social links unavailable");
        if (!cancelled) setLinks(data.links || {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return links;
}
