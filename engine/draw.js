// Drawing helpers shared by the films and the daily sky.
import { TAU, clamp, css, hash, rng } from './util.js';

export const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
export const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/** Soft light falling off roughly like 1/r², centred on (x, y). */
export function glow(ctx, x, y, r, color, alpha) {
  if (alpha <= 0.003 || r <= 0.5) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, css(color, alpha));
  g.addColorStop(0.12, css(color, alpha * 0.62));
  g.addColorStop(0.32, css(color, alpha * 0.24));
  g.addColorStop(0.62, css(color, alpha * 0.06));
  g.addColorStop(1, css(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

export function disc(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

/** A thick round-capped segment: arms, legs, poles. */
export function limb(ctx, x1, y1, x2, y2, width) {
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** Two-bone IK: returns the elbow/knee for a joint reaching from `a` towards `b`. */
export function joint(a, b, l1, l2, bendSign = 1) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
  const base = Math.atan2(dy, dx);
  const ang = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const th = base + ang * bendSign;
  return [a[0] + Math.cos(th) * l1, a[1] + Math.sin(th) * l1];
}

/** Clamp a hand target so the arm (l1 + l2) can actually reach it. */
export function reach(from, to, len) {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const d = Math.hypot(dx, dy);
  if (d <= len) return to;
  return [from[0] + (dx / d) * len, from[1] + (dy / d) * len];
}

/** Exported videos use still grain: moving noise is costly to compress and looks the same on a phone. */
export const settings = { animatedGrain: true };

let grainTile = null;
/** Film grain, very cheap: one pre-made noise tile, re-offset each frame. */
export function grain(ctx, W, H, t, amount = 0.06) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = grainTile.height = 256;
    const g = grainTile.getContext('2d');
    const img = g.createImageData(256, 256);
    const r = rng(1234);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (r() - 0.5) * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  const f = settings.animatedGrain ? Math.floor(t * 24) : 0;
  const ox = Math.floor(hash(f, 1) * 256), oy = Math.floor(hash(f, 2) * 256);
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(grainTile, 'repeat');
  ctx.translate(-ox, -oy);
  ctx.fillRect(ox, oy, W, H);
  ctx.restore();
}

export function vignette(ctx, W, H, strength = 0.5, inner = 0.4) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * inner, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** Centred text that drifts up slightly as it fades in. */
export function caption(ctx, str, x, y, o = {}) {
  const alpha = o.alpha ?? 1;
  if (alpha <= 0.003) return;
  const size = o.size ?? 52;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${o.italic === false ? '' : 'italic '}${o.weight ?? 500} ${size}px ${o.font ?? SERIF}`;
  ctx.textAlign = o.align ?? 'center';
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${o.spacing ?? 0}px`;
  if (o.shadow !== 0) {
    ctx.shadowColor = `rgba(0,0,0,${o.shadow ?? 0.55})`;
    ctx.shadowBlur = size * 0.45;
  }
  ctx.fillStyle = o.color ?? '#f4ecdc';
  ctx.fillText(str, x, y + (1 - alpha) * (o.drift ?? 10));
  ctx.restore();
}
