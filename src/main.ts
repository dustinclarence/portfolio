import './styles.css';
import './studio';
import './fx';

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- Theme (day / night) ---------- */
const themeBtn = document.querySelector<HTMLButtonElement>('.theme-toggle');
const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

function applyTheme(theme: 'day' | 'night', save: boolean): void {
  root.dataset.theme = theme;
  themeBtn?.setAttribute('aria-pressed', String(theme === 'night'));
  themeColor?.setAttribute('content', theme === 'night' ? '#10141D' : '#F3EEE4');
  if (save) {
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* storage unavailable: the theme still applies for this visit */
    }
  }
}
applyTheme(root.dataset.theme === 'night' ? 'night' : 'day', false);
themeBtn?.addEventListener('click', () => {
  // Briefly animate colours across the whole page while the theme changes.
  if (!reduceMotion.matches) {
    root.classList.add('theme-anim');
    window.setTimeout(() => root.classList.remove('theme-anim'), 650);
  }
  applyTheme(root.dataset.theme === 'night' ? 'day' : 'night', true);
});

/* ---------- Mobile navigation ---------- */
const navToggle = document.querySelector<HTMLButtonElement>('.nav__toggle');
const navLinks = document.getElementById('nav-links');

function setNav(open: boolean): void {
  navToggle?.setAttribute('aria-expanded', String(open));
  navLinks?.classList.toggle('is-open', open);
}
navToggle?.addEventListener('click', () => setNav(navToggle.getAttribute('aria-expanded') !== 'true'));
navLinks?.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('a')) setNav(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navToggle?.getAttribute('aria-expanded') === 'true') {
    setNav(false);
    navToggle.focus();
  }
});
window.matchMedia('(min-width: 1200px)').addEventListener('change', (e) => {
  if (e.matches) setNav(false);
});

/* ---------- Active section in the nav ---------- */
const links = new Map<string, HTMLAnchorElement>();
document.querySelectorAll<HTMLAnchorElement>('.nav__links a').forEach((a) => {
  links.set(a.hash.slice(1), a);
});
const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      links.forEach((a) => a.removeAttribute('aria-current'));
      links.get(entry.target.id)?.setAttribute('aria-current', 'location');
    }
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
document.querySelectorAll('main > section[id]').forEach((s) => sectionObserver.observe(s));

/* ---------- Scroll progress ---------- */
const bar = document.querySelector<HTMLElement>('.progress span');
const ring = document.querySelector<SVGCircleElement>('.to-top__fill');
const toTop = document.querySelector<HTMLElement>('.to-top');
const RING_LEN = 2 * Math.PI * 21;
if (ring) ring.style.strokeDasharray = String(RING_LEN);
let ticking = false;
function updateProgress(): void {
  const max = root.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? window.scrollY / max : 0;
  if (bar) bar.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
  root.classList.toggle('is-scrolled', window.scrollY > 8);
  if (ring) ring.style.strokeDashoffset = String(RING_LEN * (1 - Math.min(1, Math.max(0, ratio))));
  toTop?.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);
  ticking = false;
}
window.addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateProgress);
    }
  },
  { passive: true },
);
updateProgress();

/* ---------- Reveal on scroll ---------- */
const reveals = document.querySelectorAll<HTMLElement>('.reveal');
if (reduceMotion.matches || !('IntersectionObserver' in window)) {
  reveals.forEach((el) => el.classList.add('is-in'));
} else {
  // Content stays visible unless this script runs (progressive enhancement).
  root.classList.add('reveal-ready');
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          obs.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
  );
  reveals.forEach((el) => revealObserver.observe(el));
  // Safety net: never leave content hidden if the observer does not fire.
  window.setTimeout(() => {
    reveals.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in');
    });
  }, 1500);
}
window.addEventListener('beforeprint', () => reveals.forEach((el) => el.classList.add('is-in')));

/* ---------- Project filter ---------- */
const filterButtons = document.querySelectorAll<HTMLButtonElement>('.filter');
const projects = document.querySelectorAll<HTMLElement>('.project');
const filterStatus = document.getElementById('filter-status');

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const cat = btn.dataset.filter ?? 'all';
    filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    let shown = 0;
    projects.forEach((p) => {
      const match = cat === 'all' || p.dataset.cat === cat;
      p.hidden = !match;
      if (match) {
        shown += 1;
        p.classList.add('is-in');
      }
    });
    // Hide a whole group (main projects / Games & Apps) when none of its cards match.
    document.querySelectorAll<HTMLElement>('[data-group]').forEach((g) => {
      g.hidden = !g.querySelector('.project:not([hidden])');
    });
    const empty = document.getElementById('filter-empty');
    if (empty) empty.hidden = shown > 0;
    if (filterStatus) filterStatus.textContent = `Showing ${shown} ${shown === 1 ? 'project' : 'projects'}`;
  });
});

/* ---------- Case file dialogs ---------- */
let lastOpener: HTMLElement | null = null;

document.querySelectorAll<HTMLElement>('[data-open]').forEach((opener) => {
  opener.addEventListener('click', () => {
    const dlg = document.getElementById(opener.dataset.open ?? '');
    if (dlg instanceof HTMLDialogElement) {
      lastOpener = opener;
      dlg.showModal();
      root.classList.add('has-dialog');
    }
  });
});

document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dlg) => {
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close(); // backdrop click
    if ((e.target as HTMLElement).closest('[data-close]')) dlg.close();
  });
  dlg.addEventListener('close', () => {
    root.classList.remove('has-dialog');
    lastOpener?.focus();
  });
});

/* ---------- Screenshot gallery ---------- */
document.querySelectorAll<HTMLElement>('.gallery').forEach((gallery) => {
  const mainImg = gallery.querySelector<HTMLImageElement>('.gallery__main img');
  const caption = gallery.querySelector<HTMLElement>('.gallery__main figcaption');
  const thumbs = gallery.querySelectorAll<HTMLButtonElement>('.gallery__thumbs button');
  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const src = thumb.querySelector('img')?.getAttribute('src');
      if (!mainImg || !src) return;
      mainImg.src = src;
      mainImg.alt = thumb.dataset.alt ?? '';
      if (caption) caption.textContent = thumb.dataset.cap ?? '';
      thumbs.forEach((t) => t.setAttribute('aria-pressed', String(t === thumb)));
    });
  });
});

/* ---------- Copy email ---------- */
const copyStatus = document.getElementById('copy-status');

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  const label = btn.textContent ?? 'Copy';
  btn.addEventListener('click', async () => {
    const ok = await copyText(btn.dataset.copy ?? '');
    btn.textContent = ok ? 'Copied ✓' : 'Copy failed';
    if (copyStatus) {
      copyStatus.textContent = ok
        ? 'Email address copied to the clipboard'
        : 'Could not copy. Please select the email address instead.';
    }
    window.setTimeout(() => {
      btn.textContent = label;
    }, 2200);
  });
});
