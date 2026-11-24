// Gameplay previews for the game and app cards.
// - Mouse: hover a card (or reach it with the keyboard) and its still image fades into a looping,
//   muted gameplay video. Leaving the card fades back to the still and stops the video.
// - Touch screens have no hover, so each card gets a small "Play preview" button instead.
// - A "Gameplay previews" switch turns them all off (remembered on this device). They start off
//   for people who ask for reduced motion or Data Saver.
// - Videos are only downloaded when they are first needed, and only one plays at a time.

const cards = [...document.querySelectorAll<HTMLAnchorElement>('a.project__media[data-preview]')];
const toggle = document.querySelector<HTMLButtonElement>('#preview-toggle');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
const KEY = 'previews';
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
const FADE_MS = 350;

function storedChoice(): 'on' | 'off' | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'on' || v === 'off' ? v : null;
  } catch {
    return null;
  }
}
let enabled = (storedChoice() ?? (reduceMotion.matches || saveData ? 'off' : 'on')) === 'on';
let current: HTMLAnchorElement | null = null;

function videoFor(media: HTMLAnchorElement): HTMLVideoElement {
  let v = media.querySelector<HTMLVideoElement>('video');
  if (v) return v;
  v = document.createElement('video');
  v.className = 'project__video';
  v.muted = true;
  v.defaultMuted = true;
  v.loop = true;
  v.playsInline = true;
  v.preload = 'none';
  v.disablePictureInPicture = true;
  v.setAttribute('muted', '');
  v.setAttribute('playsinline', '');
  v.setAttribute('aria-hidden', 'true');
  v.tabIndex = -1;
  const base = `${import.meta.env.BASE_URL}video/${media.dataset.preview}`;
  for (const [ext, type] of [['webm', 'video/webm; codecs="vp9"'], ['mp4', 'video/mp4']] as const) {
    const s = document.createElement('source');
    s.src = `${base}.${ext}`;
    s.type = type;
    v.append(s);
  }
  media.querySelector('img')?.after(v);
  return v;
}

function play(media: HTMLAnchorElement): void {
  if (!enabled) return;
  if (current && current !== media) stop(current);
  current = media;
  const v = videoFor(media);
  const card = media.closest('.project');
  card?.querySelector('.preview-btn')?.setAttribute('aria-pressed', 'true');
  media.dataset.want = '1';
  if (v.readyState === 0) v.load();
  v.currentTime = 0;
  // show the video only once it is really playing, so there is never a blank flash
  v.play()
    .then(() => {
      if (media.dataset.want === '1') media.classList.add('is-previewing');
    })
    .catch(() => {
      /* autoplay blocked or not supported: the still image simply stays */
    });
}

function stop(media: HTMLAnchorElement): void {
  delete media.dataset.want;
  media.classList.remove('is-previewing');
  media.closest('.project')?.querySelector('.preview-btn')?.setAttribute('aria-pressed', 'false');
  if (current === media) current = null;
  const v = media.querySelector<HTMLVideoElement>('video');
  if (!v) return;
  window.setTimeout(() => {
    if (media.dataset.want === '1') return; // hovered again in the meantime
    v.pause();
    try {
      v.currentTime = 0;
    } catch {
      /* not loaded yet */
    }
  }, FADE_MS);
}

function stopAll(): void {
  cards.forEach(stop);
}

for (const media of cards) {
  const card = media.closest<HTMLElement>('.project');
  if (!card) continue;
  const name = card.querySelector('.project__title')?.textContent?.trim() ?? 'this project';

  // mouse: hover the card (a short delay avoids loading videos while just passing over)
  let timer = 0;
  card.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || !canHover.matches) return;
    timer = window.setTimeout(() => play(media), 120);
  });
  card.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    window.clearTimeout(timer);
    stop(media);
  });

  // keyboard: reaching the card's image link with Tab also plays the preview
  media.addEventListener('focus', () => {
    if (media.matches(':focus-visible')) play(media);
  });
  media.addEventListener('blur', () => stop(media));

  // touch screens: an explicit play / stop button
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'preview-btn';
  btn.setAttribute('aria-pressed', 'false');
  btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="i-play" d="M8 5.5v13l10.5-6.5z"/><path class="i-stop" d="M7 6h3.5v12H7zM13.5 6H17v12h-3.5z"/></svg><span class="visually-hidden">Play gameplay preview of ${name}</span>`;
  btn.addEventListener('click', () => {
    if (!enabled) setEnabled(true);
    if (media.classList.contains('is-previewing') || media.dataset.want === '1') stop(media);
    else play(media);
  });
  media.after(btn);
}

function setEnabled(on: boolean, save = true): void {
  enabled = on;
  document.documentElement.classList.toggle('previews-off', !on);
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(on));
    const state = toggle.querySelector('.preview-toggle__state');
    if (state) state.textContent = on ? 'On' : 'Off';
  }
  if (!on) stopAll();
  if (save) {
    try {
      localStorage.setItem(KEY, on ? 'on' : 'off');
    } catch {
      /* storage unavailable */
    }
  }
}
toggle?.addEventListener('click', () => setEnabled(!enabled));
setEnabled(enabled, false);

// pause everything when the tab is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopAll();
});
// Escape stops a playing preview
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && current) stop(current);
});
