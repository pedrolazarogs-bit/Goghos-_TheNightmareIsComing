# Validação — v0.49.1

Revisão em 18/11/2026, com Node.js e Chromium.

- `npm test`: aprovado antes e depois da alteração. Menu, abertura, áudio, recursos originais e modelo da batalha preservados.
- `npm run test:panel`: aprovado com os 32 personagens, ícones clicáveis, teclado, vida zero/máxima, dano com multiplicador, fôlego e ajuste à janela.
- `npm run test:scoreboard`: aprovado com pontos de ambas as equipes, quinta rodada, vitória aos três, cronômetro acima de uma hora, congelamento final, reinício, teclado e toque.
- `npm run test:battle`: aprovado durante uma série completa. Pontuação, fila de turnos, cliques do painel, bots, mortes, pausa, exportação, redimensionamento e reinício preservados.
- Comparação direta com o CSS da v0.49.0 em 1440 × 900: placar passou de aproximadamente 414 × 195 para 323 × 152 pixels; painel passou de 531 × 333 para 414 × 260 pixels. Ambos têm largura e altura 22% menores.
- Conferidas as âncoras: centro superior do placar e bordas direita/inferior do painel permanecem no mesmo lugar. A redução libera espaço no campo sem deslocar as cartas.
- Na janela com toque de 844 × 390, as posições e dimensões do placar anterior, painel, retrato e quatro ícones são idênticas às da v0.49.0.
- Revisão visual das prévias: valores de quatro dígitos, fôlego de dois dígitos, multiplicadores e relógio final continuam legíveis. Textos secundários tiveram ajuste para compensar a redução; as artes mantêm as proporções originais.
- Prévia da arena e pacotes individuais gerados na v0.49.1. Integridade dos quatro ZIPs, referências locais e correspondência dos arquivos com o projeto verificadas, exceto os links de navegação adaptados nos pacotes isolados.

[Placar e painel menores na arena](previews/batalha-v0.49.1-desktop.png)

[Placar](PLACAR.md) · [Painel do jogador](PAINEL_JOGADOR.md) · [Regras da arena](ARENA_4X4.md)
