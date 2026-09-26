// Code Draws Istanbul · No. 2 — Simitçi (the simit seller).
// Morning in Balat. The seller calls, a basket comes down on a rope, the cats get their share.
// There are no words: the cry is a ney phrase and rings of sound, thanks are a hand on the heart.
// Every frame is painted from nothing as a pure function of time t.
import { TAU, lerp, seg, smooth, easeInOut, easeOut, fade, hash, noise, mixRgb, css, curve } from '../../engine/util.js';
import { glow, disc, grain, vignette, reach } from '../../engine/draw.js';
import { simit, cat, person, gull, mosque, roofs, tea, makamHz, CATS } from '../kit.js';

export const meta = {
  title: 'Simitçi',
  logline: 'Morning in Balat. The simit seller calls, a basket comes down on a rope, and the cats get their share.',
  duration: 24,
  width: 1920,
  height: 1080,
  cover: 7.6,
  poster: 15.9,
  mix: { reverb: 2.4, wet: 0.24 },
};

const W = 1920, H = 1080, GY = 930; // the foot of the walls: doorsteps, pots and the stool stand here
const LANE = GY + 14; // the front of the pavement, where he and the cats walk
const SELLER_H = 290, SK = SELLER_H / 330;
const START_X = -220, STOP_X = 815, SPEED = 140, DECEL = 0.6;
const STRIDE = SELLER_H * 0.28;

const T = {
  callA: 1.3, // heard round the corner before he is seen
  kidOpen: 1.55, kidIn: 1.8,
  enter: 2.6,
  call1: 5.05,
  stop: 2.6 + (STOP_X - START_X) / SPEED + DECEL / 2,
  call2: 10.4,
  open: 11.3, appear: 11.55, wave: 11.95,
  out: 12.6, lower: 13.1, lowered: 14.2,
  coins: 14.22, take1: 14.72, take2: 15.47,
  raise: 16.1, raised: 17.2,
  bow: 16.25, heart: 17.5,
  turn: 18.1, toss1: 18.5, toss2: 18.95, land1: 19.2, land2: 19.7, turnBack: 19.8,
  leave: 20.0, bye: 19.9, close: 21.0,
  dogUp: 21.6, kidWave: 20.1, kidWave2: 22.85,
  call3: 21.7,
  fadeOut: 23.3, end: 24,
};
const CALLS = [[T.call1, T.call1 + 1.1, 0], [T.call2, T.call2 + 1.0, 1], [T.call3, T.call3 + 1.0, 0]];

// ——— the camera: a wide morning street, then in close for the basket, then after him ———

const CAM = [
  [0, 930, 565, 1.08],
  [1.6, 905, 580, 1.11],
  [4.0, 640, 680, 1.34],
  [8.0, 760, 690, 1.4],
  [10.3, 850, 676, 1.44],
  [11.9, 880, 666, 1.7],
  [16.4, 880, 666, 1.7],
  [18.1, 800, 690, 1.46],
  [20.0, 800, 696, 1.42],
  [23.2, 1140, 650, 1.26],
  [24, 1170, 648, 1.25],
];
function camera(t) {
  const [x, y, z] = curve(CAM, t);
  return { x, y, z };
}

// ——— where the seller is ———

function sellerX(t) {
  if (t < T.stop - DECEL) return START_X + SPEED * (t - T.enter);
  if (t < T.stop) {
    const d = T.stop - t;
    return STOP_X - (SPEED * d * d) / (2 * DECEL);
  }
  if (t < T.leave) return STOP_X;
  const d = t - T.leave, r = 0.5;
  return STOP_X + SPEED * (d < r ? (d * d) / (2 * r) : d - r / 2);
}
const sellerSpeed = (t) => (sellerX(t + 0.01) - sellerX(t - 0.01)) / 0.02;
// The rig's lifted foot travels towards -x as its phase grows, so the phase runs down as he walks on.
// It is 0 at STOP_X: both feet flat in a planted step, the stance he stands in and sets off from again.
const walkPhase = (x) => -((x - STOP_X) / STRIDE) * Math.PI;

// ——— the street ———

const TRIM = [250, 240, 226];
const HOUSES = [
  { x: -300, w: 330, h: 560, c: '#e39a8b', shut: '#4d7d6b' },
  { x: 30, w: 300, h: 610, c: '#f0c466', shut: '#3f6e8e', kilim: true },
  { x: 330, w: 290, h: 540, c: '#9cc4d9', shut: '#b35b44', ledge: true },
  { x: 620, w: 360, h: 640, c: '#78c1b3', shut: '#8a4a3a', cumba: true, panes: 2, teyze: true },
  { x: 980, w: 310, h: 580, c: '#ec9a5c', shut: '#39606b', kid: true },
  { x: 1290, w: 330, h: 620, c: '#c8a0d4', shut: '#4b6b4a', cumba: true },
  { x: 1620, w: 300, h: 560, c: '#f2d9a6', shut: '#7a3f3a' },
  { x: 1920, w: 340, h: 640, c: '#e07f7f', shut: '#3d5c73', cumba: true },
  { x: 2260, w: 320, h: 590, c: '#8fc59a', shut: '#8a5a3a' },
];
const upper = (H0) => ({ top: GY - H0.h, uy: GY - H0.h + H0.h * 0.12, uh: H0.h * 0.3 });

/** The teyze's window: the right-hand pane of the teal house's bay. */
const WIN = (() => {
  const H0 = HOUSES[3], { uy, uh } = upper(H0);
  const cx = H0.x + H0.w * 0.4, cw = H0.w * 0.52, n = H0.panes;
  const ww = cw / n - 26, x0 = cx + 13 + ((n - 1) * cw) / n;
  return { x0, x1: x0 + ww, y0: uy + 14, y1: uy + uh - 22, cx: x0 + ww / 2 };
})();
/** The kid's window: upstairs left in the orange house. */
const KWIN = (() => {
  const H0 = HOUSES[4], { uy, uh } = upper(H0);
  const x0 = H0.x + H0.w * 0.2;
  return { x0, x1: x0 + 64, y0: uy + 20, y1: uy + uh - 20, cx: x0 + 32 };
})();

const glassOf = (k, x) => mixRgb([70, 90, 110], [200, 225, 240], 0.25 + 0.2 * hash(k, x));

function glint(ctx, x, y, w, h, a = 0.13) {
  ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.12, y + h);
  ctx.lineTo(x + w * 0.42, y);
  ctx.lineTo(x + w * 0.62, y);
  ctx.lineTo(x + w * 0.32, y + h);
  ctx.fill();
}

function shutters(ctx, x, y, w, h, shut) {
  const sw = w / 2;
  for (const side of [-1, 1]) {
    const sx = side < 0 ? x - sw - 6 : x + w + 6;
    ctx.fillStyle = css(shut);
    ctx.fillRect(sx, y - 4, sw, h + 8);
    ctx.fillStyle = css(mixRgb(shut, [0, 0, 0], 0.25));
    for (let k = 1; k < 6; k++) ctx.fillRect(sx + 3, y + (k * h) / 6, sw - 6, 2);
  }
}

function window1(ctx, x, y, w, h, glass, shut) {
  ctx.fillStyle = css(TRIM);
  ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
  ctx.fillStyle = css(glass);
  ctx.fillRect(x, y, w, h);
  glint(ctx, x, y, w, h);
  ctx.fillStyle = css(TRIM);
  ctx.fillRect(x + w / 2 - 2, y, 4, h);
  ctx.fillRect(x, y + h * 0.42, w, 4);
  shutters(ctx, x, y, w, h, shut);
}

