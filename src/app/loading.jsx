export default function Loading() {
  return (
    <main
      className="min-h-[60vh] bg-nf-surface"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Banner skeleton */}
      <div className="relative overflow-hidden bg-nf-green">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 85% 20%, #5dcaa5 0%, transparent 45%), radial-gradient(circle at 10% 90%, #085041 0%, transparent 40%)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl animate-pulse px-4 py-14 sm:px-6 sm:py-16 md:py-20">
          <div className="h-6 w-20 rounded-md bg-white/25" />
          <div className="mt-5 h-10 w-full max-w-xl rounded-lg bg-white/30" />
          <div className="mt-3 h-10 w-4/5 max-w-md rounded-lg bg-white/20" />
          <div className="mt-4 h-4 w-56 rounded-md bg-white/20" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-4 h-7 w-40 rounded-lg bg-nf-border/80" />

        <div className="nf-posts-grid">
          {[0, 1, 2, 3].map((card) => (
            <article
              key={card}
              className="overflow-hidden rounded-2xl border border-nf-border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            >
              <div className="aspect-[16/10] bg-nf-green-soft" />
              <div className="p-4">
                <div className="h-5 w-16 rounded-full bg-nf-green-soft" />
                <div className="mt-3 h-5 w-4/5 rounded-md bg-nf-border/70" />
                <div className="mt-2 h-4 w-full rounded-md bg-nf-border/50" />
                <div className="mt-2 h-4 w-5/6 rounded-md bg-nf-border/50" />
                <div className="mt-4 flex items-center justify-between border-t border-nf-border pt-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-nf-border/80" />
                    <div className="h-3 w-20 rounded bg-nf-border/60" />
                  </div>
                  <div className="h-3 w-12 rounded bg-nf-border/60" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <p className="sr-only">Loading page content</p>
    </main>
  );
}
