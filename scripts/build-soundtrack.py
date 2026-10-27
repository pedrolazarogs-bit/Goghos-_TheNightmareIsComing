#!/usr/bin/env python3
"""Render the original GOGHOS score with FluidSynth and a local GM soundfont.
Requires Python 3 + numpy, libfluidsynth and ffmpeg; the game only needs the MP3s.
No external music, vocals, choir patches or random composition are used.
"""
from __future__ import annotations
import argparse, ctypes as C, ctypes.util, hashlib, json, math, subprocess, tempfile, wave
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
RATE=44100
# All GM programs below are zero based. Channels are dedicated to instruments.
INSTRUMENTS={0:(46,'harpa'),1:(24,'violão de nylon / alaúde estilizado'),2:(73,'flauta'),3:(49,'cordas suaves'),4:(42,'violoncelo'),5:(60,'trompa'),6:(47,'tímpano')}
CHORDS={
 'd':([50,57,62,65,69,76],38), 'b':([46,53,58,62,65,69],34),
 'f':([48,53,57,60,64,69],41), 'c':([48,55,60,62,67,74],36),
 'g':([43,50,55,58,62,69],43), 'a':([45,52,57,62,64,67],45),
 'D':([50,57,62,66,69,76],38), 'G':([43,50,55,59,62,69],43),
 'B':([47,54,59,62,66,69],35), 'A':([45,52,57,61,64,69],45),
}
# Each short phrase is an original response to its bar's harmony: (eighth offset, MIDI note, eighth duration).
MENU=[[(0,74,2.7),(3,77,1.7),(5,76,.85)],[(0,74,1.8),(2,69,1.8),(4,65,1.7)],
 [(0,69,2.8),(3,72,1.3),(4.5,76,1.2)],[(0,74,2.7),(3,72,1.6),(5,67,.8)],
 [(0,74,3.6),(4,69,1.65)],[(0,70,2.7),(3,69,1.6),(5,67,.8)],
 [(0,69,2.8),(3,74,1.6),(5,73,.8)],[(0,74,4.9)]]
COMBAT=[[(0,74,1.6),(2,77,.8),(3,76,1.6),(5,74,.8)],[(0,69,2.7),(3,72,1.7),(5,74,.8)],
 [(0,77,2.7),(3,74,1.8)],[(0,79,1.7),(2,76,.8),(3,74,1.7),(5,72,.8)],
 [(0,74,2.7),(3,70,1.7),(5,69,.8)],[(0,69,1.7),(2,74,1.7),(4,77,1.6)],
 [(0,76,2.7),(3,74,1.7),(5,73,.8)],[(0,69,2.5),(3,73,2.4)]]
VICTORY=[[(0,74,2.6),(3,78,1.7),(5,76,.8)],[(0,79,2.6),(3,78,1.6),(5,74,.8)],
 [(0,78,2.8),(3,81,2.6)],[(0,76,3.6),(4,73,1.6)],
 [(0,74,2.6),(3,78,2.6)],[(0,79,2.6),(3,78,1.6),(5,76,.8)],
 [(0,76,2),(2,73,1.6),(4,69,1.5)],[(0,74,8.5)]]
DEFEAT=[[(0,74,3.6),(4,72,1.6)],[(0,70,2.6),(3,69,2.6)],
 [(0,67,3.6),(4,70,1.6)],[(0,69,4.6)],[(0,65,2.6),(3,64,2.6)],
 [(0,65,3.6),(4,69,1.6)],[(0,64,2.6),(3,61,2.6)],[(0,62,8.5)]]
SPECS={
 'menu':dict(title='O Portal da Noite',bpm=144,bars=32,loop=True,progression='dbfcdgad',phrases=MENU,tail=0),
 'combat':dict(title='Guardas da Daly Mãe',bpm=180,bars=40,loop=True,progression='ddb cgd aa'.replace(' ',''),phrases=COMBAT,tail=0),
 'victory':dict(title='Uma Luz no Santuário',bpm=144,bars=8,loop=False,progression='DGBADGAD',phrases=VICTORY,tail=4),
 'defeat':dict(title='Ecos Depois da Batalha',bpm=128.5714285714,bars=8,loop=False,progression='dbg adfad'.replace(' ',''),phrases=DEFEAT,tail=5.6),
}

