# Estrutura base do GOGHOS — v0.20.0

Estas são as regras atuais, conforme a estrutura descrita pelo criador. As diferenças das versões anteriores ficam em [HISTORICO.md](HISTORICO.md).

## Seleção

Ao clicar em **Jogar**, aparecem todos os personagens Comuns cadastrados, as marcações das escolhas e o botão **Voltar ao menu**. A ordem é jogador → bot → jogador → bot, sem repetir personagens. Cada equipe recebe dois. Depois da quarta escolha, aparece **Play · começar batalha**, na mesma tela. Não há mão, cartas de Apoio ou montes na seleção.

Os quatro personagens escolhidos saem de seus montes. As duas equipes começam com os dois na linha de frente e a retaguarda vazia.

## Equipes e Suportes

A equipe tem no máximo cinco personagens: três na linha de frente e dois na retaguarda. Somente Suportes podem ficar na retaguarda; eles não atacam nem podem ser atacados por ataques normais enquanto estiverem lá. Ghost Claw e o livro de Vaglar podem escolher a retaguarda; o alvo do duelo pode agir contra Penxy mesmo ficando na sua vaga de trás.

Personagens obtidos ocupam vagas da frente primeiro. Com a frente cheia, somente um Suporte pode entrar na retaguarda. Um resgate sem vaga válida não retira o personagem do monte nem gasta a medalha.

Quando a frente perde seu último personagem, um Suporte avança automaticamente. Se houver dois, a batalha pausa para o dono escolher qualquer um deles ou ambos para a frente. A IA avança ambos. A frente nunca permanece vazia enquanto houver um Suporte vivo atrás.

Na vez da própria equipe, **Mover Suportes** permite avançar ou recuar Suportes, respeitando as vagas e mantendo pelo menos um defensor na frente. Se a linha estiver cheia, é possível trocar dois Suportes de linhas diferentes. Esse trânsito não gasta ataque ou fôlego. Personagens obtidos por medalha ou que estavam na retaguarda entram na ordem da rodada seguinte; mover não apaga ações já realizadas. A recuperação da Daly Mãe segue a regra de continuidade descrita abaixo. Se Sark for derrotado, somente a defesa dele precisa ser reposta; se sobreviver e eliminar o atacante, o avanço é da equipe do atacante.

## Velocidade e compras

Os personagens vivos da frente que têm ataque agem da maior velocidade para a menor. Sark é apenas reativo e não entra nessa fila. O desempate favorece o jogador e depois a posição na linha. Após todos os elegíveis agirem, a hierarquia reseta e cada equipe compra uma carta do monte principal. A rodada inicial não compra.

Cada reset compra uma única vez, mesmo se a interface consultar a ordem várias vezes. Escolhas de recuperação, formação, mão cheia e cura da Brisa pausam a batalha.

Se não houver atacante nas duas equipes, **Avançar ciclo · comprar cartas** permite comprar uma carta por equipe, mantendo o limite da mão e a escolha de substituição. Consultar a fila não avança esse ciclo. As medalhas podem ser usadas nessa espera; o bot também as resgata. O primeiro atacante obtido entra no ciclo que aguardava, sem provocar outra compra. Sem atacantes, com o monte principal vazio e nenhuma medalha utilizável nas duas mãos, a partida termina em **empate**, conforme definido pelo criador. Uma escolha de mão cheia, formação, recuperação ou Brisa é resolvida antes dessa verificação.

## Montes e medalhas

Há sete montes compartilhados, visíveis na arena: o principal e seis de personagens, separados por **raridade**. Cada monte é embaralhado independentemente no início da partida. Classe (Mago, Suporte etc.) é um atributo do personagem, não um monte adicional.

O monte principal provisório tem 26 cartas: 6 de Apoio, 4 de Item, 4 de Habilidade Especial e 12 medalhas (duas de cada cor). Fragmentos Primordiais ficam fora dele.

| Medalha | Monte resgatado |
| --- | --- |
| Azul | Comum |
| Verde | Raro |
| Roxa | Épico |
| Vermelha | Mítico |
| Holográfica | Lendário |
| Preta | Secreto |

