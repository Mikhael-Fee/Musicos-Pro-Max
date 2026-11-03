# Fase 2 — ritmo, revisão e rotina de estudo

## Sequência e escopo

A estabilização foi aprovada antes desta fase: commit `8e27218`, Actions [41678598683](https://github.com/Mikhael-Fee/Musicos-Pro-Max/actions/runs/41678598683). O diagnóstico e a limitação de acesso ao log histórico estão em [STABILIZATION.md](STABILIZATION.md).

A versão 3.1 acrescenta módulos ao projeto estático, reutilizando teoria, timbres, instrumentos e validadores de exercícios. Sem banco, cadastro, microfone, bibliotecas de produção ou serviços pagos. Os exercícios livres, Aprender/Desafio, exploração, progressões e ciclos permanecem disponíveis.

## Ritmo

Disponível em Aprender e Praticar, com pulsação independente dos instrumentos. BPM de 40 a 160, compassos 2/4, 3/4 e 4/4, 24 padrões de um compasso em três níveis: semínimas/mínimas/pausas; colcheias/contratempos; semicolcheias e combinações. Os modelos demonstram **ataques**; o timbre percussivo não pretende representar a sustentação exata de cada figura. Alternativas de escuta nunca possuem a mesma sequência audível de ataques.

- **Escuta:** ouvir, escolher o padrão, receber modelo/explicação e avançar; a representação da resposta fica oculta até a tentativa.
- **Reprodução:** ouvir, solicitar a própria vez, aguardar uma contagem completa e tocar no tempo 1 seguinte. Entrada por ponteiro, espaço ou Enter; repetição automática de tecla é ignorada. Finalização manual mantém a janela aberta para acomodar atraso do dispositivo.
- **Aplicação:** metrônomo contínuo com agenda de áudio de 200 ms atualizada a cada 25 ms, sem reiniciar o relógio entre compassos e modelo na percussão ou em C3 do violão, C4 do teclado ou C2 do baixo. Volume próprio; a aplicação livre não recebe nota.
- **Estimativa de atraso:** 12 toques, descartando os dois primeiros. Mediana do deslocamento e mediana dos desvios absolutos; requer pelo menos oito amostras, deslocamento até 300 ms e dispersão até 60 ms. Combina reação humana e equipamento; não é uma calibração certificada e não habilita penalidades de precisão.

`rhythm-player.js` agenda cliques e ataques por tempos absolutos de `AudioContext.currentTime`. Temporizadores do DOM apenas atualizam o mostrador; não disparam os sons. O metrônomo livre mantém a mesma grade absoluta entre compassos; atrasos grandes da thread visual podem causar pulsos perdidos e não geram avaliação do aluno. Parar, navegar e ocultar a página cancelam os sons e callbacks. A contagem e o início do modelo compartilham o mesmo relógio.

### Avaliação sem falsa precisão

`rhythm-core.js` separa três casos:

1. Quantidade diferente de ataques: revisão da estrutura/contagem; não é uma medida de atraso.
2. Quantidade e espaçamentos relativos compatíveis: acerto estrutural. Remove-se o deslocamento constante alinhando o primeiro ataque; tolerância de `max(120 ms, 28% de um pulso)`. Não é certificado de execução precisa.
3. Mesma quantidade e espaçamentos divergentes ou interrupção: observação sem nota, sem incrementar erros ou criar revisão de precisão.

Uma entrada antecipada/tardia isolada não é pontuada como erro temporal. Uma pausa inicial não pode ser avaliada com alinhamento relativo do primeiro toque; essa limitação é deliberada. Dispositivos físicos, Bluetooth, leitores de tela e execução real não foram certificados. A tarefa rítmica é registrada em `general`, mesmo quando o timbre escolhido é baixo. Isso evita inventar habilidade de execução instrumental.

## Revisões direcionadas

Cada erro novo guarda um snapshot normalizado: tipo, tonalidade, escala e alvo. Notas em cordas guardam instrumento e corda; intervalos guardam distância e alternativa confundida; acordes guardam raiz/tipo; campos guardam grau e formato tríade/tétrade; aulas guardam unidade/índice; ritmos guardam padrão/modalidade. O registro inclui pergunta, resposta e explicação.

A área **Revisar minhas dificuldades** filtra instrumentos, mostra vencimentos, permite consultar explicação e reabre a questão no validador original. Notas numa revisão de cordas são pedidas na corda específica, aceitando oitavas equivalentes. Se a pessoa trocar para outro instrumento, o acerto pertence a esse instrumento e não resolve a revisão original.

- Erro: vencimento em 10 minutos, etapa zero.
- Acerto depois do vencimento, em sessão diferente: intervalos de 1, 3, 7, 14 e 30 dias, depois 30 dias.
- Acerto antecipado ou na mesma sessão: pratica, sem avançar o prazo.
- Novo erro: reinicia a sequência, preservando contagem de dificuldades.

O identificador usa instrumento/habilidade/questão; a alternativa confundida e o nível não criam duplicatas. Cada revisão é uma questão isolada, com retorno à lista; não há repetição infinita automática. Revisar um fragmento de aula não conclui a unidade. Dados antigos sem snapshot não geram perguntas inventadas.

## Treino diário

Sessões opcionais de aproximadamente 5/10/15 minutos correspondem a 6/12/18 objetivos. A duração é estimativa, sem cronômetro obrigatório. O planejamento combina até um terço de revisões vencidas, a habilidade com menor aproveitamento recente, fundamentos de outras áreas, ritmo e um pequeno desafio final. Perguntas não se duplicam no plano. Quando não há evidência, usa-se localização de notas como fundamento, sem alegar diagnóstico pessoal.

A sessão possui um único ID; exercícios filhos não simulam múltiplas sessões para a adaptação. Cada resposta e o avanço de objetivo são persistidos juntos. IDs de tentativa impedem duplicação. É possível pausar, sair, recarregar, retomar no próximo objetivo ou encerrar mantendo os resultados. Após uma recarga, sessões diárias abertas voltam em pausa. Uma pergunta ainda não respondida recomeça; respostas já salvas permanecem. O resumo mostra atividades, acertos avaliados, observações sem nota e tempo ativo aproximado.

## Adaptação e painel

A dificuldade automática é opcional. A escolha manual de nível continua disponível. O cálculo considera até 20 respostas recentes da habilidade no instrumento:

- Inicial → intermediário: pelo menos 8 respostas, 80% de acerto, 2 sessões e 4 perguntas diferentes.
- Intermediário → ampliado: pelo menos 12 respostas, 85%, 3 sessões, 6 perguntas e 8 tentativas intermediárias ou superiores.
- Três erros nas últimas cinco respostas: reduz um nível, com explicação.
- Cada mudança avança/reduz no máximo um nível; outra mudança exige quatro tentativas novas.

A recomendação é aplicada ao iniciar a atividade, sem mudar a dificuldade no meio de uma questão. A conclusão de aula não prova domínio. “Consistente” mantém o critério conservador próprio da V3: 8 respostas, 85%, 2 sessões, variedade e experiência intermediária. O painel mostra resultados recentes e tamanhos da janela observada, comparação de recortes das sessões com seus tamanhos de amostra, revisões vencidas, sessão diária pendente e próxima aula. Instrumentos têm habilidades separadas; ritmo geral é identificado como independente.

## Ensino

As três unidades iniciais receberam aplicações musicais, comparação de terças maior/menor, explicação da resposta escolhida e reabertura dos erros específicos. Há acesso à prática da habilidade após o resultado.

Duas unidades completas de ritmo ensinam pulso/acento/compasso/figuras/pausas e subdivisões/contratempo. Cada uma tem explicação, dois modelos audíveis, quatro questões corrigidas e acesso à prática rítmica. Conteúdo ainda não publicado continua marcado como futuro.

## Dados e migração

A chave `musicospromax.learning.v1` mantém compatibilidade de localização, mas passa a `version: 2`. A migração válida da versão 1 faz uma cópia exata em `musicospromax.learning.v1.backup.v1` antes de gravar a versão nova; não substitui uma cópia já existente. Preserva totais legados, habilidades, conclusão de aulas, histórico existente e preferências `musicospromax.settings.v2`.

A versão 2 guarda até 120 sessões, 200 revisões, 20 planos diários, 500 IDs de tentativa e 20 respostas recentes por habilidade. Esses limites evitam crescimento ilimitado do armazenamento; contadores cumulativos por habilidade permanecem. Novas preferências de ritmo usam `musicospromax.rhythm.v1`. Versões futuras e JSON inválido são preservados; novos resultados ficam em memória e a interface informa a incompatibilidade. Armazenamento bloqueado não impede o estudo em memória. Não há sincronização entre aparelhos.

## Validação e publicação

Os testes preservam as verificações da V3 e acrescentam teoria/tempo rítmico, áudio real renderizado offline nos três timbres, entrada por ponteiro/teclado, cancelamento, revisões reais, migração e backup, adaptação gradual, plano diário e retomada, duas unidades rítmicas completas e layout móvel. A verificação estrutural da entrada usa relógio determinístico no teste de teclado; a temporização e a energia reais do áudio são verificadas separadamente com `OfflineAudioContext`.

Resultado final e estado remoto serão registrados em [RELEASE-3.1.md](RELEASE-3.1.md). Uma execução local não substitui o GitHub Actions. A publicação no mesmo site depende do vínculo Netlify com `main`; não se atribui status Published sem evidência. A validação final acessou o domínio público e comparou os 15 assets com o commit corrigido; o painel, o SHA interno do deploy e os logs Netlify permanecem sem consulta autenticada. Consulte o relatório atualizado da versão.

## Próximos passos — Fase 3

Validar o toque em aparelhos reais e fones Bluetooth antes de oferecer pontuação de precisão; aprofundar grooves e articulações de baixo; publicar aulas de escalas/harmonia completas; avaliar PWA e exportação/importação explícita do progresso. Afinador ou análise por microfone exigem um projeto próprio de consentimento, tratamento de ruído e validação da altura detectada.
