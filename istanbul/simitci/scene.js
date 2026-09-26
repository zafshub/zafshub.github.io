// Code Draws Istanbul · No. 2 — Simitçi (the simit seller).
// Morning in Balat. The seller calls, a basket comes down on a rope, the cats get their share.
// Every frame is painted from nothing as a pure function of time t.
import { TAU, lerp, seg, smooth, easeInOut, easeOut, fade, hash, noise, mixRgb, css } from '../../engine/util.js';
import { glow, disc, grain, vignette, caption } from '../../engine/draw.js';
import { simit, bubble, cat, person, makamHz } from '../kit.js';

export const meta = {
  title: 'Simitçi',
  logline: 'Morning in Balat. The simit seller calls, a basket comes down on a rope, and the cats get their share.',
  duration: 24,
  width: 1920,
  height: 1080,
  cover: 3,
  poster: 14.3,
  mix: { reverb: 2.4, wet: 0.24 },
};

const W = 1920, H = 1080, GY = 930; // ground line (top of the pavement)
const SELLER_H = 330;
const T = { enter: 3.2, stop: 10.8, open: 11.2, lower: 12, lowered: 13.6, take1: 13.8, take2: 14.5, raise: 15.3, raised: 16.9, toss: 17.3, land: 18.05, leave: 19.6, card: 22.4, end: 24 };
const STOP_X = 860, SPEED = 140;
const WIN = { x: 906, y: 470 }; // the window the basket comes down from

// ——— where everyone is ———

function sellerX(t) {
  if (t < T.stop) return -220 + SPEED * (t - T.enter);
  if (t < T.leave) return STOP_X;
  return STOP_X + SPEED * (t - T.leave) * smooth(seg(t, T.leave, T.leave + 0.6));
}
const walkPhase = (t) => ((sellerX(t) + 220) / (SELLER_H * 0.28)) * Math.PI;

function camera(t) {
  const x = t < T.leave ? lerp(620, STOP_X, smooth(seg(t, 3.4, T.stop + 0.4))) : lerp(STOP_X, 1500, easeInOut(seg(t, T.leave, 24.5)));
  return { x, y: 700, z: 1.4 };
}

// ——— the street ———

const HOUSES = [
  { x: -300, w: 330, h: 560, c: '#e39a8b', shut: '#4d7d6b' },
  { x: 30, w: 300, h: 610, c: '#f0c466', shut: '#3f6e8e' },
  { x: 330, w: 290, h: 540, c: '#9cc4d9', shut: '#b35b44' },
  { x: 620, w: 360, h: 640, c: '#78c1b3', shut: '#8a4a3a', cumba: true, basket: true },
  { x: 980, w: 310, h: 580, c: '#ec9a5c', shut: '#39606b' },
  { x: 1290, w: 330, h: 620, c: '#c8a0d4', shut: '#4b6b4a', cumba: true },
  { x: 1620, w: 300, h: 560, c: '#f2d9a6', shut: '#7a3f3a' },
  { x: 1920, w: 340, h: 640, c: '#e07f7f', shut: '#3d5c73', cumba: true },
  { x: 2260, w: 320, h: 590, c: '#8fc59a', shut: '#8a5a3a' },
];

function window1(ctx, x, y, w, h, frame, glass, shut, open = 0) {
  ctx.fillStyle = css(frame);
  ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
  ctx.fillStyle = css(glass);
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = css(frame);
  ctx.fillRect(x + w / 2 - 2, y, 4, h);
  ctx.fillRect(x, y + h * 0.42, w, 4);
  // shutters, folding back as the window opens
  const sw = (w / 2) * (1 - 0.8 * open);
  for (const side of [-1, 1]) {
    const sx = side < 0 ? x - sw - 6 : x + w + 6;
    ctx.fillStyle = css(shut);
    ctx.fillRect(sx, y - 4, sw, h + 8);
    ctx.fillStyle = css(mixRgb(shut, [0, 0, 0], 0.25));
    for (let k = 1; k < 6; k++) ctx.fillRect(sx + 3, y + (k * h) / 6, sw - 6, 2);
  }
}

