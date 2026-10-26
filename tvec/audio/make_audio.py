"""Sound design TVEC — synthèse 100 % originale (numpy), libre de droits. 120 BPM, A mineur. Sortie: audio/tvec_soundtrack.wav"""
import numpy as np, wave, sys
sr=44100; DUR=35.0; N=int(sr*DUR); rng=np.random.default_rng(3)
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
# ---------------- TIMELINE ----------------
# S1 hook
impact(0.06,1.0,1.2); 
for i in range(10): tick(.1+i*.04,900+i*180,.3)
whoosh(.1,.4,.25)
impact(.5,.95,1.5); thud(.5,.7)
pad(0.06,1.4,[55,82.4],.14)
for i in range(1): thud(1.0,.4)
zap(1.5,.8); impact(1.5,.8,1.4)
riser(1.7,3.0,.55,250,6000); whoosh(2.7,.35,.5)
# S2 groove
groove(3.0,6.5,hats=True,claps=False)
for t0 in (3.35,3.5,3.65): thud(t0,.7)
whoosh(3.2,.3,.3); whoosh(5.0,.3,.3,False); whoosh(5.25,.3,.3)
# S3
whoosh(6.25,.45,.5,False); impact(6.5,1.0,1.8)
for i in range(6): tick(6.75+i*.07+.32,700+i*160,.3)
for i in range(6): thud(6.75+i*.07+.32,.35)
groove(6.5,10.0,kick_on=True,claps=True); whoosh(7.4,.3,.3)
for t0 in (8.0,8.25,8.5): thud(t0,.8)
# S4
riser(9.0,10.0,.35,200,4000); whoosh(9.8,.4,.5); impact(10.0,.8,1.0)
groove(10.0,17.0,arp_g=.12)
for t0 in (11.0,13.0,15.0): ding(t0,880,.3)
for t0 in (11.95,12.7): click(t0,.5)
for i in range(9): click(13.15+i*.15,.22,1400+i*120)
click(16.5,.35,1500); click(16.7,.55); ding(16.95,1318,.4)
# S5
riser(15.8,17.0,.5,200,6000); whoosh(16.8,.4,.6)
groove(17.0,22.5,hats=True,arp_g=.14); thud(17.5,.8); impact(17.0,.7,1.0)
for i in range(8): tick(18.8+i*.15,800+i*130,.25)
whoosh(20.0,.5,.4); impact(20.5,.9,1.4); thud(20.7,.7)
# S6 compteurs
whoosh(22.25,.4,.5); impact(22.5,.9,1.2)
groove(22.5,26.5,kick_on=True,claps=True,arp_g=.09,bass_on=True)
def count(a,b,f0,f1,step=.035,g=.25):
    t=a
    while t<b: u=(t-a)/(b-a); tick(t,f0*(f1/f0)**u,g); t+=step*(1-.6*u)
count(23.0,23.5,600,3000); impact(23.5,1.0,1.5); thud(23.5,.9)
count(23.6,23.95,600,2800); thud(23.95,.8)
count(24.5,24.85,700,3200); impact(24.85,.8,1.2); count(25.0,25.4,700,3200); thud(25.4,.8)
click(24.9,.3)
# S7 calme
pad(26.5,30.2,[55,82.4,110,130.8],.22); 
for i in range(4): ding(27.0+i*.75,[659,784,988,1175][i],.28); click(27.0+i*.75,.4)
t=26.5
while t<29.0: 
    if int(round((t%2)/.5))%2==0: bass(t,55,.4,.45)
    t+=.5
whoosh(26.25,.4,.5,False); impact(26.5,.7,1.4)
# S8
riser(29.0,31.5,.7,200,7000); whoosh(30.0,.3,.4); impact(30.1,.75,1.8)
groove(31.5,33.5,hats=True,claps=True,arp_g=.2); impact(31.5,1.1,2.4); zap(31.5,.5)
whoosh(31.0,.4,.3)
click(33.45,.7,1500); ding(33.5,1175,.4)
impact(33.5,1.0,1.5); pad(33.5,35.0,[55,82.4,110,164.8],.18)
# ------------- mixage -------------
t=tt(N); duck=np.ones(N)
for k in kicks:
    i=int(k*sr); e=min(N,i+int(.3*sr)); dd=np.arange(e-i)/sr; duck[i:e]=np.minimum(duck[i:e],1-.7*np.exp(-dd/.09))
mus*=duck
ir=rng.normal(0,1,int(1.8*sr))*np.exp(-np.arange(int(1.8*sr))/sr*3.2); ir=lp(ir,3)
R_=np.fft.irfft(np.fft.rfft(rev,N+len(ir))*np.fft.rfft(ir,N+len(ir)))[:N]*.12
mix=drum*.9+mus*.8+fx*.9+R_
mix=lp(mix,1)  
fade=np.ones(N); fade[-int(.8*sr):]=np.linspace(1,0,int(.8*sr)); mix*=fade
mix=np.tanh(mix*1.1); mix/=np.max(np.abs(mix))/.9
# stéréo : léger décalage Haas sur la réverb + arp
Lc=mix+ np.roll(R_,int(.012*sr))*.3; Rc=mix+np.roll(R_,-int(.006*sr))*.3
st=np.stack([Lc,Rc],1); st/=np.max(np.abs(st))/.89
pcm=(st*32767).astype('<i2')
with wave.open('audio/tvec_soundtrack.wav','wb') as w: w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes(pcm.tobytes())
print('ok',DUR,'s')
