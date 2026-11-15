# Validação — v0.40.0

Validado em 15/11/2026, com Node.js e Chromium em modo headless, usando o servidor local do projeto.

## Testes automatizados

`npm test` passou:

- Verificações de pacote: menu com apenas o controle de favorito ativo, arquivos de jogo ausentes, versão consistente e recursos de apresentação presentes.
- Integridade: SHA-256 dos recursos preservados comparado com os bytes da v0.38.0, incluindo todos os 11 arquivos de áudio.
- Preferências: volumes limitados, movimento reduzido e ausência de dependências de partida.
- 9 testes do carregamento original.
- 15 testes da abertura obrigatória, incluindo falha, nova tentativa, foco e proteção contra conclusão antecipada.
- 11 testes da trilha sonora, incluindo continuidade, mute, pausa em segundo plano e descarte de áudio obsoleto.

`npm run test:browser` passou com os fluxos completos em **1366 × 768** e **390 × 844**, além do recorte e da estabilidade após redimensionar para **1024 × 768** e **320 × 568**:

- Carregamento original antes da apresentação de título.
- Escape e teclas antecipadas não pulam a abertura.
- A apresentação aguarda tecla/toque depois de concluir a entrada.
- Música do menu ativa desde a apresentação, com a mesma execução e tempo crescente ao entrar no menu.
- Clique/toque nos 10 elementos decorativos; nenhuma tela, painel, navegação ou alteração de progresso.
- Seletor abre por clique, toque e teclado; mostra os cinco personagens e o favorito atual.
- Troca dos cinco personagens atualiza imagem, nome e preferência salva; sem alterar outros dados locais.
- Foco permanece no seletor e retorna ao personagem ao fechar. Fechar por ×, Escape ou clique fora não salva uma escolha.
- Preferência carregada após recarregar a página; abertura obrigatória continua ativa.
- Armazenamento indisponível: escolha funciona durante a sessão e o aviso explica que não foi salva.
- Teclado no personagem abre o seletor; os demais elementos do menu continuam sem iniciar ações internas.
- Todas as imagens do menu carregadas, sem rolagem horizontal ou vertical.
- Animação de vitória exercitada diretamente pelo teste; seus dois comandos retornam ao menu e não iniciam uma partida. O menu não possui acesso a esse módulo.
- Personagem sem animação de entrada, flutuação ou alteração de posição ao longo da observação.
- Comparação de capturas com e sem o personagem, mantendo os demais efeitos pausados durante a medição: nenhum vazamento da arte fora do polígono da divisão, para os cinco favoritos nos tamanhos principais e após redimensionar a janela. A medição mantém foco e camadas de composição estáveis e tolera pequenas diferenças de rasterização de até 16 níveis por canal de cor.
- Recorte acompanha o redimensionamento e o espaço interno do SVG em retrato; borda desenhada sobre o personagem.
- Enquadramento menor, com pontos de referência para o rosto em cada arte, revisto em computador e celular.
- Movimento reduzido aplicado ao menu.
- Nenhuma exceção JavaScript ou resposta HTTP de erro durante os fluxos.

Também passou uma conferência isolada de renderização em computador e celular, reabrindo o seletor após trocar todos os favoritos e verificando as cinco miniaturas carregadas. As capturas finais foram revisadas visualmente. `git diff --check` passou.

## Capturas desta versão

[Menu no computador](previews/menu-v0.40.0-desktop.png) · [Menu no celular](previews/menu-v0.40.0-celular.png)

[Seletor no computador](previews/favoritos-v0.40.0-desktop.png) · [Seletor no celular](previews/favoritos-v0.40.0-celular.png)

[Vitória no computador](previews/vitoria-v0.40.0-desktop.png) · [Vitória no celular](previews/vitoria-v0.40.0-celular.png)
