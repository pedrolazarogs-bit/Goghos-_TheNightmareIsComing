# GOGHOS — The Nightmare Is Coming

**Versão 0.43.0 — menu de apresentação e laboratório separado.**

[Baixar esta versão em ZIP](https://github.com/pedrolazarogs-bit/Goghos-_TheNightmareIsComing/archive/refs/tags/v0.43.0.zip)

## Laboratório de testes

Abra `laboratorio.html` para testar cartas em um ambiente separado. Ele não altera o menu, a abertura, o áudio nem o progresso do jogo. Extraia todos os arquivos antes de abrir; também funciona em `http://localhost:8000/laboratorio.html` com `npm run dev`.

[Baixar somente o laboratório](https://raw.githubusercontent.com/pedrolazarogs-bit/Goghos-_TheNightmareIsComing/refs/tags/v0.43.0/downloads/laboratorio-v0.43.0.zip)

- Clique ou use Tab + Enter para selecionar e desmarcar cartas.
- Dois cliques, botão direito ou “Abrir detalhes” mostram os dados da carta.
- Teste movimentos entre mão e área, dano e cura com limites de vida.
- Confira o registro, exporte JSON e reinicie a mesa quando quiser.

Os três personagens usam 100 PV fictícios, sem atributos ou habilidades oficiais. Cartas sem vida permanecem inspecionáveis e precisam de cura para serem movidas. Nada é gravado em armazenamento local; recarregar reinicia a sessão. O laboratório não implementa combate, draft ou inventário.

As próximas mecânicas devem ser experimentadas aqui antes de integrar suas telas definitivas. O modelo independente fica em `js/lab_model.js`, e a apresentação em `js/ui/laboratorio.js` e `css/laboratorio.css`.

`npm run test:lab` verifica as interações no Chromium com o servidor ativo. `npm run package:lab` gera o ZIP isolado. Toda entrega inclui a parte testável e o projeto completo, ambos com a mesma versão.

Esta edição mantém a abertura obrigatória, o menu ilustrado, os efeitos de entrada, as animações contínuas e o áudio. Os ícones de Play, loja, deck, ranked, perfil, moedas, configurações e modo continuam na composição visual, sem abrir telas ou iniciar ações. Os acessos no rodapé permanecem desativados.

Na v0.41.0, o menu de computador segue a nova referência enviada: divisão em zigue-zague, base circular em degradê, perfil com nível, Ranked junto à divisão, atalhos inferiores e Play amarelo. Os quatro ícones enviados foram incorporados sem alterar seus arquivos. Os elementos novos são decorativos, sem novos acessos ou sistemas de progressão.

A Unicorn aparece como arte fixa do menu, no tamanho e enquadramento aprovados. O sistema de personagem favorito foi removido: não há seletor, botão de troca nem leitura da antiga preferência salva. No computador, a entrada toca uma vez e termina em repouso, sem zoom ou flutuação.

A composição de celular permanece preservada, com a mesma remoção do recurso de favorito solicitada nesta versão.

A tela de carregamento vem primeiro. Depois aparece a apresentação de GOGHOS, que aguarda qualquer tecla ou toque antes de mostrar o menu. A música começa nessa apresentação e continua no menu, sem reiniciar.

Os motores de batalha, draft, loja, personagens, coleção e demais telas internas foram retirados deste pacote, junto com as artes e estilos usados apenas nessas telas. As versões anteriores permanecem no histórico e nas tags do repositório.

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
