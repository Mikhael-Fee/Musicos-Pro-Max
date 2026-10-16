const { test, expect } = require('@playwright/test');
const T = require('../assets/theory.js');
const errors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const list = []; errors.set(page, list); page.on('pageerror', e => list.push(e.message));
  await page.goto('/');
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });
async function spyNotes(page) {
  await page.evaluate(() => {
    window.played = [];
    const original = soundEngine.note.bind(soundEngine);
    soundEngine.note = (pitch, instrument, delay = 0, at) => {
      const result = original(pitch, instrument, delay, at);
      const voice = [...soundEngine.voiceChannels.values()].at(-1);
      played.push({ midi: pitch + 48, instrument, at: voice.startedAt });
      return result;
    };
  });
}
async function clearPlayed(page) { await page.evaluate(() => { played = []; }); }
async function chordInQuestion(page, type = 'major') {
  const text = await page.locator('#question').innerText();
  return T.scale(0).map(n => T.buildChord(n.pc, type, n.name)).find(c => text === `Monte ${c.name}.`);
}

test('both instruments play their own displayed voicing; piano inversion and spacing stay local', async ({ page }) => {
  await page.selectOption('#instrument', 'both');
  await page.click('#settings summary'); await page.selectOption('#play-style', 'block'); await page.click('#scene-title'); await spyNotes(page);
  await page.click('#play-scene'); await page.waitForTimeout(50);
  const notes = await page.evaluate(() => played);
  expect(notes.filter(n => n.instrument === 'piano').map(n => n.midi)).toEqual([48, 52, 55]);
  expect(notes.filter(n => n.instrument === 'guitar').map(n => n.midi)).toEqual([48, 52, 55, 60, 64]);
  const chosen = await page.locator('#piano-render .chosen').evaluateAll(els => els.map(el => Number(el.dataset.midi)));
  expect(chosen).toEqual([48, 52, 55]);
  await page.selectOption('#inversion', '1'); await page.selectOption('#piano-layout', 'open');
  await clearPlayed(page); await page.click('#play-piano'); await page.waitForTimeout(50);
  expect(await page.evaluate(() => played.map(n => [n.midi, n.instrument]))).toEqual([[52, 'piano'], [60, 'piano'], [67, 'piano']]);
  expect(await page.locator('#piano-render .chosen').evaluateAll(els => els.map(el => Number(el.dataset.midi)))).toEqual([52, 60, 67]);
  await expect(page.locator('#guitar-render .chosen')).toHaveCount(0);
  await expect(page.locator('.string-recipe')).toHaveText('×32010');
  await expect(page.locator('#piano-register')).toContainText('baixo: E3');
});

test('instrument volumes persist and muted channels really produce silence in the audio graph', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const render = async (instrument, muted, other) => {
      const ctx = new OfflineAudioContext(1, 44100, 44100), engine = new soundEngine.constructor(ctx);
      engine.setVolume(muted ? 0 : 1, instrument); engine.setVolume(other, instrument === 'piano' ? 'guitar' : 'piano');
      engine.note(21, instrument);
      const buffer = await ctx.startRendering(), data = buffer.getChannelData(0);
      return Math.sqrt(data.reduce((a, v) => a + v * v, 0) / data.length);
    };
    return { mutedPiano: await render('piano', true, 1), mutedGuitar: await render('guitar', true, 1), piano: await render('piano', false, 0), guitar: await render('guitar', false, 0) };
  });
  expect(result.mutedPiano).toBe(0); expect(result.mutedGuitar).toBe(0);
  expect(result.piano).toBeGreaterThan(.01); expect(result.guitar).toBeGreaterThan(.001);
  await page.selectOption('#instrument', 'both');
  await page.locator('#guitar-volume').evaluate(el => { el.value = '0'; el.dispatchEvent(new Event('input')); }); await page.locator('#piano-volume').evaluate(el => { el.value = '72'; el.dispatchEvent(new Event('input')); });
  await expect(page.locator('#guitar-volume-value')).toHaveText('Mudo');
  await page.reload(); await expect(page.locator('#guitar-volume')).toHaveValue('0'); await expect(page.locator('#piano-volume')).toHaveValue('72');
  expect(await page.evaluate(() => soundEngine.levels)).toMatchObject({ guitar: 0, piano: .72 });
});

