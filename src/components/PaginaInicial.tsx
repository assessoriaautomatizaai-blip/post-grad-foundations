import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUp } from "lucide-react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { URL_REPOSITORIO } from "@/components/layout/SiteLayout";
import { LogoSimbolo } from "@/components/marca/Logo";
import { podeAnimar, useRevelar } from "@/hooks/useRevelar";

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
          <Revelar className="lg:sticky lg:top-28">
            <Dispositivo>{dispositivo}</Dispositivo>
            <h2 id={id} className="tinta mt-3 text-3xl font-semibold text-foreground">
              {titulo}
            </h2>
            <p className="mt-4 max-w-sm font-serif text-lg text-muted-foreground">{resumo}</p>
          </Revelar>
        </div>
        <div className="cartao-vidro px-5 py-2 sm:px-7 lg:col-span-8">{children}</div>
      </div>
    </section>
  );
}

/**
 * Número que conta de 0 até o valor quando a lista aparece ("96", "100%"). Começa no valor
 * final, para quem não tem animação; só conta quando a página pode animar.
 */
function Contador({ valor, ativo }: { valor: string; ativo: boolean }) {
  const [, numero = "", sufixo = ""] = /^(\d+)(.*)$/.exec(valor) ?? [];
  const alvo = Number(numero);
  const [atual, setAtual] = useState(alvo);

  useEffect(() => {
    if (!ativo || alvo === 0 || !podeAnimar()) return;
    const duracao = 1200;
    const inicio = performance.now();
    let quadro = 0;
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracao);
      setAtual(Math.round(alvo * (1 - (1 - t) ** 3)));
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    setAtual(0);
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [ativo, alvo]);

  if (numero === "") return <>{valor}</>;
  return (
    <span className="tabular-nums">
      {atual}
      {sufixo}
    </span>
  );
}

/**
 * Lista de incisos: a mesma linha em todas as seções. O marcador em algarismo romano é
 * decorativo; o marcador numérico (ex.: "96") é conteúdo: conta na tela e fica com o valor
 * final para o leitor de tela. Com `progresso`, uma linha acompanha a leitura.
 */
