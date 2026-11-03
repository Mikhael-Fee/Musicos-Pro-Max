# Músicos Pro Max

Plataforma estática de aprendizagem e prática musical em português para **violão, teclado e contrabaixo elétrico de quatro cordas**. Sem cadastro, banco, backend, serviços externos de áudio ou novas dependências de produção. A versão 3.2 implementa a Fase 3A: Percepção Tonal em Praticar → Ouvido, preservando ritmo, revisões, treino diário, adaptação e o laboratório da Fase 2. [Regras técnicas e limites da Fase 2](docs/PHASE2.md).

## Interface e aprendizagem

- **Início:** próxima aula, atalhos, progresso por instrumento/habilidade, conteúdos concluídos ou em revisão e histórico de atividades.
- **Aprender:** cinco unidades completas: notas/acidentes/oitavas; intervalos; tríades e arpejos; pulso e compasso; subdivisões e contratempo. Objetivo, explicações, dois exemplos interativos, quatro questões, feedback e revisão. Ouvir/ver os dois exemplos e acertar pelo menos 3/4 conclui uma unidade. A conclusão é distinta de consistência nos exercícios. Qualquer aula publicada pode ser aberta diretamente.
- **Praticar:** exercícios livres, Treino guiado, Ciclos, Ritmo, Revisar e Treino diário. Sessões livres de 5/10/15 questões; nível inicial/intermediário/ampliado ou automático opcional. O nível inicial usa tônica/terça/quinta nas notas e quatro intervalos; o intermediário usa os sete graus e seis intervalos; o avançado amplia os intervalos para todos os doze semitons. Tipos de acorde e tonalidade continuam selecionáveis.
- **Explorar:** laboratório de escalas, graus, campo harmônico, acordes e extensões, com representações e áudio próximos aos controles.

As sete trilhas têm uma estrutura declarada em `assets/lessons.js`. As trilhas sem unidades publicadas aparecem como conteúdo futuro, sem aulas fictícias. Há orientações de braço, afinação, arpejos e função harmônica específicas para baixistas nas três aulas iniciais.

**Aprender / Desafio nos exercícios:** Aprender mantém exemplos de alternativas antes da confirmação. Desafio registra a alternativa sem tocar nem mostrar sua resposta; a explicação só aparece após confirmar. No ouvido, apenas o alvo pode ser repetido, com a segunda posição oculta. Tocar livremente no instrumento não oferece prévias durante esse desafio. Os ciclos também têm os dois modos.

Os instrumentos podem ser alternados durante a atividade, preservando questão e acertos. Montagens e sequências têm seleções separadas. Comparações de dois ou três instrumentos usam painéis no computador e botões para exibir um painel por vez no celular. A referência sonora dos exercícios e os volumes continuam independentes da visualização.

A configuração principal tem tom, escala e visualização. Inversões/posição aberta ou fechada ficam no teclado; regiões do braço e volumes ficam nos respectivos instrumentos. Ajustes contém volume geral e avisos de acerto/erro, com prévias e volume próprio (85% inicial).

Alterações recebem azul forte; sextas, sétimas e extensões 9/11/13 recebem rosa nos botões, teclas ativas e pontos. Nomes, graus, símbolos e feedback textual complementam as cores. Os rótulos não aparecem nos exercícios de localizar notas antes da tentativa.

## Ouvido · percepção tonal (Fase 3A)

Em **Praticar → Ouvido**, escolha sensação/direção, centro tonal, graus, movimentos harmônicos ou reprodução melódica. O treino de intervalos anterior está acessível na mesma área. Uma referência I–IV–V–I estabelece o tom; ouça a pergunta inteira antes de confirmar. Escolha um dos 12 tons maiores ou sorteie outro entre atividades. O tom e o instrumento ficam fixos na atividade.

