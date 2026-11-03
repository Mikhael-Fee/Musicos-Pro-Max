/* Rhythmic structure and analysis: no DOM, audio devices or assumed input latency. */
(function(root){
'use strict';
const patterns=[];
function add(id,title,meter,level,tokens){
 let at=0;const events=tokens.map(value=>{const event={beat:at,duration:Math.abs(value),rest:value<0};at+=Math.abs(value);return event;});
 if(at!==meter)throw Error('Compasso incompleto: '+id);
 patterns.push({id,title,meter,level,events});
}
for(const meter of [2,3,4]){
 add('pulse-'+meter,'Uma semínima em cada tempo',meter,1,Array(meter).fill(1));
 add('rest-'+meter,'Pausa no segundo tempo',meter,1,Array.from({length:meter},(_,i)=>i===1?-1:1));
 add('pickup-'+meter,'Silêncio no primeiro tempo; entrada no segundo',meter,1,[-1,...Array(meter-1).fill(1)]);
 add('half-'+meter,meter===3?'Mínima e semínima':'Mínimas: dois tempos por nota',meter,1,meter===3?[2,1]:Array(meter/2).fill(2));
 add('eighth-'+meter,'Duas colcheias no primeiro tempo',meter,2,[.5,.5,...Array(meter-1).fill(1)]);
 add('sync-'+meter,'Pausa de colcheia e entrada no contratempo',meter,2,[-.5,.5,...Array(meter-1).fill(1)]);
 add('sixteenth-'+meter,'Quatro semicolcheias no primeiro tempo',meter,3,[.25,.25,.25,.25,...Array(meter-1).fill(1)]);
 add('mixed-'+meter,'Duas colcheias, pausa e semicolcheias',meter,3,[.5,.5,-.5,.25,.25,...Array(meter-2).fill(1)]);
}
const find=id=>patterns.find(p=>p.id===id);
const onsets=p=>p.events.filter(e=>!e.rest).map(e=>e.beat);
const signature=p=>p.meter+':'+onsets(p).join(',');
function timeline(pattern,bpm,start=0){const beat=60/bpm;return pattern.events.filter(e=>!e.rest).map(e=>({at:start+e.beat*beat,duration:e.duration*beat,beat:e.beat}));}
function choices(target,level=3){const used=new Set([signature(target)]);const others=patterns.filter(p=>{if(p.id===target.id||p.meter!==target.meter||p.level>level||used.has(signature(p)))return false;used.add(signature(p));return true;});return [target,...others.slice(0,3)];}
function median(values){const sorted=[...values].sort((a,b)=>a-b);const n=sorted.length;return n?(sorted[Math.floor((n-1)/2)]+sorted[Math.ceil((n-1)/2)])/2:0;}
function calibration(taps,targets){
 if(taps.length!==targets.length||taps.length<8)return {valid:false,reason:'Faça todos os toques da referência para calcular uma estimativa.'};
 const differences=taps.slice(2).map((t,i)=>t-targets[i+2]);const offset=median(differences),spread=median(differences.map(v=>Math.abs(v-offset)));
 return {valid:Math.abs(offset)<=.3&&spread<=.06,offset,spread,samples:differences.length,reason:'Estimativa conjunta de resposta humana e dispositivo; não é uma medição certificada de latência.'};
}
function assess(pattern,taps,bpm,{interrupted=false}={}){
 const expected=onsets(pattern),beat=60/bpm;
 if(interrupted)return {correct:null,kind:'ungraded',text:'A atividade foi interrompida. Nenhuma nota de execução foi atribuída.'};
 if(taps.length!==expected.length)return {correct:false,kind:'count',text:`O modelo tem ${expected.length} ataques e foram registrados ${taps.length}. Conte os ataques e respeite as pausas; não avaliamos atraso técnico.`};
 const reference=expected.map(v=>(v-expected[0])*beat),relative=taps.map(v=>v-taps[0]);
 const deviations=relative.map((v,i)=>Math.abs(v-reference[i]));
 if(Math.max(...deviations)<=Math.max(.12,beat*.28))return {correct:true,kind:'structure',text:'Quantidade e espaçamento relativo compatíveis com o modelo. Atraso constante foi desconsiderado. Isso não é uma nota de precisão temporal.'};
 return {correct:null,kind:'ungraded',text:'A quantidade de ataques corresponde; os espaçamentos diferem do modelo. Compare e tente novamente. Sem validação da latência, não atribuímos erro de precisão.'};
}
function notation(pattern){return pattern.events.map(e=>(e.rest?'Pausa ':'')+({2:'mínima (2 tempos)',1:'semínima (1 tempo)',.5:'colcheia (½ tempo)',.25:'semicolcheia (¼ tempo)'}[e.duration]||e.duration+' tempos')).join(' · ');}
const api={patterns,find,onsets,signature,timeline,choices,median,calibration,assess,notation};root.RhythmTheory=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
