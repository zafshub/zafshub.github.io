// Code Draws Istanbul · No. 3 — Merdiven Kedileri (the stair cats).
// Evening on the rainbow stairs. A kitten, a butterfly, the lamps coming on, the moon over the Bosphorus.
// Every frame is painted from nothing as a pure function of time t.
import { TAU, lerp, seg, smooth, easeInOut, easeOut, fade, hash, noise, mixRgb, css, keyColor } from '../../engine/util.js';
import { glow, disc, grain, vignette, caption } from '../../engine/draw.js';
import { cat, minaret, roofs, makamHz } from '../kit.js';

export const meta = {
  title: 'Merdiven Kedileri',
  logline: 'Evening on the rainbow stairs: a kitten, a butterfly, the lamps coming on and the moon over the Bosphorus.',
  duration: 24,
  width: 1920,
  height: 1080,
  cover: 3,
  poster: 18.3,
  mix: { reverb: 3.4, wet: 0.34 },
};

const W = 1920, H = 1080;
const T = { climb: 3.4, wiggle1: 8.3, pounce1: 9.2, dusk: 10, lamps: 11, wiggle2: 12.8, pounce2: 13.6, tumble: 14.2, dazed: 14.8, moon: 15, home: 16.4, curl: 19.2, card: 21.8, end: 24 };

// ——— the stairs: twelve steps rising to the right ———

const N = 12, RUN = 150, RISE = 62, X0 = 40, Y0 = 1010;
const stepX = (i) => X0 + i * RUN;
const stepY = (i) => Y0 - i * RISE;
const RAINBOW = ['#e0524a', '#ee8a3c', '#f2c243', '#7cbf58', '#3fa7a0', '#4a7fc4', '#8a62b8', '#d4629a'];
/** A point standing on step i, k along its tread (0..1). */
const on = (i, k) => [stepX(i) + 18 + k * (RUN - 36), stepY(i)];

// ——— light through the evening ———

const SKY_TOP = [[0, '#6f7fc0'], [10, '#5a5fa6'], [13, '#26295e'], [16, '#131838']];
const SKY_LOW = [[0, '#ffc98a'], [10, '#f59a78'], [13, '#8a5a8a'], [16, '#2c2f5c']];
const dark = (t) => smooth(seg(t, 9.5, 14.5));
const lampOn = (t, i) => smooth(seg(t, T.lamps + i * 0.6, T.lamps + i * 0.6 + 0.35)) * (0.94 + 0.06 * Math.sin(t * 23 + i) * Math.sin(t * 7));

function sky(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, 700);
  g.addColorStop(0, css(keyColor(SKY_TOP, t)));
  g.addColorStop(1, css(keyColor(SKY_LOW, t)));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // stars
  const d = dark(t);
  for (let i = 0; i < 120 && d > 0.1; i++) {
    const tw = 0.6 + 0.4 * Math.sin(t * (0.8 + 2 * hash(i, 5)) + i);
    disc(ctx, hash(i, 1) * W, hash(i, 2) ** 1.4 * 520, 0.8 + 1.3 * hash(i, 3) ** 4, css([255, 246, 230], (d - 0.1) * 0.8 * tw));
  }
  // the moon rising over the Asian shore
  const mk = easeOut(seg(t, T.moon, 20));
  if (t > T.moon - 0.5) {
    const mx = 1566, my = lerp(520, 292, mk);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, mx, my, 420, [220, 225, 255], 0.35 * smooth(seg(t, T.moon, 16)));
    ctx.restore();
    disc(ctx, mx, my, 58, css([250, 244, 222], smooth(seg(t, T.moon - 0.5, 15.8))));
    disc(ctx, mx - 18, my - 10, 10, css([226, 220, 200], 0.5 * smooth(seg(t, T.moon - 0.5, 15.8))));
    disc(ctx, mx + 16, my + 16, 7, css([226, 220, 200], 0.5 * smooth(seg(t, T.moon - 0.5, 15.8))));
  }
}

