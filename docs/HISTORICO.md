# Origem e integração do projeto

Os arquivos `goghos-v0_12_0.zip` e `goghos-v0_14_0.zip` foram comparados por nome e conteúdo. Todos os 40 arquivos da 0.12 estão presentes na 0.14; 10 deles mudaram e a 0.14 acrescentou 2 testes. Não havia um terceiro conjunto de arquivos exclusivos da 0.12 a transplantar. Os commits de importação preservam cada versão separadamente no histórico do Git.

| Área | v0.12.0 | v0.14.0, base das regras atuais |
| --- | --- | --- |
| Partida | Seleção de Comuns, cinco montes, Daly, Daly Mãe, recuperação, eliminação, IA e Esquiva | Mantém essas mecânicas e adapta a formação e o espaço disponível |
| Formação | Retaguarda de qualquer classe e sem limite fixo | Até 3 na frente e até 2 Supports na retaguarda |
| Apoio | Três cartas equipadas desde o início em painel lateral | Cartas de Apoio são compradas do monte principal e usadas da mão |
| Mão | Sem limite | Limite de 5; jogador escolhe substituição ou descarte, IA substitui a mais antiga |
| Mago | Mana inicial por raridade, sem regeneração | 3 pontos para todos os Magos; recupera 1 após cada ação resolvida |
| Personagens | Atributos de protótipo | Vida e Dano calculados por faixa de raridade e perfil de classe |
| Interface | Painel lateral de Apoio e mão à direita | Leque da mão, registro visual de eventos e animações de batalha |

As regras acima são incompatíveis entre as versões. A versão mais recente define o comportamento atual. Os testes antigos da 0.12 foram preservados no commit de importação; parte das expectativas deles se refere a regras substituídas. A suíte corrente verifica as regras da 0.14 e as mecânicas da 0.12 que permanecem em vigor.

Para consultar as versões recebidas sem duplicar arquivos no projeto:

```sh
git show 1243c0f:README.md  # v0.12.0
git show e6af3aa:README.md  # v0.14.0
```

## v0.15.0 — artes e personagens

O arquivo `kikiy.zip` trouxe 48 imagens. Sam recebeu a arte da carta de referência; Eletric entrou como Mago Raro, com 220 de Vida e 130 de Dano conforme a carta; Sarck entrou como Tank Épico, com 530 de Vida. O Dano e a Velocidade de Sarck, as classes/raridades atribuídas e os efeitos especiais “3000W” e “Steel Jaw” ainda dependem de confirmação. A interface usa a área ilustrada das cartas completas e mostra os atributos atuais calculados pelo jogo. As três cartas de Apoio e o logotipo foram atualizados. As demais artes foram preservadas como conceitos e catalogadas em `docs/ARTES.md`.

## v0.15.1 — composição das cartas e recuperação

As três cartas prontas foram separadas como referência. Eletric e Sarck usam suas ilustrações avulsas; Sam usa o retrato do banner recebido, com enquadramento próprio. Moldura, nome, vida, dano, mana e fôlego são camadas independentes. Os símbolos das habilidades também são enquadrados sem duplicar a estrela.

A recuperação agora recebe até 3 Comuns, 2 Raros ou 1 Épico, entregando as cartas restantes quando o monte tem menos. Montes vazios ficam bloqueados. A mão ocupa uma área própria para não cobrir as escolhas em telas pequenas. Decisões de mão cheia e cura da Brisa pausam a ordem antes de liberar o próximo personagem.

Validação: suíte de regras, catálogo, recuperação e interface, incluindo 100 partidas simuladas; revisão no Chromium em desktop e celular.

## v0.16.0 — estrutura base definida pelo criador

- Seleção com todos os Comuns, marcas de cada equipe e Play na mesma tela, após as quatro escolhas.
- Medalhas Azul/Verde/Roxa/Holográfica/Preta determinam Comum/Raro/Épico/Lendário/Secreto. Entram na mão e resgatam o topo do monte correspondente na própria vez; substituem o sorteio de raridade e a resolução imediata das Dalys.
- Avanço automático de um Suporte quando a frente esvazia; com dois, o dono escolhe qualquer um ou ambos. Trânsito e troca de Suportes respeitam vagas e a defesa mínima, sem o antigo custo provisório de fôlego.
- Arena com três vagas de frente e duas de retaguarda por equipe, monte principal, cinco montes de raridade, leque inferior esquerdo, registro e eliminados. O celular reserva uma área para a mão.
- Bot com 1,8 segundo para pensar e feedback de dano por 2,2 segundos, com pausa manual. Eliminação aparece antes de a carta deixar a arena.
- Recuperação parcial e limite de cinco cartas preservados, incluindo compras de medalhas com a mão cheia.

A descrição corrente está em REGRAS.md. Item, Habilidade Especial, Loja e parte dos personagens continuam provisórios.

## v0.17.0 — visual da arena inspirado na referência

