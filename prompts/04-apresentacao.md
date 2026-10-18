# Prompt 04 — Frontend para a apresentação ao grupo da pós

Executado com o skill `designer-de-interfaces-frontend` a partir do pedido do autor ("atue com todo o profissionalismo… vou apresentar o projeto para o meu grupo de pós-graduação"). Mantém a identidade "lei comentada" (prompt 03) e foca no que o público vê durante a demonstração.

```
DIAGNÓSTICO (pensando em quem assiste à apresentação):
1. O topo explica, mas não demonstra: o "momento uau" (pergunta → resposta citando o artigo)
   só aparece trocando de página.
2. No simulador, o apresentador digita perguntas ao vivo: risco de erro e de esquecer de
   mostrar os três comportamentos (lei, complemento da web, fora do tema).
3. Fundo chapado; o conceito de papel e lei pede textura.
4. Rodapé de uma linha: a página termina sem assinatura.
5. Entrada da página não orquestrada.

DIREÇÃO: "Diário Oficial vivo" — editorial jurídico refinado.
- Elemento memorável: no topo, um balão de conversa entra sobre a folha de lei (quebrando a
  grade): pergunta → digitando → resposta que cita o mesmo artigo marcado na folha.
- Simulador com "Roteiro da demonstração" ao lado do chat: I – com a lei, II – com a web,
  III – fora do tema; cada pergunta é enviada com um clique e o roteiro fica disponível
  durante toda a conversa.
- Textura sutil de papel no fundo; entrada do topo em sequência; rodapé com a assinatura.

RESTRIÇÕES:
- A resposta da demonstração só afirma o que está no trecho literal da base (LC 214, art.
  157), com a mesma citação (regra 5 do CLAUDE.md); o teste confere.
- Sem JavaScript ou com "reduzir movimento": tudo visível no estado final.
- Sem dependência nova; contraste AA; teclado; 375 px sem rolagem lateral.

CRITÉRIOS DE SUCESSO:
- [ ] A demonstração do topo cita o mesmo dispositivo do trecho mostrado (teste)
- [ ] O roteiro envia a pergunta e continua disponível depois que a conversa começa (teste)
- [ ] Testes existentes sem alteração; tsc, lint e build sem erro
- [ ] Prévia aprovada pelo autor antes do commit
```
