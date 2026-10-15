import { z } from "zod";

/** Tamanho máximo da pergunta, em caracteres: limita custo e abuso do endpoint. */
export const MAX_PERGUNTA = 500;

/** Entrada aceita pelo servidor. Fica no núcleo porque roda no navegador e no servidor. */
export const perguntaSchema = z.object({ pergunta: z.string().max(MAX_PERGUNTA) });
