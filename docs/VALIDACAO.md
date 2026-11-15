# Validação — v0.40.1

Validação em Chromium headless e Node.js, em 15/11/2026.

## Computador

`npm test` passou: integridade dos recursos originais e dos 11 áudios, controle do menu, 9 testes do carregamento, 15 da abertura obrigatória e 11 da trilha.

`npm run test:desktop-character` passou em 1366 × 768 e 1024 × 768:

- Entrada do personagem e escolha de cada um dos cinco favoritos com apenas uma execução.
- Amostras em 0%, 25%, 50%, 75% e no término da animação: nenhum pixel opaco das extremidades originais das artes aparece no interior do painel. A medição considera a área coberta pelo contorno de 18 px.
- Após terminar, nenhuma animação permanece no personagem e sua posição não muda durante a observação.
- Fechar o seletor sem escolher não reinicia a animação.
- Movimento reduzido e mudança para uma janela em retrato interrompem as animações.
- Nenhuma exceção JavaScript.

`npm run test:browser` passou no computador e no celular, percorrendo o fluxo completo: abertura obrigatória, espera por tecla/toque, música contínua, cinco favoritos, foco, salvamento, falha do armazenamento, comparação do recorte e animação de vitória preservada.

## Celular preservado

Antes da implementação foram registradas as posições do botão e da imagem, transformação, origem, recorte e quantidade de animações dos cinco personagens em 390 × 844, 320 × 568 e 844 × 390, com toque habilitado.

A comparação após a mudança passou: os 15 enquadramentos são idênticos à v0.40.0. Os arquivos CSS compartilhados, o seletor e as artes de celular não foram alterados. O fluxo móvel da suíte completa também é verificado como regressão; não recebeu recursos novos.

## Revisão visual

Capturas dos cinco personagens no computador revisadas, incluindo a ocultação das extremidades das artes. `git diff --check` passou.

[Unicorn](previews/unicorn-v0.40.1-desktop.png) · [Sam](previews/sam-v0.40.1-desktop.png) · [Sark](previews/sarck-v0.40.1-desktop.png) · [Nully](previews/nully-v0.40.1-desktop.png) · [Mike](previews/mike-v0.40.1-desktop.png)
