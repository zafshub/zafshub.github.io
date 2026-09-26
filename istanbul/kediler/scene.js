// Code Draws Istanbul · No. 3 — Merdiven Kedileri (the stair cats).
// Evening on the rainbow stairs above the Bosphorus. A neighbour fills the cats' water bowl, a kitten chases
// a butterfly, the lamps come on, a ferry crosses, the moon rises over Üsküdar and everyone settles down to sleep.
// Every frame is painted from nothing as a pure function of time t. There are no words in the picture.
import { TAU, clamp, lerp, seg, smooth, easeIn, easeInOut, easeOut, fade, hash, noise, curve, mixRgb, css, keyColor } from '../../engine/util.js';
import { glow, disc, grain, vignette } from '../../engine/draw.js';
import { cat, CATS, mosque, maidensTower, roofs, gull, tea, simit, person, makamHz } from '../kit.js';

export const meta = {
  title: 'Merdiven Kedileri',
  logline: 'Evening on the rainbow stairs: a kitten, a butterfly, the lamps coming on and the moon over the Bosphorus.',
  duration: 24,
  width: 1920,
  height: 1080,
  cover: 2.5,
  poster: 16.9,
  mix: { reverb: 3.4, wet: 0.34 },
};

const W = 1920, H = 1080;
const T = {
  curtain: 0.35, lean: 1.2, pour: 1.95, poured: 3.05, call: 3.3, climb: 3.6, inside: 8.9,
  drink: 8.45, drunk: 11.2, groom: 11.8, groomed: 14.2,
  wiggle1: 8.3, pounce1: 9.2, dusk: 10, lamps: 11, wiggle2: 12.8, pounce2: 13.6, tumble: 14.2, dazed: 14.8,
  moon: 14.3, star: 16.45, perch: 17.1, home: 17.7, nose: 19.9, hopOn: 20.5, greyNap: 19.9, curl: 21.4,
  bedtime: 20.8, lightsOut: 21.7, iris: 22.9, end: 24,
};

// ——— the stairs: twelve steps rising to the right ———

const N = 12, RUN = 150, RISE = 62, X0 = 40, Y0 = 1010;
const stepX = (i) => X0 + i * RUN;
const stepY = (i) => Y0 - i * RISE;
const RAINBOW = ['#e0524a', '#ee8a3c', '#f2c243', '#7cbf58', '#3fa7a0', '#4a7fc4', '#8a62b8', '#d4629a'];
/** A point standing on step i, k along its tread (0..1). */
const on = (i, k) => [stepX(i) + 18 + k * (RUN - 36), stepY(i)];
const BOWL = on(6, 0.45), BH = 9, BR = 27; // the cats' tin water dish: where, how deep, how wide
const GINGER = on(2, 0.22);

// ——— light through the evening ———

const SKY_TOP = [[0, '#6f7fc0'], [10, '#5a5fa6'], [13, '#26295e'], [16, '#131838']];
const SKY_LOW = [[0, '#ffc98a'], [10, '#f59a78'], [13, '#8a5a8a'], [16, '#2c2f5c']];
const dark = (t) => smooth(seg(t, 9.5, 14.5));
const lampOn = (t, i) => smooth(seg(t, T.lamps + i * 0.6, T.lamps + i * 0.6 + 0.35)) * (0.94 + 0.06 * Math.sin(t * 23 + i) * Math.sin(t * 7));
const add = (ctx, fn) => {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  fn();
  ctx.restore();
};

// ——— far away: sky, the Asian shore, the water ———

const HORIZON = 345;
const FERRY0 = 1878; // the ferry's far-layer x at t = 0; it steams left at 42 px/s
const moonAt = (t) => [1526, lerp(410, 262, easeOut(seg(t, T.moon, 18.6)))];
/** How warm the golden-hour light still is (1 at the start, gone by dusk). */
const golden = (t) => 1 - smooth(seg(t, 6.5, 11));
const farY = (x) => HORIZON - 9 - 12 * (0.5 + 0.5 * noise(x * 0.006, 8)) - 34 * Math.exp(-(((x - 1800) / 190) ** 2)) - 14 * Math.exp(-(((x - 1180) / 150) ** 2));

function sky(ctx, t) {
  const g = ctx.createLinearGradient(0, -120, 0, HORIZON);
  g.addColorStop(0, css(keyColor(SKY_TOP, t)));
  g.addColorStop(1, css(keyColor(SKY_LOW, t)));
  ctx.fillStyle = g;
  ctx.fillRect(-900, -700, 3900, HORIZON + 720);
  const d = dark(t);
  for (let i = 0; i < 190 && d > 0.1; i++) {
    const tw = 0.6 + 0.4 * Math.sin(t * (0.8 + 2 * hash(i, 5)) + i);
    disc(ctx, -300 + hash(i, 1) * 2800, -60 + hash(i, 2) ** 1.4 * 380, 0.8 + 1.3 * hash(i, 3) ** 4, css([255, 246, 230], (d - 0.1) * 0.8 * tw));
  }
  shootingStar(ctx, t);
  // the moon rising over the Asian shore
  if (t > T.moon - 0.3) {
    const [mx, my] = moonAt(t);
    const k = smooth(seg(t, T.moon - 0.3, T.moon + 1.4));
    add(ctx, () => {
      glow(ctx, mx, my, 460, [220, 225, 255], 0.36 * k);
      glow(ctx, mx, my, 120, [255, 250, 230], 0.25 * k);
    });
    disc(ctx, mx, my, 58, css([250, 244, 222], k));
    for (const [dx, dy, r] of [[-18, -10, 10], [16, 16, 7], [8, -22, 5], [-24, 18, 6]]) disc(ctx, mx + dx, my + dy, r, css([226, 220, 200], 0.45 * k));
  }
}

/** The shooting star falls left to right, in front of the tuxedo's face (far-layer coordinates). */
const STAR = [[1470, 70], [1800, 196]];
const starAt = (t) => {
  const k = seg(t, T.star, T.star + 0.6);
  return [lerp(STAR[0][0], STAR[1][0], easeOut(k)), lerp(STAR[0][1], STAR[1][1], easeOut(k)), k];
};

function shootingStar(ctx, t) {
  const k = seg(t, T.star, T.star + 0.6);
  if (k <= 0 || k >= 1) return;
  const [a, b] = STAR;
  const e = easeOut(k), e0 = Math.max(0, e - 0.32);
  const head = [lerp(a[0], b[0], e), lerp(a[1], b[1], e)];
  const tail = [lerp(a[0], b[0], e0), lerp(a[1], b[1], e0)];
  const alpha = Math.sin(k * Math.PI);
  const g = ctx.createLinearGradient(tail[0], tail[1], head[0], head[1]);
  g.addColorStop(0, 'rgba(255,250,235,0)');
  g.addColorStop(1, css([255, 250, 235], 0.95 * alpha));
  ctx.strokeStyle = g;
  ctx.lineCap = 'round';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(tail[0], tail[1]);
  ctx.lineTo(head[0], head[1]);
  ctx.stroke();
  add(ctx, () => glow(ctx, head[0], head[1], 26, [255, 245, 220], 0.7 * alpha));
  disc(ctx, head[0], head[1], 2.4, css([255, 255, 248], alpha));
}

/** An Istanbul ferry, bow to the left: white decks, a black hull, the funnel with its black cap. */
function ferry(ctx, x, y, t, d, lit) {
  // lights trembling on the water under her
  if (lit > 0.01) {
    // short broken dashes of lamplight, fading with depth
    add(ctx, () => {
      for (let j = 0; j < 6; j++) {
        for (let i = 0; i < 4; i++) {
          const w = (6 + 8 * hash(i + j * 4, 4)) * (1 - j * 0.1);
          const wx = x - 36 + i * 21 + 7 * hash(i + j * 4, 6) - w / 2 + 3 * Math.sin(t * 2.2 + j * 1.7 + i);
          ctx.fillStyle = css([255, 204, 130], 0.42 * lit * (1 - j / 6.5) * (0.6 + 0.4 * Math.sin(t * 4 + i * 2.3 + j)));
          ctx.fillRect(wx, y + 3 + j * 3.4, w, 1.5);
        }
      }
    });
  }
  const white = css(mixRgb('#f4efe6', '#7c8098', d * 0.75));
  const shade = css(mixRgb('#d9d2c6', '#5a5e78', d * 0.75));
  ctx.fillStyle = css(mixRgb('#2c2e3a', '#10121e', d));
  ctx.beginPath();
  ctx.moveTo(x - 52, y - 12);
  ctx.lineTo(x + 50, y - 12);
  ctx.lineTo(x + 46, y);
  ctx.lineTo(x - 44, y);
  ctx.fill();
  ctx.fillStyle = white;
  ctx.fillRect(x - 50, y - 16, 98, 5);
  ctx.fillRect(x - 40, y - 26, 80, 10);
  ctx.fillStyle = shade;
  ctx.fillRect(x - 30, y - 34, 58, 8);
  ctx.fillStyle = css(mixRgb('#2c2e3a', '#10121e', d));
  ctx.fillRect(x - 42, y - 27, 84, 1.5);
  // windows: blue glass by day, warm lamps by night
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = css(mixRgb(mixRgb('#5a6f8a', '#262a40', d), [255, 214, 140], lit * (hash(i, 31) > 0.15 ? 1 : 0.3)));
    ctx.fillRect(x - 37 + i * 6.3, y - 23, 3.6, 4);
  }
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = css(mixRgb(mixRgb('#5a6f8a', '#262a40', d), [255, 214, 140], lit * (hash(i, 37) > 0.2 ? 1 : 0.3)));
    ctx.fillRect(x - 27 + i * 6.6, y - 32, 3.4, 3.4);
  }
  // funnel and mast
  ctx.fillStyle = white;
  ctx.fillRect(x + 2, y - 46, 9, 12);
  ctx.fillStyle = css(mixRgb('#1d1d24', '#0c0c14', d));
  ctx.fillRect(x + 2, y - 48, 9, 4);
  ctx.fillRect(x - 21, y - 50, 1.4, 16);
  if (lit > 0.01) {
    disc(ctx, x - 20.3, y - 51, 1.6, css([255, 240, 210], lit));
    add(ctx, () => glow(ctx, x - 20, y - 51, 14, [255, 230, 190], 0.5 * lit));
  }
}