/** A crocheted lace curtain (tül perde) with a scalloped hem. */
function lace(ctx, x, y, w, h, alpha) {
  if (w < 2) return;
  const lh = h * 0.52, n = Math.max(2, Math.round(w / 12)), step = w / n;
  ctx.fillStyle = `rgba(255,252,246,${alpha})`;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + lh);
  for (let i = n; i > 0; i--) {
    const sx = x + i * step;
    ctx.quadraticCurveTo(sx - step / 2, y + lh + 8, sx - step, y + lh);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(150,130,140,${alpha * 0.4})`;
  for (let i = 0; i < n; i++) disc(ctx, x + (i + 0.5) * step, y + lh - 6, 1.7, ctx.fillStyle);
}

/** One pane of a bay window: a dim room, the lace, then the glass. */
function bayPane(ctx, x, y, w, h, glass) {
  ctx.fillStyle = css(TRIM);
  ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
  ctx.fillStyle = '#4a3a3c';
  ctx.fillRect(x, y, w, h);
  lace(ctx, x, y, w, h, 0.92);
  ctx.fillStyle = css(glass, 0.72);
  ctx.fillRect(x, y, w, h);
  glint(ctx, x, y, w, h);
  ctx.fillStyle = css(TRIM);
  ctx.fillRect(x + w / 2 - 2, y, 4, h);
  ctx.fillRect(x, y + h * 0.42, w, 4);
}

function geraniums(ctx, wx, y) {
  ctx.fillStyle = css([170, 90, 60]);
  ctx.fillRect(wx + 4, y, 56, 14);
  for (let f = 0; f < 5; f++) disc(ctx, wx + 10 + f * 11, y - 4 - 3 * Math.sin(f * 2), 6, css(f % 2 ? [220, 60, 70] : [70, 130, 70]));
}

/** A stone window ledge, wide enough for a cat. */
function ledge(ctx, wx, y) {
  ctx.fillStyle = css([214, 206, 194]);
  ctx.fillRect(wx - 16, y, 96, 10);
  ctx.fillStyle = 'rgba(70,50,60,0.22)';
  ctx.fillRect(wx - 16, y + 8, 96, 2);
  ctx.fillStyle = 'rgba(60,40,60,0.18)';
  ctx.fillRect(wx - 10, y + 10, 84, 5);
}
/** The calico's spot: on the ledge under the blue house's upstairs window, well above his tray. */
const CALICO = (() => {
  const { uy, uh } = upper(HOUSES[2]);
  return { x: 420, y: uy + uh - 17 };
})();

function house(ctx, H0) {
  const { x, w, h } = H0;
  const { top, uy, uh } = upper(H0);
  const wall = H0.c;
  const dark = mixRgb(wall, [60, 40, 50], 0.35);
  // wall with morning light from the right
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, css(mixRgb(wall, [90, 70, 90], 0.12)));
  g.addColorStop(1, css(mixRgb(wall, [255, 240, 210], 0.12)));
  ctx.fillStyle = g;
  ctx.fillRect(x, top, w, h);
  // stone base
  ctx.fillStyle = css(mixRgb([200, 190, 178], wall, 0.15));
  ctx.fillRect(x, GY - 46, w, 46);
  ctx.fillStyle = 'rgba(80,60,60,0.18)';
  for (let k = 0; k < w; k += 46) ctx.fillRect(x + k, GY - 46, 2, 46);
  // cornice between floors, roof eave with tiles
  ctx.fillStyle = css(TRIM);
  ctx.fillRect(x - 4, GY - h * 0.47, w + 8, 10);
  ctx.fillStyle = css([92, 58, 44]);
  ctx.fillRect(x - 14, top - 16, w + 28, 18);
  ctx.fillStyle = css([184, 84, 58]);
  for (let k = -14; k < w + 14; k += 16) {
    ctx.beginPath();
    ctx.arc(x + k + 8, top - 16, 8, Math.PI, TAU);
    ctx.fill();
  }
  ctx.fillStyle = css([150, 80, 60]);
  ctx.fillRect(x + w * 0.72, top - 60, 26, 46);
  // door with an arch and a step
  const dx = x + w * 0.16;
  ctx.fillStyle = css(TRIM);
  ctx.beginPath();
  ctx.roundRect(dx - 8, GY - 196, 92, 196, [46, 46, 0, 0]);
  ctx.fill();
  ctx.fillStyle = css([96, 62, 48]);
  ctx.beginPath();
  ctx.roundRect(dx, GY - 188, 76, 188, [38, 38, 0, 0]);
  ctx.fill();
  ctx.fillStyle = css([120, 80, 60]);
  ctx.fillRect(dx + 36, GY - 150, 4, 150);
  disc(ctx, dx + 58, GY - 96, 3.5, css([214, 180, 90]));
  ctx.fillStyle = css([188, 180, 170]);
  ctx.fillRect(dx - 14, GY - 10, 104, 10);
  // ground floor window with iron bars
  const gx = x + w * 0.58;
  window1(ctx, gx, GY - 170, 70, 96, mixRgb([60, 70, 90], [255, 230, 190], 0.15), H0.shut);
  ctx.strokeStyle = 'rgba(40,30,30,0.7)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let k = 1; k < 5; k++) {
    ctx.moveTo(gx + k * 14, GY - 172);
    ctx.lineTo(gx + k * 14, GY - 72);
  }
  ctx.stroke();

  // upper floor
  if (H0.cumba) {
    const cx = x + w * 0.4, cw = w * 0.52;
    // the bay casts a soft shadow down the wall
    const sh = ctx.createLinearGradient(0, uy + uh, 0, uy + uh + 70);
    sh.addColorStop(0, 'rgba(50,30,50,0.28)');
    sh.addColorStop(1, 'rgba(50,30,50,0)');
    ctx.fillStyle = sh;
    ctx.fillRect(cx - 10, uy + uh, cw + 10, 70);
    ctx.fillStyle = css(mixRgb(wall, [255, 250, 240], 0.18));
    ctx.fillRect(cx - 12, uy - 10, cw + 24, uh + 20);
    ctx.fillStyle = css(dark);
    for (let k = 0; k < 4; k++) {
      const bx = cx + (k * cw) / 3;
      ctx.beginPath();
      ctx.moveTo(bx - 8, uy + uh + 10);
      ctx.lineTo(bx + 8, uy + uh + 10);
      ctx.lineTo(bx, uy + uh + 40);
      ctx.fill();
    }
    ctx.fillStyle = css([92, 58, 44]);
    ctx.fillRect(cx - 20, uy - 22, cw + 40, 12);
    const n = H0.panes ?? 3;
    for (let k = 0; k < n; k++) {
      if (H0.teyze && k === n - 1) continue; // her window is drawn with her in it
      const ww = cw / n - 26;
      bayPane(ctx, cx + 13 + (k * cw) / n, uy + 14, ww, uh - 36, glassOf(k, x));
    }
  } else {
    for (let k = 0; k < 2; k++) {
      if (H0.kid && k === 0) continue; // the kid's open window is drawn with the kid
      const wx = x + w * (0.2 + 0.42 * k);
      window1(ctx, wx, uy + 20, 64, uh - 40, mixRgb([70, 90, 110], [200, 225, 240], 0.3), H0.shut);
      if (H0.ledge && k === 0) ledge(ctx, wx, uy + uh - 18);
      else if (!(H0.kilim && k === 1)) geraniums(ctx, wx, uy + uh - 18);
    }
  }
}

function backRow(ctx) {
  for (let i = -3; i < 14; i++) {
    const x = i * 230 + 60 * hash(i, 3);
    const h = 170 + 110 * hash(i, 4);
    const top = 372 - h * 0.5;
    const c = mixRgb(['#e8b4a8', '#f3d6a0', '#b9d3df', '#c9b8dc', '#f0c29c'][(((i * 7) % 5) + 5) % 5], [236, 232, 240], 0.45);
    ctx.fillStyle = css(c);
    ctx.fillRect(x, top, 210, 400);
    ctx.fillStyle = css(mixRgb([160, 90, 70], [236, 232, 240], 0.4));
    ctx.beginPath();
    ctx.moveTo(x - 10, top);
    ctx.lineTo(x + 105, top - 30 - 18 * hash(i, 5));
    ctx.lineTo(x + 220, top);
    ctx.fill();
    ctx.fillStyle = css(mixRgb([90, 110, 130], [236, 232, 240], 0.45));
    for (let k = 0; k < 3; k++) ctx.fillRect(x + 30 + k * 60, top + 34, 26, 38);
  }
}

const HAZE = [214, 222, 236];
const ridge = (x) => 236 - 72 * Math.exp(-(((x - 700) / 520) ** 2)) - 34 * Math.exp(-(((x - 1420) / 360) ** 2)) - 12 * noise(x * 0.004, 2);

function farHill(ctx) {
  // the hill above Balat: houses, the red school of Fener and Yavuz Selim's mosque on the ridge
  ctx.fillStyle = css(mixRgb([150, 160, 190], HAZE, 0.42));
  ctx.beginPath();
  ctx.moveTo(-500, 460);
  for (let x = -500; x <= 2700; x += 20) ctx.lineTo(x, ridge(x));
  ctx.lineTo(2700, 460);
  ctx.fill();
  const red = css(mixRgb([176, 74, 60], HAZE, 0.38));
  const sb = ridge(700) + 8;
  ctx.fillStyle = red;
  ctx.fillRect(572, sb - 62, 256, 64);
  ctx.fillRect(662, sb - 94, 76, 40);
  ctx.beginPath();
  ctx.ellipse(700, sb - 94, 34, 27, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillRect(698, sb - 136, 4, 18);
  ctx.fillStyle = css(mixRgb([120, 50, 45], HAZE, 0.42));
  for (let k = 0; k < 7; k++) ctx.fillRect(588 + k * 34, sb - 46, 12, 20);
  mosque(ctx, 1430, ridge(1430) + 10, 30, css(mixRgb([128, 136, 170], HAZE, 0.35)), { minarets: 2 });
  roofs(ctx, -500, 540, (x) => ridge(x) + 8, 11, css(mixRgb([138, 148, 180], HAZE, 0.35)));
  roofs(ctx, 860, 1340, (x) => ridge(x) + 10, 12, css(mixRgb([138, 148, 180], HAZE, 0.35)));
  roofs(ctx, 1530, 2700, (x) => ridge(x) + 8, 13, css(mixRgb([138, 148, 180], HAZE, 0.35)));
}

function clouds(ctx, t) {
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  for (let i = 0; i < 4; i++) {
    const x = i * 610 + 200 * hash(i, 9) - 260 + t * 6, y = 60 + 50 * hash(i, 8);
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.ellipse(x + k * 46 - 70, y - 10 * Math.sin(k * 1.3 + i), 62 - 9 * Math.abs(k - 1.5), 15, 0, 0, TAU);
      ctx.fill();
    }
  }
}

function skyGulls(ctx, t) {
  for (let i = 0; i < 3; i++) {
    const x = 330 + i * 540 + 22 * t + 30 * Math.sin(t * 0.3 + i);
    const y = 76 + 34 * i + 9 * Math.sin(t * 0.5 + i * 2);
    gull(ctx, x, y, 0.85 - i * 0.12, Math.sin(t * (2.6 + i * 0.5) + i * 2), 1, { shade: 0.08 });
  }
}

function street(ctx) {
  ctx.fillStyle = '#cfc6bb';
  ctx.fillRect(-600, GY, 3600, 30);
  ctx.fillStyle = '#b3a99e';
  ctx.fillRect(-600, GY + 26, 3600, 6);
  ctx.fillStyle = '#8b8791';
  ctx.fillRect(-600, GY + 32, 3600, 200);
  for (let r = 0; r < 6; r++) {
    const y = GY + 36 + r * 21;
    for (let i = -40; i < 180; i++) {
      const x = i * 30 + (r % 2) * 15;
      ctx.fillStyle = css(mixRgb([150, 146, 158], [110, 106, 120], hash(i, r)));
      ctx.beginPath();
      ctx.roundRect(x, y, 26, 17, 6);
      ctx.fill();
    }
  }
  // warm pools of low sun on the cobbles, between the shadows of the houses across the street
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [x0, w0, a] of [[-260, 240, 0.09], [300, 190, 0.08], [930, 360, 0.12], [1700, 250, 0.09], [2300, 260, 0.09]]) {
    ctx.fillStyle = `rgba(255,208,140,${a})`;
    ctx.beginPath();
    ctx.moveTo(x0, GY + 32);
    ctx.lineTo(x0 + w0, GY + 32);
    ctx.lineTo(x0 + w0 - 110, GY + 232);
    ctx.lineTo(x0 - 110, GY + 232);
    ctx.fill();
  }
  ctx.restore();
}

function sunlight(ctx, t) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const x0 = 2100 - i * 380 + 30 * Math.sin(t * 0.3 + i);
    ctx.fillStyle = `rgba(255,236,190,${0.03 + 0.015 * Math.sin(t * 0.5 + i)})`;
    ctx.beginPath();
    ctx.moveTo(x0, -60);
    ctx.lineTo(x0 + 140, -60);
    ctx.lineTo(x0 - 640, 1100);
    ctx.lineTo(x0 - 860, 1100);
    ctx.fill();
  }
  ctx.restore();
}

// ——— life on the walls ———

/** A kilim airing over the sill of the yellow house: a short runner, so his tray passes under it. */
function kilim(ctx, t) {
  const x = 248, y = 553, w = 96, h = 46;
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0, 0.03 * Math.sin(t * 1.2), 1, 0, 0);
  ctx.fillStyle = '#8e2430';
  ctx.fillRect(-w / 2 - 2, -7, w + 4, 9);
  ctx.fillStyle = '#b8323a';
  ctx.fillRect(-w / 2, 0, w, h);
  ctx.fillStyle = '#23305a';
  ctx.fillRect(-w / 2, 0, 7, h);
  ctx.fillRect(w / 2 - 7, 0, 7, h);
  ctx.fillStyle = '#f0c46a';
  ctx.fillRect(-w / 2 + 9, 5, w - 18, 3);
  ctx.fillRect(-w / 2 + 9, h - 8, w - 18, 3);
  const diamond = (cy, rx, ry, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(0, cy - ry);
    ctx.lineTo(rx, cy);
    ctx.lineTo(0, cy + ry);
    ctx.lineTo(-rx, cy);
    ctx.fill();
  };
  diamond(h / 2, 22, 16, '#23305a');
  diamond(h / 2, 14, 10, '#f3e6c8');
  diamond(h / 2, 6, 4.5, '#b8323a');
  for (const sx of [-30, 30]) {
    ctx.fillStyle = '#f3e6c8';
    ctx.fillRect(sx - 3, h / 2 - 3, 6, 6);
    ctx.fillStyle = '#23305a';
    ctx.fillRect(sx - 1.5, 12, 3, 3);
    ctx.fillRect(sx - 1.5, h - 15, 3, 3);
  }
  ctx.strokeStyle = '#f3e6c8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let k = 0; k <= 16; k++) {
    const fx = -w / 2 + 3 + k * ((w - 6) / 16);
    ctx.moveTo(fx, h);
    ctx.lineTo(fx + 1.5 * Math.sin(t * 2 + k), h + 8);
  }
  ctx.stroke();
  ctx.restore();
}

/** Washing on a line between the orange house and the purple one. */
function laundry(ctx, t) {
  const x0 = 1282, x1 = 1416, y0 = 500, sag = 14;
  const lineY = (x) => y0 + sag * (1 - ((2 * (x - x0)) / (x1 - x0) - 1) ** 2);
  ctx.fillStyle = '#5a4a44';
  ctx.fillRect(x0 - 4, y0 - 7, 8, 10);
  ctx.fillRect(x1 - 4, y0 - 7, 8, 10);
  ctx.strokeStyle = '#efe8dc';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let x = x0; x <= x1; x += 8) x === x0 ? ctx.moveTo(x, lineY(x)) : ctx.lineTo(x, lineY(x));
  ctx.stroke();
  const items = [
    [1300, 'shirt', '#d9544f', 32, 38],
    [1334, 'towel', '#f4efe4', 24, 48],
    [1358, 'sock', '#f0c040', 10, 22],
    [1371, 'sock', '#f0c040', 10, 22],
    [1396, 'dress', '#3f7fbf', 26, 42],
  ];
  items.forEach(([ix, kind, c, iw, ih], i) => {
    const iy = lineY(ix);
    ctx.save();
    ctx.translate(ix, iy);
    ctx.rotate(0.07 * Math.sin(t * 1.8 + i * 0.9) + 0.03 * noise(t * 0.7, i + 40));
    ctx.fillStyle = c;
    ctx.beginPath();
    if (kind === 'shirt') {
      ctx.moveTo(-iw / 2, 0);
      ctx.lineTo(iw / 2, 0);
      ctx.lineTo(iw / 2 + iw * 0.18, ih * 0.32);
      ctx.lineTo(iw * 0.34, ih * 0.36);
      ctx.lineTo(iw * 0.34, ih);
      ctx.lineTo(-iw * 0.34, ih);
      ctx.lineTo(-iw * 0.34, ih * 0.36);
      ctx.lineTo(-iw / 2 - iw * 0.18, ih * 0.32);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let k = 1; k < 4; k++) disc(ctx, 0, ih * 0.22 * k + 4, 1.3, ctx.fillStyle);
    } else if (kind === 'towel') {
      ctx.rect(-iw / 2, 0, iw, ih);
      ctx.fill();
      ctx.fillStyle = '#4a7fb8';
      ctx.fillRect(-iw / 2, ih * 0.62, iw, 5);
      ctx.fillRect(-iw / 2, ih * 0.78, iw, 5);
    } else if (kind === 'sock') {
      ctx.moveTo(-iw / 2, 0);
      ctx.lineTo(iw / 2, 0);
      ctx.lineTo(iw / 2, ih * 0.75);
      ctx.quadraticCurveTo(iw / 2 + 9, ih * 0.8, iw / 2 + 8, ih);
      ctx.lineTo(-iw / 2 + 2, ih);
      ctx.lineTo(-iw / 2, ih * 0.75);
      ctx.fill();
      ctx.fillStyle = '#d0572f';
      ctx.fillRect(-iw / 2, 0, iw, 4);
    } else {
      ctx.moveTo(-iw * 0.3, 0);
      ctx.lineTo(iw * 0.3, 0);
      ctx.lineTo(iw * 0.62, ih);
      ctx.lineTo(-iw * 0.62, ih);
      ctx.fill();
      ctx.fillStyle = '#f4efe4';
      for (let k = 0; k < 4; k++) disc(ctx, -iw * 0.4 + k * iw * 0.27, ih * 0.78, 2.2, '#f4efe4');
    }
    // clothes pegs
    ctx.fillStyle = '#c99a5e';
    for (const px of kind === 'sock' ? [0] : [-iw * 0.3, iw * 0.3]) ctx.fillRect(px - 1.5, -3, 3, 7);
    ctx.restore();
  });
}

/** A grapevine (asma) trained over the blue house's door. */
function asma(ctx, t) {
  const bx = 356;
  ctx.strokeStyle = '#6b4a34';
  ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(bx, GY - 2);
  ctx.bezierCurveTo(bx - 8, GY - 80, bx + 8, GY - 150, bx - 2, GY - 216);
  ctx.stroke();
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(bx - 2, GY - 214);
  ctx.bezierCurveTo(bx + 30, GY - 236, bx + 90, GY - 206, bx + 150, GY - 222);
  ctx.moveTo(bx + 60, GY - 222);
  ctx.quadraticCurveTo(bx + 76, GY - 250, bx + 104, GY - 246);
  ctx.stroke();
  // grapes
  for (const [gx, gy] of [[bx + 42, GY - 206], [bx + 118, GY - 208]]) {
    ctx.strokeStyle = '#6b4a34';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(gx, gy - 8);
    ctx.lineTo(gx, gy);
    ctx.stroke();
    for (let r = 0; r < 4; r++) {
      for (let k = 0; k <= 3 - r; k++) {
        const px = gx + (k - (3 - r) / 2) * 6.5, py = gy + 4 + r * 6;
        disc(ctx, px, py, 3.8, '#6b3f6e');
        disc(ctx, px - 1.2, py - 1.2, 1.1, 'rgba(255,255,255,0.35)');
      }
    }
  }
  // leaves
  for (let i = 0; i < 17; i++) {
    const k = i / 16;
    const lx = bx - 12 + k * 170 + 10 * Math.sin(i * 2.3);
    const ly = GY - 222 + 12 * Math.sin(i * 1.7) + (i % 3 === 0 ? 14 : 0) + 6 * Math.sin(k * Math.PI * 2);
    const sway = 0.12 * Math.sin(t * 1.6 + i * 0.8);
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(sway + (hash(i, 21) - 0.5));
    const col = css(mixRgb([74, 125, 60], [126, 178, 86], hash(i, 22)));
    disc(ctx, 0, 0, 9, col);
    disc(ctx, -6, -5, 6.5, col);
    disc(ctx, 6, -5, 6.5, col);
    ctx.strokeStyle = 'rgba(40,70,30,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(0, -6);
    ctx.stroke();
    ctx.restore();
  }
  // a few leaves climbing the trunk
  for (let i = 0; i < 5; i++) {
    const ly = GY - 40 - i * 34;
    const col = css(mixRgb([74, 125, 60], [126, 178, 86], hash(i, 23)));
    disc(ctx, bx + (i % 2 ? 9 : -9), ly, 6.5, col);
  }
}

/** A blue eye bead above the teyze's door, against the evil eye. */
function nazar(ctx, t) {
  const x = 715.6, y = GY - 216;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.12 * Math.sin(t * 1.4));
  disc(ctx, 0, 0, 2.2, '#5a4a44');
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 12);
  ctx.stroke();
  disc(ctx, 0, 25, 13, '#1d4fa3');
  disc(ctx, 0, 25, 9, '#f7f7f2');
  disc(ctx, 0, 25, 6, '#62b0e6');
  disc(ctx, 0, 25, 3.2, '#15161c');
  disc(ctx, -4, 20, 2, 'rgba(255,255,255,0.7)');
  disc(ctx, 0, 42, 3.4, '#1d4fa3');
  ctx.strokeStyle = '#c8323a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const dx of [-2, 0, 2]) {
    ctx.moveTo(0, 45);
    ctx.lineTo(dx * 1.5, 56);
  }
  ctx.stroke();
  ctx.restore();
}

/** Whitewashed olive-oil tins and a clay pot of basil against the teal house. */
function pots(ctx, t) {
  const plant = (x, y, n, flower, seed) => {
    for (let i = 0; i < n; i++) {
      const a = (i / (n - 1) - 0.5) * 2.2, len = 14 + 8 * hash(i, seed);
      const px = x + Math.sin(a) * len + 1.5 * Math.sin(t * 1.3 + i), py = y - Math.cos(a) * len * 0.8 - 4;
      disc(ctx, px, py, 6.5, css(mixRgb([60, 118, 60], [100, 160, 80], hash(i, seed + 1))));
    }
    if (flower) {
      for (let i = 0; i < 3; i++) {
        const fx = x - 10 + i * 10 + 1.5 * Math.sin(t * 1.1 + i), fy = y - 22 - 7 * hash(i, seed + 2);
        for (let p = 0; p < 5; p++) disc(ctx, fx + 3.6 * Math.cos((p * TAU) / 5), fy + 3.6 * Math.sin((p * TAU) / 5), 3.2, flower);
        disc(ctx, fx, fy, 1.8, '#f6d56a');
      }
    }
  };
  const tin = (x, w, h, c, flower, seed) => {
    ctx.fillStyle = 'rgba(60,40,60,0.18)';
    ctx.beginPath();
    ctx.ellipse(x - 8, GY + 2, w * 0.7, 4, 0, 0, TAU);
    ctx.fill();
    plant(x, GY - h, 7, flower, seed);
    ctx.fillStyle = c;
    ctx.fillRect(x - w / 2, GY - h, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x - w / 2, GY - h, 4, h);
    ctx.fillRect(x - w / 2, GY - h + 6, w, 2);
  };
  tin(930, 30, 38, '#eeebe4', '#d8343f', 50);
  // clay pot of basil
  plant(968, GY - 26, 9, null, 60);
  ctx.fillStyle = '#b8643c';
  ctx.beginPath();
  ctx.moveTo(955, GY - 28);
  ctx.lineTo(981, GY - 28);
  ctx.lineTo(977, GY);
  ctx.lineTo(959, GY);
  ctx.fill();
  ctx.fillStyle = '#9a4f2e';
  ctx.fillRect(953, GY - 30, 30, 6);
  tin(1000, 24, 30, '#6fa0c8', '#f07aa0', 70);
}

/** A low stool with a tea glass steaming on it: somebody's just stepped inside. */
function stoolTea(ctx, t) {
  const x = 1468; // under the purple house's window, clear of his path
  ctx.fillStyle = 'rgba(60,40,60,0.18)';
  ctx.beginPath();
  ctx.ellipse(x - 14, GY + 3, 30, 4, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#7a4f34';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 15, GY - 38);
  ctx.lineTo(x - 18, GY);
  ctx.moveTo(x + 15, GY - 38);
  ctx.lineTo(x + 18, GY);
  ctx.moveTo(x - 16, GY - 16);
  ctx.lineTo(x + 16, GY - 16);
  ctx.stroke();
  ctx.fillStyle = '#9a6a44';
  ctx.beginPath();
  ctx.roundRect(x - 22, GY - 44, 44, 8, 3);
  ctx.fill();
  tea(ctx, x, GY - 44, 1.25, t, 1);
}

// ——— the teyze and her basket ———

const CARDI = '#6d5a8a', SLEEVE = '#584672', SCARF = '#c8465e', TSKIN = '#e8b896';
const BX = 922, BS = 0.76;
const B_TOP = WIN.y1 + 5 + 44 * BS; // hanging just under her hands
const B_BOT = 724; // at his chest, where he can reach into it

function basketAt(t) {
  const { cx, y1 } = WIN;
  const inY = y1 + 44 * BS + 8, overY = y1 + 4 - 14 * BS;
  if (t < T.out || t > T.raised + 0.5) return null;
  if (t < T.out + 0.22) return { x: cx + 4, y: lerp(inY, overY, smooth(seg(t, T.out, T.out + 0.22))), inside: true };
  if (t < T.lower) {
    const k = smooth(seg(t, T.out + 0.22, T.lower));
    return { x: lerp(cx + 4, BX, k), y: lerp(overY, B_TOP, k), inside: false };
  }
  if (t < T.raised) {
    const down = easeInOut(seg(t, T.lower, T.lowered)) - easeInOut(seg(t, T.raise, T.raised));
    const swing = Math.sin((t - T.lower) * 2.3) * 5 * Math.sin(Math.PI * Math.min(1, down * 1.2));
    return { x: BX + swing, y: lerp(B_TOP, B_BOT, down), inside: false, rope: true };
  }
  if (t < T.raised + 0.25) {
    const k = smooth(seg(t, T.raised, T.raised + 0.25));
    return { x: lerp(BX, cx + 4, k), y: lerp(B_TOP, overY, k), inside: false };
  }
  return { x: cx + 4, y: lerp(overY, inY, smooth(seg(t, T.raised + 0.25, T.raised + 0.5))), inside: true };
}

const inBasket = (t) => (t > T.take1 + TAKE_DUR ? 1 : 0) + (t > T.take2 + TAKE_DUR ? 1 : 0);
const coinsIn = (t) => t < T.coins + 0.21;

function basketShape(ctx, B, n, paid = false) {
  ctx.save();
  ctx.translate(B.x, B.y);
  ctx.scale(BS, BS);
  ctx.strokeStyle = '#7a5530';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, -18, 26, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  for (let i = 0; i < n; i++) simit(ctx, -10 + i * 20, -16 - i * 4, 16, 0.3 - i * 0.5, 0.45, 40 + i);
  if (paid) coins(ctx, 1, -23, 1.25);
  ctx.fillStyle = '#c8954f';
  ctx.beginPath();
  ctx.moveTo(-34, -18);
  ctx.lineTo(34, -18);
  ctx.lineTo(26, 14);
  ctx.lineTo(-26, 14);
  ctx.fill();
  ctx.fillStyle = '#a8753a';
  ctx.fillRect(-35, -20, 70, 5);
  ctx.strokeStyle = 'rgba(110,70,30,0.6)';
  ctx.lineWidth = 1.5;
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.moveTo(-32 + k * 2, -11 + k * 7);
    ctx.lineTo(32 - k * 2, -11 + k * 7);
    ctx.stroke();
  }
  for (let k = -3; k <= 3; k++) {
    ctx.beginPath();
    ctx.moveTo(k * 10, -18);
    ctx.lineTo(k * 8, 14);
    ctx.stroke();
  }
  ctx.restore();
}

function teyzeState(t) {
  // she leans out from below the sill, and at the end sinks back into the dim room
  const rise = smooth(seg(t, T.appear, T.appear + 0.45));
  const away = smooth(seg(t, T.close - 0.5, T.close + 0.05));
  const happy = fade(t, T.heart, T.heart + 0.95, 0.2, 0.25);
  return { rise, away, dy: (1 - rise) * 76 + away * 40, shrink: 1 - 0.08 * away, happy, tilt: 0.14 * happy - 0.07 * (1 - happy) };
}

const mix2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

function teyzeHands(t, S) {
  const { cx, y1 } = WIN;
  let L = [cx - 16, y1 + 3], R = [cx + 16, y1 + 3];
  // hello, and goodbye
  for (const [a, b] of [[T.wave, T.wave + 0.75], [T.bye, T.bye + 0.95]]) {
    const k = fade(t, a, b, 0.2, 0.2);
    if (k > 0) R = mix2(R, [cx + 27 + 6 * Math.sin((t - a) * 15), y1 - 44 + S.dy], k);
  }
  // hand over hand on the rope
  const onRope = fade(t, T.lower, T.raised, 0.08, 0.08);
  if (onRope > 0) {
    const moving = Math.min(1, fade(t, T.lower, T.lowered, 0.1, 0.1) + fade(t, T.raise, T.raised, 0.1, 0.1));
    const w = 4 * Math.sin(t * 9) * moving;
    L = mix2(L, [BX - 4, y1 + 1 + w], onRope);
    R = mix2(R, [BX + 3, y1 + 9 - w], onRope);
  }
  // she lifts the basket by its sides from inside, and lets it out by the handle
  const B = basketAt(t);
  if (B && !B.rope) {
    const hy = B.y - 44 * BS;
    const k = t < T.lower ? smooth(seg(t, T.out, T.out + 0.1)) : 1 - smooth(seg(t, T.raised + 0.4, T.raised + 0.5));
    const h = t < T.lower ? smooth(seg(t, T.out + 0.18, T.lower - 0.05)) : 1 - smooth(seg(t, T.raised + 0.05, T.raised + 0.28));
    L = mix2(L, mix2([B.x - 22, B.y - 9], [B.x - 7, hy + 2], h), k);
    R = mix2(R, mix2([B.x + 22, B.y - 9], [B.x + 7, hy + 2], h), k);
  }
  // her hand on her heart
  const hk = fade(t, T.heart, T.heart + 0.95, 0.25, 0.25);
  if (hk > 0) L = mix2(L, [cx + 7, y1 - 12 + S.dy], hk);
  // the hands come up onto the sill only once her head is up, and go down with her at the end
  const up = smooth(seg(S.rise, 0.45, 1)) * (1 - smooth(seg(S.away, 0, 0.55)));
  L = mix2([cx - 18, y1 + 38 + S.dy * 0.3], L, up);
  R = mix2([cx + 18, y1 + 38 + S.dy * 0.3], R, up);
  return { L, R };
}

function teyzeBody(ctx, S) {
  const { cx, y1 } = WIN, dy = S.dy;
  ctx.save();
  // stepping back, she grows a little smaller about her chest
  ctx.translate(cx, y1 - 10 + dy);
  ctx.scale(S.shrink, S.shrink);
  ctx.translate(-cx, -(y1 - 10 + dy));
  ctx.fillStyle = CARDI;
  ctx.beginPath();
  ctx.ellipse(cx, y1 + 8 + dy, 31, 30, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#efe4d2';
  ctx.beginPath();
  ctx.moveTo(cx - 8, y1 - 21 + dy);
  ctx.lineTo(cx + 8, y1 - 21 + dy);
  ctx.lineTo(cx, y1 - 7 + dy);
  ctx.fill();
  ctx.save();
  ctx.translate(cx - 1, y1 - 45 + dy);
  ctx.rotate(S.tilt);
  // the yazma: a dotted headscarf with its oya lace edge, knotted under the chin
  ctx.fillStyle = SCARF;
  ctx.beginPath();
  ctx.arc(0, -2, 21, Math.PI * 0.82, Math.PI * 2.18);
  ctx.lineTo(24, 26);
  ctx.lineTo(-24, 26);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (1.02 + 0.96 * (i / 8));
    disc(ctx, Math.cos(a) * 17.5, -2 + Math.sin(a) * 17.5, 2, '#f6d56a');
  }
  for (const [px, py] of [[-19, 14], [19, 14], [-15, 23], [15, 23]]) disc(ctx, px, py, 1.9, '#f6d56a');
  ctx.fillStyle = TSKIN;
  ctx.beginPath();
  ctx.ellipse(0, 3, 13.5, 15.5, 0, 0, TAU);
  ctx.fill();
  for (let i = 0; i < 11; i++) {
    const a = Math.PI * (1.02 + 0.96 * (i / 10));
    disc(ctx, Math.cos(a) * 14.5, 3 + Math.sin(a) * 16.2, 1.5, i % 2 ? '#fff4d6' : '#7fc07a');
  }
  ctx.fillStyle = SCARF;
  ctx.beginPath();
  ctx.moveTo(-5, 18);
  ctx.lineTo(5, 18);
  ctx.lineTo(0, 25);
  ctx.fill();
  // a little grey hair under the scarf
  ctx.fillStyle = '#b9b3ae';
  ctx.beginPath();
  ctx.ellipse(0, -10, 10, 3.2, 0, 0, TAU);
  ctx.fill();
  // eyes behind round glasses, looking down at the street — or shut with delight
  if (S.happy > 0.5) {
    ctx.strokeStyle = '#2a1f1c';
    ctx.lineWidth = 1.6;
    for (const ex of [-5.2, 5.2]) {
      ctx.beginPath();
      ctx.arc(ex, 2.6, 2.6, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
  } else {
    disc(ctx, -6.2, 2.4, 1.8, '#2a1f1c');
    disc(ctx, 4.2, 2.4, 1.8, '#2a1f1c');
  }
  ctx.strokeStyle = '#6a4a3a';
  ctx.lineWidth = 1.2;
  for (const ex of [-5.2, 5.2]) {
    ctx.beginPath();
    ctx.arc(ex, 1.6, 4.6, 0, TAU);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-0.6, 1.2);
  ctx.lineTo(0.6, 1.2);
  ctx.stroke();
  ctx.strokeStyle = '#8a3a2a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 8, 4.5 + S.happy, 0.25, Math.PI - 0.25);
  ctx.stroke();
  disc(ctx, -9, 8, 3.2, 'rgba(230,120,120,0.35)');
  disc(ctx, 9, 8, 3.2, 'rgba(230,120,120,0.35)');
  ctx.restore();
  ctx.restore();
}

function softArm(ctx, sh, hand, side, color, skin, width) {
  const mx = (sh[0] + hand[0]) / 2 + side * 11, my = Math.max(sh[1], hand[1]) + 11;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sh[0], sh[1]);
  ctx.quadraticCurveTo(mx, my, hand[0], hand[1]);
  ctx.stroke();
  disc(ctx, hand[0], hand[1], width * 0.55, skin);
}

function teyzeWindow(ctx, t) {
  const { x0, x1, y0, y1, cx } = WIN, w = x1 - x0, h = y1 - y0;
  const open = smooth(seg(t, T.open, T.open + 0.6)) * (1 - smooth(seg(t, T.close, T.close + 0.6)));
  const S = teyzeState(t);
  ctx.fillStyle = css(TRIM);
  ctx.fillRect(x0 - 6, y0 - 6, w + 12, h + 12);
  // the room behind, warm from a lamp
  const room = ctx.createLinearGradient(0, y0, 0, y1);
  room.addColorStop(0, '#6e4c3e');
  room.addColorStop(1, '#3a2a2c');
  ctx.fillStyle = room;
  ctx.fillRect(x0, y0, w, h);
  // the cry reaches the window: the lace stirs and the casements rattle before they open
  const jig = 1.6 * Math.sin(t * 71) * Math.sin(Math.PI * seg(t, T.open - 0.3, T.open + 0.02));
  lace(ctx, x0, y0 + jig * 0.6, w * (1 - 0.74 * open), h, 0.92);
  const B = basketAt(t);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, w, h);
  ctx.clip();
  if (S.rise > 0 && S.away < 1) {
    teyzeBody(ctx, S);
    if (S.away > 0) {
      // the dim room closes over her as she sinks back
      ctx.globalAlpha = Math.min(1, S.away * 1.15);
      ctx.fillStyle = room;
      ctx.fillRect(x0, y0, w, h);
      ctx.globalAlpha = 1;
      lace(ctx, x0, y0, w * (1 - 0.74 * open), h, 0.92 * S.away);
    }
  }
  if (B && B.inside) basketShape(ctx, B, inBasket(t));
  ctx.restore();
  // the two casements swing out
  const sw = (w / 2) * (1 - 0.74 * open);
  const glass = mixRgb(glassOf(1, 620), [225, 238, 248], 0.35 * open);
  for (const sx0 of [x0, x1 - sw]) {
    const sx = sx0 + jig * (sx0 === x0 ? 1 : -1);
    ctx.fillStyle = css(glass, lerp(0.72, 0.95, open));
    ctx.fillRect(sx, y0, sw, h);
    if (open < 0.5) glint(ctx, sx, y0, sw, h, 0.12);
    ctx.fillStyle = css(TRIM);
    ctx.fillRect(sx, y0, sw, 3);
    ctx.fillRect(sx, y1 - 3, sw, 3);
    ctx.fillRect(sx, y0, 2.5, h);
    ctx.fillRect(sx + sw - 2.5, y0, 2.5, h);
    ctx.fillRect(sx, y0 + h * 0.42, sw, 4);
  }
  // the sill
  ctx.fillStyle = css(TRIM);
  ctx.fillRect(x0 - 12, y1 + 4, w + 24, 8);
  ctx.fillStyle = 'rgba(60,40,40,0.25)';
  ctx.fillRect(x0 - 12, y1 + 12, w + 24, 3);
  if (S.rise <= 0 || S.away >= 1) return;
  const hands = teyzeHands(t, S);
  // the rope, paid out hand over hand, and the basket against the wall behind him
  if (B && B.rope) {
    ctx.strokeStyle = '#efe6d6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(BX, y1 + 4);
    ctx.lineTo(B.x, B.y - 44 * BS);
    ctx.stroke();
  }
  if (B && !B.inside) basketShape(ctx, B, inBasket(t), coinsIn(t));
  ctx.save();
  ctx.globalAlpha = 1 - S.away;
  ctx.beginPath();
  ctx.rect(x0 - 40, y0 - 30, w + 80, y1 + 14 - (y0 - 30));
  ctx.clip();
  softArm(ctx, [cx - 22, y1 - 16 + S.dy], hands.L, -1, SLEEVE, TSKIN, 11);
  softArm(ctx, [cx + 22, y1 - 16 + S.dy], hands.R, 1, SLEEVE, TSKIN, 11);
  ctx.restore();
}

// ——— the kid upstairs ———

function kidWindow(ctx, t) {
  const { x0, x1, y0, y1, cx } = KWIN, w = x1 - x0, h = y1 - y0;
  const open = smooth(seg(t, T.kidOpen, T.kidOpen + 0.4));
  const rise = smooth(seg(t, T.kidIn, T.kidIn + 0.4));
  const dy = (1 - rise) * 64;
  shutters(ctx, x0, y0, w, h, HOUSES[4].shut);
  ctx.fillStyle = css(TRIM);
  ctx.fillRect(x0 - 6, y0 - 6, w + 12, h + 12);
  const room = ctx.createLinearGradient(0, y0, 0, y1);
  room.addColorStop(0, '#5e4a48');
  room.addColorStop(1, '#342a30');
  ctx.fillStyle = room;
  ctx.fillRect(x0, y0, w, h);
  // eyes follow the seller; claps for the cats, waves as he sets off and again once he is past
  const look = Math.max(-1, Math.min(1, (sellerX(t) - cx) / 260));
  const clap = fade(t, T.toss1 + 0.35, T.land2 + 0.45, 0.15, 0.2);
  const wave = fade(t, T.kidWave, T.kidWave + 1.1, 0.2, 0.25);
  const wave2 = fade(t, T.kidWave2, T.kidWave2 + 0.9, 0.2, 0.25);
  const lean = 7 * fade(t, T.kidWave, T.kidWave2 + 0.9, 0.4, 0.3) + 5 * wave2;
  const hop = 6 * Math.abs(Math.sin(t * 8)) * clap + lean;
  const joy = clap > 0.3;
  const hx = cx, hy = y1 - 27 + dy - hop;
  if (rise > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, y0, w, h);
    ctx.clip();
    // striped pyjamas
    ctx.fillStyle = '#e9eef6';
    ctx.beginPath();
    ctx.ellipse(cx, y1 + 10 + dy - hop, 24, 22, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#6d93c6';
    for (let k = -3; k <= 3; k++) ctx.fillRect(cx + k * 8 - 2, y1 - 14 + dy - hop, 4, 30);
    disc(ctx, hx, hy, 15, '#f0c09a');
    disc(ctx, hx - 14.5, hy + 1, 3.6, '#f0c09a');
    disc(ctx, hx + 14.5, hy + 1, 3.6, '#f0c09a');
    ctx.fillStyle = '#3a2620';
    ctx.beginPath();
    ctx.arc(hx, hy - 1, 15.6, Math.PI * 1.02, Math.PI * 1.98);
    ctx.quadraticCurveTo(hx + 6, hy - 6, hx, hy - 9);
    ctx.quadraticCurveTo(hx - 8, hy - 5, hx - 15.4, hy - 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + 1, hy - 15);
    ctx.quadraticCurveTo(hx + 5, hy - 24, hx + 9, hy - 20);
    ctx.quadraticCurveTo(hx + 5, hy - 19, hx + 4, hy - 14);
    ctx.fill();
    const px = 2 * look, py = 1.3;
    if (joy) {
      // eyes squeezed shut with delight
      ctx.strokeStyle = '#2a1f1c';
      ctx.lineWidth = 1.8;
      for (const ex of [-5.5, 5.5]) {
        ctx.beginPath();
        ctx.arc(hx + ex, hy + 2.5, 3, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }
    } else {
      for (const ex of [-5.5, 5.5]) {
        disc(ctx, hx + ex, hy + 1, 3.3, '#fff');
        disc(ctx, hx + ex + px, hy + 1 + py, 2.2, '#2a1f1c');
        disc(ctx, hx + ex + px + 0.7, hy + 0.2 + py, 0.7, '#fff');
      }
    }
    disc(ctx, hx - 9, hy + 7, joy ? 3.6 : 3, `rgba(235,120,120,${joy ? 0.55 : 0.4})`);
    disc(ctx, hx + 9, hy + 7, joy ? 3.6 : 3, `rgba(235,120,120,${joy ? 0.55 : 0.4})`);
    if (joy || wave2 > 0.3) {
      // a wide open grin
      ctx.fillStyle = '#7a2e2a';
      ctx.beginPath();
      ctx.arc(hx, hy + 5.5, 5.2, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e8828a';
      ctx.beginPath();
      ctx.ellipse(hx, hy + 9, 2.8, 1.6, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#7a2e2a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(hx, hy + 6, 4, 0.3, Math.PI - 0.3);
      ctx.stroke();
    }
    ctx.restore();
  }
  // the casements, pushed wide open
  const sw = (w / 2) * (1 - 0.76 * open);
  for (const sx of [x0, x1 - sw]) {
    ctx.fillStyle = css(mixRgb([70, 90, 110], [225, 238, 248], 0.3 + 0.3 * open), 0.92);
    ctx.fillRect(sx, y0, sw, h);
    if (open < 0.5) glint(ctx, sx, y0, sw, h, 0.12);
    ctx.fillStyle = css(TRIM);
    ctx.fillRect(sx, y0, sw, 3);
    ctx.fillRect(sx, y1 - 3, sw, 3);
    ctx.fillRect(sx, y0, 2.5, h);
    ctx.fillRect(sx + sw - 2.5, y0, 2.5, h);
    ctx.fillRect(sx, y0 + h * 0.42, sw, 4);
  }
  ctx.fillStyle = css(TRIM);
  ctx.fillRect(x0 - 10, y1 + 4, w + 20, 7);
  if (rise <= 0) return;
  let L = [cx - 13, y1 + 3], R = [cx + 13, y1 + 3];
  if (clap > 0) {
    // clapping at chin height: the hands fly apart and smack together
    const s = Math.abs(Math.sin(t * 16));
    L = mix2(L, [cx - 5 - 9 * s, y1 - 34 - hop], clap);
    R = mix2(R, [cx + 5 + 9 * s, y1 - 34 - hop], clap);
  }
  if (wave > 0) R = mix2(R, [cx + 22 + 5 * Math.sin((t - T.kidWave) * 14), y1 - 44 - hop], wave);
  if (wave2 > 0) R = mix2(R, [cx + 25 + 9 * Math.sin((t - T.kidWave2) * 13), y1 - 58 - hop], wave2);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0 - 30, y0 - 20, w + 60, y1 + 12 - (y0 - 20));
  ctx.clip();
  const big = Math.max(clap, wave2);
  softArm(ctx, [cx - 17, y1 - 6 + dy - hop], L, -1, '#e9eef6', '#f0c09a', 8 + 2.5 * big);
  softArm(ctx, [cx + 17, y1 - 6 + dy - hop], R, 1, '#e9eef6', '#f0c09a', 8 + 2.5 * big);
  ctx.restore();
}

// ——— the seller ———

const sc = (v) => [v[0] * SK, v[1] * SK];
// hand targets, relative to his hips as the rig takes them
const TRAY_NEAR = sc([36, -191]), REST_FAR = sc([6, 12]), TRAY_FAR = [-70, -151];
const CHEST = sc([36, -90]), APRON = [20, 6];
const TAKE = sc([44, -196]), THROW = sc([82, -62]);
const TAKE_DUR = 0.5, BACK_DUR = 0.25;

/** A simit tray, balanced on the head: a round board piled with rings, still warm. */
function tray(ctx, x, y, count, t, drift) {
  ctx.fillStyle = '#6b4a34';
  ctx.beginPath();
  ctx.ellipse(x, y, 86, 11, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#8a6344';
  ctx.beginPath();
  ctx.ellipse(x, y - 4, 84, 9, 0, 0, TAU);
  ctx.fill();
  const spots = [];
  for (let row = 0; row < 3; row++) {
    const n = 6 - row * 2;
    for (let i = 0; i < n; i++) spots.push([x + (i - (n - 1) / 2) * 26, y - 12 - row * 13, row * 10 + i]);
  }
  spots.slice(0, count).forEach(([sx, sy, k]) => simit(ctx, sx, sy, 17, 0.1 * Math.sin(k), 0.38, k + 3));
  // fresh from the oven: soft breaths of steam in the cool morning, trailing as he walks
  ctx.lineCap = 'round';
  ctx.lineWidth = 5;
  for (let k = 0; k < 3; k++) {
    const p = (t * 0.3 + k / 3 + 0.17 * k) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${0.14 * Math.sin(p * Math.PI)})`;
    ctx.beginPath();
    for (let i = 0; i <= 10; i++) {
      const u = p + i * 0.05;
      const yy = y - 26 - (k === 1 ? 12 : 0) - u * 46;
      const xx = x + (k - 1) * 34 + 3.5 * Math.sin(i * 0.4 + t * 1.4 + k * 2) - drift * u * 40;
      i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
    }
    ctx.stroke();
  }
}