function house(ctx, H0, t) {
  const { x, w, h } = H0;
  const top = GY - h;
  const wall = H0.c, trim = [250, 240, 226];
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
  ctx.fillStyle = css(trim);
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
  // door with an arch and two steps
  const dx = x + w * 0.16;
  ctx.fillStyle = css(trim);
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
  window1(ctx, gx, GY - 170, 70, 96, trim, mixRgb([60, 70, 90], [255, 230, 190], 0.15), H0.shut);
  ctx.strokeStyle = 'rgba(40,30,30,0.7)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let k = 1; k < 5; k++) {
    ctx.moveTo(gx + k * 14, GY - 172);
    ctx.lineTo(gx + k * 14, GY - 72);
  }
  ctx.stroke();

  // upper floor
  const uy = top + h * 0.12, uh = h * 0.3;
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
    const n = 3;
    for (let k = 0; k < n; k++) {
      const ww = cw / n - 26;
      const wx = cx + 13 + (k * cw) / n;
      const isBasket = H0.basket && k === n - 1;
      const open = isBasket ? smooth(seg(t, T.open, T.open + 0.6)) * (1 - smooth(seg(t, 17.4, 18.2))) : 0;
      const glass = isBasket && open > 0 ? mixRgb([60, 70, 90], [255, 214, 150], open * 0.8) : mixRgb([70, 90, 110], [200, 225, 240], 0.25 + 0.2 * hash(k, x));
      window1(ctx, wx, uy + 14, ww, uh - 36, trim, glass, H0.shut, open);
    }
  } else {
    for (let k = 0; k < 2; k++) {
      const wx = x + w * (0.2 + 0.42 * k);
      window1(ctx, wx, uy + 20, 64, uh - 40, trim, mixRgb([70, 90, 110], [200, 225, 240], 0.3), H0.shut);
      // geraniums on the sill
      ctx.fillStyle = css([170, 90, 60]);
      ctx.fillRect(wx + 4, uy + uh - 18, 56, 14);
      for (let f = 0; f < 5; f++) disc(ctx, wx + 10 + f * 11, uy + uh - 22 - 3 * Math.sin(f * 2), 6, css(f % 2 ? [220, 60, 70] : [70, 130, 70]));
    }
  }
}

function backRow(ctx) {
  for (let i = -2; i < 12; i++) {
    const x = i * 230 + 60 * hash(i, 3);
    const h = 180 + 120 * hash(i, 4);
    const top = 330 - h * 0.6;
    const c = mixRgb(['#e8b4a8', '#f3d6a0', '#b9d3df', '#c9b8dc', '#f0c29c'][(((i * 7) % 5) + 5) % 5], [236, 232, 240], 0.45);
    ctx.fillStyle = css(c);
    ctx.fillRect(x, top, 210, 400);
    ctx.fillStyle = css(mixRgb([160, 90, 70], [236, 232, 240], 0.4));
    ctx.beginPath();
    ctx.moveTo(x - 10, top);
    ctx.lineTo(x + 105, top - 40 - 20 * hash(i, 5));
    ctx.lineTo(x + 220, top);
    ctx.fill();
    ctx.fillStyle = css(mixRgb([90, 110, 130], [236, 232, 240], 0.45));
    for (let k = 0; k < 3; k++) ctx.fillRect(x + 30 + k * 60, top + 40, 26, 40);
  }
}

