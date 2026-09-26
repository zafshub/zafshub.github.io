// The Fallen Star — a short film.
// Every frame is painted from nothing as a pure function of time t (seconds).
// No images, no video, no stored state between frames.
import {
  TAU, clamp, lerp, seg, smooth, easeIn, easeInOut, fade, hash, noise, curve, bezier, mixRgb, css,
} from '../../engine/util.js';
import { glow, disc, limb, joint, reach, grain, vignette } from '../../engine/draw.js';

export const meta = {
  title: 'The Fallen Star',
  logline: 'A star falls into the sea. An old fisherman gives it his light.',
  duration: 39,
  width: 1920,
  height: 1080,
  cover: 3.3,
  poster: 29.55,
  mix: { reverb: 3.6, wet: 0.34 },
};

const W = 1920, H = 1080, HY = 640; // horizon
const HERO = [1250, 205];
const SPLASH = [1046, 792];
const BEAT = 2 / 3, BAR = 2; // 3/4 at 90 bpm; the picture is cut to the music
const ROW = 4 / 3; // one oar stroke = two beats

const T = {
  tremble: 6, fall: 8, splash: 10, lift: 11, scoop: 12.3, blow: 14.3, climb: 14.9, inLamp: 15.6,
  row: 16.4, arrive: 24, rise: 24.4, burst: 28, home: 29, out: 37.2, end: 39,
};

// ——— constant scenery (seeded, computed once) ———

const STARS = [];
for (let i = 0; STARS.length < 380; i++) {
  const x = -520 + hash(i, 1) * 2960;
  const y = -460 + (HY - 25 + 460) * hash(i, 2) ** 1.2;
  if (Math.hypot(x - HERO[0], y - HERO[1]) < 60) continue;
  STARS.push({ x, y, r: 0.7 + 2.1 * hash(i, 3) ** 6, rate: 0.5 + 2.2 * hash(i, 4), ph: hash(i, 5) * TAU, warm: hash(i, 6) > 0.72 });
}

// a small constellation the hero star belongs to
const CONST = [[1108, 142], [1176, 246], HERO, [1344, 128], [1428, 214], [1336, 300]];
const CONST_LINES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 2]];

// the Milky Way: a faint band of tiny stars rising from behind the island
const MW = [[170, HY + 30], [1180, -560]];
const MW_DIR = (() => {
  const dx = MW[1][0] - MW[0][0], dy = MW[1][1] - MW[0][1], l = Math.hypot(dx, dy);
  return { ux: dx / l, uy: dy / l, nx: -dy / l, ny: dx / l, len: l, ang: Math.atan2(dy, dx) };
})();
const MW_STARS = [];
for (let i = 0; i < 1700; i++) {
  const k = hash(i, 80);
  const g = (hash(i, 81) + hash(i, 82) + hash(i, 83) - 1.5) * 1.5; // roughly gaussian across the band
  const w = 150 + 70 * Math.sin(k * 7 + 1);
  const x = lerp(MW[0][0], MW[1][0], k) + MW_DIR.nx * g * w;
  const y = lerp(MW[0][1], MW[1][1], k) + MW_DIR.ny * g * w;
  if (y > HY - 8) continue;
  MW_STARS.push([x, y, 0.5 + 1.1 * hash(i, 84) ** 3, (0.18 + 0.55 * hash(i, 85)) * (1 - Math.abs(g) / 2.6)]);
}

const CAMERA = [
  // t, focus x, focus y, zoom
  [0, 960, 540, 1],
  [6, 966, 536, 1.05],
  [8.6, 990, 566, 1.08],
  [10.4, 955, 650, 1.32],
  [12.2, 944, 712, 1.72],
  [16.2, 944, 716, 1.76],
  [19.6, 1060, 592, 1.16],
  [24, 1150, 520, 1.06],
  [27.6, 1182, 452, 1.1],
  [31, 1110, 560, 1],
  [39, 1080, 578, 1.04],
];

// net pole keyframes in boat space: t, butt x, butt y, head x, head y
const NET = [
  [10.6, -64, -2, 86, -6],
  [11.2, -48, -54, 34, -212],
  [11.95, -42, -58, 176, 4],
  [12.35, -42, -57, 186, 10],
  [12.85, -46, -60, 180, -26],
  [13.8, -52, -62, 70, -74],
  [15.7, -52, -62, 70, -74],
  [16.4, -64, -2, 86, -6],
];

// ——— state as a function of time ———

function camera(t) {
  const [x, y, z] = curve(CAMERA, t);
  return { x, y, z };
}

function boat(t) {
  let x = 860, y0 = 790, s = 1;
  if (t > T.row) {
    const p = easeInOut(seg(t, T.row, T.arrive));
    s = 1 / lerp(1, 1 / 0.24, p);
    x = lerp(860, 1330, p);
  }
  if (t > T.home) {
    const p = easeInOut(seg(t, T.home, T.end));
    s = 1 / lerp(1 / 0.24, 1 / 0.64, p);
    x = lerp(1330, 1262, p);
  }
  y0 = HY + 150 * s;
  const kick = t > T.splash ? Math.exp(-(t - T.splash) * 1.1) : 0;
  const bob = (Math.sin(t * 1.3) * 5 + Math.sin(t * 0.7 + 1) * 3) * s;
  const ang = Math.sin(t * 1.1 + 0.5) * 0.025 + kick * 0.075 * Math.sin((t - T.splash) * 6.5);
  return { x, y: y0 + bob, s, ang, water: y0 };
}

function toWorld(B, p) {
  const c = Math.cos(B.ang), n = Math.sin(B.ang);
  return [B.x + (p[0] * c - p[1] * n) * B.s, B.y + (p[0] * n + p[1] * c) * B.s];
}

const LAMP = [47, -93]; // lantern body centre, boat space
const OARLOCK = [-2, -21];

function rowAmount(t) {
  return smooth(seg(t, T.row, T.row + 0.8)) * (1 - smooth(seg(t, T.arrive - 0.6, T.arrive + 0.2)))
    + smooth(seg(t, T.home, T.home + 1));
}