test('piano synthesis has correct pitch, audible upper harmonics and a decaying tail', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const ctx = new OfflineAudioContext(1, 44100 * 3, 44100), engine = new soundEngine.constructor(ctx);
    engine.note(21, 'piano');
    const data = (await ctx.startRendering()).getChannelData(0);
    const spectral = hz => {
      let re = 0, im = 0; const start = 441, count = 4410;
      for (let i = 0; i < count; i++) { const sample = data[start + i] * (.5 - .5 * Math.cos(2 * Math.PI * i / (count - 1))); re += sample * Math.cos(2 * Math.PI * hz * i / 44100); im += sample * Math.sin(2 * Math.PI * hz * i / 44100); }
      return Math.hypot(re, im) / count;
    };
    const rms = (from, to) => Math.sqrt(data.slice(from, to).reduce((s, n) => s + n * n, 0) / (to - from));
    return { fundamental: spectral(440), detuned: Math.max(spectral(415.3), spectral(466.16)), upper: [2, 3, 4, 5, 6, 8].reduce((s, h) => s + spectral(440 * h) ** 2, 0) / spectral(440) ** 2, peak: data.reduce((v, n) => Math.max(v, Math.abs(n)), 0), attack: rms(441, 4410), tail: rms(119070, 123480), finite: data.every(Number.isFinite) };
  });
  expect(result.finite).toBe(true); expect(result.fundamental).toBeGreaterThan(result.detuned * 8);
  expect(result.upper).toBeGreaterThan(.25); expect(result.peak).toBeLessThan(1);
  expect(result.attack).toBeGreaterThan(.02); expect(result.tail).toBeLessThan(result.attack * .1);
});

test('build exercise accepts either visible instrument and keeps its selections when views change', async ({ page }) => {
  await page.selectOption('#instrument', 'both'); await page.click('[data-mode="practice"]');
  await page.selectOption('#exercise-type', 'build'); await page.selectOption('#exercise-chord-type', 'major'); await page.selectOption('#reference-instrument', 'guitar');
  await page.click('#start-exercise'); const chord = await chordInQuestion(page); await spyNotes(page);
  await page.click('#guitar-0-0');
  for (const n of chord.notes) await page.click(`#piano-key-${48 + n.pc}`);
  await expect(page.locator('#answer-instrument')).toHaveValue('piano');
  await expect(page.locator('#piano-render .chosen')).toHaveCount(3);
  await expect(page.locator('#guitar-render .chosen')).toHaveCount(1);
  await page.selectOption('#practice-view', 'guitar'); await expect(page.locator('#answer-instrument')).toHaveValue('guitar');
  await page.selectOption('#practice-view', 'piano'); await expect(page.locator('#piano-render .chosen')).toHaveCount(3);
  await clearPlayed(page); await page.selectOption('#reference-instrument', 'piano');
  expect(await page.evaluate(() => played.every(n => n.instrument === 'piano') && played.length > 0)).toBe(true);
  await expect(page.locator('#piano-render .chosen')).toHaveCount(3);
  await clearPlayed(page); await page.selectOption('#reference-instrument', 'guitar');
  expect(await page.evaluate(() => played.every(n => n.instrument === 'guitar') && played.length > 0)).toBe(true);
  await expect(page.locator('#answer-instrument')).toHaveValue('piano');
  await page.click('#confirm-answer'); await expect(page.locator('#feedback')).toContainText('Acertou!');
});

test('find note names the scale clearly, hides accidental hints, and gives distinct results with optional sound', async ({ page }) => {
  await page.selectOption('#instrument', 'piano'); await page.selectOption('#key', '6'); await page.click('[data-mode="practice"]');
  await page.click('#start-exercise');
  await expect(page.locator('#scene-category')).toHaveText('ESCALA DE REFERÊNCIA'); await expect(page.locator('#scene-title')).toHaveText('Escala de F# maior');
  await expect(page.locator('#piano-render .altered')).toHaveCount(0);
  const text = await page.locator('#question').innerText();
  const n = T.scale(6).find(note => text.includes(`(${note.name})`));
  await page.click(`#piano-key-${48 + n.pc}`);
  await expect(page.locator('#feedback')).toHaveClass('result-success'); await expect(page.locator('#practice-panel')).toHaveAttribute('data-result', 'success');
  expect(await page.evaluate(() => [...soundEngine.voiceChannels.values()].some(v => v.channel === 'feedback'))).toBe(true);
  await page.click('#next-question');
  await page.locator('#settings summary').click(); await page.uncheck('#feedback-sound'); await page.click('#question');
  const nextText = await page.locator('#question').innerText(), next = T.scale(6).find(note => nextText.includes(`(${note.name})`));
  const wrong = T.mod(next.pc + 1); await page.click(`#piano-key-${48 + wrong}`);
  await expect(page.locator('#feedback')).toHaveClass('result-error');
  await expect(page.locator('#feedback strong')).toHaveText('✕ Vamos revisar.');
  expect(await page.evaluate(() => [...soundEngine.voiceChannels.values()].some(v => v.channel === 'feedback' && !v.released))).toBe(false);
});

