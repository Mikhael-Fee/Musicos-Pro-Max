(function () {
  'use strict';
  const $ = id => document.getElementById(id), T = MusicTheory, G = GuitarTheory;
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const settingsKey = 'musicospromax.settings.v2', statsKey = 'musicospromax.stats.v1';
  const settingIds = ['key', 'scale', 'instrument', 'explore-topic', 'field-format', 'chord-type', 'note-labels', 'play-style', 'inversion', 'piano-layout', 'guitar-view', 'scale-position', 'volume', 'guitar-volume', 'piano-volume', 'reference-instrument', 'feedback-sound', 'cycle-direction', 'cycle-reference'];
  let mode = 'explore', degree = 1, scene, session = null, guided = null, cycleSession = null, cyclePlayback = 0;
  let playback = 0, audioTimers = [], feedbackUntil = 0;
  let stats = { attempts: 0, correct: 0, sessions: 0 };
  function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; } }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function key() { return Number($('key').value); }
  function scale() { return T.scale(key(), $('scale').value); }
  function field(seventh = $('field-format').value === 'seventh') { return Array.from({ length: 7 }, (_, i) => T.chord(key(), $('scale').value, i + 1, seventh)); }
  function options() { return { labels: $('note-labels').value, instrument: $('instrument').value, guitarView: $('guitar-view').value, position: position(), inversion: Number($('inversion').value), pianoLayout: $('piano-layout').value }; }
  function position() { const value = $('scale-position').value; return value === 'root6' ? T.mod(key() - 4) : value === 'root5' ? T.mod(key() - 9) : 0; }
  function visibleInstruments() { return $('instrument').value === 'both' ? ['guitar', 'piano'] : [$('instrument').value]; }
  function auditionInstruments() {
    if (mode === 'practice') return [$('reference-instrument').value];
    if (mode === 'cycles') return $('cycle-reference').value === 'both' ? ['guitar', 'piano'] : [$('cycle-reference').value];
    return visibleInstruments();
  }
  function effectiveInstrument() { return auditionInstruments()[0]; }
  function sourceOf(n) { return n.instrument || (n.string === undefined ? 'piano' : 'guitar'); }
  function saveSettings() { save(settingsKey, Object.fromEntries(settingIds.map(id => [id, $(id).type === 'checkbox' ? $(id).checked : $(id).value]))); }
  function syncPracticeView() { for (const id of ['practice-view', 'cycle-view']) $(id).value = $('instrument').value; }

  function random(array) { return array[Math.floor(Math.random() * array.length)]; }
  function shuffle(array) { const a = [...array]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function button(text, handler, className) { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; if (className) b.className = className; b.addEventListener('click', handler); return b; }
  function stopAudio(preserveFeedback = false) { playback++; audioTimers.forEach(clearTimeout); audioTimers = []; soundEngine.stop(!preserveFeedback); if (!preserveFeedback) feedbackUntil = 0; window.speechSynthesis?.cancel(); }
  function cancelAudition() { playback++; audioTimers.forEach(clearTimeout); audioTimers = []; soundEngine.cancelScheduled(); }
  function midiNote(n, delay = 0, instrument = effectiveInstrument(), at) {
    try { soundEngine.note(n.midi - 48, instrument, delay, at); $('audio-status').textContent = ''; }
    catch (_) { $('audio-status').textContent = 'O navegador não conseguiu iniciar o áudio. Verifique o volume ou tente outro navegador.'; }
  }
  function draw() { InstrumentUI.render(scene, options()); }
  function describeNote(n) {
    const name = scene.chord?.notes.find(x => x.pc === T.mod(n.midi))?.name || scale().find(x => x.pc === T.mod(n.midi))?.name || T.tonics.Maior[T.mod(n.midi)];
    return `${T.label(name, 'solfege')} (${T.label(name)}${Math.floor(n.midi / 12) - 1})${n.string === undefined ? '' : ` · ${6 - n.string}ª corda, ${n.fret === 0 ? 'solta' : 'casa ' + n.fret}`}`;
  }
  function playArrangement(parts, spacing = .24, keepSelection = true) {
    cancelAudition(); const token = playback;
    const delay = Math.max(0, feedbackUntil - Date.now()) / 1000;
    const active = {};
    const available = parts.filter(p => p.notes.length);
    if (!available.length) return;
    const show = () => { scene.selected = Object.values(active).flat(); draw(); };
    for (const part of available) {
      const tagged = part.notes.map(n => ({ ...n, instrument: part.instrument }));
      tagged.forEach((n, i) => {
        const at = delay + i * spacing;
        midiNote(n, at, part.instrument);
        const mark = () => {
          if (token !== playback) return;
          active[part.instrument] = spacing ? [n] : tagged; show();
          $('live-note').textContent = `${part.instrument === 'piano' ? 'Teclado' : 'Violão'} · ${describeNote(n)}`;
        };
        if (at === 0) mark(); else audioTimers.push(setTimeout(mark, at * 1000));
      });
    }
    const length = Math.max(...available.map(p => p.notes.length));
    audioTimers.push(setTimeout(() => {
      if (token !== playback) return;
      scene.selected = keepSelection ? available.flatMap(p => p.notes.map(n => ({ ...n, instrument: p.instrument }))) : [];
      draw();
    }, (delay + (length - 1) * spacing) * 1000 + 200));
  }
  function playSeries(notes, spacing = .24, instrument = effectiveInstrument(), keepSelection = true) {
    playArrangement([{ instrument, notes }], spacing, keepSelection);
  }
  function chordPitches(chord, instrument = effectiveInstrument()) {
    if (instrument === 'guitar') {
      const v = G.voicing(chord, $('guitar-view').value === 'compact');
      if (v) return v.frets.flatMap((fret, string) => fret === null ? [] : [{ midi: G.TUNING[string] + fret, string, fret }]);
    }
    return T.pianoVoicing(chord, Number($('inversion').value), $('piano-layout').value).map(midi => ({ midi }));
  }
  function playChord(chord, instruments = auditionInstruments()) { playArrangement(instruments.map(instrument => ({ instrument, notes: chordPitches(chord, instrument) })), $('play-style').value === 'block' ? 0 : .1, false); }
  function noteLocation(pc, instrument = effectiveInstrument()) {
    if (instrument === 'guitar') {
      if (scene.kind === 'chord' && !scene.forceBoard && $('guitar-view').value !== 'all') {
        const match = chordPitches(scene.chord, 'guitar').find(n => T.mod(n.midi) === pc);
        if (match) return match;
        scene.forceBoard = true;
      }
      const start = position(), end = start + 4;
      for (let string = 5; string >= 0; string--) for (let fret = start; fret <= end; fret++) if (T.mod(G.TUNING[string] + fret) === pc) return { midi: G.TUNING[string] + fret, string, fret };
    }
    return { midi: scene.kind === 'chord' ? T.pianoVoicing(scene.chord, Number($('inversion').value), $('piano-layout').value).find(midi => midi % 12 === pc) ?? 48 + pc : 48 + pc };
  }
  function showSingle(n) {
    const instrument = sourceOf(n); scene.selected = [{ ...n, instrument }]; draw();
    playSeries([n], 0, instrument); $('live-note').textContent = describeNote(n);
  }
  function clearPalettes() { $('chord-palette').replaceChildren(); $('chord-palette').classList.remove('cycle-palette'); $('note-palette').replaceChildren(); }
  function notePalette(ns) {
    $('note-palette').replaceChildren();
    for (const n of ns) {
      const b = button('', () => {
        const instruments = auditionInstruments();
        playArrangement(instruments.map(instrument => ({ instrument, notes: [noteLocation(n.pc, instrument)] })), 0);
        $('note-palette').querySelectorAll('button').forEach(el => el.setAttribute('aria-pressed', String(el === b)));
      });
      const text = document.createElement('b'); text.textContent = T.label(n.name, $('note-labels').value === 'solfege' ? 'solfege' : 'letters');
      const role = document.createElement('small'); role.textContent = n.role || n.degree;
      b.classList.toggle('altered', /[#b]/.test(n.name));
      b.append(text, role); b.dataset.pc = n.pc; b.setAttribute('aria-label', `Ouvir ${T.label(n.name, 'solfege')}`); b.setAttribute('aria-pressed', 'false');
      $('note-palette').append(b);
    }
  }
  function configurePiano(chord) {
    $('inversion').options[3].disabled = chord.notes.length < 4;
    if (chord.notes.length < 4 && $('inversion').value === '3') $('inversion').value = '0';
  }
  function showChord(chord, category, title = chord.name, description = '') {
    configurePiano(chord);
    scene = { kind: 'chord', chord, scale: scale(), selected: [] };
    $('scene-category').textContent = category; $('scene-title').textContent = title;
    $('scene-description').textContent = description || `${T.CHORD_TYPES[chord.type].title} · Fórmula: ${chord.roles.join(' · ')}. Ouça o acorde ou toque em cada nota.`;
    notePalette(chord.notes); $('play-scene').textContent = 'Ouvir acorde'; $('play-scene').disabled = false; draw();
  }
  function showExplore() {
    clearPalettes(); const topic = $('explore-topic').value;
    $('field-format-label').hidden = topic !== 'field'; $('chord-type-label').hidden = topic !== 'chord';
    if (topic === 'scale') {
      const ns = scale(); scene = { kind: 'scale', scale: ns, selected: [] };
      $('scene-category').textContent = 'ESCALA NO INSTRUMENTO'; $('scene-title').textContent = `${T.label(ns[0].name)} ${$('scale').value.toLowerCase()}`;
      $('scene-description').textContent = 'Comece pela tônica lilás e siga os graus 1–7. No violão, uma região curta por vez.';
      $('explore-help').textContent = 'Ouça a escala em ordem. A posição didática mostra as notas das casas 0–4; outras regiões e o mapa completo ficam ao lado do instrumento.';
      $('play-scene').textContent = 'Ouvir escala'; $('play-scene').disabled = false; notePalette(ns); draw();
    } else {
      const chord = topic === 'field' ? field()[degree - 1] : T.buildChord(key(), $('chord-type').value, scale()[0].name);
      showChord(chord, topic === 'field' ? 'CAMPO HARMÔNICO' : 'ACORDE E EXTENSÕES', chord.name);
      $('explore-help').textContent = topic === 'field' ? 'Escolha um acorde: o som e a posição aparecem juntos.' : 'sus2 e sus4 substituem a terça. add9 acrescenta a nona sem sétima. 9, 11 e 13 incluem a sétima; o violão pode omitir notas internas, indicadas abaixo da posição.';
      if (topic === 'field') field().forEach((c, i) => {
        const b = button('', () => { degree = i + 1; cancelAudition(); showExplore(); playChord(c); });
        const strong = document.createElement('strong'); strong.textContent = c.name;
        const small = document.createElement('small'); small.textContent = `${roman(c, i)} · ${i + 1}º grau`;
        b.append(strong, small); b.setAttribute('aria-pressed', String(i + 1 === degree)); b.dataset.degree = i + 1;
        $('chord-palette').append(b);
      });
    }
    $('live-note').textContent = 'Toque nas notas para ouvir e comparar.';
  }
  function updateStats() {
    const rate = stats.attempts ? Math.round(stats.correct / stats.attempts * 100) : 0;
    $('practice-stats').textContent = `${stats.correct}/${stats.attempts} acertos · ${rate}% · ${stats.sessions} treinos completos`;
    $('cycle-stats').textContent = $('practice-stats').textContent;
  }
  function exerciseHelp() {
    const type = $('exercise-type').value;
    $('exercise-chord-label').hidden = type !== 'build'; $('practice-field-format-label').hidden = type !== 'field'; $('ear-level-label').hidden = type !== 'ear';
    $('exercise-help').textContent = {
      notes: 'Encontre uma nota no instrumento. O nome fica oculto e cada toque produz som.',
      build: 'Monte um acorde tocando suas notas. No violão, escolha uma casa por corda. Depois confirme.',
      ear: 'A primeira nota fica fixa na tonalidade escolhida. Ouça o desafio, experimente as opções com som e marcação, e só então confirme.',
      degrees: 'Escolha a nota de cada grau. Cada opção toca e aparece no instrumento antes de confirmar.',
      field: 'Escolha o acorde do grau pedido. Você pode ouvir e visualizar cada opção antes de confirmar.'
    }[type];
  }
  function endPractice(message = '') {
    if (session?.type === 'ear') { $('guitar-view').value = session.previousView; $('scale-position').value = session.previousPosition; }
    $('answer-instrument-label').hidden = true; $('practice-panel').removeAttribute('data-result');
    document.body.classList.remove('practicing'); delete document.body.dataset.exerciseType; session = null; stopAudio(); $('practice-setup').hidden = false; $('practice-session').hidden = true;
    $('exercise-help').textContent = message || $('exercise-help').textContent;
    lockMain(false); showExplore();
  }
  function lockMain(value) { ['key', 'scale'].forEach(id => $(id).disabled = value); }
  function startPractice() {
    stopGuided(); stopAudio();
    session = { type: $('exercise-type').value, reference: $('reference-instrument').value, instrument: $('instrument').value === 'both' ? $('reference-instrument').value : $('instrument').value, selections: { guitar: [], piano: [] }, completed: 0, correct: 0, last: -1, selection: [], previousView: $('guitar-view').value, previousPosition: $('scale-position').value };
    document.body.classList.add('practicing'); document.body.dataset.exerciseType = session.type; $('practice-setup').hidden = true; $('practice-session').hidden = false; lockMain(true); syncPracticeView(); $('answer-instrument-label').hidden = session.type !== 'build'; $('answer-instrument').value = session.instrument; nextQuestion();
  }
  function neutralScene(title, category, hideLabels = false) {
    clearPalettes(); scene = { kind: 'custom', scale: scale(), selected: [], hideLabels, forceBoard: true };
    $('scene-title').textContent = title; $('scene-category').textContent = category;
    $('scene-description').textContent = hideLabels ? 'Nomes ocultos. Toque diretamente no instrumento para responder.' : 'Toque para ouvir. Sua escolha fica marcada em amarelo.';
    $('play-scene').textContent = 'Ouvir desafio'; $('play-scene').disabled = session?.type !== 'ear' && session?.type !== 'build'; draw();
  }
  function nextQuestion() {
    if (!session) return;
    if (session.completed === 10) {
      const score = session.correct;
      endPractice(`Treino concluído: ${score} de 10 acertos. ${score >= 8 ? 'Experimente outra tonalidade ou extensão.' : 'Revise as notas e tente mais uma vez.'}`); return;
    }
    stopAudio(); session.answered = false; session.choice = null; session.selection = []; session.selections = { guitar: [], piano: [] }; session.selections[session.instrument] = session.selection;
    $('feedback').replaceChildren(); $('feedback').className = ''; $('practice-panel').removeAttribute('data-result'); $('answers').replaceChildren();
    $('confirm-answer').hidden = session.type === 'notes'; $('confirm-answer').disabled = true;
    $('clear-selection').hidden = session.type !== 'build'; $('show-example').hidden = true; $('next-question').hidden = true;
    $('listen-target').hidden = !['ear', 'build'].includes(session.type);
    $('session-label').textContent = `Questão ${session.completed + 1}/10 · ${session.correct} acertos`;
    $('session-progress').value = session.completed;
    $('question-category').textContent = $('exercise-type').selectedOptions[0].textContent;
    const ns = scale(); let choices = [];
    if (session.type === 'notes' || session.type === 'degrees') {
      const n = random(ns.filter(x => x.degree !== session.last)); session.last = n.degree; session.targetNote = n; session.expected = n.pc;
      $('question').textContent = session.type === 'notes' ? `Encontre ${T.label(n.name, 'solfege')} (${n.name}).` : `Qual nota é o ${n.degree}º grau?`;
      $('question-help').textContent = session.type === 'notes' ? 'Pode ser em qualquer oitava. Toque na nota no instrumento.' : `Escala de ${ns[0].name} ${$('scale').value.toLowerCase()}. Escolha uma nota, ouça e confirme.`;
      neutralScene(`Escala de ${ns[0].name} ${$('scale').value.toLowerCase()}`, 'ESCALA DE REFERÊNCIA', session.type === 'notes');
      if (session.type === 'degrees') choices = ns.map(n => ({ value: n.pc, title: T.label(n.name), note: n }));
    } else if (session.type === 'build') {
      const n = random(ns.filter(n => n.degree !== session.last)); session.last = n.degree;
      const type = $('exercise-chord-type').value;
      session.chord = type === 'field' ? T.chord(key(), $('scale').value, n.degree) : T.buildChord(n.pc, type, n.name);
      configurePiano(session.chord);
      $('question').textContent = `Monte ${session.chord.name}.`;
      buildHelp();
      neutralScene(`Monte ${session.chord.name}`, 'ENCONTRE AS NOTAS DO ACORDE');
    } else if (session.type === 'field') {
      const d = random([1, 2, 3, 4, 5, 6, 7].filter(n => n !== session.last)); session.last = d; session.expected = d;
      session.field = field($('practice-field-format').value === 'seventh'); session.chord = session.field[d - 1];
      $('question').textContent = `Qual acorde é o ${d}º grau?`;
      $('question-help').textContent = `${ns[0].name} ${$('scale').value.toLowerCase()} · ${$('practice-field-format').value === 'seventh' ? 'com sétima' : 'tríades'}. Selecione, ouça e confirme.`;
      neutralScene('Escolha um acorde', 'CAMPO HARMÔNICO');
      choices = session.field.map((chord, i) => ({ value: i + 1, title: chord.name, chord }));
    } else {
      const pool = $('ear-level').value === 'all' ? Array.from({ length: 12 }, (_, i) => i + 1) : [2, 3, 4, 5, 7, 12];
      session.expected = random(pool.filter(n => n !== session.last)); session.last = session.expected;
      session.base = session.reference === 'guitar' ? G.ascendingPath(scale(), 0)[0].midi : 48 + key();
      $('question').textContent = 'Qual é a distância entre as duas notas?';
      $('question-help').textContent = `Referência fixa: ${T.label(ns[0].name, 'solfege')} (${ns[0].name}). Ouça o desafio; cada opção toca um exemplo a partir da mesma nota. Depois confirme.`;
      neutralScene('Ouça e compare', 'DISTÂNCIA ENTRE NOTAS');
      choices = shuffle([session.expected, ...shuffle(pool.filter(n => n !== session.expected)).slice(0, 3)]).map(n => ({ value: n, title: T.INTERVALS[n], subtitle: T.distance(n) }));
    }
    session.choices = choices;
    for (const choice of choices) {
      const b = button(choice.title, () => previewChoice(choice)); b.dataset.answer = choice.value; b.setAttribute('aria-pressed', 'false');
      if (choice.subtitle) { const small = document.createElement('small'); small.textContent = choice.subtitle; b.append(small); }
      $('answers').append(b);
    }
    if (session.type === 'ear') playTarget();
  }
  function guitarLocation(midi) {
    for (let s = 5; s >= 0; s--) { const f = midi - G.TUNING[s]; if (f >= 0 && f <= 12) return { midi, string: s, fret: f }; }
    return { midi };
  }
  function intervalNotes(distance) {
    const pair = [{ midi: session.base }, { midi: session.base + distance }];
    return session.reference === 'guitar' ? pair.map(n => guitarLocation(n.midi)) : pair;
  }
  function showInterval(distance, caption) {
    const pair = intervalNotes(distance);
    scene = { kind: 'custom', scale: scale(), pitches: pair.map(n => n.midi), pitchesByInstrument: { [session.reference]: pair.map(n => n.midi) }, selected: pair.map(n => ({ ...n, instrument: session.reference })), forceBoard: true };
    $('scene-title').textContent = T.INTERVALS[distance]; $('scene-category').textContent = caption;
    $('scene-description').textContent = `${T.distance(distance)} · ${pair.map(n => { const name = scale().find(x => x.pc === T.mod(n.midi))?.name || T.tonics.Maior[T.mod(n.midi)]; return `${name}${Math.floor(n.midi / 12) - 1}`; }).join(' → ')}. Na mesma corda: 1 casa = 1 semitom.`;
    // Choose the initial region so the reference and all octave intervals remain visible together.
    if (session.reference === 'guitar') { $('guitar-view').value = 'standard'; $('scale-position').value = '0'; }
    draw(); playSeries(pair, .65, session.reference);
  }
  function previewChoice(choice) {
    if (!session) return;
    if (!session.answered) { session.choice = choice.value; $('confirm-answer').disabled = false; }
    $('answers').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.answer) === choice.value)));
    if (session.type === 'ear') showInterval(choice.value, 'EXEMPLO DA SUA ESCOLHA');
    else if (choice.chord) { showChord(choice.chord, 'EXEMPLO DA SUA ESCOLHA'); playChord(choice.chord); }
    else { const n = noteLocation(choice.note.pc); showSingle(n); $('scene-title').textContent = T.label(choice.note.name, 'solfege'); }
  }
  function playTarget() {
    if (!session) return;
    if (session.type === 'ear') {
      if (session.answered) showInterval(session.expected, 'RESPOSTA DO DESAFIO');
      else {
        neutralScene('Ouça o desafio', 'REFERÊNCIA + NOTA A DESCOBRIR');
        // Play both notes, but reveal only the reference until the learner chooses an example.
        const pair = intervalNotes(session.expected); cancelAudition(); pair.forEach((n, i) => midiNote(n, i * .65, session.reference));
        scene.selected = [{ ...pair[0], instrument: session.reference }]; draw(); $('live-note').textContent = `Primeira nota: ${T.label(scale()[0].name, 'solfege')}. A segunda é a que você vai identificar.`;
      }
    } else if (session.type === 'build') {
      // Sound is a model; the diagram remains hidden until an answer is checked.
      const selection = Object.values(session.selections).flat(); cancelAudition(); chordPitches(session.chord, session.reference).forEach((n, i) => midiNote(n, i * .1, session.reference));
      scene.selected = selection; draw();
    }
  }
  function showResult(container, panel, correct, explanation) {
    container.className = correct ? 'result-success' : 'result-error';
    panel.dataset.result = correct ? 'success' : 'error';
    const heading = document.createElement('strong'); heading.textContent = correct ? '✓ Acertou!' : '✕ Vamos revisar.';
    const detail = document.createElement('p'); detail.textContent = explanation;
    container.replaceChildren(heading, detail);
    if ($('feedback-sound').checked) { try { soundEngine.feedback(correct); feedbackUntil = Date.now() + 330; } catch (_) {} }
  }
  function grade(correct, explanation) {
    if (!session || session.answered) return;
    session.answered = true; session.completed++; if (correct) { session.correct++; stats.correct++; }
    stats.attempts++; if (session.completed === 10) stats.sessions++;
    save(statsKey, stats); updateStats();
    $('session-progress').value = session.completed;
    $('session-label').textContent = `${session.completed}/10 respondidas · ${session.correct} acertos`;
    showResult($('feedback'), $('practice-panel'), correct, explanation);
    $('confirm-answer').hidden = true; $('next-question').hidden = false;
    $('next-question').textContent = session.completed === 10 ? 'Ver resultado →' : 'Próxima →';
    $('answers').querySelectorAll('button').forEach(b => {
      b.classList.toggle('correct', Number(b.dataset.answer) === session.expected);
      b.classList.toggle('wrong', !correct && Number(b.dataset.answer) === session.choice);
    });
  }
  function confirmAnswer() {
    if (!session || session.answered) return;
    if (session.type === 'build') {
      const chosen = session.selection.map(n => T.mod(n.midi)), target = session.chord;
      const required = session.instrument === 'guitar' ? T.requiredNotes(target) : target.notes;
      const fretted = session.selection.filter(n => n.fret > 0).map(n => n.fret);
      const stretch = fretted.length ? Math.max(...fretted) - Math.min(...fretted) : 0;
      const correct = required.every(n => chosen.includes(n.pc)) && chosen.every(pc => target.notes.some(n => n.pc === pc)) && (session.instrument !== 'guitar' || stretch <= 3);
      const missing = required.filter(n => !chosen.includes(n.pc)).map(n => n.name), outside = [...new Set(chosen.filter(pc => !target.notes.some(n => n.pc === pc)))];
      const extra = !correct ? `${missing.length ? ` Faltam: ${missing.join(', ')}.` : ''}${outside.length ? ' Há notas de fora do acorde.' : ''}${stretch > 3 && session.instrument === 'guitar' ? ' A posição ultrapassa quatro casas; tente uma posição mais próxima.' : ''}` : '';
      grade(correct, `${target.name}: ${target.notes.map(n => `${n.name} (${n.role})`).join(' · ')}.${extra}`);
      $('show-example').hidden = false; notePalette(target.notes); scene.hideLabels = false; draw(); return;
    }
    if (session.choice === null) return;
    const correct = session.choice === session.expected;
    if (session.type === 'ear') { grade(correct, `${T.INTERVALS[session.expected]} = ${T.distance(session.expected)}. Ouça a resposta e compare com sua opção.`); showInterval(session.expected, 'RESPOSTA DO DESAFIO'); }
    else if (session.type === 'field') { grade(correct, `${session.expected}º grau: ${session.chord.name}.`); showChord(session.chord, 'RESPOSTA DO DESAFIO'); playChord(session.chord); }
    else { const n = session.targetNote; grade(correct, `${n.degree}º grau: ${T.label(n.name, 'solfege')} (${n.name}).`); showSingle(noteLocation(n.pc)); }
  }
  function buildHelp() {
    if (!session?.chord || session.type !== 'build') return;
    const required = session.instrument === 'guitar' ? T.requiredNotes(session.chord) : session.chord.notes;
    $('question-help').textContent = `Montando no ${session.instrument === 'guitar' ? 'violão, uma casa por corda' : 'teclado, selecione as notas'}. Graus obrigatórios: ${required.map(n => n.role).join(' · ')}. Clique no outro instrumento para trocar.`;
  }
  function switchAnswerInstrument(source, reveal = false) {
    if (!session || session.type !== 'build' || session.answered) return;
    session.selections[session.instrument] = session.selection;
    session.instrument = source; session.selection = session.selections[source];
    $('answer-instrument').value = source; buildHelp();
    scene.selected = Object.values(session.selections).flat();
    $('confirm-answer').disabled = !session.selection.length;
    if (reveal && $('instrument').value !== 'both') { $('instrument').value = source; syncPracticeView(); }
    draw();
  }
  function changeReference() {
    if (!session) return;
    stopAudio(); session.reference = $('reference-instrument').value;
    if (session.type === 'ear') {
      session.base = session.reference === 'guitar' ? G.ascendingPath(scale(), 0)[0].midi : 48 + key();
      session.choice = null;
      $('answers').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
      if (!session.answered) $('confirm-answer').disabled = true;
      playTarget();
    } else if (session.type === 'build') playTarget();
    else if (session.choice !== null) previewChoice(session.choices.find(c => c.value === session.choice));
  }
  function instrumentClick(n) {
    if (session && !session.answered && session.type === 'notes') {
      showSingle(n); const correct = T.mod(n.midi) === session.expected;
      grade(correct, `${session.targetNote.name} é o ${session.targetNote.degree}º grau desta escala.`);
      scene.hideLabels = false; scene.kind = 'scale'; scene.scale = [{ ...session.targetNote, degree: 1 }]; scene.selected = [n]; draw(); return;
    }
    if (session && !session.answered && session.type === 'build') {
      const source = n.string === undefined ? 'piano' : 'guitar';
      if (source !== session.instrument) switchAnswerInstrument(source);
      cancelAudition(); midiNote(n, 0, source);
      const existing = session.selection.some(x => source === 'guitar' ? x.string === n.string && x.fret === n.fret : x.midi === n.midi);
      session.selection = session.selection.filter(x => source === 'guitar' ? x.string !== n.string : x.midi !== n.midi);
      if (!existing) session.selection.push({ ...n, instrument: source });
      session.selections[source] = session.selection;
      scene.selected = Object.values(session.selections).flat(); draw();
      $('confirm-answer').disabled = !session.selection.length;
      $('live-note').textContent = session.selection.length ? `Sua montagem: ${session.selection.map(describeNote).join(' · ')}` : 'Nenhuma nota selecionada.'; return;
    }
    showSingle(n);
  }
  const sequences = { worship4563: [4, 5, 6, 3], worship6415: [6, 4, 1, 5], worship4156: [4, 1, 5, 6], worship1645: [1, 6, 4, 5], worship145: [1, 4, 1, 5], basic: [1, 4, 5, 1], pop: [1, 5, 6, 4], jazz: [2, 5, 1], all: [1, 2, 3, 4, 5, 6, 7] };
  function roman(chord, index) {
    const minor = ['minor', 'm7', 'dim', 'halfDim'].includes(chord.type);
    return (minor ? ROMAN[index].toLowerCase() : ROMAN[index]) + (chord.type === 'dim' ? '°' : chord.type === 'halfDim' ? 'ø' : '');
  }
  function showGuidedPreview(index = 0) {
    clearPalettes();
    const pattern = sequences[$('guided-sequence').value], chords = field($('guided-format').value === 'seventh');
    [...$('guided-sequence').options].forEach(o => { if (o.value !== 'all') o.textContent = sequences[o.value].map(d => roman(chords[d - 1], d - 1)).join(' → ') + ' · ' + sequences[o.value].join('–'); });
    const selected = chords[pattern[index] - 1];
    showChord(selected, 'PROGRESSÃO PARA PRATICAR', selected.name, `Graus: ${pattern.join(' → ')}. Em ${scale()[0].name} ${$('scale').value.toLowerCase()}: ${pattern.map(d => chords[d - 1].name).join(' → ')}.`);
    pattern.forEach((d, i) => {
      const c = chords[d - 1];
      const b = button('', () => { showGuidedPreview(i); playChord(c); });
      const strong = document.createElement('strong'); strong.textContent = c.name;
      const small = document.createElement('small'); small.textContent = `${d}º grau`;
      b.append(strong, small); b.dataset.progressionStep = i; b.setAttribute('aria-pressed', String(i === index)); $('chord-palette').append(b);
    });
  }
  function stopGuided() {
    if (guided) guided.token++;
    guided = null; document.body.classList.remove('guiding'); stopAudio(); $('guided-setup').hidden = false; $('guided-session').hidden = true; lockMain(false);
    $('beats').querySelectorAll('i').forEach(el => el.classList.remove('active'));
  }
  function startGuided() {
    endPractice();
    const pattern = sequences[$('guided-sequence').value];
    guided = { index: 0, degrees: Array.from({ length: Number($('guided-cycles').value) }, () => pattern).flat(), token: 0 };
    document.body.classList.add('guiding'); $('guided-setup').hidden = true; $('guided-session').hidden = false; lockMain(true); guidedRound();
  }
  async function guidedRound() {
    if (!guided) return;
    const run = guided, token = ++run.token;
    cancelAudition();
    const c = field($('guided-format').value === 'seventh')[run.degrees[run.index] - 1];
    clearPalettes(); showChord(c, 'TOQUE NO RITMO', c.name, `Grau ${run.degrees[run.index]} · ${c.notes.map(n => n.name).join(' · ')}. Acorde e metrônomo entram juntos no tempo 1.`);
    $('guided-question').textContent = `Toque ${c.name}`;
    $('guided-count').textContent = `${run.index + 1} de ${run.degrees.length}`;
    $('guided-phase').textContent = 'Prepare os dedos: vamos entrar no tempo 1.';
    $('next-guided').textContent = run.index === run.degrees.length - 1 ? 'Concluir sequência' : 'Próximo acorde →';
    const active = () => guided === run && run.token === token;
    const tempo = 60 / Math.max(40, Math.min(160, Number($('bpm').value) || 60));
    const everyBeat = $('guided-every-beat').checked;
    const parts = visibleInstruments().map(instrument => ({ instrument, notes: chordPitches(c, instrument).map(n => ({ ...n, instrument })) }));
    let ctx;
    try { ctx = soundEngine.init(); if (ctx.state === 'suspended') await ctx.resume(); }
    catch (_) { $('audio-status').textContent = 'Áudio indisponível; acompanhe os tempos na tela.'; }
    if (!active()) return;
    const wallStart = performance.now() + 90, audioStart = ctx ? ctx.currentTime + .09 : 0;
    // Schedule the click and block chord against the same audio clock, avoiding timer drift.
    if (ctx) for (let beat = 0; beat < 4; beat++) {
      const at = audioStart + beat * tempo;
      soundEngine.tick(beat === 0, 0, at);
      if (beat === 0 || everyBeat) for (const part of parts) for (const note of part.notes) midiNote(note, 0, part.instrument, at);
    }
    for (let beat = 0; beat < 4 && active(); beat++) {
      await new Promise(resolve => setTimeout(resolve, Math.max(0, wallStart + beat * tempo * 1000 - performance.now())));
      if (!active()) return;
      $('guided-phase').textContent = `Sua vez: toque ${c.name}. ${everyBeat ? 'Acorde nos quatro tempos.' : 'Acorde no tempo 1.'}`;
      $('beats').querySelectorAll('i').forEach((el, i) => el.classList.toggle('active', i === beat));
      scene.selected = beat === 0 || everyBeat ? parts.flatMap(p => p.notes) : []; draw();
    }
    await new Promise(resolve => setTimeout(resolve, Math.max(0, wallStart + 4 * tempo * 1000 - performance.now())));
    if (!active()) return;
    scene.selected = []; draw(); $('beats').querySelectorAll('i').forEach(el => el.classList.remove('active'));
    $('guided-phase').textContent = 'Repita o modelo ou avance quando estiver pronto.';
    if ($('guided-auto').checked) advanceGuided();
  }
  function advanceGuided() {
    if (!guided) return;
    if (guided.index + 1 < guided.degrees.length) { guided.index++; guidedRound(); }
    else {
      guided.token++; cancelAudition();
      $('guided-question').textContent = 'Sequência concluída!'; $('guided-phase').textContent = 'Você pode repetir a sequência ou encerrar. O último acorde continua no instrumento.';
      $('next-guided').textContent = 'Recomeçar sequência'; guided.index = -1;
    }
  }
  function cycleNotes() { return T.cycle(key(), $('cycle-direction').value); }
  function cycleChord(note) { return T.buildChord(note.pc, $('scale').value === 'Maior' ? 'major' : 'minor', note.name); }
  function showCyclePreview(index = 0) {
    clearPalettes(); const ns = cycleNotes(), type = $('cycle-direction').value === 'fourths' ? 'QUARTAS JUSTAS' : 'QUINTAS JUSTAS';
    $('cycles-help').textContent = `Comece em ${ns[0].name}: ${ns.map(n => n.name).join(' → ')} → ${ns[0].name}. Cada passo sobe uma ${type === 'QUARTAS JUSTAS' ? 'quarta (5 semitons)' : 'quinta (7 semitons)'}. Usamos nomes enarmônicos para simplificar a volta (B = C♭, F♯ = G♭).`;
    showChord(cycleChord(ns[index]), 'CICLO DE ' + type);
    $('chord-palette').classList.add('cycle-palette');
    ns.forEach((n, i) => {
      const b = button(n.name, () => { stopCyclePlayback(); showCyclePreview(i); playChord(cycleChord(n)); });
      b.dataset.cycleStep = i; b.classList.toggle('altered', /[#b]/.test(n.name)); b.setAttribute('aria-pressed', String(i === index)); $('chord-palette').append(b);
    });
  }
  function stopCyclePlayback() { cyclePlayback++; $('stop-cycle').hidden = true; cancelAudition(); }
  async function playFullCycle() {
    stopCyclePlayback(); const token = cyclePlayback, ns = cycleNotes(); $('stop-cycle').hidden = false;
    for (let i = 0; i <= 12 && token === cyclePlayback; i++) {
      showCyclePreview(i % 12); playChord(cycleChord(ns[i % 12]));
      $('cycle-playback-status').textContent = i === 12 ? `Retorno a ${ns[0].name}. Ciclo completo.` : `${i + 1}/12 · ${ns[i].name}`;
      await new Promise(resolve => setTimeout(resolve, 950));
    }
    if (token === cyclePlayback) $('stop-cycle').hidden = true;
  }
  function endCycleExercise(message = '') {
    cycleSession = null; stopCyclePlayback(); $('cycle-exercise').hidden = true; $('cycles-setup').hidden = false;
    document.body.classList.remove('cycling'); $('cycle-view-label').hidden = true;
    $('cycle-direction').disabled = false; $('cycles-panel').removeAttribute('data-result'); lockMain(false);
    $('cycle-playback-status').textContent = message;
  }
  function cycleQuestion() {
    if (!cycleSession) return;
    const s = cycleSession;
    if (s.completed === 12) { endCycleExercise(`Ciclo concluído: ${s.correct}/12 acertos.`); showCyclePreview(); return; }
    s.answered = false; s.choice = null;
    const current = s.notes[s.completed], next = s.notes[(s.completed + 1) % 12]; s.expected = next.pc;
    $('cycle-count').textContent = `Questão ${s.completed + 1}/12 · ${s.correct} acertos`;
    $('cycles-help').textContent = 'Complete a volta pelos 12 tons. Os acordes demonstram cada tom; eles não são os graus de um único campo harmônico.';
    $('cycle-question').textContent = `Depois de ${current.name}, qual é a próxima ${$('cycle-direction').value === 'fourths' ? 'quarta' : 'quinta'} justa?`;
    $('cycle-feedback').replaceChildren(); $('cycle-feedback').className = ''; $('cycles-panel').removeAttribute('data-result');
    $('confirm-cycle').hidden = false; $('confirm-cycle').disabled = true; $('next-cycle-question').hidden = true;
    clearPalettes(); showChord(cycleChord(current), 'TOM DE PARTIDA', current.name);
    $('cycle-answers').replaceChildren();
    const choices = shuffle([next, ...shuffle(s.notes.filter(n => n.pc !== next.pc && n.pc !== current.pc)).slice(0, 3)]);
    for (const note of choices) {
      const b = button(note.name, () => {
        if (s !== cycleSession) return;
        if (!s.answered) { s.choice = note.pc; $('confirm-cycle').disabled = false; }
        $('cycle-answers').querySelectorAll('button').forEach(el => el.setAttribute('aria-pressed', String(el === b)));
        showChord(cycleChord(note), 'EXEMPLO DA SUA ESCOLHA'); playChord(cycleChord(note));
      });
      b.dataset.pc = note.pc; b.setAttribute('aria-pressed', 'false'); b.classList.toggle('altered', /[#b]/.test(note.name)); $('cycle-answers').append(b);
    }
    playChord(cycleChord(current));
  }
  function confirmCycle() {
    const s = cycleSession;
    if (!s || s.answered || s.choice === null) return;
    const from = s.notes[s.completed], to = s.notes[(s.completed + 1) % 12], correct = s.choice === s.expected;
    s.answered = true; s.completed++; stats.attempts++; if (correct) { s.correct++; stats.correct++; }
    if (s.completed === 12) stats.sessions++;
    save(statsKey, stats); updateStats();
    showResult($('cycle-feedback'), $('cycles-panel'), correct, `${from.name} → ${to.name}: ${$('cycle-direction').value === 'fourths' ? 'quarta justa, 5 semitons' : 'quinta justa, 7 semitons'}.`);
    $('confirm-cycle').hidden = true; $('next-cycle-question').hidden = false; $('next-cycle-question').textContent = s.completed === 12 ? 'Ver resultado →' : 'Próxima →';
    $('cycle-answers').querySelectorAll('button').forEach(b => { b.classList.toggle('correct', Number(b.dataset.pc) === s.expected); b.classList.toggle('wrong', !correct && Number(b.dataset.pc) === s.choice); });
    showChord(cycleChord(to), 'RESPOSTA DO CICLO'); playChord(cycleChord(to));
  }
  function setMode(nextMode) {
    endPractice(); stopGuided(); endCycleExercise(); stopAudio(); mode = nextMode;
    ['explore', 'practice', 'guided', 'cycles'].forEach(m => $(m + '-panel').hidden = m !== mode);
    syncPracticeView();
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    $('settings').open = false; if (mode === 'guided') showGuidedPreview(); else if (mode === 'cycles') showCyclePreview(); else showExplore();
  }
  function playScene(instrument) {
    if (session && !session.answered && ['ear', 'build'].includes(session.type)) {
      if (instrument && session.reference !== instrument) { $('reference-instrument').value = instrument; saveSettings(); changeReference(); return; }
      playTarget(); return;
    }
    const instruments = instrument ? [instrument] : auditionInstruments();
    if (scene.kind === 'chord') playChord(scene.chord, instruments);
    else if (scene.kind === 'scale' && scene.scale.length === 7) {
      playArrangement(instruments.map(source => {
        const path = source === 'guitar' ? G.ascendingPath(scene.scale, position()) : [];
        const notes = path.length ? path : [...scene.scale.map(n => ({ midi: 48 + scene.scale[0].pc + n.offset })), { midi: 60 + scene.scale[0].pc }];
        return { instrument: source, notes };
      }), .4, false);
    }
  }
  // Initialization and preferences: accept only existing select options and bounded volume.
  for (const [value, spec] of Object.entries(T.CHORD_TYPES)) {
    for (const id of ['chord-type', 'exercise-chord-type']) { const o = document.createElement('option'); o.value = value; o.textContent = spec.title; $(id).append(o); }
  }
  $('guitar-settings').prepend($('guitar-view-label'), $('position-label'));
  const saved = read(settingsKey);
  if (saved && typeof saved === 'object') for (const id of settingIds) {
    const el = $(id);
    if (el.tagName === 'SELECT' && [...el.options].some(o => o.value === saved[id])) el.value = saved[id];
    if (['volume', 'guitar-volume', 'piano-volume'].includes(id) && Number.isFinite(Number(saved[id]))) el.value = Math.max(0, Math.min(100, Number(saved[id])));
    if (el.type === 'checkbox' && typeof saved[id] === 'boolean') el.checked = saved[id];
  }
  const oldStats = read(statsKey);
  if (oldStats && ['attempts', 'correct', 'sessions'].every(k => Number.isSafeInteger(oldStats[k]) && oldStats[k] >= 0) && oldStats.correct <= oldStats.attempts) stats = oldStats;
  $('volume-value').textContent = $('volume').value + '%'; soundEngine.setVolume(Number($('volume').value) / 100);
  for (const channel of ['guitar', 'piano']) {
    soundEngine.setVolume(Number($(channel + '-volume').value) / 100, channel);
    $(channel + '-volume-value').textContent = $(channel + '-volume').value === '0' ? 'Mudo' : $(channel + '-volume').value + '%';
  }
  if (!saved?.['reference-instrument']) $('reference-instrument').value = $('instrument').value === 'piano' ? 'piano' : 'guitar';
  syncPracticeView();
  document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  document.querySelectorAll('select').forEach(el => el.addEventListener('change', () => {
    if (['practice-view', 'cycle-view'].includes(el.id)) $('instrument').value = el.value;
    if (['instrument', 'practice-view', 'cycle-view'].includes(el.id)) {
      stopAudio(); syncPracticeView();
      if (session?.type === 'build' && $('instrument').value !== 'both') switchAnswerInstrument($('instrument').value);
    }
    if (el.id === 'answer-instrument') { stopAudio(); switchAnswerInstrument(el.value, true); return; }
    if (el.id === 'reference-instrument') { saveSettings(); changeReference(); return; }
    if (settingIds.includes(el.id) || ['practice-view', 'cycle-view'].includes(el.id)) saveSettings();
    if (el.id === 'exercise-type') { exerciseHelp(); return; }
    if (['exercise-chord-type', 'practice-field-format', 'ear-level'].includes(el.id)) return;
    if (['guided-sequence', 'guided-format', 'guided-cycles'].includes(el.id)) { if (!guided) showGuidedPreview(); return; }
    if (!guided) stopAudio();
    if (cycleSession) { draw(); return; }
    if (mode === 'cycles') { stopCyclePlayback(); showCyclePreview(); return; }
    if (session) { if (session.type === 'build') buildHelp(); draw(); return; }
    if (guided) { guidedRound(); return; }
    if (mode === 'guided') showGuidedPreview(); else if (mode === 'cycles') showCyclePreview(); else showExplore();
  }));
  for (const id of ['volume', 'guitar-volume', 'piano-volume']) $(id).addEventListener('input', () => {
    const channel = id === 'volume' ? undefined : id.split('-')[0];
    soundEngine.setVolume(Number($(id).value) / 100, channel);
    $(id + '-value').textContent = $(id).value === '0' ? 'Mudo' : $(id).value + '%'; saveSettings();
  });
  $('feedback-sound').addEventListener('change', saveSettings);
  $('silence').addEventListener('click', () => { if (guided) stopGuided(); stopCyclePlayback(); stopAudio(); });
  $('play-scene').addEventListener('click', () => playScene());
  $('play-guitar').addEventListener('click', () => playScene('guitar'));
  $('play-piano').addEventListener('click', () => playScene('piano'));
  $('start-exercise').addEventListener('click', startPractice);
  $('end-exercise').addEventListener('click', () => endPractice('Treino encerrado. Os acertos já registrados foram mantidos.'));
  $('confirm-answer').addEventListener('click', confirmAnswer);
  $('next-question').addEventListener('click', nextQuestion);
  $('listen-target').addEventListener('click', playTarget);
  $('clear-selection').addEventListener('click', () => { if (!session || session.answered) return; session.selection = []; session.selections[session.instrument] = session.selection; scene.selected = Object.values(session.selections).flat(); draw(); $('confirm-answer').disabled = true; $('live-note').textContent = 'Seleção limpa. Monte novamente.'; });
  $('show-example').addEventListener('click', () => { if (session?.chord) { $('guitar-view').value = 'standard'; showChord(session.chord, 'EXEMPLO DE POSIÇÃO'); playChord(session.chord); } });
  $('start-guided').addEventListener('click', startGuided);
  $('repeat-guided').addEventListener('click', () => { if (guided?.index === -1) guided.index = 0; guidedRound(); });
  $('next-guided').addEventListener('click', advanceGuided);
  $('stop-guided').addEventListener('click', () => { stopGuided(); showGuidedPreview(); });
  $('play-cycle').addEventListener('click', playFullCycle);
  $('stop-cycle').addEventListener('click', () => { stopCyclePlayback(); stopAudio(); });
  $('start-cycle-exercise').addEventListener('click', () => { stopCyclePlayback(); cycleSession = { notes: cycleNotes(), completed: 0, correct: 0 }; document.body.classList.add('cycling'); $('cycle-view-label').hidden = false; syncPracticeView(); $('cycles-setup').hidden = true; $('cycle-exercise').hidden = false; $('cycle-direction').disabled = true; lockMain(true); cycleQuestion(); });
  $('confirm-cycle').addEventListener('click', confirmCycle);
  $('next-cycle-question').addEventListener('click', cycleQuestion);
  $('end-cycle-exercise').addEventListener('click', () => { endCycleExercise('Treino encerrado; respostas registradas foram mantidas.'); stopAudio(); showCyclePreview(); });
  $('reset-stats').addEventListener('click', () => { stats = { attempts: 0, correct: 0, sessions: 0 }; save(statsKey, stats); updateStats(); });
  $('workspace').addEventListener('click', event => {
    const target = event.target.closest('[data-midi]');
    if (!target) return;
    const n = { midi: Number(target.dataset.midi) };
    if (target.dataset.string !== undefined) { n.string = Number(target.dataset.string); n.fret = Number(target.dataset.fret); }
    instrumentClick(n);
  });
  $('workspace').addEventListener('keydown', event => {
    const target = event.target.closest('g[role="button"]');
    if (target && ['Enter', ' '].includes(event.key)) { event.preventDefault(); target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  document.addEventListener('click', event => { if (!$('settings').contains(event.target)) $('settings').open = false; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (guided) stopGuided(); stopCyclePlayback(); stopAudio(); } });
  $('guide-link').addEventListener('click', () => { if (mode !== 'explore') setMode('explore'); $('explore-panel').querySelector('details').open = true; });
  exerciseHelp(); updateStats(); showExplore();
})();
