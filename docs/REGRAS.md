# Estrutura base do GOGHOS — v0.18.1

Estas são as regras atuais, conforme a estrutura descrita pelo criador. As diferenças das versões anteriores ficam em [HISTORICO.md](HISTORICO.md).

## Seleção

Ao clicar em **Jogar**, aparecem todos os personagens Comuns cadastrados, as marcações das escolhas e o botão **Voltar ao menu**. A ordem é jogador → bot → jogador → bot, sem repetir personagens. Cada equipe recebe dois. Depois da quarta escolha, aparece **Play · começar batalha**, na mesma tela. Não há mão, cartas de Apoio ou montes na seleção.

Os quatro personagens escolhidos saem de seus montes. As duas equipes começam com os dois na linha de frente e a retaguarda vazia.

## Equipes e Suportes

A equipe tem no máximo cinco personagens: três na linha de frente e dois na retaguarda. Somente Suportes podem ficar na retaguarda; eles não atacam nem podem ser atacados enquanto estiverem lá.

Personagens obtidos ocupam vagas da frente primeiro. Com a frente cheia, somente um Suporte pode entrar na retaguarda. Um resgate sem vaga válida não retira o personagem do monte nem gasta a medalha.

Quando a frente perde seu último personagem, um Suporte avança automaticamente. Se houver dois, a batalha pausa para o dono escolher qualquer um deles ou ambos para a frente. A IA avança ambos. A frente nunca permanece vazia enquanto houver um Suporte vivo atrás.

Na vez da própria equipe, **Mover Suportes** permite avançar ou recuar Suportes, respeitando as vagas e mantendo pelo menos um defensor na frente. Se a linha estiver cheia, é possível trocar dois Suportes de linhas diferentes. Esse trânsito não gasta ataque ou fôlego. Personagens obtidos por medalha ou que estavam na retaguarda entram na ordem da rodada seguinte; mover não apaga ações já realizadas. A recuperação da Daly Mãe segue a regra de continuidade descrita abaixo. Se a reação de Sark eliminar os últimos defensores das duas equipes na mesma troca, as duas formações são resolvidas, uma de cada vez.

## Velocidade e compras

Os personagens vivos da frente que têm ataque agem da maior velocidade para a menor. Sark é apenas reativo e não entra nessa fila. O desempate favorece o jogador e depois a posição na linha. Após todos os elegíveis agirem, a hierarquia reseta e cada equipe compra uma carta do monte principal. A rodada inicial não compra.

Cada reset compra uma única vez, mesmo se a interface consultar a ordem várias vezes. Escolhas de recuperação, formação, mão cheia e cura da Brisa pausam a batalha.

Se não houver atacante nas duas equipes, **Avançar ciclo · comprar cartas** permite comprar uma carta por equipe, mantendo o limite da mão e a escolha de substituição. Consultar a fila não avança esse ciclo. As medalhas podem ser usadas nessa espera; o bot também as resgata. O primeiro atacante obtido entra no ciclo que aguardava, sem provocar outra compra. Sem atacantes, com o monte principal vazio e nenhuma medalha utilizável nas duas mãos, a partida termina em **empate**, conforme definido pelo criador. Uma escolha de mão cheia, formação, recuperação ou Brisa é resolvida antes dessa verificação.

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

O catálogo atual tem 7 Comuns, 2 Raros, 1 Épico, 4 Lendários e nenhum Secreto. Sark passou para o monte Lendário. O monte Secreto aparece vazio até receber personagens; a medalha preta não cria um personagem inexistente.

## Mão e cartas de Apoio

O leque fica no canto inferior esquerdo, com no máximo cinco cartas. No celular, a arena rola acima de uma área reservada ao leque para evitar sobreposições. A mão adversária é mostrada apenas como contagem.

Ao comprar com cinco cartas, o jogador escolhe uma antiga para substituir ou descarta a nova. Isso vale também para medalhas. A compra pendente não vira uma sexta carta permanente. A IA substitui a mais antiga.

Na própria vez, pode usar uma carta de Apoio por turno, sem gastar o ataque. **Na Moloeira** dá +20 ao próximo ataque; **Bandeide** cura até 80 de Vida de um aliado; **Brisa** permite curar outro aliado ferido em 30 quando um aliado é eliminado. Cartas usadas vão para o descarte. Os efeitos de Item e Habilidade Especial continuam em desenvolvimento e são indicados ao selecionar essas cartas.

## Eliminação, Daly Mãe e recuperação

Personagens derrotados ficam na área **Personagens Eliminados**, identificados por equipe. Saem da fila de ações e não voltam aos montes, à mão ou à equipe durante a partida.

Cada Daly Mãe começa com três vidas. Fica exposta somente quando sua equipe não tem personagens vivos na frente nem atrás. Cada ataque válido à Daly Mãe tira exatamente uma vida, independentemente do dano do atacante. Não usa bônus de dano nem mana.

Enquanto ainda tiver vida, o dono escolhe uma única recuperação: até 3 Comuns, até 2 Raros ou até 1 Épico. Recebe cartas do topo dessa raridade. Se restarem menos, recebe as restantes; monte vazio fica bloqueado. Exemplo: com 2 Comuns, 1 Raro e 0 Épicos, escolhe os 2 Comuns OU o 1 Raro. Não mistura raridades e não ressuscita eliminados.

A recuperação mantém a rodada e retoma da velocidade do ataque à Daly Mãe. Os resgatados com velocidade igual ou menor entram na fila restante, intercalados com os oponentes pela velocidade e pelo desempate já existente (jogador, depois posição). Exemplo: após um ataque de velocidade 5, um resgatado de velocidade 4 age junto da faixa 4, antes das velocidades menores. Se ainda houver personagens de velocidade 5, eles agem primeiro. Um resgatado de velocidade 6 nesse caso aguarda o próximo reset, pois sua velocidade já passou. Quem já atacou não ataca de novo, e o resgate não compra cartas. O reset só acontece quando não resta nenhuma ação elegível, incluindo os recuperados.

