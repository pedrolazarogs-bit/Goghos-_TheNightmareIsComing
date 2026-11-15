# Desenvolvimento

Esta edição contém somente a abertura, o menu inicial e os módulos de apresentação preservados.

1. Rode `npm test` antes de alterar telas.
2. Mantenha o código de apresentação em `js/ui/`, os estilos em `css/` e a versão em `js/config.js`.
3. Preserve a abertura obrigatória e a espera por tecla ou toque na apresentação. A música deve continuar da apresentação para o menu sem reiniciar.
4. Os elementos visuais do menu não devem abrir telas, modificar progresso ou iniciar partidas.
5. Use `npm run dev` para testar e `npm run test:browser` para a validação com Playwright e Chromium, quando disponíveis.

O aplicativo não possui dependências de terceiros para execução. `tests/fixtures/presentation-assets.json` registra os hashes dos recursos preservados na redução para o menu. Não altere esse registro apenas para acomodar mudanças acidentais nas artes ou nos áudios.

## Entregas por versão

A cada atualização, revise os controles afetados e incremente a versão em `package.json` e `G.CONFIG.version` (`js/config.js`). Registre as mudanças em `docs/HISTORICO.md`, atualize o README e execute as validações pertinentes. Publique cada versão com uma tag Git `vX.Y.Z` e forneça o link do ZIP dessa tag para teste.
