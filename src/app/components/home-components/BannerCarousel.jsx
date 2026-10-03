"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { optimizedImagePath } from "@/lib/optimizedImageUrl";

function getFallbackSlides() {
  return [
    {
      id: "fallback-1",
      title: "The science-backed guide to gut health",
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

function slideHref(slide) {
  return slide.slug ? `/blogs/${slide.slug}` : slide.href || "/blogs";
}

function slideMeta(slide) {
  return (
    slide.meta ||
    (slide.author || slide.date
      ? `By ${slide.author || "NutriFactx"}${slide.date ? ` · ${slide.date}` : ""}`
      : "")
  );
}

export default function BannerCarousel({ slides = [], children }) {
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

  const href = slideHref(slide);
  const meta = slideMeta(slide);
  const extraImage =
    active > 0 ? featuredSlides[active]?.featuredImage : "";

  return (
    <>
      <div
        className={`pointer-events-none absolute inset-0 ${
          active === 0 ? "opacity-100" : "opacity-0"
        }`}
        {...(active !== 0 ? { "aria-hidden": true } : {})}
      >
        {children}
      </div>
      {extraImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={optimizedImagePath(extraImage, 828)}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45"
          loading="lazy"
          decoding="async"
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
                {...(index === active ? { "aria-current": true } : {})}
                onClick={() => setActive(index)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === active ? "bg-white" : "bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
