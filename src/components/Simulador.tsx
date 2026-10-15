import { AlertTriangle, BookOpenCheck, Info, RotateCcw, SendHorizontal } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { LogoSimbolo } from "@/components/marca/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MENSAGEM_FALHA, type Resposta } from "@/core/answer";
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

const ESTILO_AGENTE: Record<Resposta["tipo"], string> = {
  resposta: "bg-card border",
  boas_vindas: "bg-card border",
  recusa: "bg-secondary border border-dashed",
  falha: "bg-destructive/5 border border-destructive/30",
};

function Selo({ tipo }: { tipo?: Resposta["tipo"] | undefined }) {
  if (tipo === "recusa") {
    return (
      <span className="mb-2 inline-flex items-center gap-1.5 font-sans text-xs font-medium text-muted-foreground">
        <Info className="size-3.5" aria-hidden="true" />
        Fora da base
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
  const fimRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLInputElement>(null);

  const pergunta = texto.trim();
  const podeEnviar = pergunta !== "" && !aguardando;

  // Leva a última mensagem para a vista; sem animação se o usuário pediu menos movimento.
  useEffect(() => {
    const fim = fimRef.current;
    if (!fim || typeof fim.scrollIntoView !== "function") return;
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    fim.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "nearest" });
  }, [mensagens, aguardando]);

  const adicionar = (mensagem: Omit<Mensagem, "id">) =>
    setMensagens((anteriores) => [...anteriores, { ...mensagem, id: anteriores.length }]);

  async function enviarPergunta(conteudo: string) {
    setTexto("");
    setAguardando(true);
    adicionar({ autor: "usuario", texto: conteudo, fontes: [] });
    try {
      const resposta = await perguntar(conteudo);
      adicionar({
        autor: "agente",
        tipo: resposta.tipo,
        texto: resposta.texto,
        fontes: resposta.fontes,
      });
    } catch {
      // A falha de rede ou do servidor fica no console do navegador; o usuário vê a
      // mesma mensagem de falha do WhatsApp, sem detalhe técnico.
      adicionar({ autor: "agente", tipo: "falha", texto: MENSAGEM_FALHA, fontes: [] });
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
    <section className="mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border bg-background shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border bg-background">
            <LogoSimbolo decorativo className="size-7" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">Inciso</p>
            <p className="text-xs text-muted-foreground">
              Tira-dúvidas da reforma tributária · cita a lei
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

      <div className="flex min-h-[22rem] flex-col gap-4 px-4 py-5 sm:px-5">
        {mensagens.length === 0 && !aguardando && (
          <div className="m-auto flex max-w-md flex-col items-center gap-4 py-6 text-center">
            <p className="text-xl font-semibold text-foreground">
              Pergunte sobre a reforma tributária
            </p>
            <p className="text-sm text-muted-foreground">
              Cada resposta cita o artigo de lei de onde veio. Comece por um destes exemplos:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXEMPLOS.map((exemplo) => (
                <button
                  key={exemplo}
                  type="button"
                  onClick={() => void enviarPergunta(exemplo)}
                  className="rounded-full border bg-card px-3.5 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  {exemplo}
                </button>
              ))}
            </div>
          </div>
        )}

        <div role="log" aria-live="polite" aria-label="Conversa" className="flex flex-col gap-3">
          {mensagens.map((m) => (
            <article
              key={m.id}
              className={cn(
                "max-w-[88%] px-4 py-3 text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-200",
                m.autor === "usuario"
                  ? "self-end rounded-2xl rounded-br-sm bg-primary text-primary-foreground"
                  : cn(
                      "self-start rounded-2xl rounded-bl-sm font-serif text-[0.95rem] text-foreground",
                      ESTILO_AGENTE[m.tipo ?? "resposta"],
                    ),
              )}
            >
              <span className="sr-only">{m.autor === "usuario" ? "Você: " : "Agente: "}</span>
              {m.autor === "agente" && <Selo tipo={m.tipo} />}
              {formatar(m.texto)}
              {m.fontes.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2 border-t pt-3" aria-label="Fontes citadas">
                  {m.fontes.map((t) => (
                    <li key={t.id}>
                      <a
                        href={t.url_fonte}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-citacao-borda bg-citacao px-2.5 py-1 font-mono text-xs font-medium text-citacao-foreground transition-colors hover:border-selo"
                      >
                        <BookOpenCheck className="size-3.5" aria-hidden="true" />
                        {`${t.norma}, ${t.dispositivo}`}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        {aguardando && (
          <div className="flex items-center gap-3 self-start rounded-2xl rounded-bl-sm border bg-card px-4 py-3">
            <span className="flex gap-1" aria-hidden="true">
              {[0, 150, 300].map((atraso) => (
                <span
                  key={atraso}
                  className="pontinho size-1.5 rounded-full bg-muted-foreground"
                  style={{ animationDelay: `${atraso}ms` }}
                />
              ))}
            </span>
            <p role="status" className="text-sm text-muted-foreground">
              Consultando a base de legislação…
            </p>
          </div>
        )}
        <div ref={fimRef} />
      </div>

      <form onSubmit={enviar} className="border-t bg-card px-4 py-4 sm:px-5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor={campoId}>Sua pergunta</Label>
          <span
            id={contadorId}
            className={cn(
              "font-mono text-xs tabular-nums text-muted-foreground",
              texto.length > MAX_PERGUNTA * 0.9 && "font-medium text-destructive",
            )}
          >
            {texto.length}/{MAX_PERGUNTA}
          </span>
        </div>
        <div className="mt-2 flex gap-2">
          <Input
            ref={campoRef}
            id={campoId}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ex.: Quando o ICMS deixa de existir?"
            maxLength={MAX_PERGUNTA}
            autoComplete="off"
            aria-describedby={contadorId}
            className="h-11 bg-background"
          />
          <Button type="submit" disabled={!podeEnviar} className="h-11 px-5">
            <SendHorizontal aria-hidden="true" />
            Enviar
          </Button>
        </div>
      </form>
    </section>
  );
}
