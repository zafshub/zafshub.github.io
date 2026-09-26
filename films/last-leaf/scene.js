// The Last Leaf — a short film.
// Every frame is painted from nothing as a pure function of time t (seconds).
import {
  TAU, clamp, lerp, seg, smooth, easeInOut, easeOut, fade, hash, noise, fbm, curve, mixRgb, css, keyColor,
} from '../../engine/util.js';
import { glow, disc, grain, vignette } from '../../engine/draw.js';

export const meta = {
  title: 'The Last Leaf',
  logline: 'Every leaf let go in autumn. One held on all winter.',
  duration: 39,
  width: 1920,
  height: 1080,
  cover: 3.4,
  poster: 29.55,
  mix: { reverb: 3, wet: 0.3 },
};

const W = 1920, H = 1080;
const BEAT = 0.75; // 4/4 at 80 bpm, bars of 3 s

const T = {
  dusk: 9, storm: 10.4, winter: 12.6, night: 15, dawn: 18.6, spring: 21, letGo: 27, pull: 27.4, pulled: 29.6,
  land: 35.5, out: 37.6, end: 39,
};

// ——— palette through the seasons ———

const SKY_TOP = [[0, '#f0b57e'], [8, '#eb9c6c'], [11, '#6f5287'], [13.2, '#8a95ad'], [15.5, '#1d2745'], [18.2, '#222d4d'], [20, '#a4aac4'], [22.5, '#8ecbf0'], [27.4, '#8ecbf0'], [29.6, '#7fb6e4']];
const SKY_LOW = [[0, '#fbe3bb'], [8, '#f8d09f'], [11, '#e6906f'], [13.2, '#d3d8e2'], [15.5, '#3d4b70'], [18.2, '#48537a'], [20, '#ecd8d4'], [22.5, '#fdecec'], [27.4, '#fdecec'], [29.6, '#ffd9a6']];
const GROUND = [[0, '#b8653c'], [9, '#8e4a3a'], [12, '#9ba3b5'], [14, '#dfe5ee'], [15.5, '#4a5778'], [18.2, '#56627f'], [20, '#d8dce6'], [22.5, '#9ccb84']];
const BOKEH = [[0, '#ffc46e'], [8, '#ff9e5e'], [11, '#e48aa6'], [13.2, '#e8eef8'], [15.5, '#8fa6d8'], [18.2, '#8fa6d8'], [20, '#f3d3dc'], [22.5, '#c9ef9f']];

const HERO_LIGHT = [[0, '#ef7a36'], [9, '#e0582f'], [11.5, '#c0392b'], [16, '#9a6038'], [28.6, '#9a6038'], [31, '#f2b04c']];
const HERO_DARK = [[0, '#c24e22'], [9, '#a8391f'], [11.5, '#86261f'], [16, '#63391f'], [28.6, '#63391f'], [31, '#bf7428']];

const AUTUMN = [
  ['#f2a53c', '#cf7424'], ['#e45c2d', '#b33a1f'], ['#f3c552', '#d59a2a'], ['#cf452f', '#942b1f'], ['#ea8a32', '#bd5f1d'],
];

// ——— the branch ———

const PIVOT = [-140, 262];
const Z = 1.45, OX = -190, OY = 60; // close-up framing: branch space → screen
const toScreen = (p) => [p[0] * Z + OX, p[1] * Z + OY];
const MAIN = { a: [-140, 262], b: [300, 336], c: [820, 432], d: [1296, 408], w0: 44, w1: 7 };
const TWIGS = [
  { from: 0.42, ctrl: [720, 318], end: [846, 244], w0: 13, w1: 3.2 },
  { from: 0.71, ctrl: [1010, 480], end: [1090, 566], w0: 11, w1: 3 },
  { from: 0.24, ctrl: [396, 420], end: [444, 494], w0: 12, w1: 3 },
];

function cubic(a, b, c, d, u) {
  const m = 1 - u;
  return [
    m * m * m * a[0] + 3 * m * m * u * b[0] + 3 * m * u * u * c[0] + u * u * u * d[0],
    m * m * m * a[1] + 3 * m * m * u * b[1] + 3 * m * u * u * c[1] + u * u * u * d[1],
  ];
}
function quad(a, c, b, u) {
  const m = 1 - u;
  return [m * m * a[0] + 2 * m * u * c[0] + u * u * b[0], m * m * a[1] + 2 * m * u * c[1] + u * u * b[1]];
}

/** Point on a limb: -1 is the main branch, 0..2 the twigs. */
function limbAt(limb, u) {
  if (limb < 0) return cubic(MAIN.a, MAIN.b, MAIN.c, MAIN.d, u);
  const tw = TWIGS[limb];
  return quad(limbAt(-1, tw.from), tw.ctrl, tw.end, u);
}
function limbWidth(limb, u) {
  const L = limb < 0 ? MAIN : TWIGS[limb];
  return lerp(L.w0, L.w1, u ** 0.8);
}

/** Outline of a limb as two edges (upper, lower), sampled along its length. */
const OUTLINES = [-1, 0, 1, 2].map((limb) => {
  const n = limb < 0 ? 44 : 18;
  const up = [], down = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const p = limbAt(limb, u), q = limbAt(limb, Math.min(1, u + 0.01)), r = limbAt(limb, Math.max(0, u - 0.01));
    const dx = q[0] - r[0], dy = q[1] - r[1], l = Math.hypot(dx, dy) || 1;
    let nx = -dy / l, ny = dx / l;
    if (ny > 0) { nx = -nx; ny = -ny; } // make the normal point up
    const w = limbWidth(limb, u) / 2 + 1.5 * noise(u * 12 + limb * 5, 7);
    up.push([p[0] + nx * w, p[1] + ny * w, nx, ny, u]);
    down.push([p[0] - nx * w, p[1] - ny * w]);
  }
  return { limb, up, down };
});

// ——— wind ———

