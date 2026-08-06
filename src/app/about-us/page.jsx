import Link from "next/link";
import PageSeoJsonLd from "../components/common/PageSeoJsonLd";
import { getPublicSiteStats } from "@/lib/realAnalyticsStats";
import { buildPageMetadata } from "@/lib/siteSeo";
import { listTeamMembers } from "@/lib/teamMembers";
import { connection } from "next/server";
import "./about.css";

export async function generateMetadata() {
  await connection();
  return buildPageMetadata("about-us");
}

const values = [
  {
    title: "Evidence first",
    text: "Every claim we publish is checked against peer-reviewed research, not trends or anecdotes.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true">
        <path d="M9 12l2 2 4-4" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    title: "Clear, not clinical",
    text: "We write the way we'd explain things to a friend, plain language, no unnecessary jargon.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true">
        <path d="M4 4h16v16H4z" />
        <path d="M4 9h16" />
        <path d="M9 4v16" />
      </svg>
    ),
  },
  {
    title: "No sponsored bias",
    text: "Product mentions are never paid placements. If we recommend something, it's because it held up.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    ),
  },
];

export default async function AboutUs() {
  await connection();
  const [siteStats, team] = await Promise.all([
    getPublicSiteStats(),
    listTeamMembers({ activeOnly: true }),
  ]);
  const stats = [
    { num: siteStats.publishedArticles, label: "Published articles" },
    { num: siteStats.monthlyReaders, label: "Monthly readers" },
    {
      num: String(team.length || 0),
      label: team.length === 1 ? "Team member" : "Team members",
    },
  ];

  return (
    <>
      <PageSeoJsonLd pageKey="about-us" />
      <div className="about-page">
      <section className="ab-hero">
        <span className="ab-eyebrow">Our story</span>
        <h1>Making sense of nutrition, one article at a time</h1>
        <p>
          Nutrifactx is a home for clear, evidence-based writing on food and health,
          built for readers who are tired of fad diets and hungry for facts.
        </p>
      </section>

      <div className="ab-hero-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1400&h=700&fit=crop"
          alt="Fresh vegetables and healthy food spread"
        />
      </div>

      <section className="ab-story">
        <div>
          <p className="ab-panel-title">Why we started</p>
          <h2>Nutrition advice shouldn&apos;t feel like a guessing game</h2>
          <p>
            We started Nutrifactx after seeing how much conflicting advice exists around
            everyday eating, one week a food is a superfood, the next it&apos;s something
            to avoid. We wanted a single place to go for answers grounded in actual research.
          </p>
          <p>
            Every article on this site is written or reviewed by someone with a background
            in nutrition science, and we link back to the studies we reference so you can
            read the source yourself.
          </p>
          <p>
            Today, Nutrifactx is read by people simply trying to eat a little better,
            understand a diagnosis, or make sense of the next headline about a
            &quot;miracle&quot; ingredient.
          </p>
        </div>
        <div className="img-col">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=700&h=700&fit=crop"
            alt="Person preparing a healthy meal"
          />
        </div>
      </section>

      <div className="ab-stats-wrap">
        <div className="ab-stats">
          {stats.map((item) => (
            <div key={item.label} className="ab-stat">
              <p className="num">{item.num}</p>
              <p className="label">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="ab-values-section">
        <p className="ab-panel-title">What guides us</p>
        <h2>Our values</h2>
        <div className="ab-values-grid">
          {values.map((item) => (
            <article key={item.title} className="ab-value-card">
              <div className="ab-icon-badge">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ab-team-section">
        <p className="ab-panel-title">The people behind it</p>
        <h2>Meet the team</h2>
        {team.length === 0 ? (
          <p className="ab-team-empty">Team profiles will appear here soon.</p>
        ) : (
          <div className="ab-team-grid">
            {team.map((member) => (
              <div key={member.id} className="ab-team-card">
                {member.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.image} alt={member.name} />
                ) : (
                  <div className="ab-team-placeholder" aria-hidden="true">
                    {member.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("") || "T"}
                  </div>
                )}
                <p className="name">{member.name}</p>
                <p className="role">{member.role}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="ab-cta-wrap">
        <section className="ab-cta">
          <h2>Have a topic you&apos;d like us to cover?</h2>
          <p>
            We&apos;re always looking for reader questions and story ideas for upcoming
            articles.
          </p>
          <Link href="/contact" className="ab-cta-btn">
            Get in touch
          </Link>
        </section>
      </div>
    </div>
    </>
  );
}
