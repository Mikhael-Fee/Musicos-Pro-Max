# Músicos Pro Max

Estúdio de prática musical em português para violão e teclado. Aplicação estática sem cadastro, banco, backend ou serviços externos de áudio. O HTML original do autor está preservado no primeiro commit; a versão 2 substitui a interface e a lógica de ensino herdadas.

## Interface e fluxo

- **Explorar:** campo harmônico, escala no instrumento ou acorde com extensões. Escolha, áudio e representação ficam na mesma área. O padrão é violão; há teclado e comparação dos dois lado a lado no computador.
- **Exercícios:** encontre a nota, monte o acorde, intervalos de ouvido, graus e campo harmônico. As opções de resposta tocam e ficam marcadas antes de confirmar. O exercício de nota tem resposta imediata.
- **Treino guiado:** o modelo aparece e toca imediatamente. Depois vêm quatro tempos para praticar. Por padrão a passagem ao próximo acorde é manual; avanço automático e repetições são opcionais.

A configuração principal tem somente tom, escala e instrumento. Volume, nomes das notas, inversão do teclado, modo de reprodução e narração ficam em “Ajustes”.

## Convenções de violão

Afinação padrão, da sexta para a primeira corda: **E2 A2 D3 G3 B3 E4**. Não existe uma única digitação universal por acorde.

1. **Posição didática:** prioriza posições usuais documentadas (C, D, E, F, G, A, B, menores e sétimas comuns); depois usa formas móveis de E e A do CAGED. Outros tipos usam um voicing de estudo calculado, identificado como tal. São cordas vizinhas, sem lacunas internas e com amplitude máxima de quatro casas entre os dedos.
2. **Posição compacta:** até quatro cordas vizinhas. Pode usar inversão do acorde, identificada na tela. A tônica e as notas obrigatórias permanecem presentes.
3. **Mapa completo:** mostra todas as ocorrências das notas do acorde/escala até a casa 12. É uma exploração de possibilidades, não uma sugestão de tocar todas as notas simultaneamente.

Os diagramas seguem a convenção de sexta corda à esquerda e primeira à direita. `×` significa não tocar; `○`, corda solta. A receita lista as casas da sexta para a primeira corda. Dedos são apresentados apenas para as posições usuais documentadas: 1 indicador, 2 médio, 3 anelar, 4 mínimo. Barras indicam pestanas quando a digitação documentada repete o dedo na mesma casa. Formas calculadas não recebem numeração automática de dedos.

As escalas maior e menor natural abrem na posição inicial (casas 0–4). Há posições móveis com referência na sexta/quinta corda e uma versão compacta de uma oitava ascendente. Toda posição oferecida tem caminho ascendente completo para as 24 tonalidades. Não se usa a expressão “padrão universal de escala” para uma única posição. A grafia respeita a tonalidade, inclusive Mi♯ em Fá♯ maior.

## Acordes e exercícios

São 19 tipos: maior, menor, diminuto, 7, 7M, m7, m7(b5), dim7, sus2, sus4, 6, m6, add9, 9, 7M(9), m9, 11, m11 e 13.

- `sus2` e `sus4` substituem a terça; não são a mesma coisa que acrescentar uma nota à tríade.
- `add9` acrescenta a nona sem sétima.
- 9, 11 e 13 são extensões de acordes com sétima. A fórmula completa continua visível no teclado e nas notas individuais.
- No violão, acordes com mais de quatro notas retêm como obrigatórias tônica, terça, sétima e extensão mais alta. Quinta e extensões internas podem ser omitidas, e essas omissões são informadas explicitamente. O algoritmo não inventa uma digitação impossível de sete notas distintas em seis cordas.
- No treino “Monte o acorde”, o violão aceita uma casa por corda e verifica as notas obrigatórias, notas estranhas e amplitude da posição. Duplicações são aceitas. O teclado verifica todos os sons da fórmula, em qualquer oitava.

