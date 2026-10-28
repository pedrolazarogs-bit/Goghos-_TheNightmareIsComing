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

## v0.19.1 — Vida, dano e cura em múltiplos de 5

Conforme a orientação do criador, Vida e dano passam a terminar em 0 ou 5, sempre arredondando para cima. Isso vale para os atributos calculados, o total dos ataques com bônus e mana, a Vida restante, as curas, Steel Jaw e o machado de John. A previsão e os registros usam os mesmos valores do combate. Cura continua limitada à Vida máxima, personagens derrotados ficam em zero e a Daly Mãe mantém três vidas, com perda de uma por ataque.

## v0.20.0 — pré-batalha e primeiro grupo de seis personagens

Entram Penxy, Cavaleiro, Zikssy, Elysh, DD-X e Vaglar, conforme o pedido de implementar esse grupo antes dos demais. A pré-batalha resolve escolhas e dados de entrada sem consumir ação. Penxy cria um 1×1 isolado; Cavaleiro bloqueia 80% do dano; Zikssy rola um d6 por adversário, com sucesso em 1 ou 2 e bônus permanente; Elysh troca o ataque por cura de aliado; DD-X pode dobrar um ataque uma única vez; Vaglar marca e executa por raridade ou causa 200.

A Mítica retorna entre Épica e Lendária. Somente as faixas de Vida/Dano são transferidas: antiga Lendária → Mítica e antiga Secreta → Lendária. Secreta fica aproximadamente 10% acima. A medalha Vermelha e o monte Mítico são adicionados, preservando os identificadores das medalhas antigas. O monte principal passa a 26 cartas. Os valores já confirmados de Elétrica, John e Sark continuam preservados.

As seis cartas usam os PNGs originais com limpeza apenas dos campos numéricos e números dinâmicos. O menu recebe seis formações de teste; os 22 personagens restantes ficam documentados como pendentes. A IA retira o machado quando as curas anulam o progresso, evitando repetição infinita. As regras de recuperação, arredondamento e eliminação permanente continuam em vigor.

## v0.21.0 — elenco oficial e habilidades completas

Removidos os personagens provisórios. O catálogo reúne 30 oficiais e deixa Petra fora, por orientação do criador. A seleção muda para um Comum escolhido por equipe e um Raro sorteado automaticamente para cada lado, sem repetição; ambos começam na frente.

Implementadas as 21 habilidades registradas no guia: míssil de P. Ullys, paralisia de Stally, tubarão de Endrik, proteção de Striker, duelo do Sheriff, hipnose de Barn, almas de Fonior, combo de Sam, fogo de Chama, cura de Zuri, caça de Draktar, Oni de Daztirry, proteção de Mike, estrela de Unicorn, dado de Nully, sono de Rayyb, petrificação de Rayvilin, proteção de Z-Zus, Swarm de Alex, amizade de Karma e esquiva de Trucc. A IA usa as mesmas regras; vínculos, mortes, proteções, defesas e danos contínuos compartilham a resolução de eventos.

As 21 cartas completas recebidas foram preservadas byte a byte, com limpeza apenas das regiões numéricas na apresentação. Sam usa a carta completa mais recente. O catálogo e o laboratório permitem busca por nome. Os testes anteriores usam um catálogo congelado exclusivo de regressão, sem reintroduzir personagens provisórios no jogo.

## v0.22.0 — revisão de atributos e mão independente dos impedimentos

Mantidas as seis raridades e a transferência de faixas, após reconfirmação do criador. Os 30 personagens foram revisados e 22 receberam ajustes em Vida/dano conforme classe e habilidade. Sam passou a 100 por soco; Alex, a 120 de Swarm básico. Armadura, execução, esquiva, área, controle, revides, buffs e dano contínuo foram considerados no orçamento de atributos. As mecânicas e os dados das habilidades permanecem. A tabela completa e os resultados comparativos estão em `docs/BALANCEAMENTO.md`.

