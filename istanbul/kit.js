// Code Draws Istanbul — the shared kit: skyline pieces, gulls, simit, tea, the flag, cats and people.
// Everything is drawn from primitives; sizes are in pixels at scale 1.
import { TAU, clamp, lerp, hash, mixRgb, css } from '../engine/util.js';
import { disc, joint, reach } from '../engine/draw.js';

// ——— skyline ———

/** An Ottoman "pencil" minaret with one to three balconies. */
export function minaret(ctx, x, base, H, w, fill, balconies = 2) {
  ctx.fillStyle = fill;
  const y = (k) => base - H * k;
  ctx.fillRect(x - w * 0.8, y(0.09), w * 1.6, H * 0.09 + 1);
  const levels = balconies >= 3 ? [0.47, 0.65, 0.8] : balconies === 2 ? [0.56, 0.77] : [0.7];
  let from = 0.09, width = w;
  for (const lv of levels) {
    ctx.fillRect(x - width / 2, y(lv), width, H * (lv - from) + 1);
    ctx.beginPath();
    ctx.moveTo(x - width / 2, y(lv));
    ctx.lineTo(x - width * 0.9, y(lv) - H * 0.013);
    ctx.lineTo(x - width * 0.9, y(lv) - H * 0.03);
    ctx.lineTo(x + width * 0.9, y(lv) - H * 0.03);
    ctx.lineTo(x + width * 0.9, y(lv) - H * 0.013);
    ctx.lineTo(x + width / 2, y(lv));
    ctx.fill();
    from = lv + 0.03;
    width *= 0.9;
  }
  ctx.fillRect(x - width / 2, y(0.87), width, H * (0.87 - from) + 1);
  ctx.beginPath();
  ctx.moveTo(x - width * 0.62, y(0.87));
  ctx.lineTo(x, y(1));
  ctx.lineTo(x + width * 0.62, y(0.87));
  ctx.fill();
  ctx.fillRect(x - 0.7, y(1) - H * 0.035, 1.4, H * 0.035);
}

