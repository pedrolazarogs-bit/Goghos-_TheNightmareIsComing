"""Build a runnable lab-only ZIP without game or menu modules."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text())['version']
output = root / 'downloads' / ('laboratorio-v' + version + '.zip')
output.parent.mkdir(exist_ok=True)
files = ['docs/ARTES_PENDENTES.md', 'batalha.html','css/battle_lab.css','js/lab/battle.js','js/ui/battle_lab.js','assets/menu-v036/bg.jpg','assets/menu-v036/trophy.webp', 'oponente.html', 'laboratorio.html', 'css/laboratorio.css', 'js/lab_model.js', 'js/ui/laboratorio.js']
files += ['css/card_touch.css','js/ui/card_touch.js','js/ui/lab_opponent.js','assets/menu-v036/german_beauty.ttf']
files += [str(p.relative_to(root)) for p in sorted((root / 'assets/card-touch-v044').glob('*.png'))]
files += ['assets/menu-v036/character-' + str(i) + '.webp' for i in range(5)]
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for name in files:
        archive.write(root / name, name)
    archive.writestr('LEIA-ME.txt', 'GOGHOS — Laboratório v' + version + '\nExtraia todo este ZIP. Abra batalha.html para a arena 4x4. Abra oponente.html para a interação CardTouch. Abra laboratorio.html para todos os testes.\nNão precisa instalar nada. Os dados são fictícios e duram apenas nesta sessão.\nUse Exportar JSON para guardar o resultado dos testes.\n')
print(output)