Apoios e medalhas podem ser usados na vez da equipe mesmo durante imobilização, sono, paralisia, petrificação, hipnose ou manutenção do machado. Não gastam a ação nem removem o estado; movimento, ataque e reação continuam respeitando o impedimento. A IA resgata medalhas antes de resolver a ação impedida. Corrigida a retomada da IA quando Burn acorda e precisa escolher outra hipnose antes de agir. Mana dos Magos permanece 3 inicial, +1 por ação e máximo 3.

## v0.23.0 — Apoios, invocação primordial e MAX

KitApoio integra 17 efeitos oficiais, substituindo os três nomes já existentes. O leque oferece alvos vivos ou eliminados, respeita um Apoio por turno e funciona durante impedimentos. Recruta abre a quarta vaga frontal; Morto Vivo volta com 1 de Vida e sem habilidade; Sortudo favorece o próximo dado; Eu Denovo e Combokill mantêm a hierarquia restante.

KitZenneriam acrescenta um Deus sem raridade, fora dos seis montes e da seleção, obtido apenas com os três fragmentos únicos da partida. Sua base original recebe os números 1700/700/7 e preserva fôlego 12, MAX e Presence. Presence ignora habilidades de personagens, mantendo Apoios válidos. MAX reúne Mana, Esquiva, Parry 1–2, resistência de Tanque, crítico de Destroyer e transição de Suporte.

Foram corrigidos bloqueios de IA ao surgir uma nova escolha dimensional após resgate, tentativa de quebrar maldição enquanto Burn mantinha hipnose e retomada sem atacante por invocação/ressurreição. Documentação em [APOIOS.md](APOIOS.md) e [DEUSES.md](DEUSES.md).

## v0.23.1 — Recuperação da Daly Mãe

Ao perder uma vida e sobreviver, a equipe escolhe até dois Épicos ou até três Raros. A opção de Comuns foi removida. Montes parciais entregam os disponíveis; vazios ficam bloqueados. Jogador e bot usam a mesma configuração. A recuperação continua a faixa de velocidade restante, sem compra, reset ou repetição de ações.


## v0.24.0 — interface cartoon e leitura direta

Arena, menu, seleção e galerias recebem contornos, formas arredondadas e uma paleta roxa com destaques menta/coral. O turno atual e o próximo personagem ficam acima do campo. As cartas destacam Vida, alvo e estados temporários; passivas e explicações completas ficam na ficha. Histórico, ordem de velocidade e habilidades podem ser expandidos sem perder suas posições a cada atualização.

Os resultados mostram dano, cura, defesa e revide por alvo, com Vida antes/depois e dados do combo. Os impactos de um mesmo efeito são somados apenas na apresentação: socos, testes e reações continuam separados no motor. A instrução da vez e os botões usam textos menores e específicos para a ação selecionada.

Ficha e registro ampliados suspendem o bot e o tempo de exibição, retomando ao fechar. Há seleção por teclado e fechamento por Escape. O celular mantém os comandos próximos do campo e reserva espaço para a mão. As regras, atributos, tempos de combate e imagens originais foram preservados. Detalhes em [UI.md](UI.md) e resultados em [VALIDACAO.md](VALIDACAO.md).


## v0.24.1 — conferência de classes e tributos

Conferidos os símbolos inferiores das 30 bases oficiais com a legenda do criador. Z-Zus passa de Support para Tank: recebe resistência natural de 10% a ataques e deixa de transitar ou ocupar a retaguarda. As outras 29 classes correspondem às bases. MAX continua reunindo todos os tributos. Os símbolos textuais de reserva da interface também seguem a legenda.

A previsão de esquiva passa a respeitar impedimentos e a substituição pelo duelo do Xerife, como a resolução já fazia. Hipnose é identificada como efeito fixo, preservando os 90 contra Tanks em vez de aplicar a redução reservada a ataques. Nenhum valor de Vida, dano, velocidade, fôlego, raridade ou limiar já definido foi alterado.

