// Code Draws Istanbul · No. 1 — Vapur (the ferry).
// Sunset over the old city. A ferry crosses; the gulls follow it for simit.
// No words on screen: the story is told in pictures and sound.
// Every frame is painted from nothing as a pure function of time t.
import { TAU, clamp, lerp, seg, smooth, easeIn, easeInOut, hash, noise, curve, mixRgb, css, keyColor } from '../../engine/util.js';
import { glow, disc, grain, vignette, reach, joint } from '../../engine/draw.js';
import { mosque, galata, maidensTower, roofs, gull, simit, tea, flag, person, makamHz } from '../kit.js';

export const meta = {
  title: 'Vapur',
  logline: 'Sunset over the old city. A ferry crosses the Bosphorus, and the gulls follow it for simit.',
  duration: 26,
  width: 1920,
  height: 1080,
  cover: 22.7,
  poster: 15.79,
  mix: { reverb: 3.2, wet: 0.34 },
};

const W = 1920, H = 1080, HY = 640;
const T = { toss1: 13.1, take: 14.25, grab: 15.8, turn: 16.0, give: 17.6, bite: 18.0, lights: 16.5, horn: 20.9, answer: 22.3, fade: 24.3 };
const FERRY_Y = 884;
const ferryX = (t) => -1100 + 118 * t;
const bump = (t, a, b, c, d) => smooth(seg(t, a, b)) * (1 - smooth(seg(t, c, d)));
const mixP = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const minus = (a, b) => [a[0] - b[0], a[1] - b[1]];

// ——— light over time ———

const SKY = [
  [[0, '#34356f'], [22, '#1b1f4c']],
  [[0, '#b85f7c'], [22, '#5e3f72']],
  [[0, '#f29a5c'], [22, '#c96b6c']],
  [[0, '#ffd27c'], [22, '#eea277']],
];
const sky = (t) => SKY.map((stops) => keyColor(stops, t));
const lit = (t) => smooth(seg(t, T.lights, 21.5));

// ——— camera: wide, then close on the stern deck, then wide again ———

const closeK = (t) => smooth(seg(t, 10.0, 12.8)) * (1 - smooth(seg(t, 18.1, 20.6)));

function camera(t) {
  const fx = ferryX(t);
  const k = closeK(t);
  const wide = [960 + 70 * smooth(seg(t, 3, 24)), 552];
  const close = [fx - 236, FERRY_Y - 200];
  return { x: lerp(wide[0], close[0], k), y: lerp(wide[1], close[1], k), z: Math.exp(lerp(0, Math.log(3.3), k)) };
}

function applyCam(ctx, cam, depth) {
  const z = 1 + (cam.z - 1) * depth;
  ctx.translate(W / 2, H / 2);
  ctx.scale(z, z);
  ctx.translate(-(W / 2 + (cam.x - W / 2) * depth), -(H / 2 + (cam.y - H / 2) * depth));
}

// ——— the sky ———

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
  moon(ctx, t);

  // the sun, setting behind Süleymaniye: its upper half shows over the dome's shoulder, then it sinks behind it
  const sy = sunY(t);
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

const sunY = (t) => lerp(360, 640, easeInOut(seg(t, 0, 16)));

/** A young crescent moon over the old city at dusk, with the evening star below it. */
function moon(ctx, t) {
  const k = smooth(seg(t, 17.2, 21));
  if (k <= 0) return;
  const mx = 640, my = 196, r = 21;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, mx + 6, my + 6, 150, [255, 226, 196], 0.14 * k);
  glow(ctx, mx + 88, my + 58, 26, [255, 250, 235], 0.5 * k);
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(mx, my, r, 0, TAU);
  ctx.clip();
  ctx.fillStyle = css([255, 244, 222], 0.95 * k);
  ctx.beginPath();
  ctx.rect(mx - r - 2, my - r - 2, 2 * r + 4, 2 * r + 4);
  ctx.arc(mx - r * 0.42, my - r * 0.34, r * 0.94, 0, TAU);
  ctx.fill('evenodd');
  ctx.restore();
  disc(ctx, mx + 88, my + 58, 2.6, css([255, 250, 238], k));
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
  // seen from Üsküdar: the Blue Mosque (six minarets), Hagia Sophia (four), then Süleymaniye
  mosque(ctx, 250, hill(250) + 8, 72, far, { minarets: 6, lit: L });
  mosque(ctx, 590, hill(590) + 8, 66, far, { minarets: 4, lit: L });
  mosque(ctx, 1080, hill(1080) + 8, 88, far, { minarets: 4, lit: L });
  mosque(ctx, 1400, HY - 16, 52, near, { minarets: 2, lit: L, halls: false });

  // floodlight haze on the domes at night
  if (L > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const [x, r] of [[250, 72], [590, 66], [1080, 88], [1400, 52], [1760, 40]]) glow(ctx, x, hill(x) - r * 1.2, r * 3, [255, 190, 120], 0.12 * L);
    ctx.restore();
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

  // the sun's road on the water, with a few hard glints
  const sunK = 1 - smooth(seg(t, 14, 20));
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
    // hard glints: tiny four-point sparkles, only in the bright upper part of the road
    for (let i = 0; i < 12; i++) {
      const life = (t * (0.7 + 0.5 * hash(i, 11)) + hash(i, 12)) % 1;
      const y = HY + 6 + 250 * hash(i, 13) ** 1.4;
      const depth = clamp((y - HY) / (H - HY));
      const x = 1150 + (hash(i, 14) - 0.5) * (24 + 110 * depth);
      const a = sunK * Math.sin(life * Math.PI) ** 3;
      if (a > 0.02) sparkle(ctx, x, y, (3 + 7 * depth) * (0.6 + 0.4 * a), css([255, 240, 210], 0.9 * a));
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

/** A four-point glint on the water, wider than it is tall. */
function sparkle(ctx, x, y, r, fill) {
  const q = r * 0.14;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.lineTo(x - q, y - q);
  ctx.lineTo(x, y - r * 0.55);
  ctx.lineTo(x + q, y - q);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + q, y + q);
  ctx.lineTo(x, y + r * 0.55);
  ctx.lineTo(x - q, y + q);
  ctx.closePath();
  ctx.fill();
}

// ——— life on the water, far and middle distance ———

const CREAM = [222, 214, 228], SHADE = [168, 158, 188], RIM = [255, 214, 164], WIN = [255, 208, 140];

/** The ferry's outline in its own units (bow to the right), for the far ferry. */
function ferryOutline(ctx, body, funnel, windows) {
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-356, -60);
  ctx.lineTo(292, -62);
  ctx.quadraticCurveTo(356, -64, 376, -82);
  ctx.quadraticCurveTo(366, -24, 334, 8);
  ctx.lineTo(-334, 8);
  ctx.quadraticCurveTo(-356, -12, -356, -60);
  ctx.fill();
  ctx.fillRect(-320, -126, 572, 70);
  ctx.fillRect(50, -182, 196, 60);
  ctx.beginPath();
  ctx.moveTo(250, -60);
  ctx.lineTo(250, -101);
  ctx.quadraticCurveTo(330, -101, 378, -108);
  ctx.lineTo(376, -80);
  ctx.fill();
  ctx.fillStyle = funnel;
  ctx.beginPath();
  ctx.moveTo(-64, -124);
  ctx.lineTo(-48, -224);
  ctx.lineTo(6, -224);
  ctx.lineTo(-6, -124);
  ctx.fill();
  if (windows) {
    ctx.fillStyle = windows;
    ctx.fillRect(-306, -106, 544, 20);
    ctx.fillRect(62, -166, 170, 18);
  }
}

/** Another ferry, far off along the other shore, comes in from the left at dusk and answers our horn. */
function farFerry(ctx, t, C) {
  const x = -40 + 44 * (t - 8), y = HY + 20 + 0.6 * Math.sin(t * 1.1);
  if (x < -300) return;
  const L = smooth(seg(t, 15, 20));
  const dusk = seg(t, 10, 22);
  const s = 0.17;
  const a = t - T.answer;
  ctx.save();
  ctx.translate(x, y);
  // its reflection and the glow of its windows on the water
  ctx.fillStyle = css([28, 18, 40], 0.22);
  ctx.fillRect(-60, 1.5, 124, 6);
  if (L > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let j = 0; j < 4; j++) {
      ctx.fillStyle = css(WIN, 0.35 * L * (1 - j / 4));
      ctx.fillRect(-47 + 2 * Math.sin(t * 2 + j), 3 + j * 4, 94 - j * 10, 1.6);
    }
    glow(ctx, 0, -12, 90, [255, 200, 130], 0.12 * L);
    ctx.restore();
  }
  ctx.save();
  ctx.scale(s, s);
  const body = css(mixRgb(mixRgb(CREAM, C[3], 0.42), [80, 60, 110], 0.45 * dusk));
  const funnel = css(mixRgb(mixRgb([232, 192, 102], C[3], 0.4), [90, 70, 100], 0.5 * dusk));
  ferryOutline(ctx, body, funnel, L > 0 ? css(WIN, 0.25 + 0.75 * L) : null);
  ctx.strokeStyle = body;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(200, -182);
  ctx.lineTo(206, -262);
  ctx.stroke();
  ctx.restore();
  // its mast light, which flares as it answers our horn
  const blink = a > 0 ? smooth(seg(a, 0, 0.12)) * (1 - smooth(seg(a, 1.1, 1.6))) : 0;
  const mast = [206 * s, -266 * s];
  disc(ctx, mast[0], mast[1], 1.6 + 1.2 * blink, css([255, 240, 214], 0.4 + 0.3 * L + 0.3 * blink));
  if (blink > 0 || L > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, mast[0], mast[1], 22 + 30 * blink, [255, 230, 190], 0.25 * L + 0.6 * blink);
    ctx.restore();
  }
  ctx.restore();
  // a white puff of steam from its whistle as it answers
  if (a > 0 && a < 2.4) {
    for (let k = 0; k < 7; k++) {
      const age = a - k * 0.14;
      if (age < 0 || age > 1.4) continue;
      disc(ctx, x + 1 - 16 * age, y - 41 - 26 * age, 5 + 15 * age, css([255, 246, 236], 0.55 * (1 - age / 1.4)));
    }
  }
}

