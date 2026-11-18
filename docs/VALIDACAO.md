# Validação — v0.45.0

Revisão em 17/11/2026, com Node.js e Chromium.

- `npm test`: aprovado, incluindo recursos originais, menu, abertura, áudio, laboratório e modelo da arena. A série determinística percorreu 145 ataques e terminou com uma equipe em três pontos.
- `npm run test:battle`: aprovado no projeto. Verifica equipes sem duplicatas internas, oito cartas, três apoios, CardTouch, alvo correto, ordem dos turnos, pausa, inspeção de espaços sem efeitos, redução de movimento e uma série completa até a vitória.
- Conferidos o congelamento do cronômetro final, exportação JSON, nova série, teclado, redimensionamento e ataque por toque em paisagem.
- A prévia foi extraída do ZIP e validada por servidor HTTP local, incluindo seus recursos visuais e fonte.
- `npm run test:lab`: aprovado para as interações anteriores, com mouse e toque.
- As telas do menu e da abertura não receberam alterações. A versão global foi incrementada e o laboratório ganhou o acesso à arena.

A primeira revisão da prévia detectou transbordamento durante o redimensionamento. O contêiner da arena passou a delimitar também os elementos posicionados, mantendo o campo recortado durante a atualização de escala.

[Campo](previews/batalha-v0.45.0-desktop.png) · [Interação no oponente](previews/batalha-v0.45.0-alvo.png) · [Resultado da série](previews/batalha-v0.45.0-resultado.png)

[Regras e estrutura desta versão](ARENA_4X4.md)
