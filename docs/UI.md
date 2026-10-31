# Interface — v0.33.1

As seções iniciais registram a direção da v0.29; a interface atual está descrita nas seções mais recentes ao final. A direção original seguiu o HTML **GOGHOS Without Mercy**, o vídeo **cosmos_intro.mp4** e as três imagens de referência enviados pelo criador. Mantém as artes recebidas em MasterKitUp e Ms1–Ms4. As regras, valores, ordem de velocidade, probabilidades, classes, raridades e cartas do combate foram preservados. O inventário está em [CATALOGO.md](../assets/visual-v0.27/CATALOGO.md).

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


## v0.33.0 — Campo e comando em foco

A [referência do criador](references/ui-batalha-v0.33.png) orienta a interação: carta da vez e alvo em destaque, barras de Vida separadas da ilustração, estrela da habilidade e indicação de vínculos como caça de Draktar, proteção de Z-Zus e amizade de Karma. O campo conserva a formação; a área de comando concentra a decisão atual.

No computador, campo e comando aparecem lado a lado. No celular, **Ações** prioriza as cartas ampliadas e **Campo** abre as formações completas. As vidas de ambas as Daly Mães permanecem visíveis na vista de ações. **Escolher alvo** abre cartas grandes, com páginas por botões; somente alvos permitidos pelo motor são oferecidos, incluindo cura, quebra de maldição e Daly Mãe exposta. Escolher um alvo não gasta a ação. Mover Suportes abre o campo, e Concluir retorna aos comandos.

Os comandos são divididos em Ataque, Habilidade e Apoio. A habilidade apresenta somente seu resumo e seus controles; a ficha contém a explicação completa. Montes, histórico, ordem, eliminados e preferências abrem consultas paginadas. Os Apoios continuam utilizáveis na vez da equipe durante impedimentos.

As cartas se deslocam em golpes, recuos, esquivas e mudanças de linha. O espelho ampliado acompanha a ação sem duplicar som, dano ou defesa. As entradas têm sete assinaturas crescentes: Comum (selo), Raro (órbita verde), Épico (runa), Mítico (chama), Lendário (coroa), Secreto (eclipse) e Deus (cosmos). Cada assinatura tem timbre próprio; trocar de alvo ou redesenhar a tela não repete a entrada.

Os timbres de soco, chute, lâmina, guitarra-machado, raio, feixe, míssil, AK-47, rifle de precisão e revólver acompanham o perfil de ataque ou habilidade. Eliminações têm motivos associados ao personagem, como brasas de Chama, fenda de Penxy, páginas de Vaglar e estilhaços de pedra de Rayvilin. Oni permanece uma transformação, sem apresentação de morte antes de sua eliminação efetiva. Efeitos periódicos continuam visíveis quando uma ação é passada ou impedida.

Menu, seleção, arquivo, treinos e loja usam o mesmo acabamento sóbrio, ícones maiores e informações expansíveis. Tocar na carta do arquivo ou usar Enter/Espaço abre sua habilidade e a prévia da raridade. Sons e partículas são acionados por interações reais. Som desligado e movimento reduzido preservam as informações essenciais.

A loja apresenta os quatro baús Comum, Pro, Plus e Plus+ com ilustrações locais originais. Selecionar uma prévia não gasta moedas nem sorteia conteúdo. A abertura está desativada até o criador definir suas regras. Cosméticos e Baú da noite anteriores ficam em uma área recolhida e mantêm sua economia.


## v0.33.1 — Aprimorar a arena, sem criar outra área

A referência mostra relações e interações junto das cartas. A versão anterior foi corrigida: não há painel extra com cópias de cartas, abas Ataque/Habilidade/Apoio nem vistas separadas Campo/Ações. A arena original conserva equipes, frente, retaguarda, Daly Mães, montes, mão e área de ações.

A estrela da carta ativa permite revelar as escolhas de habilidade nos controles que já existiam. Vida, alvo e estado ficam associados à carta do campo; vínculos relevantes identificam sua origem. A ficha mantém descrições completas, sem repetir todos os atributos permanentemente na tela. Sons e deslocamentos usam as cartas da formação, respeitando resultados e ordem dos golpes existentes.


## v0.34.0 — Uma identidade visual para o jogo inteiro

