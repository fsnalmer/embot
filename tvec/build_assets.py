"""Découpe les assets originaux (affiches, logo, carte Breakdown) depuis refs/*.png, fond détouré par flood-fill."""
from PIL import Image, ImageDraw
import numpy as np, sys
MAG=(255,0,255)
def cut(src, box, out, seeds=None, thresh=14):
    im=Image.open(f'refs/{src}').convert('RGB').crop(box)
    w,h=im.size
    for s in (seeds or [(0,0),(w-1,0),(0,h-1),(w-1,h-1)]):
        if im.getpixel(s)!=MAG: ImageDraw.floodfill(im,s,MAG,thresh=thresh)
    a=np.array(im); mask=(a[:,:,0]==255)&(a[:,:,1]==0)&(a[:,:,2]==255)
    rgba=np.dstack([a,np.where(mask,0,255).astype('uint8')])
    Image.fromarray(rgba,'RGBA').save(f'assets/{out}'); print(out,im.size)
cut('1.png',(40,690,400,1200),'poster_sem_demora.png')
cut('3.png',(30,455,355,975),'g_sem.png')
cut('3.png',(325,490,625,985),'g_funk.png')
cut('3.png',(598,455,925,950),'g_baila.png')
cut('6.png',(55,435,645,1090),'breakdown_card.png')
cut('1.png',(60,62,210,108),'logo_tvec.png',thresh=18)
# offsets du groupe (coin haut-gauche dans l'image 3) pour garder les recouvrements d'origine
print(open('/dev/null').read())