function view(ctx, t) {
  // the Bosphorus and the far shore, seen past the top of the stairs
  const d = dark(t);
  const sea = mixRgb('#e7a37e', '#1d2448', d);
  ctx.fillStyle = css(sea);
  ctx.fillRect(1000, 560, 1000, 200);
  const shore = mixRgb('#7a5d86', '#141a36', d);
  ctx.fillStyle = css(shore);
  ctx.beginPath();
  ctx.moveTo(1000, 562);
  for (let x = 1000; x <= 2000; x += 10) ctx.lineTo(x, 540 - 26 * (0.5 + 0.5 * noise(x * 0.006, 8)) - 18 * Math.exp(-(((x - 1450) / 150) ** 2)));
  ctx.lineTo(2000, 562);
  ctx.fill();
  roofs(ctx, 1000, 2000, (x) => 548 - 20 * (0.5 + 0.5 * noise(x * 0.006, 8)), 31, css(shore), d);
  minaret(ctx, 1452, 540, 120, 8, css(shore), 2);
  minaret(ctx, 1500, 540, 110, 8, css(shore), 2);
  ctx.fillStyle = css(shore);
  ctx.beginPath();
  ctx.ellipse(1476, 520, 30, 26, 0, Math.PI, TAU);
  ctx.fill();
  // moonlight on the water
  if (t > T.moon) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let j = 0; j < 14; j++) {
      const y = 568 + j * 12;
      const w = (20 + j * 8) * (0.5 + 0.5 * Math.sin(t * 2 + j));
      ctx.fillStyle = css([240, 236, 220], 0.35 * smooth(seg(t, 16, 19)) * (1 - j / 16));
      ctx.fillRect(1560 - w / 2 + 6 * Math.sin(t + j), y, w, 2);
    }
    ctx.restore();
  }
}

function building(ctx, t) {
  // the tall old apartment the stairs climb past
  const d = dark(t);
  const wall = mixRgb('#e4c08a', '#3a3350', d * 0.75);
  ctx.fillStyle = css(wall);
  ctx.beginPath();
  ctx.moveTo(-20, H);
  ctx.lineTo(-20, 40);
  ctx.lineTo(1080, 40);
  ctx.lineTo(1080, H);
  ctx.fill();
  ctx.fillStyle = css(mixRgb(wall, [60, 40, 50], 0.25));
  ctx.fillRect(-20, 40, 1100, 22);
  ctx.fillRect(1040, 40, 40, H);
  // windows, lighting up one by one after dusk
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
      const x = 40 + c * 170, y = 110 + r * 190;
      const k = hash(r * 7 + c, 3);
      const on = smooth(seg(t, 10.5 + 5 * k, 11 + 5 * k)) * (k > 0.35 ? 1 : 0);
      ctx.fillStyle = css(mixRgb('#f6ecda', '#2a2640', d * 0.7));
      ctx.fillRect(x - 8, y - 8, 96, 136);
      ctx.fillStyle = css(mixRgb(mixRgb('#8fa9c4', '#2c3450', d), [255, 206, 130], on));
      ctx.fillRect(x, y, 80, 120);
      ctx.fillStyle = css(mixRgb('#f6ecda', '#2a2640', d * 0.7));
      ctx.fillRect(x + 38, y, 4, 120);
      ctx.fillRect(x, y + 52, 80, 4);
      if (on > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, x + 40, y + 60, 160, [255, 190, 110], 0.12 * on);
        ctx.restore();
      }
      if ((r + c) % 3 === 0) {
        // a flower box
        ctx.fillStyle = css(mixRgb('#b0603c', '#3a2a30', d * 0.6));
        ctx.fillRect(x - 6, y + 122, 92, 14);
        for (let f = 0; f < 6; f++) disc(ctx, x + 4 + f * 15, y + 118 - 4 * Math.sin(f * 2), 7, css(mixRgb(f % 2 ? '#e0526a' : '#5f9a52', '#2a2436', d * 0.6)));
      }
    }
  }
  // laundry across a balcony
  ctx.strokeStyle = css(mixRgb('#5a4a40', '#1a1628', d));
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(360, 310);
  ctx.quadraticCurveTo(560, 340, 760, 306);
  ctx.stroke();
  const clothes = ['#e05a5a', '#f2d06a', '#6aa0d8', '#f4f0e8', '#8ac47a'];
  for (let i = 0; i < 5; i++) {
    const x = 400 + i * 76, y = 318 + 10 * Math.sin((i / 4) * Math.PI);
    const sw = 4 * Math.sin(t * 1.6 + i);
    ctx.fillStyle = css(mixRgb(clothes[i], '#2a2436', d * 0.7));
    ctx.beginPath();
    ctx.moveTo(x - 20, y);
    ctx.lineTo(x + 20, y);
    ctx.lineTo(x + 18 + sw, y + 56);
    ctx.lineTo(x - 18 + sw, y + 56);
    ctx.fill();
  }
}

