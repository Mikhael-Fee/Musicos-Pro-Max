const { test, expect } = require('@playwright/test');
const T = require('../assets/theory.js'), G = require('../assets/guitar.js');
const errors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const list = []; errors.set(page, list); page.on('pageerror', e => list.push(e.message));
  await page.goto('/');
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });
async function mode(page, name) { await page.click(`[data-mode="${name}"]`); }
async function openExercise(page, type) { await mode(page, 'practice'); await page.selectOption('#exercise-type', type); await page.click('#start-exercise'); }
async function targetNote(page) {
  const text = await page.locator('#question').innerText();
  return T.scale(0).find(n => text.includes(`(${n.name})`));
}

test('default guitar uses conventional C fingering and settings stay collapsed', async ({ page }) => {
  await expect(page.locator('#instrument')).toHaveValue('guitar');
  await expect(page.locator('.string-recipe')).toHaveText('×32010');
  await expect(page.locator('.chord-diagram')).toBeVisible();
  await expect(page.locator('#settings')).not.toHaveAttribute('open');
  await page.click('#chord-palette [data-degree="6"]');
  await expect(page.locator('#scene-title')).toHaveText('Am');
  await expect(page.locator('.string-recipe')).toHaveText('×02210');
  expect(await page.evaluate(() => soundEngine.context.state)).toBe('running');
});

test('guitar scale appears in a short position, sounds and supports movable and complete maps', async ({ page }) => {
  await page.selectOption('#explore-topic', 'scale');
  await expect(page.locator('.fret-cell button')).toHaveCount(30);
  expect(await page.locator('.fret-cell button.active,.fret-cell button.root').count()).toBeGreaterThan(12);
  await page.click('#play-scene'); await page.waitForTimeout(450);
  expect(await page.locator('.fret-cell button.chosen').count()).toBeGreaterThan(0);
  await page.selectOption('#scale-position', 'root6');
  await expect(page.locator('#guitar-description')).toContainText('8–12');
  await page.selectOption('#guitar-view', 'all');
  await expect(page.locator('.fret-cell button')).toHaveCount(78);
});

test('clicking a named note sounds it and keeps its exact instrument position marked', async ({ page }) => {
  await page.locator('#note-palette button[data-pc="4"]').click();
  await expect(page.locator('#live-note')).toContainText('Mi');
  await expect(page.locator('.chord-diagram .chosen')).toHaveCount(1);
  expect(await page.evaluate(() => soundEngine.voices.size)).toBeGreaterThan(0);
  await page.selectOption('#explore-topic', 'scale');
  await page.locator('#guitar-5-0').click();
  await expect(page.locator('#guitar-5-0')).toHaveClass(/chosen/);
  await expect(page.locator('#live-note')).toContainText('1ª corda, solta');
});

test('extended chords show formula, audible notes and honest guitar omissions', async ({ page }) => {
  await page.selectOption('#explore-topic', 'chord'); await page.selectOption('#chord-type', '13');
  await expect(page.locator('#scene-title')).toHaveText('C13');
  await expect(page.locator('#note-palette button')).toHaveCount(7);
  await expect(page.locator('#guitar-description')).toContainText('Omitidas');
  await page.selectOption('#guitar-view', 'compact');
  expect(await page.locator('.chord-diagram [data-midi]').count()).toBeLessThanOrEqual(4);
  // Even a formula note omitted by the guitar voicing gets a visible position when clicked.
  await page.locator('#note-palette [data-pc="7"]').click();
  expect(await page.locator('#guitar-render .chosen').count()).toBeGreaterThan(0);
});

test('note exercise remains usable by keyboard and preserves existing local statistics', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('musicospromax.stats.v1', JSON.stringify({ attempts: 3, correct: 2, sessions: 0 })));
  await page.reload(); await openExercise(page, 'notes');
  const n = await targetNote(page);
  const cell = await page.locator('.fret-cell button').evaluateAll((els, pc) => els.find(el => Number(el.dataset.midi) % 12 === pc).id, n.pc);
  await page.locator('#' + cell).focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#feedback')).toContainText('Acertou!');
  await expect(page.locator('#' + cell)).toHaveClass(/chosen/);
  await expect(page.locator('#practice-stats')).toContainText('3/4 acertos');
  await page.click('#end-exercise'); await page.reload(); await mode(page, 'practice');
  await expect(page.locator('#practice-stats')).toContainText('3/4 acertos');
});