São 89 variações de exercícios originais, com três dificuldades por habilidade: direção/repetição/retorno; tônica, repouso contextual e cadências; graus e progressões; melodias de três a sete notas. No baixo, acordes são arpejos. Ouvir não destaca as notas corretas. Na reprodução, digitações alternativas e a frase inteira em outra oitava são aceitas, preservando os intervalos; ritmo e execução física não são pontuados. Após a resposta, compare o modelo com sua sequência ou ouça um exemplo da alternativa escolhida.

A ajuda é progressiva e explícita. Tentativas assistidas ficam como observações sem nota, não alimentam domínio e não avançam revisões. As cinco habilidades novas têm resultados separados por instrumento; erros podem ser revistos e planos diários novos incluem escuta tonal. Planos antigos e dados da Fase 2 são preservados. Consulte [arquitetura, critérios e limites da Fase 3A](docs/PHASE3A.md).

## Progresso local e migração

`assets/progress.js` mantém a chave `musicospromax.learning.v1`, agora com schema `version: 2`. A migração faz backup exato da versão 1 antes de gravar a nova versão e preserva habilidades, aulas, sessões, histórico legado e preferências. Os novos dados incluem revisões com snapshots, planos diários retomáveis e recomendações por habilidade/instrumento. Dados futuros e JSON inválido são preservados, com estudo em memória. Sem armazenamento disponível, o app continua funcionando em memória.

“Consistente” exige oito resultados recentes, 85% de acerto, duas sessões, quatro perguntas e experiência intermediária. Concluir uma aula não comprova domínio permanente. O painel compara sessões e resultados recentes e recomenda uma revisão vencida, a continuação do treino ou uma aula.

**Revisar minhas dificuldades:** cada erro novo guarda a pergunta e sua explicação. Intervalos retêm a alternativa confundida; notas em cordas mantêm a corda de estudo. Erros voltam em dez minutos. Acertos em revisões vencidas e sessões diferentes espaçam a questão por 1/3/7/14/30 dias. Não há repetição automática infinita nem invenção de questões a partir de dados antigos incompletos.

**Treino diário:** sessões opcionais de aproximadamente 5/10/15 minutos, com 6/12/18 atividades variadas. Misturam revisões, reforço, fundamentos, ritmo e um desafio. Uma resposta salva também avança o objetivo, sem duplicar contagem. É possível pausar, sair, recarregar, retomar o próximo objetivo ou encerrar com um resumo. A estimativa não impõe um cronômetro.

**Dificuldade automática:** usa até 20 respostas recentes, variedade, múltiplas sessões e erros repetidos. Sobe/desce um nível por vez, exigindo mais evidências antes de mudar novamente. O nível manual continua disponível. Consulte os critérios exatos em [PHASE2.md](docs/PHASE2.md).

## Ritmo

Módulo independente em Aprender e Praticar. Metrônomo de 40–160 BPM, 2/4, 3/4 e 4/4, 24 padrões com semínimas, mínimas, colcheias, semicolcheias e pausas. Há reconhecimento auditivo, reprodução por toques/espaço/Enter, aplicação em uma nota de violão/teclado/baixo, volume próprio, feedback e histórico. Modelos e cliques usam agendamento absoluto no relógio Web Audio, com preparação e entrada no tempo 1.

A avaliação separa estrutura e precisão: ignora deslocamento constante; avalia contagem e espaçamento relativo; uma execução temporal inconclusiva recebe observação sem nota. Ocultar a página cancela a atividade sem penalidade. A estimativa opcional de atraso combina reação humana e equipamento e não libera notas de precisão. Não há captação de microfone nem avaliação da execução física. Os resultados gerais de ritmo não são creditados ao instrumento usado como timbre.

## Contrabaixo elétrico

Afinação de quatro cordas, da mais grossa à mais fina: **E1 (MIDI 28), A1 (33), D2 (38), G2 (43)**, alturas sonoras reais. `assets/bass.js` define afinação, extensão de 0 a 20 casas, localização de notas, posições de escala e sequências próprias. Não adapta os voicings simultâneos do violão.

