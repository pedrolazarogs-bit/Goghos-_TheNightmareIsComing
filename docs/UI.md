# Interface viva — v0.27.1

A renovação usa as artes recebidas em MasterKitUp e Ms1–Ms4. As regras, valores, ordem de velocidade, probabilidades, classes, raridades e cartas do combate foram preservados. O inventário está em [CATALOGO.md](../assets/visual-v0.27/CATALOGO.md).

## Entrada no mundo

A primeira abertura prepara quatro artes essenciais e apresenta o portal GOGHOS. O progresso corresponde às imagens carregadas. **Pular abertura** e Escape levam ao menu; depois, **Rever abertura** permite retornar. O carregamento tem uma saída mesmo se um recurso falhar. As demais artes são carregadas conforme as telas são abertas.

O lobby deixa Sam em destaque, com perfil e moedas no topo, navegação lateral para Loja, Personagens e Crônicas e um botão Jogar junto do modo escolhido. O destaque é uma apresentação do personagem; não define a equipe inicial.

O cartão de modo abre uma galeria: **Arena** entra na seleção alternada dos quatro Comuns; **Treino de campeões** abre os 31 laboratórios; **Mesa de Apoios** abre os 17 testes; **Invocação primordial** prepara o laboratório de Zeenneriam. A escolha permanece durante a sessão, voltando para Arena ao recarregar. Nova partida após um resultado sempre inicia a seleção normal. Escape fecha a galeria.

A organização usa padrões gerais conhecidos de interfaces de jogos, conforme a referência solicitada de Brawl Stars. As páginas oficiais não puderam ser inspecionadas neste ambiente (HTTP 403/falha de conexão). Nenhum recurso ou tela desse jogo foi copiado; a arte, a linguagem visual e os destinos são próprios de GOGHOS.

## Arena e cartas

As cartas oficiais são exibidas sem alterar os arquivos originais. O novo enquadramento dá prioridade ao campo: cerca de 156 px de largura em 1440×1000 e pelo menos 100 px nos celulares testados. Em telas baixas o campo pode ser rolado; no celular, a arena rola acima da mão. A quarta carta de Recruta mantém o tamanho e fica numa fileira com rolagem horizontal própria.

Nomes, classe, velocidade e Vida aparecem fora da ilustração para facilitar a leitura. A vez atual tem contorno e identificação; alvos selecionados recebem outro destaque. Suportes ficam nos flancos atrás da frente, com a Daly Mãe protegida entre eles. Em telas estreitas, frente e retaguarda usam fileiras distintas.

A ficha ampliada mostra a carta e a descrição completa. Abrir ficha, histórico ou preferências suspende o avanço visual do bot. Fechar retoma a interface. Selecionar uma carta preserva a posição da rolagem do campo. Os controles continuam disponíveis enquanto a mão permanece em seu espaço próprio.

## Golpes, efeitos e som

A apresentação lê os eventos que o motor já resolveu. Cada golpe mantém sua defesa e reação; DD-X 45×4 e os socos de Sam aparecem em sequência. Eletricidade, fogo, mísseis, machado, socos, cura, dimensão, sono, petrificação e invocação têm perfis visuais distintos. Defesas, esquivas, revides e dano periódico seguem a ordem registrada pela batalha.

Os efeitos não escolhem resultados nem aplicam dano: só apresentam o que ocorreu. Repetir uma renderização não repete sons ou concessões. Pausa, troca de tela e aba oculta limpam efeitos pendentes. Os efeitos não interceptam cliques nas cartas.

O áudio é produzido localmente por Web Audio; não depende de música ou servidor externo. Só é liberado depois de uma interação do jogador. **Som e efeitos** permite silenciar, ajustar volume e escolher movimento do dispositivo, completo ou reduzido. O modo reduzido preserva números e mensagens e remove o movimento intenso. Preferências ficam neste navegador; a interface continua funcionando se o armazenamento ou o áudio estiverem indisponíveis.

## Santuário, moedas e baús

A **Loja da noite** apresenta o baú, categorias de Ambientes, Molduras e Títulos, prévias e o estado de cada visual. Conhecer um item só abre seus detalhes. Itens ainda não obtidos são descobertos nos baús; itens da coleção podem ser equipados.

A primeira visita recebe 180 moedas. Cada baú custa 90 e oferece um ambiente, uma moldura ou um título de perfil. A abertura dá prioridade a um visual ainda não obtido; depois de completar a coleção, uma repetição devolve 30 moedas. A descoberta precisa ser guardada ou equipada antes de outra abertura.

Cada partida normal concluída concede 50 moedas uma única vez, inclusive derrota ou empate. Laboratórios, abandono e novas renderizações do resultado não concedem moedas. O progresso fica salvo localmente. Se o navegador impedir o armazenamento, funciona durante a sessão.

Os visuais só mudam apresentação. Nenhum personagem fica bloqueado por compra, e a escolha dos personagens, os montes e o balanceamento continuam os mesmos. A moldura contorna o perfil; as cartas recebidas permanecem intactas.

## Crônicas

As seis cenas usam os fundos e as ilustrações dos kits como ambientação narrativa. O arquivo lista os personagens oficiais e consulta suas habilidades atuais. As folhas antigas dos kits ficam como referências organizadas; seus valores não substituem os do jogo. Petra continua fora do elenco jogável.

## Teclado e leitura

Botões e cartas selecionáveis têm foco visível. Enter e Espaço selecionam cartas; Escape fecha a ficha, o seletor de modos ou os detalhes da loja, e também pula a abertura. Os detalhes devolvem o foco ao cartão correspondente. Diálogos de leitura e abertura mantêm o foco entre seus controles. Ícones têm nomes acessíveis e as mensagens mostram resultados mesmo com som ou movimento desligados.

[Validação](VALIDACAO.md) · [Regras preservadas](REGRAS.md) · [Artes recebidas](ARTES.md)
