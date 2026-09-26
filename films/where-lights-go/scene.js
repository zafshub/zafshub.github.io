// Where the Lights Go — a short film.
// Every conversation is a small light set on the water. This is where they go.
// Every frame is painted from nothing as a pure function of time t.
import { TAU, clamp, lerp, seg, smooth, easeInOut, easeOut, hash, noise, mixRgb, css } from '../../engine/util.js';
import { glow, disc, grain, vignette } from '../../engine/draw.js';

export const meta = {
  title: 'Where the Lights Go',
  logline: 'Every conversation is a small light set on the water. This is where they go.',
  duration: 40,
  width: 1920,
  height: 1080,
  cover: 9,
  poster: 29.5,
  mix: { reverb: 4.2, wet: 0.42 },
};

const W = 1920, H = 1080;
const N = 170;
const T = { first: 1.4, rise: 23.5, galaxy: 31, again: 33.2, out: 37.6, end: 40 };

// candle colours: mostly warm, a few rose, violet and sea-green
const COLORS = [[255, 196, 120], [255, 176, 96], [255, 214, 150], [255, 150, 130], [214, 160, 255], [150, 230, 210]];
const colorOf = (i) => COLORS[i === 0 ? 0 : hash(i, 3) < 0.62 ? Math.floor(hash(i, 4) * 3) : 3 + Math.floor(hash(i, 5) * 3)];

// ——— glow sprites: drawn once, stamped hundreds of times per frame ———
const sprites = new Map();
function sprite(col) {
  const key = col.join();
  if (!sprites.has(key)) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, css(mixRgb(col, [255, 255, 255], 0.6), 1));
    r.addColorStop(0.08, css(col, 0.85));
    r.addColorStop(0.3, css(col, 0.28));
    r.addColorStop(0.65, css(col, 0.06));
    r.addColorStop(1, css(col, 0));
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    sprites.set(key, c);
  }
  return sprites.get(key);
}
function stamp(ctx, col, x, y, r, a) {
  if (a <= 0.004 || r < 0.5) return;
  ctx.globalAlpha = Math.min(1, a);
  ctx.drawImage(sprite(col), x - r, y - r, r * 2, r * 2);
}

// ——— camera: close on the first light, pulling back over the sea, tilting up to the sky ———
function camera(t) {
  const pull = lerp(0, 0.55, easeInOut(seg(t, 3, 22)));
  const tilt = easeInOut(seg(t, 21.5, 30.5)) - 0.38 * easeInOut(seg(t, 32.2, 36.5));
  return { pull, hy: lerp(330, 820, tilt), tilt };
}
const project = (cam, x, z) => {
  const zp = z + cam.pull;
  return { x: W / 2 + (x * 700) / zp, y: cam.hy + 420 / zp, s: 1 / zp };
};

// ——— the boats ———
function boat(i, t) {
  const birth = i === 0 ? T.first : T.first + 2.2 + 19 * (i / N) ** 0.7 + 0.4 * hash(i, 6);
  const age = t - birth;
  if (age < 0) return null;
  // set down near the viewer, carried away on a slow winding current
  const side = i === 0 ? 0 : (hash(i, 7) - 0.5) * 2;
  const speed = 0.025 + 0.045 * hash(i, 8);
  const z = (i === 0 ? 0.75 : 0.7 + 1.8 * hash(i, 15) ** 1.5) + age * speed;
  const x = side * (0.5 + 1.1 * z) + 0.15 * Math.sin(age * 0.35 + hash(i, 9) * TAU) + 0.05 * noise(age * 0.3, i);
  const bob = Math.sin(t * 1.6 + i) * 0.5;
  // rising: each light leaves its boat and climbs to its place in the galaxy
  const riseAt = T.rise + 7 * hash(i, 10) ** 0.9 + (i === 0 ? 5.5 : 0);
  const rise = easeInOut(seg(t, riseAt, riseAt + 3.4));
  return { i, birth, age, x, z, bob, rise, col: colorOf(i), fadeIn: smooth(seg(age, 0, 0.8)) };
}

