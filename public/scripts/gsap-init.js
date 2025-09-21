// public/scripts/gsap-init.js
(function () {
  // אל תריץ פעמיים (HMR/ניווט פנימי)
  if (window.__gsapInitDone) return;
  window.__gsapInitDone = true;

  // כיבוד העדפת נגישות
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (reduce) return;

  // ודא ש-GSAP נטען
  if (!window.gsap) {
    console.warn('GSAP not found on window.');
    return;
  }
  const gsap = window.gsap;

  // רשום את ScrollTrigger רק אם נטען, ועבוד דרכו דרך window
  const hasST = !!window.ScrollTrigger;
  if (hasST) gsap.registerPlugin(window.ScrollTrigger);

  /* -------------------- HERO (כניסה ראשונית) -------------------- */
  try {
    gsap.set('.hero .title, .hero .subtitle, .hero .btn', { y: 16, opacity: 0 });
    gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.6 } })
      .to('.hero .title', { y: 0, opacity: 1 })
      .to('.hero .subtitle', { y: 0, opacity: 1 }, '-=0.25')
      .to('.hero .btn', { scale: 1, opacity: 1, stagger: 0.08 }, '-=0.2');
  } catch (e) { console.debug(e); }

  /* -------------------- NAV (מיקרו-אינטרקציה) -------------------- */
  document.querySelectorAll('.navbar .nav-link').forEach((a) => {
    a.addEventListener('mouseenter', () => gsap.to(a, { y: -1, duration: 0.2, ease: 'power2.out' }));
    a.addEventListener('mouseleave', () => gsap.to(a, { y: 0, duration: 0.25, ease: 'power2.out' }));
  });

  /* -------------------- REVEAL בגלילה -------------------- */
  if (hasST) {
    // batch מקבל start/top-level — זה נכון.
    window.ScrollTrigger.batch('.card, [data-reveal]', {
      start: 'top 85%',
      once: true,
      onEnter: (els) => gsap.fromTo(
        els,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.08 }
      ),
    });
  }

  /* -------------------- פרלקסה עדינה לתמונות -------------------- */
  if (hasST) {
    gsap.utils.toArray('.parallax').forEach((img) => {
      gsap.fromTo(img, { y: 20 }, {
        y: -20, ease: 'none',
        scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    // רענון לאחר טעינת תמונות/תוכן
    window.addEventListener('load', () => window.ScrollTrigger.refresh());
  }

  /* -------------------- HOVER LIFT + TILT לכרטיסים -------------------- */
  const attachTilt = (el) => {
    const toY = gsap.quickTo(el, 'rotateY', { duration: 0.25, ease: 'power2.out' });
    const toX = gsap.quickTo(el, 'rotateX', { duration: 0.25, ease: 'power2.out' });
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width - 0.5;
      const cy = (e.clientY - r.top) / r.height - 0.5;
      toY(cx * 8);
      toX(-cy * 6);
    };
    el.addEventListener('mouseenter', () => {
      gsap.to(el, { y: -6, boxShadow: '0 14px 34px rgba(0,0,0,.35)', duration: 0.25 });
      el.addEventListener('mousemove', onMove);
    });
    el.addEventListener('mouseleave', () => {
      el.removeEventListener('mousemove', onMove);
      gsap.to(el, { y: 0, rotateX: 0, rotateY: 0, boxShadow: 'none', duration: 0.35 });
    });
  };
  document.querySelectorAll('.card[data-tilt], [data-tilt] .card').forEach(attachTilt);
})();
