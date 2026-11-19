"""Build the standalone arena preview without game/menu screens."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text())['version']
output = root / 'downloads' / ('batalha-v' + version + '.zip')
files = ['js/lab/characters.js', 'docs/CARTAS_KIT.md', 'docs/ARTES_PENDENTES.md', 'css/battle_lab.css', 'css/card_touch.css', 'js/lab/battle.js', 'js/ui/battle_lab.js', 'js/ui/card_touch.js']
files += ['assets/menu-v036/' + name for name in ['german_beauty.ttf', 'bg.jpg', 'trophy.webp']]
files += ['assets/menu-v036/character-' + str(i) + '.webp' for i in range(5)]
files += ['assets/card-touch-v044/' + name + '.png' for name in ['heart', 'sword', 'star']]
output.parent.mkdir(exist_ok=True)
files += [str(p.relative_to(root)) for p in sorted((root / 'assets/characters-v047').glob('*'))]
files += ['css/player_panel.css', 'js/ui/player_panel.js', 'assets/menu-v036/star.webp', 'docs/PAINEL_JOGADOR.md']
files += [str(p.relative_to(root)) for p in sorted((root / 'assets/player-panel-v048').glob('*'))]
files += ['css/scoreboard.css', 'js/ui/scoreboard.js', 'docs/PLACAR.md']
files += [str(p.relative_to(root)) for p in sorted((root / 'assets/scoreboard-v049').glob('*'))]
files += ['docs/FAIXAS_PERSONAGENS.md']
files += [str(p.relative_to(root)) for p in sorted((root / 'assets/turn-order-v050').glob('*'))]
files += ['js/lab/supports.js', 'js/ui/supports.js', 'css/supports.css', 'docs/APOIOS.md']
files += [str(p.relative_to(root)) for p in sorted((root / 'assets/supports-v051').glob('*'))]
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    # Only navigation changes in the isolated preview; the arena code is identical.
    page = (root / 'batalha.html').read_text().replace('href="laboratorio.html"', 'href="batalha.html"').replace('← Laboratório', '← Nova sessão')
    archive.writestr('batalha.html', page)
    for name in files:
        archive.write(root / name, name)
    archive.writestr('LEIA-ME.txt', 'GOGHOS — Arena 4x4 v' + version + '\nExtraia todo este ZIP e abra batalha.html no navegador.\nEscolha seu personagem. Os outros sete são bots; cada bot espera 3,2 segundos antes de agir.\nClique no oponente para usar ATACAR. Quem fizer 3 pontos vence.\nVocê controla apenas o personagem escolhido. Seus aliados continuam se ele for eliminado.\n32 cartas originais; 31 com velocidade definida. Sarck aguarda regra especial. A ordem segue a velocidade do topo, maior primeiro; cada reset completo entrega um apoio. Recebimento discreto: com vaga entra automaticamente; mão cheia oferece Trocar (clique no ícone que sairá) ou Descartar nova. Máximo de três, sem reserva.\nVida e dano seguem os valores impressos, inclusive multiplicadores. Ataques com traço aguardam regras e passam a vez. Nenhuma habilidade especial foi inventada.\nA estrela fixa à direita abre a habilidade principal ao clicar. Prepare até três apoios antes da série: quatro efeitos definidos já funcionam, uma vez por carta na sua vez sem gastar o ataque. Demais apoios e o item aguardam regras.\n18 faixas CC originais na fila de turnos do computador; clique para consultar a carta. Celular preservado.\nSilhuetas com ? indicam artes pendentes. Clique para saber o que falta ou leia docs/ARTES_PENDENTES.md.\nO cronômetro conta toda a série, incluindo pausas e intervalos.\n')
print(output)
