# Validação — v0.46.0

Revisão em 17/11/2026, com Node.js e Chromium.

- `npm test`: aprovado antes e depois da alteração. Os testes preservam abertura, menu, áudio e recursos originais. O modelo da arena verifica as cinco escolhas, exatamente um jogador e sete bots, rejeição de controle dos bots, continuação após a morte do jogador e uma série de 145 ataques.
- `npm run test:battle`: aprovado no projeto. Verifica cartas retas, estrela original sem movimento e fora dos espaços de ação, detalhes somente ao clicar, painel fixado no personagem escolhido e todos os marcadores de artes pendentes.
- O navegador confirmou que os bots não atacam antes de 3,2 segundos, inclusive os aliados; o turno humano aguarda clique. Pausa, morte do jogador, série até três vitórias, congelamento do relógio final, exportação JSON e reinício sem ações antigas também foram exercitados.
- `npm run test:lab`: aprovado nas interações anteriores de cartas e CardTouch, com mouse e toque.
- A revisão visual corrigiu o piso em perspectiva que encobria parte da equipe azul. Ajustado também o espaço de vida e dano nas cartas para manter os valores legíveis.
- Menu, abertura, áudios e versão de celular do jogo não receberam alterações; somente a versão global e os experimentos separados do laboratório foram atualizados.

A prévia é extraída de `downloads/batalha-v0.46.0.zip` e testada por HTTP local com o mesmo roteiro completo da arena, incluindo teclado, redimensionamento e toque em paisagem. Seus módulos e recursos são comparados com os do projeto; somente o link de retorno da página muda para “Nova sessão”.

[Campo e marcações](previews/batalha-v0.46.0-desktop.png) · [Interação no oponente](previews/batalha-v0.46.0-alvo.png) · [Resultado da série](previews/batalha-v0.46.0-resultado.png)

[Regras e estrutura](ARENA_4X4.md) · [Artes pendentes](ARTES_PENDENTES.md)
