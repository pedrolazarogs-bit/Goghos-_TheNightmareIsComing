# Personagens oficiais — habilidades e balanceamento da v0.22.0

A implementação foi autorizada pelo criador após o registro das habilidades. **Todos os personagens descritos abaixo estão implementados, exceto Petra, adiada expressamente e ausente do catálogo jogável.** O jogo contém somente os 30 personagens oficiais, sem personagens provisórios.

A seleção inicial oferece os três Comuns oficiais (Cavaleiro, Mike e Alex). Jogador e bot escolhem um Comum cada, sem repetir; cada equipe recebe automaticamente um Raro diferente por sorteio. Os dois entram na linha de frente.

As 21 habilidades desta etapa estão disponíveis em **Testar novos personagens**, junto às nove anteriores. Sam recebeu seu combo e usa a carta completa mais recente, `Original-Base54_20261019002932.png`. Este arquivo mantém o nome anterior para preservar links. Na v0.22.0, os valores básicos foram ajustados conforme a [revisão de balanceamento](BALANCEAMENTO.md); as mecânicas abaixo permanecem.

| Personagem | Arquivo recebido | Estado |
| --- | --- | --- |
| P. Ullys | `Original-Base22_20260127115144.png` | Implementado na v0.21.0 |
| Stally | `Original-Base23_20260127114324.png` | Implementado na v0.21.0 |
| Endrik | `Original-Base24_20260127113906.png` | Implementado na v0.21.0 |
| Striker | `Original-Base26_20260127113324.png` | Implementado na v0.21.0 |
| Sheriff | `Original-Base27_20260127112944.png` | Implementado na v0.21.0 |
| Barn | `Original-Base28_20260127112625.png` | Implementado como Barn (Burn) |
| Fonior | `Original-Base32_20260119135301.png` | Implementado na v0.21.0 |
| Sam | `Original-Base54_20261019002932.png` | Implementado na v0.21.0 |
| Chama | `Original-Base34_20260121003310.png` | Implementado na v0.21.0 |
| Zuri | `Original-Base35_20260120203352.png` | Implementado na v0.21.0 |
| Draktar | `Original-Base36_20260121124719.png` | Implementado na v0.21.0 |
| Daztirry | `Original-Base37_20260121012205.png` | Implementado na v0.21.0 |
| Mike | `Original-Base38_20260121133519.png` | Implementado na v0.21.0 |
| Unicorn | `Original-Base39_20260124105358.png` | Implementado na v0.21.0 |
| Nully | `Original-Base40_20260124012744.png` | Implementado na v0.21.0 |
| Petra | `Original-Base43_20260130231133.png` | Adiada; fora do jogo |
| Rayyb | `Original-Base47_20260225195543.png` | Implementada como Rayyb (Rave) |
| Rayvilin | `Original-Base51_20260225194828.png` | Implementado na v0.21.0 |
| Z-Zus | `Original-Base52_20260301022229.png` | Implementado como Z-Zus (Jesus) |
| Alex | `Original-Base46_20260604221119.png` | Implementado na v0.21.0 |
| Karma | `Original-Base26_20260927200336.png` | Implementado na v0.21.0 |
| Trucc | `Original-Base57_20260927200414.png` | Implementado como Trucc (Turk) |

A raridade Mítica foi restaurada entre Épica e Lendária. Fundos vermelhos continuam Míticos. A transferência de bases afeta somente as faixas de Vida e Dano: Épica mantida, antiga Lendária → Mítica, antiga Secreta → Lendária, nova Secreta aproximadamente 10% acima. Cores e molduras permanecem como nas artes.

## Habilidades implementadas

### P. Ullys — míssil com dano nos vizinhos

- Escolhe um oponente como alvo do míssil.
- O alvo principal recebe o dano inteiro do ataque.
- O oponente imediatamente à esquerda e o imediatamente à direita do alvo recebem, cada um, 20% do dano recebido pelo alvo principal.
- Exemplo: se o alvo principal receber 100, cada vizinho recebe 20.
- Mantém-se a regra geral de arredondar os valores para cima até o próximo múltiplo de 5.

### Stally — segundo ataque com paralisia

