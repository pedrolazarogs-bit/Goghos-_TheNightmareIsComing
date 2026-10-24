# Estrutura base do GOGHOS — v0.26.0

Estas são as regras atuais, conforme a estrutura descrita pelo criador. As diferenças das versões anteriores ficam em [HISTORICO.md](HISTORICO.md).

## Seleção

Ao clicar em **Jogar**, aparecem os quatro Comuns atuais (Elysh, Stally, Mike e Alex), suas marcações e **Voltar ao menu**. A escolha alterna jogador → bot → jogador → bot, sem repetir personagens. Cada equipe escolhe dois Comuns, ambos começando na frente. Após as quatro escolhas, aparece **Play · começar batalha**. Não há sorteio de Raros, mão, Apoios ou montes nessa tela.

Os quatro Comuns escolhidos saem de seus montes. As duas equipes começam com os dois na linha de frente e a retaguarda vazia.

## Equipes e Suportes

A equipe tem três vagas frontais e duas traseiras. Recruta pode abrir uma quarta vaga frontal, totalizando seis personagens. Somente personagens com o tributo de Suporte, incluindo MAX de Zeenneriam, podem ficar na retaguarda; eles não atacam nem podem ser atacados por ataques normais enquanto estiverem lá. Ghost Claw e o livro de Vaglar podem escolher a retaguarda; o alvo do duelo pode agir contra Penxy mesmo ficando na sua vaga de trás.

Personagens obtidos ocupam vagas da frente primeiro. Com a frente cheia, somente um Suporte pode entrar na retaguarda. Um resgate sem vaga válida não retira o personagem do monte nem gasta a medalha.

Quando a frente perde seu último personagem, um Suporte avança automaticamente. Se houver dois, a batalha pausa para o dono escolher qualquer um deles ou ambos para a frente. A IA avança ambos. A frente nunca permanece vazia enquanto houver um Suporte vivo atrás.

Na vez da própria equipe, **Mover Suportes** permite avançar ou recuar Suportes, respeitando as vagas e mantendo pelo menos um defensor na frente. Se a linha estiver cheia, é possível trocar dois Suportes de linhas diferentes. Esse trânsito não gasta ataque ou fôlego. Personagens obtidos por medalha ou que estavam na retaguarda entram na ordem da rodada seguinte; mover não apaga ações já realizadas. A recuperação da Daly Mãe segue a regra de continuidade descrita abaixo. Se Sark for derrotado, somente a defesa dele precisa ser reposta; se sobreviver e eliminar o atacante, o avanço é da equipe do atacante.

## Velocidade e compras

Os personagens vivos da frente que têm ataque agem da maior velocidade para a menor. Sark é apenas reativo e não entra nessa fila. O desempate favorece o jogador e depois a posição na linha. Após todos os elegíveis agirem, a hierarquia reseta e cada equipe compra uma carta do monte principal. A rodada inicial não compra.

Cada reset compra uma única vez, mesmo se a interface consultar a ordem várias vezes. Escolhas de recuperação, formação, mão cheia e cura da Brisa pausam a batalha.

Se não houver atacante nas duas equipes, **Avançar ciclo · comprar cartas** permite comprar uma carta por equipe, mantendo o limite da mão e a escolha de substituição. Consultar a fila não avança esse ciclo. As medalhas podem ser usadas nessa espera; o bot também as resgata. O primeiro atacante obtido entra no ciclo que aguardava, sem provocar outra compra. Sem atacantes, com o monte principal vazio, nenhuma medalha utilizável e sem invocação ou ressurreição capaz de devolver um atacante, a partida termina em **empate**, conforme definido pelo criador. Uma escolha de mão cheia, formação, recuperação ou Brisa é resolvida antes dessa verificação.

## Montes e medalhas

Há sete montes compartilhados, visíveis na arena: o principal e seis de personagens, separados por **raridade**. Cada monte é embaralhado independentemente no início da partida. Classe (Mago, Suporte etc.) é um atributo do personagem, não um monte adicional.