Os 16 testes novos verificam classes e interações por elenco. John e Zeenneriam mantêm Parry 1–2; os oito Fighters restantes aguardam valores nas novas cartas, conforme decisão do criador. Resultado completo em [CLASSES.md](CLASSES.md).


## v0.25.0 — primeiro grupo do balanceamento manual

Recebidas 29 imagens únicas em Kit1/Kit2, com originais e hashes preservados. Foram reconfirmados e aplicados Elysh (240/80), Stally (230/90), Mike (130/170), Alex (200/170) e Cavaleiro (920/130), com velocidades, fôlego, classes e raridades das novas cartas. Stally é a carta de Kick impressa como Vaglar; seu nome e sua raridade Comum seguem a correção do criador. Parry: Stally 1–5 e Alex 1. Cavaleiro passa a Tank Lendário com Armadura de 80%, sem tributo natural.

Elysh recebe sua vez na retaguarda para curar, sem atacar dali. Impedimentos, silêncio, ressurreição sem habilidade, uso da mão, hierarquia e movimentação continuam validados. A IA pode curar de trás ou avançar se houver vaga. A seleção volta a quatro escolhas alternadas de Comuns, dois por equipe, sem Raros automáticos. O laboratório foi desacoplado dessa opção de seleção para continuar funcionando.

As outras 24 imagens aguardam conferência. Sheriff Épico e Sheriff Raro continuam separados; Linx não entra sem habilidade definida. Detalhes em [BALANCEAMENTO_MANUAL.md](BALANCEAMENTO_MANUAL.md).


## v0.26.0 — todas as cartas balanceadas aplicadas

Conclui a aplicação das 29 cartas únicas de Kit1 e Kit2, além dos cinco primeiros personagens da v0.25.0. Atualiza Vida, dano, classe, raridade, velocidade, fôlego, Parry e resistências conforme as cartas; valores manuais prevalecem sobre as faixas antigas. O catálogo passa a 31 personagens de raridade mais Zeenneriam, sem Petra ou provisórios. John e Sark mantêm as cartas anteriores.

O criador confirmou que SHERIFF Épico/AWM é Striker e que Prototype de Linx causa 30% da Vida máxima do alvo. Ambos entram corretamente no jogo. Sam é Fighter: recebe apenas a correção local do ícone inferior. O combo mantém 70 por soco, Chama usa 55 por aplicação, DD-X mostra 45 × 2 e Draktar 90 × 2. As habilidades anteriores permanecem, usando novos atributos e limites de raridade.

Magos atualizados recebem Mana 3/3 com regeneração; Karma Destroyer testa crítico no revide; Rayvilin Fighter tem Parry; Z-Zus usa 20% de resistência e Cavaleiro continua sem tributo natural. A IA evita alvos com esquiva garantida quando há alternativa, respeita impedimentos restantes depois de acordar e pode testar sono de novo numa ação extra da mesma rodada.

Validação: 274 testes, 380 partidas simuladas e 72 cenários no Chromium em computador e celular. As 29 imagens originais conservam seus hashes. A [tabela manual](BALANCEAMENTO_MANUAL.md) reúne todos os valores ativos.


## v0.26.1 — multiplicadores são golpes separados

Conforme a nova regra do criador, DD-X deixa de aplicar um único golpe de 90: faz dois de 45. Sua habilidade de quatro braços faz quatro de 45, com uma única ativação enquanto viver. Draktar faz dois golpes de 90 e aplica o bônus da caça em cada um. Sam mantém até seis socos de 70, encerrados pelo dado repetido, e passa a mostrar cada soco no registro.

Parry, esquiva, resistência, arredondamento, escudos, proteção e reações são resolvidos a cada golpe. A sequência para se atacante ou alvo morrer. Continua sendo uma ação na hierarquia, sem regeneração ou dano periódico extra. O sistema usa a quantidade de golpes como atributo, separado do dano individual.

A interface informa o padrão antes do ataque, anima os impactos em sequência e lista os golpes e seus revides em ordem. As imagens originais e os limiares de defesa não mudaram.

