(function(){
'use strict';
const $=id=>document.getElementById(id),store=window.learningStore,content=CourseContent,T=MusicTheory;
const names={guitar:'Violão',piano:'Teclado',bass:'Baixo',general:'Ritmo · independente'},skills={notes:'Localização de notas',intervals:'Intervalos',chords:'Formação de acordes',arpeggios:'Arpejos',scales:'Escalas',degrees:'Graus',harmony:'Campo harmônico',cycles:'Ciclos',progressions:'Progressões',daily:'Treino diário',...TonalTheory.skills,'rhythm-perception':'Percepção rítmica','rhythm-reproduction':'Reprodução rítmica'};
let page='home',lesson=null,previousTheory=null;const features={};
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function button(text,handler,cls){const b=el('button',text,cls);b.type='button';b.addEventListener('click',handler);return b;}
function activeInstrument(){return Studio.getInstrument();}
function currentUnit(){return content.units.find(u=>!store.get().lessons[(u.independent?'general':activeInstrument())+':'+u.id]?.completed)||content.units[0];}
function finishLesson(){$('learn-unit-panel').hidden=true;$('lesson-examples').hidden=true;if(lesson){if(!lesson.external?.dailyId)store.end(lesson.run,false);lesson=null;}document.body.dataset.rhythmLesson='false';if(previousTheory){$('key').value=previousTheory.key;$('scale').value=previousTheory.scale;previousTheory=null;}for(const id of ['key','scale'])$(id).disabled=false;}
function sync(next){
 if(page!==next){features[page]?.leave?.();window.dispatchEvent(new CustomEvent('study:navigate',{detail:next}));}page=next;document.body.dataset.page=page;
 for(const b of document.querySelectorAll('.primary-nav button')){b.setAttribute('aria-current',b.dataset.page===(['ear','rhythm','reviews','daily'].includes(page)?'practice':page)?'page':'false');b.setAttribute('aria-pressed',String(b.dataset.page===(['ear','rhythm','reviews','daily'].includes(page)?'practice':page)));}
 $('home-page').hidden=page!=='home';$('learn-page').hidden=page!=='learn'||!!lesson;
 $('studio-core').hidden=!['practice','explore','ear'].includes(page)&&!lesson;
 $('practice-tabs').hidden=!['practice','ear','rhythm','reviews','daily'].includes(page);for(const id of ['ear','rhythm','reviews','daily'])$(id+'-page').hidden=page!==id;for(const b of document.querySelectorAll('[data-feature]'))b.setAttribute('aria-pressed',String(b.dataset.feature===page));if(['ear','rhythm','reviews','daily'].includes(page))for(const b of document.querySelectorAll('#practice-tabs [data-mode]'))b.setAttribute('aria-pressed','false');
 if(page==='home')renderHome();if(page==='learn'&&!lesson)renderCatalog();if(page!=='home')features[page]?.render?.();
}
function show(next){if(next===page&&['practice','ear','rhythm'].includes(next))return;finishLesson();Studio.stop();if(next==='practice'||next==='explore'){Studio.setMode(next==='practice'?'practice':'explore');return;}sync(next);window.scrollTo(0,0);}
for(const b of document.querySelectorAll('[data-feature]'))b.addEventListener('click',()=>show(b.dataset.feature));
window.addEventListener('studio:mode',e=>{finishLesson();sync(e.detail==='explore'?'explore':'practice');window.scrollTo(0,0);});
for(const b of document.querySelectorAll('[data-page]'))if(!b.dataset.mode)b.addEventListener('click',()=>show(b.dataset.page));
function instrumentPicker(){const label=el('label','Seu instrumento');const select=el('select');select.id='home-instrument';for(const key of Object.keys(names).filter(k=>k!=='general')){const o=el('option',names[key]);o.value=key;select.append(o);}select.value=activeInstrument();select.addEventListener('change',()=>{$('instrument').value=select.value;$('reference-instrument').value=select.value;$('cycle-reference').value=select.value;$('instrument').dispatchEvent(new Event('change'));renderHome();});label.append(select);return label;}
function renderHome(){
 const container=$('home-page'),state=store.get(),instrument=activeInstrument(),unit=currentUnit();container.replaceChildren();
 const hero=el('div',undefined,'home-hero');hero.append(el('p','OUÇA. ENTENDA. PRATIQUE.','eyebrow'),el('h1','Seu próximo passo na música.'),el('p','Aulas curtas e prática com violão, teclado e baixo. Sem cadastro; o progresso fica neste navegador.','muted'),instrumentPicker());
 const done=state.lessons[(unit.independent?'general':instrument)+':'+unit.id]?.completed;
 hero.append(button(done?'Revisar fundamentos':'Próxima aula · '+unit.title.replace(/^\d\. /,''),()=>openUnit(unit.id),'primary'),button('Prática livre',()=>show('practice')),button('Abrir laboratório',()=>show('explore')));container.append(hero);
 const grid=el('div',undefined,'dashboard-grid'),learning=el('article',undefined,'dashboard-card');
 learning.append(el('h2','Seu percurso · '+names[instrument]));
 for(const u of content.units){const result=state.lessons[(u.independent?'general':instrument)+':'+u.id];learning.append(button((result?.completed?'✓ Concluída · ':result?'↻ Em aprendizagem · ':'Começar · ')+u.title,()=>openUnit(u.id)));}
 grid.append(learning);
 const performance=el('article',undefined,'dashboard-card');performance.append(el('h2','Habilidades em prática'));
 const list=el('ul');let count=0;
 for(const [key,record] of Object.entries(state.skills).filter(([k])=>k.startsWith(instrument+':'))){count++;const skill=key.split(':')[1],status=store.status(record);list.append(el('li',`${skills[skill]||skill}: ${record.correct}/${record.attempts} acertos · ${Math.round(record.correct/record.attempts*100)}% · ${status}`));if(status==='Revisar')performance.append(button('Revisar '+(skills[skill]||skill),()=>startSkill(skill)));}
 performance.append(count?list:el('p','Ainda sem resultados para este instrumento. Comece por uma aula.','muted'));grid.append(performance);
 const history=el('article',undefined,'dashboard-card');history.append(el('h2','Atividades recentes'));
 const sessions=state.sessions.filter(s=>s.ended&&(s.instrument===instrument||s.instrument==='general'||s.instruments?.includes(instrument))).slice(-8).reverse();
 if(!sessions.length)history.append(el('p','Suas aulas e sessões aparecerão aqui.','muted'));
 for(const s of sessions){const when=new Date(s.started);const date=Number.isFinite(when.getTime())?when.toLocaleDateString('pt-BR'):'Data não disponível';history.append(el('p',`${date} · ${(s.instruments?.length?s.instruments:[s.instrument]).map(i=>names[i]).join(' + ')} · ${skills[s.skill]||s.skill} · ${s.interrupted?'interrompida':s.completed?'concluída':'encerrada'} · ${s.attempts?s.correct+'/'+s.attempts+' acertos':'prática acompanhada, sem nota'}`));}
 grid.append(history);container.append(grid);
 const legacy=state.legacy;container.append(el('p',`Histórico anterior preservado: ${legacy.correct}/${legacy.attempts} acertos e ${legacy.sessions} treinos. Esses totais não identificavam habilidades ou instrumentos. Os novos resultados são separados acima.`,'muted'));
 container.append(el('p','“Consistente” considera resultados recentes, variedade de perguntas, dificuldade e mais de uma sessão. O app avalia respostas na tela; não avalia sua execução física ou pelo microfone.','muted'));
 features.home?.render?.(container);
 if(!store.writable)container.append(el('p','Há um registro de progresso incompatível neste navegador. Ele foi preservado; os novos resultados ficam apenas na memória nesta sessão.','notice'));
}
function startSkill(skill){if(skill.startsWith('tonal-')){window.TonalFeature.openSkill(skill);return;}show('practice');$('exercise-type').value=({intervals:'ear',chords:'build',arpeggios:'build',harmony:'field',degrees:'degrees',scales:'scales'}[skill]||'notes');$('exercise-type').dispatchEvent(new Event('change'));}
function renderCatalog(){const container=$('learn-page');container.replaceChildren(el('p','APRENDER COM SENTIDO','eyebrow'),el('h1','Uma habilidade de cada vez.'),el('p','Siga as aulas iniciais e as duas unidades de ritmo ou abra qualquer assunto já publicado. Cada aula inclui exemplos, prática e revisão.','muted'));
 const grid=el('div',undefined,'course-grid');for(const [id,title,description] of content.tracks){const card=el('article',undefined,'dashboard-card');card.append(el('h2',title),el('p',description,'muted'));const units=content.units.filter(u=>u.track===id);for(const u of units){const completed=store.get().lessons[(u.independent?'general':activeInstrument())+':'+u.id]?.completed;card.append(el('p',u.objective),button((completed?'✓ Revisar · ':'Começar · ')+u.title+' · '+u.minutes+' min',()=>openUnit(u.id),'primary'));}if(!units.length)card.append(el('p','Conteúdo futuro · ainda não publicado','future-label'));grid.append(card);}container.append(grid);container.append(button('Abrir treinamento de Ritmo',()=>show('rhythm'),'primary'));}
function openUnit(id){
 finishLesson();Studio.stop();const unit=content.units.find(u=>u.id===id);previousTheory={key:$('key').value,scale:$('scale').value};$('key').value='0';$('scale').value='Maior';
 lesson={unit,instrument:unit.independent?'general':activeInstrument(),phase:'read',seen:new Set(),index:0,correct:0,results:{},answered:false,sequence:[],run:null};
 sync('learn');for(const panel of document.querySelectorAll('#workspace>.lesson-panel'))panel.hidden=true;$('learn-unit-panel').hidden=false;for(const id of ['key','scale'])$(id).disabled=true;
 document.body.dataset.rhythmLesson=String(!!unit.independent);renderLesson();window.scrollTo(0,0);
}
function neutral(){Studio.lesson({kind:lesson.phase==='read'?'scale':'custom',scale:T.scale(0),hideLabels:lesson.phase==='quiz'&&!lesson.answered,forceBoard:true,selected:[],title:lesson.phase==='read'?'Ouça e experimente':lesson.unit.questions[lesson.index]?.prompt,description:'Escolha notas diretamente no instrumento. No baixo, cada ataque é uma nota independente.'});}
function renderLesson(){
 if(!lesson)return;const l=lesson,u=l.unit,panel=$('learn-unit-panel');$('lesson-examples').hidden=l.phase!=='read';$('lesson-examples').replaceChildren();panel.replaceChildren(el('p','AULA · '+names[l.instrument],'eyebrow'),el('h1',u.title),el('p','Objetivo: '+u.objective,'lesson-objective'));
 panel.append(button('← Todas as trilhas',()=>show('learn'),'subtle'));
 if(l.phase==='read'){
  for(const paragraph of u.paragraphs)panel.append(el('p',paragraph,'lesson-copy'));
  if(!u.independent&&activeInstrument()==='bass')panel.append(el('p',u.bass,'bass-tip'));
  const exampleHost=u.independent?el('div'):$('lesson-examples');if(u.independent){exampleHost.id='rhythm-lesson-examples';panel.append(exampleHost);}
  const demos=el('div',undefined,'lesson-demos');u.demos.forEach((demo,i)=>{demos.append(button((l.seen.has(i)?'✓ ':'▶ ')+demo.label,()=>{l.seen.add(i);if(demo.rhythm)window.RhythmFeature.demo(demo.rhythm);else Studio.lessonPlay(demo.pcs,demo.chord);renderLessonText();},'lesson-demo'));});exampleHost.append(demos);panel.append(button(u.independent?'Ver exemplos rítmicos ↓':'Ver exemplos no instrumento ↓',()=> (u.independent?exampleHost:document.querySelector('.instrument-stage')).scrollIntoView({block:'start'})));
  const help=el('p','Conclusão: ouça os dois exemplos e acerte pelo menos 3 de 4 questões. Você pode revisar e repetir.','muted');panel.append(help);
  const start=button('Praticar esta aula · 4 questões',()=>{l.phase='quiz';l.run=store.begin(u.skill,u.independent?'general':activeInstrument(),'lesson',2);renderLesson();window.scrollTo(0,0);},'primary');start.dataset.startLesson='true';start.disabled=l.seen.size<u.demos.length;panel.append(start);const second=start.cloneNode(true);second.addEventListener('click',()=>start.click());exampleHost.append(second);neutral();
 }else if(l.phase==='quiz')renderQuestion(panel);
 else {
  const passed=Object.values(l.results).some(r=>r.total===4&&r.correct>=3);panel.append(el('h2',passed?'✓ Aula concluída!':'↻ Vamos revisar.'),el('p',`${l.correct} de 4 acertos. ${Object.keys(l.results).length>1?'Atividade mista: resultados separados por instrumento. Complete quatro questões no mesmo instrumento para concluir a unidade. ':''}${passed?'Você pode continuar ou revisar os exemplos.':'Revise os exemplos e tente novamente; o objetivo é pelo menos 3 acertos.'}`));
  panel.append(button('Revisar e repetir',()=>openUnit(u.id)));if(!u.independent)panel.append(button('Praticar esta habilidade',()=>startSkill(u.skill),'primary'));
  const next=content.units[content.units.indexOf(u)+1];if(u.independent)panel.append(button('Aplicar no treinamento rítmico',()=>show('rhythm'),'primary'));if(passed&&next)panel.append(button('Próxima aula →',()=>openUnit(next.id),'primary'));panel.append(button('Ver meu progresso',()=>show('home')));Studio.lesson({kind:'scale',scale:T.scale(0),selected:[],title:'Continue praticando',description:'Use as notas para revisar no seu instrumento.'});
 }
}
function renderLessonText(){const l=lesson;// Preserve the demonstration while updating the lesson buttons.
 const buttons=document.querySelectorAll('.lesson-demo');buttons.forEach((b,i)=>{b.textContent=(l.seen.has(i)?'✓ ':'▶ ')+l.unit.demos[i].label;});document.querySelectorAll('[data-start-lesson]').forEach(b=>b.disabled=l.seen.size<l.unit.demos.length);
}
function renderQuestion(panel){
 const l=lesson,q=l.unit.questions[l.index];l.answered=false;l.sequence=[];l.sequences={};l.sequences[activeInstrument()]=l.sequence;
 panel.append(el('p',l.single?'Revisão da questão original':`Questão ${l.index+1}/4 · ${l.correct} acertos`,'pill'),el('h2',q.prompt));
 const actions=el('div',undefined,'answers');
 if(q.kind==='choice'||q.kind==='ear'||q.kind==='rhythm-ear')q.choices.forEach((text,i)=>actions.append(button(text,()=>answer(i===q.answer,text))));
 if(q.kind==='note')panel.append(el('p','Responda tocando uma nota no instrumento. Qualquer oitava é válida.','muted'));
 if(q.kind==='sequence'){panel.append(el('p','Toque três notas em ordem ascendente; a sequência é avaliada ao confirmar.','muted'));actions.append(button('Limpar sequência',()=>{l.sequence=[];l.sequences[l.instrument]=l.sequence;neutral();$('lesson-live').textContent='Sequência limpa.';}),button('Confirmar arpejo',()=>answer(l.sequence.length===3&&T.mod(l.sequence[0])===0&&q.offsets.every((v,i)=>l.sequence[i]-l.sequence[0]===v),l.sequence.map(m=>T.tonics.Maior[T.mod(m)]+(Math.floor(m/12)-1)).join(' → ')),'primary'));}
 if(q.kind==='rhythm-ear')panel.append(button('Ouvir ritmo novamente',()=>window.RhythmFeature.demo(q.pattern),'primary'));
 if(q.kind==='ear')panel.append(button('Ouvir novamente',()=>Studio.hidden(q.pcs),'primary'));
 panel.append(actions,el('p','', 'live-note'));panel.lastChild.id='lesson-live';neutral();
 if(q.kind==='ear')Studio.hidden(q.pcs);if(q.kind==='rhythm-ear')window.RhythmFeature.demo(q.pattern);
}
function answer(correct,chosen='Resposta no instrumento'){
 const l=lesson;if(!l||l.phase!=='quiz'||l.answered)return;l.answered=true;l.correct+=Number(correct);
 const bucket=l.results[l.instrument]||(l.results[l.instrument]={correct:0,total:0});bucket.total++;bucket.correct+=Number(correct);
 const q=l.unit.questions[l.index],external=l.external||{},task={type:'lesson',unit:l.unit.id,index:l.index},metadata={skill:l.unit.skill,instrument:l.instrument,correct,difficulty:2,session:l.run,question:l.unit.id+':'+l.index,task,prompt:q.prompt,explanation:q.explanation,chosen,source:external.source,reviewId:external.reviewId,dailyId:external.dailyId,dailyStep:external.dailyStep,attemptId:external.dailyId?external.dailyId+':daily:'+external.dailyStep:l.run+':'+l.index};
 if(!store.record(metadata)){l.answered=false;l.correct-=Number(correct);bucket.total--;bucket.correct-=Number(correct);return;}window.dispatchEvent(new CustomEvent('study:attempt',{detail:metadata}));
 const feedback=el('div',undefined,correct?'result-success lesson-feedback':'result-error lesson-feedback');feedback.setAttribute('role','status');feedback.append(el('strong',correct?'✓ Acertou!':'✕ Vamos revisar.'),el('p',(!correct?'Sua resposta: '+chosen+'. ':'')+q.explanation));$('learn-unit-panel').append(feedback);
 try{if($('feedback-sound').checked)soundEngine.feedback(correct);}catch(_){}
 for(const b of $('learn-unit-panel').querySelectorAll('.answers button'))b.disabled=true;
 $('learn-unit-panel').append(button(l.single?'Concluir revisão →':l.index===3?'Ver resultado →':'Próxima questão →',()=>{if(l.single){const detail={...l.external,reason:'finished',answered:true,correct};if(!l.external?.dailyId)store.end(l.run,true);lesson=null;finishLesson();window.dispatchEvent(new CustomEvent('study:task-end',{detail}));return;}l.index++;if(l.index===4){for(const [instrument,r] of Object.entries(l.results))store.lesson(l.unit.id,instrument,r.correct/r.total,r.total);store.end(l.run,true);l.phase='result';}renderLesson();window.scrollTo(0,0);const heading=$('learn-unit-panel').querySelector('h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}},'primary'));
}
window.addEventListener('studio:note',e=>{
 if(!lesson)return;const l=lesson,n=e.detail;if(l.phase==='quiz'&&l.answered){Studio.select(n);return;}if(l.unit.independent)return;l.instrument=n.instrument||activeInstrument();if(l.phase==='quiz'&&l.unit.questions[l.index].kind==='sequence'){l.sequence=l.sequences[l.instrument]||(l.sequences[l.instrument]=[]);}Studio.select(n);if(l.phase!=='quiz'||l.answered)return;const q=l.unit.questions[l.index];
 if(q.kind==='note')answer(T.mod(n.midi)===q.pc,T.tonics.Maior[T.mod(n.midi)]+(Math.floor(n.midi/12)-1));else if(q.kind==='sequence'){l.sequence.push(n.midi);$('lesson-live').textContent='Sua sequência: '+l.sequence.map(m=>T.label(T.tonics.Maior[T.mod(m)])+(Math.floor(m/12)-1)).join(' → ');}
});
window.addEventListener('studio:lesson-render',()=>{if(lesson){if(lesson.unit.independent)return;lesson.instrument=activeInstrument();if(lesson.phase==='read')renderLesson();else{if(lesson.phase==='quiz'){lesson.sequence=lesson.sequences[activeInstrument()]||(lesson.sequences[activeInstrument()]=[]);if($('lesson-live'))$('lesson-live').textContent=lesson.sequence.length?'Sequência mantida: '+lesson.sequence.length+' notas.':'';}Studio.render();}}});
$('reset-stats').addEventListener('click',()=>{store.reset();show('home');});
function reviewQuestion(task,instrument,external={}){const unit=content.units.find(u=>u.id===task.unit);if(!unit?.questions[task.index])return false;openUnit(task.unit);lesson.phase='quiz';lesson.single=true;lesson.index=task.index;lesson.instrument=unit.independent?'general':instrument;lesson.external=external;lesson.run=external.dailyId||store.begin(unit.skill,lesson.instrument,'review',2);renderLesson();return true;}
window.Platform={show,openUnit,reviewQuestion,register:(name,feature)=>features[name]=feature,refresh:()=>sync(page),getPage:()=>page};sync('home');
})();
