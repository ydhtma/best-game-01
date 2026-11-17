// Lumen Keep — synthesized sound, no audio assets.
// Every effect is a small WebAudio patch (oscillator + gain envelope, or
// filtered noise). The whole module is inert until the player first
// interacts, and silent when muted or when the browser has no audio.
export function createAudio() {
  const audio = {
    ctx: null,
    master: null,
    musicNodes: null,
    muted: false,
    enabled: true,
  };

  function ensure() {
    if (audio.ctx || !audio.enabled) return audio.ctx;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) {
        audio.enabled = false;
        return null;
      }
      audio.ctx = new Ctx();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = audio.muted ? 0 : 0.5;
      audio.master.connect(audio.ctx.destination);
    } catch {
      audio.enabled = false;
      return null;
    }
    return audio.ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    const ctx = ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + dur);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function noise(dur, vol, freq) {
    const ctx = ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audio.master);
    src.start(now);
  }

  audio.unlock = () => {
    const ctx = ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  };
  audio.setMuted = (muted) => {
    audio.muted = muted;
    if (audio.master) audio.master.gain.value = muted ? 0 : 0.5;
  };
  audio.shoot = () => tone(720, 0.09, 'square', 0.08, 340);
  audio.hit = () => tone(190, 0.06, 'triangle', 0.1, 120);
  audio.kill = () => {
    noise(0.22, 0.22, 900);
    tone(320, 0.18, 'sawtooth', 0.1, 60);
  };
  audio.pickup = () => tone(880, 0.12, 'sine', 0.12, 1320);
  audio.heart = () => {
    tone(523, 0.14, 'sine', 0.14);
    setTimeout(() => tone(784, 0.2, 'sine', 0.14), 90);
  };
  audio.hurt = () => {
    tone(140, 0.25, 'sawtooth', 0.18, 55);
    noise(0.15, 0.15, 500);
  };
  audio.dash = () => noise(0.14, 0.12, 2400);
  audio.waveHorn = () => {
    tone(196, 0.5, 'triangle', 0.16, 262);
    setTimeout(() => tone(262, 0.5, 'triangle', 0.16, 392), 160);
  };
  audio.upgrade = () => {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'sine', 0.13), i * 80));
  };
  audio.boss = () => {
    tone(65, 0.9, 'sawtooth', 0.22, 40);
    noise(0.7, 0.16, 300);
  };
  audio.win = () => {
    [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.4, 'triangle', 0.15), i * 130));
  };
  audio.lose = () => {
    [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.45, 'sawtooth', 0.12), i * 170));
  };

  // A slow two-oscillator pad with a wandering low-pass, started once.
  audio.startMusic = () => {
    const ctx = ensure();
    if (!ctx || audio.musicNodes) return;
    try {
      const gain = ctx.createGain();
      gain.gain.value = 0.05;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      filter.Q.value = 1.2;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 220;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      const notes = [110, 164.81, 220];
      const oscs = notes.map((f) => {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = f;
        o.detune.value = (Math.random() - 0.5) * 8;
        o.connect(filter);
        o.start();
        return o;
      });
      filter.connect(gain);
      gain.connect(audio.master);
      lfo.start();
      audio.musicNodes = { oscs, lfo, gain };
    } catch {
      audio.musicNodes = null;
    }
  };

  return audio;
}
