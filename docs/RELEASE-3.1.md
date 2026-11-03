# Entrega 3.1 — Fase 2

## Correções e interface

- CI com ambiente suportado e Chromium fornecido pela imagem oficial correspondente ao Playwright; nenhuma validação removida ou ignorada.
- Conclusão de aulas, respostas e sessões atribuídas ao instrumento utilizado, sequências realmente limpas, navegação repetida sem abandono e ciclos com referência correta.
- Rótulos/controles mais legíveis, alvos de toque, foco de teclado, contraste e organização móvel revisados. Novas atividades usam ajustes recolhíveis e superfície de prática própria, preservando a identidade visual.

## Implementado

Ritmo completo com metrônomo, três compassos, três níveis, 24 padrões, figuras/pausas, escuta e reprodução por toque/teclado; relógio Web Audio, volume e aplicação nos três timbres. Revisões com questão original e repetição espaçada. Treinos diários opcionais de 5/10/15 minutos, pausa/retomada e resumo. Dificuldade automática gradual com alternativa manual. Cinco aulas completas, painel recente por habilidade/instrumento e migração versionada com backup.

As regras, critérios de avaliação, armazenamento e limites estão em [PHASE2.md](PHASE2.md). A auditoria histórica está em [STABILIZATION.md](STABILIZATION.md).

## Verificação

`npm test` executa os unitários e os testes de navegador contra um build novo. A suíte mantém as regressões anteriores e acrescenta migração, revisão espaçada, dificuldade, cancelamento/temporização, áudio real renderizado offline, entrada por ponteiro/teclado, duas aulas rítmicas, plano diário completo no baixo, retomada e geometria móvel. `npm run build` gera o site estático em `dist/`; `git diff --check` verifica o patch.

A validação de estabilização passou em 86 testes locais e no [Actions 41678598683](https://github.com/Mikhael-Fee/Musicos-Pro-Max/actions/runs/41678598683). A versão completa passou localmente em **111 testes: 30 unitários e 81 de navegador**, sem falhas ou testes ignorados. O build de produção e `git diff --check` também passaram. A suíte inclui uma sessão diária inteira no baixo, alternância/retomada, preferências após recarga e continuidade do metrônomo entre compassos. As execuções remotas da revisão exata podem ser conferidas nos links abaixo; aprovação local não substitui o Actions.

## GitHub e Netlify

Branch de trabalho: [`phase2/stabilize-and-rhythm`](https://github.com/Mikhael-Fee/Musicos-Pro-Max/tree/phase2/stabilize-and-rhythm). [Comparação com main / abertura de PR](https://github.com/Mikhael-Fee/Musicos-Pro-Max/compare/main...phase2/stabilize-and-rhythm). [Execuções da branch](https://github.com/Mikhael-Fee/Musicos-Pro-Max/actions?query=branch%3Aphase2%2Fstabilize-and-rhythm).

A base de produção desta entrega é `9146cd6b7ef9a0450073d1aa01f5d70a64c3bd4a`. O fluxo envia primeiro a branch e só permite avançar `main` para a mesma revisão depois de confirmar o GitHub Actions aprovado. Se essa aprovação não puder ser obtida, a entrega permanece na branch. Um avanço de `main` permite a publicação automática já autorizada no projeto Netlify existente; não comprova por si só o status Published. Não foi criado um PR pela API: a sessão não possui acesso autenticado à API; o link acima permite abrir a comparação pronta.

O domínio `musicospromax.netlify.app` não está na lista de destinos permitidos da política de rede do ambiente; a consulta pública recebeu HTTP 403 do proxy. Não há integração Netlify autenticada nesta sessão. Portanto **não há confirmação de deploy ou de status Published**, nem foi alegada publicação em produção. O mesmo projeto/domínio continua sendo o destino, com configuração existente em `netlify.toml`.

Antes de integrar em `main`, confirmar o Actions da revisão exata. Para confirmar a publicação, verificar no projeto Netlify a implantação correspondente ao commit e o estado Published. O vínculo GitHub/Netlify já configurado deve ser mantido. O Netlify não aguarda os testes do Actions por padrão.

## Limites e Fase 3

A causa interna exata da falha histórica do Chromium ainda depende de logs autenticados indisponíveis; isso não impede verificar o sucesso da nova configuração. A estimativa de atraso mistura resposta humana e equipamento; não há pontuação certificada de precisão ou execução física. O progresso continua local ao navegador. A validação móvel usa Chromium emulado, sem certificação de Bluetooth ou leitores de tela.

Prioridades seguintes: ensaiar latência em aparelhos reais, aprofundar grooves de baixo e aulas de harmonia/escalas, permitir exportação/importação explícita dos dados e avaliar PWA. Afinador/microfone precisam de consentimento e validação própria antes de avaliar o estudante.
