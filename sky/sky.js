// One Sky a Day — a small painting generated from a date.
// The date is the seed: the same day always paints the same sky (and the moon is that day's real moon).
import { TAU, clamp, hash, rng, strSeed, noise, fbm, mixRgb, css, rgb } from '../engine/util.js';
import { glow, disc, SERIF } from '../engine/draw.js';

export const CARD = { w: 1080, h: 1350 };
const M = 44; // passe-partout margin
const PW = CARD.w - M * 2, PH = 1136; // painting size
export const DAY_ONE = '2026-09-26';

// ——— dates ———

const utc = (date) => {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
export const dayNumber = (date) => Math.round((utc(date) - utc(DAY_ONE)) / 86400000) + 1;
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const shiftDate = (date, days) => new Date(utc(date) + days * 86400000).toISOString().slice(0, 10);
export const longDate = (date) =>
  new Date(utc(date)).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** The real moon for that evening: age in days, phase 0..1, name. */
export function moonOf(date) {
  const jd = (utc(date) + 20 * 3600000) / 86400000 + 2440587.5;
  const P = 29.530588853;
  const age = (((jd - 2451550.1) % P) + P) % P;
  const phase = age / P;
  const names = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
  return { age, phase, lit: (1 - Math.cos(phase * TAU)) / 2, name: names[Math.round(phase * 8) % 8] };
}

// ——— the recipe ———

const TIMES = ['dawn', 'day', 'golden', 'dusk', 'night', 'night'];
const LANDS = ['sea', 'mountains', 'hills', 'dunes', 'islands', 'city', 'forest'];
const FOCALS = {
  sea: ['lighthouse', 'sailboat', 'sailboat'],
  islands: ['lighthouse', 'sailboat'],
  mountains: ['cabin', 'tent', 'sitter'],
  hills: ['windmill', 'tree', 'house', 'sitter'],
  dunes: ['wanderer', 'tent'],
  city: ['none'],
  forest: ['cabin', 'tent'],
};

const ADJ = ['Quiet', 'Patient', 'Borrowed', 'Slow', 'Gentle', 'Forgotten', 'Silver', 'Amber', 'Paper', 'Lantern', 'Wandering',
  'Tender', 'Small', 'Faraway', 'Sleepy', 'Honest', 'Velvet', 'Soft', 'Distant', 'Kind', 'Unhurried', 'Hushed', 'Salt', 'Wild', 'Early', 'Late'];
const NOUN = {
  sea: ['Harbor', 'Tide', 'Shore', 'Crossing', 'Current', 'Sea'],
  islands: ['Islands', 'Archipelago', 'Harbor', 'Crossing'],
  mountains: ['Ridge', 'Summit', 'Pass', 'Snowline', 'Mountains'],
  hills: ['Meadow', 'Hills', 'Field', 'Orchard', 'Path'],
  dunes: ['Dunes', 'Caravan', 'Mirage', 'Oasis', 'Desert'],
  city: ['City', 'Rooftops', 'Windows', 'Streets'],
  forest: ['Pines', 'Clearing', 'Woods', 'Trail'],
};
const WHEN = { dawn: ['Morning', 'First Light', 'Daybreak'], day: ['Afternoon', 'Noon', 'Daylight'], golden: ['Hour', 'Glow', 'Late Light'], dusk: ['Evening', 'Afterglow', 'Dusk'], night: ['Night', 'Stars', 'Midnight'] };

export function recipe(date) {
  const r = rng(strSeed(`one-sky:${date}`));
  const pick = (a) => a[Math.floor(r() * a.length)];
  const month = Number(date.slice(5, 7));
  const winter = month === 12 || month <= 2;
  const time = pick(TIMES);
  const land = pick(LANDS);
  const w = r();
  let weather = w < 0.3 ? 'clouds' : w < 0.38 ? (winter ? 'snow' : 'rain') : w < 0.45 ? 'fog' : 'clear';
  if (winter && r() < 0.25) weather = 'snow';
  const aurora = time === 'night' && r() < 0.25;
  const focal = pick(FOCALS[land]);
  const balloon = (time === 'day' || time === 'golden' || time === 'dawn') && weather !== 'rain' && r() < 0.25;
  const hue = (r() - 0.5) * 26;
  const pattern = r();
  const a = pick(ADJ), n = pick(NOUN[land]), wh = pick(WHEN[time]);
  const title = pattern < 0.45 ? `The ${a} ${n}` : pattern < 0.75 ? `${a} ${wh}` : `${n} at ${wh}`;
  return {
    date, no: dayNumber(date), time, land, weather, aurora, focal, balloon, hue, title,
    moon: moonOf(date), seed: Math.floor(r() * 1e9), music: musicRecipe(r, time),
  };
}

// ——— colour ———

function hueShift(c, deg) {
  let [r, g, b] = rgb(c).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  h = (h + deg / 360 + 1) % 1;
  const f = (p, q, t) => {
    t = (t + 1) % 1;
    return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
  };
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255];
}

