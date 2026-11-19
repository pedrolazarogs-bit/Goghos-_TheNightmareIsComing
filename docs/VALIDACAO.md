# Validação — v0.54.0

Revisão em 19/11/2026 (America/Sao_Paulo), com Node.js e Chromium.

- `npm test`: aprovado antes e depois das alterações. Abertura, áudio, recursos originais, atributos impressos e mecânicas de apoio preservados. Séries anteriores com 1793 e 1699 ações mantidas.
- `npm run test:browser`: aprovado no computador e no celular. Play abre a seleção real da batalha por mouse e Enter; é um botão nativo com foco de teclado. Seleção de Nully, oito cartas, um personagem controlado e ataque de 80 conferidos nos dois acessos. Retorno ao menu restaura a abertura obrigatória; Play só é habilitado após sua conclusão. Progresso local não é alterado.
- Os outros nove elementos do menu de computador continuam decorativos; no celular, os dez elementos mantêm o comportamento anterior. A indicação 4×4 aparece somente no computador.
- Verificados carregamento antes da apresentação, espera por tecla/toque, música contínua da apresentação ao menu, imagem do personagem parada dentro da divisão, ausência de favorito, animação de vitória e redimensionamento. A navegação completa encerra a página e os tocadores do menu.
- `npm run test:battle`: aprovado com uma série inteira, hierarquia, apoios, troca/descarte, espera dos bots, pausa, pontuação, relógio, exportação, reinício, teclado e toque. O acesso direto preserva a navegação do laboratório.
- Revisão visual: botão Play mantém a arte, o tamanho e os efeitos existentes; não foram criadas molduras ou ilustrações novas.

- Os seis ZIPs passaram na verificação de integridade e comparação dos arquivos com o projeto. A prévia de menu e batalha inclui os recursos da apresentação e foi extraída em outra pasta; nela, `test:browser` passou novamente no computador por HTTP local, incluindo mouse, teclado, áudio, ataque e retorno. Nenhum recurso ausente ou erro JavaScript.

[Menu com Play e modo 4×4](previews/menu-v0.54.0-play.png)

[Arena 4×4](ARENA_4X4.md) · [Regras dos apoios](APOIOS.md)