def notes_for(name,spec):
    """Make the complete deterministic score. Events are time, channel, note, velocity, duration."""
    eighth=60/spec['bpm']; barlen=6*eighth; notes=[]
    def add(t,ch,n,vel,d):
        notes.append((max(0,t),ch,int(n),int(max(1,min(110,vel))),max(.04,d)))
    for bar in range(spec['bars']):
        base=bar*barlen; pos=bar%8; section=bar//8
        chord,root=CHORDS[spec['progression'][pos]]
        # Contrasting sections open the arrangement without increasing tempo.
        energy=[0,4,1,6,2][section%5] if name=='combat' else [0,2,4,1][section%4]
        dynamics=energy+(3 if name=='victory' else -8 if name=='defeat' else 0)
        # Harp six-note pattern: bass, fifth, third, ninth, fifth, upper root.
        harp_pattern=[0,2,3,5,4,2] if section%2==0 else [0,3,2,4,5,3]
        harp_steps=range(6) if name!='defeat' else [0,2,4]
        for step in harp_steps:
            n=chord[harp_pattern[step]]
            # Balanced left/right instrument panning and slight timing offsets feel hand played.
            add(base+step*eighth+(0 if step==0 else .008*(step%3)),0,n,49+dynamics+(5 if step in [0,3] else 0),eighth*2.5)
            if name=='combat' and section in [2,3] and step in [1,4]:
                add(base+(step+.5)*eighth,0,chord[5],38+dynamics,eighth*1.4)
        # Lute-like nylon plucks answer the harp rather than doubling every note.
        for step in ([1,4] if name!='combat' else [0,2,3,5]):
            add(base+step*eighth+.025,1,chord[(step+1)%4],37+dynamics,eighth*.95)
        # Warm bowed beds with smooth attack and overlapping note-offs.
        for n in chord[1:4]:
            add(base+.025,3,n,31+dynamics,barlen+.18)
        add(base,4,root,42+dynamics,barlen*.95)
        if name=='combat':
            # Low tom and timpani, not a modern drum-kit backbeat.
            add(base,9,41,39+energy,.22)
            add(base+3*eighth,9,45,29+energy,.2)
            if bar%2==0:add(base,6,root,40+energy,barlen*1.3)
            if section>=1 and pos in [0,2,4,6]:
                for n in [chord[2],chord[4]]:add(base+.08,5,n-12,36+energy,barlen*1.65)
        elif name=='victory' and pos in [0,4,7]:
            for n in [chord[2],chord[4]]:add(base+.06,5,n-12,38,barlen*1.45)
        # Original main melody: articulated flute/recorder line with rests for battle readability.
        phrase=spec['phrases'][pos]
        if name=='menu' and section==0 and pos in [0,1]:phrase=[]
        for offset,n,duration in phrase:
            if name=='menu' and section==2:
                # A low answering phrase in the bridge makes the loop less repetitive.
                n-=12
            if name=='combat' and section==2 and pos in [1,3,5]:
                n-=12
            vel=(47 if name=='menu' else 52 if name=='combat' else 50 if name=='victory' else 42)+energy
            add(base+offset*eighth+.035,2,n,vel,duration*eighth)
        # A small harp turn at phrase ends; the final chord itself still rings naturally.
        if pos==7 and name!='defeat':
            for k,n in enumerate([chord[2],chord[3],chord[4],chord[5]]):
                add(base+(4.5+k*.25)*eighth,0,n,42+dynamics,eighth*2)
    return sorted(notes),barlen*spec['bars']

