/**
 * Move o foco depois que o React termina de aplicar a renderização.
 *
 * Não use `requestAnimationFrame` para isso. Ele só dispara quando a página é
 * de fato pintada, e em aba de segundo plano ou janela ocluída o callback
 * simplesmente nunca roda. Pior: nesse estado `document.visibilityState`
 * continua reportando `"visible"` e `document.hasFocus()` continua `true`, então
 * a aplicação não tem como perceber.
 *
 * Reproduzido em 19/09/2026: com a página sem composição, o `rAF` não disparou
 * em 2,5 s e, com isso, o painel abriu sem levar o foco para a aba, o Escape não
 * devolveu o foco ao acionador e o resumo de erros do formulário não recebeu
 * foco. As três falhas eram silenciosas.
 *
 * `setTimeout(…, 0)` roda na próxima macrotarefa, depois do commit do React e
 * independente de pintura. Foco não precisa de alinhamento com quadro.
 *
 * Para efeitos realmente visuais — rolagem, animação, medição de layout —
 * continue usando `requestAnimationFrame`.
 *
 * @param select Resolve o alvo no momento do foco, não antes. Assim um elemento
 *   que só existe depois do commit ainda é encontrado.
 * @returns Identificador do temporizador, para `window.clearTimeout` quando o
 *   efeito é desmontado antes de o foco acontecer.
 */
export const focusAfterRender = (
  select: () => HTMLElement | null | undefined,
  options?: FocusOptions,
): number => window.setTimeout(() => select()?.focus(options), 0);