/** A dome on its drum, with a finial. `lit` (0..1) floodlights it at night. */
export function dome(ctx, cx, base, r, fill, lit = 0) {
  const drum = r * 0.22;
  ctx.fillStyle = fill;
  ctx.fillRect(cx - r * 0.96, base - drum, r * 1.92, drum + 1);
  ctx.beginPath();
  ctx.ellipse(cx, base - drum, r, r * 0.86, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillRect(cx - 0.8, base - drum - r * 0.86 - r * 0.28, 1.6, r * 0.28);
  disc(ctx, cx, base - drum - r * 0.86 - r * 0.1, Math.max(1, r * 0.045), fill);
  if (lit > 0) {
    const g = ctx.createLinearGradient(cx, base - drum - r * 0.86, cx, base);
    g.addColorStop(0, css([255, 214, 150], 0.5 * lit));
    g.addColorStop(1, css([255, 190, 120], 0.12 * lit));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, base - drum, r, r * 0.86, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = css([255, 220, 150], 0.9 * lit);
    const n = Math.max(3, Math.round(r / 7));
    for (let i = 0; i < n; i++) ctx.fillRect(cx - r * 0.8 + (i + 0.5) * (r * 1.6 / n) - 1, base - drum * 0.7, 2, drum * 0.4);
  }
}

/** A classical Ottoman mosque in silhouette: cascading domes and pencil minarets. */
export function mosque(ctx, x, base, r, fill, o = {}) {
  const minarets = o.minarets ?? 4, lit = o.lit ?? 0;
  ctx.fillStyle = fill;
  if (o.halls !== false) {
    ctx.fillRect(x - r * 2.35, base - r * 0.55, r * 4.7, r * 0.56);
    for (const i of [-3, -2, 2, 3]) dome(ctx, x + i * r * 0.62, base - r * 0.55, r * 0.19, fill, lit * 0.6);
  }
  ctx.fillStyle = fill;
  ctx.fillRect(x - r * 1.45, base - r * 1.1, r * 2.9, r * 1.11);
  dome(ctx, x - r * 0.98, base - r * 1.1, r * 0.58, fill, lit * 0.8);
  dome(ctx, x + r * 0.98, base - r * 1.1, r * 0.58, fill, lit * 0.8);
  ctx.fillStyle = fill;
  for (const sx of [-1, 1]) {
    ctx.fillRect(x + sx * r * 0.8 - r * 0.08, base - r * 1.72, r * 0.16, r * 0.64);
    ctx.beginPath();
    ctx.moveTo(x + sx * r * 0.8 - r * 0.1, base - r * 1.72);
    ctx.lineTo(x + sx * r * 0.8, base - r * 1.86);
    ctx.lineTo(x + sx * r * 0.8 + r * 0.1, base - r * 1.72);
    ctx.fill();
  }
  dome(ctx, x, base - r * 1.1, r, fill, lit);
  const spots = minarets === 6
    ? [[-2.5, 3.3, 3], [2.5, 3.3, 3], [-1.65, 2.95, 3], [1.65, 2.95, 3], [-3.3, 2.5, 2], [3.3, 2.5, 2]]
    : minarets === 4 ? [[-2.25, 3.5, 3], [2.25, 3.5, 3], [-1.55, 2.75, 2], [1.55, 2.75, 2]] : [[-1.8, 3.1, 2], [1.8, 3.1, 2]];
  for (const [dx, hk, b] of spots) minaret(ctx, x + dx * r, base, r * hk, r * 0.13, fill, b);
}

/** Galata Tower: a stone cylinder, its gallery and the conical cap. */
export function galata(ctx, x, base, h, fill, lit = 0) {
  const w = h * 0.3;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.52, base);
  ctx.lineTo(x - w * 0.46, base - h * 0.72);
  ctx.lineTo(x + w * 0.46, base - h * 0.72);
  ctx.lineTo(x + w * 0.52, base);
  ctx.fill();
  ctx.fillRect(x - w * 0.57, base - h * 0.785, w * 1.14, h * 0.065);
  ctx.fillRect(x - w * 0.45, base - h * 0.83, w * 0.9, h * 0.05);
  ctx.beginPath();
  ctx.moveTo(x - w * 0.52, base - h * 0.83);
  ctx.lineTo(x, base - h);
  ctx.lineTo(x + w * 0.52, base - h * 0.83);
  ctx.fill();
  ctx.fillRect(x - 0.7, base - h * 1.045, 1.4, h * 0.05);
  if (lit > 0) {
    ctx.fillStyle = css([255, 214, 150], 0.9 * lit);
    for (let i = 0; i < 4; i++) ctx.fillRect(x - w * 0.34 + i * w * 0.2, base - h * 0.77, w * 0.09, h * 0.04);
    ctx.fillStyle = css([255, 200, 130], 0.18 * lit);
    ctx.fillRect(x - w * 0.46, base - h * 0.72, w * 0.92, h * 0.72);
  }
}

/** Kız Kulesi on its rock. */
export function maidensTower(ctx, x, water, s, fill, lit = 0) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x - 92 * s, water + 2);
  ctx.quadraticCurveTo(x - 72 * s, water - 14 * s, x - 42 * s, water - 13 * s);
  ctx.lineTo(x + 52 * s, water - 13 * s);
  ctx.quadraticCurveTo(x + 82 * s, water - 13 * s, x + 96 * s, water + 2);
  ctx.fill();
  ctx.fillRect(x - 62 * s, water - 42 * s, 112 * s, 30 * s);
  ctx.beginPath();
  ctx.moveTo(x - 66 * s, water - 41 * s);
  ctx.lineTo(x - 6 * s, water - 58 * s);
  ctx.lineTo(x + 54 * s, water - 41 * s);
  ctx.fill();
  ctx.fillRect(x + 8 * s, water - 112 * s, 22 * s, 72 * s);
  ctx.fillRect(x + 4 * s, water - 118 * s, 30 * s, 8 * s);
  ctx.beginPath();
  ctx.moveTo(x + 6 * s, water - 117 * s);
  ctx.quadraticCurveTo(x + 19 * s, water - 138 * s, x + 19 * s, water - 156 * s);
  ctx.quadraticCurveTo(x + 19 * s, water - 138 * s, x + 32 * s, water - 117 * s);
  ctx.fill();
  ctx.fillRect(x + 18.3 * s, water - 170 * s, 1.4 * s, 16 * s);
  if (lit > 0) {
    ctx.fillStyle = css([255, 214, 150], 0.9 * lit);
    for (let i = 0; i < 5; i++) ctx.fillRect(x - 54 * s + i * 20 * s, water - 33 * s, 6 * s, 9 * s);
    ctx.fillRect(x + 14 * s, water - 98 * s, 10 * s, 14 * s);
  }
}

