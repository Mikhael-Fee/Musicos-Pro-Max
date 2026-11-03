(function(root){
'use strict';
class RhythmPlayer{
 constructor(engine=root.soundEngine){this.engine=engine;this.token=0;this.timers=new Set();}
 stop(){this.token++;this.timers.forEach(clearTimeout);this.timers.clear();this.engine.stop();}
 later(milliseconds,fn,token=this.token){const id=setTimeout(()=>{this.timers.delete(id);if(token===this.token)fn();},milliseconds);this.timers.add(id);}
 async metronome(meter,bpm,{onBeat=()=>{}}={}){
  this.stop();const token=this.token,ctx=this.engine.init();if(ctx.state==='suspended')await ctx.resume();if(token!==this.token)return;
  const beat=60/bpm;let next=ctx.currentTime+.12,index=0;
  const schedule=()=>{
   while(next<ctx.currentTime-.05){next+=beat;index++;}
   while(next<ctx.currentTime+.2){const at=next,number=index%meter+1;this.engine.tick(number===1,0,at,'rhythm');this.later(Math.max(0,at-ctx.currentTime)*1000,()=>onBeat({at,index:number,preparation:false}),token);next+=beat;index++;}
   this.later(25,schedule,token);
  };schedule();
 }
 async play(pattern,bpm,{model=true,metronome=true,countInBars=1,measures=1,instrument='percussion',onBeat=()=>{},onHit=()=>{},onEnd=()=>{}}={}){
  this.stop();const token=this.token,ctx=this.engine.init();if(ctx.state==='suspended'&&typeof ctx.startRendering!=='function')await ctx.resume();if(token!==this.token)return null;
  const beat=60/bpm,lead=ctx.currentTime+.12,start=lead+countInBars*pattern.meter*beat,end=start+measures*pattern.meter*beat;
  const schedule=(at,fn)=>{if(typeof ctx.startRendering==='function')return;this.later(Math.max(0,at-ctx.currentTime)*1000,fn,token);};
  const beats=[];
  for(let i=0;i<(countInBars+measures)*pattern.meter;i++){
   const at=lead+i*beat;if(metronome)this.engine.tick(i%pattern.meter===0,0,at,'rhythm');
   const item={at,index:i%pattern.meter+1,preparation:i<countInBars*pattern.meter};beats.push(item);schedule(at,()=>onBeat(item));
  }
  const hits=[];
  if(model)for(let bar=0;bar<measures;bar++)for(const note of RhythmTheory.timeline(pattern,bpm,start+bar*pattern.meter*beat)){
   hits.push(note);
   if(instrument==='percussion')this.engine.rhythmHit(note.at,note.beat===0);else this.engine.note(({guitar:48,piano:60,bass:36}[instrument]||60)-48,instrument,0,note.at,'rhythm');
   schedule(note.at,()=>onHit(note));
  }
  schedule(end,onEnd);return {start,end,beats,hits,token};
 }
}
root.RhythmPlayer=RhythmPlayer;
})(window);