Nos intervalos, a primeira nota fica fixa na tonalidade escolhida. “Ouvir desafio” esconde a posição da segunda nota até a resposta; clicar numa opção toca um exemplo com a mesma referência e marca as duas notas. “Confirmar” registra um único resultado e permite comparar com a resposta correta. O violão usa uma referência numa região em que a oitava inteira cabe na posição inicial, evitando uma comparação escondida por rolagem lateral.

Os exercícios têm dez questões. Acertos e totais da versão anterior são preservados. Preferências e totais ficam em `localStorage`, sem sincronização entre aparelhos. Sem armazenamento disponível, a prática continua em memória. Não há reconhecimento por microfone nem avaliação automática da execução física do instrumento.

## Progressões gospel / worship

As progressões são usadas em gospel, worship e também em outros gêneros, sem atribuição exclusiva:

| Graus | Em Dó maior |
| --- | --- |
| 4–5–6–3 (padrão inicial) | F – G – Am – Em |
| 1–5–6–4 | C – G – Am – F |
| 6–4–1–5 | Am – F – C – G |
| 4–1–5–6 | F – C – G – Am |
| 1–6–4–5 | C – Am – F – G |
| 1–4–1–5 | C – F – C – G |

Também há 1–4–5–1, 2–5–1 e os sete graus. O treino transpõe os acordes para a escala escolhida e oferece tríades/sétimas, 1/2/4 voltas, BPM entre 40 e 160 e passagem manual/automática. No modo menor usa **menor natural**; o V não é alterado para maior como acontece na menor harmônica. Não implementa dominantes secundárias ou reharmonizações automaticamente.

## Desenvolver e testar

Requisitos: Node.js 24, npm e Python 3. Para os testes de interface, Chromium.

```sh
npm ci
npm run dev
```

O servidor de desenvolvimento usa a porta 5173. Não são necessárias variáveis ou credenciais para executar a aplicação.

```sh
npm run build   # somente os arquivos públicos em dist/
npm test        # teoria, voicings, áudio e interação no site gerado
npm run test:unit
```

Os testes de navegador usam o Chromium do sistema quando disponível ou o instalado pelo Playwright. `CHROMIUM_PATH` permite escolher o executável. Se necessário:

```sh
npx playwright install --with-deps chromium
```

Os testes usam a porta 5174 e sempre iniciam seu próprio servidor sobre o build recém-gerado. Não reutilizam o servidor de desenvolvimento da porta 5173; assim, um servidor aberto não mascara um artefato desatualizado. A suíte verifica afinações e posições em todas as tonalidades/tipos, omissões, registros e teoria; também verifica som, respostas, persistência, progressões e a proximidade dos controles e instrumentos em computador e celular.

## Organização e publicação

| Arquivo | Responsabilidade |
| --- | --- |
| `assets/theory.js` | Escalas, grafia, fórmulas e acordes diatônicos |
| `assets/guitar.js` | Afinação, posições usuais, voicings compactos e posições de escala |
| `assets/instruments.js` | Diagramas, braço, teclado e marcações de notas |
| `assets/app.js` | Interface, treinos, progressões, áudio coordenado e preferências |
| `assets/audio.js` | Timbres sintetizados, volume, compressor e metrônomo |
| `scripts/build.cjs` | Build estático em `dist/` |

O teclado usa síntese aditiva e o violão síntese de corda dedilhada Karplus–Strong. São timbres sintetizados, não gravações acústicas. O áudio só é ativado após interação do usuário, conforme a política do navegador. A narração opcional usa a voz do sistema. O volume de notas e metrônomo é comum; a voz tem controle do sistema. O áudio e o treino guiado param ao ocultar a página.

O projeto Netlify existente publica `dist/` com `npm run build`. Envie para `main` somente após os testes; confirme o conteúdo no mesmo endereço. Consulte [DEPLOY.md](docs/DEPLOY.md) e [CHANGELOG.md](CHANGELOG.md). O GitHub Actions valida o projeto independentemente do Netlify; o deploy não espera o Actions por padrão.
