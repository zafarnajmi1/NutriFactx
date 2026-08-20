import ContactForm from "./ContactForm";
import ContactSocialLinks from "./ContactSocialLinks";
import PageSeoJsonLd from "../components/common/PageSeoJsonLd";
import { buildPageMetadata } from "@/lib/siteSeo";
import { connection } from "next/server";
import "./contact.css";

export async function generateMetadata() {
  await connection();
  return buildPageMetadata("contact");
}

export default async function ContactUs() {
  await connection();
  return (
    <>
      <PageSeoJsonLd pageKey="contact" />
      <div className="contact-page">
      <div className="ct-shell">
        <div className="ct-split">
          <div className="ct-left">
            <div>
              <span className="ct-eyebrow">Let&apos;s talk</span>
              <h1>Questions, story ideas, or a correction to flag?</h1>
              <p className="ct-lead">
                Our editorial team reads every message and typically replies within one
                business day.
              </p>

              <div className="ct-left-info">
                <div className="ct-left-info-item">
                  <div className="ct-left-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
                      <path d="M4 4h16v16H4z" />
                      <path d="M22 6l-10 7L2 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="label">Email</p>
                    <p className="value">hello@nutrifactx.com</p>
                  </div>
                </div>

                <div className="ct-left-info-item">
                  <div className="ct-left-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                  </div>
                  <div>
                    <p className="label">Response time</p>
                    <p className="value">Within 1 business day</p>
                  </div>
                </div>
              </div>
            </div>

            <ContactSocialLinks />
          </div>

          <div className="ct-right">
            <h2>Send us a message</h2>
            <p className="ct-sub">
              Pick a topic and tell us a bit more, we&apos;ll route it to the right person.
            </p>
            <ContactForm />
          </div>
        </div>

        <section className="ct-tips" aria-labelledby="ct-tips-title">
          <div className="ct-tips-head">
            <span className="ct-tips-eyebrow">While you wait</span>
            <h2 id="ct-tips-title">Quick health tips from NutriFactx</h2>
            <p>
              Small, evidence-minded habits you can start today. For personalised advice,
              always speak with a qualified healthcare professional.
            </p>
          </div>

          <div className="ct-tips-grid">
            <article className="ct-tip-card">
              <span className="ct-tip-icon" aria-hidden="true">💧</span>
              <h3>Stay hydrated</h3>
              <p>
                Aim for regular water intake through the day. Thirst, urine colour, and how
                you feel are simple guides, especially in warmer weather or after exercise.
              </p>
            </article>

            <article className="ct-tip-card">
              <span className="ct-tip-icon" aria-hidden="true">🥗</span>
              <h3>Eat the rainbow</h3>
              <p>
                Include vegetables, fruit, whole grains, and lean protein at most meals.
                Variety helps you cover a broader range of vitamins, minerals, and fibre.
              </p>
            </article>

            <article className="ct-tip-card">
              <span className="ct-tip-icon" aria-hidden="true">😴</span>
              <h3>Protect your sleep</h3>
              <p>
                Consistent bed and wake times support energy, focus, and recovery. Limit
                screens before sleep and keep your room cool, dark, and quiet when you can.
              </p>
            </article>

            <article className="ct-tip-card">
              <span className="ct-tip-icon" aria-hidden="true">🚶</span>
              <h3>Move a little daily</h3>
              <p>
                Short walks, stretching, or light activity add up. Even 20–30 minutes of
                movement most days supports heart health, mood, and metabolic balance.
              </p>
            </article>

            <article className="ct-tip-card">
              <span className="ct-tip-icon" aria-hidden="true">🧘</span>
              <h3>Manage stress</h3>
              <p>
                Breathing exercises, time outdoors, and short breaks can lower daily tension.
                Chronic stress affects sleep, appetite, and long-term wellbeing.
              </p>
            </article>

            <article className="ct-tip-card">
              <span className="ct-tip-icon" aria-hidden="true">📖</span>
              <h3>Read trusted sources</h3>
              <p>
                Look for articles that cite research, explain limits clearly, and avoid
                extreme claims. Browse our latest posts for science-backed nutrition insights.
              </p>
            </article>
          </div>
        </section>
      </div>
    </div>
    </>
  );
}
