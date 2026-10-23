# Revisão de balanceamento — v0.22.0

O criador autorizou ajustar Vida e dano considerando **classe, raridade e habilidade**. Foi reconfirmada a manutenção das seis raridades, com a transferência anterior das faixas. Os 30 oficiais foram revisados; **22 receberam ajustes**. As regras das habilidades, os resultados de d6, as durações, a velocidade e o fôlego foram preservados. Sam e Alex receberam novos danos básicos; os valores fixos de reação, cura, queimadura, hipnose e bônus permanecem.

## Faixas de referência

| Raridade | Vida inicial | Dano básico de referência |
| --- | ---: | ---: |
| Comum | 130–220 | 25–120 |
| Raro | 200–350 | 30–150 |
| Épico | 320–530 | 50–220 |
| Mítico | 430–700 | 90–430 |
| Lendário | 550–1200 | 150–670 |
| Secreto | 605–1320 | 165–740 |

| Classe | Vida | Dano |
| --- | --- | --- |
| Mago | Baixa | Muito alto |
| Assassino | Normal | Médio |
| Fighter | Média | Normal |
| Suporte | Alta | Muito baixo |
| Tank | Muito alta | Alto |
| Destroyer | Muito baixa | Muito alto |

Os perfis são o ponto de partida. O efeito da habilidade participa do orçamento de poder: 80% de armadura multiplicam a resistência numérica por cinco; área e revides podem repetir o dano; combo e queimadura acumulam impactos; controle pode impedir várias ações adversárias. Por isso, personagens com habilidades fortes podem ter básicos menores que o perfil da classe, e ataques multiplicados podem ter um básico abaixo do piso da raridade.

Magos começam com **3/3 de mana**, recuperam **+1 após cada ação concluída de qualquer personagem**, inclusive uma passagem por impedimento, e nunca passam de 3. Usar uma carta da mão não é uma ação concluída e não regenera mana.

## Valores anteriores → atuais

Velocidade e fôlego não foram alterados. A coluna de dano indica o básico da carta; o dano final depende da habilidade e das defesas.

