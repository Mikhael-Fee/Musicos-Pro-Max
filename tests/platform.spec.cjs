const {test,expect}=require('@playwright/test');
const T=require('../assets/theory.js'),B=require('../assets/bass.js');
const failures=new WeakMap();
test.beforeEach(async({page})=>{const list=[];failures.set(page,list);page.on('pageerror',e=>list.push(e.message));await page.goto('/');});
test.afterEach(async({page})=>expect(failures.get(page)).toEqual([]));
async function explore(page,instrument='bass'){await page.click('[data-page=explore]');await page.selectOption('#instrument',instrument);}
async function practice(page,type,policy='learn'){await page.click('[data-page=practice]');await page.selectOption('#exercise-type',type);await page.selectOption('#practice-policy',policy);await page.click('#start-exercise');}
async function bassNote(page,pc){const selector=await page.locator('#bass-render [data-midi]').evaluateAll((els,pc)=>els.find(el=>Number(el.dataset.midi)%12===pc).id,pc);await page.click('#'+selector);}
async function nextLessonQuestion(page){await page.locator('#learn-unit-panel').getByRole('button',{name:/Próxima questão|Ver resultado/}).click();}
async function startLesson(page,id){await page.evaluate(id=>Platform.openUnit(id),id);await page.locator('#lesson-examples .lesson-demo').nth(0).click();await page.locator('#lesson-examples .lesson-demo').nth(1).click();await page.locator('#lesson-examples [data-start-lesson]').click();}

test('new visitor starts from home and the bass choice persists across modules',async({page})=>{
 await expect(page.locator('#home-page')).toBeVisible();await page.selectOption('#home-instrument','bass');await page.locator('#home-page .primary').click();
 await expect(page.locator('#learn-unit-panel h1')).toContainText('Encontre seu caminho');await expect(page.locator('#bass-panel')).toBeVisible();
 await page.click('[data-page=practice]');await expect(page.locator('#instrument')).toHaveValue('bass');
 await page.click('[data-mode=cycles]');await expect(page.locator('#bass-render button')).not.toHaveCount(0);
 await page.reload();await expect(page.locator('#home-instrument')).toHaveValue('bass');
 await page.click('[data-page=explore]');await expect(page.locator('#learn-unit-panel')).toBeHidden();await expect(page.locator('#explore-panel')).toBeVisible();
});

test('bass notes, scale and arpeggio sounds match sounding MIDI, without changing piano tuning',async({page})=>{
 await explore(page,'bass');await page.evaluate(()=>{window.played=[];const fn=soundEngine.note.bind(soundEngine);soundEngine.note=(p,i,d,a)=>{played.push([p+48,i]);return fn(p,i,d,a);};});
 await page.click('#bass-0-8');expect(await page.evaluate(()=>played.at(-1))).toEqual([36,'bass']);
 await page.selectOption('#explore-topic','scale');await page.evaluate(()=>played=[]);await page.click('#play-scene');
 expect(await page.evaluate(()=>played.map(n=>n[0]))).toEqual([36,38,40,41,43,45,47,48]);
 await page.selectOption('#explore-topic','chord');await page.selectOption('#chord-type','maj7');await page.evaluate(()=>played=[]);await page.click('#play-bass');
 expect(await page.evaluate(()=>played)).toEqual([[36,'bass'],[40,'bass'],[43,'bass'],[47,'bass']]);
 await page.selectOption('#instrument','piano');await expect(page.locator('#bass-panel')).toBeHidden();await expect(page.locator('#piano-key-48')).toBeVisible();
});

test('challenge ear choices neither sound nor reveal the interval before confirming, including on bass',async({page})=>{
 await explore(page);await page.evaluate(()=>{window.played=[];const fn=soundEngine.note.bind(soundEngine);soundEngine.note=(p,i,d,a)=>{played.push(p+48);return fn(p,i,d,a);};});
 await page.click('[data-page=practice]');await page.selectOption('#reference-instrument','bass');await page.selectOption('#practice-difficulty','1');await page.selectOption('#exercise-type','ear');await page.selectOption('#practice-policy','challenge');await page.click('#start-exercise');
 const pair=await page.evaluate(()=>played.slice(-2)),distance=pair[1]-pair[0],before=await page.evaluate(()=>played.length);
 await page.click('#answers [data-answer="'+distance+'"]');await expect(page.locator('#scene-title')).toHaveText('Ouça o desafio');
 await bassNote(page,0);expect(await page.evaluate(()=>played.length)).toBe(before);
 await expect(page.locator('#bass-render .chosen')).toHaveCount(1);await page.click('#listen-target');expect(await page.evaluate(()=>played.length)).toBe(before+2);
 await page.click('#confirm-answer');await expect(page.locator('#feedback')).toContainText('Acertou!');
 expect(await page.evaluate(()=>learningStore.get().skills['bass:intervals'].correct)).toBe(1);
});

