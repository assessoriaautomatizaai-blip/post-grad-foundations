import {
  AlertTriangle,
  ArrowUp,
  BookOpenCheck,
  CheckCheck,
  Coins,
  Globe,
  HandCoins,
  Info,
  Landmark,
  Plus,
  SendHorizontal,
  Store,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { LogoSimbolo } from "@/components/marca/Logo";
import { Label } from "@/components/ui/label";
import { MENSAGEM_FALHA, type FonteWeb, type Resposta } from "@/core/answer";
import type { Trecho } from "@/core/knowledge";
import { MAX_PERGUNTA } from "@/core/pergunta";
import { cn } from "@/lib/utils";

interface Mensagem {
  id: number;
  autor: "usuario" | "agente";
  /** Para o agente: o tipo da resposta, que define o tratamento visual. */
  tipo?: Resposta["tipo"];
  texto: string;
  fontes: Trecho[];
  fontesWeb: FonteWeb[];
  /** Hora de envio, "14:07", e o mesmo instante em ISO para o <time>. */
  hora: string;
  instante: string;
  /** Para a pergunta: já veio a resposta (dois tiques azuis). */
  lida?: boolean;
}

// Perguntas que a base responde (as mesmas das boas-vindas do WhatsApp), com o ícone da
// ficha "Explorar por tema".
const EXEMPLOS: { pergunta: string; icone: LucideIcon }[] = [
  { pergunta: "O que é o IBS?", icone: Landmark },
  { pergunta: "O que é o split payment?", icone: Coins },
  { pergunta: "Quem tem direito ao cashback?", icone: HandCoins },
  { pergunta: "Como fica o MEI na reforma?", icone: Store },
];

// *negrito* e _itálico_ do WhatsApp. O "_" só abre itálico no início de palavra, para
// não pegar o sublinhado de URLs como "ccivil_03".
const MARCACAO = /(\*[^*\n]+\*|(?<![\p{L}\p{N}])_[^_\n]+_(?![\p{L}\p{N}]))/gu;

/** Formata o texto como React, sem interpretar HTML: tudo vira texto, exceto a marcação. */
function formatar(texto: string): ReactNode[] {
  return texto.split("\n").map((linha, i) => (
    <span key={i} className="block min-h-[1em]">
      {linha.split(MARCACAO).map((parte, j) => {
        if (parte.length > 2 && parte.startsWith("*") && parte.endsWith("*")) {
          return <strong key={j}>{parte.slice(1, -1)}</strong>;
        }
        if (parte.length > 2 && parte.startsWith("_") && parte.endsWith("_")) {
          return <em key={j}>{parte.slice(1, -1)}</em>;
        }
        return parte;
      })}
    </span>
  ));
}

/** Nome de cada link da web: o título da busca, numerado quando se repete ("senado.leg.br (2)"). */
function nomearFontesWeb(fontes: FonteWeb[]): (FonteWeb & { nome: string })[] {
  const vezes = new Map<string, number>();
  return fontes.map((f) => {
    const n = (vezes.get(f.titulo) ?? 0) + 1;
    vezes.set(f.titulo, n);
    return { ...f, nome: n === 1 ? f.titulo : `${f.titulo} (${n})` };
  });
}

// Todo balão do agente tem a cor de entrada; o selo identifica o tipo, e a falha ganha contorno.
const ESTILO_AGENTE: Record<Resposta["tipo"], string> = {
  resposta: "",
  boas_vindas: "",
  fora_do_tema: "",
  sem_fonte: "",
  falha: "ring-1 ring-destructive/40",
};

function Selo({ tipo }: { tipo?: Resposta["tipo"] | undefined }) {
  if (tipo === "fora_do_tema" || tipo === "sem_fonte") {
    return (
      <span className="mb-2 inline-flex items-center gap-1.5 font-sans text-xs font-medium text-muted-foreground">
        <Info className="size-3.5" aria-hidden="true" />
        {tipo === "fora_do_tema" ? "Fora do tema" : "Sem fonte"}
      </span>
    );
  }
  if (tipo === "falha") {
    return (
      <span className="mb-2 inline-flex items-center gap-1.5 font-sans text-xs font-medium text-destructive">
        <AlertTriangle className="size-3.5" aria-hidden="true" />
        Falha técnica
      </span>
    );
  }
  return null;
}

/** Grupo do roteiro da demonstração (ex.: "Com a lei"), com as perguntas que o mostram. */
export interface GrupoRoteiro {
  titulo: string;
  descricao?: string;
  perguntas: string[];
}

const INCISOS = ["I", "II", "III", "IV", "V"];

/**
 * Simulador no formato de Consultor (prompt 07, com base na referência): barra lateral com o
 * roteiro da demonstração, saudação, caixa de pergunta ampla e fichas por tema; na conversa,
 * a caixa desce para o rodapé. Recebe a função que pergunta ao servidor por parâmetro: o
 * componente não conhece o modelo nem a chave.
 */
export function Simulador({
  perguntar,
  roteiro,
}: {
  perguntar: (pergunta: string) => Promise<Resposta>;
  roteiro?: GrupoRoteiro[];
}) {
  const campoId = useId();
  const contadorId = useId();
  const [texto, setTexto] = useState("");
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [aguardando, setAguardando] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLTextAreaElement>(null);

  const pergunta = texto.trim();
  const podeEnviar = pergunta !== "" && !aguardando;
  const vazio = mensagens.length === 0 && !aguardando;

  // Leva a última mensagem para a vista rolando só a área de mensagens (a página fica
  // parada); sem animação se o usuário pediu menos movimento.
  useEffect(() => {
    const area = areaRef.current;
    if (!area || typeof area.scrollTo !== "function") return;
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    area.scrollTo({ top: area.scrollHeight, behavior: reduzir ? "auto" : "smooth" });
  }, [mensagens, aguardando]);

  // Toda resposta do agente marca as perguntas anteriores como lidas, como num mensageiro.
  const adicionar = (mensagem: Omit<Mensagem, "id" | "hora" | "instante">) => {
    const agora = new Date();
    const carimbo = {
      hora: agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      instante: agora.toISOString(),
    };
    setMensagens((anteriores) => [
      ...(mensagem.autor === "agente"
        ? anteriores.map((m) => (m.autor === "usuario" ? { ...m, lida: true } : m))
        : anteriores),
      { ...mensagem, ...carimbo, id: anteriores.length },
    ]);
  };

  async function enviarPergunta(conteudo: string) {
    setTexto("");
    setAguardando(true);
    adicionar({ autor: "usuario", texto: conteudo, fontes: [], fontesWeb: [] });
    try {
      const resposta = await perguntar(conteudo);
      adicionar({
        autor: "agente",
        tipo: resposta.tipo,
        // Na tela, as fontes viram links com nome; o texto com endereços é o do WhatsApp.
        texto: resposta.corpo ?? resposta.texto,
        fontes: resposta.fontes,
        fontesWeb: resposta.fontesWeb,
      });
    } catch {
      // A falha de rede ou do servidor fica no console do navegador; o usuário vê a
      // mesma mensagem de falha do WhatsApp, sem detalhe técnico.
      adicionar({
        autor: "agente",
        tipo: "falha",
        texto: MENSAGEM_FALHA,
        fontes: [],
        fontesWeb: [],
      });
    } finally {
      setAguardando(false);
      campoRef.current?.focus();
    }
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (podeEnviar) void enviarPergunta(pergunta);
  }

  // Enter envia; Shift+Enter quebra a linha (e nada acontece durante a composição de acento).
  function teclar(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key !== "Enter" || evento.shiftKey || evento.nativeEvent.isComposing) return;
    evento.preventDefault();
    if (podeEnviar) void enviarPergunta(pergunta);
  }

  const caixa = (
    <form
      onSubmit={enviar}
      className={cn("cartao-vidro w-full p-3", vazio ? "max-w-2xl" : "rounded-2xl")}
    >
      <Label htmlFor={campoId} className="sr-only">
        Sua pergunta
      </Label>
      <textarea
        ref={campoRef}
        id={campoId}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={teclar}
        placeholder="Descreva sua dúvida sobre a reforma tributária…"
        maxLength={MAX_PERGUNTA}
        rows={vazio ? 3 : 1}
        autoComplete="off"
        aria-describedby={contadorId}
        className="block w-full resize-none bg-transparent px-2 pt-1 text-[1.02rem] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
      />
      <div className="mt-2 flex items-center justify-between gap-3 border-t border-[var(--cartao-borda)] px-2 pt-2.5">
        <span
          id={contadorId}
          className={cn(
            "font-mono text-[0.68rem] tabular-nums text-muted-foreground",
            texto.length > MAX_PERGUNTA * 0.9 && "font-medium text-destructive",
          )}
        >
          {texto.length}/{MAX_PERGUNTA}
        </span>
        <button
          type="submit"
          disabled={!podeEnviar}
          aria-label="Enviar"
          className="pilula-primaria flex size-9 items-center justify-center disabled:pointer-events-none disabled:opacity-40"
        >
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );

  const saudacao = (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <LogoSimbolo decorativo className="size-12 opacity-80" />
      <h2 className="text-[2rem] leading-[1.12] font-semibold tracking-[-0.03em] text-foreground sm:text-[2.6rem]">
        Olá!
        <br />
        <span className="font-medium text-muted-foreground">como posso te ajudar hoje?</span>
      </h2>
      <p className="max-w-md text-muted-foreground">
        Pergunte sobre a reforma tributária. Eu cito o artigo da lei de onde veio cada resposta e,
        quando a lei não basta, completo com fontes da web.
      </p>
    </div>
  );

  const fichas = (
    <div role="group" aria-label="Explorar por tema" className="flex flex-col items-center gap-3">
      <p className="font-mono text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
        Explorar por tema
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {EXEMPLOS.map(({ pergunta: exemplo, icone: Icone }) => (
          <button
            key={exemplo}
            type="button"
            onClick={() => void enviarPergunta(exemplo)}
            className="vidro inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.82rem] font-medium text-foreground"
          >
            <Icone className="size-3.5 text-muted-foreground" aria-hidden="true" />
            {exemplo}
          </button>
        ))}
      </div>
    </div>
  );

  const historico = (
    <div role="log" aria-live="polite" aria-label="Conversa" className="flex flex-col gap-5">
      {mensagens.map((m) =>
        m.autor === "usuario" ? (
          <article
            key={m.id}
            className="balao-usuario max-w-[80%] self-end rounded-2xl rounded-br-md px-4 pt-2.5 pb-1.5 text-[0.95rem] leading-relaxed [overflow-wrap:anywhere] animate-in fade-in slide-in-from-bottom-1 duration-200"
          >
            <span className="sr-only">Você: </span>
            {formatar(m.texto)}
            <span className="mt-1 flex items-center justify-end gap-1 text-[0.68rem] opacity-75">
              <time dateTime={m.instante}>{m.hora}</time>
              <CheckCheck
                role="img"
                aria-label={m.lida ? "Lida" : "Enviada"}
                className={cn("size-4", m.lida && "text-[var(--tique-lido)]")}
              />
            </span>
          </article>
        ) : (
          <article
            key={m.id}
            className={cn(
              "cartao-vidro max-w-[88%] self-start rounded-2xl rounded-tl-md px-4 pt-3 pb-2 text-[0.95rem] leading-relaxed text-foreground [overflow-wrap:anywhere] animate-in fade-in slide-in-from-bottom-1 duration-200",
              ESTILO_AGENTE[m.tipo ?? "resposta"],
            )}
          >
            <span className="sr-only">Agente: </span>
            <span
              aria-hidden="true"
              className="mb-1.5 flex items-center gap-2 text-xs font-semibold tracking-tight text-foreground"
            >
              <LogoSimbolo decorativo className="size-4" />
              Inciso
            </span>
            <Selo tipo={m.tipo} />
            {formatar(m.texto)}
            {m.fontes.length > 0 && (
              <ul
                className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--cartao-borda)] pt-3"
                aria-label="Fontes da lei"
              >
                {m.fontes.map((t) => (
                  <li key={t.id}>
                    <a
                      href={t.url_fonte}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-citacao-borda bg-citacao px-2.5 py-0.5 font-mono text-xs font-medium text-citacao-foreground transition-colors hover:border-selo"
                    >
                      <BookOpenCheck className="size-3.5" aria-hidden="true" />
                      {`${t.norma}, ${t.dispositivo}`}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {m.fontesWeb.length > 0 && (
              <ul
                className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--cartao-borda)] pt-3"
                aria-label="Fontes da web, não conferidas"
              >
                <li className="w-full text-xs text-muted-foreground">Da web · não conferidas</li>
                {nomearFontesWeb(m.fontesWeb).map((f) => (
                  <li key={f.url} className="max-w-full">
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vidro inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs text-foreground"
                    >
                      <Globe
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="truncate">{f.nome}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <span className="mt-1.5 flex justify-end text-[0.68rem] text-muted-foreground">
              <time dateTime={m.instante}>{m.hora}</time>
            </span>
          </article>
        ),
      )}
      {aguardando && (
        <div className="cartao-vidro flex items-center gap-3 self-start rounded-2xl rounded-tl-md px-4 py-3">
          <LogoSimbolo decorativo className="size-4" />
          <span className="flex gap-1" aria-hidden="true">
            {[0, 150, 300].map((atraso) => (
              <span
                key={atraso}
                className="pontinho size-1.5 rounded-full bg-muted-foreground"
                style={{ animationDelay: `${atraso}ms` }}
              />
            ))}
          </span>
          <p role="status" className="sr-only">
            Consultando a base de legislação…
          </p>
        </div>
      )}
    </div>
  );

  // A caixa fica sempre no mesmo lugar da árvore: entre o estado vazio e a conversa só muda o
  // posicionamento, para o campo não ser recriado (e perder o foco) no meio da digitação.
  const conversa = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--cartao-borda)] px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="vidro flex size-9 items-center justify-center rounded-full">
            <LogoSimbolo decorativo className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              {vazio ? "Nova conversa" : "Inciso"}
            </p>
            {/* O anúncio para leitor de tela é o role="status" da área de mensagens. */}
            <p
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
              aria-hidden="true"
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  aguardando ? "pontinho bg-primary" : "bg-emerald-500",
                )}
              />
              {aguardando ? "digitando…" : "online"}
            </p>
          </div>
        </div>
        {mensagens.length > 0 && (
          <button
            type="button"
            onClick={() => setMensagens([])}
            disabled={aguardando}
            className="pilula-primaria inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Nova conversa
          </button>
        )}
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          vazio && "justify-center gap-6 overflow-y-auto px-4 py-8 sm:px-8",
        )}
      >
        <div
          ref={areaRef}
          className={cn(vazio ? "contents" : "flex-1 overflow-y-auto px-4 py-6 sm:px-8")}
        >
          {vazio && saudacao}
          {historico}
        </div>
        <div
          className={cn(
            vazio
              ? "flex justify-center"
              : "border-t border-[var(--cartao-borda)] px-4 py-3 sm:px-8",
          )}
        >
          {caixa}
        </div>
        {vazio && fichas}
      </div>
    </div>
  );

  return (
    <section className="cartao-vidro mx-auto flex h-[min(84dvh,52rem)] w-full flex-col overflow-hidden rounded-[24px] lg:flex-row">
      {roteiro?.length ? (
        <aside
          aria-label="Roteiro da demonstração"
          className="max-h-56 shrink-0 overflow-y-auto border-b border-[var(--cartao-borda)] bg-[var(--cartao-fundo)] px-4 py-5 lg:max-h-none lg:w-64 lg:border-r lg:border-b-0"
        >
          <p className="px-2 font-mono text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
            Roteiro da demonstração
          </p>
          <ol className="mt-4 space-y-5">
            {roteiro.map((grupo, i) => (
              <li key={grupo.titulo}>
                <p className="flex items-baseline gap-2 px-2">
                  <span className="font-mono text-xs text-primary" aria-hidden="true">
                    {INCISOS[i]} –
                  </span>
                  <span className="text-sm font-semibold tracking-tight text-foreground">
                    {grupo.titulo}
                  </span>
                </p>
                {grupo.descricao && (
                  <p className="mt-0.5 px-2 text-xs text-muted-foreground">{grupo.descricao}</p>
                )}
                <div className="mt-2 flex flex-col gap-1">
                  {grupo.perguntas.map((exemplo) => (
                    <button
                      key={exemplo}
                      type="button"
                      disabled={aguardando}
                      onClick={() => void enviarPergunta(exemplo)}
                      className="group flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-[0.82rem] text-foreground transition-colors hover:bg-[var(--vidro-borda)] disabled:opacity-50"
                    >
                      {exemplo}
                      <SendHorizontal
                        className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </aside>
      ) : null}
      {conversa}
    </section>
  );
}
