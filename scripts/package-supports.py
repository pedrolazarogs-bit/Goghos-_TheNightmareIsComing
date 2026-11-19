"""Build only the support acquisition, HUD and effect test bench."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text())['version']
output = root / 'downloads' / ('apoios-v' + version + '.zip')
files = ['css/supports.css', 'css/supports_preview.css', 'js/lab/characters.js',
         'js/lab/supports.js', 'js/lab/battle.js', 'js/ui/supports.js',
         'js/ui/supports_preview.js', 'assets/menu-v036/german_beauty.ttf', 'docs/APOIOS.md']
files += [str(p.relative_to(root)) for p in sorted((root / 'assets/supports-v051').glob('*'))]
output.parent.mkdir(exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    page = (root / 'apoios.html').read_text().replace('<a href="laboratorio.html">Laboratório</a><a href="batalha.html">Testar na batalha</a>', '<a href="apoios.html">Nova prévia</a>')
    archive.writestr('apoios.html', page)
    for name in files:
        archive.write(root / name, name)
    archive.writestr('LEIA-ME.txt', 'GOGHOS — Apoios v' + version + '\nExtraia TODO este ZIP e abra apoios.html. Não precisa instalar nada.\nClique em Obter apoios, escolha uma carta e confirme Obter e equipar. Até três apoios diferentes.\nInicie o teste. Clique nos ícones pequenos para ativar: uso único por carta em toda a série, na sua vez e sem gastar o ataque.\nBandeide cura até 70; Na Moleira acrescenta 50 ao próximo ataque; Escudo Volátil bloqueia até 80 do próximo ataque recebido; Papakill elimina oponente com 1 a 39 PV.\nAjuste os campos de vida para testar as condições. Os ataques da bancada devolvem a vez ao seu personagem; a arena completa mantém os turnos normais.\nOs outros seis apoios aguardam definições, indicadas ao clicar. A máscara ainda não tem carta completa.\nSimular fim do ciclo conclui a volta e entrega um apoio. Se os três espaços estiverem ocupados, guarde e consulte RECEBIDOS; cada cópia tem um uso.\nOs testes não alteram a coleção, o menu nem o progresso real.\n')
print(output)