- Pode escolher entre o ataque padrão normal e um segundo ataque.
- O segundo ataque causa 30% a mais de dano que o padrão (130% do dano normal), seguindo o arredondamento geral para cima em múltiplos de 5.
- Confirmado pelo criador: o segundo ataque exige uma rolagem própria de d6. **1, 2 ou 3 acertam; 4, 5 ou 6 erram.**
- Se acertar, paralisa o oponente por **duas ações de qualquer personagem**, conforme esclarecimento do criador para "dois turnos corridos". Não são duas rodadas nem duas próximas vezes do alvo na hierarquia.

### Endrik — tubarão após a morte

- Confirmado pelo criador: o nome falado "Andrew" nesta explicação corresponde ao Endrik da lista.
- Mantém sua jogabilidade e ataque normais enquanto está vivo.
- Quando morre, seu tubarão pode tentar eliminar instantaneamente **somente o personagem que o eliminou**. Não permite escolher outro adversário.
- O alvo precisa ser de raridade **estritamente inferior** à dele. Personagens de raridade igual ou superior não atendem à exigência de estar abaixo; não foi definido dano alternativo contra eles.
- A tentativa exige **1 ou 2 no d6** para funcionar; com 3, 4, 5 ou 6, não elimina.

### Striker — proteção contra atacantes mais rápidos

- Personagens com velocidade **maior que a do Striker não podem atacá-lo**.
- Personagens com velocidade igual ou menor podem atacá-lo, respeitando as demais regras normais da batalha.

### Sheriff (Xerife) — duelo ao atacar ou ser atacado

- Duela com o personagem envolvido sempre que ataca ou é atacado.
- **Ao ser atacado:** o atacante rola um d6. Com **1, 2 ou 3**, realiza o ataque contra o Xerife. Com **4, 5 ou 6**, erra e o Xerife o elimina instantaneamente, respeitando o limite de raridade abaixo.
- **Ao atacar:** o Xerife rola um d6. Com **1, 2 ou 3**, elimina o oponente instantaneamente, respeitando o limite de raridade. Com **4, 5 ou 6**, não elimina e recebe o dano do oponente.
- A eliminação instantânea vale para adversários de raridade **igual ou inferior** à do Xerife.
- Contra adversários de raridade **superior**, o criador confirmou que **o mesmo duelo de d6 continua**, substituindo a eliminação instantânea por **200 de dano**. Isso vale tanto quando o Xerife acerta seu ataque quanto quando o adversário falha ao atacá-lo.

### Barn (chamado Burn na explicação) — hipnose

- **Ao entrar em campo, na etapa de pré-batalha**, escolhe um oponente para hipnotizar, conforme confirmação do criador.
- Enquanto mantém a hipnose, **tanto Burn quanto o alvo ficam sem atacar**.
- O alvo hipnotizado fica vulnerável e **sem qualquer tipo de reação**, conforme a descrição do criador.
- A eliminação de Burn encerra a hipnose e liberta o alvo.
- Na própria vez, Burn pode continuar mantendo a hipnose ou sair dela e hipnotizar outro adversário.
- A habilidade causa **90 de dano ao alvo hipnotizado toda vez que chega o turno de Burn**; essa frequência não é a de cada ação de qualquer personagem.
- **Ao trocar de alvo na própria vez, primeiro realiza a troca e depois causa os 90 de dano no novo alvo**, conforme confirmação do criador.

### Fonior — almas e crescimento da Vida máxima

- Cada personagem **aliado ou adversário** eliminado rende uma alma ao Fonior.
- Cada alma aumenta sua **Vida máxima em 20 pontos**.
- Pode acumular quantas almas conseguir, **sem limite**. O crescimento da Vida máxima por essa habilidade não fica limitado à faixa de atributos base da raridade.
- Confirmado pelo criador: o ganho afeta **somente a Vida máxima**. A Vida atual permanece igual; receber uma alma não cura o Fonior.

### Sam — combo de até seis socos com dados sem repetição