const GUSTS = [[3, 0.6, 0.5], [6, 0.7, 0.6], [10.4, 1.1, 1], [T.letGo, 0.7, 0.35]];
const gust = (t) => GUSTS.reduce((s, [c, w, k]) => s + k * Math.exp(-(((t - c) / w) ** 2)), 0);
const sway = (t) => 0.008 * Math.sin(0.8 * t) + 0.004 * Math.sin(1.7 * t + 1) + 0.018 * gust(t);

function rotateAbout(p, c, a) {
  const s = Math.sin(a), k = Math.cos(a);
  const dx = p[0] - c[0], dy = p[1] - c[1];
  return [c[0] + dx * k - dy * s, c[1] + dx * s + dy * k];
}

// ——— leaves ———

// autumn leaves: limb, u, length, hang angle, detach time (on the beat — each one is a note)
const FALL_TIMES = [3, 3.75, 4.125, 4.875, 5.25, 6, 6.375, 7.125, 7.5, 7.875, 8.25, 8.625, 9, 9.375];
const LEAVES = [
  [-1, 0.3, 74, 0.4], [0, 0.55, 64, -0.5], [-1, 0.52, 80, 0.15], [2, 0.75, 70, 0.6], [-1, 0.64, 72, -0.35],
  [1, 0.6, 66, 0.5], [0, 0.95, 62, -0.9], [-1, 0.39, 68, -0.2], [-1, 0.84, 76, 0.3], [2, 1, 64, 0.1],
  [1, 1, 70, -0.2], [-1, 0.72, 66, 0.7], [0, 0.25, 58, 0.9], [-1, 0.9, 70, -0.6],
].map(([limb, u, len, hang], i) => ({ limb, u, len, hang, td: FALL_TIMES[(i * 5) % FALL_TIMES.length], col: AUTUMN[i % AUTUMN.length], i }));

const HERO = { limb: -1, u: 0.965, len: 98 };

// spring: buds that open into small leaves or blossoms
const BUDS = [];
for (let i = 0; i < 22; i++) {
  const limb = i < 10 ? -1 : (i % 3);
  const u = limb < 0 ? 0.14 + 0.08 * i + 0.03 * hash(i, 3) : 0.25 + 0.72 * hash(i, 4);
  const t0 = T.spring + 0.8 + 2.4 * hash(i, 5);
  BUDS.push({ limb, u: Math.min(0.94, u), flower: hash(i, 6) > 0.55, t0, t1: t0 + 0.7 + 0.9 * hash(i, 7), ang: Math.PI + (hash(i, 8) - 0.5) * 1.6, len: 34 + 16 * hash(i, 9), i });
}

function leafPath(ctx, L) {
  const w = L * 0.36, b = L * 0.16;
  ctx.beginPath();
  ctx.moveTo(0, b);
  ctx.bezierCurveTo(w, b + L * 0.1, w * 0.96, L * 0.64, 0, L);
  ctx.bezierCurveTo(-w * 0.96, L * 0.64, -w, b + L * 0.1, 0, b);
  ctx.closePath();
}

/** A leaf hanging from (x, y); angle 0 points straight down, flip < 1 tumbles it. */
function drawLeaf(ctx, x, y, L, ang, flip, light, dark, o = {}) {
  const sx = flip * (o.curl ?? 1), sy = o.squash ?? 1;
  if (o.shadow !== false) {
    ctx.save();
    ctx.translate(x + 7, y + 11);
    ctx.rotate(ang);
    ctx.scale(sx, sy);
    ctx.fillStyle = 'rgba(60,30,15,0.16)';
    leafPath(ctx, L);
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(sx, sy);
  ctx.strokeStyle = css(dark);
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.6, L * 0.04);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, L * 0.22);
  ctx.stroke();
  const g = ctx.createLinearGradient(-L * 0.36, 0, L * 0.36, 0);
  g.addColorStop(0, css(dark));
  g.addColorStop(0.55, css(mixRgb(dark, light, 0.75)));
  g.addColorStop(1, css(light));
  ctx.fillStyle = g;
  leafPath(ctx, L);
  ctx.fill();
  ctx.strokeStyle = css(dark, 0.6);
  ctx.lineWidth = Math.max(1, L * 0.022);
  ctx.beginPath();
  ctx.moveTo(0, L * 0.16);
  ctx.lineTo(0, L * 0.94);
  for (let k = 0; k < 4; k++) {
    const vy = L * (0.3 + k * 0.15), vw = L * 0.23 * (1 - k * 0.2);
    ctx.moveTo(0, vy);
    ctx.quadraticCurveTo(vw * 0.5, vy + L * 0.02, vw, vy + L * 0.11);
    ctx.moveTo(0, vy);
    ctx.quadraticCurveTo(-vw * 0.5, vy + L * 0.02, -vw, vy + L * 0.11);
  }
  ctx.stroke();
  if (o.snow > 0.02) {
    ctx.fillStyle = css([248, 250, 255], 0.95);
    ctx.beginPath();
    ctx.ellipse(0, L * 0.26, L * 0.2 * o.snow, L * 0.07 * o.snow, 0, 0, TAU);
    ctx.fill();
  }
  if (o.glow > 0) {
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 0, L * 0.55, L * 1.4, [255, 190, 90], 0.22 * o.glow);
  }
  ctx.restore();
}

