// Small math, randomness and color helpers shared by every piece.
// Everything here is deterministic: the same inputs always give the same picture.

export const TAU = Math.PI * 2;

export const clamp = (x, lo = 0, hi = 1) => (x < lo ? lo : x > hi ? hi : x);
export const lerp = (a, b, k) => a + (b - a) * k;

/** Progress of t through [a, b], clamped to 0..1 (works for a > b too). */
export const seg = (t, a, b) => clamp((t - a) / (b - a));

export const smooth = (k) => k * k * (3 - 2 * k);
export const easeIn = (k) => k * k * k;
export const easeOut = (k) => 1 - (1 - k) ** 3;
export const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
export const easeInOutSine = (k) => -(Math.cos(Math.PI * k) - 1) / 2;

/** Fades 0 → 1 over [a, a + fin], holds, then 1 → 0 over [b - fout, b]. */
export const fade = (t, a, b, fin = 0.6, fout = fin) =>
  Math.min(smooth(seg(t, a, a + fin)), 1 - smooth(seg(t, b - fout, b)));

/** Integer hash → [0, 1). Use instead of Math.random so frames are repeatable. */
export function hash(i, seed = 0) {
  let x = Math.imul((i | 0) ^ 0x2c1b3c6d, 0x297a2d39) ^ Math.imul(seed + 0x3c6ef372, 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d);
  x = Math.imul(x ^ (x >>> 12), 0x297a2d39);
  x ^= x >>> 15;
  return (x >>> 0) / 4294967296;
}

/** Seeded generator (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function strSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Smooth 1D value noise in [-1, 1]. */
export function noise(x, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  return lerp(hash(i, seed) * 2 - 1, hash(i + 1, seed) * 2 - 1, smooth(f));
}

export function fbm(x, seed = 0, octaves = 3) {
  let sum = 0, amp = 0.5, freq = 1, norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise(x * freq, seed + o * 31);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/**
 * Monotone cubic interpolation through keyframes [[t, a, b, ...], ...].
 * Returns [a, b, ...] at time t. Never overshoots, eases in and out at the ends.
 */
export function curve(keys, t) {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0].slice(1);
  if (t >= keys[n - 1][0]) return keys[n - 1].slice(1);
  let i = 0;
  while (t > keys[i + 1][0]) i++;
  const h = keys[i + 1][0] - keys[i][0];
  const u = (t - keys[i][0]) / h;
  const u2 = u * u, u3 = u2 * u;
  const out = [];
  for (let j = 1; j < keys[0].length; j++) {
    const slope = (k) => (keys[k + 1][j] - keys[k][j]) / (keys[k + 1][0] - keys[k][0]);
    const tangent = (k) => {
      if (k === 0 || k === n - 1) return 0;
      const a = slope(k - 1), b = slope(k);
      return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
    };
    const m0 = tangent(i) * h, m1 = tangent(i + 1) * h;
    out.push(
      (2 * u3 - 3 * u2 + 1) * keys[i][j] + (u3 - 2 * u2 + u) * m0 +
      (-2 * u3 + 3 * u2) * keys[i + 1][j] + (u3 - u2) * m1,
    );
  }
  return out;
}

/** Point on a cubic Bézier. */
export function bezier(p0, p1, p2, p3, k) {
  const m = 1 - k;
  return [
    m * m * m * p0[0] + 3 * m * m * k * p1[0] + 3 * m * k * k * p2[0] + k * k * k * p3[0],
    m * m * m * p0[1] + 3 * m * m * k * p1[1] + 3 * m * k * k * p2[1] + k * k * k * p3[1],
  ];
}

// ——— color ———

const parsed = new Map();
/** '#rrggbb' or [r, g, b] → [r, g, b]. */
export function rgb(c) {
  if (Array.isArray(c)) return c;
  let v = parsed.get(c);
  if (!v) {
    const n = parseInt(c.slice(1), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    parsed.set(c, v);
  }
  return v;
}

export function mixRgb(a, b, k) {
  const x = rgb(a), y = rgb(b);
  return [lerp(x[0], y[0], k), lerp(x[1], y[1], k), lerp(x[2], y[2], k)];
}

export function css(c, alpha = 1) {
  const [r, g, b] = rgb(c);
  return `rgba(${r | 0},${g | 0},${b | 0},${alpha < 0 ? 0 : alpha > 1 ? 1 : alpha})`;
}

/** Color through keyframes [[t, color], ...], blended with smoothstep. */
export function keyColor(stops, t) {
  if (t <= stops[0][0]) return rgb(stops[0][1]);
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i], [t1, c1] = stops[i + 1];
    if (t <= t1) return mixRgb(c0, c1, smooth(seg(t, t0, t1)));
  }
  return rgb(stops[stops.length - 1][1]);
}
