# Fase 3A — Ouvido e percepção tonal · versão 3.2

## Objetivo e integração

Praticar → Ouvido reúne um acesso ao treinamento de intervalos já existente e a nova percepção tonal. A navegação principal continua Início / Aprender / Praticar / Explorar. O objetivo é escutar, manter uma referência, memorizar relações e responder; não há avaliação de ouvido absoluto nem execução física.

Antes da implementação, foram identificados e reutilizados:

| Componente existente | Uso nesta entrega |
| --- | --- |
| `audio.js` / Web Audio | Mesmos timbres, canais, volume, síntese e cancelamento. Duração opcional da nota para frases com articulação uniforme; chamadas antigas mantêm a duração anterior. |
| `theory.js` | Escalas maiores, grafia, acordes diatônicos, alturas e transposição. |
| `instruments.js` / `app.js` | Mesmo teclado e braços, afinações reais, botões e entrada por teclado. O estúdio é posicionado junto à resposta melódica e restaurado ao sair. |
| `platform.js` | Registro de módulo dentro de Praticar, navegação e atalhos por habilidade. |
| `progress.js` | Mesmas sessões, habilidades por instrumento, revisões, observações assistidas e persistência. |
| `study-core.js` / `phase2.js` | Descritores validados de tarefa tonal, adaptação gradual, revisão da pergunta original e integração ao treino diário. |

`tonal-core.js` contém material e avaliação independentes do DOM; `tonal-player.js` agenda uma linha de áudio cancelável; `tonal.js` controla a atividade. Não foram duplicados o sintetizador, os instrumentos, o armazenamento ou o agendador de revisões. Não foram adicionadas dependências de produção, serviços ou credenciais.

## Conteúdo e quatro níveis pedagógicos

São **87 variações de exercícios originais**, transponíveis em **12 tonalidades maiores**. As frases não foram extraídas de hinos ou arranjos existentes: usam movimentos cantáveis, graus conjuntos, repetições, saltos simples e resoluções comuns, transferíveis para outros repertórios.

1. **Sensação e direção:** 19 exemplos de subida, descida, repetição, mudança de direção e retorno à nota inicial. Perguntas de direção e retorno são separadas para evitar alternativas ambíguas.
2. **Centro tonal:** 20 exemplos de identificação da tônica, frases que retornam ou permanecem fora do centro, comparação de dois finais apoiados por I e pequenas cadências. Repouso/tensão são explicados no contexto da referência e da harmonia; não como qualidades universais das notas.
3. **Graus e movimentos harmônicos:** 20 exemplos de graus e 16 de progressões, último acorde e conclusão de um trecho após memorizar o modelo. Inclui I–V–I, I–IV–I, I–IV–V–I, I–vi–IV–V, ii–V–I e extensões diatônicas desses movimentos. Acordes são identificados no feedback; alternativas usam graus relativos, sem mostrar a cifra correta no instrumento antes da tentativa.
4. **Reprodução melódica:** 12 frases, de três notas no inicial a quatro/cinco no intermediário e seis/sete no ampliado. Há notas repetidas, passos, saltos e resoluções. O aluno escuta, repete, toca no instrumento virtual e confirma.

Cada habilidade tem **três dificuldades internas**, automáticas ou manuais. Esses três graus de dificuldade não substituem os quatro níveis pedagógicos: o aluno escolhe o assunto, e a adaptação atua dentro dele.

## Contrato de escuta e áudio

- A atividade fixa tom e instrumento; podem ser escolhidos novamente na próxima. A opção automática sorteia o tom entre atividades.
- Uma referência I–IV–V–I estabelece o contexto. O estado da interface distingue referência, pergunta, finais A/B e modelo/trecho incompleto, sem pintar as notas do alvo.
- A confirmação só é liberada depois de ouvir a pergunta inteira. Repetições não mudam o alvo. Selecionar uma alternativa não toca uma prévia antes da tentativa.
- Timbre, volume e articulação são os mesmos dentro da atividade. Os movimentos são distinguidos por relações musicais, não por pistas artificiais de volume ou duração.
- No baixo, a referência e os movimentos de acordes são arpejados. A afinação E1–A1–D2–G2 e o registro grave são preservados.
- A linha usa `AudioContext.currentTime`. Interromper, trocar de área ou ocultar a página cancela vozes, callbacks e retomadas assíncronas pendentes. Uma escuta interrompida não libera confirmação nem inventa erro.
- Após responder, o aluno pode ouvir o modelo e sua sequência, ou um exemplo sonoro da alternativa escolhida. As comparações não registram outras tentativas.

## Avaliação, ajuda e progresso

A reprodução compara as alturas e os intervalos na ordem, sem exigir corda/casa específica. A frase inteira em outra oitava é aceita, mas trocar oitavas no meio alterando os saltos não é equivalente. A interface informa que a oitava inicial é livre; esta coleção não exige registro absoluto. O feedback diferencia quantidade, altura, ordem, direção e alterações de registro relativo. Ritmo e digitação não recebem nota.

