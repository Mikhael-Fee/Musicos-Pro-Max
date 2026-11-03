# Músicos Pro Max

Plataforma estática de aprendizagem e prática musical em português para **violão, teclado e contrabaixo elétrico de quatro cordas**. Sem cadastro, banco, backend, serviços externos de áudio ou novas dependências de produção. A versão 3 implementa a Fase 1 pedagógica, preservando o laboratório e os treinos anteriores.

## Interface e aprendizagem

- **Início:** próxima aula, atalhos, progresso por instrumento/habilidade, conteúdos concluídos ou em revisão e histórico de atividades.
- **Aprender:** três unidades completas: notas/acidentes/oitavas; intervalos; tríades e arpejos. Objetivo, explicações, dois exemplos interativos, quatro questões, feedback e revisão. Ouvir/ver os dois exemplos e acertar pelo menos 3/4 conclui uma unidade. A conclusão é distinta de consistência nos exercícios. Qualquer aula publicada pode ser aberta diretamente.
- **Praticar:** exercícios livres, Treino guiado e Ciclos. Sessões livres de 5/10/15 questões; nível inicial/intermediário/avançado. O nível inicial usa tônica/terça/quinta nas notas e quatro intervalos; o intermediário usa os sete graus e seis intervalos; o avançado amplia os intervalos para todos os doze semitons. Tipos de acorde e tonalidade continuam selecionáveis.
- **Explorar:** laboratório de escalas, graus, campo harmônico, acordes e extensões, com representações e áudio próximos aos controles.

As sete trilhas têm uma estrutura declarada em `assets/lessons.js`. As trilhas sem unidades publicadas aparecem como conteúdo futuro, sem aulas fictícias. Há orientações de braço, afinação, arpejos e função harmônica específicas para baixistas nas três aulas iniciais.

**Aprender / Desafio nos exercícios:** Aprender mantém exemplos de alternativas antes da confirmação. Desafio registra a alternativa sem tocar nem mostrar sua resposta; a explicação só aparece após confirmar. No ouvido, apenas o alvo pode ser repetido, com a segunda posição oculta. Tocar livremente no instrumento não oferece prévias durante esse desafio. Os ciclos também têm os dois modos.

Os instrumentos podem ser alternados durante a atividade, preservando questão e acertos. Montagens e sequências têm seleções separadas. Comparações de dois ou três instrumentos usam painéis no computador e botões para exibir um painel por vez no celular. A referência sonora dos exercícios e os volumes continuam independentes da visualização.

A configuração principal tem tom, escala e visualização. Inversões/posição aberta ou fechada ficam no teclado; regiões do braço e volumes ficam nos respectivos instrumentos. Ajustes contém volume geral e avisos de acerto/erro, com prévias e volume próprio (85% inicial).

Alterações recebem azul forte; sextas, sétimas e extensões 9/11/13 recebem rosa nos botões, teclas ativas e pontos. Nomes, graus, símbolos e feedback textual complementam as cores. Os rótulos não aparecem nos exercícios de localizar notas antes da tentativa.

## Progresso local e migração

`assets/progress.js` mantém `musicospromax.learning.v1`, com schema `version: 1`, totais por habilidade/instrumento, últimas 20 respostas por habilidade, até 60 sessões e conclusão/melhor resultado das aulas. A migração importa uma única vez os totais válidos de `musicospromax.stats.v1` como histórico legado sem atribuí-los a habilidades desconhecidas. Os dados antigos e `musicospromax.settings.v2` são preservados para compatibilidade.

“Consistente” exige pelo menos oito resultados recentes, 85% de acerto, mais de uma sessão, quatro perguntas diferentes e evidência em dificuldade intermediária ou superior. “Revisar” usa o desempenho recente. Contagem isolada não significa domínio. Sessões guiadas registram atividade sem inventar acertos de execução física. Sessões interrompidas por recarga mantêm as respostas e são identificadas no histórico.

