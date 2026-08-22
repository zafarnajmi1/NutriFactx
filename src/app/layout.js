import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import AnalyticsTracker from "./components/common/AnalyticsTracker";
import { getSiteUrl } from "@/lib/seo";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NutriFactx",
    template: "%s | NutriFactx",
  },
  description: "Science-backed nutrition facts and wellness insights",
  applicationName: "NutriFactx",
  authors: [{ name: "NutriFactx" }],
  creator: "NutriFactx",
  publisher: "NutriFactx",
  keywords: [
    "nutrition",
    "wellness",
    "health",
    "vitamins",
    "diet",
    "NutriFactx",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "NutriFactx",
    title: "NutriFactx",
    description: "Science-backed nutrition facts and wellness insights",
    images: [
      {
        url: "/brand/nutrifactx-icon.png",
        width: 150,
        height: 150,
        alt: "NutriFactx",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "NutriFactx",
    description: "Science-backed nutrition facts and wellness insights",
    images: ["/brand/nutrifactx-icon.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/nutrifactx-icon.png", sizes: "150x150", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  alternates: {
    canonical: siteUrl,
  },
  other: {
    "p:domain_verify": "872e0c34420e1c72eee44a3988edfa25",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className="min-h-screen flex flex-col bg-nf-surface text-nf-text antialiased">
        <AnalyticsTracker />
        <Header />
        <main className="flex-1 pb-28 pt-[var(--nf-header-height)] sm:pb-24">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
