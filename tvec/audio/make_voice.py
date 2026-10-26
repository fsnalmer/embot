"""Voix off EN calée sur la timeline + mixage avec ducking de la musique -> audio/tvec_soundtrack_vo.wav
Moteurs (venv avec le paquet correspondant) :
  Kokoro (par défaut, plus naturel) : python make_voice.py kokoro <dossier avec kokoro-v1.0.onnx + voices-v1.0.bin> [voix=af_heart]
  Piper                             : python make_voice.py piper <modele.onnx>"""
import sys, wave, subprocess, numpy as np, os
ENGINE=sys.argv[1]; MODEL=sys.argv[2]; VOICE=sys.argv[3] if len(sys.argv)>3 else 'af_heart'; sr=44100
# (nom, temps d'entrée en s, texte, length_scale) — length_scale < 1 = plus rapide
LINES=[
 ('hook1',0.60,'Still editing for free?',0.92),
 ('hook2',2.35,"There's a better way.",0.90),
 ('s2',3.70,'Paid editing contests, for video editors.',0.92),
 ('s3',6.95,'Nine thousand five hundred euros in prize pools.',0.90),
 ('s4a',11.10,'Pick a contest.',0.92),
 ('s4b',13.10,'Make your edit.',0.92),
 ('s4c',15.10,'Post it on TikTok. Submit your link.',0.90),
 ('s5a',17.75,'The best edits win. And if one takes off, some contests reward views too.',0.88),
 ('s6a',22.75,'Real editors. Real wins.',0.92),
 ('s6b',24.55,'Already won by twenty nine editors.',0.90),
 ('s7a',27.05,'Free to join.',0.82),
 ('s7b',27.80,'Ten plus followers.',0.76),
 ('s7c',28.85,'Any editing app.',0.76),
 ('s7d',29.65,'PayPal payouts.',0.80),
 ('s8a',31.00,'Your next edit could pay you.',0.90),
 ('s8b',32.70,'Join free at T-V-E-C dot G-G.',0.92),
]
def read(p):
    w=wave.open(p); a=np.frombuffer(w.readframes(w.getnframes()),'<i2').astype(float)/32768
    if w.getnchannels()==2: a=a.reshape(-1,2).mean(1)
    return a,w.getframerate()
def resample(a,r):
    return a if r==sr else np.interp(np.arange(int(len(a)*sr/r))/sr*r,np.arange(len(a)),a)
N=int(35*sr); voice=np.zeros(N); end_prev=0
for name,t0,text,ls in LINES:
    f=f'audio/vo/{name}.wav'
    if ENGINE=='piper':
        subprocess.run([sys.executable,'-m','piper','-m',MODEL,'-f',f,'--length-scale',str(ls),'--sentence-silence','0.18'],input=text.encode(),check=True,capture_output=True)
    else:
        import soundfile as sf
        if 'KOK' not in globals():
            from kokoro_onnx import Kokoro; KOK=Kokoro(os.path.join(MODEL,'kokoro-v1.0.onnx'),os.path.join(MODEL,'voices-v1.0.bin'))
        samples,rate=KOK.create(text,voice=VOICE,speed=1/ls*1.08,lang='en-us'); sf.write(f,samples,rate,subtype='PCM_16')
    a,r=read(f); a=resample(a,r)
    # trim silence
    idx=np.where(np.abs(a)>.01)[0]; a=a[idx[0]:idx[-1]+1] if len(idx) else a
    a=a/ (np.sqrt((a**2).mean())+1e-9)*.16           # niveau rms homogène
    a[:int(.008*sr)]*=np.linspace(0,1,int(.008*sr)); a[-int(.03*sr):]*=np.linspace(1,0,int(.03*sr))
    i=int(t0*sr); voice[i:i+len(a)]+=a[:N-i]
    print(f'{name:6s} {t0:6.2f} -> {t0+len(a)/sr:6.2f}s'+('  CHEVAUCHE' if t0<end_prev else '')); end_prev=t0+len(a)/sr
# filtre passe-haut 90 Hz + compression douce + présence
v=voice-np.convolve(voice,np.ones(int(sr/90))/int(sr/90),mode='same'); v=np.tanh(v*2.2)/2.2*1.5
# musique
m,_=read('audio/tvec_soundtrack.wav'); mus=m
env=np.convolve(np.abs(voice),np.ones(int(.12*sr))/int(.12*sr),mode='same'); env=np.clip(env/.05,0,1)
env=np.convolve(env,np.ones(int(.15*sr))/int(.15*sr),mode='same')
duck=1-.42*np.clip(env,0,1)
mix=mus*duck+v*1.0
mix=np.tanh(mix*1.05); mix/=np.max(np.abs(mix))/.89
st=np.stack([mix,mix],1)
with wave.open('audio/tvec_soundtrack_vo.wav','wb') as w: w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((st*32767).astype('<i2').tobytes())
print('ok')
