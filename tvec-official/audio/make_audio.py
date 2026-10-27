"""Sound design TVEC OFFICIAL EDIT — synthèse 100 % originale (numpy), libre de droits. 120 BPM, la mineur. Sortie: audio/tvec_official_soundtrack.wav"""
import numpy as np, wave, sys
sr=44100; DUR=34.0; N=int(sr*DUR); rng=np.random.default_rng(3)
tt=lambda n:np.arange(n)/sr
drum=np.zeros(N); mus=np.zeros(N); fx=np.zeros(N); rev=np.zeros(N); kicks=[]
def put(buf,sig,t0,g=1.0):
    i=int(t0*sr); 
    if i>=N: return
    e=min(N,i+len(sig)); buf[i:e]+=sig[:e-i]*g
def lp(x,k): # moyenne glissante (passe-bas simple)
    return np.convolve(x,np.ones(k)/k,mode='same')
def hp(x): return np.diff(x,prepend=0)
def kick(t0,g=1.0):
    t=tt(int(.45*sr)); f=48+110*np.exp(-t*28); ph=2*np.pi*np.cumsum(f)/sr
    s=np.sin(ph)*np.exp(-t*7)+.3*np.sin(ph*2)*np.exp(-t*30); s[:90]+=rng.normal(0,.4,90)*np.linspace(1,0,90)
    put(drum,s,t0,g); kicks.append(t0)
def clap(t0,g=.8):
    t=tt(int(.25*sr)); n=hp(hp(rng.normal(0,1,len(t)))); e=sum(np.exp(-np.clip(t-d,0,None)*38)*(t>=d) for d in (0,.012,.024))*.5
    put(drum,n*e*np.exp(-t*8),t0,g*.6)
def hat(t0,g=.4,o=False):
    t=tt(int((.18 if o else .06)*sr)); n=hp(hp(rng.normal(0,1,len(t)))); put(drum,n*np.exp(-t*(18 if o else 70)),t0,g*.5)
def thud(t0,g=.8):
    t=tt(int(.3*sr)); f=40+90*np.exp(-t*30); s=np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-t*14)+rng.normal(0,.15,len(t))*np.exp(-t*90); put(fx,s,t0,g)
def impact(t0,g=1.0,long=1.6):
    t=tt(int(long*sr)); f=32+80*np.exp(-t*9); s=np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-t*2.2)
    n=lp(rng.normal(0,1,len(t)),6)*np.exp(-t*7)*.5; s=s+n; put(fx,s,t0,g); put(rev,s*.5,t0,g*.5)
def zap(t0,g=.7): # flash sonore
    t=tt(int(.5*sr)); f=3000*np.exp(-t*6)+300; s=np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-t*8)+hp(rng.normal(0,1,len(t)))*np.exp(-t*20)*.4; put(fx,s,t0,g); put(rev,s*.4,t0,g)
def riser(t0,t1,g=.5,f0=200,f1=5000):
    n=int((t1-t0)*sr); t=tt(n); u=t/(t1-t0); f=f0*(f1/f0)**u; s=np.sin(2*np.pi*np.cumsum(f)/sr)*.35+hp(rng.normal(0,1,n))*.5
    s*=u**2.2; s[-int(.02*sr):]*=np.linspace(1,0,int(.02*sr)); put(fx,s,t0,g); put(rev,s*.3,t0,g)
def whoosh(t0,dur=.5,g=.5,up=True):
    n=int(dur*sr); t=tt(n); u=t/dur; env=np.sin(np.pi*u)**2; f=(300+3500*u) if up else (3800-3400*u)
    s=(hp(rng.normal(0,1,n))*.6+np.sin(2*np.pi*np.cumsum(f)/sr)*.25)*env; put(fx,s,t0,g)
def click(t0,g=.5,f=1900):
    t=tt(int(.06*sr)); s=np.sin(2*np.pi*f*t)*np.exp(-t*90)+hp(rng.normal(0,1,len(t)))*np.exp(-t*160)*.5; put(fx,s,t0,g)