/** Rooftops and small windows filling the hills between the landmarks. */
export function roofs(ctx, x0, x1, groundAt, seed, fill, lit = 0) {
  ctx.fillStyle = fill;
  let x = x0;
  let i = 0;
  while (x < x1) {
    const w = 18 + 26 * hash(i, seed), h = 16 + 30 * hash(i, seed + 1);
    const g = groundAt(x + w / 2);
    ctx.fillRect(x, g - h, w + 1, h + 40);
    if (hash(i, seed + 2) > 0.5) {
      ctx.beginPath();
      ctx.moveTo(x - 1, g - h);
      ctx.lineTo(x + w / 2, g - h - 7 - 5 * hash(i, seed + 3));
      ctx.lineTo(x + w + 1, g - h);
      ctx.fill();
    }
    if (lit > 0) {
      for (let k = 0; k < 3; k++) {
        if (hash(i * 3 + k, seed + 4) < 0.45 && hash(i * 3 + k, seed + 5) < lit) {
          ctx.fillStyle = css(hash(i * 3 + k, seed + 6) > 0.2 ? [255, 206, 130] : [210, 230, 255], 0.9);
          ctx.fillRect(x + 3 + k * (w / 3.2), g - h + 5 + 6 * hash(i + k, seed + 7), 3, 4);
          ctx.fillStyle = fill;
        }
      }
    }
    x += w + 1 + 4 * hash(i, seed + 8);
    i++;
  }
}

// ——— little things ———

/** A seagull in flight, side view. flap: -1 wings down … 1 wings up. */
export function gull(ctx, x, y, s, flap, dir = 1, o = {}) {
  const body = o.body ?? '#f6f3ee', wingCol = o.wing ?? '#c7cad3', tip = o.tip ?? '#26272e', shade = o.shade ?? 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  ctx.rotate(o.tilt ?? 0);
  flap = lerp(-0.35, 1, (flap + 1) / 2);
  const wing = (a, col, far) => {
    const ty = -30 * a, ex = far ? -3 : -5;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(7, -1);
    ctx.quadraticCurveTo(2, -14 * a - 2, ex - 4, -15 * a);
    ctx.lineTo(-17, ty);
    ctx.quadraticCurveTo(-9, -12 * a + 1, -8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = tip;
    ctx.beginPath();
    ctx.moveTo(lerp(ex - 4, -17, 0.45), lerp(-15 * a, ty, 0.45));
    ctx.lineTo(-17, ty);
    ctx.lineTo(lerp(-17, -8, 0.3), lerp(ty, 0, 0.3));
    ctx.closePath();
    ctx.fill();
  };
  wing(flap * 0.85 + 0.12, css(mixRgb(wingCol, [60, 60, 70], 0.25 + shade)), true);
  ctx.fillStyle = css(mixRgb(body, [90, 90, 110], shade));
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 5.6, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-14, -1);
  ctx.lineTo(-24, -3);
  ctx.lineTo(-24, 3);
  ctx.closePath();
  ctx.fill();
  disc(ctx, 13, -3.5, 5, css(mixRgb(body, [90, 90, 110], shade)));
  ctx.fillStyle = '#e8b53a';
  ctx.beginPath();
  ctx.moveTo(17, -4.2);
  ctx.lineTo(24, -2.6);
  ctx.lineTo(17, -1.6);
  ctx.closePath();
  ctx.fill();
  disc(ctx, 14.6, -4.8, 0.9, '#1d1d24');
  wing(flap, css(mixRgb(wingCol, [90, 90, 110], shade)), false);
  ctx.restore();
}

