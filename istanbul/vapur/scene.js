// Code Draws Istanbul · No. 1 — Vapur (the ferry).
// Sunset over the old city. A ferry crosses; the gulls follow it for simit.
// Every frame is painted from nothing as a pure function of time t.
import { TAU, clamp, lerp, seg, smooth, easeInOut, fade, hash, noise, mixRgb, css, keyColor } from '../../engine/util.js';
import { glow, disc, grain, vignette, caption } from '../../engine/draw.js';
import { mosque, galata, maidensTower, roofs, gull, simit, tea, flag, person, makamHz } from '../kit.js';

export const meta = {
  title: 'Vapur',
  logline: 'Sunset over the old city. A ferry crosses the Bosphorus, and the gulls follow it for simit.',
  duration: 26,
  width: 1920,
  height: 1080,
  cover: 3.2,
  poster: 12.2,
  mix: { reverb: 3.2, wet: 0.34 },
};

const W = 1920, H = 1080, HY = 640;
const T = { grab: 15.4, lights: 16.5, card: 23.2, end: 26 };
const FERRY_Y = 884;
const ferryX = (t) => -1100 + 118 * t;

// ——— light over time ———

const SKY = [
  [[0, '#34356f'], [22, '#1b1f4c']],
  [[0, '#b85f7c'], [22, '#5e3f72']],
  [[0, '#f29a5c'], [22, '#c96b6c']],
  [[0, '#ffd27c'], [22, '#eea277']],
];
const sky = (t) => SKY.map((stops) => keyColor(stops, t));
const lit = (t) => smooth(seg(t, T.lights, 21.5));

// ——— camera: wide, then close on the child at the stern, then wide again ———

function camera(t) {
  const fx = ferryX(t);
  const k = smooth(seg(t, 10.8, 13.6)) * (1 - smooth(seg(t, 17.6, 20.2)));
  const wide = [960 + 70 * smooth(seg(t, 3, 24)), 552];
  const close = [fx - 236, FERRY_Y - 186];
  return { x: lerp(wide[0], close[0], k), y: lerp(wide[1], close[1], k), z: Math.exp(lerp(0, Math.log(2.9), k)) };
}

function applyCam(ctx, cam, depth) {
  const z = 1 + (cam.z - 1) * depth;
  ctx.translate(W / 2, H / 2);
  ctx.scale(z, z);
  ctx.translate(-(W / 2 + (cam.x - W / 2) * depth), -(H / 2 + (cam.y - H / 2) * depth));
}

// ——— the city across the water ———

const hill = (x) => HY - 38 - 70 * Math.exp(-(((x - 1080) / 330) ** 2)) - 30 * Math.exp(-(((x - 560) / 260) ** 2)) - 10 * noise(x * 0.01, 4);
const hillRight = (x) => HY - 30 - 80 * Math.exp(-(((x - 1760) / 260) ** 2)) - 8 * noise(x * 0.012, 5);

function city(ctx, t, C) {
  const L = lit(t);
  const far = css(mixRgb('#3a2548', C[3], 0.22));
  const near = css(mixRgb('#2c1c38', C[3], 0.12));
  // the Galata side, a little further back
  ctx.fillStyle = css(mixRgb('#3a2548', C[3], 0.32));
  ctx.beginPath();
  ctx.moveTo(1450, HY + 2);
  for (let x = 1450; x <= 2500; x += 10) ctx.lineTo(x, hillRight(x));
  ctx.lineTo(2500, HY + 2);
  ctx.fill();
  roofs(ctx, 1480, 2500, hillRight, 21, css(mixRgb('#3a2548', C[3], 0.32)), L);
  galata(ctx, 1760, hillRight(1760) + 6, 190, css(mixRgb('#3a2548', C[3], 0.3)), L);

  // the historic peninsula
  ctx.fillStyle = far;
  ctx.beginPath();
  ctx.moveTo(-600, HY + 2);
  for (let x = -600; x <= 1560; x += 10) ctx.lineTo(x, hill(x));
  ctx.lineTo(1560, HY + 2);
  ctx.fill();
  roofs(ctx, -600, 1560, hill, 11, far, L);
  mosque(ctx, 250, hill(250) + 8, 64, far, { minarets: 4, lit: L });
  mosque(ctx, 590, hill(590) + 8, 74, far, { minarets: 6, lit: L });
  mosque(ctx, 1080, hill(1080) + 8, 88, far, { minarets: 4, lit: L });
  mosque(ctx, 1400, HY - 16, 52, near, { minarets: 2, lit: L, halls: false });

  // floodlight haze on the domes at night
  if (L > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const [x, r] of [[250, 64], [590, 74], [1080, 88], [1400, 52], [1760, 40]]) glow(ctx, x, hill(x) - r * 1.2, r * 3, [255, 190, 120], 0.12 * L);
    ctx.restore();
  }
}

