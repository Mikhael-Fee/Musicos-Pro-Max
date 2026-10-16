/* Local synthesis: no remote samples, downloads or third-party audio licenses. */
(function (root) {
  'use strict';
  function pluckSamples(frequency, sampleRate, duration = 2.4, random = Math.random) {
    const period = Math.round(sampleRate / frequency);
    const ring = new Float32Array(period);
    let mean = 0;
    for (let i = 0; i < period; i++) { ring[i] = random() * 2 - 1; mean += ring[i]; }
    mean /= period;
    for (let i = 0; i < period; i++) ring[i] -= mean;
    const samples = new Float32Array(Math.ceil(sampleRate * duration));
    const decay = Math.pow(0.001, 1 / (duration * frequency));
    for (let i = 0; i < samples.length; i++) {
      const position = i % period;
      const value = ring[position];
      ring[position] = decay * (value + ring[(position + 1) % period]) * 0.5;
      // Fade both edges to avoid clicks, including when the buffer ends.
      samples[i] = value * Math.min(1, i / 80, (samples.length - 1 - i) / 1200);
    }
    return samples;
  }
  class SoundEngine {
    constructor() { this.context = null; this.volume = 0.55; this.voices = new Set(); this.cache = new Map(); }
    init() {
      if (!this.context) {
        const AudioContext = root.AudioContext || root.webkitAudioContext;
        if (!AudioContext) throw new Error('Este navegador não oferece Web Audio.');
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = this.volume;
        this.compressor = this.context.createDynamicsCompressor();
        this.compressor.threshold.value = -18;
        this.compressor.knee.value = 15;
        this.compressor.ratio.value = 8;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.18;
        this.master.connect(this.compressor).connect(this.context.destination);
      }
      if (this.context.state === 'suspended') this.context.resume().catch(() => {});
      return this.context;
    }
    setVolume(value) {
      this.volume = Math.max(0, Math.min(1, Number(value)));
      if (this.master) this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.02);
    }
    track(source, nodes) {
      this.voices.add(source);
      source.onended = () => { this.voices.delete(source); source.disconnect(); nodes.forEach(n => n.disconnect()); };
    }
    note(pitch, instrument = 'piano', delay = 0) {
      const ctx = this.init();
      if (this.voices.size > 96) this.stop();
      const frequency = 440 * Math.pow(2, (pitch + 48 - 69) / 12);
      const start = ctx.currentTime + delay;
      if (instrument === 'guitar') {
        let buffer = this.cache.get(pitch);
        if (!buffer) {
          const samples = pluckSamples(frequency, ctx.sampleRate);
          buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
          buffer.copyToChannel(samples, 0);
          this.cache.set(pitch, buffer);
        }
        const source = ctx.createBufferSource(); source.buffer = buffer;
        const gain = ctx.createGain(); gain.gain.value = 0.65;
        source.connect(gain).connect(this.master);
        this.track(source, [gain]); source.start(start);
      } else {
        // Each partial decays independently: a short bright attack and warm fundamental.
        [1, 2, 3, 4, 6].forEach((harmonic, i) => {
          if (frequency * harmonic >= ctx.sampleRate / 2) return;
          const osc = ctx.createOscillator(); const gain = ctx.createGain();
          osc.type = 'sine'; osc.frequency.value = frequency * harmonic;
          const amplitude = [0.23, 0.09, 0.045, 0.018, 0.008][i];
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(amplitude, start + 0.006);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.4 / Math.sqrt(harmonic));
          osc.connect(gain).connect(this.master);
          this.track(osc, [gain]); osc.start(start); osc.stop(start + 2.5 / Math.sqrt(harmonic));
        });
      }
    }
    tick(accent = false) {
      const ctx = this.init(), source = ctx.createOscillator(), gain = ctx.createGain();
      const at = ctx.currentTime;
      source.frequency.setValueAtTime(accent ? 1100 : 720, at);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(.22, at + .002);
      gain.gain.exponentialRampToValueAtTime(.0001, at + .06);
      source.connect(gain).connect(this.master); this.track(source, [gain]);
      source.start(at); source.stop(at + .07);
    }
    stop() {
      if (!this.context) return;
      this.master.gain.cancelScheduledValues(this.context.currentTime);
      this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.006);
      for (const source of this.voices) { try { source.stop(this.context.currentTime + 0.04); } catch (_) {} }
      this.master.gain.setTargetAtTime(this.volume, this.context.currentTime + 0.05, 0.01);
    }
  }
  root.soundEngine = new SoundEngine();
  if (typeof module !== 'undefined') module.exports = { SoundEngine, pluckSamples };
})(typeof window === 'undefined' ? globalThis : window);