test('bass chord formation is an ordered arpeggio and preserves repeated use of one string',async({page})=>{
 await explore(page);await page.click('[data-page=practice]');await page.selectOption('#exercise-type','build');await page.selectOption('#exercise-chord-type','major');await page.click('#start-exercise');
 const text=await page.locator('#question').innerText(),chord=T.scale(0).map(n=>T.buildChord(n.pc,'major',n.name)).find(c=>text.includes(' '+c.name+'.'));
 await expect(page.locator('#question-help')).toContainText('Uma nota por vez');
 await page.selectOption('#bass-region','all');const notes=B.arpeggio(chord,8);
 for(const n of notes)await page.click(`#bass-${n.string}-${n.fret}`);
 await page.click('#confirm-answer');await expect(page.locator('#feedback')).toContainText('Acertou!');
 expect(await page.evaluate(()=>learningStore.get().skills['bass:arpeggios'].correct)).toBe(1);
});

test('scale sequence on bass is validated as an ascending octave',async({page})=>{
 await explore(page);await practice(page,'scales');
 const path=B.ascendingPath(T.scale(0));for(const n of path)await page.click(`#bass-${n.string}-${n.fret}`);
 await page.click('#confirm-answer');await expect(page.locator('#feedback')).toContainText('Acertou!');
 expect(await page.evaluate(()=>learningStore.get().skills['bass:scales'].correct)).toBe(1);
});

for(const [id,answers] of [['notes',[0,6,0,1]],['intervals',[1,5,1,1]],['triads',[0,3,'sequence',1]]])test(`complete ${id} lesson on bass and reload its independent progress`,async({page})=>{
 await page.selectOption('#home-instrument','bass');await startLesson(page,id);
 const types=id==='notes'?['note','note','choice','choice']:id==='intervals'?['choice','note','choice','choice']:['choice','note','sequence','choice'];
 for(let i=0;i<4;i++){
  if(types[i]==='note')await bassNote(page,answers[i]);
  else if(types[i]==='sequence'){for(const n of B.arpeggio(T.buildChord(0),8))await page.click(`#bass-${n.string}-${n.fret}`);await page.getByRole('button',{name:'Confirmar arpejo',exact:true}).click();}
  else await page.locator('#learn-unit-panel .answers button').nth(answers[i]).click();
  await expect(page.locator('.lesson-feedback')).toContainText('Acertou!');await nextLessonQuestion(page);
 }
 await expect(page.locator('#learn-unit-panel')).toContainText('Aula concluída');
 await page.reload();expect(await page.evaluate(id=>learningStore.get().lessons['bass:'+id].completed,id)).toBe(true);
 expect(await page.evaluate(()=>Object.keys(learningStore.get().skills).every(k=>k.startsWith('bass:')))).toBe(true);
});

test('lesson activity remains at the same question when changing instruments',async({page})=>{
 await startLesson(page,'notes');const first=await page.locator('#guitar-render [data-midi]').evaluateAll(els=>els.find(n=>Number(n.dataset.midi)%12===0).id);await page.click('#'+first);
 await nextLessonQuestion(page);await expect(page.locator('#learn-unit-panel h2')).toContainText('Fá sustenido');
 await page.selectOption('#instrument','bass');await expect(page.locator('#learn-unit-panel h2')).toContainText('Fá sustenido');await bassNote(page,6);await expect(page.locator('.lesson-feedback')).toContainText('Acertou!');
});

test('short practice session records exactly five attempts and completes without duplicates',async({page})=>{
 await explore(page);await page.click('[data-page=practice]');await page.selectOption('#practice-length','5');await page.click('#start-exercise');
 for(let i=0;i<5;i++){const text=await page.locator('#question').innerText(),note=T.scale(0).find(n=>text.includes('('+n.name+')'));await bassNote(page,note.pc);await page.click('#next-question');}
 await expect(page.locator('#exercise-help')).toContainText('5 de 5');const state=await page.evaluate(()=>learningStore.get());expect(state.skills['bass:notes'].attempts).toBe(5);expect(state.sessions.filter(s=>s.completed)).toHaveLength(1);
});

test('guided bass uses one note on each metronome beat and a genuine seventh in tetrad patterns',async({page})=>{
 await explore(page);await page.click('[data-page=practice]');await page.click('[data-mode=guided]');await page.selectOption('#bass-pattern','seventh');await page.fill('#bpm','120');
 await page.evaluate(()=>{window.played=[];const fn=soundEngine.note.bind(soundEngine);soundEngine.note=(p,i,d,a)=>{played.push({midi:p+48,instrument:i,at:a});return fn(p,i,d,a);};});await page.click('#start-guided');
 await expect(page.locator('#guided-phase')).toContainText('Baixo: uma nota por tempo');await expect(page.locator('#bass-description')).toContainText('Arpejo de tétrade');
 const notes=await page.evaluate(()=>played);expect(notes).toHaveLength(4);expect(notes.every(n=>n.instrument==='bass')).toBe(true);expect(notes.map(n=>n.midi%12)).toEqual([5,9,0,4]);for(let i=1;i<4;i++)expect(notes[i].at-notes[i-1].at).toBeCloseTo(.5,4);
});

