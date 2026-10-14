# src/adapters

Tudo o que fala com o mundo externo, sempre atrás de uma interface injetada no núcleo:

- `evolution/` — envio de mensagens pela Evolution API (WhatsApp)
- `llm/` — geração da resposta pelo Gemini

Cada adaptador tem timeout, tratamento de erro específico e fallback. Nos testes, são substituídos por *mocks*.
