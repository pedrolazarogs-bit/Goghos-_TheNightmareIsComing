# Gera as máscaras dos vazados das molduras (onde aparece a cor da raridade) e as embute em js/ui/holes-data.js
# (embutir é necessário para funcionar abrindo o jogo direto do disco). Rode de novo se alguma moldura mudar:
#   python3 tools/make_holes_mask.py        (precisa de pillow, numpy, scipy)
# --holes = moldura comum (também serve para a do Mago) · --holes-assassin = moldura própria dos Assassins.
import base64,io,os
import numpy as np
from PIL import Image
from scipy import ndimage as nd
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
FRAMES=[('--holes','card_base.png','card_holes_mask.png'),('--holes-assassin','card_base_assassin.png','card_holes_mask_assassin.png')]
vars_=[]
for var,frame,out in FRAMES:
    a=np.array(Image.open(f'{R}/assets/cards/{frame}').convert('RGBA'))[:,:,3]
    lab,n=nd.label(a<40);sizes=nd.sum(np.ones_like(a),lab,range(1,n+1))
    edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))
    holes=[i+1 for i,s in enumerate(sizes) if (i+1) not in edge and s<300000]   # fora o fundo e a janela da arte
    m=nd.binary_dilation(np.isin(lab,holes),iterations=3)
    img=Image.new('RGBA',(a.shape[1],a.shape[0]),(255,255,255,0));img.putalpha(Image.fromarray((m*255).astype(np.uint8)))
    buf=io.BytesIO();img.save(buf,'PNG',optimize=True);open(f'{R}/assets/cards/{out}','wb').write(buf.getvalue())
    vars_.append(f'{var}:url("data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}")');print(var,'| furos:',len(holes),'| PNG',len(buf.getvalue()),'bytes')
open(f'{R}/js/ui/holes-data.js','w').write("// GERADO por tools/make_holes_mask.py — não edite. Máscaras embutidas (data URI) para funcionar via file://.\n(function(){var s=document.createElement('style');s.textContent=':root{"+";".join(vars_)+"}';document.head.appendChild(s);})();\n")