Toda compra vai para a mão, inclusive as medalhas. Na vez da equipe, selecione uma medalha e use **Resgatar personagem**. Ela obtém exatamente a carta do topo do monte indicado pela cor, sem sorteio adicional de raridade e sem ataque extra. A medalha vai para o descarte somente quando o personagem entra na equipe. Com o monte vazio ou sem vaga para o topo, permanece na mão. A IA usa as mesmas regras.

O catálogo atual tem 21 personagens: 8 Comuns, 4 Raros, 3 Épicos, 1 Mítico, 5 Lendários e nenhum Secreto. Cavaleiro fica no Comum; DD-X, Elétrica e John no Raro; Zikssy e Elysh no Épico; Vaglar no Mítico; Penxy e Sark no Lendário. A seleção normal continua limitada aos Comuns. O monte Secreto aparece vazio até receber personagens; a medalha preta não cria um personagem inexistente.

## Mão e cartas de Apoio

O leque fica no canto inferior esquerdo, com no máximo cinco cartas. No celular, a arena rola acima de uma área reservada ao leque para evitar sobreposições. A mão adversária é mostrada apenas como contagem.

Ao comprar com cinco cartas, o jogador escolhe uma antiga para substituir ou descarta a nova. Isso vale também para medalhas. A compra pendente não vira uma sexta carta permanente. A IA substitui a mais antiga.

Na própria vez, pode usar uma carta de Apoio por turno, sem gastar o ataque. **Na Moloeira** dá +20 ao próximo ataque; **Bandeide** cura até 80 de Vida de um aliado; **Brisa** permite curar outro aliado ferido em 30 quando um aliado é eliminado. Se uma ação eliminar vários aliados, as escolhas de Brisa são resolvidas uma por vez, com candidatos vivos. Cartas usadas vão para o descarte. Os efeitos de Item e Habilidade Especial continuam em desenvolvimento e são indicados ao selecionar essas cartas.

## Eliminação, Daly Mãe e recuperação

Personagens derrotados ficam na área **Personagens Eliminados**, identificados por equipe. Saem da fila de ações e não voltam aos montes, à mão ou à equipe durante a partida.

Cada Daly Mãe começa com três vidas. Fica exposta somente quando sua equipe não tem personagens vivos na frente nem atrás. Cada ataque válido à Daly Mãe tira exatamente uma vida, independentemente do dano do atacante. Não usa bônus de dano nem mana.

Enquanto ainda tiver vida, o dono escolhe uma única recuperação: até 3 Comuns, até 2 Raros ou até 1 Épico. Recebe cartas do topo dessa raridade. Se restarem menos, recebe as restantes; monte vazio fica bloqueado. Exemplo: com 2 Comuns, 1 Raro e 0 Épicos, escolhe os 2 Comuns OU o 1 Raro. Não mistura raridades e não ressuscita eliminados.

A recuperação mantém a rodada e retoma da velocidade do ataque à Daly Mãe. Os resgatados com velocidade igual ou menor entram na fila restante, intercalados com os oponentes pela velocidade e pelo desempate já existente (jogador, depois posição). Exemplo: após um ataque de velocidade 5, um resgatado de velocidade 4 age junto da faixa 4, antes das velocidades menores. Se ainda houver personagens de velocidade 5, eles agem primeiro. Um resgatado de velocidade 6 nesse caso aguarda o próximo reset, pois sua velocidade já passou. Quem já atacou não ataca de novo, e o resgate não compra cartas. O reset só acontece quando não resta nenhuma ação elegível, incluindo os recuperados.

Se nenhum monte permitir recuperação, a partida segue com a Daly Mãe exposta. Ao chegar a zero vidas, a partida encerra: vence quem mantém sua Daly Mãe viva. Nova partida limpa o estado anterior.

## Habilidade principal de Sark — Steel Jaw

