// Soft, generated sounds (no audio files): page turns, a chime, and a calm ambient pad.

let ctx: AudioContext | null = null;
const KEY = "skintwin:sound";

const ac = () => {
  if (typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
};

export function soundOn() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}
export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  if (!on) stopAmbient();
}

// A paper swoosh: filtered noise that sweeps down.
export function pageTurn() {
  const c = ac();
  if (!c || !soundOn()) return;
  const len = 0.55;
  const buf = c.createBuffer(1, c.sampleRate * len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.5);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 0.8;
  f.frequency.setValueAtTime(3200, c.currentTime);
  f.frequency.exponentialRampToValueAtTime(700, c.currentTime + len);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.12, c.currentTime + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + len);
  src.connect(f).connect(g).connect(c.destination);
  src.start();
}

// Two soft bell notes.
export function chime() {
  const c = ac();
  if (!c || !soundOn()) return;
  [659.25, 987.77].forEach((hz, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    const t = c.currentTime + i * 0.12;
    o.type = "sine";
    o.frequency.value = hz;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 1.5);
  });
}

let pad: { stop: () => void } | null = null;
// A slow, warm chord that breathes in and out.
export function startAmbient() {
  const c = ac();
  if (!c || pad) return;
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, c.currentTime);
  out.gain.exponentialRampToValueAtTime(0.035, c.currentTime + 3);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 900;
  lp.connect(out).connect(c.destination);
  const lfo = c.createOscillator();
  const depth = c.createGain();
  lfo.frequency.value = 0.08;
  depth.gain.value = 0.012;
  lfo.connect(depth).connect(out.gain);
  lfo.start();
  const oscs = [220, 277.18, 329.63, 440.5].map((hz) => {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = hz;
    o.connect(lp);
    o.start();
    return o;
  });
  pad = {
    stop: () => {
      out.gain.cancelScheduledValues(c.currentTime);
      out.gain.setValueAtTime(out.gain.value, c.currentTime);
      out.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.2);
      setTimeout(() => [...oscs, lfo].forEach((o) => o.stop()), 1300);
    },
  };
}
export function stopAmbient() {
  pad?.stop();
  pad = null;
}
