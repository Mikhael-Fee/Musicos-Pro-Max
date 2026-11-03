const {test}=require('node:test'),assert=require('node:assert/strict');
const T=require('../assets/theory.js'),B=require('../assets/bass.js'),{create,KEY}=require('../assets/progress.js');
function storage(initial={}){const map=new Map(Object.entries(initial));return {map,getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};}
test('bass tuning and all 24 automatic scale positions use real sounding notes',()=>{
 assert.deepEqual(B.TUNING,[28,33,38,43]);
 for(let root=0;root<12;root++)for(const mode of ['Maior','Menor']){
 const ns=T.scale(root,mode),path=B.ascendingPath(ns);assert.equal(path.length,8);
 assert.deepEqual(path.map(n=>n.midi-path[0].midi),[...ns.map(n=>n.offset),12]);
 assert.ok(path.every(n=>n.midi===B.TUNING[n.string]+n.fret&&n.fret>=0&&n.fret<=20&&n.instrument==='bass'));
 }
});
test('bass arpeggios preserve every chord formula and lines contain four monophonic attacks',()=>{
 for(let root=0;root<12;root++)for(const type of Object.keys(T.CHORD_TYPES)){
 const chord=T.buildChord(root,type),arp=B.arpeggio(chord);assert.equal(arp.length,chord.notes.length);
 assert.deepEqual(arp.map(n=>n.midi-arp[0].midi),chord.intervals);
 assert.ok(arp.every(n=>n.midi===B.TUNING[n.string]+n.fret&&n.fret<=20));
 }
 assert.deepEqual(B.line(T.chord(0,'Maior',7),'fifth').map(n=>n.midi%12),[11,5,11,5]);
 for(const pattern of ['root','fifth','third','triad','seventh']){const line=B.line(T.chord(0,'Maior',1,true),pattern);assert.equal(line.length,4);assert.ok(line.every(Boolean));}
});
test('progress imports legacy once, separates skills/instruments and survives reload',()=>{
 const memory=storage({'musicospromax.stats.v1':JSON.stringify({attempts:12,correct:8,sessions:1})});
 let p=create(memory);assert.equal(p.get().legacy.attempts,12);const id=p.begin('notes','bass');p.record({skill:'notes',instrument:'bass',correct:true,session:id,question:'C'});p.end(id,true);p.lesson('notes','bass',.75);
 memory.setItem('musicospromax.stats.v1',JSON.stringify({attempts:13,correct:9,sessions:1}));p=create(memory);
 assert.equal(p.get().legacy.attempts,12);assert.equal(p.get().skills['bass:notes'].correct,1);assert.equal(p.get().skills['guitar:notes'],undefined);assert.equal(p.get().lessons['bass:notes'].completed,true);assert.equal(p.get().sessions.length,1);
 p.end(id,true);assert.equal(p.get().sessions.length,1);
});
test('consistency requires varied recent results, difficulty and multiple sessions',()=>{
 const p=create(storage()),id=p.begin('notes','bass');
 for(let i=0;i<12;i++)p.record({skill:'notes',instrument:'bass',correct:true,difficulty:1,session:id,question:'C'});
 assert.equal(p.status(p.get().skills['bass:notes']),'Em aprendizagem');
 const second=p.begin('notes','bass');for(let i=0;i<8;i++)p.record({skill:'notes',instrument:'bass',correct:true,difficulty:2,session:second,question:String(i)});
 assert.equal(p.status(p.get().skills['bass:notes']),'Consistente');
});
test('unknown data is preserved and denied storage does not prevent practice',()=>{
 const raw=JSON.stringify({version:99,important:'keep'}),memory=storage({[KEY]:raw}),p=create(memory);p.begin('notes','bass');assert.equal(memory.getItem(KEY),raw);assert.equal(p.writable,false);
 const unavailable=create({getItem(){throw Error('denied');},setItem(){throw Error('denied');}});const id=unavailable.begin('notes','bass');unavailable.record({skill:'notes',instrument:'bass',session:id,correct:true,question:'E'});assert.equal(unavailable.get().skills['bass:notes'].attempts,1);
});

test('a page reload marks an unfinished session interrupted without losing its answers',()=>{
 const memory=storage(),p=create(memory),id=p.begin('intervals','bass','challenge',2);
 p.record({skill:'intervals',instrument:'bass',correct:false,session:id,question:'2'});
 const restored=create(memory);assert.equal(restored.get().sessions[0].interrupted,true);assert.equal(restored.get().sessions[0].completed,false);assert.equal(restored.get().skills['bass:intervals'].attempts,1);
});

test('session instrumentation follows actual answers and partial lessons do not earn completion',()=>{
 const memory=storage(),p=create(memory),id=p.begin('notes','guitar');p.record({skill:'notes',instrument:'bass',correct:true,session:id,question:'C'});assert.deepEqual(p.get().sessions[0].instruments,['bass']);assert.equal(p.get().sessions[0].instrument,'bass');
 p.lesson('notes','bass',1,2);assert.equal(p.get().lessons['bass:notes'].completed,false);
});