function blossom(ctx, x, y, r, rot, k) {
  if (k <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(k, k);
  for (let i = 0; i < 5; i++) {
    ctx.rotate(TAU / 5);
    ctx.fillStyle = '#f5a9c0';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.55, r * 0.44, r * 0.58, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fde3ec';
    ctx.beginPath();
    ctx.ellipse(-r * 0.08, -r * 0.62, r * 0.22, r * 0.34, -0.2, 0, TAU);
    ctx.fill();
  }
  disc(ctx, 0, 0, r * 0.22, '#e2688c');
  for (let i = 0; i < 6; i++) {
    const a = (i * TAU) / 6;
    disc(ctx, Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3, r * 0.07, '#ffd65e');
  }
  ctx.restore();
}

// ——— hero leaf: where it is and how it moves ———

function heroAnchor(t) {
  return rotateAbout(limbAt(HERO.limb, HERO.u), PIVOT, sway(t));
}
const RELEASE = toScreen(heroAnchor(T.letGo));
const FLIGHT = [
  [T.letGo, RELEASE[0], RELEASE[1]],
  [28.1, RELEASE[0] + 50, RELEASE[1] - 130],
  [29.6, 1240, 300],
  [31.1, 900, 380],
  [32.5, 700, 540],
  [33.7, 960, 470],
  [34.6, 1150, 640],
  [T.land, 1170, 902],
  [T.end, 1270, 905],
];

function heroState(t) {
  const light = keyColor(HERO_LIGHT, t), dark = keyColor(HERO_DARK, t);
  const curl = lerp(1, 0.8, smooth(seg(t, 13, 17)));
  const snow = smooth(seg(t, 13.2, 17)) * (1 - smooth(seg(t, 20.8, 22.6)));
  if (t < T.letGo) {
    const g = gust(t);
    const storm = Math.exp(-(((t - T.storm) / 1.1) ** 2));
    const ang = 0.22 - 0.55 * g + 0.05 * Math.sin(1.3 * t) + 0.5 * storm * Math.sin(t * 13) + 0.18 * storm * Math.sin(t * 29);
    return { free: false, p: toScreen(heroAnchor(t)), ang, flip: 1, light, dark, curl, snow, squash: 1, glow: 0 };
  }
  const [x, y] = curve(FLIGHT, t);
  const f = t - T.letGo;
  const landK = smooth(seg(t, T.land - 0.4, T.land + 0.1));
  const ang = lerp(0.22 + 0.9 * Math.sin(f * 1.25) * Math.min(1, f) - 0.35 * Math.min(1, f), -Math.PI / 2 + 0.08 * Math.sin(t * 1.4), landK);
  const c = Math.cos(TAU * 0.36 * f + 0.6 * Math.sin(f));
  const flip = lerp(Math.sign(c) * (0.32 + 0.68 * Math.abs(c)), 1, landK);
  return {
    free: true, p: [x, y], ang, flip, light, dark, curl, snow: 0, squash: lerp(1, 0.42, landK),
    glow: smooth(seg(t, 29, 31)) * (1 - 0.6 * landK),
  };
}

// ——— painting: the close-up ———

function closeUpBackground(ctx, t) {
  const top = keyColor(SKY_TOP, t), low = keyColor(SKY_LOW, t);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, css(top));
  g.addColorStop(1, css(low));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // low sun in autumn, sinking at dusk
  const sun = 1 - smooth(seg(t, 10.8, 12.6));
  if (sun > 0) {
    const sy = lerp(700, 1000, easeInOut(seg(t, 4, 12)));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 1480, sy, 820, [255, 150, 90], 0.22 * sun);
    ctx.restore();
    const sg = ctx.createRadialGradient(1480, sy, 0, 1480, sy, 95);
    sg.addColorStop(0, css([255, 246, 220], 0.9 * sun));
    sg.addColorStop(0.7, css([255, 226, 180], 0.75 * sun));
    sg.addColorStop(1, css([255, 210, 160], 0));
    ctx.fillStyle = sg;
    ctx.fillRect(1480 - 95, sy - 95, 190, 190);
  }
  // winter night: moon and a few stars
  const night = fade(t, 14.6, 19.4, 1.4, 1.3);
  if (night > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 1540, 190, 420, [200, 215, 255], 0.3 * night);
    ctx.restore();
    disc(ctx, 1540, 190, 42, css([244, 244, 236], night));
    for (let i = 0; i < 90; i++) {
      const tw = 0.6 + 0.4 * Math.sin(t * (1 + hash(i, 12) * 2) + i);
      disc(ctx, hash(i, 10) * W, hash(i, 11) * 560, 0.8 + 1.3 * hash(i, 13) ** 4, css([235, 238, 255], 0.7 * night * tw));
    }
  }
  // out-of-focus shapes far behind the branch
  const bk = keyColor(BOKEH, t);
  for (let i = 0; i < 24; i++) {
    const r = 40 + 120 * hash(i, 20);
    const x = hash(i, 21) * (W + 200) - 100 + 18 * Math.sin(t * 0.2 + i);
    const y = 220 + hash(i, 22) * 820 - 6 * t * hash(i, 23);
    const a = (0.06 + 0.14 * hash(i, 24)) * (0.8 + 0.2 * Math.sin(t * 0.5 + i));
    const col = mixRgb(bk, [255, 255, 255], hash(i, 25) * 0.35);
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, css(col, a * 0.75));
    rg.addColorStop(0.82, css(col, a));
    rg.addColorStop(0.94, css(col, a * 0.5));
    rg.addColorStop(1, css(col, 0));
    ctx.fillStyle = rg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // blurred ground far below
  const gc = keyColor(GROUND, t);
  const gg = ctx.createLinearGradient(0, 820, 0, H);
  gg.addColorStop(0, css(gc, 0));
  gg.addColorStop(0.45, css(gc, 0.75));
  gg.addColorStop(1, css(gc, 0.95));
  ctx.fillStyle = gg;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 880 + 40 * Math.sin(x * 0.003 + 1) + 20 * Math.sin(x * 0.007));
  ctx.lineTo(W, H);
  ctx.fill();
}

