"use client";

import Link from "next/link";
import BrandLogo from "./BrandLogo";
import useSocialLinks from "./useSocialLinks";

const socialPlatforms = [
  {
    key: "facebook",
    label: "Facebook",
    path: "M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1z",
  },
  {
    key: "instagram",
    label: "Instagram",
    path: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z",
  },
  {
    key: "x",
    label: "X",
    path: "M3 3h4.4l4.1 5.7L16.8 3H21l-6.4 7.4L21 21h-4.4l-4.5-6.2L7.2 21H3l6.7-7.8L3 3z",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    path: "M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z",
  },
  {
    key: "youtube",
    label: "YouTube",
    path: "M23 7.5a3 3 0 0 0-2.1-2.1C19.2 5 12 5 12 5s-7.2 0-8.9.4A3 3 0 0 0 1 7.5 31.5 31.5 0 0 0 1 12a31.5 31.5 0 0 0 .1 4.5 3 3 0 0 0 2.1 2.1C4.8 19 12 19 12 19s7.2 0 8.9-.4a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 23 12a31.5 31.5 0 0 0 0-4.5zM10 15.2V8.8L16 12l-6 3.2z",
  },
  {
    key: "pinterest",
    label: "Pinterest",
    path: "M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2.1 0-3l1.3-5.4s-.3-.7-.3-1.6c0-1.5.9-2.6 2-2.6.9 0 1.4.7 1.4 1.5 0 .9-.6 2.3-.9 3.5-.3 1.1.5 1.9 1.5 1.9 1.8 0 3.1-2.3 3.1-5.1 0-2.1-1.4-3.7-4-3.7-2.9 0-4.7 2.2-4.7 4.6 0 .9.3 1.8.7 2.3.1.1.1.2.1.3l-.3 1.1c0 .2-.1.2-.3.1-1.2-.5-1.8-1.9-1.8-3.4 0-2.5 2.1-5.6 6.3-5.6 3.4 0 5.6 2.4 5.6 5.1 0 3.5-1.9 6.1-4.8 6.1-1 0-1.9-.5-2.2-1.1l-.6 2.3c-.2.8-.7 1.7-1.1 2.3A10 10 0 1 0 12 2z",
  },
  {
    key: "reddit",
    label: "Reddit",
    path: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.2 8.1c.6 0 1.1.5 1.1 1.1 0 .4-.2.8-.6 1 .1.3.1.6.1.9 0 2.2-2.6 4-5.8 4s-5.8-1.8-5.8-4c0-.3 0-.6.1-.9-.4-.2-.6-.6-.6-1 0-.6.5-1.1 1.1-1.1.4 0 .7.2.9.4C9.2 8.3 10.6 8 12 8s2.8.3 3.6.9c.2-.2.5-.4.9-.4zM9.4 12.1a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2zm5.2 2.6c-.7.7-2 .9-2.6.9s-1.9-.2-2.6-.9c-.2-.2-.2-.4 0-.6.2-.2.4-.2.6 0 .5.5 1.5.7 2 .7s1.5-.2 2-.7c.2-.2.4-.2.6 0 .2.2.2.4 0 .6zm.1-2.6a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2z",
  },
];

const footerLinks = [
  { href: "/about-us", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/blogs", label: "Blogs" },
];

export default function Footer() {
  const links = useSocialLinks();

  const visibleSocialLinks = socialPlatforms.filter(
    (platform) => links[platform.key],
  );

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-nf-border bg-white/95 backdrop-blur-sm">
      <div className="nf-page flex flex-col gap-4 py-5">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <BrandLogo className="text-base" size={24} />
            <span className="hidden text-nf-border sm:inline" aria-hidden="true">
              ·
            </span>
            <p className="text-base text-nf-secondary">
              © {new Date().getFullYear()} NutriFactx. All rights reserved.
            </p>
          </div>
          <nav className="flex flex-nowrap items-center justify-center gap-x-4 text-sm text-nf-secondary">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 whitespace-nowrap transition-colors hover:text-nf-green"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3.5">
            {visibleSocialLinks.map((item) => (
              <a
                key={item.label}
                href={links[item.key]}
                aria-label={item.label}
                target="_blank"
                rel="noopener noreferrer"
                className="text-nf-secondary transition-colors hover:text-nf-green"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d={item.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