const PALETTES = {
  dawn: { sky: ['#27305a', '#6c69a2', '#e7a5a6', '#ffd4a9'], haze: '#efbfb3', dark: 0.55, light: '#ffc9a3', sun: 0.8 },
  day: { sky: ['#2c6cbd', '#5b9bdc', '#a7cff0', '#e6f2fa'], haze: '#cfe4f2', dark: 0, light: '#fff6e0', sun: 0.2 },
  golden: { sky: ['#335c9a', '#b096b2', '#f4b680', '#ffe0a6'], haze: '#f2c595', dark: 0.3, light: '#ffcf8a', sun: 0.74 },
  dusk: { sky: ['#131a40', '#473878', '#c46878', '#ffa36d'], haze: '#d48a82', dark: 0.78, light: '#ff9f7a', sun: null },
  night: { sky: ['#03050e', '#08112b', '#132550', '#23406e'], haze: '#29416e', dark: 0.9, light: '#aebde0', sun: null },
};
const LAND_COLOR = { sea: '#2f5f5a', islands: '#35604a', mountains: '#4d5f7a', hills: '#4f8a4f', dunes: '#c98c55', city: '#56607a', forest: '#2f5a3e' };
const SILHOUETTE = [10, 12, 26];

function palette(R) {
  const P = PALETTES[R.time];
  const sh = (c) => hueShift(c, R.hue);
  const sky = P.sky.map(sh);
  const haze = sh(P.haze);
  const base = mixRgb(sh(LAND_COLOR[R.land]), mixRgb(SILHOUETTE, sky[0], 0.25), P.dark);
  return { ...P, sky, haze, base, light: sh(P.light) };
}

// ——— the painting (in painting coordinates, PW × PH) ———

const HORIZON = { sea: 0.62, islands: 0.64, mountains: 0.66, hills: 0.7, dunes: 0.72, city: 0.72, forest: 0.7 };

function ridgeY(R, i, x) {
  const s = R.seed % 1000 + i * 37;
  const k = [0.58, 0.66, 0.76, 0.88];
  switch (R.land) {
    case 'mountains': {
      // ridged noise: sharp peaks where the noise crosses zero
      const base = [0.52, 0.6, 0.71, 0.85][i] * PH, amp = [380, 280, 170, 90][i];
      let v = 0, a = 0.55, fr = 0.0026 + i * 0.0011, norm = 0;
      for (let o = 0; o < 5; o++) {
        v += a * (1 - Math.abs(noise(x * fr, s + o * 13)));
        norm += a;
        a *= 0.5;
        fr *= 2.1;
      }
      return base - amp * (v / norm) ** 2.4;
    }
    case 'dunes': {
      const base = [0.64, 0.7, 0.79, 0.9][i] * PH, amp = [60, 85, 100, 90][i];
      const ph = x * (0.004 - i * 0.0005) + noise(x * 0.002, s) * 2;
      return base - amp * (0.5 + 0.5 * Math.sin(ph - 0.5 * Math.cos(ph))) ** 1.4;
    }
    case 'sea':
    case 'islands':
      return HORIZON[R.land] * PH;
    default: {
      const base = k[i] * PH + (R.land === 'hills' ? 20 : 0), amp = [110, 100, 85, 70][i];
      return base - amp * (0.5 + 0.5 * fbm(x * (0.0016 + i * 0.0006), s, 4));
    }
  }
}

function layerColor(C, i, n = 4) {
  return mixRgb(C.haze, C.base, ((i + 1) / n) ** 0.75);
}

function paintSky(ctx, R, C) {
  const hy = HORIZON[R.land] * PH;
  const g = ctx.createLinearGradient(0, 0, 0, hy + 40);
  C.sky.forEach((c, i) => g.addColorStop(i / (C.sky.length - 1), css(c)));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PW, PH);
  const sunX = PW * (0.3 + 0.4 * hash(R.seed, 1));
  if (C.sun !== null) {
    const sy = C.sun * hy;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, sunX, sy, 700, C.light, R.time === 'day' ? 0.35 : 0.5);
    ctx.restore();
    disc(ctx, sunX, sy, R.time === 'day' ? 30 : 42, css([255, 248, 228], R.weather === 'fog' ? 0.5 : 0.95));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, sunX, sy, 150, [255, 245, 220], 0.4);
    ctx.restore();
  } else {
    // afterglow on the horizon
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, sunX, hy + 60, 900, C.light, R.time === 'dusk' ? 0.35 : 0.12);
    ctx.restore();
  }
  return sunX;
}

function paintMoon(ctx, R, x, y, r) {
  const { phase } = R.moon;
  const k = Math.cos(phase * TAU); // 1 new … -1 full
  if (R.moon.lit < 0.03) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y, r * 9, [200, 215, 255], 0.12 + 0.2 * R.moon.lit);
  ctx.restore();
  disc(ctx, x, y, r, css([40, 50, 80], 0.35)); // earthshine
  ctx.fillStyle = '#f3efdf';
  ctx.beginPath();
  const waxing = phase < 0.5;
  if (waxing) {
    ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, false);
    ctx.ellipse(x, y, r * Math.abs(k), r, 0, Math.PI / 2, -Math.PI / 2, k > 0);
  } else {
    ctx.arc(x, y, r, Math.PI / 2, (3 * Math.PI) / 2, false);
    ctx.ellipse(x, y, r * Math.abs(k), r, 0, (3 * Math.PI) / 2, Math.PI / 2, k > 0);
  }
  ctx.fill();
}

