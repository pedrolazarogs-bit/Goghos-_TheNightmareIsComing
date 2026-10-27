# Interface completa — v0.29.0

A direção atual segue o HTML **GOGHOS Without Mercy**, o vídeo **cosmos_intro.mp4** e as três imagens de referência enviados pelo criador. Mantém as artes recebidas em MasterKitUp e Ms1–Ms4. As regras, valores, ordem de velocidade, probabilidades, classes, raridades e cartas do combate foram preservados. O inventário está em [CATALOGO.md](../assets/visual-v0.27/CATALOGO.md).

## Direção visual nas telas de jogo

A seleção, a arena e os painéis de decisão usam superfícies de tabuleiro, contornos fortes, cores por equipe, peças com relevo e a fonte de títulos do menu. A seleção mantém somente Voltar, as quatro cartas com marcações e Play após as escolhas. A arena conserva o posicionamento das linhas, da Daly Mãe, dos montes e da mão; as cartas oficiais não recebem molduras ou números substitutos.

Os montes aparecem como pilhas de cartas coloridas. O painel de velocidade distingue quem age e quem vem depois, e a ficha separa Vida, ataque, velocidade e fôlego em peças próprias. Os ícones das ações foram desenhados para essa interface; os símbolos de classe continuam seguindo o mapeamento oficial.

A mão tem leque vertical, marca de compra recente e indicação de seleção. Mão cheia, recuperação da Daly Mãe e avanço de Suportes usam painéis próprios, com as mesmas opções e bloqueios do motor. As artes da mão conservam sua proporção vertical, inclusive nos botões.

O catálogo e os treinos exibem cartas em pedestais. A habilidade do catálogo pode ser expandida, e a busca continua por nome. Loja, coleção e crônicas usam vitrine, peças equipadas, palco de descoberta e quadros narrativos. As preferências ficam em blocos, e vitória/derrota/empate apresentam um placar destacado.

## Entrada no mundo

A primeira abertura prepara quatro artes essenciais e apresenta o logo Without Mercy com entrada elástica, anel de energia, partículas e reflexo. A animação foi construída para o jogo a partir da referência em vídeo; não é uma reprodução do MP4. O progresso corresponde às imagens carregadas. **Pular abertura** e Escape levam ao menu; depois, **Rever abertura** permite retornar. O carregamento tem uma saída mesmo se um recurso falhar. As demais artes são carregadas conforme as telas são abertas.

O menu mostra o logo recebido e uma pilha de botões inclinados para Jogar, Personagens, Loja, Coleção, Crônicas e Configurações. No computador, logo e menu ficam lado a lado; no celular, o logo fica acima. Perfil e moedas continuam no topo. O cartão de modo permanece junto de Jogar. O pequeno destaque de Sam abre sua ficha narrativa e não define a equipe inicial.

O cartão de modo abre uma galeria: **Arena** entra na seleção alternada dos quatro Comuns; **Treino de campeões** abre os 31 laboratórios; **Mesa de Apoios** abre os 17 testes; **Invocação primordial** prepara o laboratório de Zeenneriam. A escolha permanece durante a sessão, voltando para Arena ao recarregar. Nova partida após um resultado sempre inicia a seleção normal. Escape fecha a galeria.

O HTML recebido funciona como referência visual. Seus botões demonstrativos foram conectados aos acessos reais do projeto; a interface não cria uma ação de Continuar ou promete salvar batalhas. O novo nome e o logo são apresentados no menu, na abertura e na marca da arena, enquanto as ilustrações originais das cartas permanecem intactas.

## Camadas, ícones e painéis

O fundo combina raios, retícula, estilhaços e estrelas em camadas com parallax suave. A cena é independente do combate: há somente uma instância ativa, que é desmontada ao trocar de tela. Ocultar a aba pausa o ciclo; movimento reduzido interrompe os quadros e mantém uma composição estática. As preferências também são aplicadas ao mudar durante a sessão.

Os ícones SVG foram desenhados para o projeto, seguindo contornos roxos, volume e cores dos anexos. A chama e a moldura angular do retrato no menu são elementos próprios inspirados nas referências. Os JPGs originais permanecem catalogados, sem uso de recortes com fundo branco na interface. Logo e Beta são os WebPs extraídos do HTML sem alteração. A fonte Lilita One é local e acompanha a licença SIL OFL; as cartas conservam suas fontes anteriores.

## Arena e cartas

As cartas oficiais são exibidas sem alterar os arquivos originais. O novo enquadramento dá prioridade ao campo: cerca de 156 px de largura em 1440×1000 e pelo menos 100 px nos celulares testados. Em telas baixas o campo pode ser rolado; no celular, a arena rola acima da mão. A quarta carta de Recruta mantém o tamanho e fica numa fileira com rolagem horizontal própria.

Nomes, classe, velocidade e Vida aparecem fora da ilustração para facilitar a leitura. A vez atual tem contorno e identificação; alvos selecionados recebem outro destaque. Suportes ficam nos flancos atrás da frente, com a Daly Mãe protegida entre eles. Em telas estreitas, frente e retaguarda usam fileiras distintas.

A ficha ampliada mostra a carta e a descrição completa. Abrir ficha, histórico ou preferências suspende o avanço visual do bot. Fechar retoma a interface. Selecionar uma carta preserva a posição da rolagem do campo. Os controles continuam disponíveis enquanto a mão permanece em seu espaço próprio.

## Golpes, efeitos e som

A apresentação lê os eventos que o motor já resolveu. Cada golpe mantém sua defesa e reação; DD-X 45×4 e os socos de Sam aparecem em sequência. Eletricidade, fogo, mísseis, machado, socos, cura, dimensão, sono, petrificação e invocação têm perfis visuais distintos. A v0.29 acrescenta contornos de quadrinhos, planos de cor, estilhaços, preparação na origem e trilhas de direção; o soco aparece como uma luva, o fogo é angular e os feixes diferem dos raios. Defesas, esquivas, revides e dano periódico seguem a ordem registrada pela batalha.

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

Botões e cartas selecionáveis têm foco visível. No menu principal, ↑/↓ percorrem as opções e Home/End levam à primeira/última; Enter ou Espaço ativam a opção focada. Enter e Espaço selecionam cartas; Escape fecha a ficha, o seletor de modos ou os detalhes da loja, e também pula a abertura. Os detalhes devolvem o foco ao cartão correspondente. Diálogos de leitura e abertura mantêm o foco entre seus controles. Ícones têm nomes acessíveis e as mensagens mostram resultados mesmo com som ou movimento desligados.

[Validação](VALIDACAO.md) · [Regras preservadas](REGRAS.md) · [Artes recebidas](ARTES.md)


## v0.29.1 — Arena sem roda do mouse e fonte original

A arena se ajusta à altura e largura disponíveis. Frente, Suportes, Daly Mães, montes, mão e comandos permanecem na tela. Em celulares ou janelas baixas, as cartas ficam proporcionais ao espaço; a Ficha apresenta arte ampliada e páginas de habilidades e tributos. Registro, ordem, eliminados, preferências e alvos de Apoio também usam navegação por botões. Mão cheia e recuperação têm decisões compactas. A fonte German Beauty original volta às telas e botões. Nenhuma regra, atributo, habilidade ou arte oficial foi alterada.


## v0.29.2 — Identidade oficial

Logo original GOGHOS — The Nightmare Is Coming restaurada no menu, abertura, modos, arena e brilho da marca. Without Mercy permanece somente como arquivo de referência do material recebido. Fonte original e arena sem rolagem preservadas.
