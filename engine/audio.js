// A tiny Web Audio synth. Every sound in these pieces is generated here:
// no samples, no audio files. Instruments are plain functions (session, time, ...).
import { rng } from './util.js';

const STEPS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** 'A4' → 440 Hz. Also accepts 'C#5', 'Bb3' or a number in Hz. */
export function hz(note) {
  if (typeof note === 'number') return note;
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(note);
  if (!m) throw new Error(`Unknown note ${note}`);
  const semi = STEPS[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * 2 ** (((Number(m[3]) + 1) * 12 + semi - 69) / 12);
}

/** MIDI number → Hz. */
export const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);

function impulse(ac, seconds, decay) {
  const rate = ac.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ac.createBuffer(2, len, rate);
  const r = rng(77);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      lp += 0.3 * (r() * 2 - 1 - lp); // darker tail
      const onset = Math.min(1, i / (rate * 0.015));
      d[i] = lp * (1 - i / len) ** decay * onset;
    }
  }
  return buf;
}

function noiseBuffer(ac) {
  const len = ac.sampleRate * 2;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  const r = rng(5);
  for (let i = 0; i < len; i++) d[i] = r() * 2 - 1;
  return buf;
}

/**
 * One playback's worth of audio graph: instruments → (dry + reverb) → compressor → out.
 * A fresh session per play keeps pause/seek simple: stop() fades it and throws it away.
 */
export function createSession(ac, mix = {}) {
  const gate = ac.createGain();
  gate.gain.value = mix.volume ?? 0.9;
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 12;
  comp.ratio.value = 3;
  comp.attack.value = 0.006;
  comp.release.value = 0.3;
  gate.connect(comp);
  comp.connect(ac.destination);

  const dry = ac.createGain();
  dry.connect(gate);
  const verb = ac.createConvolver();
  verb.buffer = impulse(ac, mix.reverb ?? 3.4, mix.decay ?? 2.4);
  const wet = ac.createGain();
  wet.gain.value = mix.wet ?? 0.32;
  verb.connect(wet);
  wet.connect(gate);

  const s = { ac, gate, dry, verb, sources: [], waves: new Map(), noise: noiseBuffer(ac), level: gate.gain.value };
  s.stop = (fade = 0.12) => {
    const now = ac.currentTime;
    gate.gain.cancelScheduledValues(now);
    gate.gain.setValueAtTime(gate.gain.value, now);
    gate.gain.linearRampToValueAtTime(0, now + fade);
    setTimeout(() => {
      for (const n of s.sources) {
        try { n.stop(); } catch { /* already stopped */ }
      }
      s.sources.length = 0;
      comp.disconnect();
    }, fade * 1000 + 120);
  };
  return s;
}

function osc(s, type, freq, start, end) {
  const o = s.ac.createOscillator();
  if (typeof type === 'string') o.type = type;
  else o.setPeriodicWave(type);
  o.frequency.value = freq;
  o.start(start);
  o.stop(end);
  s.sources.push(o);
  return o;
}

function out(s, node, o) {
  let n = node;
  if (o.pan && s.ac.createStereoPanner) {
    const p = s.ac.createStereoPanner();
    p.pan.value = o.pan;
    n.connect(p);
    n = p;
  }
  n.connect(s.dry);
  const send = o.send ?? 0.3;
  if (send > 0) {
    const g = s.ac.createGain();
    g.gain.value = send;
    n.connect(g);
    g.connect(s.verb);
  }
}

/** A gain that starts silent: nothing can leak out before its envelope begins. */
function silent(s) {
  const g = s.ac.createGain();
  g.gain.value = 0;
  return g;
}

/** Percussive envelope: quick rise, exponential fall lasting ≈ `len` seconds. */
function strike(param, t, peak, len, attack = 0.004) {
  param.setValueAtTime(0, t);
  param.linearRampToValueAtTime(peak, t + attack);
  param.setTargetAtTime(0, t + attack, len / 5);
}

function wave(s, name, amps) {
  if (!s.waves.has(name)) {
    const imag = new Float32Array(amps);
    s.waves.set(name, s.ac.createPeriodicWave(new Float32Array(amps.length), imag));
  }
  return s.waves.get(name);
}