function Lista({
  linhas,
  marcadorLido = false,
  progresso = false,
}: {
  linhas: Linha[];
  marcadorLido?: boolean;
  progresso?: boolean;
}) {
  const [ref, visivel] = useRevelar<HTMLOListElement>();
  return (
    <ol ref={ref} data-visivel={visivel} className="relative">
      {progresso && (
        <span
          aria-hidden="true"
          className="linha-progresso absolute top-0 -left-4 h-full w-0.5 rounded-full bg-primary"
        />
      )}
      {linhas.map(({ marcador, titulo, texto, revogado }, i) => (
        <li
          key={titulo}
          className="surgir group relative grid grid-cols-[3.5rem_1fr] gap-4 py-6"
          style={ordem(i)}
        >
          <span aria-hidden="true" className="filete absolute inset-x-0 top-0 h-px bg-border" />
          {marcadorLido ? (
            <span className="pt-0.5 font-mono text-sm text-primary">
              <span aria-hidden="true">
                <Contador valor={marcador} ativo={visivel} />
              </span>
              <span className="sr-only">{marcador}</span>
            </span>
          ) : (
            <span
              className="pt-0.5 font-mono text-sm text-primary transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            >
              {`${marcador} –`}
            </span>
          )}
          <div>
            <p
              className={
                revogado
                  ? "revogado text-lg font-semibold text-muted-foreground"
                  : "text-lg font-semibold text-foreground"
              }
            >
              {revogado ? titulo : <span className="marcavel">{titulo}</span>}
            </p>
            {texto && <p className="mt-1.5 max-w-xl text-muted-foreground">{texto}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

// Dispositivos que existem na base (knowledge/base.json), no formato "norma, dispositivo".
// O teste confere cada um contra a base: a faixa nunca mostra artigo inventado.
const DISPOSITIVOS_FAIXA = [
  "EC 132/2023, art. 2º (ADCT, art. 129)",
  "LC 214/2025, art. 1º",
  "LC 214/2025, art. 31, caput",
  "LC 214/2025, art. 157, caput",
  "LC 214/2025, art. 125, caput",
  "LC 214/2025, art. 112",
  "EC 132/2023, art. 8º",
  "LC 214/2025, art. 409, caput e § 1º",
  "LC 214/2025, art. 41, caput",
  "LC 214/2025, art. 251, caput e § 1º",
  "LC 214/2025, art. 7º-A, parágrafo único",
  "LC 214/2025, art. 172, caput",
  "EC 132/2023, art. 2º (ADCT, art. 127)",
  "LC 214/2025, art. 146, caput",
  "LC 214/2025, art. 260, caput",
];

/** Faixa em movimento com dispositivos da base, como a margem de um Diário Oficial. */
function FaixaDispositivos() {
  const itens = (copia: boolean) =>
    DISPOSITIVOS_FAIXA.map((d) => (
      <li key={`${copia}-${d}`} className="flex items-center gap-6 whitespace-nowrap">
        <span aria-hidden="true" className="size-1 rounded-full bg-selo" />
        {d}
      </li>
    ));
  return (
    <div className="faixa overflow-hidden border-b py-4 font-mono text-xs tracking-wide text-muted-foreground">
      <div className="faixa-trilho flex w-max gap-6">
        <ul aria-label="Alguns dispositivos da base" className="flex gap-6">
          {itens(false)}
        </ul>
        <ul aria-hidden="true" className="flex gap-6">
          {itens(true)}
        </ul>
      </div>
    </div>
  );
}

const atraso = (segundos: number) => ({ "--atraso": `${segundos}s` }) as CSSProperties;

/**
 * Demonstração do formato, sobre a folha de lei: pergunta → digitando → resposta que cita o
 * mesmo dispositivo marcado na folha. A resposta só afirma o que está no trecho literal
 * (TRECHO_EXEMPLO); o teste confere. Sem animação, aparece no estado final.
 */
function DemoResposta() {
  return (
    <aside
      aria-label="Demonstração de pergunta e resposta"
      className="cartao-vidro relative z-10 flex flex-col gap-3 p-4"
    >
      <p className="font-mono text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
        Consultor · demonstração
      </p>
      <div className="flex flex-col gap-3 text-[0.9rem] leading-snug">
        <p
          className="demo-passo balao-usuario max-w-[85%] self-end rounded-2xl rounded-br-md px-3.5 py-2"
          style={atraso(0.9)}
        >
          Ônibus e metrô vão pagar imposto?
        </p>
        <div className="grid self-start">
          <span
            aria-hidden="true"
            className="demo-digitando vidro [grid-area:1/1] items-center gap-1 self-start rounded-2xl rounded-tl-md px-3.5 py-3"
          >
            {[0, 150, 300].map((espera) => (
              <span
                key={espera}
                className="pontinho size-1.5 rounded-full bg-muted-foreground"
                style={{ animationDelay: `${espera}ms` }}
              />
            ))}
          </span>
          <div
            className="demo-passo vidro [grid-area:1/1] rounded-2xl rounded-tl-md px-3.5 py-2.5 text-foreground"
            style={atraso(2.7)}
          >
            <span
              aria-hidden="true"
              className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-tight"
            >
              <LogoSimbolo decorativo className="size-3.5" />
              Inciso
            </span>
            <p>
              Não. O transporte público coletivo de passageiros rodoviário e metroviário de caráter
              urbano é isento do IBS e da CBS.
            </p>
            <span
              className="demo-citacao mt-2 inline-flex rounded-full border border-citacao-borda bg-citacao px-2.5 py-0.5 font-mono text-xs font-medium text-citacao-foreground"
              style={atraso(3.2)}
            >
              {TRECHO_EXEMPLO.citacao}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

const TEMAS = [
  "O que é o IBS?",
  "Quando o ISS deixa de existir?",
  "Quem tem direito ao cashback?",
  "Como fica o MEI na reforma?",
];

export function PaginaInicial() {
  return (
    <>
      <section>
        <Revelar className="mx-auto flex max-w-4xl flex-col items-center px-4 pt-16 pb-14 text-center sm:px-6 md:pt-24">
          <p
            className="surgir vidro inline-flex items-center gap-2 rounded-full px-3.5 py-1 font-mono text-[0.68rem] tracking-[0.14em] text-muted-foreground uppercase"
            style={ordem(0)}
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-selo" />
            EC 132/2023 — LC 214/2025
          </p>
          <h1
            className="surgir mt-8 text-[2.6rem] leading-[1.06] font-semibold tracking-[-0.035em] text-foreground sm:text-6xl md:text-7xl"
            style={ordem(1)}
          >
            Dúvidas sobre a reforma tributária,{" "}
            <span className="font-medium text-muted-foreground">
              respondidas em um{" "}
              <span className="realce-marca text-foreground">piscar de olhos</span>.
            </span>
          </h1>
          <p
            className="surgir mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
            style={ordem(2)}
          >
            O Inciso é um Agente de IA que responde em português claro e cita o artigo de lei de
            onde tirou cada informação. Quando a lei não basta, completa com fontes da web, sempre
            com o link e separadas do que é lei.
          </p>

          <div className="surgir mt-10 w-full max-w-2xl" style={ordem(3)}>
            <Link
              to="/simulador"
              aria-label="Faça sua pergunta no Consultor"
              className="cartao-vidro group flex flex-col gap-6 p-4 text-left transition-transform duration-300 hover:-translate-y-0.5"
            >
              <span className="px-2 pt-1 text-[1.02rem] text-muted-foreground">
                Faça sua pergunta sobre a reforma tributária…
              </span>
              <span className="flex items-center justify-between border-t border-[var(--cartao-borda)] px-2 pt-3">
                <span className="font-mono text-[0.68rem] text-muted-foreground">
                  cita a lei · fontes com link
                </span>
                <span className="pilula-primaria flex size-9 items-center justify-center">
                  <ArrowUp className="size-4" aria-hidden="true" />
                </span>
              </span>
            </Link>
          </div>

          <div className="surgir mt-7 flex flex-col items-center gap-3" style={ordem(4)}>
            <p className="font-mono text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
              Explorar por tema
            </p>
            <ul className="flex flex-wrap justify-center gap-2">
              {TEMAS.map((tema) => (
                <li key={tema}>
                  <Link
                    to="/simulador"
                    className="vidro inline-flex rounded-full px-3.5 py-1.5 text-[0.82rem] font-medium text-foreground"
                  >
                    {tema}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="surgir mt-10" style={ordem(5)}>
            <Link
              to="/simulador"
              className="pilula-primaria group inline-flex h-11 items-center gap-2 px-6 text-sm font-medium"
            >
              Abrir o simulador
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </Revelar>
      </section>

      <section aria-label="Veja como o Inciso responde" className="px-4 pb-20 sm:px-6">
        <Revelar className="cartao-vidro mx-auto grid max-w-5xl items-center gap-10 p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr]">
          <figure aria-label="Trecho da lei citado como fonte">
            <p className="font-mono text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
              A fonte · Lei Complementar 214/2025
            </p>
            <blockquote className="mt-5 border-l-2 border-primary pl-5 font-serif text-xl leading-relaxed text-foreground">
              <span className="font-semibold">{TRECHO_EXEMPLO.artigo}</span>{" "}
              <span className="realce-marca">{TRECHO_EXEMPLO.realce}</span> {TRECHO_EXEMPLO.resto}
            </blockquote>
            <figcaption className="mt-5 pl-5 text-xs text-muted-foreground">
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
          <DemoResposta />
        </Revelar>
      </section>

      <FaixaDispositivos />

      <Secao
        id="como-funciona"
        dispositivo="Art. 1º"
        titulo="Como funciona"
        resumo="O LLM raciocina; o código confere as fontes antes de a resposta sair."
      >
        <Lista linhas={PASSOS} progresso />
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
