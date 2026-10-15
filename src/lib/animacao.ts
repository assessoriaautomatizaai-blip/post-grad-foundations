// Roda antes da primeira pintura (como o script do tema): marca o <html> com a classe
// `anima` só quando o navegador pode animar e a pessoa não pediu menos movimento. O CSS
// esconde os elementos a revelar apenas sob essa classe — sem JavaScript, tudo aparece.
export const SCRIPT_ANIMACAO = `try{if("IntersectionObserver"in window&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("anima")}catch(_){}`;
