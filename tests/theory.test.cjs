const { test } = require('node:test');
const assert = require('node:assert/strict');
const T = require('../assets/theory.js');
const { pluckSamples } = require('../assets/audio.js');

test('spells major scales correctly, including enharmonic keys', () => {
  assert.deepEqual(T.scale(2).map(n => n.name), ['D', 'E', 'F#', 'G', 'A', 'B', 'C#']);
  assert.deepEqual(T.scale(1).map(n => n.name), ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C']);
  assert.deepEqual(T.scale(6).map(n => n.name), ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#']);
});
test('natural minor retains the correct seventh and diminished second degree', () => {
  assert.deepEqual(T.scale(9, 'Menor').map(n => n.name), ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  assert.equal(T.chord(9, 'Menor', 2).name, 'Bdim');
  assert.equal(T.chord(9, 'Menor', 5).name, 'Em');
});
test('all 24 keys produce seven distinct pitch classes and diatonic chords', () => {
  for (const mode of ['Maior', 'Menor']) for (let root = 0; root < 12; root++) {
    const scale = T.scale(root, mode);
    assert.equal(new Set(scale.map(n => n.pc)).size, 7);
    assert.equal(new Set(scale.map(n => n.name[0])).size, 7);
    for (let degree = 1; degree <= 7; degree++) for (const seventh of [true, false]) {
      const chord = T.chord(root, mode, degree, seventh);
      assert.equal(chord.notes.length, seventh ? 4 : 3);
      assert.ok(chord.notes.every(n => scale.some(s => s.pc === n.pc)));
    }
  }
});
test('major seventh field has expected qualities', () => {
  assert.deepEqual(Array.from({ length: 7 }, (_, i) => T.chord(0, 'Maior', i + 1, true).name), ['C7M', 'Dm7', 'Em7', 'F7M', 'G7', 'Am7', 'Bm7b5']);
});
test('guitar synthesis creates finite, bounded audio with a decaying tail and no hard edges', () => {
  let seed = 42;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  for (const freq of [82.4069, 220, 440, 659.255]) {
    const samples = pluckSamples(freq, 44100, 2.4, random);
    assert.equal(samples.length, 105840);
    assert.ok(samples[0] === 0); assert.ok(samples.at(-1) === 0);
    assert.ok(samples.every(s => Number.isFinite(s) && Math.abs(s) <= 1.2));
    const rms = data => Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length);
    assert.ok(rms(samples.subarray(100, 4000)) > .01);
    assert.ok(rms(samples.subarray(-4000)) < rms(samples.subarray(100, 4000)) * .1);
  }
});