- Em uma única ação, realiza um combo de até **seis socos**, rolando um **d6 por tentativa**.
- Cada resultado que ainda não apareceu nesse combo permite realizar mais um soco.
- O primeiro resultado repetido **encerra imediatamente o combo**. Essa repetição não acrescenta um soco; preservam-se os acertos anteriores.
- A explicação original definiu 70 por soco. Na revisão autorizada da v0.22.0, o básico passou a **100 por soco** para equilibrar Sam entre os Lendários.
- Exemplo confirmado pela descrição: **2 → 6 → 5 → 5** encerra com três socos, equivalentes a **3 × 100 = 300 de dano básico antes das defesas**.
- Se conseguir os seis resultados diferentes, completa os seis socos, equivalentes a **420 de dano básico antes das defesas**.
- Confirmado pelo criador: **todos os socos atingem sempre o mesmo adversário**; não pode trocar de alvo dentro do combo.
- Confirmado pelo criador: são **golpes separados de 100**, com defesa e reação resolvidas para cada golpe. Não aplicar o total como um único golpe no final.

### Chama — queimadura ao atacar e ao ser atacado

- Seu ataque causa **65 de dano inicial** ao oponente escolhido, valor explicitado pelo criador na implementação.
- Confirmado pelo criador: o mesmo oponente recebe uma queimadura de **65 em cada um dos próximos cinco turnos corridos**: **325 extras**, além dos 65 iniciais, totalizando **390 de dano básico antes das defesas**, se todas as aplicações ocorrerem.
- **Quando Chama é atacado**, o adversário que o atacou recebe uma queimadura de **três aplicações de 35**, distribuídas em turnos corridos: **105 de dano básico ao todo**.
- Os turnos corridos seguem a contagem de ações de qualquer personagem já estabelecida no jogo.
- Confirmado pelo criador: **mesmo o golpe que mata Chama aplica a queimadura defensiva de três vezes 35 no atacante**. Esse efeito não exige a sobrevivência de Chama e deve poder ocorrer após sua morte.
- A reaplicação de queimaduras no mesmo alvo ainda não foi detalhada nesta descrição.

### Zuri — cura total dos aliados em campo

- Pode ativar uma habilidade de cura **na sua própria vez**.
- Restaura a Vida de **todos os outros aliados em campo a 100% da Vida máxima de cada um**.
- Confirmado pelo criador: pode usar a habilidade **uma única vez enquanto estiver viva**, e não uma vez a cada turno.
- Confirmado pelo criador: **a cura gasta a ação de Zuri**.
- Confirmado pelo criador: **a própria Zuri não é curada** pela habilidade.

### Draktar (chamado Drakter na explicação) — caça sorteada na entrada

- Confirmado pelo criador: ao entrar na partida, recebe uma **caça definida por sorteio**, ou seja, um oponente marcado como alvo.
- Na própria vez, pode escolher entre atacar normalmente outro oponente ou atacar sua caça.
- Confirmado pelo criador: contra a caça, causa **dano básico + 200% do dano básico**, totalizando **três vezes o dano básico**, antes das defesas. Exemplo: 100 de básico gera 300 contra a caça.
- Confirmado pelo criador: o bônus se aplica **sempre que atacar o alvo marcado**; não é um poder de uso único.

### Daztirry — estado Oni ao zerar a Vida

- Ao perder toda a Vida, **entra no estado Oni**.
- Nesse estado, fica **imortal por três turnos corridos**, seguindo a contagem de ações de qualquer personagem já estabelecida no jogo.
- Durante o estado Oni, seus ataques causam **30 de dano a mais**.
- Confirmado pelo criador: **ao terminar as três ações de imortalidade, Daztirry é eliminado**.

### Mike — proteção contra Assassinos

- **Nenhum oponente da classe Assassino pode atacar Mike.**
- Oponentes de outras classes podem atacá-lo, respeitando as demais regras normais da batalha.

### Unicorn — estrela de fortalecimento na entrada

- **Ao entrar em campo**, pode colocar uma estrela em um aliado **ou na própria Unicorn**, conforme confirmação do criador.
- O personagem escolhido recebe **+150 de Vida máxima e +150 de Vida atual**, além de **+50 de dano e +2 de velocidade**. O aumento de ambas as Vidas foi confirmado pelo criador.
- Os bônus duram **enquanto o personagem beneficiado estiver vivo**.
- Unicorn pode conceder esse fortalecimento **uma única vez, para um único personagem**, seja ela mesma ou um aliado.

### Nully — multiplicação por d6 e decapitação