/** Facing direction: he pivots through a narrow profile rather than flipping in one frame. */
function turnDir(t) {
  const a = seg(t, T.turn - 0.1, T.turn + 0.1), b = seg(t, T.turnBack - 0.1, T.turnBack + 0.1);
  const c = a < 1 ? Math.cos(Math.PI * a) : -Math.cos(Math.PI * b);
  return (c >= 0 ? 1 : -1) * Math.max(0.15, Math.abs(c));
}

/** His head in his own frame (x forward, y up from the ground), mirroring the rig in kit.js. */
function headFrame(lean, look, phase) {
  const h = SELLER_H;
  const hipY = -h * 0.5 - h * 0.01 * Math.cos(phase * 2);
  const shx = Math.sin(lean) * h * 0.32, shy = hipY - Math.cos(lean) * h * 0.32;
  const cx = shx + Math.sin(lean) * h * 0.04 + h * 0.012, cy = shy - Math.cos(lean) * h * 0.04 - h * 0.062;
  const th = lean * 0.4 - look * 0.25, r = h * 0.074;
  // a point given in head radii, in his frame
  const at = (px, py) => [cx + (px * Math.cos(th) - py * Math.sin(th)) * r, cy + (px * Math.sin(th) + py * Math.cos(th)) * r];
  return { hipY, shx, shy, cx, cy, th, r, at };
}

