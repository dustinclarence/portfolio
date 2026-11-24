// Display Studio: 16 working controls that restyle the page. Settings persist per device.

type Size = 's' | 'm' | 'l';
type Ink = 'shu' | 'ai' | 'hisui' | 'murasaki';
interface Studio {
  bright: number;
  warm: boolean;
  size: Size;
  ink: Ink;
  calm: boolean;
  ruler: boolean;
  contrast: boolean;
  tone: boolean;
  font: 'serif' | 'sans';
  space: boolean;
  trail: boolean;
  petals: boolean;
  manga: boolean;
}

const KEY = 'studio-v1';
const DEFAULTS: Studio = {
  bright: 100,
  warm: false,
  size: 'm',
  ink: 'shu',
  calm: false,
  ruler: false,
  contrast: false,
  tone: true,
  font: 'serif',
  space: false,
  trail: false,
  petals: false,
  manga: false,
};

const root = document.documentElement;
const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel);
const status = $<HTMLElement>('#studio-status');

function load(): Studio {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}
let st = load();
function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(st));
  } catch {
    /* storage unavailable: settings last for this visit only */
  }
}
function announce(msg: string): void {
  if (status) status.textContent = msg;
}

/* ---------------- Apply settings to the page ---------------- */
const dim = $<HTMLElement>('.fx-dim');
function apply(): void {
  root.classList.toggle('s-warm', st.warm);
  root.classList.toggle('s-calm', st.calm);
  root.classList.toggle('s-ruler', st.ruler);
  root.classList.toggle('s-contrast', st.contrast);
  root.classList.toggle('s-notone', !st.tone);
  root.classList.toggle('s-sans', st.font === 'sans');
  root.classList.toggle('s-space', st.space);
  root.classList.toggle('s-manga', st.manga);
  root.classList.remove('s-size-s', 's-size-l');
  if (st.size !== 'm') root.classList.add('s-size-' + st.size);
  if (st.ink === 'shu') delete root.dataset.ink;
  else root.dataset.ink = st.ink;
  if (dim) dim.style.opacity = String(((100 - st.bright) / 100) * 1.15);
  $<HTMLElement>('.tile__icon--lantern')?.style.setProperty('--glow', String(0.15 + (st.bright - 55) / 55));

  // reflect state in the controls
  document.querySelectorAll<HTMLButtonElement>('.switchy[data-toggle]').forEach((b) => {
    const k = b.dataset.toggle as keyof Studio;
    if (k in st) b.setAttribute('aria-pressed', String(st[k]));
    b.closest('.tile')?.classList.toggle('is-on', b.getAttribute('aria-pressed') === 'true');
  });
  document.querySelectorAll<HTMLButtonElement>('.seg [data-size]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.size === st.size)));
  document.querySelectorAll<HTMLButtonElement>('.swatches [data-ink]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ink === st.ink)));
  document.querySelectorAll<HTMLButtonElement>('.seg [data-font]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.font === st.font)));
  const range = $<HTMLInputElement>('#s-bright');
  if (range) {
    range.value = String(st.bright);
    range.setAttribute('aria-valuetext', `${st.bright} percent`);
  }
  fx.update();
}

/* ---------------- Ambient effects: ink trail + petals ---------------- */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const fx = (() => {
  const canvas = $<HTMLCanvasElement>('.fx-canvas');
  const ctx = canvas?.getContext('2d') ?? null;
  let raf = 0;
  let w = 0, h = 0, dpr = 1;
  const trail: { x: number; y: number; life: number }[] = [];
  const petals: { x: number; y: number; r: number; vy: number; sway: number; rot: number; vr: number }[] = [];

  function resize(): void {
    if (!canvas || !ctx) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('pointermove', (e) => {
    if (st.trail && e.pointerType === 'mouse') trail.push({ x: e.clientX, y: e.clientY, life: 1 });
    if (st.ruler) root.style.setProperty('--ruler-y', e.clientY + 'px');
  }, { passive: true });

  function accent(): string {
    return getComputedStyle(root).getPropertyValue('--accent').trim() || '#b4472f';
  }

  function frame(): void {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    const color = accent();
    // ink trail
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].life -= 0.035;
      if (trail[i].life <= 0) trail.splice(i, 1);
    }
    if (trail.length > 1) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1], b = trail[i];
        ctx.strokeStyle = color;
        ctx.globalAlpha = b.life * 0.7;
        ctx.lineWidth = 1 + b.life * 7;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // petals
    if (st.petals) {
      while (petals.length < 18) petals.push({ x: Math.random() * w, y: -20 - Math.random() * h, r: 5 + Math.random() * 5, vy: 0.5 + Math.random() * 0.8, sway: Math.random() * Math.PI * 2, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.03 });
    }
    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      p.y += p.vy;
      p.sway += 0.015;
      p.x += Math.sin(p.sway) * 0.6;
      p.rot += p.vr;
      if (p.y > h + 20) {
        if (st.petals) {
          p.y = -20;
          p.x = Math.random() * w;
        } else petals.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = 'rgba(244, 170, 185, 0.85)';
      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.bezierCurveTo(p.r, -p.r, p.r, p.r * 0.6, 0, p.r);
      ctx.bezierCurveTo(-p.r, p.r * 0.6, -p.r, -p.r, 0, -p.r);
      ctx.fill();
      ctx.restore();
    }
    if (trail.length || petals.length || st.trail || st.petals) raf = requestAnimationFrame(frame);
    else raf = 0;
  }

  function update(): void {
    const active = (st.trail || st.petals) && !st.calm && !reduce.matches;
    if (canvas) canvas.hidden = !active;
    if (!active) {
      cancelAnimationFrame(raf);
      raf = 0;
      trail.length = 0;
      petals.length = 0;
      ctx?.clearRect(0, 0, w, h);
      return;
    }
    if (!raf) raf = requestAnimationFrame(frame);
  }
  return { update };
})();

/* ---------------- Wind chime (Web Audio) ---------------- */
const chime = (() => {
  let ac: AudioContext | null = null;
  let timer = 0;
  const NOTES = [1318.5, 1568, 1760, 2093, 2349.3, 2637]; // E6 G6 A6 C7 D7 E7 pentatonic
  function ring(): void {
    if (!ac) return;
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const t = ac.currentTime + i * (0.12 + Math.random() * 0.2);
      const o = ac.createOscillator();
      const o2 = ac.createOscillator();
      const g = ac.createGain();
      const f = NOTES[Math.floor(Math.random() * NOTES.length)];
      o.type = 'sine';
      o.frequency.value = f;
      o2.type = 'sine';
      o2.frequency.value = f * 2.76; // bell-like partial
      const g2 = ac.createGain();
      g2.gain.value = 0.18;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      o.connect(g);
      o2.connect(g2).connect(g);
      g.connect(ac.destination);
      o.start(t);
      o2.start(t);
      o.stop(t + 2.7);
      o2.stop(t + 2.7);
    }
    timer = window.setTimeout(ring, 2500 + Math.random() * 4500);
  }
  return {
    on(): void {
      ac = ac ?? new AudioContext();
      void ac.resume();
      window.clearTimeout(timer);
      ring();
    },
    off(): void {
      window.clearTimeout(timer);
      void ac?.suspend();
    },
  };
})();