function snowfall(ctx, t, front) {
  const k = fade(t, 12.4, 20.2, 1.2, 1.4);
  if (k <= 0) return;
  const n = front ? 70 : 170;
  for (let i = 0; i < n; i++) {
    const seed = front ? 300 : 200;
    const depth = front ? 1 : 0.3 + 0.6 * hash(i, seed);
    const speed = 40 + 90 * depth;
    const y = ((hash(i, seed + 1) * 1300 + (t - 12) * speed) % 1300) - 100;
    const x = hash(i, seed + 2) * (W + 100) - 50 + 30 * Math.sin(t * 0.8 + i) * depth + 20 * t * depth;
    const r = front ? 3.5 + 3 * hash(i, seed + 3) : 1.2 + 2.2 * depth;
    disc(ctx, ((x % (W + 100)) + W + 100) % (W + 100) - 50, y, r, css([250, 252, 255], (front ? 0.55 : 0.85) * k));
  }
}

function branch(ctx, t) {
  const depth = 10 * smooth(seg(t, 12.8, 17.6)) * (1 - smooth(seg(t, 20.8, 23.2)));
  // paper-cut shadow, then bark
  ctx.save();
  ctx.shadowColor = 'rgba(50,25,12,0.3)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = '#3d2b24';
  for (const o of OUTLINES) {
    ctx.beginPath();
    o.up.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    for (let i = o.down.length - 1; i >= 0; i--) ctx.lineTo(o.down[i][0], o.down[i][1]);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // bark texture and a rim of sky light along the top
  ctx.lineCap = 'round';
  for (const o of OUTLINES) {
    ctx.strokeStyle = 'rgba(20,12,10,0.35)';
    ctx.lineWidth = 1.4;
    for (let s = 0; s < 3; s++) {
      ctx.beginPath();
      o.up.forEach((p, i) => {
        const q = o.down[i];
        const k = 0.3 + s * 0.2 + 0.05 * noise(i * 0.7 + s * 9, 3);
        const x = lerp(p[0], q[0], k), y = lerp(p[1], q[1], k);
        if (i % 7 < 4) (i % 7 ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      });
      ctx.stroke();
    }
    const top = keyColor(SKY_LOW, t);
    ctx.strokeStyle = css(mixRgb(top, [255, 255, 255], 0.3), 0.45);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    o.up.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.stroke();
  }

  // snow gathering on top
  if (depth > 0.2) {
    for (const o of OUTLINES) {
      const scale = o.limb < 0 ? 1 : 0.6;
      ctx.fillStyle = '#f5f7fc';
      ctx.beginPath();
      o.up.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] + 1) : ctx.moveTo(p[0], p[1] + 1)));
      for (let i = o.up.length - 1; i >= 0; i--) {
        const [x, y, nx, ny, u] = o.up[i];
        const d = depth * scale * (0.65 + 0.35 * Math.sin(u * 40 + o.limb)) * (1 - 0.5 * u);
        ctx.lineTo(x + nx * d, y + ny * d);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
}

function autumnLeaves(ctx, t, attached) {
  for (const L of LEAVES) {
    if (attached !== t < L.td) continue;
    const [light, dark] = L.col;
    if (t < L.td) {
      const p = limbAt(L.limb, L.u);
      const ang = L.hang * 0.6 + 0.07 * Math.sin(t * (1.1 + hash(L.i, 30)) + L.i) - 0.45 * gust(t) * (0.6 + 0.4 * hash(L.i, 31));
      drawLeaf(ctx, p[0], p[1], L.len, ang, 1, light, dark);
    } else {
      const f = t - L.td;
      const a = rotateAbout(limbAt(L.limb, L.u), PIVOT, sway(L.td));
      const amp = 60 + 50 * hash(L.i, 32), w = 1.6 + 1.2 * hash(L.i, 33), ph = hash(L.i, 34) * TAU;
      const x = a[0] + (50 + 90 * hash(L.i, 35)) * f + amp * (Math.sin(w * f + ph) - Math.sin(ph));
      const y = a[1] + 105 * f + 26 * f * f;
      if (y > H + 150) continue;
      const ang = L.hang * 0.6 + 0.9 * Math.sin(w * f + ph);
      drawLeaf(ctx, x, y, L.len, ang, Math.cos(f * (2 + 2 * hash(L.i, 36))), light, dark);
    }
  }
}

function spring(ctx, t) {
  for (const b of BUDS) {
    if (t < b.t0) continue;
    const p = limbAt(b.limb, b.u);
    const grow = smooth(seg(t, b.t0, b.t0 + 0.6));
    const open = seg(t, b.t1, b.t1 + 0.7);
    const pop = open > 0 ? 1 + 0.18 * Math.sin(open * Math.PI) : 1;
    if (b.flower) {
      disc(ctx, p[0], p[1] - 3, 5.5 * grow, '#6f9e47');
      blossom(ctx, p[0], p[1] - 8, 21 * pop, b.i + t * 0.05, easeOut(open));
    } else {
      disc(ctx, p[0], p[1] - 2, 5 * grow * (1 - open), '#83b653');
      if (open > 0) drawLeaf(ctx, p[0], p[1], b.len * easeOut(open) * pop, b.ang + 0.08 * Math.sin(t * 1.4 + b.i), 1, [150, 205, 92], [88, 150, 58], { shadow: false });
    }
  }
}

function petals(ctx, t) {
  const k = fade(t, 24.5, 31, 0.5, 1.5);
  if (k <= 0) return;
  for (let i = 0; i < 18; i++) {
    const born = 24.4 + hash(i, 40) * 4.5;
    const f = t - born;
    if (f < 0 || f > 6) continue;
    const src = BUDS.filter((b) => b.flower)[i % 8] || BUDS[0];
    const p = limbAt(src.limb, src.u);
    const x = p[0] + f * (120 + 80 * hash(i, 41)) + 40 * Math.sin(f * 2 + i);
    const y = p[1] + f * (40 + 30 * hash(i, 42)) + 30 * Math.sin(f * 1.3 + i * 2);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(f * 2 + i);
    ctx.scale(Math.cos(f * 3 + i), 1);
    ctx.fillStyle = css([247, 176, 198], 0.9 * k);
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 10, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function birds(ctx, t) {
  for (let i = 0; i < 3; i++) {
    const t0 = 22.4 + i * 0.5;
    const f = t - t0;
    if (f < 0 || f > 6) continue;
    const x = -60 + f * (330 + 30 * i);
    const y = 180 + i * 38 + 16 * Math.sin(f * 1.7 + i);
    const flap = 0.5 + 0.45 * Math.sin(f * 14 + i * 2);
    ctx.strokeStyle = 'rgba(60,62,80,0.8)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 16, y - 12 * flap);
    ctx.quadraticCurveTo(x - 6, y - 2, x, y);
    ctx.quadraticCurveTo(x + 6, y - 2, x + 16, y - 12 * flap);
    ctx.stroke();
  }
}

function windLines(ctx, t) {
  ctx.save();
  ctx.lineCap = 'round';
  GUSTS.forEach(([c, w, k], g) => {
    for (let i = 0; i < 5; i++) {
      const s = c - w + i * 0.3 * w + hash(i, 50 + g) * 0.3;
      const f = t - s;
      if (f < 0 || f > 1.6) continue;
      const head = -300 + f * 1500;
      const y0 = 160 + hash(i, 60 + g) * 700;
      const len = 380 + 200 * hash(i, 70 + g);
      const a = 0.5 * k * Math.sin((f / 1.6) * Math.PI);
      const grad = ctx.createLinearGradient(head - len, 0, head, 0);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.7, `rgba(255,255,255,${a})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let x = head - len; x <= head; x += 12) {
        const y = y0 + 22 * Math.sin(x * 0.011 + i) + (x > head - 90 ? Math.sin((x - head + 90) * 0.06) * 14 : 0);
        x === head - len ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
  ctx.restore();
}

// ——— painting: the valley the leaf flies over ———

function scroll(t) {
  // camera travel to the right; integrated from a smooth speed curve
  let s = 0;
  for (let x = T.pull; x < t; x += 0.05) s += 0.05 * 190 * smooth(seg(x, T.pull, 29.8)) * (1 - 0.75 * smooth(seg(x, 33.8, 36.2)));
  return s;
}

function ridge(ctx, sx, base, amp, freq, seed, color, rise) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-10, H + 10);
  for (let x = -10; x <= W + 10; x += 10) {
    const wx = x + sx;
    ctx.lineTo(x, base + rise - amp * (0.5 + 0.5 * fbm(wx * freq, seed, 4)));
  }
  ctx.lineTo(W + 10, H + 10);
  ctx.fill();
}

function valley(ctx, t) {
  const s = scroll(t);
  const reveal = easeInOut(seg(t, T.pull, T.pulled));
  const rise = (k) => (1 - reveal) * k;
  const sunX = 1480, sunY = 610;

  const g = ctx.createLinearGradient(0, 0, 0, 800);
  g.addColorStop(0, '#78afe0');
  g.addColorStop(0.55, '#f3d4b0');
  g.addColorStop(1, '#ffd394');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, sunX, sunY, 1100, [255, 200, 120], 0.55);
  glow(ctx, sunX, sunY, 260, [255, 230, 170], 0.6);
  // soft rays
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.95 + (i / 6) * Math.PI * 0.9 + 0.03 * Math.sin(t * 0.3 + i);
    ctx.fillStyle = `rgba(255,236,190,${0.035 + 0.02 * Math.sin(t * 0.7 + i * 2)})`;
    ctx.beginPath();
    ctx.moveTo(sunX, sunY);
    ctx.lineTo(sunX + Math.cos(a - 0.05) * 1500, sunY + Math.sin(a - 0.05) * 1500);
    ctx.lineTo(sunX + Math.cos(a + 0.05) * 1500, sunY + Math.sin(a + 0.05) * 1500);
    ctx.fill();
  }
  ctx.restore();
  disc(ctx, sunX, sunY, 44, '#fff3d2');

  // clouds, lit from below by the low sun: each one a single shape with a flat base
  for (let i = 0; i < 6; i++) {
    const cx = ((hash(i, 80) * 2600 - s * 0.05 + t * 8) % 2600 + 2600) % 2600 - 350;
    const cy = 150 + hash(i, 81) * 230;
    const size = 0.75 + 0.5 * hash(i, 84);
    const cg = ctx.createLinearGradient(0, cy - 80 * size, 0, cy + 30 * size);
    cg.addColorStop(0, 'rgba(255,251,246,0.92)');
    cg.addColorStop(0.65, 'rgba(255,226,204,0.92)');
    cg.addColorStop(1, 'rgba(255,196,160,0.92)');
    ctx.fillStyle = cg;
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - 400, cy - 300, 800, 300 + 26 * size);
    ctx.clip();
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const r = (34 + 38 * hash(i * 9 + k, 82)) * size;
      const ox = (k - 2.5) * 44 * size + 10 * hash(i * 9 + k, 83);
      const oy = -Math.sin((k / 5) * Math.PI) * 30 * size + 14;
      ctx.moveTo(cx + ox + r, cy + oy);
      ctx.arc(cx + ox, cy + oy, r, 0, TAU);
    }
    ctx.fill();
    ctx.restore();
  }

  ridge(ctx, s * 0.12, 720, 170, 0.0016, 1, '#b3a9cf', rise(90));
  ridge(ctx, s * 0.12 + 500, 740, 90, 0.0022, 2, '#a1a8cb', rise(110));

  // hills with a village
  const hillsX = s * 0.3;
  ridge(ctx, hillsX, 810, 80, 0.0026, 3, '#9fbc92', rise(170));
  for (let i = Math.floor(hillsX / 70) - 1; i < (hillsX + W) / 70 + 1; i++) {
    if (hash(i, 90) < 0.5) continue;
    const wx = i * 70 + 30 * hash(i, 91);
    const x = wx - hillsX;
    const y = 810 + rise(170) - 80 * (0.5 + 0.5 * fbm(wx * 0.0026, 3, 4)) + 6;
    const w = 26 + 16 * hash(i, 92), h = 18 + 10 * hash(i, 93);
    const tower = hash(i, 94) > 0.9;
    ctx.fillStyle = '#e9d7c0';
    ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = '#c9644a';
    ctx.beginPath();
    ctx.moveTo(x - w / 2 - 4, y - h);
    ctx.lineTo(x, y - h - (tower ? 12 : 14));
    ctx.lineTo(x + w / 2 + 4, y - h);
    ctx.fill();
    if (tower) {
      ctx.fillStyle = '#e4d1b8';
      ctx.fillRect(x - 6, y - h - 44, 12, 34);
      ctx.fillStyle = '#b8583f';
      ctx.beginPath();
      ctx.moveTo(x - 8, y - h - 44);
      ctx.lineTo(x, y - h - 64);
      ctx.lineTo(x + 8, y - h - 44);
      ctx.fill();
    }
    ctx.fillStyle = '#ffcf6e';
    ctx.fillRect(x - w / 4 - 2, y - h * 0.6, 4, 5);
    ctx.fillRect(x + w / 4 - 2, y - h * 0.6, 4, 5);
  }

  // near hills with trees
  const nearX = s * 0.55;
  ridge(ctx, nearX, 872, 46, 0.0034, 4, '#7ea96a', rise(260));
  for (let i = Math.floor(nearX / 60) - 1; i < (nearX + W) / 60 + 1; i++) {
    if (hash(i, 95) < 0.45) continue;
    const wx = i * 60 + 20 * hash(i, 96);
    const x = wx - nearX;
    const y = 872 + rise(260) - 46 * (0.5 + 0.5 * fbm(wx * 0.0034, 4, 4)) + 4;
    const r = 16 + 12 * hash(i, 97);
    ctx.fillStyle = '#5b4436';
    ctx.fillRect(x - 2.5, y - r, 5, r);
    disc(ctx, x, y - r - r * 0.5, r, '#5f8c4e');
    disc(ctx, x + r * 0.35, y - r - r * 0.7, r * 0.7, '#76a55c');
    disc(ctx, x + r * 0.45, y - r - r * 0.85, r * 0.35, '#9cc978');
  }

  // the river, holding the sky
  const ry = 872 + rise(340);
  const rg = ctx.createLinearGradient(0, ry, 0, ry + 96);
  rg.addColorStop(0, '#ffe2b0');
  rg.addColorStop(1, '#9fc6e2');
  ctx.fillStyle = rg;
  ctx.fillRect(0, ry, W, 96);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (let j = 0; j < 12; j++) {
    const y = ry + 4 + j * 6.5;
    for (let i = 0; i < 5; i++) {
      const w = 20 + 60 * hash(j * 7 + i, 99) * (0.5 + 0.5 * Math.sin(t * 2 + j + i));
      const x = sunX + (hash(j * 7 + i, 98) - 0.5) * (80 + j * 18) + 10 * Math.sin(t * 1.3 + j);
      ctx.strokeStyle = `rgba(255,240,200,${0.35 * (1 - j / 14)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y);
      ctx.lineTo(x + w / 2, y);
      ctx.stroke();
    }
    const x0 = ((hash(j, 97) * 2400 - s * 0.8) % 2400 + 2400) % 2400 - 240;
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + 40 + 60 * hash(j, 96), y);
    ctx.stroke();
  }
  ctx.restore();

  // the near bank and grass
  const bank = 966 + rise(420);
  const bx = s * 1.15;
  ctx.fillStyle = '#4f7c43';
  ctx.beginPath();
  ctx.moveTo(-10, H + 10);
  for (let x = -10; x <= W + 10; x += 10) ctx.lineTo(x, bank - 10 * (0.5 + 0.5 * fbm((x + bx) * 0.006, 6, 3)));
  ctx.lineTo(W + 10, H + 10);
  ctx.fill();
  ctx.strokeStyle = '#3f6a37';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = Math.floor(bx / 14) - 1; i < (bx + W) / 14 + 1; i++) {
    const x = i * 14 + 8 * hash(i, 100) - bx;
    const h = 10 + 22 * hash(i, 101);
    const lean = 6 * Math.sin(t * 1.4 + i * 0.3);
    ctx.moveTo(x, bank + 2);
    ctx.quadraticCurveTo(x + lean * 0.3, bank - h * 0.6, x + lean, bank - h);
  }
  ctx.stroke();
}

function ripples(ctx, t) {
  const f = t - T.land;
  if (f < 0) return;
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const a = f - i * 0.35;
    if (a <= 0) continue;
    const r = 14 + 130 * a ** 0.6;
    const k = clamp(1 - a / 2.8);
    const x = 1170 + 12 * f, y = 906;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = `rgba(70,105,140,${0.4 * k})`;
    ctx.beginPath();
    ctx.ellipse(x, y + 2, r, r * 0.2, 0, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * k})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.2, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

// ——— the frame ———

export function draw(ctx, t) {
  const pull = easeInOut(seg(t, T.pull, T.pulled));
  const hero = heroState(t);

  if (pull < 1) closeUpBackground(ctx, t);
  if (pull > 0) {
    ctx.save();
    ctx.globalAlpha = pull;
    valley(ctx, t);
    ctx.restore();
  }

  if (pull < 1) {
    snowfall(ctx, t, false);
    // the branch slides away as the camera follows the leaf
    ctx.save();
    ctx.translate(-1900 * pull, -420 * pull);
    ctx.translate(OX, OY);
    ctx.scale(Z, Z);
    ctx.save();
    ctx.translate(PIVOT[0], PIVOT[1]);
    ctx.rotate(sway(t));
    ctx.translate(-PIVOT[0], -PIVOT[1]);
    branch(ctx, t);
    spring(ctx, t);
    autumnLeaves(ctx, t, true);
    if (!hero.free) {
      const base = limbAt(HERO.limb, HERO.u);
      drawLeaf(ctx, base[0], base[1], HERO.len, hero.ang, 1, hero.light, hero.dark, { curl: hero.curl, snow: hero.snow });
    }
    ctx.restore();
    autumnLeaves(ctx, t, false);
    petals(ctx, t);
    ctx.restore();
    birds(ctx, t);
    snowfall(ctx, t, true);
  }

  if (t > T.land - 0.2) ripples(ctx, t);
  if (hero.free && t < T.land) {
    const k = fade(t, T.letGo + 0.3, T.land, 0.8, 0.6);
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 1; i <= 24; i++) {
      const a = curve(FLIGHT, Math.max(T.letGo, t - 0.9 + (i - 1) * 0.0375));
      const b = curve(FLIGHT, Math.max(T.letGo, t - 0.9 + i * 0.0375));
      ctx.strokeStyle = `rgba(255,255,255,${0.7 * k * (i / 24) ** 2})`;
      ctx.lineWidth = 1 + 2.4 * (i / 24);
      ctx.beginPath();
      ctx.moveTo(a[0], a[1] - 30);
      ctx.lineTo(b[0], b[1] - 30);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (hero.free) {
    const x = hero.p[0] + (t > T.land ? 12 * (t - T.land) : 0);
    const y = hero.p[1] + (t > T.land ? 2 * Math.sin(t * 2) : 0);
    drawLeaf(ctx, x, y, HERO.len * Z * lerp(1, 1.2, smooth(seg(t, T.pull, T.pulled))), hero.ang, hero.flip, hero.light, hero.dark, {
      curl: hero.curl, squash: hero.squash, glow: hero.glow, shadow: t < T.pull + 0.6,
    });
  }
  windLines(ctx, t);

  vignette(ctx, W, H, 0.32);
  // fade in from black, and back out to black at the end: the pictures tell it all
  const black = Math.max(1 - smooth(seg(t, 0, 1.4)), smooth(seg(t, T.out, T.end - 0.2)));
  if (black > 0) {
    ctx.fillStyle = `rgba(0,0,0,${black})`;
    ctx.fillRect(0, 0, W, H);
  }
  grain(ctx, W, H, t, 0.06);
}

// ——— the music ———

const arp = (S, t, notes, step, o = {}) =>
  notes.forEach((n, i) => S.pluck(t + i * step, n, { vel: 0.07, dur: 2.2, pan: -0.3 + (i % 4) * 0.2, ...o }));
const melody = (S, t0, line, o = {}) => {
  let t = t0;
  for (const [n, beats] of line) {
    if (n) S.keys(t, n, { vel: 0.11, dur: 2.8, pan: 0.12, ...o });
    t += beats * BEAT;
  }
};

export function score(S) {
  // air
  S.noise(0, { dur: 27.5, type: 'bandpass', f0: 700, q: 0.4, vel: 0.028, attack: 2, release: 2, lfo: [0.17, 0.8], send: 0.2 });

  // autumn: A minor, a slow piano line
  S.pad(0, ['A2', 'E3', 'C4'], { dur: 3, vel: 0.1, attack: 2, release: 0.8, cutoff: 900 });
  S.pad(3, ['F2', 'C3', 'A3'], { dur: 3, vel: 0.1, attack: 0.8, release: 0.8, cutoff: 900 });
  S.pad(6, ['C3', 'G3', 'E4'], { dur: 1.5, vel: 0.1, attack: 0.5, release: 0.5, cutoff: 900 });
  S.pad(7.5, ['G2', 'D3', 'B3'], { dur: 1.5, vel: 0.1, attack: 0.4, release: 0.6, cutoff: 900 });
  melody(S, 0.4, [['A4', 1], ['C5', 1], ['E5', 1.5], ['D5', 0.5], ['C5', 2], ['A4', 2], ['G4', 1], ['C5', 1], ['D5', 1], ['E5', 1]]);
  // every falling leaf is a note
  const fallNotes = ['A5', 'G5', 'E5', 'D5', 'C5', 'A5', 'G5', 'E5', 'D5', 'E5', 'C5', 'A4', 'G4', 'A4'];
  FALL_TIMES.forEach((tt, i) => S.pluck(tt, fallNotes[i], { vel: 0.08, dur: 2.4, pan: 0.4 - (i % 5) * 0.18, bright: 9 }));
  for (const [c, w, k] of GUSTS.slice(0, 2)) S.noise(c - w, { dur: w * 2.2, type: 'bandpass', f0: 500, f1: 1400, q: 0.8, vel: 0.05 * k, attack: w, release: w });

  // dusk and the storm
  S.pad(9, ['D3', 'F3', 'A3'], { dur: 1.5, vel: 0.12, attack: 0.4, release: 0.5 });
  S.pad(10.5, ['E3', 'G#3', 'B3', 'D4'], { dur: 1.6, vel: 0.13, attack: 0.3, release: 0.9 });
  melody(S, 9, [['F5', 1], ['E5', 1], ['D5', 1], ['G#4', 1]], { vel: 0.1 });
  S.noise(9.3, { dur: 2.6, type: 'bandpass', f0: 400, f1: 1600, q: 0.9, vel: 0.1, attack: 1.1, release: 1.2, send: 0.3 });
  for (let i = 0; i < 10; i++) S.pluck(10 + i * 0.12, i % 2 ? 'B5' : 'C6', { vel: 0.03, dur: 0.5 });

  // winter: sparse, a heartbeat that won't stop
  S.pad(12, ['A2', 'E3', 'B3', 'C4'], { dur: 6.2, vel: 0.11, attack: 1.2, release: 1.5, cutoff: 700 });
  const snowNotes = ['E6', 'A6', 'C7', 'G6', 'D7', 'E6', 'A6', 'G6', 'C7', 'E7', 'D6', 'A6'];
  snowNotes.forEach((n, i) => S.bell(12.6 + i * 0.52 + 0.2 * hash(i, 1), n, { vel: 0.025 + 0.02 * hash(i, 2), dur: 2, pan: (hash(i, 3) - 0.5) * 1.2 }));
  [12.2, 13.7, 15.2, 16.7].forEach((tt, i) => {
    S.thump(tt, { f0: 70, f1: 45, dur: 0.5, vel: 0.14 - i * 0.015 });
    S.thump(tt + 0.28, { f0: 65, f1: 42, dur: 0.45, vel: 0.1 - i * 0.012 });
  });
  melody(S, 13.5, [['C5', 2], ['B4', 2], ['A4', 4]], { vel: 0.07 });

  // dawn
  S.pad(18, ['F2', 'C3', 'A3'], { dur: 1.5, vel: 0.1, attack: 0.8, release: 0.4 });
  S.pad(19.5, ['G2', 'D3', 'B3'], { dur: 1.5, vel: 0.11, attack: 0.5, release: 0.6 });
  melody(S, 18, [['A4', 1], ['B4', 1], ['C5', 1], ['D5', 1]], { vel: 0.08 });

  // spring: C major, everything opens
  const spring = [['C', 21], ['Am', 22.5], ['F', 24], ['G', 25.5]];
  const ARPS = { C: ['C4', 'G4', 'C5', 'E5'], Am: ['A3', 'E4', 'A4', 'C5'], F: ['F3', 'C4', 'F4', 'A4'], G: ['G3', 'D4', 'G4', 'B4'] };
  const PADS = { C: ['C3', 'G3', 'E4'], Am: ['A2', 'E3', 'C4'], F: ['F2', 'C3', 'A3'], G: ['G2', 'D3', 'B3'] };
  for (const [c, t0] of spring) {
    arp(S, t0, [...ARPS[c], ...ARPS[c].slice(1, 3)], BEAT / 2);
    S.pad(t0, PADS[c], { dur: 1.5, vel: 0.09, attack: 0.4, release: 0.5, cutoff: 1300 });
  }
  melody(S, 21, [['E5', 1], ['G5', 1], ['A5', 1], ['G5', 1], ['E5', 1], ['D5', 1], ['C5', 1], ['D5', 1]], { vel: 0.1 });
  [[22.8, 0], [23.05, 1], [24.6, 0], [24.85, 1], [25.1, 2]].forEach(([tt, k]) => {
    S.chirp(tt, { f0: 2800 + k * 300, f1: 4200 + k * 200, dur: 0.07, vel: 0.02, pan: 0.5 });
    S.chirp(tt + 0.09, { f0: 3600, f1: 2900, dur: 0.06, vel: 0.016, pan: 0.5 });
  });
  for (const b of BUDS.filter((x) => x.flower)) S.bell(b.t1, ['C6', 'E6', 'G6', 'A6', 'D6'][b.i % 5], { vel: 0.03, dur: 1.4, pan: -0.4 + hash(b.i, 9) * 0.8 });

  // letting go: a held breath
  S.keys(T.letGo, 'E5', { vel: 0.1, dur: 3 });
  S.bell(T.letGo + 0.02, 'E6', { vel: 0.05, dur: 3 });
  S.pad(T.letGo, ['F2', 'C3', 'G3', 'A3'], { dur: 2.6, vel: 0.12, attack: 1.8, release: 0.6, cutoff: 1200 });
  S.noise(26.6, { dur: 1.6, type: 'bandpass', f0: 600, f1: 1100, q: 0.6, vel: 0.04, attack: 0.7, release: 0.8 });

  // flight
  S.noise(29.6, { dur: 9, type: 'lowpass', f0: 600, q: 0.3, vel: 0.03, attack: 2, release: 2, lfo: [0.3, 0.5] });
  const flight = [['C', 30], ['G', 31.5], ['Am', 33], ['F', 34.5]];
  const ARPS2 = { C: ['C4', 'G4', 'C5', 'E5'], G: ['B3', 'G4', 'B4', 'D5'], Am: ['A3', 'E4', 'A4', 'C5'], F: ['F3', 'C4', 'F4', 'A4'] };
  const BASS = { C: 'C2', G: 'G1', Am: 'A1', F: 'F1' };
  for (const [c, t0] of flight) {
    arp(S, t0, [...ARPS2[c], ...ARPS2[c].slice(1, 3)], BEAT / 2, { vel: 0.075 });
    S.pad(t0, PADS[c === 'G' ? 'G' : c], { dur: 1.5, vel: 0.11, attack: 0.3, release: 0.5, cutoff: 1600 });
    S.bass(t0, BASS[c], { vel: 0.18, dur: 1.4 });
  }
  arp(S, 28.5, ['C4', 'G4', 'C5', 'E5'], BEAT / 2, { vel: 0.05 });
  melody(S, 30, [['E5', 1], ['G5', 1], ['A5', 1.5], ['G5', 0.5], ['E5', 1], ['D5', 1], ['C5', 1], ['D5', 1]], { vel: 0.13 });
  S.bell(30, 'E6', { vel: 0.04 });
  S.bell(33, 'C6', { vel: 0.04 });

  // landing on the river
  S.chirp(T.land, { f0: 900, f1: 380, dur: 0.09, vel: 0.07, send: 0.4 });
  S.noise(T.land, { dur: 0.5, type: 'bandpass', f0: 1800, f1: 900, q: 1, vel: 0.03, release: 0.4 });
  S.bell(T.land + 0.25, 'G6', { vel: 0.035, dur: 2 });
  S.bell(T.land + 0.6, 'E6', { vel: 0.03, dur: 2 });

  // home
  S.keys(36, 'C5', { vel: 0.12, dur: 3.5 });
  S.bass(36, 'C2', { vel: 0.18, dur: 3 });
  S.pad(36, ['C3', 'G3', 'D4', 'E4'], { dur: 0.8, vel: 0.12, attack: 0.3, release: 2.2 });
  ['C5', 'E5', 'G5', 'D6'].forEach((n, i) => S.bell(36 + i * 0.08, n, { vel: 0.07, dur: 3 }));
}