function skyAndSun(ctx, t, C) {
  const g = ctx.createLinearGradient(0, -300, 0, HY);
  g.addColorStop(0, css(C[0]));
  g.addColorStop(0.45, css(C[1]));
  g.addColorStop(0.78, css(C[2]));
  g.addColorStop(1, css(C[3]));
  ctx.fillStyle = g;
  ctx.fillRect(-900, -900, 3720, HY + 900);

  // first stars
  const night = smooth(seg(t, 19, 24));
  for (let i = 0; i < 90 && night > 0; i++) {
    const tw = 0.6 + 0.4 * Math.sin(t * (1 + hash(i, 3) * 2) + i);
    disc(ctx, -300 + hash(i, 1) * 2500, -300 + hash(i, 2) ** 1.6 * 560, 0.8 + 1.2 * hash(i, 4) ** 4, css([255, 244, 230], night * tw * 0.8));
  }

  // the sun, setting behind Süleymaniye
  const sy = lerp(470, 700, easeInOut(seg(t, 0, 21)));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 1150, sy, 900, [255, 150, 80], 0.42 * (1 - 0.6 * seg(t, 16, 23)));
  glow(ctx, 1150, sy, 240, [255, 210, 140], 0.5 * (1 - seg(t, 17, 21)));
  ctx.restore();
  disc(ctx, 1150, sy, 64, css([255, 238, 196], 1 - smooth(seg(t, 19.5, 21))));

  // long thin clouds catching the light from below
  for (let i = 0; i < 4; i++) {
    const cx = ((hash(i, 30) * 2600 + t * (10 + 6 * i)) % 2800) - 600;
    const cy = 150 + i * 70 + 40 * hash(i, 31);
    const w = 500 + 400 * hash(i, 32);
    const cg = ctx.createLinearGradient(0, cy - 12, 0, cy + 12);
    cg.addColorStop(0, css(mixRgb(C[1], [60, 40, 90], 0.3), 0.5));
    cg.addColorStop(1, css(mixRgb(C[3], [255, 190, 150], 0.4), 0.65 * (1 - 0.5 * seg(t, 18, 24))));
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w / 2, 10 + 6 * hash(i, 33), 0, 0, TAU);
    ctx.fill();
  }
}

function water(ctx, t, C) {
  const g = ctx.createLinearGradient(0, HY, 0, 1300);
  g.addColorStop(0, css(mixRgb(C[3], C[2], 0.4)));
  g.addColorStop(0.12, css(mixRgb(C[2], C[1], 0.5)));
  g.addColorStop(0.5, css(mixRgb(C[1], [40, 30, 70], 0.55)));
  g.addColorStop(1, css([26, 22, 48]));
  ctx.fillStyle = g;
  ctx.fillRect(-900, HY, 3720, 1400);

  // ripples
  ctx.lineCap = 'round';
  for (let j = 0; j < 60; j++) {
    const k = j / 60;
    const y = HY + 3 + 660 * k * k;
    const depth = clamp((y - HY) / (H - HY));
    ctx.lineWidth = 0.8 + 2.2 * depth;
    ctx.strokeStyle = css(mixRgb(C[3], [255, 255, 255], 0.2), (0.05 + 0.13 * depth) * (0.6 + 0.4 * Math.sin(t * 1.2 + j)));
    ctx.beginPath();
    for (let i = 0; i < 18; i++) {
      let x = hash(i + j * 53, 7) * 3600 - 800 + t * (8 + 26 * depth) * (j % 2 ? 1 : -1);
      x = ((((x + 800) % 3600) + 3600) % 3600) - 800;
      const len = (8 + 70 * depth) * (0.4 + hash(i, j));
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
    }
    ctx.stroke();
  }

  // the sun's road on the water
  const sunK = 1 - smooth(seg(t, 18, 21.5));
  if (sunK > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let j = 0; j < 60; j++) {
      const k = j / 60;
      const y = HY + 3 + 640 * k ** 1.5;
      const depth = clamp((y - HY) / (H - HY));
      const f = 0.5 + 0.5 * Math.sin(t * (2.3 + 3 * hash(j, 9)) + j);
      const w = (8 + 130 * depth) * (0.3 + 0.7 * f);
      const x = 1150 + noise(j * 0.45 + t * 0.6, 9) * (8 + 70 * depth);
      ctx.strokeStyle = css([255, 200, 130], sunK * (0.25 + 0.6 * f) * (1 - 0.5 * k));
      ctx.lineWidth = 1 + 3 * depth;
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y);
      ctx.lineTo(x + w / 2, y);
      ctx.stroke();
    }
    ctx.restore();
  }
  // city lights stretched on the water
  const L = lit(t);
  if (L > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 40; i++) {
      if (hash(i, 60) > L) continue;
      const x = -300 + hash(i, 61) * 2400;
      for (let j = 0; j < 5; j++) {
        const y = HY + 6 + j * 9 + 3 * hash(i * 5 + j, 62);
        const w = 4 + 10 * hash(i * 5 + j, 63) * (0.6 + 0.4 * Math.sin(t * 2 + i + j));
        ctx.fillStyle = css([255, 200, 120], 0.3 * (1 - j / 5));
        ctx.fillRect(x - w / 2 + 3 * Math.sin(t + j), y, w, 1.6);
      }
    }
    ctx.restore();
  }
}

