# Validação — v0.29.0

`npm test`: **354 testes aprovados**, incluindo **380 partidas completas simuladas**. As quatro verificações novas cobrem redesenho da mão cheia, recuperação e avanço sem chamadas mutantes ou perda de estado, além da integridade dos dez SVGs de ações. Os testes existentes continuam conferindo motor, catálogo, atributos, regras e cartas anteriores.

Passaram **131 cenários integrados de navegador** em 1440×900, 1280×720, 390×844, 360×740 e 844×390: 75 fluxos de navegação/catálogos/loja, dez geometrias de formação, 18 decisões e habilidades, oito efeitos com som, quatro resultados dez conferências finais de arte/enquadramento e seis verificações finais de ícones, navegação do resultado e preferências dentro da batalha. Também passaram 11 verificações isoladas de renderização e limpeza dos perfis de efeitos.

A revisão visual abrange seleção sem controles extras, catálogo dos 32 personagens, treinos, Apoios, arena, mão, ficha, recuperação de 2 Épicos/3 Raros, avanço de Suportes, pré-batalha, preferências, loja, cosméticos, crônicas e resultados. A mão cheia foi resolvida tanto por troca quanto por descarte. Busca, acordeões, foco, Escape, botões e progresso após recarregar permaneceram funcionais. Preços e recompensas continuam iguais e não se repetem por redesenhar a tela.

Os testes de formação verificaram 3+2 e a quarta vaga de Recruta, sem sobreposição entre personagens, Daly Mãe e Suportes, mantendo rolagem e tamanho das cartas. As larguras da frente ficaram em aproximadamente 133, 124, 105, 100 e 127 px nas cinco resoluções. Em telas baixas o campo continua rolável. A mão usa seu espaço reservado e as artes agora mantêm orientação vertical. O rótulo da frente adversária e a Daly Mãe ficaram separados na revisão final.

Os efeitos apresentam somente eventos já resolvidos, sem alterar o estado. Planejamento, sequência, durações e probabilidades do motor foram preservados. Foram verificados golpe real, área, feixe, fogo, míssil, defesa, pausa, movimento reduzido e limpeza. Os cenários preparados e dados controlados são ferramentas de reprodução da QA e não fazem parte da partida normal.

Nenhum erro JavaScript, recurso ausente ou transbordamento horizontal nos fluxos aprovados. Os dez arquivos do motor e as bases anteriores das cartas continuam íntegros; as fontes de dados só mudaram na identificação da versão. A navegação foi validada via HTTP local, com as limitações de `file://` já descritas abaixo.

[Vídeo do jogo, sem áudio](previews/jogo-v0.29.0.mp4) · [Arena](previews/arena-v0.29.0-desktop.png) · [Celular](previews/arena-v0.29.0-celular.png) · [Seleção](previews/selecao-v0.29.0-desktop.png) · [Mão cheia](previews/mao-cheia-v0.29.0-celular.png) · [Recuperação](previews/recuperacao-v0.29.0-desktop.png) · [Loja](previews/loja-v0.29.0-desktop.png)

---

# Validação — v0.28.0

`npm test`: **350 testes aprovados**, incluindo **380 partidas completas simuladas**. As regressões continuam comparando motor, atributos, Apoios, montes e configuração com a versão anterior à renovação. Os dez arquivos do motor permanecem idênticos; as fontes de dados permitem somente a identificação da versão. As 71 imagens de bases e limpezas anteriores também permanecem intactas.

Os dez testes novos verificam o ciclo de vida da ambiência e os recursos locais: modo estático sem RAF, redução de movimento aplicada ao vivo, pausa e retomada da aba sem duplicar loops, limite de partículas, remoção do host, desmontagem dos listeners/observador, preferência do dispositivo, logo e Beta idênticos ao HTML recebido, JPGs de referência intactos e SVGs/HTML/CSS sem dependências remotas.

No Chromium via HTTP local passaram **123 verificações**, nas resoluções 1440×900, 1280×720, 390×844, 360×740 e 844×390. Os cenários cobrem os seis acessos reais do menu, quatro modos, loja e categorias, baú de 90 sem duplicação, progresso após recarregar, seleção alternada, recompensa de 50 uma única vez e início de nova partida. Foram conferidos Enter/Espaço/↑/↓/Home/End, foco, rótulos sem cortes, alcance dos botões, título longo e carteira máxima.

A abertura foi exercitada com carregar, entrar, pular, Escape, rever, Tab e Shift+Tab; movimento reduzido e aba oculta foram conferidos no diagnóstico do ciclo de vida e no CSS. Ao mudar de tela, a ambiência fica inativa e não mantém quadros/listeners/observador. Uma partida normal chegou ao ataque real de Mike, com a animação existente e a Vida resultante conferidas. As ilustrações e os valores das cartas continuam os mesmos. Os estados preparados pelos testes só servem para reproduzir as verificações e não são carregados pelo jogo normal.

Sem erros JavaScript, recursos locais ausentes ou transbordamento horizontal nos fluxos aprovados. A moldura angular foi aplicada ao retrato do destaque do menu; a ficha lateral conserva a área de texto livre de ornamentos. O nome Without Mercy e os dois WebPs vêm do protótipo recebido; o vídeo orientou a criação da abertura, sem virar uma dependência de reprodução. A fonte Lilita One é local e acompanha sua licença.

A navegação do navegador foi testada via servidor HTTP local. A limitação administrativa anterior para abrir `file://` continua documentada abaixo; a resolução local das cenas e a ausência de recursos de rede são cobertas pelos testes estáticos/VM.

[Vídeo real da interface, sem áudio](previews/interface-v0.28.0.mp4) · [Menu](previews/menu-v0.28.0-desktop.png) · [Celular](previews/menu-v0.28.0-celular.png) · [Abertura](previews/abertura-v0.28.0-desktop.png) · [Modos](previews/modos-v0.28.0-desktop.png) · [Loja](previews/loja-v0.28.0-desktop.png) · [Arena](previews/arena-v0.28.0-desktop.png)

---

# Validação — v0.27.1

`npm test`: **340 testes aprovados**, incluindo **380 partidas completas simuladas**. Os seis testes novos comparam a economia e os cosméticos com o commit publicado da v0.27.0, conferem os quatro destinos de modo e a resolução das cenas em HTTP, subpastas e URLs locais. Os testes de invariantes confirmam que motor, balanceamento, cartas e artes anteriores permanecem intactos.

No Chromium via HTTP local, passaram **97 cenários** em 1440×1000, 390×844 e 844×390. Cobrem lobby, quatro modos, seleção alternada de quatro Comuns, início normal com token sem recompensa antecipada, laboratórios sem moedas, 12 cosméticos, categorias e detalhes, baú de 90 sem cobrança duplicada, equipamento, progresso após recarregar e preferências. Sem erros JavaScript, recursos ausentes, controles sem nome ou transbordamento horizontal nesses fluxos. Os cenários adicionais exercitam os 31 laboratórios, os 17 Apoios e teclado/foco, incluindo Escape nos detalhes, retorno da loja à vitrine, resultado com recompensa única e Nova partida após escolher outro modo.

A loja preserva a chave de armazenamento e os dados anteriores: 180 moedas iniciais, baú de 90 e 50 por partida concluída. Nenhum acesso a laboratório cria um token de recompensa. Os preços e metadados foram comparados com uma fixture extraída do commit publicado, sem usar a fixture para alimentar o jogo.

As tentativas de consultar Supercell, loja oficial e páginas de aplicativos de Brawl Stars retornaram HTTP 403 ou falha de túnel no navegador. A referência aplicada é de padrões gerais conhecidos; não representa uma inspeção da interface atual. Nenhum arquivo externo foi incorporado.

