# Estrutura base do GOGHOS — v0.16.0

Estas são as regras atuais, conforme a estrutura descrita pelo criador. As diferenças das versões anteriores ficam em [HISTORICO.md](HISTORICO.md).

## Seleção

Ao clicar em **Jogar**, aparecem todos os personagens Comuns cadastrados, as marcações das escolhas e o botão **Voltar ao menu**. A ordem é jogador → bot → jogador → bot, sem repetir personagens. Cada equipe recebe dois. Depois da quarta escolha, aparece **Play · começar batalha**, na mesma tela. Não há mão, cartas de Apoio ou montes na seleção.

Os quatro personagens escolhidos saem de seus montes. As duas equipes começam com os dois na linha de frente e a retaguarda vazia.

## Equipes e Suportes

A equipe tem no máximo cinco personagens: três na linha de frente e dois na retaguarda. Somente Suportes podem ficar na retaguarda; eles não atacam nem podem ser atacados enquanto estiverem lá.

Personagens obtidos ocupam vagas da frente primeiro. Com a frente cheia, somente um Suporte pode entrar na retaguarda. Um resgate sem vaga válida não retira o personagem do monte nem gasta a medalha.

Quando a frente perde seu último personagem, um Suporte avança automaticamente. Se houver dois, a batalha pausa para o dono escolher qualquer um deles ou ambos para a frente. A IA avança ambos. A frente nunca permanece vazia enquanto houver um Suporte vivo atrás.

Na vez da própria equipe, **Mover Suportes** permite avançar ou recuar Suportes, respeitando as vagas e mantendo pelo menos um defensor na frente. Se a linha estiver cheia, é possível trocar dois Suportes de linhas diferentes. Esse trânsito não gasta ataque ou fôlego. Personagens recém-obtidos ou que estavam na retaguarda entram na ordem da rodada seguinte; mover não apaga ações já realizadas.

## Velocidade e compras

Os personagens vivos da frente agem da maior velocidade para a menor. O desempate favorece o jogador e depois a posição na linha. Após todos os elegíveis agirem, a hierarquia reseta e cada equipe compra uma carta do monte principal. A rodada inicial não compra.

Cada reset compra uma única vez, mesmo se a interface consultar a ordem várias vezes. Escolhas de recuperação, formação, mão cheia e cura da Brisa pausam a batalha.

## Montes e medalhas

Há seis montes compartilhados, visíveis na arena: o principal e cinco de personagens, separados por **raridade**. Cada monte é embaralhado independentemente no início da partida. Classe (Mago, Suporte etc.) é um atributo do personagem, não um monte adicional.

O monte principal provisório tem 24 cartas: 6 de Apoio, 4 de Item, 4 de Habilidade Especial e 10 medalhas (duas de cada cor). Fragmentos Primordiais ficam fora dele.

| Medalha | Monte resgatado |
| --- | --- |
| Azul | Comum |
| Verde | Raro |
| Roxa | Épico |
| Holográfica | Lendário |
| Preta | Secreto |

Toda compra vai para a mão, inclusive as medalhas. Na vez da equipe, selecione uma medalha e use **Resgatar personagem**. Ela obtém exatamente a carta do topo do monte indicado pela cor, sem sorteio adicional de raridade e sem ataque extra. A medalha vai para o descarte somente quando o personagem entra na equipe. Com o monte vazio ou sem vaga para o topo, permanece na mão. A IA usa as mesmas regras.

O catálogo atual tem 7 Comuns, 2 Raros, 2 Épicos, 3 Lendários e nenhum Secreto. O monte Secreto aparece vazio até receber personagens; a medalha preta não cria um personagem inexistente.

## Mão e cartas de Apoio

O leque fica no canto inferior esquerdo, com no máximo cinco cartas. No celular, a arena rola acima de uma área reservada ao leque para evitar sobreposições. A mão adversária é mostrada apenas como contagem.

Ao comprar com cinco cartas, o jogador escolhe uma antiga para substituir ou descarta a nova. Isso vale também para medalhas. A compra pendente não vira uma sexta carta permanente. A IA substitui a mais antiga.

Na própria vez, pode usar uma carta de Apoio por turno, sem gastar o ataque. **Na Moloeira** dá +20 ao próximo ataque; **Bandeide** cura até 80 de Vida de um aliado; **Brisa** permite curar outro aliado ferido em 30 quando um aliado é eliminado. Cartas usadas vão para o descarte. Os efeitos de Item e Habilidade Especial continuam em desenvolvimento e são indicados ao selecionar essas cartas.

## Eliminação, Daly Mãe e recuperação

Personagens derrotados ficam na área **Personagens Eliminados**, identificados por equipe. Saem da fila de ações e não voltam aos montes, à mão ou à equipe durante a partida.

Cada Daly Mãe começa com três vidas. Fica exposta somente quando sua equipe não tem personagens vivos na frente nem atrás. Cada ataque válido à Daly Mãe tira exatamente uma vida, independentemente do dano do atacante. Não usa bônus de dano nem mana.

Enquanto ainda tiver vida, o dono escolhe uma única recuperação: até 3 Comuns, até 2 Raros ou até 1 Épico. Recebe cartas do topo dessa raridade. Se restarem menos, recebe as restantes; monte vazio fica bloqueado. Exemplo: com 2 Comuns, 1 Raro e 0 Épicos, escolhe os 2 Comuns OU o 1 Raro. Não mistura raridades e não ressuscita eliminados.

Se nenhum monte permitir recuperação, a partida segue com a Daly Mãe exposta. Ao chegar a zero vidas, a partida encerra: vence quem mantém sua Daly Mãe viva. Nova partida limpa o estado anterior.

## Ritmo e leitura das ações

O bot espera 1,8 segundo antes de agir. Após cada ataque, há 2,2 segundos para conferir atacante, alvo, dano, Vida antes/depois e a barra de Vida. Uma carta eliminada permanece visível durante esse feedback e depois sai da equipe. O botão **Pausar** permite interromper o andamento; escolhas do jogador não têm limite de tempo.

A arena mostra vagas de frente e retaguarda, ordem de velocidade, seis montes com contagens, leque, registro das ações e eliminados. Resgates, curas, movimentações e compras são registrados. Parâmetros de ritmo ficam em `G.CONFIG.pacing`.

## Atributos e regras preservadas

| Raridade | Vida | Dano |
| --- | ---: | ---: |
| Comum | 130–220 | 25–120 |
| Raro | 200–350 | 30–150 |
| Épico | 320–530 | 50–220 |
| Lendário | 430–700 | 90–430 |
| Secreto | 550–1200 | 150–670 |

O perfil da classe posiciona os atributos nessas faixas. Magos começam com 3/3 de mana, cada ponto gasto soma 10 de dano (provisório), e recuperam 1 por ação resolvida. Um Assassin mais rápido que o atacante pode esquivar: num d6, precisa tirar até a diferença de velocidade; Magos sempre acertam. A esquiva consome a ação do atacante.

Sam, Eletric e Sarck usam ilustrações separadas, molduras e atributos dinâmicos. As cartas prontas ficam apenas como referência. Os demais nomes e retratos são provisórios. Veja [ARTES.md](ARTES.md) para os arquivos, enquadramentos e símbolos.

Continuam provisórios os efeitos de Item/Habilidade Especial, habilidades dos personagens, alguns atributos e raridades, os ícones de classe ainda não recebidos e a Loja. Não há geração automática de novas artes ou de personagens Secretos.