As [referências de composição](references/style-v0.34-loading.jpg) e [iconografia](references/style-v0.34-icons.jpg) orientam os recortes angulares, contornos escuros, sombras deslocadas e acentos de cor. São referências visuais: seus nomes, logotipos e personagens não foram incorporados à interface.

O acabamento alcança abertura, menu, modos, seleção, arquivo, treinos, batalha, consultas, configurações, resultado, loja, coleção e Crônicas. O cenário permanece escuro, equilibrando o recorte gráfico com a identidade da logo oficial. As cartas e a fonte German Beauty continuam originais. As habilidades e descrições permanecem em controles expansíveis, evitando texto repetido.

Os 22 ícones de interface e as quatro prévias de baús foram redesenhados em SVG local, com silhuetas e espessuras consistentes. As cores ressaltam ações e estados, acompanhadas de seus rótulos. Os selos de classe impressos nas cartas continuam preservados. As moedas usam o mesmo ícone na carteira e nos recibos, sem mudar os valores.

A arena conserva a estrutura aprovada na v0.33.1, incluindo mão, montes, frente, retaguarda, Daly Mães, área de ações e habilidade na estrela da carta. Não há painel extra de comando, cópias de cartas ou vistas Campo/Ações. O enquadramento continua sob responsabilidade de ArenaFit. Em paisagem baixa, a correção de uma coluna implícita evita que o nome do monte principal seja quebrado letra por letra.

A abertura usa as artes oficiais de Sam e Sark, carrega seus seis recursos essenciais e mantém Pular, Entrar e os controles de teclado. As transições curtas e os efeitos já existentes respeitam som desligado e movimento reduzido. As folhas finais `signal_system.css`, `signal_screens.css` e `signal_arena.css` organizam o acabamento sem alterar o motor.


## v0.35.0 — Jogar e batalha como uma mesa de jogo

O novo [kit de referência de ícones](references/icones-v0.35-referencia.jpg) define símbolos claros sobre bases facetadas. A direção usa essa leitura com cores mais contidas e acabamento de metal, esmalte e cristal, em vez de aumentar os detalhes ornamentais dos símbolos.

Jogar passa a ter uma composição com personagens oficiais e um acesso principal em destaque. Os demais acessos são atalhos de ícones grandes, com seus rótulos. A seleção conserva somente Voltar, cartas e identificação das escolhas, seguida de Começar quando as equipes estão prontas. As cartas não ficam dentro de painéis retangulares individuais.

Na batalha, os personagens ocupam a mesa diretamente, com sombra e marca de seleção no chão. As grandes caixas por equipe e o painel fixo de atributos deixam de aparecer. A mão, os seis montes de raridade, o principal, a ordem, o registro e os eliminados continuam acessíveis no campo. Tocar em um monte abre a consulta existente, sem comprar cartas nem gastar a ação. Frente e retaguarda preservam seus papéis e posições; cada personagem tem uma única carta real na arena.

Os ícones de habilidade e ataque são diferentes; ações obrigatórias como passar a vez e manter ou retirar o machado também recebem símbolos. O ajuste de mana conserva seus botões e limites em um grupo compacto. A estrela da própria carta continua sendo o acesso às opções da habilidade, na mesma área de ações, sem adicionar outro painel de combate.

`ArenaFit` lê medidas da interface e usa a quantidade real de personagens da frente, reserva de espaço e proporção de Suportes definidas pelo cenário. As vagas vazias não obrigam cartas iniciais a encolher. A área dos comandos e o rodapé da mão permanecem estáveis entre as jogadas. A seleção de um alvo, as consultas e o redesenho continuam sem alterar estado, dados ou recursos da partida.

As [artes locais](../assets/realms-v035/README.md) incluem mesa horizontal, composição vertical e duas folhas transparentes de seis ícones. O carregamento da abertura prepara os sete recursos essenciais, incluindo as novas artes. Nenhuma classe, carta ou logotipo oficial foi redesenhado.


## v0.35.1 — Fundo preto

A ilustração do cenário foi retirada de Jogar, seleção, modos e batalha. A abertura também usa fundo preto, preservando os personagens em primeiro plano. Cartas, emblemas, controles, enquadramento, sons e regras permanecem os mesmos. A abertura prepara seis recursos, sem carregar a imagem de cenário que deixou de ser usada.


## v0.35.2 — Cura de Elysh