/** A fisherman in his rowing boat, silhouetted in the sun's road; his lantern comes on at dusk.
 *  He sits low and close, so the ferry's hull hides him completely as it passes. */
function fishingBoat(ctx, t, C) {
  const x = 1085, wl = HY + 220, S = 1.15;
  const lamp = smooth(seg(t, 14.5, 18.5));
  const sil = css(mixRgb('#24162c', C[3], 0.08));
  // the ferry's wake reaches him after it passes, and rocks the boat for a while
  const wake = bump(t, 22.3, 22.9, 24.2, 25.8);
  const bob = 1.6 * Math.sin(t * 1.6) + 2.2 * wake * Math.sin(t * 3.1), roll = 0.04 * Math.sin(t * 1.25 + 1) + 0.09 * wake * Math.sin(t * 2.7 + 0.6);
  ctx.save();
  ctx.translate(x, wl);
  ctx.scale(S, S);
  if (lamp > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let j = 0; j < 7; j++) {
      const w = (12 - j) * (0.6 + 0.4 * Math.sin(t * 2.4 + j));
      ctx.fillStyle = css([255, 200, 120], 0.4 * lamp * (1 - j / 7));
      ctx.fillRect(30 - w / 2 + 2 * Math.sin(t * 1.7 + j), 7 + j * 5, w, 1.8);
    }
    ctx.restore();
  }
  ctx.translate(0, bob);
  ctx.rotate(roll);
  ctx.fillStyle = css([20, 12, 30], 0.3);
  ctx.beginPath();
  ctx.ellipse(0, 5, 46, 5, 0, 0, TAU);
  ctx.fill();
  // the rod and line
  const jig = 0.04 * Math.sin(t * 1.3) + 0.12 * Math.max(0, Math.sin(t * 0.8 + 2)) ** 10;
  const a = -2.42 - jig;
  const butt = [4, -17];
  const tip = [butt[0] + Math.cos(a) * 74, butt[1] + Math.sin(a) * 74];
  ctx.strokeStyle = sil;
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(butt[0], butt[1]);
  ctx.quadraticCurveTo(butt[0] + Math.cos(a) * 40, butt[1] + Math.sin(a) * 40 + 4, tip[0], tip[1]);
  ctx.stroke();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = css(mixRgb(C[3], [255, 255, 255], 0.3), 0.55);
  ctx.beginPath();
  ctx.moveTo(tip[0], tip[1]);
  ctx.quadraticCurveTo(tip[0] - 6, tip[1] + 40, tip[0] - 4, 8 - bob);
  ctx.stroke();
  // hull: a low kayık with raised ends
  ctx.fillStyle = sil;
  ctx.beginPath();
  ctx.moveTo(-48, -13);
  ctx.quadraticCurveTo(-30, -5, 0, -5);
  ctx.quadraticCurveTo(30, -5, 46, -14);
  ctx.quadraticCurveTo(40, 2, 26, 4);
  ctx.lineTo(-28, 4);
  ctx.quadraticCurveTo(-42, 2, -48, -13);
  ctx.fill();
  // the fisherman, sitting, cap on
  ctx.beginPath();
  ctx.roundRect(6, -30, 14, 26, 6);
  ctx.fill();
  disc(ctx, 12, -35, 5.5, sil);
  ctx.beginPath();
  ctx.ellipse(12, -38, 6.5, 3, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillRect(3, -38, 6, 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = sil;
  ctx.beginPath();
  ctx.moveTo(10, -24);
  ctx.lineTo(4, -17);
  ctx.stroke();
  // warm rim light on the gunwale while the sun is up
  ctx.strokeStyle = css([255, 196, 140], 0.55 * (1 - seg(t, 17, 21)));
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-46, -13);
  ctx.quadraticCurveTo(-30, -6, 0, -6);
  ctx.quadraticCurveTo(30, -6, 44, -14);
  ctx.stroke();
  // lantern on its pole at the stern
  ctx.strokeStyle = sil;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(30, -6);
  ctx.lineTo(31, -30);
  ctx.stroke();
  ctx.fillStyle = sil;
  ctx.fillRect(28, -38, 7, 9);
  if (lamp > 0) {
    ctx.fillStyle = css([255, 222, 150], lamp);
    ctx.fillRect(29.2, -36.5, 4.6, 6);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 31.5, -33, 46, [255, 190, 110], 0.55 * lamp * (0.9 + 0.1 * Math.sin(t * 9)));
    ctx.restore();
  }
  ctx.restore();
}

/** A dolphin, side view, nose along +x. */
function dolphin(ctx, x, y, ang, s, body, belly, rim) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(s, s);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(36, 1.5);
  ctx.quadraticCurveTo(33, -1, 26, -3);
  ctx.quadraticCurveTo(22, -9, 8, -9);
  ctx.quadraticCurveTo(-14, -8, -28, -2);
  ctx.lineTo(-31, 0);
  ctx.quadraticCurveTo(-16, 6, 6, 7.5);
  ctx.quadraticCurveTo(24, 7, 30, 3);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(4, -8.5);
  ctx.quadraticCurveTo(-2, -18, -9, -19);
  ctx.quadraticCurveTo(-7, -12, -11, -7.5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-28, -1);
  ctx.quadraticCurveTo(-36, -9, -41, -9);
  ctx.quadraticCurveTo(-37, 0, -41, 8);
  ctx.quadraticCurveTo(-36, 7, -28, 1);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(14, 5);
  ctx.quadraticCurveTo(8, 12, 4, 14);
  ctx.quadraticCurveTo(6, 8, 6, 5);
  ctx.fill();
  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.moveTo(32, 2.5);
  ctx.quadraticCurveTo(20, 6.5, 2, 6.8);
  ctx.quadraticCurveTo(-12, 5.5, -22, 2);
  ctx.quadraticCurveTo(-4, 3, 30, 1.5);
  ctx.fill();
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(26, -3.4);
  ctx.quadraticCurveTo(22, -9.4, 8, -9.4);
  ctx.quadraticCurveTo(-8, -9, -18, -5.5);
  ctx.stroke();
  disc(ctx, 25, -1.5, 1.1, '#1a1622');
  ctx.restore();
}

// [start time, x where it breaks the surface, which dolphin]: a pair leaping side by side, the far one first in the list so it is drawn behind
const LEAPS = [[5.18, 1285, 1], [5.1, 1330, 0], [6.33, 1425, 1], [6.25, 1470, 0]];

/** A pair of Bosphorus dolphins arcing out of the water. */
function dolphins(ctx, t, C) {
  const bodies = [css(mixRgb([66, 72, 104], C[1], 0.25)), css(mixRgb([52, 54, 84], C[1], 0.3))];
  const bellies = [css(mixRgb([214, 196, 206], C[3], 0.3)), css(mixRgb([176, 158, 176], C[3], 0.3))];
  const rim = css([255, 200, 150], 0.7);
  const foam = [255, 246, 238];
  const span = 150, height = 54, dur = 0.95;
  for (const [t0, x0, who] of LEAPS) {
    const u = (t - t0) / dur;
    if (u < -0.4 || u > 2.6) continue;
    const wl = HY + 150 - who * 10;
    // rings where it breaks the surface and where it dives back in
    ctx.lineWidth = 1.4;
    for (const [ux, xc] of [[0, x0 + 6], [1, x0 + span - 6]]) {
      const age = (u - ux) * dur;
      if (age < 0 || age > 1.6) continue;
      const k = age / 1.6;
      ctx.strokeStyle = css(foam, 0.5 * (1 - k));
      ctx.beginPath();
      ctx.ellipse(xc, wl + 1, 10 + 40 * k, 2 + 5 * k, 0, 0, TAU);
      ctx.stroke();
      if (age < 0.6) {
        for (let i = 0; i < 7; i++) {
          const vx = (hash(i + ux * 7, 150) - 0.5) * 70 + (ux ? -10 : 20), vy = -60 - 70 * hash(i + ux * 7, 151);
          disc(ctx, xc + vx * age, wl + vy * age + 300 * age * age, 1.6 + hash(i, 152), css(foam, 0.8 * (1 - age / 0.6)));
        }
      }
    }
    if (u > 1.45) continue;
    const x = x0 + span * u, y = wl - height * Math.sin(Math.PI * u);
    const ang = Math.atan2(-height * Math.PI * Math.cos(Math.PI * u), span);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 100, wl - 200, 200, 200);
    ctx.clip();
    dolphin(ctx, x, y, ang, who ? 1.16 : 1.22, bodies[who], bellies[who], rim);
    ctx.restore();
  }
}

