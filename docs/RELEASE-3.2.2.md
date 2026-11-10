# Versão 3.2.2 — Resposta do teclado virtual

## Problema identificado

Na versão pública 3.2.1, pressionar uma tecla com mouse não solicitava nenhuma nota ao Web Audio; a nota só era solicitada depois de soltar, no evento `click`. A verificação automatizada do site confirmou zero ataques durante a pressão e um após a liberação.

Além disso, o toque livre redesenhava os instrumentos antes do áudio, reconstruía o teclado e criava outra atualização visual agendada. Isso adicionava trabalho ao caminho de entrada e substituía as teclas entre ataques.

## Correção

- Mouse, toque e caneta acionam as teclas no `pointerdown`, sem esperar a liberação. O clique de compatibilidade não repete a nota.
- Enter, Espaço e ativação por tecnologia assistiva continuam pelo clique sem ponteiro. Navegadores sem Pointer Events mantêm o caminho anterior de clique.
- O áudio manual é solicitado antes da atualização visual e não entra na fila de espera de um aviso anterior.
- No toque livre do piano, apenas a seleção visual muda; o teclado não é reconstruído.
- Nas demais atualizações, as teclas são reutilizadas enquanto a extensão exibida for a mesma. Nomes, cores, emblemas, acessibilidade, foco e seleção continuam atualizados; mudanças de extensão ainda recriam as teclas necessárias.
- A resposta visual do piano não espera a transição de cor de 100 ms aplicada aos botões comuns.
- O AudioContext solicita a preferência de baixa latência `interactive`.

A síntese, as alturas, os volumes e os instrumentos não foram substituídos. A interpretação das respostas continua no mesmo controlador, incluindo o bloqueio de prévias no desafio auditivo. Não há alteração no armazenamento de progresso ou implementação de recursos da Fase 3B.

## Verificação

Os testes novos verificam áudio antes da liberação, ausência de notas duplicadas no clique posterior, dez ataques consecutivos mantendo as teclas no DOM, múltiplos dedos, Enter/Espaço, áudio antes da renderização e preservação do desafio auditivo. A suíte móvel também executa esses casos. As regressões existentes verificam timbres, notas, acordes, cores, exercícios, aprendizagem, ritmo, persistência e progressões.

Validação local concluída: 41 testes unitários, 116 testes de navegador e 68 testes em viewport mobile aprovados; build e verificação de whitespace aprovados.

Comandos: `npm test`, `npm run test:mobile`, `npm run build` e `git diff --check`. A branch de revisão é `fix/piano-touch-response`. Os resultados da revisão exata são conferidos no GitHub Actions antes de qualquer publicação.

## Limites

A verificação mede o disparo do áudio no software e o comportamento dos eventos. Não mede, com microfone, o tempo até o som sair de um aparelho físico. A abertura inicial do sistema de áudio, o navegador, a interface de som e fones Bluetooth podem acrescentar latência. O teste móvel usa Chromium emulado; aparelhos reais ainda precisam de validação do usuário.
