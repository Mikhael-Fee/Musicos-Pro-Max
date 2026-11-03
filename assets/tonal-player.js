/* One cancellable audio timeline; playback never paints target notes. */
(function(root){
'use strict';
class TonalPlayer{
 constructor(engine=root.soundEngine){this.engine=engine;this.token=0;this.timer=null;this.phases=new Set();}
 stop(){this.token++;clearTimeout(this.timer);this.timer=null;this.phases.forEach(clearTimeout);this.phases.clear();this.engine.stop();}
 async play(material,{reference=true,answer=null,onEnd=()=>{},onPhase=()=>{}}={}){
  this.stop();const token=this.token,ctx=this.engine.init();if(ctx.state==='suspended'&&typeof ctx.startRendering!=='function')await ctx.resume();if(token!==this.token)return null;
  const phase=(time,name)=>{if(typeof ctx.startRendering==='function')return;const id=setTimeout(()=>{this.phases.delete(id);if(token===this.token)onPhase(name);},Math.max(0,time-ctx.currentTime)*1000);this.phases.add(id);};
  const instrument=material.instrument||'piano',base=material.base;let at=ctx.currentTime+.12;const events=[];
  const note=(midi,time,duration=.42)=>{events.push({midi,at:time,instrument});this.engine.note(midi-48,instrument,0,time,instrument,duration);};
  const chord=(degree,time)=>{const c=MusicTheory.chord(material.key,'Maior',degree+1),root=base+TonalTheory.offset(degree);c.notes.forEach((n,i)=>note(root+MusicTheory.mod(n.pc-c.root),time+(instrument==='bass'?i*.14:0),instrument==='bass'?.24:.55));};
  if(reference){phase(at,'reference');for(const degree of [0,3,4,0]){chord(degree,at);at+=.65;}at+=.35;}
  const start=at;phase(at,material.kind==='completion'?'model':'question');
  if(answer){for(const midi of answer){note(midi,at);at+=.5;}}
  else if(['cadence','progression','next-chord','completion'].includes(material.kind)){for(const d of material.notes){chord(d,at);at+=.85;}if(material.kind==='completion'){at+=.6;phase(at,'excerpt');for(const d of material.notes.slice(0,-1)){chord(d,at);at+=.85;}}}
  else if(material.kind==='stability'){for(const [i,midi] of material.midi.entries()){phase(at,i===0?'a':'b');chord(0,at);note(midi,at+.22);at+=1.3;}}
  else for(const midi of material.midi){note(midi,at);at+=.5;}
  const end=at+.35;
  if(typeof ctx.startRendering!=='function')this.timer=setTimeout(()=>{this.timer=null;if(token===this.token)onEnd();},Math.max(0,end-ctx.currentTime)*1000);
  return {start,end,events,token};
 }
}
root.TonalPlayer=TonalPlayer;
})(window);
