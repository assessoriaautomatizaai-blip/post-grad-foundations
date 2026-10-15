import { describe, expect, it } from "vitest";

import { getRouter } from "./router";

// Transição entre páginas (prompt 03): o roteador usa a View Transitions API do navegador.
// Em navegador sem suporte, a troca de página acontece normalmente, sem animação.
describe("getRouter", () => {
  it("liga a transição de página por padrão", () => {
    expect(getRouter().options.defaultViewTransition).toBeTruthy();
  });
});