function stairs(ctx, t) {
  const d = dark(t);
  // stone retaining wall under the stairs
  ctx.fillStyle = css(mixRgb('#9a9088', '#2a2838', d * 0.8));
  ctx.beginPath();
  ctx.moveTo(-20, H + 20);
  for (let i = 0; i < N; i++) {
    ctx.lineTo(stepX(i), stepY(i) + RISE + 60);
    ctx.lineTo(stepX(i) + RUN, stepY(i) + RISE + 60);
  }
  ctx.lineTo(W + 20, stepY(N - 1) + RISE + 60);
  ctx.lineTo(W + 20, H + 20);
  ctx.fill();
  ctx.strokeStyle = css(mixRgb('#7d746e', '#1c1a28', d * 0.8));
  ctx.lineWidth = 2;
  for (let r = 0; r < 14; r++) {
    for (let c = 0; c < 22; c++) {
      const x = c * 92 + (r % 2) * 46, y = 380 + r * 52;
      const i = Math.floor((x - X0) / RUN);
      if (i < 0 || i >= N || y < stepY(i) + RISE + 66) continue;
      ctx.strokeRect(x, y, 92, 52);
    }
  }
  // the painted steps
  for (let i = 0; i < N; i++) {
    const x = stepX(i), y = stepY(i);
    const col = mixRgb(RAINBOW[i % RAINBOW.length], [40, 36, 70], d * 0.55);
    ctx.fillStyle = css(col);
    ctx.fillRect(x, y, RUN + 1, RISE + 62);
    ctx.fillStyle = css(mixRgb(col, [255, 255, 255], 0.18));
    ctx.fillRect(x, y, RUN + 1, 10);
    ctx.fillStyle = css(mixRgb('#e9e2d6', '#4a4660', d * 0.7));
    ctx.fillRect(x - 4, y - 8, RUN + 8, 10);
  }
}

function lamp(ctx, t, i, idx) {
  const [x, y] = on(i, 0.82);
  const L = lampOn(t, idx);
  ctx.fillStyle = '#2a2630';
  ctx.fillRect(x - 5, y - 250, 10, 250);
  ctx.fillRect(x - 12, y - 20, 24, 20);
  ctx.beginPath();
  ctx.moveTo(x - 24, y - 250);
  ctx.lineTo(x + 24, y - 250);
  ctx.lineTo(x + 16, y - 290);
  ctx.lineTo(x - 16, y - 290);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 20, y - 290);
  ctx.lineTo(x, y - 306);
  ctx.lineTo(x + 20, y - 290);
  ctx.fill();
  ctx.fillStyle = css(mixRgb([70, 70, 90], [255, 222, 150], L));
  ctx.fillRect(x - 15, y - 284, 30, 30);
  if (L > 0.02) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y - 270, 380, [255, 180, 100], 0.42 * L);
    glow(ctx, x, y - 270, 90, [255, 230, 170], 0.6 * L);
    ctx.restore();
  }
  return [x, y - 270];
}

function stringLights(ctx, t, from, to) {
  const on = smooth(seg(t, 12.1, 12.6));
  ctx.strokeStyle = 'rgba(30,26,36,0.8)';
  ctx.lineWidth = 1.5;
  const pt = (k) => [lerp(from[0], to[0], k), lerp(from[1], to[1], k) + Math.sin(k * Math.PI) * 70];
  ctx.beginPath();
  for (let k = 0; k <= 1.001; k += 0.05) {
    const p = pt(k);
    k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
  }
  ctx.stroke();
  for (let b = 1; b < 12; b++) {
    const p = pt(b / 12);
    const c = [[255, 214, 140], [255, 170, 150], [200, 230, 255]][b % 3];
    const k = on * (0.8 + 0.2 * Math.sin(t * 3 + b));
    disc(ctx, p[0], p[1] + 6, 5, css(mixRgb([70, 70, 80], c, k)));
    if (k > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, p[0], p[1] + 6, 40, c, 0.35 * k);
      ctx.restore();
    }
  }
}