Sark é **Assassino Lendário**, com **530 de Vida** e **5 de fôlego**. Não tem ataque básico nem velocidade; os traços da carta representam essa ausência. O rank roxo é decorativo e não participa das regras; permanece na imagem original. Sark ocupa uma vaga da frente e protege sua Daly Mãe como os demais personagens, mas nunca recebe uma ação de ataque.

Ao receber um ataque válido, Sark recebe primeiro o dano normal, incluindo mana e bônus de ataque existentes. Se sua Vida chegar a zero, ele é eliminado e Steel Jaw não ativa. **Somente se continuar vivo, Steel Jaw reage automaticamente contra o atacante**, ainda na mesma ação:

| Raridade do atacante | Resposta de Steel Jaw |
| --- | --- |
| Comum, Raro, Épico ou Mítico | Eliminação instantânea, independentemente da Vida restante |
| Lendário ou Secreto | 390 de dano; é eliminado se a Vida chegar a zero |

A condição de sobrevivência vale para todas as raridades: com 50 de Vida e recebendo 100 de dano, Sark morre sem revidar; com 100 de Vida e recebendo 50, fica com 50 e então reage. Dano exatamente igual à Vida também impede a reação. Se sobrarem somente 5 de Vida, ele ainda pode revidar.

A reação não consome ataque, mana ou fôlego de Sark, não altera a velocidade da ação original, não faz teste de esquiva e não dispara outra reação. Como Sark não tem velocidade, também não recebe a esquiva provisória dos Assassinos. Um ataque a outro personagem não ativa Steel Jaw. O dano não passa para a Daly Mãe; eventual eliminação apenas a expõe, sem retirar vida nem abrir recuperação automaticamente. A previsão antes do ataque considera o dano total e informa se Sark sobreviverá para reagir ou será eliminado sem revidar.

Derrotados pelo ataque ou pela reação seguem a mesma eliminação permanente. Avanço de Suportes e Brisa consideram a perda que ocorreu. Curas existentes usam a Vida atual de Sark. Não foram inventadas cartas de imunidade ou redução: ainda não há uma carta com esses efeitos no catálogo.

O menu **Testar Sark** oferece formações prontas para atacar ou defender, sem mudar a seleção normal de Comuns. Na partida normal, a medalha Holográfica resgata o topo do monte Lendário, que pode conter Sark. A carta exibe a base completa enviada, sem reconstruir o retrato ou os símbolos, e acrescenta somente Vida atual e fôlego nos espaços vazios. A imagem mantém o nome impresso SARCK; o nome no estado é Sark, e o identificador legado `sarck` foi preservado.

## Elétrica — 3000W

Elétrica é **Mago Raro**, com **3 de velocidade, 4 de fôlego, 3 de mana, 130 de ataque e 220 de Vida**. Sua ação causa dano a todos os adversários que estavam na linha de frente no início do golpe. Não há escolha de alvo individual. Aliados e retaguardas não recebem esse ataque; Suportes promovidos depois dele também não são atingidos pelo golpe já resolvido.

Mana e Na Moloeira são gastos uma única vez por ação e somam dano a cada alvo. Parry é testado individualmente; a regra existente de Magos impede Esquiva, mas não Parry. Todos os danos do ataque são aplicados antes das reações de sobreviventes, incluindo Steel Jaw. A regeneração de mana e o dano periódico de Sharp Guitar ocorrem uma vez por ação, independentemente da quantidade de alvos.

Com a Daly Mãe exposta, a confirmação ataca apenas ela e tira exatamente uma vida, sem gastar mana ou bônus. A habilidade não atravessa os defensores para atingi-la.

## John — Parry e Sharp Guitar

John é **Fighter Raro**, com **2 de velocidade, 3 de fôlego, 80 de ataque e 270 de Vida**. Sua base está sem nome impresso; a interface preenche JOHN, conforme o nome indicado pelo criador. O rank ilustrado continua decorativo.

**Parry:** ao receber um ataque adversário, rola um dado de seis lados. Resultado 1 ou 2 defende todo o dano; de 3 a 6 recebe normalmente. O resultado aparece no registro e no feedback. Não há contra-ataque automático. O limiar 2 é específico de John; outros Fighters ainda não receberam valores confirmados.

