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

const G = require('../assets/guitar.js');
test('extensions retain their meaning: suspended, added ninth, dominant and extended harmony', () => {
  assert.deepEqual(T.buildChord(0, 'sus2').intervals, [0, 2, 7]);
  assert.deepEqual(T.buildChord(0, 'sus4').intervals, [0, 5, 7]);
  assert.deepEqual(T.buildChord(0, 'add9').intervals, [0, 4, 7, 14]);
  assert.deepEqual(T.buildChord(0, '9').intervals, [0, 4, 7, 10, 14]);
  assert.deepEqual(T.buildChord(0, '13').notes.map(n => n.name), ['C', 'E', 'G', 'Bb', 'D', 'F', 'A']);
  assert.deepEqual(T.requiredNotes(T.buildChord(0, '13')).map(n => n.name), ['C', 'E', 'Bb', 'A']);
  assert.deepEqual(T.buildChord(11, 'dim7').notes.map(n => n.name), ['B', 'D', 'F', 'Ab']);
});
test('usual open chords match conventional string order and full harmonic content', () => {
  assert.deepEqual(G.voicing(T.buildChord(0, 'major')).frets, [null, 3, 2, 0, 1, 0]);
  assert.deepEqual(G.voicing(T.buildChord(2, 'major')).frets, [null, null, 0, 2, 3, 2]);
  assert.deepEqual(G.voicing(T.buildChord(4, 'minor')).frets, [0, 2, 2, 0, 0, 0]);
  assert.deepEqual(G.voicing(T.buildChord(9, 'minor')).frets, [null, 0, 2, 2, 1, 0]);
});
test('all chord families have bounded guitar voicings with required tones and truthful omissions', () => {
  for (let root = 0; root < 12; root++) for (const type of Object.keys(T.CHORD_TYPES)) for (const compact of [false, true]) {
    const c = T.buildChord(root, type), v = G.voicing(c, compact);
    assert.ok(v, `${c.name}, compact=${compact}`);
    assert.ok(G.valid(v.frets, c, !compact), `${c.name}, ${v.frets}`);
    const pressed = v.frets.filter(f => f > 0);
    assert.ok(Math.max(...pressed) - Math.min(...pressed) <= 3);
    assert.ok(v.frets.every(f => f === null || f >= 0 && f <= 12));
    if (compact) assert.ok(v.pitches.length <= 4);
    const used = v.frets.flatMap((f, i) => f === null ? [] : [i]);
    assert.equal(used.at(-1) - used[0] + 1, used.length, 'only end strings are muted');
    assert.deepEqual(v.omitted.map(n => n.pc), c.notes.filter(n => !v.pitches.some(p => T.mod(p) === n.pc)).map(n => n.pc));
  }
});
test('all 24 scales have a complete ascending octave in the initial and movable positions', () => {
  for (let root = 0; root < 12; root++) for (const mode of ['Maior', 'Menor']) for (const position of [0, T.mod(root - 4), T.mod(root - 9)]) {
    const ns = T.scale(root, mode), path = G.ascendingPath(ns, position);
    assert.equal(path.length, 8, `${root}/${mode}/${position}`);
    assert.deepEqual(path.map(n => n.midi - path[0].midi), [...ns.map(n => n.offset), 12]);
    assert.ok(path.every(n => n.fret >= position && n.fret <= position + 4));
  }
});
test('gospel progression 4–5–6–3 transposes correctly, with seventh chords when requested', () => {
  assert.deepEqual([4, 5, 6, 3].map(d => T.chord(0, 'Maior', d).name), ['F', 'G', 'Am', 'Em']);
  assert.deepEqual([4, 5, 6, 3].map(d => T.chord(2, 'Maior', d, true).name), ['G7M', 'A7', 'Bm7', 'F#m7']);
});

test('guitar cache preserves the contextual spelling of omitted extensions', () => {
  for (const name of ['Db', 'C#']) {
    const c = T.buildChord(1, '13', name), v = G.voicing(c);
    assert.deepEqual(v.omitted.map(n => n.name), c.notes.filter(n => !v.pitches.some(p => p % 12 === n.pc)).map(n => n.name));
  }
});