Validação: 295 testes, 380 partidas completas simuladas e 26 cenários no Chromium em computador e celular.


## v0.26.2 — Penxy respeita a proteção de Striker

O criador esclareceu que Penxy não deve conseguir levar Striker para a dimensão quando a proteção de velocidade impedir essa interação. A escolha agora exclui Striker se Penxy for mais rápido e a habilidade de Striker estiver ativa. O bot e a validação final usam a mesma condição, inclusive se a velocidade mudar com a escolha aberta.

Sem alvo permitido, a pré-batalha continua sem criar o duelo. Penxy conserva a oportunidade de escolher um futuro adversário, inclusive após resgate ou encerramento de outro duelo. A correção também preserva essa oportunidade quando outra habilidade de entrada remove os últimos alvos válidos. Velocidades iguais/menores e Striker sem sua habilidade continuam permitindo a dimensão. A regra de esquiva e todos os atributos e arquivos de arte foram mantidos.

Validação: 307 testes, 380 partidas completas simuladas e 16 cenários no Chromium em computador e celular.


## v0.27.0 — o mundo GOGHOS ganha vida

Renova a apresentação com as artes de MasterKitUp e Ms1–Ms4: abertura, menu ilustrado, cenários, cartões maiores, nomes e atributos legíveis, ícones, estados de alvo e efeitos sonoros. Golpes característicos, defesas, revides e habilidades de entrada ganham animações que consultam os eventos existentes. Som, volume e movimento são configuráveis e persistentes.

Adiciona Santuário local com moedas, baús cosméticos, ambientes, molduras, títulos e crônicas. Todos os personagens continuam disponíveis. Partidas normais concluídas dão uma recompensa fixa uma única vez; testes e abandonos não dão moedas.

O motor, os valores, as probabilidades e os arquivos de cartas da v0.26.2 foram preservados. Os kits foram inventariados com hashes; números em referências antigas não foram aplicados como balanceamento.

Validação: 334 testes, 380 partidas simuladas, 109 cenários integrados de interface e 14 cenários isolados dos módulos. Fontes do motor e balanceamento anterior comparados integralmente.


## v0.27.1 — lobby, loja e escolha de modos

Reorganiza o menu com campeão em destaque, perfil, carteira, atalhos laterais e modo ao lado de Jogar. A galeria apresenta Arena, Treino de campeões, Mesa de Apoios e Invocação primordial como acessos às telas existentes. A Loja da noite ganha baú em destaque, filtros e prévias dos 12 cosméticos, com indicação de posse e equipamento.

A inspiração usa padrões gerais conhecidos de lobby/loja/seleção de modos solicitados pelo criador. O acesso às páginas oficiais de Brawl Stars foi bloqueado pelo ambiente; não houve inspeção da versão atual nem reutilização de recursos externos. A identidade e as ilustrações continuam sendo de GOGHOS.

Nenhuma mudança no motor, balanceamento, preços ou recompensas. O progresso anterior continua carregando. As bases das cartas permanecem intactas.

Validação: 340 testes, 380 partidas simuladas e 97 cenários de navegador em computador, celular e paisagem.


## v0.28.0 — GOGHOS Without Mercy e interface cartoon

Aplica a direção visual do protótipo HTML recebido: logo e Beta originais, menu de botões inclinados com relevo, ícones coloridos, fundo com profundidade e entradas em sequência. A abertura reinterpreta o ritmo do vídeo cosmos_intro com anel, partículas e reflexo. Loja, modos, coleção, preferências, resultados e controles da arena acompanham os contornos e cores dos anexos.

A ambiência tem ciclo próprio, respeita movimento reduzido, pausa com a aba oculta e limpa seus recursos ao trocar de tela. Os ícones e ornamentos SVG são próprios; logo, Beta e três JPGs de referência têm origem e hashes registrados. A fonte de títulos é distribuída localmente com sua licença.

