import {
  AlertTriangle,
  BookOpenCheck,
  CheckCheck,
  Globe,
  Info,
  RotateCcw,
  SendHorizontal,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { LogoSimbolo } from "@/components/marca/Logo";
import { Button } from "@/components/ui/button";
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

// Perguntas que a base responde (as mesmas das boas-vindas do WhatsApp).
const EXEMPLOS = [
  "O que é o IBS?",
  "O que é o split payment?",
  "Quem tem direito ao cashback?",
  "Como fica o MEI na reforma?",
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

/**
 * Simulador de conversa com o agente, para testar sem WhatsApp. Recebe a função que
 * pergunta ao servidor por parâmetro: o componente não conhece o modelo nem a chave.
 */
export function Simulador({ perguntar }: { perguntar: (pergunta: string) => Promise<Resposta> }) {
  const campoId = useId();
  const contadorId = useId();
  const [texto, setTexto] = useState("");
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [aguardando, setAguardando] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLInputElement>(null);

  const pergunta = texto.trim();
  const podeEnviar = pergunta !== "" && !aguardando;

  // Leva a última mensagem para a vista rolando só a área de mensagens (a página fica
  // parada, como num mensageiro); sem animação se o usuário pediu menos movimento.
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

  return (
    <section className="mx-auto flex h-[min(78dvh,46rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border shadow-sm">
      <div className="flex items-center justify-between gap-3 bg-[var(--chat-barra)] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full border bg-background">
            <LogoSimbolo decorativo className="size-6" />
          </span>
          <div className="leading-tight">
            <p className="text-[0.95rem] font-medium text-foreground">Inciso</p>
            {/* O anúncio para leitor de tela é o role="status" da área de mensagens. */}
            <p className="text-xs text-muted-foreground" aria-hidden="true">
              {aguardando ? "digitando…" : "online"}
            </p>
          </div>
        </div>
        {mensagens.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMensagens([])}
            disabled={aguardando}
          >
            <RotateCcw aria-hidden="true" />
            Nova conversa
          </Button>
        )}
      </div>

      <div
        ref={areaRef}
        className="chat-fundo flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4 sm:px-[6%]"
      >
        {mensagens.length === 0 && !aguardando ? (
          <div className="m-auto flex max-w-md flex-col items-center gap-4 py-6 text-center">
            <p className="rounded-md bg-[var(--chat-entrada)] px-4 py-2.5 text-xs leading-relaxed text-muted-foreground shadow-sm">
              As respostas citam a lei e, quando preciso, completam com fontes da web. Comece por um
              destes exemplos:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXEMPLOS.map((exemplo) => (
                <button
                  key={exemplo}
                  type="button"
                  onClick={() => void enviarPergunta(exemplo)}
                  className="rounded-full bg-[var(--chat-entrada)] px-3.5 py-1.5 text-sm text-[var(--chat-enviar)] shadow-sm transition-colors hover:bg-[var(--chat-saida)] dark:text-foreground"
                >
                  {exemplo}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="mx-auto mb-1 rounded-md bg-[var(--chat-entrada)] px-3 py-1 text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase shadow-sm">
            Hoje
          </p>
        )}

        <div role="log" aria-live="polite" aria-label="Conversa" className="flex flex-col gap-2">
          {mensagens.map((m) => (
            <article
              key={m.id}
              className={cn(
                "max-w-[85%] px-3 pt-2 pb-1.5 text-[0.93rem] leading-relaxed text-foreground shadow-sm [overflow-wrap:anywhere] animate-in fade-in slide-in-from-bottom-1 duration-200",
                m.autor === "usuario"
                  ? "balao-saida self-end rounded-lg rounded-tr-none bg-[var(--chat-saida)]"
                  : cn(
                      "balao-entrada self-start rounded-lg rounded-tl-none bg-[var(--chat-entrada)]",
                      ESTILO_AGENTE[m.tipo ?? "resposta"],
                    ),
              )}
            >
              <span className="sr-only">{m.autor === "usuario" ? "Você: " : "Agente: "}</span>
              {m.autor === "agente" && <Selo tipo={m.tipo} />}
              {formatar(m.texto)}
              {m.fontes.length > 0 && (
                <ul
                  className="mt-2 flex flex-wrap gap-1.5 border-t pt-2"
                  aria-label="Fontes da lei"
                >
                  {m.fontes.map((t) => (
                    <li key={t.id}>
                      <a
                        href={t.url_fonte}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-citacao-borda bg-citacao px-2 py-0.5 font-mono text-xs font-medium text-citacao-foreground transition-colors hover:border-selo"
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
                  className="mt-2 flex flex-wrap gap-1.5 border-t pt-2"
                  aria-label="Fontes da web, não conferidas"
                >
                  <li className="w-full text-xs text-muted-foreground">Da web · não conferidas</li>
                  {nomearFontesWeb(m.fontesWeb).map((f) => (
                    <li key={f.url} className="max-w-full">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-dashed px-2 py-0.5 text-xs text-[var(--chat-lido)] transition-colors hover:underline"
                      >
                        <Globe className="size-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{f.nome}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <span className="mt-0.5 flex items-center justify-end gap-1 text-[0.68rem] text-muted-foreground">
                <time dateTime={m.instante}>{m.hora}</time>
                {m.autor === "usuario" && (
                  <CheckCheck
                    role="img"
                    aria-label={m.lida ? "Lida" : "Enviada"}
                    className={cn("size-4", m.lida && "text-[var(--chat-lido)]")}
                  />
                )}
              </span>
            </article>
          ))}
        </div>

        {aguardando && (
          <div className="balao-entrada flex items-center gap-3 self-start rounded-lg rounded-tl-none bg-[var(--chat-entrada)] px-4 py-3 shadow-sm">
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

      <form onSubmit={enviar} className="bg-[var(--chat-barra)] px-3 py-2.5">
        <Label htmlFor={campoId} className="sr-only">
          Sua pergunta
        </Label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={campoRef}
              id={campoId}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Digite sua pergunta"
              maxLength={MAX_PERGUNTA}
              autoComplete="off"
              aria-describedby={contadorId}
              className="h-11 w-full rounded-full border-0 bg-[var(--chat-entrada)] pr-16 pl-4 text-[0.95rem] text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span
              id={contadorId}
              className={cn(
                "absolute top-1/2 right-4 -translate-y-1/2 font-mono text-[0.68rem] tabular-nums text-muted-foreground",
                texto.length > MAX_PERGUNTA * 0.9 && "font-medium text-destructive",
              )}
            >
              {texto.length}/{MAX_PERGUNTA}
            </span>
          </div>
          <button
            type="submit"
            disabled={!podeEnviar}
            aria-label="Enviar"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--chat-enviar)] text-[var(--chat-enviar-texto)] transition-[transform,opacity] hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            <SendHorizontal className="size-5" aria-hidden="true" />
          </button>
        </div>
      </form>
    </section>
  );
}
