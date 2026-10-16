/* Pure music theory shared by the explorer, exercises and automated tests. */
(function (root) {
  'use strict';
  const mod = n => ((n % 12) + 12) % 12;
  const major = [0, 2, 4, 5, 7, 9, 11];
  const minor = [0, 2, 3, 5, 7, 8, 10];
  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const natural = [0, 2, 4, 5, 7, 9, 11];
  const tonics = {
    Maior: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
    Menor: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']
  };
  const solfege = { C: 'Dó', D: 'Ré', E: 'Mi', F: 'Fá', G: 'Sol', A: 'Lá', B: 'Si' };
  function scale(rootPc, mode = 'Maior') {
    const offsets = mode === 'Maior' ? major : minor;
    const tonic = tonics[mode][mod(rootPc)];
    const first = letters.indexOf(tonic[0]);
    return offsets.map((offset, i) => {
      const letter = (first + i) % 7;
      const pc = mod(rootPc + offset);
      let accidental = mod(pc - natural[letter]);
      if (accidental > 6) accidental -= 12;
      return { pc, degree: i + 1, offset, name: letters[letter] + (accidental >= 0 ? '#'.repeat(accidental) : 'b'.repeat(-accidental)) };
    });
  }
  function chord(rootPc, mode, degree, seventh = false) {
    const notes = scale(rootPc, mode);
    const index = degree - 1;
    const chordNotes = [0, 2, 4, ...(seventh ? [6] : [])].map(n => notes[(index + n) % 7]);
    const third = mod(chordNotes[1].pc - chordNotes[0].pc);
    const fifth = mod(chordNotes[2].pc - chordNotes[0].pc);
    let quality = fifth === 6 ? 'dim' : third === 3 ? 'm' : '';
    if (seventh) quality = fifth === 6 ? 'm7b5' : quality + (mod(chordNotes[3].pc - chordNotes[0].pc) === 11 ? '7M' : '7');
    return { name: chordNotes[0].name + quality, quality, notes: chordNotes };
  }
  const INTERVALS = ['Uníssono', '2ª menor', '2ª maior', '3ª menor', '3ª maior', '4ª justa', 'Trítono', '5ª justa', '6ª menor', '6ª maior', '7ª menor', '7ª maior', 'Oitava'];
  function label(name, type) {
    if (type !== 'solfege') return name.replaceAll('#', '♯').replaceAll('b', '♭');
    return solfege[name[0]] + name.slice(1).replaceAll('#', '♯').replaceAll('b', '♭');
  }
  const api = { mod, scale, chord, label, INTERVALS, major, minor };
  root.MusicTheory = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
