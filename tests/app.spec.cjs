const { test, expect } = require('@playwright/test');
test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('explorer initializes both instruments, changes scale spelling and plays audio', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await expect(page.locator('#piano-render [role=button]')).toHaveCount(24);
  await expect(page.locator('.guitar-note')).toHaveCount(78);
  await page.selectOption('#tomFixo', 'F#/Gb');
  await page.selectOption('#map-mode', 'scale');
  await expect(page.locator('#selection-summary')).toContainText('E#');
  await expect(page.locator('#key-5')).toHaveClass(/active/);
  await page.selectOption('#note-labels', 'solfege');
  await expect(page.locator('#key-5 span')).toHaveText('Mi♯');
  await page.click('#play-scale');
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => soundEngine.context.state)).toBe('running');
  expect(await page.evaluate(() => soundEngine.voices.size)).toBeGreaterThan(0);
  await page.fill('#volume', '0');
  await page.locator('#volume').dispatchEvent('input');
  expect(await page.evaluate(() => soundEngine.volume)).toBe(0);
  await page.click('#silence');
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => soundEngine.voices.size)).toBe(0);
  expect(errors).toEqual([]);
});

test('all key/mode/inversion combinations generate playable notes and correct spelled chords', async ({ page }) => {
  const result = await page.evaluate(() => {
    const problems = [];
    for (const key of CONSTANTES.NOTAS) for (const mode of ['Maior', 'Menor']) for (const seventh of [false, true]) for (let inv = 0; inv < (seventh ? 4 : 3); inv++) {
      const field = gerarCampoHarmonico(key, mode, inv, seventh, 'diatonica');
      for (let d = 1; d <= 7; d++) {
        const chord = field[d];
        if (chord.indicesHitbox.some(n => !Number.isFinite(n) || n < 0 || n > 23)) problems.push(`${key}/${mode}/${d}/${inv}:range`);
        const expected = MusicTheory.chord(CONSTANTES.NOTAS.indexOf(key), mode, d, seventh);
        if (chord.visualCifra !== expected.name) problems.push(`${chord.visualCifra} != ${expected.name}`);
        acenderTeclado(chord.indicesHitbox, chord.rootHitbox, chord.seventhHitbox);
        for (const view of ['shape', 'mini', 'aoe']) {
          document.getElementById('modoViolao').value = view;
          const pitches = acenderViolao(chord.indicesHitbox, chord.rootHitbox, chord.seventhHitbox, chord.qCifra);
          if (pitches.some(n => !expected.notes.some(x => x.pc === MusicTheory.mod(n)))) problems.push(`${expected.name}/${view}: guitar note outside chord`);
        }
        limparHighlights();
      }
    }
    return problems;
  });
  expect(result).toEqual([]);
});

test('note location checks the instrument answer and persists progress', async ({ page }) => {
  await page.click('#start-exercise');
  await expect(page.locator('body')).toHaveClass(/locating/);
  const note = (await page.locator('#question').innerText()).match(/\(([^)]+)\)/)[1];
  const pitch = await page.evaluate(n => MusicTheory.scale(CONSTANTES.NOTAS.indexOf(document.getElementById('tomFixo').value), document.getElementById('escalaFixa').value).find(x => x.name === n).pc, note);
  await page.locator('#key-' + pitch).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#feedback')).toContainText('Acertou!');
  await expect(page.locator('body')).not.toHaveClass(/locating/);
  await page.click('#end-exercise');
  await expect(page.locator('#instVisual')).toHaveValue('ambos');
  await page.reload();
  await expect(page.locator('#practice-stats')).toContainText('1 respostas · 1 acertos');
});

test('guitar location, wrong answers, keyboard access and blocked frets', async ({ page }) => {
  await page.selectOption('#exercise-instrument', 'guitar');
  await page.selectOption('#capotraste', '3');
  await page.click('#start-exercise');
  await page.locator('#g-note-0-0').dispatchEvent('click');
  await expect(page.locator('#session-progress')).toHaveAttribute('value', '0');
  const target = (await page.locator('#question').innerText()).match(/\(([^)]+)\)/)[1];
  const wrong = await page.evaluate(n => {
    const pc = MusicTheory.scale(2).find(x => x.name === n).pc;
    return [...document.querySelectorAll('.guitar-note')].find(el => Number(el.id.split('-')[3]) >= 3 && Number(el.dataset.nota) !== pc).id;
  }, target);
  await page.locator('#' + wrong).focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#feedback')).toContainText('Vamos revisar');
  await page.click('#next-question');
  await expect(page.locator('#session-label')).toContainText('Questão 2');
});

test('ten chord questions complete exactly once and stats can be cleared', async ({ page }) => {
  await page.selectOption('#exercise-type', 'chords');
  await page.selectOption('#formatoAcorde', 'tetrade');
  await page.click('#start-exercise');
  for (let i = 0; i < 10; i++) {
    const degree = (await page.locator('#question').innerText()).match(/(\d)º/)[1];
    await page.click(`#answers [data-answer="${degree}"]`);
    await expect(page.locator('#feedback')).toContainText('Acertou!');
    await page.click('#next-question');
  }
  await expect(page.locator('#question')).toContainText('10 de 10');
  await expect(page.locator('#practice-stats')).toContainText('1 treinos completos');
  await page.click('#reset-stats');
  await expect(page.locator('#practice-stats')).toContainText('0 respostas');
});

test('degree and ear exercises show correction and offer a replay', async ({ page }) => {
  await page.selectOption('#exercise-type', 'degrees'); await page.click('#start-exercise');
  await page.locator('#answers button').first().click();
  await expect(page.locator('#feedback')).toContainText('grau');
  await page.click('#end-exercise');
  await page.selectOption('#exercise-type', 'ear'); await page.click('#start-exercise');
  await expect(page.locator('#answers button')).toHaveCount(4);
  await page.click('#listen'); await page.locator('#answers button').first().click();
  await expect(page.locator('#feedback')).toContainText('semitons');
  await page.click('#end-exercise');
});

test('guided training starts and cancels without leaving controls locked', async ({ page }) => {
  await page.click('#tab-btn-rank'); await page.click('#btnStart');
  await expect(page.locator('#stop-guided')).toBeVisible();
  await expect(page.locator('#tomFixo')).toBeDisabled();
  await page.click('#stop-guided');
  await expect(page.locator('#tomFixo')).toBeEnabled();
  await expect(page.locator('#btnStart')).toBeEnabled();
  await page.waitForTimeout(900);
  await expect(page.locator('#selection-summary')).not.toContainText('Rodada');
});

test('mobile layout has no page overflow; instruments scroll internally', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#trainer').scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/tmp/musicospromax-mobile.png', fullPage: true });
});

 test('free study schedules an arpeggio and silence cancels pending notes', async ({ page }) => {
  await page.selectOption('#modoReproducao', 'arpejo');
  await page.click('#btn-grau-5');
  await expect(page.locator('#selection-summary')).toContainText('Grau 5');
  await page.click('#silence');
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => soundEngine.voices.size)).toBe(0);
});
