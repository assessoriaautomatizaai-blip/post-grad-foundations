import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Oráculo da paleta: lê os tokens de src/styles.css e confere contraste (WCAG 2.1) e a
// regra de harmonia da marca Inciso nos dois temas. Sem rede e sem dependência nova.

// Caminho pela raiz do projeto: no jsdom, import.meta.url não é file://.
const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

function tokens(seletor: string): Record<string, string> {
  const inicio = css.indexOf(`${seletor} {`);
  if (inicio < 0) throw new Error(`bloco ${seletor} não encontrado`);
  const bloco = css.slice(inicio, css.indexOf("}", inicio));
  const mapa: Record<string, string> = {};
  for (const [, nome, valor] of bloco.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    mapa[nome!] = valor!.trim();
  }
  return mapa;
}

const CLARO = tokens(":root");
const ESCURO = { ...CLARO, ...tokens(".dark") };

interface Oklch {
  l: number;
  c: number;
  h: number;
  alfa: number;
}

function oklch(tema: Record<string, string>, nome: string): Oklch {
  let valor = tema[nome];
  for (let i = 0; valor?.startsWith("var(") && i < 5; i++) valor = tema[valor.slice(6, -1)];
  const m = valor?.match(
    /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/,
  );
  if (!m) throw new Error(`token --${nome} não é oklch: ${valor}`);
  const l = Number(m[1]) / (m[2] ? 100 : 1);
  const alfa = m[5] === undefined ? 1 : Number(m[5]) / (m[6] ? 100 : 1);
  return { l, c: Number(m[3]), h: Number(m[4]), alfa };
}

type Rgb = [number, number, number];

/** oklch → sRGB linear (0–1), com recorte da gama. */
function linear({ l, c, h }: Oklch): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb: Rgb = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  return rgb.map((v) => Math.min(1, Math.max(0, v))) as Rgb;
}

const gama = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const desgama = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

/** Cor final na tela: compõe a transparência sobre o fundo (no espaço sRGB, como o navegador). */
function naTela(tema: Record<string, string>, nome: string, fundo: string): Rgb {
  const cor = oklch(tema, nome);
  const frente = linear(cor);
  if (cor.alfa === 1) return frente;
  const base = naTela(tema, fundo, "background");
  return frente.map((v, i) => desgama(gama(v) * cor.alfa + gama(base[i]!) * (1 - cor.alfa))) as Rgb;
}

const luminancia = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function contraste(tema: Record<string, string>, texto: string, fundo: string): number {
  const f = naTela(tema, fundo, "background");
  const t = naTela(tema, texto, fundo);
  const [a, b] = [luminancia(t), luminancia(f)].sort((x, y) => y - x);
  return (a! + 0.05) / (b! + 0.05);
}

// [texto, fundo]
const TEXTO: [string, string][] = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "muted"],
  ["secondary-foreground", "secondary"],
  ["primary-foreground", "primary"],
  ["primary", "background"],
  ["primary", "card"],
  ["accent-foreground", "accent"],
  ["citacao-foreground", "citacao"],
  ["destructive", "background"],
  ["destructive", "card"],
  ["destructive-foreground", "destructive"],
];

// Elementos gráficos e limites de campo (WCAG 1.4.11): [elemento, fundo]
const GRAFICO: [string, string][] = [
  ["marca-traco", "background"],
  ["marca-traco", "card"],
  ["ring", "background"],
  ["input", "background"],
  ["input", "card"],
];

const NEUTROS = ["card", "secondary", "muted", "muted-foreground", "border", "input"];

describe.each([
  ["claro", CLARO],
  ["escuro", ESCURO],
])("paleta do tema %s", (_, tema) => {
  it.each(TEXTO)("texto --%s sobre --%s tem contraste ≥ 4,5:1", (texto, fundo) => {
    expect(contraste(tema, texto, fundo)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(GRAFICO)("elemento --%s sobre --%s tem contraste ≥ 3:1", (elemento, fundo) => {
    expect(contraste(tema, elemento, fundo)).toBeGreaterThanOrEqual(3);
  });

  it.each(NEUTROS)("neutro --%s fica na família de matiz da tinta", (nome) => {
    const { c, h } = oklch(tema, nome);
    expect(c).toBeLessThanOrEqual(0.04);
    if (c >= 0.006) expect(Math.abs(h - 266)).toBeLessThanOrEqual(8);
  });

  it("o hover e a seleção (--accent) são azul-caneta, não marca-texto", () => {
    expect(Math.abs(oklch(tema, "accent").h - 267)).toBeLessThanOrEqual(8);
  });

  it("o marca-texto aparece só nos tokens de destaque", () => {
    for (const nome of ["selo", "citacao", "citacao-borda", "realce"]) {
      expect(Math.abs(oklch(tema, nome).h - 90)).toBeLessThanOrEqual(6);
    }
  });
});
