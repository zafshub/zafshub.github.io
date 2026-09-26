#!/usr/bin/env node
// Exports a film page to an MP4 that is ready to post (H.264 + AAC, 1920×1080).
// Each frame comes from the page's own draw(t) in headless Chromium, and the
// soundtrack from an OfflineAudioContext running the same score it plays live.
//
//   node tools/render.cjs films/fallen-star            → videos/fallen-star.mp4, posters/fallen-star.jpg
//   node tools/render.cjs films/fallen-star --fps 60
//   node tools/render.cjs films/fallen-star --still 12.5   (just one frame → scratch.jpg)
//
// Needs Playwright (`npm i -D playwright`, or a global install on NODE_PATH)
// and an ffmpeg with libx264 on PATH, or FFMPEG=/path/to/ffmpeg.
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : fallback;
};
const target = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
if (!target) {
  console.error('usage: node tools/render.cjs films/<name> [--fps 30] [--still t]');
  process.exit(1);
}
const slug = path.basename(target.replace(/\/$/, ''));
const fps = Number(flag('fps', 30));
const still = flag('still');
const crf = flag('crf', '20');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
};

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.join(ROOT, p);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

const jpeg = (dataUrl) => Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');

(async () => {
  const srv = await serve();
  const url = `http://127.0.0.1:${srv.address().port}/${target.replace(/^\/|\/$/g, '')}/?render`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => {
    console.error('page error:', e);
    process.exit(1);
  });
  await page.goto(url);
  await page.waitForFunction(() => window.__film && window.__film.ready, null, { timeout: 30000 });
  const meta = await page.evaluate(() => window.__film.meta);

  if (still !== undefined) {
    const out = path.resolve(flag('out', 'scratch.jpg'));
    fs.writeFileSync(out, jpeg(await page.evaluate((t) => window.__film.frame(t, 0.9), Number(still))));
    console.log(`wrote ${out}`);
    await browser.close();
    srv.close();
    return;
  }

  const video = path.join(ROOT, 'videos', `${slug}.mp4`);
  const poster = path.join(ROOT, 'posters', `${slug}.jpg`);
  fs.mkdirSync(path.dirname(video), { recursive: true });
  fs.mkdirSync(path.dirname(poster), { recursive: true });

  const wav = path.join(os.tmpdir(), `${slug}-${process.pid}.wav`);
  fs.writeFileSync(wav, Buffer.from(await page.evaluate(() => window.__film.wav()), 'base64'));

  const ff = spawn(FFMPEG, [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-tune', 'film', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-movflags', '+faststart', video,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((resolve, reject) => ff.on('close', (c) => (c ? reject(new Error(`ffmpeg exited ${c}`)) : resolve())));

  const frames = Math.round(meta.duration * fps);
  const started = Date.now();
  for (let i = 0; i < frames; i++) {
    const buf = jpeg(await page.evaluate((t) => window.__film.frame(t), i / fps));
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % fps === 0) process.stdout.write(`\r${slug}: ${Math.round((i / frames) * 100)}%  `);
  }
  ff.stdin.end();
  await done;
  fs.writeFileSync(poster, jpeg(await page.evaluate((t) => window.__film.frame(t, 0.86), meta.poster ?? meta.duration / 2)));
  fs.unlinkSync(wav);
  console.log(`\r${slug}: ${frames} frames in ${((Date.now() - started) / 1000).toFixed(0)}s → ${path.relative(ROOT, video)}`);
  await browser.close();
  srv.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
