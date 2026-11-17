"""Build a runnable lab-only ZIP without game or menu modules."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text())['version']
output = root / 'downloads' / ('laboratorio-v' + version + '.zip')
output.parent.mkdir(exist_ok=True)
files = ['laboratorio.html', 'css/laboratorio.css', 'js/lab_model.js', 'js/ui/laboratorio.js']
files += ['assets/menu-v036/character-' + str(i) + '.webp' for i in range(3)]
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for name in files:
        archive.write(root / name, name)
    archive.writestr('LEIA-ME.txt', 'GOGHOS — Laboratório v' + version + '\nExtraia todo este ZIP e abra laboratorio.html no navegador.\nNão precisa instalar nada. Os dados são fictícios e duram apenas nesta sessão.\nUse Exportar JSON para guardar o resultado dos testes.\n')
print(output)