- O criador definiu **55 de dano básico** para Nully; preservar esse valor na implementação.
- Ao atacar, rola **um d6**.
- Com **1 a 5**, causa o resultado do dado multiplicado pelo dano básico: **55, 110, 165, 220 ou 275**, respectivamente. É o dano desse ataque, aplicado diretamente, conforme a descrição do criador.
- Exemplo: resultado **3** causa **3 × 55 = 165 de dano básico**.
- Com **6**, **decapita e elimina instantaneamente** o alvo se ele for de raridade **igual ou inferior** à de Nully.
- Se o resultado for **6** e o alvo tiver raridade **superior**, causa **6 × 55 = 330 de dano básico**, em lugar da eliminação instantânea.

### Rayyb (chamada de Rave na explicação) — pó mágico do sono

- Pode usar um **pó mágico uma única vez** para fazer um oponente dormir.
- Confirmado pelo criador: usa o pó **na própria vez, sem gastar a ação**.
- **Toda vez que chegar a vez do oponente adormecido**, ele rola um **d6** para tentar se livrar do sono.
- Com **1 ou 2**, acorda, se livra do sono e **pode agir nessa mesma vez**, conforme confirmação do criador.
- Com **3, 4, 5 ou 6**, continua dormindo, perde a ação dessa vez e deve tentar novamente **na próxima vez dele** na hierarquia.
- A rolagem para despertar segue as vezes do próprio alvo, sem um prazo fixo de turnos corridos.

### Rayvilin (chamada de Rivlin na explicação) — petrificação e perda de precisão

- **Ao entrar em campo**, tenta petrificar um oponente, rolando um **d6**.
- Correção acrescentada pelo criador: **não pode petrificar adversários de raridade superior à sua**. Os alvos elegíveis são de raridade igual ou inferior.
- A precisão inicial permite petrificar com **1, 2 ou 3**.
- O alvo petrificado fica **paralisado e sem qualquer tipo de reação**.
- Para quebrar a maldição, **um aliado do petrificado precisa atacá-lo**. Confirmado pelo criador: o petrificado recebe **somente 30 de dano ao ser liberto, substituindo o dano normal desse ataque**.
- Se o alvo continuar petrificado quando chegar a vez de Rayvilin, **o ataque dela o elimina instantaneamente**. A aplicação da petrificação segue o limite de raridade informado pelo criador.
- **Cada tentativa que falha reduz a precisão:** após a primeira falha, acerta somente com **1 ou 2**; após outra falha, somente com **1**; após mais uma falha, **não consegue mais petrificar**.
- As novas tentativas após falhas acontecem nas próximas vezes dela, conforme a explicação do criador.
- Confirmado pelo criador: na própria vez, **pode tentar petrificar e ainda atacar**, sem gastar sua ação na tentativa.
- Confirmado pelo criador: **pode voltar a petrificar após o alvo atual ser liberto ou morrer**. Mantém um alvo petrificado por vez.
- Confirmado pelo criador: **se petrificar durante a própria vez, já pode executar instantaneamente o alvo nessa mesma vez**, sem aguardar a próxima.

### Z-Zus (chamado de Jesus na explicação) — proteção com a própria Vida

- **Ao entrar em campo, na pré-batalha**, escolhe um aliado para proteger com sua própria Vida, conforme confirmação do criador.
- **O dano direcionado ao aliado protegido é automaticamente transferido para Z-Zus**, com a exceção de dano em área informada abaixo.
- Exceção acrescentada pelo criador: **Z-Zus não protege contra dano em área**. Esse dano atinge o aliado protegido normalmente, sem transferência para Z-Zus.
- Confirmado pelo criador: **a proteção também transfere eliminações instantâneas**; uma eliminação destinada ao protegido atinge Z-Zus em seu lugar.
- Confirmado pelo criador: **o aliado escolhido fica fixo**; Z-Zus não pode trocar de protegido durante a partida.
- A proteção dura **enquanto Z-Zus estiver vivo**.
- Quando Z-Zus morre, **para de defender esse aliado**.

### Alex — Swarm dividido ou concentrado

