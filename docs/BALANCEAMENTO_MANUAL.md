# KitMasterUpgrade — balanceamento manual da v0.25.0

Os kits `Kit1.zip` e `Kit2.zip` contêm **30 PNGs, com 29 imagens únicas**. A carta de Elysh veio idêntica nos dois e é guardada uma única vez. Todos os PNGs foram preservados byte a byte. O [manifesto](../assets/rebalance/kit-master-upgrade/manifest.json) registra arquivo de origem, dimensões, SHA-256, leitura dos campos e situação da confirmação.

O criador pediu uma conferência por personagem: ler a nova carta, explicar a mecânica atual, reconfirmar a habilidade e aplicar somente o que foi confirmado. As faixas automáticas antigas não limitam os valores manuais aprovados.

## Cinco personagens já atualizados

| Personagem | Classe / raridade | Vida | Ataque | Vel. | Fôlego | Tributo |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Elysh | Support / Comum | 240 | 80 | 4 | 3 | Transição; cura também da retaguarda |
| Stally | Fighter / Comum | 230 | 90 | 2 | 4 | Parry 1–5 no d6 |
| Mike | Destroyer / Comum | 130 | 170 | 5 | 6 | Crítico +25% com 1–2 no d6 |
| Alex | Fighter / Comum | 200 | 170 | 3 | 2 | Parry 1 no d6 |
| Cavaleiro | Tank / Lendário | 920 | 130 | 2 | 8 | Sem resistência natural; mantém a armadura própria |

**Elysh:** escolhe atacar por 80 ou curar outro aliado por até 80, respeitando a Vida máxima. O criador acrescentou que pode curar da retaguarda. Ela recebe sua vez por velocidade mesmo atrás; a cura gasta essa ação. Da retaguarda não pode atacar personagens, a Daly Mãe ou um aliado petrificado para libertá-lo. Sem feridos, pode passar a vez ou avançar se houver vaga. Outros Suportes não ganham uma ação traseira. Impedimentos continuam bloqueando a cura; silêncio e Morto Vivo sem habilidade desativam essa exceção. O duelo dimensional mantém suas regras de isolamento.

**Stally:** a carta de Kick veio com o nome `VAGLAR`. O criador identificou-a como **Stally Comum** e reconfirmou ataque normal ou +30%, com acerto em 1–3 no d6 e paralisia por duas ações globais. O golpe causa 120 antes de defesas. O escudo 5 significa Parry com 1, 2, 3, 4 ou 5; 6 falha. O jogo corrige o nome por camada sobre a base; o arquivo original conserva o texto e a moldura roxa recebidos, enquanto a raridade efetiva é Comum, conforme a correção expressa.

**Mike:** a proteção contra ataques de Assassinos continua. O crítico usa o novo básico: 170 vira 215 com resultado 1–2, antes das defesas.

**Alex:** Swarm continua concentrando 170 num adversário ou dividindo igualmente entre adversários da frente. Cada parcela sobe ao próximo múltiplo de 5; três alvos recebem 60 cada antes das defesas. Retaguarda e aliados ficam protegidos.

**Cavaleiro:** mantém a habilidade que bloqueia 80% de todo dano numérico. O traço no escudo foi confirmado como ausência de tributo natural. Portanto, não soma a resistência padrão de Tank à armadura: 500 vira 100, não 90. Silenciar a habilidade remove a armadura, deixando o dano inteiro. Execuções continuam seguindo a regra de eliminação.

## Seleção inicial

Os quatro Comuns são **Elysh, Stally, Mike e Alex**. A escolha alterna **jogador → bot → jogador → bot**, sem repetir personagens. Cada equipe começa com dois na frente; não há mais Raros automáticos. O Cavaleiro sai dessa seleção porque passa a Lendário. Os laboratórios continuam disponíveis e os Raros permanecem no monte próprio para obtenção durante a partida.

## Recebidos e aguardando conferência

Somente as cinco cartas acima alteram o jogo nesta versão. As demais imagens ficam guardadas para as próximas confirmações; os personagens ainda não revisados mantêm os dados anteriores no catálogo jogável. Linx não é ativado antes de explicar sua habilidade. Nenhum personagem provisório foi criado.

| Carta recebida | Raridade lida | Classe lida | Situação |
| --- | --- | --- | --- |
| Fonior | Mítico | Mago | Habilidade a reconfirmar |
| Zuri | Secreto | Support | Habilidade a reconfirmar |
| Trucc | Mítico | Assassin | Habilidade a reconfirmar |
| Daztirry | Lendário | Fighter | Habilidade a reconfirmar |
| Eletric | Raro | Mago | Habilidade a reconfirmar |
| Chama | Mítico | Mago | Habilidade a reconfirmar |
| Sam | Lendário | Assassin | Habilidade a reconfirmar |
| Barn | Mítico | Mago | Habilidade a reconfirmar |
| Elysh | Comum | Support | Atualizado e confirmado |
| Unicorn | Raro | Support | Habilidade a reconfirmar |
| Rayvlin | Secreto | Fighter | Habilidade a reconfirmar |
| Z-Zus | Lendário | Tank | Habilidade a reconfirmar |
| Mike | Comum | Destroyer | Atualizado e confirmado |
| Nully | Lendário | Assassin | Habilidade a reconfirmar |
| Alex | Comum | Fighter | Atualizado e confirmado |
| Endrik | Épico | Destroyer | Habilidade a reconfirmar |
| P. Ullys | Épico | Destroyer | Habilidade a reconfirmar |
| Sheriff | Épico | Destroyer | Identidade a confirmar |
| Stally | Comum | Fighter | Atualizado e confirmado |
| DD-X | Raro | Fighter | Habilidade a reconfirmar |
| Sheriff | Raro | Assassin | Habilidade a reconfirmar |
| Zikssy | Raro | Assassin | Habilidade a reconfirmar |
| Linx | Lendário | Fighter | Identidade e habilidade a confirmar |
| Vaglar | Secreto | Mago | Habilidade a reconfirmar |
| Cavaleiro | Lendário | Tank | Atualizado e confirmado |
| Karma | Mítico | Destroyer | Habilidade a reconfirmar |
| Penxy | Lendário | Assassin | Habilidade a reconfirmar |
| Draktar | Mítico | Assassin | Habilidade a reconfirmar |
| Rayyb | Épico | Support | Habilidade a reconfirmar |

A carta de `Sheriff` Épico/Destroyer (AWM) e a de `Sheriff` Raro/Assassin (Magnum) são imagens diferentes e permanecem separadas. A identidade da versão Épica precisa ser esclarecida antes de substituir Striker ou criar outro personagem. A versão de Vaglar Secreto/Mago continua separada de Stally. A grafia `Rayvlin` recebida é registrada como referência de Rayvilin, sem substituir a regra antes da revisão.

Não vieram cartas identificadas como Sark ou John nestes kits. O catálogo mantém ambos. As bases atuais também mantêm Striker até esclarecer a carta de AWM.

[Validação](VALIDACAO.md) · [Classes e tributos](CLASSES.md)