function pose(t) {
  const amp = rowAmount(t);
  const phi = (TAU * t) / ROW;
  const handle = [-14 + 16 * Math.cos(phi) * amp, -40 + 6 * Math.sin(phi) * amp];
  let lean = 0.1 + 0.015 * Math.sin(t * 1.6) + 0.13 * Math.cos(phi) * amp;
  let hands = [handle, [handle[0] + 5, handle[1] - 2]];

  // startled by the splash, then leaning towards the star
  lean += -0.12 * Math.exp(-((t - 10.15) ** 2) * 30) + 0.14 * smooth(seg(t, 10.3, 10.8)) * (1 - smooth(seg(t, 16, 16.6)));

  let net = null;
  if (t > NET[0][0] && t < NET[NET.length - 1][0]) {
    const [bx, by, hx, hy] = curve(NET, t);
    net = { butt: [bx, by], head: [hx, hy], front: t > 10.95 && t < 16.2 };
    const along = (k) => [lerp(bx, hx, k), lerp(by, hy, k)];
    const grip = smooth(seg(t, 10.6, 10.95)) * (1 - smooth(seg(t, 16.05, 16.4)));
    const g1 = along(0.06), g2 = along(0.24);
    hands = [
      [lerp(hands[0][0], g1[0], grip), lerp(hands[0][1], g1[1], grip)],
      [lerp(hands[1][0], g2[0], grip), lerp(hands[1][1], g2[1], grip)],
    ];
    // reaching out over the water
    lean += 0.28 * smooth(seg(t, 11.3, 11.9)) * (1 - smooth(seg(t, 12.6, 13.6)));
  }

  // blowing out the lantern
  lean += 0.3 * smooth(seg(t, 13.9, 14.25)) * (1 - smooth(seg(t, 14.7, 15.2)));

  // at the horizon: arms raised, letting the star go
  const lift = smooth(seg(t, 24.5, 25.1)) * (1 - smooth(seg(t, 26.6, 27.4)));
  if (lift > 0) {
    hands = [
      [lerp(hands[0][0], -24, lift), lerp(hands[0][1], -118, lift)],
      [lerp(hands[1][0], -12, lift), lerp(hands[1][1], -122, lift)],
    ];
    lean -= 0.1 * lift;
  }
  return { lean, hands, handle, net, amp };
}

function fallPoint(p) {
  return [lerp(HERO[0], SPLASH[0], p) + Math.sin(p * Math.PI) * 70, lerp(HERO[1], SPLASH[1], p)];
}

function risePoint(t, B) {
  const start = toWorld(B, LAMP);
  const k = easeInOut(seg(t, T.rise, T.burst - 0.2));
  return bezier(start, [start[0] - 70, start[1] - 190], [HERO[0] + 90, HERO[1] + 170], HERO, k);
}

/** Where the star is, how bright, how warm (0 = pale blue, 1 = gold). */
function star(t, B, P) {
  if (t < T.fall) {
    const k = seg(t, T.tremble, T.fall);
    const j = k * k * 7;
    return {
      mode: 'sky', p: [HERO[0] + Math.sin(t * 57) * j, HERO[1] + Math.cos(t * 43) * j * 0.6],
      size: 1, bright: 1 - 0.3 * k * (0.5 + 0.5 * Math.sin(t * 29)), warm: 0.55 - 0.3 * k,
    };
  }
  if (t < T.splash) {
    const p = easeIn(seg(t, T.fall, T.splash));
    return { mode: 'fall', p: fallPoint(p), size: 1 - 0.4 * p, bright: 1.1, warm: 0.25 };
  }
  const flicker = 0.5 + 0.5 * Math.sin(t * 9) * Math.sin(t * 3.3);
  if (t < T.scoop) {
    return {
      mode: 'water', p: [SPLASH[0] + Math.sin(t * 0.8) * 3, SPLASH[1] + Math.sin(t * 2.1) * 3],
      size: 0.45, bright: 0.28 + 0.1 * flicker, warm: 0,
    };
  }
  if (t < T.climb) {
    const head = toWorld(B, P.net.head);
    const catchK = smooth(seg(t, T.scoop, T.scoop + 0.3));
    const from = [SPLASH[0], SPLASH[1]];
    const p = [lerp(from[0], head[0], catchK), lerp(from[1], head[1] - 6 * B.s, catchK)];
    return { mode: 'net', p, size: 0.5, bright: 0.4 + 0.08 * flicker + 0.12 * seg(t, 12.5, 14), warm: 0.05 };
  }
  if (t < T.inLamp) {
    const k = easeInOut(seg(t, T.climb, T.inLamp));
    const a = toWorld(B, [P.net.head[0], P.net.head[1] - 6]);
    const b = toWorld(B, LAMP);
    const p = [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * 26 * B.s];
    return { mode: 'net', p, size: 0.5, bright: 0.6, warm: 0.08 };
  }
  if (t < T.rise) {
    const k = smooth(seg(t, T.inLamp, T.arrive));
    return { mode: 'lamp', p: toWorld(B, LAMP), size: 0.45, bright: lerp(0.6, 0.95, k), warm: lerp(0.08, 0.8, k) };
  }
  if (t < T.burst) {
    const k = seg(t, T.rise, T.burst);
    return { mode: 'rise', p: risePoint(t, B), size: lerp(0.42, 1.08, easeInOut(k)), bright: lerp(0.9, 1.25, k), warm: 0.82 };
  }
  return { mode: 'sky', p: HERO, size: 1.08, bright: 1.25 + 0.05 * Math.sin(t * 2.2), warm: 0.85 };
}

const starColor = (w) => mixRgb([160, 192, 255], [255, 212, 140], w);

// ——— painting ———