// ——— the cats ———

/** The grey cat's climb: along each tread, then a hop up to the next. */
function climber(t) {
  const per = 0.74, steps = 7;
  const u = (t - T.climb) / per;
  if (u < 0) return { p: [stepX(0) - 80, stepY(0)], pose: 'walk', phase: 0, pitch: 0 };
  if (u >= steps) return { p: on(steps, 0.4), pose: 'sit', phase: 0, pitch: 0 };
  const i = Math.floor(u), f = u - i;
  if (f < 0.62) {
    const k = f / 0.62;
    return { p: [lerp(on(i, 0)[0] - (i ? 0 : 60), on(i, 0.9)[0], k), stepY(i)], pose: 'walk', phase: t * 11, pitch: 0 };
  }
  const k = (f - 0.62) / 0.38;
  const a = on(i, 0.9), b = on(i + 1, 0.05);
  return { p: [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * 52], pose: 'leap', stretch: Math.sin(k * Math.PI), pitch: -0.35 * Math.sin(k * Math.PI) };
}

/** The kitten: watch, wiggle, pounce, miss; wiggle, pounce, tumble; then home to the ginger. */
function kitten(t) {
  const s4 = on(4, 0.3), s5 = on(5, 0.45), s6 = on(6, 0.4);
  const hop = (a, b, k, h) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * h];
  if (t < T.wiggle1) return { p: s4, pose: 'sit', look: 0.6 + 0.3 * Math.sin(t * 2) };
  if (t < T.pounce1) return { p: [s4[0] + Math.sin(t * 22) * 2, s4[1]], pose: 'crouch', wig: true };
  if (t < T.pounce1 + 0.6) {
    const k = seg(t, T.pounce1, T.pounce1 + 0.6);
    return { p: hop(s4, s5, k, 110), pose: 'leap', stretch: Math.sin(k * Math.PI), pitch: lerp(-0.5, 0.3, k) };
  }
  if (t < T.wiggle2) return { p: s5, pose: 'sit', look: 0.9 };
  if (t < T.pounce2) return { p: [s5[0] + Math.sin(t * 24) * 2, s5[1]], pose: 'crouch', wig: true };
  if (t < T.tumble) {
    const k = seg(t, T.pounce2, T.tumble);
    return { p: hop(s5, [s6[0] + 40, s6[1] - 30], k, 170), pose: 'leap', stretch: Math.sin(k * Math.PI), pitch: lerp(-0.7, 0.2, k) };
  }
  if (t < T.dazed) {
    const k = seg(t, T.tumble, T.dazed);
    return { p: hop([s6[0] + 40, s6[1] - 30], s6, k, 20), pose: 'loaf', roll: k * TAU };
  }
  if (t < T.home) return { p: s6, pose: 'sit', dazed: true, dir: -1 };
  // home: down four steps to curl up by the ginger
  const route = [6, 5, 4, 3, 2];
  const u = (t - T.home) / 0.62;
  if (u >= route.length - 1) {
    const end = on(2, 0.62);
    return { p: end, pose: t > T.curl ? 'sleep' : 'loaf', dir: -1 };
  }
  const i = Math.floor(u), f = u - i;
  const a = on(route[i], 0.2), b = on(route[i + 1], i === route.length - 2 ? 0.62 : 0.75);
  return { p: [lerp(a[0], b[0], f), lerp(a[1], b[1], f) - Math.sin(f * Math.PI) * 26], pose: f > 0.2 && f < 0.8 ? 'leap' : 'walk', stretch: 0.5, pitch: 0.3 * Math.sin(f * Math.PI), dir: -1, phase: t * 12 };
}

