/* Original listening material. Degrees are zero-based, with 7 the upper tonic. */
(function(root){
'use strict';
const T=root.MusicTheory||(typeof require!=='undefined'?require('./theory.js'):null);
const skills={'tonal-direction':'Direção melódica','tonal-center':'Centro tonal','tonal-degrees':'Graus pelo ouvido','tonal-harmony':'Percepção harmônica','tonal-melody':'Reprodução de melodias'};
const steps=[0,2,4,5,7,9,11],roman=['I','ii','iii','IV','V','vi','vii°'];
const bank=[];
const add=(id,skill,level,notes,kind,answer,choices,prompt)=>bank.push({id,skill,level,notes,kind,answer,choices,prompt});
const contourChoices=[['up','Ascendente'],['down','Descendente'],['same','Nota repetida'],['mixed','Mudança de direção']];
function contour(notes){const signs=notes.slice(1).map((n,i)=>Math.sign(n-notes[i])).filter(Boolean);return !signs.length?'same':signs.every(s=>s>0)?'up':signs.every(s=>s<0)?'down':'mixed';}
const yesNo=[['yes','Sim'],['no','Não']];
for(const [level,phrases] of [[1,[[0,1],[2,0],[4,4],[1,4],[5,2]]],[2,[[0,1,2],[4,2,0],[0,2,1],[2,2,2],[0,1,0]]],[3,[[0,2,4,2,0],[0,1,2,4,5],[5,4,2,1,0],[0,2,1,3,2],[1,1,1,1]]]])phrases.forEach((notes,i)=>add(`direction-${level}-${i}`,'tonal-direction',level,notes,'contour',contour(notes),level===1?contourChoices.slice(0,3):contourChoices,'Qual foi a direção da frase? Ignore repetições entre movimentos.'));
for(const [i,notes] of [[0,2,1,0],[0,2,1,3],[0,1,4,2,0],[0,2,4,3,1]].entries())add(`return-${i}`,'tonal-direction',i<2?2:3,notes,'return',notes[0]===notes.at(-1)?'yes':'no',yesNo,'A frase retornou à nota inicial?');
for(const [i,notes] of [[2,1,0],[0,2,1],[4,2,0],[0,4,6],[0,1,2,1,0],[0,2,4,3,1]].entries())add(`center-${i}`,'tonal-center',1+i%3,notes,'closure',notes.at(-1)===0?'yes':'no',yesNo,'Nesta frase, com referência em I, o final voltou à tônica?');
for(let i=0;i<4;i++){const notes=i%2?[6,0]:[0,6];add(`stable-${i}`,'tonal-center',2+i%2,notes,'stability',i%2?'b':'a',[['a','Final A'],['b','Final B']],'Ouça os finais A e B sobre o acorde I. Qual repousa na tônica?');}
for(const [i,notes] of [[0,4,0],[0,3,4],[0,3,4,0],[0,5,3,4]].entries())add(`cadence-${i}`,'tonal-center',2+i%2,notes,'cadence',notes.at(-1)===0?'yes':'no',yesNo,'A pequena cadência terminou na tônica?');
for(let degree=0;degree<7;degree++)for(const level of [1,2,3]){if(level===1&&![0,2,4].includes(degree))continue;add(`degree-${level}-${degree}`,'tonal-degrees',level,[degree],'degree',String(degree),[0,1,2,3,4,5,6].filter(d=>level!==1||[0,2,4].includes(d)).map(d=>[String(d),`${d+1}º grau`]),'Qual grau você ouviu depois da referência tonal?');}
for(const [i,notes] of [[0,2],[4,0],[0,4]].entries())add(`degree-context-${i}`,'tonal-degrees',1,notes,'degree',String(notes.at(-1)),[0,2,4].map(d=>[String(d),`${d+1}º grau`]),'Qual grau foi a última nota da pequena frase?');
const progressions=[[0,4,0],[0,3,0],[0,3,4,0],[0,5,3,4],[1,4,0],[0,5,1,4],[0,3,1,4,0],[0,2,5,1,4,0]];
progressions.forEach((notes,i)=>{const level=i<2?1:i<5?2:3;const options=progressions.filter((p,j)=>p.length===notes.length&&(i>1||j<2));add(`harmony-${i}`,'tonal-harmony',level,notes,'progression',notes.join('-'),(options.length>1?options:[notes,notes.map((d,j)=>j===notes.length-1?(d===0?4:0):d),notes.map((d,j)=>j===1?(d===3?5:3):d)]).map(p=>[p.join('-'),p.map(d=>roman[d]).join(' → ')]),'Qual movimento harmônico você ouviu?');});
for(const [i,notes] of [[0,4,0],[0,3,0],[0,3,4,0],[0,5,3,4]].entries()){add(`next-chord-${i}`,'tonal-harmony',i<2?1:2,notes,'next-chord',String(notes.at(-1)),[0,3,4,5].map(d=>[String(d),roman[d]]),'Qual grau foi o último acorde?');}
for(const [level,phrases] of [[1,[[0,1,0],[0,2,4],[2,2,0],[4,2,0]]],[2,[[0,1,2,0],[0,2,1,4],[4,3,2,1,0],[0,0,2,1,0],[0,2,3,2,0],[2,1,0,1,2]]],[3,[[0,1,2,4,3,1,0],[0,2,4,5,4,2,0],[4,2,3,1,2,0],[0,0,1,2,4,2,0]]]])phrases.forEach((notes,i)=>add(`melody-${level}-${i}`,'tonal-melody',level,notes,'melody',null,[],'Ouça, memorize e reproduza a frase no instrumento.'));
for(const [i,d] of [0,2,4,0,6,1].entries())add(`tonic-${i}`,'tonal-center',1+i%3,[d],'tonic',d===0?'yes':'no',yesNo,'Depois da referência, a nota ouvida é a tônica?');
for(const [i,notes] of progressions.slice(0,4).entries())add(`complete-${i}`,'tonal-harmony',i<2?2:3,notes,'completion',String(notes.at(-1)),[0,3,4,5].map(d=>[String(d),roman[d]]),'Ouça o modelo completo e depois o trecho sem o final. Qual grau completa como no modelo?');
function offset(degree){return steps[T.mod(degree,7)]+12*Math.floor(degree/7);}
function register(key,instrument){return instrument==='bass'?(key<4?36:24)+key:48+key;}
function descriptor(raw){const p=bank.find(p=>p.id===raw?.pattern);if(!p||!Number.isInteger(raw.key)||raw.key<0||raw.key>11)return null;return {type:'tonal',key:raw.key,scale:'Maior',pattern:p.id,difficulty:p.level};}
function material(task,instrument='piano'){const p=bank.find(p=>p.id===task.pattern);if(!p)return null;const base=register(task.key,instrument);return {...p,key:task.key,base,midi:p.notes.map(d=>base+offset(d))};}
function choose(skill,key,level,random=Math.random,exclude=null){const pool=bank.filter(p=>p.skill===skill&&p.level===level&&p.id!==exclude);const p=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];return descriptor({pattern:p.id,key});}
function assess(expected,actual){
 const normalized=actual.length?actual.map(n=>n-actual[0]):[];const target=expected.map(n=>n-expected[0]);
 const pitch=actual.length>0&&T.mod(actual[0])===T.mod(expected[0])&&actual.every((n,i)=>i<expected.length&&T.mod(n)===T.mod(expected[i]));
 const direction=actual.length===expected.length&&actual.slice(1).every((n,i)=>Math.sign(n-actual[i])===Math.sign(expected[i+1]-expected[i]));
 const sameBag=actual.length===expected.length&&actual.map(n=>T.mod(n)).sort((a,b)=>a-b).join()===expected.map(n=>T.mod(n)).sort((a,b)=>a-b).join();
 const exact=actual.length===expected.length&&normalized.every((n,i)=>n===target[i])&&pitch;
 return {correct:exact,count:actual.length===expected.length,pitch,direction,order:sameBag&&!pitch,octaveShift:exact?actual[0]-expected[0]:null};
}
function degreeNames(p){return p.notes.map(d=>(T.mod(d,7)+1)+'º').join(' → ');}
function alternative(p,value){
 let notes;
 if(p.kind==='degree')notes=[...p.notes.slice(0,-1),Number(value)];
 else if(p.kind==='progression')notes=value.split('-').map(Number);
 else if(['next-chord','completion'].includes(p.kind))notes=[...p.notes.slice(0,-1),Number(value)];
 else if(p.kind==='stability')notes=[p.notes[value==='a'?0:1]];
 else if(p.kind==='contour')notes=bank.find(c=>c.kind==='contour'&&c.answer===value).notes;
 else{notes=[...p.notes];notes[notes.length-1]=value==='yes'?(p.kind==='return'?notes[0]:0):(p.kind==='return'?T.mod(notes[0]+1,7):1);}
 return {...p,notes,midi:notes.map(d=>p.base+offset(d))};
}
function explanation(p,actual=[]){
 const names=T.scale(p.key).map(n=>n.name);const sequence=p.notes.map(d=>names[T.mod(d,7)]).join(' → ');const movement={up:'ascendente',down:'descendente',same:'repetido',mixed:'com mudança de direção'}[contour(p.notes)];
 if(p.kind==='melody'){const r=assess(p.midi,actual);return `Modelo: ${sequence} (${degreeNames(p)}). ${r.correct?'Intervalos e ordem preservados, inclusive em outra oitava.':!r.count?`Quantidade: esperávamos ${p.midi.length} notas; você tocou ${actual.length}.`:r.order?'Ordem: as classes de notas estão presentes, mas em outra sequência.':!r.pitch?'Altura: há notas diferentes do modelo.':!r.direction?'Direção: confira os movimentos entre as notas.':'Registro relativo: preserve também os saltos e repetições, sem mudar oitavas no meio da frase.'} ${!r.correct&&!r.direction?'A direção de um ou mais movimentos difere do modelo. ':''}Compare os áudios; não é uma avaliação de ritmo ou digitação.`;}
 if(['cadence','progression','next-chord','completion'].includes(p.kind))return `Movimento: ${p.notes.map(d=>roman[d]).join(' → ')}. Acordes: ${p.notes.map(d=>T.chord(p.key,'Maior',d+1).name).join(' → ')}. ${p.notes.at(-1)===0?'O final retorna a I, centro estabelecido pela referência.':'O final permanece fora de I; neste contexto a frase pede continuação.'} IV e ii podem preparar V; V pode conduzir a I. Essas funções dependem do contexto.`;
 if(p.kind==='tonic')return `${sequence} ${p.answer==='yes'?'é':'não é'} a tônica em ${names[0]} maior: é o ${p.notes[0]+1}º grau. O centro foi estabelecido pela referência harmônica; não por uma frequência absoluta.`;
 if(p.kind==='degree')return `A última nota, ${names[T.mod(p.notes.at(-1),7)]}, é o ${p.notes.at(-1)+1}º grau em ${names[0]} maior. A relação com a tônica, não a frequência absoluta, identifica o grau. Frase: ${sequence}. Distância da última nota: ${offset(p.notes.at(-1))} semitons desde a tônica.`;
 if(p.kind==='stability')return `O final ${p.answer.toUpperCase()} é a tônica. Com o acorde I como apoio, o 7º grau tende a resolver um semitom acima. Essa sensação depende da harmonia e da condução da frase.`;
 return `Frase: ${sequence}; graus ${degreeNames(p)}. Movimento ${movement}. ${['closure','tonic'].includes(p.kind)?'Neste exemplo a referência em I estabelece o centro; terminar na tônica favorece repouso, e outros finais podem sugerir continuação. Não é uma propriedade fixa de cada nota.':p.notes[0]===p.notes.at(-1)?'A frase retorna à primeira nota.':'O final difere da primeira nota.'} Passos em semitons: ${p.midi.slice(1).map((n,i)=>n-p.midi[i]).join(', ')}.`;
}
const api={skills,bank,roman,offset,register,descriptor,material,choose,assess,contour,alternative,explanation};root.TonalTheory=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
