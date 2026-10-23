# Validação — v0.17.1

## Correção da hierarquia na recuperação

O erro foi reproduzido com um ataque de velocidade 5 à Daly Mãe seguido de recuperação: apenas os adversários de velocidades 4 e 2 permaneciam elegíveis. A versão corrigida inclui os novos personagens nas velocidades ainda válidas, sem apagar ações anteriores ou iniciar outro ciclo.

`npm test`: 46 testes aprovados, incluindo 100 partidas completas simuladas. Os sete testes novos cobrem recuperação das duas equipes, velocidades iguais e menores, empate com oponente, velocidade já ultrapassada, resgate após o último atacante, reset com compra única, cliques repetidos, opções inválidas e consultas da interface sem alterar a velocidade salva. Também executam a sequência de ações após a recuperação.

No Chromium, em 1280×800 e 390×844, foram conferidos seis fluxos com os tempos reais do jogo: resgates de velocidade 4 e 5 após ataque de 5 para o jogador, e resgate de 4 para o bot. As cartas entram na hierarquia exibida e atacam na rodada correta, sem compra no resgate, exceções JavaScript, imagens ausentes ou transbordamento horizontal. O visual da v0.17.0 foi mantido.

## Validação anterior da arena — v0.17.0

Na v0.17.0, os arquivos de `js/core/` não mudaram em relação à v0.16.0. Os dados dos personagens e os tempos da batalha permaneceram iguais; em `js/data/characters.js` mudou apenas a identificação da versão.

`npm test`: 39 testes aprovados, incluindo 100 partidas completas simuladas. Além dos 35 testes anteriores, há verificações de que as prévias visuais não avançam a fila nem compram cartas, respeitam escolhas pendentes, apresentam os atributos atuais e mantêm a mão adversária oculta.

## Revisão no navegador

Chromium com Playwright, em 1440×900, 1280×800, 390×844 e 360×640. Cinco fluxos foram percorridos em cada resolução:

1. Seleção de todos os Comuns, quatro escolhas alternadas e entrada na arena.
2. Mão cheia, substituição por uma medalha e resgate do topo da raridade correspondente.
3. Ataque com eliminação, feedback visível, avanço automático e escolha dos dois Suportes.
4. Ataque de uma vida à Daly Mãe e recuperação com lotes incompletos.
5. Dano mostrado antes da remoção da carta, pausa e retomada.

Também foram testados seleção por teclado, recuo e avanço de Suportes, cura, resgate e troca entre linhas em 1024×768 e 360×640. No celular, a reserva do leque foi conferida após girar a tela e voltar à orientação original. Esses fluxos passaram sem exceções JavaScript ou arquivos de arte ausentes.

A composição visual foi inspecionada também em 1920×1080. As telas estreitas usam a arena rolável acima do leque. No computador, as laterais e as equipes têm áreas próprias, com a mão abaixo do registro.

## Imagens

A formação abaixo foi montada para revisar Sam, Eletric e Sarck nas posições da referência; não altera a seleção inicial do jogo. O registro mostra um ataque calculado pelo núcleo.

![Arena com formação de exemplo](previews/arena-v0.17.0-desktop.png)

[Partida após a seleção de Comuns](previews/arena-v0.17.0-inicio.png) · [Arena no celular](previews/arena-v0.17.0-celular.png) · [Escolha com a mão cheia](previews/mao-v0.17.0-celular.png)

## Artes

Troféu, verso, cristal, retrato provisório e ícones foram movidos para `assets/arena/`. Os seis arquivos foram comparados por SHA-256 com os originais da versão anterior: nenhum pixel foi alterado. O enquadramento acontece apenas na apresentação. A imagem enviada pelo criador serviu como referência de posições e estilo.

As regras atuais estão em [REGRAS.md](REGRAS.md), e o inventário das artes em [ARTES.md](ARTES.md).