/** Where the rig really puts a hand: it clamps the target to the arm's reach. */
function handAt(P, target, isFar = false) {
  const h = SELLER_H, F = headFrame(P.lean, P.look, P.phase);
  const s0 = [F.shx + (isFar ? -h * 0.01 : h * 0.01), F.shy + h * 0.02];
  const hand = reach(s0, [target[0], F.hipY + target[1]], h * 0.36);
  return [P.x + P.dir * hand[0], LANE + hand[1]];
}

function sellerPose(t) {
  const x = sellerX(t), phase = walkPhase(x);
  const go = Math.min(1, Math.abs(sellerSpeed(t)) / SPEED);
  const dir = turnDir(t);
  const hipY = -SELLER_H * 0.5 - SELLER_H * 0.01 * Math.cos(phase * 2);
  let near = TRAY_NEAR;
  // the free arm swings with the opposite leg, and settles at his side as he slows
  let far = mix2(REST_FAR, [Math.cos(phase) * 28 * SK, -8 * SK], go);
  // thank you: a hand on the heart and a little bow
  const bw = fade(t, T.bow, T.heart + 0.5, 0.35, 0.35);
  const lean = 0.1 * bw * (0.7 + 0.3 * Math.sin(Math.PI * seg(t, T.bow, T.heart + 0.5)));
  // under the window he looks up at her; the tray stays balanced on his cap
  let look = 0.8 * fade(t, T.call2, T.heart + 0.5, 0.3, 0.4);
  // the cries: head tipped back, mouth wide, a hand cupped beside it and the other steadying the tray
  let call = 0, up = 0;
  for (const [c0, c1, u] of CALLS) {
    const k = fade(t, c0, c1, 0.22, 0.25);
    if (k > call) [call, up] = [k, u];
  }
  if (call > 0) {
    look += (up ? 0.15 : 0.3) * call;
    const F = headFrame(lean, look, phase);
    const cup = F.at(1.9, 0.55);
    near = mix2(near, [cup[0], cup[1] - hipY], call);
    far = mix2(far, TRAY_FAR, call);
  }
  const B = basketAt(t);
  const intoBasket = B ? [(B.x - x) * dir - 4, B.y - 15 * BS - (LANE + hipY)] : null;
  // first the coins out of the basket and into his apron…
  const ck = seg(t, T.coins, T.coins + 0.6);
  if (ck > 0 && ck < 1 && intoBasket) {
    const inB = [intoBasket[0] + 2, intoBasket[1] + 6];
    if (ck < 0.35) near = mix2(TRAY_NEAR, inB, smooth(ck / 0.35));
    else if (ck < 0.5) near = inB;
    else if (ck < 0.8) near = mix2(inB, APRON, smooth((ck - 0.5) / 0.3));
    else near = mix2(APRON, TRAY_NEAR, smooth((ck - 0.8) / 0.2));
  }
  // …then two simits off the tray and into it
  for (const t0 of [T.take1, T.take2]) {
    const k = seg(t, t0, t0 + TAKE_DUR), back = seg(t, t0 + TAKE_DUR, t0 + TAKE_DUR + BACK_DUR);
    if (k > 0 && back < 1 && intoBasket) {
      if (k < 1) near = k < 0.35 ? mix2(TRAY_NEAR, TAKE, smooth(k / 0.35)) : mix2(TAKE, intoBasket, smooth((k - 0.35) / 0.65));
      else near = mix2(intoBasket, TRAY_NEAR, smooth(back));
    }
  }
  for (const [a, b] of [[T.coins - 0.1, T.coins + 0.7], [T.take1 - 0.1, T.take2 + TAKE_DUR + 0.2]]) look = lerp(look, 0.15, Math.sin(Math.PI * seg(t, a, b)));
  near = mix2(near, [CHEST[0] + Math.sin(lean) * 90 * SK, CHEST[1]], bw);
  // a piece each for the cats
  const turned = fade(t, T.turn - 0.1, T.turnBack + 0.1, 0.2, 0.2);
  if (turned > 0) {
    look = lerp(look, -0.15, turned);
    for (const ts of [T.toss1, T.toss2]) {
      const a = seg(t, ts - 0.4, ts - 0.12), b = seg(t, ts - 0.12, ts + 0.06), c = seg(t, ts + 0.06, ts + 0.4);
      if (a > 0 && c < 1) {
        if (a < 1) near = mix2(TRAY_NEAR, TAKE, smooth(a));
        else if (b < 1) near = mix2(TAKE, THROW, easeOut(b));
        else near = mix2(THROW, TRAY_NEAR, smooth(c));
      }
    }
  }
  if (near === TRAY_NEAR) near = [TRAY_NEAR[0] + Math.sin(lean) * SELLER_H * 0.36, TRAY_NEAR[1]];
  const count = 11 - (t > T.take1 + 0.17 ? 1 : 0) - (t > T.take2 + 0.17 ? 1 : 0) - (t > T.toss1 - 0.3 ? 1 : 0);
  return { x, go, phase, dir, lean, look, near, far, call, up, count, smile: t > T.open && t < T.leave + 2.5 };
}

