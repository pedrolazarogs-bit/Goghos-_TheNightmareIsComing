# GOGHOS TCG — protótipo jogável (v0.12.0)

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
- **Personagens e configuração**: somente `js/data/characters.js` (Vida, Dano, Velocidade, Fôlego, Classe, Raridade, Habilidade). "sam" usa os dados da carta de referência; os demais são **provisórios**.
- **Posição de textos/ícones na carta**: `js/ui/card.js` (coordenadas em pixels da imagem da moldura).
- **Regras**: `js/core/battle.js` · **IA**: `js/core/ai.js` · **Telas**: `js/ui/ui.js`.

## Regras implementadas
- Batalha por turnos; ordem por **Velocidade** (maior primeiro), recalculada a cada rodada com os vivos.
  Desempate: equipe do jogador antes da adversária, depois a posição na equipe.
- **Seleção inicial** (`js/core/selection.js`): ao clicar em Jogar sorteia **5 personagens Comuns distintos** (só raridade `COMMON` real; com 4 já dá para jogar; com menos de 4 a batalha não começa e a tela explica).
  Escolhas na ordem **jogador → bot → jogador → bot**; ninguém escolhido volta. O bot escolhe ao acaso entre os que sobram. Cada lado fica com **2 na linha de frente e a retaguarda vazia**; o 5º continua no monte Comum.
- **Equipe**: linha de frente (ataca e é atacada) + retaguarda (personagens vivos que esperam; não atacam nem são atacados; qualquer classe). Personagem novo (Daly / recuperação) vai para a retaguarda se a frente tem vivo; se a equipe não tem ninguém vivo, o 1º entra na frente.
  Quando a frente esvazia e há vivo na retaguarda, **um** é promovido na hora (age só a partir da rodada seguinte; sem turno nem ataque extra).
- **Eliminação permanente** (`G.eliminateUnit`): sai da equipe e da fila, vai para a área **Personagens Eliminados** (com o dono), não age, não é alvo e **não volta aos montes** durante a partida.
- **5 montes de personagens** (`G.createCharacterPiles`): Comum, Raro, Épico, Lendário e Secreto, compartilhados pelas duas equipes. Cada carta física tem `iid` (opcional `copies` por personagem). Os personagens iniciais saem do monte Comum. Personagem sem raridade válida não entra em nenhum monte.
- **Daly Mãe** (esmeralda, uma por lado, **3 vidas**): protegida enquanto houver QUALQUER personagem vivo na equipe; **exposta só com a equipe inteira eliminada** — aí o ataque normal vira ataque a ela (clique no painel dela; a IA faz sozinha). **Cada ataque válido tira exatamente 1 vida** (sem dano excedente, sem esquiva; bônus de apoio e mana não são gastos).
- **Recuperação** (Daly Mãe ainda com vida depois do golpe): o dono escolhe **UMA** opção — **A = 3 Comuns · B = 2 Raros · C = 1 Épico** (sem misturar, nada parcial; opção sem cartas suficientes aparece indisponível; vem só dos montes de personagens). Os recuperados entram pela regra da equipe (1º na frente se ela estiver vazia). Não devolve vida à Daly Mãe, não ressuscita eliminados, não dá ataque/turno/compra extra. O bot escolhe sozinho uma opção possível. Sem nenhuma opção possível o jogo segue e a Daly Mãe continua exposta.
- **Fim da partida**: quando uma Daly Mãe chega a 0, a partida acaba na hora e **vence quem tem a Daly Mãe viva** (independe de quantos personagens tem). Bloqueia ações, compras, Daly, recuperação, apoio, troca e novos ataques. A tela de resultado mostra vencedor, perdedor e qual Daly Mãe caiu; **Menu** e **Nova partida** limpam todo o estado temporário (nova partida começa por uma nova seleção).
- **Troca voluntária** (na sua vez, inalterada): um **Suporte** da retaguarda ⇄ um **Suporte** da frente. Custa fôlego de cada um (valor provisório `swapStaminaCost`, hoje 3); não gasta a ação. A IA não usa a troca. Como a retaguarda agora começa vazia, o botão só habilita quando houver um Suporte nela.
- **Cartas de Apoio** (painel à esquerda, máx. 3, só o jogador usa; dados em `js/data/support_cards.js`, regras em `js/core/support.js`):
  clique na carta (fica **SELECIONADA**) → se precisar, escolha o aliado → **Usar**. Cada carta mostra a quantidade restante (selo ×N e "Restam n/N"), e ATIVA/ESGOTADA quando for o caso.
  1 carta por turno, na sua vez; não gasta ação nem fôlego. **Na Moloeira**: o próximo ataque causa +20. **Bandeide**: cura +80 em um aliado ferido. **Brisa**: fica ativa até o fim da batalha; a cada aliado eliminado você pode curar +30 em outro aliado ferido (ou pular).
  "Turno" = o intervalo até o próximo ataque (a vez de cada personagem). Quantidade por batalha (2 de cada) é provisória.
