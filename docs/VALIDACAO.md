# Validação — v0.22.0

`npm test`: **155 testes aprovados**, incluindo **300 partidas completas simuladas**. Dez testes novos cobrem cartas da mão em seis impedimentos, cura no próprio personagem e em aliado, bônus, Brisa, limite de um Apoio por turno, medalhas sem ação extra, bloqueios de vez e escolhas obrigatórias, comportamento da IA, vínculo real de John preservado, mana e faixas/exceções do balanceamento. Incluem a regressão em que Burn acorda e precisa escolher outra hipnose antes de agir.

Os 34 testes das habilidades foram atualizados para os novos atributos, preservando os cenários e verificações de dados, alvos, defesas, dano, duração, uso único, múltiplos de 5 e eliminação permanente. Os testes históricos continuam com seu catálogo congelado, separado da produção. A integração atual exercita os 30 oficiais e a nova liberação da mão nas 200 partidas; a integração histórica acrescenta 100 partidas.

## Ensaios de balanceamento

Além da suíte, foram concluídos **8.880 combates comparativos**: 3.480 duelos e 960 confrontos de equipe com atributos antigos, repetidos com os novos. Os dois cenários usam as mesmas composições, sementes e regras atuais. Nenhum atingiu o limite de diagnóstico. Eliminações na primeira ação caíram de 804 para 702 nos duelos e de 257 para 231 nas equipes. Método, limites e resultados completos estão em [BALANCEAMENTO.md](BALANCEAMENTO.md).

## Interface no computador e celular

No Chromium em **1440×1000 e 390×844**, passaram **38 cenários**: os 26 fluxos anteriores adaptados aos novos valores, mais 12 fluxos de uso da mão (seis impedimentos em cada resolução). Nos fluxos novos, Bandeide cura o alvo escolhido, um segundo Apoio fica bloqueado no mesmo turno e uma medalha continua podendo ser resgatada. Foram comparados turno, rodada, ações já realizadas e fila antes/depois: usar a mão não os altera. O personagem continua impedido de atacar. As escolhas foram feitas pelos botões e cartas reais da interface.

Sem exceções JavaScript, imagens ausentes, `undefined`/`NaN` ou transbordamento horizontal. Os números de todas as cartas foram medidos; Sam e Alex foram inspecionados com os novos básicos. Os dados e a ordem foram controlados para reproduzir os cenários; o bot aguardou durante as verificações. As imagens originais dos personagens não foram alteradas.

[Mão no computador](previews/mao-v0.22.0-desktop.png) · [Mão no celular](previews/mao-v0.22.0-celular.png) · [Sam atualizado](previews/sam-v0.22.0-carta.png) · [Alex atualizada](previews/alex-v0.22.0-carta.png)

# Validação anterior — v0.21.0

`npm test`: **145 testes aprovados**, incluindo **300 partidas simuladas**. São os 110 testes anteriores, 34 testes das novas habilidades e uma integração de 200 partidas com o catálogo atual. Os 100 jogos da integração histórica continuam cobrindo recuperação, formação, mão e conservação de cartas.

A integração atual usou **os 30 oficiais**, com um Comum escolhido e um Raro sorteado por equipe. Todos apareceram nas 200 partidas; todas terminaram em vitória ou empate válido. A cada ação foram verificados: identidade e conservação das 30 cartas de personagem, conservação do monte principal, máximo de três na frente e dois Suportes atrás, mão de cinco, Vida/dano em múltiplos de 5, Oni vivo em zero e eliminação permanente.

Os 34 testes específicos cobrem as 21 habilidades e suas interações: dados de acerto/erro, alvo principal e vizinhos do míssil sem saltar uma posição protegida, armadura, paralisia em ações globais, raridades de execução, revide fatal de Endrik, duelo nas duas direções, troca de hipnose com dano no novo alvo, almas sem cura, socos separados e interrupção por morte, queimaduras após morte da origem, cura única, caça tripla repetível, Oni com prazo fixo, bloqueio por classe/velocidade, estrela em si ou aliado, sono gratuito, petrificação com precisão decrescente e quebra por 30, proteção direcionada versus área, Swarm dividido, defesa contra Karma e esquiva progressiva de Trucc. Regressões verificam o retorno à Daly Mãe quando Burn perde o alvo, combo contando uma ação, estrela sem voltar a uma velocidade passada, impedimentos bloqueando movimentos e empate após esgotar recursos.

## Navegador no computador e celular