O campo passou a ocupar o centro da tela, com as linhas de frente voltadas para o centro e os Suportes nas laterais da Daly Mãe. À esquerda ficam os cinco montes de raridade, o registro, os eliminados e o leque. À direita aparecem vez atual, próximo personagem, hierarquia, monte principal e atributos. O alto recebe o troféu e a rodada atual.

A arena reutiliza seis artes originais antes catalogadas como conceitos. As molduras vazias passam a marcar as vagas. As prévias são funções de leitura, sem avançar rodada ou comprar cartas. Regras, atributos, seleção, ritmo e controles da v0.16.0 foram preservados.

## v0.17.1 — continuidade da velocidade após recuperação

Os personagens recuperados após um ataque à Daly Mãe ficavam fora da fila até a rodada seguinte, deixando os oponentes restantes agirem antes deles independentemente da velocidade. Agora o núcleo registra a velocidade da última ação e inclui os recuperados na parte ainda válida da hierarquia. Após um ataque de velocidade 5, recuperados de 5 ou menos entram na sequência atual; velocidades já ultrapassadas aguardam o reset. O desempate existente vale para as duas equipes.

O resgate preserva ações gastas, rodada, compras e ritmo. A escolha informa como a hierarquia continua, e o registro identifica quem entra agora e quem aguarda. A entrada por medalha e o trânsito de Suportes mantêm suas regras anteriores.

## v0.18.0 — Sark e a primeira habilidade principal

Sark passa de Tank Épico provisório para Assassino Lendário oficial, com 530 de Vida, 5 de fôlego e sem ataque ou velocidade. Steel Jaw reage na mesma ação em que ele é atacado: elimina Comuns, Raros e Épicos e causa 390 em Lendários ou Secretos, inclusive quando o golpe é fatal para Sark. As duas perdas são registradas e resolvidas antes da continuação, preservando avanço de Suportes, Brisa e eliminação permanente.

O pacote SarckKit trouxe dois arquivos novos e três já recebidos. A carta é composta com retrato e símbolo separados, molduras e valores dinâmicos; a referência completa não é carregada pelo jogo. O menu Testar Sark permite experimentar a habilidade dos dois lados com formações prontas, sem alterar a seleção normal.

O criador definiu duas regras para a falta de atacantes: permitir avançar o ciclo e comprar, e declarar empate quando o monte acabar e não houver medalha utilizável em nenhuma das mãos. Compras mantêm a escolha de mão cheia; a retomada pelo primeiro atacante não provoca uma compra extra. A continuidade da recuperação da v0.17.1 foi preservada.

## v0.18.1 — base integral de cada personagem

O criador corrigiu a orientação visual: a base recebida deve representar o personagem literalmente, com acréscimo somente dos números nos espaços próprios. Sark passa a usar uma única imagem, `card_base_sark.png`, preservando pose, nome SARCK, rank, cores, estrela e valor 390. A reconstrução com outro retrato e moldura foi retirada desse caminho; somente Vida atual e fôlego são sobrepostos. O formato `cardBase` permite aplicar o mesmo padrão às bases dos próximos personagens. Regras, atributos e Steel Jaw não mudaram.

## v0.18.2 — Steel Jaw exige sobrevivência

O criador corrigiu a ordem da habilidade: Sark recebe o dano primeiro e só reage se permanecer vivo. Dano fatal, inclusive exatamente igual à Vida atual, o elimina sem retaliar. Com Vida positiva, continuam a eliminação instantânea de atacantes abaixo de Lendário e o dano de 390 em Lendários e Secretos.

A previsão de ataque considera a Vida atual, bônus e mana para informar se haverá reação. O registro explica quando Steel Jaw não ativa porque Sark morreu. A base integral da carta e as demais regras foram preservadas.

## v0.19.0 — Elétrica e John

Elétrica recebe os atributos confirmados e 3000W: 130 de dano em todos os adversários da frente, sem seleção individual, preservando aliados e retaguardas. Mana e bônus são gastos uma vez; defesa é resolvida por alvo. Reações ocorrem após os danos do golpe, respeitando a sobrevivência de Sark.

John entra com 270 de Vida, 80 de ataque, velocidade 2, fôlego 3 e Parry com defesa nos resultados 1 ou 2 de um d6. Sharp Guitar permite atacar normalmente ou cravar, imobilizando o alvo e causando 20 após cada ação a partir da seguinte. Manter consome a ação de John; retirar permite escolher outro ataque na mesma vez. Enquanto mantém, ele fica vulnerável e não usa Parry. A morte de qualquer um encerra o vínculo imediatamente.

As bases integrais de Elétrica e John passam a ser usadas com números dinâmicos; John também recebe seu nome no campo vazio. Os nove PNGs dos dois kits são preservados byte a byte. O menu ganha dois testes prontos, as cartas mostram os estados do machado, e o registro apresenta os impactos individuais de área, Parry e dano periódico. Múltiplas perdas enfileiram as escolhas de Brisa. Seleção, hierarquia após recuperação e eliminação permanente foram preservadas.