Armazenamento indisponível permite uso em memória. Um registro com versão futura/incompatível é preservado, sem sobrescrita; a interface informa que novos resultados ficam em memória. Não há sincronização, microfone nem avaliação da execução física. O painel recomenda aulas ainda não concluídas e oferece acesso às habilidades com resultados fracos; adaptação automática da dificuldade e revisão de perguntas erradas pertencem à Fase 2.

## Contrabaixo elétrico

Afinação de quatro cordas, da mais grossa à mais fina: **E1 (MIDI 28), A1 (33), D2 (38), G2 (43)**, alturas sonoras reais. `assets/bass.js` define afinação, extensão de 0 a 20 casas, localização de notas, posições de escala e sequências próprias. Não adapta os voicings simultâneos do violão.

A posição automática usa a tônica da escala como referência; há regiões 0–4, 5–9, 12–16 e mapa completo. Uma região fixa que não comporte a oitava é ajustada para a posição automática ao ouvir a escala. O braço indica cordas, casas, notas, tônicas, graus e seleção e mantém o foco e a rolagem ao tocar.

Acordes no baixo são **arpejos**, com ataques separados, mesmo quando o estilo geral é “em bloco”. No exercício de formação, é necessário tocar as notas em ordem ascendente, começando na tônica; a mesma corda pode ser usada várias vezes. Oitavas alternativas são válidas se os intervalos da sequência forem preservados. Há treino de escala ascendente de uma oitava nos três instrumentos.

O treino guiado oferece tônicas, tônica/quinta, tônica/terça/quinta, tríades e tétrades. São quatro ataques de baixo sincronizados ao mesmo relógio do metrônomo; tétrades usam o campo com sétimas e quintas diminutas respeitam a fórmula do acorde. Não há grooves, análise de latência ou pontuação rítmica automática nesta fase. Nos ciclos, o baixo toca tônica e arpejo; a condução das vozes simultâneas continua própria do teclado e do violão.

O timbre do baixo usa síntese aditiva percussiva própria, com fundamental grave, ataque de dedilhado e decaimento natural, em canal de volume independente. As posições, graus e sons usam o mesmo MIDI. Os timbres são sintetizados, sem amostras acústicas externas.

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

As sessões livres têm 5, 10 ou 15 questões; os ciclos têm doze. Acertos e totais da versão anterior são preservados. Preferências e totais ficam em `localStorage`, sem sincronização entre aparelhos. Sem armazenamento disponível, a prática continua em memória. Não há reconhecimento por microfone nem avaliação automática da execução física do instrumento.

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

## Ciclos de quartas e quintas

A aba **Ciclos** é independente das progressões de campo harmônico. Quartas avançam 5 semitons e quintas, 7. O tom da barra principal define o início, em qualquer uma das 12 tonalidades. A escolha Maior/Menor define a qualidade dos acordes de demonstração, não um campo diatônico comum a todo o ciclo.

Em Dó, quartas: C → F → Bb → Eb → Ab → Db → Gb → B → E → A → D → G → C. Quintas percorrem o sentido inverso. Há equivalências enarmônicas para evitar grafias pouco usuais (por exemplo, B equivale a Cb na passagem Gb → B).

As posições seguem **condução de vozes**, preservando o maior número de vozes no mesmo lugar e minimizando o deslocamento das restantes. No teclado, as inversões são escolhidas automaticamente, respeitando a posição aberta/fechada. Exemplo em Dó maior: C3–E3–G3 → C3–F3–A3 (**C → F/C**), mantendo Dó e movendo Mi/Sol em um/dois semitons. Em quintas: C3–E3–G3 → B2–D3–G3 (**C → G/B**). A cifra com barra indica o baixo; o nome do acorde no topo identifica a harmonia.

No violão, o ciclo usa tríades completas em três cordas vizinhas, mantendo as mesmas cordas, com amplitude máxima de quatro casas e até a casa 19. Em quintas, a tríade inicial é deslocada uma oitava acima para permitir a descida das vozes durante a volta. Os controles manuais de posição e inversão ficam ocultos nos ciclos; continuam disponíveis nos outros modos. O áudio, a indicação do baixo e a representação usam exatamente as posições calculadas. Cada instrumento informa quais notas ficam e quais teclas/casas devem mudar. Ao trocar o voicing, o teclado ajusta sua rolagem interna para manter as vozes visíveis, quando cabem na tela.

