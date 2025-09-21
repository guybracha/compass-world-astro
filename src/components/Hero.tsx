import React, { useEffect, useRef } from "react";

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !ref.current) return;

    (async () => {
      const gsapMod = await import("gsap");
      const gsap = gsapMod.default || gsapMod; // תמיכה ב־ES/CJS
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const q = (sel: string) => ref.current!.querySelectorAll(sel);
      gsap.set(q(".hero-title, .hero-sub, .hero-cta"), { opacity: 0, y: 20 });
      gsap.to(q(".hero-title"), { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.05 });
      gsap.to(q(".hero-sub"),   { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.25 });
      gsap.to(q(".hero-cta"),   { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.4, stagger: 0.08 });

      ScrollTrigger.batch(".card", {
        start: "top 85%",
        onEnter: (els) => {
          gsap.fromTo(els, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.08 });
        },
      });
    })();

    return () => {
      // מנקה טריגרים אם תרצה:
      // (await import("gsap/ScrollTrigger")).ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <div ref={ref} className="text-center">
      <img src="/img/characters/paladin.webp" alt="Paladin" className="rounded-4 shadow-sm mb-3 will-animate" width={160} height={160} />
      <h1 className="hero-title display-5 fw-bold">Compass <span className="brand">World</span></h1>
      <p className="hero-sub lead text-white-50">A living sci-fi/fantasy universe by Guy Bracha</p>
      <div className="d-flex gap-2 justify-content-center mt-3">
        <a href="/characters/" className="btn btn-warning hero-cta">Characters</a>
        <a href="/history/" className="btn btn-outline-light hero-cta">Chronology</a>
      </div>
    </div>
  );
}
