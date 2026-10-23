# Classes e tributos — v0.24.1

As 30 bases oficiais foram conferidas visualmente usando o **símbolo no losango inferior** e a legenda informada pelo criador. Algumas cartas antigas têm outro símbolo perto do nome; ele não foi usado para substituir a identificação inferior. Os PNGs originais permanecem intactos.

| Símbolo | Classe | Tributo | Personagens |
| --- | --- | --- | ---: |
| Olho de X | Assassin | Esquiva pela diferença de velocidade | 8 |
| Espada | Fighter | Parry com limiar individual no d6 | 9 |
| Raio | Tank | Resistência natural de 10% a ataques | 1 |
| + | Support | Transição entre frente e retaguarda | 6 |
| Lua | Mago | Mana inicial/máxima 3; +1 por ação global | 1 |
| Mira | Destroyer | Crítico de +25% com 1 ou 2 no d6 | 5 |

Zeenneriam fica separado: é Deus sem raridade e **MAX reúne os seis tributos**. Sua identificação e obtenção por invocação não mudam.

## Conferência do elenco

| Classe confirmada | Personagens |
| --- | --- |
| Assassin | Sark, Penxy, Zikssy, Xerife, Draktar, Nully, Karma, Trucc |
| Fighter | John, Cavaleiro, DD-X, Stally, Burn, Sam, Daztirry, Alex, Vaglar |
| Tank | **Z-Zus** |
| Support | Elysh, Fonior, Zuri, Unicorn, Rayyb, Rayvilin |
| Mago | Elétrica |
| Destroyer | P. Ullys, Endrik, Striker, Chama, Mike |

**Correção de classe:** [a base de Z-Zus](../assets/cards/card_base_z_zus.png) mostra um raio no losango inferior. Ele estava cadastrado como Support e agora é Tank: recebe a resistência natural e não pode ocupar ou transitar para a retaguarda. Sacrifício continua protegendo o aliado escolhido e transferindo dano direcionado/execuções, com a exceção de área. Seus números permanecem 1040 de Vida, 150 de dano, velocidade 1 e fôlego 10.

As outras 29 classes já correspondiam aos símbolos inferiores. Vida, dano, velocidade, fôlego, raridade, habilidade e limiares definidos dos 31 personagens, incluindo o Deus, foram comparados com a v0.24.0 e preservados. O próximo balanceamento será manual, a partir das novas cartas enviadas pelo criador.

## Situação dos tributos

- **Assassin:** d6 até a diferença de velocidade evita o golpe; precisa ser mais rápido que o atacante. Magos ignoram esse teste. Sark, sem velocidade, não recebe esquiva. Xerife usa o duelo defensivo em lugar de outra esquiva; Trucc mantém a esquiva especial progressiva. Impedimentos de reação bloqueiam o teste. A previsão agora respeita essas mesmas exceções.
- **Fighter:** John e Zeenneriam defendem com 1 ou 2. **Oito limiares aguardam as novas cartas:** Cavaleiro, DD-X, Stally, Burn, Sam, Daztirry, Alex e Vaglar. O criador confirmou que os definirá individualmente; nenhum resultado foi inventado. Parry configurado continua durante silêncio, mas fica bloqueado por impedimentos de reação, incluindo John enquanto mantém o machado.
- **Tank:** recebe 90% do dano de ataques, arredondando para cima em múltiplos de cinco: 100 vira 90, 65 vira 60. Vale para área e revides que são ataques, inclusive quando Z-Zus recebe pelo protegido. Livro, queimadura, machado periódico, hipnose e execuções não ganham essa redução de ataque. Hipnose mantém seus 90 de efeito fixo. Silêncio não desliga tributos de classe.
- **Support:** os seis podem ir e voltar entre as linhas, na vez da equipe, sem gastar ação. Vagas, impedimentos e a necessidade de manter um defensor na frente continuam válidos.
- **Mago:** Elétrica começa com 3/3. Mana é gasta uma vez por ataque em área e recupera +1 após cada ação global concluída, inclusive se estiver impedida ou na retaguarda, até 3. Apoio, consulta à ficha e outras operações gratuitas não regeneram mana. O bônus de 10 de dano por ponto permanece o parâmetro provisório já existente.
- **Destroyer:** os cinco fazem o teste nos ataques. Resultado 1–2 aumenta o golpe em 25%, com arredondamento; 3–6 mantém o dano. No míssil, os vizinhos recebem 20% do impacto principal, sem outro crítico. Queimaduras fixas, execuções e vidas da Daly Mãe não são multiplicadas.

## Verificação

Os 16 testes de [class_tributes.test.js](../tests/class_tributes.test.js) cobrem identificação dos 30, MAX, resistência direta/área/redirecionamento, efeitos fixos, mana, esquiva, impedimentos, Parry definido/pendente, os cinco Destroyers e os seis Supports. A suíte completa e os ensaios no navegador estão em [VALIDACAO.md](VALIDACAO.md).
