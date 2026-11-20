# Desenvolvimento

Esta edição contém a abertura, o menu inicial, os módulos de apresentação e o laboratório separado em laboratorio.html.

1. Rode `npm test` antes de alterar telas.
2. Mantenha o código de apresentação em `js/ui/`, os estilos em `css/` e a versão em `js/config.js`.
3. Preserve a abertura obrigatória e a espera por tecla ou toque na apresentação. A música deve continuar da apresentação para o menu sem reiniciar.
4. Na v0.54.0, o usuário autorizou conectar somente o Play do computador à arena 4×4. Ele abre batalha.html?from=menu após a abertura obrigatória; a arena oferece retorno ao menu. Os demais ícones continuam decorativos e o celular mantém o comportamento anterior. O sistema de favorito foi removido na v0.42.0: não recrie seletor, troca ou preferência salva sem novo pedido. O menu não modifica progresso.
5. Use `npm run dev` para testar e `npm run test:browser` para a validação com Playwright e Chromium, quando disponíveis.

O aplicativo não possui dependências de terceiros para execução. `tests/fixtures/presentation-assets.json` registra os hashes dos recursos preservados na redução para o menu. Não altere esse registro apenas para acomodar mudanças acidentais nas artes ou nos áudios.

## Celular preservado

Por solicitação do usuário a partir da v0.40.1, não altere o visual nem o comportamento da versão de celular sem uma nova instrução explícita. As mudanças de pivô e animação ficam em `desktop_character.js` e `desktop_character.css`, ativadas apenas no computador com ponteiro preciso. Verificações de regressão do celular são permitidas.

## Entregas por versão

No computador, preserve o tamanho e o enquadramento aprovados na v0.40.0. Não amplie as artes para esconder seus cortes, nem aplique zoom nas animações. O acabamento das extremidades fica na máscara de transparência exclusiva de computador; a entrada deve terminar em repouso.

A cada atualização, revise os controles afetados e incremente a versão em `package.json` e `G.CONFIG.version` (`js/config.js`). Registre as mudanças em `docs/HISTORICO.md`, atualize o README e execute as validações pertinentes. Publique cada versão com uma tag Git `vX.Y.Z` e forneça o link do ZIP dessa tag para teste.

## Laboratório e entregas duplas

Experimente novas mecânicas no laboratório independente antes de integrá-las ao jogo. Não conecte módulos de teste ao menu ou ao progresso real sem pedido explícito. Valores fictícios devem ser identificados. Cada atualização deve fornecer dois downloads com a mesma versão: a parte alterada pronta para testar isoladamente e o projeto completo. Use scripts/package-laboratorio.py para empacotar o laboratório e execute npm run test:lab ao alterar suas interações.

A arena 4×4 é um experimento independente em batalha.html. Ao alterá-la, execute npm run test:battle e gere sua prévia com npm run package:battle. Não atribua habilidades pessoais ou efeitos de itens/apoios sem definição do usuário. As regras de teste estão em docs/ARENA_4X4.md.

Na arena, o jogador escolhe e controla somente um personagem. Os três aliados e os quatro adversários são bots; a eliminação do jogador não transfere o controle. A habilidade principal usa a estrela original recebida, fixa junto ao painel do jogador e com informações abertas somente por clique.

Use apenas ícones e ilustrações fornecidos pelo usuário. Quando uma arte estiver faltando, marque seu lugar com uma silhueta aproximada e “?”, indicando qual arquivo falta. Essas marcações foram explicitamente solicitadas; não crie uma ilustração definitiva para substituí-las. Mantenha docs/ARTES_PENDENTES.md atualizado.

O kit de 32 cartas da v0.47.0 fica em assets/characters-v047/ e js/lab/characters.js. Preserve os PNGs originais e seus hashes. O usuário autorizou vida e dano impressos, inclusive multiplicadores; os efeitos especiais e de classe aguardam regras. Ataque “—” é null, não um valor arbitrário. Consulte docs/CARTAS_KIT.md antes de alterar atributos.

O painel da v0.48.0 usa os PNGs originais em assets/player-panel-v048/. Preserve seus hashes. O componente js/ui/player_panel.js é compartilhado por batalha.html e painel.html; execute npm run test:panel e gere npm run package:panel ao alterá-lo. Fôlego vem do losango das cartas e é somente exibido: consumo e recuperação aguardam regras do usuário. Os controles de painel.html são uma simulação isolada.

O placar original da v0.49.0 fica em assets/scoreboard-v049/. Preserve os bytes do PNG: o enquadramento das margens transparentes é feito em css/scoreboard.css. js/ui/scoreboard.js só apresenta valores; a pontuação e o tempo continuam vindo do modelo da batalha. Execute npm run test:scoreboard e gere npm run package:scoreboard ao alterar o componente ou sua prévia placar.html. A composição anterior da arena de celular fica em .legacy-scoreboard e deve ser preservada.

As 18 faixas CC da fila de turnos ficam em assets/turn-order-v050/. Preserve os PNGs originais e os hashes do manifesto. Os caminhos queueArt em js/lab/characters.js só apresentam a faixa: não substituem a carta nem o retrato do painel. Enquadre somente as margens transparentes por CSS e mantenha a composição anterior de celular. Consulte docs/FAIXAS_PERSONAGENS.md para a correspondência das variantes.

Os apoios da v0.51.0 usam os 19 PNGs originais em assets/supports-v051/; preserve os hashes. O usuário confirmou um uso por carta em toda a série, apenas na vez do jogador, sem gastar o ataque. Quatro efeitos claros estão ativos; as outras seis regras continuam pendentes em js/lab/supports.js e docs/APOIOS.md. Não recarregue cartas usadas entre rodadas. A partir da v0.52.0, o usuário determinou um apoio novo por reset completo da hierarquia de velocidade: cada cópia tem um uso. Na v0.53.0, o usuário limitou a mão a três e pediu recebimento discreto: entrada automática com vaga ou carta usada; com mão cheia, escolha de substituição exata ou descarte da nova carta. Não crie reserva de excedentes nem abra modal automático. O próximo turno aguarda uma única oferta até a decisão. Preserve efeitos já ativados ao trocar sua carta, sem duplicar o efeito; a troca só existe para a nova oferta. A prévia apoios.html compartilha o modelo e a UI com a arena, mas seus ajustes manuais de vida e turno ficam somente em supports_preview.js. Execute npm run test:supports e npm run package:supports ao alterar esta parte. O HUD novo e a preparação na arena são exclusivos de computador.

A hierarquia de computador usa speed de js/lab/characters.js, transcrito do pico superior das cartas. Ordem decrescente, eliminados ignorados, empates por prioridade de equipe alternada por rodada e posição. Sarck tem velocidade null e aguarda regra especial do usuário: mantenha-o consultável e fora das equipes desse modo. O modo anterior do celular usa speedOrder:false. Preserve a cobertura em tests/speed_cycles.test.js e nunca conceda apoio por renderização, abertura de diálogo ou início de rodada.

Na v0.55.0, `card_values.js` sobrepõe vida e ataque atuais nas artes somente nas sessões de computador. Preserve os encaixes das 32 cartas, a proporção com os PNGs e os arquivos originais. Use `attackPower` do modelo para o dano com bônus; não altere baseAtk/atk para apresentar apoios. Fôlego e velocidade não ganham regras novas. Verifique campo, inspeção ampliada, retrato sem ilustração isolada, CardTouch, cura, zero, multiplicadores, consumo e próxima rodada; celular continua sem a camada.
