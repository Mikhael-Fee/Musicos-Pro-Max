/* Versioned local learning data: migration, spaced reviews and resumable study plans. */
(function(root){
'use strict';
const KEY='musicospromax.learning.v1',BACKUP=KEY+'.backup.v1';
const S=root.StudyTheory||(typeof require!=='undefined'?require('./study-core.js'):null);
const instruments=['guitar','piano','bass','general'],validKey=/^(guitar|piano|bass|general):[a-z-]+$/;
const days=[1,3,7,14,30],DAY=86400000;
function empty(legacy){return {version:2,legacy:legacy||{attempts:0,correct:0,sessions:0},skills:{},lessons:{},sessions:[],serial:0,reviews:[],auto:{},dailyPlans:[],seenAttempts:[],calibration:null};}
function create(storage,{now=Date.now}={}){
 const read=k=>{try{return JSON.parse(storage.getItem(k));}catch(_){return null;}};
 const stamp=()=>new Date(now()).toISOString();
 const old=read('musicospromax.stats.v1'),legacy=old&&['attempts','correct','sessions'].every(k=>Number.isSafeInteger(old[k])&&old[k]>=0)&&old.correct<=old.attempts?old:null;
 let raw=null;try{raw=storage.getItem(KEY);}catch(_){}const saved=read(KEY);let writable=raw===null||saved!==null,state=empty(legacy);
 if(saved&&[1,2].includes(saved.version)&&saved.skills&&saved.lessons&&Array.isArray(saved.sessions)){
  if(saved.version===1)try{if(storage.getItem(BACKUP)===null)storage.setItem(BACKUP,JSON.stringify(saved));}catch(_){}
  state.serial=Number.isSafeInteger(saved.serial)?Math.max(0,saved.serial):0;state.legacy=saved.legacy||legacy||state.legacy;
  for(const [key,s] of Object.entries(saved.skills))if(validKey.test(key)&&Number.isSafeInteger(s.attempts)&&Number.isSafeInteger(s.correct)&&s.attempts>=s.correct&&s.correct>=0&&Array.isArray(s.recent))state.skills[key]={attempts:s.attempts,correct:s.correct,recent:s.recent.filter(a=>typeof a.correct==='boolean'&&Number.isFinite(a.difficulty)&&typeof a.session==='string'&&typeof a.question==='string').slice(-20)};
  for(const [key,l] of Object.entries(saved.lessons))if(validKey.test(key)&&l&&typeof l.completed==='boolean')state.lessons[key]={completed:l.completed,best:Number.isFinite(l.best)?l.best:0,answered:Number.isInteger(l.answered)?l.answered:4,updated:typeof l.updated==='string'?l.updated:''};
  if(saved.version===2){
   state.reviews=(Array.isArray(saved.reviews)?saved.reviews:[]).filter(r=>r&&instruments.includes(r.instrument)&&/^[a-z-]+$/.test(r.skill)&&typeof r.id==='string'&&S.task(r.task)&&Number.isFinite(r.due)).slice(-200).map(r=>({...r,task:S.task(r.task),step:Math.max(0,Math.min(5,Number(r.step)||0)),prompt:String(r.prompt||'Revisão').slice(0,300),explanation:String(r.explanation||'').slice(0,1500)}));
   for(const [key,value] of Object.entries(saved.auto||{}))if(validKey.test(key)&&[1,2,3].includes(value.level)&&Number.isSafeInteger(value.atAttempts))state.auto[key]={level:value.level,atAttempts:value.atAttempts};
   state.dailyPlans=(Array.isArray(saved.dailyPlans)?saved.dailyPlans:[]).filter(p=>p&&typeof p.id==='string'&&instruments.includes(p.instrument)&&[5,10,15].includes(p.minutes)&&Array.isArray(p.tasks)&&p.tasks.every(t=>S.task(t.task))&&Number.isInteger(p.index)&&p.index>=0&&p.index<=p.tasks.length&&Array.isArray(p.results)).slice(-20).map(p=>({...p,status:p.status==='active'?'paused':p.status,activeSince:null,tasks:p.tasks.map(t=>({...t,task:S.task(t.task)}))}));
   state.seenAttempts=(Array.isArray(saved.seenAttempts)?saved.seenAttempts:[]).filter(x=>typeof x==='string').slice(-500);
   if(saved.calibration&&Number.isFinite(saved.calibration.offset)&&Number.isFinite(saved.calibration.spread))state.calibration=saved.calibration;
  }
  state.sessions=saved.sessions.filter(s=>s&&typeof s.id==='string'&&typeof s.skill==='string'&&instruments.includes(s.instrument)&&Number.isSafeInteger(s.attempts)&&s.attempts>=0).slice(-120).map(s=>s.ended||state.dailyPlans.some(p=>p.id===s.id&&['active','paused'].includes(p.status))?s:{...s,ended:true,completed:false,interrupted:true});
 }else if(saved)writable=false;
 function persist(){try{if(writable)storage.setItem(KEY,JSON.stringify(state));}catch(_){} }
 function begin(skill,instrument,mode='learn',difficulty=2){const id=now().toString(36)+'-'+(++state.serial);state.sessions.push({id,skill,instrument,mode,difficulty,started:stamp(),attempts:0,correct:0,instruments:[],completed:false,ended:false});state.sessions=state.sessions.slice(-120);persist();return id;}
 function finish(run,completed){if(run&&!run.ended){run.ended=true;run.completed=completed;run.finished=stamp();}}
 function end(id,completed=false){finish(state.sessions.find(s=>s.id===id),completed);persist();}
 function accrue(plan){if(Number.isFinite(plan.activeSince))plan.elapsedMs=(plan.elapsedMs||0)+Math.max(0,now()-plan.activeSince);plan.activeSince=null;}
 function dailyResult(metadata,correct){
  const plan=state.dailyPlans.find(p=>p.id===metadata.dailyId);if(!plan)return;
  accrue(plan);plan.activeSince=now();plan.results.push({step:metadata.dailyStep,correct,at:stamp(),instrument:metadata.instrument,skill:metadata.skill});plan.index++;
  if(plan.index===plan.tasks.length){accrue(plan);plan.status='completed';finish(state.sessions.find(s=>s.id===plan.id),true);}
 }
 function canRecord(meta){
  if(meta.attemptId&&state.seenAttempts.includes(meta.attemptId))return false;
  if(meta.dailyId){const p=state.dailyPlans.find(p=>p.id===meta.dailyId);if(!p||p.status!=='active'||p.index!==meta.dailyStep)return false;}
  return true;
 }
 function review(meta,correct){
  const task=S.task(meta.task);if(!task)return;
  const id=meta.instrument+'|'+meta.skill+'|'+S.key(task);let item=state.reviews.find(r=>r.id===id);
  if(!correct){
   if(!item){item={id,instrument:meta.instrument,skill:meta.skill,task,failures:0,step:0,difficulty:meta.difficulty||1};state.reviews.push(item);}
   Object.assign(item,{prompt:String(meta.prompt||meta.question||'Revisão').slice(0,300),explanation:String(meta.explanation||'').slice(0,1500),chosen:String(meta.chosen??'').slice(0,300),failures:item.failures+1,step:0,due:now()+600000,lastWrong:now(),lastSession:meta.session});
   state.reviews=state.reviews.slice(-200);
  }else if(item&&(!meta.reviewId||item.id===meta.reviewId)&&now()>=item.due&&item.lastSession!==meta.session){
   const step=Math.min(item.step+1,days.length);Object.assign(item,{step,due:now()+days[step-1]*DAY,lastSession:meta.session,lastCorrect:now()});
  }
 }
 function record(meta){
  const {skill,instrument,correct,difficulty=2,session,question}=meta;
  if(!instruments.includes(instrument)||!/^[-a-z]+$/.test(skill)||typeof correct!=='boolean'||!canRecord(meta))return false;
  if(!meta.assessmentOnly){const key=instrument+':'+skill,s=state.skills[key]||(state.skills[key]={attempts:0,correct:0,recent:[]});s.attempts++;s.correct+=Number(correct);s.recent.push({correct,difficulty,session:String(session),question:String(question),at:stamp()});s.recent=s.recent.slice(-20);}
  const run=state.sessions.find(s=>s.id===session);if(run){run.attempts++;run.correct+=Number(correct);run.instruments=[...new Set([...(run.instruments||[]),instrument])];if(run.attempts===1)run.instrument=instrument;}
  if(meta.attemptId)state.seenAttempts.push(meta.attemptId);state.seenAttempts=state.seenAttempts.slice(-500);
  if(meta.assessmentOnly&&run)run.assessment=true;
  if(!meta.assessmentOnly)review({...meta,difficulty},correct);if(meta.dailyId)dailyResult(meta,correct);persist();return true;
 }
 function observe(session,observation,metadata={}){
  if(!canRecord(metadata))return false;
  const run=state.sessions.find(s=>s.id===session);if(run){run.observations=[...(run.observations||[]),{...observation,at:stamp()}].slice(-12);}
  if(metadata.attemptId)state.seenAttempts.push(metadata.attemptId);state.seenAttempts=state.seenAttempts.slice(-500);
  if(metadata.dailyId)dailyResult(metadata,null);persist();return true;
 }
 function lesson(id,instrument,score,answered=4){const key=instrument+':'+id,previous=state.lessons[key];state.lessons[key]={completed:score>=.75&&answered>=4||!!previous?.completed,best:Math.max(previous?.best||0,answered>=4?score:0),answered,updated:stamp()};persist();}
 function status(s){const recent=s?.recent||[],rate=recent.length?recent.filter(a=>a.correct).length/recent.length:0;if(recent.length>=3&&rate<.65)return 'Revisar';if(recent.length>=8&&rate>=.85&&new Set(recent.map(a=>a.session)).size>=2&&new Set(recent.map(a=>a.question)).size>=4&&recent.filter(a=>a.difficulty>=2).length>=4)return 'Consistente';return recent.length?'Em aprendizagem':'Ainda não praticado';}
 function level(skill,instrument,apply=false){const key=instrument+':'+skill,previous=state.auto[key]||{level:1,atAttempts:0};const result=S.recommendation(state.skills[key],previous);if(apply&&result.level!==previous.level){state.auto[key]={level:result.level,atAttempts:state.skills[key]?.attempts||0};persist();}return result;}
 function startDaily(plan){
  for(const old of state.dailyPlans)if(old.status==='active'){accrue(old);old.status='paused';}
  const id=begin('daily',plan.instrument,'daily',1);state.dailyPlans.push({...plan,id,index:0,results:[],status:'active',started:stamp(),activeSince:now(),elapsedMs:0});state.dailyPlans=state.dailyPlans.slice(-20);persist();return id;
 }
 function pauseDaily(id){const p=state.dailyPlans.find(p=>p.id===id);if(p&&p.status==='active'){accrue(p);p.status='paused';persist();}}
 function resumeDaily(id){const p=state.dailyPlans.find(p=>p.id===id);if(p&&p.status==='paused'){p.status='active';p.activeSince=now();persist();}}
 function stopDaily(id){const p=state.dailyPlans.find(p=>p.id===id);if(p&&!['completed','stopped'].includes(p.status)){accrue(p);p.status='stopped';finish(state.sessions.find(s=>s.id===id),false);persist();}}
 function setCalibration(value){state.calibration=value;persist();}
 persist();return {get:()=>JSON.parse(JSON.stringify(state)),begin,record,observe,end,lesson,status,level,startDaily,pauseDaily,resumeDaily,stopDaily,setCalibration,reset:()=>{state=empty();persist();},writable};
}
const api={KEY,BACKUP,create};root.LearningProgress=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
