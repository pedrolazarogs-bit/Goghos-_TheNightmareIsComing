"""Build the exact opening -> menu Play -> battle flow as a standalone preview."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json, re, subprocess
root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text())['version']
subprocess.run(['python3', str(root / 'scripts/package-battle.py')], check=True)
with ZipFile(root / 'downloads' / f'batalha-v{version}.zip') as battle:
    files = {name: battle.read(name) for name in battle.namelist() if name != 'LEIA-ME.txt'}
index = (root / 'index.html').read_text()
for name in ['index.html'] + re.findall(r'(?:src|href)="([^"]+)"', index):
    files[name] = (root / name).read_bytes()
for folder in ['menu-v036', 'menu-v041', 'intro-v036', 'intro-preview', 'victory-v037', 'music-v0361']:
    for path in sorted((root / 'assets' / folder).rglob('*')):
        if path.is_file():
            files[path.relative_to(root).as_posix()] = path.read_bytes()
# Directly opening the preview's battle should also have a valid way back.
files['batalha.html'] = (root / 'batalha.html').read_text().replace('href="laboratorio.html"', 'href="index.html"').replace('← Laboratório', '← Menu').encode()
files['LEIA-ME.txt'] = (f'GOGHOS — Menu e batalha v{version}\n'
    'Extraia TODO este ZIP e abra index.html. Não precisa instalar nada.\n'
    'No computador: conclua o carregamento e a apresentação, pressione uma tecla e clique em Play.\n'
    'Escolha seu personagem e clique em Iniciar batalha. Você controla um personagem; os outros sete são bots.\n'
    'Use ← Menu para voltar à abertura obrigatória. Play também aceita Tab + Enter ou Espaço.\n'
    'Somente Play foi conectado. Os demais ícones e a versão de celular mantêm o comportamento anterior.\n'
    'O jogo não salva progresso desta batalha.\n').encode()
output = root / 'downloads' / f'menu-batalha-v{version}.zip'
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for name, data in sorted(files.items()):
        archive.writestr(name, data)
print(output)
