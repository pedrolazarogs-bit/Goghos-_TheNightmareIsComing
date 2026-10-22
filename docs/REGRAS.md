# GOGHOS TCG — protótipo jogável (v0.15.1)

## Como executar
Abra o arquivo `index.html` no navegador (clique duplo). Não precisa de servidor, instalação nem internet.

## Onde colocar as artes (nomes de arquivo exatos)
| O quê | Pasta / arquivo |
|---|---|
| Logotipo oficial | `assets/logo/logo.png` |
| Arte de cada personagem | `assets/characters/<id>.png` (ex.: `sam.png`, `char_02.png`) — o `<id>` é o campo `id` em `js/data/characters.js` |
| Ícone de classe (losango inferior) | `assets/classes/fighter.png`, `assassin.png`, `support.png`, `tank.png`, `destroyer.png` |
| Ícone da habilidade principal (estrela) | `assets/abilities/<id do personagem>.png` |
| Artes das cartas de Apoio | `assets/support/<id>.png` (`na_moloeira`, `bandeide`, `brisa`) — exibidas como enviadas, sem alteração |
| Artes das cartas do Reset que não são de Apoio (Item, Habilidade Especial, Daly, Fragmento Primordial) | `assets/reset/<id>.png` (hoje provisórias, sem arte) |
| Moldura da classe Assassin (ícone e orbe do Esquivar já desenhados) | `assets/cards/card_base_assassin.png` (original; tem máscara de raridade própria, gerada por `tools/make_holes_mask.py`) |
| Moldura da classe Mago (ícone e orbe de mana já desenhados) | `assets/cards/card_base_mago.png` (original) |
| Moldura da carta | `assets/cards/card_base.png` (original, não alterar) |
| Fonte | `assets/fonts/german_beauty.ttf` |

Sem o arquivo, o jogo mostra um espaço reservado discreto. Se a moldura mudar, rode `python3 tools/make_holes_mask.py`.

## Onde editar
- **Personagens e configuração**: somente `js/data/characters.js` (Vida, Dano, Velocidade, Fôlego, Classe, Raridade, Habilidade). Sam, Eletric e Sarck têm cartas ilustradas; parte dos atributos ainda segue a regra de faixas da v0.14.0. Os demais personagens são **provisórios**.
- **Posição de textos/ícones na carta**: `js/ui/card.js` (coordenadas em pixels da imagem da moldura).
- **Regras**: `js/core/battle.js` · **IA**: `js/core/ai.js` · **Telas**: `js/ui/ui.js`.

## Regras implementadas
- Batalha por turnos; ordem por **Velocidade** (maior primeiro), recalculada a cada rodada com os vivos.
  Desempate: equipe do jogador antes da adversária, depois a posição na equipe.
- **Seleção inicial** (`js/core/selection.js`): ao clicar em Jogar sorteia **5 personagens Comuns distintos** (só raridade `COMMON` real; com 4 já dá para jogar; com menos de 4 a batalha não começa e a tela explica).
  Escolhas na ordem **jogador → bot → jogador → bot**; ninguém escolhido volta. O bot escolhe ao acaso entre os que sobram. Cada lado fica com **2 na linha de frente e a retaguarda vazia**; o 5º continua no monte Comum.
