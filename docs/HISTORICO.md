# Histórico de versões

## v0.53.0 — recebimento discreto e mão de três apoios

- Substituída a tela automática de obtenção por aviso compacto junto aos apoios. Com vaga, entrada automática e aviso temporário; carta completa somente por clique.
- Mão cheia oferece Trocar e escolha de um dos três ícones, ou Descartar nova. Removida a reserva de excedentes; uma única oferta aguarda a decisão antes do próximo turno.
- Cada cópia continua com uso único. Trocar uma carta ativada preserva seu efeito até o ataque correspondente, sem duplicação.
- Bancada com Simular fim do ciclo para testar os dois caminhos, teclado e Escape. Mantidos celular, menu, velocidade, atributos, placar, painel e PNGs originais.

## v0.52.0 — velocidade das cartas e apoio por reset

- Ordem de computador baseada nas 31 velocidades impressas, da maior para a menor, com eliminados ignorados e desempate estável por equipe/posição. Sarck permanece consultável, aguardando sua regra especial.
- Cada ciclo completo volta ao mais rápido vivo e concede exatamente uma carta de apoio com efeito definido. Início de rodada e diálogos não concedem cartas extras.
- Carta completa na obtenção, fila de recebidos quando não houver espaço e até três ícones na UI. Cada cópia tem um uso; cartas gastas não recarregam.
- Velocidades e ciclo visíveis na fila; bancada de apoios ganha Simular fim do ciclo para testar o recebimento.
- Preservados celular, menu, áudio, artes originais, vida/dano/fôlego e dimensões aprovadas da UI.

## v0.51.0 — cartas de apoio e efeitos definidos

- Incorporados 9 PNGs de cartas completas e 10 ícones originais, com correspondência e hashes registrados. Carta completa na obtenção; ícone menor persistente na UI.
- Preparação de até três apoios antes da série. Uso único por carta na série, na vez do jogador e sem gastar o ataque, conforme resposta do usuário.
- Aplicados Bandeide (+70 de cura limitada ao máximo), Na Moleira (+50 no próximo ataque completo), Escudo Volátil (até 80 de bloqueio no próximo ataque recebido) e Papakill (eliminação com menos de 40 PV).
- Seis apoios aguardam definições, sem ativação fictícia; a máscara ainda não tem carta completa.
- Prévia exclusiva em apoios.html, com controles de vida e ataques para testar efeitos. Modelos e componentes compartilhados com a arena.
- Preservados celular, menu, áudio, atributos impressos e dimensões aprovadas do placar e painel.

## v0.50.0 — faixas CC originais dos personagens

- Incorporadas as 18 faixas enviadas, com arquivos originais, correspondência por personagem e hashes registrados.
- Fila de próximo, vez atual e último ataque usa as faixas completas no computador, incluindo seus nomes e estrelas impressos. Clique e teclado continuam abrindo a inspeção.
- Personagens sem faixa usam silhueta com “?” e nome; a lista de 14 artes pendentes foi atualizada.
- Mantidos o placar e o painel compactos, a composição de celular, os atributos das cartas, as habilidades pendentes, os turnos e o menu.
- Prévia da arena e projeto completo na mesma versão.

## v0.49.1 — interface mais compacta

- Placar e painel do jogador reduzidos em 22% na largura e altura no computador, liberando área para a batalha.
- Placar ancorado no centro superior; painel, personagem e ícones reduzidos juntos e ancorados na quina inferior direita.
- Ajustados os textos secundários para preservar a leitura e centralizadas as prévias individuais.
- Preservados celular, artes originais, cliques, animações e regras da série. Prévia da arena e projeto completo atualizados.

## v0.49.0 — placar original do jogo

