# Validação — v0.44.0

Validação em Node.js e Chromium em 17/11/2026.

- `npm test` passou: testes existentes de recursos, menu, abertura, áudio e modelo do laboratório.
- A mesa anterior continua passando nos testes de seleção, movimentação, dano/cura, teclado, detalhes, exportação e reinício.
- CardTouch testado em 1440 × 1000 com mouse e 390 × 844 com toque: ciclo de cliques, botão condicionado à vez, detalhes, indicadores, fonte German Beauty carregada, Escape, fechamento explícito, teclado e redimensionamento.
- Painel e botão conferidos dentro da tela e sem sobreposição entre si. Rolagem automática anterior ao clique não encerra a interação recém-aberta.
- Ataque verificado no alvo correto, com 25 PV de dano e encerramento de vez; o outro oponente mantém sua vida. Alvo com zero PV continua inspecionável, sem oferecer ataque. Reinício restaura as duas cartas.
- Os quatro PNGs são idênticos aos arquivos enviados. A fonte é o TTF original do menu, incluído no pacote separado.
- A página `oponente.html`, que abre somente a interação nova, também passou nos testes de computador e toque do ZIP extraído.
- `npm run test:lab` também passou contra o ZIP isolado extraído e servido por HTTP local. Não houve erros JavaScript ou recursos ausentes.
- Menu, versão móvel do jogo e combate real não foram modificados; apenas a versão global foi incrementada. A nova interação fica no laboratório.

[Computador](previews/oponente-v0.44.0-desktop.png) · [Toque no laboratório](previews/oponente-v0.44.0-mobile.png)