**Sharp Guitar:** John escolhe entre um ataque normal de 80 ou causar 80 e cravar o machado. O vínculo só é criado se o golpe acertar e ambos sobreviverem. Parry, Esquiva, dano fatal e a reação fatal de Sark impedem o vínculo. Não é possível cravar na Daly Mãe nem em um personagem já envolvido em outro vínculo.

Enquanto o machado estiver cravado:

- O alvo fica imobilizado: não ataca, não usa cartas da mão na sua vez, não se move e não usa Parry, Esquiva ou reação. Sua posição na hierarquia permanece; **Passar vez · imobilizado** resolve essa ação.
- John não ataca enquanto mantém o machado. Ele continua podendo ser atacado pelos aliados do alvo e fica vulnerável, sem Parry.
- O alvo recebe **20 de dano após cada ação de qualquer personagem, a partir da ação seguinte à cravada**. O golpe inicial causa somente 80. Uma ação em área conta uma vez. Passar a vez imobilizado e manter o machado também contam como ações.
- Na próxima vez de John, **Manter machado** encerra sua ação e mantém o dano. **Retirar e escolher ataque** libera os dois sem gastar a ação, permitindo atacar novamente nessa mesma vez.
- Se John ou o alvo morrer, o vínculo termina imediatamente. A morte de John impede dano periódico adicional ao alvo naquela ação. O alvo eliminado segue para a área de eliminados e não retorna.

O dano periódico não testa defesa nem dispara Steel Jaw: é o efeito do machado, não um novo ataque. Consultar a fila, resolver recuperação, comprar no reset, mover Suportes, usar Apoio e retirar o machado não acrescentam ações nem dano periódico. Aliados continuam podendo usar a mão e agir em suas próprias vezes.

O menu **Testar Elétrica e John** oferece duas formações prontas. São testes separados, sem alterar a seleção inicial de Comuns, os atributos do catálogo ou as regras das partidas normais.

## Pré-batalha e os seis personagens da v0.20.0

Antes de liberar a hierarquia, as habilidades de entrada pendentes são resolvidas uma por vez. Isso vale no início e quando um personagem entra por medalha ou recuperação. Escolher um alvo ou rolar o susto não consome ação, mana nem fôlego e não compra cartas. O bot usa a mesma etapa. Se uma escolha anterior deixar o próximo personagem sem alvo acessível, sua habilidade aguarda até existir um alvo, sem travar a partida.

| Personagem | Classe / raridade | Vida / ataque básico | Velocidade / fôlego |
| --- | --- | --- | --- |
| Penxy | Assassino / Lendário | 875 / 360 | 7 / 20 |
| Cavaleiro | Fighter / Comum | 180 / 75 | 3 / 30 |
| Zikssy | Assassino / Épico | 425 / 120 | 7 / 20 |
| Elysh | Suporte / Épico | 480 / 60 | 4 / 30 |
| DD-X | Fighter / Raro | 285 / 90 | 4 / 10 |
| Vaglar | Fighter / Mítico | 580 / sem ataque básico | 4 / 30 |

Vida e ataque foram recalculados pelas faixas e perfis atuais; velocidade, fôlego e ícones de classe seguem as cartas recebidas. Vaglar tem velocidade para usar o livro, embora não tenha ataque básico.

**Penxy — Ghost Claw:** escolhe um adversário da frente ou retaguarda na entrada e leva os dois para um duelo. Só eles podem se atacar, seguindo suas posições na hierarquia de velocidade. Os demais continuam lutando normalmente, sem atingir o par; área e habilidades direcionadas respeitam a dimensão. Um Suporte puxado de trás pode atacar Penxy sem ocupar uma quarta vaga na frente. Os dois continuam contando como defensores da equipe, protegendo a Daly Mãe. Não podem trocar de linha durante o duelo. Um vínculo de machado com alguém de fora é encerrado ao mudar de dimensão.