- Arte do placar recebida no ZIP incorporada sem alterar o PNG, com origem e SHA-256 registrados. Margens transparentes enquadradas por CSS.
- Pontos reais nas faixas azul e vermelha, cronômetro crescente abaixo e destaque breve ao pontuar. A primeira equipe a três vitórias encerra a série.
- Prévia isolada em placar.html para simular pontos, testar o relógio e reiniciar. Componente visual compartilhado com a arena.
- Composição anterior do placar de celular preservada; removida a indicação de arte pendente no computador.
- Mantidos o painel ampliado, as regras da batalha, as cartas, o menu, a abertura e o áudio.

## v0.48.1 — personagem e ícones maiores

- Retrato do jogador 25% maior no painel do computador, incluindo as cartas usadas como retrato.
- Coração, espada, estrela principal e losango de fôlego cerca de 12% maiores, com pequenos ajustes de posição.
- Mantidos o espaço da fila de turnos, os cliques, a estrela estática, as artes originais e a composição de celular.
- Prévia isolada e projeto completo atualizados; regras e balanceamento preservados.

## v0.48.0 — painel do jogador e fôlego

- Painel montado com base preta, faixa de vida, coração e espada recebidos, mantendo os PNGs originais e registrando seus hashes.
- Retrato atrás do painel, números atuais de vida/dano, multiplicadores e estrela principal fixa com consulta por clique.
- Losango identificado pelo usuário como fôlego; aplicados os valores impressos das 32 cartas, sem inventar consumo ou recuperação.
- Prévia exclusiva em painel.html com escolha de personagem, dano, cura e controles visuais de fôlego. O mesmo componente é usado na arena.
- Mantidos o balanceamento, um jogador e sete bots, turnos de 3,2 segundos, menu, abertura, áudio e celular do jogo.
- Downloads da prévia e do projeto completo na mesma versão; arquivo completo omite ZIPs duplicados de versões anteriores.

## v0.47.0 — kit de 32 cartas

- Incorporadas as 32 artes originais dos dois RARs, sem redesenho, recorte ou recompressão; manifesto com origem e hashes.
- Seleção visual com busca, prévia ampliada e identidade separada para as duas cartas Sheriff e as duas Vaglar.
- Cartas completas substituem as silhuetas. Vida atual aparece em barra externa, preservando os números da ilustração.
- Vida e dano impressos aplicados por pedido do usuário, incluindo multiplicadores. Ataques com “—” aguardam regras e passam a vez, sem dano inventado.
- Mantidos um jogador, sete bots, espera de 3,2 segundos, estrela fixa e série até três vitórias.
- Habilidades e atributos de classe aguardam regras; menu, abertura, áudio e celular do jogo preservados.

## v0.46.0 — personagem único e artes pendentes

- Estrela original da habilidade principal fixa junto ao painel do jogador; descrição somente ao clicar. Removido o espaço de habilidade adicional.
- Cartas retas, com o piso ajustado para não encobrir a equipe azul e os controles.
- Escolha de um personagem; três aliados e quatro adversários controlados por bots. Controle mantido no personagem escolhido em todas as rodadas.
- Espera de 3,2 segundos para cada bot. A rodada continua automaticamente entre bots após a eliminação do jogador.
- Artes faltantes indicadas por silhuetas com “?” e explicação ao clicar. Arquivos originais preservados; sem habilidades, itens ou efeitos de apoio inventados.
- Prévia da batalha e projeto completo com a mesma versão. Menu, abertura, áudio e versão de celular do jogo preservados.

## v0.45.0 — nova arena 4×4

- Campo em perspectiva com piso, horizonte, iluminação, cartas em duas profundidades e efeitos leves de ataque.
- Série até 3 pontos, pontuação única por eliminação completa de equipe, restauração entre rodadas e cronômetro crescente até a vitória final.
- Fila com próximo, atual e último atacante; inspeção lateral, ataque básico, espaço de habilidade/item e até três apoios.
- CardTouch integrado ao alvo inimigo. Sem criação de habilidades pessoais ou efeitos de itens/apoios. Atributos provisórios iguais para testar a estrutura.
- Equipes configuráveis, controle manual/contra computador/automático, pausa, movimento reduzido, registro e exportação.
- Prévia independente em batalha.html, acessível também no laboratório. Menu principal e apresentação preservados.

