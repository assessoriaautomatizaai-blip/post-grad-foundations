import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { URL_REPOSITORIO } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { useRevelar } from "@/hooks/useRevelar";

// Linguagem de "lei comentada" (prompt 03): seções numeradas como dispositivos, incisos com
// travessão, marca-texto e redação riscada, em vez de cards, ícones e gradientes.

// Texto literal da base (knowledge/base.json, lc214-art157). Fica aqui, e não importado da
// base, para a base não ir ao código do navegador; o teste confere que é igual ao da base.
const TRECHO_EXEMPLO = {
  artigo: "Art. 157.",
  realce: "Fica isento do IBS e da CBS",
  resto:
    "o fornecimento de serviços de transporte público coletivo de passageiros rodoviário e metroviário de caráter urbano, semiurbano e metropolitano, sob regime de autorização, permissão ou concessão pública.",
  citacao: "LC 214/2025, art. 157, caput",
  url: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm#art157",
};

// Toda seção abaixo do topo segue o mesmo esqueleto: dispositivo e título à esquerda,
// lista de incisos à direita, com o mesmo marcador, filete e tamanho de texto.
interface Linha {
  marcador: string;
  titulo: string;
  texto?: string;
  /** Riscado como a redação revogada no Planalto (o que o agente não responde). */
  revogado?: boolean;
}

const PASSOS: Linha[] = [
  {
    marcador: "I",
    titulo: "A pergunta chega",
    texto: "No chat do simulador, em linguagem do dia a dia.",
  },
  {
    marcador: "II",
    titulo: "O LLM lê a lei",
    texto:
      "O LLM recebe a base inteira: 96 trechos copiados literalmente do texto oficial da EC 132/2023 e da LC 214/2025, no Planalto.",
  },
  {
    marcador: "III",
    titulo: "Completa com a web",
    texto:
      "O que a lei não cobre — prazos, notas fiscais, comunicados — vem de busca no Google, sempre com o link da fonte.",
  },
  {
    marcador: "IV",
    titulo: "O código confere",
    texto:
      "Artigo que não existe na base bloqueia a resposta; complemento sem link é removido. Lei e web aparecem separadas.",
  },
];

const RESPONDE: Linha[] = [
  "O que são o IBS, a CBS e o Imposto Seletivo",
  "O cronograma de transição até 2033",
  "Split payment, créditos e cashback",
  "Cesta básica, imóveis, combustíveis e reduções de alíquota",
  "Simples Nacional, MEI e produtor rural",
  "Prazos e obrigações operacionais, com fonte da web",
].map((titulo, i) => ({ marcador: ["I", "II", "III", "IV", "V", "VI"][i] ?? "", titulo }));

const NAO_RESPONDE: Linha[] = [
  {
    marcador: "I",
    titulo: "Cálculo de imposto para o seu caso concreto",
    texto: "Explica a regra geral e indica um contador.",
    revogado: true,
  },
  {
    marcador: "II",
    titulo: "Planejamento tributário ou recomendação",
    texto: "Explica o que a lei diz, sem recomendar.",
    revogado: true,
  },
  {
    marcador: "III",
    titulo: "Assuntos fora de tributos",
    texto: "Explica o foco do agente e sugere perguntas.",
    revogado: true,
  },
];

const GARANTIAS: Linha[] = [
  {
    marcador: "96",
    titulo: "trechos de lei na base",
    texto: "Copiados literalmente do texto oficial da EC 132/2023 e da LC 214/2025.",
  },
  {
    marcador: "0",
    titulo: "artigos inventados entregues",
    texto: "Citação de lei que não existe na base bloqueia a resposta.",
  },
  {
    marcador: "100%",
    titulo: "dos complementos da web com link",
    texto: "Sem fonte, o complemento é removido antes de a resposta sair.",
  },
];

const ordem = (n: number) => ({ "--ordem": n }) as CSSProperties;

/** Bloco que se revela ao entrar na tela (marca-texto, filetes e itens em sequência). */
function Revelar({ className, children }: { className?: string; children: ReactNode }) {
  const [ref, visivel] = useRevelar<HTMLDivElement>();
  return (
    <div ref={ref} data-visivel={visivel} className={className}>
      {children}
    </div>
  );
}

/** Rótulo de seção no formato de dispositivo legal ("Art. 1º"). */
function Dispositivo({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
      {children}
    </p>
  );
}

/** Esqueleto único: dispositivo, título e resumo à esquerda; conteúdo à direita. */
function Secao({
  id,
  dispositivo,
  titulo,
  resumo,
  children,
}: {
  id: string;
  dispositivo: string;
  titulo: string;
  resumo: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="border-b">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Dispositivo>{dispositivo}</Dispositivo>
            <h2 id={id} className="mt-3 text-3xl font-semibold text-foreground">
              {titulo}
            </h2>
            <p className="mt-4 max-w-sm font-serif text-lg text-muted-foreground">{resumo}</p>
          </div>
        </div>
        <div className="lg:col-span-8">{children}</div>
      </div>
    </section>
  );
}

/**
 * Lista de incisos: a mesma linha em todas as seções. O marcador em algarismo romano é
 * decorativo; o marcador numérico (ex.: "96") é conteúdo e é lido pelo leitor de tela.
 */
