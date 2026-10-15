import { useId, useState, type FormEvent, type ReactNode } from "react";

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
  texto: string;
  fontes: Trecho[];
}

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

/**
 * Simulador de conversa com o agente, para testar sem WhatsApp. Recebe a função que
 * pergunta ao servidor por parâmetro: o componente não conhece o modelo nem a chave.
 */
export function Simulador({ perguntar }: { perguntar: (pergunta: string) => Promise<Resposta> }) {
  const campoId = useId();
  const [texto, setTexto] = useState("");
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [aguardando, setAguardando] = useState(false);

  const pergunta = texto.trim();
  const podeEnviar = pergunta !== "" && !aguardando;

  const adicionar = (mensagem: Omit<Mensagem, "id">) =>
    setMensagens((anteriores) => [...anteriores, { ...mensagem, id: anteriores.length }]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!podeEnviar) return;
    setTexto("");
    setAguardando(true);
    adicionar({ autor: "usuario", texto: pergunta, fontes: [] });
    try {
      const resposta = await perguntar(pergunta);
      adicionar({ autor: "agente", texto: resposta.texto, fontes: resposta.fontes });
    } catch {
      // A falha de rede ou do servidor fica no console do navegador; o usuário vê a
      // mesma mensagem de falha do WhatsApp, sem detalhe técnico.
      adicionar({ autor: "agente", texto: MENSAGEM_FALHA, fontes: [] });
    } finally {
      setAguardando(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div role="log" aria-live="polite" aria-label="Conversa" className="flex flex-col gap-3">
        {mensagens.map((m) => (
          <article
            key={m.id}
            className={cn(
              "max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed",
              m.autor === "usuario"
                ? "self-end bg-primary text-primary-foreground"
                : "self-start bg-muted text-foreground",
            )}
          >
            <span className="sr-only">{m.autor === "usuario" ? "Você: " : "Agente: "}</span>
            {formatar(m.texto)}
            {m.fontes.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Fontes citadas">
                {m.fontes.map((t) => (
                  <li key={t.id}>
                    <a
                      href={t.url_fonte}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground underline-offset-2 hover:underline"
                    >
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
        <p role="status" className="text-sm text-muted-foreground">
          Consultando a base de legislação…
        </p>
      )}

      <form onSubmit={enviar} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor={campoId}>Sua pergunta</Label>
          <Input
            id={campoId}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ex.: O que é o split payment?"
            maxLength={MAX_PERGUNTA}
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={!podeEnviar}>
          Enviar
        </Button>
      </form>
    </section>
  );
}
