# Validação — v0.18.1

## Base integral do Sark

Sark usa uma única imagem de carta, a base recebida no SarckKit. As únicas sobreposições na carta viva são os campos numéricos de Vida e fôlego. A referência visual atual do criador substitui a orientação anterior de recompor ilustração e moldura.

`npm test`: 60 testes aprovados, incluindo 100 partidas simuladas. As expectativas de apresentação foram ajustadas à base integral; as regras de Steel Jaw, recuperação, velocidade, mãos e empate continuam cobertas. Não houve alteração em `js/core/`.

No Chromium, a apresentação foi conferida em 1440×900 e 390×844, incluindo laboratório, ataques e mudança da Vida na carta. A imagem original do Sark foi preservada. O registro abaixo descreve a validação anterior da habilidade; as prévias atuais estão em [Carta](previews/sark-v0.18.1-carta.png), [Arena](previews/sark-v0.18.1-desktop.png) e [Celular](previews/sark-v0.18.1-celular.png).

A comparação de duas renderizações a 400 pixels de largura, com e sem os números, encontrou 4.638 pixels alterados dentro dos campos de Vida e fôlego e nenhuma diferença fora desses campos.

## Validação anterior — v0.18.0

### Sark, composição da carta e Steel Jaw

`npm test`: **60 testes aprovados**, incluindo 100 partidas simuladas que terminam em vitória ou no empate definido pelo criador. A suíte mantém as verificações anteriores de seleção, recuperação parcial, ordem após resgate, mão cheia e apresentação. Os 14 testes novos verificam:

- Dados confirmados de Sark, proteção da Daly Mãe e ausência na fila de ataque.
- Ataque recebido e eliminação instantânea de Comum, Raro e Épico, nas duas equipes.
- Reação de exatamente 390 em Lendário ou Secreto, sem esquiva e com eliminação ao zerar a Vida.
- Reação durante um golpe fatal, duas eliminações, avanço das duas retaguardas e Brisa.
- Ataques a outro personagem, ações inválidas, mana, bônus e cura com Vida real.
- Ciclo sem atacante, compra explícita única, mão cheia, medalhas das duas equipes e retomada sem compra adicional.
- Empate somente com monte vazio e sem medalhas utilizáveis, após resolver escolhas pendentes.
- Carta com arte separada, base nova enquadrada por CSS, Vida dinâmica e banner recebido; laboratório sem alterar a seleção normal.

Não foi criado um personagem Secreto no catálogo: o teste dessa raridade usa um estado controlado do atacante. Os cinco PNGs do SarckKit foram comparados por SHA-256 com seus caminhos no projeto; todos permanecem idênticos aos recebidos.

## Revisão atual no Chromium

Em **1440×900** e **390×844**, cinco fluxos por resolução foram percorridos com os tempos reais da batalha:

1. Menu Testar Sark, carta composta, ataque de Raro com eliminação instantânea e ataque de Lendário com reação de 390.
2. Golpe fatal contra Sark, feedback nas duas cartas, reação mantida e Daly Mãe exposta após a eliminação.
3. Sark na equipe do jogador, reagindo automaticamente à IA.
4. Falta de atacante, avanço de ciclo, compra com mão cheia, substituição por medalha e retorno à hierarquia sem nova compra.
5. Empate sem recursos e nova partida com a seleção normal de sete Comuns.

Esses fluxos passaram sem exceções JavaScript, imagens ausentes ou transbordamento horizontal. A carta e o banner também foram inspecionados em detalhe. O aviso visível antes da confirmação explica a resposta de Steel Jaw; durante a troca, dano recebido e reação aparecem nas cartas, no registro e no aviso da arena. O feedback de reação dura 4,4 segundos.

Também foi repetida a revisão de continuidade após recuperação da v0.17.1: seis fluxos em 1280×800 e 390×844, para resgates de velocidades 4 e 5 após ataque de 5 e para recuperação do bot.

![Steel Jaw na arena](previews/sark-v0.18.0-desktop.png)

[Carta e laboratório](previews/sark-v0.18.0-carta.png) · [Reação no celular](previews/sark-v0.18.0-celular.png)

## Validação anterior — v0.17.1

### Correção da hierarquia na recuperação

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