Quando um dos dois é eliminado, o sobrevivente retorna ao campo, conservando sua Vida e sua vaga. Se Penxy sobreviver, pode escolher outro adversário na próxima vez dele, antes de atacar, sem ganhar ação extra. Aliados de fora sem alvo acessível podem passar a vez; isso continua a hierarquia sem atingir o duelo. Cartas de Apoio continuam seguindo suas regras de uso; a restrição dimensional trata dos personagens e dos ataques.

**Cavaleiro — Armadura:** bloqueia permanentemente 80% de todo dano numérico, incluindo ataques simples, área, dano periódico e dano do livro. Os 20% restantes são arredondados para cima em múltiplos de 5: 75 vira 15; 130 vira 30; o machado de 20 vira 5. A previsão e o registro mostram o valor efetivo. Execução instantânea não é dano numérico e continua sendo eliminação direta.

**Zikssy — Claws:** ao entrar, rola um d6 para cada adversário vivo, incluindo a retaguarda. 1 ou 2 assusta; 3 a 6 resiste. Cada assustado dá +20 ao ataque básico dela. Se todos os adversários presentes forem assustados, também recebe +1 de velocidade. Sem adversários não ganha velocidade. Os bônus não somem quando os alvos morrem e não são rolados de novo ao mover a carta ou reiniciar a hierarquia; duram até sua eliminação. O susto não inventa impedimento de ação nos oponentes. Um aumento de velocidade durante recuperação não permite voltar a uma faixa já passada.

**Elysh — Lazer Gun:** na sua ação escolhe atacar ou curar outro aliado ferido com o valor atual do ataque básico. Pode curar a retaguarda, respeitando a dimensão e a Vida máxima. A cura gasta a ação, não é dano e não testa armadura, Parry, Esquiva ou Steel Jaw. Não cura mortos, a Daly Mãe ou a si própria. O bônus de Apoio para o próximo ataque não é gasto ao curar.

**DD-X — Fish:** ataque básico usa dois braços. O jogador pode ativar quatro braços uma única vez por vida para dobrar o total do ataque. A ativação é gasta numa ação válida, mesmo se for defendida ou esquivada; tentativa inválida não a gasta. Reset, cura e movimentação não restauram esse uso. Ataque à Daly Mãe continua tirando uma vida e não gasta o poder.

**Vaglar — Charm:** marca um personagem adversário da frente ou retaguarda na entrada. Na velocidade dele, o livro elimina instantaneamente Comum, Raro ou Épico. Contra Mítico, Lendário ou Secreto causa 200, reduzidos por armadura quando houver. É uma habilidade de livro, sem teste de Parry/Esquiva e sem reação de ataque de Sark. Se o marcado sobreviver, seu nome permanece para a próxima vez. Se morrer, Vaglar pode marcar outro imediatamente, sem executar duas vezes na mesma ação. Se outro personagem eliminar o marcado, a substituição é feita antes da próxima ação de Vaglar. O livro não alcança outra dimensão.

Vaglar não ataca a Daly Mãe. Se só restarem personagens sem ação utilizável, como um Vaglar sem personagens adversários para marcar, o jogo usa o ciclo de compra e o empate sem recursos já existentes. A IA retira o machado de John quando as curas anulam continuamente o progresso, evitando uma repetição infinita de manter/curar.

O menu **Testar novos personagens** oferece uma formação para cada um dos seis, sem alterar seus atributos no catálogo. Os 22 personagens restantes do pacote aguardam explicação em [PERSONAGENS_PENDENTES.md](PERSONAGENS_PENDENTES.md).

## Ritmo e leitura das ações

O bot espera 1,8 segundo antes de agir. Após cada ação, há 2,2 segundos para conferir atacante, alvo, dano, Vida antes/depois e a barra de Vida. Com vários impactos, incluindo Steel Jaw, área ou dano periódico, esse intervalo é de 4,4 segundos para ler os efeitos, apresentados juntos no registro e nas cartas. Uma carta eliminada permanece visível durante esse feedback e depois sai da equipe. Imobilização e vulnerabilidade aparecem junto das cartas e no painel da vez. O botão **Pausar** permite interromper o andamento; escolhas do jogador não têm limite de tempo.