function view(ctx, t) {
  const d = dark(t), gold = golden(t);
  // Üsküdar faces the sunset: lit warm from the front, then fading into the night
  const shore = mixRgb(mixRgb('#8e6b8c', '#c98f78', 0.6 * gold), '#141a36', d);
  const haze = mixRgb(mixRgb('#b58a98', '#d6a996', 0.4 * gold), '#1b2244', d);
  // a paler far hill, then Üsküdar climbing up from the water
  ctx.fillStyle = css(haze);
  ctx.beginPath();
  ctx.moveTo(700, HORIZON + 2);
  for (let x = 700; x <= 2500; x += 16) ctx.lineTo(x, HORIZON - 24 - 24 * (0.5 + 0.5 * noise(x * 0.003, 3)) - 30 * Math.exp(-(((x - 1800) / 260) ** 2)) + 16 * Math.exp(-(((x - 1526) / 150) ** 2)));
  ctx.lineTo(2500, HORIZON + 2);
  ctx.fill();
  ctx.fillStyle = css(shore);
  ctx.beginPath();
  ctx.moveTo(700, HORIZON + 2);
  for (let x = 700; x <= 2500; x += 10) ctx.lineTo(x, farY(x));
  ctx.lineTo(2500, HORIZON + 2);
  ctx.fill();
  ctx.save();
  ctx.scale(0.5, 0.5);
  roofs(ctx, 1400, 5000, (x) => 2 * farY(x / 2) + 8, 31, css(shore), smooth(seg(t, 10.5, 15)));
  ctx.restore();
  // its windows blazing gold in the low sun
  if (gold > 0.02) {
    for (let i = 0; i < 38; i++) {
      const gx = 1020 + hash(i, 71) * 1420;
      const gy = lerp(farY(gx) + 4, HORIZON - 2, hash(i, 72) ** 1.3);
      const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + 2 * hash(i, 73)) + i * 1.9);
      ctx.fillStyle = css([255, 214, 120], gold * tw * (0.55 + 0.45 * hash(i, 74)));
      ctx.fillRect(gx, gy, 2.6, 2);
    }
  }
  const lit = smooth(seg(t, 11.8, 13));
  mosque(ctx, 1800, farY(1800) + 2, 13, css(shore), { minarets: 4, lit: lit * 0.8 });
  ctx.fillStyle = css(shore);
  mosque(ctx, 1405, farY(1405) + 3, 8, css(shore), { minarets: 2, halls: false, lit: lit * 0.7 });
  if (lit > 0) {
    // the minarets' balconies ring with little lights at night
    for (const [mx, base, h] of [[1800 - 2.25 * 13, farY(1800) + 2, 13 * 3.5], [1800 + 2.25 * 13, farY(1800) + 2, 13 * 3.5]]) {
      disc(ctx, mx, base - h * 0.65, 1.3, css([255, 226, 160], lit));
      disc(ctx, mx, base - h * 0.8, 1.2, css([255, 226, 160], lit));
    }
  }

  // the water
  const sea = ctx.createLinearGradient(0, HORIZON, 0, 760);
  sea.addColorStop(0, css(mixRgb('#f2b98e', '#28305e', d)));
  sea.addColorStop(1, css(mixRgb('#c47f80', '#131a3c', d)));
  ctx.fillStyle = sea;
  ctx.fillRect(-900, HORIZON, 3900, 1100);
  // sky light lying on the water in long thin strokes
  add(ctx, () => {
    for (let j = 0; j < 30; j++) {
      const y = HORIZON + 3 + j * 2.6 + j * j * 0.16;
      for (let q = 0; q < 5; q++) {
        const x = 800 + ((hash(j * 5 + q, 41) * 1700 + t * (6 + 10 * hash(j, 42))) % 1700);
        const w = (14 + 30 * hash(j * 5 + q, 43)) * (1 + j * 0.05);
        ctx.fillStyle = css(mixRgb([255, 222, 180], [120, 140, 200], d), 0.2 * (0.5 + 0.5 * Math.sin(t * 1.3 + j + q * 2)));
        ctx.fillRect(x, y, w, 1.5);
      }
    }
  });
  maidensTower(ctx, 1300, HORIZON + 19, 0.4, css(mixRgb('#b88a92', '#262a52', d)), smooth(seg(t, 11.5, 12.5)));
  // moonlight on the water
  const mk = smooth(seg(t, T.moon + 0.6, T.moon + 2.8));
  if (mk > 0) {
    const [mx] = moonAt(t);
    add(ctx, () => {
      for (let j = 0; j < 26; j++) {
        const y = HORIZON + 4 + j * 5 + j * j * 0.25;
        const w = (8 + j * 5) * (0.35 + 0.65 * Math.abs(Math.sin(t * 1.7 + j * 1.9)));
        ctx.fillStyle = css([245, 240, 222], 0.55 * mk * (1 - j / 30));
        ctx.fillRect(mx - w / 2 + (4 + j) * Math.sin(t * 0.9 + j * 0.7), y, w, 1.6 + j * 0.08);
      }
    });
  }
  // the ferry crossing towards Karaköy, lighting up at dusk
  ferry(ctx, FERRY0 - 42 * t, HORIZON + 47, t, d, smooth(seg(t, 11.2, 12.2)));
}

// ——— the old apartment block ———

const WIN = { x: 890, y: 490, w: 80, h: 120 }; // the teyze's window: third floor, the last column
const TEYZE_H = 180, SILL = WIN.y + WIN.h + 2;

function shutters(ctx, x, y, col) {
  for (const sx of [x - 42, x + 88]) {
    ctx.fillStyle = col;
    ctx.fillRect(sx, y - 8, 34, 136);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    for (let k = 0; k < 12; k++) ctx.fillRect(sx + 4, y - 2 + k * 11, 26, 3);
    ctx.fillRect(sx + 15, y - 8, 4, 136);
  }
}

/** A lace curtain (tül perde) covering `w` of the window from the left, lit from behind by `lit`. */
function lace(ctx, x, y, w, h, lit, d, alpha = 0.86) {
  if (w < 1) return;
  const base = mixRgb(mixRgb('#f7f0e2', '#6a6680', d * 0.8), [255, 226, 170], lit * 0.8);
  ctx.fillStyle = css(base, alpha);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  const n = Math.max(2, Math.round(w / 10));
  for (let i = n; i >= 0; i--) ctx.lineTo(x + (w * i) / n, y + h - 4 + ((i % 2) * 4));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = css(mixRgb(base, [120, 100, 90], 0.25), 0.5 * alpha);
  ctx.lineWidth = 1;
  for (let i = 1; i < n; i++) {
    ctx.beginPath();
    ctx.moveTo(x + (w * i) / n, y);
    ctx.lineTo(x + (w * i) / n + 1.5, y + h - 6);
    ctx.stroke();
  }
}

function windowAt(ctx, t, r, c, d) {
  const x = 40 + c * 170, y = 110 + r * 190, id = r * 7 + c;
  const k = hash(id, 3);
  let on = smooth(seg(t, 10.5 + 5 * k, 11 + 5 * k)) * (k > 0.35 ? 1 : 0);
  if (hash(id, 9) < 0.65) {
    const off = T.bedtime + 1.4 * hash(id, 10);
    on *= 1 - smooth(seg(t, off, off + 0.2));
  }
  const frame = css(mixRgb('#f6ecda', '#2a2640', d * 0.7));
  const sh = hash(id, 12);
  if (sh < 0.42) shutters(ctx, x, y, css(mixRgb(sh < 0.24 ? '#5d8a60' : '#9a5e3a', '#252236', d * 0.7)));
  ctx.fillStyle = frame;
  ctx.fillRect(x - 8, y - 8, 96, 136);
  const tv = r === 0 && c === 3;
  let glass = mixRgb(mixRgb('#8fa9c4', '#2c3450', d), [255, 206, 130], on);
  if (tv && on > 0) glass = mixRgb(glass, [110, 150, 235], 0.55 + 0.25 * Math.sin(t * 9) * Math.sin(t * 3.3));
  ctx.fillStyle = css(glass);
  ctx.fillRect(x, y, 80, 120);
  if (d < 0.9) {
    // the evening sky in the glass
    ctx.fillStyle = css([255, 255, 255], 0.16 * (1 - d) * (1 - on));
    ctx.beginPath();
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x + 34, y);
    ctx.lineTo(x + 8, y + 50);
    ctx.lineTo(x, y + 50);
    ctx.lineTo(x, y + 20);
    ctx.fill();
  }
  if (r === 1 && c === 0 && on > 0) {
    // a house cat on the inner sill, watching the stairs
    const cc = mixRgb([90, 60, 50], glass, 1 - on);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, 80, 120);
    ctx.clip();
    cat(ctx, x + 30, y + 118, 0.9, { pose: 'sit', coat: { fur: cc, dark: cc, light: cc, stripes: false }, t, look: 0.1, seed: 9 });
    ctx.restore();
  }
  // lace in some of the windows
  if (hash(id, 14) < 0.55) {
    const w = 18 + 10 * hash(id, 15);
    lace(ctx, x, y, w, 120, on, d, 0.7);
    ctx.save();
    ctx.translate(x + 80, 0);
    ctx.scale(-1, 1);
    lace(ctx, 0, y, w, 120, on, d, 0.7);
    ctx.restore();
  }
  ctx.fillStyle = frame;
  ctx.fillRect(x + 38, y, 4, 120);
  ctx.fillRect(x, y + 52, 80, 4);
  ctx.fillStyle = css(mixRgb('#d8cbb4', '#232034', d * 0.75));
  ctx.fillRect(x - 12, y + 126, 104, 8);
  if (on > 0) add(ctx, () => glow(ctx, x + 40, y + 60, 160, tv ? [160, 180, 255] : [255, 190, 110], 0.12 * on));
  if ((r + c) % 3 === 0) flowerBox(ctx, x, y, d);
}

/** An Ottoman cumba: a timber bay window hung out over the street on corbels, with two sashes and lace. */
function cumba(ctx, t, d) {
  const x = 380, y = 490;
  const on = smooth(seg(t, 11.3, 11.8)) * (1 - smooth(seg(t, T.bedtime + 1.05, T.bedtime + 1.25)));
  const wood = mixRgb('#96583f', '#2e2436', d * 0.75), side = mixRgb(wood, [30, 20, 30], 0.3);
  const trim = mixRgb('#efe2c8', '#3c3650', d * 0.7);
  const L = x - 26, R = x + 106, top = y - 30, bot = y + 150;
  ctx.fillStyle = css(side);
  for (const cx of [L + 12, x + 40, R - 12]) {
    ctx.beginPath();
    ctx.moveTo(cx - 10, bot);
    ctx.lineTo(cx + 10, bot);
    ctx.quadraticCurveTo(cx + 2, bot + 14, cx + 2, bot + 34);
    ctx.lineTo(cx - 2, bot + 34);
    ctx.quadraticCurveTo(cx - 2, bot + 14, cx - 10, bot);
    ctx.fill();
  }
  ctx.fillRect(L - 4, bot - 2, R - L + 8, 8);
  ctx.fillStyle = css(mixRgb('#a3553a', '#221c2c', d * 0.8));
  ctx.beginPath();
  ctx.moveTo(L - 12, top + 2);
  ctx.lineTo(R + 12, top + 2);
  ctx.lineTo(R - 2, top - 16);
  ctx.lineTo(L + 2, top - 16);
  ctx.fill();
  ctx.fillStyle = css(wood);
  ctx.fillRect(L, top, R - L, bot - top);
  ctx.fillStyle = css(side);
  ctx.fillRect(L, top, 12, bot - top);
  ctx.fillRect(R - 12, top, 12, bot - top);
  const glass = mixRgb(mixRgb('#8fa9c4', '#2c3450', d), [255, 206, 130], on);
  for (const sx of [L + 18, L + 70]) {
    ctx.fillStyle = css(trim);
    ctx.fillRect(sx - 4, top + 12, 52, 104);
    ctx.fillStyle = css(glass);
    ctx.fillRect(sx, top + 16, 44, 96);
    lace(ctx, sx, top + 16, 44, 60, on, d, 0.55);
    ctx.fillStyle = css(trim);
    ctx.fillRect(sx + 20.5, top + 16, 3, 96);
    ctx.fillRect(sx, top + 46, 44, 3);
  }
  // the carved lower panels
  ctx.strokeStyle = css(trim, 0.7);
  ctx.lineWidth = 2;
  for (const sx of [L + 18, L + 70]) {
    ctx.strokeRect(sx, top + 126, 44, 38);
    ctx.beginPath();
    ctx.moveTo(sx + 22, top + 131);
    ctx.lineTo(sx + 38, top + 145);
    ctx.lineTo(sx + 22, top + 159);
    ctx.lineTo(sx + 6, top + 145);
    ctx.closePath();
    ctx.stroke();
  }
  if (on > 0) add(ctx, () => glow(ctx, x + 40, y + 20, 170, [255, 190, 110], 0.13 * on));
}

function flowerBox(ctx, x, y, d) {
  ctx.fillStyle = css(mixRgb('#b0603c', '#3a2a30', d * 0.6));
  ctx.fillRect(x - 6, y + 122, 92, 14);
  for (let f = 0; f < 7; f++) disc(ctx, x + 2 + f * 13, y + 118 - 4 * Math.sin(f * 2), 7, css(mixRgb('#5f9a52', '#24302c', d * 0.6)));
  for (let f = 0; f < 6; f++) disc(ctx, x + 8 + f * 13, y + 112 - 5 * Math.sin(f * 2.7), 4.5, css(mixRgb(f % 3 ? '#e0526a' : '#f2f0e8', '#2a2436', d * 0.6)));
}

/** Where the copper jug sits on the sill once she has poured. */
const JUG_REST = [950, WIN.y + WIN.h + 2 - 4];
const CALLS = [0, 0.17, 0.34, 0.9, 1.07]; // "pıs pıs pıs … pıs pıs", after T.call

