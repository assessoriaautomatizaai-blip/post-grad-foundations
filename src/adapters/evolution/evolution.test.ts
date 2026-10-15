import { describe, expect, it, vi } from "vitest";

import { createEvolutionSender, evolutionConfigFromEnv } from "./evolution";

// Especificação do envio pela Evolution API v2 (H10). Endpoint, cabeçalho e corpo conferidos
// no código-fonte (evolution-foundation/evolution-api, main, 15/10/2026):
//   POST {URL}/message/sendText/{instância}   cabeçalho "apikey"   corpo { number, text }
// O "number" aceita o identificador do WhatsApp como veio do webhook (@s.whatsapp.net ou @lid).
// O fetch é falso: nenhum teste acessa a rede.

const CONFIG = {
  baseUrl: "https://evolution.exemplo.com",
  instancia: "tira-duvidas",
  apiKey: "chave-de-teste-123",
};
const PARA = "5565911111111@s.whatsapp.net";

function fetchFalso(
  resposta: () => Promise<Response> = async () => new Response("{}", { status: 201 }),
) {
  return vi.fn<typeof fetch>(async () => resposta());
}

const corpoDa = (chamada: Parameters<typeof fetch> | undefined) =>
  JSON.parse(String(chamada?.[1]?.body)) as { number: string; text: string };

describe("createEvolutionSender", () => {
  it("faz POST em /message/sendText/{instância} com apikey e corpo { number, text }", async () => {
    const fetch = fetchFalso();
    await createEvolutionSender({ ...CONFIG, fetch })(PARA, "Olá!");

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://evolution.exemplo.com/message/sendText/tira-duvidas");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("apikey")).toBe(CONFIG.apiKey);
    expect(new Headers(init?.headers).get("content-type")).toContain("application/json");
    expect(corpoDa(fetch.mock.calls[0])).toEqual({ number: PARA, text: "Olá!" });
  });

  it("aceita URL com barra no fim e codifica o nome da instância", async () => {
    const fetch = fetchFalso();
    await createEvolutionSender({
      ...CONFIG,
      baseUrl: "https://evolution.exemplo.com/",
      instancia: "minha instância",
      fetch,
    })(PARA, "Olá!");
    expect(String(fetch.mock.calls[0]?.[0])).toBe(
      "https://evolution.exemplo.com/message/sendText/minha%20inst%C3%A2ncia",
    );
  });

  it("repassa o identificador @lid como veio do webhook", async () => {
    const fetch = fetchFalso();
    await createEvolutionSender({ ...CONFIG, fetch })("123456789012345@lid", "Olá!");
    expect(corpoDa(fetch.mock.calls[0]).number).toBe("123456789012345@lid");
  });

  it("divide resposta longa em várias mensagens, enviadas em ordem, uma de cada vez", async () => {
    const ordem: string[] = [];
    let emAndamento = 0;
    const buscar = vi.fn<typeof fetch>(async (_, init) => {
      emAndamento++;
      expect(emAndamento).toBe(1);
      ordem.push(JSON.parse(String(init?.body)).text);
      await new Promise((r) => setTimeout(r, 5));
      emAndamento--;
      return new Response("{}", { status: 201 });
    });
    const texto = `${"a".repeat(40)}\n\n${"b".repeat(40)}`;
    await createEvolutionSender({ ...CONFIG, fetch: buscar, maxCaracteres: 60 })(PARA, texto);

    expect(ordem).toEqual(["a".repeat(40), "b".repeat(40)]);
  });

  it("não envia nada para texto vazio", async () => {
    const fetch = fetchFalso();
    await createEvolutionSender({ ...CONFIG, fetch })(PARA, "   ");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("lança erro com o código HTTP quando a Evolution recusa", async () => {
    const fetch = fetchFalso(async () => new Response('{"error":"Unauthorized"}', { status: 401 }));
    await expect(createEvolutionSender({ ...CONFIG, fetch })(PARA, "Olá!")).rejects.toThrow("401");
  });

  it("a mensagem de erro não leva a chave, o número nem o texto", async () => {
    const fetch = fetchFalso(async () => new Response("erro interno", { status: 500 }));
    const erro = await createEvolutionSender({ ...CONFIG, fetch })(PARA, "Texto da resposta").catch(
      (e: unknown) => e as Error,
    );

    expect(erro).toBeInstanceOf(Error);
    expect(erro?.message).not.toContain(CONFIG.apiKey);
    expect(erro?.message).not.toContain("5565911111111");
    expect(erro?.message).not.toContain("Texto da resposta");
  });

  it("para no primeiro pedaço que falhar, sem enviar os seguintes", async () => {
    const fetch = fetchFalso(async () => new Response("", { status: 500 }));
    const texto = `${"a".repeat(40)}\n\n${"b".repeat(40)}`;
    await expect(
      createEvolutionSender({ ...CONFIG, fetch, maxCaracteres: 60 })(PARA, texto),
    ).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("deixa passar falha de rede como erro", async () => {
    const fetch = fetchFalso(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(createEvolutionSender({ ...CONFIG, fetch })(PARA, "Olá!")).rejects.toThrow();
  });

  it("cancela e lança erro quando a Evolution passa do tempo limite", async () => {
    const buscar = vi.fn<typeof fetch>(
      (_, init) =>
        new Promise<Response>((_, rejeitar) => {
          init?.signal?.addEventListener("abort", () => rejeitar(new Error("abortado")));
        }),
    );
    await expect(
      createEvolutionSender({ ...CONFIG, fetch: buscar, timeoutMs: 20 })(PARA, "Olá!"),
    ).rejects.toThrow();
    expect(buscar.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });
});

describe("evolutionConfigFromEnv", () => {
  const ENV = {
    EVOLUTION_API_URL: "https://evolution.exemplo.com",
    EVOLUTION_API_KEY: "chave-de-teste-123",
    EVOLUTION_INSTANCE: "tira-duvidas",
  };

  it("lê URL, chave e instância das variáveis de ambiente", () => {
    expect(evolutionConfigFromEnv(ENV)).toEqual({
      baseUrl: "https://evolution.exemplo.com",
      apiKey: "chave-de-teste-123",
      instancia: "tira-duvidas",
    });
  });

  it.each(["EVOLUTION_API_URL", "EVOLUTION_API_KEY", "EVOLUTION_INSTANCE"])(
    "acusa a variável %s quando falta",
    (nome) => {
      expect(() => evolutionConfigFromEnv({ ...ENV, [nome]: undefined })).toThrow(nome);
    },
  );

  it("exige https, para a chave não trafegar em texto aberto", () => {
    expect(() =>
      evolutionConfigFromEnv({ ...ENV, EVOLUTION_API_URL: "http://evolution.exemplo.com" }),
    ).toThrow("https");
  });

  it("nunca coloca o valor da chave na mensagem de erro", () => {
    expect(() =>
      evolutionConfigFromEnv({
        ...ENV,
        EVOLUTION_API_URL: "http://x",
        EVOLUTION_API_KEY: "segredo-999",
      }),
    ).toThrow(expect.objectContaining({ message: expect.not.stringContaining("segredo-999") }));
  });
});