function butterfly(t) {
  // flutters around the kitten, escapes each pounce, ends up circling a lamp
  const s4 = on(4, 0.3), s5 = on(5, 0.45);
  const lampA = on(8, 0.82);
  let x, y;
  if (t < T.pounce1 + 0.3) [x, y] = [s4[0] + 60 + 50 * Math.sin(t * 1.3), s4[1] - 110 + 30 * Math.sin(t * 2.1)];
  else if (t < T.pounce2 + 0.4) {
    const k = smooth(seg(t, T.pounce1 + 0.3, T.pounce1 + 1.4));
    [x, y] = [lerp(s4[0] + 60, s5[0] + 120, k) + 40 * Math.sin(t * 1.6), lerp(s4[1] - 110, s5[1] - 220, k) + 25 * Math.sin(t * 2.3)];
  } else {
    const k = smooth(seg(t, T.pounce2 + 0.4, 17));
    const c = [lampA[0], lampA[1] - 300];
    const a = t * 2.4;
    [x, y] = [lerp(s5[0] + 120, c[0] + 60 * Math.cos(a), k), lerp(s5[1] - 220, c[1] + 26 * Math.sin(a), k)];
  }
  return [x, y];
}

function drawButterfly(ctx, x, y, t) {
  const f = Math.abs(Math.sin(t * 16));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.2 * Math.sin(t * 3));
  ctx.scale(1.6, 1.6);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side * (0.25 + 0.75 * f), 1);
    ctx.fillStyle = '#f4b73c';
    ctx.beginPath();
    ctx.ellipse(9, -7, 10, 8, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e8763a';
    ctx.beginPath();
    ctx.ellipse(7, 6, 7, 6, 0.4, 0, TAU);
    ctx.fill();
    disc(ctx, 12, -9, 2.4, '#3a2a24');
    ctx.restore();
  }
  ctx.fillStyle = '#3a2a24';
  ctx.fillRect(-1.5, -9, 3, 18);
  ctx.restore();
}

// ——— camera: close on the kitten, up to the moon, then back ———

const CAM = [
  [0, 820, 650, 1.22],
  [4, 800, 660, 1.3],
  [14.6, 820, 640, 1.3],
  [17.2, 1290, 470, 1.32],
  [19.8, 1250, 500, 1.25],
  [21.6, 960, 540, 1],
  [24, 960, 540, 1],
];
function camera(t) {
  let i = 0;
  while (i < CAM.length - 2 && t > CAM[i + 1][0]) i++;
  const a = CAM[i], b = CAM[i + 1];
  const k = easeInOut(seg(t, a[0], b[0]));
  return { x: lerp(a[1], b[1], k), y: lerp(a[2], b[2], k), z: lerp(a[3], b[3], k) };
}

// ——— the frame ———