| Personagem | Classe / raridade | Vida | Dano | Habilidade e decisão |
| --- | --- | ---: | ---: | --- |
| Alex | Fighter / Comum | 180 → **155** | 220 → **120** | **Swarm**: 220 era muito acima do teto Comum; manter divisão/concentração com total básico de 120. |
| Cavaleiro | Fighter / Comum | 180 → **145** | 75 → **40** | **Armadura**: 80% de redução multiplicam por cinco sua resistência a dano; reduzir Vida e ataque. |
| Mike | Destroyer / Comum | 135 | 120 | **Proteção contra Assassinos**: A imunidade é específica de classe; manter a Vida muito baixa e dano alto de Destroyer. |
| DD-X | Fighter / Raro | 285 | 90 | **Fish**: O dano dobrado é único; o perfil atual de Fighter já o comporta. |
| Elétrica | Mago / Raro | 220 | 130 | **3000W**: Área e mana já compensadas pela Vida baixa; manter os valores de referência. |
| John | Fighter / Raro | 270 → **250** | 80 | **Sharp Guitar**: Parry e imobilização justificam reduzir a resistência; preservar 80 inicial e 20 periódico. |
| Unicorn | Suporte / Raro | 315 → **270** | 40 → **35** | **Estrela**: A estrela já concede +150 de Vida, +50 de dano e +2 de velocidade; reduzir a base. |
| Elysh | Suporte / Épico | 480 | 60 | **Lazer Gun**: A cura substitui o ataque; manter Vida alta e dano muito baixo de Suporte. |
| Fonior | Suporte / Épico | 480 | 60 | **Almas**: As almas só aumentam o máximo, sem cura imediata; manter o perfil de Suporte. |
| Trucc | Assassino / Épico | 425 → **340** | 120 → **90** | **Esquiva veloz**: Esquiva inicial de cinco faces e velocidade 8 exigem Vida e dano básicos menores. |
| Zikssy | Assassino / Épico | 425 → **390** | 120 → **110** | **Claws**: Reservar parte do poder básico para os bônus permanentes de susto. |
| Chama | Destroyer / Mítico | 445 | 65 | **Fogo persistente**: 65 inicial mais cinco queimaduras já somam 390; preservar o dano periódico e o revide. |
| Nully | Assassino / Mítico | 565 → **480** | 55 | **Decapitação**: Multiplicação, execução e velocidade alta justificam menos Vida; preservar os 55 por dado. |
| Stally | Fighter / Mítico | 580 → **550** | 260 → **230** | **Paralisia**: Reduzir o básico para compensar o golpe de 300 com paralisia. |
| Striker | Destroyer / Mítico | 445 | 415 → **350** | **Proteção de velocidade**: A proteção contra rápidos pede menos dano que outro Destroyer da mesma faixa. |
| Vaglar | Fighter / Mítico | 580 → **520** | 0 | **Charm**: O livro ignora esquiva e Parry, executa abaixo de Mítico e aplica 200 acima; reduzir Vida. |
| Xerife | Assassino / Mítico | 565 → **450** | 0 | **Duelo**: Execução ofensiva e defensiva exigem fragilidade; manter duelo e dano fixo de 200. |
| Burn | Fighter / Lendário | 910 → **780** | 410 → **90** | **Hipnose**: Controle contínuo é seu poder; a carta deve mostrar os 90 realmente usados na hipnose. |
| Endrik | Destroyer / Lendário | 585 | 645 → **560** | **Tubarão**: Dano alto de Destroyer, com desconto pela tentativa de execução após morrer. |
| Karma | Assassino / Lendário | 875 → **650** | 360 → **230** | **Melhor amigo**: O ataque se repete como reação aos golpes no amigo; reduzir resistência e básico. |
| P. Ullys | Destroyer / Lendário | 585 | 645 → **450** | **Míssil**: Reservar dano para a explosão: até 630 no conjunto, antes de defesas. |
| Penxy | Assassino / Lendário | 875 | 360 | **Ghost Claw**: O duelo isola os dois lados e não multiplica dano; manter o perfil de Assassino. |
| Rayvilin | Suporte / Lendário | 1040 → **700** | 180 → **150** | **Petrificação**: Petrificar e executar na mesma vez é forte; reduzir resistência e dano, sem mudar o d6. |
| Rayyb | Suporte / Lendário | 1040 → **875** | 180 → **150** | **Pó mágico**: Sono gratuito e potencialmente longo exige desconto na Vida e no dano básicos. |
| Sam | Fighter / Lendário | 910 → **1050** | 70 → **100** | **Combo de socos**: Combo médio de 2,77 socos: cerca de 277 antes de defesas, máximo 600; aumentar a Vida. |
| Sark | Assassino / Lendário | 530 | 0 | **Steel Jaw**: Manter a exceção oficial: reativo, sem velocidade; precisa sobreviver para revidar. |
| Z-Zus | Suporte / Lendário | 1040 | 180 → **150** | **Sacrifício**: Manter Vida alta para absorver dano; ataque no piso Lendário por ser Suporte. |
| Daztirry | Fighter / Secreto | 1000 → **930** | 455 → **420** | **Estado Oni**: Oni acrescenta uma janela imortal e +30; descontar parte dos atributos iniciais. |
| Draktar | Assassino / Secreto | 965 → **850** | 395 → **265** | **Caça**: Contra a caça, o básico triplica para 795; reduzir os dois atributos. |
| Zuri | Suporte / Secreto | 1145 → **1000** | 195 → **165** | **Cura total**: A cura coletiva total é forte mesmo sendo única; reduzir resistência e ataque. |

## Exceções e efeitos acumulados

- **Sam:** 100 por soco. A média teórica, antes de defesas e sem morte interrompendo o combo, é 2,7747 socos, cerca de 277 de dano. O máximo é 600. A repetição encerra o combo; cada soco continua com defesa e reação próprias. A Vida subiu para 1050 para compensar sua velocidade 3.
- **Alex:** o Swarm básico passou de 220 para 120, no teto Comum. Concentrado causa 120; dividido entre dois causa 60 em cada; entre três, 40 em cada. Bônus são aplicados antes da divisão e cada parcela continua arredondada para cima em múltiplos de 5.
- **Cavaleiro:** 145 de Vida com armadura de 80% equivalem aproximadamente a 725 pontos de dano bruto antes de arredondamentos. A redução para 40 de ataque compensa essa resistência. Execuções continuam ignorando a armadura.
- **Burn:** o campo de ataque agora mostra os 90 realmente usados na hipnose. Seu controle contínuo explica a exceção ao piso de dano Lendário.
- **Chama:** 65 iniciais e cinco aplicações de 65 somam 390 antes de mitigação. A queimadura defensiva de três vezes 35 continua igual.
- **Nully:** básico 55, multiplicado pelo d6; o 6 ainda executa até a própria raridade ou causa 330 em superior. Vida menor compensa a execução e a velocidade 7.
- **Sark:** mantém os 530 de Vida oficiais, 20 abaixo do piso genérico Lendário, e não tem ataque nem velocidade. Steel Jaw permanece com execução abaixo de Lendário ou 390 acima, somente após sobreviver.
- **Xerife e Vaglar:** zero é ausência de ataque básico. Os 200 das habilidades e suas regras de execução permanecem; a resistência foi reduzida.
- **Buffs em batalha** podem exceder as faixas iniciais. A estrela ainda concede +150 de Vida, +50 de dano e +2 de velocidade; almas continuam aumentando apenas o máximo, sem limite.