Preserva todos os atributos, habilidades, regras, preços, recompensas, progressos salvos e arquivos das cartas. As ações do menu apontam para os destinos reais do projeto; os laboratórios continuam sem recompensa de partida.

Validação: 350 testes, 380 partidas completas simuladas e 123 verificações de navegador em cinco resoluções.


## v0.29.0 — direção cartoon no restante do jogo

Estende o trabalho visual ao campo de batalha, seleção, montes, turnos, alvos, mão, fichas, escolhas de recuperação/formação, catálogo, treinos, loja, crônicas, configurações e resultados. Painéis antes discretos dão lugar a tabuleiro por equipes, pilhas, peças de atributos, leque e pedestais. A proporção vertical das artes da mão também foi corrigida.

Os golpes passam a usar formas e contornos de quadrinhos, com luva, fogo angular, raios e feixes próprios, escudos, portais, preparação e trilhas. A apresentação continua lendo os eventos já resolvidos; ordem, duração, dados e resultados não foram alterados. Dez ícones SVG novos são locais e têm manifesto de origem.

Mantém seleção alternada de quatro Comuns, mão de cinco, recuperação parcial, velocidade, habilidades, economia, progresso e arquivos oficiais das cartas. O motor permanece idêntico à base anterior à renovação.

Validação: 354 testes, 380 partidas completas simuladas e 131 cenários integrados de navegador, com revisão visual em cinco resoluções.


## v0.29.1 — Arena sem roda do mouse e fonte original

A arena se ajusta à altura e largura disponíveis. Frente, Suportes, Daly Mães, montes, mão e comandos permanecem na tela. Em celulares ou janelas baixas, as cartas ficam proporcionais ao espaço; a Ficha apresenta arte ampliada e páginas de habilidades e tributos. Registro, ordem, eliminados, preferências e alvos de Apoio também usam navegação por botões. Mão cheia e recuperação têm decisões compactas. A fonte German Beauty original volta às telas e botões. Nenhuma regra, atributo, habilidade ou arte oficial foi alterada.


## v0.29.2 — Identidade oficial

Logo original GOGHOS — The Nightmare Is Coming restaurada no menu, abertura, modos, arena e brilho da marca. Without Mercy permanece somente como arquivo de referência do material recebido. Fonte original e arena sem rolagem preservadas.


## v0.30.0 — Gótico medieval com cartoon contido

A logo oficial guia a nova interface: ferro e pedra escuros, marfim, latão envelhecido e detalhes discretos de rosa, verde espectral e lavanda. Botões têm menos extrusão, contornos e brilho; arcos e pequenos losangos substituem o excesso de confete. O estilo ilustrado permanece nas cartas, nos ícones e nas animações, sem virar uma interface realista ou excessivamente sombria.

Menu, abertura, modos, seleção, arena, decisões, consultas, catálogo, treinos, preferências, loja, coleção, crônicas, baús e resultados recebem o acabamento. Fonte German Beauty, logo The Nightmare Is Coming, enquadramento sem rolagem, regras e balanceamento permanecem os mesmos. As artes e os números das cartas não recebem filtros nem alterações.


## v0.31.0 — Trilha instrumental e Destruidores contra Parry

Quatro composições instrumentais originais acompanham menu/navegação, combate, vitória e derrota. Harpa, cordas de nylon em estilo de alaúde, flauta, cordas suaves e violoncelo; o combate acrescenta trompa e percussão discreta. Sem vozes ou coros. Menu e combate repetem ciclos de 80 segundos; os finais de vitória (24 s) e derrota (28 s) tocam uma vez. Empates usam a trilha neutra de navegação.

A mudança de tela faz transição suave. Redesenhar a batalha não reinicia a música. Pausar a partida abaixa a trilha; ocultar a aba interrompe e voltar retoma a faixa atual. O áudio começa após o primeiro clique ou tecla. Configurações oferecem som geral, volume geral, música, volume da música e movimento, com preferências persistentes e cinco páginas na arena. A música pode ser desligada sem desligar os golpes.

