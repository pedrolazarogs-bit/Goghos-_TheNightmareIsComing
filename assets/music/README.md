# Trilha instrumental original de GOGHOS

Quatro composições criadas para o jogo, sem vozes, letras, coros ou gravações de músicas de terceiros. A escrita combina harpa em primeiro plano, cordas de nylon com caráter de alaúde, flauta, cordas suaves e violoncelo. A batalha acrescenta trompa, tímpano e tom grave discreto. A vitória retoma o motivo em um modo mais luminoso; a derrota o transforma em uma resposta mais lenta e delicada.

| Arquivo | Faixa | Função | Duração musical | Repetição |
| --- | --- | --- | --- | --- |
| `menu.mp3` | O Portal da Noite | Menu e navegação | 80 s | Sim |
| `combat.mp3` | Guardas da Daly Mãe | Batalha | 80 s | Sim |
| `victory.mp3` | Uma Luz no Santuário | Vitória | 24 s | Não |
| `defeat.mp3` | Ecos Depois da Batalha | Derrota | 28 s | Não |

As composições usam métrica de 6/8. Os BPM registrados no manifesto contam **colcheias**, não semínimas pontuadas: 144 colcheias/min equivalem a 48 pulsações compostas/min. Isso mantém o andamento calmo. A batalha chega a 60 pulsações compostas/min.

Os laços são renderizados em duas passagens. A segunda conserva a reverberação da anterior, evitando que cada repetição recomece seca. Um envelope de 4 ms previne estalos nas extremidades. Os arquivos finais são MP3 estéreo a 44,1 kHz e 160 kbit/s, com alvo de −17 LUFS e limite de −2 dBTP antes da compressão MP3. O volume musical é ajustável no jogo.

## Recriar as gravações

A partitura e o arranjo completos estão em [`scripts/build-soundtrack.py`](../../scripts/build-soundtrack.py). O script é determinístico quanto à composição, instrumentos, articulações e distribuição estéreo. A renderização pode variar levemente entre versões do sintetizador.

Requisitos de desenvolvimento: Python 3 com NumPy, `libfluidsynth`, FFmpeg e o banco GM `TimGM6mb.sf2`. Não são necessários para jogar: os MP3s já acompanham o projeto.

```sh
python3 scripts/build-soundtrack.py --soundfont /usr/share/sounds/sf2/TimGM6mb.sf2
```

Também é possível recriar somente uma faixa com `--track menu`, `combat`, `victory` ou `defeat`. O manifesto completo é refeito ao gerar as quatro faixas juntas.

## Instrumentos e créditos

A renderização usa os instrumentos locais do banco **TimGM6mb**, de **Tim Brechbill (2004)** e **David Bolton (2010)**, distribuído sob **GPL-2**. Os créditos originais completos estão em `TimGM6mb-CREDITS.txt`, e o texto da licença em `TimGM6mb-GPL-2.txt`. O banco SF2 não é distribuído dentro do projeto. A composição e o arranjo são originais para GOGHOS; os sons dos instrumentos provêm desse banco, renderizados com FluidSynth. Nenhuma faixa usa amostras vocais.