## v0.44.0 — CardTouch no clique do oponente

- Base CardTouch v0.1.1 adaptada ao laboratório com seus quatro PNGs originais e fonte German Beauty do jogo.
- Ciclo de um/dois/três cliques na vez do jogador; fora da vez, somente informações. Painel de habilidade, buffs/nerfs, vida e dano.
- Ataque simulado de 25 pontos no alvo escolhido, encerramento de vez, alternância de turno e reinício independente. Eventos e estado do oponente incluídos na exportação JSON.
- Ajustados foco, rolagem automática, limites do painel, teclado e limpeza de listeners/animações. Menu e combate real não recebem essa mecânica ainda.
- Laboratório isolado e projeto completo publicados na mesma versão.

## v0.43.0 — laboratório independente

- Nova página laboratorio.html para experimentar cartas antes da integração ao jogo.
- Seleção por clique e teclado, detalhes por clique duplo/botão direito, movimento entre áreas, dano e cura com limites, reinício e registro exportável em JSON.
- Modelo de teste independente, sem armazenamento, progresso ou regras oficiais de combate.
- Entrega dupla: ZIP isolado do laboratório e projeto completo. Menu e versão móvel do jogo preservados.

## v0.42.0 — remoção do sistema de favorito

- Removidos seletor, botão de troca, nome/rótulo de favorito, preferência de escolha e animação de troca.
- Unicorn mantida como arte decorativa fixa, preservando tamanho, enquadramento e entrada única no computador. Preferências antigas deixam de ser consultadas.
- Mantidos os ícones da referência, a abertura obrigatória, o áudio contínuo e a vitória. Nenhum elemento do menu abre telas.
- Testes atualizados para verificar ausência de seletor e ignorar uma preferência antiga após recarregar.

## v0.41.0 — menu atualizado conforme a referência

- Composição de computador reorganizada com os quatro PNGs originais recebidos: temporada, progresso, deck e loja.
- Perfil e nível no alto, Ranked junto à divisão em zigue-zague, atalhos inferiores, base circular em degradê e Play amarelo.
- Elementos novos apenas decorativos. Mantidos o seletor de favorito, o tamanho aprovado dos personagens, a abertura e o áudio contínuo.
- Celular preservado; imagens e estilos novos ativados somente no layout de computador.

## v0.40.3 — fundo sem triângulo preto no computador

- Removido o triângulo preto decorativo sobre o cenário no computador; a imagem original fica visível nessa área.
- Mantidos a divisão do personagem, o enquadramento e as animações aprovadas na v0.40.2.
- A alteração de estilo é restrita ao computador com ponteiro preciso. A versão de celular permanece preservada.

## v0.40.2 — correção do tamanho dos personagens

- Removida a ampliação introduzida na v0.40.1: os cinco favoritos recuperam exatamente o tamanho e o enquadramento aprovados na v0.40.0.
- Suavizados os cortes das artes com transparência nas extremidades, aplicada apenas no computador. Os arquivos de imagem continuam originais e o personagem permanece atrás da linha de divisão.
- Entrada e escolha usam fade com deslocamento curto, sem zoom. Continuam com uma execução e repouso após o término.
- Validação de navegador verifica as dimensões também durante as animações, o enquadramento final e a transparência renderizada nas extremidades. O celular permanece preservado.

## v0.40.1 — pivôs e animações pontuais no computador

- Ajustadas posição e escala das cinco artes no computador para esconder as extremidades dos arquivos atrás das bordas do painel.
- Pivô das animações no rosto; aproximação e fade de entrada em 650 ms, escolha em 420 ms, sempre uma execução. Ao terminar, os efeitos são removidos e o personagem permanece em repouso.
- Escolher o favorito já ativo ou fechar o seletor não repete a animação. Trocas interrompem efeitos anteriores; movimento reduzido e saída do layout de computador cancelam os movimentos.
- Implementação isolada em módulo e CSS de computador, ativada com ponteiro preciso e janela em paisagem com largura mínima de 900 px. O celular mantém a versão anterior, inclusive em paisagem.
- Preferência de não alterar mais o celular registrada em CONTRIBUTING.md. Comparados os cinco personagens em três tamanhos móveis: geometria, recorte e ausência de animações iguais à v0.40.0.

