import { z } from "zod";

// Normas do recorte do MVP (docs/escopo.md). Incluir outra norma é uma decisão
// explícita: muda este enum, o teste e o escopo.
export const NORMAS = ["EC 132/2023", "LC 214/2025"] as const;

const ID_ESTAVEL = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

const naoVazio = (campo: string) =>
  z.string().refine((valor) => valor.trim() !== "", `${campo} não pode ficar vazio`);

// A fonte precisa ser o texto oficial: https e domínio do Planalto (ou subdomínio dele).
function isFontePlanalto(valor: string): boolean {
  let url: URL;
  try {
    url = new URL(valor);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" &&
    (url.hostname === "planalto.gov.br" || url.hostname.endsWith(".planalto.gov.br"))
  );
}

// "2026-02-30" passa no formato mas não existe: confere se a data volta igual.
function isDataValida(valor: string): boolean {
  const partes = DATA_ISO.exec(valor);
  if (!partes) return false;
  const [ano, mes, dia] = partes.slice(1).map(Number) as [number, number, number];
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia
  );
}

export const trechoSchema = z
  .object({
    id: z
      .string()
      .regex(ID_ESTAVEL, "id deve ter só minúsculas, números e hífen (ex.: lc214-art1)"),
    norma: z.enum(NORMAS),
    dispositivo: naoVazio("dispositivo"),
    texto: naoVazio("texto"),
    url_fonte: z.string().refine(isFontePlanalto, "url_fonte deve ser https em planalto.gov.br"),
    data_referencia: z
      .string()
      .refine(isDataValida, "data_referencia deve ser uma data válida no formato AAAA-MM-DD"),
  })
  .strict();

export type Trecho = z.infer<typeof trechoSchema>;

const baseSchema = z.array(trechoSchema).superRefine((trechos, ctx) => {
  const posicaoPorId = new Map<string, number>();
  trechos.forEach((trecho, posicao) => {
    const anterior = posicaoPorId.get(trecho.id);
    if (anterior !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [posicao, "id"],
        message: `id duplicado "${trecho.id}" (já usado no trecho ${anterior})`,
      });
    } else {
      posicaoPorId.set(trecho.id, posicao);
    }
  });
});

function descreverProblema(issue: z.ZodIssue): string {
  const [posicao, campo] = issue.path;
  const onde =
    posicao === undefined
      ? "base"
      : campo === undefined
        ? `trecho ${posicao}`
        : `trecho ${posicao}, campo "${campo}"`;
  return `- ${onde}: ${traduzir(issue)}`;
}

// Mensagens padrão do zod que aparecem para quem edita a base, em português.
function traduzir(issue: z.ZodIssue): string {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    return issue.received === "undefined"
      ? "campo obrigatório ausente"
      : `tipo inválido: esperado ${issue.expected}, recebido ${issue.received}`;
  }
  if (issue.code === z.ZodIssueCode.invalid_enum_value) {
    return `valor "${String(issue.received)}" não permitido; use ${issue.options.join(" ou ")}`;
  }
  if (issue.code === z.ZodIssueCode.unrecognized_keys) {
    return `campo desconhecido: ${issue.keys.join(", ")}`;
  }
  return issue.message;
}

/**
 * Valida a base de conhecimento e devolve os trechos tipados.
 *
 * Lança um erro que lista cada problema com a posição do trecho e o campo,
 * para a base inválida quebrar a suíte de testes, e não a conversa no WhatsApp.
 */
export function parseKnowledgeBase(dados: unknown): Trecho[] {
  const resultado = baseSchema.safeParse(dados);
  if (!resultado.success) {
    const problemas = resultado.error.issues.map(descreverProblema).join("\n");
    throw new Error(`Base de conhecimento inválida:\n${problemas}`);
  }
  return resultado.data;
}