- **Equipe**: linha de frente de até **3 personagens** (atacam e podem ser atacados) + retaguarda de até **2 Supports** (não atacam nem são atacados). Personagem novo (Daly / recuperação) entra na frente enquanto houver espaço; depois, somente Supports podem ocupar espaços da retaguarda. Se não houver espaço válido, não excede os limites. Quando a frente esvazia e há vivo na retaguarda, **um** é promovido na hora (age só a partir da rodada seguinte; sem turno nem ataque extra).
- **Eliminação permanente** (`G.eliminateUnit`): sai da equipe e da fila, vai para a área **Personagens Eliminados** (com o dono), não age, não é alvo e **não volta aos montes** durante a partida.
- **5 montes de personagens** (`G.createCharacterPiles`): Comum, Raro, Épico, Lendário e Secreto, compartilhados pelas duas equipes. Cada carta física tem `iid` (opcional `copies` por personagem). Os personagens iniciais saem do monte Comum. Personagem sem raridade válida não entra em nenhum monte.
- **Daly Mãe** (esmeralda, uma por lado, **3 vidas**): protegida enquanto houver QUALQUER personagem vivo na equipe; **exposta só com a equipe inteira eliminada** — aí o ataque normal vira ataque a ela (clique no painel dela; a IA faz sozinha). **Cada ataque válido tira exatamente 1 vida** (sem dano excedente, sem esquiva; bônus de apoio e mana não são gastos).
- **Recuperação** (Daly Mãe ainda com vida depois do golpe): o dono escolhe **UMA** opção — **A = até 3 Comuns · B = até 2 Raros · C = até 1 Épico** (sem misturar; vem só dos montes de personagens). Se o monte tiver menos cartas, recebe todas as restantes dessa raridade. Exemplo: com 2 Comuns, 1 Raro e 0 Épicos, pode receber os 2 Comuns OU o 1 Raro; Épico fica indisponível. A interface mostra a quantidade real a receber; monte vazio fica desabilitado. Os recuperados entram pela regra da equipe (1º na frente se ela estiver vazia). Não devolve vida à Daly Mãe, não ressuscita eliminados, não dá ataque/turno/compra extra. O bot escolhe sozinho uma opção possível. Sem nenhuma opção possível o jogo segue e a Daly Mãe continua exposta.
- **Fim da partida**: quando uma Daly Mãe chega a 0, a partida acaba na hora e **vence quem tem a Daly Mãe viva** (independe de quantos personagens tem). Bloqueia ações, compras, Daly, recuperação, apoio, troca e novos ataques. A tela de resultado mostra vencedor, perdedor e qual Daly Mãe caiu; **Menu** e **Nova partida** limpam todo o estado temporário (nova partida começa por uma nova seleção).
- **Troca voluntária** (na sua vez, inalterada): um **Suporte** da retaguarda ⇄ um **Suporte** da frente. Custa fôlego de cada um (valor provisório `swapStaminaCost`, hoje 3); não gasta a ação. A IA não usa a troca. Como a retaguarda agora começa vazia, o botão só habilita quando houver um Suporte nela.
- **Cartas de Apoio** (`js/data/support_cards.js`, regras em `js/core/support.js`): não há cartas de Apoio equipadas no início e não há painel lateral. As cartas de Apoio são parte do monte principal e podem vir em uma compra de reset; atualmente são 6 das 18 cartas físicas do monte (cerca de 33% no início). As cartas compradas aparecem no leque inferior esquerdo. Clique em uma carta de Apoio para selecioná-la e use **Usar**; para Bandeide, clique antes em um aliado ferido. A carta usada vai para o descarte e só uma carta de Apoio pode ser usada por turno. **Na Moloeira**: próximo ataque +20; **Bandeide**: cura +80; **Brisa**: ao eliminar um aliado, outro aliado ferido pode curar +30 (ou a cura pode ser dispensada). A quantidade de cópias no monte ainda é provisória.
- **Classe Mago** (Tributo: Mana): todos os Magos começam com **3/3 de mana**, independentemente da raridade, e o máximo é 3. Na vez do Mago, cada ponto de mana gasto soma `manaDamagePerPoint` (atualmente +10, provisório). Ao fim de cada ação resolvida, cada Mago vivo abaixo do máximo recupera +1 de mana. A IA gasta o mínimo de mana que elimina o alvo, ou 1 quando não consegue eliminar com a mana disponível.
- **Classe Assassin** (Tributo: Esquivar): quando um oponente ataca um Assassin, ele pode esquivar e não tomar nenhum dano. Só tenta quem é **mais rápido** que o atacante: diferença = velocidade do Assassin − velocidade do atacante (ex.: 5 − 3 = 2); tira-se um dado e esquiva se sair de **1 até a diferença** (1 ou 2). Velocidade igual ou maior do atacante: não esquiva. **Magos sempre acertam.** O sorteio é automático e o resultado aparece no registro; ao escolher um alvo Assassin, a tela mostra a chance ("tirar 1 a N no dado"). Ataque esquivado gasta a ação do atacante (e o bônus de apoio/mana já gastos). O dado é **provisório: d6** (`dodgeDie`).
- **Monte principal** (`js/data/reset_cards.js` dados · `js/core/deck.js` regras · `js/ui/hand_ui.js` leque inferior esquerdo): um monte único e embaralhado por batalha, **só com Apoio, Habilidade Especial, Item e Daly** (`G.CONFIG.mainDeckTypes`; os Fragmentos Primordiais continuam cadastrados mas ficam fora do monte). Sempre que a hierarquia de velocidade reseta (início de cada nova rodada, a partir da 2ª), **as duas equipes compram 1 carta** (jogador primeiro, depois adversário). Cada reset conta uma única vez (`deck.resets`), a compra não reinicia a fila nem dá ação extra, e monte vazio não compra. No monte principal, só as 3 cartas de Apoio têm arte; as demais são **provisórias** (2 por tipo, 2 cópias cada). A mão do adversário aparece só como contagem. A mão de cada participante é limitada a **5 cartas**: quando a mão do jogador está cheia, ele escolhe uma carta para substituir pela nova ou descarta a nova; a IA substitui a carta mais antiga. **Item e Habilidade Especial ainda não têm efeito**: ficam na mão. Ajustes em `G.CONFIG.resetDraw` (`perTeam`, `onBattleStart`).
- **Daly** (carta do monte principal, `G.resolveDalle` em `js/core/roster.js`): comprada, é **resolvida na hora** e dá um personagem a quem a comprou. A **cor/tipo** define quem é elegível; a **raridade** sai do sorteio ponderado `G.CONFIG.dalleRarityWeights` (60/25/10/4/1 — configuração inicial, um único lugar), independente de quantos personagens há em cada monte. Raridade sem elegível sai do sorteio e os pesos são recalculados; sem nenhum elegível nada é inventado e a Daly continua na mão, desde que isso não ultrapasse o limite da mão. Não provoca outra compra e não dá ataque extra (o novo age a partir da rodada seguinte). A Daly resolvida vai para o descarte de cartas (`deck.discard`), nunca para os eliminados. **Cor:** o projeto ainda não tem cores/tipos cadastrados; uma carta Daly pode ter `color:'...'` e um personagem `color:'...'` — com `color` na Daly só entram personagens com a mesma cor; **sem `color`, todos os disponíveis são elegíveis**.
- Ataque básico a um personagem = Dano do atacante (sem crítico ou aleatoriedade; Assassin pode esquivar). Eliminar personagens **não** encerra a partida: ela só acaba quando uma Daly Mãe chega a 0.

