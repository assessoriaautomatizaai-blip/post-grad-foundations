// Terminações de plural trocadas pela forma do singular, na ordem em que são testadas.
const PLURAIS: readonly (readonly [string, string])[] = [
  ["oes", "ao"],
  ["aes", "ao"],
  ["ais", "al"],
  ["eis", "el"],
  ["ois", "ol"],
  ["ns", "m"],
];

/**
 * Reduz o plural de uma palavra já normalizada (minúsculas, sem acento) ao singular,
 * para "advogados" e "advogado" virarem o mesmo token na pergunta e na lei.
 *
 * Palavras com menos de 4 letras ficam como estão, para proteger siglas (IBS, CBS,
 * ISS, MEI). O radical pode não ser uma palavra real ("simples" → "simple"); só
 * importa que as duas formas cheguem ao mesmo token.
 */
export function stem(palavra: string): string {
  if (palavra.length < 4) return palavra;
  for (const [plural, singular] of PLURAIS) {
    if (palavra.endsWith(plural)) return palavra.slice(0, -plural.length) + singular;
  }
  if (/[rz]es$/.test(palavra)) return palavra.slice(0, -2);
  if (/[aeiou]s$/.test(palavra)) return palavra.slice(0, -1);
  return palavra;
}