function sky(ctx, t, cam) {
  const g = ctx.createLinearGradient(0, -500, 0, HY);
  g.addColorStop(0, '#050817');
  g.addColorStop(0.42, '#0c1536');
  g.addColorStop(0.8, '#1b2b5b');
  g.addColorStop(1, '#35528a');
  ctx.fillStyle = g;
  ctx.fillRect(-900, -900, 3720, HY + 900);

  // haze band sitting on the horizon
  const hz = ctx.createLinearGradient(0, HY - 170, 0, HY);
  hz.addColorStop(0, 'rgba(90,130,190,0)');
  hz.addColorStop(1, 'rgba(110,150,205,0.22)');
  ctx.fillStyle = hz;
  ctx.fillRect(-900, HY - 170, 3720, 170);

  // the Milky Way
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const k = 0.06 + i * 0.11;
    const cx = lerp(MW[0][0], MW[1][0], k) + MW_DIR.nx * 40 * Math.sin(i * 2.1);
    const cy = lerp(MW[0][1], MW[1][1], k) + MW_DIR.ny * 40 * Math.sin(i * 2.1);
    if (cy > HY + 60) continue;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(MW_DIR.ang);
    ctx.scale(1, 0.22 + 0.06 * Math.sin(i * 1.7));
    glow(ctx, 0, 0, 420, i % 2 ? [120, 128, 190] : [150, 128, 180], 0.1);
    ctx.restore();
  }
  ctx.restore();
  for (const [x, y, r, a] of MW_STARS) {
    ctx.fillStyle = css([220, 225, 255], Math.min(1, a * 1.25) * smooth(seg(y, HY - 10, HY - 200)));
    ctx.fillRect(x, y, r, r);
  }

  // moon: a thin crescent
  const mx = 360, my = 186, mr = 34;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, mx, my, 260, [200, 210, 235], 0.13);
  ctx.restore();
  const d = mr * 0.62, h = Math.sqrt(mr * mr - (d * d) / 4);
  ctx.fillStyle = '#f2ead3';
  ctx.beginPath();
  ctx.arc(mx, my, mr, Math.atan2(-h, d / 2), Math.atan2(h, d / 2), true);
  ctx.arc(mx + d, my, mr, Math.atan2(h, -d / 2), Math.atan2(-h, -d / 2), false);
  ctx.fill();

  // thin clouds low in the sky, lit from the moon side
  for (let i = 0; i < 5; i++) {
    const cx = ((hash(i, 40) * 2600 + t * (6 + 4 * hash(i, 41))) % 2900) - 700;
    const cy = HY - 60 - hash(i, 42) * 200;
    const w = 380 + hash(i, 43) * 520;
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
    cg.addColorStop(0, 'rgba(46,62,104,0.34)');
    cg.addColorStop(1, 'rgba(46,62,104,0)');
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, 0.09 + hash(i, 44) * 0.05);
    ctx.translate(-cx, -cy);
    ctx.fillStyle = cg;
    ctx.fillRect(cx - w / 2, cy - w / 2, w, w);
    ctx.restore();
  }

  // the star field
  const boost = t > T.burst ? 1 + 0.9 * Math.exp(-(t - T.burst) * 1.3) : 1;
  for (const s of STARS) {
    const tw = 0.55 + 0.45 * Math.sin(t * s.rate + s.ph);
    const low = smooth(seg(s.y, HY - 12, HY - 190));
    const a = clamp((0.28 + 0.6 * tw * boost) * low * (0.55 + s.r / 5));
    ctx.fillStyle = s.warm ? css([255, 236, 205], a) : css([214, 226, 255], a);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * (0.85 + 0.15 * tw) / Math.sqrt(cam.z), 0, TAU);
    ctx.fill();
    if (s.r > 2) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, s.x, s.y, s.r * 11, s.warm ? [255, 220, 170] : [180, 200, 255], a * 0.22);
      ctx.restore();
    }
  }

  // constellation: lines stay, even when a star is missing
  const lit = t > T.burst ? smooth(seg(t, T.burst + 0.1, T.burst + 1.6)) : 0;
  ctx.save();
  ctx.lineWidth = 1.2;
  CONST_LINES.forEach(([a, b], i) => {
    const flash = t > T.burst ? Math.exp(-((t - (T.burst + 0.2 + i * 0.18)) ** 2) * 10) : 0;
    ctx.strokeStyle = css([190, 205, 240], 0.09 + 0.06 * lit + 0.35 * flash);
    ctx.beginPath();
    ctx.moveTo(...CONST[a]);
    ctx.lineTo(...CONST[b]);
    ctx.stroke();
  });
  CONST.forEach((p, i) => {
    if (i === 2) return;
    const tw = 0.7 + 0.3 * Math.sin(t * 1.3 + i);
    disc(ctx, p[0], p[1], 2.2, css([235, 238, 255], 0.75 * tw));
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, p[0], p[1], 26, [190, 210, 255], 0.25 * tw);
    ctx.globalCompositeOperation = 'source-over';
  });
  // the empty place in the sky
  const gone = fade(t, T.fall + 1, T.burst, 1, 0.4);
  if (gone > 0) {
    ctx.setLineDash([3, 7]);
    ctx.strokeStyle = css([200, 215, 245], 0.28 * gone);
    ctx.beginPath();
    ctx.arc(HERO[0], HERO[1], 13, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  // an island far away on the left
  ctx.fillStyle = '#0c1631';
  ctx.beginPath();
  ctx.moveTo(-900, HY + 1);
  ctx.lineTo(-900, HY - 18);
  for (let x = -900; x <= 700; x += 20) {
    const k = seg(x, -900, 700);
    const hgt = Math.sin(k * Math.PI) ** 0.8 * (34 + 18 * noise(x * 0.01, 3)) + 6 * noise(x * 0.05, 4);
    ctx.lineTo(x, HY - Math.max(0, hgt));
  }
  ctx.lineTo(700, HY + 1);
  ctx.fill();
}

function sea(ctx, t) {
  const g = ctx.createLinearGradient(0, HY, 0, 1250);
  g.addColorStop(0, '#1d2e57');
  g.addColorStop(0.1, '#111f44');
  g.addColorStop(0.45, '#08122c');
  g.addColorStop(1, '#02050d');
  ctx.fillStyle = g;
  ctx.fillRect(-900, HY, 3720, 1400);

  // bright seam of the horizon
  const seam = ctx.createLinearGradient(0, HY - 1, 0, HY + 5);
  seam.addColorStop(0, 'rgba(160,190,235,0.32)');
  seam.addColorStop(1, 'rgba(160,190,235,0)');
  ctx.fillStyle = seam;
  ctx.fillRect(-900, HY - 1, 3720, 6);

  // moonlit wave crests, denser towards the horizon
  ctx.lineCap = 'round';
  const rows = 72;
  for (let j = 0; j < rows; j++) {
    const k = j / rows;
    const y = HY + 3 + 620 * k * k;
    const depth = clamp((y - HY) / (H - HY));
    const n = (18 + (1 - depth) * 14) | 0;
    const dir = hash(j, 3) > 0.5 ? 1 : -1;
    ctx.lineWidth = 0.8 + 2 * depth;
    for (let pass = 0; pass < 2; pass++) {
      const shimmer = 0.6 + 0.4 * Math.sin(t * (1.1 + pass * 0.7) + j * 1.7 + pass * 2);
      ctx.strokeStyle = css([150, 184, 238], (0.045 + 0.15 * depth) * shimmer * (pass ? 0.6 : 1));
      ctx.beginPath();
      for (let i = pass; i < n; i += 2) {
        const len = (6 + 58 * depth) * (0.3 + hash(i + j * 97, 9));
        let x = hash(i + j * 97, 8) * 3600 - 800 + t * (6 + 22 * depth) * dir;
        x = ((((x + 800) % 3600) + 3600) % 3600) - 800;
        const yy = y + Math.sin(t * 1.1 + i * 2.3 + j) * 1.6 * depth;
        ctx.moveTo(x, yy);
        ctx.lineTo(x + len, yy);
      }
      ctx.stroke();
    }
  }
}

/** Glitter path of a light on the water: a column of shimmering dashes. */
function reflection(ctx, x, top, bottom, strength, color, t, seed, spread = 1) {
  if (strength <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  const rows = 64;
  for (let j = 0; j < rows; j++) {
    const k = j / rows;
    const y = top + (bottom - top) * k ** 1.6;
    const depth = clamp((y - HY) / (H - HY));
    const flick = 0.5 + 0.5 * Math.sin(t * (2.5 + 4 * hash(j, seed)) + hash(j, seed + 1) * TAU);
    const w = (5 + 115 * depth) * spread * (0.3 + 0.7 * flick);
    const cx = x + noise(j * 0.45 + t * 0.6, seed) * (6 + 64 * depth) * spread;
    ctx.strokeStyle = css(color, strength * (0.2 + 0.8 * flick) * (1 - 0.5 * k));
    ctx.lineWidth = 1 + 3 * depth * Math.min(1, spread);
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, y);
    ctx.lineTo(cx + w / 2, y);
    ctx.stroke();
  }
  ctx.restore();
}

function splash(ctx, t) {
  const dt = t - T.splash;
  if (dt < 0 || dt > 3) return;
  const [x, y] = SPLASH;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y - 10, 320, [190, 210, 255], 0.5 * Math.exp(-dt * 3.5));
  ctx.restore();
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const a = dt - i * 0.24;
    if (a <= 0) continue;
    const r = 14 + 170 * a ** 0.6;
    ctx.strokeStyle = css([170, 200, 245], 0.5 * clamp(1 - a / 2.4));
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.17, 0, 0, TAU);
    ctx.stroke();
  }
  for (let i = 0; i < 30; i++) {
    const th = -Math.PI * (0.18 + 0.64 * hash(i, 50));
    const v = 240 + 330 * hash(i, 51);
    const px = x + Math.cos(th) * v * dt;
    const py = y + Math.sin(th) * v * dt + 0.5 * 980 * dt * dt;
    if (py > y + 4) continue;
    disc(ctx, px, py, 1.5 + 2.2 * hash(i, 52), css([205, 222, 255], 0.9 * clamp(1 - dt)));
  }
}

