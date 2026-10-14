import { describe, expect, it } from "vitest";

import { stem } from "./stem";

// Especificação da redução de plural (H06). O radical não aparece para ninguém:
// o que importa é que singular e plural virem o mesmo token, na pergunta e na lei.
// Por isso os testes comparam formas entre si, e não fixam o radical exato.
describe("stem", () => {
  it.each([
    ["advogados", "advogado"],
    ["aliquotas", "aliquota"],
    ["medicamentos", "medicamento"],
    ["servicos", "servico"],
    ["operacoes", "operacao"],
    ["fiscais", "fiscal"],
    ["moveis", "movel"],
    ["valores", "valor"],
  ])("plural e singular viram o mesmo token: %s × %s", (plural, singular) => {
    expect(stem(plural)).toBe(stem(singular));
  });

  it.each(["ibs", "cbs", "icms", "iss", "ipi", "mei", "pis", "lc"])(
    "não altera siglas e palavras curtas: %s",
    (sigla) => {
      expect(stem(sigla)).toBe(sigla);
    },
  );

  it("não altera números", () => {
    expect(stem("2026")).toBe("2026");
    expect(stem("214")).toBe("214");
  });

  it("é idempotente: aplicar duas vezes dá o mesmo que uma", () => {
    for (const palavra of ["advogados", "operacoes", "fiscais", "valores", "reforma", "simples"]) {
      expect(stem(stem(palavra))).toBe(stem(palavra));
    }
  });

  it("não junta palavras de sentido diferente que só se parecem", () => {
    expect(stem("imposto")).not.toBe(stem("impostor"));
    expect(stem("servico")).not.toBe(stem("servidor"));
  });
});