function teyzePose(t) {
  // [t, hip x, lean, near hand x, y, far hand x, y (from the hips), look, jug tilt, smile]
  const K = [
    [0, 912, 0.03, 26, -42, 16, -32, 0, 0, 0],
    [1.2, 912, 0.03, 26, -42, 16, -32, 0, 0, 0],
    [1.85, 938, 0.54, 52, -40, 36, -6, -0.5, 0.15, 0],
    [2.15, 938, 0.55, 52, -38, 36, -6, -0.6, 1.25, 0],
    [2.85, 938, 0.55, 52, -38, 36, -6, -0.6, 1.3, 0],
    [3.12, 932, 0.44, JUG_REST[0] - 932, -4, 40, -14, -0.45, 0, 0],
    [3.26, 930, 0.4, 24, -8, 40, -20, -0.35, 0, 0],
    [3.42, 928, 0.36, 74, -50, 40, -20, -0.3, 0, 0],
    [4.25, 928, 0.36, 74, -50, 40, -20, -0.3, 0, 0],
    [4.65, 926, 0.3, 42, -6, 32, -4, -0.35, 0, 0],
    [8.1, 926, 0.3, 42, -6, 32, -4, -0.35, 0, 0],
    [8.4, 926, 0.32, 42, -6, 32, -4, -0.45, 0, 1],
    [8.9, 926, 0.3, 42, -6, 32, -4, -0.4, 0, 1],
    [9.5, 908, 0.02, 22, 12, 14, 12, 0, 0, 1],
  ];
  const [hx, lean, nx, ny, fx, fy, look, tilt, smile] = curve(K, t);
  // "gel, gel": the near hand scoops, palm down, while she calls; her head dips toward the steps on every "pıs"
  const beck = fade(t, 3.38, 4.4, 0.1, 0.2);
  const scoop = 0.5 - 0.5 * Math.cos((t - 3.38) * TAU * 4);
  let nod = 0;
  for (const c of CALLS) {
    const k = seg(t, T.call + c, T.call + c + 0.18);
    if (k > 0 && k < 1) nod += Math.sin(k * Math.PI);
  }
  return {
    hx, lean, tilt, smile, look: look - 0.3 * nod,
    near: [nx - 7 * beck * scoop, ny + 9 * beck * scoop], far: [fx, fy],
  };
}

const CARDI = '#b85a66', SCARF = '#2f8a86';

/**
 * Her yazma: a dotted headscarf over the crown and the back of the head, framing the face and
 * knotted under the chin, with an oya edge and round glasses. Drawn in the kit person's head frame.
 */
function yazma(ctx, px, py, lean, look, sil) {
  const h = TEYZE_H, r = h * 0.074;
  const s = Math.sin(lean), c = Math.cos(lean);
  const hx = px + s * h * 0.36 + h * 0.012, hy = py - h * 0.5 - c * h * 0.36 - h * 0.062;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(lean * 0.4 - look * 0.25);
  ctx.fillStyle = sil ?? SCARF;
  ctx.beginPath();
  ctx.moveTo(r * 0.62, -r * 0.98);
  ctx.arc(0, 0, r * 1.2, -1.0, 2.05, true);
  ctx.quadraticCurveTo(-r * 1.2, r * 1.5, -r * 1.05, r * 1.75);
  ctx.lineTo(r * 0.1, r * 1.45);
  ctx.lineTo(r * 0.5, r * 1.0);
  ctx.quadraticCurveTo(-r * 0.3, r * 0.75, -r * 0.24, r * 0.05);
  ctx.quadraticCurveTo(-r * 0.15, -r * 0.72, r * 0.62, -r * 0.98);
  ctx.fill();
  if (!sil) {
    for (let i = 0; i < 9; i++) {
      const a = 1.9 + i * 0.42, rr = r * (0.62 + 0.4 * hash(i, 91));
      disc(ctx, Math.cos(a) * rr, Math.sin(a) * rr, r * 0.09, '#f3e7c6');
    }
    for (let i = 0; i < 7; i++) {
      const k = i / 6;
      disc(ctx, lerp(r * 0.55, -r * 0.24, k) - Math.sin(k * Math.PI) * r * 0.12, lerp(-r * 0.95, r * 0.1, k), r * 0.1, i % 2 ? '#f2c94c' : '#e05a6a');
    }
    // round glasses and a knot under the chin
    ctx.strokeStyle = '#5a3a2c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(r * 0.56, -r * 0.13, r * 0.24, 0, TAU);
    ctx.moveTo(r * 0.32, -r * 0.16);
    ctx.lineTo(-r * 0.2, -r * 0.16);
    ctx.stroke();
    disc(ctx, r * 0.3, r * 1.28, r * 0.2, SCARF);
  }
  ctx.restore();
}

function jug(ctx, x, y, tilt, d) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  const cu = mixRgb('#c9763e', '#5a3a36', d * 0.6);
  ctx.strokeStyle = css(mixRgb(cu, [60, 30, 20], 0.3));
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(1, -2, 6, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();
  ctx.fillStyle = css(cu);
  ctx.beginPath();
  ctx.moveTo(4, -12);
  ctx.lineTo(18, -12);
  ctx.lineTo(24, -16);
  ctx.lineTo(21, -10);
  ctx.quadraticCurveTo(23, 4, 18, 8);
  ctx.lineTo(5, 8);
  ctx.quadraticCurveTo(1, 2, 4, -12);
  ctx.fill();
  ctx.fillStyle = css(mixRgb(cu, [255, 230, 190], 0.35));
  ctx.fillRect(7, -9, 2.4, 13);
  ctx.restore();
}
const spoutOf = (x, y, tilt) => [x + 24 * Math.cos(tilt) + 16 * Math.sin(tilt), y + 24 * Math.sin(tilt) - 16 * Math.cos(tilt)];

function teyzeWindow(ctx, t, d) {
  const { x, y, w, h } = WIN;
  const light = 1 - smooth(seg(t, T.lightsOut, T.lightsOut + 0.2));
  ctx.fillStyle = css(mixRgb('#f6ecda', '#2a2640', d * 0.7));
  ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
  // the room behind: flowered wallpaper, a framed picture, a lamp hanging from the ceiling
  const dim = 1 - light;
  const paper = mixRgb(mixRgb('#efc995', '#f2c27e', d), [34, 28, 46], dim * 0.9);
  ctx.fillStyle = css(paper);
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = css(mixRgb(paper, [170, 90, 70], 0.3));
  for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) disc(ctx, x + 10 + i * 20 + (j % 2) * 10, y + 10 + j * 18, 2.2, css(mixRgb(paper, [170, 90, 70], 0.32)));
  const shade = ctx.createLinearGradient(0, y, 0, y + h);
  shade.addColorStop(0, 'rgba(60,30,20,0)');
  shade.addColorStop(1, 'rgba(60,30,20,0.3)');
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = css(mixRgb('#6a3e2c', '#1c1826', dim));
  ctx.fillRect(x + 48, y + 30, 24, 20);
  ctx.fillStyle = css(mixRgb('#8fb0a0', '#2a2a3a', dim));
  ctx.fillRect(x + 51, y + 33, 18, 14);
  ctx.fillStyle = css(mixRgb('#4a3028', '#1a1622', dim));
  ctx.fillRect(x + 25, y, 1.5, 12);
  ctx.beginPath();
  ctx.moveTo(x + 18, y + 20);
  ctx.lineTo(x + 34, y + 20);
  ctx.lineTo(x + 30, y + 11);
  ctx.lineTo(x + 22, y + 11);
  ctx.fill();
  if (light > 0) disc(ctx, x + 26, y + 22, 3, css([255, 236, 190], light));
  ctx.fillStyle = css(mixRgb('#5a3428', '#1a1622', dim));
  ctx.fillRect(x, y + h - 22, w, 22);
  const open = smooth(seg(t, T.curtain, T.curtain + 0.6)) * (1 - smooth(seg(t, 9.35, 9.95)));
  const P = teyzePose(t);
  const here = t < 10.1 ? 1 - smooth(seg(t, 9.6, 10.1)) : fade(t, T.bedtime + 0.15, T.lightsOut + 0.05, 0.45, 0.25);
  let hand = null;
  const night = t > 10.1;
  const her = (alpha, clipH) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y - clipH, night ? w : 420, h + clipH + 2);
    ctx.clip();
    ctx.globalAlpha = alpha;
    const sil = '#4a2a22';
    const colors = night
      ? { skin: sil, hair: sil, shirt: sil, pants: sil, shoes: sil }
      : { skin: '#e8b894', hair: '#a8a29c', shirt: CARDI, pants: CARDI, shoes: CARDI };
    const px = night ? 922 : P.hx, lean = night ? 0.05 : P.lean, look = night ? 0.3 : P.look;
    const hn = person(ctx, px, SILL + TEYZE_H / 2, TEYZE_H, {
      dir: 1, lean, look, smile: !night && P.smile > 0.5, colors,
      hands: night ? [[22, 12], [14, 12]] : [P.near, P.far],
    });
    yazma(ctx, px, SILL + TEYZE_H / 2, lean, look, night ? sil : null);
    ctx.restore();
    if (!night) hand = [P.hx + hn[0], SILL + TEYZE_H / 2 + hn[1]];
  };
  if (here > 0.01 && !night) her(here, 60);
  // the lace, gathered to the left while the window is open
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  lace(ctx, x, y, w * (1 - 0.8 * open), h, light * (d > 0.3 ? 1 : 0.35), d, 0.88);
  ctx.restore();
  // at bedtime, her shadow on the lit curtain as she looks out at the moon
  if (here > 0.01 && night) her(here * 0.5, 0);
  if (open < 0.99) {
    ctx.fillStyle = css(mixRgb('#f6ecda', '#2a2640', d * 0.7));
    ctx.fillRect(x + 38, y, 4, h * (1 - open));
    ctx.fillRect(x, y + 52, w * (1 - open), 4);
  }
  // the sill with a pot of geraniums
  ctx.fillStyle = css(mixRgb('#d8cbb4', '#232034', d * 0.75));
  ctx.fillRect(x - 12, SILL + 4, w + 24, 8);
  ctx.fillStyle = css(mixRgb('#b8643c', '#3a2a30', d * 0.6));
  ctx.fillRect(x - 6, SILL - 12, 18, 16);
  for (const [dx, dy, r, col] of [[-2, -16, 6, '#5f9a52'], [8, -18, 6, '#4f8a48'], [0, -22, 4, '#e0405a'], [7, -25, 3.6, '#e0405a']]) disc(ctx, x + dx, SILL + dy, r, css(mixRgb(col, '#2a2436', d * 0.6)));
  if (light > 0 && d > 0.2) add(ctx, () => glow(ctx, x + w / 2, y + h / 2, 170, [255, 190, 110], 0.14 * light * d));
  // the jug: in her hand while she pours, then left on the sill for the night
  const put = smooth(seg(t, 2.92, 3.14));
  if (put < 1 && hand) jug(ctx, lerp(hand[0], JUG_REST[0], put), lerp(hand[1], JUG_REST[1], put), P.tilt * (1 - put), d);
  else if (put >= 1) jug(ctx, JUG_REST[0], JUG_REST[1], 0, d);
  return hand;
}