A posição automática usa a tônica da escala como referência; há regiões 0–4, 5–9, 12–16 e mapa completo. Uma região fixa que não comporte a oitava é ajustada para a posição automática ao ouvir a escala. O braço indica cordas, casas, notas, tônicas, graus e seleção e mantém o foco e a rolagem ao tocar.

Acordes no baixo são **arpejos**, com ataques separados, mesmo quando o estilo geral é “em bloco”. No exercício de formação, é necessário tocar as notas em ordem ascendente, começando na tônica; a mesma corda pode ser usada várias vezes. Oitavas alternativas são válidas se os intervalos da sequência forem preservados. Há treino de escala ascendente de uma oitava nos três instrumentos.

O treino guiado oferece tônicas, tônica/quinta, tônica/terça/quinta, tríades e tétrades. São quatro ataques de baixo sincronizados ao mesmo relógio do metrônomo; tétrades usam o campo com sétimas e quintas diminutas respeitam a fórmula do acorde. O guiado não avalia a precisão física; os novos exercícios de ritmo ficam em módulo próprio e distinguem estrutura de precisão temporal. Grooves avançados ficam para uma etapa futura. Nos ciclos, o baixo toca tônica e arpejo; a condução das vozes simultâneas continua própria do teclado e do violão.

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
npm run test:mobile # ouvido e regressões da Fase 2 em Chromium móvel com toque
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
| `assets/progress.js` | Migração, indicadores, revisões e sessões diárias |
| `assets/rhythm-core.js` | Compassos, padrões, tempos, análise estrutural e estimativa de atraso |
| `assets/rhythm-player.js` | Agendamento por relógio Web Audio e cancelamento |
| `assets/study-core.js` | Snapshots, planejamento e dificuldade adaptativa |
| `assets/phase2.js` | Ritmo, Revisar, Treino diário e evolução recente |
| `assets/lessons.js` | Cinco unidades completas e estrutura de trilhas |
| `assets/platform.js` | Início, catálogo, aulas e acompanhamento |
| `assets/guitar.js` | Afinação, posições usuais, voicings compactos e posições de escala |
| `assets/instruments.js` | Diagramas, braço, teclado e marcações de notas |
| `assets/app.js` | Interface, treinos, progressões, áudio coordenado e preferências |
| `assets/audio.js` | Timbres sintetizados, volume, compressor e metrônomo |
| `scripts/build.cjs` | Build estático em `dist/` |

O teclado usa síntese aditiva com ataque e harmônicos mais presentes; o violão usa síntese de corda dedilhada Karplus–Strong. São timbres sintetizados, não gravações acústicas. O áudio só é ativado após interação do usuário, conforme a política do navegador. Há canais independentes para teclado, violão, baixo, ritmo, feedback e metrônomo, além do volume geral e compressor. Novos ataques preservam as notas que já estão soando; somente eventos futuros da audição anterior são cancelados. Interromper, encerrar e ocultar a página aplicam uma saída curta e cancelam agendamentos. O treino guiado agenda acordes em bloco e cliques no mesmo relógio Web Audio; não usa narração antes do compasso. O modo dedilhado continua disponível para explorar acordes.

O projeto Netlify existente publica `dist/` com `npm run build`. Envie para uma branch, confirme testes e Actions antes de integrar em `main`; confira o commit publicado no mesmo endereço. Se a validação remota não puder ser concluída, preserve a branch sem alegar publicação aprovada. Consulte [DEPLOY.md](docs/DEPLOY.md) e [CHANGELOG.md](CHANGELOG.md). O GitHub Actions valida o projeto independentemente do Netlify; o deploy não espera o Actions por padrão.

## Escopo e próximos passos

Consulte a [auditoria histórica da Fase 1](docs/PHASE1.md), a [estabilização](docs/STABILIZATION.md), a [Fase 2 implementada](docs/PHASE2.md) e o [estado da entrega 3.1](docs/RELEASE-3.1.md). A [Fase 3A](docs/PHASE3A.md) acrescenta percepção tonal. Grooves, validação em aparelhos reais, exportação/importação, PWA, afinador e microfone permanecem no planejamento; não foram implementados nesta entrega.
