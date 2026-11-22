"""Package the supplied arena and its original GOGHOS artwork for offline play."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json,re

root=Path(__file__).resolve().parents[1]
version=json.loads((root/'package.json').read_text())['version']
out=root/'downloads'/f'arena-original-v{version}.zip'
files=['css/arena.css','css/arena-original.css','css/card_touch.css']
files += [p.relative_to(root).as_posix() for p in sorted((root/'js/arena').glob('*.js'))]
files += ['assets/menu-v036/'+name for name in ['bg.jpg','trophy.webp','star.webp','german_beauty.ttf']+[f'character-{i}.webp' for i in range(5)]]
files += ['assets/card-touch-v044/'+n+'.png' for n in ['heart','sword','star']]
files += ['assets/scoreboard-v049/scoreboard.png']
files += ['assets/player-panel-v048/'+n+'.png' for n in ['damage','heart','health-bar','panel-base']]
for code,slug in re.findall(r"\['([0-9_]+)','([a-z]+)'",(root/'js/arena/art.js').read_text()):
    files += [f'assets/characters-v047/Original-Base{code}.png',f'assets/turn-order-v050/{slug}.png']
# Preserve the previous touch arena alongside the updated desktop implementation.
files += ['arena-toque.html','assets/arena/penxy.webp','assets/arena/mao-vazia.png',
          'assets/characters-v047/Original-Base68_20261023181416.png','assets/turn-order-v050/penxy.png']
files += [p.relative_to(root).as_posix() for p in sorted((root/'css').glob('penxy-*.css'))]
files += [p.relative_to(root).as_posix() for p in sorted((root/'js/penxy').glob('*.js'))]
out.parent.mkdir(exist_ok=True)
with ZipFile(out,'w',ZIP_DEFLATED) as z:
    z.writestr('batalha.html',(root/'arena-batalha.html').read_text().replace('href="arena-batalha.html"','href="batalha.html"'))
    for name in files:z.write(root/name,name)
    z.writestr('LEIA-ME.txt','GOGHOS v'+version+'\nExtraia a pasta inteira e abra batalha.html no computador. Escolha o seu personagem e clique em Iniciar batalha.\n')
print(out)