function wake(ctx, t) {
  const amp = rowAmount(t);
  if (amp <= 0.01) return;
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 1; i < 26; i++) {
    const age = i * 0.12;
    const a = boat(t - age), b = boat(t - age + 0.12);
    const spread = age * 22 * a.s;
    const alpha = 0.22 * amp * (1 - i / 26);
    ctx.strokeStyle = css([160, 190, 240], alpha);
    ctx.lineWidth = 1.6 * a.s + 0.6;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(a.x - 100 * a.s - spread * 0.9, a.water + side * spread * 0.2 + 2);
      ctx.lineTo(b.x - 100 * b.s - spread * 0.7, b.water + side * spread * 0.16 + 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawStar(ctx, p, S, t) {
  const col = starColor(S.warm);
  const [x, y] = p;
  const b = S.bright, s = S.size;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y, 210 * s * (0.55 + 0.45 * b), col, 0.26 * b);
  glow(ctx, x, y, 54 * s, col, 0.55 * b);
  const rot = t * 0.04;
  for (let k = 0; k < 4; k++) {
    const a = rot + (k * Math.PI) / 2;
    const L = (k % 2 ? 58 : 84) * s * b;
    const g = ctx.createLinearGradient(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L);
    g.addColorStop(0, css(col, 0.9 * Math.min(1, b)));
    g.addColorStop(1, css(col, 0));
    ctx.strokeStyle = g;
    ctx.lineWidth = 2.2 * s;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
    ctx.stroke();
  }
  ctx.restore();
  disc(ctx, x, y, 4.2 * s, css([255, 252, 240], Math.min(1, 0.6 + b * 0.4)));
}

function trail(ctx, pointAt, t, t0, length, col, width) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  const steps = 26;
  let prev = pointAt(Math.max(t0, t - length));
  for (let i = 1; i <= steps; i++) {
    const tt = Math.max(t0, t - length + (length * i) / steps);
    const p = pointAt(tt);
    const k = i / steps;
    ctx.strokeStyle = css(col, 0.55 * k * k);
    ctx.lineWidth = width * (0.2 + 0.8 * k);
    ctx.beginPath();
    ctx.moveTo(prev[0], prev[1]);
    ctx.lineTo(p[0], p[1]);
    ctx.stroke();
    prev = p;
  }
  ctx.restore();
}

function sparkles(ctx, pointAt, t, t0, t1, col, seed) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 36; i++) {
    const born = lerp(t0, t1, i / 36);
    const age = t - born;
    if (age < 0 || age > 1.1) continue;
    const p = pointAt(born);
    const x = p[0] + (hash(i, seed) - 0.5) * 30 + (hash(i, seed + 1) - 0.5) * 40 * age;
    const y = p[1] + 40 * age ** 1.5 + (hash(i, seed + 2) - 0.5) * 20;
    disc(ctx, x, y, 1.2 + 1.6 * hash(i, seed + 3), css(col, 0.9 * (1 - age / 1.1)));
  }
  ctx.restore();
}

