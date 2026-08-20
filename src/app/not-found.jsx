import Link from "next/link";

export const metadata = {
  title: "Page not found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-[60vh] items-center overflow-hidden bg-nf-surface px-4 py-16 sm:px-6 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #e1f5ee 0%, transparent 40%), radial-gradient(circle at 85% 75%, #cee9de 0%, transparent 35%)",
        }}
        aria-hidden="true"
      />

      <section className="mx-auto w-full max-w-xl rounded-2xl border border-nf-border bg-white px-6 py-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:px-10 sm:py-14">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-nf-green-soft">
          <span className="font-[family-name:var(--font-fraunces)] text-2xl font-medium text-nf-green">
            404
          </span>
        </div>

        <p className="text-xs font-medium tracking-[0.18em] text-nf-lime uppercase">
          Page not found
        </p>
        <h1 className="nf-hero-title mt-3 text-nf-text">
          This page isn&apos;t on our menu
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-nf-secondary sm:text-base">
          The page you&apos;re looking for may have moved, been renamed, or is no longer
          available.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-nf-green px-5 py-2.5 text-sm font-medium text-white transition hover:bg-nf-green-deep sm:w-auto"
          >
            Back to home
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 10h12m-5-5 5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            href="/blogs"
            className="inline-flex w-full items-center justify-center rounded-xl border border-nf-border bg-white px-5 py-2.5 text-sm font-medium text-nf-text transition hover:border-nf-green hover:text-nf-green sm:w-auto"
          >
            Browse blogs
          </Link>
        </div>
      </section>
    </div>
  );
}
