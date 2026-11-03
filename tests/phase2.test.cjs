const {test}=require('node:test');const assert=require('node:assert/strict');
const R=require('../assets/rhythm-core.js'),S=require('../assets/study-core.js'),P=require('../assets/progress.js');
const memory=(initial={})=>{const values={...initial};return {getItem:k=>values[k]??null,setItem:(k,v)=>values[k]=v,values};};
function fixture(initial){let time=1_800_000_000_000;const storage=memory(initial),store=P.create(storage,{now:()=>time});return {storage,store,time:()=>time,advance:n=>time+=n};}
function wrong(store,extra={}){const session=store.begin('intervals','bass');store.record({skill:'intervals',instrument:'bass',correct:false,difficulty:2,session,question:'third',task:{type:'ear',distance:3,contrast:4},prompt:'Qual terça?',explanation:'A terça menor tem três semitons.',chosen:'Terça maior',...extra});store.end(session,true);return store.get().reviews[0];}
test('all rhythm patterns fill their meter with valid figures and silence, with audibly distinct choices',()=>{
 assert.equal(R.patterns.length,24);for(const p of R.patterns){assert.equal(p.events.reduce((a,e)=>a+e.duration,0),p.meter);assert.ok(p.events.every(e=>[.25,.5,1,2].includes(e.duration)));assert.ok(R.onsets(p).length);const choices=R.choices(p,p.level);assert.ok(choices.length>=3);assert.equal(new Set(choices.map(R.signature)).size,choices.length);assert.ok(choices.every(c=>c.meter===p.meter));assert.ok(R.notation(p).length>10);}
 assert.deepEqual(R.timeline(R.find('sync-4'),120,10).map(n=>n.at),[10.25,10.5,11,11.5]);
 assert.deepEqual(R.timeline(R.find('sixteenth-2'),60,0).map(n=>n.at),[0,.25,.5,.75,1]);
});
test('tap assessment ignores fixed latency, separates structure from precision, and never grades interruptions',()=>{
 const p=R.find('eighth-4');assert.equal(R.assess(p,[30,30.25,30.5,31,31.5],120).correct,true);
 assert.equal(R.assess(p,[30,30.25,30.5,31,31.5].map(v=>v+.47),120).correct,true);
 assert.equal(R.assess(p,[0,1,2,3,4],120).correct,null);assert.equal(R.assess(p,[0,1],120).kind,'count');assert.equal(R.assess(p,[],120,{interrupted:true}).correct,null);
 const targets=Array.from({length:12},(_,i)=>i*.75);const cal=R.calibration(targets.map(x=>x+.08),targets);assert.equal(cal.valid,true);assert.ok(Math.abs(cal.offset-.08)<1e-8);assert.equal(R.calibration([0,1],[0,1]).valid,false);assert.equal(R.calibration(targets.map(x=>x+1),targets).valid,false);
});
test('version 1 migrates once with an exact backup, preserving lessons, instruments, old totals and settings',()=>{
 const prior={version:1,legacy:{attempts:20,correct:10,sessions:3},serial:3,skills:{'bass:notes':{attempts:2,correct:1,recent:[{correct:false,difficulty:1,session:'old',question:'C'}]}},lessons:{'piano:notes':{completed:true,best:1,updated:'2026-01-01'}},sessions:[{id:'old',skill:'notes',instrument:'bass',attempts:2,correct:1,ended:true,completed:true}]};
 const raw=JSON.stringify(prior),f=fixture({[P.KEY]:raw,'musicospromax.settings.v2':'preferences'});assert.equal(f.store.get().version,2);assert.deepEqual(f.store.get().legacy,prior.legacy);assert.equal(f.store.get().lessons['piano:notes'].completed,true);assert.equal(f.store.get().skills['bass:notes'].attempts,2);assert.equal(f.storage.values[P.BACKUP],raw);assert.equal(f.store.get().reviews.length,0);P.create(f.storage);assert.equal(f.storage.values[P.BACKUP],raw);assert.equal(f.storage.values['musicospromax.settings.v2'],'preferences');
});
test('future versions and malformed records are not overwritten',()=>{
 for(const raw of ['{ broken',JSON.stringify({version:99,skills:{},lessons:{},sessions:[]})]){const f=fixture({[P.KEY]:raw});assert.equal(f.store.writable,false);f.store.begin('notes','bass');assert.equal(f.storage.values[P.KEY],raw);}
});
test('reviews keep the actual question, deduplicate contrasts, and space only due answers in separate sessions',()=>{
 const f=fixture(),r=wrong(f.store);assert.equal(r.task.distance,3);assert.equal(r.task.contrast,4);assert.equal(r.instrument,'bass');assert.equal(r.due,f.time()+600000);
 wrong(f.store,{task:{type:'ear',distance:3,contrast:5}});assert.equal(f.store.get().reviews.length,1);assert.equal(f.store.get().reviews[0].failures,2);
 const answer=(instrument='bass')=>{const sid=f.store.begin('intervals',instrument);f.store.record({skill:'intervals',instrument,correct:true,session:sid,question:'third',task:r.task,reviewId:r.id});f.store.end(sid,true);};
 answer();assert.equal(f.store.get().reviews[0].step,0);f.advance(600001);answer('piano');assert.equal(f.store.get().reviews[0].step,0);
 answer();let item=f.store.get().reviews[0];assert.equal(item.step,1);assert.equal(item.due,f.time()+86400000);
 answer();assert.equal(f.store.get().reviews[0].step,1);f.advance(86400001);answer();item=f.store.get().reviews[0];assert.equal(item.step,2);assert.equal(item.due,f.time()+3*86400000);
 f.advance(3*86400000+1);answer();assert.equal(f.store.get().reviews[0].due,f.time()+7*86400000);
});
test('adaptive difficulty requires recent variety and multiple sessions and changes one level at a time',()=>{
 const record={attempts:20,recent:Array.from({length:20},(_,i)=>({correct:true,difficulty:2,question:'q'+(i%6),session:'s'+(i%3)}))};assert.equal(S.recommendation(record).level,2);assert.equal(S.recommendation(record,{level:2,atAttempts:16}).level,3);assert.equal(S.recommendation(record,{level:2,atAttempts:19}).level,2);
 assert.equal(S.recommendation({...record,recent:record.recent.map(x=>({...x,question:'one',session:'one'}))}).level,1);
 const errors={attempts:5,recent:Array.from({length:5},()=>({correct:false,question:'q',session:'s',difficulty:2}))};assert.equal(S.recommendation(errors,{level:3,atAttempts:0}).level,2);
});
test('daily plans combine real reviews and varied tasks, obey manual difficulty and avoid duplicates',()=>{
 const f=fixture();wrong(f.store);f.advance(600001);for(const minutes of [5,10,15]){const plan=S.plan(f.store.get(),'bass',minutes,f.time(),'2');assert.equal(plan.tasks.length,{5:6,10:12,15:18}[minutes]);assert.ok(plan.tasks.some(t=>t.source==='review'));assert.ok(plan.tasks.some(t=>t.source==='challenge'));assert.equal(new Set(plan.tasks.map(t=>S.key(t.task))).size,plan.tasks.length);assert.ok(plan.tasks.every(t=>t.source==='review'||t.difficulty>=2));assert.ok(new Set(plan.tasks.map(t=>t.skill)).size>=3);}
});
test('daily results and next objective persist atomically, pause and reload preserve progress, duplicates do not count',()=>{
 const f=fixture(),plan=S.plan(f.store.get(),'bass',5,f.time());const id=f.store.startDaily(plan),meta={session:id,dailyId:id,dailyStep:0,attemptId:id+':daily:0',skill:'notes',instrument:'bass',correct:true,question:'C',task:{type:'notes',pc:0}};
 assert.equal(f.store.record(meta),true);assert.equal(f.store.record(meta),false);assert.equal(f.store.get().dailyPlans[0].index,1);assert.equal(f.store.get().sessions[0].attempts,1);
 f.advance(10000);f.store.pauseDaily(id);assert.equal(f.store.record({...meta,dailyStep:1,attemptId:'next'}),false);assert.ok(f.store.get().dailyPlans[0].elapsedMs>=10000);
 const reload=P.create(f.storage,{now:f.time});assert.equal(reload.get().dailyPlans[0].index,1);reload.resumeDaily(id);for(let i=1;i<plan.tasks.length;i++)assert.equal(reload.record({...meta,dailyStep:i,attemptId:id+':daily:'+i,question:'n'+i}),true);
 assert.equal(reload.get().dailyPlans[0].status,'completed');assert.equal(reload.get().sessions[0].completed,true);assert.equal(reload.get().sessions.length,1);assert.equal(reload.get().dailyPlans[0].results.length,6);
});
test('ungraded rhythmic observations advance a daily task without inventing accuracy or instrument credit',()=>{
 const f=fixture(),id=f.store.startDaily({instrument:'bass',minutes:5,tasks:[{task:{type:'rhythm',pattern:'pulse-4',mode:'reproduce'},instrument:'general',skill:'rhythm-reproduction'}]});
 const meta={dailyId:id,dailyStep:0,attemptId:'one',instrument:'general',skill:'rhythm-reproduction'};assert.equal(f.store.observe(id,{text:'Interpretação inconclusiva'},meta),true);assert.equal(f.store.observe(id,{},meta),false);assert.deepEqual(f.store.get().skills,{});assert.equal(f.store.get().dailyPlans[0].results[0].correct,null);assert.equal(f.store.get().dailyPlans[0].status,'completed');
});
