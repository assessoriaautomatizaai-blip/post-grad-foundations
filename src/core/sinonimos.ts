import type { Sinonimos } from "./retrieval";

// Liga o nome que o usuário usa às expressões que a lei usa para o mesmo tributo ou
// conceito. A EC 132 e parte da LC 214 citam os tributos pelo artigo da Constituição
// ("imposto previsto no art. 156-A"), sem o nome ("IBS").
//
// Cada ligação é um fato jurídico e tem fonte. As marcadas [A CONFERIR] não estão
// na base de conhecimento e precisam ser conferidas na Constituição Federal
// (https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm).
export const SINONIMOS: Sinonimos = {
  // LC 214/2025, art. 1º, I (na base: lc214-art1).
  // Sem "art." para casar também "arts. 156-A e 195, V" (plural).
  ibs: ["156-A"],
  // LC 214/2025, art. 1º, II (na base: lc214-art1).
  cbs: ["195, V", "inciso V do caput do art. 195"],
  // LC 214/2025, art. 409 (na base: lc214-art409).
  seletivo: ["art. 153, VIII", "inciso VIII do art. 153"],
  // LC 214/2025, título do Capítulo I do Título III do Livro I:
  // "Da Devolução Personalizada do IBS e da CBS (Cashback)".
  cashback: ["serão devolvidos", "devoluções previstas neste Capítulo"],
  // EC 132/2023, art. 2º (ADCT, art. 126, II) — "Programa de Integração Social de que trata o art. 239"
  // (na base: ec132-adct126).
  pis: ["Programa de Integração Social", "art. 239"],
  // [A CONFERIR] CF, art. 155, II.
  icms: ["155, II"],
  // [A CONFERIR] CF, art. 156, III.
  iss: ["156, III"],
  // [A CONFERIR] CF, art. 153, IV.
  ipi: ["153, IV"],
  // [A CONFERIR] CF, art. 195, I, "b" (contribuição sobre a receita ou o faturamento).
  cofins: ['195, I, "b"', "art. 195, inciso I, alínea “b”"],
};
