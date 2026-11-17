# Validação — v0.43.0

Validação em 17/11/2026, com Node.js e Chromium.

- `npm test` passou, incluindo os testes existentes de menu, abertura e áudio e o novo modelo do laboratório: seleção, vida limitada, entradas inválidas, bloqueio sem vida, movimento e limite de 100 eventos.
- `npm run test:lab` passou em 1440 × 1000 e 390 × 844: seleção, dano/cura, movimentação, detalhes, teclado, exportação JSON, reinício e ausência de erros JavaScript/rolagem horizontal.
- A mesma validação foi executada sobre o ZIP isolado extraído e servido separadamente, verificando que ele contém todos os recursos necessários.
- O navegador gerenciado bloqueia URLs file:// por política; a validação automatizada utilizou servidor HTTP local. O pacote usa somente HTML, CSS, scripts clássicos e imagens locais, sem fetch ou dependências externas.
- O laboratório não importa módulos de progresso do jogo, não escreve localStorage e não altera as telas do menu. Apenas a versão global foi incrementada.

[Prévia do laboratório](previews/laboratorio-v0.43.0-desktop.png)