/* ---------------- Wire up controls ---------------- */
const NAMES: Record<string, string> = {
  warm: 'Sunset filter',
  calm: 'Calm motion',
  ruler: 'Reading ruler',
  contrast: 'High contrast',
  tone: 'Screentone',
  space: 'Breathing room',
  chime: 'Wind chime',
  trail: 'Ink trail',
  petals: 'Falling petals',
  manga: 'Manga mode',
};

document.querySelectorAll<HTMLButtonElement>('.switchy[data-toggle]').forEach((b) => {
  b.addEventListener('click', () => {
    const k = b.dataset.toggle as string;
    const on = b.getAttribute('aria-pressed') !== 'true';
    if (k === 'chime') {
      // Sound is never saved: it only starts after a click.
      b.setAttribute('aria-pressed', String(on));
      b.closest('.tile')?.classList.toggle('is-on', on);
      if (on) chime.on();
      else chime.off();
    } else {
      (st as unknown as Record<string, boolean>)[k] = on;
      save();
      apply();
    }
    announce(`${NAMES[k] ?? k} ${on ? 'on' : 'off'}`);
  });
});

document.querySelectorAll<HTMLButtonElement>('.seg [data-size]').forEach((b) =>
  b.addEventListener('click', () => {
    st.size = b.dataset.size as Size;
    save();
    apply();
    announce(`Text size ${{ s: 'small', m: 'medium', l: 'large' }[st.size]}`);
  }),
);
document.querySelectorAll<HTMLButtonElement>('.swatches [data-ink]').forEach((b) =>
  b.addEventListener('click', () => {
    st.ink = b.dataset.ink as Ink;
    save();
    apply();
    announce(`Accent ink: ${b.textContent?.trim()}`);
  }),
);
document.querySelectorAll<HTMLButtonElement>('.seg [data-font]').forEach((b) =>
  b.addEventListener('click', () => {
    st.font = b.dataset.font as 'serif' | 'sans';
    save();
    apply();
    announce(`Typeface: ${b.textContent?.trim()}`);
  }),
);
$<HTMLInputElement>('#s-bright')?.addEventListener('input', (e) => {
  st.bright = Number((e.target as HTMLInputElement).value);
  save();
  apply();
});

// The studio's sky switch drives the same theme as the header switch.
const headerTheme = $<HTMLButtonElement>('.nav .theme-toggle');
const studioTheme = $<HTMLButtonElement>('.studio-theme');
studioTheme?.addEventListener('click', () => headerTheme?.click());
const syncTheme = () => {
  const night = root.dataset.theme === 'night';
  studioTheme?.setAttribute('aria-pressed', String(night));
  studioTheme?.closest('.tile')?.classList.toggle('is-on', night);
};
new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
syncTheme();

$<HTMLButtonElement>('#studio-reset')?.addEventListener('click', () => {
  st = { ...DEFAULTS };
  save();
  chime.off();
  const cb = $<HTMLButtonElement>('[data-toggle="chime"]');
  cb?.setAttribute('aria-pressed', 'false');
  cb?.closest('.tile')?.classList.remove('is-on');
  apply();
  const icon = $<HTMLElement>('.tile__icon--reset');
  icon?.classList.remove('spin');
  void icon?.offsetWidth;
  icon?.classList.add('spin');
  announce('All display settings were reset');
});

apply();
