(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const T = MusicTheory;
  const SETTINGS_KEY = 'musicospromax.settings.v1';
  const STATS_KEY = 'musicospromax.stats.v1';
  const settingIds = ['tomFixo', 'escalaFixa', 'formatoAcorde', 'tipoSetima', 'instVisual', 'modoReproducao', 'somTick', 'ditarNotas', 'inversaoTeclado', 'modoViolao', 'capotraste', 'inverterCordas', 'note-labels', 'exercise-type', 'exercise-instrument'];
  let stats = { attempts: 0, correct: 0, sessions: 0 };
  let session = null;
  let scaleRun = 0;
  let guidedRun = 0;
  let selectedDegree = 1;
  function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; } }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* Private mode or storage full: keep practicing in memory. */ } }
  function config() {
    return { root: CONSTANTES.NOTAS.indexOf($('tomFixo').value), mode: $('escalaFixa').value };
  }
  function notes() { const c = config(); return T.scale(c.root, c.mode); }
  function name(pc) {
    return notes().find(n => n.pc === T.mod(pc))?.name || ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'][T.mod(pc)];
  }
  function label(pc) {
    const degree = notes().find(n => n.pc === T.mod(pc))?.degree;
    return $('note-labels').value === 'degrees' ? (degree ? String(degree) : '·') : T.label(name(pc), $('note-labels').value);
  }
  function decorate() {
    document.querySelectorAll('#piano-render [id^="key-"]').forEach(el => {
      const pitch = Number(el.id.slice(4));
      el.querySelector('span').textContent = label(pitch);
      el.setAttribute('role', 'button'); el.tabIndex = 0;
      const octave = Math.floor((pitch + 48) / 12) - 1;
      el.setAttribute('aria-label', `${T.label(name(pitch), 'solfege')}, oitava ${octave}`);
      el.title = `${name(pitch)}${octave}`;
    });
    document.querySelectorAll('.guitar-note').forEach(el => {
      const [, , s, f] = el.id.split('-');
      const pc = Number(el.dataset.nota);
      el.textContent = label(pc); el.setAttribute('role', 'button'); el.tabIndex = 0;
      el.setAttribute('aria-label', `${T.label(name(pc), 'solfege')}, corda ${Number(s) + 1}, casa ${f}`);
      el.title = `${name(pc)} · corda ${Number(s) + 1}, casa ${f}`;
    });
    // In note-location exercises, accessible labels must not reveal the answer either.
    if (session?.type === 'notes' && !session.answered) {
      document.querySelectorAll('#piano-render [role="button"]').forEach(el => {
        el.setAttribute('aria-label', `Tecla ${Number(el.id.slice(4)) + 1}`); el.removeAttribute('title');
      });
      document.querySelectorAll('.guitar-note').forEach(el => {
        const [, , s, f] = el.id.split('-');
        el.setAttribute('aria-label', `Corda ${Number(s) + 1}, casa ${f}`); el.removeAttribute('title');
      });
    }
  }
  function summary(text) { $('selection-summary').textContent = text; }
  function drawScale() {
    limparHighlights();
    const ns = notes(); const pcs = ns.map(n => n.pc);
    for (let i = 0; i < 24; i++) {
      if (pcs.includes(i % 12)) $('key-' + i).classList.add(i % 12 === ns[0].pc ? 'root-active' : 'active');
    }
    document.querySelectorAll('.guitar-note').forEach(el => {
      if (Number(el.id.split('-')[3]) < Number($('capotraste').value)) return;
      if (pcs.includes(Number(el.dataset.nota))) el.classList.add(Number(el.dataset.nota) === ns[0].pc ? 'root-active' : 'active');
    });
    summary(`${ns[0].name} ${config().mode.toLowerCase()} · ${ns.map(n => n.name).join(' · ')}  |  Lilás: tônica · Verde: outras notas`);
    decorate();
  }
  function drawChord() {
    const c = config();
    const field = gerarCampoHarmonico($('tomFixo').value, c.mode, Number($('inversaoTeclado').value), $('formatoAcorde').value === 'tetrade', $('tipoSetima').value === 'ambas' ? 'diatonica' : $('tipoSetima').value);
    const chord = field[selectedDegree];
    limparHighlights();
    acenderTeclado(chord.indicesHitbox, chord.rootHitbox, chord.seventhHitbox);
    acenderViolao(chord.indicesHitbox, chord.rootHitbox, chord.seventhHitbox, chord.qCifra);
    summary(`Grau ${selectedDegree} · ${chord.visualCifra} · ${chord.notasFinais}  |  Lilás: tônica · Dourado: sétima`);
    document.querySelectorAll('.free-roam-btn').forEach((el, i) => el.classList.toggle('selected', i + 1 === selectedDegree));
    decorate();
  }
  function redraw() { if ($('map-mode').value === 'scale') drawScale(); else drawChord(); }
  function updateStats() {
    const rate = stats.attempts ? Math.round(stats.correct / stats.attempts * 100) : 0;
    $('practice-stats').textContent = `${stats.attempts} respostas · ${stats.correct} acertos · ${rate}% de precisão · ${stats.sessions} treinos completos`;
  }
  function stopAudio() {
    scaleRun++; soundEngine.stop();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
  function endExercise(message = 'Treino encerrado. Você pode começar outro quando quiser.') {
    if (!session) return;
    const previousVisual = session.previousVisual;
    session = null; document.body.classList.remove('locating');
    if (previousVisual) { $('instVisual').value = previousVisual; atualizarInterface(); }
    $('exercise-type').disabled = false; $('exercise-instrument').disabled = false;
    $('end-exercise').hidden = true; $('next-question').hidden = true; $('listen').hidden = true;
    $('start-exercise').hidden = false; $('answers').replaceChildren();
    $('question').textContent = message; $('feedback').textContent = '';
    stopAudio(); redraw();
  }
  function help() {
    const texts = {
      notes: 'Encontre uma nota da escala no instrumento. Os nomes ficam ocultos até você responder.',
      degrees: 'Reconheça a nota de cada grau da escala selecionada à esquerda.',
      chords: 'Associe o grau ao acorde diatônico. Usa tríades ou tétrades conforme sua configuração.',
      ear: 'Ouça duas notas ascendentes e identifique a distância entre elas. A tonalidade varia a cada questão.'
    };
    $('exercise-help').textContent = texts[$('exercise-type').value];
  }
  function pick(array) { return array[Math.floor(Math.random() * array.length)]; }
  function shuffled(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  }
  function playQuestion() {
    if (!session || session.type !== 'ear') return;
    stopAudio();
    try {
      hackearAudioMobile();
      soundEngine.note(session.base, session.instrument);
      soundEngine.note(session.base + session.interval, session.instrument, 0.7);
      $('listen').textContent = 'Ouvir de novo';
    } catch (_) { $('feedback').textContent = 'Não foi possível ativar o áudio. Toque em “Ouvir de novo” ou use outro navegador.'; }
  }
  function question() {
    if (!session) return;
    document.body.classList.remove('locating');
    session.answered = false;
    $('feedback').textContent = ''; $('answers').replaceChildren();
    $('next-question').hidden = true; $('listen').hidden = session.type !== 'ear';
    $('session-label').textContent = `Questão ${session.completed + 1} de 10 · ${session.correct} acertos`;
    $('session-progress').value = session.completed;
    limparHighlights();
    let choices = [];
    const ns = notes(); const c = config();
    if (session.type === 'notes' || session.type === 'degrees') {
      const pool = ns.filter(n => n.degree !== session.lastDegree);
      const n = pick(pool); session.lastDegree = n.degree; session.expected = n.pc; session.note = n;
      if (session.type === 'notes') {
        document.body.classList.add('locating');
        $('instVisual').value = session.instrument === 'piano' ? 'teclado' : 'violao'; atualizarInterface();
        $('question').textContent = `Onde está ${T.label(n.name, 'solfege')} (${n.name})?`;
        $('feedback').textContent = `Toque em qualquer ${n.name} no ${session.instrument === 'piano' ? 'teclado' : 'braço do violão'} abaixo. Pode ser em qualquer oitava.`;
      } else {
        $('question').textContent = `Qual é a nota do ${n.degree}º grau de ${ns[0].name} ${c.mode.toLowerCase()}?`;
        choices = ns.map(x => ({ text: T.label(x.name, 'letters'), value: x.pc }));
      }
    } else if (session.type === 'chords') {
      const degree = pick([1, 2, 3, 4, 5, 6, 7].filter(d => d !== session.lastDegree));
      session.lastDegree = degree; session.degree = degree;
      session.expected = degree;
      $('question').textContent = `Qual acorde é o ${degree}º grau de ${ns[0].name} ${c.mode.toLowerCase()}?`;
      choices = Array.from({ length: 7 }, (_, i) => ({ text: T.chord(c.root, c.mode, i + 1, $('formatoAcorde').value === 'tetrade').name, value: i + 1 }));
    } else {
      const intervals = [2, 3, 4, 5, 7, 9, 12];
      session.interval = pick(intervals.filter(i => i !== session.interval));
      session.base = pick([0, 2, 4, 5, 7, 9]); session.expected = session.interval;
      $('question').textContent = 'Qual intervalo você ouviu?';
      choices = shuffled([session.interval, ...shuffled(intervals.filter(i => i !== session.interval)).slice(0, 3)]).map(i => ({ text: T.INTERVALS[i], value: i }));
      playQuestion();
    }
    for (const choice of choices) {
      const button = document.createElement('button'); button.textContent = choice.text;
      button.dataset.answer = choice.value;
      button.addEventListener('click', () => answer(choice.value, button));
      $('answers').append(button);
    }
    decorate();
  }
  function answer(value, button) {
    if (!session || session.answered) return;
    session.answered = true; session.completed++;
    const correct = value === session.expected;
    if (correct) { session.correct++; stats.correct++; }
    stats.attempts++;
    document.body.classList.remove('locating');
    let explanation;
    if (session.type === 'chords') {
      const c = config(); const chord = T.chord(c.root, c.mode, session.degree, $('formatoAcorde').value === 'tetrade');
      explanation = `${session.degree}º grau: ${chord.name} = ${chord.notes.map(n => n.name).join(' · ')}.`;
      selectedDegree = session.degree; $('map-mode').value = 'chord';
      // Forced sevenths are an exploration option, exercises always teach the diatonic field.
      $('tipoSetima').value = 'diatonica'; drawChord();
    } else if (session.type === 'ear') {
      explanation = `${T.INTERVALS[session.interval]}: ${session.interval} semitons entre as notas.`;
      const pitches = [session.base, session.base + session.interval];
      acenderTeclado(pitches, session.base, null);
      renderizarAoE(T.mod(session.base), null, [T.mod(session.base + session.interval)], Number($('capotraste').value));
    } else {
      explanation = `${session.note.degree}º grau: ${T.label(session.note.name, 'solfege')} (${session.note.name}).`;
      for (let i = 0; i < 24; i++) if (i % 12 === session.expected) $('key-' + i).classList.add('root-active');
      renderizarAoE(session.expected, null, [], Number($('capotraste').value));
    }
    $('feedback').textContent = `${correct ? 'Acertou!' : 'Quase! Vamos revisar.'} ${explanation}`;
    $('answers').querySelectorAll('button').forEach(el => {
      el.disabled = true;
      if (Number(el.dataset.answer) === session.expected) el.classList.add('correct');
    });
    if (button && !correct) button.classList.add('incorrect');
    $('session-progress').value = session.completed;
    $('session-label').textContent = `${session.completed} de 10 respondidas · ${session.correct} acertos`;
    $('next-question').hidden = false;
    $('next-question').textContent = session.completed === 10 ? 'Ver resultado →' : 'Próxima questão →';
    if (session.completed === 10) stats.sessions++;
    save(STATS_KEY, stats); updateStats(); decorate();
  }
  function startExercise() {
    stopGuided(); stopAudio();
    session = { type: $('exercise-type').value, instrument: $('exercise-instrument').value, previousVisual: $('instVisual').value, completed: 0, correct: 0, answered: false };
    $('exercise-type').disabled = true; $('exercise-instrument').disabled = true;
    $('start-exercise').hidden = true; $('end-exercise').hidden = false;
    question();
  }
  function stopGuided() {
    guidedRun++;
    if (!ESTADO.rodando) return;
    ESTADO.rodando = false; travarUI(false);
    $('stop-guided').hidden = true; $('beat-progress').style.width = '0%';
    document.querySelectorAll('.hud-padding select,.hud-padding input').forEach(el => el.disabled = false);
    stopAudio();
  }
  // A cancellable guided session replaces the original loop that could not be stopped.
  window.iniciarTreino = async function () {
    if (ESTADO.rodando) return;
    endExercise(); stopAudio();
    hackearAudioMobile();
    const run = ++guidedRun;
    ESTADO.rodando = true; travarUI(true); $('stop-guided').hidden = false;
    document.querySelectorAll('.hud-padding select,.hud-padding input').forEach(el => el.disabled = true);
    const count = Math.max(1, Math.min(100, Number($('sessoes').value) || 14));
    const bpm = Math.max(40, Math.min(200, Number($('bpm').value) || 80));
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const active = () => run === guidedRun && ESTADO.rodando;
    const bag = new SacoDeGraus();
    const rng = $('modoRng').value;
    const fixedKey = $('tomFixo').value, fixedMode = $('escalaFixa').value;
    const focused = Array.from(document.querySelectorAll('[name="tomFocado"]:checked')).map(el => el.value);
    if (!focused.length) focused.push(fixedKey);
    try {
      for (let i = 0; i < count && active(); i++) {
        let key = fixedKey, mode = fixedMode;
        if (rng === 'focado') key = $('ordemFocado').value === 'sequencial' ? focused[i % focused.length] : pick(focused);
        else if (rng !== 'desligado') { key = pick(CONSTANTES.NOTAS); mode = rng === 'maior' ? 'Maior' : rng === 'menor' ? 'Menor' : pick(['Maior', 'Menor']); }
        const degree = bag.puxarGrau();
        const chord = gerarCampoHarmonico(key, mode, Number($('inversaoTeclado').value), $('formatoAcorde').value === 'tetrade', $('tipoSetima').value)[degree];
        limparHighlights();
        summary(`Rodada ${i + 1}/${count} · ${key} ${mode.toLowerCase()} · Prepare o grau ${degree}`);
        printLog(`Rodada ${i + 1}: ${key} ${mode}, grau ${degree}.`);
        if ($('ditarNotas').value === 'sim') await falar(`Grau ${degree}. ${key} ${mode}`);
        if (!active()) break;
        for (let beat = 0; beat < 4 && active(); beat++) {
          $('beat-progress').style.width = `${(beat + 1) * 25}%`;
          await bipar(beat === 0 ? 'forte' : 'fraco');
          await wait(60000 / bpm);
        }
        if (!active()) break;
        acenderTeclado(chord.indicesHitbox, chord.rootHitbox, chord.seventhHitbox);
        const guitar = acenderViolao(chord.indicesHitbox, chord.rootHitbox, chord.seventhHitbox, chord.qCifra);
        summary(`Grau ${degree} · ${chord.visualCifra} · ${chord.notasFinais}`);
        const instrument = $('instVisual').value === 'violao' ? 'guitar' : 'piano';
        const pitches = instrument === 'guitar' && guitar.length ? guitar : chord.indicesHitbox;
        [...pitches].sort((a, b) => a - b).forEach((p, n) => soundEngine.note(p, instrument, $('modoReproducao').value === 'arpejo' ? n * .08 : 0));
        printLog(`Resposta: ${chord.visualCifra} · ${chord.notasFinais}`);
        if ($('ditarNotas').value === 'sim') await falar(chord.notasFinais);
        await wait(1800);
      }
      if (active()) printLog('Treino guiado concluído.');
    } catch (error) { printLog('Não foi possível continuar o treino. Confira o áudio e tente novamente.'); console.error(error); }
    finally { if (run === guidedRun) { stopGuided(); redraw(); } }
  };
  window.dispararGrauLivre = async function (degree, silent = false) {
    if (session) endExercise();
    stopAudio(); selectedDegree = degree; ESTADO.ultimoGrauLivre = degree;
    $('map-mode').value = 'chord'; drawChord();
    const chord = gerarCampoHarmonico($('tomFixo').value, config().mode, Number($('inversaoTeclado').value), $('formatoAcorde').value === 'tetrade', $('tipoSetima').value === 'ambas' ? 'diatonica' : $('tipoSetima').value)[degree];
    if (silent) return;
    printLog(`Grau ${degree}: ${chord.visualCifra} · ${chord.notasFinais}`);
    const instrument = $('instVisual').value === 'violao' ? 'guitar' : 'piano';
    const guitar = instrument === 'guitar' ? acenderViolao(chord.indicesHitbox, chord.rootHitbox, chord.seventhHitbox, chord.qCifra) : [];
    const pitches = guitar.length ? guitar : chord.indicesHitbox;
    try {
      hackearAudioMobile();
      [...pitches].sort((a, b) => a - b).forEach((pitch, index) => soundEngine.note(pitch, instrument, $('modoReproducao').value === 'arpejo' ? index * 0.08 : 0));
    } catch (_) { $('audio-status').textContent = 'Não foi possível ativar o áudio.'; }
    if ($('ditarNotas').value === 'sim') await falar(`${chord.audio}. Notas: ${chord.notasFinais}`, 1.2);
  };
  window.addEventListener('load', () => {
    // Labels in the supplied file are visual only; link them to their controls.
    document.querySelectorAll('select,input[type="number"]').forEach(el => {
      const labelEl = el.previousElementSibling;
      if (labelEl?.tagName === 'LABEL') labelEl.htmlFor = el.id;
    });
    const saved = read(SETTINGS_KEY);
    if (saved && typeof saved === 'object') for (const id of settingIds) {
      const el = $(id);
      if (Array.from(el.options).some(o => o.value === saved[id]) && saved[id] !== 'ambas') el.value = saved[id];
    }
    const storedStats = read(STATS_KEY);
    if (storedStats && ['attempts', 'correct', 'sessions'].every(k => Number.isSafeInteger(storedStats[k]) && storedStats[k] >= 0) && storedStats.correct <= storedStats.attempts) stats = storedStats;
    const audioBox = document.createElement('div'); audioBox.className = 'audio-controls';
    audioBox.innerHTML = '<label for="volume">Volume das notas e do metrônomo <output id="volume-value">55%</output></label><input id="volume" type="range" min="0" max="100" value="55"><div class="actions"><span id="audio-status">Áudio ativado ao tocar</span><button id="silence">Silenciar agora</button></div>';
    $('ditarNotas').closest('.config-group').append(audioBox);
    const stop = document.createElement('button'); stop.id = 'stop-guided'; stop.hidden = true; stop.textContent = 'Parar treino guiado'; stop.style.marginTop = '10px';
    $('btnStart').after(stop); stop.addEventListener('click', () => { stopGuided(); redraw(); });
    $('volume').addEventListener('input', () => { soundEngine.setVolume($('volume').value / 100); $('volume-value').textContent = $('volume').value + '%'; });
    $('silence').addEventListener('click', () => { stopGuided(); stopAudio(); });
    $('start-exercise').addEventListener('click', startExercise);
    $('end-exercise').addEventListener('click', () => endExercise());
    $('listen').addEventListener('click', playQuestion);
    $('next-question').addEventListener('click', () => {
      if (!session) return;
      if (session.completed === 10) {
        const message = `Treino concluído: ${session.correct} de 10 acertos. ${session.correct >= 8 ? 'Ótimo! Experimente outra tonalidade.' : 'Revise as notas e tente mais uma vez.'}`;
        endExercise(message); $('start-exercise').textContent = 'Treinar novamente';
      } else { stopAudio(); question(); }
    });
    $('exercise-type').addEventListener('change', help);
    $('reset-stats').addEventListener('click', () => { stats = { attempts: 0, correct: 0, sessions: 0 }; save(STATS_KEY, stats); updateStats(); });
    $('map-mode').addEventListener('change', () => { endExercise(); stopGuided(); redraw(); });
    $('note-labels').addEventListener('change', decorate);
    $('play-scale').addEventListener('click', async () => {
      endExercise(); stopGuided(); stopAudio();
      const run = ++scaleRun; $('map-mode').value = 'scale'; drawScale();
      const ns = notes(); const pitches = [...ns.map(n => ns[0].pc + n.offset), ns[0].pc + 12];
      try {
        for (const pitch of pitches) {
          if (run !== scaleRun) break;
          const el = $('key-' + pitch);
          flashElemento(el, 'piano'); soundEngine.note(pitch, $('instVisual').value === 'violao' ? 'guitar' : 'piano');
          await new Promise(resolve => setTimeout(resolve, 350));
        }
      } catch (_) { $('audio-status').textContent = 'Não foi possível ativar o áudio neste navegador.'; }
    });
    document.querySelectorAll('select').forEach(el => el.addEventListener('change', () => {
      if (settingIds.includes(el.id)) save(SETTINGS_KEY, Object.fromEntries(settingIds.map(id => [id, $(id).value])));
      if (['exercise-type', 'exercise-instrument', 'note-labels', 'map-mode'].includes(el.id)) return;
      if (session) endExercise('Configuração alterada. Comece um novo treino nesta tonalidade.');
      if (ESTADO.rodando) return;
      atualizarInterface(); atualizarCapotraste(); atualizarBotoesLivres(); redraw();
    }));
    document.addEventListener('click', event => {
      const el = event.target.closest('#piano-render [role="button"],.guitar-note');
      if (!el || !session || session.type !== 'notes' || session.answered) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const isPiano = el.id.startsWith('key-');
      if ((isPiano ? 'piano' : 'guitar') !== session.instrument || el.closest('.blocked')) return;
      const pitch = isPiano ? Number(el.id.slice(4)) : CONSTANTES.ABS_TUNING[Number(el.id.split('-')[2])] + Number(el.id.split('-')[3]);
      try { soundEngine.note(pitch, session.instrument); } catch (_) {}
      flashElemento(el, isPiano ? 'piano' : 'guitar'); answer(T.mod(pitch));
    }, true);
    document.addEventListener('keydown', event => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      const el = event.target.closest('#piano-render [role="button"],.guitar-note');
      if (!el) return; event.preventDefault(); el.click();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { stopGuided(); stopAudio(); } });
    renderizarFretboard(); atualizarInterface(); atualizarBotoesLivres(); redraw(); help(); updateStats();
  });
})();