function laundry(ctx, t, d) {
  const line = (k) => [lerp(360, 760, k), 310 - 4 * k + 2 * 30 * k * (1 - k) * 1.1];
  // iron brackets in the wall with a pulley wheel at each end
  const iron = css(mixRgb('#3a3230', '#15131e', d));
  for (const [px, py, sx] of [[360, 310, -1], [760, 306, 1]]) {
    ctx.fillStyle = iron;
    ctx.fillRect(px + sx * 4 - 2, py - 16, 4, 16);
    ctx.fillRect(px + (sx > 0 ? 0 : -14), py - 16, 14, 3);
    disc(ctx, px, py - 2, 6, iron);
    disc(ctx, px, py - 2, 2, css(mixRgb('#8a7a6a', '#2a2636', d)));
  }
  ctx.strokeStyle = css(mixRgb('#5a4a40', '#1a1628', d));
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(360, 310);
  ctx.quadraticCurveTo(560, 344, 760, 306);
  ctx.stroke();
  const items = [
    ['shirt', 0.12, '#e05a5a'], ['sock', 0.28, '#f2d06a'], ['sock', 0.33, '#f2d06a'],
    ['towel', 0.47, '#6aa0d8'], ['dress', 0.66, '#f4f0e8'], ['pants', 0.86, '#8ac47a'],
  ];
  items.forEach(([kind, k, col], i) => {
    const [x, y] = line(k);
    const sw = 4 * Math.sin(t * 1.6 + i);
    const c = css(mixRgb(col, '#2a2436', d * 0.7));
    ctx.fillStyle = c;
    ctx.beginPath();
    if (kind === 'shirt') {
      ctx.moveTo(x - 22, y);
      ctx.lineTo(x + 22, y);
      ctx.lineTo(x + 34, y + 14);
      ctx.lineTo(x + 24, y + 22);
      ctx.lineTo(x + 18 + sw, y + 56);
      ctx.lineTo(x - 18 + sw, y + 56);
      ctx.lineTo(x - 24, y + 22);
      ctx.lineTo(x - 34, y + 14);
    } else if (kind === 'sock') {
      ctx.moveTo(x - 5, y);
      ctx.lineTo(x + 5, y);
      ctx.lineTo(x + 5 + sw * 0.5, y + 24);
      ctx.lineTo(x + 14 + sw * 0.5, y + 30);
      ctx.lineTo(x + 10 + sw * 0.5, y + 36);
      ctx.lineTo(x - 5 + sw * 0.5, y + 30);
    } else if (kind === 'towel') {
      ctx.moveTo(x - 26, y);
      ctx.lineTo(x + 26, y);
      ctx.lineTo(x + 26 + sw, y + 62);
      ctx.lineTo(x - 26 + sw, y + 62);
    } else if (kind === 'dress') {
      ctx.moveTo(x - 14, y);
      ctx.lineTo(x + 14, y);
      ctx.lineTo(x + 12, y + 20);
      ctx.lineTo(x + 28 + sw, y + 70);
      ctx.lineTo(x - 28 + sw, y + 70);
      ctx.lineTo(x - 12, y + 20);
    } else {
      ctx.moveTo(x - 18, y);
      ctx.lineTo(x + 18, y);
      ctx.lineTo(x + 18 + sw, y + 64);
      ctx.lineTo(x + 4 + sw, y + 64);
      ctx.lineTo(x + sw * 0.5, y + 22);
      ctx.lineTo(x - 4 + sw, y + 64);
      ctx.lineTo(x - 18 + sw, y + 64);
    }
    ctx.fill();
    if (kind === 'towel') {
      ctx.fillStyle = css(mixRgb('#f4f0e8', '#2a2436', d * 0.7));
      ctx.fillRect(x - 26 + sw * 0.8, y + 48, 52, 5);
    }
    ctx.fillStyle = css(mixRgb('#c79a5a', '#2a2436', d * 0.7));
    for (const px of kind === 'sock' ? [0] : [-12, 12]) ctx.fillRect(x + px - 1.5, y - 5, 3, 9);
  });
}

/** How much of window (r, c) shows above the stairs in front of it; slivers are left out. */
function peek(r, c) {
  const x = 40 + c * 170 + 40, y = 110 + r * 190;
  return stepY(clamp(Math.floor((x - X0) / RUN), 0, N - 1)) - 8 - (y - 8);
}

function building(ctx, t) {
  const d = dark(t);
  const wall = mixRgb('#e4c08a', '#3a3350', d * 0.75);
  ctx.fillStyle = css(wall);
  ctx.fillRect(-300, 40, 1380, H + 400);
  // a roofline: chimneys and an old antenna against the sky
  const roofCol = css(mixRgb('#8a5a48', '#1c1a2c', d * 0.85));
  ctx.fillStyle = roofCol;
  for (const [cx, w, h] of [[150, 30, 24], [640, 26, 20], [890, 34, 26]]) {
    ctx.fillRect(cx, 40 - h, w, h);
    ctx.fillRect(cx - 4, 40 - h - 5, w + 8, 6);
  }
  ctx.fillRect(420, 6, 2.5, 34);
  ctx.fillRect(404, 12, 34, 2.5);
  ctx.fillRect(409, 21, 24, 2.5);
  ctx.fillStyle = css(mixRgb(wall, [60, 40, 50], 0.25));
  ctx.fillRect(-300, 40, 1380, 22);
  ctx.fillRect(1040, 40, 40, H + 400);
  // string courses between the floors
  for (let r = 1; r < 5; r++) {
    const y = 110 + r * 190 - 42;
    ctx.fillStyle = css(mixRgb(wall, [255, 244, 222], 0.28));
    ctx.fillRect(-300, y, 1340, 7);
    ctx.fillStyle = css(mixRgb(wall, [60, 40, 50], 0.18));
    ctx.fillRect(-300, y + 7, 1340, 4);
  }
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
      if ((r === 2 && c === 5) || (r === 2 && c === 2) || peek(r, c) < 44) continue;
      windowAt(ctx, t, r, c, d);
    }
  }
  cumba(ctx, t, d);
  laundry(ctx, t, d);
  return teyzeWindow(ctx, t, d);
}

// ——— the stairs ———

function stairs(ctx, t) {
  const d = dark(t);
  const top = stepY(N - 1) + RISE + 60;
  ctx.fillStyle = css(mixRgb('#9a9088', '#2a2838', d * 0.8));
  ctx.beginPath();
  ctx.moveTo(-300, H + 400);
  ctx.lineTo(-300, stepY(0) + RISE + 60);
  for (let i = 0; i < N; i++) {
    ctx.lineTo(stepX(i), stepY(i) + RISE + 60);
    ctx.lineTo(stepX(i) + RUN, stepY(i) + RISE + 60);
  }
  ctx.lineTo(2700, top);
  ctx.lineTo(2700, H + 400);
  ctx.fill();
  ctx.strokeStyle = css(mixRgb('#7d746e', '#1c1a28', d * 0.8));
  ctx.lineWidth = 2;
  for (let r = 0; r < 14; r++) {
    for (let c = 0; c < 30; c++) {
      const x = c * 92 + (r % 2) * 46, y = 380 + r * 52;
      const i = Math.min(N - 1, Math.floor((x - X0) / RUN));
      if (i < 0 || y < (x > stepX(N) ? top + 6 : stepY(i) + RISE + 66)) continue;
      ctx.strokeRect(x, y, 92, 52);
    }
  }
  // a few stones set in a different shade
  for (let q = 0; q < 26; q++) {
    const r = Math.floor(hash(q, 64) * 14), c = Math.floor(hash(q, 65) * 30);
    const x = c * 92 + (r % 2) * 46, y = 380 + r * 52;
    const i = Math.min(N - 1, Math.floor((x - X0) / RUN));
    if (i < 0 || y < (x > stepX(N) ? top + 6 : stepY(i) + RISE + 66)) continue;
    ctx.fillStyle = css(mixRgb(hash(q, 66) > 0.5 ? '#aaa096' : '#8a8078', '#2a2838', d * 0.8));
    ctx.fillRect(x + 1, y + 1, 90, 50);
  }
  // the parapet at the top
  ctx.fillStyle = css(mixRgb('#c9c0b4', '#3a3850', d * 0.75));
  ctx.fillRect(stepX(N) - 4, top - 10, 900, 12);
  cesme(ctx, t, d);
  // ivy spilling down the wall in three full cascades
  for (const [cx, cy, wide, n, seed] of [[1622, stepY(10) + 118, 110, 8, 1], [1832, top - 6, 150, 10, 2], [2080, top - 6, 120, 8, 3]]) {
    for (let s = 0; s < n; s++) {
      const x0 = cx - wide / 2 + (wide * (s + 0.5)) / n + 10 * (hash(s, 60 + seed) - 0.5);
      const len = (70 + 170 * hash(s, 62 + seed)) * (1 - 0.55 * Math.abs(s / (n - 1) - 0.5));
      const stemAt = (k) => x0 + 3 * Math.sin(t * 1.1 + s + k * 0.03) + 7 * Math.sin(k * 0.045 + s * 1.7);
      ctx.strokeStyle = css(mixRgb('#40603a', '#172224', d * 0.75));
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let k = 0; k <= len; k += 10) k ? ctx.lineTo(stemAt(k), cy + k) : ctx.moveTo(stemAt(k), cy + k);
      ctx.stroke();
      for (let k = 2, j = 0; k < len; k += 7.5, j++) {
        const side = j % 2 ? 1 : -1, sz = 8.5 - (k / len) * 3.5;
        ctx.fillStyle = css(mixRgb(['#4f8a48', '#6aa35a', '#3f7a40'][(j + s) % 3], '#18282a', d * 0.75));
        ctx.beginPath();
        ctx.ellipse(stemAt(k) + side * sz * 0.8, cy + k, sz, sz * 0.66, side * 0.6, 0, TAU);
        ctx.fill();
      }
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
    ctx.fillStyle = css(mixRgb(col, [30, 20, 40], 0.12));
    ctx.fillRect(x, y + RISE + 50, RUN + 1, 12);
    ctx.fillStyle = css(mixRgb('#e9e2d6', '#4a4660', d * 0.7));
    ctx.fillRect(x - 4, y - 8, RUN + 8, 10);
  }
}

/** An Ottoman street fountain set into the wall: marble, a pointed niche, a brass tap and its trough. */
const CESME = [1470, 1052];
function cesme(ctx, t, d) {
  const [x, base] = CESME;
  const L = lampOn(t, 2);
  const marble = mixRgb('#ece4d4', '#4a4862', d * 0.72), veined = mixRgb(marble, [150, 140, 128], 0.28);
  const niche = mixRgb('#cfc4b0', '#34324a', d * 0.72);
  // the pavement at the foot of the wall
  ctx.fillStyle = css(mixRgb('#8a8078', '#26243a', d * 0.8));
  ctx.fillRect(180, base + 14, 2600, 400);
  ctx.fillStyle = css(mixRgb('#b0a698', '#34324a', d * 0.8));
  ctx.fillRect(180, base + 14, 2600, 5);
  ctx.fillStyle = css(marble);
  ctx.fillRect(x - 74, base - 272, 148, 272);
  ctx.fillStyle = css(veined);
  ctx.fillRect(x - 84, base - 284, 168, 14);
  ctx.fillRect(x - 78, base - 292, 156, 8);
  ctx.fillRect(x - 74, base - 272, 148, 4);
  // the pointed arch of the niche
  ctx.fillStyle = css(niche);
  ctx.beginPath();
  ctx.moveTo(x - 48, base - 20);
  ctx.lineTo(x - 48, base - 170);
  ctx.quadraticCurveTo(x - 46, base - 214, x, base - 236);
  ctx.quadraticCurveTo(x + 46, base - 214, x + 48, base - 170);
  ctx.lineTo(x + 48, base - 20);
  ctx.fill();
  ctx.strokeStyle = css(veined);
  ctx.lineWidth = 3;
  ctx.stroke();
  // a carved rosette in the tympanum
  for (let p = 0; p < 8; p++) {
    const a = (p / 8) * TAU;
    disc(ctx, x + Math.cos(a) * 9, base - 190 + Math.sin(a) * 9, 5, css(veined));
  }
  disc(ctx, x, base - 190, 5, css(marble));
  // the brass tap and a thin run of water into the trough
  const brass = mixRgb('#c9953e', '#5a4a3a', d * 0.6);
  ctx.fillStyle = css(brass);
  disc(ctx, x, base - 104, 9, css(brass));
  ctx.fillRect(x - 3, base - 104, 6, 22);
  ctx.fillRect(x - 5, base - 84, 10, 5);
  ctx.strokeStyle = css(mixRgb('#bfe2f2', '#7090b0', d * 0.6), 0.85);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, base - 79);
  ctx.lineTo(x + 0.8 * Math.sin(t * 9), base - 36);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const k = (t * 1.7 + i / 3) % 1;
    disc(ctx, x + (hash(i, 51) - 0.5) * 16 * k, base - 36 - 8 * Math.sin(k * Math.PI), 1.3, css([230, 245, 255], 0.7 * (1 - k)));
  }
  // the trough
  ctx.fillStyle = css(mixRgb('#c2b8a6', '#3a384e', d * 0.72));
  ctx.fillRect(x - 60, base - 38, 120, 38);
  ctx.fillStyle = css(veined);
  ctx.fillRect(x - 66, base - 42, 132, 8);
  ctx.fillStyle = css(mixRgb('#8fbfd8', '#3a5a86', d * 0.7));
  ctx.fillRect(x - 58, base - 36, 116, 3);
  // its own little lantern, lit at dusk
  const ly = base - 318;
  ctx.fillStyle = '#2a2630';
  ctx.fillRect(x - 2, ly - 34, 4, 22);
  ctx.fillRect(x - 12, ly - 14, 24, 4);
  ctx.beginPath();
  ctx.moveTo(x - 11, ly - 10);
  ctx.lineTo(x + 11, ly - 10);
  ctx.lineTo(x + 8, ly + 14);
  ctx.lineTo(x - 8, ly + 14);
  ctx.fill();
  ctx.fillStyle = css(mixRgb([70, 70, 90], [255, 222, 150], L));
  ctx.fillRect(x - 6, ly - 6, 12, 16);
  if (L > 0.02) {
    add(ctx, () => {
      glow(ctx, x, ly + 2, 300, [255, 180, 100], 0.34 * L);
      glow(ctx, x, ly + 2, 60, [255, 230, 170], 0.55 * L);
    });
  }
}

