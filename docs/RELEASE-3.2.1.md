# Versão 3.2.1 — Revisão pedagógica de Ouvido

Esta entrega aprimora a Fase 3A. A Fase 3B não foi iniciada.

## Escuta adequada à habilidade

| Atividade | Preparação e instrução |
| --- | --- |
| Direção melódica | Somente as notas da pergunta, sem cadência, inclusive nas demonstrações e comparações. Não exige identificar uma tonalidade. |
| Centro tonal | Referência I–IV–V–I estabelece o centro; finais A/B mantêm apoio harmônico e seus rótulos. |
| Graus | Referência tonal antes da pergunta, incluindo as pequenas frases em contexto. |
| Harmonia | Contexto harmônico e modelos/cadências preservados. |
| Reprodução inicial | Frase de três notas diretamente, sem introdução harmônica. |
| Reprodução intermediária/ampliada | Referência tonal preservada para trabalhar relações de graus e resoluções. |

`TonalTheory.needsReference` concentra a política, aplicada pelo controlador e pelo player. Pedir referência explicitamente não acrescenta uma cadência à direção ou à reprodução inicial. O botão de repetição usa a mesma política; rótulos e estados distinguem escuta direta e referência/pergunta. Comparações sonoras continuam interrompíveis.

## Entrada simples para iniciantes

A primeira tela de direção mostra uma pergunta, um botão **Ouvir duas notas** e três alternativas grandes. O mesmo clique inicia a atividade e toca o exercício. Após ouvir, escolher uma alternativa dá o feedback; não há uma confirmação extra nesse caso. Perguntas mais complexas continuam com confirmação explícita.

A introdução opcional diferencia altura e intensidade: agudo não significa mais forte, grave significa altura menor e repetição mantém a altura. Há demonstrações de subida, descida e repetição, sem introdução harmônica. Configurações, ajuda e explicações aprofundadas ficam recolhidas. A tonalidade deixa de ser uma configuração de direção.

O feedback principal é curto e textual. Notas, graus, intervalos, funções e diagnóstico detalhado continuam disponíveis em **Entender a resposta**, sem reduzir o conteúdo avançado. A comparação entre o modelo e a resposta continua disponível após responder.

## Aprender, Praticar e Desafio

- **Aprender:** demonstrações, comparação, orientação visual após escutar e feedback sem penalidades. Resultados ficam como observações `learning`, sem alimentar acertos ou adaptação.
- **Praticar:** pergunta sem resposta antecipada e progresso autônomo. Consultar uma demonstração ou ajuda durante a tentativa a marca como assistida, sem nota nem avanço de revisão.
- **Desafio:** começa no intermediário, mantém a opção ampliada, não oferece dicas/demonstrações e guarda avaliação independente. O histórico identifica Desafio; seus acertos e erros não alteram o perfil adaptativo da prática nem as revisões normais.

A dificuldade automática e a seleção manual continuam em Praticar/Aprender. Desafio informa seu mínimo intermediário e permite seleção manual entre intermediário e ampliado; a preferência inicial da prática não é apagada. Revisões e tarefas diárias entram em Praticar, sem herdar uma preferência de Aprender ou Desafio.

## Progressão e preservação dos dados

Direção inicial usa duas notas: subida, descida e repetição. No intermediário há três/quatro notas e mudanças de direção; o ampliado gera frases de cinco a sete notas, retornos e padrões variados. Exercícios antigos, inclusive os mais curtos, continuam válidos em revisões já salvas.

Alturas de partida e oitavas variam em direção, respeitando a extensão dos três instrumentos. A transposição e a oitava escolhidas são guardadas no descritor da revisão; o alvo é repetido sem mudar de registro durante a atividade. Timbre, volume e articulação não mudam para denunciar alternativas.

O schema de aprendizagem continua na versão 2. Habilidades, aulas, sessões, revisões, planos antigos, backup e preferências da versão 3.2 são mantidos. O descritor só acrescenta `registerShift` quando necessário; tarefas antigas sem esse campo mantêm suas alturas. A preferência de experiência é opcional e assume Praticar quando ausente. Desafios usam sessões existentes com identificação de avaliação independente, sem duplicar o armazenamento ou criar serviços externos.

As outras áreas mantêm sua organização. A única mudança no histórico geral é identificar explicitamente Aprender e Desafio, evitando confundir seus resultados com a prática autônoma.

## Revisão dos outros exercícios

Foram corrigidos problemas objetivos de clareza: instrução genérica de cadência em atividades sem contexto tonal, excesso de explicação antes de responder, confirmação redundante para duas notas, comparação sonora sem acesso consistente a Interromper e possibilidade de herdar o modo visual errado ao abrir uma revisão. Graus, centro, harmonia e melodias contextuais preservam preparação e profundidade; suas explicações completas passaram para uma seção opcional.

## Verificação e publicação

Comandos: `npm run build`, `npm test`, `npm run test:mobile` e `git diff --check`. Os testes novos verificam a linha de áudio real nos três timbres, presença/ausência de preparação, contagem de notas, modos, assistência, independência do Desafio, persistência, registros seguros e referências de revisões/tarefas diárias. As suítes da Fase 2 e 3A permanecem ativas. O Actions executa build, unitários, navegador e mobile antes da integração.

Validação local: **41 unitários, 111 testes de navegador e 63 móveis aprovados**. Após o último ajuste visual, os sete fluxos pedagógicos foram repetidos em desktop e mobile, com **7/7 aprovações em cada rodada**, além de inspeção da captura móvel. Build e `git diff --check` passaram.

A branch desta entrega é `release/3.2.1-ear-pedagogy`. A revisão deve ter o Actions aprovado antes de avançar `main`. A validação do site público e os links do Actions da revisão exata são informados no relatório de entrega. O projeto Netlify continua usando Node 24 e `dist/`.

## Limitações

O repertório tonal permanece em tonalidades maiores. Mobile é validado em Chromium emulado; aparelhos físicos, Safari/iOS, Bluetooth e leitores de tela ainda exigem avaliação própria. Não há microfone, reconhecimento da execução física nem pontuação de ritmo na reprodução melódica. Exportação/importação, PWA e demais recursos da Fase 3B continuam no planejamento.
