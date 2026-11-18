# Arena 4×4 — estrutura de teste v0.48.0

Abra `batalha.html` ou use **Abrir campo de batalha** no laboratório. A arena não é carregada pelo menu principal e não grava progresso.

## Série, rodadas e tempo

Você escolhe um personagem da equipe azul. Seus três aliados e os quatro oponentes são bots. Há exatamente um personagem sob seu controle, identificado por ID durante toda a série. A escolha é preservada entre rodadas; não é o antigo sistema de favorito do menu.

Cada equipe possui quatro personagens diferentes entre si. A seleção oferece 32 cartas e as oito posições da partida usam arquivos distintos. Nomes iguais em duas artes permanecem como entradas separadas. Eliminar os quatro adversários concede exatamente um ponto à equipe vencedora. Ao continuar, as duas equipes são restauradas; o placar permanece. A primeira equipe com três pontos encerra a série, em três a cinco rodadas.

O cronômetro usa tempo monotônico desde **Iniciar batalha** até a vitória final. Ele não é regressivo, não reinicia entre rodadas e inclui intervalos, pausas e inspeções. No resultado final, seu valor fica congelado.

## Ordem e ações

A rodada alterna Azul 1, Vermelho 1, Azul 2, Vermelho 2, e assim por diante. Eliminados são ignorados. Na rodada seguinte, a equipe que inicia é alternada. Essa ordem é provisória e não atribui velocidade aos personagens.

A coluna direita mostra o próximo personagem vivo, o personagem da vez e o último que efetivamente atacou. Os retratos podem ser clicados para inspeção. A ação é revalidada no modelo: ator correto, alvo de outra equipe, ambos vivos, rodada ativa e não pausada. Um clique repetido ou callback antigo não concede outro ataque.

Vida e dano são transcritos das cartas recebidas; multiplicadores impressos são aplicados ao total do ataque. O dano efetivo é limitado à vida restante do alvo. Nenhuma habilidade pessoal, atributo de classe, item ou efeito de apoio foi criado. Os espaços de inspeção indicam isso explicitamente.

## Campo e interface

- Campo com piso em perspectiva e cartas retas em duas profundidades. As artes faltantes usam silhuetas com “?”, conforme solicitado; as peças recebidas são preservadas.
- Placar azul/vermelho com três marcadores por equipe, número de rodada e tempo crescente.
- Painel fixado no personagem do jogador no canto direito: retrato, vida, dano, fôlego e situação. A base e os ícones usam as artes recebidas na v0.48.0. Inspecionar outra carta não troca esse painel.
- Estrela original do CardTouch, fixa junto ao painel direito, sem animação nem moldura de botão. Clique nela para consultar a habilidade principal; o conteúdo permanece fechado antes do clique.
- Ataque básico e espaço de item no centro inferior. A habilidade principal não aparece como uma ação adicional.
- Três espaços de apoio no canto esquerdo, sem equipar ou executar efeitos inexistentes.
- CardTouch: primeiro clique no alvo mostra ATACAR, segundo abre informações e terceiro fecha. Fora de uma ação válida, o clique apenas inspeciona.
- Opções de efeitos reduzidos, pausa, ajuda, registro, exportação e reinício. A redução de movimento do sistema também é respeitada.

O losango indica o fôlego impresso na carta, conforme confirmado pelo usuário. Clicar nele abre suas informações; consumo e recuperação aguardam regras. O painel e sua prévia independente compartilham js/ui/player_panel.js e css/player_panel.css. [Painel do jogador](PAINEL_JOGADOR.md).

## Jogador e bots

O jogador só pode atacar na vez do personagem escolhido, com ele vivo e com valor de ataque definido. Cartas com “—” não recebem dano inventado: o jogador pode passar a vez e os bots passam automaticamente após a espera normal. Se no futuro restarem apenas cartas sem ataque definido, a série para sem atribuir vencedor ou ponto. O modelo expõe ações separadas para jogador e bot e rejeita o controle de aliados ou adversários pelo caminho do jogador. Se ele for eliminado, a batalha prossegue entre os bots; não há transferência de controle.

Cada um dos sete bots escolhe um adversário vivo com menor vida, sem bônus ocultos. Há espera de **3,2 segundos** antes de cada decisão automática, inclusive a dos aliados, além da transição de impacto de 650 ms (200 ms com efeitos reduzidos). O turno humano aguarda uma ação sem limite de tempo. Entre rodadas, o teste aguarda **Próxima rodada**.

Esta versão não implementa conexões online. A distinção de controlador fica explícita no estado e no registro exportado para futura evolução.

Os diálogos de detalhes suspendem decisões automáticas enquanto estão abertos. Ao ocultar a página, as ações são pausadas; o relógio continua medindo a duração da série. Reiniciar cancela ações pendentes antes de criar outra sessão.

## Arquivos e verificações

`js/lab/characters.js` contém os 32 registros de cartas, caminhos para os arquivos e atributos impressos. `assets/characters-v047/manifest.json` registra os hashes dos PNGs originais. [Lista completa](CARTAS_KIT.md).

`js/lab/battle.js` contém o modelo independente. `js/ui/battle_lab.js` controla a tela e os turnos automáticos. `css/battle_lab.css` contém a composição visual. O CardTouch de `js/ui/card_touch.js` continua reutilizado; agora mostra “—” para ataque ausente, preservando os valores numéricos do experimento anterior.

`tests/battle_lab.test.js` executa uma série determinística completa e testa rejeição de ações inválidas. `npm run test:battle` percorre a interface real, usa relógio controlado para verificar uma série inteira e também testa toque.

`npm run package:battle` gera `downloads/batalha-v0.48.0.zip`. A única adaptação da página no ZIP isolado é o link de retorno, que passa a abrir uma nova sessão em vez de apontar para o laboratório ausente no pacote. Todos os módulos da batalha são idênticos aos do projeto completo.

## Artes pendentes

Cada “?” identifica uma peça sem arte definitiva. Os botões de marcação explicam o que enviar. Consulte [ARTES_PENDENTES.md](ARTES_PENDENTES.md). Nenhuma arte nova foi gerada; as silhuetas são marcações provisórias solicitadas pelo usuário.