function lamp(ctx, t, i, idx, post = 250) {
  const [x, y] = on(i, 0.82);
  const L = lampOn(t, idx);
  const top = y - post;
  ctx.fillStyle = '#2a2630';
  ctx.fillRect(x - 5, top, 10, post);
  ctx.fillRect(x - 12, y - 20, 24, 20);
  ctx.fillRect(x - 8, y - post * 0.6, 16, 8);
  ctx.beginPath();
  ctx.moveTo(x - 24, top);
  ctx.lineTo(x + 24, top);
  ctx.lineTo(x + 16, top - 40);
  ctx.lineTo(x - 16, top - 40);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 20, top - 40);
  ctx.lineTo(x, top - 56);
  ctx.lineTo(x + 20, top - 40);
  ctx.fill();
  ctx.fillStyle = css(mixRgb([70, 70, 90], [255, 222, 150], L));
  ctx.fillRect(x - 15, top - 34, 30, 30);
  if (L > 0.02) {
    add(ctx, () => {
      glow(ctx, x, top - 20, 380, [255, 180, 100], 0.42 * L);
      glow(ctx, x, top - 20, 90, [255, 230, 170], 0.6 * L);
    });
  }
  return [x, top - 20];
}
const LAMP_B_POST = 205;

/** Moths wheeling round a lamp once it is lit. */
function moths(ctx, t, head, idx) {
  const L = lampOn(t, idx) * smooth(seg(t, T.lamps + 0.8 + idx, T.lamps + 2 + idx));
  if (L < 0.02) return;
  for (let m = 0; m < 5; m++) {
    const a = t * (1.8 + 1.6 * hash(m, idx * 7 + 1)) + hash(m, idx * 7 + 2) * TAU;
    const R = 24 + 34 * hash(m, idx * 7 + 3);
    const x = head[0] + Math.cos(a) * R + 7 * noise(t * 3 + m * 5, 17 + idx);
    const y = head[1] + 4 + Math.sin(a * 1.3) * R * 0.55 + 7 * noise(t * 3 + m * 5, 23 + idx);
    const f = Math.abs(Math.sin(t * 37 + m * 2));
    ctx.fillStyle = css([255, 244, 222], 0.85 * L);
    ctx.beginPath();
    ctx.ellipse(x - 2, y, 0.8 + 2.6 * f, 1.8, 0.4, 0, TAU);
    ctx.ellipse(x + 2, y, 0.8 + 2.6 * f, 1.8, -0.4, 0, TAU);
    ctx.fill();
  }
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
    if (k > 0) add(ctx, () => glow(ctx, p[0], p[1] + 6, 40, c, 0.35 * k));
  }
}

// ——— little things on the steps ———

function pot(ctx, x, y, s, kind, t, d, seed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const dim = (c) => css(mixRgb(c, '#26223a', d * 0.6));
  if (kind === 'tin') {
    // an old olive-oil tin, painted, with basil
    ctx.fillStyle = dim('#3f86a8');
    ctx.fillRect(-13, -30, 26, 30);
    ctx.fillStyle = dim('#2f6a88');
    ctx.fillRect(-13, -30, 26, 3);
    ctx.fillRect(-13, -12, 26, 2);
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI * (0.1 + 0.8 * hash(i, seed));
      disc(ctx, Math.cos(a) * 12 * hash(i, seed + 1), -34 + Math.sin(a) * 12, 5, dim(i % 2 ? '#5aa04a' : '#78b85a'));
    }
  } else {
    // terracotta with a geranium
    ctx.fillStyle = dim('#c0643a');
    ctx.beginPath();
    ctx.moveTo(-15, -30);
    ctx.lineTo(15, -30);
    ctx.lineTo(11, 0);
    ctx.lineTo(-11, 0);
    ctx.fill();
    ctx.fillStyle = dim('#d27a4c');
    ctx.fillRect(-17, -32, 34, 6);
    for (let i = 0; i < 8; i++) disc(ctx, -12 + 24 * hash(i, seed), -38 - 12 * hash(i, seed + 1), 7, dim(i % 2 ? '#4f8a48' : '#61a052'));
    for (let i = 0; i < 4; i++) {
      const fx = -10 + 20 * hash(i, seed + 2), fy = -50 - 10 * hash(i, seed + 3) + Math.sin(t * 1.3 + i) * 1.2;
      for (let p = 0; p < 5; p++) disc(ctx, fx + Math.cos((p / 5) * TAU) * 3.2, fy + Math.sin((p / 5) * TAU) * 3.2, 2.8, dim(kind === 'pink' ? '#e86aa0' : '#e0404a'));
    }
  }
  ctx.restore();
}

function bowlBack(ctx, t, d) {
  const [bx, by] = BOWL;
  ctx.fillStyle = css(mixRgb('#7c848f', '#2c2c40', d * 0.6));
  ctx.beginPath();
  ctx.ellipse(bx, by - BH, BR, 5, 0, 0, TAU);
  ctx.fill();
  const fill = smooth(seg(t, T.pour + 0.25, T.poured)) * (1 - 0.35 * smooth(seg(t, T.drink, T.drunk)));
  if (fill > 0.01) {
    ctx.fillStyle = css(mixRgb('#a7d3ea', '#5a7aa8', d * 0.7));
    ctx.beginPath();
    ctx.ellipse(bx, by - BH + (1 - fill) * 1.5, (BR - 3) * (0.7 + 0.3 * fill), 3.6, 0, 0, TAU);
    ctx.fill();
  }
}

/** Ripples on the water, drawn in front: while it fills, and as the grey laps. */
function ripple(ctx, t) {
  const [bx, by] = BOWL;
  const lap = t > T.drink && t < T.drunk ? ((t - T.drink) * 3.1) % 1 : t > T.pour && t < T.poured + 0.4 ? ((t - T.pour) * 2.4) % 1 : -1;
  if (lap < 0) return;
  ctx.strokeStyle = css([255, 255, 255], 0.6 * (1 - lap));
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(bx + (t > T.drink ? 2 : -2), by - BH, 3 + 16 * lap, 0.8 + 2.6 * lap, 0, 0, TAU);
  ctx.stroke();
}

function bowlFront(ctx, d) {
  const [bx, by] = BOWL;
  ctx.fillStyle = css(mixRgb('#b9c0c9', '#4a4a62', d * 0.6));
  ctx.beginPath();
  ctx.moveTo(bx - BR, by - BH);
  ctx.ellipse(bx, by - BH, BR, 5, 0, Math.PI, 0, true);
  ctx.lineTo(bx + BR - 6, by);
  ctx.lineTo(bx - BR + 6, by);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = css(mixRgb('#d9dee5', '#5a5a74', d * 0.6));
  ctx.fillRect(bx - 17, by - 6, 6, 3);
  ctx.strokeStyle = css(mixRgb('#e8edf2', '#6a6a84', d * 0.6));
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(bx, by - BH, BR, 5, 0, 0, Math.PI);
  ctx.stroke();
}

/** The water running from her jug into the tin bowl. */
function pouring(ctx, t, hand, tilt) {
  const a = seg(t, T.pour + 0.12, T.pour + 0.3), b = seg(t, T.poured - 0.22, T.poured - 0.02);
  if (!hand || a <= 0 || b >= 1) return;
  const sp = spoutOf(hand[0], hand[1], tilt);
  const end = [BOWL[0] - 2, BOWL[1] - BH + 1];
  const P = (u) => [lerp(sp[0], end[0], u) + 5 * Math.sin(u * Math.PI), lerp(sp[1], end[1], u * u)];
  for (const [wid, col] of [[4.5, 'rgba(190,226,246,0.85)'], [1.6, 'rgba(255,255,255,0.8)']]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = wid;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let u = b; u <= a + 1e-6; u += 0.08) {
      const p = P(Math.min(u, a));
      u === b ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
  }
  // splashes
  if (a >= 1) {
    for (let i = 0; i < 4; i++) {
      const k = (t * 3 + hash(i, 81)) % 1;
      const dx = (hash(i, 82) - 0.5) * 30 * k, dy = -12 * Math.sin(k * Math.PI);
      disc(ctx, end[0] + dx, end[1] - 2 + dy, 1.6, `rgba(220,240,255,${0.8 * (1 - k)})`);
    }
  }
}

// ——— the cats ———

/** Lights that warm the cats standing near them: [x, y, lamp index]. */
const LIGHTS = [[on(1, 0.82)[0], stepY(1) - 270, 0], [on(8, 0.82)[0], stepY(8) - LAMP_B_POST - 20, 1], [CESME[0], CESME[1] - 316, 2]];

/** A cat's coat as the evening falls: cooler and dimmer at night, warmed a little by a nearby lamp. */
function coatAt(name, t, x, y) {
  const C = CATS[name], d = dark(t);
  let warm = 0;
  for (const [lx, ly, idx] of LIGHTS) warm += lampOn(t, idx) * Math.exp(-((x - lx) ** 2 + (y - ly) ** 2) / (2 * 280 * 280));
  warm = Math.min(1, warm);
  const tone = (c, night, k) => mixRgb(mixRgb(c, night, k * d), [255, 200, 140], 0.15 * warm);
  return {
    ...C,
    fur: tone(C.fur, [40, 40, 86], 0.35), dark: tone(C.dark, [20, 20, 50], 0.3), light: tone(C.light, [70, 72, 110], 0.3),
    patches: C.patches ? tone(C.patches, [20, 20, 50], 0.3) : undefined,
  };
}

/** Pose b replacing pose a as k runs 0 → 1: the outgoing pose holds until the incoming one is solid. */
const xf = (a, b, k) => (k <= 0 ? a : k >= 1 ? b : { ...b, from: a, k });
function drawXf(ctx, st, fn) {
  if (!st.from) return fn(st);
  ctx.save();
  ctx.globalAlpha *= 1 - smooth(seg(st.k, 0.45, 1));
  fn(st.from);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= smooth(seg(st.k, 0, 0.6));
  fn(st);
  ctx.restore();
}
/** A quick squash about the feet just after a landing. */
function squash(ctx, st, fn) {
  const k = st.land ?? 1;
  if (k >= 1) return fn();
  const q = Math.sin(k * Math.PI);
  ctx.save();
  ctx.translate(st.p[0], st.p[1]);
  ctx.scale(1 + 0.08 * q, 1 - 0.1 * q);
  ctx.translate(-st.p[0], -st.p[1]);
  fn();
  ctx.restore();
}

/** A kit cat asleep or loafing. The kit's clock is held at 0 (so it never writes its "z"); it breathes here instead. */
function snooze(ctx, x, y, s, coat, t, o = {}) {
  const b = 1 + 0.032 * Math.sin(t * (o.rate ?? 1.7) + (o.ph ?? 0));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, b);
  cat(ctx, 0, 0, s, { pose: o.pose ?? 'sleep', coat, t: 0, seed: Math.PI / 2, wag: o.wag ?? 0.5 * Math.sin(t * 0.8 + (o.ph ?? 0)), dir: o.dir ?? 1, blink: o.blink, look: o.look });
  ctx.restore();
  return b;
}

