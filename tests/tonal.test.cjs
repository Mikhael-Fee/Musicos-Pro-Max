const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../assets/tonal-core.js'),S=require('../assets/study-core.js'),P=require('../assets/progress.js'),T=require('../assets/theory.js');
function fixture(){const values={};const storage={getItem:k=>values[k]??null,setItem:(k,v)=>values[k]=v};let now=1000000;return {storage,values,store:P.create(storage,{now:()=>now}),advance:ms=>now+=ms};}
test('every original task transposes identically in 12 major keys and fits the three virtual instruments',()=>{
 assert.ok(A.bank.length>=60);
 for(const p of A.bank){assert.equal(new Set(p.choices.map(c=>c[0])).size,p.choices.length);if(p.kind!=='melody')assert.ok(p.choices.some(c=>c[0]===p.answer),p.id);
  for(let key=0;key<12;key++)for(const instrument of ['guitar','piano','bass']){const task=S.task({type:'tonal',pattern:p.id,key}),m=A.material(task,instrument);assert.deepEqual(m.midi.map(n=>n-m.base),p.notes.map(A.offset));assert.ok(m.midi.every(n=>T.scale(key).some(t=>t.pc===T.mod(n))));if(instrument==='bass')assert.ok(m.midi.every(n=>n>=28&&n<=63),p.id);if(instrument==='guitar')assert.ok(m.midi.every(n=>n>=40&&n<=76));}
 }
 assert.equal(S.task({type:'tonal',pattern:'unknown',key:0}),null);assert.equal(S.task({type:'tonal',pattern:A.bank[0].id,key:12}),null);
});
test('contours distinguish direction, repeats, internal repetitions and returns',()=>{
 for(const [notes,expected] of [[[0,2],'up'],[[4,0],'down'],[[1,1],'same'],[[0,0,2],'up'],[[0,2,0],'mixed'],[[4,2,1,0],'down']])assert.equal(A.contour(notes),expected);
 for(const p of A.bank.filter(p=>p.kind==='contour'))assert.equal(p.answer,A.contour(p.notes));
 for(const p of A.bank.filter(p=>p.kind==='return'))assert.equal(p.answer,p.notes[0]===p.notes.at(-1)?'yes':'no');
});
test('melody validation accepts alternate fingerings and a whole-octave shift while separating pitch, order, direction and count',()=>{
 const expected=[48,52,55];assert.equal(A.assess(expected,[36,40,43]).correct,true);assert.equal(A.assess(expected,[60,64,67]).octaveShift,12);assert.equal(A.assess(expected,[48,55,52]).order,true);assert.equal(A.assess(expected,[48,55,52]).direction,false);assert.equal(A.assess(expected,[48,53,55]).pitch,false);assert.equal(A.assess(expected,[48,52]).count,false);assert.equal(A.assess(expected,[48,64,55]).correct,false);assert.equal(A.assess([48,48,50],[48,48,50]).correct,true);assert.equal(A.assess(expected,[]).correct,false);
});
test('four pedagogical levels contain separate skills and each skill has gradual, nonempty difficulty pools',()=>{
 for(const skill of Object.keys(A.skills))for(let level=1;level<=3;level++){const task=A.choose(skill,5,level,()=>0),m=A.material(task);assert.equal(m.skill,skill);assert.equal(m.level,level);assert.notEqual(A.choose(skill,5,level,()=>0,task.pattern).pattern,task.pattern);}
 const lengths=level=>A.bank.filter(p=>p.skill==='tonal-melody'&&p.level===level).map(p=>p.notes.length);assert.ok(lengths(1).every(n=>n===3));assert.ok(lengths(2).every(n=>n>=4&&n<=5));assert.ok(lengths(3).every(n=>n>=6));
});
test('tonal reviews persist exact key and phrase; assisted attempts do not create mastery or advance a review',()=>{
 const f=fixture(),task=A.choose('tonal-melody',7,1,()=>0),meta={skill:'tonal-melody',instrument:'bass',difficulty:1,question:S.key(task),task,prompt:'Reproduza',explanation:'Modelo',chosen:'Notas'};
 const first=f.store.begin(meta.skill,'bass');f.store.record({...meta,session:first,correct:false});f.store.end(first,true);f.advance(600001);
 const run=f.store.begin(meta.skill,'bass'),review=f.store.get().reviews[0];f.store.observe(run,{kind:'assisted'},{...meta,session:run,reviewId:review.id});assert.equal(f.store.get().skills['bass:tonal-melody'].attempts,1);assert.equal(f.store.get().reviews[0].step,0);
 f.store.record({...meta,session:run,reviewId:review.id,correct:true});const restored=P.create(f.storage).get();assert.deepEqual(restored.reviews[0].task,task);assert.equal(restored.reviews[0].step,1);assert.equal(restored.skills['bass:tonal-melody'].attempts,2);
});
test('new daily plans mix one tonal task with foundations without changing existing saved plans',()=>{
 const f=fixture();const old={instrument:'bass',minutes:5,tasks:[{task:S.task({type:'notes',pc:0}),skill:'notes',instrument:'bass'}]};f.store.startDaily(old);const saved=f.store.get().dailyPlans[0];
 for(let rotation=0;rotation<5;rotation++){const state=f.store.get();state.dailyPlans=Array(rotation).fill(saved);const p=S.plan(state,'bass',5);assert.equal(p.tasks.length,6);assert.equal(p.tasks.filter(t=>t.task.type==='tonal').length,1);assert.equal(new Set(p.tasks.map(t=>S.key(t.task))).size,p.tasks.length);}
 assert.deepEqual(P.create(f.storage).get().dailyPlans[0].tasks,saved.tasks);
});
test('post-attempt alternatives preserve tonal context and every completion includes its correct degree',()=>{
 for(const p of A.bank.filter(p=>p.kind!=='melody'))for(const [value] of p.choices){const m=A.material({pattern:p.id,key:8},'bass'),alt=A.alternative(m,value);assert.equal(alt.key,8);assert.ok(alt.notes.length>0);assert.ok(alt.midi.every(n=>T.scale(8).some(t=>t.pc===T.mod(n))));}
 for(const p of A.bank.filter(p=>p.kind==='completion'))assert.equal(p.answer,String(p.notes.at(-1)));
});
test('every skill can progress through both adaptive thresholds in a fixed key',()=>{
 for(const skill of Object.keys(A.skills)){
  const pool=A.bank.filter(p=>p.skill===skill&&p.level===1);assert.ok(pool.length>=4,skill);
  const recent=Array.from({length:8},(_,i)=>({correct:true,difficulty:1,session:'s'+Math.floor(i/4),question:S.key({type:'tonal',pattern:pool[i%4].id,key:0})}));assert.equal(S.recommendation({attempts:8,recent}).level,2,skill);
 }
 for(const skill of Object.keys(A.skills)){
  const pool=A.bank.filter(p=>p.skill===skill&&p.level===2);assert.ok(pool.length>=6,skill);
  const recent=Array.from({length:12},(_,i)=>({correct:true,difficulty:2,session:'s'+Math.floor(i/4),question:S.key({type:'tonal',pattern:pool[i%6].id,key:0})}));assert.equal(S.recommendation({attempts:20,recent},{level:2,atAttempts:8}).level,3,skill);
 }
 const m=A.material({pattern:'degree-context-0',key:6});assert.equal(m.answer,'2');assert.match(A.explanation(m),/3º grau/);assert.match(A.explanation(m),/última nota/);
});
