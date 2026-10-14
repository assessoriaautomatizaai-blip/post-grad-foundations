// Palavras muito frequentes que não ajudam a achar o dispositivo legal certo.
// Já estão sem acento porque são comparadas depois da normalização ("é" vira "e").
// "nao" fica de fora de propósito: a negação muda o sentido da pergunta.
const STOPWORDS = new Set(
  [
    "a as o os um uma uns umas",
    "de da das do dos",
    "em na nas no nos",
    "ao aos pela pelas pelo pelos por para com",
    "e ou que se",
  ]
    .join(" ")
    .split(" "),
);

/**
 * Normaliza um texto para comparação: minúsculas, sem acento nem cedilha, e
 * qualquer caractere fora de [a-z0-9] vira um único espaço ("art. 156-A" → "art 156 a").
 * Mantém as palavras vazias, para que expressões possam ser casadas como estão na lei.
 */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((palavra) => palavra !== "")
    .join(" ");
}

/**
 * Normaliza um texto em tokens para a recuperação BM25.
 *
 * Pergunta do usuário e trecho da lei passam pela mesma função: a normalização de
 * `normalizeText` (pontuação, hífen, barra e "º" viram separador) e o descarte
 * das palavras vazias.
 */
export function tokenize(text: string): string[] {
  const normalizado = normalizeText(text);
  if (normalizado === "") return [];
  return normalizado.split(" ").filter((token) => !STOPWORDS.has(token));
}
