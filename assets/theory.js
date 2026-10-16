/* Music theory is independent from the interface and from instrument fingerings. */
(function (root) {
  'use strict';
  const mod = n => ((n % 12) + 12) % 12;
  const major = [0, 2, 4, 5, 7, 9, 11], minor = [0, 2, 3, 5, 7, 8, 10];
  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'], natural = [0, 2, 4, 5, 7, 9, 11];
  const tonics = { Maior: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'], Menor: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'] };
  const solfege = { C: 'Dó', D: 'Ré', E: 'Mi', F: 'Fá', G: 'Sol', A: 'Lá', B: 'Si' };
  function spell(tonic, step, pc) {
    const index = (letters.indexOf(tonic[0]) + step) % 7;
    let alteration = mod(pc - natural[index]); if (alteration > 6) alteration -= 12;
    return letters[index] + (alteration >= 0 ? '#'.repeat(alteration) : 'b'.repeat(-alteration));
  }
  function scale(rootPc, mode = 'Maior') {
    return (mode === 'Maior' ? major : minor).map((offset, i) => ({ pc: mod(rootPc + offset), degree: i + 1, offset, name: spell(tonics[mode][mod(rootPc)], i, mod(rootPc + offset)) }));
  }
  // Intervals retain their octave: add9 is not a suspended second; 9/11/13 include the seventh.
  const CHORD_TYPES = {
    major: { title: 'Maior', suffix: '', intervals: [0, 4, 7], roles: ['1', '3', '5'] },
    minor: { title: 'Menor', suffix: 'm', intervals: [0, 3, 7], roles: ['1', 'b3', '5'] },
    dim: { title: 'Diminuto', suffix: 'dim', intervals: [0, 3, 6], roles: ['1', 'b3', 'b5'] },
    '7': { title: 'Dominante · 7', suffix: '7', intervals: [0, 4, 7, 10], roles: ['1', '3', '5', 'b7'] },
    maj7: { title: 'Sétima maior · 7M', suffix: '7M', intervals: [0, 4, 7, 11], roles: ['1', '3', '5', '7'] },
    m7: { title: 'Menor com sétima · m7', suffix: 'm7', intervals: [0, 3, 7, 10], roles: ['1', 'b3', '5', 'b7'] },
    halfDim: { title: 'Meio diminuto · m7(b5)', suffix: 'm7b5', intervals: [0, 3, 6, 10], roles: ['1', 'b3', 'b5', 'b7'] },
    dim7: { title: 'Diminuto com sétima · dim7', suffix: 'dim7', intervals: [0, 3, 6, 9], roles: ['1', 'b3', 'b5', 'bb7'] },
    sus2: { title: 'Suspenso · sus2', suffix: 'sus2', intervals: [0, 2, 7], roles: ['1', '2', '5'] },
    sus4: { title: 'Suspenso · sus4', suffix: 'sus4', intervals: [0, 5, 7], roles: ['1', '4', '5'] },
    '6': { title: 'Sexta · 6', suffix: '6', intervals: [0, 4, 7, 9], roles: ['1', '3', '5', '6'] },
    m6: { title: 'Menor com sexta · m6', suffix: 'm6', intervals: [0, 3, 7, 9], roles: ['1', 'b3', '5', '6'] },
    add9: { title: 'Nona adicionada · add9', suffix: '(add9)', intervals: [0, 4, 7, 14], roles: ['1', '3', '5', '9'] },
    '9': { title: 'Dominante com nona · 9', suffix: '9', intervals: [0, 4, 7, 10, 14], roles: ['1', '3', '5', 'b7', '9'] },
    maj9: { title: 'Sétima maior e nona · 7M(9)', suffix: '7M(9)', intervals: [0, 4, 7, 11, 14], roles: ['1', '3', '5', '7', '9'] },
    m9: { title: 'Menor com nona · m9', suffix: 'm9', intervals: [0, 3, 7, 10, 14], roles: ['1', 'b3', '5', 'b7', '9'] },
    '11': { title: 'Dominante com 11ª · 11', suffix: '11', intervals: [0, 4, 7, 10, 14, 17], roles: ['1', '3', '5', 'b7', '9', '11'] },
    m11: { title: 'Menor com 11ª · m11', suffix: 'm11', intervals: [0, 3, 7, 10, 14, 17], roles: ['1', 'b3', '5', 'b7', '9', '11'] },
    '13': { title: 'Dominante com 13ª · 13', suffix: '13', intervals: [0, 4, 7, 10, 14, 17, 21], roles: ['1', '3', '5', 'b7', '9', '11', '13'] }
  };
  function buildChord(rootPc, type = 'major', rootName) {
    const spec = CHORD_TYPES[type];
    if (!spec) throw new Error('Tipo de acorde desconhecido: ' + type);
    const tonic = rootName || tonics.Maior[mod(rootPc)];
    const notes = spec.intervals.map((offset, i) => ({ pc: mod(rootPc + offset), offset, role: spec.roles[i], name: spell(tonic, (parseInt(spec.roles[i].replaceAll('b', ''), 10) - 1) % 7, mod(rootPc + offset)) }));
    return { name: tonic + spec.suffix, root: mod(rootPc), type, quality: spec.suffix, notes, intervals: spec.intervals, roles: spec.roles };
  }
  function chord(rootPc, mode, degree, seventh = false) {
    const ns = scale(rootPc, mode), i = degree - 1;
    const third = mod(ns[(i + 2) % 7].pc - ns[i].pc), fifth = mod(ns[(i + 4) % 7].pc - ns[i].pc);
    let type = fifth === 6 ? 'dim' : third === 3 ? 'minor' : 'major';
    if (seventh) type = fifth === 6 ? 'halfDim' : third === 3 ? 'm7' : mod(ns[(i + 6) % 7].pc - ns[i].pc) === 11 ? 'maj7' : '7';
    return { ...buildChord(ns[i].pc, type, ns[i].name), degree };
  }
  // Extended guitar voicings retain root, third, seventh and highest extension.
  // Optional inner extensions/fifth are reported to the learner, never silently discarded.
  function requiredNotes(chord) {
    return chord.notes.length <= 4 ? chord.notes : chord.notes.filter((_, i) => [0, 1, 3, chord.notes.length - 1].includes(i));
  }
  function pianoVoicing(chord, inversion = 0) {
    const pitches = chord.intervals.map(i => 48 + chord.root + i);
    for (let i = 0; i < Math.min(inversion, pitches.length - 1); i++) {
      let bass = pitches.shift(); while (bass <= pitches.at(-1)) bass += 12; pitches.push(bass);
    }
    return pitches;
  }
  const INTERVALS = ['Uníssono', '2ª menor', '2ª maior', '3ª menor', '3ª maior', '4ª justa', 'Trítono', '5ª justa', '6ª menor', '6ª maior', '7ª menor', '7ª maior', 'Oitava'];
  function distance(n) { const steps = n / 2; return `${n} ${n === 1 ? 'semitom' : 'semitons'} · ${String(steps).replace('.', ',')} ${steps === 1 ? 'tom' : 'tons'}`; }
  function label(name, type = 'letters') { return (type === 'solfege' ? solfege[name[0]] + name.slice(1) : name).replaceAll('#', '♯').replaceAll('b', '♭'); }
  const api = { mod, scale, chord, buildChord, requiredNotes, pianoVoicing, label, distance, INTERVALS, CHORD_TYPES, major, minor, tonics };
  root.MusicTheory = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
