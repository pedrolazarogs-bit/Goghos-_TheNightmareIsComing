# GOGHOS TCG

Um jogo de cartas e batalhas por velocidade no universo **GOGHOS — The Nightmare Is Coming**. A versão **0.27.1** reorganiza o menu como um lobby de jogo: campeão em destaque, atalhos laterais, escolha de modo junto de Jogar e loja com categorias e prévias. Mantém os cenários, cartas maiores, animações, sons e abertura da renovação visual.

**O balanceamento foi preservado.** Os dez arquivos do motor, os atributos e habilidades dos 31 personagens, Zeenneriam, os Apoios e as regras são os mesmos da v0.26.2. As cartas oficiais continuam intactas. O novo kit entra como arte e apresentação, sem substituir números por referências antigas.

![Novo lobby GOGHOS](docs/previews/menu-v0.27.1-desktop.png)

## Novidades visuais

- **Lobby:** Sam em destaque, perfil e moedas no topo, Loja, Personagens e Crônicas na lateral. O modo aparece ao lado do botão Jogar. A abertura continua disponível.
- **Modos:** Arena contra o bot, Treino de campeões, Mesa de Apoios e Invocação primordial organizam os quatro acessos existentes, sem criar novas regras.
- **Loja da noite:** baú em destaque, filtros de Ambientes, Molduras e Títulos, prévias e indicação do que já está na coleção.
- **Arena:** cartas da frente com aproximadamente 156 px no computador e pelo menos 100 px no celular, nomes e atributos legíveis, cenário personalizável, alvos destacados e histórico por golpe. A quarta vaga de Recruta mantém o tamanho das cartas e pode ser vista deslizando a fileira no celular.
- **Som e efeitos:** eletricidade, socos, fogo, mísseis, portais, cura, dados, bloqueios e revides com identidade própria. O botão de som e as preferências permitem silenciar, ajustar o volume ou reduzir o movimento.
- **Santuário:** 180 moedas de boas-vindas, baús de 90 moedas e +50 por partida concluída. Os baús oferecem ambientes, molduras e títulos de perfil. Todos os personagens continuam disponíveis, e os visuais não alteram o combate.
- **Crônicas:** seis cenas narrativas e um arquivo dos personagens com suas habilidades atuais. O progresso visual e as preferências ficam salvos neste navegador.

[Lobby no celular](docs/previews/menu-v0.27.1-celular.png) · [Modos](docs/previews/modos-v0.27.1-desktop.png) · [Loja](docs/previews/loja-v0.27.1-desktop.png) · [Arena](docs/previews/arena-v0.27.0-desktop.png) · [Guia da interface](docs/UI.md)

## Jogar e desenvolver

Abra `index.html` no navegador. O jogo roda localmente, sem conta, servidor ou internet. Extraia o ZIP completo antes de abrir o arquivo. O som começa depois de uma interação; volume e movimento podem ser ajustados pelo ícone de preferências. Para servir os arquivos durante o desenvolvimento, execute `npm run dev` na raiz do projeto e acesse `http://localhost:8000`.

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

![Cartas maiores na arena](docs/previews/arena-v0.27.0-desktop.png)

[Seleção no celular](docs/previews/selecao-v0.27.0-celular.png) · [Crônicas](docs/previews/cronicas-v0.27.0-celular.png) · [Guia da interface](docs/UI.md) · [Atualizações anteriores](docs/HISTORICO.md)
