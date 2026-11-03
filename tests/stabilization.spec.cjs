const {test,expect}=require('@playwright/test');
const B=require('../assets/bass.js'),T=require('../assets/theory.js');
test.beforeEach(async({page})=>{await page.goto('/');});
async function start(page){await page.selectOption('#home-instrument','bass');await page.evaluate(()=>Platform.openUnit('triads'));for(let i=0;i<2;i++)await page.locator('#lesson-examples .lesson-demo').nth(i).click();await page.locator('#lesson-examples [data-start-lesson]').click();}
async function next(page){await page.locator('#learn-unit-panel').getByRole('button',{name:/Próxima questão|Ver resultado/}).click();}
test('clearing a lesson arpeggio clears its instrument cache as well',async({page})=>{
 await start(page);await page.locator('#learn-unit-panel .answers button').first().click();await next(page);
 await page.click('#bass-3-8');await next(page);
 const notes=B.arpeggio(T.buildChord(0),8);await page.click(`#bass-${notes[1].string}-${notes[1].fret}`);await page.getByRole('button',{name:'Limpar sequência',exact:true}).click();
 for(const n of notes)await page.click(`#bass-${n.string}-${n.fret}`);
 await page.getByRole('button',{name:'Confirmar arpejo',exact:true}).click();await expect(page.locator('.lesson-feedback')).toContainText('Acertou');
});
test('passive instrument changes after answering do not move lesson credit',async({page})=>{
 await start(page);await page.locator('#learn-unit-panel .answers button').first().click();await next(page);await page.click('#bass-3-8');await next(page);
 for(const n of B.arpeggio(T.buildChord(0),8))await page.click(`#bass-${n.string}-${n.fret}`);await page.getByRole('button',{name:'Confirmar arpejo',exact:true}).click();await next(page);
 await page.locator('#learn-unit-panel .answers button').nth(1).click();await page.selectOption('#instrument','piano');await next(page);
 const state=await page.evaluate(()=>learningStore.get());expect(state.lessons['bass:triads'].completed).toBe(true);expect(state.lessons['piano:triads']).toBeUndefined();expect(state.skills['bass:chords'].attempts).toBe(4);
});
test('clicking the current practice area does not abandon the running question',async({page})=>{
 await page.click('[data-page=practice]');await page.click('#start-exercise');const question=await page.locator('#question').innerText();await page.click('[data-page=practice]');await expect(page.locator('#practice-session')).toBeVisible();await expect(page.locator('#question')).toHaveText(question);
});
test('rhythm BPM changes preserve focused controls and allow the next activity',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.click('[data-page=practice]');await page.click('[data-feature=rhythm]');await page.locator('#rhythm-settings summary').click();
 await page.evaluate(()=>{window.originalBpm=document.getElementById('rhythm-bpm');window.bpmChanges=0;originalBpm.addEventListener('change',()=>window.bpmChanges++);});
 await page.fill('#rhythm-bpm','120');
 await page.locator('#rhythm-bpm').dispatchEvent('change');
 await expect(page.locator('#rhythm-bpm')).toBeFocused();
 await page.locator('#rhythm-bpm').press('Tab');
 expect(await page.evaluate(()=>originalBpm===document.getElementById('rhythm-bpm'))).toBe(true);
 expect(await page.evaluate(()=>window.bpmChanges)).toBeLessThanOrEqual(2);
 await expect(page.locator('#rhythm-bpm')).toHaveValue('120');await expect(page.locator('#rhythm-settings')).toHaveAttribute('open','');
 await expect(page.locator('#rhythm-settings summary')).toContainText('120 BPM');
 await page.click('#rhythm-start');await expect(page.locator('#rhythm-listen')).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('musicospromax.rhythm.v1')).bpm)).toBe(120);expect(errors).toEqual([]);
});
