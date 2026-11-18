# Desenvolvimento

Esta edição contém a abertura, o menu inicial, os módulos de apresentação e o laboratório separado em laboratorio.html.

1. Rode `npm test` antes de alterar telas.
2. Mantenha o código de apresentação em `js/ui/`, os estilos em `css/` e a versão em `js/config.js`.
3. Preserve a abertura obrigatória e a espera por tecla ou toque na apresentação. A música deve continuar da apresentação para o menu sem reiniciar.
4. Todos os elementos do menu são decorativos. O sistema de favorito foi removido na v0.42.0: não recrie seletor, troca ou preferência salva sem novo pedido. Nenhum elemento deve abrir telas, modificar progresso ou iniciar partidas.
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
