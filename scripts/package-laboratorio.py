"""Build a runnable lab-only ZIP without game or menu modules."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text())['version']
output = root / 'downloads' / ('laboratorio-v' + version + '.zip')
output.parent.mkdir(exist_ok=True)
files = ['js/lab/characters.js', 'docs/CARTAS_KIT.md', 'docs/ARTES_PENDENTES.md', 'batalha.html','css/battle_lab.css','js/lab/battle.js','js/ui/battle_lab.js','assets/menu-v036/bg.jpg','assets/menu-v036/trophy.webp', 'oponente.html', 'laboratorio.html', 'css/laboratorio.css', 'js/lab_model.js', 'js/ui/laboratorio.js']
files += ['css/card_touch.css','js/ui/card_touch.js','js/ui/lab_opponent.js','assets/menu-v036/german_beauty.ttf']
files += [str(p.relative_to(root)) for p in sorted((root / 'assets/card-touch-v044').glob('*.png'))]
files += ['assets/menu-v036/character-' + str(i) + '.webp' for i in range(5)]
files += [str(p.relative_to(root)) for p in sorted((root / 'assets/characters-v047').glob('*'))]
files += ['css/card_values.css', 'js/ui/card_values.js']
files += ['css/player_panel.css', 'js/ui/player_panel.js', 'assets/menu-v036/star.webp', 'docs/PAINEL_JOGADOR.md']
files += [str(p.relative_to(root)) for p in sorted((root / 'assets/player-panel-v048').glob('*'))]
files += ['painel.html', 'css/player_panel_preview.css', 'js/ui/player_panel_preview.js']
files += ['css/scoreboard.css', 'js/ui/scoreboard.js', 'docs/PLACAR.md']
files += [str(p.relative_to(root)) for p in sorted((root / 'assets/scoreboard-v049').glob('*'))]
files += ['placar.html', 'css/scoreboard_preview.css', 'js/ui/scoreboard_preview.js']
files += ['docs/FAIXAS_PERSONAGENS.md']
files += [str(p.relative_to(root)) for p in sorted((root / 'assets/turn-order-v050').glob('*'))]
files += ['js/lab/supports.js', 'js/ui/supports.js', 'css/supports.css', 'docs/APOIOS.md']
files += [str(p.relative_to(root)) for p in sorted((root / 'assets/supports-v051').glob('*'))]
files += ['apoios.html', 'css/supports_preview.css', 'js/ui/supports_preview.js']
import subprocess
subprocess.run(['python3', str(root/'scripts/package-arena-original.py')], check=True)
with ZipFile(root/'downloads'/f'arena-original-v{version}.zip') as arena:
    files += ['arena-batalha.html'] + [name for name in arena.namelist() if name not in files and name not in ['batalha.html','LEIA-ME.txt']]
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for name in files:
        archive.write(root / name, name)
    archive.writestr('LEIA-ME.txt', 'GOGHOS — Laboratório v' + version + '\nExtraia todo este ZIP. Abra placar.html para testar só o placar. Abra painel.html para testar só o painel do jogador. Abra batalha.html para a arena 4x4. Abra oponente.html para a interação CardTouch. Abra laboratorio.html para todos os testes.\nNão precisa instalar nada. Os dados duram apenas nesta sessão. A arena usa os atributos impressos nas cartas; a mesa de cliques usa valores fictícios.\nUse Exportar JSON para guardar o resultado dos testes.\n')
print(output)
