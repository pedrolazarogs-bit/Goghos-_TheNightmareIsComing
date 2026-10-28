# Classes e tributos — v0.32.0

As classes seguem o símbolo inferior das novas cartas e as correções expressas do criador. Sam é Fighter; apenas seu ícone de classe foi corrigido na apresentação. Todas as 29 cartas dos kits agora estão ativas. Os PNGs originais ficam preservados.

| Símbolo | Classe | Tributo | Personagens |
| --- | --- | --- | ---: |
| Olho de X | Assassin | Esquiva pela diferença de velocidade | 7 |
| Espada | Fighter | Parry individual no d6 | 8 |
| Raio | Tank | Resistência individual a ataques | 2 |
| + | Support | Transição entre frente e retaguarda | 4 |
| Lua | Mago | Mana inicial/máxima 3; +1 por ação global | 5 |
| Mira | Destroyer | Crítico +25% com 1–2 no d6 | 5 |

Zeenneriam é Deus sem raridade, separado dos 31 personagens. **MAX reúne os seis tributos.**

## Elenco atual

| Classe | Personagens |
| --- | --- |
| Assassin | Sark, Penxy, Zikssy, Xerife, Draktar, Nully, Trucc |
| Fighter | John, DD-X, Stally, Sam, Daztirry, Rayvilin, Alex, Linx |
| Tank | Cavaleiro, Z-Zus |
| Support | Elysh, Zuri, Unicorn, Rayyb |
| Mago | Elétrica, Burn, Fonior, Chama, Vaglar |
| Destroyer | P. Ullys, Endrik, Striker, Mike, Karma |

As mudanças de classe em relação ao catálogo anterior são Cavaleiro para Tank, Burn/Fonior/Chama/Vaglar para Mago, Karma para Destroyer e Rayvilin para Fighter. Os novos valores, raridades e exceções estão na [tabela manual](BALANCEAMENTO_MANUAL.md).

## Regras dos tributos

- **Assassin:** d6 até a diferença de velocidade evita o golpe, limitado a cinco resultados (6 permite o acerto); precisa ser mais rápido que o atacante. Magos ignoram esse teste. Sark, sem velocidade, não recebe esquiva. Xerife usa o duelo defensivo em lugar de outra esquiva; Trucc mantém a esquiva progressiva. Impedimentos de reação bloqueiam o teste.
- **Fighter:** Parry em cada ataque recebido de classes que não sejam Destruidor, com o limiar individual abaixo. Continua durante silêncio, mas não durante impedimentos de reação. John também fica sem Parry enquanto mantém o machado. Magos não ignoram Parry.
- **Tank:** a resistência reduz dano de ataques, inclusive área e revides. Z-Zus tem **20%** na nova carta; Cavaleiro tem **zero**, mantendo somente a armadura própria de 80%. O padrão de 10% vale para MAX. Livro, queimadura, machado periódico, hipnose e execução não recebem essa redução de ataque. Silêncio não desliga tributos de classe.
- **Support:** Elysh, Zuri, Unicorn e Rayyb podem transitar na vez da equipe, sem gastar ação, respeitando vagas, impedimentos e um defensor na frente. Elysh pode curar atrás; Zuri também pode usar sua cura total única da retaguarda, gastando a ação e sem atacar dali.
- **Mago:** os cinco começam com 3/3 e recuperam +1 após cada ação global concluída, até 3. Operações gratuitas não regeneram mana. O gasto soma 10 de dano por ponto ao ataque; livro e hipnose continuam efeitos fixos. O dano periódico de Chama não recebe bônus de mana.
- **Destroyer:** os cinco testam d6 nos ataques: 1–2 concede +25%, com arredondamento; 3–6 mantém o dano. Karma também testa no revide. No míssil, os vizinhos recebem 20% do impacto principal, sem outro crítico. Execuções, dano periódico fixo e vidas da Daly Mãe não são multiplicados.

| Fighter | Parry no d6 |
| --- | --- |
| John | 1–2 |
| DD-X | 1–3 |
| Stally | 1–5 |
| Sam | 1–5 |
| Daztirry | 1–3 |
| Rayvilin | 1–2 |
| Alex | 1 |
| Linx | 1 |
| Zeenneriam (MAX) | 1–2 |

## Verificação

Os testes atuais de [integração dos kits](../tests/master_complete.test.js) conferem os 29 cadastros, todos os limiares de Parry recebidos, Mana, resistência individual e crítico de Karma, além das habilidades e partidas com o catálogo completo. A auditoria anterior de classes permanece como regressão histórica com dados da v0.25.0; ela não define o catálogo carregado pelo jogo. Resultados e ensaios no navegador estão em [VALIDACAO.md](VALIDACAO.md).


## Parry contra Destruidores — v0.31.0

Fighters não podem dar Parry em ataques de personagens da classe Destruidor. A defesa não é rolada, inclusive em cada golpe de uma sequência, áreas e revides. O crítico do Destruidor continua com sua própria rolagem. Uma carga de Sortudo do defensor não é gasta por um Parry que não pode acontecer. MAX também reúne esse tributo. Os demais escudos, habilidades e regras de defesa mantêm seus efeitos.
