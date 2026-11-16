# Validação — v0.41.0

Revisão em Chromium e Node.js em 16/11/2026.

- `npm run test:browser`: aprovado no computador e no celular; abertura obrigatória, música contínua, seletor, persistência, recorte do personagem e vitória preservados.
- `npm test`: recursos originais, abertura obrigatória, preferências e áudio aprovados.
- Os quatro PNGs recebidos foram copiados sem edição; hashes registrados em `assets/menu-v041/manifest.json`.
- Os cinco favoritos foram selecionados na revisão visual. Dimensões e enquadramento permanecem iguais à versão aprovada.
- Comparação móvel aprovada: 15 enquadramentos idênticos à referência preservada, em 390 × 844, 320 × 568 e 844 × 390.
- Os novos elementos são decorativos, sem ouvintes de clique ou telas internas. Apenas o favorito mantém seu seletor.

A comparação de pixels do teste de navegador considera a caixa completa da imagem com margem para o brilho de foco. Isso exclui diferenças de rasterização do cenário fora da área onde o personagem pode ser desenhado, mantendo a verificação exata do limite do painel.

[Prévia do menu atualizado](previews/menu-v0.41.0-desktop.png)