test('interval choices play and mark a comparison without grading until confirmation', async ({ page }) => {
  await openExercise(page, 'ear');
  await expect(page.locator('#question-help')).toContainText('Referência fixa: Dó');
  await expect(page.locator('#answers button')).toHaveCount(4);
  const candidate = page.locator('#answers button').first(); await candidate.click();
  await expect(candidate).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#scene-category')).toHaveText('EXEMPLO DA SUA ESCOLHA');
  await page.waitForTimeout(900);
  await expect(page.locator('#guitar-render .chosen')).toHaveCount(2);
  await expect(page.locator('#session-progress')).toHaveJSProperty('value', 0);
  expect(await page.evaluate(() => soundEngine.voices.size)).toBeGreaterThan(0);
  await page.click('#confirm-answer');
  await expect(page.locator('#feedback')).toContainText('semitons');
  await expect(page.locator('#session-progress')).toHaveJSProperty('value', 1);
});

test('degree and field options sound and show the selected example before confirmation', async ({ page }) => {
  await openExercise(page, 'degrees'); await page.locator('#answers button').first().click();
  await expect(page.locator('#live-note')).not.toBeEmpty();
  await expect(page.locator('#session-progress')).toHaveJSProperty('value', 0);
  await page.click('#confirm-answer'); await expect(page.locator('#feedback')).toContainText('grau');
  await page.click('#end-exercise'); await page.selectOption('#exercise-type', 'field'); await page.click('#start-exercise');
  await page.locator('#answers button').first().click();
  await expect(page.locator('#scene-category')).toHaveText('EXEMPLO DA SUA ESCOLHA');
  await expect(page.locator('.chord-diagram')).toBeVisible();
});

for (const type of ['major', '7', '9', '11', '13', 'sus2', 'sus4', '6']) test(`build ${type} chord on guitar: one fret per string and correct required tones`, async ({ page }) => {
  await mode(page, 'practice'); await page.selectOption('#exercise-type', 'build'); await page.selectOption('#exercise-chord-type', type); await page.click('#start-exercise');
  const title = await page.locator('#question').innerText();
  const chord = T.scale(0).map(n => T.buildChord(n.pc, type, n.name)).find(c => title === `Monte ${c.name}.`);
  const shape = G.voicing(chord);
  await page.selectOption('#guitar-view', 'all');
  // Replacing a fret on one string must not select two notes on that same string.
  const string = shape.frets.findIndex(f => f !== null), fret = shape.frets[string];
  await page.click(`#guitar-${string}-${fret === 0 ? 1 : 0}`);
  await page.click(`#guitar-${string}-${fret}`);
  await expect(page.locator(`#guitar-render [data-string="${string}"].chosen`)).toHaveCount(1);
  for (let s = 0; s < 6; s++) if (shape.frets[s] !== null && s !== string) await page.click(`#guitar-${s}-${shape.frets[s]}`);
  await page.click('#confirm-answer'); await expect(page.locator('#feedback')).toContainText('Acertou!');
  await page.click('#show-example'); await expect(page.locator('#scene-title')).toHaveText(chord.name);
});

test('keyboard chord exercise validates all notes, including the full thirteenth formula', async ({ page }) => {
  await page.selectOption('#instrument', 'piano'); await mode(page, 'practice'); await page.selectOption('#exercise-type', 'build'); await page.selectOption('#exercise-chord-type', '13'); await page.click('#start-exercise');
  const title = await page.locator('#question').innerText();
  const chord = T.scale(0).map(n => T.buildChord(n.pc, '13', n.name)).find(c => title === `Monte ${c.name}.`);
  for (const note of chord.notes) { const el = page.locator(`#piano-key-${48 + note.pc}`); await el.focus(); await page.keyboard.press('Enter'); }
  await page.click('#confirm-answer'); await expect(page.locator('#feedback')).toContainText('Acertou!');
});

test('gospel progression is previewed, transposed and visible/audible immediately in guided practice', async ({ page }) => {
  await mode(page, 'guided');
  await expect(page.locator('#scene-description')).toContainText('F → G → Am → Em');
  await page.selectOption('#key', '2');
  await expect(page.locator('#scene-description')).toContainText('G → A → Bm → F#m');
  await page.selectOption('#guided-format', 'seventh');
  await expect(page.locator('#scene-description')).toContainText('G7M → A7 → Bm7 → F#m7');
  await page.selectOption('#guided-cycles', '2'); await page.click('#start-guided');
  await expect(page.locator('#guided-question')).toHaveText('Toque G7M');
  await expect(page.locator('#scene-title')).toHaveText('G7M');
  await expect(page.locator('#guided-count')).toHaveText('1 de 8');
  expect(await page.evaluate(() => soundEngine.voices.size)).toBeGreaterThan(0);
  await page.click('#next-guided'); await expect(page.locator('#scene-title')).toHaveText('A7');
  await page.click('#stop-guided');
  await expect(page.locator('#key')).toBeEnabled();
  await page.waitForTimeout(1700); await expect(page.locator('#guided-session')).toBeHidden();
});

