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
    // Palavras de pergunta, pronomes e auxiliares: "qual" casava com "segundo o qual".
    "qual quais quem como quando onde quanto quanta quantos quantas",
    "eu voce voces meu minha meus minhas seu sua seus suas",
    "tem ter ser sao sera vai vao mais isso esse essa este esta",
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
 * Normaliza um texto em tokens: a normalização de `normalizeText` (pontuação, hífen,
 * barra e "º" viram separador) e o descarte das palavras vazias. Usada para reconhecer
 * saudação (src/core/decision.ts); a busca BM25 que também a usava saiu com o ADR-007.
 */
export function tokenize(text: string): string[] {
  const normalizado = normalizeText(text);
  if (normalizado === "") return [];
  return normalizado.split(" ").filter((token) => !STOPWORDS.has(token));
}