test('accidental spelling is highlighted, including E sharp on a white piano key', async ({ page }) => {
  await page.selectOption('#instrument', 'both'); await page.selectOption('#key', '6'); await page.selectOption('#explore-topic', 'scale');
  await expect(page.locator('#note-palette button.altered')).toHaveCount(6);
  await expect(page.locator('#piano-key-53')).toHaveClass(/white.*altered/); await expect(page.locator('#piano-key-53')).toContainText('E♯');
  expect(await page.locator('#guitar-render .altered.active,#guitar-render .altered.root').count()).toBeGreaterThan(5);
  await page.selectOption('#key', '1'); await expect(page.locator('#note-palette button.altered')).toHaveCount(5);
});

for (const everyBeat of [false, true]) test(`guided chords share the metronome clock, every beat=${everyBeat}`, async ({ page }) => {
  await page.selectOption('#instrument', 'piano'); await page.click('[data-mode="guided"]'); await page.fill('#bpm', '120');
  await page.locator('#guided-every-beat').setChecked(everyBeat); await spyNotes(page);
  await page.evaluate(() => {
    window.clicks = []; const original = soundEngine.tick.bind(soundEngine);
    soundEngine.tick = (accent, delay, at) => { const result = original(accent, delay, at); clicks.push({ accent, at: [...soundEngine.voiceChannels.values()].at(-1).startedAt }); return result; };
  });
  await page.click('#start-guided'); await expect.poll(() => page.evaluate(() => clicks.length)).toBe(4);
  const schedule = await page.evaluate(() => ({ clicks, played }));
  expect(schedule.played).toHaveLength(everyBeat ? 12 : 3);
  expect(schedule.clicks.map(c => c.accent)).toEqual([true, false, false, false]);
  for (let beat = 0; beat < 4; beat++) {
    expect(Math.abs(schedule.clicks[beat].at - schedule.clicks[0].at - beat * .5)).toBeLessThan(.006);
    if (beat === 0 || everyBeat) for (const note of schedule.played.slice((everyBeat ? beat : 0) * 3, (everyBeat ? beat + 1 : 1) * 3)) expect(Math.abs(note.at - schedule.clicks[beat].at)).toBeLessThan(.006);
  }
});

test('repeating a chord preserves sounding voices and lets them finish naturally', async ({ page }) => {
  await page.selectOption('#instrument', 'piano'); await page.click('#settings summary'); await page.selectOption('#play-style', 'block'); await page.click('#scene-title'); await page.click('#play-scene');
  await page.waitForTimeout(180);
  await page.evaluate(() => {
    window.oldVoices = [...soundEngine.voices]; window.forcedStops = 0;
    oldVoices.forEach(source => { const original = source.stop.bind(source); source.stop = (...args) => { forcedStops++; return original(...args); }; });
  });
  await page.click('#play-scene');
  const result = await page.evaluate(() => ({ forcedStops, stillPlaying: oldVoices.every(v => soundEngine.voices.has(v)), count: soundEngine.voices.size, old: oldVoices.length }));
  expect(result.forcedStops).toBe(0); expect(result.stillPlaying).toBe(true); expect(result.count).toBeGreaterThan(result.old);
  await expect.poll(() => page.evaluate(() => soundEngine.voices.size), { timeout: 4500 }).toBe(0);
});

