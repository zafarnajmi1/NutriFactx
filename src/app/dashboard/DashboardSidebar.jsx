"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDashboardSession, logoutDashboardUser } from "../../lib/dashboardAuth";

const nav = [
  {
    title: "Overview",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        match: "exact",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
        ),
      },
      {
        href: "/dashboard/analytics",
        label: "Analytics",
        match: "analytics",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h18v18H3z" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        href: "/dashboard/articles",
        label: "Articles",
        match: "articles",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        ),
      },
      {
        href: "/dashboard/comments",
        label: "Comments",
        match: "comments",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
      {
        href: "/dashboard/contact",
        label: "Contact",
        match: "contact",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <path d="M22 6l-10 7L2 6" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Audience",
    items: [
      {
        href: "/dashboard/subscribers",
        label: "Subscribers",
        match: "subscribers",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        href: "/dashboard/seo",
        label: "SEO",
        match: "seo",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
            <path d="M11 8v6" />
            <path d="M8 11h6" />
          </svg>
        ),
      },
      {
        href: "/dashboard/pages",
        label: "Pages",
        match: "pages",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <path d="M8 7h8" />
            <path d="M8 11h8" />
            <path d="M8 15h5" />
          </svg>
        ),
      },
      {
        href: "/dashboard/team",
        label: "Team",
        match: "team",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        href: "/dashboard/authors",
        label: "Authors",
        match: "authors",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
      },
      {
        href: "/dashboard/social-media",
        label: "Social media",
        match: "social-media",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 10.5l6.8-4" />
            <path d="M8.6 13.5l6.8 4" />
          </svg>
        ),
      },
      {
        href: "/dashboard/managers",
        label: "Managers",
        match: "managers",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 11l-3-3 3-3" />
            <path d="M16 8h6" />
          </svg>
        ),
      },
    ],
  },
];

function isActive(item, active) {
  if (item.match === "exact") return active === "dashboard";
  if (item.match === "analytics") return active === "analytics";
  if (item.match === "articles") return active === "articles" || active === "new";
  if (item.match === "comments") return active === "comments";
  if (item.match === "contact") return active === "contact";
  if (item.match === "subscribers") return active === "subscribers";
  if (item.match === "social-media") return active === "social-media";
  if (item.match === "seo") return active === "seo";
  if (item.match === "pages") return active === "pages";
  if (item.match === "team") return active === "team";
  if (item.match === "authors") return active === "authors";
  if (item.match === "managers") return active === "managers";
  return false;
}

export default function DashboardSidebar({ active = "dashboard" }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getDashboardSession());
  }, []);

  function handleLogout() {
    logoutDashboardUser();
    router.replace("/dashboard/login");
    router.refresh();
  }

  const visibleNav = nav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (user?.role === "manager") {
          return item.match === "articles" || item.match === "comments";
        }
        if (item.match === "managers" || item.match === "social-media" || item.match === "seo" || item.match === "pages" || item.match === "team" || item.match === "authors") {
          return user?.role === "admin";
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const homeHref = user?.role === "manager" ? "/dashboard/articles" : "/dashboard";

  return (
    <aside className="db-sidebar">
      <Link href={homeHref} className="db-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/nutrifactx-icon.png"
          alt=""
          width={28}
          height={28}
          className="db-logo-icon"
          aria-hidden="true"
        />
        nutri<span>factx</span>
      </Link>

      {visibleNav.map((group) => (
        <div key={group.title} className="db-nav-group">
          <p className="db-nav-group-title">{group.title}</p>
          {group.items.map((item) => (
            <Link
              key={`${group.title}-${item.label}`}
              href={item.href}
              className={`db-nav-item${isActive(item, active) ? " active" : ""}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      ))}

      <div className="db-sidebar-footer">
        <div className="avatar">{user?.initials || "??"}</div>
        <div className="db-sidebar-user">
          <p className="name">{user?.name || "Signed out"}</p>
          <p className="role">{user?.title || user?.role || "—"}</p>
        </div>
        <button type="button" className="db-sidebar-logout" onClick={handleLogout} title="Sign out">
          Out
        </button>
      </div>
    </aside>
  );
}
