# GOGHOS — The Nightmare Is Coming

Um jogo de cartas e batalhas por velocidade no universo **GOGHOS**. A **v0.33.0** reorganiza a interface a partir da referência do criador: a carta da vez, o alvo e as ações ficam em destaque; as consultas completas abrem somente quando necessárias. O balanceamento da v0.32.0 permanece intacto, incluindo Burn e as quatro ações globais do Oni.

## Uma ação de cada vez

- **Campo:** formações proporcionais, identificação de equipe, Vida e personagem da vez. A carta em foco e o alvo ganham uma apresentação ampliada.
- **No celular:** alterne entre **Ações**, com cartas ampliadas, e **Campo**, com as formações completas. A escolha de alvo tem cartas grandes e páginas; as vidas das duas Daly Mães continuam visíveis.
- **Comandos:** Ataque, Habilidade e Apoio separam as opções. Fichas, ordem, montes e registro ficam em consultas próprias, com navegação por botões. A batalha continua sem depender da roda do mouse.
- **Movimento e som:** golpes movimentam as cartas e usam timbres conforme a arma ou o poder. Defesas, esquivas, impactos individuais, entrada por raridade e eliminações recebem apresentações próprias.
- **Outras telas:** menu, seleção, catálogo, treinos e loja seguem o mesmo acabamento de ferro, marfim e magia discreta, com ícones maiores e detalhes sob demanda. A fonte original German Beauty, a logo oficial e as artes das cartas são preservadas.
- **Loja:** os novos baús **Comum, Pro, Plus e Plus+** têm artes e prévias próprias. Conteúdo, preço e abertura aguardam definição do criador; as atividades cosméticas anteriores continuam separadas.

Som, volume, música e movimento podem ser ajustados nas preferências. O áudio começa após uma interação. Com movimento reduzido, números, textos e identificação das ações continuam disponíveis.

![Arena com ações em foco](docs/previews/acoes-v0.33.0-desktop.png)

[Ver no celular](docs/previews/acoes-v0.33.0-celular.png) · [Campo completo](docs/previews/campo-v0.33.0-celular.png) · [Novos baús](docs/previews/baus-v0.33.0-desktop.png)

[Guia da interface](docs/UI.md) · [Balanceamento preservado](docs/BALANCEAMENTO_MANUAL.md) · [Validação](docs/VALIDACAO.md)

## Jogar e desenvolver

Abra `index.html` no navegador. O jogo roda localmente, sem conta, servidor ou internet. Extraia o ZIP completo antes de abrir o arquivo. A fonte original German Beauty é carregada dos arquivos locais do projeto. O som começa depois de uma interação; volume e movimento podem ser ajustados pelo ícone de preferências. Para servir os arquivos durante o desenvolvimento, execute `npm run dev` na raiz do projeto e acesse `http://localhost:8000`.

Com **Arena** selecionada, **Jogar** apresenta Elysh, Stally, Mike e Alex. A escolha alterna **você → bot → você → bot**, sem repetir cartas. Depois das quatro escolhas, clique em **Play · começar batalha**. Cada equipe começa com seus dois Comuns na frente; não são sorteados Raros.

No seletor de modos, **Treino de campeões** oferece uma formação para cada um dos 31 oficiais, com busca por nome e descrição da habilidade. As escolhas de entrada aparecem na pré-batalha; as ações específicas aparecem na vez do personagem. **Personagens** mostra o catálogo com as cartas e as regras de cada habilidade. **Mesa de Apoios** inclui os 17 efeitos; **Invocação primordial** prepara os três fragmentos para a invocação manual. Os **Atalhos de treino** mantêm os testes de Sark e Elétrica e John. A escolha do modo vale enquanto o jogo estiver aberto; recarregar retorna à Arena.

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

[Conferência de classes e tributos](docs/CLASSES.md) · [Invocação e tributos](docs/DEUSES.md) · [Cartas de Apoio](docs/APOIOS.md) · [Balanceamento](docs/BALANCEAMENTO.md) · [Regras e decisões provisórias](docs/REGRAS.md) · [Validação e imagens](docs/VALIDACAO.md) · [Artes recebidas](docs/ARTES.md) · [Histórico](docs/HISTORICO.md) · [Como contribuir](CONTRIBUTING.md)

## Estado do protótipo

A partida pode ser concluída contra a IA. Há seis montes de personagens, monte principal, mão de cinco cartas, cartas de Apoio, pré-batalha, habilidades individuais, recuperação sem reiniciar a velocidade e vitória ao eliminar a Daly Mãe adversária. Vida, dano e cura são arredondados para cima em múltiplos de 5, com a exceção confirmada de Morto Vivo voltando com 1 de Vida. O contador da Daly Mãe perde uma vida por ataque.

Item e Habilidade Especial continuam em desenvolvimento. O Santuário oferece a loja de baús e visuais, separada das regras de combate. As habilidades dos 31 personagens presentes estão implementadas; Petra aguarda sua mecânica. Sem ação possível, é possível avançar o ciclo e comprar cartas; com os recursos esgotados e sem efeitos a resolver, há empate.

![Catálogo de personagens](docs/previews/catalogo-v0.29.0-desktop.png)

[Seleção no celular](docs/previews/selecao-v0.29.0-celular.png) · [Crônicas](docs/previews/cronicas-v0.29.0-celular.png) · [Guia da interface](docs/UI.md) · [Atualizações anteriores](docs/HISTORICO.md)