[Lobby](previews/menu-v0.27.1-desktop.png) · [Celular](previews/menu-v0.27.1-celular.png) · [Modos](previews/modos-v0.27.1-desktop.png) · [Loja](previews/loja-v0.27.1-desktop.png)

---

# Validação — v0.27.0

`npm test`: **334 testes aprovados**, incluindo **380 partidas completas simuladas**. As regras anteriores permanecem cobertas. Os novos testes verificam planejamento de efeitos/sons, eventos e reações em sequência, ausência de mutação da batalha, preferências, ciclo dos baús, recompensas idempotentes, armazenamento indisponível e crônicas.

## Balanceamento preservado

A suíte compara a versão final com o retrato anterior à renovação: os **dez arquivos do motor estão idênticos byte a byte**, as quatro fontes de dados permitem somente a identificação da versão, e o catálogo vivo/configuração/Apoios/montes são iguais. As **71 imagens anteriores de bases de cartas continuam com os mesmos hashes**. A fixture de invariantes é uma referência de comparação, nunca substitui os dados carregados pelo jogo.

Os cinco RARs foram lidos e comparados com os arquivos importados: **106 mídias**, sendo 85 originais novos e 21 arquivos idênticos reutilizados. Origem, dimensões e SHA-256 estão no [manifesto](../assets/visual-v0.27/manifest.json). Números em referências antigas não foram aplicados ao combate.

## Interface e efeitos no Chromium

Passaram **109 cenários da interface integrada**, com HTTP local: 28 fluxos principais, 65 usos de Apoio/laboratórios, oito formações e oito fluxos de recuperação/formação/invocação. Além disso, passaram **14 cenários isolados dos novos módulos**. As resoluções cobrem 1440×1000, 1280×720, 390×844 e 360×740, conforme o fluxo.

Foram exercitados abertura/pular/rever/Escape; menu; preferências persistentes e movimento reduzido; baú/equipar/crônicas; busca de 32 cartas; seleção e resultado com 50 moedas uma única vez; ausência de recompensa em laboratório/abandono; áudio Web Audio liberado por gesto real; mute; área/mana; DD-X45×4; seis socos de Sam; revide fatal de Sark; dimensão e proteção de Striker; cura traseira de 80; mão cheia; todos os 17 Apoios nas duas resoluções principais; e todos os 31 laboratórios no celular. Recuperar 2 Épicos ou 3 Raros, avançar um dos dois Suportes e invocar com três fragmentos preservaram ação, rodada e compras.

As cartas mediram **155,5 px** no desktop principal, **124 px** no desktop baixo, **105,3 px** em 390 px e **100 px** em 360 px. Formações de 3+2 e Recruta não sobrepuseram cartas, Daly Mãe ou Suportes nem causaram transbordamento horizontal da página. A rolagem vertical foi preservada após inspeção; a fileira de quatro cartas também manteve o deslocamento horizontal de 95 px.

Os efeitos não alteraram o estado da batalha. Reapresentar o mesmo evento não repetiu sons; pausa, aba oculta e destruição limparam efeitos pendentes. Nenhum erro JavaScript, recurso ausente ou transbordamento horizontal foi encontrado nos cenários aprovados. Os estados de laboratório e dados controlados servem apenas para reproduzir as verificações.

## Compatibilidade local

A auditoria estática conferiu 40 referências locais HTML/CSS, ausência de dependências remotas ou chamadas de rede nos novos módulos e resolução correta dos fundos para URLs `file://`. As transações e o armazenamento também foram exercitados em VM. A navegação real por `file://` foi bloqueada pela administração do Chromium deste ambiente (`ERR_BLOCKED_BY_ADMINISTRATOR`) antes de carregar o jogo; portanto, essa modalidade não foi validada no navegador aqui. Os fluxos de navegador acima foram executados via servidor HTTP local.

[Menu](previews/menu-v0.27.0-desktop.png) · [No celular](previews/menu-v0.27.0-celular.png) · [Arena e golpe real](previews/arena-v0.27.0-desktop.png) · [Seleção](previews/selecao-v0.27.0-celular.png) · [Baús](previews/baus-v0.27.0-desktop.png) · [Crônicas](previews/cronicas-v0.27.0-celular.png) · [Abertura](previews/abertura-v0.27.0-desktop.png)

---

# Validação — v0.26.2

`npm test`: **307 testes aprovados**, incluindo **380 partidas completas simuladas**. Os 12 testes novos usam o catálogo atual para conferir Penxy e Striker, com velocidade, proteção, fila e estado da dimensão reais.

Os cenários verificam bloqueio para ambas as equipes; confirmação inválida sem mudar o estado; velocidades iguais/menores; silêncio e ressurreição sem habilidade; mudança de velocidade com a escolha aberta; ausência de alvo sem prender a pré-batalha; combate dos aliados fora da dimensão; retomada com novo adversário sem ação ou compra adicional; fim de duelo anterior; alvo traseiro; IA; e perda de alvos por bônus de outra habilidade de entrada. A regressão confirma que a regra de esquiva permaneceu intacta.

No Chromium em **1440×1000 e 390×844**, passaram **16 cenários** com os controles do jogo. Striker protegido não aparece como alvo, o bot escolhe outro adversário mesmo quando Striker tem menos Vida, John consegue atacá-lo fora da dimensão e uma medalha resgatando John reabre a escolha do bot sem avançar ação, rodada ou compra. Também passaram as exceções de velocidade/proteção e a entrada sem alvo válido. Estados de laboratório e dados foram preparados para reproduzir os casos; escolhas, resgate e ataques foram feitos pelos botões da interface.

Sem exceções JavaScript, recursos ausentes, valores indefinidos ou transbordamento horizontal nesses cenários. Nenhum atributo numérico, arte ou regra de esquiva foi alterado.

