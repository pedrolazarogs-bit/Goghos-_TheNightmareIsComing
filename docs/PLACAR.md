# Placar do jogo — v0.53.0

O placar no topo da arena de computador usa a arte original recebida em **84 Sem Título_20261118200516.png.zip**. As faixas azul e vermelha, o troféu e o logotipo GOGHOS Championship já fazem parte desse PNG; nenhum desses elementos foi redesenhado ou sobreposto por uma ilustração nova.

`assets/scoreboard-v049/scoreboard.png` é uma cópia exata do arquivo recebido. O manifesto registra origem, SHA-256, resolução de 2048 × 2048 e limites da região visível. A imagem tem margens transparentes grandes; CSS enquadra a região de 1670 × 629 pixels, sem recortar, recomprimir ou modificar o arquivo.

Na v0.49.1, o conjunto foi reduzido em 22% na largura e altura no computador. A âncora continua no centro superior, liberando espaço acima das cartas. Os textos de rodada e meta receberam ajuste de tamanho para preservar a leitura. A prévia individual mostra a mesma redução.

## Na batalha

- Pontuação azul à esquerda e vermelha à direita, preenchida pelo estado real da série com a fonte German Beauty.
- A eliminação dos quatro adversários concede um ponto. A primeira equipe a três pontos vence; a pontuação não pode ser alterada manualmente na arena.
- Cronômetro crescente abaixo da arte, com rodada e indicação de três vitórias. O tempo continua durante pausas e intervalos, e congela ao terminar a série.
- O número recebe um destaque de 360 ms ao marcar ponto, sem animação recorrente. A redução de efeitos do jogo e do sistema é respeitada.
- O PNG não cobre os botões superiores, as cartas ou a fila de turnos.
- A composição anterior do placar é preservada na arena de celular/toque; a arte nova é aplicada no computador com janela de pelo menos 981 pixels e ponteiro preciso. O antigo “?” passa a explicar as regras do placar, sem pedir uma arte que já foi recebida.

`js/ui/scoreboard.js` apenas apresenta dados; não concede pontos e não controla turnos. `js/ui/battle_lab.js` fornece os valores do modelo existente. A atualização não modifica atributos, habilidades, fôlego, bots, balanceamento, menu, abertura ou áudio.

## Prévia isolada

Abra **placar.html** para testar somente esta parte. Clique em **Iniciar série de teste** e use **Vitória do azul +1** ou **Vitória do vermelho +1**. Esses botões simulam rodadas apenas nesta página. Ao chegar a três, os pontos ficam bloqueados e o relógio para. **Reiniciar prévia** restaura 0 × 0 e 00:00.

A página usa o mesmo `js/ui/scoreboard.js` e `css/scoreboard.css` da arena. Os controles de teste ficam em `js/ui/scoreboard_preview.js`, sem importar ou alterar o combate. A prévia se ajusta a janelas estreitas para consulta; isso não altera o placar da arena de celular.

`npm run test:scoreboard` testa a prévia no navegador. `npm run test:battle` confere a integração durante uma série real. `npm run package:scoreboard` gera `downloads/placar-v0.53.0.zip`; extraia tudo e abra placar.html. Apenas os links de navegação são adaptados no ZIP isolado.