Se nenhum monte permitir recuperação, a partida segue com a Daly Mãe exposta. Ao chegar a zero vidas, a partida encerra: vence quem mantém sua Daly Mãe viva. Nova partida limpa o estado anterior.

## Habilidade principal de Sark — Steel Jaw

Sark é **Assassino Lendário**, com **530 de Vida** e **5 de fôlego**. Não tem ataque básico nem velocidade; os traços da carta representam essa ausência. O rank roxo é decorativo e não participa das regras; permanece na imagem original. Sark ocupa uma vaga da frente e protege sua Daly Mãe como os demais personagens, mas nunca recebe uma ação de ataque.

Ao receber um ataque válido, Sark recebe o dano normal, incluindo mana e bônus de ataque existentes. Na mesma ação, **Steel Jaw reage automaticamente contra o atacante**:

| Raridade do atacante | Resposta de Steel Jaw |
| --- | --- |
| Comum, Raro ou Épico | Eliminação instantânea, independentemente da Vida restante |
| Lendário ou Secreto | 390 de dano; é eliminado se a Vida chegar a zero |

A reação acontece inclusive quando o ataque derrota Sark: as duas perdas são resolvidas na mesma troca. Não consome ataque, mana ou fôlego de Sark, não altera a velocidade da ação original, não faz teste de esquiva e não dispara outra reação. Como Sark não tem velocidade, também não recebe a esquiva provisória dos Assassinos. Um ataque a outro personagem não ativa Steel Jaw. O dano não passa para a Daly Mãe; eventual eliminação apenas a expõe, sem retirar vida nem abrir recuperação automaticamente.

Derrotados pelo ataque ou pela reação seguem a mesma eliminação permanente. Avanço de Suportes e Brisa consideram as perdas das duas equipes. Curas existentes usam a Vida atual de Sark. Não foram inventadas cartas de imunidade ou redução: ainda não há uma carta com esses efeitos no catálogo.

O menu **Testar Sark** oferece formações prontas para atacar ou defender, sem mudar a seleção normal de Comuns. Na partida normal, a medalha Holográfica resgata o topo do monte Lendário, que pode conter Sark. A carta exibe a base completa enviada, sem reconstruir o retrato ou os símbolos, e acrescenta somente Vida atual e fôlego nos espaços vazios. A imagem mantém o nome impresso SARCK; o nome no estado é Sark, e o identificador legado `sarck` foi preservado.

## Ritmo e leitura das ações

O bot espera 1,8 segundo antes de agir. Após cada ataque, há 2,2 segundos para conferir atacante, alvo, dano, Vida antes/depois e a barra de Vida. Com Steel Jaw, esse intervalo é de 4,4 segundos para ler o ataque e a reação, apresentados juntos no registro e nas duas cartas. Uma carta eliminada permanece visível durante esse feedback e depois sai da equipe. O botão **Pausar** permite interromper o andamento; escolhas do jogador não têm limite de tempo.

A arena coloca as equipes no centro, com os Suportes nos flancos da Daly Mãe; montes de raridade, registro e leque à esquerda; e vez atual, próximo personagem, monte principal e atributos à direita. Mantém vagas, ordem de velocidade, seis montes com contagens e a área separada de eliminados. Resgates, curas, movimentações e compras são registrados. Parâmetros de ritmo ficam em `G.CONFIG.pacing`.

## Atributos e regras preservadas

| Raridade | Vida | Dano |
| --- | ---: | ---: |
| Comum | 130–220 | 25–120 |
| Raro | 200–350 | 30–150 |
| Épico | 320–530 | 50–220 |
| Lendário | 430–700 | 90–430 |
| Secreto | 550–1200 | 150–670 |

O perfil da classe posiciona os atributos nessas faixas. Magos começam com 3/3 de mana, cada ponto gasto soma 10 de dano (provisório), e recuperam 1 por ação resolvida. Um Assassin mais rápido que o atacante pode esquivar: num d6, precisa tirar até a diferença de velocidade; Magos sempre acertam. A esquiva consome a ação do atacante.

Bases completas de personagem devem ser usadas inteiras, com sobreposição somente dos números correspondentes ao estado atual. Sark já usa esse formato com a base recebida no SarckKit. Personagens ainda sem base numérica própria mantêm a apresentação provisória. Sark é a exceção explícita à faixa de Dano básico: tem zero internamente e a base exibe um traço; o valor 390 pertence à reação. Os demais nomes e retratos são provisórios. Veja [ARTES.md](ARTES.md) para os arquivos e a apresentação atual.

Continuam provisórios os efeitos de Item/Habilidade Especial, as habilidades dos personagens exceto Steel Jaw, alguns atributos e raridades, os ícones de classe ainda não recebidos e a Loja. Não há geração automática de novas artes ou de personagens Secretos.

## Apresentação da v0.17.0

A alteração da v0.17.0 foi visual, com o núcleo e os tempos da v0.16.0 preservados naquela versão. O cristal rosa, os corações, o verso das cartas e o troféu usam os arquivos recebidos. A indicação superior mostra a rodada atual.

As prévias de vez e próximo personagem apenas consultam a fila atual. Durante escolhas pendentes, a interface avisa que está aguardando; ao terminar a fila, mostra que o próximo passo é o reset. O painel de atributos usa Vida, Dano, Velocidade, Fôlego e mana do estado atual.

No celular, os painéis se reorganizam e a arena rola acima do espaço reservado ao leque. Essa reserva acompanha mudanças de tamanho e orientação da tela.