function galaxyPoint(i, t, cam) {
  const k = (i + 0.5) / N;
  const r = 40 + 640 * Math.sqrt(k);
  const arm = i % 3;
  const th = r * 0.0068 + (arm * TAU) / 3 + 0.35 * (hash(i, 11) - 0.5) + t * 0.018;
  const cx = W / 2, cy = cam.hy - 470;
  return [cx + Math.cos(th) * r * 1.18, cy + Math.sin(th) * r * 0.42 + (hash(i, 12) - 0.5) * 30 * k];
}

function paperBoat(ctx, x, y, s, col, a) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = a;
  // folded paper hull and sail, lit warm from the inside
  ctx.fillStyle = css(mixRgb([236, 226, 210], col, 0.35));
  ctx.beginPath();
  ctx.moveTo(-26, -2);
  ctx.lineTo(26, -2);
  ctx.lineTo(16, 10);
  ctx.lineTo(-16, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = css(mixRgb([206, 196, 184], col, 0.25));
  ctx.beginPath();
  ctx.moveTo(-14, -2);
  ctx.lineTo(0, -24);
  ctx.lineTo(14, -2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(80,60,50,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(0, -2);
  ctx.stroke();
  ctx.restore();
}

// ——— the frame ———
export function draw(ctx, t) {
  const cam = camera(t);
  const HY = cam.hy;

  // night sky
  const g = ctx.createLinearGradient(0, HY - 1100, 0, HY);
  g.addColorStop(0, '#02030a');
  g.addColorStop(0.55, '#070b22');
  g.addColorStop(1, '#16204a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, Math.max(0, HY) + 2);

  // a few faint stars that were always there
  for (let i = 0; i < 260; i++) {
    const x = hash(i, 20) * W, y = HY - 40 - hash(i, 21) ** 1.3 * 1100;
    if (y < -10 || y > HY - 20) continue;
    const tw = 0.5 + 0.5 * Math.sin(t * (0.6 + hash(i, 22) * 2) + i);
    disc(ctx, x, y, 0.6 + 1.1 * hash(i, 23) ** 4, css([210, 220, 255], 0.35 * tw * smooth(seg(HY - y, 20, 160))));
  }

  // far shore and a hint of mist on the horizon
  ctx.fillStyle = '#0b1128';
  ctx.beginPath();
  ctx.moveTo(0, HY + 2);
  for (let x = 0; x <= W; x += 20) ctx.lineTo(x, HY - 10 - 26 * (0.5 + 0.5 * noise(x * 0.004, 2)) * Math.exp(-(((x - 420) / 520) ** 2)) - 14 * Math.exp(-(((x - 1560) / 300) ** 2)));
  ctx.lineTo(W, HY + 2);
  ctx.fill();

  // the water
  const wg = ctx.createLinearGradient(0, HY, 0, H);
  wg.addColorStop(0, '#0d1433');
  wg.addColorStop(0.3, '#070b1f');
  wg.addColorStop(1, '#020309');
  ctx.fillStyle = wg;
  ctx.fillRect(0, HY, W, Math.max(0, H - HY));
  ctx.lineCap = 'round';
  for (let j = 0; j < 46; j++) {
    const k = j / 46;
    const y = HY + 3 + (H - HY) * k * k;
    if (y > H) break;
    const d = clamp((y - HY) / Math.max(1, H - HY));
    ctx.strokeStyle = css([120, 140, 200], (0.03 + 0.08 * d) * (0.6 + 0.4 * Math.sin(t * 0.9 + j * 1.3)));
    ctx.lineWidth = 0.6 + 1.6 * d;
    ctx.beginPath();
    for (let i = 0; i < 14; i++) {
      let x = hash(i + j * 41, 30) * 2400 - 240 + t * (4 + 14 * d) * (j % 2 ? 1 : -1);
      x = ((((x + 240) % 2400) + 2400) % 2400) - 240;
      ctx.moveTo(x, y);
      ctx.lineTo(x + (10 + 60 * d) * (0.4 + hash(i, j)), y);
    }
    ctx.stroke();
  }

  // gather the boats, far to near
  const boats = [];
  for (let i = 0; i < N; i++) {
    const b = boat(i, t);
    if (b) boats.push(b);
  }
  boats.sort((a, b) => b.z - a.z);

  // ripples where each light was set down
  ctx.lineWidth = 1.4;
  for (const b of boats) {
    if (b.age > 3.5) continue;
    const p = project(cam, b.x, b.z);
    for (let r = 0; r < 3; r++) {
      const a = b.age - r * 0.45;
      if (a <= 0) continue;
      const rad = (20 + 120 * a ** 0.6) * p.s;
      ctx.strokeStyle = css(b.col, 0.35 * (1 - a / 3.5) * (b.i === 0 ? 1.4 : 0.6));
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, rad, rad * 0.22, 0, 0, TAU);
      ctx.stroke();
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // reflections
  for (const b of boats) {
    const p = project(cam, b.x, b.z);
    const lit = b.fadeIn * (1 - b.rise);
    if (lit <= 0.01 || p.y > H + 40) continue;
    for (let k = 1; k < 7; k++) {
      const yy = p.y + k * 9 * Math.max(0.4, p.s);
      const w = (14 + 10 * Math.sin(t * 3 + k + b.i)) * p.s;
      ctx.globalAlpha = 0.22 * lit * (1 - k / 7) * clamp(1.3 * p.s + 0.2);
      ctx.fillStyle = css(b.col);
      ctx.fillRect(p.x - w / 2 + 3 * Math.sin(t * 2 + k), yy, w, Math.max(1, 2 * p.s));
    }
  }
  ctx.restore();

  // the boats themselves (they stay on the water, dark, once their light has gone)
  for (const b of boats) {
    const p = project(cam, b.x, b.z);
    if (p.y > H + 60) continue;
    const s = p.s * 1.5;
    paperBoat(ctx, p.x, p.y + b.bob * p.s, s, mixRgb([60, 50, 60], b.col, 1 - b.rise), b.fadeIn * (1 - 0.7 * b.rise));
  }

  // the lights: on the boats, then climbing into the sky
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const b of boats) {
    const p = project(cam, b.x, b.z);
    const flame = 0.85 + 0.15 * Math.sin(t * 9 + b.i * 3) * Math.sin(t * 4.3 + b.i);
    const onWater = [p.x, p.y - 16 * p.s * 1.5 + b.bob * p.s];
    const star = galaxyPoint(b.i, t, cam);
    const k = b.rise;
    const x = lerp(onWater[0], star[0], k) + Math.sin(k * Math.PI) * 60 * (hash(b.i, 13) - 0.5);
    const y = lerp(onWater[1], star[1], easeOut(k));
    const size = lerp(70 * p.s * 1.5, 16 + 20 * hash(b.i, 14), k);
    const a = b.fadeIn * flame * (b.i === 0 ? 1.2 : 0.85) * lerp(clamp(1.3 * p.s + 0.2), 1, k);
    stamp(ctx, b.col, x, y, size * (1 + 0.8 * Math.sin(k * Math.PI)), a);
    if (k > 0 && k < 1) {
      for (let q = 1; q < 6; q++) {
        const kk = Math.max(0, k - q * 0.04);
        stamp(ctx, b.col, lerp(onWater[0], star[0], kk), lerp(onWater[1], star[1], easeOut(kk)), size * 0.5, a * 0.25 * (1 - q / 6));
      }
    }
  }
  ctx.globalAlpha = 1;

  // the galaxy's soft core once enough lights have arrived
  const core = smooth(seg(t, 27, T.galaxy + 2));
  if (core > 0) {
    const c = galaxyPoint(0, t, cam);
    glow(ctx, W / 2, cam.hy - 470, 520, [255, 210, 170], 0.16 * core);
    glow(ctx, W / 2, cam.hy - 470, 1200, [150, 140, 255], 0.07 * core);
    void c;
  }

  // …and again: a new light is set down on the water
  const again = t - T.again;
  if (again > 0) {
    const x = W / 2 + 40, y = H - 150;
    const a = smooth(seg(again, 0, 0.8));
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 1.6;
    for (let r = 0; r < 3; r++) {
      const q = again - r * 0.45;
      if (q <= 0) continue;
      ctx.strokeStyle = css([255, 196, 120], 0.35 * Math.max(0, 1 - q / 4));
      ctx.beginPath();
      ctx.ellipse(x, y + 6, 30 + 160 * q ** 0.6, (30 + 160 * q ** 0.6) * 0.2, 0, 0, TAU);
      ctx.stroke();
    }
    paperBoat(ctx, x, y + Math.sin(t * 1.6) * 2, 1.9, [255, 196, 120], a);
    ctx.globalCompositeOperation = 'lighter';
    stamp(ctx, [255, 196, 120], x, y - 30, 110, a * (0.9 + 0.1 * Math.sin(t * 9)));
    ctx.fillStyle = css([255, 196, 120], 0.2 * a);
    for (let k = 1; k < 8; k++) ctx.fillRect(x - 14 + 4 * Math.sin(t * 2 + k), y + 10 + k * 9, 28, 2);
  }
  ctx.restore();

  vignette(ctx, W, H, 0.5);
  const black = Math.max(1 - smooth(seg(t, 0, 1.6)), smooth(seg(t, T.out, T.end - 0.1)));
  if (black > 0) {
    ctx.fillStyle = `rgba(0,0,0,${black})`;
    ctx.fillRect(0, 0, W, H);
  }
  grain(ctx, W, H, t, 0.05);
}

// ——— the music: D lydian, luminous and slow ———
const LYD = ['D', 'E', 'F#', 'G#', 'A', 'B', 'C#'];
const note = (d) => `${LYD[((d % 7) + 7) % 7]}${4 + Math.floor(d / 7)}`;

export function score(S) {
  // the water
  S.noise(0, { dur: 40, type: 'lowpass', f0: 360, q: 0.3, vel: 0.04, attack: 3, release: 3, lfo: [0.11, 0.6], send: 0.15 });
  // one bell for the first light, and for each of the first few that join it
  S.bell(T.first + 0.05, note(4), { vel: 0.13, dur: 4 });
  for (let i = 1; i < 16; i++) {
    const b = T.first + 2.2 + 19 * (i / N) ** 0.7 + 0.4 * hash(i, 6);
    S.bell(b, note([7, 9, 11, 8, 6, 4, 9, 11, 13, 12, 9, 7, 11, 14, 16][i - 1]), { vel: 0.05 + 0.02 * hash(i, 1), dur: 3, pan: (hash(i, 7) - 0.5) * 1.4 });
  }
  // a slow pad: D, then B minor-ish, G#-flavoured lydian lift, back home
  const pads = [
    [2.5, ['D3', 'A3', 'E4'], 7],
    [9.5, ['B2', 'F#3', 'C#4'], 6],
    [15.5, ['G#2', 'D#3', 'B3'], 4],
    [19.5, ['A2', 'E3', 'C#4'], 4],
    [23.5, ['D3', 'A3', 'F#4', 'G#4'], 8],
    [31.5, ['D3', 'A3', 'E4', 'F#4'], 7.5],
  ];
  for (const [t0, notes, d] of pads) S.pad(t0, notes, { dur: d, vel: 0.1, attack: 2.4, release: 2.6, cutoff: 900 });
  // keys: a lullaby line while the lights spread over the sea
  const line = [[9.6, 4], [10.8, 6], [12, 7], [13.8, 6], [15.6, 3], [16.8, 4], [18, 6], [20, 4], [21.2, 2], [22.4, 4]];
  for (const [t0, d] of line) S.keys(t0, note(d), { vel: 0.09, dur: 3 });
  // the rise: an ascending shimmer of bells as the lights climb
  for (let k = 0; k < 28; k++) S.bell(T.rise + 0.4 + k * 0.26, note(7 + (k % 7) + Math.floor(k / 7) * 2), { vel: 0.03 + 0.01 * (k / 28), dur: 2.4, pan: Math.sin(k) * 0.7 });
  S.noise(24, { dur: 7, type: 'highpass', f0: 3000, f1: 7000, q: 0.4, vel: 0.03, shape: 'swell', send: 0.6 });
  // the galaxy: one warm chord
  S.keys(T.galaxy, 'D3', { vel: 0.1, dur: 5 });
  ['D4', 'A4', 'E5', 'G#5'].forEach((n, i) => S.keys(T.galaxy + 0.12 * i, n, { vel: 0.07, dur: 5 }));
  // and again: the first bell, once more
  S.bell(T.again + 0.05, note(4), { vel: 0.13, dur: 5 });
  S.keys(T.again + 1.2, note(6), { vel: 0.06, dur: 4 });
}
