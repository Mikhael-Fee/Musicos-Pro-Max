/* Four-string electric bass: sounding MIDI, not the octave-transposed notation. */
(function(root){
  'use strict';
  const T=root.MusicTheory || require('./theory.js');
  const TUNING=[28,33,38,43], MAX_FRET=20;
  const region=pc=>T.mod(pc-4);
  function cells(position=0,end=Math.min(MAX_FRET,position+4)){
    return TUNING.flatMap((base,string)=>Array.from({length:end-position+1},(_,i)=>({midi:base+position+i,string,fret:position+i,instrument:'bass'})));
  }
  function location(midi,position=0){
    return cells(0,MAX_FRET).filter(n=>n.midi===midi).sort((a,b)=>Math.abs(a.fret-position-2)-Math.abs(b.fret-position-2)||a.string-b.string)[0];
  }
  function note(pc,position=region(pc)){
    return cells(position).filter(n=>T.mod(n.midi)===pc).sort((a,b)=>a.midi-b.midi)[0] || cells(0,MAX_FRET).find(n=>T.mod(n.midi)===pc);
  }
  function ascendingPath(scale,position=region(scale[0].pc)){
    const available=cells(position);
    for(const tonic of available.filter(n=>T.mod(n.midi)===scale[0].pc).sort((a,b)=>a.midi-b.midi)){
      const path=[...scale.map(n=>n.offset),12].map(offset=>available.find(n=>n.midi===tonic.midi+offset));
      if(path.every(Boolean))return path;
    }
    return [];
  }
  function arpeggio(chord,position=region(chord.root)){
    const candidates=cells(position).filter(n=>T.mod(n.midi)===chord.root&&n.midi+chord.intervals.at(-1)<=63).sort((a,b)=>a.midi-b.midi);
    const base=candidates[0]?.midi ?? 28+region(chord.root);
    return chord.intervals.map(offset=>location(base+offset,position));
  }
  function line(chord,pattern='root',position=region(chord.root)){
    const arp=arpeggio(chord,position), tonic=arp[0];
    const fifth=arp[2];
    const notes=pattern==='root'?[tonic,tonic,tonic,tonic]:pattern==='fifth'?[tonic,fifth,tonic,fifth]:pattern==='third'?[tonic,arp[1],arp[2],arp[1]]:pattern==='triad'?[...arp.slice(0,3),tonic]:arp.slice(0,4);
    return notes;
  }
  const api={TUNING,MAX_FRET,region,cells,location,note,ascendingPath,arpeggio,line};
  root.BassTheory=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
