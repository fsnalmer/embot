"""Musique + sound design des 6 shorts TVEC — synthèse 100 % originale (numpy), libre de droits.
Chaque vidéo a son tempo/style. Temps musicaux = beats (identiques à compositions/shorts.html).
Usage : python3 audio/make_shorts_audio.py [nom …]  ->  audio/shorts/<nom>.wav"""
import numpy as np, wave, sys
sr=44100
rng=np.random.default_rng(5)
class Mix:
    def __init__(s,dur):
        s.N=int(sr*dur); s.drum=np.zeros(s.N); s.mus=np.zeros(s.N); s.fx=np.zeros(s.N); s.rev=np.zeros(s.N); s.kicks=[]
def tt(n): return np.arange(n)/sr
def put(buf,sig,t0,g=1.0):
    i=int(t0*sr)
    if i<0 or i>=len(buf): return
    e=min(len(buf),i+len(sig)); buf[i:e]+=sig[:e-i]*g
def lp(x,k): return np.convolve(x,np.ones(k)/k,mode='same')
def hp(x): return np.diff(x,prepend=0)
def saw(f,n,k=14):
    t=tt(n); return sum(np.sin(2*np.pi*f*h*t)/h for h in range(1,k+1) if f*h<9000)
class Synth:
    def __init__(s,dur,bpm): s.m=Mix(dur); s.bpm=bpm; s.B=60/bpm
    def T(s,b): return b*s.B
    def kick(s,t0,g=.95,sub=False):
        t=tt(int(.5*sr)); f=(44 if sub else 48)+110*np.exp(-t*28); ph=2*np.pi*np.cumsum(f)/sr
        x=np.sin(ph)*np.exp(-t*(5 if sub else 7))+.3*np.sin(ph*2)*np.exp(-t*30); x[:90]+=rng.normal(0,.4,90)*np.linspace(1,0,90)
        put(s.m.drum,x,t0,g); s.m.kicks.append(t0)
    def clap(s,t0,g=.8):
        t=tt(int(.25*sr)); n=hp(hp(rng.normal(0,1,len(t)))); e=sum(np.exp(-np.clip(t-d,0,None)*38)*(t>=d) for d in (0,.012,.024))*.5
        put(s.m.drum,n*e*np.exp(-t*8),t0,g*.6)
    def hat(s,t0,g=.4,o=False):
        t=tt(int((.18 if o else .06)*sr)); n=hp(hp(rng.normal(0,1,len(t)))); put(s.m.drum,n*np.exp(-t*(18 if o else 70)),t0,g*.5)
    def cow(s,t0,g=.35):
        t=tt(int(.25*sr)); x=(np.sign(np.sin(2*np.pi*800*t))+np.sign(np.sin(2*np.pi*540*t)))*np.exp(-t*18)*.4; put(s.m.drum,lp(x,3),t0,g)
    def thud(s,t0,g=.8):
        t=tt(int(.3*sr)); f=40+90*np.exp(-t*30); x=np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-t*14)+rng.normal(0,.15,len(t))*np.exp(-t*90); put(s.m.fx,x,t0,g)
    def impact(s,t0,g=1.0,long=1.6):
        t=tt(int(long*sr)); f=32+80*np.exp(-t*9); x=np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-t*2.2)
        n=lp(rng.normal(0,1,len(t)),6)*np.exp(-t*7)*.5; x=x+n; put(s.m.fx,x,t0,g); put(s.m.rev,x*.5,t0,g*.5)
    def zap(s,t0,g=.7):
        t=tt(int(.5*sr)); f=3000*np.exp(-t*6)+300; x=np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-t*8)+hp(rng.normal(0,1,len(t)))*np.exp(-t*20)*.4; put(s.m.fx,x,t0,g); put(s.m.rev,x*.4,t0,g)
    def riser(s,t0,t1,g=.5,f0=200,f1=5000):
        n=int((t1-t0)*sr); t=tt(n); u=t/(t1-t0); f=f0*(f1/f0)**u; x=np.sin(2*np.pi*np.cumsum(f)/sr)*.35+hp(rng.normal(0,1,n))*.5
        x*=u**2.2; k=int(.02*sr); x[-k:]*=np.linspace(1,0,k); put(s.m.fx,x,t0,g); put(s.m.rev,x*.3,t0,g)
    def whoosh(s,t0,dur=.5,g=.5,up=True):
        n=int(dur*sr); t=tt(n); u=t/dur; env=np.sin(np.pi*u)**2; f=(300+3500*u) if up else (3800-3400*u)
        x=(hp(rng.normal(0,1,n))*.6+np.sin(2*np.pi*np.cumsum(f)/sr)*.25)*env; put(s.m.fx,x,t0,g)
    def click(s,t0,g=.5,f=1900):
        t=tt(int(.06*sr)); x=np.sin(2*np.pi*f*t)*np.exp(-t*90)+hp(rng.normal(0,1,len(t)))*np.exp(-t*160)*.5; put(s.m.fx,x,t0,g)
    def ding(s,t0,f=880,g=.4):
        t=tt(int(.7*sr)); x=(np.sin(2*np.pi*f*t)+.4*np.sin(2*np.pi*f*2.01*t))*np.exp(-t*7); put(s.m.fx,x,t0,g); put(s.m.rev,x*.4,t0,g)
    def tick(s,t0,f,g=.25):
        t=tt(int(.02*sr)); put(s.m.fx,np.sin(2*np.pi*f*t)*np.exp(-t*140),t0,g)
    def count(s,a,b,f0=600,f1=3200,step=.035,g=.25):
        t=a
        while t<b: u=(t-a)/(b-a); s.tick(t,f0*(f1/f0)**u,g); t+=step*(1-.6*u)
    def bass(s,t0,f,dur=.24,g=.5,long=False):
        n=int(dur*sr); t=tt(n); x=(np.sin(2*np.pi*f*t)+.35*saw(f,n,5))*np.minimum(1,t/.004)*np.exp(-t*(2.5 if long else 5)); put(s.m.mus,x,t0,g)
    def pluck(s,t0,f,g=.18,dur=.3,dec=11):
        n=int(dur*sr); t=tt(n); x=saw(f,n,10)*np.exp(-t*dec)*np.minimum(1,t/.003); put(s.m.mus,x,t0,g); put(s.m.rev,x,t0,g*.9)
    def pad(s,t0,t1,freqs,g=.12):
        n=int((t1-t0)*sr); t=tt(n); env=np.minimum(1,t/1.0)*np.minimum(1,(t1-t0-t)/1.0); x=sum(np.sin(2*np.pi*f*t)+.5*np.sin(2*np.pi*f*1.005*t) for f in freqs)*env/len(freqs); put(s.m.mus,x,t0,g); put(s.m.rev,x*.5,t0,g)
    def groove(s,b0,b1,style='house',roots=(55,55,43.65,49),arp_g=.14,minor=True,bass_g=.55):
        B=s.B; st=B/4; t=s.T(b0); end=s.T(b1); k=0
        while t<end-1e-6:
            q=k%16; bar=(k//16)%len(roots); r=roots[bar]
            ch=[r*4,r*4*2**((3 if minor else 4)/12),r*4*2**(7/12)]
            if style=='house':
                if q%4==0: s.kick(t)
                if q in(4,12): s.clap(t)
                if q%2==1: s.hat(t,.4,q%4==3)
                if q%2==0 and q%4!=0: s.hat(t,.18)
                if q%2==0 or q in(7,15): s.bass(t,r*(2 if q in(6,14) else 1),.22,bass_g)
                s.pluck(t,ch[[0,1,2,1,0,2,1,2][q%8]],arp_g)
            elif style=='trap':
                if q in(0,7,10): s.kick(t,1.0,True)
                if q==8: s.clap(t,.9)
                if q%2==0: s.hat(t,.35)
                if q in(14,15): s.hat(t,.3)
                if q in(0,7,10): s.bass(t,r*.5*2,.45,bass_g+.1,True)
                if q%4==0: s.pluck(t,ch[[0,2,1,2][(q//4)%4]]*(2 if q>=8 else 1),arp_g,.35,7)
            elif style=='uplift':
                if q%4==0: s.kick(t)
                if q in(4,12): s.clap(t)
                s.hat(t,.22 if q%2 else .3,q%4==2)
                if q%2==0: s.bass(t,r,.2,bass_g)
                s.pluck(t,ch[[0,1,2,1,2,1,0,1][q%8]]*(2 if (k//16)%2 else 1),arp_g+.03)
            elif style=='lofi':
                if q in(0,10): s.kick(t,.9)
                if q in(4,12): s.clap(t,.55)
                if q%2==0: s.hat(t,.2)
                if q in(0,6,10): s.bass(t,r,.4,bass_g,True)
                if q in(0,3,6,8,11): s.pluck(t,ch[[0,1,2,1,0][ [0,3,6,8,11].index(q) ]],arp_g,.4,6)
            elif style=='cine':
                if q in(0,8): s.kick(t,.8,True)
                if q==0: s.bass(t,r,1.0,bass_g,True)
                if q%8==4: s.hat(t,.25,True)
                if q%8==0: s.pluck(t,ch[(q//8+k//16)%3]*2,arp_g,.6,4)
            elif style=='phonk':
                if q in(0,3,8,11): s.kick(t,1.0,True)
                if q in(4,12): s.clap(t,.85)
                if q in(2,6,10,14): s.cow(t,.32)
                if q%2==0: s.hat(t,.3)
                if q in(0,3,8,11): s.bass(t,r*.5*2,.4,bass_g+.1,True)
                if q%4==0: s.pluck(t,ch[(q//4)%3]*2,arp_g,.3,9)
            t+=st; k+=1
    def render(s,path,fade=1.2):
        m=s.m; N=m.N; duck=np.ones(N)
        for k in m.kicks:
            i=int(k*sr); e=min(N,i+int(.3*sr)); dd=np.arange(e-i)/sr; duck[i:e]=np.minimum(duck[i:e],1-.7*np.exp(-dd/.09))
        mus=m.mus*duck
        ir=rng.normal(0,1,int(1.8*sr))*np.exp(-np.arange(int(1.8*sr))/sr*3.2); ir=lp(ir,3)
        R=np.fft.irfft(np.fft.rfft(m.rev,N+len(ir))*np.fft.rfft(ir,N+len(ir)))[:N]*.12
        mix=m.drum*.9+mus*.8+m.fx*.9+R; f=np.ones(N); k=int(fade*sr); f[-k:]=np.linspace(1,0,k); mix*=f
        mix=np.tanh(mix*1.1); mix/=np.max(np.abs(mix))/.9
        L=mix+np.roll(R,int(.012*sr))*.3; Rr=mix+np.roll(R,-int(.006*sr))*.3; st=np.stack([L,Rr],1); st/=np.max(np.abs(st))/.89
        with wave.open(path,'wb') as w: w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((st*32767).astype('<i2').tobytes())
        print(path,round(N/sr,2),'s')
def cta(s,b0,beats_end,btn_beat=4,tail_pad=True):
    """Final commun : montée, impact logo, bouton, impact net."""
    s.riser(s.T(b0-2.5),s.T(b0),.7,200,7000); s.whoosh(s.T(b0-.6),.35,.5)
    s.impact(s.T(b0),1.15,2.4); s.zap(s.T(b0),.5); s.thud(s.T(b0),1.0)
    s.pad(s.T(b0),s.T(beats_end),[55,82.4,110,164.8,220],.18)
    s.whoosh(s.T(b0+btn_beat)-.2,.3,.5); s.click(s.T(b0+btn_beat),.7,1500); s.ding(s.T(b0+btn_beat),1175,.4); s.impact(s.T(b0+btn_beat),.85,1.8)
def slides_hits(s,starts,g=.7):
    for b in starts: s.whoosh(s.T(b)-.2,.3,.35,False); s.impact(s.T(b),g,1.1); s.thud(s.T(b),.8)

def money():
    s=Synth(60/140*42,140); B=s.B
    s.impact(0,1.0,1.6); s.zap(.02,.5)
    for i in range(10): s.tick(.05+i*.045,900+i*200,.3)
    s.thud(s.T(1.2),.6); s.ding(s.T(1.2),880,.25)
    s.pad(0,s.T(6),[55,82.4,110],.12); s.riser(s.T(3),s.T(6),.55,200,6000)
    s.groove(6,33,'trap',roots=(55,55,43.65,49),arp_g=.12)
    for i in range(7): s.whoosh(s.T(6)+.5*B*0+i*.24+.1,.28,.3)
    slides_hits(s,[6,14,25],.8)
    for at in (3.5,5.5,7.5): 
        a=s.T(14+at); s.count(a,a+.5); s.thud(a+.5,.9); s.impact(a+.5,.6,1.0)
    for b in (25,25.6,26.2): s.click(s.T(b),.4,1500+int(b*20))
    cta(s,33,42,4); s.render('audio/shorts/money.wav')
def steps():
    s=Synth(60/120*38,120)
    s.impact(0,1.0,1.4); s.zap(.02,.5)
    for b in (0,1): s.thud(s.T(b),.8); s.impact(s.T(b),.7,1.0)
    s.pad(0,s.T(4),[55,82.4,110,164.8],.12); s.riser(s.T(1.5),s.T(4),.55,200,7000)
    s.groove(4,29,'house',arp_g=.12)
    for i,b in enumerate((4,8,12,16)): s.impact(s.T(b),.6,.9); s.click(s.T(b)+.05,.5,1500+i*200); s.ding(s.T(b)+.05,[659,784,988,1175][i],.3)
    for i in range(9): s.click(s.T(8.6)+i*.12,.2,1400+i*100)
    slides_hits(s,[20],.8); s.thud(s.T(21.1),.8); s.click(s.T(21.1),.5)
    cta(s,29,38,4); s.render('audio/shorts/steps.wav')
def ranked():
    s=Synth(60/128*36,128)
    s.impact(0,1.0,1.4); s.zap(.02,.5)
    for b in (0,1): s.thud(s.T(b),.8); s.impact(s.T(b),.7,1.0)
    s.pad(0,s.T(4),[55,82.4,110,164.8],.12); s.riser(s.T(1.5),s.T(4),.55,200,7000)
    s.groove(4,27,'uplift',roots=(55,43.65,65.4,49),arp_g=.13)
    s.impact(s.T(4),.9,1.2)
    st0=s.T(4+1.2); sd=(s.T(13)-s.T(1.2)-s.T(1.6))/15
    for i in range(15): s.tick(st0+i*sd,500*(1.075**(i*2)),.28)
    s.ding(s.T(4+13)-s.T(1.6),1318,.4)
    slides_hits(s,[17],.85)
    for b in (1.2,2.6,4,5.4): s.thud(s.T(17+b),.8); s.click(s.T(17+b),.5,1400+int(b*100)); s.ding(s.T(17+b),[784,988,1175,1568][[1.2,2.6,4,5.4].index(b)],.3)
    cta(s,27,36,4); s.render('audio/shorts/ranked.wav')
def faq():
    s=Synth(60/100*34,100)
    s.impact(0,.9,1.3); s.thud(0,.7); s.thud(s.T(.8),.6)
    s.pad(0,s.T(3),[55,82.4,110],.12); s.riser(s.T(1.2),s.T(3),.45,200,5000)
    s.groove(3,25,'lofi',roots=(55,43.65,65.4,49),arp_g=.17,bass_g=.5)
    for at in (0,4,8,12,16):
        b=3+at; s.whoosh(s.T(b)-.15,.25,.3,False); s.click(s.T(b),.35,1300)
        s.impact(s.T(b+.9),.7,1.0); s.thud(s.T(b+.9),.8); s.ding(s.T(b+.9),[880,1047,988,659,1175][(at//4)],.3)
    slides_hits(s,[25],.5)
    cta(s,25,34,4); s.render('audio/shorts/faq.wav')
def sponsors():
    s=Synth(60/112*38,112)
    s.impact(0,1.0,1.6); s.zap(.02,.4)
    for b in (0,.6,1.2): s.thud(s.T(b),.6)
    s.pad(0,s.T(7),[55,82.4,110,164.8,220],.16); s.riser(s.T(4),s.T(7),.55,200,6000)
    s.groove(7,30,'cine',roots=(55,43.65,65.4,49),arp_g=.14)
    slides_hits(s,[7,14,24],.8)
    for i in range(7): s.click(s.T(7+i),.4,1400+i*110); s.tick(s.T(7+i)+.03,2400+i*150,.22); s.whoosh(s.T(7+i)-.1,.25,.2)
    for b in (2,3.6,5.2): s.thud(s.T(14+b),.8); s.ding(s.T(14+b),[784,988,1175][[2,3.6,5.2].index(b)],.3)
    for b,(lo,hi) in zip((1.2,2.4,3.6),((0,.4),(0,.4),(0,.4))):
        a=s.T(24+b); s.count(a,a+.45); s.thud(a+.45,.8)
    cta(s,30,38,4); s.render('audio/shorts/sponsors.wav')
def spotlight():
    s=Synth(60/130*36,130)
    s.impact(0,1.0,1.6); s.zap(.02,.5); s.thud(s.T(.5),.8)
    s.groove(0,27,'phonk',roots=(55,55,43.65,49),arp_g=.1)
    for b in (2,4,6,8): s.impact(s.T(b),.7,1.0); s.thud(s.T(b),.8); s.whoosh(s.T(b)-.15,.25,.3)
    a=s.T(8)+.05; s.count(a,a+.55)
    slides_hits(s,[12,20],.85)
    for b in (.6,1.2): s.thud(s.T(12+b),.7); s.click(s.T(12+b),.45)
    s.ding(s.T(12+1.8),1047,.3); s.ding(s.T(12+2.6),1175,.3)
    s.thud(s.T(20.8),.8); s.click(s.T(20.8),.5)
    cta(s,27,36,4); s.render('audio/shorts/spotlight.wav')
V={'money':money,'steps':steps,'ranked':ranked,'faq':faq,'sponsors':sponsors,'spotlight':spotlight}
if __name__=='__main__':
    for n in (sys.argv[1:] or list(V)): V[n]()