O monte principal tem **57 cartas**: 34 Apoios (17 tipos × 2), 4 Itens, 4 Habilidades Especiais, 12 medalhas (duas de cada cor) e **3 Fragmentos Primordiais únicos**. A distribuição de Apoios/Itens/Habilidades/medalhas é provisória; os três fragmentos são o limite confirmado para toda a partida.

| Medalha | Monte resgatado |
| --- | --- |
| Azul | Comum |
| Verde | Raro |
| Roxa | Épico |
| Vermelha | Mítico |
| Holográfica | Lendário |
| Preta | Secreto |

Toda compra vai para a mão, inclusive as medalhas. Na vez da equipe, selecione uma medalha e use **Resgatar personagem**. Ela obtém exatamente a carta do topo do monte indicado pela cor, sem sorteio adicional de raridade e sem ataque extra. A medalha vai para o descarte somente quando o personagem entra na equipe. Com o monte vazio ou sem vaga para o topo, permanece na mão. A IA usa as mesmas regras.

O catálogo tem **31 personagens oficiais**: 4 Comuns, 6 Raros, 4 Épicos, 6 Míticos, 7 Lendários e 4 Secretos. Os Comuns são Elysh, Stally, Mike e Alex. Zeenneriam fica na reserva divina. Cada personagem corresponde a uma única carta física; provisórios e Petra não entram nos montes. A [tabela manual atual](BALANCEAMENTO_MANUAL.md) lista todos os atributos, bases e correções.

## Mão e cartas de Apoio

O leque fica no canto inferior esquerdo, com no máximo cinco cartas. No celular, a arena rola acima de uma área reservada ao leque para evitar sobreposições. A mão adversária é mostrada apenas como contagem.

Ao comprar com cinco cartas, o jogador escolhe uma antiga para substituir ou descarta a nova. Isso vale também para medalhas. A compra pendente não vira uma sexta carta permanente. A IA substitui a mais antiga que não seja Fragmento Primordial, quando possível.

Na vez da equipe, pode usar uma carta de Apoio por turno, sem gastar o ataque, **mesmo se o personagem da vez estiver imobilizado, mantendo o machado, dormindo, paralisado, petrificado ou hipnotizado**. Medalhas também podem ser usadas nessas condições. A mão pertence à equipe; seu uso não remove impedimentos nem faz o personagem agir. **Na Moloeira** dá +20 ao próximo ataque; **Bandeide** cura até 80 de Vida de um aliado; **Brisa** permite curar outro aliado ferido em 30 quando um aliado é eliminado. Se uma ação eliminar vários aliados, as escolhas de Brisa são resolvidas uma por vez, com candidatos vivos. Cartas usadas vão para o descarte. Os efeitos de Item e Habilidade Especial continuam em desenvolvimento e são indicados ao selecionar essas cartas.

## Eliminação, Daly Mãe e recuperação

Personagens derrotados ficam na área **Personagens Eliminados**, identificados por equipe. Saem da fila de ações e não voltam aos montes nem à mão. Morto Vivo é a exceção explícita: a mesma carta pode voltar à equipe com 1 de Vida e sem habilidade principal. Deuses só entram por invocação e não são ressuscitados.

Cada Daly Mãe começa com três vidas. Fica exposta somente quando sua equipe não tem personagens vivos na frente nem atrás. Cada ataque válido à Daly Mãe tira exatamente uma vida, independentemente do dano do atacante. Não usa bônus de dano nem mana.

Enquanto ainda tiver vida, o dono escolhe uma única recuperação: **até 2 Épicos OU até 3 Raros**. Recebe cartas do topo da raridade escolhida. Se restarem menos, recebe as restantes; monte vazio fica bloqueado. Exemplo: com 1 Épico e 1 Raro disponíveis, pode escolher o 1 Épico OU o 1 Raro. Comuns não fazem parte desta recuperação. Não mistura raridades e não ressuscita eliminados. A mesma regra vale para o bot.

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