class Synth:
    def __init__(self,soundfont):
        self.lib=C.CDLL(ctypes.util.find_library('fluidsynth') or 'libfluidsynth.so.3')
        L=self.lib
        for name,restype,args in [
            ('new_fluid_settings',C.c_void_p,[]),('fluid_settings_setnum',C.c_int,[C.c_void_p,C.c_char_p,C.c_double]),
            ('fluid_settings_setint',C.c_int,[C.c_void_p,C.c_char_p,C.c_int]),('new_fluid_synth',C.c_void_p,[C.c_void_p]),
            ('fluid_synth_sfload',C.c_int,[C.c_void_p,C.c_char_p,C.c_int]),('fluid_synth_program_select',C.c_int,[C.c_void_p,C.c_int,C.c_int,C.c_int,C.c_int]),
            ('fluid_synth_cc',C.c_int,[C.c_void_p,C.c_int,C.c_int,C.c_int]),('fluid_synth_noteon',C.c_int,[C.c_void_p,C.c_int,C.c_int,C.c_int]),
            ('fluid_synth_noteoff',C.c_int,[C.c_void_p,C.c_int,C.c_int]),('fluid_synth_write_float',C.c_int,[C.c_void_p,C.c_int,C.c_void_p,C.c_int,C.c_int,C.c_void_p,C.c_int,C.c_int]),
            ('delete_fluid_synth',None,[C.c_void_p]),('delete_fluid_settings',None,[C.c_void_p])]:
            fn=getattr(L,name);fn.restype=restype;fn.argtypes=args
        self.settings=L.new_fluid_settings()
        for key,value in {'synth.sample-rate':RATE,'synth.gain':.55,'synth.reverb.room-size':.76,'synth.reverb.damp':.52,'synth.reverb.width':.85,'synth.reverb.level':.26}.items():
            L.fluid_settings_setnum(self.settings,key.encode(),value)
        L.fluid_settings_setint(self.settings,b'synth.chorus.active',0)
        L.fluid_settings_setint(self.settings,b'synth.polyphony',128)
        self.synth=L.new_fluid_synth(self.settings)
        sf=L.fluid_synth_sfload(self.synth,str(soundfont).encode(),1)
        if sf<0:raise RuntimeError('Cannot load the local soundfont')
        for ch,(program,_) in INSTRUMENTS.items():
            L.fluid_synth_program_select(self.synth,ch,sf,0,program)
        L.fluid_synth_program_select(self.synth,9,sf,128,0)
        for ch,pan in {0:40,1:84,2:64,3:58,4:72,5:77,6:62,9:66}.items():
            L.fluid_synth_cc(self.synth,ch,10,pan)
            L.fluid_synth_cc(self.synth,ch,91,55 if ch in [0,2,3] else 38)
    def render(self,count):
        output=np.zeros((count,2),dtype=np.float32)
        self.lib.fluid_synth_write_float(self.synth,count,output.ctypes.data,0,2,output.ctypes.data,1,2)
        return output
    def close(self):
        self.lib.delete_fluid_synth(self.synth);self.lib.delete_fluid_settings(self.settings)

