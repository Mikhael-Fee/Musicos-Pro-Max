(function (root) {
  'use strict';
  const T = MusicTheory, G = GuitarTheory;
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  const pcName = pc => T.tonics.Maior[T.mod(pc)];
  function noteName(pc, scene) { return scene.chord?.notes.find(n => n.pc === pc)?.name || scene.scale?.find(n => n.pc === pc)?.name || pcName(pc); }
  function label(pc, scene, type) {
    const note = scene.chord?.notes.find(n => n.pc === pc) || scene.scale?.find(n => n.pc === pc);
    return type === 'degrees' ? (note?.role || note?.degree || '·') : T.label(note?.name || pcName(pc), type);
  }
  function sourceOf(n) { return n.instrument || (n.string === undefined ? 'piano' : 'guitar'); }
  function chosen(scene, midi, string, fret) {
    const instrument = string === undefined ? 'piano' : 'guitar';
    return scene.selected?.some(n => sourceOf(n) === instrument && (instrument === 'piano' ? n.midi === midi : n.string === string && n.fret === fret));
  }
  function classes(scene, pc, midi, string, fret, active) {
    const rootPc = scene.chord?.root ?? scene.scale?.[0].pc;
    return `${!scene.hideLabels && /[#b]/.test(noteName(pc, scene)) ? 'altered' : ''} ${active ? (pc === rootPc ? 'root' : 'active') : ''} ${chosen(scene, midi, string, fret) ? 'chosen' : ''}`;
  }
  function renderPiano(scene, options) {
    const pitches = scene.kind === 'chord' ? T.pianoVoicing(scene.chord, options.inversion, options.pianoLayout) : scene.pitchesByInstrument?.piano || [];
    const selected = scene.selected?.filter(n => sourceOf(n) === 'piano').map(n => n.midi) || [];
    const lo = Math.min(48, ...pitches, ...selected), hi = Math.max(71, ...pitches, ...selected);
    const start = Math.floor(lo / 12) * 12, end = Math.floor(hi / 12) * 12 + 11;
    const whiteCount = Array.from({ length: end - start + 1 }, (_, i) => i + start).filter(m => ![1, 3, 6, 8, 10].includes(m % 12)).length;
    let whiteIndex = 0, html = '';
    for (let midi = start; midi <= end; midi++) {
      const pc = midi % 12, black = [1, 3, 6, 8, 10].includes(pc);
      const active = scene.kind === 'scale' ? scene.scale.some(n => n.pc === pc) : pitches.includes(midi);
      const text = scene.hideLabels ? '' : label(pc, scene, options.labels);
      const accessible = scene.hideLabels ? `Tecla ${midi - start + 1}` : `${T.label(noteName(pc, scene), 'solfege')}, oitava ${Math.floor(midi / 12) - 1}`;
      const style = black ? `width:${64 / whiteCount}%;left:${(whiteIndex - .32) * 100 / whiteCount}%` : `width:${100 / whiteCount}%`;
      html += `<button type="button" id="piano-key-${midi}" class="${black ? 'black' : 'white'} ${classes(scene, pc, midi, undefined, undefined, active)}" style="${style}" data-midi="${midi}" aria-label="${escape(accessible)}" aria-pressed="${!!chosen(scene, midi)}"><span>${escape(text)}</span></button>`;
      if (!black) whiteIndex++;
    }
    $('piano-render').style.setProperty('--piano-min', `${Math.max(320, whiteCount * 24)}px`);
    $('piano-render').innerHTML = html;
    $('piano-register').textContent = `C${start / 12 - 1}–B${Math.floor(end / 12) - 1}${scene.kind === 'chord' ? ' · baixo: ' + label(pitches[0] % 12, scene, 'letters') + (Math.floor(pitches[0] / 12) - 1) : ' · toque para ouvir'}`;
  }
  function renderDiagram(scene, options) {
    const v = G.voicing(scene.chord, options.guitarView === 'compact');
    if (!v) {
      $('guitar-render').innerHTML = '<p class="no-shape">Sem posição confortável de até quatro casas para esta combinação. Use o mapa completo para explorar as notas.</p>';
      $('guitar-description').textContent = 'Nenhuma digitação incompleta é apresentada como acorde completo.'; return;
    }
    const used = v.frets.filter(f => f > 0), first = Math.max(...used) > 4 ? Math.min(...used) : 1;
    let svg = '<svg viewBox="0 0 220 235" class="chord-diagram" role="group" aria-label="Diagrama do acorde, corda 6 à esquerda e corda 1 à direita">';
    for (let f = 0; f <= 4; f++) svg += `<line x1="38" y1="${46 + f * 34}" x2="188" y2="${46 + f * 34}" class="${f === 0 && first === 1 ? 'nut' : ''}"/>`;
    for (let f = 0; f < 4; f++) svg += `<text x="19" y="${68 + f * 34}">${first + f}</text>`;
    if (v.fingers) for (let finger = 1; finger <= 4; finger++) {
      const strings = v.fingers.flatMap((f, s) => f === finger ? [s] : []);
      if (strings.length >= 2 && strings.every(s => v.frets[s] === v.frets[strings[0]])) {
        const y = 46 + (v.frets[strings[0]] - first + .5) * 34;
        svg += `<line class="barre" x1="${38 + strings[0] * 30}" x2="${38 + strings.at(-1) * 30}" y1="${y}" y2="${y}"/>`;
      }
    }
    for (let s = 0; s < 6; s++) {
      const x = 38 + s * 30, fret = v.frets[s];
      svg += `<line x1="${x}" y1="46" x2="${x}" y2="182"/><text x="${x}" y="226">${6 - s}ª</text>`;
      if (fret === null) { svg += `<text x="${x}" y="29">×</text><text x="${x}" y="205">–</text>`; continue; }
      const midi = G.TUNING[s] + fret, pc = midi % 12, y = fret === 0 ? 24 : 46 + (fret - first + .5) * 34;
      const text = label(pc, scene, options.labels);
      svg += `<g id="chord-string-${s}" role="button" tabindex="0" data-midi="${midi}" data-string="${s}" data-fret="${fret}" aria-label="Corda ${6 - s}, ${fret === 0 ? 'solta' : 'casa ' + fret}, ${escape(T.label(noteName(pc, scene), 'solfege'))}" class="${classes(scene, pc, midi, s, fret, true)}"><circle class="note-circle${fret === 0 ? ' open-note' : ''}" cx="${x}" cy="${y}" r="11"/><text class="dot-label" x="${x}" y="${y + 3.5}">${fret === 0 ? '○' : escape(text)}</text></g><text x="${x}" y="205">${escape(text)}</text>`;
    }
    svg += '</svg>';
    const omitted = v.omitted.length ? `Omitidas nesta posição: ${v.omitted.map(n => `${n.role} (${n.name})`).join(', ')}. A fórmula completa está acima.` : 'Todas as notas da fórmula estão nesta posição.';
    $('guitar-render').innerHTML = `<div class="diagram-layout">${svg}<div class="voicing-info"><strong>${escape(v.source)}</strong><p>6ª → 1ª corda</p><div class="string-recipe">${v.frets.map(f => `<span>${f === null ? '×' : f}</span>`).join('')}</div><p>○ solta · × não tocar<br>Os números à esquerda são as casas.</p>${v.fingers ? `<p class="fingers">Dedos: ${v.fingers.map(f => f === null ? '×' : f === 0 ? '○' : f).join(' · ')}<br>1 indicador · 2 médio<br>3 anelar · 4 mínimo</p>` : '<p>Toque nos pontos para ouvir.</p>'}</div></div>`;
    $('guitar-description').textContent = omitted;
  }
  function renderFretboard(scene, options) {
    const position = Number(options.position), all = options.guitarView === 'all';
    const start = all ? 0 : position, end = all ? Math.max(12, ...(scene.selected || []).filter(n => sourceOf(n) === 'guitar').map(n => n.fret || 0)) : position + 4;
    const frets = end - start + 1, allowed = scene.kind === 'custom' ? [] : scene.chord?.notes || scene.scale || [];
    const path = scene.kind === 'scale' && options.guitarView === 'compact' ? G.ascendingPath(scene.scale, position) : null;
    let html = `<div class="guitar-scroll"><div class="fretboard" style="--frets:${frets};--board-min:${28 + frets * (all ? 43 : 45)}px">`;
    for (let s = 5; s >= 0; s--) {
      html += `<span class="string-name">${6 - s}ª ${['E', 'A', 'D', 'G', 'B', 'e'][s]}</span>`;
      for (let fret = start; fret <= end; fret++) {
        const midi = G.TUNING[s] + fret, pc = midi % 12;
        const active = !scene.hideLabels && (path ? path.some(n => n.string === s && n.fret === fret) : allowed.some(n => n.pc === pc)) || scene.pitchesByInstrument?.guitar?.includes(midi);
        const text = scene.hideLabels ? '' : label(pc, scene, options.labels);
        html += `<span class="fret-cell${fret === 0 ? ' nut' : ''}"><button type="button" id="guitar-${s}-${fret}" data-midi="${midi}" data-string="${s}" data-fret="${fret}" class="${classes(scene, pc, midi, s, fret, active)}" aria-label="Corda ${6 - s}, casa ${fret}${scene.hideLabels ? '' : ', ' + escape(T.label(noteName(pc, scene), 'solfege'))}" aria-pressed="${!!chosen(scene, midi, s, fret)}">${escape(text)}</button></span>`;
      }
    }
    html += '<span></span>';
    for (let fret = start; fret <= end; fret++) html += `<span class="fret-number${[3, 5, 7, 9, 12].includes(fret) ? ' marker' : ''}">${fret}</span>`;
    html += '</div></div>';
    $('guitar-render').innerHTML = html;
    $('guitar-description').textContent = scene.hideLabels ? 'Escolha as casas no braço. Uma posição por corda; nas escalas, a corda 1 fica no topo, como na tablatura.' : `${all ? 'Mapa completo · casas 0–12' : `Posição de estudo · casas ${start}–${end}`} · 1ª corda (mais fina) no topo. ${scene.kind === 'scale' ? 'Lilás: tônica. Toque as notas em ordem com “Ouvir escala”.' : scene.pitches?.length === 2 ? 'As duas notas do exemplo estão em amarelo.' : scene.kind === 'custom' ? 'Toque para selecionar e ouvir. Para montar acordes, use uma casa por corda.' : 'Explore as notas para escolher uma posição do acorde.'}`;
  }
  function render(scene, options) {
    const focusedId = document.activeElement?.id;
    const scroll = document.querySelector('.guitar-scroll')?.scrollLeft || 0;
    const pianoScroll = document.querySelector('.piano-scroll').scrollLeft;
    $('instrument-pair').classList.toggle('both', options.instrument === 'both');
    $('guitar-panel').hidden = options.instrument === 'piano';
    $('piano-panel').hidden = options.instrument === 'guitar';
    $('guitar-view-label').hidden = options.instrument === 'piano' || scene.hideLabels;
    $('position-label').hidden = options.instrument === 'piano' || (scene.kind === 'chord' && !scene.forceBoard && options.guitarView !== 'all');
    if (scene.kind === 'chord' && !scene.forceBoard && options.guitarView !== 'all') renderDiagram(scene, options);
    else renderFretboard(scene, options);
    renderPiano(scene, options);
    $('play-guitar').disabled = $('play-scene').disabled; $('play-piano').disabled = $('play-scene').disabled;
    if (document.querySelector('.guitar-scroll')) document.querySelector('.guitar-scroll').scrollLeft = scroll;
    document.querySelector('.piano-scroll').scrollLeft = pianoScroll;
    if (focusedId && /^(piano-key-|guitar-|chord-string-)/.test(focusedId)) $(focusedId)?.focus({ preventScroll: true });
  }
  root.InstrumentUI = { render, label };
})(window);
