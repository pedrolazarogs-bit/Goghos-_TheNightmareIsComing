# Validação — v0.40.3

Validação em Chromium headless e Node.js, em 15/11/2026.

## Fundo do menu

Revisão visual em 1366 × 768 e 1024 × 768 no computador: a área antes coberta pelo triângulo preto mostra o cenário colorido. O arquivo original `assets/menu-v036/bg.jpg` e os pontos da divisão do personagem permanecem iguais.

A regra que oculta o triângulo se aplica somente a janelas em paisagem com pelo menos 900 px de largura, hover e ponteiro preciso. Verificados também 390 × 844 e 1024 × 768 com toque: a aparência original do celular permanece preservada, inclusive em paisagem.

[Prévia do menu sem o triângulo](previews/menu-v0.40.3-desktop.png)

## Testes

`npm test` passou: integridade dos recursos originais e dos 11 áudios, controle do menu, 9 testes do carregamento, 15 da abertura obrigatória e 11 da trilha.

`npm run test:browser` passou no computador e no celular, percorrendo o fluxo completo: abertura obrigatória, espera por tecla/toque, música contínua, cinco favoritos, foco, salvamento, falha do armazenamento, personagem dentro da divisão e animação de vitória preservada.

A comparação dos cinco personagens em 390 × 844, 320 × 568 e 844 × 390 com a referência móvel da v0.40.0 passou: os 15 enquadramentos continuam idênticos, incluindo posições, transformações, recorte e ausência de animações. O seletor, as artes e o módulo de animação dos personagens não foram alterados nesta entrega.

`git diff --check` passou. Nenhuma exceção JavaScript nas verificações de navegador.
