"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BrandLogo from "./BrandLogo";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/blogs", label: "Blogs" },
  { href: "/about-us", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/posts/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setSuggestions(Array.isArray(data.posts) ? data.posts : []);
      } catch {
        /* aborted or network — ignore */
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToBlog(slug) {
    setQuery("");
    setOpen(false);
    setMenuOpen(false);
    router.push(`/blogs/${slug}`);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (suggestions[0]) {
      goToBlog(suggestions[0].slug);
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-nf-border bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <BrandLogo className="shrink-0 text-lg" size={30} />

        <nav className="hidden items-center gap-7 text-sm text-nf-secondary md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-nf-green ${
                  active ? "font-medium text-nf-green" : ""
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div ref={searchRef} className="relative hidden sm:block">
            <form onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="nav-search">
                Search blogs
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-nf-border bg-nf-surface px-3 py-1.5 focus-within:border-nf-green">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-nf-muted"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  id="nav-search"
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setOpen(true);
                  }}
                  onFocus={() => setOpen(true)}
                  placeholder="Search blogs..."
                  className="w-40 bg-transparent text-base text-nf-text outline-none placeholder:text-nf-muted lg:w-52"
                  autoComplete="off"
                />
              </div>
            </form>

            {open && query.trim().length > 0 ? (
              <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-nf-border bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] lg:w-80">
                {suggestions.length > 0 ? (
                  <ul className="max-h-80 overflow-y-auto py-1">
                    {suggestions.map((blog) => (
                      <li key={blog.id}>
                        <button
                          type="button"
                          onClick={() => goToBlog(blog.slug)}
                          className="flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left transition hover:bg-nf-green-soft"
                        >
                          <span className="text-xs font-medium text-nf-green">{blog.category}</span>
                          <span className="text-sm font-medium text-nf-text">{blog.title}</span>
                          <span className="line-clamp-1 text-xs text-nf-muted">{blog.excerpt}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3.5 py-3 text-sm text-nf-muted">No matching blogs found.</p>
                )}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-nf-secondary md:hidden"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((openMenu) => !openMenu)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-nf-border bg-white px-4 py-3 md:hidden">
          <div className="mb-3">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-2 rounded-xl border border-nf-border bg-nf-surface px-3 py-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="shrink-0 text-nf-muted"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setOpen(true);
                  }}
                  onFocus={() => setOpen(true)}
                  placeholder="Search blogs..."
                  className="w-full bg-transparent text-sm text-nf-text outline-none placeholder:text-nf-muted"
                  autoComplete="off"
                />
              </div>
            </form>
            {open && query.trim().length > 0 ? (
              <div className="mt-2 overflow-hidden rounded-xl border border-nf-border bg-white">
                {suggestions.length > 0 ? (
                  <ul className="py-1">
                    {suggestions.map((blog) => (
                      <li key={blog.id}>
                        <button
                          type="button"
                          onClick={() => goToBlog(blog.slug)}
                          className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-nf-green-soft"
                        >
                          <span className="text-xs font-medium text-nf-green">{blog.category}</span>
                          <span className="text-sm font-medium text-nf-text">{blog.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-3 text-sm text-nf-muted">No matching blogs found.</p>
                )}
              </div>
            ) : null}
          </div>

          <nav>
            <ul className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-lg px-3 py-2 text-sm text-nf-secondary hover:bg-nf-green-soft hover:text-nf-green"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