for (const direction of ['fourths', 'fifths']) test(`${direction} tab previews a transposed full circle and grades twelve exercises exactly once`, async ({ page }) => {
  await page.selectOption('#key', '2'); await page.click('[data-mode="cycles"]'); await page.selectOption('#cycle-direction', direction);
  const notes = T.cycle(2, direction);
  await expect(page.locator('[data-cycle-step]')).toHaveCount(12);
  await expect(page.locator('[data-cycle-step]')).toHaveText(notes.map(n => n.name));
  await page.selectOption('#cycle-reference', 'both'); await spyNotes(page); await page.locator('[data-cycle-step="2"]').click();
  expect(await page.evaluate(() => [...new Set(played.map(n => n.instrument))].sort())).toEqual(['guitar', 'piano']);
  await page.click('#start-cycle-exercise');
  await expect(page.locator('#cycles-help')).not.toContainText(notes.map(n => n.name).join(' → '));
  for (let i = 0; i < 12; i++) {
    const answer = page.locator(`#cycle-answers [data-pc="${notes[(i + 1) % 12].pc}"]`);
    await answer.click(); await expect(page.locator('#cycle-feedback')).toBeEmpty();
    await page.click('#confirm-cycle'); await expect(page.locator('#cycle-feedback')).toHaveClass('result-success');
    // Previewing after confirmation must not count a second answer.
    await answer.click(); await expect(page.locator('#cycle-stats')).toContainText(`${i + 1}/${i + 1} acertos`);
    await page.click('#next-cycle-question');
  }
  await expect(page.locator('#cycle-playback-status')).toHaveText('Ciclo concluído: 12/12 acertos.');
  await expect(page.locator('#cycle-stats')).toContainText('1 treinos completos'); await expect(page.locator('#key')).toBeEnabled();
});

test('full cycle playback completes its return and cancels when leaving the tab', async ({ page }) => {
  await page.click('[data-mode="cycles"]'); await page.clock.install();
  await page.click('#play-cycle'); await expect(page.locator('#cycle-playback-status')).toContainText('1/12');
  await page.clock.runFor(12 * 950); await expect(page.locator('#cycle-playback-status')).toHaveText('Retorno a C. Ciclo completo.');
  await page.clock.runFor(950); await expect(page.locator('#stop-cycle')).toBeHidden();
  await page.click('#play-cycle'); await page.click('[data-mode="explore"]'); await page.clock.runFor(3000);
  await expect(page.locator('#scene-category')).toHaveText('CAMPO HARMÔNICO');
});

test('mobile cycle exercise keeps the question, view switch and piano together', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.click('[data-mode="cycles"]'); await page.click('#start-cycle-exercise');
  await page.selectOption('#cycle-view', 'piano'); await expect(page.locator('#piano-panel')).toBeVisible();
  await expect(page.locator('#cycle-question')).toContainText('Depois de C');
  await page.locator('#cycle-answers button').first().click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const keyboard = await page.locator('#piano-render').boundingBox(); expect(keyboard.y + keyboard.height).toBeLessThanOrEqual(844);
  await page.selectOption('#cycle-view', 'both'); await expect(page.locator('#guitar-panel')).toBeVisible();
  await page.click('#end-cycle-exercise'); await expect(page.locator('#instrument')).toBeVisible(); await expect(page.locator('#instrument')).toHaveValue('both');
});

test('cycle C to F uses the nearest inversion in sound and both diagrams, then restores manual controls', async ({ page }) => {
  await page.selectOption('#instrument', 'both'); await page.selectOption('#guitar-view', 'all');
  await page.click('[data-mode="cycles"]'); await page.selectOption('#cycle-reference', 'both'); await spyNotes(page);
  await page.click('[data-cycle-step="1"]');
  const played = await page.evaluate(() => window.played);
  for (const instrument of ['piano', 'guitar']) expect(played.filter(n => n.instrument === instrument).map(n => n.midi)).toEqual([48, 53, 57]);
  expect(await page.locator('#piano-render .active,#piano-render .root').evaluateAll(els => els.map(el => Number(el.dataset.midi)))).toEqual([48, 53, 57]);
  await expect(page.locator('#piano-key-48')).toHaveClass(/voice-held/);
  await expect(page.locator('#piano-render .voice-moved')).toHaveCount(2);
  await expect(page.locator('#piano-motion')).toContainText('F/C · 2ª inversão');
  await expect(page.locator('#piano-motion')).toContainText('Mantenha C3');
  await expect(page.locator('.string-recipe')).toHaveText('×332××');
  await expect(page.locator('#guitar-motion')).toContainText('4ª corda: 2 → 3');
  await expect(page.locator('#inversion')).toBeHidden();
  await clearPlayed(page); await page.click('#note-palette [data-pc="0"]');
  expect(await page.evaluate(() => window.played.map(n => n.midi))).toEqual([48, 48]);
  await page.click('[data-mode="explore"]'); await expect(page.locator('#inversion')).toBeVisible();
  await expect(page.locator('#guitar-view')).toHaveValue('all'); await expect(page.locator('#piano-motion')).toBeHidden();
});