// ——— the ferry ———

const CREAM = [222, 214, 228], SHADE = [168, 158, 188], RIM = [255, 214, 164];

function kidTarget(t) {
  // the child holds a piece of simit up for the gulls, then throws both arms up when one takes it
  const reachUp = smooth(seg(t, 11.8, 12.6));
  const cheer = smooth(seg(t, T.grab + 0.05, T.grab + 0.35)) * (1 - smooth(seg(t, 18.5, 19.5)));
  const hold = [-264 - 4 * Math.sin(t * 3), -214 - 3 * Math.sin(t * 2.2)];
  return { hold, reachUp, cheer };
}

const HERO_ORBIT = (t) => [-470 + 90 * Math.cos(t * 0.9), -330 + 40 * Math.sin(t * 1.3)];

function heroGull(t) {
  // relative to the ferry
  const K = kidTarget(t);
  if (t < 13.8) return { p: HERO_ORBIT(t), dir: 1, flap: Math.sin(t * 9), tilt: 0.1 * Math.sin(t) };
  if (t < T.grab) {
    const k = easeInOut(seg(t, 13.8, T.grab));
    const a = HERO_ORBIT(13.8), b = [K.hold[0] - 10, K.hold[1] - 8];
    return { p: [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * 60], dir: 1, flap: k > 0.75 ? 1 : Math.sin(t * 10) * 0.4 + 0.5, tilt: lerp(0.35, -0.2, k) };
  }
  const k = easeInOut(seg(t, T.grab, T.grab + 1.6));
  const b = [K.hold[0] - 10, K.hold[1] - 8];
  return { p: [lerp(b[0], -120, k), lerp(b[1], -470, k) + Math.sin(k * Math.PI) * 30], dir: 1, flap: Math.sin(t * 12), tilt: -0.35 * (1 - k), carrying: true };
}

