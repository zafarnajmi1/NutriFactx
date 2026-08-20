"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import BrandWordmark from "../../components/common/BrandWordmark";
import { getDefaultDashboardPath, isManagerAllowedPath, loginDashboardUserFromApi } from "../../../lib/dashboardAuth";
import "../dashboard.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    loginDashboardUserFromApi(email, password).then((result) => {
      if (!result.ok) {
        setError(result.error || "Unable to sign in.");
        setLoading(false);
        return;
      }

      const next = searchParams.get("next");
      const home = getDefaultDashboardPath(result.user.role);
      let target = home;

      if (
        next &&
        next.startsWith("/dashboard") &&
        next !== "/dashboard/login"
      ) {
        if (result.user.role === "admin" || isManagerAllowedPath(next)) {
          target = next;
        }
      }

      router.replace(target);
      router.refresh();
    });
  }

  return (
    <div className="dashboard-isolate db-login-isolate">
      <div className="db-login-shell">
        <div className="db-login-brand">
          <Link href="/" className="db-login-brand-mark" aria-label="NutriFactx home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/nutrifactx-icon.png"
              alt=""
              width={40}
              height={40}
              className="db-logo-icon"
              aria-hidden="true"
            />
            <BrandWordmark height={40} />
          </Link>
          <h1>Dashboard sign in</h1>
          <p>
            Admin and manager access only. Managers can work on articles and
            update comments.
          </p>
          <ul className="db-login-points">
            <li>Managers: add, edit, and delete articles</li>
            <li>Managers: update comment text</li>
            <li>Admins: full dashboard access</li>
          </ul>
        </div>

        <div className="db-login-card">
          <h2>Welcome back</h2>
          <p className="db-login-sub">Use your admin or manager credentials.</p>

          <form onSubmit={handleSubmit} className="db-login-form">
            <label className="db-field">
              Email
              <input
                className="db-input"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="you@nutrifactx.com"
                required
              />
            </label>

            <label className="db-field">
              Password
              <div className="db-password-field">
                <input
                  className="db-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="db-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error ? <p className="db-manager-add-error">{error}</p> : null}

            <button type="submit" className="db-new-post-btn db-login-submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="db-login-demo">
            <p className="label">Demo accounts</p>
            <p>
              Admin: <code>admin@nutrifactx.com</code> / <code>admin1234</code>
            </p>
            <p>
              Manager: <code>bilal@nutrifactx.com</code> / <code>manager123</code>
            </p>
          </div>

          <Link href="/" className="db-muted-link db-login-back">
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLoginPage() {
  return (
    <Suspense fallback={<div className="dashboard-isolate db-login-isolate">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