/** Lantern light: flame until it is blown out, then the star's cold light, warming. */
function lamp(t, S) {
  const flame = 1 - smooth(seg(t, T.blow, T.blow + 0.32));
  const holds = S.mode === 'lamp' ? 1 : S.mode === 'rise' ? 1 - smooth(seg(t, T.rise, T.rise + 0.6)) : 0;
  const starLight = holds * S.bright * 0.9;
  const total = flame + starLight;
  const color = total > 0 ? mixRgb([255, 170, 90], starColor(S.warm), starLight / (total || 1)) : [255, 170, 90];
  return { flame, starLight, total, color };
}

function fisherman(ctx, t, B, P, L) {
  const dark = [6, 8, 16];
  const litCol = mixRgb(dark, L.color, 0.26 * Math.min(1, L.total));
  const shade = (r) => {
    const g = ctx.createRadialGradient(LAMP[0], LAMP[1], 0, LAMP[0], LAMP[1], r);
    g.addColorStop(0, css(litCol));
    g.addColorStop(1, css(dark));
    return g;
  };
  const fill = shade(135);
  ctx.fillStyle = fill;
  ctx.strokeStyle = fill;

  const hip = [-42, -22];
  const sh = [hip[0] + Math.sin(P.lean) * 40, hip[1] - Math.cos(P.lean) * 40];
  const head = [sh[0] + Math.sin(P.lean) * 17 + 3, sh[1] - Math.cos(P.lean) * 17];

  // thigh and knee just showing above the gunwale
  limb(ctx, hip[0], hip[1], hip[0] + 26, hip[1] - 9, 14);
  // torso
  limb(ctx, hip[0], hip[1], sh[0], sh[1] + 4, 25);

  // head, cap, beard, nose — in profile, facing the bow
  ctx.save();
  ctx.translate(head[0], head[1]);
  ctx.rotate(P.lean * 0.5 + 0.05 * Math.sin(t * 0.9));
  disc(ctx, 0, 0, 11, fill);
  ctx.beginPath();
  ctx.moveTo(10.5, -1);
  ctx.lineTo(15.5, 2.5);
  ctx.lineTo(10, 4.5);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(5, 9, 8.5, 6.5, 0.4, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-1, -6, 12.5, 8, 0, Math.PI, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(6, -7);
  ctx.quadraticCurveTo(18, -8, 21, -4);
  ctx.lineTo(8, -3);
  ctx.fill();
  ctx.restore();

  // arms (two-bone IK towards the hands)
  for (const [i, hand] of P.hands.entries()) {
    const s0 = [sh[0] + (i ? 3 : -2), sh[1] + 3];
    const h = reach(s0, hand, 45);
    const el = joint(s0, h, 23, 23, -1);
    limb(ctx, s0[0], s0[1], el[0], el[1], 9.5);
    limb(ctx, el[0], el[1], h[0], h[1], 8);
    disc(ctx, h[0], h[1], 4.6, fill);
  }
}

function netPole(ctx, P, fill) {
  const { butt, head } = P.net;
  const dx = head[0] - butt[0], dy = head[1] - butt[1];
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  ctx.strokeStyle = fill;
  limb(ctx, butt[0] - ux * 14, butt[1] - uy * 14, head[0], head[1], 4.2);
  // hoop and a sagging mesh bag
  ctx.save();
  ctx.translate(head[0], head[1]);
  ctx.rotate(Math.atan2(uy, ux));
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(16, 0, 16, 5, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.moveTo(1, 2);
  ctx.quadraticCurveTo(16, 26, 31, 2);
  ctx.fill();
  ctx.restore();
}

function drawBoat(ctx, t, B, P, S, L) {
  ctx.save();
  ctx.translate(B.x, B.y);
  ctx.rotate(B.ang);
  ctx.scale(B.s, B.s);

  // lantern light spilling around the boat
  const swing = Math.sin(t * 1.9) * 1.5 - B.ang * 40;
  const lampPos = [LAMP[0] + swing * 1.4, LAMP[1]];
  if (L.total > 0.01) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, lampPos[0], lampPos[1], 430, L.color, 0.1 * L.total);
    glow(ctx, lampPos[0], lampPos[1], 170, L.color, 0.22 * L.total);
    ctx.restore();
  }

  const dark = [6, 8, 16];
  const hullLit = mixRgb(dark, L.color, 0.2 * Math.min(1, L.total));
  const hullFill = ctx.createRadialGradient(lampPos[0], lampPos[1], 0, lampPos[0], lampPos[1], 210);
  hullFill.addColorStop(0, css(hullLit));
  hullFill.addColorStop(1, css(dark));

  if (P.net && !P.net.front) netPole(ctx, P, css([8, 10, 18]));

  fisherman(ctx, t, B, P, L);

  // hull, clipped at the waterline
  ctx.save();
  ctx.beginPath();
  ctx.rect(-200, -300, 400, 302);
  ctx.clip();
  ctx.fillStyle = hullFill;
  ctx.beginPath();
  ctx.moveTo(-112, -20);
  ctx.quadraticCurveTo(-110, 2, -88, 8);
  ctx.lineTo(86, 8);
  ctx.quadraticCurveTo(116, 2, 128, -31);
  ctx.quadraticCurveTo(12, -11, -112, -20);
  ctx.fill();
  // gunwale catching the light
  ctx.strokeStyle = css(L.color, 0.35 * Math.min(1, L.total));
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-110, -20);
  ctx.quadraticCurveTo(12, -11, 126, -30);
  ctx.stroke();
  ctx.restore();

  // lantern post and hook
  ctx.strokeStyle = css([9, 11, 20]);
  limb(ctx, 22, -18, 24, -120, 4);
  limb(ctx, 24, -119, lampPos[0] + 1, -121, 3.4);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(lampPos[0] + 1, -120);
  ctx.lineTo(lampPos[0], lampPos[1] - 12);
  ctx.stroke();

  // the oar, pivoting on the gunwale; the blade vanishes under the water
  const h = P.handle;
  const dx = OARLOCK[0] - h[0], dy = OARLOCK[1] - h[1];
  const d = Math.hypot(dx, dy);
  const tip = [OARLOCK[0] + (dx / d) * 118, OARLOCK[1] + (dy / d) * 118];
  ctx.save();
  ctx.beginPath();
  ctx.rect(-300, -300, 600, 303);
  ctx.clip();
  ctx.strokeStyle = css([8, 10, 18]);
  limb(ctx, h[0] - (dx / d) * 8, h[1] - (dy / d) * 8, tip[0], tip[1], 4);
  limb(ctx, lerp(OARLOCK[0], tip[0], 0.72), lerp(OARLOCK[1], tip[1], 0.72), tip[0], tip[1], 10);
  ctx.restore();
  if (P.amp > 0.1 && tip[1] > 0) {
    ctx.strokeStyle = css([170, 200, 245], 0.35 * P.amp);
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) {
      const w = 10 + 8 * i;
      ctx.beginPath();
      ctx.moveTo(tip[0] - w, 2 + i * 3);
      ctx.lineTo(tip[0] + w * 0.6, 2 + i * 3);
      ctx.stroke();
    }
  }

  if (P.net && P.net.front) netPole(ctx, P, css([8, 10, 18]));

  // lantern body
  ctx.save();
  ctx.translate(lampPos[0], lampPos[1]);
  ctx.fillStyle = css([10, 12, 20]);
  ctx.beginPath();
  ctx.moveTo(-8, -9);
  ctx.lineTo(8, -9);
  ctx.lineTo(4, -14);
  ctx.lineTo(-4, -14);
  ctx.fill();
  ctx.fillRect(-8, 9, 16, 4);
  const glass = mixRgb([22, 26, 40], L.color, Math.min(1, L.total * 0.9));
  ctx.fillStyle = css(glass);
  ctx.fillRect(-6.5, -9, 13, 18);
  ctx.strokeStyle = css([10, 12, 20]);
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-6.5, -9, 13, 18);
  if (L.flame > 0.01) {
    const fl = 1 + 0.12 * Math.sin(t * 17) + 0.08 * Math.sin(t * 31);
    ctx.fillStyle = css([255, 236, 190], L.flame);
    ctx.beginPath();
    ctx.ellipse(0, 2, 2.6 * L.flame, 5.5 * L.flame * fl, 0, 0, TAU);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 0, 0, 44, L.color, 0.55 * Math.min(1.2, L.total));
  ctx.restore();

  // smoke from the snuffed wick
  const smoke = t - T.blow - 0.2;
  if (smoke > 0 && smoke < 2) {
    ctx.strokeStyle = css([150, 160, 185], 0.3 * (1 - smoke / 2));
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const k = i / 20;
      const yy = lampPos[1] - 14 - k * 70 * Math.min(1, smoke * 1.3);
      const xx = lampPos[0] + Math.sin(k * 7 + smoke * 3) * 5 * k;
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  // breath: a few faint puffs towards the flame
  const puff = seg(t, T.blow - 0.1, T.blow + 0.35);
  if (puff > 0 && puff < 1) {
    for (let i = 0; i < 5; i++) {
      const k = clamp(puff * 1.4 - i * 0.1);
      disc(ctx, lerp(-6, lampPos[0] - 8, k), lerp(-68, lampPos[1] + 2, k) + Math.sin(i * 2) * 3, 1.6, css([200, 210, 230], 0.35 * (1 - k)));
    }
  }

  // water lapping at the hull: short slivers catching the light
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 7; i++) {
    const x0 = -118 + i * 38 + 9 * Math.sin(t * 1.7 + i * 2);
    const w = 12 + 12 * hash(i, 90);
    ctx.strokeStyle = css(mixRgb([150, 180, 230], L.color, 0.5), (0.16 + 0.1 * Math.sin(t * 2.3 + i)) * (0.6 + 0.4 * Math.min(1, L.total)));
    ctx.beginPath();
    ctx.moveTo(x0, 5 + (i % 2) * 4);
    ctx.lineTo(x0 + w, 5 + (i % 2) * 4);
    ctx.stroke();
  }
  ctx.restore();
}