function pine(ctx, x, y, h, color) {
  ctx.fillStyle = css(color);
  ctx.beginPath();
  for (let k = 0; k < 3; k++) {
    const top = y - h + k * h * 0.26, w = h * (0.22 + k * 0.1);
    ctx.moveTo(x, top);
    ctx.lineTo(x + w, top + h * 0.42);
    ctx.lineTo(x - w, top + h * 0.42);
  }
  ctx.fill();
  ctx.fillRect(x - h * 0.035, y - h * 0.18, h * 0.07, h * 0.2);
}

function paintLand(ctx, R, C) {
  const r = rng(R.seed + 5);
  const hy = HORIZON[R.land] * PH;
  const night = R.time === 'night' || R.time === 'dusk';

  if (R.land === 'sea' || R.land === 'islands') {
    // distant land on the horizon, then the water
    const far = layerColor(C, 0);
    ctx.fillStyle = css(far);
    ctx.beginPath();
    ctx.moveTo(0, hy + 1);
    const x0 = PW * (hash(R.seed, 3) > 0.5 ? 0 : 0.55), x1 = x0 + PW * 0.45;
    for (let x = 0; x <= PW; x += 6) {
      const k = clamp(Math.min((x - x0) / 60, (x1 - x) / 60));
      ctx.lineTo(x, hy - k * (18 + 14 * (0.5 + 0.5 * fbm(x * 0.01, R.seed, 3))));
    }
    ctx.lineTo(PW, hy + 1);
    ctx.fill();
    const g = ctx.createLinearGradient(0, hy, 0, PH);
    g.addColorStop(0, css(mixRgb(C.sky[3], C.sky[2], 0.3)));
    g.addColorStop(0.25, css(mixRgb(C.sky[2], C.base, 0.45)));
    g.addColorStop(1, css(mixRgb(C.sky[1], SILHOUETTE, 0.55)));
    ctx.fillStyle = g;
    ctx.fillRect(0, hy, PW, PH - hy);
    if (R.land === 'islands') {
      for (let i = 0; i < 3; i++) {
        const cx = PW * (0.15 + 0.35 * i + 0.1 * r()), w = 140 + 160 * r(), h = 40 + 70 * r(), y = hy + 20 + 30 * i;
        const col = layerColor(C, 1 + (i > 1 ? 1 : 0));
        ctx.fillStyle = css(col);
        ctx.beginPath();
        ctx.moveTo(cx - w, y);
        for (let x = -w; x <= w; x += 6) {
          const k = 1 - (x / w) ** 2;
          ctx.lineTo(cx + x, y - h * k ** 0.7 * (0.8 + 0.2 * noise(x * 0.03, i)));
        }
        ctx.lineTo(cx + w, y);
        ctx.fill();
        for (let p = 0; p < 7; p++) pine(ctx, cx + (r() - 0.5) * w * 1.1, y - h * 0.55 + r() * 10, 26 + 16 * r(), mixRgb(col, SILHOUETTE, 0.25));
      }
    }
    return;
  }

  for (let i = 0; i < 4; i++) {
    const col = layerColor(C, i);
    ctx.fillStyle = css(col);
    ctx.beginPath();
    ctx.moveTo(0, PH);
    for (let x = 0; x <= PW; x += 5) ctx.lineTo(x, ridgeY(R, i, x));
    ctx.lineTo(PW, PH);
    ctx.fill();

    // snow on the far peaks
    if (R.land === 'mountains' && i < 2 && R.time !== 'night') {
      ctx.save();
      ctx.clip();
      const line = Math.min(...Array.from({ length: 120 }, (_, k) => ridgeY(R, i, (k / 119) * PW))) + (i ? 60 : 110);
      ctx.fillStyle = css(mixRgb([245, 248, 255], col, 0.25 + 0.25 * i), 0.9);
      ctx.beginPath();
      ctx.moveTo(0, line);
      for (let x = 0; x <= PW; x += 10) ctx.lineTo(x, line + 16 * noise(x * 0.03, i));
      ctx.lineTo(PW, -10);
      ctx.lineTo(0, -10);
      ctx.fill();
      ctx.restore();
    }
    if (R.land === 'forest' || (R.land === 'mountains' && i >= 2)) {
      const dark = mixRgb(col, SILHOUETTE, 0.2);
      for (let x = -10; x < PW + 10; x += 9 + 8 * r()) pine(ctx, x, ridgeY(R, i, x) + 6, (22 + 26 * i) * (0.7 + 0.5 * r()), dark);
    }
    if (R.land === 'city' && i >= 1) {
      // a skyline sitting on the hills
      let x = -20;
      while (x < PW + 20) {
        const w = (26 + 50 * r()) * (0.7 + 0.25 * i), h = (60 + 220 * r() ** 1.5) * (0.5 + 0.28 * i);
        const y = ridgeY(R, i, x + w / 2) + 10;
        const bc = mixRgb(col, SILHOUETTE, 0.1 * i);
        ctx.fillStyle = css(bc);
        ctx.fillRect(x, y - h, w, h + 40);
        if (r() < 0.2) ctx.fillRect(x + w / 2 - 1.5, y - h - 26, 3, 26);
        if (night || R.time === 'dawn') {
          for (let wy = y - h + 8; wy < y - 6; wy += 11) {
            for (let wx = x + 5; wx < x + w - 6; wx += 9) {
              if (r() < (R.time === 'night' ? 0.28 : 0.18)) {
                ctx.fillStyle = css(r() < 0.8 ? [255, 214, 140] : [200, 225, 255], 0.55 + 0.4 * r());
                ctx.fillRect(wx, wy, 4, 5);
              }
            }
          }
        }
        x += w + 2 + 10 * r();
      }
    }
  }
}