- **Classe Mago** (Tributo: Mana): tem mana por raridade (Comum 2, Raro 3, Épico 5, Lendário 7). Na sua vez, o Mago escolhe quanta mana gastar (− / +) e cada ponto soma dano (`manaDamagePerPoint`, hoje **+10, provisório**). A mana gasta não volta (sem regeneração, por enquanto). A IA gasta o mínimo de mana que elimina o alvo, ou 1.
- **Classe Assassin** (Tributo: Esquivar): quando um oponente ataca um Assassin, ele pode esquivar e não tomar nenhum dano. Só tenta quem é **mais rápido** que o atacante: diferença = velocidade do Assassin − velocidade do atacante (ex.: 5 − 3 = 2); tira-se um dado e esquiva se sair de **1 até a diferença** (1 ou 2). Velocidade igual ou maior do atacante: não esquiva. **Magos sempre acertam.** O sorteio é automático e o resultado aparece no registro; ao escolher um alvo Assassin, a tela mostra a chance ("tirar 1 a N no dado"). Ataque esquivado gasta a ação do atacante (e o bônus de apoio/mana já gastos). O dado é **provisório: d6** (`dodgeDie`).
- **Monte principal** (`js/data/reset_cards.js` dados · `js/core/deck.js` regras · `js/ui/hand_ui.js` painel direito "Mão"): um monte único e embaralhado por batalha, **só com Apoio, Habilidade Especial, Item e Daly** (`G.CONFIG.mainDeckTypes`; os Fragmentos Primordiais continuam cadastrados mas ficam fora do monte). Sempre que a hierarquia de velocidade reseta (início de cada nova rodada, a partir da 2ª), **as duas equipes compram 1 carta** (jogador primeiro, depois adversário). Cada reset conta uma única vez (`deck.resets`), a compra não reinicia a fila nem dá ação extra, e monte vazio não compra. Hoje só as 3 cartas de Apoio têm arte; as demais são **provisórias** (2 por tipo, 2 cópias cada). A mão do adversário aparece só como contagem. **Item e Habilidade Especial ainda não têm efeito**: ficam na mão. Ajustes em `G.CONFIG.resetDraw` (`perTeam`, `onBattleStart`).
- **Daly** (carta do monte principal, `G.resolveDalle` em `js/core/roster.js`): comprada, é **resolvida na hora** e dá um personagem a quem a comprou. A **cor/tipo** define quem é elegível; a **raridade** sai do sorteio ponderado `G.CONFIG.dalleRarityWeights` (60/25/10/4/1 — configuração inicial, um único lugar), independente de quantos personagens há em cada monte. Raridade sem elegível sai do sorteio e os pesos são recalculados; sem nenhum elegível nada é inventado e a Daly continua na mão. Não provoca outra compra e não dá ataque extra (o novo age a partir da rodada seguinte). A Daly resolvida vai para o descarte de cartas (`deck.discard`), nunca para os eliminados. **Cor:** o projeto ainda não tem cores/tipos cadastrados; uma carta Daly pode ter `color:'...'` e um personagem `color:'...'` — com `color` na Daly só entram personagens com a mesma cor; **sem `color`, todos os disponíveis são elegíveis**.
- Ataque básico a um personagem = Dano do atacante (sem crítico ou aleatoriedade; Assassin pode esquivar). Eliminar personagens **não** encerra a partida: ela só acaba quando uma Daly Mãe chega a 0.

## Ainda em aberto (aguardando definição do criador)
**Dados provisórios criados só para o jogo rodar (troque pelos reais em `js/data/characters.js`):** raridades dos personagens `char_02…char_08` (Comum) e `char_09` (Épico) — antes eram `null`, e sem Comuns a seleção inicial não pode começar. Hoje: 7 Comuns, 1 Raro, 1 Épico, 3 Lendários, **0 Secretos**. Com tão poucos personagens os montes esvaziam rápido e a recuperação costuma ficar indisponível (em 300 partidas simuladas de IA contra IA, ~72% dos golpes na Daly Mãe caíram sem nenhuma opção possível). Com um catálogo maior isso deixa de acontecer.
Mapa real de **cor/tipo das Dalles** e quais personagens pertencem a cada cor · arte e textos da **Daly Mãe** (hoje é uma esmeralda desenhada em CSS) · mana dos personagens **Secretos** (não há valor em `MANA_BY_RARITY`) · se a **troca voluntária** deve valer para qualquer classe (hoje só Suportes) · cores de borda das raridades Common/Rare/Epic/Secret (só Legendary está definida) · quantos personagens cabem na frente (hoje: só um vai para a frente quando ela esvazia) · Dado oficial da esquiva (usei d6) · que número mostrar no orbe do Esquivar · Efeitos de Item e Habilidade Especial · limite de mão · composição/quantidade do monte principal · comprar já na rodada 1 · Dano oficial por ponto de mana e se a mana se recupera · Definição oficial de "turno" e da quantidade das cartas de Apoio · escolha das cartas de Apoio antes da batalha (hoje entram todas, até 3) · custo oficial da troca e recuperação de fôlego · escudo de Tributo (Fighter) · significado do "x6" na carta · conteúdo e moeda da Loja · habilidades especiais.

## Testes
`node tests/battle.test.js` (regras que já existiam) · `node tests/match.test.js` (regras da v0.12.0: seleção, montes, Daly, eliminação, Daly Mãe, recuperação, encerramento e 300 partidas completas de IA) · `node tests/ui.smoke.test.js` (interface com DOM simulado). Requer Node.js. Nenhum deles é um navegador real.