test('piano layouts preserve every tone and inversion while opening the spacing', () => {
  for (let root = 0; root < 12; root++) for (const type of Object.keys(T.CHORD_TYPES)) {
    const chord = T.buildChord(root, type);
    for (let inversion = 0; inversion < Math.min(4, chord.notes.length); inversion++) {
      const closed = T.pianoVoicing(chord, inversion), open = T.pianoVoicing(chord, inversion, 'open');
      const pcs = notes => [...new Set(notes.map(n => n % 12))].sort((a, b) => a - b);
      assert.deepEqual(pcs(closed), pcs(chord.notes.map(n => n.pc)));
      assert.deepEqual(pcs(open), pcs(closed));
      assert.equal(open[0], closed[0]);
      assert.equal(closed[0] % 12, T.mod(root + chord.intervals[inversion]));
      assert.ok(closed.at(-1) - closed[0] < 12);
      assert.ok(open.at(-1) - open[0] > closed.at(-1) - closed[0]);
    }
  }
  assert.deepEqual(T.pianoVoicing(T.buildChord(0, 'major'), 1, 'open'), [52, 60, 67]);
});

test('fourth and fifth cycles visit all twelve keys, transpose and return to their start', () => {
  assert.deepEqual(T.cycle(0).map(n => n.name), ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G']);
  assert.deepEqual(T.cycle(0, 'fifths').map(n => n.pc), [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]);
  for (let root = 0; root < 12; root++) for (const [direction, step] of [['fourths', 5], ['fifths', 7]]) {
    const notes = T.cycle(root, direction);
    assert.equal(new Set(notes.map(n => n.pc)).size, 12);
    assert.equal(notes[0].pc, root);
    notes.forEach((n, i) => assert.equal(T.mod(notes[(i + 1) % 12].pc - n.pc), step));
  }
});

test('cycle voice leading retains a common tone and moves the other voices by at most a whole tone', () => {
  const c = T.buildChord(0), f = T.buildChord(5), g = T.buildChord(7);
  assert.deepEqual(T.leadPiano(f, [48, 52, 55]), [48, 53, 57]);
  assert.deepEqual(T.leadPiano(g, [48, 52, 55]), [47, 50, 55]);
  assert.equal(T.voicingName(f, [48, 53, 57]), 'F/C');
  assert.equal(T.voicingName(g, [47, 50, 55]), 'G/B');
  for (let root = 0; root < 12; root++) for (const type of ['major', 'minor']) for (const direction of ['fourths', 'fifths']) for (const layout of ['closed', 'open']) {
    let piano, guitar;
    const notes = T.cycle(root, direction);
    for (const note of [...notes, notes[0]]) {
      const chord = T.buildChord(note.pc, type, note.name);
      const nextPiano = T.leadPiano(chord, piano, layout), nextGuitar = G.leadTriad(chord, guitar, direction);
      assert.equal(new Set(nextPiano.map(T.mod)).size, 3);
      assert.ok(nextPiano.every(p => chord.notes.some(n => n.pc === T.mod(p))));
      assert.ok(G.valid(nextGuitar.frets, chord, false));
      assert.equal(nextGuitar.frets.filter(f => f !== null).length, 3);
      assert.ok(nextGuitar.frets.every(f => f === null || f >= 0 && f <= 19));
      if (piano) assert.deepEqual(T.motionScore(piano, nextPiano), [2, 3, 2]);
      if (guitar) {
        assert.deepEqual(T.motionScore(guitar.pitches, nextGuitar.pitches), [2, 3, 2]);
        assert.deepEqual(nextGuitar.frets.map(f => f !== null), guitar.frets.map(f => f !== null));
      }
      piano = nextPiano; guitar = nextGuitar;
    }
  }
  assert.deepEqual(G.leadTriad(f, G.leadTriad(c)).frets, [null, 3, 3, 2, null, null]);
});