/** A jump from a to b with apex height h; skew < 1 gains height early (to clear something near the take-off). */
const hop = (a, b, k, h, skew = 1) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - Math.sin(k ** skew * Math.PI) * h];
const leapPitch = (k) => Math.sin(k * Math.PI) * lerp(-0.42, 0.3, k);

/**
 * Plays a list of moves: ['walk', t0, t1, from, to], ['crouch', t0, t1, at], ['leap', t0, t1, from, to, arc].
 * Landings squash; the pose after a landing fades in over the one still in the air.
 */
function moves(list, t, o = {}) {
  let i = list.findIndex((m) => t < m[2]);
  if (i < 0) return null;
  const at = (m, tt) => {
    const [kind, t0, t1, a, b, arc, skew] = m;
    const k = seg(tt, t0, t1);
    if (kind === 'walk') return { p: [lerp(a[0], b[0], k), a[1]], pose: 'walk', phase: tt * (o.cadence ?? 11), dir: b[0] < a[0] ? -1 : 1 };
    if (kind === 'crouch') return { p: [a[0] + Math.sin(tt * 22) * 1.5, a[1]], pose: 'crouch', wig: true, dir: m[4] ?? 1 };
    return { p: hop(a, b, k, arc, skew), pose: 'leap', stretch: Math.sin(k * Math.PI), pitch: leapPitch(k), dir: b[0] < a[0] ? -1 : 1 };
  };
  const m = list[i], st = at(m, Math.max(t, m[1]));
  const prev = list[i - 1];
  if (prev && prev[0] === 'leap' && m[0] !== 'leap') {
    st.land = seg(t, m[1], m[1] + 0.16);
    return xf(at(prev, prev[2]), st, seg(t, m[1], m[1] + 0.1));
  }
  return st;
}

// the grey: up the stairs in bounds, clean over the sleeping ginger, over the kitten (who ducks), to the bowl
const GREY_X = BOWL[0] + 56;
const GREY_MOVES = [
  ['walk', T.climb, 4.15, [stepX(0) - 90, stepY(0)], on(0, 0.9)],
  ['leap', 4.15, 4.43, on(0, 0.9), on(1, 0.15), 50],
  ['walk', 4.43, 4.6, on(1, 0.15), on(1, 0.4)],
  ['crouch', 4.6, 4.92, on(1, 0.4)],
  ['leap', 4.92, 5.52, on(1, 0.4), on(3, 0.02), 105, 0.72],
  ['crouch', 5.52, 5.7, on(3, 0.02)],
  ['leap', 5.7, 6.3, on(3, 0.02), on(4, 0.6), 125],
  ['walk', 6.3, 6.5, on(4, 0.6), on(4, 0.93)],
  ['leap', 6.5, 6.78, on(4, 0.93), on(5, 0.1), 45],
  ['walk', 6.78, 7.25, on(5, 0.1), on(5, 0.9)],
  ['leap', 7.25, 7.6, on(5, 0.9), [GREY_X, stepY(6)], 30],
  ['walk', 7.6, 7.75, [GREY_X, stepY(6)], [GREY_X + 0.01, stepY(6)]],
];
const GREY_LANDINGS = GREY_MOVES.filter((m) => m[0] === 'leap').map((m) => m[2]);

function climber(t) {
  if (t < T.climb) return { p: [stepX(0) - 90, stepY(0)], pose: 'walk', phase: 0, dir: 1 };
  const mv = moves(GREY_MOVES, t);
  if (mv) return mv;
  const at = [GREY_X, stepY(6)];
  const stand = { p: at, pose: 'walk', phase: 7.75 * 11, dir: 1 };
  // it turns to look up at her window, a thank-you, then drinks facing left, the bowl clear of her sill
  const settle = { p: at, pose: 'sit', dir: 1, look: 0.2 };
  const thanks = { p: at, pose: 'sit', dir: -1, look: 0.55 };
  if (t < 7.95) return xf(stand, settle, seg(t, 7.75, 7.89));
  if (t < 8.35) return xf(settle, thanks, seg(t, 7.95, 8.07));
  const drink = { p: at, pose: 'crouch', dir: -1, chew: (t - T.drink) * 2.2, tailUp: 0.2 };
  if (t < T.drunk) return xf(thanks, drink, seg(t, 8.35, 8.55));
  const g = groom(t);
  const watch = lerp(0.1, -0.25, smooth(seg(t, 13.4, 14.4))) + 0.25 * smooth(seg(t, 16, 17.5));
  const sit = { p: at, pose: 'sit', dir: -1, look: g ? g.look : watch, groom: g, tabby: true };
  if (t < T.greyNap) return xf({ ...drink, chew: (T.drunk - T.drink) * 2.2 }, sit, seg(t, T.drunk, T.drunk + 0.2));
  // and when the moon is up, a loaf by the bowl, then sleep
  const loaf = { p: at, pose: 'loaf', dir: -1, nap: true, blink: t > T.greyNap + 0.9 };
  if (t < T.greyNap + 1.3) return xf({ ...sit, look: watch, groom: null }, loaf, seg(t, T.greyNap, T.greyNap + 0.22));
  return xf({ ...loaf, blink: true }, { p: at, pose: 'sleep', dir: -1, nap: true }, seg(t, T.greyNap + 1.3, T.greyNap + 1.52));
}

/** The wash: a paw up to the mouth for a few licks, then over the face and ears. */
function groom(t) {
  const k = fade(t, T.groom, T.groomed, 0.3, 0.3);
  if (k <= 0) return null;
  const lick = seg(t, T.groom + 0.3, T.groom + 1.4) > 0 && t < T.groom + 1.4;
  const wipe = smooth(seg(t, T.groom + 1.4, T.groom + 1.6)) * (1 - smooth(seg(t, T.groomed - 0.5, T.groomed - 0.3)));
  const bob = lick ? Math.sin((t - T.groom) * 19) : 0;
  const sweep = 0.5 - 0.5 * Math.cos((t - T.groom - 1.4) * 7);
  return {
    k, tongue: lick && bob > 0.2,
    look: lerp(0.1, -0.55 - 0.18 * bob - 0.25 * wipe, k),
    paw: [lerp(22, 17, wipe * sweep), lerp(-38, -55, wipe * sweep) + (lick ? 1.5 * bob : 0)],
  };
}

function groomPaw(ctx, x, y, s, dir, C, g) {
  const k = g.k;
  const sh = [7, -27], rest = [12, -3];
  const paw = [lerp(rest[0], g.paw[0], k), lerp(rest[1], g.paw[1], k)];
  const elbow = [lerp(12, 17, k), lerp(-14, -22, k)];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * dir, s);
  ctx.lineCap = 'round';
  ctx.strokeStyle = css(C.fur);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(sh[0], sh[1]);
  ctx.lineTo(elbow[0], elbow[1]);
  ctx.lineTo(paw[0], paw[1]);
  ctx.stroke();
  disc(ctx, paw[0] + 0.5, paw[1] - 0.5, 3.4, css(C.light));
  if (g.tongue) disc(ctx, paw[0] + 2.5, paw[1] - 1, 1.8, '#e87a8a');
  ctx.restore();
}

/** Soft tabby marks for the sitting grey: a swirl on the haunch and a bar on the shoulder. */
function tabbyMarks(ctx, x, y, s, dir, C) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * dir, s);
  ctx.lineCap = 'round';
  ctx.strokeStyle = css(C.dark, 0.85);
  ctx.lineWidth = 2.5;
  for (const [r, a0, a1] of [[10.5, 2.5, 4.1], [6, 2.3, 4.3]]) {
    ctx.beginPath();
    ctx.arc(-3, -13, r, a0, a1);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-1, -35);
  ctx.quadraticCurveTo(3, -31, 2, -25);
  ctx.stroke();
  ctx.restore();
}

// the kitten's spots: at the end of step three, then step four, then step five after the tumble
const K3 = on(3, 0.85), K4 = on(4, 0.55), K5 = on(5, 0.4);
const NOSE = on(2, 0.97); // where it sits, nose to nose with the ginger
const BACK = [GINGER[0] - 4, GINGER[1] - 38];

/** The kitten: watch, duck, wiggle, pounce, miss; wiggle, pounce, tumble; then home, and up onto the ginger. */
function kitten(t) {
  const watch = (tt) => ({ p: K3, pose: 'sit', look: 0.6 + 0.3 * Math.sin(tt * 2) });
  if (t < 5.5) return watch(t);
  // the grey sails over its head: it ducks, eyes following
  const duck = { p: K3, pose: 'crouch', look: lerp(-0.3, 1.3, smooth(seg(t, 5.65, 6.25))) };
  if (t < 6.25) return xf(watch(5.5), duck, seg(t, 5.5, 5.62));
  const after = (tt) => ({ p: K3, pose: 'sit', look: lerp(1.0, 0.6 + 0.3 * Math.sin(tt * 2), smooth(seg(tt, 6.5, 7.2))) });
  if (t < T.wiggle1) return xf({ ...duck, look: 1.3 }, after(t), seg(t, 6.25, 6.4));
  const wig1 = { p: [K3[0] + Math.sin(t * 22) * 2, K3[1]], pose: 'crouch', wig: true };
  if (t < T.pounce1) return xf(after(T.wiggle1), wig1, seg(t, T.wiggle1, T.wiggle1 + 0.12));
  if (t < T.pounce1 + 0.6) {
    const k = seg(t, T.pounce1, T.pounce1 + 0.6);
    return { p: hop(K3, K4, k, 110), pose: 'leap', stretch: Math.sin(k * Math.PI), pitch: lerp(-0.5, 0.3, k) };
  }
  const sit4 = { p: K4, pose: 'sit', look: 0.9, land: seg(t, T.pounce1 + 0.6, T.pounce1 + 0.76) };
  if (t < T.wiggle2) return xf({ p: K4, pose: 'leap', stretch: 0, pitch: 0.3 }, sit4, seg(t, T.pounce1 + 0.6, T.pounce1 + 0.7));
  const over = [K5[0] + 40, K5[1] - 30];
  if (t < T.pounce2) return xf({ ...sit4, land: 1 }, { p: [K4[0] + Math.sin(t * 24) * 2, K4[1]], pose: 'crouch', wig: true }, seg(t, T.wiggle2, T.wiggle2 + 0.12));
  if (t < T.tumble) {
    const k = seg(t, T.pounce2, T.tumble);
    return { p: hop(K4, over, k, 170), pose: 'leap', stretch: Math.sin(k * Math.PI), pitch: lerp(-0.7, 0.2, k) };
  }
  if (t < T.dazed) {
    const k = seg(t, T.tumble, T.dazed);
    return { p: hop(over, K5, k, 20), pose: 'loaf', roll: k * TAU };
  }
  const dazedSit = { p: K5, pose: 'sit', dazed: t < T.home - 0.6, dir: -1, look: 0.2 };
  if (t < T.home) return xf({ p: K5, pose: 'loaf', roll: TAU }, dazedSit, seg(t, T.dazed, T.dazed + 0.2));
  // home: down three steps, a little walk along each and a hop
  const route = [5, 4, 3, 2], per = 0.72;
  const list = [];
  for (let i = 0; i < route.length - 1; i++) {
    const t0 = T.home + i * per, s = route[i];
    const from = on(s, i ? 0.75 : 0.4), mid = on(s, 0.12);
    const to = i === route.length - 2 ? NOSE : on(route[i + 1], 0.75);
    list.push(['walk', t0, t0 + per * 0.4, from, mid], ['leap', t0 + per * 0.4, t0 + per, mid, to, 30]);
  }
  const arrive = T.home + (route.length - 1) * per;
  list.push(['walk', arrive, arrive + 0.02, NOSE, [NOSE[0] - 0.01, NOSE[1]]]);
  if (t < arrive) {
    const st = moves(list, t, { cadence: 12 });
    return st.pose === 'leap' ? { ...st, pitch: 0.3 * st.stretch, stretch: 0.5 + 0.4 * st.stretch } : st;
  }
  // it sits by the ginger's nose; they touch noses; then it scrambles up onto its back
  const boop = Math.sin(Math.PI * seg(t, T.nose + 0.25, T.nose + 0.6));
  const sitNose = { p: NOSE, pose: 'sit', dir: -1, look: -0.25 - 0.45 * boop, land: seg(t, arrive, arrive + 0.16) };
  if (t < T.hopOn) return xf(moves(list, arrive - 0.001), sitNose, seg(t, arrive, arrive + 0.1));
  if (t < T.hopOn + 0.45) {
    const k = seg(t, T.hopOn, T.hopOn + 0.45);
    return { p: hop(NOSE, BACK, easeInOut(k), 26), pose: 'leap', stretch: 0.6 * Math.sin(k * Math.PI), pitch: -0.3 * Math.sin(k * Math.PI), dir: -1, onBack: k };
  }
  const loaf = { p: BACK, pose: 'loaf', dir: -1, onBack: 1, blink: t > T.curl - 0.4 };
  return xf(loaf, { ...loaf, pose: 'sleep' }, seg(t, T.curl, T.curl + 0.22));
}

