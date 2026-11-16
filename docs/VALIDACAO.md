# Validação — v0.42.0

Validação em Node.js e Chromium em 16/11/2026.

- `npm test`: aprovado, incluindo ausência de botão/seletor de favorito, arte fixa mesmo com preferência antiga, integridade das artes e dos 11 áudios, abertura obrigatória e trilha sonora.
- `npm run test:browser` passou no computador e no celular. Verifica cliques e teclado sem abrir seletor, inexistência do módulo FavoritePicker, personagem dentro da divisão, música contínua e vitória preservada. Após gravar uma preferência antiga de Sam e recarregar, a arte continua sendo Unicorn e a abertura continua obrigatória.
- Removidos os arquivos de implementação e estilo do seletor e a validação específica de troca de favoritos, que deixou de existir.
- Mantidos os estilos e dimensões da composição; removidos o rótulo de favorito e a instrução de troca.

[Prévia do menu sem favorito](previews/menu-v0.42.0-desktop.png)
