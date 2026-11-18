"""Build only the player panel, using the exact same component as the arena."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text())['version']
output = root / 'downloads' / ('painel-v' + version + '.zip')
files = ['css/card_touch.css', 'css/player_panel.css', 'css/player_panel_preview.css',
         'js/lab/characters.js', 'js/ui/player_panel.js', 'js/ui/player_panel_preview.js',
         'assets/menu-v036/german_beauty.ttf', 'assets/menu-v036/star.webp',
         'assets/card-touch-v044/star.png', 'docs/PAINEL_JOGADOR.md', 'docs/CARTAS_KIT.md']
files += ['assets/menu-v036/character-' + str(i) + '.webp' for i in range(5)]
for folder in ['assets/characters-v047', 'assets/player-panel-v048']:
    files += [str(p.relative_to(root)) for p in sorted((root / folder).glob('*'))]
output.parent.mkdir(exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    page = (root / 'painel.html').read_text().replace('<a href="laboratorio.html">Laboratório</a><a href="batalha.html">Testar na batalha</a>', '<a href="painel.html">Nova prévia</a>')
    archive.writestr('painel.html', page)
    for name in files:
        archive.write(root / name, name)
    archive.writestr('LEIA-ME.txt', 'GOGHOS — Painel do jogador v' + version + '\nExtraia TODO este ZIP e abra painel.html. Não precisa instalar nada.\nEscolha qualquer uma das 32 cartas e teste dano, cura e a exibição do fôlego. Clique na estrela, no coração, na espada e no losango para consultar os detalhes.\nOs controles desta página são apenas uma simulação visual. Consumo e recuperação de fôlego na batalha ainda aguardam regras.\nO projeto completo da mesma versão inclui este painel integrado à arena em batalha.html.\n')
print(output)