/** The ginger sleeps all evening; it lifts its head to meet the kitten and keeps it up while the kitten climbs on. */
function ginger(t) {
  const sleep = { pose: 'sleep' };
  const up = { pose: 'loaf', look: 0.25, blink: (t > T.hopOn + 0.5 && t < T.hopOn + 0.62) || t > T.curl - 0.1 };
  const k1 = seg(t, T.nose - 0.05, T.nose + 0.13), k2 = seg(t, T.curl + 0.15, T.curl + 0.37);
  if (k1 <= 0 || k2 >= 1) return sleep;
  if (k2 > 0) return xf({ ...up, blink: true }, sleep, k2);
  return xf(sleep, up, k1);
}

const LAMP_B_ROOF = [on(8, 0.82)[0], stepY(8) - LAMP_B_POST - 56];

function butterfly(t) {
  // flutters above the kitten, escapes each pounce, circles lamp B, then settles on its roof for the night
  let x, y;
  const base = [K3[0] + 30 + 50 * Math.sin(t * 1.3), K3[1] - 145 + 28 * Math.sin(t * 2.1)];
  const mid = [K4[0] + 120 + 40 * Math.sin(t * 1.6), K4[1] - 220 + 25 * Math.sin(t * 2.3)];
  if (t < T.pounce1 + 0.3) [x, y] = base;
  else if (t < T.pounce2 + 0.4) {
    const k = smooth(seg(t, T.pounce1 + 0.3, T.pounce1 + 1.4));
    [x, y] = [lerp(base[0], mid[0], k), lerp(base[1], mid[1], k)];
  } else {
    const k = smooth(seg(t, T.pounce2 + 0.4, 16.2));
    const a = t * 2.4;
    const ring = [LAMP_B_ROOF[0] + 64 * Math.cos(a), LAMP_B_ROOF[1] + 20 + 26 * Math.sin(a)];
    [x, y] = [lerp(mid[0], ring[0], k), lerp(mid[1], ring[1], k)];
    const land = smooth(seg(t, T.perch - 0.7, T.perch));
    [x, y] = [lerp(x, LAMP_B_ROOF[0] + 2, land), lerp(y, LAMP_B_ROOF[1] - 3, land)];
  }
  return [x, y];
}

