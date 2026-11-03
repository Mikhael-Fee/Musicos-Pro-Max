/* Versioned, local learning records. Legacy totals are preserved, never guessed into skills. */
(function(root){
  'use strict';
  const KEY='musicospromax.learning.v1', instruments=['guitar','piano','bass'];
  function empty(legacy){return {version:1,legacy:legacy||{attempts:0,correct:0,sessions:0},skills:{},lessons:{},sessions:[],serial:0};}
  function create(storage){
    const read=key=>{try{return JSON.parse(storage.getItem(key));}catch(_){return null;}};
    const old=read('musicospromax.stats.v1');
    const legacy=old&&['attempts','correct','sessions'].every(k=>Number.isSafeInteger(old[k])&&old[k]>=0)&&old.correct<=old.attempts?old:null;
    const saved=read(KEY); let writable=true, state=empty(legacy);
    if(saved?.version===1&&saved.skills&&saved.lessons&&Array.isArray(saved.sessions)){
      state.serial=Number.isSafeInteger(saved.serial)?Math.max(0,saved.serial):0;
      state.legacy=saved.legacy||legacy||state.legacy;
      for(const [key,s] of Object.entries(saved.skills)) if(/^(guitar|piano|bass):[a-z-]+$/.test(key)&&Number.isSafeInteger(s.attempts)&&Number.isSafeInteger(s.correct)&&s.attempts>=s.correct&&s.correct>=0&&Array.isArray(s.recent))state.skills[key]={attempts:s.attempts,correct:s.correct,recent:s.recent.filter(a=>typeof a.correct==='boolean'&&Number.isFinite(a.difficulty)&&typeof a.session==='string'&&typeof a.question==='string').slice(-20)};
      for(const [key,l] of Object.entries(saved.lessons))if(/^(guitar|piano|bass):[a-z-]+$/.test(key)&&l&&typeof l.completed==='boolean')state.lessons[key]={completed:l.completed,best:Number.isFinite(l.best)?l.best:0,updated:typeof l.updated==='string'?l.updated:''};
      state.sessions=saved.sessions.filter(s=>s&&typeof s.id==='string'&&typeof s.skill==='string'&&instruments.includes(s.instrument)&&Number.isSafeInteger(s.attempts)&&s.attempts>=0).slice(-60).map(s=>s.ended?s:{...s,ended:true,completed:false,interrupted:true});
    }else if(saved) writable=false; // Unknown/corrupt data is kept for recovery, not overwritten.
    function persist(){try{if(writable)storage.setItem(KEY,JSON.stringify(state));}catch(_){} }
    function begin(skill,instrument,mode='learn',difficulty=2){
      const id=Date.now().toString(36)+'-'+(++state.serial);
      state.sessions.push({id,skill,instrument,mode,difficulty,started:new Date().toISOString(),attempts:0,correct:0,instruments:[],completed:false,ended:false});state.sessions=state.sessions.slice(-60);persist();return id;
    }
    function record({skill,instrument,correct,difficulty=2,session,question}){
      if(!instruments.includes(instrument)||!/^[-a-z]+$/.test(skill)||typeof correct!=='boolean')return;
      const key=instrument+':'+skill,s=state.skills[key]||(state.skills[key]={attempts:0,correct:0,recent:[]});
      s.attempts++;s.correct+=Number(correct);s.recent.push({correct,difficulty,session:String(session),question:String(question),at:new Date().toISOString()});s.recent=s.recent.slice(-20);
      const run=state.sessions.find(s=>s.id===session);if(run){run.attempts++;run.correct+=Number(correct);run.instruments=[...new Set([...(run.instruments||[]),instrument])];if(run.attempts===1)run.instrument=instrument;}persist();
    }
    function end(id,completed=false){const s=state.sessions.find(s=>s.id===id);if(s&&!s.ended){s.ended=true;s.completed=completed;s.finished=new Date().toISOString();persist();}}
    function lesson(id,instrument,score,answered=4){const key=instrument+':'+id,previous=state.lessons[key];state.lessons[key]={completed:score>=.75&&answered>=4||!!previous?.completed,best:Math.max(previous?.best||0,answered>=4?score:0),answered,updated:new Date().toISOString()};persist();}
    function status(s){
      const recent=s?.recent||[],rate=recent.length?recent.filter(a=>a.correct).length/recent.length:0;
      if(recent.length>=3&&rate<.65)return 'Revisar';
      if(recent.length>=8&&rate>=.85&&new Set(recent.map(a=>a.session)).size>=2&&new Set(recent.map(a=>a.question)).size>=4&&recent.filter(a=>a.difficulty>=2).length>=4)return 'Consistente';
      return recent.length?'Em aprendizagem':'Ainda não praticado';
    }
    persist();return {get:()=>JSON.parse(JSON.stringify(state)),begin,record,end,lesson,status,reset:()=>{state=empty();persist();},writable};
  }
  const api={KEY,create};root.LearningProgress=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