## Comparação reproduzível

Foram executados **4.440 combates com os atributos anteriores e os mesmos 4.440 com os novos**: 3.480 duelos e 960 confrontos de duas equipes de dois. As composições, sementes e lados são reproduzidos. Nos confrontos de equipe, a diferença da soma dos níveis de raridade é no máximo um.

| Indicador | Antes | Depois |
| --- | ---: | ---: |
| Duelos com eliminação na primeira ação | 804 / 3480 | 702 / 3480 |
| Equipes com eliminação na primeira ação | 257 / 960 | 231 / 960 |
| Ações médias no confronto de equipe | 10,29 | 10,63 |
| Confrontos que atingiram o limite de diagnóstico | 0 | 0 |

Os dois ensaios usam o motor atual e variam somente os atributos. Compras, medalhas e recuperação são retiradas para isolar o combate inicial. O limite de 250 etapas pertence somente ao diagnóstico; não é uma regra da partida. Os resultados indicam menos eliminações imediatas, sem demonstrar equilíbrio perfeito: controle de Burn domina vários duelos isolados, enquanto protegido, melhor amigo e cura coletiva dependem da equipe. As mecânicas definidas pelo criador foram mantidas. As partidas completas, com montes, continuam sendo verificadas pela suíte de integração.

Reproduzir:

```sh
npm run balance -- docs/benchmarks/atributos-v0.21.0.json /tmp/balance-antes.json
npm run balance -- current /tmp/balance-depois.json
```

[Resultados anteriores](benchmarks/balanceamento-v0.22.0-antes.json) · [Resultados atuais](benchmarks/balanceamento-v0.22.0-depois.json)

Os ajustes ficam em `G.CHARACTER_BALANCE`, em `js/data/characters.js`, com uma justificativa por personagem. A imagem original da carta permanece intacta; a interface mostra os números novos.

## Cartas da mão durante impedimentos

A mão pertence à equipe. Na vez dela, cartas podem ser usadas mesmo se o personagem estiver preso pelo machado, mantendo o machado, dormindo, paralisado, petrificado ou hipnotizado. Isso permite cura, bônus, Brisa e medalhas, respeitando vagas e o limite de um Apoio por turno. A carta não remove o impedimento nem gasta a ação; o personagem continua sem poder atacar, mover ou reagir quando o efeito proíbe.

A vez adversária, a pausa, as escolhas obrigatórias e o feedback da ação continuam com seus bloqueios normais. Itens e Habilidades Especiais seguem aguardando implementação; esta regra não inventa efeitos para essas cartas. A IA pode resgatar medalhas antes de resolver sua ação impedida.

## Regras acrescentadas na v0.23.0

Os valores iniciais da tabela acima foram preservados. Tanque agora reduz 10% de dano de ataques; Destroyer rola 1–2 no d6 para causar +25%. Os ensaios numéricos anteriores são registros da v0.22.0, antes desses tributos e dos 17 Apoios. A suíte atual acrescenta partidas com os novos efeitos e 40 partidas com invocação garantida. Zeenneriam tem 1700 de Vida/700 de Dano conforme a arte, não tem raridade e fica fora das faixas convencionais. Seu acesso exige os três únicos fragmentos do monte compartilhado.

## Correção de classe posterior — v0.24.1

A tabela acima registra o balanceamento da v0.22.0. A conferência do símbolo inferior corrigiu Z-Zus de Support para Tank, preservando 1040 de Vida e 150 de dano. Não houve novo balanceamento numérico. Os próximos valores serão definidos manualmente pelo criador em novas cartas; veja [CLASSES.md](CLASSES.md).