function farHill(ctx) {
  // across the Golden Horn: a hazy hill, domes, and the red school on the ridge
  const haze = [214, 222, 236];
  ctx.fillStyle = css(mixRgb([150, 160, 190], haze, 0.35));
  ctx.beginPath();
  ctx.moveTo(-400, 400);
  for (let x = -400; x <= 2600; x += 20) ctx.lineTo(x, 250 - 60 * Math.exp(-(((x - 700) / 500) ** 2)) - 20 * noise(x * 0.004, 2));
  ctx.lineTo(2600, 400);
  ctx.fill();
  const red = css(mixRgb([176, 74, 60], haze, 0.35));
  ctx.fillStyle = red;
  ctx.fillRect(560, 150, 280, 70);
  ctx.fillRect(660, 120, 80, 40);
  ctx.beginPath();
  ctx.ellipse(700, 120, 38, 30, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillRect(698, 76, 4, 16);
  for (let k = 0; k < 7; k++) {
    ctx.fillStyle = css(mixRgb([120, 50, 45], haze, 0.4));
    ctx.fillRect(578 + k * 38, 168, 14, 22);
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

// ——— characters ———

/** The simit tray, balanced on the head: a round board piled with rings. */
function tray(ctx, x, y, count) {
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
}

function basketAt(t) {
  const down = easeInOut(seg(t, T.lower, T.lowered)) - easeInOut(seg(t, T.raise, T.raised));
  const y = lerp(WIN.y + 40, 770, down) + (down > 0 && down < 1 ? 4 * Math.sin(t * 7) : 0);
  const sway = Math.sin(t * 2.2) * 4 * down;
  return { x: WIN.x + 30 + sway, y, visible: t > T.lower - 0.2 && t < T.raised + 0.1 };
}

function basket(ctx, t, n) {
  const B = basketAt(t);
  if (!B.visible) return;
  ctx.strokeStyle = '#efe6d6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(WIN.x + 30, WIN.y + 30);
  ctx.lineTo(B.x, B.y - 44);
  ctx.stroke();
  ctx.strokeStyle = '#7a5530';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(B.x, B.y - 18, 26, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  for (let i = 0; i < n; i++) simit(ctx, B.x - 10 + i * 20, B.y - 14 - i * 4, 15, 0.3 - i * 0.5, 0.45, 40 + i);
  ctx.fillStyle = '#c8954f';
  ctx.beginPath();
  ctx.moveTo(B.x - 34, B.y - 18);
  ctx.lineTo(B.x + 34, B.y - 18);
  ctx.lineTo(B.x + 26, B.y + 14);
  ctx.lineTo(B.x - 26, B.y + 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(110,70,30,0.6)';
  ctx.lineWidth = 1.5;
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.moveTo(B.x - 32 + k * 2, B.y - 11 + k * 7);
    ctx.lineTo(B.x + 32 - k * 2, B.y - 11 + k * 7);
    ctx.stroke();
  }
  for (let k = -3; k <= 3; k++) {
    ctx.beginPath();
    ctx.moveTo(B.x + k * 10, B.y - 18);
    ctx.lineTo(B.x + k * 8, B.y + 14);
    ctx.stroke();
  }
}

function teyze(ctx, t) {
  const k = smooth(seg(t, T.open + 0.3, T.open + 0.9)) * (1 - smooth(seg(t, 17.2, 17.9)));
  if (k <= 0) return;
  const x = WIN.x + 22, y = WIN.y + 36 + (1 - k) * 40;
  ctx.save();
  ctx.beginPath();
  ctx.rect(WIN.x - 26, WIN.y - 60, 104, 128);
  ctx.clip();
  // shoulders in a cardigan, the headscarf, a kind face
  ctx.fillStyle = '#6d5a8a';
  ctx.beginPath();
  ctx.ellipse(x - 2, y + 58, 40, 30, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c8465e';
  ctx.beginPath();
  ctx.arc(x - 3, y - 4, 31, Math.PI * 0.8, Math.PI * 2.2);
  ctx.lineTo(x + 20, y + 40);
  ctx.lineTo(x - 34, y + 42);
  ctx.fill();
  for (let i = 0; i < 7; i++) disc(ctx, x - 26 + i * 8.5, y - 20 + 9 * Math.sin(i * 1.7), 2.6, '#f6d56a');
  ctx.fillStyle = '#e8b896';
  ctx.beginPath();
  ctx.ellipse(x + 4, y + 6, 19, 22, 0, 0, TAU);
  ctx.fill();
  disc(ctx, x + 11, y + 1, 2.4, '#2a1f1c');
  disc(ctx, x - 3, y + 1, 2.4, '#2a1f1c');
  ctx.strokeStyle = '#7a3a2a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 4, y + 11, 6, 0.3, Math.PI - 0.3);
  ctx.stroke();
  disc(ctx, x - 7, y + 10, 4, 'rgba(230,120,120,0.35)');
  disc(ctx, x + 15, y + 10, 4, 'rgba(230,120,120,0.35)');
  ctx.restore();
  // her arm out of the window, holding the rope
  if (t > T.lower - 0.3 && t < T.raised + 0.2) {
    ctx.strokeStyle = '#6d5a8a';
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 44);
    ctx.lineTo(WIN.x + 30, WIN.y + 30);
    ctx.stroke();
    disc(ctx, WIN.x + 30, WIN.y + 30, 6, '#e8b896');
  }
}

function sellerPose(t) {
  const x = sellerX(t);
  const walking = (t > T.enter && t < T.stop) || t > T.leave + 0.1;
  const phase = walking ? walkPhase(t) : null;
  // near hand steadies the tray; the far hand swings, or works
  let near = [36, -SELLER_H * 0.58];
  let far = walking ? [Math.sin(walkPhase(t)) * 28, -8] : [18, -6];
  let dir = 1, count = 11;
  const B = basketAt(t);
  const toB = [(B.x - x), B.y - (GY - SELLER_H * 0.5)];
  const trayP = [30, -SELLER_H * 0.6];
  const hop = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  for (const t0 of [T.take1, T.take2]) {
    const k = seg(t, t0, t0 + 0.65);
    if (k > 0 && k < 1) far = k < 0.4 ? hop([18, -6], trayP, smooth(k / 0.4)) : hop(trayP, [toB[0] - 10, toB[1] - 10], smooth((k - 0.4) / 0.6));
  }
  count = 11 - (t > T.take1 + 0.26 ? 1 : 0) - (t > T.take2 + 0.26 ? 1 : 0) - (t > T.toss - 0.3 ? 1 : 0);
  // turning round to toss a piece to the cats
  const tossK = seg(t, T.toss - 0.5, T.toss + 0.4);
  if (tossK > 0 && t < T.leave) {
    dir = t < T.toss + 1.8 ? -1 : 1;
    if (tossK < 0.55) far = hop([18, -6], trayP, smooth(tossK / 0.55));
    else if (tossK < 1) far = hop(trayP, [70, -40], smooth((tossK - 0.55) / 0.45));
  }
  return { x, phase, near, far, dir, count, walking };
}

function tossed(t) {
  const k = seg(t, T.toss, T.land);
  const from = [STOP_X - 70, GY - SELLER_H * 0.55];
  const to = [STOP_X - 196, GY - 6];
  return { p: [lerp(from[0], to[0], k), lerp(from[1], to[1], k) - Math.sin(k * Math.PI) * 90], k };
}

function cats(ctx, t) {
  const sx = sellerX(t);
  // the ginger and the tuxedo trail the seller, sit when he stops, then share the piece
  const trail = [
    { coat: 'ginger', gap: 190, sitX: STOP_X - 170, s: 1.35, seed: 1 },
    { coat: 'tuxedo', gap: 320, sitX: STOP_X - 300, s: 1.3, seed: 2 },
  ];
  trail.forEach((c, i) => {
    let x, pose = 'walk', phase = 0, dir = 1, look = 0, chew = 0;
    const arrive = T.stop + 0.4 + i * 0.5;
    if (t < arrive) {
      x = Math.min(sx - c.gap, c.sitX);
      phase = (x / 26) * Math.PI * 0.5;
      if (sx - c.gap >= c.sitX) pose = 'sit';
    } else {
      x = c.sitX;
      pose = 'sit';
      look = t > T.lower && t < T.raised + 0.5 ? 1 : 0.3;
    }
    // the piece lands between them: the ginger gets there first
    if (t > T.land - 0.2 && t < T.leave + 3.5) {
      const target = STOP_X - 196;
      if (i === 0) {
        const k = smooth(seg(t, T.land - 0.2, T.land + 0.4));
        x = lerp(c.sitX, target - 34, k);
        pose = k < 1 ? 'walk' : 'crouch';
        phase = t * 10;
        chew = t;
      } else {
        dir = 1;
        pose = 'sit';
        look = -0.2;
      }
    }
    if (t > T.leave + 3.5) {
      // back on the trail after the seller
      const k = seg(t, T.leave + 3.5 + i * 0.3, 30);
      x = (i === 0 ? STOP_X - 230 : c.sitX) + 150 * (t - T.leave - 3.5 - i * 0.3) * (k > 0 ? 1 : 0);
      pose = k > 0 ? 'walk' : 'sit';
      phase = (x / 26) * Math.PI * 0.5;
    }
    ctx.fillStyle = 'rgba(60,40,50,0.18)';
    ctx.beginPath();
    ctx.ellipse(x, GY + 2, 40 * c.s, 6, 0, 0, TAU);
    ctx.fill();
    cat(ctx, x, GY + 2, c.s, { pose, coat: c.coat, phase, t, dir, look, chew, seed: c.seed, blink: Math.sin(t * 0.8 + i * 3) > 0.97 });
  });
  // a cat asleep on the step of the yellow house, all morning long
  cat(ctx, 430, GY - 8, 1.2, { pose: 'sleep', coat: 'grey', t, seed: 3 });
}

// ——— the frame ———

export function draw(ctx, t) {
  const cam = camera(t);
  // sky
  const g = ctx.createLinearGradient(0, 0, 0, 500);
  g.addColorStop(0, '#9fc7e8');
  g.addColorStop(1, '#f7e7d2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 1780, 40, 700, [255, 230, 180], 0.4);
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
  layer(0.2, () => farHill(ctx));
  layer(0.55, () => backRow(ctx));
  layer(1, () => {
    for (const h0 of HOUSES) house(ctx, h0, t);
    // a cat dozing on the geranium sill of the blue house
    cat(ctx, 425, GY - 540 * 0.58 + 6, 0.95, { pose: 'loaf', coat: 'calico', t, blink: Math.sin(t * 0.5) > 0.9 });
    teyze(ctx, t);
    street(ctx);
    cats(ctx, t);

    const P = sellerPose(t);
    const hipY = GY - SELLER_H * 0.5;
    ctx.fillStyle = 'rgba(60,40,50,0.2)';
    ctx.beginPath();
    ctx.ellipse(P.x, GY + 3, 70, 9, 0, 0, TAU);
    ctx.fill();
    const headTop = GY - SELLER_H * 1.01;
    tray(ctx, P.x + 6 * P.dir + (P.walking ? 2 * Math.sin(walkPhase(t) * 2) : 0), headTop, P.count);
    person(ctx, P.x, GY, SELLER_H, {
      phase: P.phase, dir: P.dir, mustache: true, smile: t > T.take1 && t < T.leave + 1,
      colors: { shirt: '#f4efe4', vest: '#7c2f33', pants: '#4b4a52', shoes: '#2a2224', skin: '#d9a07c', hair: '#2e2521', hat: 'cap', capColor: '#4f4a4a', apron: '#f7f3ea' },
      hands: [P.near, P.far],
    });
    // simits on their way into the basket
    for (const t0 of [T.take1, T.take2]) {
      const k = seg(t, t0 + 0.26, t0 + 0.65);
      if (k > 0 && k < 1) {
        const B = basketAt(t);
        const from = [P.x + 30, hipY - SELLER_H * 0.62];
        simit(ctx, lerp(from[0], B.x, easeOut(k)), lerp(from[1], B.y - 16, easeOut(k)) - Math.sin(k * Math.PI) * 30, 15, k * 4, 0.6, 7);
      }
    }
    const n = (t > T.take1 + 0.65 ? 1 : 0) + (t > T.take2 + 0.65 ? 1 : 0);
    basket(ctx, t, n);
    // the piece for the cats
    const Tp = tossed(t);
    if (t > T.toss && t < T.land + 2.2) {
      const [px, py] = Tp.p;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Tp.k * 7);
      ctx.fillStyle = '#b8692c';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0.3, Math.PI * 1.3);
      ctx.arc(0, 0, 4, Math.PI * 1.3, 0.3, true);
      ctx.fill();
      ctx.restore();
    }

    // words in the street
    const hx = sellerX(t);
    bubble(ctx, hx + 60, GY - SELLER_H - 70, 'Simiiit!', fade(t, 5, 6.9, 0.2, 0.3), { size: 50 });
    bubble(ctx, STOP_X + 50, GY - SELLER_H - 70, 'Afiyet olsun!', fade(t, 15.3, 16.7, 0.2, 0.3), { size: 42 });
    bubble(ctx, WIN.x + 120, WIN.y - 50, 'Sağ ol evladım!', fade(t, 16.3, 17.8, 0.2, 0.3), { size: 40, tail: -1 });
    bubble(ctx, hx + 60, GY - SELLER_H - 70, 'Taze simit!', fade(t, 21, 22.4, 0.2, 0.3), { size: 46 });
  });
  sunlight(ctx, t);

  // ——— words ———
  vignette(ctx, W, H, 0.28);
  const title = fade(t, 0.6, 4.4, 1, 0.8);
  if (title > 0) {
    ctx.fillStyle = `rgba(250,243,230,${0.88 * title})`;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 380, 62, 760, 212, 18);
    ctx.fill();
    ctx.strokeStyle = `rgba(58,38,32,${0.5 * title})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 368, 74, 736, 188, 12);
    ctx.stroke();
  }
  caption(ctx, 'Simitçi', W / 2, 150, { size: 132, alpha: title, color: '#3a2620', shadow: 0 });
  caption(ctx, 'CODE DRAWS ISTANBUL · NO. 2', W / 2, 234, { size: 24, alpha: title * 0.85, italic: false, weight: 600, spacing: 8, color: '#3a2620', shadow: 0 });

  const card = smooth(seg(t, T.card, T.card + 0.8));
  if (card > 0) {
    ctx.fillStyle = `rgba(247,238,224,${0.82 * card})`;
    ctx.fillRect(0, 0, W, H);
    caption(ctx, 'Simitçi', W / 2, H / 2 - 40, { size: 110, alpha: card, color: '#3a2620', shadow: 0 });
    caption(ctx, 'The Simit Seller · İstanbul, kodla çizildi', W / 2, H / 2 + 44, { size: 34, alpha: card * 0.9, color: '#3a2620', shadow: 0 });
    caption(ctx, 'EVERY FRAME DRAWN IN JAVASCRIPT · MUSIC SYNTHESIZED IN THE BROWSER', W / 2, H / 2 + 108, {
      size: 17, alpha: card * 0.65, italic: false, weight: 600, spacing: 5, color: '#3a2620', shadow: 0,
    });
  }
  grain(ctx, W, H, t, 0.05);
}

// ——— the music: Rast on G, a light darbuka ———

const G4 = 67;
const rast = (d) => makamHz('rast', G4, d);
const EIGHTH = 60 / 104 / 2;

const ud = (S, t, d, o = {}) => S.pluck(t, rast(d), { wave: 'sawtooth', bend: 25, bright: 3.5, dur: 1.2, vel: 0.075, pan: 0.1, ...o });
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
      if (kind === 'd') S.thump(t, { f0: 120, f1: 58, dur: 0.28, vel: 0.2 * vel });
      else S.noise(t, { dur: 0.06, type: 'bandpass', f0: kind === 't' ? 3200 : 2600, q: 1.3, vel: (kind === 't' ? 0.06 : 0.035) * vel, attack: 0.002, release: 0.05, send: 0.15 });
    }
  }
}

export function score(S) {
  // the street waking up
  S.noise(0, { dur: 24, type: 'bandpass', f0: 600, q: 0.3, vel: 0.018, attack: 2, release: 2, lfo: [0.1, 0.5], send: 0.1 });
  const birds = [0.8, 1.1, 2.4, 2.6, 4.1, 7.3, 7.5, 9.8, 12.6, 18.9, 19.2, 22.8];
  birds.forEach((t, i) => S.chirp(t, { f0: 3400 + 500 * hash(i, 1), f1: 4600 + 400 * hash(i, 2), dur: 0.06, vel: 0.012, pan: (hash(i, 3) - 0.5) * 1.4 }));
  S.pad(0, ['G2', 'D3', 'G3'], { dur: 22.6, vel: 0.05, attack: 2.5, release: 2, cutoff: 700 });

  // the seller walks in
  darbuka(S, 3.4, 10.8);
  tune(S, 3.4, [[4, 1], [3, 1], [2, 1], [1, 1], [2, 1], [3, 1], [4, 2], [5, 1], [4, 1], [3, 1], [2, 1], [1, 4]]);
  S.chirp(5, { f0: 700, f1: 1500, dur: 0.06, vel: 0.03 });
  tune(S, 7.55, [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [4, 1], [3, 1], [2, 1], [1, 1], [0, 4]], { vel: 0.07 });

  // the basket comes down, one note for every turn of the rope…
  S.chirp(T.open, { f0: 500, f1: 900, dur: 0.12, vel: 0.02 });
  [7, 6, 5, 4, 3, 2, 1, 0].forEach((d, i) => ud(S, T.lower + i * 0.2, d, { vel: 0.055, bright: 5, pan: 0.3 }));
  S.bell(T.take1 + 0.6, rast(11), { vel: 0.04 });
  S.bell(T.take2 + 0.6, rast(12), { vel: 0.045 });
  // …and back up
  [0, 1, 2, 3, 4, 5, 6, 7].forEach((d, i) => ud(S, T.raise + i * 0.2, d, { vel: 0.055, bright: 5, pan: 0.3 }));
  S.chirp(15.3, { f0: 700, f1: 1500, dur: 0.06, vel: 0.025 });
  S.chirp(16.3, { f0: 900, f1: 1800, dur: 0.06, vel: 0.025 });

  // a piece for the cats
  S.chirp(T.toss, { f0: 600, f1: 2400, dur: 0.5, vel: 0.02 });
  S.bell(T.land, rast(9), { vel: 0.05 });
  tune(S, 18.3, [[4, 1], [2, 1], [4, 1], [5, 2]], { vel: 0.06 });

  // on to the next street
  darbuka(S, T.leave, 22.4, 0.8);
  tune(S, T.leave, [[4, 1], [3, 1], [2, 1], [1, 1], [2, 1], [3, 1], [4, 2], [5, 1], [4, 1], [3, 1], [2, 1], [1, 1], [2, 1], [0, 3]]);
  S.chirp(21, { f0: 700, f1: 1500, dur: 0.06, vel: 0.025 });
  // and rest on the tonic
  [-7, -3, 0, 2, 4].forEach((d, i) => ud(S, 22.5 + i * 0.09, d, { vel: 0.06, dur: 2.2 }));
  S.pad(22.5, ['G2', 'D3', 'B3'], { dur: 0.5, vel: 0.08, attack: 0.3, release: 1.4 });
}