## v0.40.0 — seletor de personagem favorito

- Personagem menor, com pontos de enquadramento específicos para o rosto de Unicorn, Sam, Sark, Nully e Mike. Mantidos o recorte pela divisão e a ausência de movimento.
- Clique ou toque no personagem abre uma aba com as cinco artes disponíveis para o menu e indicação do favorito atual. As miniaturas são decodificadas antes da abertura para aparecerem juntas, inclusive no celular.
- Selecionar um personagem atualiza a imagem e o nome imediatamente e salva a preferência local existente, sem alterar moedas ou coleção.
- Seletor acessível por teclado, foco contido na aba e retorno ao personagem após fechar; fechamento por ×, Escape ou clique fora. Uma falha no armazenamento mantém a escolha durante a sessão.
- Preservadas a abertura obrigatória, a música contínua e as animações do menu e de vitória. Os outros ícones continuam sem abrir telas ou partidas.
- Testes de navegador ampliados para trocar todos os favoritos, verificar recorte, salvamento após recarregar, cancelamento e armazenamento indisponível.

## v0.39.1 — personagem estático dentro da divisão

- O personagem usa o limite real do painel como recorte; a borda fica desenhada à sua frente. O recorte é recalculado ao redimensionar a janela, inclusive nas proporções do celular.
- Ajustado o enquadramento no celular para manter o rosto visível dentro da área recortada.
- Removidas a flutuação e a entrada animada do personagem. A divisão também permanece fixa para manter a borda alinhada desde a entrada no menu.
- Mantidos os demais efeitos do menu, a abertura obrigatória, a música contínua e os controles sem acessos internos.
- Validação de navegador inclui comparação de pixels com e sem o personagem para detectar qualquer desenho fora da divisão, além de conferir a ausência de movimento.

## v0.39.0 — somente abertura e menu

- Removidos os acessos de todos os elementos do menu, inclusive Play, loja, deck, ranked, perfil, moedas, configurações, modo, personagem e rodapé. As antigas áreas de botão são agora elementos decorativos, sem navegação ou foco de controle.
- Retirados os motores de combate, draft e IA, os catálogos de personagens, as telas internas e seus recursos exclusivos. A implementação anterior continua disponível na tag v0.38.0.
- Preservados o visual do menu, suas animações, a abertura obrigatória em duas etapas, as transições, a espera por tecla/toque e a música contínua entre apresentação e menu.
- Mantidos o módulo e os recursos da animação de vitória, sem acesso pelo menu. Seus comandos retornam ao menu, sem iniciar partida nem conceder recompensa.
- Conservados todos os 11 arquivos de áudio e os recursos originais de abertura, menu e vitória, verificados por SHA-256.
- Simplificados os estilos, a inicialização, as preferências e a documentação. Adicionada validação de navegador para computador e celular, incluindo cliques sem navegação.

As seções abaixo registram versões anteriores; suas regras e telas não integram a edição 0.39.0.

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


## v0.33.1 — Correção da interpretação da referência

O criador esclareceu que a melhoria deve acontecer na arena existente. Retirados o painel adicional com cartas repetidas, os novos grupos de abas e a divisão Campo/Ações. A formação permanece visível; habilidades e vínculos interagem diretamente com as cartas do campo e com os controles existentes. Mantidos o áudio, os movimentos, os efeitos de raridade, a loja e o balanceamento.


## v0.34.0 — Identidade visual de recortes de tinta

