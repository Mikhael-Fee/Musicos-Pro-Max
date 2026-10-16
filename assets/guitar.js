/* Conventional tuning, documented open chords and constrained movable voicings. */
(function (root) {
  'use strict';
  const T = root.MusicTheory || require('./theory.js');
  const TUNING = [40, 45, 50, 55, 59, 64]; // 6th string to 1st, E2 A2 D3 G3 B3 E4.
  const OPEN = {
    '0:major': [null, 3, 2, 0, 1, 0], '2:major': [null, null, 0, 2, 3, 2], '4:major': [0, 2, 2, 1, 0, 0],
    '5:major': [1, 3, 3, 2, 1, 1], '7:major': [3, 2, 0, 0, 0, 3], '9:major': [null, 0, 2, 2, 2, 0], '11:major': [null, 2, 4, 4, 4, 2],
    '9:minor': [null, 0, 2, 2, 1, 0], '2:minor': [null, null, 0, 2, 3, 1], '4:minor': [0, 2, 2, 0, 0, 0],
    '0:7': [null, 3, 2, 3, 1, 0], '2:7': [null, null, 0, 2, 1, 2], '4:7': [0, 2, 0, 1, 0, 0],
    '7:7': [3, 2, 0, 0, 0, 1], '9:7': [null, 0, 2, 0, 2, 0], '11:7': [null, 2, 1, 2, 0, 2],
    '0:maj7': [null, 3, 2, 0, 0, 0], '2:maj7': [null, null, 0, 2, 2, 2], '4:maj7': [0, 2, 1, 1, 0, 0],
    '5:maj7': [null, null, 3, 2, 1, 0], '7:maj7': [3, 2, 0, 0, 0, 2], '9:maj7': [null, 0, 2, 1, 2, 0],
    '9:m7': [null, 0, 2, 0, 1, 0], '2:m7': [null, null, 0, 2, 1, 1], '4:m7': [0, 2, 0, 0, 0, 0],
    '2:sus2': [null, null, 0, 2, 3, 0], '9:sus2': [null, 0, 2, 2, 0, 0],
    '2:sus4': [null, null, 0, 2, 3, 3], '9:sus4': [null, 0, 2, 2, 3, 0], '4:sus4': [0, 2, 2, 2, 0, 0]
  };
  const OPEN_FINGERS = {
    '0:major': [null,3,2,0,1,0], '2:major': [null,null,0,1,3,2], '4:major': [0,2,3,1,0,0],
    '5:major': [1,3,4,2,1,1], '7:major': [2,1,0,0,0,3], '9:major': [null,0,1,2,3,0], '11:major': [null,1,3,3,3,1],
    '9:minor': [null,0,2,3,1,0], '2:minor': [null,null,0,2,3,1], '4:minor': [0,2,3,0,0,0],
    '0:7': [null,3,2,4,1,0], '2:7': [null,null,0,2,1,3], '4:7': [0,2,0,1,0,0],
    '7:7': [3,2,0,0,0,1], '9:7': [null,0,2,0,3,0], '11:7': [null,2,1,3,0,4],
    '0:maj7': [null,3,2,0,0,0], '2:maj7': [null,null,0,1,1,1], '4:maj7': [0,2,1,1,0,0],
    '5:maj7': [null,null,3,2,1,0], '7:maj7': [3,2,0,0,0,1], '9:maj7': [null,0,2,1,3,0],
    '9:m7': [null,0,2,0,1,0], '2:m7': [null,null,0,2,1,1], '4:m7': [0,2,0,0,0,0],
    '2:sus2': [null,null,0,1,3,0], '9:sus2': [null,0,2,3,0,0],
    '2:sus4': [null,null,0,1,3,4], '9:sus4': [null,0,1,2,3,0], '4:sus4': [0,2,3,4,0,0]
  };
  const FORMS = {
    major: [[0, 2, 2, 1, 0, 0], [null, 0, 2, 2, 2, 0]],
    minor: [[0, 2, 2, 0, 0, 0], [null, 0, 2, 2, 1, 0]],
    '7': [[0, 2, 0, 1, 0, 0], [null, 0, 2, 0, 2, 0]],
    maj7: [[0, 2, 1, 1, 0, 0], [null, 0, 2, 1, 2, 0]],
    m7: [[0, 2, 0, 0, 0, 0], [null, 0, 2, 0, 1, 0]],
    halfDim: [[0, 1, 0, 0, null, null], [null, 0, 1, 0, 1, null]],
    dim: [[0, 1, 2, 0, null, null], [null, 0, 1, 2, 1, null]]
  };
  const cache = new Map();
  function describe(frets, chord, source) {
    const pitches = frets.flatMap((f, i) => f === null ? [] : [TUNING[i] + f]);
    const pcs = pitches.map(T.mod);
    return { frets, pitches, source, omitted: chord.notes.filter(n => !pcs.includes(n.pc)), required: T.requiredNotes(chord) };
  }
  function valid(frets, chord, requireRootBass = true) {
    const pitches = frets.flatMap((f, i) => f === null ? [] : [TUNING[i] + f]);
    return pitches.length >= 3 && pitches.every(p => chord.notes.some(n => n.pc === T.mod(p))) && T.requiredNotes(chord).every(n => pitches.some(p => T.mod(p) === n.pc)) && (!requireRootBass || T.mod(pitches[0]) === chord.root);
  }
  function voicing(chord, compact = false) {
    const key = `${chord.name}:${chord.root}:${chord.type}:${compact}`;
    if (cache.has(key)) return cache.get(key);
    const open = OPEN[`${chord.root}:${chord.type}`];
    if (!compact && open && valid(open, chord)) { const v = { ...describe(open, chord, 'Posição usual'), fingers: OPEN_FINGERS[`${chord.root}:${chord.type}`] }; cache.set(key, v); return v; }
    const forms = FORMS[chord.type];
    if (!compact && forms) {
      const candidates = forms.map((form, i) => {
        const base = T.mod(chord.root - (i === 0 ? 4 : 9));
        return { frets: form.map(f => f === null ? null : f + base), base, i };
      }).filter(c => c.frets.every(f => f === null || f <= 12) && valid(c.frets, chord)).sort((a, b) => a.base - b.base);
      if (candidates.length) { const c = candidates[0], v = describe(c.frets, chord, `Forma móvel de ${c.i === 0 ? 'E' : 'A'} · CAGED`); cache.set(key, v); return v; }
    }
    // Contiguous strings only: end strings can be muted, internal gaps are avoided.
    const required = T.requiredNotes(chord).map(n => n.pc), allowed = chord.notes.map(n => n.pc);
    let best = null, bestScore = Infinity;
    for (let position = 0; position <= 9; position++) {
      const maxFret = position === 0 ? 4 : position + 3;
      const choices = TUNING.map(base => Array.from({ length: maxFret - position + 1 }, (_, n) => n + position).filter(f => allowed.includes(T.mod(base + f))));
      for (let count = required.length; count <= (compact ? 4 : 6); count++) for (let first = 0; first + count <= 6; first++) {
        if (count < 3 || !choices[first].length) continue;
        const frets = Array(6).fill(null);
        function visit(index, pcs) {
          if (index === first + count) {
            if (!required.every(pc => pcs.includes(pc))) return;
            const used = frets.filter(f => f > 0), span = used.length ? Math.max(...used) - Math.min(...used) : 0;
            if (span > 3) return;
            const omitted = allowed.filter(pc => !pcs.includes(pc)).length;
            const inversionPenalty = pcs[0] === chord.root ? 0 : 10;
            const score = inversionPenalty + (compact ? count * 8 : omitted * 24) + position * 1.8 + span * 2 + used.length * .6 + first;
            if (score < bestScore) { bestScore = score; best = [...frets]; }
            return;
          }
          for (const fret of choices[index]) {
            const pc = T.mod(TUNING[index] + fret);
            if (!compact && index === first && pc !== chord.root) continue;
            frets[index] = fret; visit(index + 1, [...pcs, pc]);
          }
          frets[index] = null;
        }
        visit(first, []);
      }
    }
    const bass = best ? T.mod(TUNING[best.findIndex(f => f !== null)] + best.find(f => f !== null)) : null;
    const result = best ? describe(best, chord, compact ? `Posição compacta${bass !== chord.root ? ' · inversão' : ''}` : 'Voicing de estudo · cordas vizinhas') : null;
    cache.set(key, result); return result;
  }
  function scalePosition(scale, position = 0) {
    const end = position + 4;
    const cells = [];
    TUNING.forEach((base, string) => { for (let fret = position; fret <= end; fret++) {
      const note = scale.find(n => n.pc === T.mod(base + fret));
      if (note) cells.push({ string, fret, midi: base + fret, ...note });
    } });
    return cells;
  }
  function leadTriad(chord, previous, direction = 'fourths') {
    if (!previous) {
      const seed = voicing(chord, true);
      // Fifths descend through the voices: start one octave higher so a full
      // turn can keep the same strings without running into the nut.
      return describe(seed.frets.map(f => f === null ? null : f + (direction === 'fifths' ? 12 : 0)), chord, 'Tríade · condução automática');
    }
    const strings = previous.frets.flatMap((f, s) => f === null ? [] : [s]);
    const allowed = chord.notes.map(n => n.pc), frets = Array(6).fill(null);
    let best, score;
    function visit(index) {
      if (index === strings.length) {
        const used = frets.filter(f => f > 0);
        if (used.length && Math.max(...used) - Math.min(...used) > 3) return;
        const candidate = describe([...frets], chord, 'Tríade · condução automática');
        if (candidate.omitted.length || candidate.pitches.at(-1) - candidate.pitches[0] >= 12) return;
        if (candidate.pitches.some((p, i) => i && p <= candidate.pitches[i - 1])) return;
        const motion = T.motionScore(previous.pitches, candidate.pitches);
        if (!best || T.compareMotion(motion, score) < 0) { best = candidate; score = motion; }
        return;
      }
      const string = strings[index];
      for (let fret = 0; fret <= 19; fret++) if (allowed.includes(T.mod(TUNING[string] + fret))) {
        frets[string] = fret; visit(index + 1);
      }
      frets[string] = null;
    }
    visit(0);
    return best || leadTriad(chord, null, direction);
  }
  function ascendingPath(scale, position = 0) {
    const cells = scalePosition(scale, position).sort((a, b) => a.midi - b.midi || a.string - b.string);
    for (const rootCell of cells.filter(n => n.degree === 1)) {
      const path = [];
      for (const offset of [...scale.map(n => n.offset), 12]) {
        const cell = cells.find(n => n.midi === rootCell.midi + offset);
        if (!cell) break; path.push(cell);
      }
      if (path.length === 8) return path;
    }
    return [];
  }
  const api = { TUNING, OPEN, OPEN_FINGERS, voicing, leadTriad, scalePosition, ascendingPath, valid };
  root.GuitarTheory = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