/** A simit: sesame ring bread. squash < 1 tilts it away from the viewer. */
export function simit(ctx, x, y, r, rot = 0, squash = 1, seed = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(1, squash);
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r * 1.05);
  g.addColorStop(0, '#dc9448');
  g.addColorStop(1, '#8f4a1b');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.arc(0, 0, r * 0.47, 0, TAU, true);
  ctx.fill();
  if (r > 6) {
    ctx.strokeStyle = 'rgba(96,42,12,0.35)';
    ctx.lineWidth = r * 0.07;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52);
      ctx.lineTo(Math.cos(a + 0.4) * r * 0.96, Math.sin(a + 0.4) * r * 0.96);
      ctx.stroke();
    }
    ctx.fillStyle = '#f7e4b3';
    for (let i = 0; i < 30; i++) {
      const a = hash(i, seed) * TAU, d = r * (0.56 + 0.38 * hash(i, seed + 1));
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * 0.055, r * 0.028, a + 1, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** A tulip-shaped tea glass on its saucer, steaming. */
export function tea(ctx, x, y, s, t, steam = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#f3efe6';
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 3.6, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#c2352a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, -0.4, 13.5, 2.6, 0, 0, TAU);
  ctx.stroke();
  const glass = () => {
    ctx.beginPath();
    ctx.moveTo(-7.5, -1.5);
    ctx.bezierCurveTo(-8, -8, -4.4, -10, -4.8, -14);
    ctx.bezierCurveTo(-5.3, -19, -9.4, -22, -9.4, -29);
    ctx.lineTo(9.4, -29);
    ctx.bezierCurveTo(9.4, -22, 5.3, -19, 4.8, -14);
    ctx.bezierCurveTo(4.4, -10, 8, -8, 7.5, -1.5);
    ctx.closePath();
  };
  ctx.save();
  glass();
  ctx.clip();
  const g = ctx.createLinearGradient(0, -25, 0, 0);
  g.addColorStop(0, '#d8561d');
  g.addColorStop(1, '#851b0b');
  ctx.fillStyle = g;
  ctx.fillRect(-12, -25, 24, 25);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(-12, -29, 24, 4);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 0.9;
  glass();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-6.6, -26);
  ctx.quadraticCurveTo(-7.8, -21, -4.6, -16);
  ctx.stroke();
  if (steam > 0) {
    ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      const p = (t * 0.35 + k / 3) % 1;
      ctx.strokeStyle = `rgba(255,255,255,${0.45 * steam * Math.sin(p * Math.PI)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const yy = -31 - p * 26 - i * 2.2;
        const xx = -3 + k * 3 + Math.sin(i * 0.7 + t * 2 + k) * 2.2;
        i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** The Turkish flag, flying to the right from the top of a pole at (x, y). */
export function flag(ctx, x, y, h, t) {
  const L = h * 1.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0.08 * Math.sin(t * 6), 0, 1 - 0.04 * Math.sin(t * 6 + 1), 0, 0);
  ctx.fillStyle = '#e30a17';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let i = 0; i <= 8; i++) ctx.lineTo((L * i) / 8, Math.sin(t * 7 - i * 0.8) * h * 0.05 * (i / 8));
  for (let i = 8; i >= 0; i--) ctx.lineTo((L * i) / 8, h + Math.sin(t * 7 - i * 0.8) * h * 0.05 * (i / 8));
  ctx.fill();
  const cy = h / 2 + Math.sin(t * 7 - 3) * h * 0.02;
  disc(ctx, h * 0.5, cy, h * 0.25, '#fff');
  disc(ctx, h * 0.5625, cy, h * 0.2, '#e30a17');
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI + (i * Math.PI) / 5;
    const r = i % 2 ? h * 0.125 * 0.382 : h * 0.125;
    ctx.lineTo(h * 1.02 + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.fill();
  ctx.restore();
}

/** A tiny speech bubble. */
export function bubble(ctx, x, y, text, k, o = {}) {
  if (k <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  const pop = 0.6 + 0.4 * Math.min(1, k * 1.6) + 0.08 * Math.sin(Math.min(1, k) * Math.PI);
  ctx.scale(pop, pop);
  ctx.globalAlpha = Math.min(1, k * 2);
  ctx.font = `italic 600 ${o.size ?? 44}px 'Cormorant Garamond', Georgia, serif`;
  const w = ctx.measureText(text).width + 44, h = (o.size ?? 44) + 26;
  ctx.fillStyle = '#fffaf0';
  ctx.strokeStyle = '#3a2a22';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h, w, h, 18);
  ctx.moveTo(-12, 0);
  ctx.lineTo(-24 * (o.tail ?? 1), 24);
  ctx.lineTo(10, 0);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(-10, -4, 18, 6);
  ctx.fillStyle = '#3a2a22';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, -h / 2 + 2);
  ctx.restore();
}

// ——— cats ———

export const CATS = {
  ginger: { fur: '#e9974c', dark: '#b9632b', light: '#f8dcbc', stripes: true },
  tuxedo: { fur: '#2c2c35', dark: '#1d1d24', light: '#f3f0ea', stripes: false },
  grey: { fur: '#8f94a0', dark: '#666b77', light: '#dcdee3', stripes: true },
  calico: { fur: '#f3ede3', dark: '#c9763d', light: '#ffffff', stripes: false, patches: '#39343a' },
};

/**
 * A cat, side view, facing right (dir -1 faces left). y is the ground.
 * pose: 'walk' | 'sit' | 'loaf' | 'sleep' | 'crouch' | 'leap'
 * P.phase drives the walk, P.t the tail and breathing, P.look tilts the head (-1 down … 1 up).
 */
export function cat(ctx, x, y, s, P) {
  const C = CATS[P.coat] ?? P.coat ?? CATS.ginger;
  const t = P.t ?? 0, pose = P.pose ?? 'walk';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * (P.dir ?? 1), s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const fur = css(C.fur), far = css(mixRgb(C.fur, [30, 25, 35], 0.28));
  const wag = Math.sin(t * 2.1 + (P.seed ?? 0)) * (P.wag ?? 1);

  const tail = (pts, width) => {
    ctx.strokeStyle = fur;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]);
    ctx.stroke();
    if (C.stripes) {
      ctx.strokeStyle = css(C.dark);
      ctx.lineWidth = width * 0.9;
      ctx.setLineDash([3, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };
  const head = (hx, hy, r, o = {}) => {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(-(P.look ?? 0) * 0.35 + (o.tilt ?? 0));
    ctx.fillStyle = fur;
    for (const [a, b, c] of [[[-8, -5], [-6, -19], [1, -8]], [[1, -9], [7, -18], [9, -3]]]) {
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.fill();
    }
    ctx.fillStyle = css(mixRgb(C.light, [240, 150, 150], 0.3));
    ctx.beginPath();
    ctx.moveTo(-5, -7);
    ctx.lineTo(-5, -15);
    ctx.lineTo(-1, -8);
    ctx.fill();
    disc(ctx, 0, 0, r, fur);
    if (C.patches) disc(ctx, -3, -4, r * 0.6, css(C.patches));
    ctx.fillStyle = css(C.light);
    ctx.beginPath();
    ctx.ellipse(r * 0.72, r * 0.35, r * 0.5, r * 0.4, 0, 0, TAU);
    ctx.fill();
    disc(ctx, r * 1.12, r * 0.12, 1.6, '#3a2020');
    if (o.closed) {
      ctx.strokeStyle = '#2a2020';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(r * 0.42, -r * 0.12, 2.6, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else {
      disc(ctx, r * 0.45, -r * 0.18, 2.3, '#1c1a16');
      disc(ctx, r * 0.52, -r * 0.3, 0.7, '#fff');
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 0.6;
    for (const dy of [-1.5, 1.5]) {
      ctx.beginPath();
      ctx.moveTo(r * 1.0, r * 0.4);
      ctx.lineTo(r * 1.9, r * 0.4 + dy * 2.2);
      ctx.stroke();
    }
    ctx.restore();
  };
  const stripes = (cx, cy, rx, ry, rot = 0) => {
    if (!C.stripes && !C.patches) return;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rot, 0, TAU);
    ctx.clip();
    if (C.patches) {
      disc(ctx, cx - rx * 0.3, cy - ry * 0.4, ry * 0.9, css(C.patches));
      disc(ctx, cx + rx * 0.45, cy - ry * 0.2, ry * 0.7, css(C.dark));
    } else {
      ctx.strokeStyle = css(C.dark);
      ctx.lineWidth = 3;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * rx * 0.24, cy - ry * 1.1);
        ctx.quadraticCurveTo(cx + i * rx * 0.24 - 4, cy, cx + i * rx * 0.24 + 1, cy - ry * 0.1);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  if (pose === 'walk' || pose === 'crouch') {
    const low = pose === 'crouch' ? 1 : 0;
    const ph = P.phase ?? 0;
    const bob = low ? 0 : Math.sin(ph * 2) * 1.2;
    const by = -24 + bob + low * 8;
    const legs = [
      [15, 0, true], [-15, Math.PI * 0.5, true], [15, Math.PI, false], [-15, Math.PI * 1.5, false],
    ];
    const drawLeg = ([hx, off, isFar]) => {
      const a = ph + off;
      const stride = low ? 0 : 7.5;
      const px = hx + (hx > 0 ? 3 : -3) + stride * Math.cos(a);
      const py = -Math.max(0, Math.sin(a)) * (low ? 0 : 5);
      const hip = [hx, by + 4];
      // both joints fold backwards: the elbow in front, the hock behind
      const knee = joint(hip, [px, py], hx > 0 ? 11.5 : 13, hx > 0 ? 12.5 : 13, 1);
      ctx.strokeStyle = isFar ? far : fur;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(hip[0], hip[1]);
      ctx.lineTo(knee[0], knee[1]);
      ctx.lineTo(px, py - 1.5);
      ctx.stroke();
      disc(ctx, px + 1.5, py - 1.8, 3.2, isFar ? far : css(C.patches || !C.stripes ? C.light : C.fur));
    };
    legs.filter((l) => l[2]).forEach(drawLeg);
    const up = P.tailUp ?? 1;
    tail([[-24, by - 3], [-38, by - 4 - 10 * up + wag * 3], [-44 + wag * 4, by - 26 * up], [-38 + wag * 6, by - 38 * up]], 5);
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.ellipse(0, by, 27, 11.5 - low * 1.5, 0, 0, TAU);
    ctx.fill();
    stripes(0, by, 27, 11.5, 0);
    ctx.fillStyle = css(C.light);
    ctx.beginPath();
    ctx.ellipse(12, by + 5, 12, 5.5, 0.1, 0, TAU);
    ctx.fill();
    legs.filter((l) => !l[2]).forEach(drawLeg);
    const nod = low ? 3 * Math.sin((P.chew ?? 0) * 9) : Math.sin(ph * 2) * 1;
    head(low ? 28 : 28, low ? by + 6 + nod : by - 11 + nod, 10.5, { tilt: low ? 0.5 : 0 });
  } else if (pose === 'sit') {
    tail([[-10, -4], [-2, 2], [18, 2], [26 + wag * 2, -6]], 5);
    ctx.fillStyle = far;
    ctx.beginPath();
    ctx.ellipse(-4, -13, 14, 13, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.ellipse(-2, -14, 15, 14, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(6, -27, 11, 17, -0.25, 0, TAU);
    ctx.fill();
    stripes(0, -18, 16, 18, -0.25);
    ctx.fillStyle = css(C.light);
    ctx.beginPath();
    ctx.ellipse(11, -26, 6, 12, -0.25, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = fur;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(10, -24);
    ctx.lineTo(12, -2);
    ctx.stroke();
    disc(ctx, 13.5, -2.4, 3.3, css(C.patches || !C.stripes ? C.light : C.fur));
    head(12, -46, 10.5, { closed: P.blink });
  } else if (pose === 'loaf' || pose === 'sleep') {
    const breathe = 1 + 0.045 * Math.sin(t * 1.7);
    const sleeping = pose === 'sleep';
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.ellipse(0, -12 * breathe, 26, 13 * breathe, 0, Math.PI, TAU);
    ctx.ellipse(0, -12, 26, 12, 0, 0, Math.PI);
    ctx.fill();
    stripes(0, -12, 26, 13, 0);
    tail([[-22, -4], [-14, 3], [10, 3], [20 + wag, -2]], 5);
    head(sleeping ? 22 : 24, sleeping ? -9 : -22, 10, { closed: sleeping || P.blink, tilt: sleeping ? 0.5 : 0 });
    if (sleeping) {
      const z = (t * 0.5) % 1;
      ctx.fillStyle = `rgba(80,70,90,${0.7 * Math.sin(z * Math.PI)})`;
      ctx.font = `italic 600 ${12 + 6 * z}px Georgia, serif`;
      ctx.fillText('z', 30 + z * 10, -26 - z * 22);
    }
  } else if (pose === 'leap') {
    const k = P.stretch ?? 1;
    ctx.rotate(P.pitch ?? 0);
    tail([[-26, -22], [-40, -22], [-50, -26], [-60, -24 + wag * 3]], 5);
    ctx.strokeStyle = far;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(18, -20);
    ctx.lineTo(18 + 16 * k, -12);
    ctx.moveTo(-16, -20);
    ctx.lineTo(-18 - 16 * k, -6);
    ctx.stroke();
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.ellipse(0, -24, 27 + 4 * k, 10, 0, 0, TAU);
    ctx.fill();
    stripes(0, -24, 31, 10);
    ctx.strokeStyle = fur;
    ctx.beginPath();
    ctx.moveTo(20, -20);
    ctx.lineTo(24 + 16 * k, -16);
    ctx.moveTo(-14, -20);
    ctx.lineTo(-20 - 14 * k, -8);
    ctx.stroke();
    head(31, -30, 10.5);
  }
  ctx.restore();
}

// ——— people ———

/**
 * A person in profile, facing right (dir -1 faces left). y is the ground, h the height.
 * P: { phase (walk) | null, lean, hands: [near, far] targets relative to the hips, colors, hat, mustache, look }
 */
export function person(ctx, x, y, h, P) {
  const C = { skin: '#e2b08a', hair: '#3a2a22', shirt: '#f2efe6', vest: null, pants: '#4a4f5c', shoes: '#2a2224', hat: null, ...P.colors };
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(P.dir ?? 1, 1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const walking = P.phase !== undefined && P.phase !== null;
  const ph = P.phase ?? 0;
  const hipY = -h * 0.5 + (walking ? -h * 0.01 * Math.cos(ph * 2) : 0);
  const hip = [0, hipY];
  const lean = P.lean ?? 0;
  const sh = [hip[0] + Math.sin(lean) * h * 0.32, hipY - Math.cos(lean) * h * 0.32];
  const neck = [sh[0] + Math.sin(lean) * h * 0.04, sh[1] - Math.cos(lean) * h * 0.04];
  const headC = [neck[0] + h * 0.012, neck[1] - h * 0.062];
  const dim = (c, k = 0.22) => css(mixRgb(c, [20, 18, 26], k));

  const foot = (a) => walking
    ? [h * 0.14 * Math.cos(a), -h * 0.055 * Math.max(0, Math.sin(a))]
    : [a === 0 ? h * 0.05 : -h * 0.03, 0];
  const leg = (a, isFar) => {
    const f = foot(a);
    const knee = joint(hip, [f[0], f[1] - h * 0.03], h * 0.25, h * 0.24, -1);
    ctx.strokeStyle = isFar ? dim(C.pants) : css(C.pants);
    ctx.lineWidth = h * 0.085;
    ctx.beginPath();
    ctx.moveTo(hip[0], hip[1]);
    ctx.lineTo(knee[0], knee[1]);
    ctx.lineTo(f[0], f[1] - h * 0.03);
    ctx.stroke();
    ctx.fillStyle = isFar ? dim(C.shoes) : css(C.shoes);
    ctx.beginPath();
    ctx.roundRect(f[0] - h * 0.03, f[1] - h * 0.035, h * 0.085, h * 0.035, h * 0.012);
    ctx.fill();
  };
  const hands = P.hands ?? [
    [Math.sin(ph + Math.PI) * h * 0.1, -h * 0.02],
    [Math.sin(ph) * h * 0.1, -h * 0.02],
  ];
  const arm = (target, isFar) => {
    const s0 = [sh[0] + (isFar ? -h * 0.01 : h * 0.01), sh[1] + h * 0.02];
    const hand = reach(s0, [hip[0] + target[0], hip[1] + target[1]], h * 0.36);
    const el = joint(s0, hand, h * 0.18, h * 0.18, 1);
    ctx.strokeStyle = isFar ? dim(C.shirt) : css(C.shirt);
    ctx.lineWidth = h * 0.066;
    ctx.beginPath();
    ctx.moveTo(s0[0], s0[1]);
    ctx.lineTo(el[0], el[1]);
    ctx.stroke();
    ctx.strokeStyle = isFar ? dim(C.skin) : css(C.skin);
    ctx.lineWidth = h * 0.05;
    ctx.beginPath();
    ctx.moveTo(lerp(s0[0], el[0], 0.95), lerp(s0[1], el[1], 0.95));
    ctx.lineTo(hand[0], hand[1]);
    ctx.stroke();
    disc(ctx, hand[0], hand[1], h * 0.026, isFar ? dim(C.skin) : css(C.skin));
    return hand;
  };

  arm(hands[1], true);
  leg(ph + Math.PI, true);
  // torso
  ctx.strokeStyle = css(C.shirt);
  ctx.lineWidth = h * 0.17;
  ctx.beginPath();
  ctx.moveTo(hip[0], hip[1] - h * 0.02);
  ctx.lineTo(sh[0], sh[1] + h * 0.04);
  ctx.stroke();
  if (C.vest) {
    ctx.strokeStyle = css(C.vest);
    ctx.lineWidth = h * 0.175;
    ctx.beginPath();
    ctx.moveTo(hip[0] - h * 0.005, hip[1] - h * 0.03);
    ctx.lineTo(lerp(hip[0], sh[0], 0.86), lerp(hip[1], sh[1], 0.86));
    ctx.stroke();
  }
  if (C.apron) {
    ctx.fillStyle = css(C.apron);
    ctx.beginPath();
    ctx.moveTo(hip[0] + h * 0.05, hip[1] - h * 0.12);
    ctx.lineTo(hip[0] + h * 0.09, hip[1] + h * 0.16);
    ctx.lineTo(hip[0] + h * 0.01, hip[1] + h * 0.17);
    ctx.lineTo(hip[0] - h * 0.02, hip[1] - h * 0.1);
    ctx.fill();
  }
  ctx.strokeStyle = css(C.pants);
  ctx.lineWidth = h * 0.13;
  ctx.beginPath();
  ctx.moveTo(hip[0], hip[1] - h * 0.02);
  ctx.lineTo(hip[0], hip[1] + h * 0.02);
  ctx.stroke();
  leg(ph, false);

  // head in profile
  ctx.save();
  ctx.translate(headC[0], headC[1]);
  ctx.rotate(lean * 0.4 - (P.look ?? 0) * 0.25);
  const r = h * 0.074;
  ctx.fillStyle = css(C.skin);
  ctx.fillRect(-r * 0.35, r * 0.6, r * 0.6, r * 0.8);
  disc(ctx, 0, 0, r, css(C.skin));
  ctx.beginPath();
  ctx.moveTo(r * 0.9, -r * 0.2);
  ctx.lineTo(r * 1.28, r * 0.28);
  ctx.lineTo(r * 0.88, r * 0.38);
  ctx.fill();
  ctx.fillStyle = css(C.hair);
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.02, Math.PI * 0.95, Math.PI * 1.9);
  ctx.lineTo(-r * 0.2, -r * 0.2);
  ctx.fill();
  disc(ctx, -r * 0.08, r * 0.08, r * 0.2, css(mixRgb(C.skin, [150, 80, 60], 0.25)));
  disc(ctx, r * 0.55, -r * 0.12, r * 0.09, '#231c1a');
  if (P.mustache) {
    ctx.fillStyle = css(C.hair);
    ctx.beginPath();
    ctx.ellipse(r * 0.82, r * 0.5, r * 0.34, r * 0.13, 0.15, 0, TAU);
    ctx.fill();
  }
  if (P.smile) {
    ctx.strokeStyle = '#5a3326';
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.arc(r * 0.7, r * 0.55, r * 0.18, 0.2, Math.PI * 0.8);
    ctx.stroke();
  }
  if (C.hat === 'cap') {
    ctx.fillStyle = css(C.capColor ?? '#5b5048');
    ctx.beginPath();
    ctx.ellipse(-r * 0.05, -r * 0.45, r * 1.08, r * 0.62, -0.08, Math.PI, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(r * 0.5, -r * 0.62);
    ctx.quadraticCurveTo(r * 1.35, -r * 0.62, r * 1.42, -r * 0.38);
    ctx.lineTo(r * 0.55, -r * 0.34);
    ctx.fill();
  } else if (C.hat === 'scarf') {
    ctx.fillStyle = css(C.scarf ?? '#b7473f');
    ctx.beginPath();
    ctx.arc(-r * 0.05, -r * 0.05, r * 1.15, Math.PI * 0.6, Math.PI * 2.1);
    ctx.lineTo(r * 0.5, r * 0.9);
    ctx.lineTo(-r * 0.6, r * 1.3);
    ctx.fill();
  }
  ctx.restore();

  const handNear = arm(hands[0], false);
  ctx.restore();
  return handNear;
}

// ——— music ———

/** Makam scales mapped onto 12-tone approximations (cents allow the flattened Rast segâh). */
export const MAKAM = {
  hicaz: [0, 1, 4, 5, 7, 8, 10],
  kurdi: [0, 1, 3, 5, 7, 8, 10],
  rast: [0, 2, 3.8, 5, 7, 9, 10.8],
};
/** Degree d of a makam built on MIDI root → Hz. */
export function makamHz(makam, root, d) {
  const sc = MAKAM[makam];
  const oct = Math.floor(d / sc.length);
  const semis = sc[((d % sc.length) + sc.length) % sc.length] + 12 * oct;
  return 440 * 2 ** ((root + semis - 69) / 12);
}

export const clamp01 = (v) => clamp(v, 0, 1);