function ferry(ctx, t) {
  const x = ferryX(t), y = FERRY_Y + 2 * Math.sin(t * 1.3);
  if (x < -1000 || x > 2900) return;
  const dusk = seg(t, 12, 22);
  const cream = mixRgb(CREAM, [150, 140, 190], dusk * 0.35);
  const shade = mixRgb(SHADE, [90, 80, 130], dusk * 0.4);
  const rim = css(RIM, 0.85 * (1 - dusk * 0.6));
  const win = [255, 208, 140];

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.004 * Math.sin(t * 0.9));

  // its dark reflection
  const rg = ctx.createLinearGradient(0, 6, 0, 120);
  rg.addColorStop(0, 'rgba(20,14,34,0.55)');
  rg.addColorStop(1, 'rgba(20,14,34,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(-340, 6, 700, 114);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 16; i++) {
    const wx = -300 + i * 31 + 6 * Math.sin(t * 2 + i);
    ctx.fillStyle = css(win, 0.16 * (0.5 + 0.5 * Math.sin(t * 3 + i)));
    ctx.fillRect(wx, 16 + 10 * hash(i, 3), 16, 3);
  }
  ctx.restore();

  // upper deck: passengers first, the railing in front of them
  const K = kidTarget(t);
  const deck = -124;
  const who = [
    { x: -206, h: 104, dir: 1, colors: { shirt: '#6f5a7a', pants: '#3a3148', skin: '#c99478', hair: '#2a2028', hat: 'cap', capColor: '#3b3140' }, tea: true, mustache: true },
    { x: -118, h: 98, dir: 1, colors: { shirt: '#a0525a', pants: '#3b3246', skin: '#d4a286', hair: '#2a1c1c', hat: 'scarf', scarf: '#c07a4a' } },
    { x: -92, h: 104, dir: -1, colors: { shirt: '#45506e', pants: '#2e2a3c', skin: '#c99478', hair: '#1c1616' } },
  ];
  for (const p of who) {
    const hands = p.tea ? [[34, -20], [30, -18]] : [[22, -12], [18, -14]];
    person(ctx, p.x, deck, p.h, { dir: p.dir, colors: p.colors, hands, mustache: p.mustache, lean: 0.05 });
  }
  // the child, facing the gulls behind the ferry
  const kidX = -252, kidH = 70;
  const hipY = deck - kidH * 0.5;
  const toLocal = (wx, wy) => [(wx - kidX) * -1, wy - hipY];
  const handA = K.cheer > 0
    ? [lerp(K.hold[0], -270, K.cheer), lerp(K.hold[1], -212, K.cheer)]
    : [lerp(kidX - 10, K.hold[0], K.reachUp), lerp(deck - 30, K.hold[1], K.reachUp)];
  const handB = [lerp(kidX - 2, -246, K.cheer), lerp(deck - 28, -214, K.cheer)];
  person(ctx, kidX, deck, kidH, {
    dir: -1, colors: { shirt: '#e0a23a', pants: '#34405c', skin: '#e0b08c', hair: '#3a2418' },
    hands: [toLocal(...handA), toLocal(...handB)], look: 0.8 * K.reachUp, smile: K.cheer > 0.2,
  });
  if (t < T.grab) simit(ctx, handA[0] - 2, handA[1] - 3, 8, 0.3, 0.8, 5);

  // the tea on the rail, steaming
  tea(ctx, -172, deck - 36, 0.42, t);

  // railing
  ctx.strokeStyle = css(mixRgb(cream, [40, 30, 60], 0.15));
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let rx = -330; rx <= 40; rx += 15) {
    ctx.moveTo(rx, deck);
    ctx.lineTo(rx, deck - 34);
  }
  ctx.stroke();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = css(cream);
  ctx.beginPath();
  ctx.moveTo(-334, deck - 35);
  ctx.lineTo(44, deck - 35);
  ctx.stroke();
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-334, deck - 37);
  ctx.lineTo(44, deck - 37);
  ctx.stroke();

  // funnel
  ctx.fillStyle = css(mixRgb([232, 192, 102], [120, 90, 110], dusk * 0.4));
  ctx.beginPath();
  ctx.moveTo(-64, deck);
  ctx.lineTo(-48, -224);
  ctx.lineTo(6, -224);
  ctx.lineTo(-6, deck);
  ctx.fill();
  ctx.fillStyle = '#23202a';
  ctx.beginPath();
  ctx.moveTo(-50, -206);
  ctx.lineTo(-48, -224);
  ctx.lineTo(6, -224);
  ctx.lineTo(4, -206);
  ctx.fill();
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-48, -225);
  ctx.lineTo(6, -225);
  ctx.stroke();
  // a thin breath of smoke
  for (let k = 0; k < 6; k++) {
    const p = (t * 0.25 + k / 6) % 1;
    disc(ctx, -22 - p * 160, -236 - p * 40 + 6 * Math.sin(p * 6 + t), 8 + 22 * p, css([120, 110, 140], 0.14 * (1 - p)));
  }

  // wheelhouse
  ctx.fillStyle = css(cream);
  ctx.fillRect(50, -176, 196, 52);
  ctx.fillStyle = css(shade);
  ctx.fillRect(50, -128, 196, 4);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = css(mixRgb([60, 60, 90], win, 0.25 + 0.5 * dusk));
    ctx.fillRect(62 + i * 30, -166, 22, 20);
  }
  ctx.fillStyle = css(mixRgb(cream, [255, 255, 255], 0.2));
  ctx.fillRect(44, -182, 210, 7);
  ctx.strokeStyle = rim;
  ctx.beginPath();
  ctx.moveTo(44, -183);
  ctx.lineTo(254, -183);
  ctx.stroke();
  // mast and lamp
  ctx.strokeStyle = css(mixRgb(cream, [40, 30, 60], 0.3));
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(200, -182);
  ctx.lineTo(206, -262);
  ctx.stroke();
  disc(ctx, 206, -264, 3.5, css([255, 240, 210]));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 206, -264, 40, [255, 230, 190], 0.5 * (0.3 + dusk));
  ctx.restore();

  // the salon along the main deck
  ctx.fillStyle = css(cream);
  ctx.fillRect(-320, -120, 572, 60);
  const sg = ctx.createLinearGradient(0, -120, 0, -60);
  sg.addColorStop(0, 'rgba(255,255,255,0.12)');
  sg.addColorStop(1, 'rgba(60,40,90,0.14)');
  ctx.fillStyle = sg;
  ctx.fillRect(-320, -120, 572, 60);
  ctx.fillStyle = css(mixRgb(cream, [40, 30, 60], 0.12));
  ctx.fillRect(-334, -126, 600, 7);
  for (let i = 0; i < 17; i++) {
    const wx = -306 + i * 32;
    ctx.fillStyle = css(mixRgb([70, 66, 96], win, 0.55 + 0.45 * dusk));
    ctx.beginPath();
    ctx.roundRect(wx, -108, 20, 24, 4);
    ctx.fill();
  }
  // lifebuoys
  for (const bx of [-236, -6, 196]) {
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#e8672e';
    ctx.beginPath();
    ctx.arc(bx, -86, 9, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = '#f4efe6';
    ctx.beginPath();
    for (let q = 0; q < 4; q++) {
      ctx.moveTo(bx + Math.cos(q * Math.PI / 2) * 6.5, -86 + Math.sin(q * Math.PI / 2) * 6.5);
      ctx.lineTo(bx + Math.cos(q * Math.PI / 2) * 11.5, -86 + Math.sin(q * Math.PI / 2) * 11.5);
    }
    ctx.stroke();
  }

  // hull
  const hull = () => {
    ctx.beginPath();
    ctx.moveTo(-356, -60);
    ctx.lineTo(292, -62);
    ctx.quadraticCurveTo(356, -64, 376, -82);
    ctx.quadraticCurveTo(366, -24, 334, 8);
    ctx.lineTo(-334, 8);
    ctx.quadraticCurveTo(-356, -12, -356, -60);
    ctx.closePath();
  };
  const hg = ctx.createLinearGradient(0, -80, 0, 8);
  hg.addColorStop(0, css(mixRgb(cream, [255, 255, 255], 0.15)));
  hg.addColorStop(1, css(shade));
  ctx.fillStyle = hg;
  hull();
  ctx.fill();
  ctx.save();
  hull();
  ctx.clip();
  ctx.fillStyle = '#25232f';
  ctx.fillRect(-400, -20, 800, 40);
  ctx.fillStyle = css([184, 52, 44]);
  ctx.fillRect(-400, -24, 800, 4);
  ctx.restore();
  ctx.strokeStyle = rim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-356, -61);
  ctx.lineTo(292, -63);
  ctx.quadraticCurveTo(356, -65, 376, -83);
  ctx.stroke();

  // flag at the stern, streaming back
  ctx.strokeStyle = css(mixRgb(cream, [40, 30, 60], 0.3));
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-340, deck);
  ctx.lineTo(-346, -200);
  ctx.stroke();
  ctx.save();
  ctx.translate(-346, -200);
  ctx.scale(-1, 1);
  flag(ctx, 0, 0, 24, t);
  ctx.restore();

  // bow wave and wake
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const a = 0.5 + 0.5 * Math.sin(t * 5 + i);
    ctx.strokeStyle = `rgba(255,248,240,${0.5 - i * 0.08})`;
    ctx.lineWidth = 3 - i * 0.4;
    ctx.beginPath();
    ctx.moveTo(330 - i * 16, 4 + i * 3);
    ctx.quadraticCurveTo(372 + i * 8, -8 - a * 6, 390 + i * 18, 6 + i * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 14; i++) {
    const age = i / 14;
    const wx = -340 - age * 620 - 20 * Math.sin(t * 2 + i);
    ctx.strokeStyle = `rgba(255,248,240,${0.45 * (1 - age)})`;
    ctx.lineWidth = 2.5 * (1 - age) + 0.5;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(wx, 8 + side * age * 16);
      ctx.lineTo(wx - 50 - 30 * hash(i, 71), 8 + side * age * 20);
      ctx.stroke();
    }
  }

  // gulls riding along behind the stern
  for (let i = 0; i < 5; i++) {
    const r = 60 + 70 * hash(i, 80), sp = 0.6 + 0.5 * hash(i, 81), ph = hash(i, 82) * TAU;
    const gx = -680 + 300 * hash(i, 83) + r * Math.cos(t * sp + ph);
    const gy = -290 - 170 * hash(i, 84) + r * 0.35 * Math.sin(t * sp * 1.3 + ph);
    const gliding = Math.sin(t * 0.7 + i) > 0.3;
    gull(ctx, gx, gy, 0.75 + 0.35 * hash(i, 85), gliding ? 0.15 : Math.sin(t * (8 + 3 * hash(i, 86)) + i), Math.cos(t * sp + ph) < -0.2 ? -1 : 1, { shade: 0.15 + 0.2 * dusk });
  }
  const G = heroGull(t);
  gull(ctx, G.p[0], G.p[1], 1.5, G.flap, G.dir, { tilt: G.tilt, shade: 0.1 + 0.2 * dusk });
  if (G.carrying) simit(ctx, G.p[0] + 24, G.p[1] + 2, 7, 0.5, 0.8, 5);
  // crumbs
  const cf = t - T.grab;
  if (cf > 0 && cf < 1.4) {
    for (let i = 0; i < 9; i++) {
      const vx = (hash(i, 95) - 0.5) * 60, vy = -30 - 40 * hash(i, 96);
      disc(ctx, K.hold[0] - 6 + vx * cf, K.hold[1] + vy * cf + 160 * cf * cf, 1.4 + hash(i, 97), css([214, 150, 80], 1 - cf / 1.4));
    }
  }

  ctx.restore();
}

