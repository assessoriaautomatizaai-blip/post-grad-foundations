export type Tema = "claro" | "escuro";

const CHAVE = "tema";

/**
 * Roda no <head>, antes do primeiro paint, para a página não "piscar" o tema errado.
 * Usa a escolha guardada; sem ela, segue o sistema. Armazenamento bloqueado não quebra nada.
 */
export const SCRIPT_TEMA = `try{var t=localStorage.getItem("${CHAVE}");var e=t?t==="escuro":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",e)}catch(_){}`;

export function temaAtual(): Tema {
  return document.documentElement.classList.contains("dark") ? "escuro" : "claro";
}

export function aplicarTema(tema: Tema): void {
  document.documentElement.classList.toggle("dark", tema === "escuro");
  try {
    localStorage.setItem(CHAVE, tema);
  } catch {
    // Sem armazenamento (modo privado ou bloqueado): o tema vale só nesta visita.
  }
}
