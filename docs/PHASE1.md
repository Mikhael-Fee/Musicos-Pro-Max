> Registro histórico da Fase 1 (3.0). Para os recursos atuais, consulte [PHASE2.md](PHASE2.md) e [README](../README.md).

# Auditoria e entrega da Fase 1

Data: 03/11/2026. Escopo: pedido de evolução pedagógica mais inclusão básica funcional do contrabaixo. Sem migração de framework ou backend.

## Auditoria inicial

| Componente | O que foi preservado | Mudança necessária |
| --- | --- | --- |
| `theory.js` | Grafia contextual, escalas, fórmulas, inversões e condução de vozes testadas | Reutilização como fonte musical comum às aulas e ao baixo |
| `guitar.js` | Posições usuais, CAGED, limites físicos e omissões honestas | Preservar regras próprias do violão |
| `audio.js` | Web Audio, canais separados, relógio comum, caudas naturais e avisos | Canal e timbre de baixo no registro real |
| `instruments.js` | Diagramas, teclado, cores, MIDI e foco | Baixo de quatro cordas; comparação responsiva e foco/rolagem por instrumento |
| `app.js` | Exploração, ouvido, formação, guiado e ciclos | Retirar pressupostos de dois instrumentos; política Desafio, sequências, sessões e eventos para a plataforma |
| Persistência | Preferências v2 e totais v1 | Novo módulo versionado, migração idempotente, resultados por habilidade e instrumento |
| Navegação | Laboratório e treinos funcionais | Entrada simples, catálogo e três aulas reais |
| Testes | Suíte musical e de interação existente | Atualizar rotas de entrada, mantendo suas verificações; novos testes para baixo, aulas e progresso |

A base estática já atendia ao som local e à teoria. O principal problema pedagógico era oferecer perguntas soltas com contadores globais. A prévia de alternativas auditivas era útil para aprender, mas inadequada a um desafio; agora cada política tem comportamento explícito.

## Implementação

Três unidades publicadas: notas/acidentes/oitavas, intervalos e tríades/arpejos. Cada uma oferece objetivo, explicações, dois exemplos, quatro questões, feedback, conclusão a partir de 75% e opção de repetir. Os exemplos ficam junto ao instrumento. Há instruções específicas para baixistas e acesso direto sem pré-requisitos artificiais.

As sete trilhas têm estrutura modular. Escalas, Harmonia, Ritmo e Aplicação ainda não têm aulas publicadas; isso é indicado claramente no catálogo. O laboratório e os exercícios desses temas continuam disponíveis.

O baixo tem regras próprias em `bass.js`, MIDI E1/A1/D2/G2 e 20 casas. Escalas e arpejos respeitam esse registro. A formação de acordes é uma sequência de notas; as linhas guiadas têm um ataque por tempo. Não são exigidas posições simultâneas de violão nem atribuídas notas à execução física.

O novo progresso separa habilidades/instrumentos e preserva o histórico anterior sem inventar detalhes retroativos. Resultados recentes, variedade, dificuldade e múltiplas sessões fundamentam o indicador de consistência. Recargas encerram sessões incompletas como interrompidas, sem apagar suas respostas.

## Verificação

- Unitários: fórmulas e voicings existentes, 24 escalas de baixo, arpejos de todos os acordes/tons, quintas diminutas, migração, armazenamento indisponível, versões futuras e critérios de consistência.
- Navegador: aulas concluídas e não concluídas, persistência, troca de instrumento, escala e arpejos de baixo, ouvido sem prévia no Desafio, ciclos, cinco questões sem duplicar contagem, linhas no relógio do metrônomo e regressões anteriores.
- Áudio renderizado: fundamental E1, energia e decaimento, silêncio independente e demais verificações de teclado/violão/avisos.
- Layout e operação: celular e computador, comparação, foco de teclado, alvos de toque maiores no SVG e cores com texto/graus/símbolos.

WCAG 2.2 AA orientou foco, rótulos, contraste, navegação e feedback. Não houve certificação formal nem validação completa com leitores de tela/dispositivos físicos. O teclado virtual mantém uma disposição musical densa e rolagem interna; há navegação por teclado e botões de notas como alternativas no estudo.

## Limites e evolução

- Progresso local, sem conta, sincronização, backup em nuvem ou retomada da pergunta exata após recarregar. Respostas já registradas permanecem; a sessão interrompida aparece no histórico.
- Timbres sintetizados. Não há captação de microfone nem avaliação da execução real.
- A revisão da Fase 1 é por aula/habilidade; uma fila de perguntas erradas e revisões espaçadas ficam para a Fase 2.
- Recomendações da Fase 1 apontam aulas incompletas e habilidades a revisar. Não há ajuste automático de dificuldade disfarçado de adaptação.
- O guiado fornece pulsação e padrões básicos de baixo, sem medir precisão temporal. O módulo independente de ritmo da Fase 2 precisará de estratégia e validação de latência antes de pontuar toques.
- A Fase 2 prevê treinador de ritmo, revisão de erros, sessões recomendadas e adaptação básica validada.
- A Fase 3 avaliará notas isoladas por microfone, afinador, PWA/offline, outros instrumentos e exercícios avançados. Microfone exigirá consentimento, tratamento de falhas e critérios de evidência para avaliação real.

## Arquivos desta entrega

Novos: `assets/bass.js`, `assets/progress.js`, `assets/lessons.js`, `assets/platform.js`, `tests/phase1.test.cjs`, `tests/platform.spec.cjs` e este documento.

Adaptados: `index.html`, `assets/app.js`, `assets/instruments.js`, `assets/audio.js`, `assets/app.css`, `package.json`, `package-lock.json`, `tests/app.spec.cjs`, `tests/upgrades.spec.cjs`, `README.md`, `CHANGELOG.md` e `docs/DEPLOY.md`.

Resultado da validação da versão 3.0: **20 testes unitários e 62 de navegador passaram**, sem testes ignorados ou falhas esperadas. O build estático em `dist/` foi gerado com sucesso. A instalação usa o lockfile existente, sem nova dependência.