// ——— the frame ———

export function draw(ctx, t) {
  const cam = camera(t);
  const B = boat(t);
  const P = pose(t);
  const S = star(t, B, P);
  const L = lamp(t, S);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(cam.z, cam.z);
  ctx.translate(-cam.x, -cam.y);

  sky(ctx, t, cam);
  if (S.mode === 'sky') drawStar(ctx, S.p, S, t);
  if (S.mode === 'rise') {
    trail(ctx, (tt) => risePoint(tt, boat(tt)), t, T.rise, 0.7, starColor(S.warm), 5);
    sparkles(ctx, (tt) => risePoint(tt, boat(tt)), t, T.rise, T.burst, starColor(0.8), 60);
    drawStar(ctx, S.p, S, t);
  }

  sea(ctx, t);

  // lights on the water
  reflection(ctx, 360, HY + 2, 1180, 0.16, [220, 225, 240], t, 11, 0.8);
  const heroSky = S.mode === 'sky' || S.mode === 'rise' ? 1 : 0;
  const pathHome = t > T.burst ? lerp(0.45, 1, smooth(seg(t, T.burst, T.burst + 2.5))) : 0.3;
  if (heroSky) reflection(ctx, S.p[0], HY + 2, 1180, pathHome * (S.mode === 'rise' ? 0.6 : 1), starColor(S.warm), t, 21, t > T.burst ? 1.25 : 0.9);
  if (S.mode === 'fall') {
    const k = seg(t, T.fall + 0.8, T.splash);
    reflection(ctx, S.p[0], HY + 2, 1100, 0.5 * k, starColor(0.3), t, 31, 0.7);
  }
  if (L.total > 0.01) {
    const lampW = toWorld(B, LAMP);
    reflection(ctx, lampW[0], B.water + 4 * B.s, B.water + 150 * B.s, 0.55 * Math.min(1, L.total), L.color, t, 41, 0.45 * B.s);
  }
  if (S.mode === 'water') {
    reflection(ctx, S.p[0], S.p[1] + 4, S.p[1] + 70, 0.4, starColor(0), t, 51, 0.25);
  }

  splash(ctx, t);
  wake(ctx, t);

  if (S.mode === 'water') drawStar(ctx, S.p, S, t);
  drawBoat(ctx, t, B, P, S, L);
  if (S.mode === 'net' || S.mode === 'lamp') drawStar(ctx, S.p, S, t);

  if (S.mode === 'fall') {
    trail(ctx, (tt) => fallPoint(easeIn(seg(tt, T.fall, T.splash))), t, T.fall, 0.55, starColor(0.4), 7);
    sparkles(ctx, (tt) => fallPoint(easeIn(seg(tt, T.fall, T.splash))), t, T.fall, T.splash, starColor(0.5), 70);
    drawStar(ctx, S.p, S, t);
  }

  // the star finds its place again
  const bt = t - T.burst;
  if (bt > -0.1 && bt < 3) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const e = Math.exp(-Math.max(0, bt) * 2.2);
    glow(ctx, HERO[0], HERO[1], 700, [255, 220, 160], 0.35 * e);
    const streak = ctx.createLinearGradient(HERO[0] - 900, 0, HERO[0] + 900, 0);
    streak.addColorStop(0, 'rgba(255,220,170,0)');
    streak.addColorStop(0.5, `rgba(255,230,190,${0.5 * e})`);
    streak.addColorStop(1, 'rgba(255,220,170,0)');
    ctx.fillStyle = streak;
    ctx.fillRect(HERO[0] - 900, HERO[1] - 2, 1800, 4);
    const r = 40 + 900 * Math.max(0, bt) ** 0.7;
    ctx.strokeStyle = css([255, 225, 175], 0.3 * clamp(1 - bt / 2.4));
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(HERO[0], HERO[1], r, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();

  // ——— screen space ———
  vignette(ctx, W, H, 0.45);

  // fade in from black, and back out to black at the end: the pictures tell it all
  const black = Math.max(1 - smooth(seg(t, 0, 1.4)), smooth(seg(t, T.out, T.end - 0.2)));
  if (black > 0) {
    ctx.fillStyle = `rgba(0,0,0,${black})`;
    ctx.fillRect(0, 0, W, H);
  }
  grain(ctx, W, H, t, 0.07);
}

// ——— the music ———

const harp = (S, t, notes, vel = 0.09, step = BEAT / 2) =>
  notes.forEach((n, i) => S.pluck(t + i * step, n, { vel: vel * (i === 0 ? 1.25 : 1), dur: 2.4, pan: -0.25 + (i % 3) * 0.2 }));

const tune = (S, bar, notes, vel = 0.15) => {
  for (const [n, beat] of notes) S.bell(bar * BAR + beat * BEAT, n, { vel, dur: 2.8, pan: 0.1 });
};

const CHORDS = {
  D: ['D4', 'A4', 'D5', 'F#5', 'A5', 'F#5'],
  Bm: ['B3', 'F#4', 'B4', 'D5', 'F#5', 'D5'],
  G: ['G3', 'D4', 'G4', 'B4', 'D5', 'B4'],
  A: ['A3', 'E4', 'A4', 'C#5', 'E5', 'C#5'],
};
const PADS = { D: ['D3', 'A3', 'F#4'], Bm: ['B2', 'F#3', 'D4'], G: ['G2', 'D3', 'B3'], A: ['A2', 'E3', 'C#4'] };
const ROOTS = { D: 'D2', Bm: 'B1', G: 'G1', A: 'A1' };

export function score(S) {
  // the sea, all the way through
  S.noise(0, { dur: 39, type: 'lowpass', f0: 380, q: 0.3, vel: 0.075, attack: 2.5, release: 3, lfo: [0.12, 0.6], send: 0.1 });
  S.noise(0, { dur: 39, type: 'bandpass', f0: 950, q: 0.6, vel: 0.022, attack: 3, release: 3, lfo: [0.21, 0.9], send: 0.25, pan: 0.3 });

  // night — a lullaby on the harp
  S.pad(0, ['D3', 'A3', 'E4', 'F#4'], { dur: 6, vel: 0.13, attack: 3, release: 1.4, cutoff: 850 });
  harp(S, 0.2, CHORDS.D, 0.08);
  harp(S, 2, CHORDS.Bm, 0.08);
  harp(S, 4, CHORDS.G, 0.075);
  S.bell(1.1, 'A6', { vel: 0.035 });
  S.bell(3.4, 'F#6', { vel: 0.035 });
  S.bell(4.9, 'E6', { vel: 0.03 });

  // the star trembles
  S.pad(6, ['G3', 'B3', 'D4', 'A4'], { dur: 2, vel: 0.12, attack: 0.8, release: 0.4, cutoff: 1200 });
  for (let i = 0; i < 20; i++) {
    const tt = 6.1 + i * 0.09;
    S.bell(tt, i % 2 ? 'C#6' : 'B5', { vel: 0.035 + 0.025 * (i / 20), dur: 0.9, send: 0.5 });
  }

  // …and falls: one note for every step of the way down, crowding as it speeds up
  const fallNotes = ['A6', 'F#6', 'E6', 'D6', 'B5', 'A5', 'F#5', 'E5', 'D5', 'B4', 'A4', 'F#4'];
  fallNotes.forEach((n, i) => S.bell(T.fall + 2 * Math.cbrt((i + 0.5) / fallNotes.length), n, { vel: 0.09, dur: 1.6, pan: 0.3 - i * 0.04 }));
  S.noise(8.3, { dur: 1.7, type: 'bandpass', f0: 3200, f1: 500, q: 1.1, vel: 0.05, attack: 1.4, release: 0.15, send: 0.3 });

  // splash
  S.thump(T.splash, { f0: 150, f1: 42, dur: 0.7, vel: 0.5 });
  S.noise(T.splash, { dur: 0.9, type: 'bandpass', f0: 2600, f1: 450, q: 0.8, vel: 0.28, attack: 0.004, release: 0.7, send: 0.35 });
  S.noise(T.splash, { dur: 1.6, type: 'lowpass', f0: 1000, f1: 180, vel: 0.12, attack: 0.01, release: 1.2 });
  [[10.35, 'E7'], [10.5, 'B6'], [10.72, 'F#7'], [10.95, 'D7'], [11.3, 'A6']].forEach(([tt, n]) => S.bell(tt, n, { vel: 0.02, dur: 0.5 }));

  // a dim star in the dark water
  S.pad(10.3, PADS.Bm, { dur: 1.8, vel: 0.11, attack: 1.2, release: 0.8, cutoff: 700 });
  S.bell(10.7, 'F#5', { vel: 0.09 });
  S.bell(11.35, 'D5', { vel: 0.08 });
  S.bell(11.9, 'B4', { vel: 0.08 });

  // rescued
  S.pad(12, PADS.G, { dur: 1, vel: 0.11, attack: 0.4, release: 0.5 });
  S.pad(13, PADS.A, { dur: 1, vel: 0.11, attack: 0.4, release: 0.6 });
  harp(S, 12, ['G3', 'D4', 'G4', 'B4', 'D5', 'G5'], 0.07, 1 / 6);
  harp(S, 13, ['A3', 'E4', 'A4', 'C#5', 'E5', 'A5'], 0.07, 1 / 6);
  tune(S, 6, [['B4', 0], ['D5', 1], ['E5', 2]], 0.12);
  S.bell(14, 'F#5', { vel: 0.15, dur: 3 });

  // the lantern: a breath, then the star climbs in
  S.pad(14, ['F#2', 'D3', 'A3', 'D4'], { dur: 2.2, vel: 0.12, attack: 0.6, release: 0.6 });
  S.noise(T.blow - 0.08, { dur: 0.45, type: 'bandpass', f0: 1300, f1: 700, q: 0.7, vel: 0.05, attack: 0.12, release: 0.3 });
  S.chirp(T.climb, { f0: 1400, f1: 2800, dur: 0.5, vel: 0.015 });
  S.bell(15.3, 'A5', { vel: 0.13 });
  S.bell(15.33, 'D6', { vel: 0.09 });
  S.bell(15.37, 'F#6', { vel: 0.06 });

  // rowing towards the horizon
  const journey = ['D', 'Bm', 'G', 'A'];
  journey.forEach((c, i) => {
    const t0 = (8 + i) * BAR;
    harp(S, t0, CHORDS[c], 0.085);
    S.bass(t0, ROOTS[c], { vel: 0.2, dur: 1.9 });
    S.pad(t0, PADS[c], { dur: 2, vel: 0.08, attack: 0.5, release: 0.6 });
  });
  tune(S, 8, [['F#5', 0], ['E5', 1], ['D5', 1.5], ['A4', 2]]);
  tune(S, 9, [['B4', 0], ['D5', 1], ['F#5', 2]]);
  tune(S, 10, [['G5', 0], ['F#5', 1.5], ['E5', 2]]);
  tune(S, 11, [['E5', 0], ['C#5', 1.5], ['A4', 2]]);
  for (let tt = 1 + ROW * 12; tt < 24; tt += ROW) S.noise(tt, { dur: 0.35, type: 'bandpass', f0: 1500, f1: 600, q: 1, vel: 0.022, release: 0.25 });

  // rising home into the sky
  S.pad(24, ['A2', 'D3', 'E3', 'A3'], { dur: 2, vel: 0.12, attack: 0.8, release: 0.5, cutoff: 1100 });
  S.pad(26, ['A2', 'E3', 'A3', 'C#4'], { dur: 1.9, vel: 0.14, attack: 0.5, release: 0.2, cutoff: 1500 });
  ['A3', 'C#4', 'E4', 'A4', 'C#5', 'E5', 'A5', 'C#6', 'E6', 'A6', 'C#6', 'E6'].forEach((n, i) =>
    S.pluck(24 + i * (BEAT / 2), n, { vel: 0.07 + i * 0.004, dur: 2 }));
  tune(S, 12, [['A5', 0]], 0.12);
  tune(S, 13, [['B5', 0], ['C#6', 1], ['E6', 2]], 0.12);
  S.noise(24.4, { dur: 3.55, type: 'highpass', f0: 2500, f1: 7000, q: 0.5, vel: 0.07, shape: 'swell', send: 0.4 });

  // back in its place
  S.thump(T.burst, { f0: 95, f1: 40, dur: 1.4, vel: 0.35 });
  S.bass(T.burst, 'D2', { vel: 0.3, dur: 4 });
  S.pad(T.burst, ['D3', 'A3', 'F#4', 'A4', 'D5'], { dur: 8, vel: 0.17, attack: 0.08, release: 3, cutoff: 1500 });
  ['D6', 'F#6', 'A6', 'D7'].forEach((n, i) => S.bell(T.burst + i * 0.06, n, { vel: 0.11, dur: 3.5 }));
  S.noise(T.burst, { dur: 2.5, type: 'highpass', f0: 5000, q: 0.4, vel: 0.03, attack: 0.01, release: 2.2, send: 0.6 });

  // the way home
  ['D', 'Bm', 'G', 'A'].forEach((c, i) => {
    const t0 = (14 + i) * BAR;
    harp(S, t0, CHORDS[c], 0.08);
    if (i) S.bass(t0, ROOTS[c], { vel: 0.19, dur: 1.9 });
  });
  tune(S, 15, [['B4', 0], ['D5', 1], ['B5', 2]]);
  tune(S, 16, [['A5', 0], ['G5', 1], ['F#5', 1.5], ['E5', 2]]);
  tune(S, 17, [['E5', 0], ['F#5', 1], ['E5', 2]], 0.13);
  for (let tt = 1 + ROW * 22; tt < 36; tt += ROW) S.noise(tt, { dur: 0.35, type: 'bandpass', f0: 1500, f1: 600, q: 1, vel: 0.018, release: 0.25 });

  // and rest
  S.bass(36, 'D2', { vel: 0.22, dur: 3 });
  S.pad(36, ['D3', 'A3', 'F#4', 'D5'], { dur: 0.6, vel: 0.14, attack: 0.3, release: 2.5 });
  ['D5', 'F#5', 'A5', 'D6'].forEach((n, i) => S.bell(36 + i * 0.07, n, { vel: 0.12, dur: 3 }));
}