test('cycle answer previews always lead from the question chord and continue from the confirmed position', async ({ page }) => {
  await page.selectOption('#instrument', 'piano'); await page.click('[data-mode="cycles"]'); await page.selectOption('#cycle-reference', 'piano');
  await page.click('#start-cycle-exercise'); await page.locator('#cycle-answers button:not([data-pc="5"])').first().click();
  await page.click('#cycle-answers [data-pc="5"]');
  expect(await page.locator('#piano-render .active,#piano-render .root').evaluateAll(els => els.map(el => Number(el.dataset.midi)))).toEqual([48, 53, 57]);
  await page.click('#confirm-cycle'); await page.click('#next-cycle-question'); await page.click('#cycle-answers [data-pc="10"]');
  expect(await page.locator('#piano-render .active,#piano-render .root').evaluateAll(els => els.map(el => Number(el.dataset.midi)))).toEqual([50, 53, 58]);
  await expect(page.locator('#piano-motion')).toContainText('B♭/D · 1ª inversão');
  await page.selectOption('#piano-layout', 'open');
  const before = await page.locator('#piano-render .active,#piano-render .root').evaluateAll(els => els.map(el => Number(el.dataset.midi)));
  expect(before.at(-1) - before[0]).toBeGreaterThan(12);
  await page.click('#confirm-cycle');
  expect(await page.locator('#piano-render .active,#piano-render .root').evaluateAll(els => els.map(el => Number(el.dataset.midi)))).toEqual(before);
});

test('cycle fifths retains G in C to G/B and playback preserves minimal movement through the return', async ({ page }) => {
  await page.selectOption('#instrument', 'piano'); await page.click('[data-mode="cycles"]'); await page.selectOption('#cycle-direction', 'fifths'); await page.selectOption('#cycle-reference', 'piano');
  await page.click('[data-cycle-step="1"]');
  expect(await page.locator('#piano-render .active,#piano-render .root').evaluateAll(els => els.map(el => Number(el.dataset.midi)))).toEqual([47, 50, 55]);
  await expect(page.locator('#piano-key-55')).toHaveClass(/voice-held/); await expect(page.locator('#piano-motion')).toContainText('G/B · 1ª inversão');
  await spyNotes(page); await page.clock.install(); await page.click('#play-cycle'); await page.clock.runFor(12 * 950);
  const chords = await page.evaluate(() => { const groups = []; for (let i = 0; i < played.length; i += 3) groups.push(played.slice(i, i + 3).map(n => n.midi)); return groups; });
  expect(chords).toHaveLength(13);
  for (let i = 1; i < chords.length; i++) expect(T.motionScore(chords[i - 1], chords[i])).toEqual([2, 3, 2]);
  await expect(page.locator('#cycle-playback-status')).toHaveText('Retorno a C. Ciclo completo.');
});