test('bass audio renders the E1 fundamental, decay and independent silence',async({page})=>{
 const result=await page.evaluate(async()=>{
  const render=async(volume)=>{const ctx=new OfflineAudioContext(1,44100*3,44100),engine=new soundEngine.constructor(ctx);engine.setVolume(volume,'bass');engine.note(-20,'bass');const data=(await ctx.startRendering()).getChannelData(0);const rms=(a,b)=>Math.sqrt(data.slice(a,b).reduce((s,v)=>s+v*v,0)/(b-a));let crossings=0;for(let i=22051;i<66150;i++)if(data[i-1]<=0&&data[i]>0)crossings++;return {frequency:crossings,rms:rms(1000,9000),tail:rms(110000,120000),peak:data.reduce((m,v)=>Math.max(m,Math.abs(v)),0)};};return {normal:await render(1),muted:await render(0)};
 });
 expect(result.normal.frequency).toBeGreaterThan(39);expect(result.normal.frequency).toBeLessThan(43);expect(result.normal.rms).toBeGreaterThan(.01);expect(result.normal.tail).toBeLessThan(result.normal.rms*.15);expect(result.normal.peak).toBeLessThan(1);expect(result.muted.rms).toBe(0);
});

for(const width of [360,1366])test(`navigation, comparison and keyboard access at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await explore(page,'all');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(width<720){await expect(page.locator('#comparison-tabs')).toBeVisible();await page.click('#compare-bass');await expect(page.locator('#bass-panel')).toBeVisible();await expect(page.locator('#guitar-panel')).toBeHidden();}
 else{for(const name of ['guitar','piano','bass'])await expect(page.locator('#'+name+'-panel')).toBeVisible();}
 await page.selectOption('#instrument','bass');const key=page.locator('#bass-0-8');await key.focus();await page.keyboard.press('Enter');await expect(key).toHaveClass(/chosen/);
 await page.click('[data-page=learn]');await expect(page.locator('#learn-page')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('an unsuccessful lesson remains reviewable and does not unlock completion',async({page})=>{
 await page.selectOption('#home-instrument','bass');await startLesson(page,'notes');
 for(let i=0;i<4;i++){if(i<2)await bassNote(page,1);else await page.locator('#learn-unit-panel .answers button').nth(i===2?1:0).click();await expect(page.locator('.lesson-feedback')).toContainText('Vamos revisar');await nextLessonQuestion(page);}
 await expect(page.locator('#learn-unit-panel')).toContainText('Vamos revisar');expect(await page.evaluate(()=>learningStore.get().lessons['bass:notes'].completed)).toBe(false);
 await page.getByRole('button',{name:'Revisar e repetir',exact:true}).click();await expect(page.locator('#lesson-examples [data-start-lesson]')).toBeDisabled();
});

test('cycle challenge on bass preserves the departure arpeggio until the first attempt',async({page})=>{
 await explore(page);await page.click('[data-page=practice]');await page.click('[data-mode=cycles]');await page.selectOption('#cycle-reference','bass');await page.selectOption('#cycle-policy','challenge');await page.click('#start-cycle-exercise');
 await page.click('#cycle-answers [data-pc="5"]');await expect(page.locator('#scene-title')).toHaveText('C');await page.click('#confirm-cycle');await expect(page.locator('#cycle-feedback')).toContainText('Acertou!');await expect(page.locator('#scene-title')).toHaveText('F');
 expect(await page.evaluate(()=>learningStore.get().skills['bass:cycles'].correct)).toBe(1);
});

test('comparison preserves chord answers when switching between bass and keyboard',async({page})=>{
 await explore(page,'bass-piano');await page.click('[data-page=practice]');await page.selectOption('#exercise-type','build');await page.selectOption('#exercise-chord-type','major');await page.click('#start-exercise');
 const text=await page.locator('#question').innerText(),chord=T.scale(0).map(n=>T.buildChord(n.pc,'major',n.name)).find(c=>text.includes(' '+c.name+'.'));await page.selectOption('#bass-region','all');
 for(const n of B.arpeggio(chord,8))await page.click(`#bass-${n.string}-${n.fret}`);
 await page.click('#piano-key-48');await expect(page.locator('#answer-instrument')).toHaveValue('piano');
 await page.selectOption('#answer-instrument','bass');await expect(page.locator('#bass-render .chosen')).toHaveCount(3);await page.click('#confirm-answer');await expect(page.locator('#feedback')).toContainText('Acertou!');
});

test('bass volume and keyboard focus survive redraw and a reload',async({page})=>{
 await explore(page);await page.locator('#bass-volume').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input'));});await expect(page.locator('#bass-volume-value')).toHaveText('Mudo');
 await page.selectOption('#bass-region','all');const key=page.locator('#bass-3-20');await key.focus();await page.keyboard.press('Enter');await expect(key).toBeFocused();await expect(key).toHaveClass(/chosen/);
 await page.reload();await page.click('[data-page=explore]');await expect(page.locator('#instrument')).toHaveValue('bass');await expect(page.locator('#bass-volume')).toHaveValue('0');expect(await page.evaluate(()=>soundEngine.levels.bass)).toBe(0);
});
