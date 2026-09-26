# drawn in code

Short films and a daily sky where every frame is painted by JavaScript on a `<canvas>` and every note is synthesized with Web Audio. There are no images, footage or video models. Live at **https://zafshub.github.io**.

| Project | What it is |
| --- | --- |
| [`films/fallen-star/`](films/fallen-star/) | 39-second film: a star falls into the sea and an old fisherman gives it his light. |
| [`films/last-leaf/`](films/last-leaf/) | 39-second film: the last leaf holds on all winter, then lets go in spring. |
| [`sky/`](sky/) | One Sky a Day: every date seeds a new painting and song. The moon is that night's real moon. |

`app-ads.txt` stays at the root for the app's ad network. Don't move it.

## How a film works

A film is a module (`films/<name>/scene.js`) with three exports:

- `meta`: title, duration, size, and which frames to use as cover and poster.
- `draw(ctx, t)`: paints the frame at `t` seconds, from nothing. It has to be a pure function of `t`, so use `hash()`/`noise()` from `engine/util.js` instead of `Math.random()`. That is what makes scrubbing and exporting work.
- `score(S)`: the music. `S.bell(t, 'A5', {…})`, `S.pad(t, ['D3','A3'], {…})`, `S.pluck`, `S.keys`, `S.bass`, `S.noise`, `S.chirp` and `S.thump` come from the synth in `engine/audio.js`.

`engine/film.js` plays it in the page (picture and sound in sync, with seek, pause and fullscreen). `engine/draw.js` has the shared helpers: glow, grain, captions and two-bone IK for arms.

## Exporting MP4s

```sh
npm i -g playwright      # or have it on NODE_PATH
node tools/render.cjs films/fallen-star               # → videos/fallen-star.mp4 + posters/fallen-star.jpg
node tools/render.cjs films/fallen-star --still 12.5  # one frame, for checking a shot
```

This needs an `ffmpeg` with libx264 on `PATH`, or `FFMPEG=/path/to/ffmpeg`. The output is H.264 + AAC at 1920×1080 / 30 fps, which X, Instagram and YouTube all accept.

## A new film

Copy `films/last-leaf/` to a new folder, rewrite `scene.js`, update the page's title and meta tags, render it, and add a card to `index.html`.

Fonts: Cormorant Garamond (SIL Open Font License, see `assets/fonts/OFL.txt`).