/** Where his head, open mouth and tray are. */
function headGeo(P) {
  const F = headFrame(P.lean, P.look, P.phase);
  const m = F.at(0.8, 0.85);
  return { F, mx: P.x + P.dir * m[0], my: LANE + m[1], trayX: P.x + P.dir * (F.cx + 2), trayY: LANE + F.cy - 26 };
}

const LAND = [[705, LANE + 3], [575, LANE + 5]];

/** A torn half of a simit. */
function piece(ctx, x, y, r, rot, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = '#b8692c';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0.3, Math.PI * 1.3);
  ctx.arc(0, 0, r * 0.42, Math.PI * 1.3, 0.3, true);
  ctx.fill();
  ctx.fillStyle = '#f7e4b3';
  for (let i = 0; i < 6; i++) {
    const a = 0.5 + i * 0.4;
    disc(ctx, Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72, r * 0.08, '#f7e4b3');
  }
  ctx.restore();
}

/** Two small coins, the price of two simits. */
function coins(ctx, x, y, s = 1) {
  for (const [dx, dy] of [[-4, 0], [4, -2]]) {
    disc(ctx, x + dx * s, y + dy * s, 4.2 * s, '#b8862c');
    disc(ctx, x + dx * s - 0.4, y + dy * s - 0.5, 3.2 * s, '#f0c85a');
    disc(ctx, x + dx * s - 1.4 * s, y + dy * s - 1.4 * s, 1 * s, 'rgba(255,255,240,0.9)');
  }
}

