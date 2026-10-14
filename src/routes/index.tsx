import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Projeto da Pós-Graduação" },
      { name: "description", content: "Projeto acadêmico de pós-graduação em desenvolvimento." },
      { property: "og:title", content: "Projeto da Pós-Graduação" },
      { property: "og:description", content: "Projeto acadêmico de pós-graduação em desenvolvimento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-foreground">Projeto da Pós-Graduação</h1>
        <p className="mt-2 text-muted-foreground">Em construção.</p>
      </div>
    </main>
  );
}