Tocar em um aliado elegível com Elysh na frente seleciona a cura diretamente, sem abrir a ficha; a confirmação continua necessária e usa a ação da personagem. O botão opcional chama-se **Modo cura**, distinto da confirmação **Curar**. Na retaguarda, a cura já fica selecionada e não há seletor redundante.

Escolher um modo de ação encerra a seleção de movimento e de cartas de Apoio, evitando que elas capturem o clique no aliado ou mantenham a confirmação desabilitada. Repetir o Modo cura conserva um alvo de cura já válido. Um Apoio que estava selecionado não é consumido por essa troca.


## v0.35.3 — Mão clicável e habilidades diretas

O espaço transparente da linha de comandos deixa os cliques atravessarem até a mão; somente botões e o controle de mana capturam a interação. Isso corrige as cartas finais do leque em telas de computador sem mudar sua posição. Mouse, toque e teclado continuam disponíveis.

Na própria vez, a estrela da carta e o atalho junto do ataque selecionam a habilidade diretamente. O jogador toca no alvo real e confirma no botão principal, que mostra o nome e o símbolo da ação. Outro toque retorna ao ataque normal e preserva o alvo quando ele ainda for válido. Mover e a seleção de Apoio são encerrados ao preparar uma habilidade, sem consumir a carta. Elysh na retaguarda conserva a cura automática sem um seletor redundante.

Cura total e Swarm em área dispensam alvo individual, mas exigem confirmação. Pó mágico, petrificação e troca de hipnose escolhem o alvo nas cartas da arena, sem uma segunda lista de personagens. Efeitos gratuitos continuam gratuitos; trocar a hipnose não antecipa os 90 de dano de Manter. Pré-batalha obrigatória mantém suas escolhas. Habilidades passivas continuam automáticas e a estrela abre sua ficha. Libertar um aliado petrificado fica disponível na linha de ações quando as regras permitem.


## v0.36.0 — Intro e menu enviados pelo criador

A abertura foi extraída de `GOGHOS, tela de carregamento.html`: conserva o monstro em tinta, o logo em duas camadas, as duas batidas, a barra angular amarela, o brilho e a música. O carregamento acompanha recursos locais reais. Um toque libera o início e o áudio; a conclusão entra no menu automaticamente. Pular, Escape e Rever abertura funcionam sem deixar música, fontes, timers ou animações da sessão anterior. Movimento reduzido usa arte estática e uma passagem curta.

O menu substitui a composição anterior pela de `Cosmos — Menu Principal.html`, usando suas ilustrações originais. Cenário cósmico, painel diagonal, favorito, logo, ícones e Play conservam a identidade fornecida. No celular em pé, os elementos são reorganizados sem girar o conteúdo. Os números fictícios do exemplo foram substituídos por moedas, partidas e visuais do Santuário. Loja, Deck, modos, coleção e Configurações usam a navegação existente; Ranked é uma prévia com saída para a Arena.

A qualidade de movimento da referência também aparece nas outras telas: entrada escalonada de elementos, pressão e assentamento de emblemas e um brilho curto ao selecionar o alvo real. O movimento de ataque, entrada e morte das cartas continua pertencendo aos eventos de combate, sem ser repetido pelo redesenho da interface. Todos esses acabamentos respeitam movimento reduzido e página oculta.


## v0.36.1 — Abertura obrigatória e novas músicas

A abertura aparece em toda inicialização, inclusive quando o navegador já tem uma marca antiga de abertura vista. O toque inicial libera áudio e animação; o menu só fica disponível após a conclusão natural. Não há Pular nem entrada antecipada, e Escape não a dispensa. Movimento reduzido continua mostrando a apresentação estática até sua conclusão.

Falhas e demora no carregamento oferecem **Tentar novamente**, conservando o menu bloqueado. Uma nova tentativa invalida callbacks antigos e limpa imagens, áudio, fontes, timers e canvas anteriores. Pedidos repetidos de abertura e a antiga API de fechar não dispensam a apresentação. O foco fica no diálogo durante a animação e volta ao menu ao terminar.

As músicas enviadas substituem as trilhas ativas de batalha, vitória e derrota: batalha em laço, resultados uma vez. O menu e a própria abertura conservam suas músicas. Preferências de som, volumes, pausa e visibilidade continuam em vigor.
