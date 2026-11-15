# GOGHOS — The Nightmare Is Coming

**Versão 0.39.0 — abertura e menu de apresentação.**

[Baixar esta versão em ZIP](https://github.com/pedrolazarogs-bit/Goghos-_TheNightmareIsComing/archive/refs/tags/v0.39.0.zip)

Esta edição mantém a abertura obrigatória, o menu ilustrado, os efeitos de entrada, as animações contínuas e o áudio. Os ícones de Play, loja, deck, ranked, perfil, moedas, configurações e modo continuam na composição visual, sem abrir telas ou iniciar ações. Os acessos no rodapé e na imagem do personagem também foram removidos.

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
4. Clique nos antigos botões e na imagem do personagem: o menu deve permanecer aberto, sem painéis ou navegação.

## Validação

```sh
npm test
```

Verifica os recursos originais, a ausência de telas internas, a abertura obrigatória, as tentativas de carregamento e o controle da trilha sonora.

Com Playwright e Chromium disponíveis e o servidor iniciado:

```sh
npm run test:browser
```

O teste percorre a abertura em computador e celular, confere o áudio contínuo, clica nos 10 elementos decorativos que antes eram botões, verifica que não há navegação e exercita o módulo de vitória diretamente. O menu não oferece esse acesso.

[Histórico de versões](docs/HISTORICO.md) · [Validação desta entrega](docs/VALIDACAO.md)