def ding(t0,f=880,g=.4):
    t=tt(int(.7*sr)); s=(np.sin(2*np.pi*f*t)+.4*np.sin(2*np.pi*f*2.01*t))*np.exp(-t*7); put(fx,s,t0,g); put(rev,s*.4,t0,g)
def tick(t0,f,g=.25):
    t=tt(int(.02*sr)); put(fx,np.sin(2*np.pi*f*t)*np.exp(-t*140),t0,g)
def saw(f,n,k=14):
    t=tt(n); return sum(np.sin(2*np.pi*f*h*t)/h for h in range(1,k+1) if f*h<9000)
def bass(t0,f,dur=.24,g=.5):
    n=int(dur*sr); t=tt(n); s=(np.sin(2*np.pi*f*t)+.35*saw(f,n,5))*np.minimum(1,t/.004)*np.exp(-t*5); put(mus,s,t0,g)
def pluck(t0,f,g=.18,dur=.3):
    n=int(dur*sr); t=tt(n); s=saw(f,n,10)*np.exp(-t*11)*np.minimum(1,t/.003); put(mus,s,t0,g); put(rev,s,t0,g*.9)
def pad(t0,t1,freqs,g=.12):
    n=int((t1-t0)*sr); t=tt(n); env=np.minimum(1,t/1.0)*np.minimum(1,(t1-t0-t)/1.0); s=sum(np.sin(2*np.pi*f*t)+.5*np.sin(2*np.pi*f*1.005*t) for f in freqs)*env/len(freqs); put(mus,s,t0,g); put(rev,s*.5,t0,g)
