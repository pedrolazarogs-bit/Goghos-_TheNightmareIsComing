# GOGHOS TCG

Protótipo jogável de cartas e batalha por turnos. A versão **0.23.1** atualiza a recuperação da Daly Mãe: após perder uma vida, escolha **até 2 Épicos ou até 3 Raros**. O jogo inclui os **17 Apoios oficiais**, **Zeenneriam por invocação dos três Fragmentos Primordiais** e os tributos de Tanque/Destroyer. São 30 personagens de raridade e um Deus separado. Petra fica de fora por enquanto. As cartas preservam as artes recebidas e mostram os números atuais nos campos próprios.

## Jogar e desenvolver

Abra `index.html` no navegador. O jogo roda localmente, sem conta, servidor ou internet. Para servir os arquivos durante o desenvolvimento, execute `npm run dev` na raiz do projeto e acesse `http://localhost:8000`.

Em **Jogar**, escolha um Comum. O bot escolhe outro, e cada equipe recebe **um Raro sorteado automaticamente**, sem repetição. Confira as quatro cartas e clique em **Play · começar batalha**. Ambas as equipes começam com dois personagens na frente.

**Testar novos personagens** oferece uma formação para cada um dos 30 oficiais, com busca por nome e descrição da habilidade. As escolhas de entrada aparecem na pré-batalha; as ações específicas aparecem na vez do personagem. **Personagens** mostra o catálogo com as cartas e as regras de cada habilidade. O menu **Testar cartas de Apoio** inclui os 17 efeitos; **Invocação de Zeenneriam** prepara os três fragmentos para a invocação manual. Os atalhos **Testar Sark** e **Testar Elétrica e John** continuam disponíveis.

Foram adicionados combo de Sam, míssil com dano nos vizinhos, paralisia, duelo do Sheriff, hipnose, almas, queimaduras, cura total, caça sorteada, estado Oni, estrela de Unicorn, execução por dado, sono, petrificação, proteção de Z-Zus, Swarm de Alex, amizade de Karma e esquiva progressiva de Trucc. As regras completas estão no [guia dos personagens](docs/PERSONAGENS_PENDENTES.md). A [revisão de balanceamento](docs/BALANCEAMENTO.md) lista todos os valores anteriores, atuais e justificativas.

As cartas da mão podem ser usadas na vez da equipe mesmo se o personagem estiver imobilizado ou sob outro impedimento. Isso não gasta a ação nem remove o efeito. Magos mantêm 3 de mana inicial, +1 por ação concluída e máximo de 3.

É necessário **Node.js 20 ou superior** para rodar os testes e **Python 3** para `npm run dev`. Não há pacotes externos nem etapa de instalação:

```sh
npm test
```

## Onde está cada parte

| Caminho | Conteúdo |
| --- | --- |
| `js/data/` | Personagens, cartas de Apoio e cartas do monte principal |
| `js/core/` | Regras da batalha, seleção, IA, montes e recuperação |
| `js/ui/` | Telas, cartas, mão e mensagens |
| `assets/` e `css/` | Arte recebida, conceitos, fontes e aparência |
| `tests/` | Regras atuais e testes da interface com DOM simulado |
| `docs/` | Regras completas e histórico das versões recebidas |

[Invocação e tributos](docs/DEUSES.md) · [Cartas de Apoio](docs/APOIOS.md) · [Balanceamento](docs/BALANCEAMENTO.md) · [Regras e decisões provisórias](docs/REGRAS.md) · [Validação e imagens](docs/VALIDACAO.md) · [Artes recebidas](docs/ARTES.md) · [Histórico](docs/HISTORICO.md) · [Como contribuir](CONTRIBUTING.md)

## Estado do protótipo

A partida pode ser concluída contra a IA. Há seis montes de personagens, monte principal, mão de cinco cartas, cartas de Apoio, pré-batalha, habilidades individuais, recuperação sem reiniciar a velocidade e vitória ao eliminar a Daly Mãe adversária. Vida, dano e cura são arredondados para cima em múltiplos de 5, com a exceção confirmada de Morto Vivo voltando com 1 de Vida. O contador da Daly Mãe perde uma vida por ataque.

Item, Habilidade Especial e Loja continuam em desenvolvimento. As habilidades dos 30 personagens presentes estão implementadas; Petra aguarda sua mecânica. Sem ação possível, é possível avançar o ciclo e comprar cartas; com os recursos esgotados e sem efeitos a resolver, há empate.

![Zeenneriam invocado com a arte original](docs/previews/invocacao-v0.23.0-desktop.png)

[Seleção atual](docs/previews/selecao-v0.22.0-desktop.png) · [Invocação no celular](docs/previews/invocacao-v0.23.0-celular.png)
