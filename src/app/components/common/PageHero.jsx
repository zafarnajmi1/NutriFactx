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
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 md:py-20">
        <div className="nf-animate-fade-up max-w-2xl">
          {eyebrow ? (
            <span className="inline-block rounded-md bg-nf-green-soft px-2.5 py-1 text-xs font-medium text-nf-green-deep">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-3xl font-medium leading-tight tracking-tight sm:text-4xl md:text-[2.55rem]">
            {title}
          </h1>
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