## v0.14.0 — faixas de atributos e novas regras

### Faixas oficiais de atributos

| Raridade | Vida mínima–máxima | Dano mínimo–máximo |
|---|---:|---:|
| Comum | 130–220 | 25–120 |
| Raro | 200–350 | 30–150 |
| Épico | 320–530 | 50–220 |
| Lendário | 430–700 | 90–430 |
| Secreto | 550–1.200 | 150–670 |

A classe posiciona o valor dentro da faixa de cada raridade. Em Vida: Destroyer muito baixa, Mago baixa, Assassin normal, Fighter média, Support alta e Tank muito alta. Em Dano: Support muito baixo, Assassin médio, Fighter normal, Tank alto e Mago/Destroyer muito alto. Os valores resultantes são centralizados em `js/data/characters.js`.

### Mão e cartas de Apoio
- Não há cartas de Apoio equipadas no início nem painel lateral. As cartas de Apoio podem vir do monte principal durante a compra de reset e aparecem no leque no canto inferior esquerdo.
- O monte provisório tem 18 cartas físicas, sendo 6 cartas de Apoio (3 tipos × 2 cópias): aproximadamente 1 chance em 3 no início, variando conforme as cartas restantes.
- A mão é limitada a 5 cartas. Com a mão cheia, o jogador clica em uma carta antiga para substituí-la pela nova ou escolhe manter as cinco e descartar a nova. A IA substitui automaticamente a carta mais antiga.
- Cartas de Apoio da mão podem ser selecionadas e usadas na vez do jogador; uma por turno. Na Moloeira dá +20 ao próximo ataque, Bandeide cura +80 e Brisa pode curar +30 após a eliminação de um aliado. Cartas usadas vão para o descarte.
- Item e Habilidade Especial continuam provisórios, sem efeito implementado.

### Mana e feedback visual
- Todo Mago começa com 3/3 de mana e o máximo é 3, independentemente da raridade.
- Ao final de cada ação resolvida, cada Mago vivo que não esteja no máximo recupera +1 de mana. O bônus de dano por ponto de mana permanece provisório em +10.
- A batalha tem registro de eventos com cores e ícones, animação no atacante/alvo, números flutuantes de dano, destaque de esquiva e eliminação, impacto na Daly Mãe e registros de cura e regeneração de mana.

## Ainda em aberto
Onze personagens ainda usam nomes e retratos provisórios; Sam, Eletric e Sarck têm artes recebidas. Os atributos em jogo seguem as faixas da v0.14.0, preservando os valores informados nas artes quando cabem nelas. O catálogo atual contém 7 Comuns, 2 Raros, 2 Épicos, 3 Lendários e 0 Secretos, portanto os montes e as opções de recuperação podem esvaziar rapidamente. Ainda faltam o mapa real de cor/tipo das Dalles e a associação de personagens a cada cor; arte/textos da Daly Mãe; cores oficiais de borda das raridades Common/Rare/Epic/Secret; dado oficial de Esquiva (atualmente d6); número do orbe do Esquivar; efeitos de Item e Habilidade Especial; decisão sobre comprar também na rodada 1; confirmação do dano oficial por ponto de mana; custo oficial da troca e recuperação de fôlego; escudo de Tributo (Fighter); significado do “x6” na carta; conteúdo e moeda da Loja; e habilidades especiais.

## Testes atuais
Execute `npm test` para verificar as regras atuais, a interface com DOM simulado, o catálogo ilustrado e 100 partidas completas de integração. O protótipo também foi aberto no Chromium durante a integração. Os testes antigos da v0.12.0 permanecem consultáveis no primeiro commit do histórico; eles contêm expectativas de regras substituídas.

## v0.15.0 — personagens ilustrados

A coleção do menu mostra Sam, Eletric e Sarck. Eletric é um Mago Raro com 220 de Vida, 130 de Dano e Velocidade 3; os dois primeiros valores vêm da carta recebida. Sarck é um Tank Épico com 530 de Vida conforme a carta; o Dano calculado pela classe e a Velocidade 2 são provisórios. As habilidades especiais “3000W” e “Steel Jaw” aparecem apenas como nomes até suas regras serem definidas. As cartas são compostas com ilustrações separadas e atributos do estado do jogo. As cartas prontas recebidas ficam apenas em `assets/references/characters/`. Sam usa o retrato do banner ilustrado disponível e mantém os atributos das faixas atuais. Há 36 imagens em `assets/concepts/kikiy/` para uso futuro; veja `docs/ARTES.md`.