/** The opening: a loose V of gulls crossing the low sun, just above the dome. */
function sunGulls(ctx, t, C) {
  const F = [[0, 0, 1.5], [74, -34, 1.3], [80, 36, 1.36], [158, -62, 1.18], [166, 62, 1.24], [250, -14, 1.1]];
  const body = mixRgb([250, 236, 228], C[2], 0.25), wing = mixRgb([196, 182, 200], C[1], 0.25);
  for (let i = 0; i < F.length; i++) {
    const [dx, dy, s] = F[i];
    const x = 1150 - 235 * (t - 2.45) + dx + 6 * Math.sin(t * 1.3 + i);
    if (x < -120 || x > 2100) continue;
    const y = 352 + dy + 6 * Math.sin(t * 1.9 + i * 1.7);
    const glide = Math.sin(t * 0.9 + i * 1.3) > 0.35;
    gull(ctx, x, y, s, glide ? 0.2 : Math.sin(t * 7.5 + i * 1.3), -1, { body, wing, tip: '#3a2a36', shade: 0.28, tilt: 0.04 * Math.sin(t + i) });
  }
}

// ——— the ferry and its people ———

const DECK = -124;
const KID = { x: -262, h: 70 }, GRAN = { x: -214, h: 102, lean: 0.06 }, MOM = { x: -153, h: 94 }, CAY = { h: 98, lean: 0.04 };

/** Where a person's hand really ends up (the rig clamps it to arm's length), in ferry coordinates. */
function handWorld(px, dir, h, target, lean = 0, far = false, bob = 0) {
  const hipY = DECK - h * 0.5 + bob;
  const s0 = [Math.sin(lean) * h * 0.32 + (far ? -h * 0.01 : h * 0.01), -Math.cos(lean) * h * 0.32 + h * 0.02];
  const hand = reach(s0, target, h * 0.36);
  return [px + dir * hand[0], hipY + hand[1]];
}
const toLocal = (px, dir, h, bob = 0) => (w) => [(w[0] - px) * dir, w[1] - (DECK - h * 0.5 + bob)];

/** A flat-animation turn: the figure squashes to a sliver and opens out facing the other way. */
const turnSquash = (t, at, half = 0.06) => Math.max(0.12, Math.abs(Math.cos(Math.PI * seg(t, at - half, at + half))));

// the child at the stern rail: he holds his simit up to the gulls, loses it, spins round after the thief,
// laughs and points, and then grandpa gives him his own simit
const kidLocalL = toLocal(KID.x, -1, KID.h);
const GIVE_KID = [16, -26];
// after the turn he faces grandpa: [t, near hand x, y, far hand x, y, look, lean] (hand targets relative to the hips)
const KID_KEYS = [
  [T.turn, 10, -44, 4, 3, 0.9, 0],
  [16.12, 16, -37, -14, -35, 0.95, -0.08],
  [16.4, 16, -38, -14, -36, 0.95, -0.08],
  [16.62, 19, -37, 4, -5, 0.7, -0.04],
  [17.1, 19, -37, 4, -5, 0.6, -0.04],
  [17.48, GIVE_KID[0], GIVE_KID[1], 3, -2, -0.05, 0.03],
  [T.give + 0.02, GIVE_KID[0], GIVE_KID[1], 3, -2, -0.05, 0.03],
  [17.95, 7, -25, 3, -2, 0.05, 0.01],
  [18.12, 7, -25, 3, -2, 0, 0.01],
  [18.5, 11, -13, 3, -2, 0.1, 0],
];
function kidPose(t) {
  if (t < T.turn) {
    const reachUp = smooth(seg(t, 14.1, 14.7));
    const hold = [-272 - 3 * Math.sin(t * 3), -203 - 2 * Math.sin(t * 2.2)];
    const restA = [KID.x - 10, DECK - 36], restB = [KID.x - 4, DECK - 32];
    const A = mixP(restA, hold, reachUp);
    A[0] -= 10 * Math.sin(reachUp * Math.PI);
    const look = Math.max(0.8 * reachUp, 0.7 * bump(t, 12.9, 13.3, 13.9, 14.3));
    return { dir: -1, A: kidLocalL(A), B: kidLocalL(restB), look, lean: 0, happy: 0 };
  }
  const [ax, ay, bx, by, look, lean] = curve(KID_KEYS, t);
  const laugh = bump(t, 16.45, 16.6, 17.0, 17.2), chew = bump(t, 18.15, 18.3, 19.2, 19.6);
  return {
    dir: 1, A: [ax, ay], B: [bx, by],
    look: look + 0.06 * Math.sin(t * 11) * chew, lean: lean + 0.035 * Math.sin(t * 18) * laugh,
    happy: smooth(seg(t, 16.35, 16.55)),
  };
}
const kidHand = (t) => {
  const P = kidPose(t);
  return handWorld(KID.x, P.dir, KID.h, P.A, P.lean);
};
/** The child's own simit, held up for the gulls (until the snatch). */
const kidSimit = (t) => {
  const h = kidHand(t);
  return [h[0] - 1, h[1] - 5];
};

// grandpa tears a piece off his simit and throws it to the gulls; later he gives the rest to the child
const TOSSES = [{ t: T.toss1, v: [-120, -250], fly: 0.45 }];
const GRAV = 560;
const RELEASE_AT = [29, -41];
const GRAN_KEYS = [[0, 12, -9]];
for (const { t: tr } of TOSSES) GRAN_KEYS.push([tr - 0.75, 12, -9], [tr - 0.5, 9, -13], [tr - 0.22, 3, 6], [tr, ...RELEASE_AT], [tr + 0.25, 27, -36], [tr + 0.85, 12, -9]);
const RELEASE = handWorld(GRAN.x, -1, GRAN.h, RELEASE_AT, GRAN.lean);
const piecePos = (i, t) => {
  const s = TOSSES[i], k = t - s.t;
  return [RELEASE[0] + s.v[0] * k, RELEASE[1] + s.v[1] * k + 0.5 * GRAV * k * k];
};
const pieceVel = (i, t) => [TOSSES[i].v[0], TOSSES[i].v[1] + GRAV * (t - TOSSES[i].t)];
// the hand-over: the simit's centre at the moment the child takes it, and grandpa's far hand there
const GIVE_AT = (() => {
  const k = handWorld(KID.x, 1, KID.h, GIVE_KID, 0.03);
  return [k[0] + 4, k[1] - 1];
})();
const GIVE_GRAN = toLocal(GRAN.x, -1, GRAN.h)([GIVE_AT[0] + 2, GIVE_AT[1] + 1]);
const GRAN_FAR = [[0, 10, -12], [17.05, 10, -12], [17.45, ...GIVE_GRAN], [T.give + 0.04, ...GIVE_GRAN], [18.1, 9, -7]];
/** Grandpa's simit: in his far hand, then in the child's near hand. */
const granSimit = (t) => {
  if (t < T.give) {
    const g = handWorld(GRAN.x, -1, GRAN.h, curve(GRAN_FAR, t), GRAN.lean, true);
    return [g[0] - 2, g[1] - 1];
  }
  const k = kidHand(t);
  return [k[0] + 4, k[1] - 1];
};