/** The open mouth of the cry, drawn over the rig's head. */
function openMouth(ctx, P, G, skin) {
  const F = G.F, r = F.r, k = P.call;
  ctx.save();
  ctx.translate(P.x + P.dir * F.cx, LANE + F.cy);
  ctx.scale(P.dir, 1);
  ctx.rotate(F.th);
  disc(ctx, 0.45 * r, (0.72 + 0.2 * k) * r, (0.16 + 0.18 * k) * r, skin); // the jaw drops
  ctx.fillStyle = '#5a2226';
  ctx.beginPath();
  ctx.ellipse(0.74 * r, (0.8 + 0.08 * k) * r, (0.06 + 0.14 * k) * r, (0.05 + 0.17 * k) * r, 0.35, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c85a5a';
  ctx.beginPath();
  ctx.ellipse(0.72 * r, (0.88 + 0.14 * k) * r, 0.1 * r, 0.06 * r * k, 0.35, 0, TAU);
  ctx.fill();
  ctx.restore();
  // the near hand, cupped beside the mouth: it opens into a flat palm on the way up
  {
    const [hx, hy] = handAt(P, P.near);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.scale(P.dir, 1);
    ctx.rotate(F.th - 0.25);
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(0, -1, 0.2 * r, lerp(0.24, 0.44, smooth(k)) * r, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = smooth(k);
    ctx.strokeStyle = 'rgba(120,60,40,0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-0.08 * r, -0.36 * r);
    ctx.quadraticCurveTo(-0.16 * r, 0, -0.06 * r, 0.3 * r);
    ctx.stroke();
    ctx.restore();
  }
}

const SELLER_COLORS = { shirt: '#f4efe4', vest: '#7c2f33', pants: '#4b4a52', shoes: '#2a2224', skin: '#d9a07c', hair: '#2e2521', hat: 'cap', capColor: '#4f4a4a', apron: '#f7f3ea' };

function seller(ctx, t) {
  const P = sellerPose(t);
  const G = headGeo(P);
  // a long morning shadow
  ctx.fillStyle = 'rgba(60,40,60,0.2)';
  ctx.beginPath();
  ctx.ellipse(P.x - 26, LANE + 3, 78, 8, 0, 0, TAU);
  ctx.fill();
  tray(ctx, G.trayX, G.trayY, P.count, t, P.go * (P.dir > 0 ? 1 : -1));
  person(ctx, P.x, LANE, SELLER_H, {
    phase: P.phase, dir: P.dir, lean: P.lean, look: P.look, mustache: true, smile: P.smile && P.call < 0.3,
    colors: SELLER_COLORS,
    hands: [P.near, P.far],
  });
  if (P.call > 0.05) openMouth(ctx, P, G, SELLER_COLORS.skin);
  // the coins, from the basket to his apron pocket
  const ck = seg(t, T.coins, T.coins + 0.6);
  if (ck > 0.35 && ck < 0.78) {
    const [hx, hy] = handAt(P, P.near);
    coins(ctx, hx + 1, hy - 3, 0.9);
  }
  // a simit in his hand on its way to the basket
  for (const t0 of [T.take1, T.take2]) {
    const k = seg(t, t0, t0 + TAKE_DUR);
    if (k > 0.3 && k < 1) {
      const [hx, hy] = handAt(P, P.near);
      simit(ctx, hx + 2, hy - 6, 15, k * 2, lerp(0.5, 0.8, k), 7);
    }
  }
  // the pieces: torn off in his hand with a puff of crumbs, in the air, on the ground being eaten
  [T.toss1, T.toss2].forEach((ts, i) => {
    const land = i ? T.land2 : T.land1;
    if (t > ts - 0.28 && t <= ts) {
      const [hx, hy] = handAt(P, P.near);
      piece(ctx, hx, hy - 4, 11, 2.2);
    } else if (t > ts && t < land + 2.1) {
      const P0 = sellerPose(ts);
      const [fx, fy] = handAt(P0, P0.near);
      const [lx, ly] = LAND[i];
      const k = seg(t, ts, land);
      const eaten = seg(t, land + 0.45, land + 1.9);
      const x = lerp(fx, lx, k), y = lerp(fy - 4, ly - 6, k * k) - Math.sin(k * Math.PI) * 70;
      piece(ctx, x, y, 11 * (1 - 0.65 * eaten), k < 1 ? k * 9 : 9, 1 - smooth(seg(t, land + 1.8, land + 2.1)));
    }
    const u = t - (ts - 0.3);
    if (u > 0 && u < 0.7) {
      const P0 = sellerPose(ts - 0.3);
      const [cx0, cy0] = handAt(P0, P0.near);
      for (let j = 0; j < 7; j++) {
        const vx = (hash(j, 60 + i) - 0.5) * 70, vy = -40 - 50 * hash(j, 62 + i);
        const cy = Math.min(LANE - 1, cy0 + vy * u + 520 * u * u);
        disc(ctx, cx0 + vx * u, cy, j % 3 ? 1.6 : 2.4, j % 3 ? `rgba(247,228,179,${1 - u / 0.7})` : `rgba(184,105,44,${1 - u / 0.7})`);
      }
    }
  });
}

// ——— the cats ———

const GINGER_PLAIN = { ...CATS.ginger, stripes: false };

/** Tabby bands on the sitting ginger: a swirl on the haunch, a band at the shoulder, the M on the brow. */
function gingerBands(ctx, x, y, s, look) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = CATS.ginger.dark;
  ctx.lineCap = 'round';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(-3, -12, 7.5, Math.PI * 1.02, Math.PI * 1.5);
  ctx.moveTo(-3 - 12 * Math.cos(0.25), -12 - 12 * Math.sin(0.25));
  ctx.arc(-3, -12, 12, Math.PI + 0.25, Math.PI * 1.42);
  ctx.moveTo(-1, -33);
  ctx.quadraticCurveTo(3, -31, 3, -26);
  ctx.stroke();
  ctx.translate(12, -46);
  ctx.rotate(-look * 0.35);
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const [a, b, c, d] of [[-5, -8, -3.4, -4.6], [-0.6, -10, 0.2, -6.2], [3.8, -9.6, 3.4, -6.2]]) {
    ctx.moveTo(a, b);
    ctx.lineTo(c, d);
  }
  ctx.stroke();
  ctx.restore();
}

function cats(ctx, t) {
  // the grey one dozes on the step of the blue house all morning; the others pass in front of it
  cat(ctx, 405, GY - 8, 1.2, { pose: 'loaf', coat: 'grey', t, seed: 3, blink: true });
  // the ginger and the tuxedo trail the seller, sit when he stops, then get a piece each
  const lead = START_X + SPEED * (t - T.enter);
  const trail = [
    { coat: 'ginger', gap: 190, sitX: STOP_X - 170, s: 1.35, seed: 1, eatX: LAND[0][0] - 38, land: T.land1, go: T.leave + 0.9 },
    { coat: 'tuxedo', gap: 300, sitX: STOP_X - 300, s: 1.3, seed: 2, eatX: LAND[1][0] - 36, land: T.land2, go: T.leave + 1.25 },
  ];
  const upLook = 0.3 + 0.7 * fade(t, T.lower, T.raised + 0.5, 0.4, 0.4);
  // the rig lifts a paw on its way back as the phase grows, so walking forward runs it down
  const gait = (x, s) => -(x / (20 * s)) * Math.PI;
  trail.forEach((c, i) => {
    let x, pose = 'sit', phase = 0, look = upLook, chew = 0;
    if (t < c.land - 0.3) {
      x = Math.min(lead - c.gap, c.sitX);
      if (lead - c.gap < c.sitX) {
        pose = 'walk';
        phase = gait(x, c.s);
      }
      if (t > T.turn) look = -0.1;
    } else if (t < c.go) {
      const k = smooth(seg(t, c.land - 0.3, c.land + 0.15));
      x = lerp(c.sitX, c.eatX, k);
      if (k < 1) {
        pose = 'walk';
        phase = gait(x, c.s);
      } else if (t < c.land + 1.9) {
        pose = 'crouch';
        chew = t;
      } else look = 0.1;
    } else {
      x = c.eatX + 150 * (t - c.go);
      pose = 'walk';
      phase = gait(x, c.s);
    }
    ctx.fillStyle = 'rgba(60,40,60,0.17)';
    ctx.beginPath();
    ctx.ellipse(x - 14 * c.s, LANE + 3, 44 * c.s, 5.5, 0, 0, TAU);
    ctx.fill();
    const plain = c.coat === 'ginger' && pose === 'sit';
    cat(ctx, x, LANE, c.s, { pose, coat: plain ? GINGER_PLAIN : c.coat, phase, t, dir: 1, look, chew, seed: c.seed, blink: Math.sin(t * 0.8 + i * 3) > 0.97 });
    if (plain) gingerBands(ctx, x, LANE, c.s, look);
  });
}

// ——— the street dog, asleep in the sun ———