Na volta completa, as tríades maiores/menores preservam uma voz e deslocam as outras duas um ou dois semitons em cada passagem, nos 12 tons e nos dois sentidos. A harmonia retorna ao início, podendo terminar em outra oitava: conservar o registro exato inicial forçaria um salto em alguma troca.

“Ouvir ciclo completo” demonstra os 12 acordes e retorna à harmonia inicial. É possível parar a execução ou escolher um tom da sequência. “Treinar próximo tom” oferece 12 questões com alternativas que soam antes da confirmação, feedback de acerto/erro e registro único de cada resposta. Cada alternativa é conduzida a partir da posição de partida da questão, mesmo depois de ouvir alternativas erradas; a questão seguinte continua da posição correta confirmada. O mapa completo fica oculto durante o treino. A última questão verifica o retorno ao ponto de partida. O som pode ser violão, teclado ou os dois, respeitando os volumes individuais.

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

Os testes usam a porta 5174 e sempre iniciam seu próprio servidor sobre o build recém-gerado. Não reutilizam o servidor de desenvolvimento da porta 5173; assim, um servidor aberto não mascara um artefato desatualizado. A suíte verifica afinações e posições em todas as tonalidades/tipos, omissões, registros e teoria; também renderiza o grafo de áudio em OfflineAudioContext para conferir volumes, altura e harmônicos, e verifica respostas, persistência, progressões, ciclos, sincronização dos tempos e a proximidade dos controles e instrumentos em computador e celular.

## Organização e publicação

| Arquivo | Responsabilidade |
| --- | --- |
| `assets/theory.js` | Escalas, grafia, fórmulas e acordes diatônicos |
| `assets/bass.js` | Afinação grave, regiões, escalas, arpejos e linhas do baixo |
| `assets/progress.js` | Persistência, migração e indicadores por habilidade |
| `assets/lessons.js` | Conteúdo das três unidades e estrutura de trilhas |
| `assets/platform.js` | Início, catálogo, aulas e acompanhamento |
| `assets/guitar.js` | Afinação, posições usuais, voicings compactos e posições de escala |
| `assets/instruments.js` | Diagramas, braço, teclado e marcações de notas |
| `assets/app.js` | Interface, treinos, progressões, áudio coordenado e preferências |
| `assets/audio.js` | Timbres sintetizados, volume, compressor e metrônomo |
| `scripts/build.cjs` | Build estático em `dist/` |

O teclado usa síntese aditiva com ataque e harmônicos mais presentes; o violão usa síntese de corda dedilhada Karplus–Strong. São timbres sintetizados, não gravações acústicas. O áudio só é ativado após interação do usuário, conforme a política do navegador. Há canais independentes para teclado, violão, baixo, feedback e metrônomo, além do volume geral e compressor. Novos ataques preservam as notas que já estão soando; somente eventos futuros da audição anterior são cancelados. Interromper, encerrar e ocultar a página aplicam uma saída curta e cancelam agendamentos. O treino guiado agenda acordes em bloco e cliques no mesmo relógio Web Audio; não usa narração antes do compasso. O modo dedilhado continua disponível para explorar acordes.

O projeto Netlify existente publica `dist/` com `npm run build`. Envie para `main` somente após os testes; confirme o conteúdo no mesmo endereço. Consulte [DEPLOY.md](docs/DEPLOY.md) e [CHANGELOG.md](CHANGELOG.md). O GitHub Actions valida o projeto independentemente do Netlify; o deploy não espera o Actions por padrão.

## Escopo e próximos passos

Consulte [auditoria e entrega da Fase 1](docs/PHASE1.md). A Fase 2 prevê treinador rítmico, revisão de erros e adaptação de dificuldade; a Fase 3 avalia microfone, afinador, PWA offline e expansão. Nenhuma dessas fases foi antecipada.
