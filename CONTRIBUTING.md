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
