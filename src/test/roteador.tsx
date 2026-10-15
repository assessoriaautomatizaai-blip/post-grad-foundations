import { render } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Renderiza `ui` dentro de um roteador em memória com as rotas do app ("/" e "/simulador"),
 * para testar componentes que usam <Link> sem montar o app inteiro.
 */
export async function renderComRoteador(ui: ReactNode, caminho = "/") {
  const raiz = createRootRoute({ component: () => <>{ui}</> });
  const filhas = ["/", "/simulador"].map((path) =>
    createRoute({ getParentRoute: () => raiz, path, component: () => null }),
  );
  const router = createRouter({
    routeTree: raiz.addChildren(filhas),
    history: createMemoryHistory({ initialEntries: [caminho] }),
  });
  await router.load();
  return render(<RouterProvider router={router} />);
}
