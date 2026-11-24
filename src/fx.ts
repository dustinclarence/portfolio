// Small interaction polish: pointer spotlight, gentle 3D tilt and ink ripples.
// Everything is skipped for touch input, reduced-motion users and Calm motion mode.

const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const calm = () => reduce.matches || root.classList.contains('s-calm');

/* ---------- Spotlight: cards glow softly where the pointer is ---------- */
const GLOW = '.tile, .project, .panel, .skill-group, .contact__card';
document.addEventListener(
  'pointermove',
  (e) => {
    if (e.pointerType !== 'mouse') return;
    const card = (e.target as Element).closest<HTMLElement>(GLOW);
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  },
  { passive: true },
);

/* ---------- Tilt: project cards and studio tiles lean toward the pointer ---------- */
const TILT = '.project, .tile';
let tilted: HTMLElement | null = null;
document.addEventListener(
  'pointermove',
  (e) => {
    if (e.pointerType !== 'mouse' || !finePointer.matches || calm()) return;
    const card = (e.target as Element).closest<HTMLElement>(TILT);
    if (tilted && tilted !== card) resetTilt(tilted);
    if (!card) return;
    tilted = card;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    const max = card.classList.contains('tile') ? 6 : 3;
    card.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateY(-3px)`;
  },
  { passive: true },
);
function resetTilt(el: HTMLElement): void {
  el.style.transform = '';
}
document.addEventListener('pointerleave', () => tilted && resetTilt(tilted));
document.addEventListener('scroll', () => tilted && resetTilt(tilted), { passive: true });

/* ---------- Ripple: an ink drop spreads from where you click ---------- */
const RIPPLE = '.btn, .switchy, .filter, .seg button, .theme-toggle, .nav__links a';
document.addEventListener('pointerdown', (e) => {
  if (calm()) return;
  const el = (e.target as Element).closest<HTMLElement>(RIPPLE);
  if (!el) return;
  const r = el.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 2.2;
  const ink = document.createElement('span');
  ink.className = 'ripple';
  ink.setAttribute('aria-hidden', 'true');
  ink.style.width = ink.style.height = `${size}px`;
  ink.style.left = `${e.clientX - r.left - size / 2}px`;
  ink.style.top = `${e.clientY - r.top - size / 2}px`;
  el.append(ink);
  ink.addEventListener('animationend', () => ink.remove());
  window.setTimeout(() => ink.remove(), 900);
});
