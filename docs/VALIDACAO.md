# Validação — v0.49.0

Revisão em 18/11/2026, com Node.js e Chromium.

- `npm test`: aprovado antes e depois da integração. Recursos originais, menu, abertura, áudio, laboratório e modelo da arena preservados. As 32 escolhas e 1.793 ações do modelo continuam passando.
- `npm run test:scoreboard`: aprovado no projeto e nos arquivos extraídos do ZIP de entrega. Conferidos início em 0 × 0, bloqueio antes de iniciar, pontos das duas equipes, empate 2 × 2 na quinta rodada, vitória aos três, bloqueio após o resultado e reinício completo.
- Cronômetro testado acima de uma hora (61:02), sem reiniciar entre pontos e congelando após a vitória final. O valor mostrado na arena também foi comparado ao tempo final do modelo.
- Pontos, vencedor e relógio do novo placar foram conferidos durante uma série completa de `npm run test:battle`. Preservados um jogador, sete bots, espera de 3,2 segundos, mortes, CardTouch, teclado, pausa, exportação e reinício sem ações antigas.
- `npm run test:lab`: aprovado no laboratório e no experimento CardTouch, com mouse e toque.
- A revisão visual encontrou pouco espaço entre o relógio e as cartas; a composição do placar na arena foi ajustada para caber acima delas. O teste agora verifica esse limite, além do carregamento do PNG correto.
- A animação breve dos pontos termina sem repetição. O teste aguarda o término real da animação nativa do Chromium, separado do relógio simulado da série. Com efeitos reduzidos, não há animação.
- Na arena com toque, o placar anterior permanece visível e o novo fica oculto. A prévia isolada se ajusta a janelas estreitas e permite testar os pontos por toque, sem rolagem horizontal.
- PNG comparado byte a byte ao arquivo do ZIP recebido e ao SHA-256 do manifesto. Nenhum pixel foi alterado; apenas as margens transparentes são enquadradas por CSS.
- Prévia do placar, arena, laboratório e painel empacotados na v0.49.0. Integridade dos quatro ZIPs, referências locais e correspondência dos módulos com o projeto verificadas. As únicas adaptações nas páginas isoladas são os links de navegação documentados.

[Prévia do placar](previews/placar-v0.49.0.png) · [Resultado 3 × 2](previews/placar-v0.49.0-resultado.png) · [Placar na arena](previews/batalha-v0.49.0-desktop.png)

[Arte, regras e prévia do placar](PLACAR.md) · [Estrutura da arena](ARENA_4X4.md) · [Artes pendentes](ARTES_PENDENTES.md)
