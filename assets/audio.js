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
  function pianoPartials(frequency, sampleRate) {
    // A clearer percussive attack and a longer upper spectrum, without changing pitch.
    return [[1, .18], [2, .13], [3, .09], [4, .065], [5, .045], [6, .03], [8, .02], [10, .012]]
      .filter(([harmonic]) => frequency * harmonic < sampleRate / 2)
      .map(([harmonic, amplitude]) => ({ frequency: frequency * harmonic, amplitude, attack: .003, decay: .22, sustain: amplitude * (harmonic === 1 ? .36 : .24), duration: harmonic === 1 ? 2.8 : 2.1 / Math.pow(harmonic, .2) }));
  }
  class SoundEngine {
    constructor(context = null) {
      this.context = context; this.volume = .55;
      this.levels = { guitar: 1, piano: 1, feedback: .85, metronome: 1 };
      this.voices = new Set(); this.voiceChannels = new Map(); this.cache = new Map(); this.noteSequence = 0;
    }
    init() {
      if (!this.context) {
        const AudioContext = root.AudioContext || root.webkitAudioContext;
        if (!AudioContext) throw new Error('Este navegador não oferece Web Audio.');
        this.context = new AudioContext();
      }
      if (!this.master) {
        this.master = this.context.createGain(); this.master.gain.value = this.volume;
        this.compressor = this.context.createDynamicsCompressor();
        this.compressor.threshold.value = -12; this.compressor.knee.value = 12;
        this.compressor.ratio.value = 4; this.compressor.attack.value = .003; this.compressor.release.value = .18;
        this.master.connect(this.compressor).connect(this.context.destination);
        this.channels = {};
        for (const [name, level] of Object.entries(this.levels)) {
          const gain = this.context.createGain(); gain.gain.value = level;
          gain.connect(this.master); this.channels[name] = gain;
        }
      }
      if (this.context.state === 'suspended' && typeof this.context.startRendering !== 'function') this.context.resume().catch(() => {});
      return this.context;
    }
    setVolume(value, channel) {
      const level = Math.max(0, Math.min(1, Number(value) || 0));
      if (channel) {
        if (!(channel in this.levels)) return;
        this.levels[channel] = level;
        if (this.channels) this.channels[channel].gain.setTargetAtTime(level, this.context.currentTime, .012);
      } else {
        this.volume = level;
        if (this.master) this.master.gain.setTargetAtTime(level, this.context.currentTime, .012);
      }
    }
    track(source, nodes, channel, startedAt, group) {
      this.voices.add(source); this.voiceChannels.set(source, { channel, gain: nodes[0], startedAt, group, released: false });
      source.onended = () => { this.voices.delete(source); this.voiceChannels.delete(source); source.disconnect(); nodes.forEach(n => n.disconnect()); };
    }
    note(pitch, instrument = 'piano', delay = 0, at) {
      const ctx = this.init();
      this.trimVoices();
      const group = ++this.noteSequence;
      const frequency = 440 * Math.pow(2, (pitch + 48 - 69) / 12), start = at ?? ctx.currentTime + delay;
      if (instrument === 'guitar') {
        let buffer = this.cache.get(pitch);
        if (!buffer) {
          const samples = pluckSamples(frequency, ctx.sampleRate);
          buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate); buffer.copyToChannel(samples, 0); this.cache.set(pitch, buffer);
        }
        const source = ctx.createBufferSource(); source.buffer = buffer;
        const gain = ctx.createGain(); gain.gain.value = .65;
        source.connect(gain).connect(this.channels.guitar);
        this.track(source, [gain], 'guitar', start, group); source.start(start);
      } else {
        for (const partial of pianoPartials(frequency, ctx.sampleRate)) {
          const osc = ctx.createOscillator(), gain = ctx.createGain();
          osc.type = 'sine'; osc.frequency.value = partial.frequency;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(partial.amplitude, start + partial.attack);
          gain.gain.exponentialRampToValueAtTime(partial.sustain, start + partial.decay);
          gain.gain.exponentialRampToValueAtTime(.0001, start + partial.duration);
          osc.connect(gain).connect(this.channels.piano);
          this.track(osc, [gain], 'piano', start, group); osc.start(start); osc.stop(start + partial.duration + .03);
        }
      }
    }
    tick(accent = false, delay = 0, when) {
      const ctx = this.init(), source = ctx.createOscillator(), gain = ctx.createGain(), at = when ?? ctx.currentTime + delay;
      source.frequency.setValueAtTime(accent ? 1100 : 720, at);
      gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(.22, at + .002);
      gain.gain.exponentialRampToValueAtTime(.0001, at + .06);
      source.connect(gain).connect(this.channels.metronome); this.track(source, [gain], 'metronome', at, ++this.noteSequence); source.start(at); source.stop(at + .07);
    }
    feedback(correct) {
      const ctx = this.init();
      // Original four-note motifs: a bright rising reward and a rounded descent.
      const tones = correct ? [523.25, 659.25, 783.99, 1046.5] : [392, 349.23, 329.63, 261.63];
      tones.forEach((frequency, i) => {
        const at = ctx.currentTime + [0, .09, .18, .30][i], duration = i === 3 ? .30 : .15, group = ++this.noteSequence;
        for (const [harmonic, amplitude] of [[1, .4], [2, .12], [3, .05]]) {
          const source = ctx.createOscillator(), gain = ctx.createGain();
          source.type = 'sine'; source.frequency.value = frequency * harmonic;
          gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(amplitude, at + .004);
          gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
          source.connect(gain).connect(this.channels.feedback); this.track(source, [gain], 'feedback', at, group); source.start(at); source.stop(at + duration + .025);
        }
      });
      return .625;
    }
    release(source, duration = .025) {
      const voice = this.voiceChannels.get(source);
      if (!voice || voice.released) return;
      voice.released = true;
      try {
        const at = this.context.currentTime;
        voice.gain.gain.cancelAndHoldAtTime(at); voice.gain.gain.setTargetAtTime(0, at, duration / 4); source.stop(at + duration);
      } catch (_) { try { source.stop(); } catch (_) {} }
    }
    cancelScheduled() {
      if (!this.context) return;
      for (const [source, voice] of this.voiceChannels) {
        if (voice.startedAt > this.context.currentTime && voice.channel !== 'feedback') this.release(source, .01);
      }
    }
    trimVoices() {
      const live = [...this.voiceChannels].filter(([, v]) => !v.released && v.channel !== 'feedback');
      if (live.length < 512) return;
      const oldest = live.reduce((a, b) => a[1].startedAt < b[1].startedAt ? a : b)[1].group;
      // Only the oldest note fades out under extreme polyphony; the chord is never cut wholesale.
      for (const [source, voice] of live) if (voice.group === oldest) this.release(source, .08);
    }
    stop(includeFeedback = true) {
      if (!this.context) return;
      for (const source of this.voices) {
        if (!includeFeedback && this.voiceChannels.get(source)?.channel === 'feedback') continue;
        this.release(source);
      }
    }
  }
  root.soundEngine = new SoundEngine();
  if (typeof module !== 'undefined') module.exports = { SoundEngine, pluckSamples, pianoPartials };
})(typeof window === 'undefined' ? globalThis : window);
