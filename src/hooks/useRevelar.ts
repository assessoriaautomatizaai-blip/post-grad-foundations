import { useEffect, useRef, useState, type RefObject } from "react";

/** Pode animar: o navegador tem IntersectionObserver e a pessoa não pediu menos movimento. */
export function podeAnimar(): boolean {
  if (typeof window === "undefined" || typeof window.IntersectionObserver !== "function") {
    return false;
  }
  return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Revela o elemento quando ele entra na tela, uma vez só. O CSS só esconde o elemento
 * quando a página pode animar (classe `anima` no <html>, ver src/lib/animacao.ts): sem
 * JavaScript, sem IntersectionObserver ou com "reduzir movimento", tudo aparece de imediato.
 */
export function useRevelar<T extends Element>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento || !podeAnimar()) {
      setVisivel(true);
      return;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
          setVisivel(true);
          observador.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return [ref, visivel];
}
