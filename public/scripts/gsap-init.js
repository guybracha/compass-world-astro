// public/scripts/gsap-init.js
(function () {
  const supportsMotion = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!supportsMotion || !window.gsap) return;

  const { gsap } = window;
  gsap.registerPlugin(window.ScrollTrigger);

  /* -------------------- HERO (כניסה ראשונית) -------------------- */
  gsap.set('.hero .title, .hero .subtitle, .hero .btn', { y: 16, opacity: 0 });
  gsap
    .timeline({ defaults: { ease: 'power3.out', duration: 0.6 } })
    .to('.hero .title', { y: 0, opacity: 1 })
    .to('.hero .subtitle', { y: 0, opacity: 1 }, '-=0.25')
    .to('.hero .btn', { scale: 1, opacity: 1, stagger: 0.08, from: 'start' }, '-=0.2');

  /* -------------------- NAV (מיקרו-אינטרקציה) -------------------- */
  document.querySelectorAll('.navbar .nav-link').forEach((a) => {
    a.addEventListener('mouseenter', () => gsap.to(a, { y: -1, duration: 0.2, ease: 'power2.out' }));
    a.addEventListener('mouseleave', () => gsap.to(a, { y: 0, duration: 0.25, ease: 'power2.out' }));
  });

  /* -------------------- REVEAL לכל כרטיס/סקשן בגלילה -------------------- */
  ScrollTrigger.batch('.card, [data-reveal]', {
    start: 'top 85%',
    once: true,
    onEnter: (els) =>
      gsap.fromTo(
        els,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.08 }
      ),
  });

  /* -------------------- תזוזת פרלקסה עדינה לתמונות -------------------- */
  gsap.utils.toArray('.parallax').forEach((img) => {
    gsap.fromTo(
      img,
      { y: 20 },
      {
        y: -20,
        ease: 'none',
        scrollTrigger: {
          trigger: img,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });

  /* -------------------- HOVER LIFT + TILT לכרטיסים -------------------- */
  const attachTilt = (el) => {
    let over = false;
    const maxX = 8, maxY = 6;
    const to = gsap.quickTo(el, 'rotateY', { duration: 0.25, ease: 'power2.out' });
    const tox = gsap.quickTo(el, 'rotateX', { duration: 0.25, ease: 'power2.out' });

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width - 0.5;
      const cy = (e.clientY - r.top) / r.height - 0.5;
      to(cx * maxX);
      tox(-cy * maxY);
    };

    el.addEventListener('mouseenter', () => {
      over = true;
      gsap.to(el, { y: -6, boxShadow: '0 14px 34px rgba(0,0,0,.35)', duration: 0.25 });
      el.addEventListener('mousemove', onMove);
    });
    el.addEventListener('mouseleave', () => {
      over = false;
      el.removeEventListener('mousemove', onMove);
      gsap.to(el, { y: 0, rotateX: 0, rotateY: 0, boxShadow: 'none', duration: 0.35 });
    });
  };

  document.querySelectorAll('.card[data-tilt], [data-tilt] .card').forEach(attachTilt);

  /* -------------------- מודל (Bootstrap) פתיחה/סגירה חלקה -------------------- */
  document.addEventListener('shown.bs.modal', (ev) => {
    const dlg = ev.target.querySelector('.modal-dialog');
    if (dlg) gsap.fromTo(dlg, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 });
  });
  document.addEventListener('hide.bs.modal', (ev) => {
    const dlg = ev.target.querySelector('.modal-dialog');
    if (dlg) gsap.to(dlg, { y: 20, opacity: 0, duration: 0.25 });
  });

  /* -------------------- רענון כשיש תוכן עצל/תמונות -------------------- */
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