A arena coloca as equipes no centro, com os Suportes nos flancos da Daly Mãe; montes de raridade, registro e leque à esquerda; e vez atual, próximo personagem, monte principal e atributos à direita. Mantém vagas, ordem de velocidade, sete montes com contagens e a área separada de eliminados. Resgates, curas, movimentações e compras são registrados. Parâmetros de ritmo ficam em `G.CONFIG.pacing`.

## Atributos e regras preservadas

**Arredondamento desde a v0.19.1:** Vida máxima, Vida atual e dano dos personagens terminam sempre em 0 ou 5. Valores que não são múltiplos de 5 sobem ao próximo: 211–214 viram 215; 216–219 viram 220. Valores já redondos permanecem iguais. Os atributos calculados por classe/raridade também seguem essa regra.

O total de um ataque, incluindo mana e bônus, é arredondado antes de retirar Vida. A Vida restante após dano e a soma após cura também são arredondadas para cima. A cura respeita a Vida máxima; dano fatal deixa a Vida em zero, sem ressuscitar. Ataques em área, Steel Jaw e o dano periódico de Sharp Guitar seguem a mesma regra. Cartas, previsão, painel e registro usam os valores reais da batalha.

A Daly Mãe mantém suas três vidas e perde uma por ataque; esse contador não é Vida numérica de personagem. Velocidade, fôlego, mana, resultados do dado e quantidades de cartas mantêm suas escalas.

| Raridade | Vida | Dano |
| --- | ---: | ---: |
| Comum | 130–220 | 25–120 |
| Raro | 200–350 | 30–150 |
| Épico | 320–530 | 50–220 |
| Mítico | 430–700 | 90–430 |
| Lendário | 550–1200 | 150–670 |
| Secreto | 605–1320 | 165–740 |

A faixa antiga de Lendário foi transferida para Mítico, e a antiga de Secreto para Lendário. Secreto fica aproximadamente 10% acima, arredondado em múltiplos de 5. Cores e molduras não mudam. O perfil da classe posiciona os atributos nessas faixas. Os valores já confirmados individualmente de Elétrica, John e Sark foram preservados; Sark continua com 530 de Vida, mesmo abaixo do novo mínimo genérico de Lendário. Magos começam com 3/3 de mana, cada ponto gasto soma 10 de dano (provisório), e recuperam 1 por ação resolvida. Um Assassin mais rápido que o atacante pode esquivar: num d6, precisa tirar até a diferença de velocidade; Magos sempre acertam. A esquiva consome a ação do atacante.

Bases completas de personagem devem ser usadas inteiras, com sobreposição somente dos números correspondentes ao estado atual. Sark, Elétrica e John usam esse formato; John também recebe o nome no espaço vazio da base. Sam ainda aguarda sua base própria e mantém a apresentação provisória. Sark é a exceção explícita à faixa de Dano básico: tem zero internamente e a base exibe um traço; o valor 390 pertence à reação. Os demais nomes e retratos são provisórios. Veja [ARTES.md](ARTES.md) para os arquivos e a apresentação atual.

Continuam provisórios os efeitos de Item/Habilidade Especial, as habilidades dos personagens exceto as nove habilidades principais já implementadas, alguns atributos e raridades, os ícones de classe ainda não recebidos e a Loja. Não há geração automática de novas artes ou de personagens Secretos.

## Apresentação da v0.17.0

A alteração da v0.17.0 foi visual, com o núcleo e os tempos da v0.16.0 preservados naquela versão. O cristal rosa, os corações, o verso das cartas e o troféu usam os arquivos recebidos. A indicação superior mostra a rodada atual.

As prévias de vez e próximo personagem apenas consultam a fila atual. Durante escolhas pendentes, a interface avisa que está aguardando; ao terminar a fila, mostra que o próximo passo é o reset. O painel de atributos usa Vida, Dano, Velocidade, Fôlego e mana do estado atual.

No celular, os painéis se reorganizam e a arena rola acima do espaço reservado ao leque. Essa reserva acompanha mudanças de tamanho e orientação da tela.