No Chromium em **1440×1000 e 390×844**, passaram **26 cenários de interface** (13 em cada resolução): seleção inicial e sorteio, Stally, Sam, míssil, troca de hipnose, sono, petrificação/execução, cura total, estrela, Swarm, revide de Karma, Oni e catálogo/busca. Os dados e a ordem foram controlados para reproduzir cada caso; o bot ficou aguardando enquanto os botões eram conferidos. Alguns feedbacks mantiveram os 2,2 segundos configurados e outros foram acelerados para validar o estado seguinte.

Também foram abertas **as 30 formações do laboratório em cada resolução**, resolvendo todas as escolhas de entrada que surgiram. Não houve exceções JavaScript, imagens ausentes, texto `undefined`/`NaN` ou transbordamento horizontal. A largura dos números foi medida nos campos de todas as cartas do catálogo. As cartas de Sam, Alex, Trucc e Unicorn foram inspecionadas visualmente; os 21 pares base/referência desta etapa são idênticos por SHA-256 aos PNGs recebidos.

[Seleção](previews/selecao-v0.21.0-desktop.png) · [Arena no computador](previews/arena-v0.21.0-desktop.png) · [Arena no celular](previews/arena-v0.21.0-celular.png) · [Pré-batalha no computador](previews/prebatalha-v0.21.0-desktop.png) · [Pré-batalha no celular](previews/prebatalha-v0.21.0-celular.png) · [Combo de Sam](previews/sam-v0.21.0-desktop.png) · [Swarm no celular](previews/swarm-v0.21.0-celular.png)

# Validação anterior — v0.20.0

## Pré-batalha e seis personagens

`npm test`: **110 testes aprovados**, incluindo **100 partidas simuladas** com todas as habilidades em uso. Os 24 testes novos cobrem as seis raridades e faixas, preservação dos PNGs originais, bloqueio da pré-batalha, alvo da retaguarda, isolamento e término do duelo, atuação simultânea do restante da arena, passagem sem alvo acessível e várias entradas sem alvos restantes. Também verificam armadura em ataques simples, área e machado; cada resultado do d6 do susto, permanência dos bônus e ordem após recuperação; cura da Elysh com limite e gasto de ação; uso único de DD-X inclusive contra defesa; livro por raridade, manutenção e substituição de nomes, retaguarda, dano de 200 e ciclo sem atacante.

Uma regressão específica verifica a IA retirando o machado quando Elysh cura todo o dano periódico. As partidas simuladas continuam verificando limite de equipe/mão, conservação de cartas, eliminação permanente e múltiplos de 5 em Vida e dano. Os testes antigos foram adaptados ao sexto monte, à medalha Vermelha e às novas faixas, preservando os atributos oficiais já confirmados de Elétrica, John e Sark.

No Chromium, com os tempos reais da batalha, **seis fluxos passaram em 1440×1000 e 390×844**:

1. Penxy escolhe a retaguarda na pré-batalha; o alvo de trás ataca somente ele, e os aliados seguem a hierarquia contra alvos externos.
2. Cavaleiro recebe 40 de um ataque dobrado de 180, com redução no registro.
3. Zikssy rola três dados com resultado 2: +60 de ataque e +1 de velocidade, apresentados antes do combate.
4. Elysh cura 60 em um Cavaleiro aliado, mostra o efeito e consome sua ação.
5. DD-X causa 180, mantém o uso gasto após reset e bloqueia nova ativação.
6. Vaglar marca sem dano antecipado, executa um Comum, marca novamente e causa 200 em Sark Lendário.

Os **12 fluxos passaram** sem exceções JavaScript, imagens ausentes ou transbordamento horizontal. As seis cartas foram inspecionadas individualmente no laboratório; os campos numéricos antigos foram limpos sem substituir o retrato, a moldura ou os ícones da imagem original. Os seis pares base/referência correspondem aos arquivos recebidos por SHA-256.

[Cartas e laboratório](previews/personagens-v0.20.0.png) · [Pré-batalha no computador](previews/prebatalha-v0.20.0-desktop.png) · [Pré-batalha no celular](previews/prebatalha-v0.20.0-celular.png) · [Penxy](previews/penxy-v0.20.0-desktop.png) · [Zikssy](previews/zikssy-v0.20.0-desktop.png) · [Elysh](previews/elysh-v0.20.0-desktop.png) · [Vaglar](previews/vaglar-v0.20.0-desktop.png) · [Vaglar no celular](previews/vaglar-v0.20.0-celular.png)

## Validação anterior — v0.19.1

## Arredondamento de Vida, dano e cura

`npm test`: **86 testes aprovados**, incluindo **100 partidas simuladas**. Sete testes novos verificam arredondamento para cima em todas as terminações, limites e valores fracionários; atributos oficiais preservados; previsão e dano real iguais; área com mana e bônus; Bandeide nos dois caminhos de uso; Brisa; Steel Jaw; dano periódico; cura máxima e eliminação em zero. Os testes de sobrevivência de Sark usam o mínimo positivo atual de 5 de Vida.