- O Swarm originalmente tinha 220. Na revisão autorizada da v0.22.0, passou a **120 de dano básico**, respeitando o teto Comum.
- Pode escolher entre **distribuir o dano pelos adversários da linha de frente** ou **concentrá-lo em um único adversário**.
- No modo concentrado, aplica os **120 de dano básico ao alvo escolhido**.
- Confirmado pelo criador: **o Swarm atinge somente adversários**; o modo em área afeta os da linha de frente.
- Confirmado pelo criador: no modo em área, o **dano básico é dividido igualmente entre os alvos**, arredondando **cada parcela para cima em múltiplos de 5**. Exemplos antes das defesas: com o básico atual, um alvo recebe 120; dois recebem 60 cada; três recebem 40 cada. A divisão igual e o arredondamento foram confirmados pelo criador.

### Karma — melhor amigo e revide automático

- **Ao entrar em campo**, escolhe um aliado como seu **melhor amigo**.
- Sempre que esse aliado receber **qualquer ataque**, Karma **causa automaticamente seu próprio dano ao oponente que o atacou**.
- É uma reação automática ao ataque contra o amigo, sem ocupar a vez normal de Karma na hierarquia.
- Confirmado pelo criador: **Karma revida mesmo que o amigo defenda ou esquive do ataque sem perder Vida**.
- Confirmado pelo criador: **Karma também revida se o ataque matar o melhor amigo**.
- Confirmado pelo criador: **o atacante pode defender ou esquivar do revide de Karma**; a reação automática permite esses testes de defesa.

### Trucc (chamado de Turk na explicação) — esquiva que enfraquece a cada acerto

- O criador o descreveu como **o personagem mais rápido do jogo**.
- Confirmado pelo criador: **Magos acertam sem passar pelo teste especial de esquiva de Trucc**.
- Atacantes das demais classes **rolam um d6 para conseguir acertá-lo**.
- Inicialmente, **somente 1 acerta**; os demais resultados falham.
- Quando um ataque o acerta, Trucc recebe o dano e fica mais fácil acertá-lo nas próximas tentativas. Confirmado pelo criador: **também perde 1 ponto de Velocidade por acerto sofrido**.
- A faixa de acerto cresce **a cada acerto sofrido**: **somente 1 → 1–2 → 1–3 → 1–4 → 1–5 → 1–6**.
- Ao chegar a **1–6**, todos os resultados do d6 acertam. Ataques que erram não avançam essa progressão.

## Interações adotadas na implementação

- Toda duração em turnos corridos conta ações concluídas de qualquer personagem, começando depois da ação que aplicou o efeito. Um combo inteiro de Sam conta uma ação; consultas da fila, escolhas de alvo e movimentações gratuitas não contam.
- As defesas normais continuam valendo para ataques, exceto quando a habilidade define seu próprio teste de acerto. O duelo do Sheriff e a esquiva especial de Trucc substituem a esquiva comum; não há duas rolagens de esquiva sucessivas.
- O dano nos vizinhos do míssil usa o dano efetivo do impacto principal após a mitigação, inclusive quando excede a Vida restante. Cada vizinho aplica suas próprias defesas; a explosão lateral conta como área para Z-Zus.
- Uma queimadura de Chama da mesma origem e tipo renova sua duração ao ser aplicada novamente no mesmo alvo. As queimaduras continuam após a morte de Chama.
- Burn pode trocar a hipnose uma vez na própria vez; depois aplica 90 ao novo alvo. Sem alvo hipnotizado vivo, pode escolher outro; sem defensores, pode atacar a Daly Mãe.
- Uma reação não inicia uma cadeia infinita de reações. O revide de Karma admite defesa/esquiva, mas não dispara outro revide de Karma.
- Daztirry em Oni continua vivo e defendendo mesmo em zero de Vida; curas não cancelam a eliminação obrigatória ao final das três ações.
- Trucc começa com velocidade 8, a maior velocidade básica do catálogo, e perde um ponto por acerto, com mínimo 1. Bônus de habilidades podem elevar outros personagens além desse valor.
- A pré-batalha, os vínculos, a área, a proteção e as reações respeitam as dimensões de Penxy. Mortes liberam vínculos e não devolvem cartas aos montes.
- Sem ação capaz de progredir, o ciclo permite comprar cartas. Efeitos pendentes são resolvidos antes do empate; com o monte vazio, sem medalhas utilizáveis e sem ação possível, há empate.

As cartas originais e os campos numéricos estão catalogados em [ARTES.md](ARTES.md).