test('result sounds have four distinct rising/falling notes, more presence and their own volume control', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const render = async (correct, volume) => {
      const ctx = new OfflineAudioContext(1, 44100, 44100), engine = new soundEngine.constructor(ctx);
      engine.setVolume(volume, 'feedback'); const duration = engine.feedback(correct);
      const groups = new Map();
      for (const [source, v] of engine.voiceChannels) if (!groups.has(v.group)) groups.set(v.group, source.frequency.value);
      const data = (await ctx.startRendering()).getChannelData(0);
      return { notes: [...groups.values()], duration, rms: Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length), peak: data.reduce((s, v) => Math.max(s, Math.abs(v)), 0), tail: Math.max(...data.slice(35000)) };
    };
    return { right: await render(true, .85), wrong: await render(false, .85), quiet: await render(true, .2), muted: await render(true, 0) };
  });
  expect(result.right.notes).toHaveLength(4); expect(result.wrong.notes).toHaveLength(4);
  expect(result.right.notes.every((n, i, notes) => !i || n > notes[i - 1])).toBe(true);
  expect(result.wrong.notes.every((n, i, notes) => !i || n < notes[i - 1])).toBe(true);
  expect(result.right.rms).toBeGreaterThan(.025); expect(result.wrong.rms).toBeGreaterThan(.025);
  expect(result.right.rms).toBeGreaterThan(result.quiet.rms * 2); expect(result.muted.rms).toBe(0);
  expect(result.right.peak).toBeLessThan(1); expect(result.wrong.peak).toBeLessThan(1); expect(result.right.tail).toBe(0);
  await page.click('#settings summary'); await expect(page.locator('#feedback-volume')).toHaveValue('85');
  await page.click('#preview-success'); expect(await page.evaluate(() => [...soundEngine.voiceChannels.values()].filter(v => v.channel === 'feedback').length)).toBeGreaterThanOrEqual(9);
  await page.locator('#feedback-volume').evaluate(el => { el.value = '100'; el.dispatchEvent(new Event('input')); });
  await page.click('#preview-error'); await expect(page.locator('#feedback-volume-value')).toHaveText('100%');
  await page.reload(); expect(await page.evaluate(() => soundEngine.levels.feedback)).toBe(1);
});

test('alterations and extensions have solid, distinct fills on note choices, piano keys and guitar dots', async ({ page }) => {
  await page.selectOption('#instrument', 'both'); await page.selectOption('#explore-topic', 'chord'); await page.selectOption('#chord-type', '13');
  const palette = page.locator('#note-palette [data-pc="10"]');
  await expect(palette).toHaveClass(/extension/); await expect(palette).toHaveClass(/altered/);
  const pink = await palette.evaluate(el => getComputedStyle(el).backgroundColor);
  const rootColor = await page.locator('#piano-key-48').evaluate(el => getComputedStyle(el).backgroundColor);
  expect(pink).toBe('rgb(247, 162, 222)'); expect(rootColor).not.toBe(pink);
  for (const midi of [50, 53, 57, 58]) {
    expect(await page.locator('#piano-key-' + midi).evaluate(el => getComputedStyle(el).backgroundColor)).toBe(pink);
    await expect(page.locator('#piano-key-' + midi + ' .tone-badge')).toBeVisible();
  }
  const guitarPink = await page.locator('.chord-diagram .extension .note-circle').evaluateAll(els => els.map(el => getComputedStyle(el).fill));
  expect(guitarPink.length).toBeGreaterThan(0); expect(guitarPink.every(color => color === pink)).toBe(true);
  await page.click('#piano-key-58');
  expect(await page.locator('#piano-key-58').evaluate(el => getComputedStyle(el).backgroundColor)).toBe(pink);
  expect(await page.locator('#piano-key-58').evaluate(el => getComputedStyle(el).boxShadow)).toContain('rgb(255, 209, 140)');
  await page.selectOption('#key', '2'); await page.selectOption('#chord-type', 'major');
  expect(await page.locator('#piano-key-54').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(104, 206, 255)');
  const guitarBlue = await page.locator('.chord-diagram .altered .note-circle').evaluateAll(els => els.map(el => getComputedStyle(el).fill));
  expect(guitarBlue.every(color => color === 'rgb(104, 206, 255)')).toBe(true); expect(guitarBlue.length).toBeGreaterThan(0);
  await page.setViewportSize({width:360,height:844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('mobile open cycle voicing scrolls the keyboard to keep all three voices visible', async ({ page }) => {
  await page.setViewportSize({width:390,height:844}); await page.selectOption('#instrument', 'piano');
  await page.click('[data-mode="cycles"]'); await page.selectOption('#cycle-direction', 'fifths'); await page.selectOption('#piano-layout', 'open');
  await page.click('[data-cycle-step="1"]'); await expect(page.locator('#piano-motion')).toContainText('G/B');
  const visible = await page.locator('.piano-scroll').evaluate(el => {
    const frame = el.getBoundingClientRect();
    return [...el.querySelectorAll('.active,.root')].every(key => { const r = key.getBoundingClientRect(); return r.left >= frame.left - 1 && r.right <= frame.right + 1; });
  });
  expect(visible).toBe(true);
});
