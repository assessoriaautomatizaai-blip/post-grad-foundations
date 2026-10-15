/**
 * Tamanho máximo de cada mensagem enviada ao WhatsApp, em caracteres. É um limite de
 * leitura no celular (uma tela ou pouco mais), não o limite técnico do WhatsApp.
 */
export const MAX_CARACTERES_POR_MENSAGEM = 1600;

// Do separador mais "natural" ao menos: parágrafo, linha, palavra.
const SEPARADORES = ["\n\n", "\n", " "] as const;

function dividir(texto: string, max: number, separadores: readonly string[]): string[] {
  if (texto.length <= max) return [texto];

  const [separador, ...proximos] = separadores;
  if (separador === undefined) {
    // Sem onde quebrar (ex.: um link enorme): corta no limite.
    const pedacos: string[] = [];
    for (let i = 0; i < texto.length; i += max) pedacos.push(texto.slice(i, i + max));
    return pedacos;
  }

  const unidades = texto
    .split(separador)
    .map((unidade) => unidade.trim())
    .filter((unidade) => unidade !== "");
  if (unidades.length <= 1) return dividir(texto, max, proximos);

  const partes: string[] = [];
  let atual = "";
  for (const unidade of unidades) {
    if (unidade.length > max) {
      if (atual) partes.push(atual);
      atual = "";
      partes.push(...dividir(unidade, max, proximos));
      continue;
    }
    const juntando = atual ? `${atual}${separador}${unidade}` : unidade;
    if (juntando.length <= max) {
      atual = juntando;
    } else {
      partes.push(atual);
      atual = unidade;
    }
  }
  if (atual) partes.push(atual);
  return partes;
}

/**
 * Divide uma resposta longa em mensagens de até `max` caracteres, preferindo quebrar
 * entre parágrafos, depois entre linhas e por último entre palavras.
 */
export function dividirMensagem(texto: string, max = MAX_CARACTERES_POR_MENSAGEM): string[] {
  const limpo = texto.trim();
  return limpo === "" ? [] : dividir(limpo, max, SEPARADORES);
}