Ataques de Destruidores ignoram Parry de Fighters em cada golpe, conforme a nova regra do criador. Estatísticas, bases e demais regras permanecem. Os créditos dos timbres, licença, composições e script de reconstrução acompanham `assets/music/` e `scripts/build-soundtrack.py`.


### Striker — ajuste da v0.31.0

Velocidade alterada de **2 para 3**, conforme o criador. A ordem de ação, os atributos exibidos e o número sobre a carta usam esse novo valor. A proteção continua impedindo ataques de oponentes mais rápidos: velocidade 3 pode atacá-lo; velocidade 4 é impedida enquanto a habilidade estiver ativa. Nenhum outro atributo ou arte original foi modificado.


## v0.32.0 — Balanceamento aprovado

- **Burn:** nenhuma alteração em números, hipnose ou possibilidade de fuga.
- **Rayvilin:** após petrificar na própria vez, precisa concluir uma ação sua antes de poder executar em outra vez. A tentativa continua gratuita e o ataque normal de 180 continua disponível. A petrificação de entrada permite execução na primeira vez dela. Ações gratuitas ou ações de outros personagens não antecipam essa execução; uma ação extra posterior pode contar como a próxima vez. Libertar o aliado ainda custa uma ação e causa 30; precisão, raridade e demais regras permanecem.
- **Unicorn:** estrela +150 de Vida máxima/atual, +50 de ataque e agora **+1 de velocidade**. Uso único e duração no beneficiado preservados.
- **Chama:** ataque inicial 55; queimadura ofensiva **40×5**; revide **35×3** preservado, inclusive quando morre. A carta deixa de mostrar o antigo 55×6, pois as parcelas passaram a ser diferentes; a ficha informa o efeito.
- **DD-X:** **55×2**, ou **55×4** uma vez. Cada golpe conserva sua própria defesa e reação.
- **Fonior:** Vida inicial/máxima **320**. Almas seguem aumentando somente o máximo em 20.
- **Linx:** **35%** da Vida máxima do alvo, com arredondamento para cima em múltiplos de 5 e as mesmas defesas.
- **Zuri:** pode agir na retaguarda para a cura total única, gastando ação. Não cura a si mesma, não ataca dali e perde essa ação traseira após usar o poder. A equipe pode movê-la pelas regras de Support. Impedimentos, silêncio e ressurreição sem habilidade continuam respeitados.
- **Esquiva natural de Assassin:** teto de **5/6**. Magos continuam ignorando a esquiva natural, Trucc mantém a esquiva própria e a proteção de Striker permanece ativa. UI, prévia e IA usam a mesma chance.
- **Daztirry:** Oni de **quatro ações globais**, inclusive em nova ativação por Poder Adicional. Continua com +30 de dano e é eliminado ao terminar. O prazo não representa quatro ações próprias e não garante uma ação adicional antes de expirar.

Striker continua em velocidade 3 e Destruidores continuam ignorando Parry. Sam, Stally, Mike, Alex, Elysh, Sark e Cavaleiro preservam seus atributos. Nenhuma regra de gasto de Fôlego foi criada. As imagens e os manifestos dos kits originais permanecem intactos; números e textos ativos são atualizados na apresentação.


## v0.33.0 — Interface em foco e identidade audiovisual

Campo reorganizado a partir da nova referência: interação ampliada entre personagem e alvo, Vida em barras, vínculos identificados e comandos Ataque/Habilidade/Apoio. Consultas completas ficam em painéis paginados. A atualização alcança menu, arquivo, treinos e loja, mantendo fonte, logo e cartas oficiais.

Movimentos das cartas, timbres por arma e habilidade, entradas progressivas das seis raridades e de Deus e eliminações personalizadas apresentam os resultados existentes do motor. Seleção usa realce discreto. Novos baús Comum, Pro, Plus e Plus+ são prévias sem regras de compra ou conteúdo; economia cosmética anterior preservada. Nenhum módulo do motor ou atributo de balanceamento foi alterado.
