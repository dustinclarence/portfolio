// Display settings pop-up: four optional reading settings. Choices persist per device.

interface Settings {
  calm: boolean;
  ruler: boolean;
  contrast: boolean;
  font: 'serif' | 'sans';
}

const KEY = 'display-v3';
const DEFAULTS: Settings = { calm: false, ruler: false, contrast: false, font: 'serif' };
const NAMES: Record<string, string> = { calm: 'Calm motion', ruler: 'Reading ruler', contrast: 'High contrast' };

const root = document.documentElement;
const status = document.getElementById('studio-status');

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<Settings>) : {};
    return {
      calm: saved.calm === true,
      ruler: saved.ruler === true,
      contrast: saved.contrast === true,
      font: saved.font === 'sans' ? 'sans' : 'serif',
    };
  } catch {
    return { ...DEFAULTS };
  }
}
let st = load();
try {
  // settings from older versions of the page (removed effects) are dropped
  localStorage.removeItem('studio-v1');
  localStorage.removeItem('studio-v2');
} catch {
  /* ignore */
}

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

function apply(): void {
  root.classList.toggle('s-calm', st.calm);
  root.classList.toggle('s-ruler', st.ruler);
  root.classList.toggle('s-contrast', st.contrast);
  root.classList.toggle('s-sans', st.font === 'sans');
  document.querySelectorAll<HTMLButtonElement>('.switchy[data-toggle]').forEach((b) => {
    const k = b.dataset.toggle as keyof Settings;
    b.setAttribute('aria-pressed', String(st[k] === true));
  });
  document.querySelectorAll<HTMLButtonElement>('.seg [data-font]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.font === st.font)));
}

window.addEventListener('pointermove', (e) => {
  if (st.ruler) root.style.setProperty('--ruler-y', e.clientY + 'px');
}, { passive: true });

document.querySelectorAll<HTMLButtonElement>('.switchy[data-toggle]').forEach((b) => {
  b.addEventListener('click', () => {
    const k = b.dataset.toggle as 'calm' | 'ruler' | 'contrast';
    st[k] = !st[k];
    save();
    apply();
    announce(`${NAMES[k]} ${st[k] ? 'on' : 'off'}`);
  });
});

document.querySelectorAll<HTMLButtonElement>('.seg [data-font]').forEach((b) =>
  b.addEventListener('click', () => {
    st.font = b.dataset.font === 'sans' ? 'sans' : 'serif';
    save();
    apply();
    announce(`Typeface: ${b.textContent?.trim()}`);
  }),
);

document.getElementById('studio-reset')?.addEventListener('click', () => {
  st = { ...DEFAULTS };
  save();
  apply();
  announce('Display settings were reset');
});

apply();
