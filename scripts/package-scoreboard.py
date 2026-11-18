"""Build only the supplied scoreboard and its isolated test controls."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text())['version']
output = root / 'downloads' / ('placar-v' + version + '.zip')
files = ['css/card_touch.css', 'css/scoreboard.css', 'css/scoreboard_preview.css',
         'js/ui/scoreboard.js', 'js/ui/scoreboard_preview.js', 'assets/menu-v036/german_beauty.ttf',
         'assets/scoreboard-v049/scoreboard.png', 'assets/scoreboard-v049/manifest.json', 'docs/PLACAR.md']
output.parent.mkdir(exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    page = (root / 'placar.html').read_text().replace('<a href="laboratorio.html">Laboratório</a><a href="batalha.html">Testar na batalha</a>', '<a href="placar.html">Nova prévia</a>')
    archive.writestr('placar.html', page)
    for name in files:
        archive.write(root / name, name)
    archive.writestr('LEIA-ME.txt', 'GOGHOS — Placar v' + version + '\nExtraia TODO este ZIP e abra placar.html. Não precisa instalar nada.\nClique em Iniciar série de teste e simule vitórias para as equipes azul e vermelha. Quem alcançar três pontos vence; o cronômetro congela no resultado final. Reiniciar prévia limpa o placar e o tempo.\nEsta página testa somente o placar. O projeto completo traz a mesma arte e o mesmo componente na arena de computador em batalha.html. Os pontos da arena continuam dependendo da eliminação dos quatro adversários.\n')
print(output)
