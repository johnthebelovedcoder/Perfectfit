"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  {
    // African woman in vibrant print
    image: "https://images.unsplash.com/photo-1612659513025-fe37f67574d6",
    objectPosition: "center 20%",
    tag: "New Arrivals",
    heading: "African fashion,\nbeautifully made",
    sub: "Every piece inspected. Every listing approved.",
    cta: "Shop New Arrivals",
    href: "/catalogue",
  },
  {
    // Ankara print outfit
    image: "https://images.unsplash.com/photo-1663044022648-08bf87cfdc05",
    objectPosition: "center center",
    tag: "Ankara",
    heading: "Bold prints,\nendless style",
    sub: "Statement Ankara outfits for every occasion.",
    cta: "Shop Ankara",
    href: "/catalogue?category=ANKARA_OUTFITS",
  },
  {
    // Traditional wedding attire
    image: "https://images.unsplash.com/photo-1660675133902-acd1b057f75d",
    objectPosition: "center 20%",
    tag: "Traditional",
    heading: "Wear your\nheritage proudly",
    sub: "Aso-Oke, lace and bridal sets, handcrafted with care.",
    cta: "Shop Traditional",
    href: "/catalogue?category=TRADITIONAL_WEDDING_ATTIRE",
  },
  {
    // African woman fashion
    image: "https://images.unsplash.com/photo-1509099955921-f0b4ed0c175c",
    objectPosition: "center 15%",
    tag: "Women's Edit",
    heading: "Dress the\nway you feel",
    sub: "Gowns, kaftans, skirts & blouses — all vetted by us.",
    cta: "Shop Women",
    href: "/catalogue?category=WOMENS_AFRICAN_WEAR",
  },
  {
    // Man in agbada / traditional menswear
    image: "https://images.unsplash.com/photo-1687952622898-4e9514a710d5",
    objectPosition: "center 25%",
    tag: "Men's Edit",
    heading: "Agbada, kaftans\n& sharp senators",
    sub: "Men's African wear, tailored and resold at honest prices.",
    cta: "Shop Men",
    href: "/catalogue?category=MENS_AFRICAN_WEAR",
  },
];

export function HeroSlider() {
  const [active, setActive] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const goTo = useCallback((idx: number) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setActive(idx);
      setTransitioning(false);
    }, 300);
  }, [transitioning]);

  const next = useCallback(() => goTo((active + 1) % SLIDES.length), [active, goTo]);
  const prev = useCallback(() => goTo((active - 1 + SLIDES.length) % SLIDES.length), [active, goTo]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = SLIDES[active]!;

  return (
    <section className="relative h-[520px] sm:h-[600px] overflow-hidden bg-gray-900">
      {/* Background image */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${transitioning ? "opacity-0" : "opacity-100"}`}>
        <Image
          src={slide.image}
          alt={slide.heading}
          fill
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: slide.objectPosition }}
          priority
          unoptimized
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
      </div>

      {/* Content */}
      <div className={`relative h-full flex items-center transition-all duration-500 ${transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
        <div className="container mx-auto px-6 sm:px-10 max-w-3xl">
          <span className="inline-block bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4">
            {slide.tag}
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight whitespace-pre-line">
            {slide.heading}
          </h1>
          <p className="mt-4 text-gray-200 text-base sm:text-lg max-w-sm">
            {slide.sub}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
            <Link
              href={slide.href}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-white text-gray-900 font-semibold px-7 py-3.5 rounded-xl text-sm hover:bg-gray-100 shadow-lg shadow-black/10 transition-colors"
            >
              {slide.cta} <span aria-hidden="true">→</span>
            </Link>
            <Link
              href={`${process.env["NEXT_PUBLIC_SELLER_URL"] ?? "http://localhost:3002"}`}
              className="inline-flex items-center justify-center w-full sm:w-auto border border-white/50 text-white font-semibold px-6 py-3.5 rounded-xl text-sm hover:bg-white/10 backdrop-blur-sm transition-colors"
            >
              Sell with Perfect Fit
            </Link>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-colors text-white z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-colors text-white z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === active ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