export function draw(ctx, t) {
  const cam = camera(t);
  const into = (depth) => {
    const z = 1 + (cam.z - 1) * depth;
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-(W / 2 + (cam.x - W / 2) * depth), -(H / 2 + (cam.y - H / 2) * depth));
  };
  ctx.save();
  into(0.5);
  sky(ctx, t);
  view(ctx, t);
  ctx.restore();
  ctx.save();
  into(1);
  building(ctx, t);
  stairs(ctx, t);
  const lampA = lamp(ctx, t, 3, 0);
  const lampB = lamp(ctx, t, 8, 1);
  stringLights(ctx, t, [lampA[0], lampA[1] - 22], [lampB[0], lampB[1] - 22]);

  // shadows pooling under the cats
  const shadow = (x, y, w) => {
    ctx.fillStyle = 'rgba(30,20,40,0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y + 1, w, 5, 0, 0, TAU);
    ctx.fill();
  };

  // on the wall ledge by the top: the tuxedo watching the view
  const top = on(10, 0.5);
  shadow(top[0], top[1], 48);
  cat(ctx, top[0], top[1], 1.8, { pose: 'sit', coat: 'tuxedo', t, look: t > T.moon ? 0.5 : 0.1, blink: Math.sin(t * 0.7) > 0.97, seed: 4 });

  // the ginger, asleep on step two all evening
  const g = on(2, 0.3);
  shadow(g[0], g[1], 56);
  cat(ctx, g[0], g[1], 1.85, { pose: 'sleep', coat: 'ginger', t, seed: 1 });

  // the grey cat climbing
  const C = climber(t);
  shadow(C.p[0], C.pose === 'leap' ? stepY(Math.round((C.p[0] - X0 - 18) / RUN)) : C.p[1], 48);
  cat(ctx, C.p[0], C.p[1], 1.75, { pose: C.pose, coat: 'grey', phase: C.phase, stretch: C.stretch, pitch: C.pitch, t, look: C.pose === 'sit' ? 0.2 : 0, seed: 2 });

  // the kitten and its butterfly
  const K = kitten(t);
  ctx.save();
  if (K.roll) {
    ctx.translate(K.p[0], K.p[1] - 14);
    ctx.rotate(K.roll);
    ctx.translate(-K.p[0], -(K.p[1] - 14));
  }
  shadow(K.p[0], K.p[1], 32);
  cat(ctx, K.p[0], K.p[1], 1.25, {
    pose: K.pose, coat: 'calico', t, look: K.look ?? 0, stretch: K.stretch, pitch: K.pitch, dir: K.dir ?? 1,
    phase: K.phase ?? 0, wag: K.wig ? 3 : 1, seed: 5, blink: K.dazed && Math.sin(t * 5) > 0.5,
  });
  ctx.restore();
  if (K.dazed) {
    for (let i = 0; i < 3; i++) {
      const a = t * 4 + (i * TAU) / 3;
      const sx = K.p[0] - 10 + Math.cos(a) * 34, sy = K.p[1] - 84 + Math.sin(a) * 10;
      ctx.fillStyle = '#ffd35a';
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const r = k % 2 ? 3 : 7;
        ctx.lineTo(sx + Math.cos((k * Math.PI) / 5) * r, sy + Math.sin((k * Math.PI) / 5) * r);
      }
      ctx.fill();
    }
  }
  const [bx, by] = butterfly(t);
  drawButterfly(ctx, bx, by, t);
  ctx.restore();

  // ——— words ———
  vignette(ctx, W, H, 0.34);
  const title = fade(t, 0.6, 4.2, 1, 0.8);
  if (title > 0) {
    ctx.fillStyle = `rgba(250,243,230,${0.86 * title})`;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 470, 62, 940, 212, 18);
    ctx.fill();
  }
  caption(ctx, 'Merdiven Kedileri', W / 2, 150, { size: 118, alpha: title, color: '#3a2620', shadow: 0 });
  caption(ctx, 'CODE DRAWS ISTANBUL · NO. 3', W / 2, 234, { size: 24, alpha: title * 0.85, italic: false, weight: 600, spacing: 8, color: '#3a2620', shadow: 0 });

  const card = smooth(seg(t, T.card, T.card + 0.8));
  if (card > 0) {
    ctx.fillStyle = `rgba(10,10,26,${0.66 * card})`;
    ctx.fillRect(0, 0, W, H);
    caption(ctx, 'Merdiven Kedileri', W / 2, H / 2 - 40, { size: 104, alpha: card });
    caption(ctx, 'The Stair Cats · İstanbul, kodla çizildi', W / 2, H / 2 + 44, { size: 34, alpha: card * 0.9 });
    caption(ctx, 'EVERY FRAME DRAWN IN JAVASCRIPT · MUSIC SYNTHESIZED IN THE BROWSER', W / 2, H / 2 + 108, {
      size: 17, alpha: card * 0.6, italic: false, weight: 600, spacing: 5, shadow: 0,
    });
  }
  grain(ctx, W, H, t, 0.05);
}

// ——— the music: Kürdi on A, an evening lullaby ———

const A4 = 69;
const kurdi = (d) => makamHz('kurdi', A4, d);
function keysLine(S, t0, notes, o = {}) {
  let t = t0;
  for (const [d, len] of notes) {
    if (d !== null) S.keys(t, kurdi(d), { vel: 0.1, dur: Math.max(1.4, len * 1.6), pan: 0.1, ...o });
    t += len;
  }
}