As habilidades `tonal-direction`, `tonal-center`, `tonal-degrees`, `tonal-harmony` e `tonal-melody` têm resultados separados por instrumento. A dificuldade usa as regras existentes: variedade, resultados recentes e múltiplas sessões, com avanço de um nível e novas tentativas antes de outra mudança. A seleção manual continua disponível. O nível inicial de graus inclui perguntas de nota isolada e pequenas frases, permitindo reunir quatro perguntas diferentes mesmo mantendo um único tom; a regra de variedade não foi reduzida.

A primeira ajuda orienta a escuta; a segunda explicita notas ou relações. Qualquer ajuda marca a tentativa como **assistida**, registrada em observações, sem alimentar acertos, domínio, evidência adaptativa ou avanço de revisão. No treino diário ela é uma observação sem nota.

Erros sem assistência guardam o descritor exato — tom e exemplo — nas revisões existentes. Um acerto antecipado não avança o prazo; os espaçamentos continuam dependendo de vencimento e sessões distintas. Planos diários novos misturam atividades tonais, fundamentos e revisões, alternando a habilidade tonal entre planos. Planos antigos não são reescritos.

O schema de aprendizagem continua na versão 2, na chave existente. Novas preferências usam `musicospromax.ear.v1`; os resultados usam o armazenamento atual. Migração, backup, versões futuras, estudo em memória e limites de retenção da Fase 2 são preservados. Não há sincronização remota.

## Verificação e entrega

Comandos reproduzíveis: `npm ci`, `npm run build`, `npm test`, `npm run test:mobile`, `git diff --check`. O teste móvel usa Chromium emulado, toque e viewport 390 × 844, mantendo testes específicos que também verificam outras larguras. O Actions executa build, unitários, navegador e mobile na imagem Playwright fixada pelo projeto.

A validação cobre transposição de todo o banco nos 12 tons e três instrumentos, validade das alternativas, contornos, sequências e oitavas, revisão exata e persistência, assistência sem nota, variedade dos planos, áudio renderizado offline, tempos e silêncio antes/depois, cancelamento inclusive durante `resume`, ausência de destaques ou prévias antes da tentativa, foco, entrada por teclado, layout móvel e retorno aos recursos da Fase 2.

Validação local concluída: **37 testes unitários, 101 testes de navegador na suíte completa e 53 testes móveis aprovados**, sem ignorados. Após o ajuste final do atalho por instrumento e da passagem ao próximo exercício, mais **2 testes focados de desktop e 2 móveis passaram**. Build e `git diff --check` passaram. Uma revisão adicional reproduziu o bloqueio do nível inicial de graus num tom fixo: três perguntas disponíveis não satisfaziam o critério de quatro perguntas distintas. Foram acrescentadas três pequenas frases em contexto, com IDs novos, sem alterar os exemplos ou as revisões já salvas. O teste de regressão verifica o avanço em cada habilidade sem exigir mudança de tom. A suíte final contém 38 unitários, 103 testes de navegador e 55 móveis; o resultado remoto da revisão exata é a condição de integração e pode ser consultado nas [execuções da branch](https://github.com/Mikhael-Fee/Musicos-Pro-Max/actions?query=branch%3Aphase3a%2Ftonal-ear-training). Resultados de áudio são de sinais e agendamento, não de audição humana em aparelhos reais. Alguns testes controlam o modelo ou o relógio para obter um oráculo determinístico; os testes de áudio renderizam sinais Web Audio reais separadamente.

A entrega deve ser enviada à branch `phase3a/tonal-ear-training` e ter o Actions aprovado **antes** de avançar `main`. Não se considera publicada apenas por um push. O site permanece no projeto Netlify existente, com `dist/` e Node 24. A validação pública deve comparar os novos módulos e executar um smoke funcional após a integração; status Published, SHA interno e logs de build Netlify requerem acesso ao painel/API, indisponível nesta sessão.

## Limitações e próximos passos

- Nesta etapa, somente tonalidades maiores e harmonia diatônica. Menor natural e dominante maior em menor exigirão exemplos e explicações próprios; não são confundidos ou simulados como já disponíveis.
- Não há reconhecimento de músicas, áudio enviado, microfone, pontuação de tempo/latência ou avaliação do instrumento físico.
- O material é uma coleção inicial de 87 variações e suas transposições; não promete domínio de repertório nem ouvido absoluto.
- Chromium móvel é emulação. Safari/iOS, aparelhos físicos, leitores de tela e Bluetooth precisam de validação específica. Progresso permanece local ao navegador.
- Próxima prioridade: observar estudantes reais, validar acessibilidade e audição nos dispositivos e ampliar exemplos conforme dificuldades comprovadas. Depois, expandir menor e harmonia contextual com critérios próprios.
- Exportação/importação, PWA/offline, latência física, grooves, novas aulas de escalas/harmonia e eventual microfone continuam no planejamento das próximas etapas da Fase 3; não foram implementados nesta entrega.
