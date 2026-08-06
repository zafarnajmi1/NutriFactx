"use client";

import useSocialLinks from "../components/common/useSocialLinks";

const platforms = [
  {
    key: "facebook",
    label: "Facebook",
    icon: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: (
      <>
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
      </>
    ),
  },
  {
    key: "x",
    label: "X",
    icon: (
      <>
        <path d="M4 3l16 18" />
        <path d="M20 3L4 21" />
      </>
    ),
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: (
      <>
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
        <path d="M10 9h4v2a4 4 0 0 1 4-2c3 0 4 2 4 5v7h-4v-6c0-1.5-.5-2.5-2-2.5s-2 1-2 2.5v6h-4z" />
      </>
    ),
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="4" />
        <path d="M10 9.5l5 2.5-5 2.5z" />
      </>
    ),
  },
  {
    key: "pinterest",
    label: "Pinterest",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 7c-2.2 0-3.8 1.5-3.8 3.4 0 .9.4 1.9 1.2 2.2.2.1.3 0 .3-.2v-.7c0-.1 0-.2-.1-.3-.3-.4-.4-.9-.4-1.4 0-1.6 1.3-2.9 3.1-2.9 1.7 0 2.7 1 2.7 2.4 0 1.8-.8 3.3-2 3.3-.6 0-1.1-.5-.9-1.2.2-.8.6-1.7.6-2.3 0-.5-.3-1-.9-1-.7 0-1.3.7-1.3 1.7 0 .6.2 1 .2 1L9.7 16c-.2 1-.1 2.2 0 2.4" />
      </>
    ),
  },
];

export default function ContactSocialLinks() {
  const links = useSocialLinks();
  const visible = platforms.filter((platform) => links[platform.key]);

  if (visible.length === 0) return null;

  return (
    <div className="ct-left-social">
      {visible.map((platform) => (
        <a
          key={platform.key}
          href={links[platform.key]}
          aria-label={platform.label}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="15"
            height="15"
            aria-hidden="true"
          >
            {platform.icon}
          </svg>
        </a>
      ))}
    </div>
  );
}