test('guided mode counts four beats then waits for the learner in manual mode', async ({ page }) => {
  await mode(page, 'guided'); await page.fill('#bpm', '160'); await page.click('#start-guided');
  await expect(page.locator('#guided-phase')).toContainText('Sua vez', { timeout: 4000 });
  expect(await page.locator('#beats i.active').count()).toBeGreaterThan(0);
  await expect(page.locator('#guided-phase')).toContainText('avance quando estiver pronto', { timeout: 4000 });
  await expect(page.locator('#guided-count')).toHaveText('1 de 4');
});

test('a full session records exactly ten answers and one completion', async ({ page }) => {
  await openExercise(page, 'notes');
  for (let i = 0; i < 10; i++) {
    const n = await targetNote(page);
    const cell = await page.locator('.fret-cell button').evaluateAll((els, pc) => els.find(el => Number(el.dataset.midi) % 12 === pc).id, n.pc);
    await page.click('#' + cell); await expect(page.locator('#feedback')).toContainText('Acertou!'); await page.click('#next-question');
  }
  await expect(page.locator('#exercise-help')).toContainText('10 de 10 acertos');
  await expect(page.locator('#practice-stats')).toContainText('1 treinos completos');
});

for (const [width, height] of [[390, 844], [1366, 900]]) test(`chord buttons, sound control and diagram are together at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height }); await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.click('#chord-palette [data-degree="4"]');
  await expect(page.locator('#scene-title')).toHaveText('F');
  const rects = await page.evaluate(() => Object.fromEntries(['chord-palette', 'play-scene', 'guitar-render'].map(id => { const r = document.getElementById(id).getBoundingClientRect(); return [id, { top: r.top, bottom: r.bottom }]; })));
  expect(rects['chord-palette'].top).toBeGreaterThanOrEqual(0);
  expect(rects['guitar-render'].bottom).toBeLessThanOrEqual(height);
  expect(rects['play-scene'].top).toBeGreaterThanOrEqual(0);
  await page.screenshot({ path: `/tmp/musicospromax-v2-${width}.png`, fullPage: true });
});

test('automatic guided progression advances and can still be interrupted', async ({ page }) => {
  await mode(page, 'guided'); await page.fill('#bpm', '160'); await page.check('#guided-auto'); await page.click('#start-guided');
  await expect(page.locator('#guided-count')).toHaveText('2 de 4', { timeout: 6000 });
  await page.click('#stop-guided'); await expect(page.locator('#key')).toBeEnabled();
  await expect(page.locator('#scene-description')).toContainText('F → G → Am → Em');
});

test('both instruments remain near chord selection on a desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 }); await page.selectOption('#instrument', 'both');
  await expect(page.locator('#guitar-panel')).toBeVisible(); await expect(page.locator('#piano-panel')).toBeVisible();
  const a = await page.locator('#piano-render').boundingBox(), b = await page.locator('.chord-diagram').boundingBox();
  expect(Math.abs(a.y - b.y)).toBeLessThan(80);
  expect(a.y + a.height).toBeLessThan(900); expect(b.y + b.height).toBeLessThan(900);
});

test('mobile interval comparison keeps the chosen notes visible without a full-neck scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await openExercise(page, 'ear');
  await page.locator('#answers button').first().click(); await page.waitForTimeout(950);
  await expect(page.locator('#guitar-view')).toHaveValue('standard');
  await expect(page.locator('#guitar-render .chosen')).toHaveCount(2);
  const board = await page.locator('#guitar-render').boundingBox();
  expect(board.y + board.height).toBeLessThanOrEqual(844);
  await page.screenshot({ path: '/tmp/musicospromax-v2-ear-mobile.png', fullPage: true });
});

test('all diagram notes stay within the four displayed frets after transposition', async ({ page }) => {
  await page.selectOption('#explore-topic', 'chord');
  const invalid = await page.evaluate(() => {
    const results = [];
    for (let root = 0; root < 12; root++) for (const type of Object.keys(MusicTheory.CHORD_TYPES)) {
      const k = document.getElementById('key'), t = document.getElementById('chord-type');
      k.value = String(root); t.value = type; t.dispatchEvent(new Event('change'));
      document.querySelectorAll('.note-circle').forEach(circle => {
        const cy = Number(circle.getAttribute('cy'));
        if (cy < 20 || cy > 180) results.push([root, type, cy]);
      });
    }
    return results;
  });
  expect(invalid).toEqual([]);
});