Elétrica é **Mago Raro**, com **3 de velocidade, 4 de fôlego, 3 de mana, 100 de ataque e 220 de Vida**. Sua ação causa dano a todos os adversários que estavam na linha de frente no início do golpe. Não há escolha de alvo individual. Aliados e retaguardas não recebem esse ataque; Suportes promovidos depois dele também não são atingidos pelo golpe já resolvido.

Mana e Na Moloeira são gastos uma única vez por ação e somam dano a cada alvo. Parry é testado individualmente; a regra existente de Magos impede Esquiva, mas não Parry. Todos os danos do ataque são aplicados antes das reações de sobreviventes, incluindo Steel Jaw. A regeneração de mana e o dano periódico de Sharp Guitar ocorrem uma vez por ação, independentemente da quantidade de alvos.

Com a Daly Mãe exposta, a confirmação ataca apenas ela e tira exatamente uma vida, sem gastar mana ou bônus. A habilidade não atravessa os defensores para atingi-la.

## John — Parry e Sharp Guitar

John é **Fighter Raro**, com **2 de velocidade, 3 de fôlego, 80 de ataque e 250 de Vida**. Sua base está sem nome impresso; a interface preenche JOHN, conforme o nome indicado pelo criador. O rank ilustrado continua decorativo.

**Parry:** ao receber um ataque adversário, rola um dado de seis lados. Resultado 1 ou 2 defende todo o dano; de 3 a 6 recebe normalmente. O resultado aparece no registro e no feedback. Não há contra-ataque automático. O limiar 2 está definido para John e Zeenneriam; os demais limiares individuais constam em [CLASSES.md](CLASSES.md).

**Sharp Guitar:** John escolhe entre um ataque normal de 80 ou causar 80 e cravar o machado. O vínculo só é criado se o golpe acertar e ambos sobreviverem. Parry, Esquiva, dano fatal e a reação fatal de Sark impedem o vínculo. Não é possível cravar na Daly Mãe nem em um personagem já envolvido em outro vínculo.

Enquanto o machado estiver cravado:

- O alvo fica imobilizado: não ataca, não se move e não usa Parry, Esquiva ou reação. Sua posição na hierarquia permanece; **Passar vez · imobilizado** resolve essa ação.
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
| Penxy | Assassino / Lendário | 500 / 140 | 9 / 7 |
| Cavaleiro | Tank / Lendário | 920 / 130 | 2 / 8 |
| Zikssy | Assassino / Raro | 160 / 120 | 5 / 1 |
| Elysh | Suporte / Comum | 240 / 80 | 4 / 3 |
| DD-X | Fighter / Raro | 260 / 90 (45 × 2) | 3 / 6 |
| Vaglar | Mago / Secreto | 590 / sem ataque básico | 5 / 12 |

Os seis usam as bases manuais atuais da v0.26.0. Vaglar tem velocidade para usar o livro, embora não tenha ataque básico.

**Penxy — Ghost Claw:** escolhe um adversário da frente ou retaguarda na entrada e leva os dois para um duelo. Só eles podem se atacar, seguindo suas posições na hierarquia de velocidade. Os demais continuam lutando normalmente, sem atingir o par; área e habilidades direcionadas respeitam a dimensão. Um Suporte puxado de trás pode atacar Penxy sem ocupar uma quarta vaga na frente. Os dois continuam contando como defensores da equipe, protegendo a Daly Mãe. Não podem trocar de linha durante o duelo. Um vínculo de machado com alguém de fora é encerrado ao mudar de dimensão.

Quando um dos dois é eliminado, o sobrevivente retorna ao campo, conservando sua Vida e sua vaga. Se Penxy sobreviver, pode escolher outro adversário na próxima vez dele, antes de atacar, sem ganhar ação extra. Aliados de fora sem alvo acessível podem passar a vez; isso continua a hierarquia sem atingir o duelo. Cartas de Apoio continuam seguindo suas regras de uso; a restrição dimensional trata dos personagens e dos ataques.

**Cavaleiro — Armadura:** bloqueia permanentemente 80% de todo dano numérico, incluindo ataques simples, área, dano periódico e dano do livro. Os 20% restantes são arredondados para cima em múltiplos de 5: 75 vira 15; 130 vira 30; o machado de 20 vira 5. A previsão e o registro mostram o valor efetivo. Execução instantânea não é dano numérico e continua sendo eliminação direta.