/** A torn-off piece of simit: a short thick arc with sesame, rimmed with light so it reads in the air. */
function crumb(ctx, x, y, rot, s = 1, vel = null) {
  ctx.lineCap = 'round';
  if (vel) {
    const sp = Math.hypot(vel[0], vel[1]) || 1;
    const g = ctx.createLinearGradient(x - (vel[0] / sp) * 26, y - (vel[1] / sp) * 26, x, y);
    g.addColorStop(0, 'rgba(255,236,200,0)');
    g.addColorStop(1, 'rgba(255,236,200,0.45)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x - (vel[0] / sp) * 26, y - (vel[1] / sp) * 26);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.strokeStyle = 'rgba(255,238,206,0.95)';
  ctx.lineWidth = 8.6;
  ctx.beginPath();
  ctx.arc(0, 0, 8, -0.6, 0.9);
  ctx.stroke();
  ctx.strokeStyle = '#b8682c';
  ctx.lineWidth = 6.5;
  ctx.stroke();
  ctx.strokeStyle = '#d9914a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 9.2, -0.45, 0.7);
  ctx.stroke();
  for (const [a, d] of [[-0.35, 8.8], [0.1, 7.2], [0.5, 9], [0.75, 7.4]]) disc(ctx, Math.cos(a) * d, Math.sin(a) * d, 0.8, '#f7e4b3');
  ctx.restore();
}

/** A simit with a bite taken out of the side facing (bx, by). */
function bittenSimit(ctx, x, y, r, rot, squash, seed, bite, bx, by) {
  if (bite <= 0) return simit(ctx, x, y, r, rot, squash, seed);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - r * 2, y - r * 2, r * 4, r * 4);
  ctx.arc(x + bx * r * 1.02, y + by * r * 1.02, r * 0.5 * bite, 0, TAU);
  ctx.clip('evenodd');
  simit(ctx, x, y, r, rot, squash, seed);
  ctx.restore();
}

// the çaycı walks out from behind the funnel with his hanging tray, and back again
const CAY_KEYS = [[12.5, -16], [13.7, -106], [17.7, -106], [18.9, -36]];
const CAY_TURN = 17.7;
function cayci(t) {
  const x = curve(CAY_KEYS, t)[0];
  const v = (curve(CAY_KEYS, t + 0.02)[0] - curve(CAY_KEYS, t - 0.02)[0]) / 0.04;
  const acc = (curve(CAY_KEYS, t + 0.04)[0] - 2 * x + curve(CAY_KEYS, t - 0.04)[0]) / 0.0016;
  const back = t >= CAY_TURN;
  const dir = back ? 1 : -1;
  const walked = back ? 90 + (x + 106) : -16 - x;
  const ph = walked * (3 * Math.PI / 90);
  // the stride shrinks with his speed, so his feet come together as he stops
  const stride = clamp(Math.abs(v) / 60);
  const bob = -CAY.h * 0.01 * Math.cos(ph * 2) * stride;
  const offer = bump(t, 13.75, 14.0, 14.4, 14.7);
  // he tucks the tray in against himself to turn round
  const tuck = bump(t, CAY_TURN - 0.3, CAY_TURN - 0.06, CAY_TURN + 0.06, CAY_TURN + 0.3);
  const sx = turnSquash(t, CAY_TURN);
  const handT = [18 + 3 * offer - 9 * tuck, -20 - 7 * offer + 7 * tuck];
  const raw = handWorld(x, dir, CAY.h, handT, CAY.lean, false, bob);
  const hand = [x + (raw[0] - x) * sx, raw[1]];
  const stop = Math.max(0, t - 13.7);
  const swing = 0.05 * Math.sin(ph * 2) * stride - 0.00022 * acc + (t > 13.7 && t < CAY_TURN ? 0.05 * Math.sin(stop * 6.5) * Math.exp(-stop * 2.6) : 0);
  return { x, dir, ph, stride, bob, sx, handT, hand, swing, look: 0.25 * bump(t, 15.3, 15.6, 16.6, 16.9) };
}

/** One of the çaycı's legs, drawn here so the stride can die away smoothly as he stops. */
function cayLeg(ctx, c, isFar) {
  const h = CAY.h;
  const a = isFar ? c.ph + Math.PI : c.ph;
  const rest = isFar ? -h * 0.03 : h * 0.05;
  const f = [lerp(rest, h * 0.14 * Math.cos(a), c.stride), -h * 0.055 * Math.max(0, Math.sin(a)) * c.stride];
  const hip = [0, -h * 0.5 + c.bob];
  const knee = joint(hip, [f[0], f[1] - h * 0.03], h * 0.25, h * 0.24, -1);
  const pants = isFar ? css(mixRgb('#2f2b38', [20, 18, 26], 0.22)) : '#2f2b38';
  const shoes = isFar ? css(mixRgb('#2a2224', [20, 18, 26], 0.22)) : '#2a2224';
  ctx.save();
  ctx.translate(c.x, DECK);
  ctx.scale(c.dir * c.sx, 1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = pants;
  ctx.lineWidth = h * 0.085;
  ctx.beginPath();
  ctx.moveTo(hip[0], hip[1]);
  ctx.lineTo(knee[0], knee[1]);
  ctx.lineTo(f[0], f[1] - h * 0.03);
  ctx.stroke();
  ctx.fillStyle = shoes;
  ctx.beginPath();
  ctx.roundRect(f[0] - h * 0.03, f[1] - h * 0.035, h * 0.085, h * 0.035, h * 0.012);
  ctx.fill();
  if (!isFar) {
    ctx.lineWidth = h * 0.13;
    ctx.beginPath();
    ctx.moveTo(hip[0], hip[1] - h * 0.02);
    ctx.lineTo(hip[0], hip[1] + h * 0.02);
    ctx.stroke();
  }
  ctx.restore();
}

const TRAY_L = 19, TRAY_GLASSES = [-11, 0, 11];
const trayGlass = (c, i) => {
  const gx = TRAY_GLASSES[i], gy = TRAY_L - 1.5;
  return [c.hand[0] + gx * Math.cos(c.swing) + gy * Math.sin(c.swing), c.hand[1] - gx * Math.sin(c.swing) + gy * Math.cos(c.swing)];
};

function tray(ctx, c, t, taken) {
  ctx.save();
  ctx.translate(c.hand[0], c.hand[1]);
  ctx.rotate(-c.swing);
  ctx.strokeStyle = '#b89a5a';
  ctx.lineWidth = 0.9;
  ctx.setLineDash([1.6, 1.2]);
  ctx.beginPath();
  for (const ex of [-16, 16, 3]) {
    ctx.moveTo(0, -2);
    ctx.lineTo(ex, TRAY_L - (ex === 3 ? 2 : 0));
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#d8bd78';
  ctx.beginPath();
  ctx.arc(0, -4.5, 3, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 3; i++) if (!(i === 0 && taken)) tea(ctx, TRAY_GLASSES[i], TRAY_L - 1.5, 0.3, t + i, 0);
  ctx.fillStyle = '#c9ab66';
  ctx.beginPath();
  ctx.ellipse(0, TRAY_L + 0.5, 18, 2.6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f0dc9c';
  ctx.fillRect(-18, TRAY_L - 0.6, 36, 1.2);
  ctx.restore();
}

// the mother takes a glass of tea and stirs it
function momHands(t, c) {
  const L = toLocal(MOM.x, 1, MOM.h);
  const idleN = [13, -3], idleF = [11, -5], holdN = [15, -14];
  const reachK = smooth(seg(t, 13.95, T.take)), backK = smooth(seg(t, T.take, T.take + 0.4));
  const glass = L(trayGlass(c, 0));
  const near = t < T.take ? mixP(idleN, [glass[0], glass[1] + 1], reachK) : mixP([glass[0], glass[1] + 1], holdN, backK);
  const stir = bump(t, 14.6, 14.75, 15.2, 15.45);
  const w = t * 13;
  const far = mixP(idleF, [16 + 1.8 * Math.cos(w), -25 + 0.8 * Math.sin(w)], stir);
  return { near, far, stir };
}

/** A headscarf in profile that frames the face, for a person drawn with the kit's rig. */
function headscarf(ctx, px, dir, h, lean, look, color, dots) {
  const sh = [Math.sin(lean) * h * 0.32, -h * 0.5 - Math.cos(lean) * h * 0.32];
  const neck = [sh[0] + Math.sin(lean) * h * 0.04, sh[1] - Math.cos(lean) * h * 0.04];
  const r = h * 0.074;
  ctx.save();
  ctx.translate(px, DECK);
  ctx.scale(dir, 1);
  ctx.translate(neck[0] + h * 0.012, neck[1] - h * 0.062);
  ctx.rotate(lean * 0.4 - look * 0.25);
  ctx.scale(r, r);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0.5, -0.92);
  ctx.quadraticCurveTo(0, -0.2, 0.42, 1.0);
  ctx.quadraticCurveTo(0.3, 1.45, -0.1, 1.55);
  ctx.quadraticCurveTo(-0.9, 1.95, -1.4, 1.6);
  ctx.quadraticCurveTo(-1.32, 0.6, -1.12, -0.1);
  ctx.bezierCurveTo(-1.05, -1.28, 0.2, -1.38, 0.5, -0.92);
  ctx.fill();
  ctx.strokeStyle = 'rgba(80,30,30,0.35)';
  ctx.lineWidth = 0.16;
  ctx.beginPath();
  ctx.moveTo(0.46, -0.86);
  ctx.quadraticCurveTo(0.06, -0.2, 0.4, 0.95);
  ctx.stroke();
  ctx.fillStyle = dots;
  for (const [dx, dy] of [[-0.55, -0.7], [-0.9, 0.1], [-0.3, 0.2], [-0.75, 1.1], [0, -1.05], [-0.2, 1.3]]) {
    ctx.beginPath();
    ctx.arc(dx, dy, 0.1, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** The far side of the upper deck: a low bulkhead with the wooden slatted benches of the old vapurs along it. */
function deckBackdrop(ctx, cream, shade, rim, dusk2) {
  const wall = mixRgb(cream, shade, 0.5);
  ctx.fillStyle = css(wall);
  ctx.fillRect(-333, DECK - 34.5, 380, 34.5);
  ctx.strokeStyle = css(mixRgb(wall, [40, 30, 60], 0.14));
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let x = -290; x < 40; x += 44) {
    ctx.moveTo(x, DECK - 30);
    ctx.lineTo(x, DECK);
  }
  ctx.stroke();
  // its capping rail, just under the near railing's
  ctx.fillStyle = css(mixRgb(wall, [40, 30, 60], 0.1));
  ctx.fillRect(-333, DECK - 31, 380, 1.4);
  // benches: iron ends, three slats for the back, one for the seat
  const wood = mixRgb([166, 104, 58], [72, 52, 72], 0.55 * dusk2);
  const iron = css(mixRgb([64, 54, 66], [34, 28, 44], dusk2));
  for (const [b0, b1] of [[-326, -268], [-256, -198], [-186, -128], [-116, -72], [10, 42]]) {
    ctx.strokeStyle = iron;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (const ex of [b0 + 3, b1 - 3]) {
      ctx.moveTo(ex, DECK);
      ctx.lineTo(ex, DECK - 27);
      ctx.moveTo(ex, DECK - 11);
      ctx.lineTo(ex + 3.5, DECK);
    }
    ctx.stroke();
    for (const [y, hgt] of [[DECK - 27, 3], [DECK - 22.6, 3], [DECK - 18.2, 3]]) {
      ctx.fillStyle = css(wood);
      ctx.fillRect(b0, y, b1 - b0, hgt);
      ctx.fillStyle = css(mixRgb(wood, [255, 220, 170], 0.25 * (1 - dusk2)));
      ctx.fillRect(b0, y, b1 - b0, 0.8);
    }
    ctx.fillStyle = css(mixRgb(wood, [30, 20, 30], 0.25));
    ctx.fillRect(b0 - 1.5, DECK - 12, b1 - b0 + 3, 3.4);
  }
}

// ——— the gulls ———

const HS = 1.5;
const HOVER = [-420, -262];
const hoverAt = (t) => [HOVER[0] + 5 * Math.sin(t * 1.7), HOVER[1] + 6 * Math.sin(t * 2.3 + 1)];
const ORBIT = (t) => [-470 + 90 * Math.cos(t * 0.9), -330 + 40 * Math.sin(t * 1.3)];
/** Offset from a gull's centre to its beak, for gull(ctx, x, y, s, flap, dir, { tilt }). */
const beakOff = (s, dir, tilt) => [dir * s * (21 * Math.cos(tilt) + 3 * Math.sin(tilt)), s * (21 * Math.sin(tilt) - 3 * Math.cos(tilt))];
// as the camera closes in, the hero gull drops in from above and settles into the air beside the stern
const ARRIVE = [[9.4, ...ORBIT(9.4)], [10.8, -360, -540], [11.7, -300, -590], [12.05, -338, -418], [12.45, -396, -300], [12.85, ...HOVER]];
// and after the snatch it climbs away over the deck with the simit, clear above Galata
const GETAWAY = [[T.grab, 0, 0], [16.2, 88, -56], [16.7, 193, -99], [17.3, 303, -131], [18.0, 403, -166], [19.0, 533, -231], [20.0, 653, -306], [21.0, 773, -381], [23.0, 1023, -541]];

function heroGull(t) {
  const hold = { flap: 0.14 + 0.1 * Math.sin(t * 3.1), tilt: -0.05 + 0.05 * Math.sin(t * 1.3) };
  if (t < 9.4) return { p: ORBIT(t), flap: Math.sin(t * 9), tilt: 0.1 * Math.sin(t) };
  if (t < 12.85) {
    const [x, y] = curve(ARRIVE, t);
    return {
      p: mixP([x, y], hoverAt(t), smooth(seg(t, 12.45, 12.85))),
      flap: lerp(Math.sin(t * 9), hold.flap, smooth(seg(t, 12.0, 12.6))), tilt: lerp(0.1 * Math.sin(t), hold.tilt, smooth(seg(t, 11.8, 12.6))),
    };
  }
  const c1 = TOSSES[0].t + TOSSES[0].fly, catchTilt = -0.3, go = T.toss1 - 0.05;
  const P1 = minus(piecePos(0, c1), beakOff(HS, 1, catchTilt));
  if (t < go) return { p: hoverAt(t), ...hold };
  if (t < c1) {
    const k = easeInOut(seg(t, go, c1));
    return { p: mixP(hoverAt(t), P1, k), flap: lerp(hold.flap, Math.sin(t * 17), smooth(seg(t, go, go + 0.1))), tilt: lerp(hold.tilt, catchTilt, k) };
  }
  if (t < 14.3) {
    // the catch: wings snap up and the head kicks back
    const snap = 1 - smooth(seg(t, c1 + 0.1, c1 + 0.22));
    const k = easeInOut(seg(t, c1, 14.3));
    const flap = lerp(lerp(Math.sin(t * 13), hold.flap, smooth(seg(t, c1 + 0.25, 14.2))), 1, snap);
    return { p: mixP(P1, hoverAt(t), k), flap, tilt: lerp(catchTilt, hold.tilt, k) - 0.2 * bump(t, c1, c1 + 0.04, c1 + 0.1, c1 + 0.26), piece: t < c1 + 0.45 };
  }
  const grabTilt = 0.5;
  const G = (tt) => minus(kidSimit(tt), beakOff(HS, 1, grabTilt));
  if (t < T.grab) {
    // it rises, then dives onto the simit from above
    const k = 0.28 * smooth(seg(t, 14.6, 15.2)) + 0.72 * easeIn(seg(t, 15.3, T.grab));
    const p = mixP(hoverAt(t), G(t), k);
    p[1] -= Math.sin(k * Math.PI) * 60;
    const tilt = t < 15.3 ? lerp(hold.tilt, -0.15, smooth(seg(t, 14.6, 15.2))) : lerp(-0.15, grabTilt, smooth(seg(t, 15.45, T.grab)));
    return { p, flap: lerp(hold.flap, Math.sin(t * 16), smooth(seg(t, 15.2, 15.35))), tilt };
  }
  const G0 = G(T.grab), d = curve(GETAWAY, t);
  const tilt = t < 16.1 ? lerp(grabTilt, -0.45, smooth(seg(t, T.grab, 16.1))) : lerp(-0.45, -0.3, smooth(seg(t, 16.1, 17)));
  return { p: [G0[0] + d[0], G0[1] + d[1]], flap: Math.sin(t * 12), tilt, carrying: true };
}

// the escort: three gulls riding the air over the stern, and two trailing further back (never closer than ~60px)
const ESCORT = [[-300, -335, 1.25, 0.0], [-400, -285, 1.1, 1.7], [-210, -395, 1.15, 3.4], [-570, -410, 1.0, 5.1], [-700, -480, 0.95, 0.8]];

// ——— the ferry ———

const BUOYS = [-232, -8, 184];
const windowFree = (i) => BUOYS.every((bx) => Math.abs(-296 + i * 32 - bx) >= 16);

function ferry(ctx, t, C) {
  const x = ferryX(t), y = FERRY_Y + 2 * Math.sin(t * 1.3);
  if (x < -1000 || x > 2900) return;
  const dusk = seg(t, 12, 22);
  // late dusk: the ferry settles into a dark shape against the sky, with its windows glowing
  const dusk2 = smooth(seg(t, 16, 23));
  const cream = mixRgb(mixRgb(CREAM, [150, 140, 190], dusk * 0.35), [84, 72, 118], 0.72 * dusk2);
  const shade = mixRgb(mixRgb(SHADE, [90, 80, 130], dusk * 0.4), [52, 42, 80], 0.72 * dusk2);
  const rim = css(RIM, 0.85 * (1 - dusk * 0.4));
  const winLit = smooth(seg(t, 13, 21));

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.004 * Math.sin(t * 0.9));

  // its dark reflection, and the lit salon windows broken up by the ripples
  const rg = ctx.createLinearGradient(0, 6, 0, 120);
  rg.addColorStop(0, 'rgba(20,14,34,0.55)');
  rg.addColorStop(1, 'rgba(20,14,34,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(-340, 6, 700, 114);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const wr = 0.06 + 0.3 * winLit;
  for (let i = 0; i < 17; i++) {
    if (!windowFree(i)) continue;
    const wx = -296 + i * 32;
    for (let j = 0; j < 7; j++) {
      const w = (15 - j * 1.4) * (0.55 + 0.45 * Math.sin(t * 2.6 + i * 1.7 + j * 1.3));
      ctx.fillStyle = css(WIN, wr * (1 - j / 7));
      ctx.fillRect(wx - w / 2 + 3 * Math.sin(t * 1.9 + j * 0.9 + i), 14 + j * 8 + 2 * hash(i * 7 + j, 3), w, 2.4);
    }
  }
  ctx.restore();

  // foam left behind on the water (fixed in the water, so the ferry pulls away from it)
  const life = 3.4, dt = 0.07;
  const foamA = 0.5 * (1 - 0.45 * dusk);
  for (let k = Math.max(0, Math.floor((t - life) / dt)); k <= Math.floor(t / dt); k++) {
    const age = t - k * dt;
    if (age < 0 || age > life) continue;
    const a = age / life;
    for (let j = 0; j < 2; j++) {
      const n = k * 2 + j;
      const fx = -346 - 118 * age - 12 * hash(n, 140) - 50 * a * hash(n, 142);
      const fy = 10 + (hash(n, 141) - 0.35) * (6 + 30 * a);
      const r = (2 + 4 * hash(n, 142)) * (1 + 1.3 * a);
      ctx.fillStyle = css([255, 250, 244], foamA * (1 - a) ** 1.6);
      ctx.beginPath();
      ctx.ellipse(fx, fy, r * 1.9, r * 0.45, 0, 0, TAU);
      ctx.fill();
    }
  }

  // ——— upper deck: the far bulkhead and benches, the people, then the railing in front of them ———
  deckBackdrop(ctx, cream, shade, rim, dusk2);
  const K = kidPose(t);
  const c = cayci(t);

  // grandpa, facing the gulls behind the ferry
  const gh = curve(GRAN_KEYS, t);
  const laugh = Math.max(K.happy, bump(t, 13.6, 13.8, 14.6, 15));
  person(ctx, GRAN.x, DECK, GRAN.h, {
    dir: -1, lean: GRAN.lean, mustache: true, smile: laugh > 0.3,
    colors: { shirt: '#5f7591', pants: '#3a3148', skin: '#c99478', hair: '#a59aa4', hat: 'cap', capColor: '#3b3140' },
    hands: [gh, curve(GRAN_FAR, t)], look: 0.3 * bump(t, 12.9, 13.2, 13.7, 14) - 0.15 * bump(t, 17.1, 17.35, 17.9, 18.4),
  });
  // the piece he has just torn off, in his throwing hand
  const tr = TOSSES[0].t;
  if (t > tr - 0.45 && t < tr) {
    const p = handWorld(GRAN.x, -1, GRAN.h, gh, GRAN.lean);
    crumb(ctx, p[0] - 1, p[1] - 2, 0.3, 0.8);
  }

  // the child: facing the gulls, then spun round towards grandpa
  const ksx = turnSquash(t, T.turn);
  ctx.save();
  ctx.translate(KID.x, 0);
  ctx.scale(ksx, 1);
  ctx.translate(-KID.x, 0);
  person(ctx, KID.x, DECK, KID.h, {
    dir: K.dir, lean: K.lean, colors: { shirt: '#e0a23a', pants: '#34405c', skin: '#e0b08c', hair: '#3a2418' },
    hands: [K.A, K.B], look: K.look, smile: K.happy > 0.2,
  });
  ctx.restore();
  if (t < T.grab) {
    const s = kidSimit(t);
    simit(ctx, s[0], s[1], 8, 0.3, 0.8, 5);
  }
  // grandpa's simit, which ends up in the child's hand (with a bite out of it)
  const gs = granSimit(t);
  const bite = smooth(seg(t, T.bite, T.bite + 0.06));
  bittenSimit(ctx, gs[0], gs[1], 7, 0.2, 0.85, 7, bite, -1, -0.15);
  // crumbs from the bite
  const bf = t - T.bite;
  if (bf > 0 && bf < 1.1) {
    for (let i = 0; i < 5; i++) {
      const vx = (hash(i, 200) - 0.3) * 30, vy = -10 - 25 * hash(i, 201);
      disc(ctx, gs[0] - 6 + vx * bf, Math.min(DECK - 1.2, gs[1] + vy * bf + 200 * bf * bf), 0.9 + 0.5 * hash(i, 202), css(i % 2 ? [247, 228, 179] : [200, 130, 70], 1 - bf / 1.1));
    }
  }

  // the çaycı and his hanging tray (drawn before the funnel, so he can come out from behind it)
  cayLeg(ctx, c, true);
  ctx.save();
  ctx.beginPath();
  ctx.rect(c.x - 120, DECK - 300, 240, 300 - CAY.h * 0.5 + c.bob + 0.5);
  ctx.clip();
  ctx.translate(c.x, 0);
  ctx.scale(c.sx, 1);
  ctx.translate(-c.x, 0);
  person(ctx, c.x, DECK + c.bob, CAY.h, {
    dir: c.dir, lean: CAY.lean, mustache: true, smile: K.happy > 0.3, look: c.look,
    colors: { shirt: '#efe9dd', vest: '#2a2630', pants: '#2f2b38', skin: '#c48d6c', hair: '#1e1a1c' },
    hands: [c.handT, [4, -1]],
  });
  ctx.restore();
  cayLeg(ctx, c, false);
  tray(ctx, c, t, t >= T.take);

  // the mother, who takes a glass from the tray
  const mh = momHands(t, c);
  person(ctx, MOM.x, DECK, MOM.h, {
    dir: 1, lean: 0.03, smile: K.happy > 0.3,
    colors: { shirt: '#3f6f73', pants: '#3b3246', skin: '#d4a286', hair: '#c8674f' },
    hands: [mh.near, mh.far], look: 0.15 * mh.stir,
  });
  headscarf(ctx, MOM.x, 1, MOM.h, 0.03, 0.15 * mh.stir, '#c8674f', '#f0c27a');
  if (t >= T.take) {
    const g = handWorld(MOM.x, 1, MOM.h, mh.near, 0.03);
    tea(ctx, g[0], g[1] - 1, 0.3, t, 0.9);
    if (mh.stir > 0) {
      const f = handWorld(MOM.x, 1, MOM.h, mh.far, 0.03, true);
      ctx.strokeStyle = css([232, 228, 220], mh.stir);
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(f[0], f[1]);
      ctx.lineTo(lerp(f[0], g[0], 0.6), g[1] - 5);
      ctx.stroke();
    }
  }

  // grandpa's tea on the rail, steaming
  tea(ctx, -188, DECK - 36, 0.42, t);

  // railing
  ctx.strokeStyle = css(mixRgb(cream, [40, 30, 60], 0.15));
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let rx = -330; rx <= 40; rx += 15) {
    ctx.moveTo(rx, DECK);
    ctx.lineTo(rx, DECK - 34);
  }
  ctx.stroke();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = css(cream);
  ctx.beginPath();
  ctx.moveTo(-334, DECK - 35);
  ctx.lineTo(44, DECK - 35);
  ctx.stroke();
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-334, DECK - 37);
  ctx.lineTo(44, DECK - 37);
  ctx.stroke();

  // funnel, with its brass whistle
  ctx.fillStyle = css(mixRgb(mixRgb([232, 192, 102], [120, 90, 110], dusk * 0.4), [70, 56, 84], 0.5 * dusk2));
  ctx.beginPath();
  ctx.moveTo(-64, DECK);
  ctx.lineTo(-48, -224);
  ctx.lineTo(6, -224);
  ctx.lineTo(-6, DECK);
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
  ctx.fillStyle = css(mixRgb(mixRgb([214, 176, 96], [110, 90, 100], dusk * 0.4), [70, 56, 84], 0.4 * dusk2));
  ctx.fillRect(4, -219, 8, 2.5);
  ctx.fillRect(9, -234, 3, 16);
  ctx.beginPath();
  ctx.moveTo(7.5, -240);
  ctx.lineTo(13.5, -240);
  ctx.lineTo(12, -234);
  ctx.lineTo(9, -234);
  ctx.fill();
  // a thin trail of smoke streaming back towards the flag
  const smokeCol = mixRgb([176, 164, 186], C[2], 0.3);
  for (let k = 0; k < 14; k++) {
    const p = (t * 0.22 + k / 14) % 1;
    const ry = 2.6 + 8 * p;
    ctx.fillStyle = css(smokeCol, 0.16 * Math.min(1, p / 0.08) * (1 - p) * (1 - 0.5 * dusk2));
    ctx.beginPath();
    ctx.ellipse(-22 - p * 330, -234 - p * 44 + 5 * Math.sin(p * 5 + t * 0.7 + k), ry * 2.5, ry, -0.08, 0, TAU);
    ctx.fill();
  }
  // the horn: a white plume from the whistle
  const hp = t - T.horn;
  if (hp > 0 && hp < 2.4) {
    for (let k = 0; k < 10; k++) {
      const age = hp - k * 0.1;
      if (age < 0 || age > 1.2) continue;
      disc(ctx, 11 - 26 * age, -240 - 40 * age + 2 * Math.sin(k * 2.1), 3 + 9 * age, css([255, 248, 240], 0.75 * (1 - age / 1.2) ** 1.4));
    }
  }

  // wheelhouse
  ctx.fillStyle = css(cream);
  ctx.fillRect(50, -176, 196, 52);
  ctx.fillStyle = css(shade);
  ctx.fillRect(50, -128, 196, 4);
  const whCol = mixRgb(mixRgb([60, 60, 90], WIN, 0.25 + 0.5 * dusk), WIN, 0.6 * dusk2);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = css(whCol);
    ctx.fillRect(62 + i * 30, -166, 22, 20);
  }
  ctx.fillStyle = css(mixRgb(cream, [255, 255, 255], 0.2));
  ctx.fillRect(44, -182, 210, 7);
  ctx.strokeStyle = rim;
  ctx.beginPath();
  ctx.moveTo(44, -183);
  ctx.lineTo(254, -183);
  ctx.stroke();
  // mast and lamp, and the green starboard light
  ctx.strokeStyle = css(mixRgb(cream, [40, 30, 60], 0.3));
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(200, -182);
  ctx.lineTo(206, -262);
  ctx.stroke();
  disc(ctx, 206, -264, 3.5, css([255, 240, 210]));
  disc(ctx, 240, -150, 3, css(mixRgb([60, 120, 90], [110, 255, 170], 0.3 + 0.7 * dusk)));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 206, -264, 40, [255, 230, 190], 0.5 * (0.3 + dusk));
  glow(ctx, 240, -150, 26, [110, 255, 170], 0.5 * dusk);
  ctx.restore();

  // the salon along the main deck, passengers' heads in the lit windows
  ctx.fillStyle = css(cream);
  ctx.fillRect(-320, -120, 572, 60);
  const sg = ctx.createLinearGradient(0, -120, 0, -60);
  sg.addColorStop(0, `rgba(255,255,255,${0.12 * (1 - dusk2)})`);
  sg.addColorStop(1, 'rgba(60,40,90,0.14)');
  ctx.fillStyle = sg;
  ctx.fillRect(-320, -120, 572, 60);
  ctx.fillStyle = css(mixRgb(cream, [40, 30, 60], 0.12));
  ctx.fillRect(-334, -126, 600, 7);
  ctx.strokeStyle = css(RIM, 0.5 * dusk2);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-334, -126.5);
  ctx.lineTo(266, -126.5);
  ctx.stroke();
  const winCol = mixRgb([70, 66, 96], WIN, 0.55 + 0.45 * dusk);
  const headCol = css(mixRgb(winCol, [40, 28, 40], 0.55));
  for (let i = 0; i < 17; i++) {
    if (!windowFree(i)) continue;
    const wx = -306 + i * 32;
    ctx.fillStyle = css(winCol);
    ctx.beginPath();
    ctx.roundRect(wx, -108, 20, 24, 4);
    ctx.fill();
    // passengers inside, in profile: some in caps, some in headscarves, now and then two to a window
    for (let q = 0; q < 2; q++) {
      const n = i * 2 + q;
      if (hash(n, 40) > (q ? 0.18 : 0.5)) continue;
      const hx = wx + (q ? 14 : 6) + 3 * hash(n, 41) + 0.8 * Math.sin(t * 0.7 + n);
      const hy = -93 - 2.5 * hash(n, 42), face = hash(n, 43) > 0.5 ? 1 : -1, kind = hash(n, 44);
      ctx.fillStyle = headCol;
      ctx.beginPath();
      ctx.roundRect(hx - 4.5, hy + 4, 9, -hy - 88 + 1, [2.5, 2.5, 0, 0]);
      ctx.fill();
      disc(ctx, hx, hy, kind > 0.75 ? 3.9 : 3.2, headCol);
      ctx.beginPath();
      ctx.moveTo(hx + face * 2.6, hy - 1);
      ctx.lineTo(hx + face * 4.4, hy + 0.8);
      ctx.lineTo(hx + face * 2.6, hy + 1.6);
      ctx.fill();
      if (kind < 0.3) ctx.fillRect(hx - 3.4 - face * 0.6, hy - 3.6, 6.8, 1.8);
      if (kind < 0.3) ctx.fillRect(hx + face * 1.8, hy - 2.6, face * 2.8, 1);
    }
  }
  // the windows' warm glow spilling onto the hull once it is dark
  const wg = 0.12 * dusk2;
  if (wg > 0.004) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 17; i++) if (windowFree(i)) glow(ctx, -296 + i * 32, -96, 30, [255, 196, 120], wg);
    for (let i = 0; i < 6; i++) glow(ctx, 73 + i * 30, -156, 24, [255, 196, 120], wg);
    ctx.restore();
  }
  // lifebuoys, hung on plain wall between the windows
  for (const bx of BUOYS) {
    ctx.lineWidth = 5;
    ctx.strokeStyle = css(mixRgb([232, 103, 46], [110, 50, 50], 0.45 * dusk2));
    ctx.beginPath();
    ctx.arc(bx, -96, 9, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = css(mixRgb([244, 239, 230], [120, 110, 140], 0.5 * dusk2));
    ctx.beginPath();
    for (let q = 0; q < 4; q++) {
      ctx.moveTo(bx + Math.cos(q * Math.PI / 2 + 0.785) * 6.5, -96 + Math.sin(q * Math.PI / 2 + 0.785) * 6.5);
      ctx.lineTo(bx + Math.cos(q * Math.PI / 2 + 0.785) * 11.5, -96 + Math.sin(q * Math.PI / 2 + 0.785) * 11.5);
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
  // the raised bulwark of the foredeck
  ctx.fillStyle = css(mixRgb(cream, shade, 0.12));
  ctx.beginPath();
  ctx.moveTo(250, -58);
  ctx.lineTo(250, -101);
  ctx.quadraticCurveTo(330, -101, 378, -108);
  ctx.lineTo(376, -78);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = css(mixRgb(cream, [40, 30, 60], 0.12));
  ctx.beginPath();
  ctx.moveTo(250, -101);
  ctx.quadraticCurveTo(330, -101, 378, -108);
  ctx.lineTo(378, -103);
  ctx.quadraticCurveTo(330, -96.5, 250, -96.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(250, -102);
  ctx.quadraticCurveTo(330, -102, 378, -109);
  ctx.stroke();
  for (const px of [282, 316]) disc(ctx, px, -80, 4.2, css(mixRgb(winCol, [60, 50, 80], 0.35)));
  const hg = ctx.createLinearGradient(0, -80, 0, 8);
  hg.addColorStop(0, css(mixRgb(cream, [255, 255, 255], 0.15 * (1 - dusk2))));
  hg.addColorStop(1, css(shade));
  ctx.fillStyle = hg;
  hull();
  ctx.fill();
  ctx.save();
  hull();
  ctx.clip();
  ctx.fillStyle = '#25232f';
  ctx.fillRect(-400, -20, 800, 40);
  ctx.fillStyle = css(mixRgb([184, 52, 44], [90, 40, 60], 0.5 * dusk2));
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
  ctx.moveTo(-340, DECK);
  ctx.lineTo(-346, -200);
  ctx.stroke();
  ctx.save();
  ctx.translate(-346, -200);
  ctx.scale(-1, 1);
  flag(ctx, 0, 0, 24, t);
  ctx.restore();

  // the water churning white at the stern and curling at the bow
  for (let i = 0; i < 12; i++) {
    const p = (t * (1.2 + 0.6 * hash(i, 160)) + hash(i, 161)) % 1;
    const bx = -338 - 34 * hash(i, 162) - 30 * p, by = 8 + 7 * hash(i, 163) - 4 * Math.sin(p * Math.PI);
    disc(ctx, bx, by, (2 + 4 * hash(i, 164)) * (0.6 + p), css([255, 250, 244], foamA * 1.3 * Math.sin(p * Math.PI)));
  }
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
  for (let i = 0; i < 8; i++) {
    const p = (t * 1.6 + hash(i, 170)) % 1;
    disc(ctx, 352 + 40 * p + 10 * hash(i, 171), 2 - 22 * p * (1 - p) * (1 + hash(i, 172)) * 2, 1.4 + 1.4 * hash(i, 173), css([255, 250, 244], 0.6 * (1 - p)));
  }
  for (let i = 0; i < 14; i++) {
    const age = i / 14;
    const wx = -340 - age * 620 - 20 * Math.sin(t * 2 + i);
    ctx.strokeStyle = `rgba(255,248,240,${0.4 * (1 - age)})`;
    ctx.lineWidth = 2.5 * (1 - age) + 0.5;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(wx, 8 + side * age * 16);
      ctx.lineTo(wx - 50 - 30 * hash(i, 71), 8 + side * age * 20);
      ctx.stroke();
    }
  }

  // ——— gulls: the escort riding above and behind the stern, and the hero ———
  const escortA = 1 - smooth(seg(t, 22, 24));
  if (escortA > 0.01) {
    ctx.save();
    ctx.globalAlpha = escortA;
    for (let i = 0; i < ESCORT.length; i++) {
      const [ex, ey, s, ph] = ESCORT[i];
      // they rise out of the close-up's frame, and settle back over the stern in the wide shots
      const gx = ex + 14 * Math.cos(t * 0.55 + ph), gy = ey - 160 * closeK(t) + 10 * Math.sin(t * 0.8 + ph);
      const gliding = Math.sin(t * 0.8 + i * 1.9) > -0.2;
      gull(ctx, gx, gy, s, gliding ? 0.12 + 0.06 * Math.sin(t * 2 + i) : Math.sin(t * (8 + 3 * hash(i, 186)) + i), 1,
        { tilt: 0.05 * Math.sin(t * 0.7 + ph), shade: 0.12 + 0.2 * dusk + 0.2 * dusk2 });
    }
    ctx.restore();
  }
  // grandpa's piece in the air, and the crumbs that fly when the gull snaps it up
  for (let i = 0; i < TOSSES.length; i++) {
    const s = TOSSES[i], k = t - s.t;
    if (k > 0 && k < s.fly) {
      const p = piecePos(i, t);
      crumb(ctx, p[0], p[1], k * 9, 1, pieceVel(i, t));
    }
    const pc = k - s.fly;
    if (pc > 0 && pc < 0.9) {
      const b = piecePos(i, s.t + s.fly);
      for (let j = 0; j < 6; j++) {
        const vx = (hash(j, 190) - 0.5) * 110, vy = -50 - 60 * hash(j, 191);
        disc(ctx, b[0] + vx * pc, b[1] + vy * pc + 300 * pc * pc, 1.5 + 0.9 * hash(j, 192), css(j % 2 ? [247, 228, 179] : [212, 140, 72], 1 - pc / 0.9));
      }
    }
  }
  const G = heroGull(t);
  gull(ctx, G.p[0], G.p[1], HS, G.flap, 1, { tilt: G.tilt, shade: 0.1 + 0.2 * dusk + 0.15 * dusk2 });
  const gb = beakOff(HS, 1, G.tilt);
  if (G.piece) crumb(ctx, G.p[0] + gb[0] + 2, G.p[1] + gb[1] + 2, 0.4, 0.7);
  if (G.carrying) {
    const hang = smooth(seg(t, T.grab, T.grab + 0.35));
    simit(ctx, G.p[0] + gb[0] + hang, G.p[1] + gb[1] + 6 * hang, lerp(8, 7, hang), lerp(0.3, 0.5, hang), 0.8, 5);
  }
  // crumbs from the snatch
  const cf = t - T.grab;
  if (cf > 0 && cf < 1.4) {
    const s0 = kidSimit(T.grab);
    for (let i = 0; i < 9; i++) {
      const vx = (hash(i, 95) - 0.5) * 60, vy = -30 - 40 * hash(i, 96);
      disc(ctx, s0[0] + vx * Math.min(cf, 0.9), Math.min(DECK - 1.5, s0[1] + vy * cf + 160 * cf * cf), 1.4 + hash(i, 97), css([214, 150, 80], 1 - cf / 1.4));
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
  farFerry(ctx, t, C);
  // Kız Kulesi, far enough out that the ferry passes in front of it with water showing between them;
  // a thin warm rim on its sunward edges keeps it apart from the city behind
  const kkRim = 0.55 * (1 - smooth(seg(t, 15, 21)));
  if (kkRim > 0.01) maidensTower(ctx, 371.6, HY + 28.8, 0.8, css(mixRgb(C[3], [255, 214, 164], 0.5), kkRim), 0);
  maidensTower(ctx, 370, HY + 30, 0.8, css(mixRgb('#2a1a36', C[3], 0.1)), lit(t));
  fishingBoat(ctx, t, C);
  dolphins(ctx, t, C);
  // a few gulls far away
  for (let i = 0; i < 4; i++) {
    const x = ((hash(i, 90) * 2200 + t * (40 + 20 * i)) % 2600) - 300;
    gull(ctx, x, 150 + 90 * hash(i, 91) + 10 * Math.sin(t + i), 0.5, Math.sin(t * 7 + i * 2), 1, { shade: 0.4 });
  }
  sunGulls(ctx, t, C);
  ctx.restore();

  ctx.save();
  applyCam(ctx, cam, 1);
  ferry(ctx, t, C);
  ctx.restore();

  vignette(ctx, W, H, 0.42);
  // in from black, and back to black at the end
  const black = Math.max(1 - smooth(seg(t, 0, 1.3)), smooth(seg(t, T.fade, 25.9)));
  if (black > 0.002) {
    ctx.fillStyle = `rgba(0,0,0,${black})`;
    ctx.fillRect(0, 0, W, H);
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
const clink = (S, t, f, v = 0.022, pan = 0.25) => S.bell(t, f, { vel: v, dur: 0.32, pan, send: 0.25 });

export function score(S) {
  // the sea and the far city
  S.noise(0, { dur: 26, type: 'lowpass', f0: 420, q: 0.3, vel: 0.042, attack: 2, release: 2.5, lfo: [0.13, 0.6], send: 0.1 });
  S.noise(0, { dur: 26, type: 'bandpass', f0: 900, q: 0.5, vel: 0.02, attack: 3, release: 3, lfo: [0.21, 0.8], send: 0.25, pan: 0.2 });
  // the drone underneath everything; it steps back for the gag on deck so the kanun and ney sit on top
  S.pad(0, ['D2', 'A2', 'D3'], { dur: 13.5, vel: 0.07, attack: 3, release: 2, cutoff: 480 });
  S.pad(13.2, ['D2', 'A2', 'D3'], { dur: 10.3, vel: 0.045, attack: 1.6, release: 3, cutoff: 460 });

  // the ferry's engine: a low throb that comes in from the left, passes close, and goes off to the right
  for (const [t0, dur, v, pan] of [[5.5, 7.5, 0.13, -0.45], [11.6, 7.2, 0.2, 0], [17.6, 6.6, 0.12, 0.45]]) {
    S.noise(t0, { dur, type: 'lowpass', f0: 210, q: 1.6, vel: v, attack: 1.6, release: 1.8, lfo: [5.4, 0.6], send: 0.05, pan });
  }
  // water slapping the hull while we are on deck
  S.noise(11.4, { dur: 8.4, type: 'bandpass', f0: 650, q: 0.9, vel: 0.075, attack: 1.5, release: 2, lfo: [0.85, 0.95], send: 0.15, pan: -0.15 });
  S.noise(12, { dur: 7.6, type: 'bandpass', f0: 340, q: 0.8, vel: 0.065, attack: 1.5, release: 2, lfo: [0.55, 0.9], send: 0.15, pan: 0.2 });

  // the ferry announces itself over the skyline
  S.horn(0.3, { dur: 1.15, vel: 0.13, f: 92 });
  S.horn(1.75, { dur: 0.7, vel: 0.1, f: 92 });
  // gulls: the flock over the sun, the escort, the catches
  for (const [tt, f, v, p] of [[1.3, 1500, 0.012, 0.3], [2.1, 1400, 0.014, 0.1], [2.9, 1350, 0.012, -0.1], [8.6, 1600, 0.02, -0.5], [9.1, 1480, 0.016, -0.4],
    [9.9, 1550, 0.022, -0.2], [11.0, 1700, 0.024, -0.3], [12.3, 1450, 0.02, -0.4], [13.55, 1800, 0.04, -0.25], [16.55, 1650, 0.03, 0.15], [18.4, 1500, 0.02, 0.1], [19.6, 1500, 0.018, 0.2]]) {
    S.gull(tt, { f, vel: v, pan: p });
  }
  // the dolphins break the surface
  for (const [t0, , who] of LEAPS) {
    for (const [dt, f0, f1, v] of [[0, 1900, 900, 0.06], [0.95, 1400, 500, 0.075]]) {
      S.noise(t0 + dt, { dur: 0.5, type: 'bandpass', f0, f1, q: 0.7, vel: v * (1 - 0.2 * who), attack: 0.015, release: 0.42, send: 0.45, pan: 0.35 });
    }
  }

  // phrase A: the old city at sunset
  roll(S, 3.2, [0, 2, 4, 7], 0.11, { vel: 0.045 });
  line(S, 3.4, [[4, 0.9], [5, 0.35], [4, 0.35], [3, 0.35], [2, 0.9], [3, 0.45], [4, 1.7]]);
  tremolo(S, 7.7, 4, 12);
  // phrase B: coming down to the tonic as the ferry comes by
  roll(S, 9.3, [0, 4, 7, 9], 0.1, { vel: 0.045 });
  line(S, 9.4, [[7, 0.8], [6, 0.4], [5, 0.4], [4, 0.8], [3, 0.35], [2, 0.35], [1, 0.5], [0, 1.3]]);

  // the çaycı's tray: a glass lifted, then a spoon stirring
  clink(S, T.take, 2960, 0.045);
  clink(S, T.take + 0.07, 3380, 0.026);
  for (let i = 0; i < 4; i++) clink(S, 14.72 + i * 0.16 + 0.02 * hash(i, 5), 3150 + 170 * (i % 2), 0.03 - i * 0.003, 0.3);

  // the child and the gull: the kanun gets playful
  const quick = [3, 4, 5, 4, 3, 2, 3, 4, 5, 6, 5, 4];
  quick.forEach((d, i) => kanun(S, 13.85 + i * 0.16, d + 7, { vel: 0.11, dur: 0.8, pan: 0.1 }));
  // a soft frame drum under it (düm . tek tek), which stops dead just before the snatch
  for (let i = 0; i < 11; i++) {
    const tt = 13.85 + i * 0.16;
    if (i % 4 === 0) S.thump(tt, { f0: 115, f1: 62, dur: 0.26, vel: 0.07, pan: 0.05, send: 0.15 });
    else if (i % 4 >= 2) S.noise(tt, { dur: 0.06, type: 'bandpass', f0: 3200, q: 1.1, vel: i % 4 === 2 ? 0.02 : 0.013, attack: 0.003, release: 0.045, send: 0.15, pan: 0.1 });
  }
  // the snatch: a falling kanun run, a yelp from the ney, the gull's cry
  S.gull(T.grab - 0.05, { f: 1750, dur: 0.5, vel: 0.05, pan: -0.2 });
  S.gull(T.grab + 0.45, { f: 1550, dur: 0.4, vel: 0.035, pan: -0.3 });
  S.bell(T.grab, hicaz(14), { vel: 0.06, dur: 2 });
  roll(S, T.grab, [14, 12, 11, 9, 7, 5, 4], 0.05, { vel: 0.07 });
  S.ney(T.grab + 0.02, hicaz(9), { slide: 300, dur: 0.35, vel: 0.09 });
  // the child laughs: a skipping figure on the kanun
  [9, 7, 9, 7, 9, 8, 7].forEach((d, i) => kanun(S, 16.48 + i * 0.1, d, { vel: 0.09 - i * 0.006, dur: 0.5, pan: -0.1 }));
  // grandpa offers his own simit: a small cadence that phrase C resolves
  roll(S, 17.18, [5, 4, 3, 1], 0.12, { vel: 0.06, dur: 1.1, pan: -0.15 });
  // and a crunchy bite
  for (const [dt, f0, v] of [[0, 2600, 0.035], [0.09, 2200, 0.025]]) {
    S.noise(T.bite + dt, { dur: 0.1, type: 'bandpass', f0, q: 1.4, vel: v, attack: 0.004, release: 0.07, send: 0.05, pan: -0.15 });
  }

  // phrase C: the lights come on
  roll(S, 17.7, [0, 2, 4, 7, 9], 0.1, { vel: 0.04 });
  // (it rests while the horns sound, and comes home to the tonic after the answer fades)
  line(S, 17.9, [[2, 0.6], [3, 0.6], [4, 0.9], [5, 0.5], [4, 0.5], [3, 0.5], [2, 0.6], [null, 1.2], [1, 0.5], [0, 1.8]], { vel: 0.095 });
  for (let i = 0; i < 9; i++) S.bell(T.lights + 0.5 + i * 0.55 + 0.2 * hash(i, 1), hicaz(14 + [0, 2, 4, 7, 4, 2, 7, 9, 11][i]), { vel: 0.018, dur: 1.6, pan: (hash(i, 2) - 0.5) * 1.2 });

  // our horn, and far away the other ferry answers
  S.horn(T.horn, { dur: 1.1, vel: 0.11, f: 92, pan: 0.3, cutoff: 480 });
  S.horn(T.answer, { dur: 1.3, vel: 0.05, f: 110, cutoff: 320, pan: -0.4, send: 0.9 });
  roll(S, 23.78, [0, 4, 7, 9, 11, 14], 0.12, { vel: 0.05, dur: 1.9 });
}