function Lista({ linhas, marcadorLido = false }: { linhas: Linha[]; marcadorLido?: boolean }) {
  const [ref, visivel] = useRevelar<HTMLOListElement>();
  return (
    <ol ref={ref} data-visivel={visivel}>
      {linhas.map(({ marcador, titulo, texto, revogado }, i) => (
        <li
          key={titulo}
          className="surgir relative grid grid-cols-[3.5rem_1fr] gap-4 py-6"
          style={ordem(i)}
        >
          <span aria-hidden="true" className="filete absolute inset-x-0 top-0 h-px bg-border" />
          <span
            className="pt-0.5 font-mono text-sm text-primary"
            aria-hidden={marcadorLido ? undefined : true}
          >
            {marcadorLido ? marcador : `${marcador} –`}
          </span>
          <div>
            <p
              className={
                revogado
                  ? "revogado text-lg font-semibold text-muted-foreground"
                  : "text-lg font-semibold text-foreground"
              }
            >
              {titulo}
            </p>
            {texto && <p className="mt-1.5 max-w-xl text-muted-foreground">{texto}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PaginaInicial() {
  return (
    <>
      <section className="border-b">
        <Revelar className="mx-auto grid max-w-6xl gap-16 px-4 pt-14 pb-20 sm:px-6 md:pt-20 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <p className="flex items-center gap-3 font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
              <span aria-hidden="true" className="filete h-px w-10 bg-primary" />
              EC 132/2023 — LC 214/2025
            </p>
            <h1 className="mt-8 text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.03em] text-foreground sm:text-6xl">
              Dúvidas sobre a reforma tributária, respondidas em um{" "}
              <span className="realce-marca">piscar de olhos</span>.
            </h1>
            <p className="mt-6 max-w-xl font-serif text-lg leading-relaxed text-muted-foreground">
              O Inciso é um Agente de IA que responde em português claro e cita o artigo de lei de
              onde tirou cada informação. Quando a lei não basta, completa com fontes da web, sempre
              com o link e separadas do que é lei.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
              <Button asChild size="lg" className="group h-12 rounded-sm px-6">
                <Link to="/simulador">
                  Abrir o simulador
                  <ArrowRight
                    className="transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
              <a
                href={URL_REPOSITORIO}
                target="_blank"
                rel="noopener noreferrer"
                className="sublinhado py-1 text-sm font-medium text-foreground"
              >
                Ver o código e a documentação
              </a>
            </div>
          </div>

          <figure aria-label="Trecho da lei citado como fonte" className="lg:col-span-5 lg:pt-16">
            <div className="border-l-2 border-primary pl-6">
              <p className="font-mono text-[0.7rem] tracking-[0.14em] text-muted-foreground uppercase">
                Lei Complementar 214/2025
              </p>
              <blockquote className="mt-4 font-serif text-xl leading-relaxed text-foreground">
                <span className="font-semibold">{TRECHO_EXEMPLO.artigo}</span>{" "}
                <span className="realce-marca">{TRECHO_EXEMPLO.realce}</span> {TRECHO_EXEMPLO.resto}
              </blockquote>
            </div>
            <div className="surgir mt-8 ml-6 grid grid-cols-[auto_1fr] gap-3" style={ordem(6)}>
              <span aria-hidden="true" className="font-mono text-primary">
                ↳
              </span>
              <p className="text-sm text-muted-foreground">
                No chat:{" "}
                <span className="text-foreground">“Ônibus e metrô vão pagar imposto?”</span> A
                resposta cita este trecho, com o link oficial.
              </p>
            </div>
            <figcaption className="mt-6 ml-6 text-xs text-muted-foreground">
              <a
                href={TRECHO_EXEMPLO.url}
                target="_blank"
                rel="noopener noreferrer"
                className="sublinhado font-mono text-foreground"
              >
                {TRECHO_EXEMPLO.citacao}
              </a>{" "}
              · texto oficial no Planalto
            </figcaption>
          </figure>
        </Revelar>
      </section>

      <Secao
        id="como-funciona"
        dispositivo="Art. 1º"
        titulo="Como funciona"
        resumo="O LLM raciocina; o código confere as fontes antes de a resposta sair."
      >
        <Lista linhas={PASSOS} />
      </Secao>

      <Secao
        id="responde"
        dispositivo="Art. 2º"
        titulo="O que ele responde"
        resumo="Dúvidas sobre a reforma tributária do consumo, da lei ao dia a dia."
      >
        <Lista linhas={RESPONDE} />
      </Secao>

      <Secao
        id="nao-responde"
        dispositivo="Art. 3º"
        titulo="O que ele não responde"
        resumo="Riscado, como a redação revogada no texto oficial — e o que ele faz no lugar."
      >
        <Lista linhas={NAO_RESPONDE} />
      </Secao>

      <Secao
        id="transparencia"
        dispositivo="Art. 4º"
        titulo="Fonte em toda resposta"
        resumo="Garantias conferidas no código e em testes automatizados."
      >
        <Lista linhas={GARANTIAS} marcadorLido />
        <p className="mt-8 max-w-2xl text-sm text-muted-foreground">
          Base conferida em 15/10/2026. A avaliação com o LLM sobre o conjunto-ouro está sendo
          refeita para o método atual; o relatório publicado é o do método anterior (busca por
          palavras).
        </p>
        <a
          href={`${URL_REPOSITORIO}/blob/main/eval/relatorio.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="sublinhado mt-3 inline-block py-1 text-sm font-medium text-primary"
        >
          Ler o relatório da avaliação anterior
        </a>
      </Secao>
    </>
  );
}
