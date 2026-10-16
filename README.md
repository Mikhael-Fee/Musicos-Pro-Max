# Músicos Pro Max

Estúdio de prática musical em português para teclado e violão, baseado no HTML original fornecido pelo autor. Aplicação estática, sem servidor de aplicação, banco de dados, conta ou serviços de áudio externos.

## O que estudar

- Campo harmônico maior e menor natural; tríades, tétrades, inversões e exploração de sétimas não diatônicas.
- Teclado de duas oitavas e violão de 12 casas, com acordes móveis, voicings compactos, capotraste e orientação das cordas.
- Escala inteira nos dois instrumentos; cifras, solfejo ou graus. A grafia respeita a tonalidade: Fá♯ maior contém Mi♯.
- Quatro exercícios de 10 questões: localizar notas, identificar graus, identificar acordes do campo e reconhecer intervalos ascendentes.
- Feedback após a resposta e totais de acertos, precisão e sessões completas no navegador.
- Treino guiado com metrônomo, seleção de tonalidades, reprodução em bloco/arpejo e botão de interrupção.

O modo menor é **menor natural**, não menor harmônica ou melódica. Nos exercícios de campo, as sétimas são sempre diatônicas. A seleção de sétimas forçadas vale para a exploração livre. Os exercícios usam respostas pela interface; não avaliam execução por microfone ou MIDI.

## Executar

Requisitos: Node.js 24, npm e Python 3 (servidor local de desenvolvimento).

```sh
npm ci
npm run dev
```

Abra a porta 5173 em seu ambiente de desenvolvimento. Nenhuma variável de ambiente é necessária. O áudio começa após uma interação do usuário, conforme a política do navegador.

```sh
npm run build   # gera dist/ apenas com os arquivos públicos
npm test        # testes de teoria, síntese e interação no site gerado
```

Os testes usam Chromium e Playwright. Se não houver Chromium do sistema:

```sh
npx playwright install --with-deps chromium
```

`CHROMIUM_PATH` permite usar outro executável. A suíte inicia e encerra seu próprio servidor de teste. Caso já haja um servidor na porta 5173, encerre-o para garantir que os testes usem `dist/` recém-gerado. `npm run test:unit` executa somente a teoria e a síntese, sem navegador.

## Publicação no endereço existente

Consulte [o guia do Netlify](docs/DEPLOY.md). `netlify.toml` define `npm run build` e publicação de `dist/`. Não contém credenciais. O vínculo Git deve ser configurado no **projeto já existente** para preservar `musicospromax.netlify.app`.

## Organização

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` | Interface e controles |
| `assets/theory.js` | Escalas, grafia contextual, acordes e intervalos |
| `assets/audio.js` | Síntese local, volume e gerenciamento de vozes |
| `assets/study.js` | Renderização dos instrumentos e recursos herdados do original |
| `assets/app.js` | Exercícios, persistência, escala e treino guiado cancelável |
| `assets/app.css` | Visual responsivo e acessibilidade |
| `assets/legacy.css` | Geometria original do teclado e braço |
| `scripts/build.cjs` | Cópia somente dos arquivos públicos para `dist/` |
| `tests/` | Testes automatizados |

## Áudio e dados locais

O teclado usa síntese aditiva com decaimento independente dos harmônicos. O violão usa síntese de corda dedilhada Karplus–Strong. São timbres sintetizados, não gravações de instrumentos acústicos. O volume das notas e do metrônomo passa por um compressor; a narração opcional depende da voz do sistema e do navegador e tem volume próprio do sistema.

Preferências e totais ficam em `localStorage`, sem sincronização entre aparelhos. O botão “Limpar progresso” apaga os totais. Se o armazenamento estiver indisponível, o treino continua em memória. As notas podem ser acionadas com clique, toque ou Enter/Espaço ao navegar com Tab. Os instrumentos têm rolagem horizontal em telas pequenas.

## Evolução

O arquivo recebido do autor está preservado no primeiro commit. As alterações desta versão estão no commit seguinte e no [histórico de mudanças](CHANGELOG.md). Para próximas versões: revisão espaçada por erro, progressões harmônicas, níveis de intervalos, escalas pentatônicas/modais e suporte MIDI. Estes itens ainda não foram implementados.
