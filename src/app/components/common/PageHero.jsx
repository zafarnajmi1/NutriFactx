export default function PageHero({ eyebrow, title, description }) {
  return (
    <section className="relative overflow-hidden bg-nf-green text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 85% 20%, #5dcaa5 0%, transparent 45%), radial-gradient(circle at 10% 90%, #085041 0%, transparent 40%)",
        }}
        aria-hidden="true"
      />
      <div className="nf-page relative py-14 sm:py-16 md:py-20">
        <div className="nf-animate-fade-up max-w-2xl">
          {eyebrow ? (
            <span className="inline-block rounded-md bg-nf-green-soft px-2.5 py-1 text-xs font-medium text-nf-green-deep">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="nf-hero-title mt-4 text-white">{title}</h1>
          {description ? (
            <p className="mt-3 max-w-xl text-sm text-nf-green-mist sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