function paintCloudSprite(R, C, i) {
  const r = rng(R.seed + 100 + i);
  const w = 300 + 280 * r(), h = 170;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  const lit = R.time === 'night' ? mixRgb(C.sky[2], [200, 210, 235], 0.35) : mixRgb(C.light, [255, 255, 255], 0.5);
  const shade = mixRgb(C.sky[1], C.sky[2], 0.5);
  const g = ctx.createLinearGradient(0, 20, 0, h);
  g.addColorStop(0, css(lit, 0.95));
  g.addColorStop(1, css(shade, 0.9));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.rect(0, 0, w, h - 24);
  ctx.clip();
  ctx.beginPath();
  // overlapping puffs, tallest in the middle, on a flat base
  const n = Math.max(5, Math.round(w / 52));
  for (let k = 0; k < n; k++) {
    const u = k / (n - 1);
    const rr = 28 + 20 * r() + 34 * Math.sin(u * Math.PI);
    const x = 44 + (w - 88) * u, y = h - 26 - rr * 0.5;
    ctx.moveTo(x + rr, y);
    ctx.arc(x, y, rr, 0, TAU);
  }
  ctx.fill();
  return cv;
}

// ——— animated pieces ———

function stars(ctx, R, t, hy) {
  const n = R.time === 'night' ? 420 : R.time === 'dusk' ? 120 : 0;
  const moonDim = 1 - 0.45 * R.moon.lit;
  for (let i = 0; i < n; i++) {
    const x = hash(i, R.seed) * PW, y = hash(i, R.seed + 1) ** 1.3 * hy * 0.95;
    const tw = 0.6 + 0.4 * Math.sin(t * (0.7 + 2 * hash(i, 5)) + i);
    const a = (0.25 + 0.75 * hash(i, 6) ** 2) * tw * moonDim * (R.time === 'dusk' ? 0.5 * (1 - y / hy) : 1) * (R.weather === 'fog' ? 0.4 : 1);
    ctx.fillStyle = css([235, 238, 255], a);
    const s = 0.8 + 1.8 * hash(i, 7) ** 5;
    ctx.fillRect(x, y, s, s);
  }
  if (R.time === 'night') {
    const k = (t % 11) / 11;
    const i = Math.floor(t / 11);
    if (k < 0.1) {
      const x = PW * (0.2 + 0.6 * hash(i, R.seed + 2)), y = hy * (0.1 + 0.3 * hash(i, R.seed + 3));
      const p = k / 0.1;
      const g = ctx.createLinearGradient(x + p * 260, y + p * 110, x + p * 260 - 140, y + p * 110 - 60);
      g.addColorStop(0, `rgba(255,255,255,${0.8 * (1 - p)})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + p * 260, y + p * 110);
      ctx.lineTo(x + p * 260 - 140, y + p * 110 - 60);
      ctx.stroke();
    }
  }
}

function aurora(ctx, R, t, hy) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let c = 0; c < 3; c++) {
    const top = hy * (0.12 + 0.1 * c), depth = hy * (0.28 + 0.06 * c);
    const g = ctx.createLinearGradient(0, top, 0, top + depth);
    const col = c === 1 ? [150, 90, 220] : [70, 240, 170];
    g.addColorStop(0, css(col, 0));
    g.addColorStop(0.6, css(col, 0.22 - c * 0.04));
    g.addColorStop(1, css(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let x = -20; x <= PW + 20; x += 12) {
      const y = top + 50 * Math.sin(x * 0.004 + t * 0.25 + c * 2) + 25 * Math.sin(x * 0.011 - t * 0.4 + c);
      x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    for (let x = PW + 20; x >= -20; x -= 12) {
      const y = top + depth + 40 * Math.sin(x * 0.005 + t * 0.2 + c * 3);
      ctx.lineTo(x, y);
    }
    ctx.fill();
  }
  ctx.restore();
}

function waterShimmer(ctx, R, C, t, hy, lightX, lightStrength) {
  ctx.save();
  ctx.lineCap = 'round';
  for (let j = 0; j < 60; j++) {
    const k = j / 60;
    const y = hy + 4 + (PH - hy) * k * k;
    const depth = (y - hy) / (PH - hy);
    ctx.strokeStyle = css(mixRgb(C.light, [255, 255, 255], 0.3), (0.05 + 0.18 * depth) * (0.6 + 0.4 * Math.sin(t * 1.2 + j)));
    ctx.lineWidth = 0.8 + 2 * depth;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      let x = hash(i + j * 31, R.seed) * (PW + 200) - 100 + t * (8 + 20 * depth) * (j % 2 ? 1 : -1);
      x = (((x + 100) % (PW + 200)) + PW + 200) % (PW + 200) - 100;
      const len = (8 + 60 * depth) * (0.4 + hash(i, j));
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
    }
    ctx.stroke();
  }
  // glitter path of the sun or moon
  if (lightStrength > 0) {
    ctx.globalCompositeOperation = 'lighter';
    for (let j = 0; j < 50; j++) {
      const k = j / 50;
      const y = hy + 3 + (PH - hy) * k ** 1.5;
      const depth = (y - hy) / (PH - hy);
      const f = 0.5 + 0.5 * Math.sin(t * (2 + 3 * hash(j, 3)) + j);
      const w = (6 + 90 * depth) * (0.3 + 0.7 * f);
      const x = lightX + noise(j * 0.5 + t * 0.5, 4) * (6 + 50 * depth);
      ctx.strokeStyle = css(C.light, lightStrength * (0.25 + 0.75 * f) * (1 - 0.5 * k));
      ctx.lineWidth = 1 + 2.5 * depth;
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y);
      ctx.lineTo(x + w / 2, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function focal(ctx, R, C, t, hy, night) {
  const x = PW * (0.28 + 0.44 * hash(R.seed, 9));
  const ink = mixRgb(C.base, SILHOUETTE, 0.55);
  const warm = [255, 200, 120];
  const y = R.land === 'sea' || R.land === 'islands' ? hy + 40 : ridgeY(R, 3, x) + 4;
  ctx.save();
  switch (R.focal) {
    case 'lighthouse': {
      const ly = R.land === 'islands' ? hy + 8 : hy + 2, lx = R.land === 'islands' ? PW * 0.18 : x;
      ctx.fillStyle = css(ink);
      ctx.beginPath();
      ctx.moveTo(lx - 30, ly + 4);
      ctx.lineTo(lx - 14, ly - 150);
      ctx.lineTo(lx + 14, ly - 150);
      ctx.lineTo(lx + 30, ly + 4);
      ctx.fill();
      if (!night) {
        ctx.fillStyle = css([196, 70, 60], 0.9);
        for (let b = 0; b < 3; b++) ctx.fillRect(lx - 26 + b * 5, ly - 20 - b * 48, 52 - b * 10, 18);
      }
      ctx.fillStyle = css(ink);
      ctx.fillRect(lx - 18, ly - 178, 36, 28);
      ctx.beginPath();
      ctx.moveTo(lx - 22, ly - 178);
      ctx.lineTo(lx, ly - 200);
      ctx.lineTo(lx + 22, ly - 178);
      ctx.fill();
      disc(ctx, lx, ly - 164, 8, css([255, 240, 200]));
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, lx, ly - 164, night ? 160 : 60, warm, night ? 0.6 : 0.3);
      if (night) {
        const a = t * 0.9;
        const dir = Math.cos(a);
        const g = ctx.createLinearGradient(lx, 0, lx + dir * 900, 0);
        g.addColorStop(0, 'rgba(255,230,170,0.35)');
        g.addColorStop(1, 'rgba(255,230,170,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(lx, ly - 164);
        ctx.lineTo(lx + dir * 900, ly - 164 - 60 * Math.abs(dir));
        ctx.lineTo(lx + dir * 900, ly - 164 + 60 * Math.abs(dir));
        ctx.fill();
      }
      break;
    }
    case 'sailboat': {
      const by = hy + 90 + 3 * Math.sin(t * 1.3);
      ctx.translate(x, by);
      ctx.rotate(0.03 * Math.sin(t * 1.1));
      ctx.fillStyle = css(ink);
      ctx.beginPath();
      ctx.moveTo(-60, -8);
      ctx.lineTo(60, -8);
      ctx.lineTo(44, 10);
      ctx.lineTo(-46, 10);
      ctx.fill();
      ctx.fillRect(-2, -120, 4, 112);
      ctx.fillStyle = css(night ? mixRgb(ink, [255, 255, 255], 0.15) : mixRgb([250, 244, 230], C.light, 0.3));
      ctx.beginPath();
      ctx.moveTo(4, -116);
      ctx.quadraticCurveTo(48, -60, 52, -14);
      ctx.lineTo(4, -14);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-4, -104);
      ctx.lineTo(-40, -14);
      ctx.lineTo(-4, -14);
      ctx.fill();
      if (night) {
        disc(ctx, 0, -22, 3, css(warm));
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, 0, -22, 60, warm, 0.5);
      }
      break;
    }
    case 'house':
    case 'cabin': {
      const w = R.focal === 'cabin' ? 70 : 84, h = 48;
      if (night) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, x, y - 10, 240, [255, 170, 90], 0.22);
        ctx.restore();
      }
      ctx.fillStyle = css(night ? mixRgb(ink, [120, 70, 40], 0.35) : ink);
      ctx.fillRect(x - w / 2, y - h, w, h + 10);
      ctx.beginPath();
      ctx.moveTo(x - w / 2 - 10, y - h);
      ctx.lineTo(x, y - h - 40);
      ctx.lineTo(x + w / 2 + 10, y - h);
      ctx.fill();
      ctx.fillRect(x + w / 4, y - h - 34, 10, 22);
      const lit = night || R.time === 'dawn' || R.time === 'golden';
      ctx.fillStyle = css(lit ? [255, 205, 120] : mixRgb(ink, [255, 255, 255], 0.2));
      ctx.fillRect(x - w / 4 - 8, y - h + 14, 16, 16);
      if (lit) {
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, x - w / 4, y - h + 22, 110, warm, 0.45);
        ctx.globalCompositeOperation = 'source-over';
      }
      // chimney smoke
      for (let k = 0; k < 7; k++) {
        const p = ((t * 0.18 + k / 7) % 1);
        disc(ctx, x + w / 4 + 5 + p * 40 + 8 * Math.sin(p * 6 + t), y - h - 38 - p * 130, 6 + 16 * p, css(mixRgb(C.sky[2], [255, 255, 255], 0.3), 0.3 * (1 - p)));
      }
      break;
    }
    case 'tent': {
      if (night) {
        const tg = ctx.createLinearGradient(x, y - 62, x, y + 4);
        tg.addColorStop(0, css([255, 196, 120]));
        tg.addColorStop(1, css([196, 104, 52]));
        ctx.fillStyle = tg;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, x, y - 20, 180, [255, 170, 90], 0.4);
        ctx.restore();
      } else ctx.fillStyle = css(ink);
      ctx.beginPath();
      ctx.moveTo(x - 60, y + 4);
      ctx.lineTo(x, y - 62);
      ctx.lineTo(x + 60, y + 4);
      ctx.fill();
      ctx.fillStyle = css(night ? [120, 60, 30] : mixRgb(ink, [255, 255, 255], 0.2), 0.85);
      ctx.beginPath();
      ctx.moveTo(x - 12, y + 4);
      ctx.lineTo(x, y - 34);
      ctx.lineTo(x + 12, y + 4);
      ctx.fill();
      const fx = x + 110;
      const fl = 1 + 0.15 * Math.sin(t * 13) + 0.1 * Math.sin(t * 21);
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, fx, y - 8, night ? 220 : 90, [255, 150, 60], 0.55);
      ctx.fillStyle = 'rgba(255,190,90,0.95)';
      ctx.beginPath();
      ctx.ellipse(fx, y - 10, 9, 16 * fl, 0, 0, TAU);
      ctx.fill();
      for (let k = 0; k < 6; k++) {
        const p = (t * 0.6 + k / 6) % 1;
        disc(ctx, fx + 10 * Math.sin(p * 9 + k), y - 20 - p * 90, 1.6, `rgba(255,200,120,${1 - p})`);
      }
      break;
    }
    case 'windmill': {
      ctx.fillStyle = css(ink);
      ctx.beginPath();
      ctx.moveTo(x - 26, y + 6);
      ctx.lineTo(x - 14, y - 120);
      ctx.lineTo(x + 14, y - 120);
      ctx.lineTo(x + 26, y + 6);
      ctx.fill();
      ctx.translate(x, y - 116);
      ctx.rotate(t * 0.6);
      for (let b = 0; b < 4; b++) {
        ctx.rotate(TAU / 4);
        ctx.fillRect(-3, 0, 6, 92);
        ctx.fillRect(3, 24, 18, 66);
      }
      break;
    }
    case 'tree': {
      ctx.fillStyle = css(ink);
      ctx.fillRect(x - 6, y - 90, 12, 96);
      for (const [dx, dy, rr] of [[0, -150, 70], [-50, -120, 50], [52, -118, 48], [-22, -180, 44], [30, -176, 46]]) disc(ctx, x + dx, y + dy + 4 * Math.sin(t * 0.8 + dx), rr, css(ink));
      break;
    }
    case 'sitter':
    case 'wanderer': {
      ctx.fillStyle = css(ink);
      ctx.strokeStyle = css(ink);
      ctx.lineCap = 'round';
      if (R.focal === 'sitter') {
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x + 4, y - 44);
        ctx.stroke();
        disc(ctx, x + 6, y - 58, 10, css(ink));
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x + 26, y - 14);
        ctx.lineTo(x + 30, y + 4);
        ctx.stroke();
      } else {
        const step = Math.sin(t * 2.4);
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(x, y - 30);
        ctx.lineTo(x + 2, y - 70);
        ctx.stroke();
        disc(ctx, x + 3, y - 84, 10, css(ink));
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(x, y - 32);
        ctx.lineTo(x - 8 * step, y);
        ctx.moveTo(x, y - 32);
        ctx.lineTo(x + 8 * step, y);
        ctx.moveTo(x + 2, y - 62);
        ctx.lineTo(x + 20, y - 40);
        ctx.stroke();
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 20, y - 70);
        ctx.lineTo(x + 24, y + 2);
        ctx.stroke();
      }
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

function balloon(ctx, R, C, t, hy) {
  const x = PW * (0.15 + 0.2 * hash(R.seed, 11)) + t * 6;
  const y = hy * 0.34 + 10 * Math.sin(t * 0.5);
  const colors = ['#d9543f', '#e8a33d', '#3f7fbf', '#8a5bb5', '#2f9e8f', '#e06c8c'];
  const col = rgb(colors[Math.floor(hash(R.seed, 12) * colors.length)]);
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(x, y + 58);
    ctx.bezierCurveTo(x - 56, y + 10, x - 50, y - 56, x, y - 56);
    ctx.bezierCurveTo(x + 50, y - 56, x + 56, y + 10, x, y + 58);
  };
  ctx.fillStyle = css(col);
  shape();
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  ctx.fillStyle = css(mixRgb(col, [255, 244, 228], 0.55));
  for (const sx of [-26, 14]) ctx.fillRect(x + sx, y - 60, 12, 120);
  const g = ctx.createLinearGradient(x - 50, 0, x + 50, 0);
  g.addColorStop(0, 'rgba(0,0,0,0.3)');
  g.addColorStop(0.55, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(255,240,220,0.25)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 60, y - 60, 120, 120);
  ctx.restore();
  ctx.strokeStyle = css(SILHOUETTE, 0.6);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - 10, y + 50);
  ctx.lineTo(x - 8, y + 74);
  ctx.moveTo(x + 10, y + 50);
  ctx.lineTo(x + 8, y + 74);
  ctx.stroke();
  ctx.fillStyle = css([80, 55, 40]);
  ctx.fillRect(x - 9, y + 74, 18, 13);
}

function birds(ctx, R, t, hy) {
  const n = 5;
  const cx = ((t * 22 + hash(R.seed, 13) * PW) % (PW + 300)) - 150;
  const cy = hy * (0.25 + 0.2 * hash(R.seed, 14));
  ctx.strokeStyle = css(SILHOUETTE, 0.7);
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = cx - i * 26 - (i % 2) * 8, y = cy + (i % 2 ? 1 : -1) * i * 9;
    const f = 0.5 + 0.45 * Math.sin(t * 7 + i * 1.3);
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 7 * f);
    ctx.quadraticCurveTo(x - 4, y - 1, x, y);
    ctx.quadraticCurveTo(x + 4, y - 1, x + 10, y - 7 * f);
    ctx.stroke();
  }
}

function weather(ctx, R, C, t) {
  if (R.weather === 'rain') {
    ctx.strokeStyle = css(mixRgb(C.sky[3], [255, 255, 255], 0.5), 0.35);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < 180; i++) {
      const x = hash(i, 21) * (PW + 100) - 50;
      const y = ((hash(i, 22) * PH + t * (700 + 300 * hash(i, 23))) % (PH + 60)) - 30;
      ctx.moveTo(x, y);
      ctx.lineTo(x - 6, y + 22);
    }
    ctx.stroke();
  } else if (R.weather === 'snow') {
    for (let i = 0; i < 160; i++) {
      const d = 0.4 + 0.6 * hash(i, 31);
      const y = ((hash(i, 32) * PH + t * 40 * d) % (PH + 20)) - 10;
      const x = hash(i, 33) * PW + 20 * Math.sin(t * 0.7 + i) * d;
      disc(ctx, x, y, 1.2 + 2.6 * d, css([250, 252, 255], 0.8));
    }
  } else if (R.weather === 'fog') {
    for (let b = 0; b < 4; b++) {
      const y = PH * (0.55 + 0.1 * b);
      const g = ctx.createLinearGradient(0, y - 60, 0, y + 60);
      g.addColorStop(0, css(C.haze, 0));
      g.addColorStop(0.5, css(C.haze, 0.35));
      g.addColorStop(1, css(C.haze, 0));
      ctx.fillStyle = g;
      ctx.fillRect(-20 + 30 * Math.sin(t * 0.1 + b), y - 60, PW + 40, 120);
    }
  }
}

// ——— the card ———

/** Prepares a renderer for one date. Call it once, then draw(ctx, t) every frame. */
export function prepare(date) {
  const R = recipe(date);
  const C = palette(R);
  const hy = HORIZON[R.land] * PH;
  const night = R.time === 'night' || R.time === 'dusk';

  const sky = document.createElement('canvas');
  sky.width = PW;
  sky.height = PH;
  const sctx = sky.getContext('2d');
  const sunX = paintSky(sctx, R, C);
  const moonX = PW * (0.62 + 0.25 * hash(R.seed, 15)), moonY = hy * (0.18 + 0.14 * hash(R.seed, 16));

  const land = document.createElement('canvas');
  land.width = PW;
  land.height = PH;
  paintLand(land.getContext('2d'), R, C);

  const clouds = R.weather === 'clouds' || R.weather === 'rain' || (R.weather === 'clear' && hash(R.seed, 17) < 0.5)
    ? Array.from({ length: R.weather === 'clear' ? 2 : R.weather === 'rain' ? 6 : 4 }, (_, i) => ({
      img: paintCloudSprite(R, C, i), x: hash(i, R.seed + 18) * PW, y: hy * (0.12 + 0.55 * hash(i, R.seed + 19)), v: 4 + 6 * hash(i, R.seed + 20),
    }))
    : [];

  const isWater = R.land === 'sea' || R.land === 'islands';
  const lightX = C.sun !== null ? sunX : moonX;
  const lightStrength = C.sun !== null ? (R.time === 'day' ? 0.25 : 0.55) : R.time === 'night' ? 0.45 * R.moon.lit : 0.2;

  function draw(ctx, t) {
    ctx.fillStyle = '#f3ecdf';
    ctx.fillRect(0, 0, CARD.w, CARD.h);
    ctx.save();
    ctx.translate(M, M);
    ctx.beginPath();
    ctx.rect(0, 0, PW, PH);
    ctx.clip();
    ctx.drawImage(sky, 0, 0);
    stars(ctx, R, t, hy);
    if (night || R.time === 'dawn') paintMoon(ctx, R, moonX, moonY, 30);
    if (R.aurora) aurora(ctx, R, t, hy);
    for (const c of clouds) {
      const x = ((c.x + t * c.v) % (PW + c.img.width)) - c.img.width;
      ctx.globalAlpha = R.time === 'night' ? 0.5 : 0.92;
      ctx.drawImage(c.img, x, c.y);
    }
    ctx.globalAlpha = 1;
    if (R.balloon) balloon(ctx, R, C, t, hy);
    if (!night && R.weather !== 'rain') birds(ctx, R, t, hy);
    ctx.drawImage(land, 0, 0);
    if (isWater) waterShimmer(ctx, R, C, t, hy, lightX, lightStrength);
    if (R.focal !== 'none') focal(ctx, R, C, t, hy, night);
    weather(ctx, R, C, t);
    // soft vignette inside the frame
    const v = ctx.createRadialGradient(PW / 2, PH / 2, PH * 0.35, PW / 2, PH / 2, PH * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, PW, PH);
    ctx.restore();

    // the caption, typeset on the card
    const ink = '#2c2420';
    ctx.fillStyle = ink;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.font = `italic 500 56px ${SERIF}`;
    ctx.fillText(R.title, M, PH + M + 80);
    ctx.font = `600 21px ${SERIF}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
    ctx.fillStyle = '#7a6d63';
    const no = String(Math.max(0, R.no)).padStart(3, '0');
    ctx.fillText(`NO. ${no} · ${longDate(R.date).toUpperCase()}`, M, PH + M + 124);
    ctx.textAlign = 'right';
    ctx.fillText(R.moon.name.toUpperCase(), CARD.w - M, PH + M + 124);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  return { recipe: R, draw };
}

// ——— the day's song ———

function musicRecipe(r, time) {
  const minor = time === 'night' || time === 'dusk' ? r() < 0.7 : r() < 0.15;
  const root = 50 + Math.floor(r() * 9); // D3 … A#3
  const scale = minor ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9];
  const progs = minor ? [[0, 8, 3, 10], [0, 5, 8, 7], [0, 3, 8, 10], [0, 10, 8, 10]] : [[0, 7, 9, 5], [0, 9, 5, 7], [0, 5, 9, 7], [0, 4, 9, 5]];
  const prog = progs[Math.floor(r() * progs.length)];
  const bpm = 62 + Math.floor(r() * 20);
  const cells = [[1, 1, 1, 1], [1.5, 0.5, 1, 1], [2, 1, 1], [1, 1, 2], [0.5, 0.5, 1, 2], [3, 1], [1, 0.5, 0.5, 2]];
  const phrase = () => {
    const out = [];
    let d = 5 + Math.floor(r() * 4);
    for (let bar = 0; bar < 2; bar++) {
      const cell = cells[Math.floor(r() * cells.length)];
      let beat = 0;
      for (const len of cell) {
        d = clamp(d + Math.floor(r() * 5) - 2, 2, 11);
        out.push({ bar, beat, len, d: r() < 0.12 ? null : d });
        beat += len;
      }
    }
    return out;
  };
  const A = phrase(), B = phrase();
  const A2 = A.map((n, i) => (i === A.length - 1 ? { ...n, d: 5 } : n));
  const melody = [A, A2, B, A2].flatMap((ph, k) => ph.map((n) => ({ ...n, bar: n.bar + k * 2 })));
  const inst = time === 'day' || time === 'golden' ? 'keys' : 'bell';
  return { minor, root, scale, prog, bpm, melody, inst };
}

const MAJOR_Q = { 0: 'M', 2: 'm', 4: 'm', 5: 'M', 7: 'M', 9: 'm' };
const MINOR_Q = { 0: 'm', 3: 'M', 5: 'm', 7: 'm', 8: 'M', 10: 'M' };
const NOTE = (m) => 440 * 2 ** ((m - 69) / 12);

/** One loop of the day's song as score events (same format the films use). */
export function song(R, S) {
  const { root, scale, prog, bpm, melody, inst, minor } = R.music;
  const beat = 60 / bpm, bar = beat * 4;
  const deg = (d) => root + 12 + scale[((d % 5) + 5) % 5] + 12 * Math.floor(d / 5);
  for (let b = 0; b < 8; b++) {
    const c = prog[b % 4];
    const q = (minor ? MINOR_Q : MAJOR_Q)[c] === 'm' ? 3 : 4;
    const r0 = root + c;
    const t0 = b * bar;
    S.pad(t0, [NOTE(r0 - 12), NOTE(r0 - 5), NOTE(r0 + q)], { dur: bar, vel: 0.09, attack: 0.8, release: 1.2, cutoff: 900 });
    S.bass(t0, NOTE(r0 - 24), { vel: 0.14, dur: bar * 0.9 });
    [0, 7, 12, q + 12, 7, 12, 19, q + 12].forEach((iv, i) => S.pluck(t0 + i * beat * 0.5, NOTE(r0 + iv), { vel: 0.045, dur: 1.6, pan: -0.3 + (i % 4) * 0.2 }));
  }
  for (const n of melody) {
    if (n.d === null) continue;
    const t = n.bar * bar + n.beat * beat;
    if (inst === 'keys') S.keys(t, NOTE(deg(n.d)), { vel: 0.1, dur: Math.max(1.4, n.len * beat * 2) });
    else S.bell(t, NOTE(deg(n.d)), { vel: 0.1, dur: 2.4 });
  }
  return bar * 8;
}