export function score(S) {
  // evening air; crickets once it is dark
  S.noise(0, { dur: 24, type: 'bandpass', f0: 500, q: 0.3, vel: 0.015, attack: 2, release: 2, lfo: [0.09, 0.5], send: 0.1 });
  for (let i = 0; i < 26; i++) {
    const t = 11 + i * 0.42 + 0.1 * hash(i, 1);
    if (t > 23.5) break;
    for (let k = 0; k < 3; k++) S.chirp(t + k * 0.045, { f0: 4300, f1: 4500, dur: 0.03, vel: 0.006, pan: hash(i, 2) > 0.5 ? 0.6 : -0.6 });
  }

  // a warm pad underneath: Am, Dm, F, Em
  const pads = [[0, ['A2', 'E3', 'C4']], [5, ['D3', 'A3', 'F4']], [10, ['F2', 'C3', 'A3']], [15, ['A2', 'E3', 'C4']], [19, ['E2', 'B2', 'G3']]];
  pads.forEach(([t0, notes], i) => S.pad(t0, notes, { dur: (pads[i + 1]?.[0] ?? 23.4) - t0, vel: 0.07, attack: 1.2, release: 1.2, cutoff: 800 }));

  // the grey cat climbs: one pluck per step
  for (let i = 0; i < 7; i++) S.pluck(T.climb + i * 0.74 + 0.46, kurdi(i + 2), { vel: 0.05, dur: 1.2, pan: -0.2 + i * 0.07 });

  // evening melody
  keysLine(S, 3.8, [[4, 1], [3, 0.5], [2, 0.5], [3, 1], [2, 0.5], [1, 0.5], [2, 1.5], [0, 1.5]]);

  // wiggle… pounce… miss
  for (let i = 0; i < 6; i++) S.pluck(T.wiggle1 + 0.15 * i, kurdi(i % 2 ? 7 : 6), { vel: 0.025, dur: 0.3 });
  S.chirp(T.pounce1, { f0: 500, f1: 2200, dur: 0.35, vel: 0.03 });
  [9, 7, 4].forEach((d, i) => S.bell(T.pounce1 + 0.62 + i * 0.12, kurdi(d), { vel: 0.04 }));

  // dusk: the lamps come on
  keysLine(S, 10.2, [[3, 1], [2, 0.5], [1, 0.5], [0, 1], [-1, 1]], { vel: 0.085 });
  S.bell(T.lamps, kurdi(11), { vel: 0.04 });
  S.bell(T.lamps + 0.6, kurdi(9), { vel: 0.04 });
  [7, 9, 11, 14, 11, 9].forEach((d, i) => S.bell(12.1 + i * 0.09, kurdi(d), { vel: 0.02, dur: 1.5 }));

  // wiggle, the big pounce, the tumble
  for (let i = 0; i < 6; i++) S.pluck(T.wiggle2 + 0.13 * i, kurdi(i % 2 ? 7 : 6), { vel: 0.025, dur: 0.3 });
  S.chirp(T.pounce2, { f0: 400, f1: 2600, dur: 0.5, vel: 0.035 });
  S.chirp(T.tumble, { f0: 900, f1: 300, dur: 0.5, vel: 0.03 });
  S.thump(T.tumble + 0.5, { f0: 200, f1: 90, dur: 0.2, vel: 0.08 });
  [14, 16, 18].forEach((d, i) => S.bell(T.dazed + i * 0.3, kurdi(d), { vel: 0.02, dur: 1 }));

  // moonrise: the ney
  S.ney(15.2, kurdi(0), { vel: 0.09, dur: 1.2 });
  S.ney(16.5, kurdi(4), { vel: 0.1, dur: 1.6 });
  S.ney(18.2, kurdi(3), { vel: 0.09, dur: 0.5 });
  S.ney(18.75, kurdi(2), { vel: 0.09, dur: 0.5 });
  S.ney(19.3, kurdi(3), { vel: 0.09, dur: 1 });
  S.ney(20.4, kurdi(0), { vel: 0.09, dur: 1.8 });
  // the kitten goes home, a step at a time
  for (let i = 0; i < 4; i++) S.pluck(T.home + i * 0.62 + 0.3, kurdi(6 - i), { vel: 0.04, dur: 1, pan: -0.3 });

  // goodnight
  [-7, -3, 0, 2, 4].forEach((d, i) => S.keys(21.9 + i * 0.12, kurdi(d), { vel: 0.08, dur: 3 }));
}