// ——— the frame ———

export function draw(ctx, t) {
  const C = sky(t);
  const cam = camera(t);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  applyCam(ctx, cam, 0.32);
  skyAndSun(ctx, t, C);
  city(ctx, t, C);
  water(ctx, t, C);
  maidensTower(ctx, 330, HY + 62, 0.95, css(mixRgb('#2a1a36', C[3], 0.1)), lit(t));
  // a few gulls far away
  for (let i = 0; i < 4; i++) {
    const x = ((hash(i, 90) * 2200 + t * (40 + 20 * i)) % 2600) - 300;
    gull(ctx, x, 260 + 90 * hash(i, 91) + 10 * Math.sin(t + i), 0.5, Math.sin(t * 7 + i * 2), 1, { shade: 0.4 });
  }
  ctx.restore();

  ctx.save();
  applyCam(ctx, cam, 1);
  ferry(ctx, t);
  ctx.restore();

  // ——— words ———
  vignette(ctx, W, H, 0.42);
  const title = fade(t, 0.8, 5, 1.1, 0.9);
  caption(ctx, 'Vapur', W / 2, 128, { size: 132, alpha: title, spacing: 2 });
  caption(ctx, 'CODE DRAWS ISTANBUL · NO. 1', W / 2, 212, { size: 24, alpha: title * 0.85, italic: false, weight: 600, spacing: 8, shadow: 0.4 });

  const card = smooth(seg(t, T.card, T.card + 0.9));
  if (card > 0) {
    ctx.fillStyle = `rgba(8,6,16,${0.6 * card})`;
    ctx.fillRect(0, 0, W, H);
    caption(ctx, 'Vapur', W / 2, H / 2 - 40, { size: 110, alpha: card });
    caption(ctx, 'The Ferry · İstanbul, kodla çizildi', W / 2, H / 2 + 44, { size: 34, alpha: card * 0.9 });
    caption(ctx, 'EVERY FRAME DRAWN IN JAVASCRIPT · MUSIC SYNTHESIZED IN THE BROWSER', W / 2, H / 2 + 108, {
      size: 17, alpha: card * 0.6, italic: false, weight: 600, spacing: 5, shadow: 0,
    });
  }
  grain(ctx, W, H, t, 0.06);
}

