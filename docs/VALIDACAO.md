# Validação da arena v0.56.0

O modelo da série é idêntico ao arquivo js/lab/battle.js do ZIP enviado. O teste de navegador do pacote extraído cobre seleção duplicada, oito cartas, três modos, ataque de 25, consulta pela fila e pausa. As cartas mostram a vida do modelo da partida.

[Captura da arena](previews/arena-original-v0.56.0.png)

# Validação — v0.55.0

Revisão em 19/11/2026 (America/Sao_Paulo), com Node.js e Chromium.

- `npm test`: modelo, recursos originais e regras anteriores aprovados. Nova cobertura das 32 cartas, vida zero, cura limitada, multiplicador com bônus único, efeito preservado após trocar o apoio, consumo e restauração de rodada. A apresentação não altera o estado da batalha.
- `npm run test:battle`: série completa aprovada, comparando os números das oito artes com o estado após as ações e na próxima rodada. Carta ampliada também mostra a vida atual. Hierarquia, apoios, pontuação, teclado, tempo de bot, pausa, exportação e reinício preservados.
- `npm run test:supports`: prévia e integração aprovadas. Nully mostra 130 na carta, na inspeção e no painel com Na Moleira; após atacar, volta a 80 e a vida de Penxy passa de 500 a 370. Cura, escudo e Papakill mantêm seus testes anteriores.
- Revisão visual das 32 artes: encaixes próprios para números e multiplicadores, com a fonte original e as cores do fundo. Arquivos PNG preservados. Campo e carta ampliada usam a mesma proporção da arte.
- Regressão do celular aprovada: sem a camada nova; geometria do painel, apoios, fila e placar preservada. O modelo anterior mantém seus resultados.



[Arena 4×4](ARENA_4X4.md) · [Cartas e valores](CARTAS_KIT.md)