**Zikssy — Claws:** ao entrar, rola um d6 para cada adversário vivo, incluindo a retaguarda. 1 ou 2 assusta; 3 a 6 resiste. Cada assustado dá +20 ao ataque básico dela. Se todos os adversários presentes forem assustados, também recebe +1 de velocidade. Sem adversários não ganha velocidade. Os bônus não somem quando os alvos morrem e não são rolados de novo ao mover a carta ou reiniciar a hierarquia; duram até sua eliminação. O susto não inventa impedimento de ação nos oponentes. Um aumento de velocidade durante recuperação não permite voltar a uma faixa já passada.

**Elysh — Lazer Gun:** na sua ação escolhe atacar ou curar outro aliado ferido com o valor atual do ataque básico. Pode curar aliados na retaguarda e, desde a reconfirmação da v0.25.0, também realizar sua cura enquanto ela própria está atrás, respeitando a dimensão e a Vida máxima. A cura gasta a ação, não é dano e não testa armadura, Parry, Esquiva ou Steel Jaw. Não cura mortos, a Daly Mãe ou a si própria. O bônus de Apoio para o próximo ataque não é gasto ao curar.

**DD-X — Fish:** ataque básico usa dois braços. O jogador pode ativar quatro braços uma única vez por vida para dobrar o total do ataque. A ativação é gasta numa ação válida, mesmo se for defendida ou esquivada; tentativa inválida não a gasta. Reset, cura e movimentação não restauram esse uso. Ataque à Daly Mãe continua tirando uma vida e não gasta o poder.

**Vaglar — Charm:** marca um personagem adversário da frente ou retaguarda na entrada. Na velocidade dele, o livro elimina instantaneamente personagens de raridade inferior à sua (até Lendário). Contra Secreto causa 200, reduzidos por armadura quando houver. É uma habilidade de livro, sem teste de Parry/Esquiva e sem reação de ataque de Sark. Se o marcado sobreviver, seu nome permanece para a próxima vez. Se morrer, Vaglar pode marcar outro imediatamente, sem executar duas vezes na mesma ação. Se outro personagem eliminar o marcado, a substituição é feita antes da próxima ação de Vaglar. O livro não alcança outra dimensão.

Vaglar não ataca a Daly Mãe. Se só restarem personagens sem ação utilizável, como um Vaglar sem personagens adversários para marcar, o jogo usa o ciclo de compra e o empate sem recursos já existentes. A IA retira o machado de John quando as curas anulam continuamente o progresso, evitando uma repetição infinita de manter/curar.

## Elenco completo da v0.21.0

O menu **Testar novos personagens** oferece uma formação para cada um dos 31 oficiais, com busca por nome. O [guia dos personagens](PERSONAGENS_PENDENTES.md) registra as 21 habilidades adicionadas nesta versão, suas confirmações e interações. Petra foi adiada e não aparece na seleção, nos montes ou nos testes jogáveis.

Pré-batalha inclui hipnose de Burn, estrela de Unicorn, petrificação de Rayvilin, protegido de Z-Zus e melhor amigo de Karma. Draktar recebe sua caça por sorteio. Na própria vez, aparecem escolhas de ataque, cura total, sono e novas tentativas de petrificar. A IA utiliza essas mesmas operações. Sono, paralisia, petrificação e hipnose impedem ações e reações enquanto estiverem ativos, conforme cada habilidade.

Durações em ações globais começam após a ação de aplicação. Os seis socos possíveis de Sam formam uma única ação, mas cada soco tem sua própria defesa e reação. Z-Zus transfere dano direcionado e execuções, nunca área. Fonior aumenta somente a Vida máxima. Oni mantém Daztirry vivo em zero por três ações e o elimina ao final. A ausência de ação capaz de progredir permite avançar o ciclo; efeitos pendentes impedem empate prematuro.

## Ritmo e leitura das ações

