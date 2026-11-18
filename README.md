# GOGHOS — The Nightmare Is Coming

**Versão 0.48.0 — Painel do jogador com as artes recebidas e indicador de fôlego.**

[Baixar esta versão em ZIP](https://github.com/pedrolazarogs-bit/Goghos-_TheNightmareIsComing/archive/refs/tags/v0.48.0.zip)

## Painel do jogador

[Baixar somente o painel para testar](https://raw.githubusercontent.com/pedrolazarogs-bit/Goghos-_TheNightmareIsComing/refs/tags/v0.48.0/downloads/painel-v0.48.0.zip)

Extraia todo o ZIP e abra **painel.html**. Teste as 32 cartas, dano, cura e a exibição do fôlego. Coração e espada abrem atributos; o losango mostra o fôlego e a estrela abre a habilidade principal. A base preta, a faixa vermelha e os ícones usam seus arquivos originais.

O mesmo painel já está em **batalha.html**, no projeto completo. Vida e dano acompanham a batalha; o fôlego mostra o valor da carta, sem gasto ou recuperação enquanto suas regras não forem definidas. [Detalhes e origem das artes](docs/PAINEL_JOGADOR.md).

`npm run test:panel` valida o painel no navegador. `npm run package:panel` gera a prévia isolada. O ZIP completo inclui todos os arquivos do projeto, mas omite a pasta de ZIPs de prévias para evitar downloads duplicados; as prévias continuam disponíveis nos links individuais.

## Nova arena 4×4

[Baixar somente a arena](https://raw.githubusercontent.com/pedrolazarogs-bit/Goghos-_TheNightmareIsComing/refs/tags/v0.48.0/downloads/batalha-v0.48.0.zip)

Extraia o ZIP e abra **batalha.html**. Escolha uma das **32 cartas**, usando a galeria ou a busca, e clique em **Iniciar batalha**. A arena também pode ser aberta pelo laboratório. Os botões do menu principal continuam decorativos.

- Eliminar os quatro adversários concede um ponto. A primeira equipe a alcançar **3 pontos** vence a série, que pode durar até cinco rodadas.
- Ao avançar de rodada, as equipes voltam com vida cheia. O cronômetro começa ao iniciar e continua durante pausas e intervalos até o vencedor final; então congela.
- A ordem alterna as equipes, pula os eliminados e troca a equipe inicial a cada rodada. A coluna direita mostra próximo, atual e último atacante.
- Clique em um oponente: primeiro clique mostra **ATACAR**, segundo abre o painel CardTouch, terceiro fecha. Na vez adversária ou ao inspecionar aliados, aparecem somente informações.
- As cartas ficam retas. O canto direito acompanha sempre **o seu personagem**, com retrato, vida, dano, fôlego e situação. A **estrela original recebida** fica parada ao lado desse painel e mostra a habilidade principal somente ao clicar; não ocupa um espaço de ação. Os controles inferiores mostram ataque básico e item; o canto esquerdo reserva **três apoios**.
- Habilidades pessoais, itens e apoios não foram inventados. Seus espaços abrem informações, sem conceder efeitos. **Vida e dano seguem os valores impressos**, incluindo multiplicadores. Sarck, Sheriff · verde, Vaglar · preto e Linx têm ataque “—”: aguardam regras e podem passar a vez. Não há atributos de velocidade ou classe adicionais. [Cartas, valores e pendências](docs/CARTAS_KIT.md).
- Você controla **um personagem** da equipe azul; os três aliados e os quatro oponentes são bots. Cada bot espera **3,2 segundos** antes de agir. Se o seu personagem for eliminado, os aliados continuam sozinhos até o fim da rodada. O controle não passa para outra carta.
- As cartas recebidas são exibidas inteiras, sem alterações nos arquivos. A barra externa mostra a vida atual; a inspeção abre a arte ampliada.
- Artes ainda não fornecidas aparecem como **silhuetas com “?”**. Clique nas marcações para identificar o arquivo necessário. As ilustrações, a estrela, o coração e a espada já recebidos continuam em uso. [Lista de artes pendentes](docs/ARTES_PENDENTES.md).
- Pausa, efeitos reduzidos, registro da série, exportação JSON, inspeção e reinício estão disponíveis. Nenhum progresso é salvo no jogo.

[Regras e estrutura detalhadas da arena](docs/ARENA_4X4.md).

`npm run test:battle` testa uma série completa no navegador. `npm run package:battle` gera a prévia independente; seu link de retorno abre uma nova sessão, pois o menu não acompanha esse ZIP.

## Laboratório de testes

Abra `oponente.html` para testar somente a nova interação de clique no oponente. Abra `laboratorio.html` para testar cartas em um ambiente separado. Ele não altera o menu, a abertura, o áudio nem o progresso do jogo. Extraia todos os arquivos antes de abrir; também funciona em `http://localhost:8000/laboratorio.html` com `npm run dev`.

[Baixar somente o laboratório](https://raw.githubusercontent.com/pedrolazarogs-bit/Goghos-_TheNightmareIsComing/refs/tags/v0.48.0/downloads/laboratorio-v0.48.0.zip)

O novo experimento **Clique no oponente** adapta o CardTouch v0.1.1 enviado, usando os PNGs recebidos e a fonte **German Beauty** original:

- Na sua vez: primeiro clique mostra **ATACAR**, segundo abre os detalhes junto do botão, terceiro fecha.
- Fora da sua vez: primeiro clique abre somente os detalhes; o próximo fecha.
- A aba mostra habilidade, buffs/nerfs, vida e dano, com os indicadores colados à carta. Escape, clique fora, rolagem ou redimensionamento fecham a interação.
- **ATACAR** simula 25 de dano no oponente clicado e encerra sua vez. Use **Liberar sua vez** para repetir ou **Reiniciar este teste** para restaurar os valores.
- Os atributos de P.ULLYS vêm da demonstração recebida. Habilidade e efeitos são exibidos, mas não executados. O dano exibido pertence ao oponente, não ao jogador.

A mesa de testes anterior continua disponível logo abaixo:

- Clique ou use Tab + Enter para selecionar e desmarcar cartas.
- Dois cliques, botão direito ou “Abrir detalhes” mostram os dados da carta.
- Teste movimentos entre mão e área, dano e cura com limites de vida.
- Confira o registro, exporte JSON e reinicie a mesa quando quiser.

Na mesa anterior, os três personagens usam 100 PV fictícios, sem atributos ou habilidades oficiais. Cartas sem vida permanecem inspecionáveis e precisam de cura para serem movidas. Nada é gravado em armazenamento local; recarregar reinicia a sessão. O laboratório não implementa combate, draft ou inventário.

As próximas mecânicas devem ser experimentadas aqui antes de integrar suas telas definitivas. O modelo independente fica em `js/lab_model.js`, e a apresentação em `js/ui/laboratorio.js` e `css/laboratorio.css`.

`npm run test:lab` verifica as interações no Chromium com o servidor ativo. `npm run package:lab` gera o ZIP isolado. Toda entrega inclui a parte testável e o projeto completo, ambos com a mesma versão.

Esta edição mantém a abertura obrigatória, o menu ilustrado, os efeitos de entrada, as animações contínuas e o áudio. Os ícones de Play, loja, deck, ranked, perfil, moedas, configurações e modo continuam na composição visual, sem abrir telas ou iniciar ações. Os acessos no rodapé permanecem desativados.

Na v0.41.0, o menu de computador segue a nova referência enviada: divisão em zigue-zague, base circular em degradê, perfil com nível, Ranked junto à divisão, atalhos inferiores e Play amarelo. Os quatro ícones enviados foram incorporados sem alterar seus arquivos. Os elementos novos são decorativos, sem novos acessos ou sistemas de progressão.

A Unicorn aparece como arte fixa do menu, no tamanho e enquadramento aprovados. O sistema de personagem favorito foi removido: não há seletor, botão de troca nem leitura da antiga preferência salva. No computador, a entrada toca uma vez e termina em repouso, sem zoom ou flutuação.

A composição de celular permanece preservada, com a mesma remoção do recurso de favorito solicitada nesta versão.

A tela de carregamento vem primeiro. Depois aparece a apresentação de GOGHOS, que aguarda qualquer tecla ou toque antes de mostrar o menu. A música começa nessa apresentação e continua no menu, sem reiniciar.

Os motores antigos de batalha, draft, loja, personagens, coleção e demais telas internas foram retirados. A arena 4×4 desta versão é um experimento independente no laboratório. As versões anteriores permanecem no histórico e nas tags do repositório.

A animação de vitória e seus recursos foram preservados como módulo de apresentação, sem acesso pelos botões do menu. Todos os 11 arquivos de áudio existentes na versão anterior foram conservados, inclusive as trilhas de combate, vitória e derrota. Esta edição não inicia partidas nem concede recompensas.

## Testar

Extraia o ZIP, entre na pasta do projeto e execute:

```sh
npm run dev
```

Abra <http://localhost:8000>. O comando usa Python 3; Node.js é necessário para os testes automatizados. O jogo roda com arquivos locais e não precisa baixar dependências ou acessar serviços externos.

1. Toque em **Toque para iniciar** e aguarde o carregamento e a apresentação.
2. Pressione qualquer tecla ou toque na tela quando a apresentação indicar que pode continuar.
3. Confira o menu, as animações e a continuidade da música.
4. Clique ou toque no personagem: a arte é decorativa e não abre seleção.
5. Clique nos demais ícones: eles devem manter o menu aberto, sem iniciar ações internas.

## Validação

```sh
npm test
```

Verifica os recursos originais, a ausência de telas internas, a abertura obrigatória, as tentativas de carregamento e o controle da trilha sonora.

Com Playwright, pngjs e Chromium disponíveis e o servidor iniciado:

```sh
npm run test:browser
```

O teste percorre a abertura no computador e no celular, confere a música contínua, a ausência de acessos nos elementos do menu, a arte dentro da divisão e a animação de vitória preservada. Uma antiga preferência de favorito não altera a arte fixa nem pula a abertura.

[Histórico de versões](docs/HISTORICO.md) · [Validação desta entrega](docs/VALIDACAO.md)