As 100 partidas agora também verificam, após cada ação, que Vida máxima, Vida atual, dano e os impactos registrados dos personagens são múltiplos de 5. O contador da Daly Mãe continua com três vidas e perda de uma por ataque.

No Chromium, em **1440×900** e **390×844**, foram conferidos cura de 95 para 175, previsão de ataque de 75, alvo de 220 para 145, resposta do bot de 100 e Vida do jogador de 175 para 75. Cartas, painel e registro mostraram os valores reais, sem exceções JavaScript, imagens ausentes ou transbordamento horizontal.

[Arredondamento no computador](previews/arredondamento-v0.19.1-desktop.png) · [Arredondamento no celular](previews/arredondamento-v0.19.1-celular.png)

## Validação anterior — v0.19.0

## Elétrica, John e bases integrais

`npm test`: **79 testes aprovados**, incluindo **100 partidas simuladas** que chegam à vitória ou ao empate previsto. Os 18 testes novos cobrem dados confirmados, ataque em área apenas na frente adversária, gasto único de mana e bônus, defesa individual, danos antes de Steel Jaw e Suportes promovidos protegidos do golpe anterior. Para John, verificam todos os resultados do d6, ataque normal, cravada, dano por ação, retirada sem gastar ação, imobilização, vulnerabilidade, liberação após morte, bloqueio de movimento e mão, IA e isolamento das formações de teste. Também verificam que dano periódico não dispara defesa ou reação e que múltiplas perdas enfileiram Brisa.

No Chromium, em **1440×900** e **390×844**, cinco fluxos por resolução passaram com os tempos reais do jogo:

1. Área sem selecionar alvo, gasto único de mana, Parry de John e preservação dos aliados e das retaguardas.
2. Cravar, sofrer 20 após cada ação, manter, retirar sem gastar a ação e atacar novamente.
3. Personagem do jogador imobilizado, com botão para passar a vez e aplicação de 20.
4. John vulnerável sem Parry, morto por outro adversário, liberando o alvo sem dano periódico extra.
5. Três eliminações em área, feedback das três cartas e promoção dos Suportes intactos.

Os dez fluxos passaram sem exceções JavaScript, imagens ausentes ou transbordamento horizontal. Os dez campos numéricos das duas bases foram conferidos no laboratório, sem ultrapassar seus espaços no computador ou no celular. O PNG de cada base é exibido inteiro; os campos atualizam conforme o estado da batalha.

Também passaram os **oito fluxos de sobrevivência de Sark**, em 1440×900 e 390×844, e os **seis fluxos de continuidade após recuperação**, em 1280×800 e 390×844. A comparação SHA-256 dos nove PNGs recebidos nos dois kits confirmou que todos estão idênticos no projeto: seis arquivos novos e três já existentes.

[Bases e laboratório](previews/habilidades-v0.19.0-cartas.png) · [Área no computador](previews/eletrica-v0.19.0-desktop.png) · [Área no celular](previews/eletrica-v0.19.0-celular.png) · [John no computador](previews/john-v0.19.0-desktop.png) · [John no celular](previews/john-v0.19.0-celular.png)

## Validação anterior — v0.18.2

## Sobrevivência antes de Steel Jaw

`npm test`: **61 testes aprovados**, incluindo 100 partidas simuladas. Os testes de Sark agora verificam dano fatal exato e excedente contra todas as raridades e nas duas equipes, sem dano ao atacante; sobrevivência com 50 e com apenas 1 de Vida; e reação de 390 que preserva ou elimina Lendários/Secretos conforme a Vida deles. Também conferem a previsão, o gasto único de ação, a exposição da Daly Mãe e o avanço da retaguarda apenas da equipe que perdeu o personagem.

No Chromium, em 1440×900 e 390×844, foram conferidos quatro casos por resolução: 50 de Vida recebendo 100, 100 recebendo 100, e 100 recebendo 50 de um Comum ou de um Lendário. Golpes fatais mostram a previsão de eliminação sem reação, deixam o atacante intacto e permitem continuar atacando a Daly Mãe exposta. Golpes não fatais deixam Sark com 50 de Vida e ativam a reação correspondente. Os oito fluxos passaram sem exceções JavaScript ou imagens ausentes.

A base integral, o enquadramento da carta e os valores dos personagens não foram alterados. A validação abaixo registra o comportamento de versões anteriores; a reação após golpe fatal foi substituída nesta versão.

## Validação anterior — v0.18.1

### Base integral do Sark

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