O bot espera 1,8 segundo antes de agir. Após cada ação, há 2,2 segundos para conferir atacante, alvo, dano, Vida antes/depois e a barra de Vida. Com vários impactos, incluindo Steel Jaw, área ou dano periódico, esse intervalo é de 4,4 segundos para ler os efeitos, apresentados juntos no registro e nas cartas. Uma carta eliminada permanece visível durante esse feedback e depois sai da equipe. Imobilização e vulnerabilidade aparecem junto das cartas e no painel da vez. O botão **Pausar** permite interromper o andamento; escolhas do jogador não têm limite de tempo.

A arena coloca as equipes no centro, com os Suportes nos flancos da Daly Mãe; montes de raridade, registro e leque à esquerda; vez atual e próximo personagem acima do campo; e ficha de atributos e monte principal à direita. Mantém vagas, ordem de velocidade, sete montes com contagens e a área separada de eliminados. Resgates, curas, movimentações e compras são registrados. Na v0.24.0, histórico, ordem e descrição das habilidades podem ser expandidos; a ficha ampliada suspende os temporizadores até o jogador voltar. O resumo mostra dano, cura, defesa e revide por alvo. Agrupar os números na apresentação não altera os golpes individuais, dados ou reações. Veja o [guia da interface](UI.md). Parâmetros de ritmo ficam em `G.CONFIG.pacing`.

## Atributos e regras preservadas

**Arredondamento desde a v0.19.1:** Vida máxima, Vida atual e dano dos personagens terminam em 0 ou 5, com a exceção explícita de Morto Vivo voltando com 1 de Vida. Valores que não são múltiplos de 5 sobem ao próximo: 211–214 viram 215; 216–219 viram 220. Valores já redondos permanecem iguais. Os atributos calculados por classe/raridade também seguem essa regra.

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

A faixa antiga de Lendário foi transferida para Mítico, e a antiga de Secreto para Lendário. Secreto fica aproximadamente 10% acima, arredondado em múltiplos de 5. Cores e molduras não mudam. O perfil da classe posiciona os atributos nessas faixas. Na v0.22.0, os atributos iniciais foram revistos por habilidade, conforme autorização do criador. A [tabela de balanceamento](BALANCEAMENTO.md) registra todas as alterações e exceções, com os valores históricos; a [tabela manual atual](BALANCEAMENTO_MANUAL.md) substitui esses dados, incluindo Sam com 70 por soco e Alex com Swarm total de 170; Sark continua com 530 de Vida, mesmo abaixo do novo mínimo genérico de Lendário. Magos começam com 3/3 de mana, cada ponto gasto soma 10 de dano (provisório), e recuperam 1 por ação resolvida. Um Assassin mais rápido que o atacante pode esquivar: num d6, precisa tirar até a diferença de velocidade; Magos sempre acertam. A esquiva consome a ação do atacante.

Bases completas de personagem devem ser usadas inteiras, com sobreposição somente dos números correspondentes ao estado atual. Sark, Elétrica e John usam esse formato; John também recebe o nome no espaço vazio da base. Sam usa a carta completa mais recente recebida, com seus números atualizados. Sark é a exceção explícita à faixa de Dano básico: tem zero internamente e a base exibe um traço; o valor 390 pertence à reação. Todos os nomes e retratos do catálogo atual são oficiais. Veja [ARTES.md](ARTES.md) para os arquivos e a apresentação atual.

Continuam provisórios os efeitos de Item/Habilidade Especial, a Loja e os atributos derivados das faixas enquanto não receberem valores individuais do criador. As 31 habilidades presentes estão implementadas. Não há criação automática de personagens.

## Apresentação da v0.17.0

A alteração da v0.17.0 foi visual, com o núcleo e os tempos da v0.16.0 preservados naquela versão. O cristal rosa, os corações, o verso das cartas e o troféu usam os arquivos recebidos. A indicação superior mostra a rodada atual.

As prévias de vez e próximo personagem apenas consultam a fila atual. Durante escolhas pendentes, a interface avisa que está aguardando; ao terminar a fila, mostra que o próximo passo é o reset. O painel de atributos usa Vida, Dano, Velocidade, Fôlego e mana do estado atual.

