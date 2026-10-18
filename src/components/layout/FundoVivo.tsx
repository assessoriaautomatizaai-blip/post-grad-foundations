import { useEffect, useRef, useState } from "react";

/** Posição do mouse só com mouse (não em toque) e sem "reduzir movimento". */
function podeUsarHolofote(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return (
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Fundo da página inteira (prompt 06): manchas de cor da marca derivando devagar e grade
 * técnica de linhas (blueprint) com uma varredura de luz, atrás do conteúdo. Com mouse, a
 * posição do cursor fica em --mx/--my para efeitos de fundo. Tudo é decoração: não recebe
 * cliques e o leitor de tela não o vê. Estilos em src/styles.css (".fundo-*").
 */
export function FundoVivo() {
  const ref = useRef<HTMLDivElement>(null);
  const [holofote, setHolofote] = useState(false);

  useEffect(() => {
    const fundo = ref.current;
    if (!fundo || !podeUsarHolofote()) return;
    setHolofote(true);

    const posicionar = (x: string, y: string) => {
      fundo.style.setProperty("--mx", x);
      fundo.style.setProperty("--my", y);
    };

    // Atualiza no máximo uma vez por quadro, mesmo com muitos eventos de movimento.
    let quadro = 0;
    let x = 0;
    let y = 0;
    const mover = (evento: PointerEvent) => {
      if (!Number.isFinite(evento.clientX) || !Number.isFinite(evento.clientY)) return;
      x = evento.clientX;
      y = evento.clientY;
      if (quadro) return;
      quadro = requestAnimationFrame(() => {
        quadro = 0;
        posicionar(`${x}px`, `${y}px`);
      });
    };
    // Quando o mouse sai da janela, a posição sai junto (não fica parada na borda).
    const sair = (evento: PointerEvent) => {
      if (!evento.relatedTarget) posicionar("-100px", "-100px");
    };
    window.addEventListener("pointermove", mover, { passive: true });
    document.addEventListener("pointerout", sair);
    return () => {
      window.removeEventListener("pointermove", mover);
      document.removeEventListener("pointerout", sair);
      cancelAnimationFrame(quadro);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-testid="fundo-vivo"
      data-holofote={holofote}
      aria-hidden="true"
      className="fundo-vivo pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="fundo-mancha fundo-mancha-1" />
      <div className="fundo-mancha fundo-mancha-2" />
      <div className="fundo-mancha fundo-mancha-3" />
      <div className="fundo-grade" />
      <div className="fundo-varredura" />
    </div>
  );
}
