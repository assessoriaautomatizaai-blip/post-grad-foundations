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
 * Normaliza um texto em tokens para a recuperação BM25.
 *
 * Pergunta do usuário e trecho da lei passam pela mesma função: minúsculas,
 * sem acento nem cedilha, qualquer caractere fora de [a-z0-9] vira separador
 * (pontuação, hífen, barra, "º") e palavras vazias são descartadas.
 */
export function tokenize(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token !== "" && !STOPWORDS.has(token));
}
