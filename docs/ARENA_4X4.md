# Arena 4×4 — estrutura de teste v0.45.0

Abra `batalha.html` ou use **Abrir campo de batalha** no laboratório. A arena não é carregada pelo menu principal e não grava progresso.

## Série, rodadas e tempo

Cada equipe possui quatro personagens. Eliminar os quatro adversários concede exatamente um ponto à equipe vencedora. Ao continuar, as duas equipes são restauradas; o placar permanece. A primeira equipe com três pontos encerra a série, em três a cinco rodadas.

O cronômetro usa tempo monotônico desde **Iniciar batalha** até a vitória final. Ele não é regressivo, não reinicia entre rodadas e inclui intervalos, pausas e inspeções. No resultado final, seu valor fica congelado.

## Ordem e ações

A rodada alterna Azul 1, Vermelho 1, Azul 2, Vermelho 2, e assim por diante. Eliminados são ignorados. Na rodada seguinte, a equipe que inicia é alternada. Essa ordem é provisória e não atribui velocidade aos personagens.

A coluna direita mostra o próximo personagem vivo, o personagem da vez e o último que efetivamente atacou. Os retratos podem ser clicados para inspeção. A ação é revalidada no modelo: ator correto, alvo de outra equipe, ambos vivos, rodada ativa e não pausada. Um clique repetido ou callback antigo não concede outro ataque.

Apenas o ataque básico está definido: todos têm 100 PV e 25 de dano para este teste. Nenhuma habilidade pessoal, atributo de classe, item ou efeito de apoio foi criado. Os espaços de inspeção indicam isso explicitamente.

## Campo e interface

- Campo com piso em perspectiva, horizonte, luzes suaves e duas profundidades de cartas.
- Placar azul/vermelho com três marcadores por equipe, número de rodada e tempo crescente.
- Painel do personagem selecionado no canto direito: retrato, vida, dano, habilidade e situação.
- Ataque básico, espaço de habilidade e espaço de item no centro inferior.
- Três espaços de apoio no canto esquerdo, sem equipar ou executar efeitos inexistentes.
- CardTouch: primeiro clique no alvo mostra ATACAR, segundo abre informações e terceiro fecha. Fora de uma ação válida, o clique apenas inspeciona.
- Opções de efeitos reduzidos, pausa, ajuda, registro, exportação e reinício. A redução de movimento do sistema também é respeitada.

## Modos de teste

**Azul × computador:** jogador controla Azul. O computador escolhe um alvo vivo com menor vida, sem bônus ocultos.

**Manual:** permite agir pelos dois lados na ordem definida, útil para reproduzir situações.

**Automático:** permite observar a sequência completa. Há espera de 1,2 segundo antes da decisão automática e uma transição de impacto de 650 ms (200 ms com efeitos reduzidos). Entre as rodadas, o teste aguarda **Próxima rodada**.

Inspeções e diálogos suspendem decisões automáticas. Ao ocultar a página, as ações são pausadas; o relógio continua medindo a duração da série. Reiniciar cancela ações pendentes antes de criar outra sessão.

## Arquivos e verificações

`js/lab/battle.js` contém o modelo independente. `js/ui/battle_lab.js` controla a tela e os turnos automáticos. `css/battle_lab.css` contém a composição visual. O CardTouch de `js/ui/card_touch.js` é reutilizado sem alterar o experimento anterior.

`tests/battle_lab.test.js` executa uma série determinística completa e testa rejeição de ações inválidas. `npm run test:battle` percorre a interface real, usa relógio controlado para verificar uma série inteira e também testa toque.

`npm run package:battle` gera `downloads/batalha-v0.45.0.zip`. A única adaptação da página no ZIP isolado é o link de retorno, que passa a abrir uma nova sessão em vez de apontar para o laboratório ausente no pacote. Todos os módulos da batalha são idênticos aos do projeto completo.
