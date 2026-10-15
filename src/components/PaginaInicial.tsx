import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  FileSearch,
  Globe,
  MessageCircle,
  ShieldCheck,
  X,
} from "lucide-react";

import { URL_REPOSITORIO } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";

const PASSOS = [
  {
    icone: MessageCircle,
    titulo: "A pergunta chega",
    texto: "Pelo WhatsApp ou pelo simulador, em linguagem do dia a dia.",
  },
  {
    icone: FileSearch,
    titulo: "O Gemini lê a lei",
    texto:
      "O modelo recebe a base inteira: 96 trechos copiados literalmente do texto oficial da EC 132/2023 e da LC 214/2025, no Planalto.",
  },
  {
    icone: Globe,
    titulo: "Completa com a web",
    texto:
      "O que a lei não cobre — prazos, notas fiscais, comunicados — vem de busca no Google, sempre com o link da fonte.",
  },
  {
    icone: ShieldCheck,
    titulo: "O código confere",
    texto:
      "Artigo que não existe na base bloqueia a resposta; complemento sem link é removido. Lei e web aparecem separadas.",
  },
] as const;

const RESPONDE = [
  "O que são o IBS, a CBS e o Imposto Seletivo",
  "O cronograma de transição até 2033",
  "Split payment, créditos e cashback",
  "Cesta básica, imóveis, combustíveis e reduções de alíquota",
  "Simples Nacional, MEI e produtor rural",
  "Prazos e obrigações operacionais, com fonte da web",
];

const NAO_RESPONDE = [
  "Cálculo de imposto para o seu caso concreto — explica a regra e indica um contador",
  "Planejamento tributário ou recomendação",
  "Assuntos fora de tributos — explica o foco e sugere perguntas",
];

// Garantias conferidas por testes automatizados (ADR-007) e conferência da base em 15/10/2026.
const RESULTADOS = [
  {
    valor: "96",
    rotulo: "trechos de lei na base",
    detalhe: "texto literal, conferido contra o Planalto",
  },
  {
    valor: "0",
    rotulo: "artigos inventados entregues",
    detalhe: "citação fora da base bloqueia a resposta",
  },
  {
    valor: "100%",
    rotulo: "dos complementos da web com link",
    detalhe: "sem fonte, o complemento é removido",
  },
] as const;

export function PaginaInicial() {
  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-accent),transparent_55%)]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 font-mono text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-selo" aria-hidden="true" />
              EC 132/2023 · LC 214/2025
            </p>
            <h1 className="mt-6 text-4xl font-semibold text-foreground sm:text-5xl">
              Dúvidas sobre a reforma tributária, respondidas com o{" "}
              <mark className="bg-transparent bg-[linear-gradient(transparent_62%,var(--color-realce)_62%)] text-inherit">
                dispositivo citado
              </mark>
              .
            </h1>
            <p className="mt-5 max-w-xl font-serif text-lg text-muted-foreground">
              O Inciso é um agente de WhatsApp que responde em português claro e cita o artigo de
              lei de onde tirou cada informação. Quando a lei não basta, completa com fontes da web,
              sempre com o link e separadas do que é lei.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="group">
                <Link to="/simulador">
                  Abrir o simulador
                  <ArrowRight
                    className="transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={URL_REPOSITORIO} target="_blank" rel="noopener noreferrer">
                  Ver o código e a documentação
                </a>
              </Button>
            </div>
          </div>

          <figure
            aria-label="Exemplo de conversa"
            className="rounded-2xl border bg-card p-5 shadow-lg shadow-primary/5"
          >
            <div className="flex flex-col gap-3 text-sm">
              <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground">
                O que é o split payment?
              </p>
              <div className="mr-auto max-w-[90%] rounded-2xl rounded-bl-sm bg-secondary px-4 py-3 text-secondary-foreground">
                <p className="text-muted-foreground">
                  A resposta vem redigida a partir do dispositivo que trata do tema, com a fonte ao
                  final:
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-citacao-borda bg-citacao px-2.5 py-1 font-mono text-xs font-medium text-citacao-foreground">
                  <BookOpenCheck className="size-3.5" aria-hidden="true" />
                  LC 214/2025, art. 31, caput
                </span>
              </div>
            </div>
            <figcaption className="mt-4 border-t pt-3 text-xs text-muted-foreground">
              Ilustração do formato. Experimente a resposta real no simulador.
            </figcaption>
          </figure>
        </div>
      </section>

      <section aria-labelledby="como-funciona" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 id="como-funciona" className="text-3xl font-semibold text-foreground">
          Como funciona
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          O modelo raciocina; o código confere as fontes antes de a resposta sair.
        </p>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map(({ icone: Icone, titulo, texto }, i) => (
            <li key={titulo} className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icone className="size-4.5" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs text-muted-foreground" aria-hidden="true">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{titulo}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-2xl font-semibold text-foreground">O que ele responde</h2>
            <ul className="mt-5 space-y-3">
              {RESPONDE.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-2xl font-semibold text-foreground">O que ele não responde</h2>
            <ul className="mt-5 space-y-3">
              {NAO_RESPONDE.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-foreground">
                  <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="transparencia" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 id="transparencia" className="text-3xl font-semibold text-foreground">
          Fonte em toda resposta
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Garantias conferidas no código e em testes automatizados; base conferida em 15/10/2026. A
          avaliação com o Gemini sobre o conjunto-ouro está sendo refeita para o método atual; o
          relatório publicado é o do método anterior (busca por palavras).
        </p>
        <dl className="mt-10 grid gap-4 sm:grid-cols-3">
          {RESULTADOS.map(({ valor, rotulo, detalhe }) => (
            <div key={rotulo} className="rounded-xl border bg-card p-6">
              <dt className="text-sm text-muted-foreground">{rotulo}</dt>
              <dd className="mt-2 font-mono text-4xl font-medium tracking-tight text-foreground">
                {valor}
              </dd>
              <dd className="mt-1 text-xs text-muted-foreground">{detalhe}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm">
          <a
            href={`${URL_REPOSITORIO}/blob/main/eval/relatorio.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-4 hover:no-underline"
          >
            Ler o relatório da avaliação anterior
          </a>
        </p>
      </section>
    </>
  );
}