function drawButterfly(ctx, x, y, t) {
  const fold = smooth(seg(t, T.perch - 0.12, T.perch + 0.25));
  const f = Math.abs(Math.sin(t * 16));
  const d = dark(t), night = (c) => css(mixRgb(c, [70, 70, 110], 0.45 * d));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.2 * Math.sin(t * 3) * (1 - fold));
  ctx.scale(1.4, 1.4);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side * lerp(0.25 + 0.75 * f, 0.22, fold), 1);
    ctx.fillStyle = night('#f4b73c');
    ctx.beginPath();
    ctx.ellipse(9, -7, 10, 8, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = night('#e8763a');
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

function gulls(ctx, t) {
  // two gulls over the water at golden hour, heading up the Bosphorus, melting into the dusk
  const a = 1 - smooth(seg(t, 7.6, 8.8));
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  for (let i = 0; i < 2; i++) {
    const t0 = i * 0.9;
    const x = 1780 - 118 * (t - t0) - i * 40, y = 262 + i * 34 + 14 * Math.sin(t * 0.9 + i) - 4 * (t - t0);
    if (x < -120 || t < t0) continue;
    const flapping = Math.sin(t * 0.7 + i * 2) > 0.1;
    gull(ctx, x, y, 1.25 - i * 0.12, flapping ? Math.sin(t * 10 + i) : 0.25, -1, { tilt: 0.04 * Math.sin(t * 1.3 + i), shade: 0.25 * dark(t) });
  }
  ctx.restore();
}

// ——— camera: the whole stairs at golden hour, in for the climb and the tumble, up to the moon and the tuxedo,
// back down with the kitten as it goes home, then in close on the two sleepers ———

const CAM = [
  [0, 960, 560, 1.05],
  [2.8, 960, 560, 1.08],
  [4.6, 800, 630, 1.3],
  [12.4, 800, 630, 1.3],
  [14.2, 800, 670, 1.4],
  [14.9, 810, 670, 1.4],
  [16.1, 1235, 470, 1.4],
  [17.3, 1240, 468, 1.4],
  [18.5, 610, 745, 1.45],
  [21.8, 600, 750, 1.45],
  [23.1, 420, 845, 1.95],
  [24, 415, 845, 1.97],
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
  const d = dark(t);
  ctx.save();
  into(0.5);
  sky(ctx, t);
  view(ctx, t);
  ctx.restore();
  ctx.save();
  into(1);
  const hand = building(ctx, t);
  gulls(ctx, t);
  stairs(ctx, t);

  // things left on the steps
  pot(ctx, on(7, 0.5)[0], stepY(7), 1.15, 'geranium', t, d, 3);
  pot(ctx, on(9, 0.86)[0], stepY(9), 1.1, 'tin', t, d, 5);
  pot(ctx, on(11, 0.7)[0], stepY(11), 1.2, 'pink', t, d, 7);
  pot(ctx, on(11, 0.92)[0], stepY(11), 1.0, 'tin', t, d, 9);
  const [tx, ty] = on(9, 0.3);
  ctx.fillStyle = css(mixRgb('#f3efe6', '#6a6680', d * 0.5));
  ctx.beginPath();
  ctx.ellipse(tx + 44, ty - 3, 26, 5, 0, 0, TAU);
  ctx.fill();
  simit(ctx, tx + 44, ty - 8, 17, 0.2, 0.42, 4);
  tea(ctx, tx, ty - 1, 1.5, t, 0);
  bowlBack(ctx, t, d);

  const lampA = lamp(ctx, t, 1, 0);
  const lampB = lamp(ctx, t, 8, 1, LAMP_B_POST);
  stringLights(ctx, t, [lampA[0], lampA[1] - 22], [lampB[0], lampB[1] - 22]);

  // contact shadows always lie on the step under the cat, fainter and smaller the higher it jumps
  const shadow = (x, y, w) => {
    const gy = stepY(clamp(Math.floor((x - X0) / RUN), 0, N - 1));
    const h = clamp((gy - y) / 160, 0, 1);
    ctx.fillStyle = css([30, 20, 40], 0.2 * (1 - 0.6 * h));
    ctx.beginPath();
    ctx.ellipse(x, gy + 1, w * (1 - 0.45 * h), 5 * (1 - 0.3 * h), 0, 0, TAU);
    ctx.fill();
  };

  // at the top: the tuxedo, keeping an eye on the Bosphorus; it follows the shooting star with its head
  const top = on(10, 0.5);
  shadow(top[0], top[1], 48);
  const [, , sk] = starAt(t);
  const starLook = fade(t, T.star - 0.05, T.star + 1.3, 0.12, 0.5);
  const moonLook = lerp(0.1 + 0.15 * Math.sin(t * 0.6), 0.45, smooth(seg(t, T.moon + 0.6, 16)));
  cat(ctx, top[0], top[1], 1.8, {
    pose: 'sit', coat: coatAt('tuxedo', t, top[0], top[1] - 50), t, seed: 4, wag: t > T.moon ? 1.6 : 1,
    look: lerp(moonLook, lerp(1.05, 0.3, easeOut(sk)), starLook),
    blink: Math.sin(t * 0.7) > 0.97 || (t > T.star + 0.75 && t < T.star + 1.05) || (t > 21.2 && Math.sin(t * 1.3) > 0.2),
  });

  // the ginger, asleep on step two all evening; it lifts its head to meet the kitten
  const K = kitten(t), C = climber(t);
  shadow(C.p[0], C.p[1], 48);
  shadow(GINGER[0], GINGER[1], 56);
  const gingerCoat = coatAt('ginger', t, GINGER[0], GINGER[1] - 30);
  let breath = 1;
  drawXf(ctx, ginger(t), (st) => {
    breath = snooze(ctx, GINGER[0], GINGER[1], 1.85, gingerCoat, t, st.pose === 'sleep' ? {} : { pose: st.pose, look: st.look, blink: st.blink });
  });
  // the grey cat, in front of the ginger as it sails over
  const greyCoat = coatAt('grey', t, C.p[0], C.p[1] - 30);
  drawXf(ctx, C, (st) => squash(ctx, st, () => {
    const dir = st.dir ?? 1;
    if (st.nap) return snooze(ctx, st.p[0], st.p[1], 1.75, greyCoat, t, { pose: st.pose, blink: st.blink, ph: 2.1, rate: 1.5, dir });
    cat(ctx, st.p[0], st.p[1], 1.75, {
      pose: st.pose, coat: st.tabby ? { ...greyCoat, stripes: false } : greyCoat, phase: st.phase, stretch: st.stretch, pitch: st.pitch,
      chew: st.chew, tailUp: st.tailUp, t, look: st.look ?? 0, seed: 2, dir, wag: st.wig ? 2.5 : 1,
    });
    if (st.tabby) tabbyMarks(ctx, st.p[0], st.p[1], 1.75, dir, greyCoat);
    if (st.groom) groomPaw(ctx, st.p[0], st.p[1], 1.75, dir, greyCoat, st.groom);
  }));

  bowlFront(ctx, d);
  ripple(ctx, t);
  pouring(ctx, t, hand, hand ? teyzePose(t).tilt : 0);

  // the kitten and its butterfly
  const kitCoat = coatAt('calico', t, K.p[0], K.p[1] - 20);
  if (!K.onBack) shadow(K.p[0], K.p[1], 32);
  drawXf(ctx, K, (st) => {
    if (st.onBack === 1) {
      // riding the ginger's breathing
      snooze(ctx, st.p[0], GINGER[1] - 38 * breath, 1.25, kitCoat, t, { pose: st.pose, dir: -1, blink: st.blink, ph: 1.3, rate: 2.3 });
      return;
    }
    ctx.save();
    if (st.roll) {
      ctx.translate(st.p[0], st.p[1] - 14);
      ctx.rotate(st.roll);
      ctx.translate(-st.p[0], -(st.p[1] - 14));
    }
    squash(ctx, st, () => cat(ctx, st.p[0], st.p[1], 1.25, {
      pose: st.pose, coat: kitCoat, t, look: st.look ?? 0, stretch: st.stretch, pitch: st.pitch, dir: st.dir ?? 1,
      phase: st.phase ?? 0, wag: st.wig ? 3 : 1, seed: 5, blink: st.dazed && Math.sin(t * 5) > 0.5,
    }));
    ctx.restore();
  });
  if (K.dazed) {
    for (let i = 0; i < 3; i++) {
      const a = t * 4 + (i * TAU) / 3;
      const sx = K.p[0] + 6 + Math.cos(a) * 34, sy = K.p[1] - 84 + Math.sin(a) * 10;
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
  moths(ctx, t, lampA, 0);
  moths(ctx, t, lampB, 1);
  ctx.restore();

  vignette(ctx, W, H, 0.34);
  // in from black; at the end the night closes in on the two sleepers
  const dawn = 1 - smooth(seg(t, 0, 0.9));
  if (dawn > 0) {
    ctx.fillStyle = `rgba(8,8,16,${dawn})`;
    ctx.fillRect(0, 0, W, H);
  }
  const ir = seg(t, T.iris, T.end - 0.2);
  if (ir > 0) {
    const cx = W / 2 + (GINGER[0] + 4 - cam.x) * cam.z, cy = H / 2 + (GINGER[1] - 34 - cam.y) * cam.z;
    const r = lerp(1180, 0, easeIn(ir) ** 0.75);
    const g = ctx.createRadialGradient(cx, cy, Math.max(0, r - 110), cx, cy, Math.max(1, r));
    g.addColorStop(0, 'rgba(8,8,16,0)');
    g.addColorStop(1, 'rgba(8,8,16,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  grain(ctx, W, H, t, 0.05);
}

// ——— the music: Kürdi on A, an evening lullaby ———

const A4 = 69;
const kurdi = (d) => makamHz('kurdi', A4, d);
function keysLine(S, t0, notes, o = {}) {
  let t = t0;
  for (const [d, len] of notes) {
    if (d !== null) {
      S.keys(t, kurdi(d), { vel: 0.13, dur: Math.max(1.4, len * 1.6), pan: 0.1, ...o });
      // doubled an octave up by a soft kanun pluck
      if (o.kanun) S.pluck(t + 0.012, kurdi(d + 7), { vel: o.kanun, dur: Math.max(0.8, len * 1.1), wave: 'sawtooth', bend: 30, bright: 3, pan: -0.15 });
    }
    t += len;
  }
}

/** When the lit windows go dark at bedtime (the same choices the picture makes). */
function lightsOff() {
  const out = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
      const id = r * 7 + c;
      if ((r === 2 && (c === 5 || c === 2)) || peek(r, c) < 44 || hash(id, 3) <= 0.35 || hash(id, 9) >= 0.65) continue;
      out.push(T.bedtime + 1.4 * hash(id, 10));
    }
  }
  return out.sort((x, y) => x - y);
}

export function score(S) {
  // evening air and the sea far below; crickets once it is dark
  S.noise(0, { dur: 24, type: 'bandpass', f0: 500, q: 0.3, vel: 0.015, attack: 2, release: 2, lfo: [0.09, 0.5], send: 0.1 });
  S.noise(0, { dur: 24, type: 'lowpass', f0: 380, q: 0.3, vel: 0.014, attack: 2.5, release: 2.5, lfo: [0.13, 0.6], send: 0.1, pan: 0.35 });
  for (let i = 0; i < 28; i++) {
    const t = 11 + i * 0.42 + 0.1 * hash(i, 1);
    if (t > 23) break;
    for (let k = 0; k < 3; k++) S.chirp(t + k * 0.045, { f0: 4300, f1: 4500, dur: 0.03, vel: 0.006, pan: hash(i, 2) > 0.5 ? 0.6 : -0.6 });
  }
  // gulls over the water, and later the ferry: its horn, then the wash of its wake
  S.gull(0.55, { f: 1500, dur: 0.45, vel: 0.013, pan: 0.5 });
  S.gull(1.2, { f: 1680, dur: 0.36, vel: 0.01, pan: 0.42 });
  S.gull(5.4, { f: 1420, dur: 0.5, vel: 0.007, pan: -0.3 });
  S.horn(12.3, { f: 87, dur: 1.5, vel: 0.045, cutoff: 340, send: 0.9, pan: 0.45 });
  S.noise(12.9, { dur: 2.6, type: 'lowpass', f0: 720, f1: 320, q: 0.5, vel: 0.011, attack: 0.8, release: 1.4, lfo: [0.7, 0.5], send: 0.4, pan: 0.45 });
  // as Üsküdar's minarets light up, a far-off, wordless call drifts across the water
  S.ney(11.85, kurdi(1), { vel: 0.02, dur: 0.22, attack: 0.08, release: 0.15, slide: 30, send: 0.9, pan: 0.6 });
  S.ney(12.08, kurdi(0), { vel: 0.026, dur: 1.5, attack: 0.2, release: 0.6, vib: 4.6, send: 0.9, pan: 0.6 });

  // a warm pad underneath, Kürdi on A: Am, Dm, F, Am (moonrise), Dm (home), Am to close — with a soft bass
  const pads = [[0, ['A2', 'E3', 'C4'], 'A2'], [5, ['D3', 'A3', 'F4'], 'D2'], [10, ['F2', 'C3', 'A3'], 'F2'], [14.5, ['A2', 'E3', 'C4'], 'A2'], [18.4, ['D3', 'A3', 'F4'], 'D2'], [21.5, ['A2', 'E3', 'C4'], 'A2']];
  pads.forEach(([t0, notes, bass], i) => {
    const dur = (pads[i + 1]?.[0] ?? 22.8) - t0;
    S.pad(t0, notes, { dur, vel: t0 > 21 ? 0.036 : 0.045, attack: 1.2, release: 1.2, cutoff: 800 });
    S.bass(t0 + 0.05, bass, { vel: 0.03, dur: Math.min(4.5, dur) });
  });

  // the window: the latch and the curtain opening… and at nine, closing again
  S.noise(T.curtain, { dur: 0.07, type: 'bandpass', f0: 2400, q: 2, vel: 0.018, attack: 0.004, release: 0.05, send: 0.1, pan: 0.15 });
  S.noise(T.curtain + 0.05, { dur: 0.55, type: 'bandpass', f0: 3400, f1: 2200, q: 0.6, vel: 0.007, attack: 0.15, release: 0.3, send: 0.2, pan: 0.15 });
  S.noise(9.4, { dur: 0.5, type: 'bandpass', f0: 2200, f1: 3400, q: 0.6, vel: 0.006, attack: 0.15, release: 0.28, send: 0.2, pan: 0.15 });
  S.noise(9.9, { dur: 0.07, type: 'bandpass', f0: 2400, q: 2, vel: 0.016, attack: 0.004, release: 0.05, send: 0.1, pan: 0.15 });
  // water into the tin bowl, with a little kanun run
  S.noise(T.pour + 0.14, { dur: 0.95, type: 'bandpass', f0: 1500, f1: 950, q: 1.1, vel: 0.03, attack: 0.06, release: 0.22, lfo: [11, 0.6], send: 0.25, pan: 0.2 });
  for (let i = 0; i < 6; i++) S.chirp(T.pour + 0.3 + i * 0.14 + 0.05 * hash(i, 3), { f0: 700 + 400 * hash(i, 4), f1: 1300 + 500 * hash(i, 5), dur: 0.05, vel: 0.007, pan: 0.2 });
  [11, 10, 9, 8, 7].forEach((d, i) => S.pluck(T.pour + 0.05 + i * 0.13, kurdi(d), { vel: 0.028, dur: 0.9, wave: 'sawtooth', bend: 35, bright: 3.5, pan: 0.25 }));
  // the jug set down on the sill, then "pıs pıs pıs": she calls the cats
  S.thump(3.12, { f0: 420, f1: 260, dur: 0.08, vel: 0.02, pan: 0.15 });
  for (const c of CALLS) S.noise(T.call + c, { dur: 0.1, type: 'bandpass', f0: 5200, q: 1.4, vel: 0.028, attack: 0.015, release: 0.07, send: 0.25, pan: 0.15 });

  // the grey cat climbs: a pluck on every landing, a whoosh on the two big leaps (and a squeak from the ducking kitten)
  GREY_LANDINGS.forEach((t, i) => S.pluck(t - 0.02, kurdi(i + 2 + (i > 1 ? 1 : 0)), { vel: 0.05, dur: 1.2, pan: -0.2 + i * 0.1 }));
  for (const t of [4.92, 5.7]) S.noise(t, { dur: 0.42, type: 'bandpass', f0: 800, f1: 2600, q: 1.2, vel: 0.009, attack: 0.12, release: 0.25, send: 0.2, pan: -0.1 });
  S.chirp(5.58, { f0: 760, f1: 1150, dur: 0.07, vel: 0.011, pan: -0.05 });
  S.chirp(5.66, { f0: 1150, f1: 700, dur: 0.2, vel: 0.011, pan: -0.05 });
  for (let t = T.drink + 0.1; t < T.drunk - 0.2; t += 0.32) {
    if (hash(Math.round(t * 10), 7) < 0.15) continue;
    S.noise(t, { dur: 0.05, type: 'bandpass', f0: 1800 + 300 * hash(Math.round(t * 10), 8), q: 2.2, vel: 0.011, attack: 0.008, release: 0.035, send: 0.1, pan: 0.05 });
  }

  // evening melody, keys doubled by a kanun
  keysLine(S, 3.8, [[4, 1], [3, 0.5], [2, 0.5], [3, 1], [2, 0.5], [1, 0.5], [2, 1.5], [0, 1.5]], { kanun: 0.02 });

  // wiggle… pounce… miss
  for (let i = 0; i < 6; i++) S.pluck(T.wiggle1 + 0.15 * i, kurdi(i % 2 ? 7 : 6), { vel: 0.025, dur: 0.3 });
  S.chirp(T.pounce1, { f0: 500, f1: 2200, dur: 0.35, vel: 0.03 });
  [9, 7, 4].forEach((d, i) => S.bell(T.pounce1 + 0.62 + i * 0.12, kurdi(d), { vel: 0.04 }));

  // dusk: the lamps come on
  keysLine(S, 10.2, [[3, 1], [2, 0.5], [1, 0.5], [0, 1], [-1, 1]], { vel: 0.11 });
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
  S.ney(15.0, kurdi(0), { vel: 0.07, dur: 1.2 });
  S.ney(16.0, kurdi(4), { vel: 0.07, dur: 1.4 });
  // a shooting star
  S.chirp(T.star, { f0: 3600, f1: 1500, dur: 0.55, vel: 0.009, pan: 0.35 });
  [16, 18, 21].forEach((d, i) => S.bell(T.star + 0.35 + i * 0.1, kurdi(d), { vel: 0.016, dur: 1.4, pan: 0.2 - i * 0.2 }));
  // the kitten goes home, a step at a time, with the ney walking it down
  for (let i = 0; i < 3; i++) S.pluck(T.home + (i + 1) * 0.72 - 0.02, kurdi(5 - i), { vel: 0.045, dur: 1, pan: -0.3 });
  for (const [t0, deg, len] of [[18.45, 3, 0.45], [19.0, 2, 0.45], [19.55, 3, 0.7], [20.55, 1, 0.4], [21.0, 0, 1.7]]) S.ney(t0, kurdi(deg), { vel: t0 > 20.9 ? 0.05 : 0.066, dur: len });
  // nose to nose; then up onto the ginger's back
  S.bell(T.nose + 0.42, kurdi(9), { vel: 0.018, dur: 1.2, pan: -0.25 });
  S.thump(T.hopOn + 0.42, { f0: 170, f1: 90, dur: 0.16, vel: 0.035, pan: -0.3 });
  // …and purrs
  for (let k = 0; k < 3; k++) {
    S.noise(T.curl - 0.3 + k * 0.9, { dur: 1.0, type: 'lowpass', f0: 260, q: 0.9, vel: k % 2 ? 0.02 : 0.026, attack: 0.3, release: 0.4, lfo: [23 + (k % 2) * 3, 0.9], send: 0.05, pan: -0.3 });
  }

  // bedtime: light switches clicking off round the block, the teyze's last
  const offs = lightsOff();
  [0, 0.34, 0.67, 1].map((q) => offs[Math.round(q * (offs.length - 1))]).forEach((t, i) => {
    S.noise(t, { dur: 0.012, type: 'bandpass', f0: 3000, q: 1.5, vel: 0.005, attack: 0.004, send: 0.15, pan: -0.4 + 0.25 * i });
  });
  S.noise(T.lightsOut, { dur: 0.016, type: 'bandpass', f0: 2800, q: 1.5, vel: 0.009, attack: 0.004, send: 0.15, pan: 0.2 });

  // goodnight: a slow, soft rolled A minor as the night closes in
  [-3, 0, 2, 4].forEach((d, i) => S.keys(21.85 + i * 0.2, kurdi(d), { vel: 0.038, dur: 2.1 }));
  S.bell(23.0, kurdi(7), { vel: 0.016, dur: 1.2 });
}