roots=[55,55,43.65,49]; tri=lambda r:[r*2,r*2*2**(3/12) if r!=43.65 and r!=49 else (r*2*2**(4/12)),r*2*2**(7/12)]
def groove(a,b,kick_on=True,arp=True,hats=True,bass_on=True,claps=True,arp_g=.16):
    beat=.5; t=a
    while t<b-1e-6:
        bar=int(t//2)%4; r=roots[bar]; q=int(round((t%2)/.125))
        if kick_on and q%4==0: kick(t,.95)
        if claps and q in(4,12): clap(t)
        if hats and q%2==1: hat(t,.4,q%4==3)
        if hats and q%2==0 and q%4!=0: hat(t,.18)
        if bass_on and q%2==0 or (bass_on and q in(7,15)): bass(t,r*(2 if q in(6,14) else 1),.22,.55)
        if arp:
            ch=[r*4,r*4*2**((3 if bar<2 else 4)/12),r*4*2**(7/12)]; pluck(t,ch[[0,1,2,1,0,2,1,2][q%8]],arp_g)
        t+=.125
# ---------------- TIMELINE (34 s, 120 BPM, 1 temps = 0,5 s) ----------------
# A — HOOK 0:00–0:04 : COMPETE. (0.5) CREATE. (1.0) WIN. (1.5) puis montée vers le drop à 4.0
impact(0.0,1.0,1.6); zap(0.02,.5); whoosh(0.0,.5,.35)
for i in range(8): tick(0.05+i*.05,900+i*220,.3)
for t0,f in ((0.5,55),(1.0,65.4),(1.5,82.4)):
    impact(t0,.85,1.0); thud(t0,.8); pluck(t0,f*8,.25,.45); pluck(t0,f*12,.2,.45); click(t0,.4,1200+f*10)
zap(1.5,.8); impact(1.5,.9,1.6)
pad(1.5,4.0,[55,82.4,110,164.8],.12)
riser(2.0,4.0,.6,200,7000); whoosh(3.5,.5,.5)
for i in range(8): hat(2.5+i*.125*2,.35)
for i in range(16): clap(3.0+i*.0625*(1-0.3*i/16)*2,.25+.02*i) if i%2==0 else None
# B — UNIVERS 4:00–11:00 : drop, mots-catégories toutes les 0.5 s
impact(4.0,1.0,1.4); thud(4.0,.9)
groove(4.0,11.0,arp_g=.13)
for i in range(7): click(4.0+i*.5+.0,.35,1500+i*130); tick(4.0+i*.5+.03,2400+i*150,.22)
for i in range(6): thud(7.5+i*.12,.2)
whoosh(7.35,.5,.5); impact(7.5,.8,1.1)
for i in range(7): whoosh(7.8+i*.24,.28,.3)
impact(9.5,1.0,1.6); thud(9.5,1.0); zap(9.5,.4)
for t0 in (8.0,8.5,9.0,9.5,10.0,10.5): whoosh(t0-.1,.3,.2,False)
# C — COMPÉTITION 11:00–19:00
whoosh(10.75,.35,.5,False); impact(11.0,.95,1.4)
groove(11.0,19.0,arp_g=.11)
for t0 in (11.0,12.0,13.0): thud(t0,.9); ding(t0,[659,784,988][int((t0-11))],.3); click(t0,.5)
for i in range(15): tick(14.5+i*.14,500*(1.075**(i*2)),.25)   # ladder : 15 marches
ding(16.6,1318,.4); impact(16.6,.7,1.0)
def count(a,b,f0,f1,step=.035,g=.25):
    t=a
    while t<b: u=(t-a)/(b-a); tick(t,f0*(f1/f0)**u,g); t+=step*(1-.6*u)
whoosh(16.6,.3,.4)
for lo,hi in ((17.4,17.8),(18.0,18.4),(18.5,18.9)): count(lo,hi,600,3200); thud(hi,.9); impact(hi,.7,1.1)
# D — PROPOSITION 19:00–27:00
impact(19.0,.9,1.2); whoosh(18.8,.3,.4,False)
groove(19.0,27.0,arp_g=.14)
for t0 in (19.0,21.0,23.0,25.0): impact(t0,.55,.9); thud(t0,.7); click(t0,.45)
for t0 in (20.0,22.0,24.0,26.0): whoosh(t0-.2,.3,.25)
# E — FINALE 27:00–34:00 : montée, silence, impact logo
riser(25.5,28.0,.8,200,8000)
for i in range(20): hat(26.0+i*.1,.3+i*.012)
for i in range(16): clap(26.5+i*.09*(1-0.5*i/16),.3)
whoosh(27.5,.5,.6)
for k in range(3): thud(27.0+k/3,.7); click(27.0+k/3,.5,1400+k*300)
impact(28.0,1.2,2.6); zap(28.0,.6); thud(28.0,1.0)
groove(28.0,30.0,hats=True,claps=True,arp_g=.18)
pad(28.0,34.0,[55,82.4,110,164.8,220],.2)
for t0 in (29.0,29.5): click(t0,.3,1800)
whoosh(29.85,.3,.5); click(30.3,.7,1500); ding(30.3,1175,.4)
impact(30.3,.9,1.8)
ding(33.0,880,.12)
# ------------- mixage -------------
t=tt(N); duck=np.ones(N)
for k in kicks:
    i=int(k*sr); e=min(N,i+int(.3*sr)); dd=np.arange(e-i)/sr; duck[i:e]=np.minimum(duck[i:e],1-.7*np.exp(-dd/.09))
mus*=duck
ir=rng.normal(0,1,int(1.8*sr))*np.exp(-np.arange(int(1.8*sr))/sr*3.2); ir=lp(ir,3)
R_=np.fft.irfft(np.fft.rfft(rev,N+len(ir))*np.fft.rfft(ir,N+len(ir)))[:N]*.12
mix=drum*.9+mus*.8+fx*.9+R_
mix=lp(mix,1)  
fade=np.ones(N); fade[-int(1.2*sr):]=np.linspace(1,0,int(1.2*sr)); mix*=fade
mix=np.tanh(mix*1.1); mix/=np.max(np.abs(mix))/.9
# stéréo : léger décalage Haas sur la réverb + arp
Lc=mix+ np.roll(R_,int(.012*sr))*.3; Rc=mix+np.roll(R_,-int(.006*sr))*.3
st=np.stack([Lc,Rc],1); st/=np.max(np.abs(st))/.89
pcm=(st*32767).astype('<i2')
with wave.open('audio/tvec_official_soundtrack.wav','wb') as w: w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes(pcm.tobytes())
print('ok',DUR,'s')
