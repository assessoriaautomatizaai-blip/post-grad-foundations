import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Mesmo padrão do app-routing.test.tsx: casa a rota sem carregar nem renderizar.
describe("Rota do simulador", () => {
  it("existe uma página em /simulador", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    expect(router.matchRoutes("/simulador").at(-1)?.routeId).toBe("/simulador");
  });
});