- Referências aplicadas proporcionalmente à abertura, menu, modos, seleção, arquivo, treinos, batalha, consultas, configurações, resultado, loja, coleção e Crônicas.
- 22 ícones e quatro baús em SVG original: contornos angulares, sombras deslocadas e pequenos acentos de cor.
- Abertura com Sam e Sark oficiais, progresso real de seis recursos e navegação por teclado preservada.
- Fonte German Beauty, logo, cartas, músicas, efeitos e estrutura da arena mantidos.
- Corrigido o nome do monte principal em paisagem baixa; botão de entrada com maior contraste.
- Resultado com recibo de recompensa e ações visíveis também em janelas curtas.
- Nenhuma mudança de balanceamento ou economia.


## v0.35.0 — Mesa ilustrada e emblemas facetados

- Menu de Jogar recomposto, com personagens oficiais, acesso principal próprio e atalhos grandes.
- Seleção em cartas soltas, conservando as escolhas alternadas e a equipe inicial.
- Campo de batalha aberto, retirando as grandes caixas por equipe e a ficha permanente da lateral.
- Duas composições originais de mesa, para computador e celular, e doze ícones baseados no novo kit de referência, com acabamento menos cartoon.
- Cartas maiores, montes físicos clicáveis, mão em leque e símbolos distintos para ações e habilidades.
- Enquadramento e espaço dos comandos estabilizados; regras, artes oficiais, fonte e sons preservados.


## v0.35.1 — Fundo preto

Removida a ilustração de fundo de Jogar, seleção, modos, batalha e abertura. Mantidos os personagens, cartas, ícones e organização aprovados na v0.35.0.


## v0.35.2 — Cura de Elysh

Corrigidas as seleções de movimento e Apoio que bloqueavam a cura. Aliado ferido pode ser escolhido diretamente; Modo cura e Curar têm rótulos distintos, e repetir o modo não apaga um alvo válido. Cura na frente e na retaguarda preservada, sem mudar regras ou visual.


## v0.35.3 — Cliques da mão e habilidades diretas

Corrigida a área transparente dos controles que bloqueava cartas do leque no computador. As habilidades ativas passam a ser preparadas por um toque na estrela ou no atalho junto do ataque; o jogador seleciona a carta no campo e confirma no mesmo botão principal. A cura total exige confirmação e as habilidades gratuitas mantêm a ação disponível. Nenhuma alteração de regras, balanceamento, artes ou fundo preto.

Incluído teste opcional de navegador para reproduzir a seleção das cinco cartas por mouse, toque e teclado, Apoio sob paralisia e todas as escolhas de substituição.


## v0.36.0 — Intro animada e menu cósmico

Integrados `GOGHOS, tela de carregamento.html` e `Cosmos — Menu Principal.html` ao jogo real, preservando os recursos recebidos e a marca GOGHOS. A abertura tem carregamento real, áudio sincronizado, pular, replay, passagem automática ao menu e alternativa de movimento reduzido. O novo menu conserva cenário, painel diagonal, favorito e ícones, com navegação, preferências e moedas existentes. A música do menu passa a usar a trilha enviada com esse HTML.

Os emblemas ganham pressão e assentamento, as telas entram com sequência curta e o alvo selecionado recebe um brilho discreto. Nenhuma alteração de balanceamento. Acrescentados testes da integração da abertura, limpeza de recursos, modo reduzido, áudio exclusivo e microinterações; mantidas as regressões das cartas da mão e das habilidades diretas.


## v0.36.1 — Trilhas enviadas e abertura sempre presente

Adicionados os MP3s originais `BattleMusic.mp3`, `WinMusic.mp3` e `DefeatMusicc.mp3`, associados à batalha, vitória e derrota. Menu e intro mantêm suas trilhas. Os arquivos recebidos possuem manifesto de integridade e não foram recodificados.

Removidos o bloqueio por abertura já vista, o botão Pular, a saída por Escape e a entrada antecipada. A conclusão da animação libera o menu; em caso de falha, Tentar novamente recupera os recursos mantendo a abertura obrigatória. A regressão de cliques da mão agora aguarda a apresentação antes de iniciar seus cenários.


## v0.36.2 — Título, música contínua e controles sem caixas