[Escolha no computador](previews/penxy-v0.26.2-desktop.png) · [No celular](previews/penxy-v0.26.2-celular.png) · [Combate fora da dimensão](previews/striker-v0.26.2-desktop.png) · [Regra confirmada](REGRAS.md#penxy-e-a-proteção-de-striker--v0262)

---

# Validação — v0.26.1

`npm test`: **295 testes aprovados**, incluindo **380 partidas completas simuladas**. A nova suíte tem 21 testes para golpes separados; as partidas atuais continuam verificando conclusão, conservação de cartas, mão e formações legais com os novos padrões de ataque.

Os cenários cobrem DD-X com 2×45 e 4×45, Draktar com 2×90 e 2×270 contra a caça, Sam com até seis socos de 70 e encerramento por dado repetido. Conferem Parry e esquiva por golpe, revides entre golpes, interrupção por morte, proteção que termina quando Z-Zus morre, escudo de um impacto, resistência/arredondamento individuais, silêncio, Presence, Oni, IA, bônus de ataque e ausência de turnos/compras/regeneração/queimaduras extras. A prévia e o registro também são verificados sem alterar a batalha.

A enumeração dos 36 pares possíveis de d6 contra Parry 1–2 e contra esquiva de diferença 2 confirma **32/36 sequências com ao menos um acerto**, em vez de 24/36 para um único golpe. Cada teste de defesa é independente, inclusive após o primeiro golpe ser defendido.

No Chromium em **1440×1000 e 390×844**, passaram **26 cenários com os controles da interface**: bloqueio e esquiva entre golpes, quatro braços, os dois modos de Draktar, combo misto/seis socos de Sam, revide fatal de Sark interrompendo DD-X e Sam, números flutuantes aparecendo em momentos diferentes, seleção normal e catálogo. Os laboratórios usam estados preparados e dados controlados para reproduzir os casos. Os golpes foram confirmados por botão, com Vida e eventos conferidos após a resolução.

Sem exceções JavaScript, recursos ausentes, valores indefinidos ou transbordamento horizontal nesses cenários. As cartas originais foram preservadas; DD-X continua imprimindo 45×2, Draktar 90×2 e Sam 70×6. O feedback agora lista cada golpe e cada revide em ordem, além do total resumido.

[Quatro golpes de DD-X](previews/ddx-v0.26.1-desktop.png) · [No celular](previews/ddx-v0.26.1-celular.png) · [Seis socos de Sam](previews/sam-v0.26.1-registro.png) · [Regra dos golpes separados](REGRAS.md#golpes-em-sequência--v0261)

---

# Validação — v0.26.0

`npm test`: **274 testes aprovados**, incluindo **380 partidas completas simuladas**. São 200 partidas com o catálogo atual, 40 atuais com invocação garantida de MAX, 100 históricas e 40 regressões históricas com invocação. As partidas verificam conclusão, conservação de cartas físicas, limite de mão, formação legal e ações válidas.

Os 13 testes específicos da integração completa conferem as 29 bases/atributos/classes/raridades, SHA-256 dos PNGs, Sam Fighter e multiplicadores, Linx contra Vida máxima/Parry/armadura/protetor/Daly/silêncio, limiares de Parry, Mana dos cinco Magos, resistência individual, crítico de Karma no revide, novos danos de Chama/Nully/Elétrica, alvos viáveis da IA e os 31 laboratórios. Também reproduzem sono com outro impedimento e um novo teste de sono na ação extra da mesma rodada.

As regressões numéricas anteriores usam um catálogo explícito da v0.25.0 em `tests/fixtures/v0_25_catalog.js`; isso preserva cenários históricos de regras. O jogo não carrega essa fixture. Catálogo, integração de 200 partidas e a nova suíte usam os dados atuais da v0.26.0. Nenhum teste de regra foi removido.

No Chromium em **1440×1000 e 390×844**, passaram **72 cenários**: coleção com 32 cartas e todas as 29 bases novas, cada um dos 31 laboratórios, ataque de Linx por 30% com arredondamento, combo de três socos separados de 70 de Sam, dano/mana dinâmica de Elétrica e seleção completa de dois Comuns por equipe. As entradas de laboratório foram preparadas com suas escolhas de pré-batalha resolvidas; navegação, alvos e confirmações usaram os controles da interface. Sem exceção JavaScript, recurso ausente, texto indefinido ou transbordamento horizontal. Números couberam nos campos conferidos.

A inspeção visual confirmou a espada de Sam, nome de Striker, quatro dígitos de Vida de Daztirry e campos limpos sem reapresentar os números antigos. Os arquivos originais das cartas continuam idênticos aos recebidos; as correções são camadas de apresentação.

[Sam no computador](previews/sam-v0.26.0-desktop.png) · [No celular](previews/sam-v0.26.0-celular.png) · [Linx em batalha](previews/linx-v0.26.0-desktop.png) · [Striker](previews/striker-v0.26.0-celular.png) · [Daztirry](previews/daztirry-v0.26.0-celular.png) · [Tabela manual completa](BALANCEAMENTO_MANUAL.md)

---

# Validação — v0.25.0

`npm test`: **261 testes aprovados**, incluindo **340 partidas completas simuladas** (100 históricas, 200 com o catálogo atual e 40 com invocação). Os 16 testes novos cobrem os cinco dados manuais reconfirmados, hashes das 29 imagens, duplicação de Elysh, seleção alternada sem Raros, cura de retaguarda na velocidade correta, consumo de ação, limite de Vida, alvos inválidos, bloqueio de ataque traseiro mesmo com a Daly exposta, silêncio/impedimentos, trânsito sem ação extra, IA, prevenção de empate prematuro, armadura sem tributo natural, Parry de Stally/Alex, laboratórios e Morto Vivo sem habilidade.

As regressões atuais foram adaptadas aos novos valores, classes e raridades, mantendo seus cenários de regras. As formações das 200 e 40 partidas agora completam as quatro escolhas de Comuns. Os testes históricos mantêm o catálogo congelado separado. Nenhuma imagem antiga foi alterada; todos os novos PNGs têm SHA-256 conferido contra os kits.

No Chromium em **1440×1000 e 390×844**, passaram **20 cenários com botões reais**: seleção completa com quatro Comuns, cinco bases e nome Stally corrigido, cura traseira, avanço para atacar, ataque/cura frontal, Parry 1–5 e Vida dinâmica, golpe paralisante de 120, Swarm de 170 dividido, crítico de Mike e armadura de Cavaleiro sem os 10% adicionais. Sem erro JavaScript, recurso ausente, texto indefinido ou transbordamento horizontal. Os números renderizados cabem nos próprios campos. A conferência visual também corrigiu o título da ação de cura para “Elysh curou”.

[Seleção no computador](previews/selecao-v0.25.0-desktop.png) · [No celular](previews/selecao-v0.25.0-celular.png) · [Arena](previews/arena-v0.25.0-desktop.png) · [Cura da retaguarda](previews/cura-v0.25.0-desktop.png) · [Cura no celular](previews/cura-v0.25.0-celular.png) · [Stally](previews/stally-v0.25.0-celular.png) · [Cavaleiro](previews/cavaleiro-v0.25.0-celular.png)

A [conferência dos kits](BALANCEAMENTO_MANUAL.md) separa as cinco cartas ativas das 24 imagens que ainda aguardam reconfirmação. Não foram inventadas habilidades para Linx nem identidade para Sheriff Épico.

---

# Validação — v0.24.1

`npm test`: **245 testes aprovados**, incluindo **340 partidas completas simuladas**. São os 229 anteriores e 16 testes de classes/tributos: identificação visual dos 30, MAX, resistência de Z-Zus em ataques diretos/área/revides e redirecionamento, restrição de retaguarda, efeitos fixos, mana, esquiva com impedimentos/exceções, Parry confirmado e pendente, crítico dos cinco Destroyers e transição dos seis Supports.

Os números de Vida, dano, velocidade, fôlego, raridade, habilidade e Parry dos 31 personagens foram comparados entre os dados da v0.24.0 e os atuais; todos foram preservados. As 30 classes foram comparadas com os símbolos inferiores das bases originais; a única divergência era Z-Zus, agora Tank. Os arquivos de arte não foram alterados. O resultado completo, incluindo os oito limiares de Parry que o criador definirá nas novas cartas, está em [CLASSES.md](CLASSES.md).

No Chromium em **1440×1000 e 390×844**, passaram **16 cenários**, usando os botões reais: catálogo de 31 cartas, dano transferido ao Tank e ficha de resistência, impossibilidade de mover Z-Zus para trás, hipnose por 90, mana no ataque em área, Parry de John, alvo Assassino impedido sem esquiva na previsão/resolução e trânsito de Support sem consumir ação. Sem erros JavaScript, recursos ausentes, texto indefinido ou transbordamento horizontal nesses cenários.

[Ficha de Tank no computador](previews/tank-v0.24.1-desktop.png) · [No celular](previews/tank-v0.24.1-celular.png)

---

# Validação — v0.24.0

`npm test`: **229 testes aprovados**, incluindo **340 partidas completas simuladas**. Os oito testes novos verificam apresentação sem mutar a batalha, combo real com golpes separados e total visual, revide fatal de Sark, defesa por alvo na área, estados temporários, previsão, escape de texto e continuidade da vez ao usar Apoio gratuito.

No Chromium, passaram **75 cenários de interface**: 60 fluxos em **1440×1000 e 390×844**, três formações completas em **1440×1000, 1280×720 e 390×844**, e 12 usos de Apoio durante seis impedimentos nas duas resoluções principais. Os fluxos cobrem menu e laboratórios, seleção, sete montes, alvo e confirmação por teclado, ficha, pausa e retomada do bot, preferência de ordem expandida, histórico, combo, área/mana, cravar/retirar, revide, recuperação, substituição da mão cheia, catálogo, os 17 Apoios, quarta vaga e invocação.

Os testes usaram botões reais. Nos cenários de ficha, foram conferidos os contadores e a ausência de avanço enquanto a leitura permanecia aberta; ao fechar, o bot voltou a agir. Equipes completas não sobrepuseram as barras de Vida ao divisor ou aos comandos. As telas baixas permitem rolar o campo. Não houve erro de JavaScript ou transbordamento horizontal nos cenários. Os arquivos de arte originais não foram alterados.

[Menu](previews/menu-v0.24.0-desktop.png) · [Arena no computador](previews/arena-v0.24.0-desktop.png) · [No celular](previews/arena-v0.24.0-celular.png) · [Equipes completas](previews/equipes-v0.24.0-desktop.png) · [Combo](previews/combo-v0.24.0-desktop.png) · [Ficha no celular](previews/ficha-v0.24.0-celular.png)

O [guia da interface](UI.md) registra controles e organização. A alteração é de apresentação: regras, atributos, imagens e tempos configurados são os da v0.23.1.

---

# Validação — v0.23.1

`npm test`: **221 testes aprovados**, incluindo **340 partidas completas simuladas** com as regras atuais e regressões históricas.

Seis testes específicos verificam as duas opções atuais (2 Épicos ou 3 Raros), retirada exata do topo e conservação das cartas, recuperação parcial, bloqueio de monte vazio, ausência de Comuns na escolha, fim da partida na última vida, as mesmas opções para o bot e continuidade da velocidade sem ação ou compra extra. As opções antigas ficam apenas na configuração de testes históricos da v0.20.

No Chromium em **1440×1000 e 390×844**, passaram **6 cenários** com cliques reais: escolher 2 Épicos, escolher 3 Raros e receber 1 Raro quando só resta essa carta. Foram comparados rodada, turno, cartas do monte/mão/descarte, ações gastas e faixa de velocidade antes/depois. Não houve alteração indevida, erro de JavaScript, recurso ausente, texto indefinido ou transbordamento horizontal.

[Recuperação no computador](previews/recuperacao-v0.23.1-desktop.png) · [No celular](previews/recuperacao-v0.23.1-celular.png)

---

# Validação — v0.23.0

`npm test`: **215 testes aprovados**, incluindo **340 partidas completas simuladas**: 100 históricas, 200 com o catálogo atual/Apoios/tributos e 40 com invocação garantida, alternando a equipe que reúne os fragmentos.

Os 28 testes do kit cobrem todos os 17 Apoios, uso durante impedimentos, validação antes de consumir cartas, roubo/descarte, limiares, silêncio por quatro ações, dados favorecidos, escudo, invulnerabilidade, ações extras sem reset/compra, ressurreição da mesma instância com 1 de Vida, recrutamento, cópia de Vida e recarga de habilidades, incluindo outra duração de Oni sem acumular dano.

Os 32 testes de invocação/Presence/tributos verificam três fragmentos físicos únicos por partida, reserva única fora dos montes, obtenção exclusiva, consumo sem alterar rodada/turno, vagas e retaguarda, retomada sem atacante, eliminação sem reciclagem, imunidades e ataques atravessando habilidades, Apoios válidos contra o Deus, Mana/Parry/Esquiva/resistência/crítico/transição, reinício e conservação nas 40 partidas com o Deus. A integração atual acompanha 31 cartas de personagem (30 de raridade + reserva/Deus), as 57 cartas principais, os limites das linhas e da mão e a exceção de 1 de Vida.

Foram corrigidas duas decisões inválidas da IA: ataque antes de uma escolha dimensional que passou a existir após resgate e tentativa de quebrar maldição enquanto Burn mantinha hipnose. Invocação e Morto Vivo capaz de devolver um atacante também impedem empate prematuro; o bot resolve esses recursos na espera sem atacantes.

## Interface

No Chromium, em **1440×1000 e 390×844**, passaram **84 cenários**: 40 novos fluxos de galeria/uso dos 17 Apoios/invocação/coleção, 26 regressões de seleção e habilidades, 12 de mão durante seis impedimentos e 6 finais de crítico MAX/mana, quarta vaga ocupada e invocação do bot sem atacantes. Foram usados os botões reais da interface. Não houve erros de JavaScript, recursos ausentes, texto indefinido, números vazando dos campos ou transbordamento horizontal nos cenários.

As três imagens de KitZenneriam e as 18 de KitApoio mantêm os bytes originais. Os manifests registram origem e SHA-256. A conferência visual mostrou carta de Deus, campos numéricos, lista de alvos, quatro cartas frontais e mensagens de invocação/crítico.

[Invocação no computador](previews/invocacao-v0.23.0-desktop.png) · [No celular](previews/invocacao-v0.23.0-celular.png) · [Quarta vaga ocupada](previews/recruta-v0.23.0-desktop.png) · [Crítico MAX](previews/critico-v0.23.0-desktop.png)

Os ensaios numéricos de balanceamento abaixo registram a v0.22.0. A v0.23.0 acrescenta tributos e Apoios e não refaz aqueles números históricos. Itens, Habilidades Especiais e Loja permanecem em desenvolvimento.

---

# Histórico de validação — v0.22.0

`npm test`: **155 testes aprovados**, incluindo **300 partidas completas simuladas**. Dez testes novos cobrem cartas da mão em seis impedimentos, cura no próprio personagem e em aliado, bônus, Brisa, limite de um Apoio por turno, medalhas sem ação extra, bloqueios de vez e escolhas obrigatórias, comportamento da IA, vínculo real de John preservado, mana e faixas/exceções do balanceamento. Incluem a regressão em que Burn acorda e precisa escolher outra hipnose antes de agir.

Os 34 testes das habilidades foram atualizados para os novos atributos, preservando os cenários e verificações de dados, alvos, defesas, dano, duração, uso único, múltiplos de 5 e eliminação permanente. Os testes históricos continuam com seu catálogo congelado, separado da produção. A integração atual exercita os 30 oficiais e a nova liberação da mão nas 200 partidas; a integração histórica acrescenta 100 partidas.

## Ensaios de balanceamento

Além da suíte, foram concluídos **8.880 combates comparativos**: 3.480 duelos e 960 confrontos de equipe com atributos antigos, repetidos com os novos. Os dois cenários usam as mesmas composições, sementes e regras atuais. Nenhum atingiu o limite de diagnóstico. Eliminações na primeira ação caíram de 804 para 702 nos duelos e de 257 para 231 nas equipes. Método, limites e resultados completos estão em [BALANCEAMENTO.md](BALANCEAMENTO.md).

## Interface no computador e celular

No Chromium em **1440×1000 e 390×844**, passaram **38 cenários**: os 26 fluxos anteriores adaptados aos novos valores, mais 12 fluxos de uso da mão (seis impedimentos em cada resolução). Nos fluxos novos, Bandeide cura o alvo escolhido, um segundo Apoio fica bloqueado no mesmo turno e uma medalha continua podendo ser resgatada. Foram comparados turno, rodada, ações já realizadas e fila antes/depois: usar a mão não os altera. O personagem continua impedido de atacar. As escolhas foram feitas pelos botões e cartas reais da interface.

Sem exceções JavaScript, imagens ausentes, `undefined`/`NaN` ou transbordamento horizontal. Os números de todas as cartas foram medidos; Sam e Alex foram inspecionados com os novos básicos. Os dados e a ordem foram controlados para reproduzir os cenários; o bot aguardou durante as verificações. As imagens originais dos personagens não foram alteradas.

[Mão no computador](previews/mao-v0.22.0-desktop.png) · [Mão no celular](previews/mao-v0.22.0-celular.png) · [Sam atualizado](previews/sam-v0.22.0-carta.png) · [Alex atualizada](previews/alex-v0.22.0-carta.png)

# Validação anterior — v0.21.0

`npm test`: **145 testes aprovados**, incluindo **300 partidas simuladas**. São os 110 testes anteriores, 34 testes das novas habilidades e uma integração de 200 partidas com o catálogo atual. Os 100 jogos da integração histórica continuam cobrindo recuperação, formação, mão e conservação de cartas.

A integração atual usou **os 30 oficiais**, com um Comum escolhido e um Raro sorteado por equipe. Todos apareceram nas 200 partidas; todas terminaram em vitória ou empate válido. A cada ação foram verificados: identidade e conservação das 30 cartas de personagem, conservação do monte principal, máximo de três na frente e dois Suportes atrás, mão de cinco, Vida/dano em múltiplos de 5, Oni vivo em zero e eliminação permanente.

Os 34 testes específicos cobrem as 21 habilidades e suas interações: dados de acerto/erro, alvo principal e vizinhos do míssil sem saltar uma posição protegida, armadura, paralisia em ações globais, raridades de execução, revide fatal de Endrik, duelo nas duas direções, troca de hipnose com dano no novo alvo, almas sem cura, socos separados e interrupção por morte, queimaduras após morte da origem, cura única, caça tripla repetível, Oni com prazo fixo, bloqueio por classe/velocidade, estrela em si ou aliado, sono gratuito, petrificação com precisão decrescente e quebra por 30, proteção direcionada versus área, Swarm dividido, defesa contra Karma e esquiva progressiva de Trucc. Regressões verificam o retorno à Daly Mãe quando Burn perde o alvo, combo contando uma ação, estrela sem voltar a uma velocidade passada, impedimentos bloqueando movimentos e empate após esgotar recursos.

## Navegador no computador e celular

No Chromium em **1440×1000 e 390×844**, passaram **26 cenários de interface** (13 em cada resolução): seleção inicial e sorteio, Stally, Sam, míssil, troca de hipnose, sono, petrificação/execução, cura total, estrela, Swarm, revide de Karma, Oni e catálogo/busca. Os dados e a ordem foram controlados para reproduzir cada caso; o bot ficou aguardando enquanto os botões eram conferidos. Alguns feedbacks mantiveram os 2,2 segundos configurados e outros foram acelerados para validar o estado seguinte.

Também foram abertas **as 30 formações do laboratório em cada resolução**, resolvendo todas as escolhas de entrada que surgiram. Não houve exceções JavaScript, imagens ausentes, texto `undefined`/`NaN` ou transbordamento horizontal. A largura dos números foi medida nos campos de todas as cartas do catálogo. As cartas de Sam, Alex, Trucc e Unicorn foram inspecionadas visualmente; os 21 pares base/referência desta etapa são idênticos por SHA-256 aos PNGs recebidos.

[Seleção](previews/selecao-v0.21.0-desktop.png) · [Arena no computador](previews/arena-v0.21.0-desktop.png) · [Arena no celular](previews/arena-v0.21.0-celular.png) · [Pré-batalha no computador](previews/prebatalha-v0.21.0-desktop.png) · [Pré-batalha no celular](previews/prebatalha-v0.21.0-celular.png) · [Combo de Sam](previews/sam-v0.21.0-desktop.png) · [Swarm no celular](previews/swarm-v0.21.0-celular.png)

# Validação anterior — v0.20.0

## Pré-batalha e seis personagens

`npm test`: **110 testes aprovados**, incluindo **100 partidas simuladas** com todas as habilidades em uso. Os 24 testes novos cobrem as seis raridades e faixas, preservação dos PNGs originais, bloqueio da pré-batalha, alvo da retaguarda, isolamento e término do duelo, atuação simultânea do restante da arena, passagem sem alvo acessível e várias entradas sem alvos restantes. Também verificam armadura em ataques simples, área e machado; cada resultado do d6 do susto, permanência dos bônus e ordem após recuperação; cura da Elysh com limite e gasto de ação; uso único de DD-X inclusive contra defesa; livro por raridade, manutenção e substituição de nomes, retaguarda, dano de 200 e ciclo sem atacante.

Uma regressão específica verifica a IA retirando o machado quando Elysh cura todo o dano periódico. As partidas simuladas continuam verificando limite de equipe/mão, conservação de cartas, eliminação permanente e múltiplos de 5 em Vida e dano. Os testes antigos foram adaptados ao sexto monte, à medalha Vermelha e às novas faixas, preservando os atributos oficiais já confirmados de Elétrica, John e Sark.

No Chromium, com os tempos reais da batalha, **seis fluxos passaram em 1440×1000 e 390×844**:

1. Penxy escolhe a retaguarda na pré-batalha; o alvo de trás ataca somente ele, e os aliados seguem a hierarquia contra alvos externos.
2. Cavaleiro recebe 40 de um ataque dobrado de 180, com redução no registro.
3. Zikssy rola três dados com resultado 2: +60 de ataque e +1 de velocidade, apresentados antes do combate.
4. Elysh cura 60 em um Cavaleiro aliado, mostra o efeito e consome sua ação.
5. DD-X causa 180, mantém o uso gasto após reset e bloqueia nova ativação.
6. Vaglar marca sem dano antecipado, executa um Comum, marca novamente e causa 200 em Sark Lendário.

Os **12 fluxos passaram** sem exceções JavaScript, imagens ausentes ou transbordamento horizontal. As seis cartas foram inspecionadas individualmente no laboratório; os campos numéricos antigos foram limpos sem substituir o retrato, a moldura ou os ícones da imagem original. Os seis pares base/referência correspondem aos arquivos recebidos por SHA-256.

[Cartas e laboratório](previews/personagens-v0.20.0.png) · [Pré-batalha no computador](previews/prebatalha-v0.20.0-desktop.png) · [Pré-batalha no celular](previews/prebatalha-v0.20.0-celular.png) · [Penxy](previews/penxy-v0.20.0-desktop.png) · [Zikssy](previews/zikssy-v0.20.0-desktop.png) · [Elysh](previews/elysh-v0.20.0-desktop.png) · [Vaglar](previews/vaglar-v0.20.0-desktop.png) · [Vaglar no celular](previews/vaglar-v0.20.0-celular.png)

## Validação anterior — v0.19.1

## Arredondamento de Vida, dano e cura

`npm test`: **86 testes aprovados**, incluindo **100 partidas simuladas**. Sete testes novos verificam arredondamento para cima em todas as terminações, limites e valores fracionários; atributos oficiais preservados; previsão e dano real iguais; área com mana e bônus; Bandeide nos dois caminhos de uso; Brisa; Steel Jaw; dano periódico; cura máxima e eliminação em zero. Os testes de sobrevivência de Sark usam o mínimo positivo atual de 5 de Vida.

As 100 partidas agora também verificam, após cada ação, que Vida máxima, Vida atual, dano e os impactos registrados dos personagens são múltiplos de 5. O contador da Daly Mãe continua com três vidas e perda de uma por ataque.

No Chromium, em **1440×900** e **390×844**, foram conferidos cura de 95 para 175, previsão de ataque de 75, alvo de 220 para 145, resposta do bot de 100 e Vida do jogador de 175 para 75. Cartas, painel e registro mostraram os valores reais, sem exceções JavaScript, imagens ausentes ou transbordamento horizontal.

[Arredondamento no computador](previews/arredondamento-v0.19.1-desktop.png) · [Arredondamento no celular](previews/arredondamento-v0.19.1-celular.png)

## Validação anterior — v0.19.0

## Elétrica, John e bases integrais

`npm test`: **79 testes aprovados**, incluindo **100 partidas simuladas** que chegam à vitória ou ao empate previsto. Os 18 testes novos cobrem dados confirmados, ataque em área apenas na frente adversária, gasto único de mana e bônus, defesa individual, danos antes de Steel Jaw e Suportes promovidos protegidos do golpe anterior. Para John, verificam todos os resultados do d6, ataque normal, cravada, dano por ação, retirada sem gastar ação, imobilização, vulnerabilidade, liberação após morte, bloqueio de movimento e mão, IA e isolamento das formações de teste. Também verificam que dano periódico não dispara defesa ou reação e que múltiplas perdas enfileiram Brisa.

No Chromium, em **1440×900** e **390×844**, cinco fluxos por resolução passaram com os tempos reais do jogo:

1. Área sem selecionar alvo, gasto único de mana, Parry de John e preservação dos aliados e das retaguardas.
2. Cravar, sofrer 20 após cada ação, manter, retirar sem gastar a ação e atacar novamente.
3. Personagem do jogador imobilizado, com botão para passar a vez e aplicação de 20.
4. John vulnerável sem Parry, morto por outro adversário, liberando o alvo sem dano periódico extra.
5. Três eliminações em área, feedback das três cartas e promoção dos Suportes intactos.

Os dez fluxos passaram sem exceções JavaScript, imagens ausentes ou transbordamento horizontal. Os dez campos numéricos das duas bases foram conferidos no laboratório, sem ultrapassar seus espaços no computador ou no celular. O PNG de cada base é exibido inteiro; os campos atualizam conforme o estado da batalha.

Também passaram os **oito fluxos de sobrevivência de Sark**, em 1440×900 e 390×844, e os **seis fluxos de continuidade após recuperação**, em 1280×800 e 390×844. A comparação SHA-256 dos nove PNGs recebidos nos dois kits confirmou que todos estão idênticos no projeto: seis arquivos novos e três já existentes.

[Bases e laboratório](previews/habilidades-v0.19.0-cartas.png) · [Área no computador](previews/eletrica-v0.19.0-desktop.png) · [Área no celular](previews/eletrica-v0.19.0-celular.png) · [John no computador](previews/john-v0.19.0-desktop.png) · [John no celular](previews/john-v0.19.0-celular.png)

## Validação anterior — v0.18.2

## Sobrevivência antes de Steel Jaw

`npm test`: **61 testes aprovados**, incluindo 100 partidas simuladas. Os testes de Sark agora verificam dano fatal exato e excedente contra todas as raridades e nas duas equipes, sem dano ao atacante; sobrevivência com 50 e com apenas 1 de Vida; e reação de 390 que preserva ou elimina Lendários/Secretos conforme a Vida deles. Também conferem a previsão, o gasto único de ação, a exposição da Daly Mãe e o avanço da retaguarda apenas da equipe que perdeu o personagem.

No Chromium, em 1440×900 e 390×844, foram conferidos quatro casos por resolução: 50 de Vida recebendo 100, 100 recebendo 100, e 100 recebendo 50 de um Comum ou de um Lendário. Golpes fatais mostram a previsão de eliminação sem reação, deixam o atacante intacto e permitem continuar atacando a Daly Mãe exposta. Golpes não fatais deixam Sark com 50 de Vida e ativam a reação correspondente. Os oito fluxos passaram sem exceções JavaScript ou imagens ausentes.

A base integral, o enquadramento da carta e os valores dos personagens não foram alterados. A validação abaixo registra o comportamento de versões anteriores; a reação após golpe fatal foi substituída nesta versão.

## Validação anterior — v0.18.1

### Base integral do Sark

Sark usa uma única imagem de carta, a base recebida no SarckKit. As únicas sobreposições na carta viva são os campos numéricos de Vida e fôlego. A referência visual atual do criador substitui a orientação anterior de recompor ilustração e moldura.

`npm test`: 60 testes aprovados, incluindo 100 partidas simuladas. As expectativas de apresentação foram ajustadas à base integral; as regras de Steel Jaw, recuperação, velocidade, mãos e empate continuam cobertas. Não houve alteração em `js/core/`.

No Chromium, a apresentação foi conferida em 1440×900 e 390×844, incluindo laboratório, ataques e mudança da Vida na carta. A imagem original do Sark foi preservada. O registro abaixo descreve a validação anterior da habilidade; as prévias atuais estão em [Carta](previews/sark-v0.18.1-carta.png), [Arena](previews/sark-v0.18.1-desktop.png) e [Celular](previews/sark-v0.18.1-celular.png).

A comparação de duas renderizações a 400 pixels de largura, com e sem os números, encontrou 4.638 pixels alterados dentro dos campos de Vida e fôlego e nenhuma diferença fora desses campos.

## Validação anterior — v0.18.0

### Sark, composição da carta e Steel Jaw

`npm test`: **60 testes aprovados**, incluindo 100 partidas simuladas que terminam em vitória ou no empate definido pelo criador. A suíte mantém as verificações anteriores de seleção, recuperação parcial, ordem após resgate, mão cheia e apresentação. Os 14 testes novos verificam:

- Dados confirmados de Sark, proteção da Daly Mãe e ausência na fila de ataque.
- Ataque recebido e eliminação instantânea de Comum, Raro e Épico, nas duas equipes.
- Reação de exatamente 390 em Lendário ou Secreto, sem esquiva e com eliminação ao zerar a Vida.
- Reação durante um golpe fatal, duas eliminações, avanço das duas retaguardas e Brisa.
- Ataques a outro personagem, ações inválidas, mana, bônus e cura com Vida real.
- Ciclo sem atacante, compra explícita única, mão cheia, medalhas das duas equipes e retomada sem compra adicional.
- Empate somente com monte vazio e sem medalhas utilizáveis, após resolver escolhas pendentes.
- Carta com arte separada, base nova enquadrada por CSS, Vida dinâmica e banner recebido; laboratório sem alterar a seleção normal.

Não foi criado um personagem Secreto no catálogo: o teste dessa raridade usa um estado controlado do atacante. Os cinco PNGs do SarckKit foram comparados por SHA-256 com seus caminhos no projeto; todos permanecem idênticos aos recebidos.

## Revisão atual no Chromium

Em **1440×900** e **390×844**, cinco fluxos por resolução foram percorridos com os tempos reais da batalha:

1. Menu Testar Sark, carta composta, ataque de Raro com eliminação instantânea e ataque de Lendário com reação de 390.
2. Golpe fatal contra Sark, feedback nas duas cartas, reação mantida e Daly Mãe exposta após a eliminação.
3. Sark na equipe do jogador, reagindo automaticamente à IA.
4. Falta de atacante, avanço de ciclo, compra com mão cheia, substituição por medalha e retorno à hierarquia sem nova compra.
5. Empate sem recursos e nova partida com a seleção normal de sete Comuns.

Esses fluxos passaram sem exceções JavaScript, imagens ausentes ou transbordamento horizontal. A carta e o banner também foram inspecionados em detalhe. O aviso visível antes da confirmação explica a resposta de Steel Jaw; durante a troca, dano recebido e reação aparecem nas cartas, no registro e no aviso da arena. O feedback de reação dura 4,4 segundos.

Também foi repetida a revisão de continuidade após recuperação da v0.17.1: seis fluxos em 1280×800 e 390×844, para resgates de velocidades 4 e 5 após ataque de 5 e para recuperação do bot.

![Steel Jaw na arena](previews/sark-v0.18.0-desktop.png)

[Carta e laboratório](previews/sark-v0.18.0-carta.png) · [Reação no celular](previews/sark-v0.18.0-celular.png)

## Validação anterior — v0.17.1

### Correção da hierarquia na recuperação

O erro foi reproduzido com um ataque de velocidade 5 à Daly Mãe seguido de recuperação: apenas os adversários de velocidades 4 e 2 permaneciam elegíveis. A versão corrigida inclui os novos personagens nas velocidades ainda válidas, sem apagar ações anteriores ou iniciar outro ciclo.

`npm test`: 46 testes aprovados, incluindo 100 partidas completas simuladas. Os sete testes novos cobrem recuperação das duas equipes, velocidades iguais e menores, empate com oponente, velocidade já ultrapassada, resgate após o último atacante, reset com compra única, cliques repetidos, opções inválidas e consultas da interface sem alterar a velocidade salva. Também executam a sequência de ações após a recuperação.

No Chromium, em 1280×800 e 390×844, foram conferidos seis fluxos com os tempos reais do jogo: resgates de velocidade 4 e 5 após ataque de 5 para o jogador, e resgate de 4 para o bot. As cartas entram na hierarquia exibida e atacam na rodada correta, sem compra no resgate, exceções JavaScript, imagens ausentes ou transbordamento horizontal. O visual da v0.17.0 foi mantido.

## Validação anterior da arena — v0.17.0

Na v0.17.0, os arquivos de `js/core/` não mudaram em relação à v0.16.0. Os dados dos personagens e os tempos da batalha permaneceram iguais; em `js/data/characters.js` mudou apenas a identificação da versão.

`npm test`: 39 testes aprovados, incluindo 100 partidas completas simuladas. Além dos 35 testes anteriores, há verificações de que as prévias visuais não avançam a fila nem compram cartas, respeitam escolhas pendentes, apresentam os atributos atuais e mantêm a mão adversária oculta.

## Revisão no navegador

Chromium com Playwright, em 1440×900, 1280×800, 390×844 e 360×640. Cinco fluxos foram percorridos em cada resolução:

1. Seleção de todos os Comuns, quatro escolhas alternadas e entrada na arena.
2. Mão cheia, substituição por uma medalha e resgate do topo da raridade correspondente.
3. Ataque com eliminação, feedback visível, avanço automático e escolha dos dois Suportes.
4. Ataque de uma vida à Daly Mãe e recuperação com lotes incompletos.
5. Dano mostrado antes da remoção da carta, pausa e retomada.

Também foram testados seleção por teclado, recuo e avanço de Suportes, cura, resgate e troca entre linhas em 1024×768 e 360×640. No celular, a reserva do leque foi conferida após girar a tela e voltar à orientação original. Esses fluxos passaram sem exceções JavaScript ou arquivos de arte ausentes.

A composição visual foi inspecionada também em 1920×1080. As telas estreitas usam a arena rolável acima do leque. No computador, as laterais e as equipes têm áreas próprias, com a mão abaixo do registro.

## Imagens

A formação abaixo foi montada para revisar Sam, Eletric e Sarck nas posições da referência; não altera a seleção inicial do jogo. O registro mostra um ataque calculado pelo núcleo.

![Arena com formação de exemplo](previews/arena-v0.17.0-desktop.png)

[Partida após a seleção de Comuns](previews/arena-v0.17.0-inicio.png) · [Arena no celular](previews/arena-v0.17.0-celular.png) · [Escolha com a mão cheia](previews/mao-v0.17.0-celular.png)

## Artes

Troféu, verso, cristal, retrato provisório e ícones foram movidos para `assets/arena/`. Os seis arquivos foram comparados por SHA-256 com os originais da versão anterior: nenhum pixel foi alterado. O enquadramento acontece apenas na apresentação. A imagem enviada pelo criador serviu como referência de posições e estilo.

As regras atuais estão em [REGRAS.md](REGRAS.md), e o inventário das artes em [ARTES.md](ARTES.md).


## v0.29.1

- `npm test`: regressões do motor, preservação das artes, consultas sem mutação e ciclo de vida do ajuste da arena.
- Chromium local: 1440×900, 1280×720, 1024×768, 390×844, 360×740, 844×390 e 1280×600, incluindo 12 personagens com Recruta e mão de cinco cartas. Sem personagens ou comandos fora do viewport; todas as cinco cartas têm área de clique própria. O retângulo transparente da imagem do Sark pode exceder a fileira, sem criar área rolável na arena.
- Consultas de ficha, histórico, ordem, eliminados, preferências e mão; navegação mantém estado, montes e hierarquia. Mão cheia e recuperação verificadas em desktop, retrato e paisagem.
- Fonte computada nos controles: German Beauty.


## v0.29.2

`npm test` passou. No Chromium, conferidos título da aba, logo na abertura, menu em 1280×720 e 390×844, modos e arena nos sete tamanhos anteriores. Os recursos ativos usam `assets/logo/logo.png`; a referência Without Mercy não é carregada pela interface. Nenhum erro JavaScript observado.


## v0.30.0

- `npm test`: suíte completa passou, incluindo preservação dos dez módulos do motor, dados de balanceamento, 71 imagens oficiais e recursos recebidos. Os únicos ajustes em JavaScript são caminhos dos ícones e identificação da versão.
- Chromium: menu, abertura/modos, seleção, catálogo, treinos, Apoios, loja, crônicas, configurações, resultado, arena e ficha ampliada em 1280×720 e 390×844. Sem erros JavaScript/HTTP ou imagens visíveis quebradas. Fonte German Beauty e logo oficial confirmadas.
- Arena: formação completa de 12 personagens com Recruta, mão de cinco cartas e controles conferidos em sete tamanhos (1440×900, 1280×720, 1024×768, 390×844, 360×740, 844×390 e 1280×600). Sem elementos de jogo fora da tela e com as cinco cartas clicáveis.
- Consultas e escolhas de mão cheia/recuperação verificadas também em paisagem, preservando a fila e os montes. Parry e dano de ataque em área continuam com resultados separados e texto legível.
- Menu: a área da logo pode encolher em telas desktop baixas, evitando que o link do Sam se sobreponha ao rodapé. Ícones e ornamentos novos validados como SVGs locais, sem scripts ou recursos externos.


## v0.31.0

- `npm test` passou com 8 novos testes do ciclo de áudio e 9 testes de Destruidor contra Parry. A fixture histórica permanece intacta; a guarda de invariantes aceita somente a linha autorizada que desativa Parry contra Destruidores e a velocidade 3 de Striker. Os demais dados e as artes permanecem preservados.
- Reprodução nativa no Chromium: áudio aguarda gesto real; quatro MP3s avançam, transições descartam faixas antigas, cinco redesenhos não reiniciam a música. Pausa reduz volume, mute geral/música são independentes, volumes se multiplicam, aba oculta pausa e retorna à posição atual. Preferências persistem após recarregar. Sem erros JavaScript/HTTP.
- Cinco páginas de áudio/movimento conferidas em 390×844 e 844×390, sem rolagem ou controles fora da tela.
- Quatro MP3s estéreo a 44,1 kHz foram decodificados e medidos: aproximadamente −17 LUFS, picos abaixo de −3,4 dBTP e sem clipping. Laços de menu/combate e finais suaves conferidos. Manifesto registra tamanhos, SHA-256, duração e instrumentos.

- Striker conferido no Chromium: catálogo, unidade, número da carta e ficha mostram velocidade 3, sem alterar o PNG. Testes confirmam o novo limite da proteção (3 permitido, 4 impedido), a ordem de ação e a interação com Penxy. `npm test` completo passou após esse ajuste.


## v0.32.0

- `npm test`: **411 testes aprovados**, incluindo 31 novos casos funcionais/de UI do balanceamento, regressões históricas e partidas completas com o catálogo atual.
- As alterações da rodada foram conferidas em motor, dados, cartas, prévias e IA. Burn, atributos fora da revisão, Deus, Apoios e montes são comparados com a referência anterior; 71 PNGs de cartas e 106 recursos recebidos permanecem byte a byte iguais. O snapshot antigo não foi modificado; a nova referência registra somente o balanceamento aprovado.
- Chromium em 1280×720 e 390×844: Zuri usa a cura da retaguarda pelo botão, consome uma ação, preserva a própria Vida e não ganha ataque traseiro. Rayvilin causa dano normal no turno da petrificação e executa na próxima vez; a petrificação de entrada permite execução na primeira vez. DD-X produz quatro golpes separados de 55 em uma ação.
- Carta/ficha exibem DD-X55×2, Fonior320 e Linx35%. Chama mostra 55 sem o antigo ×6; a habilidade informa 40×5. Unicorn aplica +1 de velocidade, Oni inicia com quatro ações globais, e Burn mantém hipnose e números originais. O dado 6 acerta a esquiva natural mesmo com grande diferença de velocidade, preservando a proteção própria de Striker.
- Formação de 12 personagens, cinco cartas e consultas paginadas continuam cabendo em sete tamanhos de janela, incluindo paisagem curta. Fonte original, tema gótico e música preservados. Sem erros JavaScript/HTTP observados.


## v0.33.0

- `npm test`: **446 testes aprovados**, incluindo comandos progressivos, identidade audiovisual, prévias de baús e identidade das demais telas. A guarda de invariantes confirma que os módulos do motor, dados aprovados e 71 imagens de cartas permanecem intactos; a identificação de versão é a única mudança no arquivo de personagens.
- Chromium: seleção alternada nativa até a batalha, escolha de alvo, DD-X em quatro golpes separados, Apoio durante paralisia, consultas paginadas, alternância Campo/Ações e seleção dos quatro baús sem alterar moedas. Reapresentar a UI não altera estado, compra cartas ou rola dados.
- Formação completa de 12 personagens com Recruta e mão de cinco cartas conferida em 1280×720, 1024×768, 844×390, 768×1024, 390×844 e 360×640. Sem rolagem necessária, controles fora do viewport ou cartas de foco sobre os comandos. O cabeçalho estreito reserva colunas próprias para personagem atual, próximo e consulta de ordem.
- Vinte e quatro cenários de decisões em quatro tamanhos: recuperação, avanço de Suportes, mão cheia, cinco alvos de petrificação, escolha de protegido e alvos de Apoio. Sem controles cortados ou rolagem nos diálogos.
- Web Audio liberado por gesto real: sete assinaturas de entrada, sons por arma, deslocamento real da carta ampliada mesmo com o campo recolhido e eliminação de Chama com brasas. Efeitos desligados/reduzidos e encerramento limpam sons, animações e tarefas; trocar de alvo ou abrir Campo não repete entradas.
- Menu, arquivo, treinos e loja conferidos em desktop e celular. Fonte German Beauty e marca oficial preservadas. Nenhuma exceção JavaScript, erro HTTP ou recurso remoto observado. O botão Como funciona abre a página da habilidade do personagem correto.

[Comandos no computador](previews/acoes-v0.33.0-desktop.png) · [Comandos no celular](previews/acoes-v0.33.0-celular.png) · [Campo completo](previews/campo-v0.33.0-celular.png) · [Novos baús](previews/baus-v0.33.0-desktop.png)


## v0.33.1

- `npm test`: **444 testes aprovados**. Casos da arena verificam que as formações e as laterais existentes foram mantidas, sem painel extra, abas novas ou cartas duplicadas. Clicar na estrela e consultar a ficha não avança ações, compra cartas ou rola dados. A guarda de invariantes preserva o motor, o balanceamento e as artes oficiais.
- Chromium: seleção nativa até a batalha, estrela impressa abrindo as opções na faixa de ações original, DD-X em quatro golpes separados, Apoio durante paralisia e consultas paginadas. Enter ativa a estrela uma vez; instruções e fonte German Beauty foram conferidas.
- Formação completa de 12 personagens com Recruta e mão de cinco cartas em 1280×720, 1024×768, 844×390, 768×1024, 390×844 e 360×640. As equipes continuam no mesmo campo; sem cartas repetidas, controles cortados ou rolagem exigida. O enquadramento foi conferido com opções de habilidade fechadas e abertas.
- As vidas dos personagens não encostam nas Daly Mães. Indicadores de caça em aliados e adversários foram conferidos em desktop e celular, sem obstruir cartas vizinhas ou as vidas da Daly Mãe. A origem aparece na ficha existente e no nome acessível do indicador.
- Vinte e quatro decisões de recuperação, formação, mão cheia, habilidades e Apoios passaram em quatro tamanhos. Sons por arma, movimentos e morte com brasas de Chama continuam nas cartas reais do tabuleiro; som desligado, movimento reduzido e encerramento foram verificados.
- Nenhum erro JavaScript ou HTTP observado nos fluxos revisados. Os quatro baús de prévia e sua ausência de transações permanecem preservados.

[Arena corrigida no computador](previews/arena-v0.33.1-desktop.png) · [Arena corrigida no celular](previews/arena-v0.33.1-celular.png)


## v0.34.0 — Estilo global com arena preservada

- `npm test`: **444 casos aprovados** antes e depois da alteração. As verificações de invariantes preservam o motor e os dados aprovados da v0.32.0, as 71 imagens originais de cartas e os 106 arquivos dos kits catalogados.
- Navegador Chromium: **64 verificações de telas** em 1280×720, 390×844, 360×640 e 844×390. Menu, modos, arquivo com busca, treinos, Apoios, preferências, loja, Crônicas, coleção, seleção alternada e batalha conferidos. Sem erros de JavaScript ou HTTP.
- Arena densa com 12 personagens e mão de cinco cartas: controles e formações dentro da tela, sem rolagem obrigatória. Cenários de quatro personagens também conferidos por seleção real. Habilidade aberta na estrela da carta, sem painel extra ou cópia do personagem.
- **28 verificações adicionais de interação**: Sortudo efetivamente usado durante paralisia sem remover o impedimento, pré-batalha, formação, substituição com mão cheia, recuperação com raridades disponíveis e resultado. Resultados com recompensa conferidos em quatro tamanhos; ações visíveis também em paisagem baixa.
- Abertura em quatro tamanhos: seis imagens carregadas, progresso 6/6, Pular, Entrar, Escape e ciclo de foco por Tab. Contraste e fonte original conferidos após o acabamento final.
- 26 SVGs locais válidos: 22 ícones e quatro baús. Ícones conferidos sobre fundo claro e escuro em 24/32 px, sem cortes nas sombras. As quatro prévias não alteram saldo ou coleção.
- `git diff --check` limpo. A execução pelo servidor local foi validada; o navegador gerenciado bloqueou `file://` antes de carregar o aplicativo, portanto essa modalidade não foi testada neste ambiente.

As capturas desta versão ficam em `docs/previews/`, identificadas por `v0.34.0`. As referências recebidas ficam em `docs/references/style-v0.34-*.jpg`; o jogo não depende delas para executar.
