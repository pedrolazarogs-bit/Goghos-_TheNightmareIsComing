# Arena 4×4 — estrutura de teste v0.54.0

Abra `batalha.html` ou use **Abrir campo de batalha** no laboratório. No computador, o Play do menu também abre a seleção desta arena. Nesse acesso, o link ← Menu retorna a index.html; quando aberta pelo laboratório, continua exibindo ← Laboratório. A arena não grava progresso.

## Série, rodadas e tempo

Você escolhe um personagem da equipe azul. Seus três aliados e os quatro oponentes são bots. Há exatamente um personagem sob seu controle, identificado por ID durante toda a série. A escolha é preservada entre rodadas; não é o antigo sistema de favorito do menu.

Cada equipe possui quatro personagens diferentes entre si. A seleção mostra 32 cartas; no computador, 31 podem iniciar a batalha. Sarck permanece consultável, mas não entra nas equipes enquanto sua regra especial de velocidade estiver pendente. As oito posições da partida usam arquivos distintos. Nomes iguais em duas artes permanecem como entradas separadas. Eliminar os quatro adversários concede exatamente um ponto à equipe vencedora. Ao continuar, as duas equipes são restauradas; o placar permanece. A primeira equipe com três pontos encerra a série, em três a cinco rodadas.

O cronômetro usa tempo monotônico desde **Iniciar batalha** até a vitória final. Ele não é regressivo, não reinicia entre rodadas e inclui intervalos, pausas e inspeções. No resultado final, seu valor fica congelado.

## Ordem e ações

No computador, o número no pico superior da carta define a velocidade. A ordem é decrescente: o mais rápido age primeiro, o mais lento por último. Em empate, a equipe azul tem prioridade nas rodadas ímpares e a vermelha nas pares; dentro do mesmo time, vale a posição da carta. Esta convenção mantém os empates determinísticos até uma regra específica. Eliminados não recebem vez.

Quando todos os personagens ainda vivos completam sua vez, o ciclo termina e a hierarquia volta ao mais rápido vivo. A velocidade impressa não é reduzida nem confundida com fôlego. Passar a vez também conclui a participação no ciclo. A coluna direita mostra a velocidade e o número do ciclo atual.

Cada reset efetivo concede exatamente uma carta de apoio ao jogador. O sorteio usa somente os quatro efeitos já definidos. O recebimento usa um aviso compacto junto aos apoios. Com vaga ou um apoio usado, a carta entra automaticamente; com três cartas disponíveis, o jogador escolhe **Trocar** e clica no ícone que sairá, ou **Descartar nova**. Há no máximo três cartas na mão e uma oferta aguardando decisão, sem reserva de excedentes. O próximo turno aguarda essa decisão no próprio HUD; o relógio continua. A arte completa só abre por clique. Cartas aceitas permanecem entre rodadas e desaparecem ao reiniciar a sessão. Iniciar a série, avançar de rodada, terminar a série, abrir diálogos ou redesenhar a UI não concede cartas. [Detalhes dos apoios](APOIOS.md).

Sarck tem “—” no topo. Sua regra especial será enviada pelo usuário; nenhum valor ou posição foi inventado. A versão de celular mantém a ordem alternada e o comportamento anteriores, sem esta nova mecânica.

A coluna direita mostra o próximo personagem vivo, o personagem da vez e o último que efetivamente atacou. No computador, as 18 faixas CC recebidas mostram a arte completa do personagem; onde falta a faixa, aparece uma silhueta com “?”. A fila anterior de celular foi preservada. As faixas podem ser clicadas para inspeção. [Artes e correspondência](FAIXAS_PERSONAGENS.md). A ação é revalidada no modelo: ator correto, alvo de outra equipe, ambos vivos, rodada ativa e não pausada. Um clique repetido ou callback antigo não concede outro ataque.

Vida e dano são transcritos das cartas recebidas; multiplicadores impressos são aplicados ao total do ataque. O dano efetivo é limitado à vida restante do alvo. Habilidades pessoais, atributos de classe e itens ainda aguardam regras. Quatro apoios aplicam os efeitos definidos nas cartas recebidas, sem alterar os atributos impressos. Os demais apoios mostram suas pendências. [Regras e preparação](APOIOS.md).

## Campo e interface

- Campo com piso em perspectiva e cartas retas em duas profundidades. As artes faltantes usam silhuetas com “?”, conforme solicitado; as peças recebidas são preservadas.
- Placar no computador com a arte original recebida, número de vitórias de cada equipe nas faixas coloridas e cronômetro crescente abaixo. Rodada e meta de três vitórias acompanham o relógio. Composição anterior de celular preservada. [Placar e prévia isolada](PLACAR.md).
- Painel fixado no personagem do jogador no canto direito: retrato, vida, dano, fôlego e situação. A base e os ícones usam as artes recebidas na v0.48.0. Inspecionar outra carta não troca esse painel.
- Estrela original do CardTouch, fixa junto ao painel direito, sem animação nem moldura de botão. Clique nela para consultar a habilidade principal; o conteúdo permanece fechado antes do clique.
- Ataque básico e espaço de item no centro inferior. A habilidade principal não aparece como uma ação adicional.
- Três espaços de apoio no canto esquerdo: carta completa na preparação e ícones pequenos na batalha; recebimento por reset discreto, com consulta à arte por clique. Uso único por cópia em toda a série, no turno do jogador, sem gastar o ataque. As seis regras ambíguas permanecem bloqueadas.
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

`tests/battle_lab.test.js` conserva a cobertura do modo anterior e testa rejeição de ações inválidas. `tests/speed_cycles.test.js` confere as 31 velocidades, Sarck pendente, empates, eliminados, resets, cópias recebidas, limite de três e séries completas no modo novo. `npm run test:battle` percorre a interface real, usa relógio controlado para verificar uma série inteira e também testa toque.

`npm run package:battle` gera `downloads/batalha-v0.54.0.zip`. A única adaptação da página no ZIP isolado é o link de retorno, que passa a abrir uma nova sessão em vez de apontar para o laboratório ausente no pacote. Todos os módulos da batalha são idênticos aos do projeto completo.

## Artes pendentes

Cada “?” identifica uma peça sem arte definitiva. Os botões de marcação explicam o que enviar. Consulte [ARTES_PENDENTES.md](ARTES_PENDENTES.md). Nenhuma arte nova foi gerada; as silhuetas são marcações provisórias solicitadas pelo usuário.
