/* Study planning and safe snapshots, independent from page navigation. */
(function(root){
'use strict';
const T=root.MusicTheory||(typeof require!=='undefined'?require('./theory.js'):null);
const R=root.RhythmTheory||(typeof require!=='undefined'?require('./rhythm-core.js'):null);
const instrumentNames=['guitar','piano','bass','general'];
function task(raw){
 if(!raw||!['notes','ear','degrees','field','build','scales','lesson','rhythm'].includes(raw.type))return null;
 const out={type:raw.type,key:Number.isInteger(raw.key)&&raw.key>=0&&raw.key<12?raw.key:0,scale:raw.scale==='Menor'?'Menor':'Maior'};
 for(const [name,min,max] of [['pc',0,11],['degree',1,7],['distance',1,12],['contrast',1,12],['chordRoot',0,11],['index',0,20],['difficulty',1,3]])if(raw[name]!==undefined){if(!Number.isInteger(raw[name])||raw[name]<min||raw[name]>max)return null;out[name]=raw[name];}
 if(out.type==='field')out.fieldFormat=raw.fieldFormat==='seventh'?'seventh':'triad';
 if(raw.chordType){if(!T.CHORD_TYPES[raw.chordType])return null;out.chordType=raw.chordType;}
 if(raw.position&&Number.isInteger(raw.position.string)&&Number.isInteger(raw.position.fret)&&raw.position.string>=0&&raw.position.string<6&&raw.position.fret>=0&&raw.position.fret<=20)out.position={string:raw.position.string,fret:raw.position.fret};
 if(['notes'].includes(out.type)&&out.pc===undefined)return null;
 if(['degrees','field'].includes(out.type)&&out.degree===undefined)return null;
 if(out.type==='ear'&&out.distance===undefined)return null;
 if(out.type==='build'&&(out.chordRoot===undefined||!out.chordType))return null;
 if(out.type==='lesson'&&out.index===undefined)return null;
 if(out.type==='lesson'){if(!/^[a-z-]{1,40}$/.test(raw.unit||''))return null;out.unit=raw.unit;}
 if(out.type==='rhythm'){if(!R.find(raw.pattern))return null;out.pattern=raw.pattern;out.mode=raw.mode==='reproduce'?'reproduce':'listen';}
 return out;
}
function key(raw){const t=task(raw);if(t){delete t.difficulty;delete t.contrast;}return t?JSON.stringify(Object.fromEntries(Object.entries(t).sort(([a],[b])=>a.localeCompare(b)))):'';}
function recommendation(record,previous={level:1,atAttempts:0}){
 const recent=record?.recent||[],total=record?.attempts||0,rate=recent.length?recent.filter(a=>a.correct).length/recent.length:0;
 const sessions=new Set(recent.map(a=>a.session)).size,unique=new Set(recent.map(a=>a.question)).size;
 let target=previous.level,reason='Ainda precisamos de variedade e resultados em mais de uma sessão.';
 if(recent.length>=5&&recent.slice(-5).filter(a=>!a.correct).length>=3){target=Math.max(1,previous.level-1);reason='Houve três ou mais erros entre as cinco respostas recentes; vamos reduzir um nível.';}
 else if(recent.length>=12&&sessions>=3&&unique>=6&&rate>=.85&&recent.filter(a=>a.difficulty>=2).length>=8){target=3;reason='Boa precisão recente em três sessões, perguntas variadas e nível intermediário.';}
 else if(recent.length>=8&&sessions>=2&&unique>=4&&rate>=.8){target=2;reason='Resultados consistentes em duas sessões e pelo menos quatro perguntas diferentes.';}
 if(total-(previous.atAttempts||0)<4&&previous.atAttempts)target=previous.level;
 const level=Math.max(1,Math.min(3,previous.level+Math.sign(target-previous.level)));
 return {level,reason,evidence:{attempts:recent.length,rate,sessions,unique}};
}
function plan(state,instrument,minutes,now=Date.now(),manual='auto'){
 const count={5:6,10:12,15:18}[minutes]||6,items=[],seen=new Set();
 const add=(descriptor,skill,label,source='practice',reviewId=null,difficulty=1)=>{const normalized=task(descriptor),fingerprint=key(normalized);if(!normalized||seen.has(fingerprint))return;seen.add(fingerprint);items.push({task:normalized,skill,label,source,reviewId,instrument:normalized.type==='rhythm'?'general':instrument,difficulty});};
 const due=(state.reviews||[]).filter(r=>(r.instrument===instrument||r.instrument==='general')&&r.due<=now).sort((a,b)=>a.due-b.due);
 for(const r of due.slice(0,Math.max(1,Math.floor(count/3))))add(r.task,r.skill,r.prompt,'review',r.id,r.difficulty);
 const weak=Object.entries(state.skills).filter(([k])=>k.startsWith(instrument+':')).sort(([,a],[,b])=>a.recent.filter(x=>x.correct).length/Math.max(1,a.recent.length)-b.recent.filter(x=>x.correct).length/Math.max(1,b.recent.length));
 const weakest=weak[0]?.[0].split(':')[1]||'notes';const evidence=weak[0]?.[1].recent||[],hasWeakness=evidence.length>=3&&evidence.filter(x=>x.correct).length/evidence.length<.8;
 const level=skill=>{const scope=skill.startsWith('rhythm-')?'general':instrument;return manual==='auto'?recommendation(state.skills[scope+':'+skill],state.auto?.[scope+':'+skill]).level:Number(manual);};
 const catalog=[];
 for(let i=0;i<7;i++){const n=T.scale(0)[i];catalog.push([{type:'notes',pc:n.pc},'notes','Localizar '+n.name],[{type:'degrees',degree:i+1},'degrees','Reconhecer o '+(i+1)+'º grau']);}
 for(const distance of (level('intervals')===1?[2,4,7,12]:level('intervals')===2?[2,3,4,5,7,12]:[1,2,3,4,5,6,7,8,9,10,11,12]))catalog.push([{type:'ear',distance},'intervals','Ouvir '+T.INTERVALS[distance]]);
 catalog.push([{type:'build',chordRoot:0,chordType:'major'},instrument==='bass'?'arpeggios':'chords',instrument==='bass'?'Arpejo de C':'Formar C'],[{type:'scales'},'scales','Uma oitava de C maior'],[{type:'rhythm',pattern:'pulse-4',mode:'listen'},'rhythm-perception','Reconhecer uma pulsação']);
 const prioritized=[...catalog.filter(c=>c[1]===weakest),...catalog.filter(c=>c[1]!==weakest)];
 // Alternate the weakest area with known foundations, avoiding an entire session of one question type.
 const queue=[];for(let i=0;i<catalog.length;i++){const pick=i%2===0?prioritized.shift():prioritized.pop();if(pick)queue.push(pick);}
 for(const [descriptor,skill,label] of queue){if(items.length>=count)break;add(descriptor,skill,label,skill===weakest&&hasWeakness?'weakness':level(skill)>1?'challenge':'foundation',null,level(skill));}
 const challenge=items.at(-1);if(challenge&&challenge.source!=='review'){challenge.source='challenge';if(challenge.task.type==='notes'){challenge.task.pc=1;challenge.label='Localizar Dó♯ · semitom acima de Dó';}if(challenge.task.type==='build'){challenge.task.chordType=challenge.difficulty===1?'minor':'7';challenge.label=(instrument==='bass'?'Arpejo':'Formação')+' de '+(challenge.difficulty===1?'Cm · compare a terça com C':'C7 · acrescente a sétima menor');}challenge.difficulty=Math.min(3,challenge.difficulty+1);}
 return {instrument,minutes,tasks:items.slice(0,count),estimated:true};
}
const api={task,key,recommendation,plan,instrumentNames};root.StudyTheory=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
