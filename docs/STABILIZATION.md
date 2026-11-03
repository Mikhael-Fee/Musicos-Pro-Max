# Estabilização da V3.0

Execução investigada: https://github.com/Mikhael-Fee/Musicos-Pro-Max/actions/runs/41665873943 (job 126020899115).

A página pública confirma falha na etapa `npx playwright install --with-deps chromium`, antes dos testes. As anotações mostram a migração de `ubuntu-latest` para Ubuntu 26 e Actions antigas em Node 20 forçadas a Node 24. Isso identifica riscos de compatibilidade; **não comprova a mensagem técnica que causou a falha**. O log detalhado exige login; a CLI recebeu Forbidden da API e o endpoint público de logs não forneceu os logs. Não foi inventada uma causa exata nem desativada validação TLS.

O workflow agora fixa `ubuntu-24.04` e o container oficial `mcr.microsoft.com/playwright:v1.58.2-noble`, correspondente ao lockfile. Chromium e bibliotecas de sistema já estão nessa imagem; a etapa verifica a versão e a presença do executável. Node 24, Python 3.12, instalação congelada, build, testes unitários e testes de navegador são obrigatórios. As Actions checkout/setup foram atualizadas para versões com Node 24. Falhas interrompem o job; relatórios são preservados, sem ignorar testes. Pushes em branches também executam a validação.

Correções funcionais: limpeza efetiva da sequência de aula e seu cache por instrumento; conclusão creditada aos instrumentos que responderam, sem atribuir uma aula inteira a uma troca passiva de visualização; sessões identificadas pelos instrumentos das respostas reais; próxima questão usando a visualização atual; ciclo registrado pela referência efetivamente ouvida; navegação repetida na área atual sem abandonar o treino.

A validação local não equivale a aprovação no GitHub Actions. Se o acesso remoto continuar indisponível, a Etapa 1 permanece com aprovação remota pendente e a entrega completa fica na branch, sem atualizar a produção.

## Resultado observado

O commit de estabilização `8e272188d8b86260aef1e922867d11f6d87d8651` passou em **86 testes locais (21 unitários e 65 de navegador)** e no GitHub Actions: https://github.com/Mikhael-Fee/Musicos-Pro-Max/actions/runs/41678598683, status público **Success**. A Fase 2 começou após essa confirmação. A mensagem interna da falha histórica continua indisponível sem os logs autenticados; essa limitação é distinta da aprovação da nova execução.
