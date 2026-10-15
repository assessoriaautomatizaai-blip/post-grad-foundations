import { tokenize } from "./tokenize";

// Com o ADR-007, toda pergunta vai ao modelo com a base inteira; o código não decide mais
// responder × recusar por limiar de busca. Só a saudação continua tratada aqui, sem
// chamar o modelo (custo zero e resposta imediata).

// Já normalizadas e sem as palavras vazias do tokenize ("tudo bem" → "tudo", "bem").
const SAUDACOES = new Set(
  "oi ola opa bom boa dia tarde noite tudo bem beleza blz ai menu ajuda inicio comecar obrigado obrigada valeu".split(
    " ",
  ),
);

export const MENSAGEM_BOAS_VINDAS = [
  "Olá! Eu tiro dúvidas sobre a reforma tributária, citando o artigo da lei de onde veio a resposta.",
  "",
  "Exemplos de perguntas:",
  "• O que é o IBS?",
  "• O que é o split payment?",
  "• Quem tem direito ao cashback?",
  "• Como fica o MEI na reforma?",
  "",
  "As respostas são informativas e não substituem a orientação de um contador ou advogado.",
].join("\n");

/** Mensagem vazia ou só com cumprimentos ("oi", "bom dia", "menu"). */
export function ehSaudacao(pergunta: string): boolean {
  return tokenize(pergunta).every((palavra) => SAUDACOES.has(palavra));
}