def render_track(name,spec,soundfont):
    notes,total=notes_for(name,spec);events=[]
    cycles=2 if spec['loop'] else 1
    # Render two cycles and retain the second, carrying the previous phrase's reverb into the loop's start.
    expanded=[]
    for cycle in range(cycles):
        shift=cycle*total
        expanded.extend((shift+t,ch,n,velocity,duration) for t,ch,n,velocity,duration in notes)
    grouped={}
    for t,ch,n,velocity,duration in expanded:
        grouped.setdefault((ch,n),[]).append([t,t+duration,velocity])
    for (ch,n),items in grouped.items():
        stitched=[]
        for start,stop,vel in sorted(items):
            if ch==3 and stitched and start<=stitched[-1][1]+.06:
                # Common bowed notes are tied across chord changes, never cut by a later note-off.
                stitched[-1][1]=max(stitched[-1][1],stop)
            else:
                if stitched and stitched[-1][1]>start:
                    stitched[-1][1]=max(stitched[-1][0]+.01,start-.002)
                stitched.append([start,stop,vel])
        for start,stop,vel in stitched:
            events.append((int(start*RATE),1,ch,n,vel))
            events.append((int(stop*RATE),0,ch,n,0))
    events.sort()
    end=int((cycles*total+spec['tail'])*RATE)
    synth=Synth(soundfont);blocks=[];cursor=0
    try:
        for at,on,ch,n,vel in events:
            if at>=end:break
            if at>cursor:blocks.append(synth.render(at-cursor));cursor=at
            if on:synth.lib.fluid_synth_noteon(synth.synth,ch,n,vel)
            else:synth.lib.fluid_synth_noteoff(synth.synth,ch,n)
        if cursor<end:blocks.append(synth.render(end-cursor))
    finally:synth.close()
    output=np.concatenate(blocks)
    if spec['loop']:
        output=output[int(total*RATE):]
        # Four-millisecond end envelopes prevent sample discontinuity clicks in browser loops.
        count=int(RATE*.004);ramp=np.sin(np.linspace(0,math.pi/2,count))**2
        output[:count]*=ramp[:,None];output[-count:]*=ramp[::-1,None]
    else:
        count=int(RATE*1.8);output[-count:]*=np.linspace(1,0,count)[:,None]
        onset=int(RATE*.015);output[:onset]*=np.linspace(0,1,onset)[:,None]
    return output,total+spec['tail']

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--soundfont',type=Path,default=Path('/usr/share/sounds/sf2/TimGM6mb.sf2'))
    parser.add_argument('--output',type=Path,default=ROOT/'assets/music')
    parser.add_argument('--track',choices=list(SPECS))
    args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    chosen={args.track:SPECS[args.track]} if args.track else SPECS
    manifest={}
    for name,spec in chosen.items():
        print('Rendering',name,flush=True)
        output,duration=render_track(name,spec,args.soundfont)
        peak=float(np.max(np.abs(output)))
        # The renderer stays below full scale before the final background-music master.
        output*=.68/max(peak,.001)
        with tempfile.TemporaryDirectory(prefix='goghos-score-') as tmp:
            wav=Path(tmp)/'render.wav'
            with wave.open(str(wav),'wb') as file:
                file.setnchannels(2);file.setsampwidth(2);file.setframerate(RATE)
                file.writeframes((np.clip(output,-.999,.999)*32767).astype('<i2').tobytes())
            target=args.output/(name+'.mp3')
            subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-af','highpass=f=42,lowpass=f=14500,loudnorm=I=-17:TP=-2:LRA=9','-ar',str(RATE),'-ac','2','-c:a','libmp3lame','-b:a','160k','-write_xing','1','-metadata','title='+spec['title'],'-metadata','artist=GOGHOS — trilha original instrumental','-metadata','comment=Composição original; harpa, cordas e instrumentos sem vozes.',str(target)],check=True)
        info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size','-of','json',str(target)]))['format']
        manifest[name]={'file':name+'.mp3','title':spec['title'],'durationSeconds':round(float(info['duration']),3),'musicalDurationSeconds':round(duration,3),'bpmEighthNote':spec['bpm'],'meter':'6/8','loop':spec['loop'],'bytes':int(info['size']),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'instruments':['harpa','alaúde estilizado em cordas de nylon','flauta','cordas','violoncelo']+(['trompa','tímpano e tom grave suave'] if name=='combat' else ['trompa suave'] if name=='victory' else []),'vocals':False}
        print(name,manifest[name]['durationSeconds'],'seconds;',manifest[name]['bytes'],'bytes',flush=True)
    if not args.track:
        (args.output/'manifest.json').write_text(json.dumps({'version':1,'source':'Composições originais determinísticas de GOGHOS, scripts/build-soundtrack.py; instrumentos GM locais TimGM6mb renderizados por FluidSynth.','compositionOriginal':True,'soundfont':{'name':'TimGM6mb','credits':'Tim Brechbill (2004), David Bolton (2010)','license':'GPL-2','creditsFile':'TimGM6mb-CREDITS.txt','licenseFile':'TimGM6mb-GPL-2.txt','distributed':False},'tracks':manifest},ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__':main()
