# Validação da estrutura base — v0.16.0

## Testes de regras e interface

`npm test`: 35 testes aprovados, incluindo 100 partidas completas de integração. Foram verificados:

- Todos os Comuns na seleção e quatro escolhas alternadas, sem repetição.
- Dois personagens iniciais por equipe, limites de três na frente e dois Suportes atrás.
- Velocidade decrescente e uma compra por equipe a cada reset, sem compra duplicada.
- Cinco cores de medalhas, resgate do topo da raridade correta e preservação das outras pilhas.
- Medalhas na mão, inclusive com cinco cartas e decisão de substituição ou descarte.
- Resgate sem vaga ou com monte vazio preservando a medalha e a carta do topo.
- Avanço automático com um Suporte e escolha de qualquer um ou ambos quando há dois.
- Trânsito e troca de Suportes, sem esvaziar a defesa ou ganhar ataques extras.
- Eliminação permanente, golpe de uma vida na Daly Mãe, recuperação parcial e fim de partida.
- Conservação das instâncias de personagens e cartas em todas as partidas simuladas.

## Revisão no navegador

Chromium com Playwright, em janelas de 1440×1000, 1280×800, 390×844 e 360×640. As duas últimas simulam o espaço de tela de celulares.

Foram percorridos cinco fluxos em cada resolução: seleção e arena; mão cheia seguida de resgate de medalha; eliminação com avanço de dois Suportes; ataque à Daly Mãe com recuperação de lote incompleto; e ataque com dano, pausa e retomada. Após reservar uma área para o leque no celular, os dez fluxos móveis foram repetidos, verificando também que a arena termina acima da mão e não cria rolagem horizontal.

Uma revisão adicional em 1280×800 e 360×640 percorreu a seleção por teclado, recuo de Suporte, cura de aliado, resgate de personagem, avanço e troca entre linhas. Sem exceções JavaScript ou pedidos de arquivos ausentes nesses fluxos. O feedback permanece visível antes de liberar a próxima ação.

## Imagens da revisão

[Seleção no computador](previews/selecao-v0.16.0-1440.png) · [Seleção no celular](previews/selecao-v0.16.0-390.png)

![Arena no computador](previews/arena-v0.16.0-1440.png)

[Arena no celular](previews/arena-v0.16.0-390.png) · [Mão cheia com medalha nova](previews/mao-v0.16.0-390.png) · [Escolha dos Suportes](previews/suportes-v0.16.0-390.png)

As regras estão em [REGRAS.md](REGRAS.md). Os nomes e artes provisórios e os efeitos ainda não definidos de Item/Habilidade Especial permanecem indicados no projeto.
