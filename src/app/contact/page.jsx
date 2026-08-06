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
      </div>
    </div>
    </>
  );
}