- Carregamento original seguido da nova tela de título; o menu aguarda uma tecla ou toque após a animação.
- Música do menu começa no título e continua sem reiniciar ao entrar no menu.
- Removidos fundos, sombras retangulares e contornos das áreas dos controles do menu em hover, clique e foco. O destaque por teclado acompanha a arte e o texto visíveis.
- Ícones, navegação, abertura obrigatória e balanceamento preservados.
- Versão sincronizada no jogo e no pacote; futuras entregas devem incrementar a versão e registrar as mudanças neste histórico.


## v0.37.0 — Draft e Arena 5×5 integrados

- UI dos anexos integrada em módulos e estilos locais, sem iframe, segundo menu ou servidor externo. O draft avulso fornecia o fluxo; a versão da arena traz sua evolução com 19 personagens oficiais, usada para evitar os slots provisórios. As origens e hashes dos anexos estão em `assets/arena-five/sources.json`.
- Modo 5×5: quatro banimentos, dez escolhas únicas, dois Apoios por participante, poderes ativos/passivos, IA, relógios, rodadas até cinco vitórias, estatísticas e placar.
- Ritmo Calmo por padrão, pausa real, velocidades ajustáveis, suspensão em aba oculta, destaques de alvos por teclado e disposição própria para celular sem girar a tela. A leitura das ações da Arena clássica também ganhou mais tempo, sem alterar os valores do motor.
- Corrigidas lacunas do motor da prévia: proteção do Striker sem alvo alternativo indevido, caça com bônus de velocidade temporário, proteção de Zédia contra execução, Estrela Celeste vinculada ao emissor, crédito de cura ao curador e validação de equipes e Apoios.
- Vitória do anexo ligada ao resultado real nos dois modos, com áudio existente e apenas as moedas realmente concedidas pelo Santuário. Corrigida a camada do canvas que interceptava cliques nos botões.
- Limpeza dos processos e animações ao sair ou reiniciar; prazos de decisões antigos não afetam turnos novos.
- Arena clássica, catálogo, balanceamento, progresso, menu, intro e trilhas anteriores preservados. O novo modo usa as regras próprias da prévia 5×5, documentadas separadamente.


## v0.38.0 — Habilidades individuais, eliminações reais e referências visuais

- Corrigido o fim da fila quando restavam personagens já eliminados: agora o próximo ciclo continua a rodada, sem reset indevido de Vida.
- Removidos Oni coletivo, proteção coletiva de Zédia e a segunda vida que se regenerava depois de esgotada. Só Daztirry entra no próprio Oni, uma vez, por quatro ações globais; depois é eliminado sem depender de sua própria vez.
- O elenco 5×5 passa a ler os dados oficiais do catálogo atual. Cavaleiro e Endrik entram no lugar de Zédia e Dashow, que eram provisórios e não pertenciam ao catálogo confirmado. Não houve alteração dos atributos da Arena clássica.
- Cada campeão possui sua habilidade própria e seu tributo: esquiva de Assassino, Parry individual de Lutador, resistência de Tanque, transição de Suporte, mana de Mago ou crítico de Destruidor. Os seis poderes extras de equipamentos e bônus aleatórios dos bots foram retirados.
- Corrigidas habilidades pessoais no modo 5×5: combo de Sam com dados sem repetição, morte de Sark sem revide, dano percentual de Linx, queimaduras de Chama, máximo de Vida sem cura pelas almas de Fonior e cura de Zuri excluindo a si mesma.
- Draft paginado em seis miniaturas, revisão de habilidade/classe e ficha ilustrada, seguindo a organização das referências enviadas no ZIP. Batalha com cartas oficiais, painel de personagem, fila identificada e leitura de dano separada dos controles.
- Animações de escolha, antecipação e rastro do ataque, esquiva/Parry e saída dos eliminados. Movimento reduzido, pausa e limpeza ao sair preservados.
- Testes: treze regressões do modo, 100 campeonatos (537 rodadas por eliminações reais), testes de ataque manual e eliminação no navegador e fluxo completo do draft à vitória, em desktop/celular.
