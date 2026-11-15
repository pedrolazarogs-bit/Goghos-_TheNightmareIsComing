# Validação — v0.40.2

Validação em Chromium headless e Node.js, em 15/11/2026.

## Computador

`npm test` passou: integridade dos recursos originais e dos 11 áudios, controle do menu, 9 testes do carregamento, 15 da abertura obrigatória e 11 da trilha.

`npm run test:desktop-character` passou em 1366 × 768 e 1024 × 768:

- Entrada do personagem e escolha de cada um dos cinco favoritos com apenas uma execução.
- Amostras em 0%, 25%, 50%, 75% e no término da animação: largura e altura iguais às aprovadas na v0.40.0, sem ampliação. O enquadramento final também coincide com essa versão, com tolerância de 0,1 px para arredondamento do navegador.
- Capturas com fundo transparente verificam o alfa renderizado nas extremidades, incluindo a máscara CSS: nenhuma borda amostrada supera 32/255 (tolerância de antialiasing). O centro da arte conserva pixels opacos; a imagem não é escondida por inteiro.
- Após terminar, nenhuma animação permanece no personagem e sua posição não muda durante a observação.
- Fechar o seletor sem escolher não reinicia a animação.
- Movimento reduzido e mudança para uma janela em retrato interrompem as animações.
- Nenhuma exceção JavaScript.

`npm run test:browser` passou no computador e no celular, percorrendo o fluxo completo: abertura obrigatória, espera por tecla/toque, música contínua, cinco favoritos, foco, salvamento, falha do armazenamento, comparação do recorte e animação de vitória preservada.

## Celular preservado

Antes da implementação foram registradas as posições do botão e da imagem, transformação, origem, recorte e quantidade de animações dos cinco personagens em 390 × 844, 320 × 568 e 844 × 390, com toque habilitado.

A comparação após a mudança passou: os 15 enquadramentos são idênticos à v0.40.0. Os arquivos CSS compartilhados, o seletor e as artes de celular não foram alterados. O fluxo móvel da suíte completa também é verificado como regressão; não recebeu recursos novos.

## Revisão visual

Capturas dos cinco personagens no computador revisadas, incluindo o tamanho restaurado e o acabamento gradual das extremidades das artes. `git diff --check` passou.

[Unicorn](previews/unicorn-v0.40.2-desktop.png) · [Sam](previews/sam-v0.40.2-desktop.png) · [Sark](previews/sarck-v0.40.2-desktop.png) · [Nully](previews/nully-v0.40.2-desktop.png) · [Mike](previews/mike-v0.40.2-desktop.png)
