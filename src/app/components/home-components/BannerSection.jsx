"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function getFallbackSlides() {
  const year = new Date().getFullYear();
  return [
    {
      id: "fallback-1",
      title: `The science-backed guide to gut health in ${year}`,
      meta: "Reviewed by Dr. Sara Khan, MD · 8 min read",
      href: "/blogs",
    },
    {
      id: "fallback-2",
      title: "How daily fiber intake reshapes your energy levels",
      meta: "Reviewed by NutriFactx Editorial · 6 min read",
      href: "/blogs",
    },
    {
      id: "fallback-3",
      title: "Evidence-based habits for better metabolic health",
      meta: "Reviewed by Dr. Amir Raza, MD · 7 min read",
      href: "/blogs",
    },
  ];
}

export default function BannerSection({ slides = [] }) {
  const featuredSlides = slides.length > 0 ? slides : getFallbackSlides();
  const [active, setActive] = useState(0);
  const slide = featuredSlides[active] || featuredSlides[0];

  useEffect(() => {
    setActive(0);
  }, [featuredSlides.length, slides.length]);

  useEffect(() => {
    if (featuredSlides.length < 2) return undefined;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % featuredSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [featuredSlides.length]);

  if (!slide) return null;

  const href = slide.slug ? `/blogs/${slide.slug}` : slide.href || "/blogs";
  const meta =
    slide.meta ||
    (slide.author || slide.date
      ? `By ${slide.author || "NutriFactx"}${slide.date ? ` · ${slide.date}` : ""}`
      : "");

  return (
    <section className="relative overflow-hidden bg-nf-green text-white">
      {slide.featuredImage ? (
        <div
          key={`image-${slide.id}`}
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-45"
          style={{ backgroundImage: `url("${slide.featuredImage}")` }}
          aria-hidden="true"
        />
      ) : null}
      <div
        className="pointer-events-none absolute inset-0 bg-nf-green/55"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 85% 20%, #5dcaa5 0%, transparent 45%), radial-gradient(circle at 10% 90%, #085041 0%, transparent 40%)",
        }}
        aria-hidden="true"
      />

      <div className="nf-page relative flex min-h-[280px] flex-col justify-center py-14 sm:min-h-[340px] md:min-h-[380px]">
        <div key={slide.id} className="nf-animate-fade-up max-w-xl">
          <span className="inline-block rounded-md bg-nf-green-soft px-2.5 py-1 text-xs font-medium text-nf-green-deep">
            Featured
          </span>
          <h2 className="nf-hero-title mt-4 text-white">
            <Link href={href} className="transition-opacity hover:opacity-90">
              {slide.title}
            </Link>
          </h2>
          {meta ? (
            <p className="mt-3 text-sm text-nf-green-mist sm:text-base">{meta}</p>
          ) : null}
        </div>

        {featuredSlides.length > 1 ? (
          <div
            className="absolute bottom-5 right-4 flex gap-1.5 sm:right-6"
            aria-label="Featured slides"
          >
            {featuredSlides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show featured story ${index + 1}`}
                aria-current={index === active}
                onClick={() => setActive(index)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === active ? "bg-white" : "bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