export const INSTRUMENTS = {
  /** Music-box / celesta bell. */
  bell(s, t, note, o = {}) {
    const f = hz(note), vel = o.vel ?? 0.12, dur = o.dur ?? 2.6;
    const bus = s.ac.createGain();
    for (const [ratio, amp, len] of [[1, 1, 1], [2, 0.3, 0.42], [3.01, 0.11, 0.24], [4.17, 0.05, 0.13]]) {
      const g = silent(s);
      strike(g.gain, t, vel * amp, dur * len, 0.003);
      osc(s, 'sine', f * ratio, t, t + dur * len + 0.05).connect(g);
      g.connect(bus);
    }
    out(s, bus, { send: 0.42, ...o });
  },

  /**
   * Plucked string. Soft harp by default; `wave: 'sawtooth'` with a `bend`
   * (cents, sliding down onto the note) gives a kanun/oud-like attack.
   */
  pluck(s, t, note, o = {}) {
    const f = hz(note), vel = o.vel ?? 0.1, dur = o.dur ?? 1.8;
    const lp = s.ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.7;
    lp.frequency.setValueAtTime(Math.min(f * (o.bright ?? 7), 9000), t);
    lp.frequency.setTargetAtTime(f * 1.6, t, o.wave ? 0.12 : 0.2);
    const g = silent(s);
    strike(g.gain, t, vel, dur, 0.005);
    const end = t + dur + 0.05;
    const main = osc(s, o.wave ?? 'triangle', f, t, end);
    const h = s.ac.createGain();
    h.gain.value = 0.22;
    const over = osc(s, 'sine', f * 2, t, end);
    if (o.bend) {
      for (const [x, k] of [[main, 1], [over, 2]]) {
        x.frequency.setValueAtTime(f * k * 2 ** (o.bend / 1200), t);
        x.frequency.exponentialRampToValueAtTime(f * k, t + 0.045);
      }
    }
    main.connect(lp);
    over.connect(h);
    h.connect(lp);
    lp.connect(g);
    out(s, g, { send: 0.3, ...o });
  },

  /** Ney: a breathy reed flute that slides into the note and blooms into vibrato. */
  ney(s, t, note, o = {}) {
    const f = hz(note), vel = o.vel ?? 0.08, dur = o.dur ?? 1;
    const attack = o.attack ?? 0.12, release = o.release ?? 0.3;
    const end = t + dur + release * 2 + 0.1;
    const x = osc(s, wave(s, 'ney', [0, 1, 0.16, 0.07, 0.025]), f, t, end);
    x.frequency.setValueAtTime(f * 2 ** (-(o.slide ?? 40) / 1200), t);
    x.frequency.exponentialRampToValueAtTime(f, t + 0.1);
    const lfo = osc(s, 'sine', o.vib ?? 5.3, t, end);
    const depth = silent(s);
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(f * 0.0065, t + Math.min(0.6, dur * 0.7));
    lfo.connect(depth);
    depth.connect(x.frequency);
    const g = silent(s);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + attack);
    g.gain.setValueAtTime(vel, t + Math.max(attack, dur));
    g.gain.setTargetAtTime(0, t + Math.max(attack, dur), release / 3);
    x.connect(g);
    // breath: noise around the note, strongest at the start
    const n = s.ac.createBufferSource();
    n.buffer = s.noise;
    n.loop = true;
    const bp = s.ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f * 2.2;
    bp.Q.value = 1.4;
    const ng = silent(s);
    ng.gain.setValueAtTime(0, t);
    ng.gain.linearRampToValueAtTime(vel * 0.9, t + attack * 0.6);
    ng.gain.setTargetAtTime(vel * 0.3, t + attack, 0.15);
    ng.gain.setTargetAtTime(0, t + Math.max(attack, dur), release / 3);
    n.connect(bp);
    bp.connect(ng);
    ng.connect(g);
    n.start(t, (t * 3.7) % 1.9);
    n.stop(end);
    s.sources.push(n);
    out(s, g, { send: 0.5, ...o });
  },

  /** A ship's horn: two slightly beating low saws and a sub, through a closed filter. */
  horn(s, t, o = {}) {
    const f = o.f ?? 98, dur = o.dur ?? 1.2, vel = o.vel ?? 0.22;
    const end = t + dur + 1;
    const lp = s.ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = o.cutoff ?? 650;
    lp.Q.value = 1.1;
    const g = silent(s);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.14);
    g.gain.setValueAtTime(vel, t + dur);
    g.gain.setTargetAtTime(0, t + dur, 0.14);
    for (const [ratio, type, k] of [[1, 'sawtooth', 1], [1.004, 'sawtooth', 0.8], [0.5, 'square', 0.35], [1.26, 'sawtooth', 0.35]]) {
      const x = osc(s, type, f * ratio, t, end);
      x.frequency.setValueAtTime(f * ratio * 0.97, t);
      x.frequency.exponentialRampToValueAtTime(f * ratio, t + 0.22);
      const kg = s.ac.createGain();
      kg.gain.value = k;
      x.connect(kg);
      kg.connect(lp);
    }
    lp.connect(g);
    out(s, g, { send: 0.55, ...o });
  },

  /** A seagull's cry: a quick rise and a long raspy fall. */
  gull(s, t, o = {}) {
    const f = o.f ?? 1500, dur = o.dur ?? 0.42, vel = o.vel ?? 0.04;
    const end = t + dur + 0.05;
    const x = osc(s, 'sawtooth', f, t, end);
    x.frequency.setValueAtTime(f * 0.72, t);
    x.frequency.linearRampToValueAtTime(f * 1.08, t + dur * 0.2);
    x.frequency.exponentialRampToValueAtTime(f * 0.58, t + dur);
    const rasp = osc(s, 'sine', 31, t, end);
    const rg = s.ac.createGain();
    rg.gain.value = f * 0.03;
    rasp.connect(rg);
    rg.connect(x.frequency);
    const g = silent(s);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.025);
    g.gain.setValueAtTime(vel * 0.8, t + dur * 0.6);
    g.gain.linearRampToValueAtTime(0, t + dur);
    const mix = s.ac.createGain();
    for (const [fc, q] of [[2300, 2], [3600, 3]]) {
      const bp = s.ac.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = fc * (f / 1500);
      bp.Q.value = q;
      x.connect(bp);
      bp.connect(mix);
    }
    mix.connect(g);
    out(s, g, { send: 0.4, ...o });
  },

  /** Warm electric-piano-ish keys. */
  keys(s, t, note, o = {}) {
    const f = hz(note), vel = o.vel ?? 0.1, dur = o.dur ?? 3.2;
    const w = wave(s, 'keys', [0, 1, 0.42, 0.25, 0.12, 0.08, 0.05, 0.03, 0.02]);
    const lp = s.ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.5;
    lp.frequency.setValueAtTime(Math.min(f * 9, 10000), t);
    lp.frequency.setTargetAtTime(f * 2.2, t, 0.35);
    const g = silent(s);
    strike(g.gain, t, vel, dur, 0.006);
    const end = t + dur + 0.05;
    osc(s, w, f, t, end).connect(lp);
    const d = osc(s, w, f, t, end);
    d.detune.value = 5;
    const dg = s.ac.createGain();
    dg.gain.value = 0.5;
    d.connect(dg);
    dg.connect(lp);
    lp.connect(g);
    out(s, g, { send: 0.3, ...o });
  },

  /** Slow string-like pad. Supports `skip` so it can join mid-way after a seek. */
  pad(s, t, notes, o = {}) {
    const skip = o.skip ?? 0;
    const hold = (o.dur ?? 4) - skip;
    if (hold <= 0.05) return;
    const attack = Math.max(0.06, (o.attack ?? 1.5) - skip);
    const release = o.release ?? 1.8;
    const level = (o.vel ?? 0.12) / Math.sqrt(notes.length);
    const lp = s.ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.4;
    lp.frequency.value = o.cutoff ?? 1000;
    const g = silent(s);
    const top = t + Math.max(attack, hold);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + attack);
    g.gain.setValueAtTime(level, top);
    g.gain.setTargetAtTime(0, top, release / 4);
    const end = top + release + 0.1;
    for (const n of notes) {
      for (const det of [-7, 6]) {
        const x = osc(s, 'sawtooth', hz(n), t, end);
        x.detune.value = det;
        x.connect(lp);
      }
    }
    lp.connect(g);
    out(s, g, { send: 0.55, ...o });
  },

  bass(s, t, note, o = {}) {
    const f = hz(note), vel = o.vel ?? 0.2, dur = o.dur ?? 2;
    const g = silent(s);
    strike(g.gain, t, vel, dur, 0.012);
    const end = t + dur + 0.05;
    osc(s, 'sine', f, t, end).connect(g);
    const h = s.ac.createGain();
    h.gain.value = 0.15;
    osc(s, 'triangle', f * 2, t, end).connect(h);
    h.connect(g);
    out(s, g, { send: 0.12, ...o });
  },

  /** Filtered noise: sea, wind, splashes, breath, swells. Supports `skip`. */
  noise(s, t, o = {}) {
    const skip = o.skip ?? 0;
    const dur = (o.dur ?? 1) - skip;
    if (dur <= 0.05) return;
    const src = s.ac.createBufferSource();
    src.buffer = s.noise;
    src.loop = true;
    const f = s.ac.createBiquadFilter();
    f.type = o.type ?? 'lowpass';
    f.Q.value = o.q ?? 0.7;
    f.frequency.setValueAtTime(o.f0 ?? 800, t);
    if (o.f1 && o.f1 !== o.f0) f.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    const g = silent(s);
    const vel = o.vel ?? 0.05;
    if (o.shape === 'swell') {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vel, t + dur);
      g.gain.linearRampToValueAtTime(0, t + dur + 0.04);
    } else {
      const a = Math.max(0.004, (o.attack ?? 0.01) - skip);
      const r = Math.min(o.release ?? 0.3, dur - a);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + a);
      g.gain.setValueAtTime(vel, t + dur - r);
      g.gain.linearRampToValueAtTime(0, t + dur);
    }
    src.connect(f);
    f.connect(g);
    let last = g;
    if (o.lfo) {
      // slow swell, like waves breathing
      const [rate, depth] = o.lfo;
      const m = s.ac.createGain();
      m.gain.value = 1 - depth / 2;
      const l = osc(s, 'sine', rate, t, t + dur + 0.1);
      const lg = s.ac.createGain();
      lg.gain.value = depth / 2;
      l.connect(lg);
      lg.connect(m.gain);
      g.connect(m);
      last = m;
    }
    src.start(t, (t * 7.31) % 1.9);
    src.stop(t + dur + 0.1);
    s.sources.push(src);
    out(s, last, { send: 0.2, ...o });
  },

  /** Short pitch sweep: bird chirps, sparkles. */
  chirp(s, t, o = {}) {
    const f0 = o.f0 ?? 3000, f1 = o.f1 ?? 4500, dur = o.dur ?? 0.09, vel = o.vel ?? 0.03;
    const x = osc(s, 'sine', f0, t, t + dur + 0.03);
    x.frequency.setValueAtTime(f0, t);
    x.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = silent(s);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + Math.min(0.012, dur / 3));
    g.gain.linearRampToValueAtTime(0, t + dur);
    x.connect(g);
    out(s, g, { send: 0.35, ...o });
  },

  /** Low body hit with a falling pitch: splashes, heartbeats, impacts. */
  thump(s, t, o = {}) {
    const f0 = o.f0 ?? 120, f1 = o.f1 ?? 45, dur = o.dur ?? 0.5, vel = o.vel ?? 0.3;
    const x = osc(s, 'sine', f0, t, t + dur + 0.05);
    x.frequency.setValueAtTime(f0, t);
    x.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.7);
    const g = silent(s);
    strike(g.gain, t, vel, dur, 0.004);
    x.connect(g);
    out(s, g, { send: 0.2, ...o });
  },
};

