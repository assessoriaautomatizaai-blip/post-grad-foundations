# Implantação: Lovable, Gemini e Evolution API (H12)

Roteiro para colocar o agente no WhatsApp de verdade. **Nenhuma chave vai para o repositório nem para o chat**: elas ficam só nos segredos do Lovable e, para teste local, no `.env`.

Formato das chamadas da Evolution conferido no código-fonte (evolution-foundation/evolution-api, branch `main`, 15/10/2026). Telas do Lovable e da Cloudfy podem mudar de nome; os campos e endereços abaixo são o que importa.

## 1. Gerar o segredo do webhook

No terminal do seu computador:

```bash
openssl rand -hex 32
```

Guarde o valor num gerenciador de senhas. Ele vai em dois lugares: nos segredos do Lovable (`WEBHOOK_SECRET`) e na configuração do webhook da Evolution (cabeçalho `x-webhook-secret`).

## 2. Lovable: segredos e publicação

1. Abra o projeto no Lovable e cadastre os segredos (configurações do projeto → _Secrets_):

   | Segredo              | Valor                                                                                                    |
   | -------------------- | -------------------------------------------------------------------------------------------------------- |
   | `GEMINI_API_KEY`     | chave da Gemini API, **plano pago** (ADR-003; a busca no Google do ADR-007 não existe no plano gratuito) |
   | `GEMINI_MODEL`       | `gemini-3.8-flash`                                                                                       |
   | `WEBHOOK_SECRET`     | o valor gerado no passo 1                                                                                |
   | `EVOLUTION_API_URL`  | endereço da sua Evolution na Cloudfy, **com `https://`** e sem barra no fim                              |
   | `EVOLUTION_API_KEY`  | token da instância (preferível) ou chave global da Evolution                                             |
   | `EVOLUTION_INSTANCE` | nome da instância, exatamente como criado no passo 3                                                     |

2. Publique o app. O endereço público fica parecido com `https://<projeto>.lovable.app`.
3. **Teste o Gemini antes do WhatsApp:** abra `https://<projeto>.lovable.app/simulador` e pergunte "O que é o split payment?". A resposta deve citar "(LC 214/2025, art. 31, caput)" e terminar com fontes e aviso.
   - Se vier "Tive um problema técnico…", abra os logs do Lovable e procure a linha que começa com `[agente] falha ao gerar resposta:`. Se disser `GEMINI_API_KEY não configurada`, o segredo não está chegando ao servidor — me mande essa linha (ela não contém dado sensível).

## 3. Evolution na Cloudfy: instância e número

1. Na Evolution da Cloudfy, crie uma instância (ex.: `tira-duvidas`) do tipo **WhatsApp Baileys**.
2. Conecte pelo QR Code usando um **número dedicado ao agente** — não use o seu número pessoal (escopo e estimativa).
3. Foto de perfil do número: use [`docs/marca/inciso-avatar-whatsapp.png`](marca/inciso-avatar-whatsapp.png) (no app do WhatsApp do número do agente, ou pelo endpoint de perfil da Evolution) e o nome de exibição **Inciso**.
4. Confirme a versão: abrir `https://<sua-evolution>/` no navegador mostra a mensagem de boas-vindas da Evolution com a versão. Anote-a para o registro do projeto.

## 4. Configurar o webhook da instância

No terminal, trocando os três valores entre `<>`:

```bash
curl -X POST "https://<sua-evolution>/webhook/set/<instancia>" \
  -H "apikey: <chave-da-evolution>" \
  -H "content-type: application/json" \
  -d '{
    "webhook": {
      "enabled": true,
      "url": "https://<projeto>.lovable.app/api/whatsapp/webhook",
      "headers": { "x-webhook-secret": "<segredo-do-passo-1>" },
      "byEvents": false,
      "base64": false,
      "events": ["MESSAGES_UPSERT"]
    }
  }'
```

Confira o que ficou salvo:

```bash
curl "https://<sua-evolution>/webhook/find/<instancia>" -H "apikey: <chave-da-evolution>"
```

A resposta deve trazer `"enabled": true`, a URL do Lovable, o evento `MESSAGES_UPSERT` e o cabeçalho `x-webhook-secret`. **Se o campo `headers` não aparecer**, a versão da Cloudfy não guarda cabeçalhos: me avise para usarmos a alternativa com `jwt_key` (ADR-006).

> O painel da Cloudfy pode ter uma tela de webhook com os mesmos campos (URL, eventos, cabeçalhos). Se usar a tela, confira do mesmo jeito com o comando `find`.

## 5. Testar pelo WhatsApp

Do seu celular pessoal, mande para o número do agente:

| Mensagem                                     | Esperado                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `oi`                                         | Boas-vindas com perguntas de exemplo                                                 |
| `O que é o split payment?`                   | Resposta citando "(LC 214/2025, art. 31, caput)", com fontes e aviso                 |
| `Qual o valor do IPVA do meu carro?`         | Recusa educada, sem citar lei                                                        |
| `Serviços de saúde vão pagar menos imposto?` | Caso de risco do conjunto-ouro (ADR-004): anotar exatamente o que o agente respondeu |

Para o README e o fórum: grave a tela ou tire prints **cobrindo o número de telefone**.

## 6. Se algo não funcionar

Os logs do Lovable registram só a causa, nunca número ou texto da mensagem:

| Linha no log                                                                     | Causa provável                                                                 |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| nada aparece                                                                     | o webhook não está chegando: confira a URL no `find` e se o app está publicado |
| resposta 401 nos logs da Evolution                                               | segredo diferente entre o Lovable e o cabeçalho do webhook                     |
| `[webhook] falha ao responder: Variável de ambiente EVOLUTION_… não configurada` | segredo da Evolution faltando no Lovable                                       |
| `[webhook] falha ao responder: Evolution API recusou o envio: HTTP 401`          | `EVOLUTION_API_KEY` errada                                                     |
| `[webhook] falha ao responder: Evolution API recusou o envio: HTTP 404`          | `EVOLUTION_INSTANCE` com nome diferente                                        |
| `[agente] falha ao gerar resposta: …`                                            | problema com o Gemini (chave, cota ou modelo)                                  |
