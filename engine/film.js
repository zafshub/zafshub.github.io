// Film player. A film is a module exporting:
//   meta  – { title, duration, width, height, cover, poster, mix }
//   draw(ctx, t) – paints the frame at time t (seconds); a pure function of t
//   score(S)     – schedules the music with the synth in audio.js
// The page plays it live (picture + synthesized sound, kept in sync), and
// ?render exposes hooks the tools/render.cjs exporter uses to make an MP4.
import { collect, createSession, trigger, renderScore, toWav } from './audio.js';
import { settings } from './draw.js';

const ICON = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>',
  replay: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.6 4.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4.2 4.5v5.2h5.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  full: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load('italic 500 40px "Cormorant Garamond"'),
      document.fonts.load('500 40px "Cormorant Garamond"'),
    ]);
    await document.fonts.ready;
  } catch { /* fall back to Georgia */ }
}

function base64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export async function mountFilm(film, root = document.querySelector('[data-film]')) {
  const { meta } = film;
  const W = meta.width, H = meta.height, D = meta.duration;
  const params = new URLSearchParams(location.search);
  const events = collect(film.score);

  const canvas = document.createElement('canvas');
  canvas.className = 'film-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `${meta.title}: ${meta.logline ?? 'an animated short film'}`);
  const ctx = canvas.getContext('2d', { alpha: false });
  let scale = 1;

  const paint = (t) => {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    film.draw(ctx, Math.max(0, Math.min(D, t)));
  };

  await fontsReady();

  // ——— export mode, driven by tools/render.cjs ———
  if (params.has('render')) {
    document.body.classList.add('render');
    settings.animatedGrain = false;
    document.body.replaceChildren(canvas);
    canvas.width = W;
    canvas.height = H;
    window.__film = {
      meta,
      frame(t, q = 0.94) {
        paint(t);
        return canvas.toDataURL('image/jpeg', q);
      },
      async wav() {
        return base64(toWav(await renderScore(events, D, meta.mix)));
      },
      ready: true,
    };
    return;
  }

  // ——— live player ———
  root.innerHTML = `
    <div class="stage">
      <div class="overlay" data-state="start">
        <button class="big-play" type="button" aria-label="Play ${meta.title}">${ICON.play}</button>
        <p class="overlay-hint">Tap to play · sound on</p>
      </div>
    </div>
    <div class="bar">
      <button class="pp" type="button" aria-label="Play">${ICON.play}</button>
      <span class="time now">0:00</span>
      <input class="scrub" type="range" min="0" max="${D}" step="0.01" value="0" aria-label="Seek">
      <span class="time">${clock(D)}</span>
      <button class="mute" type="button" aria-label="Mute">${ICON.sound}</button>
      <button class="fs" type="button" aria-label="Full screen">${ICON.full}</button>
    </div>`;
  const stage = root.querySelector('.stage');
  stage.prepend(canvas);
  const overlay = root.querySelector('.overlay');
  const bigPlay = root.querySelector('.big-play');
  const hint = root.querySelector('.overlay-hint');
  const pp = root.querySelector('.pp');
  const scrub = root.querySelector('.scrub');
  const now = root.querySelector('.now');
  const mute = root.querySelector('.mute');
  const fs = root.querySelector('.fs');

  let t = Number(params.get('t')) || meta.cover || 0;
  let playing = false, ended = false, muted = false, dragging = false, wasPlaying = false;
  let started = params.has('t'); // the cover frame is only a poster: the first play starts at 0
  let ac = null, session = null, timer = 0, next = 0, from = 0, acStart = 0, perfStart = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(320, Math.min(W, Math.round(r.width * dpr)));
    if (w !== canvas.width) {
      canvas.width = w;
      canvas.height = Math.round((w * H) / W);
      scale = w / W;
      paint(t);
    }
  }
  new ResizeObserver(resize).observe(canvas);
  canvas.width = W / 2;
  canvas.height = H / 2;
  scale = 0.5;
  resize();
  paint(t);

  function audio() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ac = new AC({ latencyHint: 'playback' });
      // Let iPhones play Web Audio even with the ringer switch on silent.
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* not supported */ }
    }
    return ac;
  }

  function pump() {
    const horizon = from + (ac.currentTime - acStart) + 1.5;
    while (next < events.length && events[next].t < horizon) {
      const e = events[next++];
      trigger(session, e, acStart + (e.t - from));
    }
  }

  async function play() {
    if (playing) return;
    if (!started || ended || t >= D - 0.05) t = 0;
    started = true;
    ended = false;
    playing = true;
    overlay.dataset.state = 'hidden';
    bigPlay.innerHTML = ICON.play;
    bigPlay.setAttribute('aria-label', `Play ${meta.title}`);
    hint.textContent = 'Tap to play · sound on';
    pp.innerHTML = ICON.pause;
    pp.setAttribute('aria-label', 'Pause');
    const a = audio();
    try { await a.resume(); } catch { /* keep going silently */ }
    if (!playing) return;
    session = createSession(a, meta.mix);
    if (muted) session.gate.gain.value = 0;
    from = t;
    acStart = a.currentTime + 0.1;
    perfStart = performance.now() + 100;
    for (const e of events) {
      if (e.sustained && e.t < from && e.t + e.dur > from + 0.3) trigger(session, e, acStart, from - e.t);
    }
    next = events.findIndex((e) => e.t >= from);
    if (next < 0) next = events.length;
    pump();
    timer = setInterval(pump, 100);
    requestAnimationFrame(loop);
  }

  function pause(showOverlay = false) {
    if (!playing) return;
    playing = false;
    clearInterval(timer);
    session?.stop();
    session = null;
    pp.innerHTML = ICON.play;
    pp.setAttribute('aria-label', 'Play');
    if (showOverlay) overlay.dataset.state = 'paused';
  }

  function finish() {
    pause();
    ended = true;
    t = D;
    overlay.dataset.state = 'ended';
    bigPlay.innerHTML = ICON.replay;
    bigPlay.setAttribute('aria-label', 'Watch again');
    hint.textContent = 'Watch again';
  }

  function loop() {
    if (!playing) return;
    t = from + Math.max(0, (performance.now() - perfStart) / 1000);
    if (t >= D) {
      paint(D);
      finish();
      sync();
      return;
    }
    paint(t);
    sync();
    requestAnimationFrame(loop);
  }

  function sync() {
    if (!dragging) scrub.value = String(t);
    now.textContent = clock(t);
    scrub.style.setProperty('--p', `${(t / D) * 100}%`);
  }

  const toggle = () => (playing ? pause(true) : play());
  bigPlay.addEventListener('click', () => {
    if (overlay.dataset.state === 'ended') t = 0;
    play();
  });
  pp.addEventListener('click', toggle);
  canvas.addEventListener('click', toggle);

  scrub.addEventListener('pointerdown', () => { dragging = true; wasPlaying = playing; pause(); });
  scrub.addEventListener('input', () => {
    if (playing) { wasPlaying = true; pause(); }
    started = true;
    t = Number(scrub.value);
    ended = false;
    paint(t);
    sync();
  });
  scrub.addEventListener('change', () => {
    dragging = false;
    if (wasPlaying) play();
    else overlay.dataset.state = 'paused';
    wasPlaying = false;
  });

  mute.addEventListener('click', () => {
    muted = !muted;
    mute.innerHTML = muted ? ICON.muted : ICON.sound;
    mute.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    if (session) {
      const g = session.gate.gain;
      g.cancelScheduledValues(ac.currentTime);
      g.setTargetAtTime(muted ? 0 : session.level, ac.currentTime, 0.03);
    }
  });

  const canFull = stage.requestFullscreen || stage.webkitRequestFullscreen;
  if (!canFull) fs.hidden = true;
  fs.addEventListener('click', () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      canFull.call(stage);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement && e.key !== ' ') return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const was = playing;
      pause();
      started = true;
      t = Math.max(0, Math.min(D - 0.1, t + (e.key === 'ArrowRight' ? 3 : -3)));
      ended = false;
      paint(t);
      sync();
      if (was) play();
    } else if (e.key === 'm') mute.click();
    else if (e.key === 'f' && !fs.hidden) fs.click();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(true); });
  sync();
}