const SUSTAINED = new Set(['pad', 'noise']);

/** Runs a film's score(S) and returns its events sorted by time. */
export function collect(scoreFn) {
  const events = [];
  const S = {};
  for (const name of Object.keys(INSTRUMENTS)) {
    S[name] = (t, ...args) => {
      const o = args[args.length - 1];
      const dur = o && typeof o === 'object' && !Array.isArray(o) ? o.dur ?? 2 : 2;
      events.push({ t, name, args, dur, sustained: SUSTAINED.has(name) });
    };
  }
  scoreFn(S);
  events.sort((a, b) => a.t - b.t);
  return events;
}

/** Plays one event at audio time `when`; `skip` joins a sustained sound part-way through. */
export function trigger(s, e, when, skip = 0) {
  // snap to the sample grid: events a hair past a sample boundary can make a one-sample click
  when = Math.round(when * s.ac.sampleRate) / s.ac.sampleRate;
  let args = e.args;
  if (skip > 0) {
    const last = args[args.length - 1];
    args = [...args.slice(0, -1), { ...last, skip }];
  }
  INSTRUMENTS[e.name](s, when, ...args);
}

/** Renders a whole score offline (for exporting video). */
export async function renderScore(events, duration, mix, rate = 48000) {
  const ac = new OfflineAudioContext(2, Math.ceil(duration * rate), rate);
  const s = createSession(ac, mix);
  for (const e of events) if (e.t < duration) trigger(s, e, e.t);
  return ac.startRendering();
}

/** AudioBuffer → 16-bit PCM WAV, peak-normalised to about -1 dBFS. */
export function toWav(buffer) {
  const ch = buffer.numberOfChannels, len = buffer.length, rate = buffer.sampleRate;
  const chans = Array.from({ length: ch }, (_, c) => buffer.getChannelData(c));
  let peak = 1e-6;
  for (const d of chans) for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]));
  const gain = 0.89 / peak;
  const view = new DataView(new ArrayBuffer(44 + len * ch * 2));
  const word = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  word(0, 'RIFF');
  view.setUint32(4, 36 + len * ch * 2, true);
  word(8, 'WAVE');
  word(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, ch, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * ch * 2, true);
  view.setUint16(32, ch * 2, true);
  view.setUint16(34, 16, true);
  word(36, 'data');
  view.setUint32(40, len * ch * 2, true);
  let o = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, chans[c][i] * gain));
      view.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      o += 2;
    }
  }
  return view.buffer;
}
