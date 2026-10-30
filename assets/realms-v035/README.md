# Mesa e emblemas da arena — v0.35

Artes criadas para a nova apresentação de GOGHOS — The Nightmare Is Coming. Os fundos seguem a direção de obsidiana, marfim esculpido e cristal opalescente. Os ícones foram refeitos com base no kit `icones_jogo_cartas.zip` enviado pelo criador: silhueta hexagonal, contorno escuro, esmalte facetado e símbolos claros. O acabamento usa filete metálico discreto e cores contidas para reduzir o aspecto cartoon, sem reproduzir marcas ou personagens externos.

## Campo

`nightmare-table.png` — 1672 × 941, RGB. Mesa vista de cima, com centro amplo e de baixo contraste para as cartas reais. Os detalhes de cristal e osso ficam nas bordas. O brilho inferior é verde espectral; o superior, rosa escuro. Não contém casas, cartas, personagens, texto ou controles pintados.

`nightmare-table-portrait.png` — 941 × 1672, RGB. Recomposição vertical própria para celulares: mantém o quadro completo de obsidiana e cristais sem esticar a arte horizontal ou perder as bordas ao recortar. O centro continua livre para as cartas.

## Emblemas hexagonais de interface

As duas folhas PNG medem **1024 × 1536**, possuem transparência RGBA e usam **duas colunas por três linhas**. Cada célula mede 512 × 512. Cada emblema tem desenho limpo, símbolo grande de marfim, contorno de ônix e filete metálico discreto. O esmalte varia entre granada, jade, ametista, azul e mel. A arte ocupa aproximadamente 55–65% da célula, com margens transparentes largas entre os elementos. As imagens podem ser usadas como sprites, sem duplicar os arquivos ou recortar as cartas oficiais.

| Arquivo | Coluna | Linha | Uso |
| --- | --- | --- | --- |
| `relic-icons.png` | 0 | 0 | Ataque: lâminas cruzadas |
| `relic-icons.png` | 1 | 0 | Apoio: mão com cristal |
| `relic-icons.png` | 0 | 1 | Habilidade: estrela partida de quatro pontas |
| `relic-icons.png` | 1 | 1 | Vez: ampulheta alada |
| `relic-icons.png` | 0 | 2 | Histórico e Crônicas: livro aberto |
| `relic-icons.png` | 1 | 2 | Configurações: engrenagem esculpida |
| `navigation-icons.png` | 0 | 0 | Personagens e coleção: leque de cartas |
| `navigation-icons.png` | 1 | 0 | Loja: bolsa de mercador com toldo |
| `navigation-icons.png` | 0 | 1 | Jogar: selo triangular |
| `navigation-icons.png` | 1 | 1 | Movimento: setas opostas |
| `navigation-icons.png` | 0 | 2 | Voltar: seta para a esquerda |
| `navigation-icons.png` | 1 | 2 | Pausa: dois cristais verticais |

Exemplo de enquadramento: `background-size: 200% 300%`, coluna em `0%` ou `100%`, linha em `0%`, `50%` ou `100%`. Um elemento de 96 px exibe o emblema com cerca de 52–62 px. Para ações e atalhos principais, o elemento pode ser maior para que a forma hexagonal e o símbolo tenham a presença visual desejada. A área transparente permite ajustar a escala e o centro óptico por CSS sem cortar o contorno. O fundo das folhas tem alfa zero; não deve receber uma placa retangular opaca.

Esses elementos são somente apresentação. Os selos de classe e as imagens oficiais das cartas continuam em seus arquivos originais. Nenhum atributo, poder, tributo ou regra de combate está embutido nestas artes.

A interface aplica zoom óptico de 1,5× e centraliza os emblemas pelos limites visíveis, em `css/realms_icons.css`. O tamanho de fundo passa a `300% 450%`; os percentuais individuais compensam as margens transparentes sem ampliar os botões nem cortar seus símbolos.

Na v0.35.1, as duas imagens de cenário deixam de ser usadas pela interface e pelo carregamento inicial. Permanecem arquivadas como material da v0.35.0; os emblemas continuam ativos sobre fundo preto.