// ——— the music: Hicaz on D ———

const D4 = 62;
const hicaz = (d) => makamHz('hicaz', D4, d);

function line(S, t0, notes, o = {}) {
  let t = t0;
  for (const [d, len] of notes) {
    if (d !== null) S.ney(t, hicaz(d), { vel: 0.1, dur: len * 0.92, ...o });
    t += len;
  }
  return t;
}
const kanun = (S, t, d, o = {}) => S.pluck(t, hicaz(d), { wave: 'sawtooth', bend: 35, bright: 5, dur: 1.4, vel: 0.05, pan: -0.25, ...o });
const roll = (S, t, degs, step = 0.09, o = {}) => degs.forEach((d, i) => kanun(S, t + i * step, d, o));
const tremolo = (S, t, d, n = 10, o = {}) => { for (let i = 0; i < n; i++) kanun(S, t + i * 0.055, d, { vel: 0.035 * (1 - i / n) + 0.01, dur: 0.4, ...o }); };

export function score(S) {
  // the sea and the far city
  S.noise(0, { dur: 26, type: 'lowpass', f0: 420, q: 0.3, vel: 0.042, attack: 2, release: 2.5, lfo: [0.13, 0.6], send: 0.1 });
  S.noise(0, { dur: 26, type: 'bandpass', f0: 900, q: 0.5, vel: 0.02, attack: 3, release: 3, lfo: [0.21, 0.8], send: 0.25, pan: 0.2 });
  // the drone underneath everything
  S.pad(0, ['D2', 'A2', 'D3'], { dur: 23.5, vel: 0.07, attack: 3, release: 3, cutoff: 480 });

  // the ferry announces itself
  S.horn(0.3, { dur: 1.15, vel: 0.24, f: 92 });
  S.horn(1.75, { dur: 0.7, vel: 0.2, f: 92 });
  for (const [tt, f, v] of [[2.5, 1450, 0.018], [2.95, 1350, 0.015], [6.4, 1600, 0.025], [6.8, 1500, 0.02], [9.9, 1550, 0.022], [12.2, 1650, 0.028], [19.6, 1500, 0.02]]) S.gull(tt, { f, vel: v, pan: 0.3 * Math.sin(tt) });

  // phrase A: the old city at sunset
  roll(S, 3.2, [0, 2, 4, 7], 0.11, { vel: 0.045 });
  line(S, 3.4, [[4, 0.9], [5, 0.35], [4, 0.35], [3, 0.35], [2, 0.9], [3, 0.45], [4, 1.7]]);
  tremolo(S, 7.7, 4, 12);
  // phrase B: coming down to the tonic
  roll(S, 9.3, [0, 4, 7, 9], 0.1, { vel: 0.045 });
  line(S, 9.4, [[7, 0.8], [6, 0.4], [5, 0.4], [4, 0.8], [3, 0.35], [2, 0.35], [1, 0.5], [0, 1.3]]);

  // the child and the gull: the kanun gets playful
  const quick = [3, 4, 5, 4, 3, 2, 3, 4, 5, 6, 5, 4];
  quick.forEach((d, i) => kanun(S, 13.4 + i * 0.16, d + 7, { vel: 0.045, dur: 0.8, pan: 0.1 }));
  S.gull(T.grab - 0.05, { f: 1750, dur: 0.5, vel: 0.05, pan: -0.2 });
  S.gull(T.grab + 0.45, { f: 1550, dur: 0.4, vel: 0.035, pan: -0.3 });
  S.bell(T.grab, hicaz(14), { vel: 0.06, dur: 2 });
  tremolo(S, T.grab + 0.1, 11, 14, { pan: 0.2 });

  // phrase C: the lights come on
  roll(S, 17.4, [0, 2, 4, 7, 9], 0.1, { vel: 0.04 });
  line(S, 17.6, [[2, 0.6], [3, 0.6], [4, 0.9], [5, 0.5], [4, 0.5], [3, 0.5], [2, 0.6], [1, 0.5], [0, 2.4]], { vel: 0.095 });
  for (let i = 0; i < 9; i++) S.bell(T.lights + 0.5 + i * 0.55 + 0.2 * hash(i, 1), hicaz(14 + [0, 2, 4, 7, 4, 2, 7, 9, 11][i]), { vel: 0.018, dur: 1.6, pan: (hash(i, 2) - 0.5) * 1.2 });

  // far away, the next ferry
  S.horn(23.3, { dur: 1.4, vel: 0.12, f: 92, cutoff: 420 });
  roll(S, 23.4, [0, 4, 7, 9, 11, 14], 0.12, { vel: 0.05, dur: 2.2 });
}
