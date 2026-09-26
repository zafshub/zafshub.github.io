// One Sky a Day — page logic: pick a date, animate its painting, play its song, save or share it.
import { prepare, song, today, shiftDate, longDate, CARD, DAY_ONE } from './sky.js';
import { collect, createSession, trigger } from '../engine/audio.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#sky');
const ctx = canvas.getContext('2d');
canvas.width = CARD.w;
canvas.height = CARD.h;

const params = new URLSearchParams(location.search);
const valid = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '') && !Number.isNaN(Date.parse(d));
let date = valid(params.get('d')) ? params.get('d') : today();
let sky = null;
let start = performance.now();
let raf = 0;

// ——— picture ———

function frame() {
  sky.draw(ctx, (performance.now() - start) / 1000);
  raf = requestAnimationFrame(frame);
}

function show(d) {
  date = d;
  sky = prepare(date);
  const R = sky.recipe;
  const no = String(Math.max(0, R.no)).padStart(3, '0');
  $('#no').textContent = R.no >= 1 ? `No. ${no}` : 'Before day one';
  $('#title').textContent = R.title;
  $('#when').textContent = `${longDate(date)} · ${R.moon.name}`;
  $('#recipe').textContent = describe(R);
  document.title = `${R.title} · One Sky a Day`;
  $('#next').disabled = date >= today();
  $('#prev').disabled = date <= DAY_ONE;
  $('#today').disabled = date === today();
  const url = new URL(location.href);
  if (date === today()) url.searchParams.delete('d');
  else url.searchParams.set('d', date);
  history.replaceState(null, '', url);
  if (playing) restartSong();
  cancelAnimationFrame(raf);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) sky.draw(ctx, 0);
  else frame();
}

function describe(R) {
  const time = { dawn: 'dawn', day: 'midday', golden: 'golden hour', dusk: 'dusk', night: 'night' }[R.time];
  const land = { sea: 'open sea', islands: 'islands', mountains: 'mountains', hills: 'hills', dunes: 'dunes', city: 'a city', forest: 'a pine forest' }[R.land];
  const extra = [
    R.aurora && 'an aurora',
    R.weather !== 'clear' && { clouds: 'clouds', rain: 'rain', snow: 'snow', fog: 'fog' }[R.weather],
    R.focal !== 'none' && { lighthouse: 'a lighthouse', sailboat: 'a sailboat', cabin: 'a cabin', tent: 'a campfire', windmill: 'a windmill', tree: 'a lone tree', house: 'a house', sitter: 'someone watching', wanderer: 'a wanderer' }[R.focal],
    R.balloon && 'a balloon',
  ].filter(Boolean);
  const song = `${R.music.minor ? 'minor' : 'major'} key, ${R.music.bpm} bpm`;
  return `Today's dice: ${land} at ${time}${extra.length ? ', with ' + extra.join(', ') : ''}. Song: ${song}.`;
}

// ——— song ———

let ac = null, session = null, playing = false, loopTimer = 0;

function audio() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ac = new AC({ latencyHint: 'playback' });
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* not supported */ }
  }
  return ac;
}

function scheduleLoops(s, events, loop, t0) {
  let k = 0;
  const pump = () => {
    while (t0 + k * loop < s.ac.currentTime + 2) {
      for (const e of events) trigger(s, e, t0 + k * loop + e.t);
      k++;
    }
  };
  pump();
  return setInterval(pump, 500);
}

function restartSong() {
  stopSong(false);
  let loop = 0;
  const events = collect((S) => { loop = song(sky.recipe, S); });
  session = createSession(ac, { reverb: 3.6, wet: 0.38, volume: 1.3 });
  if (streamDest) session.gate.connect(streamDest);
  loopTimer = scheduleLoops(session, events, loop, ac.currentTime + 0.1);
  playing = true;
  $('#play').setAttribute('aria-pressed', 'true');
  $('#play .label').textContent = 'Stop the song';
}

function stopSong(update = true) {
  clearInterval(loopTimer);
  session?.stop(0.4);
  session = null;
  if (update) {
    playing = false;
    $('#play').setAttribute('aria-pressed', 'false');
    $('#play .label').textContent = 'Play its song';
  }
}

$('#play').addEventListener('click', async () => {
  if (playing) return stopSong();
  const a = audio();
  await a.resume();
  restartSong();
});

// ——— navigation ———

$('#prev').addEventListener('click', () => show(shiftDate(date, -1)));
$('#next').addEventListener('click', () => show(shiftDate(date, 1)));
$('#today').addEventListener('click', () => show(today()));
document.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (e.key === 'ArrowLeft' && !$('#prev').disabled) show(shiftDate(date, -1));
  if (e.key === 'ArrowRight' && !$('#next').disabled) show(shiftDate(date, 1));
});

// ——— saving & sharing ———

const fileBase = () => `one-sky-${String(Math.max(0, sky.recipe.no)).padStart(3, '0')}-${date}`;
const caption = () => `One Sky a Day · No. ${String(Math.max(0, sky.recipe.no)).padStart(3, '0')}: "${sky.recipe.title}"\nPainted by code for ${longDate(date)}. No images, no AI image model, just JavaScript.`;

async function deliver(blob, name) {
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: caption() });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function note(msg) {
  const el = $('#status');
  el.textContent = msg;
  clearTimeout(note.t);
  note.t = setTimeout(() => (el.textContent = ''), 5000);
}

$('#save').addEventListener('click', () => {
  canvas.toBlob((b) => b && deliver(b, `${fileBase()}.png`), 'image/png');
});

$('#copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(caption());
    note('Caption copied.');
  } catch {
    note(caption());
  }
});

let streamDest = null;
// X only takes H.264 + AAC, so ask for that first; other formats still save, with a warning.
const RECORD_TYPES = [
  ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', true],
  ['video/mp4;codecs=avc1.4D401F,mp4a.40.2', true],
  ['video/mp4;codecs=avc1,mp4a.40.2', true],
  ['video/mp4', false],
  ['video/webm;codecs=vp9,opus', false],
  ['video/webm', false],
];
const [recordType, xReady] = (() => {
  if (!window.MediaRecorder || !canvas.captureStream) return [null, false];
  return RECORD_TYPES.find(([t]) => MediaRecorder.isTypeSupported(t)) || [null, false];
})();
if (!recordType) $('#record').hidden = true;

$('#record').addEventListener('click', async () => {
  const btn = $('#record');
  if (btn.disabled) return;
  btn.disabled = true;
  const a = audio();
  await a.resume();
  streamDest = a.createMediaStreamDestination();
  restartSong();
  const stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...streamDest.stream.getAudioTracks()]);
  const rec = new MediaRecorder(stream, { mimeType: recordType, videoBitsPerSecond: 8_000_000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.onstop = () => {
    const type = recordType.split(';')[0];
    deliver(new Blob(chunks, { type }), `${fileBase()}.${type === 'video/mp4' ? 'mp4' : 'webm'}`);
    if (!xReady) note('Saved. This browser can\'t record H.264, which X needs. On iPhone use Safari, or screen-record instead.');
    streamDest = null;
    stopSong();
    btn.disabled = false;
    btn.querySelector('.label').textContent = 'Record 12s video';
  };
  rec.start(250);
  let left = 12;
  btn.querySelector('.label').textContent = `Recording… ${left}s`;
  const tick = setInterval(() => {
    left--;
    btn.querySelector('.label').textContent = `Recording… ${left}s`;
    if (left <= 0) {
      clearInterval(tick);
      rec.stop();
    }
  }, 1000);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(raf);
    if (playing) stopSong();
  } else if (sky) {
    frame();
  }
});

show(date);
