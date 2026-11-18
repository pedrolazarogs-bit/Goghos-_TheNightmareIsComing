"""Build the standalone arena preview without game/menu screens."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text())['version']
output = root / 'downloads' / ('batalha-v' + version + '.zip')
files = ['css/battle_lab.css', 'css/card_touch.css', 'js/lab/battle.js', 'js/ui/battle_lab.js', 'js/ui/card_touch.js']
files += ['assets/menu-v036/' + name for name in ['german_beauty.ttf', 'bg.jpg', 'trophy.webp']]
files += ['assets/menu-v036/character-' + str(i) + '.webp' for i in range(5)]
files += ['assets/card-touch-v044/' + name + '.png' for name in ['heart', 'sword', 'star']]
output.parent.mkdir(exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    # Only navigation changes in the isolated preview; the arena code is identical.
    page = (root / 'batalha.html').read_text().replace('href="laboratorio.html"', 'href="batalha.html"').replace('← Laboratório', '← Nova sessão')
    archive.writestr('batalha.html', page)
    for name in files:
        archive.write(root / name, name)
    archive.writestr('LEIA-ME.txt', 'GOGHOS — Arena 4x4 v' + version + '\nExtraia todo este ZIP e abra batalha.html no navegador.\nEscolha quatro personagens por equipe e inicie a batalha.\nClique no oponente para usar ATACAR. Quem fizer 3 pontos vence.\nControle: Azul x computador, Manual ou Automático.\nVida e dano são provisórios. Nenhuma habilidade especial foi inventada.\nApoios, habilidade e item têm espaços de inspeção, sem efeitos configurados.\nO cronômetro conta toda a série, incluindo pausas e intervalos.\n')
print(output)
