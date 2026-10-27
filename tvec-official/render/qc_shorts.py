"""Contrôle qualité automatique des shorts : python3 render/qc_shorts.py <dossier_images> [nom …]
Mesure : format (ffprobe), images noires, séquences figées, loudness, décalage son/image (corrélation croisée), images dupliquées."""
import sys, subprocess, json, re, wave, numpy as np
from PIL import Image
FR=sys.argv[1]; names=sys.argv[2:] or ['money','steps','ranked','faq','sponsors','spotlight']
def run(cmd): return subprocess.run(cmd,capture_output=True,text=True)
out={}
for v in names:
    f=f'out/shorts/TVEC_{v}.mp4'
    pr=json.loads(run(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,r_frame_rate,nb_frames,pix_fmt,sample_rate,channels','-of','json',f]).stdout)
    vs=[s for s in pr['streams'] if s['codec_name']=='h264'][0]; au=[s for s in pr['streams'] if s['codec_name']=='aac'][0]
    dec=run(['ffmpeg','-v','error','-i',f,'-f','null','-']).stderr.strip()
    blk=len(re.findall('black_start',run(['ffmpeg','-hide_banner','-nostats','-i',f,'-vf','blackdetect=d=0.04:pix_th=0.03','-an','-f','null','-']).stderr))
    frz=re.findall('freeze_duration: ([\d.]+)',run(['ffmpeg','-hide_banner','-nostats','-i',f,'-vf','freezedetect=n=-55dB:d=0.7','-an','-f','null','-']).stderr)
    eb=run(['ffmpeg','-hide_banner','-nostats','-i',f,'-af','ebur128=peak=true','-vn','-f','null','-']).stderr
    lufs=re.findall(r'I:\s+(-?[\d.]+) LUFS',eb)[-1]; peak=re.findall(r'Peak:\s+(-?[\d.]+) dBFS',eb)[-1]
    n=int(vs['nb_frames']); prev=None; d=[]
    for i in range(n):
        im=np.asarray(Image.open(f'{FR}/{v}/f_{i:04d}.jpg').convert('L').resize((108,192)),dtype=float); d.append(0 if prev is None else np.abs(im-prev).mean()); prev=im
    d=np.array(d); dup=int((d[1:]<0.02).sum())
    w=wave.open(f'audio/shorts/{v}.wav'); a=np.frombuffer(w.readframes(w.getnframes()),'<i2').reshape(-1,2).mean(1)/32768
    hop=1470; m=len(a)//hop; env=np.pad(np.array([np.sqrt((a[i*hop:(i+1)*hop]**2).mean()) for i in range(m)]),(0,max(0,n-m)))[:n]; on=np.maximum(0,np.diff(env,prepend=env[0]))
    r=[((d-d.mean())*(np.roll(on,l)-on.mean())).sum() for l in range(-6,7)]; lag=list(range(-6,7))[int(np.argmax(r))]
    run_=best=0
    for i in range(1,n):
        run_=run_+1 if d[i]<0.3 else 0; best=max(best,run_)
    out[v]=dict(duree=float(pr['format']['duration']),mo=round(int(pr['format']['size'])/1e6,1),res=f"{vs['width']}x{vs['height']}",fps=vs['r_frame_rate'],images=n,pix=vs['pix_fmt'],audio=f"{au['codec_name']} {au['sample_rate']}Hz {au['channels']}ch",decode_ok=(dec==''),noires=blk,figees=len(frz),lufs=lufs,crete_dBFS=peak,decalage_img=lag,dupliquees=dup,plus_longue_statique_s=round(best/30,2))
    print(v,out[v])
json.dump(out,open('research/qc_shorts.json','w'),indent=1)
