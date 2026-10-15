# Fazer o agente responder "O que é o IBS?"

## Diagnóstico (confirmado)
- A chave do Gemini funciona. Para essa pergunta, o programa decide **responder** e chama o Gemini.
- A busca, porém, entrega ao Gemini só 3 artigos: art. 14 (alíquotas), art. 4º (incidência) e art. 41 (Simples Nacional).
- O artigo que **define** o IBS (LC 214/2025, art. 1º: "Ficam instituídos: I - o Imposto sobre Bens e Serviços (IBS)...") está na base, mas fica fora dos 3 primeiros. O art. 1º é longo e cita o IBS uma vez só, e a busca pontua mal esse tipo de texto.
- Sem a definição, o Gemini segue a regra de não inventar e diz que não encontrou. Sem citação, a resposta vira recusa. O Gemini fez o certo: o problema está na busca.

## O que mudar
1. **Teste primeiro (para você aprovar):** acrescentar ao conjunto-ouro (`eval/perguntas.json`) e aos testes da busca os casos "O que é o IBS?" e "O que é a CBS?". Nos dois, o art. 1º da LC 214/2025 tem de estar entre os trechos recuperados. Eu escrevo e mostro. Só sigo depois do seu ok, porque os testes são seus.
2. **Ajuste na busca:** quando a pergunta pedir uma definição ("o que é", "o que significa", "defina"), dar prioridade aos artigos que instituem ou definem o tributo. Esse sinal vai marcado nos trechos da base: o art. 1º e o art. 156-A da EC 132/2023, se estiver na base. O limite de trechos enviados ao modelo também sobe de 3 para 5.
3. **Conferir:** rodar `npm test` e `npm run eval`, sem piorar nenhum caso que já existe. Depois testar no simulador: "O que é o IBS?" deve vir com a citação "(LC 214/2025, art. 1º)".
4. **Registro:** anotar em `docs/HISTORY-IA.md` e criar um ADR curto em `docs/decisoes.md`.

## Detalhes técnicos
- Arquivos: `src/core/retrieval.ts` (reforço para definição e top-k), `knowledge/base.json` (marcação dos trechos que definem os tributos), `src/core/retrieval.test.ts` e `eval/perguntas.json` (novos casos, que dependem da sua aprovação).
- O limiar de recusa continua no código. O prompt de sistema não muda.