function dog(ctx, x, y, s, P) {
  const fur = '#dcb27c', dark = '#b98c56', light = '#f2ddb6';
  const t = P.t, up = P.up, th = P.thump, breathe = 1 + 0.04 * Math.sin(t * 1.5) * (1 - up * 0.5);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * P.dir, s);
  ctx.lineCap = 'round';
  // tail, thumping the cobbles
  ctx.strokeStyle = fur;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-44, -12);
  ctx.quadraticCurveTo(-62, -8 - 10 * th, -80, -4 - 20 * th);
  ctx.stroke();
  // body, breathing
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(-4, -17 * breathe, 47, 17 * breathe, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.ellipse(6, -6, 36, 6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = css(mixRgb(fur, [150, 100, 60], 0.18));
  ctx.beginPath();
  ctx.ellipse(-30, -18, 19, 15, -0.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.ellipse(-12, -3.5, 13, 4.5, 0, 0, TAU);
  ctx.fill();
  // front legs stretched out
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.roundRect(22, -10, 46, 10, 5);
  ctx.fill();
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.ellipse(66, -4.5, 8, 4.5, 0, 0, TAU);
  ctx.fill();
  // neck and head: chin on the paws, or lifted to watch
  const hx = lerp(60, 48, up), hy = lerp(-17, -46, up), rot = lerp(0.18, -0.12, up);
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.moveTo(18, -32 * breathe);
  ctx.lineTo(hx - 6, hy - 11);
  ctx.lineTo(hx + 4, hy + 10);
  ctx.lineTo(34, -6);
  ctx.fill();
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(rot);
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 12.5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.ellipse(14, 4, 11, 7, 0.05, 0, TAU);
  ctx.fill();
  disc(ctx, 24, 1.5, 3.4, '#2a1f1c');
  // floppy ear with the yellow municipal tag; it twitches at the seller's cry
  ctx.save();
  ctx.translate(-4, -9);
  ctx.rotate(-0.5 * P.ear);
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(-2, -2);
  ctx.quadraticCurveTo(-14, -2, -12, 16);
  ctx.lineTo(0, 8);
  ctx.fill();
  ctx.fillStyle = '#f2c230';
  ctx.fillRect(-11, 7, 6, 5);
  ctx.restore();
  if (up > 0.45) {
    disc(ctx, 6, -3, 2.3, '#2a1f1c');
    disc(ctx, 6.7, -3.8, 0.7, '#fff');
  } else {
    ctx.strokeStyle = '#2a1f1c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(6, -4, 2.6, 0.3, Math.PI - 0.3);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

const DOG_X = 1100, DOG_Y = GY + 98;
function streetDog(ctx, t) {
  const up = fade(t, T.dogUp, T.dogUp + 1.6, 0.3, 0.45);
  const thump = [21.95, 22.2, 22.45].reduce((m, t0) => Math.max(m, Math.sin(Math.PI * seg(t, t0, t0 + 0.22))), 0);
  const ear = Math.sin(Math.PI * seg(t, T.call1 + 0.3, T.call1 + 0.75)) + Math.sin(Math.PI * seg(t, T.callA + 0.2, T.callA + 0.6));
  ctx.fillStyle = 'rgba(60,40,60,0.18)';
  ctx.beginPath();
  ctx.ellipse(DOG_X + 10, DOG_Y + 3, 88, 8, 0, 0, TAU);
  ctx.fill();
  dog(ctx, DOG_X, DOG_Y, 1.15, { dir: -1, t, up, thump, ear });
}

// ——— pigeons ———

function pigeon(ctx, x, y, s, P) {
  const body = '#9aa1b5', wing = '#b7bccb', ink = '#50566a';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * P.dir, s);
  ctx.lineCap = 'round';
  if (!P.fly) {
    const peck = P.peck ?? 0, bob = P.bob ?? 0;
    ctx.strokeStyle = '#cf625a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, -6);
    ctx.lineTo(-3, 0);
    ctx.moveTo(3, -6);
    ctx.lineTo(4, 0);
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(-9, -12);
    ctx.lineTo(-24, -11 + 3 * peck);
    ctx.lineTo(-23, -16 + 3 * peck);
    ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, -12, 14, 8.5, -0.1 + 0.2 * peck, 0, TAU);
    ctx.fill();
    ctx.fillStyle = wing;
    ctx.beginPath();
    ctx.ellipse(-3, -13, 10, 5.5, -0.18 + 0.2 * peck, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-5, -16);
    ctx.lineTo(-7, -10);
    ctx.moveTo(-9, -15);
    ctx.lineTo(-11, -10);
    ctx.stroke();
    const hx = 11 + bob + 6 * peck, hy = -21 + 16 * peck;
    ctx.strokeStyle = '#6e9488';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(6, -14);
    ctx.lineTo(hx - 1, hy + 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(160,110,170,0.75)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(5, -12);
    ctx.lineTo(hx - 2, hy + 4);
    ctx.stroke();
    disc(ctx, hx, hy, 4.9, '#868ca3');
    ctx.fillStyle = '#3a3438';
    ctx.beginPath();
    ctx.moveTo(hx + 3.5, hy - 0.8);
    ctx.lineTo(hx + 9, hy + 1 + peck);
    ctx.lineTo(hx + 3.5, hy + 1.8);
    ctx.fill();
    disc(ctx, hx + 4.2, hy - 0.8, 1.1, '#f0ece6');
    disc(ctx, hx + 1, hy - 1.3, 1.4, '#e8872a');
    disc(ctx, hx + 1, hy - 1.3, 0.6, '#111');
  } else {
    const f = P.flap;
    ctx.rotate(P.pitch ?? 0);
    const wingPath = (amp, col) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(8, -13);
      ctx.lineTo(-6, -13);
      ctx.lineTo(-11, -13 - 26 * f * amp);
      ctx.lineTo(1, -13 - 28 * f * amp);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(-11, -13 - 26 * f * amp);
      ctx.lineTo(1, -13 - 28 * f * amp);
      ctx.lineTo(0, -13 - 22 * f * amp);
      ctx.lineTo(-10, -13 - 20 * f * amp);
      ctx.fill();
    };
    wingPath(0.8, '#8a90a4');
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(-9, -12);
    ctx.lineTo(-25, -7);
    ctx.lineTo(-25, -17);
    ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, -12, 14, 7, 0, 0, TAU);
    ctx.fill();
    disc(ctx, 12, -16, 4.6, '#868ca3');
    ctx.fillStyle = '#3a3438';
    ctx.beginPath();
    ctx.moveTo(15.5, -16.5);
    ctx.lineTo(20, -15);
    ctx.lineTo(15.5, -14);
    ctx.fill();
    wingPath(1, wing);
  }
  ctx.restore();
}

const PIGEONS = [
  { x: 292, y: 46, dir: 1, fd: 1 }, { x: 352, y: 74, dir: -1, fd: 1 }, { x: 414, y: 54, dir: 1, fd: 1 },
  { x: 482, y: 80, dir: -1, fd: 1 }, { x: 548, y: 50, dir: 1, fd: 1 }, { x: 606, y: 68, dir: -1, fd: 1 },
];
const LANDERS = [{ x: 440, y: 54, tl: 22.1 }, { x: 512, y: 76, tl: 22.3 }, { x: 580, y: 50, tl: 22.55 }];
const takeoff = (p, i) => T.enter + (p.x - 150 - 50 * hash(i, 5) - START_X) / SPEED;
const shuffle = (p, i, t) => p.x + 9 * noise(t * 0.45, 30 + i);

function groundPigeon(ctx, x, y, dir, t, i) {
  const cyc = (t * 0.8 + hash(i, 6)) % 1;
  const peck = cyc < 0.24 ? Math.sin((cyc / 0.24) * Math.PI) : 0;
  ctx.fillStyle = 'rgba(50,40,60,0.18)';
  ctx.beginPath();
  ctx.ellipse(x - 4, y + 1, 16, 3, 0, 0, TAU);
  ctx.fill();
  pigeon(ctx, x, y, 1.15, { dir, peck, bob: 2 * Math.sin(t * 6 + i) });
}

function pigeons(ctx, t) {
  PIGEONS.forEach((p, i) => {
    const tk = takeoff(p, i), u = t - tk;
    const y0 = GY + p.y;
    if (u < 0) return groundPigeon(ctx, shuffle(p, i, t), y0, p.dir, t, i);
    if (u > 2.2) return;
    const x0 = shuffle(p, i, tk);
    const sx = 0.6 + 0.8 * hash(i, 7), sy = 0.85 + 0.3 * hash(i, 8);
    const x = x0 + p.fd * (60 * u + 170 * u * u) * sx, y = y0 - (160 * u + 320 * u * u) * sy + 6 * Math.sin(u * 30);
    pigeon(ctx, x, y, 1.15, { dir: p.fd, fly: true, flap: Math.sin(u * 30 + i), pitch: -0.45 + 0.25 * Math.min(1, u) });
  });
  LANDERS.forEach((p, i) => {
    const u = p.tl - t;
    if (u > 1.6) return;
    if (u <= 0) return groundPigeon(ctx, p.x + 6 * noise(t * 0.5, 50 + i), GY + p.y, 1, t, 10 + i);
    const x = p.x - (60 * u + 110 * u * u), y = GY + p.y - (40 * u + 330 * u * u);
    const flare = 1 - smooth(seg(u, 0, 0.35));
    const flap = lerp(0.35 * Math.sin(u * 9 + i), Math.sin(u * 44), flare);
    pigeon(ctx, x, y, 1.15, { dir: 1, fly: true, flap, pitch: lerp(0.25, -0.35, flare) });
  });
}

// ——— the cry, drawn as rings of sound ———

function rings(ctx, t) {
  for (const [c0, c1, up] of CALLS) {
    if (t < c0 + 0.15 || t > c1 + 1.2) continue;
    const P = sellerPose(t), G = headGeo(P);
    const ox = G.mx, oy = G.my;
    // they start just past the cupped hand; the call up to the window is three bold rings
    // that reach her sill just as it rattles open
    let ang, r0, r1, n, gap, life, start, spread;
    if (up) {
      const tx = WIN.cx + 12, ty = WIN.y1 - 6;
      ang = Math.atan2(ty - oy, tx - ox);
      r0 = 42;
      r1 = Math.hypot(tx - ox, ty - oy) - 20 - r0;
      [n, gap, life, start, spread] = [3, 0.13, 0.55, 0.18, 0.3];
    } else {
      ang = P.dir > 0 ? 0.4 * G.F.th - 0.04 : Math.PI - 0.4 * G.F.th + 0.04;
      [r0, r1, n, gap, life, start, spread] = [40, 120, 4, 0.17, 0.8, 0.24, 0.34];
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const p = (t - (c0 + start + i * gap)) / life;
      if (p <= 0 || p >= 1) continue;
      const r = r0 + r1 * p;
      const a = up ? Math.min(1, p * 6) * (1 - smooth(seg(p, 0.72, 1))) : Math.min(1, p * 7) * (1 - p) ** 1.1;
      const sp = spread + 0.08 * p;
      ctx.beginPath();
      ctx.arc(ox, oy, r, ang - sp, ang + sp);
      ctx.strokeStyle = `rgba(110,60,45,${(up ? 0.5 : 0.4) * a})`;
      ctx.lineWidth = up ? 14 : 11 - 4 * p;
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,250,236,${a})`;
      ctx.lineWidth = up ? 9 : 6.5 - 2.5 * p;
      ctx.stroke();
    }
  }
}

// ——— the frame ———

export function draw(ctx, t) {
  const cam = camera(t);
  const g = ctx.createLinearGradient(0, 0, 0, 560);
  g.addColorStop(0, '#8fbfe6');
  g.addColorStop(0.6, '#dce6ee');
  g.addColorStop(1, '#f8e6cf');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 1720, 50, 820, [255, 226, 170], 0.42);
  ctx.restore();

  const layer = (depth, fn) => {
    ctx.save();
    const z = 1 + (cam.z - 1) * depth;
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-(W / 2 + (cam.x - W / 2) * depth), -(H / 2 + (cam.y - H / 2) * depth));
    fn();
    ctx.restore();
  };
  layer(0.08, () => clouds(ctx, t));
  layer(0.18, () => farHill(ctx));
  layer(0.3, () => skyGulls(ctx, t));
  layer(0.5, () => backRow(ctx));
  layer(1, () => {
    for (const h0 of HOUSES) house(ctx, h0);
    kilim(ctx, t);
    laundry(ctx, t);
    asma(ctx, t);
    nazar(ctx, t);
    // a cat dozing on the window ledge of the blue house
    cat(ctx, CALICO.x, CALICO.y, 0.95, { pose: 'loaf', coat: 'calico', t, blink: Math.sin(t * 0.5) > 0.9 });
    teyzeWindow(ctx, t);
    kidWindow(ctx, t);
    street(ctx);
    pots(ctx, t);
    stoolTea(ctx, t);
    cats(ctx, t);
    seller(ctx, t);
    rings(ctx, t);
    streetDog(ctx, t);
    pigeons(ctx, t);
  });
  sunlight(ctx, t);
  vignette(ctx, W, H, 0.28);
  grain(ctx, W, H, t, 0.05);
  // up from black, and back to black as he goes on his way
  const black = Math.max(1 - smooth(seg(t, 0, 0.9)), smooth(seg(t, T.fadeOut, T.end)));
  if (black > 0) {
    ctx.fillStyle = `rgba(20,14,13,${black})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// ——— the sound: Rast on G, a light darbuka, and the seller's cry on a ney ———

const G4 = 67;
const rast = (d) => makamHz('rast', G4, d);
const EIGHTH = 60 / 104 / 2;

const ud = (S, t, d, o = {}) => S.pluck(t, rast(d), { wave: 'sawtooth', bend: 25, bright: 3.5, dur: 1.2, vel: 0.09, pan: 0.1, ...o });
function tune(S, t0, notes, o = {}) {
  let t = t0;
  for (const [d, len] of notes) {
    if (d !== null) ud(S, t, d, o);
    t += len * EIGHTH;
  }
}
function darbuka(S, t0, t1, vel = 1) {
  // düm . tek tek | düm düm tek .
  const pattern = [[0, 'd'], [1.5, 't'], [2, 't'], [4, 'd'], [5, 'd'], [6, 't'], [7, 'k']];
  for (let bar = t0; bar < t1 - 0.01; bar += EIGHTH * 8) {
    for (const [e, kind] of pattern) {
      const t = bar + e * EIGHTH;
      if (t >= t1) continue;
      if (kind === 'd') {
        // the düm: a rounder, lighter body, and a skin slap that still carries on a phone speaker
        S.thump(t, { f0: 150, f1: 80, dur: 0.26, vel: 0.12 * vel });
        S.noise(t, { dur: 0.03, type: 'bandpass', f0: 400, q: 1.1, vel: 0.05 * vel, attack: 0.002, release: 0.024, send: 0.12 });
      } else S.noise(t, { dur: 0.06, type: 'bandpass', f0: kind === 't' ? 3200 : 2600, q: 1.3, vel: (kind === 't' ? 0.06 : 0.035) * vel, attack: 0.002, release: 0.05, send: 0.15 });
    }
  }
}

/** "Si-miiit!": a pickup, a long reach up to the fourth, and a fall onto the segâh. */
function cry(S, t, o = {}) {
  const v = o.vel ?? 0.06, pan = o.pan ?? 0, send = o.send ?? 0.45;
  S.ney(t, rast(0), { dur: 0.13, vel: v * 0.75, slide: 60, attack: 0.04, release: 0.08, pan, send });
  S.ney(t + 0.17, rast(3), { dur: 0.52, vel: v, slide: 110, attack: 0.07, release: 0.12, pan, send });
  S.ney(t + 0.74, rast(2), { dur: 0.22, vel: v * 0.7, slide: -70, attack: 0.03, release: 0.2, pan, send });
  S.pluck(t, rast(0), { wave: 'sawtooth', bend: 40, bright: 3, dur: 0.4, vel: v * 0.3, pan, send: 0.3 });
  S.pluck(t + 0.17, rast(3), { wave: 'sawtooth', bend: 60, bright: 3, dur: 0.8, vel: v * 0.35, pan, send: 0.3 });
}
const flutter = (S, t, pan, vel = 0.08) =>
  S.noise(t, { dur: 0.5, type: 'bandpass', f0: 1300, f1: 800, q: 0.8, vel, attack: 0.015, release: 0.3, lfo: [14 + 4 * hash(Math.round(t * 100), 3), 0.9], send: 0.18, pan });
const coo = (S, t, pan) => {
  S.ney(t, 410, { dur: 0.1, vel: 0.016, slide: -150, vib: 8, attack: 0.03, release: 0.08, send: 0.2, pan });
  S.ney(t + 0.2, 440, { dur: 0.32, vel: 0.02, slide: -260, vib: 7, attack: 0.05, release: 0.14, send: 0.2, pan });
};
const creak = (S, t, pan = 0.15) => S.gull(t, { f: 380, dur: 0.42, vel: 0.016, pan, send: 0.2 });
const latch = (S, t, pan = 0.15) => S.noise(t, { dur: 0.07, type: 'bandpass', f0: 2400, q: 2, vel: 0.02, attack: 0.002, release: 0.04, send: 0.1, pan });
const panOf = (x) => Math.max(-0.8, Math.min(0.8, (x - 860) / 900));
/** Cats, voiced on the ney: a falling "mi-aow", and a rising trill of thanks. */
const mew = (S, t, pan, f = 700, vel = 0.018) => {
  S.ney(t, f, { dur: 0.16, slide: -400, vib: 0.1, attack: 0.02, release: 0.08, vel, send: 0.25, pan });
  S.ney(t + 0.15, f * 0.8, { dur: 0.14, slide: 200, vib: 0.1, attack: 0.02, release: 0.1, vel: vel * 0.8, send: 0.25, pan });
};
const mrrp = (S, t, pan, f = 520) => {
  S.ney(t, f, { dur: 0.08, slide: 300, vib: 0.1, attack: 0.015, release: 0.05, vel: 0.013, send: 0.2, pan });
  S.ney(t + 0.08, f * 1.26, { dur: 0.14, slide: 260, vib: 0.1, attack: 0.02, release: 0.09, vel: 0.016, send: 0.2, pan });
};
const tick = (S, t, f, vel, pan) => S.noise(t, { dur: 0.035, type: 'bandpass', f0: f, q: 1.2, vel, attack: 0.002, release: 0.028, send: 0.1, pan });
const scuff = (S, t, pan) => S.noise(t, { dur: 0.18, type: 'bandpass', f0: 900, f1: 480, q: 0.9, vel: 0.016, attack: 0.03, release: 0.12, send: 0.08, pan });

export function score(S) {
  // the street waking up: a ferry on the Golden Horn, gulls, sparrows, pigeons
  S.noise(0, { dur: 24, type: 'bandpass', f0: 600, q: 0.3, vel: 0.018, attack: 2, release: 2.2, lfo: [0.1, 0.5], send: 0.1 });
  S.horn(0.5, { f: 98, dur: 1.7, vel: 0.05, cutoff: 360, send: 0.9, pan: 0.35 });
  // and a church bell across the hill in Fener
  S.bell(0.3, rast(-3), { vel: 0.02, dur: 3.6, pan: -0.6, send: 0.9 });
  S.bell(2.45, rast(-3), { vel: 0.016, dur: 3.6, pan: -0.6, send: 0.9 });
  S.gull(0.25, { f: 1550, dur: 0.45, vel: 0.011, pan: 0.5 });
  S.gull(2.3, { f: 1720, dur: 0.38, vel: 0.008, pan: 0.6 });
  const birds = [0.8, 0.95, 2.0, 2.12, 4.1, 7.3, 7.42, 9.8, 12.6, 12.7, 18.9, 19.05, 22.3];
  birds.forEach((t, i) => S.chirp(t, { f0: 3400 + 500 * hash(i, 1), f1: 4600 + 400 * hash(i, 2), dur: 0.06, vel: 0.012, pan: (hash(i, 3) - 0.5) * 1.4 }));
  coo(S, 0.9, -0.3);
  coo(S, 3.7, -0.45);
  S.pad(0, [rast(-14), rast(-10), rast(-7)], { dur: 21.4, vel: 0.027, attack: 2.5, release: 2, cutoff: 500 });

  // the cry from round the corner, and a window flies open upstairs
  cry(S, T.callA, { vel: 0.04, pan: -0.75, send: 0.8 });
  latch(S, T.kidOpen, 0.25);

  // the seller walks in
  darbuka(S, T.enter, T.stop);
  tune(S, 2.8, [[4, 1], [3, 1], [2, 1], [1, 1], [2, 1], [3, 1], [4, 2]]);
  cry(S, T.call1 + 0.2, { pan: -0.35 });
  PIGEONS.forEach((p, i) => flutter(S, takeoff(p, i), panOf(p.x) - 0.1, 0.1 - 0.006 * i));
  tune(S, 6.45, [[5, 1], [4, 1], [3, 1], [2, 1], [1, 2], [0, 2]], { vel: 0.084 });
  tune(S, 8.8, [[0, 1], [1, 1], [2, 1], [3, 1], [4, 2]], { vel: 0.082 });

  // up at the window; it opens, the teyze smiles and waves
  cry(S, T.call2 + 0.2, { pan: -0.05, vel: 0.065 });
  creak(S, T.open + 0.05);
  S.bell(T.appear + 0.3, rast(9), { vel: 0.03, pan: 0.15 });
  S.bell(T.wave + 0.15, rast(11), { vel: 0.026, pan: 0.2 });
  S.bell(T.wave + 0.4, rast(12), { vel: 0.022, pan: 0.2 });
  // the basket comes down, one note for every turn of the rope, and the cats look up and ask
  [7, 6, 5, 4, 3, 2, 1].forEach((d, i) => ud(S, T.lower + i * 0.16, d, { vel: 0.062, bright: 5, pan: 0.2 }));
  mew(S, T.lower + 0.25, panOf(645));
  mew(S, T.lower + 0.9, panOf(515), 820, 0.014);
  // the coins: out of the basket with a chink, into his apron pocket with another
  S.bell(T.coins + 0.22, rast(14), { vel: 0.014, dur: 0.35, pan: 0.15, send: 0.3 });
  S.bell(T.coins + 0.46, rast(16), { vel: 0.018, dur: 0.3, pan: 0.05, send: 0.3 });
  S.bell(T.coins + 0.5, rast(14), { vel: 0.012, dur: 0.3, pan: 0.05, send: 0.3 });
  S.bell(T.take1 + TAKE_DUR, rast(11), { vel: 0.04 });
  S.bell(T.take2 + TAKE_DUR, rast(12), { vel: 0.045 });
  // …and back up
  [1, 2, 3, 4, 5, 6, 7].forEach((d, i) => ud(S, T.raise + i * 0.16, d, { vel: 0.062, bright: 5, pan: 0.2 }));
  // "afiyet olsun" — "sağ ol, evladım"
  [[3, 0.14], [4, 0.14], [3, 0.2], [2, 0.55]].reduce((t, [d, len]) => {
    S.ney(t, rast(d), { dur: len, vel: 0.038, slide: 30, attack: 0.04, release: 0.14, pan: -0.05, send: 0.5 });
    return t + len + 0.04;
  }, T.bow + 0.3);
  [7, 9, 11].forEach((d, i) => S.bell(T.heart + 0.12 + i * 0.13, rast(d), { vel: 0.03, pan: 0.2 }));

  // he turns to the cats and tears a piece each off a simit; they trill, and crunch; the kid claps
  scuff(S, T.turn - 0.08, panOf(STOP_X));
  scuff(S, T.turnBack - 0.08, panOf(STOP_X));
  [T.toss1, T.toss2].forEach((ts, i) => {
    for (let k = 0; k < 4; k++) tick(S, ts - 0.3 + k * 0.035 + 0.01 * hash(k, 70 + i), 4200 + 900 * hash(k, 72 + i), 0.012, panOf(STOP_X));
  });
  S.chirp(T.toss1, { f0: 600, f1: 2400, dur: 0.45, vel: 0.018, pan: -0.2 });
  S.chirp(T.toss2, { f0: 700, f1: 2600, dur: 0.5, vel: 0.018, pan: -0.35 });
  S.bell(T.land1, rast(9), { vel: 0.03, pan: -0.2 });
  S.bell(T.land2, rast(7), { vel: 0.03, pan: -0.4 });
  mrrp(S, T.land1 + 0.05, panOf(667));
  mrrp(S, T.land2 + 0.05, panOf(539), 600);
  [[T.land1, 667], [T.land2, 539]].forEach(([land, x], i) => {
    for (const d of [0.55, 0.78, 1.25, 1.47]) tick(S, land + d + 0.02 * hash(i, d * 10), 1500, 0.013, panOf(x));
  });
  // claps, on the frames where his hands meet
  const CLAP = Math.PI / 16;
  for (let k = 0, tc = Math.ceil((T.toss1 + 0.5) / CLAP) * CLAP; k < 6; k++, tc += CLAP) {
    S.noise(tc, { dur: 0.07, type: 'bandpass', f0: 1700, q: 0.9, vel: 0.03, attack: 0.002, release: 0.05, send: 0.2, pan: 0.35 });
  }
  tune(S, T.land1 + 0.1, [[4, 1], [2, 1], [4, 1], [5, 2]], { vel: 0.068 });

  // on to the next street: goodbye from the window, a wag from the dog, one more cry
  S.bell(T.bye + 0.2, rast(11), { vel: 0.022, pan: 0.2 });
  S.bell(T.bye + 0.45, rast(12), { vel: 0.018, pan: 0.2 });
  darbuka(S, T.leave, 22.6, 0.75);
  tune(S, T.leave + 0.45, [[4, 1], [3, 1], [2, 1], [1, 2]], { vel: 0.077 });
  creak(S, T.close + 0.1, 0.1);
  latch(S, T.close + 0.62, 0.1);
  [21.95, 22.2, 22.45].forEach((t) => S.thump(t, { f0: 90, f1: 55, dur: 0.14, vel: 0.07, send: 0.05, pan: 0.2 }));
  S.noise(T.dogUp + 1.25, { type: 'lowpass', f0: 800, f1: 300, dur: 0.6, vel: 0.018, attack: 0.15, release: 0.4, send: 0.1, pan: 0.2 });
  LANDERS.forEach((p, i) => flutter(S, p.tl - 0.35, panOf(p.x) - 0.2, 0.05 - 0.006 * i));
  cry(S, T.call3 + 0.2, { vel: 0.05, pan: 0.35, send: 0.45 });
  S.horn(21.0, { f: 73.4, dur: 1.0, vel: 0.03, cutoff: 320, send: 0.8, pan: 0.45 });
  // and rest on the tonic: G, D and the half-flat segâh of Rast, dry enough to settle before the black
  [-7, -3, 0, 2, 4].forEach((d, i) => ud(S, 22.55 + i * 0.09, d, { vel: 0.068, dur: 1.0, send: 0.15 }));
  S.pad(22.55, [rast(-14), rast(-10), rast(-5)], { dur: 0.3, vel: 0.055, attack: 0.25, release: 0.7, cutoff: 800, send: 0.25 });
}