No celular, os painéis se reorganizam e a arena rola acima do espaço reservado ao leque. Essa reserva acompanha mudanças de tamanho e orientação da tela.

## Apoios, invocação e tributos — v0.23.0

O [guia dos 17 Apoios](APOIOS.md) registra todos os alvos, limites e interações. Eu Denovo concede uma ação extra; Combokill concede outro ataque após uma eliminação por golpe. Essas ações continuam a mesma rodada e retomam a faixa de velocidade anterior, sem compras extras.

O [guia de Zeenneriam e MAX](DEUSES.md) define os três fragmentos únicos, a reserva fora dos montes, Presence e os tributos de todas as classes. MAX tem resistência de 10%; Z-Zus usa 20% e Cavaleiro não tem resistência natural. Destroyer causa +25% de dano com 1 ou 2 no d6. O MAX reúne esses tributos com mana, esquiva, Parry e transição. Presence ignora habilidades de personagens; Apoios continuam válidos.


## Conferência das classes — v0.24.1

A legenda do criador identifica os símbolos inferiores: olho de X = Assassin, espada = Fighter, raio = Tank, + = Support, lua = Mago e mira = Destroyer. A [conferência completa](CLASSES.md) relaciona os 31 personagens atuais e as exceções dos tributos. Z-Zus foi corrigido de Support para Tank; a proteção pessoal continua, mas a transição de Suporte deixa de existir para ele. Nenhum atributo numérico foi rebalanceado nesta revisão.

John e Zeenneriam mantêm Parry 1–2. As cartas atuais definem Stally/Sam 1–5, DD-X/Daztirry 1–3, Rayvilin 1–2 e Alex/Linx 1. A previsão de esquiva respeita os mesmos impedimentos e a substituição pelo duelo do Xerife usados na resolução. A hipnose causa seus 90 de efeito fixo, sem a redução de Tank reservada a ataques.


## Cartas manuais aplicadas — v0.26.0

A [conferência dos kits](BALANCEAMENTO_MANUAL.md) registra todas as 29 cartas únicas aplicadas; nenhuma dessas imagens continua pendente. Os números manuais aprovados têm prioridade sobre as faixas genéricas. Stally é a carta de Kick impressa como Vaglar e foi confirmada como Comum; tem Parry 1–5. Alex tem Parry 1. Cavaleiro é Tank Lendário, com Armadura de 80% e **sem tributo natural**; não soma os 10% padrão à redução.

Elysh, Support Comum, pode curar 80 da retaguarda. Ela entra na hierarquia por velocidade e gasta a própria ação; a cura também conta para mana e efeitos em ações globais. Não ataca de lá. Na frente, escolhe atacar ou curar. A IA cura aliados que precisam e pode avançar para atacar quando houver vaga, evitando considerar uma Elysh capaz de avançar como empate sem atacantes. Impedimentos bloqueiam a cura e Morto Vivo não devolve essa habilidade. Os demais Supports da retaguarda seguem fora da fila de ações.


## Linx — Prototype

Fighter Lendário com 660 de Vida, velocidade 4, fôlego 3 e Parry 1. Seu ataque causa **30% da Vida máxima do adversário**, arredondado para cima em múltiplos de 5, antes das defesas. Não usa a Vida restante como base. A habilidade respeita Parry, esquiva, armadura e transferência ao protetor; Presence ignora o percentual. Silêncio impede atacar enquanto a habilidade estiver desativada. Contra a Daly Mãe exposta, tira uma vida.

Todas as 29 cartas únicas de Kit1 e Kit2 estão ativas. John e Sark não receberam novas cartas e conservam seus dados. Sam é Fighter, com ícone corrigido e Parry 1–5. A carta SHERIFF Épica/AWM é Striker; o Xerife Raro/Magnum permanece outro personagem. Os valores completos e os multiplicadores impressos estão em [BALANCEAMENTO_MANUAL.md](BALANCEAMENTO_MANUAL.md).
