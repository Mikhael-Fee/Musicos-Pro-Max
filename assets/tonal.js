(function(){
'use strict';
const A=TonalTheory,T=MusicTheory,P=Platform,store=learningStore,$=id=>document.getElementById(id),player=new TonalPlayer();
const core=$('studio-core'),coreAnchor=document.createComment('shared studio position');core.before(coreAnchor);
function restoreCore(){if(core.parentNode!==coreAnchor.parentNode)coreAnchor.after(core);}
const instruments={guitar:'Violão',piano:'Teclado',bass:'Baixo'};
let hasInstrumentPreference=false;
let prefs={skill:'tonal-direction',level:'auto',key:'0',instrument:Studio.getInstrument()},trial=null;const lastBySkill={};
try{const saved=JSON.parse(localStorage.getItem('musicospromax.ear.v1'));if(saved&&Object.hasOwn(instruments,saved.instrument))hasInstrumentPreference=true;if(saved)for(const k of Object.keys(prefs))if(saved[k]!==undefined)prefs[k]=String(saved[k]);}catch(_){}
if(!Object.hasOwn(A.skills,prefs.skill))prefs.skill='tonal-direction';if(!['auto','1','2','3'].includes(prefs.level))prefs.level='auto';if(!['auto',...Array.from({length:12},(_,i)=>String(i))].includes(prefs.key))prefs.key='0';if(!Object.hasOwn(instruments,prefs.instrument))prefs.instrument='guitar';
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function button(text,fn,id,cls){const n=el('button',text,cls);n.type='button';if(id)n.id=id;n.addEventListener('click',fn);return n;}
function save(){try{localStorage.setItem('musicospromax.ear.v1',JSON.stringify(prefs));}catch(_){} }
function select(id,label,values,value){const wrap=el('label',label),s=el('select');s.id=id;for(const [v,text] of values){const o=el('option',text);o.value=v;s.append(o);}s.value=value;wrap.append(s);return wrap;}
function clear(){restoreCore();player.stop();if(trial&&!trial.external?.dailyId)store.end(trial.run,!!trial.graded);trial=null;document.body.dataset.earMelody='false';}
function lock(active){for(const id of ['ear-skill','ear-difficulty','ear-key','ear-instrument'])if($(id))$(id).disabled=active;}
function render(){
 restoreCore();
 if(!hasInstrumentPreference)prefs.instrument=Studio.getInstrument();
 const page=$('ear-page');page.replaceChildren(el('p','OUVIR · MEMORIZAR · REPRODUZIR','eyebrow'),el('h1','Ouvido'),el('p','Percepção tonal · aprenda a tirar músicas de ouvido. Primeiro escute a referência e a frase; depois responda. Os exemplos são originais, inspirados em frases cantáveis e pequenas cadências.','muted'));
 const intervals=button('Intervalos · treino existente',()=>{P.show('practice');$('exercise-type').value='ear';$('practice-policy').value='challenge';$('exercise-type').dispatchEvent(new Event('change'));},'ear-intervals');page.append(intervals);
 const controls=el('div',undefined,'feature-controls');controls.append(select('ear-skill','O que escutar',Object.entries(A.skills).map(([k,v])=>[k,({ 'tonal-direction':'1','tonal-center':'2','tonal-degrees':'3','tonal-harmony':'3','tonal-melody':'4'}[k])+ ' · '+v]),prefs.skill),select('ear-difficulty','Dificuldade nesta habilidade',[['auto','Automática · por evidências'],['1','Inicial'],['2','Intermediária'],['3','Ampliada']],prefs.level),select('ear-key','Tonalidade maior',[['auto','Automática · novo tom entre atividades'],...Array.from({length:12},(_,i)=>[String(i),T.tonics.Maior[i]+' maior'])],prefs.key),select('ear-instrument','Ouvir e responder com',Object.entries(instruments),prefs.instrument));
 for(const [id,k] of [['ear-skill','skill'],['ear-difficulty','level'],['ear-key','key'],['ear-instrument','instrument']])controls.querySelector('#'+id).addEventListener('change',event=>{prefs[k]=event.target.value;if(k==='instrument')hasInstrumentPreference=true;save();});
 const volume=el('label','Volume geral'),range=el('input');range.type='range';range.min=0;range.max=100;range.value=$('volume').value;range.setAttribute('aria-label','Volume geral do ouvido');range.addEventListener('input',()=>{$('volume').value=range.value;$('volume').dispatchEvent(new Event('input'));});volume.append(range);controls.append(volume);
 const channel=el('label','Volume do instrumento'),level=el('input');level.type='range';level.id='ear-channel-volume';level.min=0;level.max=100;level.value=soundEngine.levels[prefs.instrument]*100;level.setAttribute('aria-label','Volume do instrumento no ouvido');level.addEventListener('input',()=>{const input=$((trial?.instrument||prefs.instrument)+'-volume');input.value=level.value;input.dispatchEvent(new Event('input'));});controls.querySelector('#ear-instrument').addEventListener('change',()=>level.value=soundEngine.levels[prefs.instrument]*100);channel.append(level);controls.append(channel);
 const settings=el('details');settings.id='ear-settings';settings.open=true;settings.append(el('summary','Atividade, tonalidade e som'),controls);page.append(settings,el('p','O tom fica fixo até terminar a atividade. A dificuldade avança dentro de cada habilidade, sem saltar os quatro níveis pedagógicos. Os resultados avaliam ouvido relativo e respostas na tela, não ouvido absoluto nem execução física.','muted'));
 const stage=el('article',undefined,'dashboard-card ear-stage');stage.id='ear-stage';page.append(stage);stage.append(button('Começar atividade',()=>begin(),'ear-start','primary'));Studio.tonal({},prefs.instrument);
 const h=page.querySelector('h1');h.tabIndex=-1;h.focus({preventScroll:true});
}
function begin(forced,external){
 clear();const skill=forced?A.material(forced).skill:prefs.skill,level=forced?forced.difficulty:prefs.level==='auto'?store.level(skill,prefs.instrument,true).level:Number(prefs.level),key=forced?forced.key:prefs.key==='auto'?Math.floor(Math.random()*12):Number(prefs.key);
 const task=forced||A.choose(skill,key,level,Math.random,lastBySkill[skill]);lastBySkill[skill]=task.pattern;
 const instrument=external?.instrument||prefs.instrument,m={...A.material(task,instrument),instrument};
 trial={task,m,instrument,external,run:external?.dailyId||store.begin(skill,instrument,'tonal',level),level,heard:false,playing:false,graded:false,choice:null,input:[],positions:[],help:0};
 if(external)for(const [id,value] of [['ear-skill',skill],['ear-difficulty',String(level)],['ear-key',String(key)],['ear-instrument',instrument]])$(id).value=value;
 $('ear-channel-volume').value=soundEngine.levels[instrument]*100;$('ear-settings').open=false;lock(true);document.body.dataset.earMelody=String(m.kind==='melody');renderActivity();
}
function renderInstrument(){if(!trial)return;Studio.tonal({scale:T.scale(trial.task.key),selected:trial.positions,hideLabels:!trial.graded},trial.instrument);}
function renderActivity(){
 const t=trial,m=t.m,stage=$('ear-stage');stage.replaceChildren(el('p',`${T.tonics.Maior[t.task.key]} maior · ${instruments[t.instrument]} · dificuldade ${t.level}`,'pill'),el('h2',m.prompt));
 stage.append(el('p',m.kind==='melody'?`Frase com ${m.notes.length} notas. Oitava inicial livre: preserve a sequência de alturas e seus intervalos. Digitações alternativas são aceitas. O ritmo não recebe nota.`:m.kind==='stability'?'Você ouvirá dois finais, A e B, separados por uma pausa, com o mesmo acorde I de apoio.':'A referência I → IV → V → I estabelece o tom. Ela não é a resposta. No baixo, os acordes são ouvidos como arpejos.','muted'));
 const actions=el('div',undefined,'actions');actions.append(button('Ouvir · referência e pergunta',()=>listen(),'ear-listen','primary'),button('Repetir pergunta',()=>listen(false),'ear-repeat'),button('Interromper áudio',()=>stop(),'ear-stop'));stage.append(actions);
 const status=el('p','Ouça a pergunta inteira para responder.','notice');status.id='ear-status';status.setAttribute('role','status');stage.append(status);
 const answers=el('div',undefined,'answers');answers.id='ear-answers';
 if(m.kind!=='melody'){
  const choices=[...m.choices];for(let i=choices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
  for(const [value,label] of choices){const b=el('button',label);b.type='button';b.dataset.choice=value;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{if(!t.heard||t.playing||t.graded)return;t.choice=value;for(const other of answers.children)other.setAttribute('aria-pressed',String(other===b));update();});answers.append(b);}
 }else{
  const count=el('p','Sua sequência: 0 notas');count.id='ear-input';answers.append(count,button('Desfazer última nota',()=>{if(t.playing||t.graded)return;t.input.pop();t.positions.pop();renderInstrument();update();},'ear-undo'),button('Limpar sequência',()=>{if(t.playing||t.graded)return;t.input=[];t.positions=[];renderInstrument();update();},'ear-clear'));
 }
 if(m.kind==='melody')stage.append(core);
 stage.append(answers,button('Confirmar',confirm,'ear-confirm','primary'),button('Ajuda progressiva',hint,'ear-hint'),button('Encerrar atividade',()=>{const ctx=t.external;clear();if(ctx)window.dispatchEvent(new CustomEvent('study:task-end',{detail:{...ctx,reason:'finished',answered:false}}));else{lock(false);$('ear-settings').open=true;$('ear-stage').replaceChildren(button('Começar atividade',()=>begin(),'ear-start','primary'));}},'ear-end'));
 const help=el('p');help.id='ear-help';help.setAttribute('role','status');const feedback=el('div');feedback.id='ear-feedback';feedback.setAttribute('role','status');stage.append(help,feedback);renderInstrument();update();
}
function update(){
 if(!trial||!$('ear-confirm'))return;const t=trial;for(const b of $('ear-answers').querySelectorAll('button'))b.disabled=!t.heard||t.playing||t.graded;
 $('ear-confirm').disabled=!t.heard||t.playing||t.graded||(t.m.kind==='melody'?!t.input.length:t.choice===null);$('ear-hint').disabled=t.graded||t.playing||!t.heard||t.help>=2;$('ear-repeat').disabled=!t.heard||t.playing||t.graded;$('ear-listen').disabled=t.playing||t.graded;
 if($('ear-input'))$('ear-input').textContent=`Sua sequência: ${t.input.length} nota(s).`;
}
async function listen(reference=true){
 const t=trial;if(!t)return;t.playing=true;update();$('ear-status').textContent='Escutando… A resposta não é mostrada no instrumento.';
 try{await player.play(t.m,{reference,onPhase:phase=>{if(trial===t)$('ear-status').textContent=({reference:'Referência tonal · escute o centro.',question:'Pergunta · memorize os sons.',model:'Modelo completo · memorize o movimento.',excerpt:'Trecho sem o final · complete como no modelo.',a:'Final A · escute.',b:'Final B · escute.'})[phase];},onEnd:()=>{if(trial!==t)return;t.playing=false;t.heard=true;$('ear-status').textContent='Sua vez. Responda ou ouça novamente.';update();}});}catch(error){if(trial!==t)return;t.playing=false;$('ear-status').textContent='Não foi possível iniciar o áudio. Tente Ouvir novamente. '+error.message;update();}
}
function stop(){const t=trial;player.stop();if(t){if(t.playing)t.heard=false;t.playing=false;if($('ear-status'))$('ear-status').textContent='Áudio interrompido. Ouça a pergunta inteira antes de confirmar.';update();}}
function hint(){const t=trial;if(!t||!t.heard||t.graded)return;t.help++;const movement={up:'ascendente',down:'descendente',same:'de notas repetidas',mixed:'com mudança de direção'}[A.contour(t.m.notes)];$('ear-help').textContent=t.help===1?`Ajuda 1: ${['progression','next-chord','cadence','completion'].includes(t.m.kind)?'ouça se o último acorde retoma o centro estabelecido por I.':['degree','tonic','closure','stability'].includes(t.m.kind)?'cante mentalmente a tônica da referência e compare a nota ou o final ouvido com esse centro.':'o movimento é '+movement+'.'} Esta tentativa ficará registrada como assistida, sem contar para domínio ou avanço da revisão.`:`Ajuda 2: ${t.m.kind==='melody'?'Notas: '+t.m.notes.map(d=>T.scale(t.task.key)[T.mod(d,7)].name).join(' → ')+'.':A.explanation(t.m)} Tentativa assistida.`;update();}
function confirm(){
 const t=trial;if(!t||t.graded||!t.heard||t.playing)return;const correct=t.m.kind==='melody'?A.assess(t.m.midi,t.input).correct:t.choice===t.m.answer;if(t.m.kind!=='melody'&&t.choice===null||t.m.kind==='melody'&&!t.input.length)return;
 const explanation=A.explanation(t.m,t.input),meta={skill:t.m.skill,instrument:t.instrument,correct,difficulty:t.level,session:t.run,question:StudyTheory.key(t.task),task:t.task,prompt:t.m.prompt,explanation,chosen:t.m.kind==='melody'?t.input.map(n=>T.tonics.Maior[T.mod(n)]).join(' → '):t.m.choices.find(c=>c[0]===t.choice)?.[1],...t.external,attemptId:t.external?.dailyId?t.external.dailyId+':daily:'+t.external.dailyStep:t.run+':tonal'};
 const accepted=t.help?store.observe(t.run,{kind:'assisted',text:explanation,helps:t.help},meta):store.record(meta);if(!accepted){$('ear-status').textContent='Atividade em pausa. Retome pelo treino diário.';return;}
 t.graded=true;t.correct=correct;if(!t.external?.dailyId)store.end(t.run,true);player.stop();const f=$('ear-feedback');f.className=t.help?'notice':correct?'result-success':'result-error';f.append(el('strong',t.help?'Tentativa assistida · sem nota':correct?'✓ Acertou!':'↻ Vamos comparar.'),el('p','Sua resposta: '+meta.chosen+'.'),el('p',explanation));
 if(t.m.kind!=='melody')f.append(el('p','Resposta: '+t.m.choices.find(c=>c[0]===t.m.answer)[1]+'.'));
 const compare=(answer)=>player.play(t.m,{reference:true,answer,onEnd:()=>{}}).catch(error=>{$('ear-status').textContent='Áudio indisponível: '+error.message;});
 f.append(button('Ouvir resposta correta',()=>compare(null),'ear-correct'));
 if(t.m.kind==='melody')f.append(button('Comparar minha resposta',()=>compare([...t.input]),'ear-compare'));
 else f.append(button('Ouvir exemplo da minha escolha',()=>player.play(A.alternative(t.m,t.choice)).catch(error=>{$('ear-status').textContent='Áudio indisponível: '+error.message;}),'ear-compare'));
 f.append(button(t.external?'Concluir atividade →':'Próximo exercício',()=>{if(t.external){const detail={...t.external,reason:'finished',answered:true,correct:t.help?null:t.correct};clear();window.dispatchEvent(new CustomEvent('study:task-end',{detail}));}else begin();},'ear-next','primary'));
 renderInstrument();update();window.dispatchEvent(new CustomEvent('study:attempt',{detail:{...meta,correct:t.help?null:correct}}));f.tabIndex=-1;f.focus({preventScroll:true});
}
window.addEventListener('studio:tonal-note',event=>{const t=trial,n=event.detail;if(!t||t.m.kind!=='melody'||!t.heard||t.playing||t.graded||n.instrument!==t.instrument)return;if(t.input.length>=16)return;t.input.push(n.midi);t.positions.push({...n,instrument:t.instrument});soundEngine.note(n.midi-48,t.instrument);renderInstrument();update();});
P.register('ear',{render,leave:clear});
window.TonalFeature={openSkill:skill=>{if(Object.hasOwn(A.skills,skill))prefs.skill=skill;const instrument=Studio.getInstrument();if(Object.hasOwn(instruments,instrument))prefs.instrument=instrument;P.show('ear');if($('ear-skill'))$('ear-skill').value=prefs.skill;},startTask:(task,ctx)=>{P.show('ear');begin(task,ctx);}};
window.addEventListener('studio:silence',()=>{if(P.getPage()==='ear')stop();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&P.getPage()==='ear')stop();});P.refresh();
})();
